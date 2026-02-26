from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import date, time, datetime
from decimal import Decimal


class AppointmentCreate(BaseModel):
    data_type: str  # retrospective, prospective
    department: Optional[str] = None
    location_name: str
    provider: str
    specialty: Optional[str] = None
    patient_encounter_number: Optional[str] = None
    appointment_date: date
    appointment_time: time
    session: Optional[str] = None  # AM, PM
    visit_type: str
    visit_points: Optional[Decimal] = None
    appt_comments: Optional[str] = None
    # Retrospective-only
    rooming_tech: Optional[str] = None
    check_in_time: Optional[time] = None
    check_in_comment: Optional[str] = None
    check_out_time: Optional[time] = None
    check_out_comment: Optional[str] = None
    visit_duration_min: Optional[Decimal] = None
    total_wait_duration: Optional[Decimal] = None
    tech_level: Optional[str] = None
    rooming_time: Optional[time] = None
    rooming_comment: Optional[str] = None
    tech_in: Optional[time] = None
    tech_out: Optional[time] = None
    tech_duration: Optional[Decimal] = None
    tech_comment: Optional[str] = None
    check_in_to_tech: Optional[Decimal] = None
    appt_time_to_tech: Optional[Decimal] = None
    pt_check_time: Optional[Decimal] = None
    primary_diagnosis: Optional[str] = None
    is_draft: bool = False


class AppointmentBatchCreate(BaseModel):
    appointments: List[AppointmentCreate]


class AppointmentUpdate(BaseModel):
    department: Optional[str] = None
    location_name: Optional[str] = None
    provider: Optional[str] = None
    specialty: Optional[str] = None
    patient_encounter_number: Optional[str] = None
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    session: Optional[str] = None
    visit_type: Optional[str] = None
    visit_points: Optional[Decimal] = None
    appt_comments: Optional[str] = None
    rooming_tech: Optional[str] = None
    is_draft: Optional[bool] = None


class AppointmentResponse(BaseModel):
    id: UUID
    organization_id: UUID
    upload_id: Optional[UUID] = None
    data_type: str
    department: Optional[str] = None
    location_id: Optional[UUID] = None
    location_name: str
    provider: str
    specialty: Optional[str] = None
    patient_encounter_number: Optional[str] = None
    appointment_date: date
    day_of_week: Optional[str] = None
    week_of_month: Optional[int] = None
    appointment_time: time
    session: Optional[str] = None
    visit_type: str
    visit_points: Optional[Decimal] = None
    appointment_type_id: Optional[UUID] = None
    appt_comments: Optional[str] = None
    rooming_tech: Optional[str] = None
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None
    visit_duration_min: Optional[Decimal] = None
    total_wait_duration: Optional[Decimal] = None
    tech_level: Optional[str] = None
    rooming_time: Optional[time] = None
    tech_in: Optional[time] = None
    tech_out: Optional[time] = None
    tech_duration: Optional[Decimal] = None
    check_in_to_tech: Optional[Decimal] = None
    appt_time_to_tech: Optional[Decimal] = None
    pt_check_time: Optional[Decimal] = None
    primary_diagnosis: Optional[str] = None
    is_duplicate: bool
    is_excluded_from_reporting: bool
    exclusion_reason: Optional[str] = None
    source: str
    row_number: Optional[int] = None
    is_draft: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AppointmentListResponse(BaseModel):
    appointments: List[AppointmentResponse]
    total: int
