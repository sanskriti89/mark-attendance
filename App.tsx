import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AttendanceProvider, useAttendance } from './src/context/AttendanceContext';
import { RoleSelectionScreen } from './src/screens/RoleSelectionScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { DocumentVerificationScreen } from './src/screens/DocumentVerificationScreen';
import { RegistrationSuccessScreen } from './src/screens/RegistrationSuccessScreen';
import { TeacherDashboardScreen } from './src/screens/TeacherDashboardScreen';
import { StudentDashboardScreen } from './src/screens/StudentDashboardScreen';
import { TeacherBroadcastSetupScreen } from './src/screens/TeacherBroadcastSetupScreen';
import { TeacherBroadcastActiveScreen } from './src/screens/TeacherBroadcastActiveScreen';
import { StudentAttendanceScreen } from './src/screens/StudentAttendanceScreen';
import { TeacherReportScreen } from './src/screens/TeacherReportScreen';
import { QuickScreenSwitcher } from './src/components/QuickScreenSwitcher';
import { ProfileModal } from './src/components/ProfileModal';
import { ExportCsvModal } from './src/components/ExportCsvModal';
import { Colors } from './src/theme/colors';

const MainNavigator: React.FC = () => {
  const { currentScreen } = useAttendance();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'ROLE_SELECTION':
        return <RoleSelectionScreen />;
      case 'AUTH':
        return <AuthScreen />;
      case 'DOC_VERIFICATION':
        return <DocumentVerificationScreen />;
      case 'REGISTRATION_SUCCESS':
        return <RegistrationSuccessScreen />;
      case 'TEACHER_DASHBOARD':
        return <TeacherDashboardScreen />;
      case 'STUDENT_DASHBOARD':
        return <StudentDashboardScreen />;
      case 'TEACHER_BROADCAST_SETUP':
        return <TeacherBroadcastSetupScreen />;
      case 'TEACHER_BROADCAST_ACTIVE':
        return <TeacherBroadcastActiveScreen />;
      case 'STUDENT_ATTENDANCE':
        return <StudentAttendanceScreen />;
      case 'TEACHER_REPORT':
        return <TeacherReportScreen />;
      default:
        return <RoleSelectionScreen />;
    }
  };

  return (
    <View style={styles.appContainer}>
      <StatusBar style="auto" />
      {renderScreen()}
      <QuickScreenSwitcher />
      <ProfileModal />
      <ExportCsvModal />
    </View>
  );
};

export default function App() {
  return (
    <AttendanceProvider>
      <MainNavigator />
    </AttendanceProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
});
