import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base

class Project(Base):
    __tablename__ = "projects"

    name = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    bugs = relationship("Bug", back_populates="project_rel", cascade="all, delete-orphan")

class Bug(Base):
    __tablename__ = "bugs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project = Column(String, ForeignKey("projects.name", ondelete="CASCADE"), nullable=False)
    error = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=False)
    fix = Column(Text, nullable=False)
    file = Column(String, nullable=False)
    tags = Column(Text, nullable=False)  # stored as JSON string or comma-separated list
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project_rel = relationship("Project", back_populates="bugs")
