import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  User,
  UserWithLocations,
  Location,
  AppointmentType,
  AppointmentCreate,
  Appointment,
  AppointmentsResponse,
  UploadResponse,
  UploadsResponse,
  DashboardOverview,
  LocationTableResponse,
  TechPointsByLocationResponse,
  MonthlyTechPointsResponse,
  ScheduledPointsByProviderResponse,
  PointsPaidTechFTEResponse,
  WeeklyPointsByLocationResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========================
// Auth API
// ========================
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email: data.email,
      password: data.password,
    });
    return response.data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

// ========================
// Dashboard API
// ========================
export const dashboardApi = {
  getOverview: async (locations?: string, days?: number): Promise<DashboardOverview> => {
    const params: Record<string, string> = {};
    if (locations) params.locations = locations;
    if (days) params.days = String(days);
    const response = await api.get<DashboardOverview>('/dashboard/overview', { params });
    return response.data;
  },
  getLocationTable: async (search?: string): Promise<LocationTableResponse> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    const response = await api.get<LocationTableResponse>('/dashboard/location-table', { params });
    return response.data;
  },
};

// ========================
// Locations API
// ========================
export const locationsApi = {
  getAll: async (): Promise<Location[]> => {
    const response = await api.get<Location[]>('/locations/');
    return response.data;
  },
  create: async (data: Partial<Location>): Promise<Location> => {
    const response = await api.post<Location>('/locations/', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Location>): Promise<Location> => {
    const response = await api.put<Location>(`/locations/${id}`, data);
    return response.data;
  },
};

// ========================
// Appointment Types API
// ========================
export const appointmentTypesApi = {
  getAll: async (): Promise<AppointmentType[]> => {
    const response = await api.get<AppointmentType[]>('/appointment-types/');
    return response.data;
  },
  getById: async (id: string): Promise<AppointmentType> => {
    const response = await api.get<AppointmentType>(`/appointment-types/${id}`);
    return response.data;
  },
  create: async (data: { name: string; point_value: number }): Promise<AppointmentType> => {
    const response = await api.post<AppointmentType>('/appointment-types/', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{ name: string; point_value: number; is_active: boolean }>): Promise<AppointmentType> => {
    const response = await api.put<AppointmentType>(`/appointment-types/${id}`, data);
    return response.data;
  },
};

// ========================
// Appointments API
// ========================
export const appointmentsApi = {
  create: async (appointments: AppointmentCreate[]): Promise<Appointment[]> => {
    const response = await api.post<Appointment[]>('/appointments/', { appointments });
    return response.data;
  },
  getAll: async (params?: {
    location_name?: string;
    data_type?: string;
    date_from?: string;
    date_to?: string;
    provider?: string;
    upload_id?: string;
    include_excluded?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<AppointmentsResponse> => {
    const response = await api.get<AppointmentsResponse>('/appointments/', { params });
    return response.data;
  },
  update: async (id: string, data: Partial<Appointment>): Promise<Appointment> => {
    const response = await api.put<Appointment>(`/appointments/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },
  saveDraft: async (appointments: AppointmentCreate[]): Promise<Appointment[]> => {
    const response = await api.post<Appointment[]>('/appointments/draft', { appointments });
    return response.data;
  },
  getDrafts: async (): Promise<AppointmentsResponse> => {
    const response = await api.get<AppointmentsResponse>('/appointments/drafts');
    return response.data;
  },
};

// ========================
// Upload API
// ========================
export const uploadApi = {
  uploadFile: async (
    file: File,
    type: 'retrospective' | 'prospective'
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<UploadResponse>(`/uploads/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getAll: async (params?: {
    upload_type?: string;
    is_active?: boolean;
  }): Promise<UploadsResponse> => {
    const response = await api.get<UploadsResponse>('/uploads/', { params });
    return response.data;
  },
  getById: async (id: string): Promise<UploadResponse> => {
    const response = await api.get<UploadResponse>(`/uploads/${id}`);
    return response.data;
  },
};

// ========================
// Reports API
// ========================
export const reportsApi = {
  getTechPointsByLocation: async (
    locationName: string,
    month: string,
    period?: 'one_week' | 'four_weeks'
  ): Promise<TechPointsByLocationResponse> => {
    const params: Record<string, string> = {
      location_name: locationName,
      month,
    };
    if (period) params.period = period;
    const response = await api.get<TechPointsByLocationResponse>(
      '/reports/tech-points-by-location',
      { params }
    );
    return response.data;
  },
  getMonthlyTechPoints: async (
    locationName: string,
    month: string
  ): Promise<MonthlyTechPointsResponse> => {
    const response = await api.get<MonthlyTechPointsResponse>(
      '/reports/monthly-tech-points-by-location',
      { params: { location_name: locationName, month } }
    );
    return response.data;
  },
  getScheduledPointsByProvider: async (
    locationName: string,
    month: string
  ): Promise<ScheduledPointsByProviderResponse> => {
    const response = await api.get<ScheduledPointsByProviderResponse>(
      '/reports/scheduled-points-by-provider',
      { params: { location_name: locationName, month } }
    );
    return response.data;
  },
  getPointsPaidTechFTE: async (
    month1: string,
    month2: string
  ): Promise<PointsPaidTechFTEResponse> => {
    const response = await api.get<PointsPaidTechFTEResponse>(
      '/reports/points-paid-tech-fte',
      { params: { month1, month2 } }
    );
    return response.data;
  },
  getWeeklyPointsByLocation: async (
    month: string,
    week: number
  ): Promise<WeeklyPointsByLocationResponse> => {
    const response = await api.get<WeeklyPointsByLocationResponse>(
      '/reports/weekly-points-by-location',
      { params: { month, week } }
    );
    return response.data;
  },
};

// ========================
// Users API (admin only)
// ========================
export const usersApi = {
  getAll: async (): Promise<UserWithLocations[]> => {
    const response = await api.get<UserWithLocations[]>('/users/');
    return response.data;
  },
  create: async (data: {
    email: string;
    password: string;
    full_name?: string;
    role: string;
  }): Promise<User> => {
    const response = await api.post<User>('/users/', data);
    return response.data;
  },
  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
  updateLocations: async (
    userId: string,
    locationIds: string[]
  ): Promise<UserWithLocations> => {
    const response = await api.put<UserWithLocations>(`/users/${userId}/locations`, {
      location_ids: locationIds,
    });
    return response.data;
  },
};

export default api;
