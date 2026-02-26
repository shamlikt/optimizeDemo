import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    Numeric,
    Boolean,
    DateTime,
    Date,
    Time,
    Integer,
    ForeignKey,
    Text,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    upload_id = Column(
        UUID(as_uuid=True), ForeignKey("uploads.id", ondelete="CASCADE"), nullable=True
    )
    data_type = Column(String(20), nullable=False)  # retrospective, prospective

    # Core fields
    department = Column(String(255))
    location_id = Column(
        UUID(as_uuid=True), ForeignKey("locations.id", ondelete="SET NULL"), nullable=True
    )
    location_name = Column(String(255), nullable=False)
    provider = Column(String(255), nullable=False)
    specialty = Column(String(255))
    patient_encounter_number = Column(String(100))
    appointment_date = Column(Date, nullable=False)
    day_of_week = Column(String(20))
    week_of_month = Column(Integer)
    appointment_time = Column(Time, nullable=False)
    session = Column(String(5))  # AM, PM
    visit_type = Column(String(255), nullable=False)
    visit_points = Column(Numeric(5, 2), default=0)
    appointment_type_id = Column(
        UUID(as_uuid=True), ForeignKey("appointment_types.id", ondelete="SET NULL"), nullable=True
    )
    appt_comments = Column(Text)

    # Retrospective-only fields
    rooming_tech = Column(String(255))
    check_in_staff = Column(String(255))
    check_in_time = Column(Time)
    check_in_comment = Column(Text)
    check_out_time = Column(Time)
    check_out_comment = Column(Text)
    visit_duration_min = Column(Numeric(10, 2))
    total_wait_duration = Column(Numeric(10, 2))
    tech_level = Column(String(50))
    rooming_time = Column(Time)
    rooming_comment = Column(Text)
    tech_in = Column(Time)
    tech_out = Column(Time)
    tech_duration = Column(Numeric(10, 2))
    tech_comment = Column(Text)
    check_in_to_tech = Column(Numeric(10, 2))
    appt_time_to_tech = Column(Numeric(10, 2))
    pt_check_time = Column(Numeric(10, 2))
    primary_diagnosis = Column(Text)

    # Duplicate tracking
    is_duplicate = Column(Boolean, default=False, nullable=False)
    is_excluded_from_reporting = Column(Boolean, default=False, nullable=False)
    exclusion_reason = Column(String(50))

    # Source
    source = Column(String(20), default="csv", nullable=False)  # csv, manual
    row_number = Column(Integer)

    # Draft
    is_draft = Column(Boolean, default=False, nullable=False)

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_appointments_org_date", "organization_id", "appointment_date"),
        Index("idx_appointments_org_location", "organization_id", "location_name"),
        Index("idx_appointments_org_type", "organization_id", "data_type"),
        Index(
            "idx_appointments_reporting",
            "organization_id",
            "is_excluded_from_reporting",
            "data_type",
        ),
        Index("idx_appointments_upload", "upload_id"),
    )

    # Relationships
    organization = relationship("Organization", back_populates="appointments")
    upload = relationship("Upload", back_populates="appointments")
    location = relationship("Location", back_populates="appointments")
    appointment_type = relationship("AppointmentType", back_populates="appointments")
