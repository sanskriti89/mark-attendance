import { Platform } from 'react-native';

// Dynamically resolve API URL based on browser origin (phone/web) or LAN IP
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    // If running in development with Expo web dev server (e.g. port 8081 or 19006)
    if (window.location.port && window.location.port !== '5000') {
      return `http://${window.location.hostname || 'localhost'}:5000/api`;
    }
    return `${window.location.origin}/api`;
  }
  return 'http://192.168.1.24:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const request = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    const data = await res.json();
    return data;
  } catch (error: any) {
    console.warn(`[API Error] ${endpoint}:`, error.message);
    return {
      success: false,
      message: error.message || 'Network connection failed',
    };
  }
};

export const api = {
  // Auth
  login: (identifier: string, password: string, role?: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, role }),
    }),

  registerStudent: (payload: any) =>
    request('/auth/register/student', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  registerTeacher: (payload: any) =>
    request('/auth/register/teacher', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  parsePdf: async (fileOrFormData: any, fileName?: string) => {
    try {
      let body: any;
      const headers: Record<string, string> = {};

      if (typeof FormData !== 'undefined' && fileOrFormData instanceof FormData) {
        body = fileOrFormData;
      } else if (
        fileOrFormData &&
        ((typeof Blob !== 'undefined' && fileOrFormData instanceof Blob) ||
          (fileOrFormData.name && fileOrFormData.size !== undefined))
      ) {
        const formData = new FormData();
        formData.append('file', fileOrFormData, fileOrFormData.name || fileName || 'document.pdf');
        body = formData;
      } else if (fileOrFormData && typeof fileOrFormData === 'object' && fileOrFormData.uri) {
        // React Native mobile asset
        const formData = new FormData();
        formData.append('file', {
          uri: fileOrFormData.uri,
          name: fileOrFormData.name || fileName || 'slip.pdf',
          type: fileOrFormData.mimeType || 'application/pdf',
        } as any);
        body = formData;
      } else {
        body = JSON.stringify({ fileName: fileName || 'document.pdf' });
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(`${API_BASE_URL}/auth/parse-pdf`, {
        method: 'POST',
        headers,
        body,
      });
      return await res.json();
    } catch (e: any) {
      console.warn('[PDF API Error]', e.message);
      return { success: false, message: e.message };
    }
  },

  getMe: () => request('/auth/me'),

  // Sessions
  startBroadcast: (payload: {
    courseCode: string;
    courseName: string;
    classroom: string;
    department: string;
    broadcastPin: string;
    durationSeconds?: number;
    totalTarget?: number;
    teacherFacultyId?: string;
    teacherName?: string;
  }) =>
    request('/sessions/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getActiveSession: (params?: { courseCode?: string; teacherFacultyId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/sessions/active?${query}`);
  },

  endSession: (sessionId: string) =>
    request(`/sessions/end/${sessionId}`, {
      method: 'POST',
    }),

  updateHeadcount: (sessionId: string, physicalHeadcount: number) =>
    request(`/sessions/headcount/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ physicalHeadcount }),
    }),

  // Attendance
  markAttendance: (payload: {
    pin: string;
    studentEnrollment: string;
    studentName: string;
    department: string;
    courseCode?: string;
    latitude?: number;
    longitude?: number;
  }) =>
    request('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSessionAttendance: (sessionId: string) =>
    request(`/attendance/session/${sessionId}`),

  getReports: (params?: { department?: string; courseCode?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/attendance/reports?${query}`);
  },

  toggleAttendance: (recordId: string) =>
    request(`/attendance/toggle/${recordId}`, {
      method: 'PATCH',
    }),

  // Schedule
  getTeacherSchedule: (facultyId: string) =>
    request(`/schedule/teacher/${facultyId}`),

  getStudentSchedule: (enrollmentNo: string) =>
    request(`/schedule/student/${enrollmentNo}`),

  syncSchedule: (targetRole: 'TEACHER' | 'STUDENT', targetId: string, schedules: any[]) =>
    request('/schedule/sync', {
      method: 'POST',
      body: JSON.stringify({ targetRole, targetId, schedules }),
    }),
};
