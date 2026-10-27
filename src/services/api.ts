import { Platform } from 'react-native';

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const loc = window.location;
    if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
      if (loc.port === '5000' || !loc.port) {
        return `${loc.origin}/api`;
      }
      return `${loc.protocol}//${loc.hostname}:5000/api`;
    }
    // Production web deployment (e.g. Vercel)
    return `${loc.origin}/api`;
  }
  // Native mobile app (Android APK / iOS)
  return 'https://mark-attendance-backend.onrender.com/api';
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

  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn(`[API Timeout] ${endpoint} took > 20s`);
      return {
        success: false,
        message: 'Server response timed out. Please check if the backend server is running.',
      };
    }
    console.warn(`[API Error] ${endpoint}:`, error.message);
    return {
      success: false,
      message: error.message || 'Network connection failed',
    };
  }
};

export const api = {
  // Auth
  login: (identifier: string, password: string, role?: string, deviceId?: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, role, deviceId }),
    }),

  sendResetOtp: (identifier: string, email: string, role?: string) =>
    request('/auth/send-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, email, role }),
    }),

  resetPassword: (
    identifier: string,
    email: string,
    otp: string,
    newPassword: string,
    role?: string
  ) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ identifier, email, otp, newPassword, role }),
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
      } else if (fileOrFormData && typeof fileOrFormData === 'object' && fileOrFormData.uri) {
        // React Native Mobile asset (Android APK / iOS)
        const cleanName = fileOrFormData.name || fileName || 'document.pdf';
        const mime =
          fileOrFormData.mimeType ||
          fileOrFormData.type ||
          (cleanName.toLowerCase().endsWith('.png')
            ? 'image/png'
            : cleanName.toLowerCase().endsWith('.jpg') || cleanName.toLowerCase().endsWith('.jpeg')
            ? 'image/jpeg'
            : 'application/pdf');

        let base64Sent = false;
        if (Platform.OS !== 'web') {
          try {
            // Read file as base64 on native for 100% guaranteed network transfer
            const FileSystem = require('expo-file-system');
            if (FileSystem && FileSystem.readAsStringAsync) {
              const base64 = await FileSystem.readAsStringAsync(fileOrFormData.uri, {
                encoding: FileSystem.EncodingType ? FileSystem.EncodingType.Base64 : 'base64',
              });
              if (base64 && base64.length > 50) {
                body = JSON.stringify({ base64, fileName: cleanName });
                headers['Content-Type'] = 'application/json';
                base64Sent = true;
              }
            }
          } catch (e) {
            console.log('[Native base64 skipped]', e);
          }
        }

        if (!base64Sent) {
          const formData = new FormData();
          formData.append('file', {
            uri: fileOrFormData.uri,
            name: cleanName,
            type: mime,
          } as any);
          body = formData;
        }
      } else if (
        fileOrFormData &&
        ((typeof Blob !== 'undefined' && fileOrFormData instanceof Blob) ||
          (fileOrFormData.name && fileOrFormData.size !== undefined))
      ) {
        // Web browser File or Blob
        const formData = new FormData();
        formData.append('file', fileOrFormData, fileOrFormData.name || fileName || 'document.pdf');
        body = formData;
      } else {
        body = JSON.stringify({ fileName: fileName || 'document.pdf' });
        headers['Content-Type'] = 'application/json';
      }

      // 90s timeout to allow Render free tier to wake up gracefully from cold sleep
      const ocrBaseUrl = 'https://mark-attendance-backend.onrender.com/api';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      try {
        const res = await fetch(`${ocrBaseUrl}/auth/parse-pdf`, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return await res.json();
      } catch (primaryErr: any) {
        clearTimeout(timeoutId);
        // Fallback to local / configured base URL if different
        const fallbackUrl = getApiBaseUrl();
        if (fallbackUrl !== ocrBaseUrl) {
          const fallbackCtrl = new AbortController();
          const fallbackTimeout = setTimeout(() => fallbackCtrl.abort(), 30000);
          try {
            const fallbackRes = await fetch(`${fallbackUrl}/auth/parse-pdf`, {
              method: 'POST',
              headers,
              body,
              signal: fallbackCtrl.signal,
            });
            clearTimeout(fallbackTimeout);
            return await fallbackRes.json();
          } catch {
            clearTimeout(fallbackTimeout);
          }
        }
        throw primaryErr;
      }
    } catch (e: any) {
      console.warn('[PDF API Error]', e.message);
      return {
        success: false,
        message: e.name === 'AbortError' ? 'File parsing timed out.' : e.message,
      };
    }
  },

  getMe: () => request('/auth/me'),

  lookupUser: (identifier: string) =>
    request(`/auth/lookup?identifier=${encodeURIComponent(identifier)}`),

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
    const searchParams = new URLSearchParams(params as any);
    searchParams.set('_t', Date.now().toString());
    return request(`/sessions/active?${searchParams.toString()}`);
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
    request(`/attendance/session/${sessionId}?_t=${Date.now()}`),

  getReports: (params?: { department?: string; courseCode?: string; search?: string; sessionId?: string }) => {
    const searchParams = new URLSearchParams(params as any);
    searchParams.set('_t', Date.now().toString());
    return request(`/attendance/reports?${searchParams.toString()}`);
  },

  toggleAttendance: (recordId: string) =>
    request(`/attendance/toggle/${recordId}`, {
      method: 'PATCH',
    }),

  saveAttendanceReport: (payload: any) =>
    request('/attendance/report/save', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSavedReports: (params?: { courseCode?: string; teacherFacultyId?: string; department?: string; date?: string }) => {
    const searchParams = new URLSearchParams(params as any);
    searchParams.set('_t', Date.now().toString());
    return request(`/attendance/report/saved?${searchParams.toString()}`);
  },

  emailAttendanceReport: (payload: {
    courseCode?: string;
    sessionId?: string;
    email?: string;
    teacherName?: string;
    classroom?: string;
    records?: any[];
  }) =>
    request('/attendance/report/email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getExportCsvUrl: (params?: { courseCode?: string; courseName?: string; sessionId?: string; department?: string; date?: string }) => {
    const searchParams = new URLSearchParams(params as any);
    return `${getApiBaseUrl()}/attendance/export/csv?${searchParams.toString()}`;
  },

  exportAttendanceCsv: async (params?: { courseCode?: string; courseName?: string; sessionId?: string; department?: string; date?: string; records?: any[] }) => {
    if (params?.records && params.records.length > 0) {
      const url = `${getApiBaseUrl()}/attendance/export/csv`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Failed to download CSV');
      return await res.text();
    }
    const searchParams = new URLSearchParams(params as any);
    const url = `${getApiBaseUrl()}/attendance/export/csv?${searchParams.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to download CSV');
    return await res.text();
  },

  // Schedule
  getTeacherSchedule: (facultyId: string, dayOfWeek?: string) => {
    const encodedId = encodeURIComponent(facultyId);
    const dayParam = dayOfWeek ? `?dayOfWeek=${encodeURIComponent(dayOfWeek)}` : '';
    return request(`/schedule/teacher/${encodedId}${dayParam}`);
  },

  getStudentSchedule: (enrollmentNo: string, dayOfWeek?: string) => {
    const encodedId = encodeURIComponent(enrollmentNo);
    const dayParam = dayOfWeek ? `?dayOfWeek=${encodeURIComponent(dayOfWeek)}` : '';
    return request(`/schedule/student/${encodedId}${dayParam}`);
  },

  syncSchedule: (targetRole: 'TEACHER' | 'STUDENT', targetId: string, schedules: any[]) =>
    request('/schedule/sync', {
      method: 'POST',
      body: JSON.stringify({ targetRole, targetId, schedules }),
    }),
};
