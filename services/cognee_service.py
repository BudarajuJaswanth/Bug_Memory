import json
import logging
import os
import re
import asyncio
import aiohttp
import ssl
import cognee
from config import settings

logger = logging.getLogger("bug_memory")

STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "if", "then", "else", "when", "at", "by",
    "for", "with", "about", "against", "between", "into", "through", "during",
    "before", "after", "above", "below", "to", "from", "up", "down", "in", "out",
    "on", "off", "over", "under", "again", "further", "once", "here", "there",
    "all", "any", "both", "each", "few", "more", "most", "other", "some", "such",
    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can",
    "will", "just", "should", "now", "this", "that", "these", "those", "have", "has",
    "had", "doing", "does", "been", "was", "were", "are", "is", "wasn", "weren"
}

def tokenize(text: str) -> set[str]:
    if not text:
        return set()
    tokens = re.split(r"\W+", text.lower())
    return {t for t in tokens if len(t) >= 3 and t not in STOP_WORDS}

async def call_with_retry(func, *args, **kwargs):
    """
    Universal retry helper for all Cognee SDK operations.
    If running in Cloud mode (COGNEE_SERVICE_URL is set):
      - Retries up to 2 times with a short backoff (1s, then 2s) on network/connection drops.
      - Refreshes the ClientSession pool by re-running serve() before retrying.
    If running in Local mode:
      - Does not attempt remote reconnects or retries, raising errors directly.
    """
    if not settings.COGNEE_SERVICE_URL:
        # Local mode: Execute directly without remote connection retry logic
        return await func(*args, **kwargs)

    max_retries = 2
    delays = [1, 2]
    
    # Fix 3: Informational note on connection staleness.
    # "Server disconnected" has recurred across remember, recall, and forget in testing.
    # If 2 retries with re-serve are insufficient, consider re-establishing connection
    # periodically or on every request cycle rather than relying on a long lifespan.
    
    for attempt in range(max_retries + 1):
        try:
            return await func(*args, **kwargs)
        except (aiohttp.ClientError, ConnectionError, ssl.SSLError, RuntimeError) as e:
            err_msg = str(e).lower()
            # Fail immediately on permanent DB constraint / unique index conflicts (HTTP 409)
            if "conflict" in err_msg or "409" in err_msg or "unique constraint" in err_msg:
                raise e
            
            if attempt == max_retries:
                logger.error("Cognee call %s failed after %d retries: %s", func.__name__, max_retries, e)
                raise e
            
            delay = delays[attempt]
            logger.warning(
                "Cognee connection error on %s (attempt %d/%d): %s. Re-serving and retrying in %ds...",
                func.__name__, attempt + 1, max_retries + 1, e, delay
            )
            try:
                await cognee.serve(
                    url=settings.COGNEE_SERVICE_URL,
                    api_key=settings.COGNEE_API_KEY
                )
            except Exception as se:
                logger.error("Failed to re-serve Cognee during retry: %s", se)
            await asyncio.sleep(delay)
        except Exception as e:
            err_msg = str(e).lower()
            if any(term in err_msg for term in ["connect", "ssl", "disconnect", "socket", "timeout", "closed", "reset"]):
                if attempt == max_retries:
                    logger.error("Cognee call %s failed after %d retries: %s", func.__name__, max_retries, e)
                    raise e
                
                delay = delays[attempt]
                logger.warning(
                    "Cognee connection warning on %s (attempt %d/%d): %s. Re-serving and retrying in %ds...",
                    func.__name__, attempt + 1, max_retries + 1, e, delay
                )
                try:
                    await cognee.serve(
                        url=settings.COGNEE_SERVICE_URL,
                        api_key=settings.COGNEE_API_KEY
                    )
                except Exception as se:
                    logger.error("Failed to re-serve Cognee during retry: %s", se)
                await asyncio.sleep(delay)
            else:
                raise e

class CogneeService:
    async def serve(self):
        if settings.COGNEE_SERVICE_URL:
            logger.info("Serving Cognee Cloud at url=%s", settings.COGNEE_SERVICE_URL)
            await call_with_retry(
                cognee.serve,
                url=settings.COGNEE_SERVICE_URL,
                api_key=settings.COGNEE_API_KEY
            )
        else:
            logger.info("No COGNEE_SERVICE_URL set — running against local Cognee.")

    async def disconnect(self):
        if settings.COGNEE_SERVICE_URL:
            logger.info("Disconnecting Cognee Cloud connection")
            await call_with_retry(cognee.disconnect)
        else:
            logger.info("Running in local Cognee — no Cloud connection to disconnect.")

    async def remember_bug(self, project: str, error: str, root_cause: str, fix: str, file: str, tags: list[str]):
        record_text = (
            f"Project: {project}\n"
            f"File: {file}\n"
            f"Tags: {', '.join(tags)}\n"
            f"Error: {error}\n"
            f"Root Cause: {root_cause}\n"
            f"Fix: {fix}"
        )
        dataset_name = f"bug_memory_{project}"
        logger.info("Sending record to cognee.remember for dataset %s", dataset_name)
        await call_with_retry(
            cognee.remember,
            record_text,
            dataset_name=dataset_name
        )

    async def recall_bug(self, project: str, error_text: str, session_id: str) -> list[dict]:
        dataset_name = f"bug_memory_{project}"
        logger.info("Calling cognee.recall for query in dataset %s (session_id=%s)", dataset_name, session_id)
        
        # 1. Fetch matching chunks first to verify semantic relevance
        try:
            chunks = await call_with_retry(
                cognee.recall,
                query_text=error_text,
                datasets=[dataset_name],
                query_type=cognee.SearchType.CHUNKS
            )
            if settings.DEBUG:
                logger.info("Retrieved chunks for relevance verification: %s", chunks)
        except Exception as e:
            logger.exception("Failed to retrieve chunks for verification: %s", e)
            chunks = []
            
        if not chunks:
            logger.info("No chunks retrieved. Treating as memory miss.")
            return []
            
        closest_chunk = chunks[0]
        chunk_text = ""
        if isinstance(closest_chunk, dict):
            chunk_text = closest_chunk.get("text") or closest_chunk.get("content") or str(closest_chunk)
        else:
            chunk_text = getattr(closest_chunk, "text", None) or getattr(closest_chunk, "content", None) or str(closest_chunk)
            
        query_tokens = tokenize(error_text)
        chunk_tokens = tokenize(chunk_text)
        intersection = query_tokens.intersection(chunk_tokens)
        
        if settings.DEBUG:
            logger.info("Query tokens: %s", query_tokens)
            logger.info("Chunk tokens: %s", chunk_tokens)
            logger.info("Keyword intersection: %s", intersection)
        
        if not intersection:
            logger.info("No keyword overlap between query and memory chunk. Treating as memory miss.")
            return []
            
        # 2. Relevance verified! Retrieve synthesized GRAPH_COMPLETION explanation.
        results = await call_with_retry(
            cognee.recall,
            query_text=error_text,
            session_id=session_id,
            datasets=[dataset_name]
        )
        
        # Fix 2: Log the full raw output of cognee.recall(...) using repr() before any mapping
        if settings.DEBUG:
            logger.info("=== RAW COGNEE RECALL REPR ===")
            logger.info("%r", results)
            if isinstance(results, list):
                for idx, r in enumerate(results):
                    logger.info("Raw item %d repr: %r", idx, r)
                    logger.info("Raw item %d dir: %s", idx, dir(r))
            logger.info("=================================")

        # Map results to unified structure
        return self._map_results(results)

    async def forget_project(self, project: str):
        dataset_name = f"bug_memory_{project}"
        logger.info("Calling cognee.forget for dataset %s", dataset_name)
        await call_with_retry(cognee.forget, dataset=dataset_name)

    async def add_feedback(self, session_id: str, helpful: bool, note: str):
        logger.info("Adding session feedback (session_id=%s, helpful=%s)", session_id, helpful)
        qas = await call_with_retry(cognee.session.get_session, session_id=session_id)
        if not qas:
            logger.warning("No session QAs found for session_id: %s. Cannot add feedback.", session_id)
            return
        
        latest_qa = qas[-1]
        score = 5 if helpful else 1
        await call_with_retry(
            cognee.session.add_feedback,
            session_id=session_id,
            qa_id=latest_qa.qa_id,
            feedback_score=score,
            feedback_text=note
        )

    async def memify(self):
        logger.info("Calling cognee.memify to optimize and reinforce memory")
        await call_with_retry(cognee.memify)

    def _map_results(self, results) -> list[dict]:
        mapped = []
        if not results:
            return mapped

        items = results if isinstance(results, list) else [results]

        for item in items:
            if not item:
                continue

            text = ""
            root_cause = None
            fix = None

            if isinstance(item, str):
                try:
                    parsed = json.loads(item)
                    if isinstance(parsed, dict):
                        text = parsed.get("fix") or parsed.get("root_cause") or item
                        root_cause = parsed.get("root_cause")
                        fix = parsed.get("fix")
                except Exception:
                    text = item
            elif isinstance(item, dict):
                text = item.get("text") or item.get("content") or item.get("fix") or str(item)
                root_cause = item.get("root_cause")
                fix = item.get("fix")
            else:
                text = getattr(item, "text", None) or getattr(item, "content", None) or getattr(item, "fix", None) or str(item)
                root_cause = getattr(item, "root_cause", None)
                fix = getattr(item, "fix", None)

            # Fix 3: Heuristic stopgap for filtering conversational fallback/questions
            # TODO: Replace this heuristic with a proper score-based threshold check once we inspect Fix 2's raw logs.
            text_lower = text.strip().lower()
            clarification_phrases = [
                "could you share", "could you paste", "could you provide",
                "i'm still waiting for", "you haven't stored", "please provide",
                "i do not have", "i don't have", "share the portion", "paste the code"
            ]
            is_question = text_lower.endswith("?")
            has_phrase = any(phrase in text_lower for phrase in clarification_phrases)

            if is_question or has_phrase:
                logger.info("Heuristic caught clarification prompt: %r. Treating as memory miss.", text)
                continue

            mapped.append({
                "text": text,
                "root_cause": root_cause,
                "fix": fix
            })

        return mapped

cognee_service = CogneeService()
