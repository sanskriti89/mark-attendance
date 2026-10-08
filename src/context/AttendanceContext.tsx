import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Role,
  AuthTab,
  Screen,
  SubjectRosterItem,
  TeacherClassSession,
  StudentAttendanceRecord,
  CampusGeofence,
  ClassScheduleItem,
  GguSelectedCourse,
} from '../data/types';
import { GGU_OFFICIAL_COURSE_SELECTIONS } from '../data/gguUniversityData';

interface AttendanceContextType {
  // Navigation & Role
  currentScreen: Screen;
  currentRole: Role;
  authTab: AuthTab;
  selectRole: (role: Role) => void;
  switchRole: () => void;
  setAuthTab: (tab: AuthTab) => void;
  navigateTo: (screen: Screen) => void;
  goBack: () => void;

  // Student Login Fields
  studentEnrollment: string;
  setStudentEnrollment: (v: string) => void;
  studentPassword: string;
  setStudentPassword: (v: string) => void;

  // Teacher Login Fields
  teacherFacultyId: string;
  setTeacherFacultyId: (v: string) => void;
  teacherPassword: string;
  setTeacherPassword: (v: string) => void;

  // Student Registration Fields
  studentRegName: string;
  setStudentRegName: (v: string) => void;
  studentRegEnrollment: string;
  setStudentRegEnrollment: (v: string) => void;
  studentRegEmail: string;
  setStudentRegEmail: (v: string) => void;
  studentCourseLevel: string;
  setStudentCourseLevel: (v: string) => void;
  studentDepartment: string;
  setStudentDepartment: (v: string) => void;
  studentRegPassword: string;
  setStudentRegPassword: (v: string) => void;
  studentRegConfirmPassword: string;
  setStudentRegConfirmPassword: (v: string) => void;

  // Teacher Registration Fields
  teacherRegName: string;
  setTeacherRegName: (v: string) => void;
  teacherRegFacultyId: string;
  setTeacherRegFacultyId: (v: string) => void;
  teacherRegEmail: string;
  setTeacherRegEmail: (v: string) => void;
  teacherDepartment: string;
  setTeacherDepartment: (v: string) => void;
  teacherRegPassword: string;
  setTeacherRegPassword: (v: string) => void;
  teacherRegConfirmPassword: string;
  setTeacherRegConfirmPassword: (v: string) => void;

  // Teacher Broadcast
  broadcastPin: string;
  appendBroadcastPinDigit: (d: string) => void;
  backspaceBroadcastPin: () => void;
  clearBroadcastPin: () => void;
  isBroadcasting: boolean;
  broadcastSecondsLeft: number;
  currentAttendanceCount: number;
  totalAttendanceTarget: number;
  recentJoins: string[];
  physicalHeadcount: number;
  incrementPhysicalHeadcount: () => void;
  decrementPhysicalHeadcount: () => void;
  isAuditModeActive: boolean;
  toggleAuditMode: () => void;
  startBroadcastTimer: () => void;
  stopBroadcastTimer: () => void;

  // Active broadcast session details
  activeSubjectCode: string;
  activeSubjectName: string;
  activeClassroom: string;
  startClassAttendanceFromSchedule: (item: ClassScheduleItem) => void;

  // Student Attendance
  studentEnteredPin: string;
  appendStudentPinDigit: (d: string) => void;
  backspaceStudentPin: () => void;
  clearStudentPin: () => void;
  studentAttendanceMarked: boolean;
  studentAttendanceMessage: string | null;
  submitStudentAttendance: () => void;
  resetStudentAttendance: () => void;
  campusGeofence: CampusGeofence;

  // Timetable Hub & Schedules
  selectedDaySchedule: string;
  setSelectedDaySchedule: (day: string) => void;
  teacherDailySchedule: ClassScheduleItem[];
  studentScheduleList: ClassScheduleItem[];
  gguOfficialCourses: GguSelectedCourse[];
  uploadCustomTimetable: (name: string) => void;
  uploadedTimetableName: string | null;

  // Data & Reports
  sampleStudentRoster: SubjectRosterItem[];
  sampleUgSessions: TeacherClassSession[];
  attendanceRecords: StudentAttendanceRecord[];
  toggleRecordAttendance: (sNo: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedDeptFilter: string;
  setSelectedDeptFilter: (v: string) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (v: string) => void;
  filteredRecords: StudentAttendanceRecord[];

  // Modals
  isProfileSheetOpen: boolean;
  setIsProfileSheetOpen: (v: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (v: boolean) => void;
  isDocPreviewOpen: boolean;
  setIsDocPreviewOpen: (v: boolean) => void;
  userNotification: string | null;
  setUserNotification: (v: string | null) => void;
}

const initialAttendanceRecords: StudentAttendanceRecord[] = [
  { sNo: '01', studentName: 'Santosh Rao', dept: 'CSIT', courseType: 'Major', isPresent: true, checkInTime: '10:14 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '02', studentName: 'Alex Morgan', dept: 'CSE', courseType: 'Minor', isPresent: true, checkInTime: '10:15 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '03', studentName: 'Priya Sharma', dept: 'ECE', courseType: 'SEC', isPresent: true, checkInTime: '10:15 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '04', studentName: 'Rahul Verma', dept: 'CSIT', courseType: 'Major', isPresent: true, checkInTime: '10:16 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '05', studentName: 'Ananya Patel', dept: 'IT', courseType: 'VAC', isPresent: true, checkInTime: '10:16 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '06', studentName: 'Kevin Chen', dept: 'CSIT', courseType: 'Major', isPresent: true, checkInTime: '10:17 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '07', studentName: 'Sarah Jenkins', dept: 'CSE', courseType: 'Minor', isPresent: true, checkInTime: '10:17 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '08', studentName: "David O'Connor", dept: 'CSIT', courseType: 'Major', isPresent: true, checkInTime: '10:18 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '09', studentName: 'Aarav Gupta', dept: 'CSE', courseType: 'Minor', isPresent: true, checkInTime: '10:18 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '10', studentName: 'Meera Nair', dept: 'CSIT', courseType: 'Major', isPresent: true, checkInTime: '10:19 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '11', studentName: 'Rohan Joshi', dept: 'ECE', courseType: 'SEC', isPresent: true, checkInTime: '10:19 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '12', studentName: 'Sneha Kulkarni', dept: 'IT', courseType: 'AEC', isPresent: true, checkInTime: '10:20 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '13', studentName: 'Ethan Taylor', dept: 'CSE', courseType: 'Minor', isPresent: false, checkInTime: '-', verificationMethod: 'Unverified' },
  { sNo: '14', studentName: 'Zoe Martinez', dept: 'CSIT', courseType: 'Major', isPresent: true, checkInTime: '10:21 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '15', studentName: 'Vikram Malhotra', dept: 'CSE', courseType: 'Minor', isPresent: true, checkInTime: '10:21 AM', verificationMethod: 'GGU GPS + PIN' },
  { sNo: '16', studentName: 'Divya Pillai', dept: 'ECE', courseType: 'SEC', isPresent: true, checkInTime: '10:22 AM', verificationMethod: 'GGU GPS + PIN' },
];

const defaultTeacherSchedule: ClassScheduleItem[] = [
  {
    id: 'SCH_T1',
    courseCode: 'CIUCMJT2',
    courseName: 'Operating Systems',
    timeSlot: '10:15 AM - 11:15 AM',
    dayOfWeek: 'Today',
    classroom: 'CSIT Lab 2 / Room FB',
    teacherName: 'Dr. Eleanor Vance',
    department: 'CSIT',
    courseType: 'Major',
    credits: 4.0,
    isOngoing: true,
    isAttendanceActive: false,
  },
  {
    id: 'SCH_T2',
    courseCode: 'CIUCMJT1',
    courseName: 'Relational Database Management System',
    timeSlot: '11:30 AM - 12:30 PM',
    dayOfWeek: 'Today',
    classroom: 'CSIT Hall 1',
    teacherName: 'Dr. Eleanor Vance',
    department: 'CSIT',
    courseType: 'Major',
    credits: 3.0,
    isOngoing: false,
    isAttendanceActive: false,
  },
  {
    id: 'SCH_T3',
    courseCode: 'SECC13',
    courseName: 'DBMS Lab',
    timeSlot: '01:15 PM - 02:15 PM',
    dayOfWeek: 'Today',
    classroom: 'Room FB',
    teacherName: 'Dr. Eleanor Vance',
    department: 'CSIT',
    courseType: 'SEC',
    credits: 3.0,
    isOngoing: false,
    isAttendanceActive: false,
  },
  {
    id: 'SCH_T4',
    courseCode: 'VOCCIT03',
    courseName: 'Python Programming',
    timeSlot: '02:30 PM - 03:30 PM',
    dayOfWeek: 'Today',
    classroom: 'CSIT Lab 1',
    teacherName: 'Dr. Eleanor Vance',
    department: 'CSIT',
    courseType: 'VAC',
    credits: 1.0,
    isOngoing: false,
    isAttendanceActive: false,
  },
];

const defaultStudentSchedule: ClassScheduleItem[] = [
  {
    id: 'SCH_S1',
    courseCode: 'CIUCMJT2',
    courseName: 'Operating Systems',
    timeSlot: '10:15 AM - 11:15 AM',
    dayOfWeek: 'Today',
    classroom: 'CSIT Lab 2 / Room FB',
    teacherName: 'Dr. Eleanor Vance',
    department: 'CSIT',
    courseType: 'Major',
    credits: 4.0,
    isOngoing: true,
    isAttendanceActive: true,
    studentAttendancePct: 88,
  },
  {
    id: 'SCH_S2',
    courseCode: 'CIUCMJT1',
    courseName: 'Relational Database Management System',
    timeSlot: '11:30 AM - 12:30 PM',
    dayOfWeek: 'Today',
    classroom: 'CSIT Hall 1',
    teacherName: 'Dr. Eleanor Vance',
    department: 'CSIT',
    courseType: 'Major',
    credits: 3.0,
    isOngoing: false,
    studentAttendancePct: 92,
  },
  {
    id: 'SCH_S3',
    courseCode: 'SECC13',
    courseName: 'DBMS',
    timeSlot: '01:15 PM - 02:15 PM',
    dayOfWeek: 'Today',
    classroom: 'Room FB',
    teacherName: 'Prof. Rajesh Gupta',
    department: 'CSIT',
    courseType: 'SEC',
    credits: 3.0,
    isOngoing: false,
    studentAttendancePct: 84,
  },
  {
    id: 'SCH_S4',
    courseCode: 'VOCCIT03',
    courseName: 'Python Programming',
    timeSlot: '02:30 PM - 03:30 PM',
    dayOfWeek: 'Today',
    classroom: 'CSIT Lab 1',
    teacherName: 'Dr. S. Rao',
    department: 'CSIT',
    courseType: 'VAC',
    credits: 1.0,
    isOngoing: false,
    studentAttendancePct: 90,
  },
];

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('ROLE_SELECTION');
  const [currentRole, setCurrentRole] = useState<Role>('TEACHER');
  const [authTab, setAuthTab] = useState<AuthTab>('LOGIN');

  // Student Login Fields
  const [studentEnrollment, setStudentEnrollment] = useState('GGV/25/250/0024');
  const [studentPassword, setStudentPassword] = useState('password123');

  // Teacher Login Fields
  const [teacherFacultyId, setTeacherFacultyId] = useState('FAC-CS-8924');
  const [teacherPassword, setTeacherPassword] = useState('password123');

  // Student Registration Fields
  const [studentRegName, setStudentRegName] = useState('ANAND MOHAN KUMAR');
  const [studentRegEnrollment, setStudentRegEnrollment] = useState('GGV/25/250/0024');
  const [studentRegEmail, setStudentRegEmail] = useState('anand.kumar@ggu.ac.in');
  const [studentCourseLevel, setStudentCourseLevel] = useState('UG');
  const [studentDepartment, setStudentDepartment] = useState('CSIT');
  const [studentRegPassword, setStudentRegPassword] = useState('password123');
  const [studentRegConfirmPassword, setStudentRegConfirmPassword] = useState('password123');

  // Teacher Registration Fields
  const [teacherRegName, setTeacherRegName] = useState('Dr. Eleanor Vance');
  const [teacherRegFacultyId, setTeacherRegFacultyId] = useState('FAC-CS-8924');
  const [teacherRegEmail, setTeacherRegEmail] = useState('e.vance@ggu.ac.in');
  const [teacherDepartment, setTeacherDepartment] = useState('Computer Science & Information Technology');
  const [teacherRegPassword, setTeacherRegPassword] = useState('password123');
  const [teacherRegConfirmPassword, setTeacherRegConfirmPassword] = useState('password123');

  // Broadcast State
  const [broadcastPin, setBroadcastPin] = useState('29');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSecondsLeft, setBroadcastSecondsLeft] = useState(165);
  const [currentAttendanceCount, setCurrentAttendanceCount] = useState(24);
  const [totalAttendanceTarget] = useState(45);
  const [recentJoins] = useState<string[]>([
    'Anand Mohan Kumar (CSIT) • 2s ago',
    'Kevin Chen (CSIT) • 7s ago',
    'Priya Sharma (ECE) • 14s ago',
  ]);
  const [physicalHeadcount, setPhysicalHeadcount] = useState(14);
  const [isAuditModeActive, setIsAuditModeActive] = useState(false);

  // Active Subject details for broadcast
  const [activeSubjectCode, setActiveSubjectCode] = useState('CIUCMJT2');
  const [activeSubjectName, setActiveSubjectName] = useState('Operating Systems');
  const [activeClassroom, setActiveClassroom] = useState('CSIT Lab 2 / Room FB');

  // Student Attendance
  const [studentEnteredPin, setStudentEnteredPin] = useState('');
  const [studentAttendanceMarked, setStudentAttendanceMarked] = useState(false);
  const [studentAttendanceMessage, setStudentAttendanceMessage] = useState<string | null>(null);

  // Timetable & Schedules
  const [selectedDaySchedule, setSelectedDaySchedule] = useState('Today');
  const [teacherDailySchedule, setTeacherDailySchedule] = useState<ClassScheduleItem[]>(defaultTeacherSchedule);
  const [studentScheduleList, setStudentScheduleList] = useState<ClassScheduleItem[]>(defaultStudentSchedule);
  const [uploadedTimetableName, setUploadedTimetableName] = useState<string | null>(null);

  const [campusGeofence] = useState<CampusGeofence>({
    campusName: 'Guru Ghasidas Vishwavidyalaya (GGU)',
    locationName: 'Koni, Bilaspur, Chhattisgarh',
    centerLat: 22.1293,
    centerLng: 82.136,
    radiusMeters: 1500,
    currentDistanceMeters: 320,
    isWithinBoundary: true,
  });

  // Records & Filters
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>(initialAttendanceRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Modals
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDocPreviewOpen, setIsDocPreviewOpen] = useState(false);
  const [userNotification, setUserNotification] = useState<string | null>(null);

  // Broadcast timer effect
  useEffect(() => {
    let interval: any = null;
    if (isBroadcasting && broadcastSecondsLeft > 0) {
      interval = setInterval(() => {
        setBroadcastSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsBroadcasting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBroadcasting, broadcastSecondsLeft]);

  const selectRole = (role: Role) => {
    setCurrentRole(role);
    setCurrentScreen('AUTH');
    setAuthTab('LOGIN');
  };

  const switchRole = () => {
    setCurrentRole((prev) => (prev === 'TEACHER' ? 'STUDENT' : 'TEACHER'));
  };

  const navigateTo = (screen: Screen) => {
    if (screen === 'TEACHER_BROADCAST_ACTIVE') {
      setIsBroadcasting(true);
      setBroadcastSecondsLeft(165);
    } else if (currentScreen === 'TEACHER_BROADCAST_ACTIVE') {
      setIsBroadcasting(false);
    }
    setCurrentScreen(screen);
  };

  const goBack = () => {
    const nextScreenMap: Record<Screen, Screen> = {
      ROLE_SELECTION: 'ROLE_SELECTION',
      AUTH: 'ROLE_SELECTION',
      DOC_VERIFICATION: 'AUTH',
      REGISTRATION_SUCCESS: currentRole === 'TEACHER' ? 'TEACHER_DASHBOARD' : 'STUDENT_DASHBOARD',
      TEACHER_DASHBOARD: 'AUTH',
      STUDENT_DASHBOARD: 'AUTH',
      TEACHER_BROADCAST_SETUP: 'TEACHER_DASHBOARD',
      TEACHER_BROADCAST_ACTIVE: 'TEACHER_BROADCAST_SETUP',
      STUDENT_ATTENDANCE: 'STUDENT_DASHBOARD',
      TEACHER_REPORT: 'TEACHER_DASHBOARD',
    };
    const next = nextScreenMap[currentScreen];
    if ((next as Screen) !== 'TEACHER_BROADCAST_ACTIVE') {
      setIsBroadcasting(false);
    }
    setCurrentScreen(next);
  };

  // Broadcast PIN handlers
  const appendBroadcastPinDigit = (d: string) => {
    if (broadcastPin.length < 2) {
      setBroadcastPin((prev) => prev + d);
    }
  };
  const backspaceBroadcastPin = () => {
    setBroadcastPin((prev) => prev.slice(0, -1));
  };
  const clearBroadcastPin = () => {
    setBroadcastPin('');
  };

  // Student PIN handlers
  const appendStudentPinDigit = (d: string) => {
    if (studentEnteredPin.length < 2) {
      setStudentEnteredPin((prev) => prev + d);
      setStudentAttendanceMessage(null);
    }
  };
  const backspaceStudentPin = () => {
    setStudentEnteredPin((prev) => prev.slice(0, -1));
    setStudentAttendanceMessage(null);
  };
  const clearStudentPin = () => {
    setStudentEnteredPin('');
    setStudentAttendanceMessage(null);
  };

  const submitStudentAttendance = () => {
    if (studentEnteredPin.length < 2) {
      setStudentAttendanceMessage('⚠️ Please enter the 2-digit PIN broadcasted by your teacher.');
      return;
    }
    if (studentEnteredPin === broadcastPin) {
      setStudentAttendanceMarked(true);
      setStudentAttendanceMessage(`✅ Verified! Attendance marked successfully for ${activeSubjectCode}.`);
      setCurrentAttendanceCount((prev) => prev + 1);
    } else {
      setStudentAttendanceMessage(`❌ Invalid PIN. Broadcast PIN is "${broadcastPin}".`);
    }
  };

  const resetStudentAttendance = () => {
    setStudentAttendanceMarked(false);
    setStudentEnteredPin('');
    setStudentAttendanceMessage(null);
  };

  const startClassAttendanceFromSchedule = (item: ClassScheduleItem) => {
    setActiveSubjectCode(item.courseCode);
    setActiveSubjectName(item.courseName);
    setActiveClassroom(item.classroom);
    navigateTo('TEACHER_BROADCAST_SETUP');
  };

  const uploadCustomTimetable = (name: string) => {
    setUploadedTimetableName(name);
    setUserNotification(`Uploaded & synced custom timetable: ${name}`);
  };

  const incrementPhysicalHeadcount = () => setPhysicalHeadcount((prev) => prev + 1);
  const decrementPhysicalHeadcount = () => setPhysicalHeadcount((prev) => Math.max(0, prev - 1));
  const toggleAuditMode = () => setIsAuditModeActive((prev) => !prev);
  const startBroadcastTimer = () => {
    setIsBroadcasting(true);
    setBroadcastSecondsLeft(165);
  };
  const stopBroadcastTimer = () => setIsBroadcasting(false);

  const toggleRecordAttendance = (sNo: string) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.sNo === sNo ? { ...r, isPresent: !r.isPresent } : r))
    );
  };

  const filteredRecords = attendanceRecords.filter((rec) => {
    const matchesSearch =
      rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.courseType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDeptFilter === 'All' || rec.dept === selectedDeptFilter;
    const matchesCat = selectedCategoryFilter === 'All' || rec.courseType === selectedCategoryFilter;
    return matchesSearch && matchesDept && matchesCat;
  });

  const sampleStudentRoster: SubjectRosterItem[] = [
    { sNo: '01', code: 'CIUCMJT2', type: 'Major', subjectName: 'Operating Systems', offeringDept: 'CSIT', credits: 4 },
    { sNo: '02', code: 'CIUCMJT1', type: 'Major', subjectName: 'Relational Database Management System', offeringDept: 'CSIT', credits: 3 },
    { sNo: '03', code: 'SECC13', type: 'SEC', subjectName: 'DBMS', offeringDept: 'CSIT', credits: 3 },
    { sNo: '04', code: 'AECESUT1', type: 'AEC', subjectName: 'Soft Skills', offeringDept: 'English', credits: 2 },
    { sNo: '05', code: 'VOCCIT03', type: 'VAC', subjectName: 'Python Programming', offeringDept: 'CSIT', credits: 1 },
  ];

  const sampleUgSessions: TeacherClassSession[] = [
    { sNo: '1', subjectCode: 'CIUCMJT2', subjectName: 'Operating Systems', allotTime: '10:15 AM', offeringDept: 'CSIT', courseType: 'Major' },
    { sNo: '2', subjectCode: 'CIUCMJT1', subjectName: 'Relational Database Management System', allotTime: '11:30 AM', offeringDept: 'CSIT', courseType: 'Major' },
    { sNo: '3', subjectCode: 'SECC13', subjectName: 'DBMS Lab', allotTime: '01:15 PM', offeringDept: 'CSIT', courseType: 'SEC' },
  ];

  return (
    <AttendanceContext.Provider
      value={{
        currentScreen,
        currentRole,
        authTab,
        selectRole,
        switchRole,
        setAuthTab,
        navigateTo,
        goBack,
        studentEnrollment,
        setStudentEnrollment,
        studentPassword,
        setStudentPassword,
        teacherFacultyId,
        setTeacherFacultyId,
        teacherPassword,
        setTeacherPassword,
        studentRegName,
        setStudentRegName,
        studentRegEnrollment,
        setStudentRegEnrollment,
        studentRegEmail,
        setStudentRegEmail,
        studentCourseLevel,
        setStudentCourseLevel,
        studentDepartment,
        setStudentDepartment,
        studentRegPassword,
        setStudentRegPassword,
        studentRegConfirmPassword,
        setStudentRegConfirmPassword,
        teacherRegName,
        setTeacherRegName,
        teacherRegFacultyId,
        setTeacherRegFacultyId,
        teacherRegEmail,
        setTeacherRegEmail,
        teacherDepartment,
        setTeacherDepartment,
        teacherRegPassword,
        setTeacherRegPassword,
        teacherRegConfirmPassword,
        setTeacherRegConfirmPassword,
        broadcastPin,
        appendBroadcastPinDigit,
        backspaceBroadcastPin,
        clearBroadcastPin,
        isBroadcasting,
        broadcastSecondsLeft,
        currentAttendanceCount,
        totalAttendanceTarget,
        recentJoins,
        physicalHeadcount,
        incrementPhysicalHeadcount,
        decrementPhysicalHeadcount,
        isAuditModeActive,
        toggleAuditMode,
        startBroadcastTimer,
        stopBroadcastTimer,
        activeSubjectCode,
        activeSubjectName,
        activeClassroom,
        startClassAttendanceFromSchedule,
        studentEnteredPin,
        appendStudentPinDigit,
        backspaceStudentPin,
        clearStudentPin,
        studentAttendanceMarked,
        studentAttendanceMessage,
        submitStudentAttendance,
        resetStudentAttendance,
        campusGeofence,
        selectedDaySchedule,
        setSelectedDaySchedule,
        teacherDailySchedule,
        studentScheduleList,
        gguOfficialCourses: GGU_OFFICIAL_COURSE_SELECTIONS,
        uploadCustomTimetable,
        uploadedTimetableName,
        sampleStudentRoster,
        sampleUgSessions,
        attendanceRecords,
        toggleRecordAttendance,
        searchQuery,
        setSearchQuery,
        selectedDeptFilter,
        setSelectedDeptFilter,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
        filteredRecords,
        isProfileSheetOpen,
        setIsProfileSheetOpen,
        isExportModalOpen,
        setIsExportModalOpen,
        isDocPreviewOpen,
        setIsDocPreviewOpen,
        userNotification,
        setUserNotification,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
