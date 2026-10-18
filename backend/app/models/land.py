from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Numeric, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from app.db.session import Base


class KhatianRecord(Base):
    """Khatian (land record) - can contain multiple dags"""
    __tablename__ = "khatian_records"
    
    id = Column(Integer, primary_key=True, index=True)
    mouza_id = Column(Integer, ForeignKey("mouzas.id", ondelete="CASCADE"), nullable=False, index=True)
    khatian_no = Column(String(50), nullable=False, index=True)
    survey_type = Column(String(20), nullable=False, index=True)  # RS, SA, BS, CS
    survey_year = Column(Integer, nullable=True)
    total_area_decimal = Column(Numeric(12, 4), nullable=True)
    status = Column(String(50), default="active")
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    mouza = relationship("Mouza", back_populates="khatian_records")
    dags = relationship("DagRecord", back_populates="khatian", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<KhatianRecord(id={self.id}, khatian_no='{self.khatian_no}', survey='{self.survey_type}')>"


class DagRecord(Base):
    """Dag (plot number within a khatian)"""
    __tablename__ = "dag_records"
    
    id = Column(Integer, primary_key=True, index=True)
    khatian_id = Column(Integer, ForeignKey("khatian_records.id", ondelete="CASCADE"), nullable=False, index=True)
    dag_no = Column(String(50), nullable=False, index=True)
    area_decimal = Column(Numeric(12, 4), nullable=False)
    land_class = Column(String(50), nullable=True)  # Agricultural, Residential, Commercial, etc.
    land_use = Column(String(100), nullable=True)
    status = Column(String(50), default="active")
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    khatian = relationship("KhatianRecord", back_populates="dags")
    parcel = relationship("LandParcel", back_populates="dag", uselist=False)
    
    def __repr__(self):
        return f"<DagRecord(id={self.id}, dag_no='{self.dag_no}')>"


class LandParcel(Base):
    """Land parcel - links administrative records to geometry"""
    __tablename__ = "land_parcels"
    
    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(String(50), unique=True, nullable=False, index=True)  # BT-PARCEL-XXXXXX
    dag_id = Column(Integer, ForeignKey("dag_records.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    area_decimal = Column(Numeric(12, 4), nullable=False)
    area_sqm = Column(Numeric(15, 4), nullable=True)
    perimeter_m = Column(Numeric(15, 4), nullable=True)
    centroid_lat = Column(Numeric(10, 8), nullable=True)
    centroid_lon = Column(Numeric(11, 8), nullable=True)
    status = Column(String(50), default="active")
    # NOTE: attribute renamed from `metadata` (reserved by SQLAlchemy Declarative API);
    # DB column name kept as "metadata" for compatibility.
    parcel_metadata = Column("metadata", JSON, nullable=True)
    # Chouhaddi / four-side boundaries. Synthetic demonstration data only -
    # these are descriptive adjacent-land labels, NOT a legal cadastral boundary.
    chouhaddi_north = Column(String(255), nullable=True)
    chouhaddi_south = Column(String(255), nullable=True)
    chouhaddi_east = Column(String(255), nullable=True)
    chouhaddi_west = Column(String(255), nullable=True)
    chouhaddi_source = Column(String(50), nullable=True)  # e.g. synthetic_demo
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    dag = relationship("DagRecord", back_populates="parcel")
    geometry = relationship("PlotGeometry", back_populates="parcel", uselist=False, cascade="all, delete-orphan")
    ownership_records = relationship("OwnershipRecord", back_populates="parcel", cascade="all, delete-orphan")
    historical_records = relationship("HistoricalRecord", back_populates="parcel", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="parcel", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<LandParcel(id={self.id}, parcel_id='{self.parcel_id}')>"


class PlotGeometry(Base):
    """Spatial geometry for land parcels"""
    __tablename__ = "plot_geometries"
    
    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("land_parcels.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    geometry = Column(Geometry('POLYGON', srid=4326), nullable=False)  # PostGIS geometry
    simplified_geometry = Column(Geometry('POLYGON', srid=4326), nullable=True)  # For zoomed out views
    geojson = Column(JSON, nullable=True)  # Cached GeoJSON for performance
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    parcel = relationship("LandParcel", back_populates="geometry")
    
    def __repr__(self):
        return f"<PlotGeometry(id={self.id}, parcel_id={self.parcel_id})>"


class Owner(Base):
    """Land owner information"""
    __tablename__ = "owners"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(String(50), unique=True, nullable=False, index=True)  # BT-OWNER-XXXXXX
    name_en = Column(String(255), nullable=False, index=True)
    name_bn = Column(String(255), nullable=True, index=True)
    father_name = Column(String(255), nullable=True)
    nid = Column(String(20), nullable=True, index=True)
    mobile = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    owner_type = Column(String(50), default="individual")  # individual, organization, government
    is_synthetic = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    ownership_records = relationship("OwnershipRecord", back_populates="owner", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Owner(id={self.id}, name_en='{self.name_en}')>"


class OwnershipRecord(Base):
    """Current ownership records"""
    __tablename__ = "ownership_records"
    
    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("land_parcels.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("owners.id", ondelete="CASCADE"), nullable=False, index=True)
    share_decimal = Column(Numeric(12, 4), nullable=False)  # Share in decimal (e.g., 25.00 for 25 decimal)
    share_percentage = Column(Numeric(5, 2), nullable=True)  # Percentage ownership
    ownership_type = Column(String(50), default="full")  # full, partial, joint
    acquisition_date = Column(DateTime(timezone=True), nullable=True)
    acquisition_mode = Column(String(50), nullable=True)  # inheritance, purchase, gift, mutation
    deed_no = Column(String(100), nullable=True)
    status = Column(String(50), default="active")
    remarks = Column(Text, nullable=True)
    # Inheritance / heirship review (land-ownership consistency).
    # Synthetic demonstration data only; this is NOT a legal conclusion and
    # never stores or exposes children's or family members' personal data.
    succession_record_available = Column(Boolean, nullable=True)
    declared_heir_count = Column(Integer, nullable=True)
    recorded_inherited_share = Column(Numeric(12, 4), nullable=True)  # decimal
    succession_status = Column(String(50), nullable=True)  # available, not_available, unclear
    supporting_record_reference = Column(String(150), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    parcel = relationship("LandParcel", back_populates="ownership_records")
    owner = relationship("Owner", back_populates="ownership_records")
    
    def __repr__(self):
        return f"<OwnershipRecord(id={self.id}, parcel_id={self.parcel_id}, owner_id={self.owner_id})>"


class HistoricalRecord(Base):
    """Historical ownership and transaction records"""
    __tablename__ = "historical_records"
    
    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("land_parcels.id", ondelete="CASCADE"), nullable=False, index=True)
    record_date = Column(DateTime(timezone=True), nullable=False, index=True)
    record_type = Column(String(50), nullable=False)  # ownership_change, mutation, survey, dispute
    previous_owner = Column(String(255), nullable=True)
    new_owner = Column(String(255), nullable=True)
    transaction_type = Column(String(50), nullable=True)  # sale, inheritance, gift, mutation
    area_decimal = Column(Numeric(12, 4), nullable=True)
    deed_no = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    source = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    parcel = relationship("LandParcel", back_populates="historical_records")
    
    def __repr__(self):
        return f"<HistoricalRecord(id={self.id}, record_type='{self.record_type}')>"


class MutationRecord(Base):
    """Mutation (name transfer) records"""
    __tablename__ = "mutation_records"
    
    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("land_parcels.id", ondelete="CASCADE"), nullable=False, index=True)
    mutation_no = Column(String(100), nullable=True, index=True)
    application_date = Column(DateTime(timezone=True), nullable=True)
    approval_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False, index=True)  # pending, approved, rejected, in_review
    previous_owner = Column(String(255), nullable=True)
    new_owner = Column(String(255), nullable=True)
    area_decimal = Column(Numeric(12, 4), nullable=True)
    mutation_type = Column(String(50), nullable=True)  # inheritance, sale, gift, partition
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<MutationRecord(id={self.id}, status='{self.status}')>"


class CaseRecord(Base):
    """Legal case records related to land"""
    __tablename__ = "case_records"
    
    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("land_parcels.id", ondelete="CASCADE"), nullable=False, index=True)
    case_no = Column(String(100), nullable=True, index=True)
    case_type = Column(String(100), nullable=False)  # civil, criminal, land_dispute
    court_name = Column(String(255), nullable=True)
    filing_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False, index=True)  # pending, ongoing, resolved, dismissed
    plaintiff = Column(String(255), nullable=True)
    defendant = Column(String(255), nullable=True)
    case_summary = Column(Text, nullable=True)
    judgment = Column(Text, nullable=True)
    judgment_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<CaseRecord(id={self.id}, case_no='{self.case_no}', status='{self.status}')>"


class GovernmentStatusRecord(Base):
    """Government/Khas land status records"""
    __tablename__ = "government_status_records"
    
    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("land_parcels.id", ondelete="CASCADE"), nullable=False, index=True)
    status_type = Column(String(50), nullable=False, index=True)  # khas, government, protected, restricted
    authority = Column(String(255), nullable=True)
    designation_date = Column(DateTime(timezone=True), nullable=True)
    area_decimal = Column(Numeric(12, 4), nullable=True)
    restrictions = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<GovernmentStatusRecord(id={self.id}, status_type='{self.status_type}')>"


class AcquisitionRecord(Base):
    """Land acquisition records"""
    __tablename__ = "acquisition_records"
    
    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("land_parcels.id", ondelete="CASCADE"), nullable=False, index=True)
    acquisition_no = Column(String(100), nullable=True, index=True)
    acquiring_authority = Column(String(255), nullable=False)
    purpose = Column(String(255), nullable=True)
    notification_date = Column(DateTime(timezone=True), nullable=True)
    acquisition_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False, index=True)  # proposed, notified, acquired, completed, cancelled
    area_decimal = Column(Numeric(12, 4), nullable=True)
    compensation_amount = Column(Numeric(15, 2), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<AcquisitionRecord(id={self.id}, status='{self.status}')>"


class Transaction(Base):
    """Land transaction records"""
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), unique=True, nullable=False, index=True)  # BT-TXN-XXXXXX
    parcel_id = Column(Integer, ForeignKey("land_parcels.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_date = Column(DateTime(timezone=True), nullable=False, index=True)
    transaction_type = Column(String(50), nullable=False)  # sale, purchase, gift, inheritance
    seller_name = Column(String(255), nullable=True)
    buyer_name = Column(String(255), nullable=True)
    area_decimal = Column(Numeric(12, 4), nullable=False)
    sale_value = Column(Numeric(15, 2), nullable=True)
    deed_no = Column(String(100), nullable=True, index=True)
    registry_office = Column(String(255), nullable=True)
    status = Column(String(50), default="completed")
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    parcel = relationship("LandParcel", back_populates="transactions")
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, transaction_id='{self.transaction_id}')>"


class SellerClaim(Base):
    """Seller-provided ownership claims during verification"""
    __tablename__ = "seller_claims"
    
    id = Column(Integer, primary_key=True, index=True)
    verification_case_id = Column(Integer, ForeignKey("verification_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    claimed_owner_name = Column(String(255), nullable=False)
    claimed_share_decimal = Column(Numeric(12, 4), nullable=False)
    claimed_sale_area_decimal = Column(Numeric(12, 4), nullable=False)
    claimed_khatian = Column(String(50), nullable=True)
    claimed_dag = Column(String(50), nullable=True)
    claimed_survey_type = Column(String(20), nullable=True)
    additional_info = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<SellerClaim(id={self.id}, owner='{self.claimed_owner_name}')>"
