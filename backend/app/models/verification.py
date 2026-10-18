from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class VerificationCase(Base):
    """Verification case initiated by a user"""
    __tablename__ = "verification_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), unique=True, nullable=False, index=True)  # BT-VER-YYYY-XXXXXX
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parcel_id = Column(Integer, ForeignKey("land_parcels.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Land identifiers
    district_name = Column(String(100), nullable=False)
    upazila_name = Column(String(100), nullable=False)
    mouza_name = Column(String(100), nullable=False)
    survey_type = Column(String(20), nullable=False)
    khatian_no = Column(String(50), nullable=False)
    dag_no = Column(String(50), nullable=False)
    
    # Verification status
    status = Column(String(50), nullable=False, default="initiated", index=True)  # initiated, in_progress, completed, failed
    overall_risk_level = Column(String(50), nullable=True, index=True)  # LOW_CONCERN, REVIEW_REQUIRED, HIGH_ATTENTION, CRITICAL_SIGNAL, INSUFFICIENT_DATA
    
    # Timestamps
    initiated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    verification_metadata = Column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="verification_cases")
    seller_claim = relationship("SellerClaim", backref="verification_case", uselist=False, cascade="all, delete-orphan")
    result = relationship("VerificationResult", back_populates="case", uselist=False, cascade="all, delete-orphan")
    findings = relationship("VerificationFinding", back_populates="case", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="verification_case", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<VerificationCase(id={self.id}, case_id='{self.case_id}', status='{self.status}')>"


class VerificationResult(Base):
    """Overall verification result"""
    __tablename__ = "verification_results"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("verification_cases.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # Risk assessment
    overall_risk_level = Column(String(50), nullable=False)
    risk_score = Column(Integer, nullable=True)  # 0-100
    
    # Check results
    land_identity_status = Column(String(50), nullable=True)
    ownership_status = Column(String(50), nullable=True)
    historical_consistency_status = Column(String(50), nullable=True)
    mutation_status = Column(String(50), nullable=True)
    area_share_status = Column(String(50), nullable=True)
    case_signal_status = Column(String(50), nullable=True)
    government_status_check = Column(String(50), nullable=True)
    acquisition_status = Column(String(50), nullable=True)
    transaction_overlap_status = Column(String(50), nullable=True)
    cross_record_consistency_status = Column(String(50), nullable=True)
    
    # Summary
    total_checks = Column(Integer, default=0)
    passed_checks = Column(Integer, default=0)
    failed_checks = Column(Integer, default=0)
    warnings = Column(Integer, default=0)
    critical_issues = Column(Integer, default=0)
    
    # Recommendations
    recommendations = Column(JSON, nullable=True)
    
    # Metadata
    verification_duration_seconds = Column(Integer, nullable=True)
    data_sources = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    case = relationship("VerificationCase", back_populates="result")
    
    def __repr__(self):
        return f"<VerificationResult(id={self.id}, risk_level='{self.overall_risk_level}')>"


class VerificationFinding(Base):
    """Individual findings from verification checks"""
    __tablename__ = "verification_findings"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("verification_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    
    check_type = Column(String(100), nullable=False, index=True)  # ownership, mutation, case, etc.
    finding_type = Column(String(50), nullable=False)  # issue, warning, info, success
    severity = Column(String(50), nullable=False)  # low, medium, high, critical
    
    title_en = Column(String(255), nullable=False)
    title_bn = Column(String(255), nullable=True)
    
    description_en = Column(Text, nullable=False)
    description_bn = Column(Text, nullable=True)
    
    explanation_en = Column(Text, nullable=True)
    explanation_bn = Column(Text, nullable=True)
    
    recommendation_en = Column(Text, nullable=True)
    recommendation_bn = Column(Text, nullable=True)
    
    # Data references
    related_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    case = relationship("VerificationCase", back_populates="findings")
    
    def __repr__(self):
        return f"<VerificationFinding(id={self.id}, type='{self.check_type}', severity='{self.severity}')>"
