"""Add check_in_staff column to appointments

Revision ID: 002_add_check_in_staff
Revises: 001_initial_schema
Create Date: 2026-02-24

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002_add_check_in_staff"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("appointments", sa.Column("check_in_staff", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("appointments", "check_in_staff")
