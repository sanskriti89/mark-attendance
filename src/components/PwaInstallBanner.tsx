import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Check if app is already running as standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    // Check if iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show banner after 2s on mobile web if not installed
    const timer = setTimeout(() => {
      if (!isStandalone) {
        setIsVisible(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsVisible(false);
        }
        setDeferredPrompt(null);
      } catch (e) {
        console.log('Install prompt error', e);
      }
    } else if (isIos) {
      setShowIosGuide(!showIosGuide);
    } else {
      // In mobile Chrome without beforeinstallprompt or desktop
      alert(
        'To install AttendIQ on your phone:\n\n1. Tap the 3 dots (⋮) in Chrome\n2. Select "Install app" or "Add to Home screen"\n\nAttendIQ will open full-screen just like a native app!'
      );
    }
  };

  if (!isVisible || Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="install-mobile" size={24} color="#38BDF8" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Install AttendIQ App</Text>
          <Text style={styles.subtitle}>
            {isIos ? 'Add to Home Screen for full app experience' : '1-tap install on your phone • Works offline'}
          </Text>
          {showIosGuide && (
            <Text style={styles.iosTip}>
              👉 Tap the Share button (⬆️) below, then select &quot;Add to Home Screen&quot;.
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.installButton}
          onPress={handleInstallClick}
          activeOpacity={0.8}
        >
          <Text style={styles.installButtonText}>Install</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setIsVisible(false)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={18} color="rgba(255, 255, 255, 0.6)" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  banner: {
    maxWidth: 520,
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  iosTip: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  installButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 6,
  },
  installButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
});
