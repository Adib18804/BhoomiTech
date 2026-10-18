from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.db.session import Base


class SystemSetting(Base):
    """System-wide configuration settings"""
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    value_type = Column(String(20), default="string")  # string, integer, boolean, json
    category = Column(String(50), nullable=False, index=True)  # verification, security, ui, etc.
    
    description_en = Column(Text, nullable=True)
    description_bn = Column(Text, nullable=True)
    
    is_public = Column(Boolean, default=False)  # Can be accessed by frontend
    is_editable = Column(Boolean, default=True)  # Can be modified by super admin
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    updated_by = Column(Integer, nullable=True)
    
    def __repr__(self):
        return f"<SystemSetting(key='{self.key}', category='{self.category}')>"
