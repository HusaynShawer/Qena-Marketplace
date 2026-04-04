from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
from sqlalchemy.sql import func
from app.database import Base

class ExternalSyncLog(Base):
    __tablename__ = "external_sync_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)  # e.g., "pos", "store_app"
    action = Column(String, nullable=False)  # e.g., "order_created", "stock_updated"
    payload = Column(JSON, nullable=True)
    status = Column(String, default="pending")  # pending, success, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)