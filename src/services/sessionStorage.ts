import AsyncStorage from '@react-native-async-storage/async-storage';
import { Role } from '../data/types';

export interface StoredAuthSession {
  role: Role;
  token?: string | null;
  // Teacher data
  teacherFacultyId?: string;
  teacherRegName?: string;
  teacherDepartment?: string;
  teacherRegEmail?: string;
  // Student data
  studentEnrollment?: string;
  studentRegName?: string;
  studentRegEnrollment?: string;
  studentRegEmail?: string;
  studentDepartment?: string;
  studentCourseLevel?: string;
  studentEnrolledCourses?: any[];
  savedAt: number;
}

const AUTH_STORAGE_KEY = '@attendiq_active_auth_session_v1';

export const saveAuthSession = async (session: StoredAuthSession): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('[SessionStorage] Save error:', err);
  }
};

export const getAuthSession = async (): Promise<StoredAuthSession | null> => {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[SessionStorage] Read error:', err);
    return null;
  }
};

export const clearAuthSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.warn('[SessionStorage] Clear error:', err);
  }
};
