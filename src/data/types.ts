export type Role = 'TEACHER' | 'STUDENT';

export type AuthTab = 'LOGIN' | 'REGISTER';

export type Screen =
  | 'ROLE_SELECTION'
  | 'AUTH'
  | 'DOC_VERIFICATION'
  | 'REGISTRATION_SUCCESS'
  | 'TEACHER_DASHBOARD'
  | 'STUDENT_DASHBOARD'
  | 'TEACHER_BROADCAST_SETUP'
  | 'TEACHER_BROADCAST_ACTIVE'
  | 'STUDENT_ATTENDANCE'
  | 'TEACHER_REPORT';

export interface ClassScheduleItem {
  id: string;
  courseCode: string;
  courseName: string;
  timeSlot: string;
  dayOfWeek?: string;
  classroom: string;
  teacherName: string;
  department: string;
  courseType: string;
  credits: number;
  isOngoing: boolean;
  isAttendanceActive?: boolean;
  studentAttendancePct?: number;
}

export interface GguSelectedCourse {
  sNo: number;
  courseCode: string;
  courseName: string;
  credits: number;
  term: string;
  type: string;
}

export interface GguDepartment {
  code: string;
  name: string;
  school: string;
  degrees: string[];
}

export interface GguSchool {
  schoolName: string;
  departments: GguDepartment[];
}

export interface SubjectRosterItem {
  sNo: string;
  code: string;
  type: string; // Major, Minor, SEC, VAC, AEC
  subjectName: string;
  offeringDept: string;
  credits: number;
}

export interface TeacherClassSession {
  sNo: string;
  subjectCode: string;
  subjectName: string;
  allotTime: string;
  offeringDept: string;
  courseType: string;
  isPg?: boolean;
}

export interface StudentAttendanceRecord {
  sNo: string;
  studentName: string;
  dept: string;
  courseType: string;
  isPresent: boolean;
  checkInTime: string;
  verificationMethod: string;
}

export interface CampusGeofence {
  campusName: string;
  locationName: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  currentDistanceMeters: number;
  isWithinBoundary: boolean;
}
