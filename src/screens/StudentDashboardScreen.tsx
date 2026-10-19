import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { api } from '../services/api';
import { SlideToConfirmButton } from '../components/SlideToConfirmButton';
import { GGU_OFFICIAL_COURSE_SELECTIONS } from '../data/gguUniversityData';

export const StudentDashboardScreen: React.FC = () => {
  const {
    studentRegName,
    studentEnrollment,
    studentRegEnrollment,
    studentDepartment,
    studentCourseLevel,
    studentMajor,
    studentProgrammeName,
    studentEnrolledCourses,
    navigateTo,
    goBack,
    setIsProfileSheetOpen,
    isBroadcasting,
    broadcastSecondsLeft,
    teacherRegName,
    activeSubjectCode,
    activeSubjectName,
    activeClassroom,
    gguOfficialCourses,
  } = useAttendance();

  const studentName = studentRegName || studentEnrollment || 'Student';
  const enrolmentNo = studentEnrollment || studentRegEnrollment || 'Pending Verification';

  const normalizedRegisteredCourses = React.useMemo(() => {
    if (studentEnrolledCourses && studentEnrolledCourses.length > 0) {
      return studentEnrolledCourses.map((c, idx) => {
        if (typeof c === 'object' && c !== null) {
          const matchedOfficial = GGU_OFFICIAL_COURSE_SELECTIONS.find(
            (o) => o.courseCode.toUpperCase() === (c.courseCode || '').toUpperCase()
          );
          return {
            sNo: c.sNo || idx + 1,
            courseCode: c.courseCode || `SUB${idx + 1}`,
            courseName: c.courseName || matchedOfficial?.courseName || c.courseCode || 'Course',
            credits: c.credits || matchedOfficial?.credits || 3.0,
            type: c.type || matchedOfficial?.type || 'Major',
            term: c.term || matchedOfficial?.term || '3 SEMESTER',
          };
        }
        const str = String(c);
        const parts = str.split(':');
        const code = parts[0]?.trim() || `SUB${idx + 1}`;
        const rawName = parts[1]?.trim();
        const matchedOfficial = GGU_OFFICIAL_COURSE_SELECTIONS.find(
          (o) => o.courseCode.toUpperCase() === code.toUpperCase()
        );
        return {
          sNo: idx + 1,
          courseCode: code,
          courseName: rawName || matchedOfficial?.courseName || code,
          credits: matchedOfficial?.credits || 3.0,
          type: matchedOfficial?.type || (code.includes('MJ') ? 'Major' : 'Registered Subject'),
          term: matchedOfficial?.term || '3 SEMESTER',
        };
      });
    }
    return gguOfficialCourses;
  }, [studentEnrolledCourses, gguOfficialCourses]);

  const totalCredits = React.useMemo(() => {
    return normalizedRegisteredCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  }, [normalizedRegisteredCourses]);

  // Accurately resolve student Major matching Programme Name or Enrolled Courses
  const resolvedMajor = React.useMemo(() => {
    // 1. Explicit Major from profile/auth
    if (studentMajor && studentMajor.trim()) {
      return studentMajor.trim();
    }

    // 2. Derive accurately from Programme Name / Course Level
    const prog = (studentProgrammeName || studentCourseLevel || '').toUpperCase();
    if (prog.includes('COMPUTER SCIENCE & ENGINEERING') || prog.includes('CSE')) {
      return 'Computer Science & Engineering';
    }
    if (prog.includes('INFORMATION TECHNOLOGY') || prog.includes(' B.TECH IT') || prog.includes(' BTECH IT')) {
      return 'Information Technology';
    }
    if (prog.includes('COMPUTER APPLICATION') || prog.includes('BCA') || prog.includes('MCA')) {
      return 'Computer Applications';
    }
    if (prog.includes('COMPUTER SCIENCE') || prog.includes('BSCS') || prog.includes('B.SC (CS)')) {
      return 'Computer Science';
    }
    if (prog.includes('ELECTRONICS') || prog.includes('ECE')) {
      return 'Electronics & Communication';
    }
    if (prog.includes('MECHANICAL') || prog.includes('MECH')) {
      return 'Mechanical Engineering';
    }
    if (prog.includes('CIVIL')) {
      return 'Civil Engineering';
    }
    if (prog.includes('CHEMICAL')) {
      return 'Chemical Engineering';
    }
    if (prog.includes('MATHEMATICS') || prog.includes('MATH')) {
      return 'Mathematics';
    }
    if (prog.includes('PHYSICS')) {
      return 'Physics';
    }
    if (prog.includes('BIOTECHNOLOGY') || prog.includes('BIOTECH')) {
      return 'Biotechnology';
    }
    if (prog.includes('COMMERCE') || prog.includes('B.COM')) {
      return 'Commerce';
    }
    if (prog.includes('MANAGEMENT') || prog.includes('MBA') || prog.includes('BBA')) {
      return 'Management Studies';
    }
    if (prog.includes('PHARMACY') || prog.includes('B.PHARM')) {
      return 'Pharmacy';
    }

    // 3. Derive accurately from Courses Enrolled In (checking Major subjects)
    if (normalizedRegisteredCourses && normalizedRegisteredCourses.length > 0) {
      for (const c of normalizedRegisteredCourses) {
        const code = (c.courseCode || '').toUpperCase();
        const name = (c.courseName || '').toUpperCase();
        const type = (c.type || '').toUpperCase();

        if (type.includes('MAJOR') || code.includes('MJT') || code.includes('MJL')) {
          if (
            code.startsWith('CI') ||
            /OPERATING|DATABASE|RDBMS|DATA STRUCTURE|ALGORITHM|PYTHON|JAVA|SOFTWARE|COMPUTER/i.test(name)
          ) {
            return 'Computer Science';
          }
          if (code.startsWith('CS') || code.startsWith('CSE')) return 'Computer Science & Engineering';
          if (code.startsWith('IT')) return 'Information Technology';
          if (code.startsWith('EC')) return 'Electronics & Communication';
          if (code.startsWith('ME')) return 'Mechanical Engineering';
          if (code.startsWith('CE')) return 'Civil Engineering';
          if (code.startsWith('MA')) return 'Mathematics';
          if (code.startsWith('PH')) return 'Physics';
        }
      }
    }

    // 4. Derive from Department name / code
    const dept = (studentDepartment || '').toUpperCase();
    if (dept.includes('CSIT') || dept.includes('COMPUTER SCIENCE & INFORMATION TECHNOLOGY')) {
      return 'Computer Science';
    }
    if (dept.includes('CSE')) return 'Computer Science & Engineering';
    if (dept.includes('IT')) return 'Information Technology';
    if (dept.includes('ECE')) return 'Electronics & Communication';
    if (dept.includes('MECH')) return 'Mechanical Engineering';
    if (dept.includes('CIVIL')) return 'Civil Engineering';
    if (dept.includes('MATH')) return 'Mathematics';
    if (dept.includes('PHYSICS')) return 'Physics';
    if (dept.includes('COMMERCE')) return 'Commerce';
    if (dept.includes('MANAGEMENT')) return 'Management Studies';
    if (dept.includes('PHARMACY')) return 'Pharmacy';

    return studentDepartment || 'Computer Science';
  }, [studentMajor, studentProgrammeName, studentCourseLevel, studentDepartment, normalizedRegisteredCourses]);

  const resolvedProgrammeOrLevel = React.useMemo(() => {
    if (studentProgrammeName && studentProgrammeName.trim()) {
      return studentProgrammeName.trim();
    }
    if (studentCourseLevel && studentCourseLevel.trim()) {
      return studentCourseLevel.trim();
    }
    return '3RD SEMESTER • BSCS (NEP 2020)';
  }, [studentProgrammeName, studentCourseLevel]);

  // Live session check from backend or local broadcast state
  const [backendSession, setBackendSession] = React.useState<any>(null);
  const [isRefreshingSession, setIsRefreshingSession] = React.useState(false);

  const checkLiveSession = React.useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshingSession(true);
    try {
      const res = await api.getActiveSession();
      if (res && res.success && res.hasActiveSession && res.session) {
        setBackendSession(res.session);
      } else {
        setBackendSession(null);
      }
    } catch (e) {
      // silently ignore network issues
    } finally {
      if (showIndicator) {
        setTimeout(() => setIsRefreshingSession(false), 500);
      }
    }
  }, []);

  React.useEffect(() => {
    checkLiveSession();
    const interval = setInterval(() => {
      checkLiveSession(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [checkLiveSession]);

  const hasLiveBroadcast = isBroadcasting || (backendSession && backendSession.status === 'ACTIVE');

  const liveCourseCode = backendSession?.courseCode || activeSubjectCode || 'CIUCMJT2';
  const liveCourseName = backendSession?.courseName || activeSubjectName || 'Operating Systems';
  const liveClassroom = backendSession?.classroom || activeClassroom || 'CSIT Lab 2 / Room FB';
  const liveTeacher = backendSession?.teacherName || teacherRegName || 'Dr. Eleanor Vance';
  const liveMinutes = Math.floor((broadcastSecondsLeft || 165) / 60);
  const liveSeconds = (broadcastSecondsLeft || 165) % 60;
  const liveTimer = `${String(liveMinutes).padStart(2, '0')}:${String(liveSeconds).padStart(2, '0')}`;


  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={goBack}>
            <MaterialIcons name="arrow-back" size={20} color={Colors.slate700} />
          </TouchableOpacity>
          <View>
            <Text style={styles.subBrand}>STUDENT ACADEMIC HUB</Text>
            <Text style={styles.brandTitle}>Guru Ghasidas Vishwavidyalaya</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => setIsProfileSheetOpen(true)}
        >
          <MaterialIcons name="person" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Student Hero Profile Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.pillLight}>
              <Text style={styles.pillLightText}>
                {resolvedProgrammeOrLevel}
              </Text>
            </View>
            <View style={styles.pillLight}>
              <Text style={styles.pillLightText}>
                Major: {resolvedMajor}
              </Text>
            </View>
          </View>

          <Text style={styles.heroName}>{studentName}</Text>
          <Text style={styles.heroSub}>
            Enrolment: {enrolmentNo} • {normalizedRegisteredCourses.length} Registered Subjects ({totalCredits} Credits)
          </Text>
        </View>


        {/* Live Attendance Broadcast Section (Only shows class when teacher broadcasts) */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={[
                styles.liveStatusDot,
                { backgroundColor: hasLiveBroadcast ? Colors.emeraldCheck : Colors.slate400 },
              ]}
            />
            <Text style={styles.sectionTitle}>
              Live Attendance Broadcast {hasLiveBroadcast ? '(1 Live)' : '(0 Active)'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.radarScanBtn}
            onPress={() => checkLiveSession(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="sync"
              size={14}
              color={Colors.studentTeal}
            />
            <Text style={styles.radarScanBtnText}>
              {isRefreshingSession ? 'Scanning...' : 'Scan Radar'}
            </Text>
          </TouchableOpacity>
        </View>

        {hasLiveBroadcast ? (
          /* Only shown when teacher has broadcasted attendance */
          <View style={styles.liveBroadcastCard}>
            <View style={styles.liveCardHeader}>
              <View style={styles.livePulseBadge}>
                <View style={styles.pulsingDot} />
                <Text style={styles.livePulseText}>TRANSMITTER ACTIVE • READY TO CHECK IN</Text>
              </View>
              <View style={styles.roomPill}>
                <MaterialIcons name="place" size={12} color={Colors.studentTeal} />
                <Text style={styles.roomPillText}>{liveClassroom}</Text>
              </View>
            </View>

            <View style={styles.liveClassMain}>
              <View style={styles.courseCodeBadge}>
                <Text style={styles.courseCodeText}>{liveCourseCode}</Text>
              </View>
              <Text style={styles.liveSubjectTitle}>
                {liveCourseCode}: {liveCourseName}
              </Text>
            </View>

            <View style={styles.liveClassMetaRow}>
              <View style={styles.metaItem}>
                <MaterialIcons name="person" size={14} color={Colors.slate500} />
                <Text style={styles.metaText}>Faculty: {liveTeacher}</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="timer" size={14} color={Colors.studentTeal} />
                <Text style={[styles.metaText, { color: Colors.studentTeal, fontWeight: '700' }]}>
                  {liveTimer} Left
                </Text>
              </View>
            </View>

            <View style={styles.slideActionWrapper}>
              <SlideToConfirmButton
                title="SLIDE TO ENTER PIN & ATTEND"
                brandColor={Colors.studentTeal}
                onConfirmed={() => navigateTo('STUDENT_ATTENDANCE')}
              />
            </View>
          </View>
        ) : (
          /* Shown when NO teacher is broadcasting */
          <View style={styles.emptyBroadcastCard}>
            <View style={styles.radarIconCircle}>
              <MaterialIcons name="sensors-off" size={28} color={Colors.slate400} />
            </View>
            <Text style={styles.emptyBroadcastTitle}>No Live Attendance Broadcast Active</Text>
            <Text style={styles.emptyBroadcastSubtitle}>
              Class attendance check-in only appears here when your course teacher starts wireless broadcasting.
            </Text>
            <View style={styles.radarListeningRow}>
              <View style={styles.radarListeningDot} />
              <Text style={styles.radarListeningText}>
                Wireless radar listening for classroom transmitter...
              </Text>
            </View>
          </View>
        )}

        {/* Enrolled Courses Summary */}
        <View style={styles.coursesCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={styles.coursesTitle}>
                Official Registered Subjects ({normalizedRegisteredCourses.length})
              </Text>
              <Text style={{ fontSize: 11, color: Colors.slate500, marginTop: 2 }}>
                Verified via GGU Samarth Course Selection Slip
              </Text>
            </View>
            <View style={{ backgroundColor: Colors.studentTealLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.studentTeal }}>
                {totalCredits} Total Credits
              </Text>
            </View>
          </View>

          {normalizedRegisteredCourses.map((c, idx) => (
            <View key={(c.courseCode || 'course') + '-' + (c.sNo || idx)} style={styles.courseItem}>
              <View style={styles.courseItemLeft}>
                <Text style={styles.courseNum}>#{c.sNo || idx + 1}</Text>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.courseNameSub}>{c.courseName}</Text>
                  <Text style={styles.courseCodeSub}>
                    {c.courseCode} • {c.type || 'Registered Course'}
                  </Text>
                </View>
              </View>
              <Text style={styles.courseCredits}>{c.credits || 3} Credits</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subBrand: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.studentTeal,
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.slate800,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.studentTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 90,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#0D9488',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pillLight: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillLightText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 4,
  },
  heroSub: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.9)',
  },
  liveBannerCard: {
    backgroundColor: Colors.studentTealLight,
    borderWidth: 1.5,
    borderColor: Colors.studentTealSoft,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  liveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.studentTeal,
  },
  liveAlertTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.studentTealDark,
    letterSpacing: 0.5,
  },
  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roomPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.studentTealDark,
  },
  liveSubjectTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.slate900,
  },
  liveProf: {
    fontSize: 11.5,
    color: Colors.slate600,
  },
  slideActionWrapper: {
    marginTop: 8,
  },
  syncCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.slate200,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.studentTealLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
  },
  syncSub: {
    fontSize: 10.5,
    color: Colors.slate500,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.studentTealLight,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.studentTeal,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.slate800,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.slate400,
  },
  liveStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radarScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.studentTealLight,
  },
  radarScanBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.studentTeal,
  },
  liveBroadcastCard: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: Colors.studentTeal,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: Colors.studentTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  liveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.studentTealDark,
    letterSpacing: 0.5,
  },
  liveClassMain: {
    gap: 4,
  },
  liveClassMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 148, 136, 0.15)',
  },
  emptyBroadcastCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.slate200,
    borderStyle: 'dashed',
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  radarIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyBroadcastTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.slate700,
    textAlign: 'center',
  },
  emptyBroadcastSubtitle: {
    fontSize: 11.5,
    color: Colors.slate500,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 290,
  },
  radarListeningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: Colors.slate50,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  radarListeningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.studentTeal,
  },
  radarListeningText: {
    fontSize: 10.5,
    color: Colors.slate600,
    fontWeight: '600',
  },
  classCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseCodeBadge: {
    backgroundColor: Colors.deptCsitBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  courseCodeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.deptCsitText,
  },
  creditsBadge: {
    backgroundColor: Colors.slate100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  creditsText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.slate600,
  },
  ongoingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ongoingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  ongoingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  attendancePctBadge: {
    backgroundColor: Colors.successGreenLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  attendancePctText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.emeraldCheck,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.slate900,
  },
  classMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.slate500,
  },
  profRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
    paddingTop: 8,
  },
  profText: {
    fontSize: 11,
    color: Colors.slate600,
    fontWeight: '500',
  },
  markPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.studentTeal,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  markPillText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  coursesCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.slate200,
    gap: 10,
  },
  coursesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.slate700,
    letterSpacing: 0.5,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  courseItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  courseNum: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate400,
    width: 20,
  },
  courseNameSub: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate800,
  },
  courseCodeSub: {
    fontSize: 10,
    color: Colors.slate400,
  },
  courseCredits: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.studentTeal,
  },
});
