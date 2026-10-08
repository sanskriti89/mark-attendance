import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { ClassScheduleItem } from '../data/types';

export const TeacherDashboardScreen: React.FC = () => {
  const {
    teacherRegName,
    teacherDepartment,
    teacherDailySchedule,
    selectedDaySchedule,
    setSelectedDaySchedule,
    startClassAttendanceFromSchedule,
    navigateTo,
    goBack,
    setIsProfileSheetOpen,
  } = useAttendance();

  const teacherName = teacherRegName || 'Dr. Eleanor Vance';
  const department = teacherDepartment || 'CSIT';

  const days = ['Today', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={goBack}>
            <MaterialIcons name="arrow-back" size={20} color={Colors.slate700} />
          </TouchableOpacity>
          <View>
            <Text style={styles.subBrand}>FACULTY SCHEDULE HUB</Text>
            <Text style={styles.brandTitle}>Guru Ghasidas Vishwavidyalaya</Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.reportsPill}
            onPress={() => navigateTo('TEACHER_REPORT')}
          >
            <MaterialIcons name="assessment" size={16} color={Colors.teacherOrangeDark} />
            <Text style={styles.reportsPillText}>Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => setIsProfileSheetOpen(true)}
          >
            <MaterialIcons name="person" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Faculty Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.pillLight}>
              <Text style={styles.pillLightText}>TODAY'S TEACHING TIMETABLE</Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live On-Campus</Text>
            </View>
          </View>

          <Text style={styles.heroName}>{teacherName}</Text>
          <Text style={styles.heroSub}>
            Department of {department} • {teacherDailySchedule.length} Teaching Slots
            Scheduled Today
          </Text>
        </View>

        {/* Day Selector Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
          {days.map((day) => {
            const isSelected = selectedDaySchedule === day;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, isSelected && styles.activeDayChip]}
                onPress={() => setSelectedDaySchedule(day)}
              >
                <Text
                  style={[styles.dayChipText, isSelected && styles.activeDayChipText]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Schedule Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Assigned Classes ({teacherDailySchedule.length})
          </Text>
          <Text style={styles.sectionSub}>Tap to start attendance</Text>
        </View>

        {/* Schedule Class Cards */}
        {teacherDailySchedule.map((item) => (
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

              {item.isOngoing && (
                <View style={styles.ongoingBadge}>
                  <View style={styles.ongoingDot} />
                  <Text style={styles.ongoingText}>Current Slot</Text>
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

            <View style={styles.actionRow}>
              <View style={styles.deptMeta}>
                <Text style={styles.deptText}>Dept: {item.department}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.startAttendanceBtn,
                  item.isOngoing && styles.startAttendanceBtnOngoing,
                ]}
                onPress={() => startClassAttendanceFromSchedule(item)}
              >
                <MaterialIcons name="sensors" size={16} color={Colors.white} />
                <Text style={styles.startAttendanceText}>START ATTENDANCE</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    color: Colors.teacherOrange,
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.slate800,
  },
  reportsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.teacherOrangeLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reportsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.teacherOrangeDark,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.teacherOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 90,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#EA580C',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A7F3D0',
  },
  liveText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
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
  dayScroll: {
    flexDirection: 'row',
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slate200,
    marginRight: 8,
  },
  activeDayChip: {
    backgroundColor: Colors.teacherOrange,
    borderColor: Colors.teacherOrange,
  },
  dayChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.slate700,
  },
  activeDayChipText: {
    color: Colors.white,
    fontWeight: '800',
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
    borderColor: Colors.teacherOrange,
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
    paddingTop: 10,
    marginTop: 2,
  },
  deptMeta: {
    flex: 1,
  },
  deptText: {
    fontSize: 11,
    color: Colors.slate500,
    fontWeight: '500',
  },
  startAttendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.teacherOrange,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startAttendanceBtnOngoing: {
    backgroundColor: Colors.teacherOrangeDark,
  },
  startAttendanceText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
