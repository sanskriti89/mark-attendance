import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { CommonTopBar } from '../components/CommonTopBar';

export const TeacherReportScreen: React.FC = () => {
  const {
    filteredRecords,
    toggleRecordAttendance,
    searchQuery,
    setSearchQuery,
    selectedDeptFilter,
    setSelectedDeptFilter,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    physicalHeadcount,
    setIsExportModalOpen,
    userNotification,
    setUserNotification,
  } = useAttendance();

  const presentCount = filteredRecords.filter((r) => r.isPresent).length;
  const hasDiscrepancy = presentCount > physicalHeadcount;

  const deptList = ['All', 'CSIT', 'CSE', 'ECE', 'IT'];
  const categoryList = ['All', 'Major', 'Minor', 'SEC', 'VAC', 'AEC'];

  return (
    <View style={styles.container}>
      <CommonTopBar title="Attendance Report" />

      {/* Notification Toast */}
      {userNotification && (
        <View style={styles.notificationToast}>
          <MaterialIcons name="info" size={16} color={Colors.white} />
          <Text style={styles.notificationText}>{userNotification}</Text>
          <TouchableOpacity onPress={() => setUserNotification(null)}>
            <MaterialIcons name="close" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.courseCode}>CS401</Text>
              <Text style={styles.courseTitle}>Database Management Systems</Text>
            </View>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => setIsExportModalOpen(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="file-download" size={18} color={Colors.white} />
              <Text style={styles.exportBtnText}>Export CSV</Text>
            </TouchableOpacity>
          </View>

          {/* Counts */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricNum}>{filteredRecords.length}</Text>
              <Text style={styles.metricLabel}>Enrolled</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricNum, { color: Colors.emeraldCheck }]}>
                {presentCount}
              </Text>
              <Text style={styles.metricLabel}>Verified Present</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricNum}>{physicalHeadcount}</Text>
              <Text style={styles.metricLabel}>Physical Count</Text>
            </View>
          </View>

          {/* Discrepancy Alert */}
          {hasDiscrepancy && (
            <View style={styles.discrepancyBox}>
              <MaterialIcons name="warning" size={18} color={Colors.liveRed} />
              <Text style={styles.discrepancyText}>
                Audit Flag: {presentCount - physicalHeadcount} unverified digital
                attendee(s) detected above physical headcount!
              </Text>
            </View>
          )}
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={Colors.slate400} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search student, dept, course type..."
            placeholderTextColor={Colors.slate400}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={18} color={Colors.slate400} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips - Department */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {deptList.map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[
                styles.filterChip,
                selectedDeptFilter === dept && styles.activeFilterChip,
              ]}
              onPress={() => setSelectedDeptFilter(dept)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedDeptFilter === dept && styles.activeFilterChipText,
                ]}
              >
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter Chips - Category */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {categoryList.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategoryFilter === cat && styles.activeCategoryChip,
              ]}
              onPress={() => setSelectedCategoryFilter(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategoryFilter === cat && styles.activeCategoryChipText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Attendance List */}
        <View style={styles.rosterCard}>
          <Text style={styles.rosterHeader}>
            ATTENDANCE ROSTER ({filteredRecords.length})
          </Text>

          {filteredRecords.map((record) => (
            <View key={record.sNo} style={styles.recordItem}>
              <View style={styles.recordLeft}>
                <View style={styles.sNoBadge}>
                  <Text style={styles.sNoText}>{record.sNo}</Text>
                </View>
                <View>
                  <Text style={styles.studentName}>{record.studentName}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.deptBadge}>{record.dept}</Text>
                    <Text style={styles.courseTypeBadge}>{record.courseType}</Text>
                    <Text style={styles.checkInTime}>• {record.checkInTime}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.statusBadge,
                  record.isPresent ? styles.statusPresent : styles.statusAbsent,
                ]}
                onPress={() => toggleRecordAttendance(record.sNo)}
              >
                <MaterialIcons
                  name={record.isPresent ? 'check' : 'close'}
                  size={14}
                  color={record.isPresent ? Colors.emeraldCheck : Colors.liveRed}
                />
                <Text
                  style={[
                    styles.statusText,
                    record.isPresent
                      ? styles.statusPresentText
                      : styles.statusAbsentText,
                  ]}
                >
                  {record.isPresent ? 'Present' : 'Absent'}
                </Text>
              </TouchableOpacity>
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
    backgroundColor: Colors.white,
  },
  content: {
    padding: 20,
    paddingBottom: 80,
    gap: 16,
  },
  notificationToast: {
    backgroundColor: Colors.darkNavy,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  notificationText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  summaryCard: {
    backgroundColor: Colors.slate50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.slate200,
    gap: 14,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.teacherOrange,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate900,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.teacherOrange,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  exportBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricNum: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.slate800,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.slate200,
  },
  discrepancyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
  },
  discrepancyText: {
    fontSize: 12,
    color: Colors.liveRed,
    fontWeight: '600',
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.slate50,
    borderWidth: 1,
    borderColor: Colors.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.slate800,
  },
  chipRow: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.slate100,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: Colors.teacherOrange,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  activeFilterChipText: {
    color: Colors.white,
    fontWeight: '700',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Colors.slate100,
    marginRight: 6,
  },
  activeCategoryChip: {
    backgroundColor: Colors.slate800,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate600,
  },
  activeCategoryChipText: {
    color: Colors.white,
    fontWeight: '700',
  },
  rosterCard: {
    backgroundColor: Colors.slate50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.slate200,
    padding: 16,
    gap: 12,
  },
  rosterHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.slate500,
    letterSpacing: 1,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sNoBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sNoText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate600,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate800,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  deptBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.deptCsitText,
    backgroundColor: Colors.deptCsitBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  courseTypeBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.slate500,
  },
  checkInTime: {
    fontSize: 10,
    color: Colors.slate400,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusPresent: {
    backgroundColor: Colors.successGreenLight,
  },
  statusAbsent: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPresentText: {
    color: Colors.emeraldCheck,
  },
  statusAbsentText: {
    color: Colors.liveRed,
  },
});
