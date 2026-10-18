from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, JSON, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class Report(Base):
    """Generated verification reports"""
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(50), unique=True, nullable=False, index=True)  # BT-RPT-YYYY-XXXXXX
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    verification_case_id = Column(Integer, ForeignKey("verification_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    
    report_type = Column(String(50), default="verification")  # verification, summary, detailed
    format = Column(String(20), default="pdf")  # pdf, html, json
    
    title = Column(String(255), nullable=False)
    
    # Report data
    content_json = Column(JSON, nullable=True)  # Structured report data
    content_html = Column(Text, nullable=True)  # HTML version
    content_pdf = Column(LargeBinary, nullable=True)  # PDF binary (for small reports)
    
    # File references (for larger files stored externally)
    file_path = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    
    # Metadata
    language = Column(String(5), default="en")
    generated_by_user_id = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    accessed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="reports")
    verification_case = relationship("VerificationCase", back_populates="reports")
    
    def __repr__(self):
        return f"<Report(id={self.id}, report_id='{self.report_id}')>"
