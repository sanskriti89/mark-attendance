import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

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

    // Check if iOS (iPhone/iPad/iPod or iPadOS Safari on Mac-like user agent)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (/macintosh/.test(userAgent) && window.navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    // Listen for Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show banner after 1.5s on mobile web if not installed
    const timer = setTimeout(() => {
      if (!isStandalone) {
        setIsVisible(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      // On iOS, automated prompt is blocked by Apple, show guided steps modal
      setShowIosModal(true);
      return;
    }

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
    } else {
      alert(
        'To install AttendIQ on your phone:\n\n1. Tap the 3 dots (⋮) in Chrome\n2. Select "Install app" or "Add to Home screen"\n\nAttendIQ will open full-screen just like a native app!'
      );
    }
  };

  if (!isVisible || Platform.OS !== 'web') {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.banner}>
          <View style={styles.iconContainer}>
            <MaterialIcons
              name={isIos ? 'apple' : 'install-mobile'}
              size={24}
              color="#38BDF8"
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {isIos ? 'Install AttendIQ on iPhone' : 'Install AttendIQ App'}
            </Text>
            <Text style={styles.subtitle}>
              {isIos
                ? 'Add to Home Screen for full app experience'
                : '1-tap install on your phone • Works offline'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.installButton}
            onPress={handleInstallClick}
            activeOpacity={0.8}
          >
            <Text style={styles.installButtonText}>
              {isIos ? 'How to Install' : 'Install'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsVisible(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="close" size={18} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* iOS Step-by-Step Installation Modal */}
      <Modal
        visible={showIosModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowIosModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <MaterialIcons name="touch-app" size={26} color="#38BDF8" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle}>Install on iPhone / iPad</Text>
                <Text style={styles.modalSubtitle}>Follow these 3 easy steps in Safari</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowIosModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Steps Container */}
            <View style={styles.stepsList}>
              {/* Step 1 */}
              <View style={styles.stepItem}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepTextContent}>
                  <Text style={styles.stepTitle}>
                    Make sure you are in <Text style={{ color: '#38BDF8', fontWeight: '700' }}>Safari</Text>
                  </Text>
                  <Text style={styles.stepDesc}>
                    Apple only allows Add to Home Screen from the Safari browser.
                  </Text>
                </View>
              </View>

              {/* Step 2 */}
              <View style={styles.stepItem}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepTextContent}>
                  <Text style={styles.stepTitle}>
                    Tap the <Text style={{ color: '#38BDF8', fontWeight: '700' }}>Share</Text> button
                  </Text>
                  <Text style={styles.stepDesc}>
                    Look at the bottom toolbar of Safari and tap the square with an up-arrow (
                    <Text style={{ fontSize: 16 }}>⎋ / ⬆️</Text>
                    ).
                  </Text>
                </View>
              </View>

              {/* Step 3 */}
              <View style={styles.stepItem}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepTextContent}>
                  <Text style={styles.stepTitle}>
                    Select <Text style={{ color: '#10B981', fontWeight: '700' }}>&quot;Add to Home Screen&quot;</Text>
                  </Text>
                  <Text style={styles.stepDesc}>
                    Scroll down the share list, tap &quot;Add to Home Screen&quot; (<Text style={{ fontWeight: '700' }}>[+]</Text>), then tap &quot;Add&quot; at top-right.
                  </Text>
                </View>
              </View>
            </View>

            {/* Success Callout */}
            <View style={styles.successCallout}>
              <MaterialIcons name="check-circle" size={18} color="#10B981" />
              <Text style={styles.successCalloutText}>
                AttendIQ will appear as a full-screen app icon on your iPhone home screen!
              </Text>
            </View>

            {/* Done Button */}
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowIosModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalDoneButtonText}>Samajh Gaya / Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100000,
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 22,
    maxWidth: 440,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 14,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  stepsList: {
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  stepTextContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  successCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 18,
  },
  successCalloutText: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  modalDoneButton: {
    backgroundColor: '#0284C7',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
