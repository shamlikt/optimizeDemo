import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    uploaded_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    upload_type = Column(String(20), nullable=False)  # retrospective, prospective
    filename = Column(String(255), nullable=False)
    file_hash = Column(String(64))
    version_number = Column(Integer, default=1, nullable=False)
    row_count = Column(Integer, default=0, nullable=False)
    valid_row_count = Column(Integer, default=0, nullable=False)
    duplicate_count = Column(Integer, default=0, nullable=False)
    status = Column(String(20), default="processing", nullable=False)  # processing, completed, failed
    error_message = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    uploaded_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    organization = relationship("Organization", back_populates="uploads")
    uploaded_by_user = relationship("User", back_populates="uploads")
    appointments = relationship(
        "Appointment", back_populates="upload", cascade="all, delete-orphan"
    )
