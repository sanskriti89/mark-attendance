import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { CommonTopBar } from '../components/CommonTopBar';
import { api } from '../services/api';
import { hapticFeedback } from '../utils/haptics';

export const TeacherReportScreen: React.FC = () => {
  const {
    attendanceRecords,
    setAttendanceRecords,
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
    activeSubjectCode,
    activeSubjectName,
    activeSessionId,
    teacherRegFacultyId,
    teacherRegName,
    activeClassroom,
    teacherDepartment,
    teacherRegEmail,
    teacherDailySchedule,
    extractedTeacherClasses,
    navigateTo,
  } = useAttendance();

  // Dynamically collect unique courses from timetable and active broadcast
  const coursesMap = new Map<string, string>();

  if (activeSubjectCode && activeSubjectName) {
    coursesMap.set(activeSubjectCode.toUpperCase(), activeSubjectName);
  }

  const scheduleList = teacherDailySchedule && teacherDailySchedule.length > 0
    ? teacherDailySchedule
    : extractedTeacherClasses || [];

  for (const s of scheduleList) {
    if (s.courseCode && s.courseName) {
      coursesMap.set(s.courseCode.toUpperCase(), s.courseName);
    }
  }

  const defaultCourseList = [
    { code: 'CIUAMJT1', name: 'Programming using C -Theory' },
    { code: 'CIUAMJL1', name: 'Programming using C - Lab' },
    { code: 'CIUCMJT2', name: 'Operating Systems' },
    { code: 'CIUCMJT1', name: 'Relational Database Management System' },
    { code: 'SECC13', name: 'DBMS (Database Management Systems)' },
    { code: 'VOCCILO03', name: 'Lab Based on Python' },
    { code: 'CAUCMJT2', name: 'Principals of Operating Systems' },
    { code: 'HIUCAET1', name: 'Hindi Bhasha Aur Sahitya' },
  ];

  for (const d of defaultCourseList) {
    if (!coursesMap.has(d.code.toUpperCase())) {
      coursesMap.set(d.code.toUpperCase(), d.name);
    }
  }

  const availableCourses = Array.from(coursesMap.entries()).map(([code, name]) => ({ code, name }));

  const [selectedCourseCode, setSelectedCourseCode] = useState(activeSubjectCode || availableCourses[0]?.code || 'CIUAMJT1');
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [reportSavedSuccess, setReportSavedSuccess] = useState(false);
  const [isSendingDirectEmail, setIsSendingDirectEmail] = useState(false);

  useEffect(() => {
    if (activeSubjectCode) {
      setSelectedCourseCode(activeSubjectCode);
    }
  }, [activeSubjectCode]);

  const selectedCourseObj = (selectedCourseCode === activeSubjectCode && activeSubjectName)
    ? { code: selectedCourseCode, name: activeSubjectName }
    : availableCourses.find((c) => c.code.toUpperCase() === selectedCourseCode.toUpperCase()) || {
        code: selectedCourseCode,
        name: activeSubjectName || 'University Lecture Course',
      };

  const fetchReports = useCallback(async () => {
    setIsLoadingRecords(true);
    try {
      const targetCourse = (selectedCourseCode || activeSubjectCode || 'CIUCMJT2').trim().toUpperCase();
      let recs: any[] = [];

      // Query course reports strictly for this courseCode
      const repRes = await api.getReports({ courseCode: targetCourse });
      if (repRes && repRes.success && Array.isArray(repRes.records)) {
        recs = repRes.records;
      } else if (activeSessionId) {
        const sessionRes = await api.getSessionAttendance(activeSessionId);
        if (sessionRes && sessionRes.success && Array.isArray(sessionRes.records)) {
          recs = sessionRes.records.filter((r: any) => (r.courseCode || '').toUpperCase() === targetCourse);
        }
      }

      if (recs.length > 0) {
        // De-duplicate by studentEnrollment/name so each student has 1 row with their latest status
        const seen = new Set<string>();
        const uniqueRecs: any[] = [];
        for (const r of recs) {
          const key = (r.studentEnrollment || r.studentName || '').toUpperCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            uniqueRecs.push(r);
          }
        }

        const mapped = uniqueRecs.map((r: any, idx: number) => ({
          id: r._id || r.id,
          sNo: String(idx + 1).padStart(2, '0'),
          studentName: r.studentName || r.studentEnrollment || 'Student',
          studentEnrollment: r.studentEnrollment || '',
          dept: r.department || 'CSIT',
          courseType: r.courseType || 'Major',
          isPresent: r.isPresent ?? false,
          checkInTime: r.markedAt ? new Date(r.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (r.isPresent ? 'Verified' : 'Absent'),
          verificationMethod: r.verifiedVia || (r.isPresent ? 'GGU GPS + PIN' : 'Unverified'),
        }));
        setAttendanceRecords(mapped);
      } else {
        setAttendanceRecords([]);
      }
    } catch (err) {
      console.warn('Error fetching reports:', err);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [activeSessionId, activeSubjectCode, selectedCourseCode]);

  const handleSaveReportToDatabase = async () => {
    setIsSavingReport(true);
    try {
      const payload = {
        sessionId: activeSessionId || undefined,
        courseCode: selectedCourseObj.code,
        courseName: selectedCourseObj.name,
        teacherFacultyId: teacherRegFacultyId || 'EMP/2026/8042',
        teacherName: teacherRegName || 'Dr. Rajesh Kumar Singh',
        teacherEmail: teacherRegEmail || undefined,
        classroom: activeClassroom || 'CSIT Room FB',
        department: teacherDepartment || 'CSIT',
        totalPresent: presentCount,
        totalAbsent: filteredRecords.length - presentCount,
        totalEnrolled: filteredRecords.length,
        physicalHeadcount: physicalHeadcount || 0,
        hasDiscrepancy,
        sendEmail: true,
        records: filteredRecords.map((r) => ({
          id: r.id,
          sNo: r.sNo,
          studentName: r.studentName,
          studentEnrollment: r.studentEnrollment || r.sNo,
          department: r.dept,
          courseType: r.courseType,
          isPresent: r.isPresent,
          checkInTime: r.checkInTime,
          verificationMethod: r.verificationMethod,
        })),
      };

      const res = await api.saveAttendanceReport(payload);
      if (res && res.success) {
        hapticFeedback.success();
        setReportSavedSuccess(true);
        const emailMsg = res.emailSent ? ` & emailed to ${res.emailSentTo || teacherRegEmail}` : '';
        setUserNotification(`✅ Official attendance report saved & archived${emailMsg}!`);
        setTimeout(() => setReportSavedSuccess(false), 5000);
      }
    } catch (e: any) {
      hapticFeedback.error();
      console.warn('Save report error:', e);
      setUserNotification('❌ Error saving attendance report: ' + e.message);
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleDirectEmailReport = async () => {
    setIsSendingDirectEmail(true);
    try {
      const res = await api.emailAttendanceReport({
        courseCode: selectedCourseObj.code,
        sessionId: activeSessionId || undefined,
        email: teacherRegEmail || undefined,
        teacherName: teacherRegName || 'Dr. Rajesh Kumar Singh',
        classroom: activeClassroom || 'CSIT Room FB',
        records: filteredRecords.map((r) => ({
          sNo: r.sNo,
          studentName: r.studentName,
          studentEnrollment: r.studentEnrollment || r.sNo,
          department: r.dept,
          courseType: r.courseType,
          isPresent: r.isPresent,
          checkInTime: r.checkInTime,
          verificationMethod: r.verificationMethod,
        })),
      });

      if (res && res.success) {
        hapticFeedback.success();
        setUserNotification(`📧 Attendance report successfully emailed to ${res.emailSentTo || teacherRegEmail || 'faculty email'}!`);
      } else {
        hapticFeedback.warning();
        setUserNotification(`⚠️ ${res?.message || 'Could not send report email.'}`);
      }
    } catch (err: any) {
      hapticFeedback.error();
      setUserNotification(`❌ Email failed: ${err.message || 'Network error'}`);
    } finally {
      setIsSendingDirectEmail(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const presentCount = filteredRecords.filter((r) => r.isPresent).length;
  const hasDiscrepancy = presentCount > physicalHeadcount;

  const deptList = ['All', 'CSIT', 'CSE', 'ECE', 'IT'];

  return (
    <View style={styles.container}>
      <CommonTopBar title="Attendance Report" onBack={() => navigateTo('TEACHER_DASHBOARD')} />

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
          <View style={styles.courseHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.courseCode}>{selectedCourseObj.code}</Text>
              <Text style={styles.courseTitle}>{selectedCourseObj.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.refreshIconBtn}
              onPress={fetchReports}
              disabled={isLoadingRecords}
              activeOpacity={0.7}
            >
              {isLoadingRecords ? (
                <ActivityIndicator size="small" color={Colors.teacherOrange} />
              ) : (
                <MaterialIcons name="refresh" size={20} color={Colors.slate600} />
              )}
            </TouchableOpacity>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                reportSavedSuccess ? styles.actionBtnSaved : styles.actionBtnPrimary,
              ]}
              onPress={handleSaveReportToDatabase}
              disabled={isSavingReport}
              activeOpacity={0.8}
            >
              {isSavingReport ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <MaterialIcons
                  name={reportSavedSuccess ? 'cloud-done' : 'cloud-upload'}
                  size={16}
                  color={Colors.white}
                />
              )}
              <Text style={styles.actionBtnPrimaryText}>
                {isSavingReport ? 'Saving...' : reportSavedSuccess ? 'Saved' : 'Save DB'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={() => setIsExportModalOpen(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="file-download" size={16} color={Colors.slate800} />
              <Text style={styles.actionBtnSecondaryText}>Excel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={handleDirectEmailReport}
              disabled={isSendingDirectEmail}
              activeOpacity={0.8}
            >
              {isSendingDirectEmail ? (
                <ActivityIndicator size="small" color={Colors.slate800} />
              ) : (
                <MaterialIcons name="mail-outline" size={16} color={Colors.slate800} />
              )}
              <Text style={styles.actionBtnSecondaryText}>
                {isSendingDirectEmail ? 'Sending...' : 'Email'}
              </Text>
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

        {/* Filter Chips - Course Selection */}
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, marginLeft: 2 }}>
            Selected Course ({availableCourses.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {availableCourses.map((c) => {
              const isSel = selectedCourseCode.toUpperCase() === c.code.toUpperCase();
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.filterChip,
                    isSel && styles.activeFilterChip,
                  ]}
                  onPress={() => setSelectedCourseCode(c.code)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSel && styles.activeFilterChipText,
                    ]}
                  >
                    {c.code}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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


        {/* Attendance List */}
        <View style={styles.rosterCard}>
          <Text style={styles.rosterHeader}>
            ATTENDANCE ROSTER ({filteredRecords.length})
          </Text>

          {isLoadingRecords && filteredRecords.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32, gap: 10 }}>
              <ActivityIndicator size="large" color={Colors.teacherOrange} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.slate600 }}>
                Loading verified attendance records from database...
              </Text>
            </View>
          ) : filteredRecords.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
              <MaterialIcons name="people-outline" size={36} color={Colors.slate400} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.slate700 }}>No Attendance Records Yet</Text>
              <Text style={{ fontSize: 12, color: Colors.slate500, textAlign: 'center', maxWidth: 280 }}>
                When students enter the broadcast PIN and mark attendance, verified check-in records will appear here.
              </Text>
            </View>
          ) : (
            filteredRecords.map((record) => (
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
            )))}
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
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.teacherOrange,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate900,
    lineHeight: 22,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slate200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.teacherOrange,
  },
  actionBtnSaved: {
    backgroundColor: Colors.emeraldCheck,
  },
  actionBtnPrimaryText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  actionBtnSecondaryText: {
    color: Colors.slate800,
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
    outlineStyle: 'none',
    borderWidth: 0,
    backgroundColor: 'transparent',
  } as any,
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
