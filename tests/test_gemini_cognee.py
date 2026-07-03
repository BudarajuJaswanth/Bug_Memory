import asyncio
import os
import sys
import logging
import cognee
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_gemini")

load_dotenv()

async def test_connection():
    logger.info("Starting Gemini Cognee isolated connection test...")
    
    api_key = os.getenv("LLM_API_KEY")
    cognee_url = os.getenv("COGNEE_SERVICE_URL")
    cognee_key = os.getenv("COGNEE_API_KEY")
    
    logger.info("Env vars check:")
    logger.info(f"LLM_PROVIDER: {os.getenv('LLM_PROVIDER')}")
    logger.info(f"LLM_MODEL: {os.getenv('LLM_MODEL')}")
    logger.info(f"LLM_API_KEY is present: {bool(api_key)}")
    logger.info(f"EMBEDDING_PROVIDER: {os.getenv('EMBEDDING_PROVIDER')}")
    logger.info(f"EMBEDDING_MODEL: {os.getenv('EMBEDDING_MODEL')}")
    logger.info(f"EMBEDDING_DIMENSIONS: {os.getenv('EMBEDDING_DIMENSIONS')}")
    logger.info(f"EMBEDDING_API_KEY is present: {bool(os.getenv('EMBEDDING_API_KEY'))}")
    logger.info(f"COGNEE_SERVICE_URL: {cognee_url}")
    logger.info(f"COGNEE_API_KEY is present: {bool(cognee_key)}")
    logger.info(f"COGNEE_SKIP_CONNECTION_TEST: {os.getenv('COGNEE_SKIP_CONNECTION_TEST')}")
    
    if not api_key:
        logger.error("Missing LLM_API_KEY (Gemini Key)!")
        return False
        
    try:
        if cognee_url:
            logger.info(f"Connecting to Cognee at {cognee_url}...")
            await cognee.serve(
                url=cognee_url,
                api_key=cognee_key
            )
            logger.info("Connected successfully.")
        else:
            logger.info("No COGNEE_SERVICE_URL set — running against local Cognee. Skipping cognee.serve().")
    except Exception as e:
        logger.error(f"Failed to serve/connect to Cognee: {e}")
        return False
        
    try:
        logger.info("Testing ingestion (remember)...")
        await cognee.remember("Gemini connection test.", dataset_name="gemini_test_dataset")
        logger.info("Ingestion completed successfully.")
        
        logger.info("Testing retrieval (recall)...")
        results = await cognee.recall("What did I just store?", datasets=["gemini_test_dataset"])
        logger.info(f"Recall finished. Raw results: {results}")
        
        logger.info("Cleaning up (forget)...")
        await cognee.forget(dataset="gemini_test_dataset")
        logger.info("Cleanup completed successfully.")
        
    except Exception as e:
        logger.error(f"Failed during memory lifecycle operations: {e}")
        if cognee_url:
            await cognee.disconnect()
        return False
        
    if cognee_url:
        await cognee.disconnect()
    logger.info("Connection test successfully PASSED!")
    return True

if __name__ == "__main__":
    success = asyncio.run(test_connection())
    if not success:
        sys.exit(1)
