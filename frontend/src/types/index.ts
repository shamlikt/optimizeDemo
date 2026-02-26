// ========================
// Auth & User Types
// ========================
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'clinic_admin' | 'clinic_manager';
  is_active: boolean;
  organization_id: string;
  organization_name: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UserWithLocations extends User {
  locations: Location[];
}

// ========================
// Location Types
// ========================
export interface Location {
  id: string;
  organization_id: string;
  name: string;
  abbreviation: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  manager_name: string;
  num_employees: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ========================
// Appointment Type
// ========================
export interface AppointmentType {
  id: string;
  organization_id: string;
  name: string;
  abbreviation: string;
  point_value: number;
  specialty: string;
  is_active: boolean;
  created_at: string;
}

// ========================
// Appointment Types
// ========================
export interface AppointmentCreate {
  location_name: string;
  encounter_number: string;
  appointment_type: string;
  appointment_date: string;
  appointment_time: string;
  provider: string;
  rooming_tech: string;
  check_in_staff: string;
  data_type?: 'retrospective' | 'prospective';
}

export interface Appointment {
  id: string;
  organization_id: string;
  location_name: string;
  encounter_number: string;
  appointment_type: string;
  appointment_date: string;
  appointment_time: string;
  provider: string;
  rooming_tech: string;
  check_in_staff: string;
  point_value: number;
  session: string;
  data_type: string;
  is_excluded: boolean;
  upload_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentsResponse {
  appointments: Appointment[];
  total: number;
}

// ========================
// Upload Types
// ========================
export interface UploadResponse {
  id: string;
  organization_id: string;
  uploaded_by: string;
  upload_type: string;
  filename: string;
  file_hash: string;
  version_number: number;
  row_count: number;
  valid_row_count: number;
  duplicate_count: number;
  status: string;
  error_message: string | null;
  is_active: boolean;
  uploaded_at: string;
  created_at: string;
}

export interface UploadsResponse {
  uploads: UploadResponse[];
  total: number;
}

// ========================
// Dashboard Types
// ========================
export interface DashboardOverview {
  total_points: number;
  total_appointments: number;
  avg_points_per_day: number;
  active_locations: number;
  trend_data: TrendDataPoint[];
}

export interface TrendDataPoint {
  date: string;
  total_points: number;
  appointment_count: number;
}

export interface LocationTableRow {
  location_name: string;
  location_id: string;
  num_employees: number;
  manager_name: string;
  ytd_points: number;
  mtd_points: number;
  appointment_count: number;
}

export interface LocationTableResponse {
  locations: LocationTableRow[];
  total: number;
}

// ========================
// Report Types
// ========================
export type ReportType =
  | 'tech_points_by_location'
  | 'monthly_tech_points'
  | 'scheduled_points_by_provider'
  | 'points_paid_tech_fte'
  | 'weekly_points_by_day';

export interface ReportFilters {
  location_name?: string;
  report_type: ReportType;
  month?: string;
  period?: 'one_week' | 'four_weeks';
  month1?: string;
  month2?: string;
  week?: number;
}

// Tech Points by Location report
export interface DailyPoints {
  date: string;
  day_of_week: string;
  am_points: number;
  pm_points: number;
  total_points: number;
}

export interface TechPointsEntry {
  rooming_tech: string;
  daily_points: DailyPoints[];
  total_am: number;
  total_pm: number;
  grand_total: number;
}

export interface TechPointsByLocationResponse {
  location_name: string;
  period: string;
  month: string;
  techs: TechPointsEntry[];
}

// Monthly Tech Points report
export interface MonthlyTechPointsResponse {
  location_name: string;
  month: string;
  techs: TechPointsEntry[];
}

// Scheduled Points by Provider report
export interface ProviderPointsEntry {
  provider: string;
  am_points: number;
  pm_points: number;
  total_points: number;
}

export interface ManagerProviderPoints {
  manager_name: string;
  location_name: string;
  providers: ProviderPointsEntry[];
  total_am: number;
  total_pm: number;
  grand_total: number;
}

export interface ScheduledPointsByProviderResponse {
  location_name: string;
  month: string;
  managers: ManagerProviderPoints[];
}

// Points Paid Tech FTE report
export interface FTEDataEntry {
  specialty: string;
  location_name: string;
  month1_points: number;
  month2_points: number;
}

export interface PointsPaidTechFTEResponse {
  month1: string;
  month2: string;
  data: FTEDataEntry[];
}

// Weekly Points by Location report
export interface WeeklyLocationEntry {
  location_name: string;
  daily_points: DailyPoints[];
  total_am: number;
  total_pm: number;
  grand_total: number;
}

export interface WeeklyPointsByLocationResponse {
  month: string;
  week: number;
  locations: WeeklyLocationEntry[];
}

// ========================
// Data Entry Types (maps to Appointment creation)
// ========================
export interface DataEntryRow {
  id: string; // client-side only
  location_name: string;
  encounter_number: string;
  appointment_type: string;
  appointment_date: string;
  appointment_time: string;
  provider: string;
  rooming_tech: string;
  check_in_staff: string;
}

// ========================
// API response wrappers
// ========================
export interface ApiError {
  detail: string;
  status_code: number;
}
