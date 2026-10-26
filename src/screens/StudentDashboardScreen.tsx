import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { api } from '../services/api';

export const StudentDashboardScreen: React.FC = () => {
  const {
    studentRegName,
    studentEnrollment,
    studentRegEnrollment,
    studentDepartment,
    studentCourseLevel,
    studentEnrolledCourses,
    navigateTo,
    goBack,
    setIsProfileSheetOpen,
    uploadCustomTimetable,
    uploadedTimetableName,
    isBroadcasting,
    broadcastSecondsLeft,
    teacherRegName,
    activeSubjectCode,
    setActiveSubjectCode,
    activeSubjectName,
    setActiveSubjectName,
    activeClassroom,
    setActiveClassroom,
    clearStudentPin,
    resetStudentAttendance,
    signOut,
  } = useAttendance();

  const dotPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 1.45,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const studentName = studentRegName || studentEnrollment || 'Student';
  const enrolmentNo = studentEnrollment || studentRegEnrollment || 'Pending Verification';

  // Dynamic semester detection: checks studentCourseLevel string, batch year, course terms, course codes, or defaults
  const detectedSemester = React.useMemo(() => {
    const levelStr = (studentCourseLevel || '').toUpperCase();
    const isBatch25 = Boolean(enrolmentNo && (/GGV\/25\//i.test(enrolmentNo) || enrolmentNo.includes('/25/')));

    if (/\b(?:1ST|FIRST|1)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*1\b|\bI\s*SEMESTER\b/.test(levelStr)) {
      return '1ST SEMESTER';
    }
    if (/\b(?:2ND|SECOND|2)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*2\b|\bII\s*SEMESTER\b/.test(levelStr)) {
      return '2ND SEMESTER';
    }
    if (/\b(?:3RD|THIRD|3)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*3\b|\bIII\s*SEMESTER\b/.test(levelStr)) {
      if (isBatch25) return '1ST SEMESTER';
      return '3RD SEMESTER';
    }
    if (/\b(?:4TH|FOURTH|4)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*4\b|\bIV\s*SEMESTER\b/.test(levelStr)) {
      return '4TH SEMESTER';
    }
    if (/\b(?:5TH|FIFTH|5)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*5\b|\bV\s*SEMESTER\b/.test(levelStr)) {
      return '5TH SEMESTER';
    }
    if (/\b(?:6TH|SIXTH|6)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*6\b|\bVI\s*SEMESTER\b/.test(levelStr)) {
      return '6TH SEMESTER';
    }
    if (/\b(?:7TH|SEVENTH|7)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*7\b|\bVII\s*SEMESTER\b/.test(levelStr)) {
      return '7TH SEMESTER';
    }
    if (/\b(?:8TH|EIGHTH|8)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*8\b|\bVIII\s*SEMESTER\b/.test(levelStr)) {
      return '8TH SEMESTER';
    }

    if (isBatch25) {
      return '1ST SEMESTER';
    }

    // Check enrolled course objects
    if (Array.isArray(studentEnrolledCourses)) {
      for (const c of studentEnrolledCourses) {
        if (typeof c === 'object' && c !== null) {
          const t = String(c.term || '').toUpperCase();
          if (/\b(?:1ST|FIRST|1)\s*(?:SEM|SEMESTER)\b/.test(t)) return '1ST SEMESTER';
          if (/\b(?:2ND|SECOND|2)\s*(?:SEM|SEMESTER)\b/.test(t)) return '2ND SEMESTER';
          if (/\b(?:3RD|THIRD|3)\s*(?:SEM|SEMESTER)\b/.test(t)) return '3RD SEMESTER';
          if (/\b(?:4TH|FOURTH|4)\s*(?:SEM|SEMESTER)\b/.test(t)) return '4TH SEMESTER';
        }
      }
    }

    return '1ST SEMESTER';
  }, [studentCourseLevel, studentEnrolledCourses, enrolmentNo]);

  const normalizedRegisteredCourses = React.useMemo(() => {
    if (studentEnrolledCourses && studentEnrolledCourses.length > 0) {
      return studentEnrolledCourses.map((c, idx) => {
        let termStr = (typeof c === 'object' && c?.term) || detectedSemester || '1ST SEMESTER';
        if (detectedSemester === '1ST SEMESTER' && /3\s*SEMESTER|3RD\s*SEMESTER/i.test(termStr)) {
          termStr = '1 SEMESTER';
        }
        if (typeof c === 'object' && c !== null) {
          return {
            sNo: c.sNo || idx + 1,
            courseCode: c.courseCode || `SUB${idx + 1}`,
            courseName: c.courseName || c.courseCode || 'Course',
            credits: c.credits || 3.0,
            type: c.type || 'Major',
            term: termStr,
          };
        }
        const str = String(c);
        const parts = str.split(':');
        const code = parts[0]?.trim() || `SUB${idx + 1}`;
        const name = parts[1]?.trim() || code;
        return {
          sNo: idx + 1,
          courseCode: code,
          courseName: name,
          credits: 3.0,
          type: 'Registered Subject',
          term: termStr,
        };
      });
    }
    return [];
  }, [studentEnrolledCourses, detectedSemester]);

  const totalCredits = React.useMemo(() => {
    return normalizedRegisteredCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  }, [normalizedRegisteredCourses]);

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

  const isSessionActive = Boolean(backendSession && backendSession.status === 'ACTIVE');

  // Verify that the student is officially enrolled in the active broadcast course
  const isStudentEnrolledInActiveCourse = React.useMemo(() => {
    if (!backendSession || !backendSession.courseCode) {
      return Boolean(isBroadcasting);
    }

    if (normalizedRegisteredCourses.length === 0) {
      return true;
    }

    const sessionCode = backendSession.courseCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return normalizedRegisteredCourses.some((c) => {
      const studentCode = (c.courseCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!studentCode) return false;
      if (studentCode === sessionCode) return true;
      if (studentCode.includes(sessionCode) || sessionCode.includes(studentCode)) return true;
      if (studentCode.length >= 5 && sessionCode.length >= 5 && studentCode.slice(0, 5) === sessionCode.slice(0, 5)) {
        return true;
      }
      return false;
    });
  }, [backendSession, normalizedRegisteredCourses, isBroadcasting]);

  const hasLiveBroadcast = (isBroadcasting || isSessionActive) && isStudentEnrolledInActiveCourse;
  const isOtherSubjectActive = isSessionActive && !isStudentEnrolledInActiveCourse;

  const liveCourseCode = backendSession?.courseCode || activeSubjectCode || 'CIUCMJT2';
  const liveCourseName = backendSession?.courseName || activeSubjectName || 'Operating Systems';
  const liveClassroom = backendSession?.classroom || activeClassroom || 'CSIT Lab 2 / Room FB';
  const liveTeacher = backendSession?.teacherName || teacherRegName || 'Dr. Eleanor Vance';
  const liveMinutes = Math.floor((broadcastSecondsLeft || 165) / 60);
  const liveSeconds = (broadcastSecondsLeft || 165) % 60;
  const liveTimer = `${String(liveMinutes).padStart(2, '0')}:${String(liveSeconds).padStart(2, '0')}`;

  // Dynamic program degree resolution: BCA vs B.Sc. (CS)
  const isBca =
    (studentCourseLevel && /BCA|COMPUTER\s*APPLICATION/i.test(studentCourseLevel)) ||
    (enrolmentNo && enrolmentNo.includes('/251/')) ||
    normalizedRegisteredCourses.some(
      (c: any) =>
        (c.code || c.courseCode || '').toUpperCase().startsWith('CA') ||
        (c.code || c.courseCode || '').toUpperCase().startsWith('BCA')
    );
  const degreeName = isBca ? 'BCA' : 'B.SC. (CS)';

  const displayProgram = React.useMemo(() => {
    if (studentCourseLevel && !['UG', 'PG', ''].includes(studentCourseLevel.trim()) && /SEMESTER/i.test(studentCourseLevel)) {
      if (enrolmentNo && /GGV\/25\//i.test(enrolmentNo) && /3RD|THIRD|3\s*SEM/i.test(studentCourseLevel)) {
        return studentCourseLevel.replace(/3RD\s*SEMESTER|3\s*SEMESTER/gi, '1ST SEMESTER');
      }
      return studentCourseLevel;
    }
    return `${detectedSemester} • ${degreeName} (NEP 2020)`;
  }, [studentCourseLevel, enrolmentNo, detectedSemester, degreeName]);

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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => setIsProfileSheetOpen(true)}
          >
            <MaterialIcons name="person" size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerLogoutBtn}
            onPress={signOut}
          >
            <MaterialIcons name="logout" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Student Hero Profile Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.pillLight}>
              <Text style={styles.pillLightText}>
                {displayProgram}
              </Text>
            </View>
            <View style={styles.pillLight}>
              <Text style={styles.pillLightText}>
                Department: {studentDepartment || 'CSIT'}
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
              {isRefreshingSession ? 'Scanning...' : 'Scan'}
            </Text>
          </TouchableOpacity>
        </View>

        {hasLiveBroadcast ? (
          /* Only shown when teacher has broadcasted attendance */
          <View style={styles.liveBroadcastCard}>
            <View style={styles.liveCardHeader}>
              <View style={styles.livePulseBadge}>
                <Animated.View style={[styles.pulsingDot, { transform: [{ scale: dotPulse }] }]} />
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
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.studentTeal,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  gap: 8,
                }}
                activeOpacity={0.8}
                onPress={() => {
                  if (backendSession) {
                    setActiveSubjectCode(backendSession.courseCode);
                    setActiveSubjectName(backendSession.courseName);
                    setActiveClassroom(backendSession.classroom);
                  }
                  clearStudentPin();
                  resetStudentAttendance();
                  navigateTo('STUDENT_ATTENDANCE');
                }}
              >
                <MaterialIcons name="check-circle" size={18} color={Colors.white} />
                <Text style={{ color: Colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }}>
                  TAP TO ENTER PIN & ATTEND
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : isOtherSubjectActive ? (
          /* Shown when teacher is broadcasting for another course not taken by this student */
          <View style={[styles.emptyBroadcastCard, { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' }]}>
            <View style={[styles.radarIconCircle, { backgroundColor: '#F1F5F9' }]}>
              <MaterialIcons name="lock" size={24} color={Colors.slate500} />
            </View>
            <Text style={[styles.emptyBroadcastTitle, { color: Colors.slate800 }]}>
              Class Broadcast Active (Different Course)
            </Text>
            <Text style={styles.emptyBroadcastSubtitle}>
              Faculty is currently broadcasting for {backendSession?.courseCode}: {backendSession?.courseName} in {backendSession?.classroom || 'Room FB'}. You are not registered for this course.
            </Text>
            <View style={{ backgroundColor: Colors.white, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 6 }}>
              <Text style={{ fontSize: 11, color: Colors.slate600, fontWeight: '600' }}>
                Your Registered Subjects ({normalizedRegisteredCourses.length}): {normalizedRegisteredCourses.map((c) => c.courseCode).join(', ')}
              </Text>
            </View>
          </View>
        ) : (
          /* Shown when NO teacher is broadcasting */
          <View style={styles.emptyBroadcastCard}>
            <View style={styles.radarIconCircle}>
              <MaterialIcons name="sensors-off" size={28} color={Colors.slate400} />
            </View>
            <Text style={styles.emptyBroadcastTitle}>No Live Attendance Broadcast Active</Text>
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

          {normalizedRegisteredCourses.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
              <MaterialIcons name="menu-book" size={32} color={Colors.slate400} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.slate700 }}>No Registered Subjects</Text>
              <Text style={{ fontSize: 12, color: Colors.slate500, textAlign: 'center', maxWidth: 280 }}>
                Upload your official GGU Course Selection Slip during registration to view your enrolled courses.
              </Text>
            </View>
          ) : (
            normalizedRegisteredCourses.map((c, idx) => (
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
            ))
          )}
        </View>

        {/* Bottom Sign Out Button */}
        <TouchableOpacity
          style={styles.bottomSignOutBtn}
          onPress={signOut}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={20} color="#DC2626" />
          <Text style={styles.bottomSignOutBtnText}>Sign Out from Student Portal</Text>
        </TouchableOpacity>
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
  headerLogoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1.5,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  bottomSignOutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
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
