from pydantic import BaseModel
from typing import List, Optional, Dict
from decimal import Decimal
from datetime import date


class TechDailyPoints(BaseModel):
    """Points for a single tech on a single day, split by session."""
    date: date
    day_of_week: str
    am_points: Decimal = Decimal("0")
    pm_points: Decimal = Decimal("0")
    total_points: Decimal = Decimal("0")


class TechPointsSummary(BaseModel):
    """Summary of a single tech's points over a period."""
    rooming_tech: str
    daily_points: List[TechDailyPoints]
    total_am: Decimal = Decimal("0")
    total_pm: Decimal = Decimal("0")
    grand_total: Decimal = Decimal("0")


class TechPointsByLocationResponse(BaseModel):
    """Response for tech-points-by-location report."""
    location_name: str
    period: str  # one_week, four_weeks
    month: str
    techs: List[TechPointsSummary]


class MonthlyTechPointsResponse(BaseModel):
    """Response for monthly-tech-points-by-location report."""
    location_name: str
    month: str
    techs: List[TechPointsSummary]


class ProviderPointsSummary(BaseModel):
    """Summary of a provider's scheduled points."""
    provider: str
    am_points: Decimal = Decimal("0")
    pm_points: Decimal = Decimal("0")
    total_points: Decimal = Decimal("0")


class ManagerProviderPoints(BaseModel):
    """A manager's providers and their points."""
    manager_name: Optional[str] = None
    location_name: str
    providers: List[ProviderPointsSummary]
    total_am: Decimal = Decimal("0")
    total_pm: Decimal = Decimal("0")
    grand_total: Decimal = Decimal("0")


class ScheduledPointsByProviderResponse(BaseModel):
    """Response for scheduled-points-by-provider report."""
    location_name: str
    month: str
    managers: List[ManagerProviderPoints]


class SpecialtyLocationPoints(BaseModel):
    """Points for a specialty at a location across two months."""
    specialty: str
    location_name: str
    month1_points: Decimal = Decimal("0")
    month2_points: Decimal = Decimal("0")


class PointsPaidTechFteResponse(BaseModel):
    """Response for points-paid-tech-fte report."""
    month1: str
    month2: str
    data: List[SpecialtyLocationPoints]


class LocationDailyPoints(BaseModel):
    """Daily points for a location."""
    date: date
    day_of_week: str
    am_points: Decimal = Decimal("0")
    pm_points: Decimal = Decimal("0")
    total_points: Decimal = Decimal("0")


class LocationWeeklyPoints(BaseModel):
    """Weekly points for a single location."""
    location_name: str
    daily_points: List[LocationDailyPoints]
    total_am: Decimal = Decimal("0")
    total_pm: Decimal = Decimal("0")
    grand_total: Decimal = Decimal("0")


class WeeklyPointsByLocationResponse(BaseModel):
    """Response for weekly-points-by-location report."""
    month: str
    week: int
    locations: List[LocationWeeklyPoints]
