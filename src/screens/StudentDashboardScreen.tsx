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
import { SlideToConfirmButton } from '../components/SlideToConfirmButton';

export const StudentDashboardScreen: React.FC = () => {
  const {
    studentRegName,
    studentEnrollment,
    studentScheduleList,
    navigateTo,
    goBack,
    setIsProfileSheetOpen,
    uploadCustomTimetable,
    uploadedTimetableName,
    isBroadcasting,
    activeSubjectCode,
    activeSubjectName,
    activeClassroom,
    gguOfficialCourses,
  } = useAttendance();

  const studentName = studentRegName || 'ANAND MOHAN KUMAR';
  const enrolmentNo = studentEnrollment || 'GGV/25/250/0024';

  const handleTimetableUpload = () => {
    Alert.alert(
      'Upload Timetable',
      'Select university timetable PDF from device storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload Sample_Timetable_NEP2020.pdf',
          onPress: () => uploadCustomTimetable('Sample_Timetable_NEP2020.pdf'),
        },
      ]
    );
  };

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
              <Text style={styles.pillLightText}>3RD SEMESTER • BSCS (NEP 2020)</Text>
            </View>
            <View style={styles.pillLight}>
              <Text style={styles.pillLightText}>Major: CSIT</Text>
            </View>
          </View>

          <Text style={styles.heroName}>{studentName}</Text>
          <Text style={styles.heroSub}>
            Enrolment: {enrolmentNo} • 8 Enrolled Courses (20 Credits)
          </Text>
        </View>

        {/* Live Attendance Banner (if teacher is broadcasting or ongoing class) */}
        <View style={styles.liveBannerCard}>
          <View style={styles.liveHeaderRow}>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.pulsingDot} />
              <Text style={styles.liveAlertTitle}>
                {isBroadcasting
                  ? 'TRANSMITTER ACTIVE • READY TO CHECK IN'
                  : 'ONGOING CLASS IN PROGRESS'}
              </Text>
            </View>
            <View style={styles.roomPill}>
              <MaterialIcons name="place" size={12} color={Colors.studentTeal} />
              <Text style={styles.roomPillText}>{activeClassroom}</Text>
            </View>
          </View>

          <Text style={styles.liveSubjectTitle}>
            {activeSubjectCode}: {activeSubjectName}
          </Text>
          <Text style={styles.liveProf}>Dr. Eleanor Vance • 10:15 AM - 11:15 AM</Text>

          <View style={styles.slideActionWrapper}>
            <SlideToConfirmButton
              title="SLIDE TO ENTER PIN & ATTEND"
              brandColor={Colors.studentTeal}
              onConfirmed={() => navigateTo('STUDENT_ATTENDANCE')}
            />
          </View>
        </View>

        {/* Timetable Sync & Upload Card */}
        <View style={styles.syncCard}>
          <View style={styles.syncLeft}>
            <View style={styles.syncIconBg}>
              <MaterialIcons name="calendar-month" size={22} color={Colors.studentTeal} />
            </View>
            <View>
              <Text style={styles.syncTitle}>University Timetable</Text>
              <Text style={styles.syncSub}>
                {uploadedTimetableName || 'Official GGU SoS E&T Schedule Active'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.syncBtn} onPress={handleTimetableUpload}>
            <MaterialIcons name="file-upload" size={16} color={Colors.studentTeal} />
            <Text style={styles.syncBtnText}>Sync PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Today's Classes ({studentScheduleList.length})
          </Text>
          <Text style={styles.sectionSub}>GGU Bilaspur Campus</Text>
        </View>

        {studentScheduleList.map((item) => (
          <View
            key={item.id}
            style={[styles.classCard, item.isOngoing && styles.classCardOngoing]}
          >
            <View style={styles.classCardTop}>
              <View style={styles.classBadges}>
                <View style={styles.courseCodeBadge}>
                  <Text style={styles.courseCodeText}>{item.courseCode}</Text>
                </View>
                <View style={styles.creditsBadge}>
                  <Text style={styles.creditsText}>
                    {item.courseType} • {item.credits} Credits
                  </Text>
                </View>
              </View>

              {item.isOngoing ? (
                <View style={styles.ongoingBadge}>
                  <View style={styles.ongoingDot} />
                  <Text style={styles.ongoingText}>Current Slot</Text>
                </View>
              ) : (
                <View style={styles.attendancePctBadge}>
                  <Text style={styles.attendancePctText}>
                    {item.studentAttendancePct || 85}% Attendance
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.courseName}>{item.courseName}</Text>

            <View style={styles.classMetaRow}>
              <View style={styles.metaItem}>
                <MaterialIcons name="schedule" size={14} color={Colors.slate400} />
                <Text style={styles.metaText}>{item.timeSlot}</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="place" size={14} color={Colors.slate400} />
                <Text style={styles.metaText}>{item.classroom}</Text>
              </View>
            </View>

            <View style={styles.profRow}>
              <Text style={styles.profText}>Faculty: {item.teacherName}</Text>
              {item.isOngoing && (
                <TouchableOpacity
                  style={styles.markPillBtn}
                  onPress={() => navigateTo('STUDENT_ATTENDANCE')}
                >
                  <Text style={styles.markPillText}>Mark Attendance</Text>
                  <MaterialIcons name="arrow-forward" size={14} color={Colors.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Enrolled Courses Summary */}
        <View style={styles.coursesCard}>
          <Text style={styles.coursesTitle}>
            NEP 2020 Registered Subjects ({gguOfficialCourses.length})
          </Text>
          {gguOfficialCourses.map((c) => (
            <View key={c.sNo} style={styles.courseItem}>
              <View style={styles.courseItemLeft}>
                <Text style={styles.courseNum}>#{c.sNo}</Text>
                <View>
                  <Text style={styles.courseNameSub}>{c.courseName}</Text>
                  <Text style={styles.courseCodeSub}>
                    {c.courseCode} • {c.type}
                  </Text>
                </View>
              </View>
              <Text style={styles.courseCredits}>{c.credits} Credits</Text>
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
  classCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.slate200,
    gap: 8,
  },
  classCardOngoing: {
    borderColor: Colors.studentTeal,
    borderWidth: 1.5,
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
