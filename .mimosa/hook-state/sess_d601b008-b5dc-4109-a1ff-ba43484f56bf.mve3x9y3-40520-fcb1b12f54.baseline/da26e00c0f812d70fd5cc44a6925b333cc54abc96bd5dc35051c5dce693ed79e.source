from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class AuditLog(Base):
    """Comprehensive audit log for all significant operations"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    action_type = Column(String(100), nullable=False, index=True)  # login, logout, registration, verification, report_generation, etc.
    resource_type = Column(String(50), nullable=True, index=True)  # user, verification, report, land, admin
    resource_id = Column(String(100), nullable=True, index=True)
    
    action_description = Column(Text, nullable=False)
    
    # Request details
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(String(500), nullable=True)
    request_method = Column(String(10), nullable=True)
    request_path = Column(String(500), nullable=True)
    
    # Response details
    status_code = Column(Integer, nullable=True)
    success = Column(String(20), nullable=True)  # success, failure, partial
    
    # Additional data
    # NOTE: attribute renamed from `metadata` (reserved by SQLAlchemy Declarative API);
    # DB column name kept as "metadata" for compatibility.
    log_metadata = Column("metadata", JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action_type}', user_id={self.user_id})>"


class SecurityEvent(Base):
    """Security-related events and suspicious activities"""
    __tablename__ = "security_events"
    
    id = Column(Integer, primary_key=True, index=True)
    
    event_type = Column(String(100), nullable=False, index=True)  # failed_login, unauthorized_access, rate_limit, etc.
    severity = Column(String(20), nullable=False, index=True)  # low, medium, high, critical
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    email = Column(String(255), nullable=True, index=True)
    
    description = Column(Text, nullable=False)
    
    # Request details
    ip_address = Column(String(45), nullable=True, index=True)
    user_agent = Column(String(500), nullable=True)
    request_path = Column(String(500), nullable=True)
    
    # Additional context
    # NOTE: attribute renamed from `metadata` (reserved by SQLAlchemy Declarative API);
    # DB column name kept as "metadata" for compatibility.
    event_metadata = Column("metadata", JSON, nullable=True)
    
    # Resolution
    resolved = Column(String(20), default="pending")  # pending, investigating, resolved, false_positive
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(Integer, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    def __repr__(self):
        return f"<SecurityEvent(id={self.id}, type='{self.event_type}', severity='{self.severity}')>"
