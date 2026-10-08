import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAttendance } from '../context/AttendanceContext';

export const ExportCsvModal: React.FC = () => {
  const { isExportModalOpen, setIsExportModalOpen, filteredRecords, setUserNotification } =
    useAttendance();
  const [includeDiscrepancy, setIncludeDiscrepancy] = useState(true);

  const handleExport = () => {
    setIsExportModalOpen(false);
    setUserNotification(`Exported ${filteredRecords.length} student attendance records to CSV.`);
  };

  return (
    <Modal visible={isExportModalOpen} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialIcons name="table-view" size={24} color={Colors.teacherOrange} />
            </View>
            <View>
              <Text style={styles.title}>Export Attendance CSV</Text>
              <Text style={styles.subtitle}>GGU CSIT Classroom Records</Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              Download attendance roster for Course CS401 (Database Management Systems).
            </Text>

            <View style={styles.statBox}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{filteredRecords.length}</Text>
                <Text style={styles.statLabel}>Total Records</Text>
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

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIncludeDiscrepancy(!includeDiscrepancy)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={includeDiscrepancy ? 'check-box' : 'check-box-outline-blank'}
                size={22}
                color={Colors.teacherOrange}
              />
              <Text style={styles.checkboxLabel}>Include physical audit discrepancy log</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsExportModalOpen(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleExport}>
              <MaterialIcons name="download" size={18} color={Colors.white} />
              <Text style={styles.confirmText}>Export CSV</Text>
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
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
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
    fontWeight: '700',
    color: Colors.slate900,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 2,
  },
  content: {
    gap: 16,
  },
  description: {
    fontSize: 13,
    color: Colors.slate600,
    lineHeight: 18,
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
    fontWeight: '500',
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 13,
    color: Colors.slate700,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate600,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.teacherOrange,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
