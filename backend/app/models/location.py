from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class Division(Base):
    """Division (bibhag) - top level of the administrative hierarchy.

    Bangladesh has 8 divisions: Dhaka, Chattogram, Khulna, Rajshahi, Sylhet,
    Rangpur, Mymensingh and Barishal.
    """
    __tablename__ = "divisions"

    id = Column(Integer, primary_key=True, index=True)
    name_en = Column(String(100), nullable=False, index=True)
    name_bn = Column(String(100), nullable=False, index=True)
    code = Column(String(10), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, nullable=False, server_default="true", default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    districts = relationship("District", back_populates="division")

    def __repr__(self):
        return f"<Division(id={self.id}, name_en='{self.name_en}')>"


class District(Base):
    """District administrative division"""
    __tablename__ = "districts"
    
    id = Column(Integer, primary_key=True, index=True)
    division_id = Column(Integer, ForeignKey("divisions.id", ondelete="SET NULL"), nullable=True, index=True)
    name_en = Column(String(100), nullable=False, index=True)
    name_bn = Column(String(100), nullable=False, index=True)
    code = Column(String(10), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, nullable=False, server_default="true", default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    division = relationship("Division", back_populates="districts")
    upazilas = relationship("Upazila", back_populates="district", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<District(id={self.id}, name_en='{self.name_en}')>"


class Upazila(Base):
    """Upazila/Thana administrative division"""
    __tablename__ = "upazilas"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="CASCADE"), nullable=False, index=True)
    name_en = Column(String(100), nullable=False, index=True)
    name_bn = Column(String(100), nullable=False, index=True)
    code = Column(String(10), nullable=False, index=True)
    is_active = Column(Boolean, nullable=False, server_default="true", default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    district = relationship("District", back_populates="upazilas")
    mouzas = relationship("Mouza", back_populates="upazila", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Upazila(id={self.id}, name_en='{self.name_en}')>"


class Mouza(Base):
    """Mouza land revenue unit"""
    __tablename__ = "mouzas"
    
    id = Column(Integer, primary_key=True, index=True)
    upazila_id = Column(Integer, ForeignKey("upazilas.id", ondelete="CASCADE"), nullable=False, index=True)
    name_en = Column(String(100), nullable=False, index=True)
    name_bn = Column(String(100), nullable=False, index=True)
    jl_no = Column(String(20), nullable=True)  # JL Number
    code = Column(String(20), nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, server_default="true", default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    upazila = relationship("Upazila", back_populates="mouzas")
    khatian_records = relationship("KhatianRecord", back_populates="mouza", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Mouza(id={self.id}, name_en='{self.name_en}')>"
