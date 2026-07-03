import re
import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.models import Project, Bug
from models.schemas import BugCreate, GraphNode, GraphLink, ProjectGraphResponse

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

def extract_keywords(text: str) -> set[str]:
    """Extract lowercase words of length >= 4 that are not stop words."""
    if not text:
        return set()
    words = re.findall(r"[a-zA-Z]{4,}", text.lower())
    return {w for w in words if w not in STOP_WORDS}

class BugService:
    def get_projects(self, db: Session) -> list[dict]:
        # Query projects and join with bugs to count them
        results = (
            db.query(Project.name, func.count(Bug.id).label("bug_count"))
            .outerjoin(Bug, Project.name == Bug.project)
            .group_by(Project.name)
            .all()
        )
        return [{"name": name, "bug_count": bug_count} for name, bug_count in results]

    def create_project_if_not_exists(self, db: Session, name: str) -> Project:
        project = db.query(Project).filter(Project.name == name).first()
        if not project:
            logger.info("Creating project in SQLite: %s", name)
            project = Project(name=name, created_at=datetime.utcnow())
            db.add(project)
            db.commit()
            db.refresh(project)
        return project

    def delete_project(self, db: Session, name: str) -> bool:
        project = db.query(Project).filter(Project.name == name).first()
        if not project:
            return False
        db.delete(project)
        db.commit()
        return True

    def create_bug(self, db: Session, bug_data: BugCreate) -> Bug:
        # Ensure project exists
        self.create_project_if_not_exists(db, bug_data.project)

        # Store tags as a JSON array string
        tags_str = json.dumps(bug_data.tags)

        db_bug = Bug(
            project=bug_data.project,
            error=bug_data.error,
            root_cause=bug_data.root_cause,
            fix=bug_data.fix,
            file=bug_data.file,
            tags=tags_str,
            created_at=datetime.utcnow()
        )
        db.add(db_bug)
        db.commit()
        db.refresh(db_bug)
        return db_bug

    def build_project_graph(self, db: Session, project_name: str) -> ProjectGraphResponse:
        bugs = db.query(Bug).filter(Bug.project == project_name).all()
        
        nodes = []
        links = []

        # Parse tags and pre-extract keywords for each bug
        parsed_bugs = []
        for bug in bugs:
            try:
                bug_tags = json.loads(bug.tags)
                if not isinstance(bug_tags, list):
                    bug_tags = [str(bug_tags)]
            except Exception:
                # Fallback to comma-split if stored incorrectly
                bug_tags = [t.strip() for t in bug.tags.split(",") if t.strip()]

            # Build GraphNode
            nodes.append(GraphNode(
                id=str(bug.id),
                label=f"{bug.file}: {bug.error[:25]}..." if len(bug.error) > 25 else f"{bug.file}: {bug.error}",
                tags=bug_tags
            ))

            keywords = extract_keywords(bug.root_cause)
            parsed_bugs.append({
                "id": str(bug.id),
                "tags": set(bug_tags),
                "keywords": keywords
            })

        # Pairwise comparison to build links
        n = len(parsed_bugs)
        for i in range(n):
            for j in range(i + 1, n):
                bug_a = parsed_bugs[i]
                bug_b = parsed_bugs[j]

                # Check 1: Shared Tags
                shared_tags = bug_a["tags"].intersection(bug_b["tags"])
                # Check 2: Shared Keywords
                shared_keywords = bug_a["keywords"].intersection(bug_b["keywords"])

                if shared_tags or shared_keywords:
                    links.append(GraphLink(
                        source=bug_a["id"],
                        target=bug_b["id"]
                    ))

        return ProjectGraphResponse(nodes=nodes, links=links)

bug_service = BugService()
