"""Initial schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-02-24

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Organizations
    op.create_table(
        "organizations",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("NOW()"), nullable=False),
    )

    # Users
    op.create_table(
        "users",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255)),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("TRUE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("NOW()"), nullable=False),
        sa.UniqueConstraint("organization_id", "email", name="uq_user_org_email"),
    )

    # Locations
    op.create_table(
        "locations",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("abbreviation", sa.String(50)),
        sa.Column("address", sa.Text),
        sa.Column("city", sa.String(100)),
        sa.Column("state", sa.String(100)),
        sa.Column("postal_code", sa.String(20)),
        sa.Column("manager_name", sa.String(255)),
        sa.Column("num_employees", sa.Integer, server_default=sa.text("0")),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("TRUE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("NOW()"), nullable=False),
    )

    # User-Location association
    op.create_table(
        "user_locations",
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("location_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("locations.id", ondelete="CASCADE"), primary_key=True),
    )

    # Appointment Types
    op.create_table(
        "appointment_types",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("point_value", sa.Numeric(5, 2), nullable=False),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("TRUE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("NOW()"), nullable=False),
        sa.UniqueConstraint("organization_id", "name", name="uq_appointment_type_org_name"),
    )

    # Uploads
    op.create_table(
        "uploads",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("uploaded_by", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("upload_type", sa.String(20), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("file_hash", sa.String(64)),
        sa.Column("version_number", sa.Integer, server_default=sa.text("1"), nullable=False),
        sa.Column("row_count", sa.Integer, server_default=sa.text("0"), nullable=False),
        sa.Column("valid_row_count", sa.Integer, server_default=sa.text("0"), nullable=False),
        sa.Column("duplicate_count", sa.Integer, server_default=sa.text("0"), nullable=False),
        sa.Column("status", sa.String(20), server_default=sa.text("'processing'"), nullable=False),
        sa.Column("error_message", sa.Text),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("TRUE"), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True),
                  server_default=sa.text("NOW()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("NOW()"), nullable=False),
    )

    # Appointments
    op.create_table(
        "appointments",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("upload_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("uploads.id", ondelete="CASCADE"), nullable=True),
        sa.Column("data_type", sa.String(20), nullable=False),
        # Core fields
        sa.Column("department", sa.String(255)),
        sa.Column("location_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("locations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("location_name", sa.String(255), nullable=False),
        sa.Column("provider", sa.String(255), nullable=False),
        sa.Column("specialty", sa.String(255)),
        sa.Column("patient_encounter_number", sa.String(100)),
        sa.Column("appointment_date", sa.Date, nullable=False),
        sa.Column("day_of_week", sa.String(20)),
        sa.Column("week_of_month", sa.Integer),
        sa.Column("appointment_time", sa.Time, nullable=False),
        sa.Column("session", sa.String(5)),
        sa.Column("visit_type", sa.String(255), nullable=False),
        sa.Column("visit_points", sa.Numeric(5, 2), server_default=sa.text("0")),
        sa.Column("appointment_type_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("appointment_types.id", ondelete="SET NULL"), nullable=True),
        sa.Column("appt_comments", sa.Text),
        # Retrospective-only
        sa.Column("rooming_tech", sa.String(255)),
        sa.Column("check_in_time", sa.Time),
        sa.Column("check_in_comment", sa.Text),
        sa.Column("check_out_time", sa.Time),
        sa.Column("check_out_comment", sa.Text),
        sa.Column("visit_duration_min", sa.Numeric(10, 2)),
        sa.Column("total_wait_duration", sa.Numeric(10, 2)),
        sa.Column("tech_level", sa.String(50)),
        sa.Column("rooming_time", sa.Time),
        sa.Column("rooming_comment", sa.Text),
        sa.Column("tech_in", sa.Time),
        sa.Column("tech_out", sa.Time),
        sa.Column("tech_duration", sa.Numeric(10, 2)),
        sa.Column("tech_comment", sa.Text),
        sa.Column("check_in_to_tech", sa.Numeric(10, 2)),
        sa.Column("appt_time_to_tech", sa.Numeric(10, 2)),
        sa.Column("pt_check_time", sa.Numeric(10, 2)),
        sa.Column("primary_diagnosis", sa.Text),
        # Duplicate tracking
        sa.Column("is_duplicate", sa.Boolean, server_default=sa.text("FALSE"), nullable=False),
        sa.Column("is_excluded_from_reporting", sa.Boolean,
                  server_default=sa.text("FALSE"), nullable=False),
        sa.Column("exclusion_reason", sa.String(50)),
        # Source
        sa.Column("source", sa.String(20), server_default=sa.text("'csv'"), nullable=False),
        sa.Column("row_number", sa.Integer),
        # Draft
        sa.Column("is_draft", sa.Boolean, server_default=sa.text("FALSE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("NOW()"), nullable=False),
    )

    # Create indexes
    op.create_index(
        "idx_appointments_org_date",
        "appointments",
        ["organization_id", "appointment_date"],
    )
    op.create_index(
        "idx_appointments_org_location",
        "appointments",
        ["organization_id", "location_name"],
    )
    op.create_index(
        "idx_appointments_org_type",
        "appointments",
        ["organization_id", "data_type"],
    )
    op.create_index(
        "idx_appointments_reporting",
        "appointments",
        ["organization_id", "is_excluded_from_reporting", "data_type"],
    )
    op.create_index(
        "idx_appointments_upload",
        "appointments",
        ["upload_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_appointments_upload", table_name="appointments")
    op.drop_index("idx_appointments_reporting", table_name="appointments")
    op.drop_index("idx_appointments_org_type", table_name="appointments")
    op.drop_index("idx_appointments_org_location", table_name="appointments")
    op.drop_index("idx_appointments_org_date", table_name="appointments")
    op.drop_table("appointments")
    op.drop_table("uploads")
    op.drop_table("appointment_types")
    op.drop_table("user_locations")
    op.drop_table("locations")
    op.drop_table("users")
    op.drop_table("organizations")
