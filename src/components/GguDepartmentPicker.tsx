import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { GGU_SCHOOLS, ALL_GGU_DEPARTMENTS } from '../data/gguUniversityData';
import { GguDepartment } from '../data/types';

interface GguDepartmentPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectDepartment: (dept: GguDepartment) => void;
  selectedDeptCode?: string;
  brandColor?: string;
}

export const GguDepartmentPicker: React.FC<GguDepartmentPickerProps> = ({
  visible,
  onClose,
  onSelectDepartment,
  selectedDeptCode,
  brandColor = Colors.teacherOrange,
}) => {
  const [search, setSearch] = useState('');

  const filteredDepts = ALL_GGU_DEPARTMENTS.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.school.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Select GGU Department</Text>
              <Text style={styles.subTitle}>
                Guru Ghasidas Vishwavidyalaya, Bilaspur
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color={Colors.slate500} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={Colors.slate400} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search CSIT, CSE, Law, Arts, Pharmacy..."
              placeholderTextColor={Colors.slate400}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialIcons name="clear" size={18} color={Colors.slate400} />
              </TouchableOpacity>
            )}
          </View>

          {/* Department List */}
          <ScrollView style={styles.list}>
            {filteredDepts.map((dept) => {
              const isSelected = selectedDeptCode === dept.code;
              return (
                <TouchableOpacity
                  key={dept.code}
                  style={[
                    styles.item,
                    isSelected && {
                      backgroundColor: brandColor + '15',
                      borderColor: brandColor,
                    },
                  ]}
                  onPress={() => {
                    onSelectDepartment(dept);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemLeft}>
                    <View
                      style={[
                        styles.codeBadge,
                        isSelected && { backgroundColor: brandColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.codeText,
                          isSelected && { color: Colors.white },
                        ]}
                      >
                        {dept.code}
                      </Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.deptName}>{dept.name}</Text>
                      <Text style={styles.schoolName}>{dept.school}</Text>
                    </View>
                  </View>

                  {isSelected && (
                    <MaterialIcons name="check" size={20} color={brandColor} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dialog: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate900,
  },
  subTitle: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: Colors.slate50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.slate800,
  },
  list: {
    paddingHorizontal: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.slate50,
    borderWidth: 1,
    borderColor: Colors.slate200,
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.slate200,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.slate700,
  },
  itemInfo: {
    flex: 1,
  },
  deptName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
  },
  schoolName: {
    fontSize: 10.5,
    color: Colors.slate500,
    marginTop: 2,
  },
});
