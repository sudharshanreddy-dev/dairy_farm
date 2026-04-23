import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Alert, TouchableOpacity,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';

export default function QRScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    setScanned(true);
    try {
      const id = data.split('/').pop();
      if (id) {
        router.push(`/public/${id}`);
      } else {
        throw new Error('Invalid QR');
      }
    } catch {
      Alert.alert('Scan Error', 'Invalid Cattle QR Code');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Text style={{ color: colors.muted, fontSize: 15 }}>Requesting camera permission…</Text>
      </View>
    );
  }
  if (!hasPermission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>📷</Text>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 6 }}>Camera Access Denied</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>Please allow camera access in settings.</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>Scan Cattle QR</Text>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <Text style={styles.overlayHint}>Point camera at the cattle QR code</Text>
        {scanned && (
          <TouchableOpacity style={styles.resetBtn} onPress={() => setScanned(false)}>
            <Text style={styles.resetText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const FRAME = 240;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 20 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  overlayTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  frame: { width: FRAME, height: FRAME, position: 'relative' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#3fb950', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  overlayHint: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  resetBtn: { backgroundColor: '#2ea043', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  resetText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
