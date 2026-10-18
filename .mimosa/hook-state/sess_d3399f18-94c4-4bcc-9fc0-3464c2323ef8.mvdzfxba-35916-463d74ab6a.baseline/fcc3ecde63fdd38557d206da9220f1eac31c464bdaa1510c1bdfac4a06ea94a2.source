from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base


class LegalUpdate(Base):
    """Admin-managed land & registration update content (bilingual).

    Content is authored by administrators (super_admin, and jurisdiction-
    scoped admin). It carries an OFFICIAL SOURCE reference so the ticker can
    always point citizens back to the authoritative source. LegalUpdate does
    NOT itself assert any legal claim - it is informational content only.
    """
    __tablename__ = "legal_updates"

    id = Column(Integer, primary_key=True, index=True)
    title_en = Column(String(300), nullable=False)
    title_bn = Column(String(300), nullable=True)
    summary_en = Column(Text, nullable=False)
    summary_bn = Column(Text, nullable=True)
    # Mutation, Land Records, Land Map, Land Tax, Acquisition, Registration,
    # Land Administration, General Land Service
    category = Column(String(50), nullable=False, index=True)
    publication_date = Column(DateTime(timezone=True), nullable=True)
    effective_date = Column(DateTime(timezone=True), nullable=True)
    official_source_name = Column(String(255), nullable=True)
    official_source_url = Column(String(500), nullable=True)
    language = Column(String(5), default="both")  # en, bn, both
    status = Column(String(20), default="draft", nullable=False, index=True)  # draft, published, archived
    # Optional jurisdiction scope. NULL = national/global content (super_admin
    # authored); a value = scoped to that upazila (jurisdiction-limited admin).
    upazila_id = Column(Integer, ForeignKey("upazilas.id", ondelete="SET NULL"),
                        nullable=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"),
                        nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(),
                        onupdate=func.now())

    def __repr__(self):
        return f"<LegalUpdate(id={self.id}, category='{self.category}', status='{self.status}')>"
