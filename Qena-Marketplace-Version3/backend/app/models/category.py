from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"
    
    # UUID primary key for categories
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4, unique=True, nullable=False)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)