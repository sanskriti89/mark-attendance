import React, { useEffect, useRef } from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  Platform,
  BackHandler,
  Alert,
  StatusBar as RNStatusBar,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

// Inject global web CSS reset to eliminate browser focus outlines, borders and tap highlights
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'global-attend-iq-reset';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      * {
        -webkit-tap-highlight-color: transparent !important;
      }
      input, textarea, select, button, [tabindex], div {
        outline: none !important;
        outline-width: 0 !important;
        box-shadow: none !important;
      }
      input:focus, textarea:focus, select:focus, button:focus, *:focus, *:focus-visible {
        outline: none !important;
        outline-width: 0 !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

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
import { ProfileModal } from './src/components/ProfileModal';
import { ExportCsvModal } from './src/components/ExportCsvModal';
import { PwaInstallBanner } from './src/components/PwaInstallBanner';
import { Colors } from './src/theme/colors';

/**
 * Animated screen transition container:
 * Smoothly fades and slides each incoming screen with 60fps native driver
 */
const AnimatedScreenWrapper: React.FC<{ screenKey: string; children: React.ReactNode }> = ({
  screenKey,
  children,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const scaleAnim = useRef(new Animated.Value(0.985)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(12);
    scaleAnim.setValue(0.985);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [screenKey]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
};

const MainNavigator: React.FC = () => {
  const {
    currentScreen,
    goBack,
    isProfileSheetOpen,
    setIsProfileSheetOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    screenHistory,
    isAuthRestoring,
  } = useAttendance();

  // Android Hardware Back Button & Gesture Navigation Interceptor
  useEffect(() => {
    const handleHardwareBackPress = () => {
      // 1. If any overlay modal is open, dismiss it
      if (isProfileSheetOpen) {
        setIsProfileSheetOpen(false);
        return true;
      }
      if (isExportModalOpen) {
        setIsExportModalOpen(false);
        return true;
      }

      // 2. Perform back navigation
      const handled = goBack();
      if (handled) {
        return true; // Navigation handled, do NOT close app
      }

      // 3. At root screen, prompt before closing the app so it never accidentally shuts down
      Alert.alert(
        'Exit AttendIQ',
        'Do you want to exit the AttendIQ application?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp(), style: 'destructive' },
        ],
        { cancelable: true }
      );
      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleHardwareBackPress
    );

    return () => subscription.remove();
  }, [currentScreen, screenHistory, isProfileSheetOpen, isExportModalOpen, goBack]);

  // Display branded splash during session restoration
  if (isAuthRestoring) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: Colors.darkNavy }]}>
        <RNStatusBar barStyle="light-content" backgroundColor={Colors.darkNavy} translucent={true} />
        <ExpoStatusBar style="light" />
        <View style={styles.splashContent}>
          <View style={styles.splashLogoRing}>
            <MaterialIcons name="school" size={44} color={Colors.white} />
          </View>
          <Text style={styles.splashTitle}>AttendIQ</Text>
          <Text style={styles.splashSubtitle}>Guru Ghasidas Vishwavidyalaya</Text>
          <View style={styles.splashLoadingBox}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.splashLoadingText}>Restoring your secure session...</Text>
          </View>
        </View>
      </View>
    );
  }

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

  const isDarkRoleScreen = currentScreen === 'ROLE_SELECTION';
  const statusBarBg = isDarkRoleScreen ? Colors.darkNavy : '#FFFFFF';
  const barStyle = isDarkRoleScreen ? 'light-content' : 'dark-content';
  const topPadding =
    Platform.OS === 'android'
      ? Math.max(RNStatusBar.currentHeight || 0, 42)
      : Platform.OS === 'ios'
      ? 44
      : 0;

  return (
    <View style={[styles.safeArea, { backgroundColor: statusBarBg, paddingTop: topPadding }]}>
      {/* Native Android Status Bar with explicit solid background and maximum contrast */}
      <RNStatusBar
        barStyle={barStyle}
        backgroundColor={statusBarBg}
        translucent={true}
      />
      <ExpoStatusBar style={isDarkRoleScreen ? 'light' : 'dark'} />

      <View style={[styles.appContainer, { backgroundColor: statusBarBg }]}>
        <AnimatedScreenWrapper screenKey={currentScreen}>
          {renderScreen()}
        </AnimatedScreenWrapper>
        <ProfileModal />
        <ExportCsvModal />
        <PwaInstallBanner />
      </View>
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
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  appContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkNavy,
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  splashLogoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  splashSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
  },
  splashLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  splashLoadingText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginLeft: 10,
  },
});
