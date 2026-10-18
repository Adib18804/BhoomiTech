from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.db.session import Base


class DemoScenario(Base):
    """Predefined demo scenarios for testing and demonstration"""
    __tablename__ = "demo_scenarios"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(String(50), unique=True, nullable=False, index=True)  # SCENARIO_A, SCENARIO_B, etc.
    
    name_en = Column(String(255), nullable=False)
    name_bn = Column(String(255), nullable=True)
    
    description_en = Column(Text, nullable=False)
    description_bn = Column(Text, nullable=True)
    
    scenario_type = Column(String(50), nullable=False)  # LOW_CONCERN, OWNERSHIP_MISMATCH, MUTATION_PENDING, etc.
    expected_risk_level = Column(String(50), nullable=False)
    
    # Land identifiers
    district_name = Column(String(100), nullable=False)
    upazila_name = Column(String(100), nullable=False)
    mouza_name = Column(String(100), nullable=False)
    survey_type = Column(String(20), nullable=False)
    khatian_no = Column(String(50), nullable=False)
    dag_no = Column(String(50), nullable=False)
    parcel_id = Column(String(50), nullable=True)
    
    # Expected findings
    expected_findings = Column(JSON, nullable=True)
    
    # Configuration
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<DemoScenario(id={self.id}, scenario_id='{self.scenario_id}', type='{self.scenario_type}')>"
