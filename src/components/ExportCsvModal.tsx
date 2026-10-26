import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';
import { api } from '../services/api';

export const ExportCsvModal: React.FC = () => {
  const {
    isExportModalOpen,
    setIsExportModalOpen,
    filteredRecords,
    setUserNotification,
    activeSubjectCode,
    activeSubjectName,
    teacherDailySchedule,
    extractedTeacherClasses,
    teacherRegName,
    teacherRegEmail,
    activeClassroom,
    activeSessionId,
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
  availableCourses.push({ code: 'All', name: 'All Enrolled Classes' });

  const [selectedCourseCode, setSelectedCourseCode] = useState(activeSubjectCode || availableCourses[0]?.code || 'CIUAMJT1');
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    if (activeSubjectCode) {
      setSelectedCourseCode(activeSubjectCode);
    } else if (availableCourses.length > 0 && selectedCourseCode === 'CIUCMJT2') {
      setSelectedCourseCode(availableCourses[0].code);
    }
  }, [isExportModalOpen, activeSubjectCode]);

  const selectedCourseObj = (selectedCourseCode === activeSubjectCode && activeSubjectName)
    ? { code: selectedCourseCode, name: activeSubjectName }
    : availableCourses.find((c) => c.code.toUpperCase() === selectedCourseCode.toUpperCase()) || {
        code: selectedCourseCode,
        name: activeSubjectName || 'University Lecture Course',
      };

  const handleDownloadCsv = async () => {
    setIsExporting(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const csvText = await api.exportAttendanceCsv({
        courseCode: selectedCourseCode !== 'All' ? selectedCourseCode : undefined,
        courseName: selectedCourseObj.name,
        sessionId: activeSessionId || undefined,
        records: filteredRecords,
      });

      if (typeof window !== 'undefined' && window.document) {
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const cleanName = selectedCourseCode.replace(/[^A-Z0-9_-]/gi, '');
        link.setAttribute('download', `Attendance_${cleanName}_${todayStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const downloadUrl = api.getExportCsvUrl({
          courseCode: selectedCourseCode,
          courseName: selectedCourseObj.name,
        });
        if (typeof window !== 'undefined' && (window as any).open) {
          (window as any).open(downloadUrl, '_blank');
        }
      }

      setIsExportModalOpen(false);
      setUserNotification(`📥 Excel/CSV attendance sheet downloaded for ${selectedCourseCode}!`);
    } catch (err: any) {
      setUserNotification(`❌ Export failed: ${err.message || 'Error downloading file'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const res = await api.emailAttendanceReport({
        courseCode: selectedCourseCode,
        sessionId: activeSessionId || undefined,
        email: teacherRegEmail || undefined,
        teacherName: teacherRegName || 'Faculty',
        classroom: activeClassroom || 'CSIT Room FB',
        records: filteredRecords,
      });

      if (res && res.success) {
        setIsExportModalOpen(false);
        setUserNotification(`📧 Attendance report sent to ${res.emailSentTo || teacherRegEmail || 'faculty email'}!`);
      } else {
        setUserNotification(`⚠️ ${res?.message || 'Could not send report email.'}`);
      }
    } catch (err: any) {
      setUserNotification(`❌ Email failed: ${err.message || 'Network error'}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Modal visible={isExportModalOpen} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialIcons name="table-view" size={24} color={Colors.teacherOrange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Export & Email Attendance</Text>
              <Text style={styles.subtitle}>GGU CSIT Classroom Official Records</Text>
            </View>
            <TouchableOpacity onPress={() => setIsExportModalOpen(false)} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={Colors.slate500} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.sectionLabel}>Select Class / Course to Export:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
                {availableCourses.map((c) => {
                  const isSel = c.code === selectedCourseCode;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      style={[styles.coursePill, isSel && styles.coursePillActive]}
                      onPress={() => setSelectedCourseCode(c.code)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.coursePillText, isSel && styles.coursePillTextActive]}>
                        {c.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.courseInfoBox}>
              <Text style={styles.courseInfoTitle}>{selectedCourseObj.code}</Text>
              <Text style={styles.courseInfoSub}>{selectedCourseObj.name}</Text>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{filteredRecords.length}</Text>
                <Text style={styles.statLabel}>Total Enrolled</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: Colors.emeraldCheck }]}>
                  {filteredRecords.filter((r) => r.isPresent).length}
                </Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: Colors.liveRed }]}>
                  {filteredRecords.filter((r) => !r.isPresent).length}
                </Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
            </View>

            <View style={styles.noticeBox}>
              <MaterialIcons name="info-outline" size={16} color={Colors.teacherOrange} />
              <Text style={styles.noticeText}>
                Includes full roster with date, student enrollment, name, and Present/Absent status. Opens natively in Microsoft Excel.
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            {/* Send to Email Button */}
            <TouchableOpacity
              style={[styles.emailBtn, isSendingEmail && { opacity: 0.7 }]}
              onPress={handleSendEmail}
              disabled={isSendingEmail || isExporting}
              activeOpacity={0.8}
            >
              {isSendingEmail ? (
                <ActivityIndicator size="small" color={Colors.teacherOrange} />
              ) : (
                <MaterialIcons name="mail-outline" size={18} color={Colors.teacherOrange} />
              )}
              <Text style={styles.emailBtnText}>
                {isSendingEmail ? 'Sending...' : 'Email Report'}
              </Text>
            </TouchableOpacity>

            {/* Download Excel / CSV Button */}
            <TouchableOpacity
              style={[styles.confirmBtn, isExporting && { opacity: 0.7 }]}
              onPress={handleDownloadCsv}
              disabled={isExporting || isSendingEmail}
              activeOpacity={0.8}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <MaterialIcons name="file-download" size={18} color={Colors.white} />
              )}
              <Text style={styles.confirmText}>
                {isExporting ? 'Downloading...' : 'Download Excel (CSV)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.teacherOrangeLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate900,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coursePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.slate100,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  coursePillActive: {
    backgroundColor: Colors.teacherOrange,
    borderColor: Colors.teacherOrange,
  },
  coursePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate700,
  },
  coursePillTextActive: {
    color: Colors.white,
  },
  courseInfoBox: {
    backgroundColor: Colors.slate50,
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.teacherOrange,
  },
  courseInfoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.slate800,
  },
  courseInfoSub: {
    fontSize: 12,
    color: Colors.slate600,
    marginTop: 2,
  },
  statBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.slate50,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  statItem: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.slate800,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.slate500,
    fontWeight: '600',
    marginTop: 2,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fff7ed',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  noticeText: {
    fontSize: 11,
    color: '#9a3412',
    flex: 1,
    lineHeight: 15,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 18,
  },
  emailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.teacherOrange,
    backgroundColor: Colors.white,
    paddingVertical: 11,
    borderRadius: 10,
  },
  emailBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.teacherOrange,
  },
  confirmBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.teacherOrange,
    paddingVertical: 11,
    borderRadius: 10,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});

