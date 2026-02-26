from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import date


class TrendDataPoint(BaseModel):
    """A single data point in the trend chart."""
    date: date
    total_points: Decimal = Decimal("0")
    appointment_count: int = 0


class DashboardOverviewResponse(BaseModel):
    """Response for dashboard overview."""
    total_points: Decimal = Decimal("0")
    total_appointments: int = 0
    avg_points_per_day: Decimal = Decimal("0")
    active_locations: int = 0
    trend_data: List[TrendDataPoint] = []


class LocationTableRow(BaseModel):
    """A single row in the location table."""
    location_name: str
    location_id: Optional[str] = None
    num_employees: int = 0
    manager_name: Optional[str] = None
    ytd_points: Decimal = Decimal("0")
    mtd_points: Decimal = Decimal("0")
    appointment_count: int = 0


class LocationTableResponse(BaseModel):
    """Response for location table."""
    locations: List[LocationTableRow]
    total: int
