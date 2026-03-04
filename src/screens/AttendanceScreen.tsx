import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FaceDetection from '@react-native-ml-kit/face-detection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { compareFaces, isFaceMatch } from '@/services/face-embedding';

import { Colors, Fonts } from '@/constants/theme';
import { getHeight, getWidth } from '@/hooks/use-responsive-sizing';
import { useGeolocation } from '@/hooks/use-geolocation';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.82;
const CARD_HEIGHT = CARD_WIDTH * 1.35;
const BRACKET_LEN = Math.round(0.092 * width);
const BRACKET_THICK = Math.round(0.01 * width);
const BRACKET_OFFSET = Math.round(0.041 * width);
const BRACKET_COLOR = '#2463EB';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Attendance'>;

type CapturePayload = {
  uri: string;
  platform: string;
  capturedAt: string;
};

export default function AttendanceScreen() {
  const navigation = useNavigation<Nav>();
  const cameraRef = useRef<Camera | null>(null);
  const hasCapturedRef = useRef(false);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [message, setMessage] = useState('Align your face and tap capture');
  const [payload, setPayload] = useState<CapturePayload | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceRect, setFaceRect] = useState<any>(null);
  const [detecting, setDetecting] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [isProfileDone, setIsProfileDone] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      const value = await AsyncStorage.getItem('profileSetupDone');
      setIsProfileDone(value === 'true');
    };
    checkProfile();
  }, []);

  const { location, errorMsg, isHaversineTrue } = useGeolocation();

  /* ---- permission helpers ---- */
  const grantPermission = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  /* ---- single capture (fires ONCE) ---- */
  const capture = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || hasCapturedRef.current) return;

    hasCapturedRef.current = true;
    setCapturing(true);
    setMessage('Capturing…');

    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });

      if (!photo?.path) {
        hasCapturedRef.current = false;
        setCapturing(false);
        setMessage('Capture failed — try again');
        return;
      }

      const photoUri = Platform.OS === 'android' ? `file://${photo.path}` : photo.path;

      setPayload({
        uri: photoUri,
        platform: Platform.OS,
        capturedAt: new Date().toISOString(),
      });

      /* ---- run face detection on captured image ---- */
      setDetecting(true);
      setMessage('Verifying face…');
      try {
        const faces = await FaceDetection.detect(photoUri, {
          landmarkMode: 'none',
          contourMode: 'none',
          classificationMode: 'none',
          performanceMode: 'fast',
          minFaceSize: 0.15,
        });
        if (faces.length > 0) {
          setFaceDetected(true);
          const { frame } = faces[0];
          const rect = {
            x: Math.round(frame.left),
            y: Math.round(frame.top),
            width: Math.round(frame.width),
            height: Math.round(frame.height),
          };
          setFaceRect(rect);
          console.log('[AttendanceScreen] Face detected:', rect);
          setMessage('Face verified ✓');
        } else {
          setFaceDetected(false);
          setFaceRect(null);
          console.log('[AttendanceScreen] No face detected in capture');
          setMessage('No face detected — please retake');
        }
      } catch {
        setFaceDetected(false);
        setMessage('Face check failed — please retake');
      } finally {
        setDetecting(false);
      }
    } catch {
      hasCapturedRef.current = false;
      setCapturing(false);
      setMessage('Error capturing — retry');
    }
  }, [cameraReady]);

  /* ---- retake ---- */
  const retake = useCallback(() => {
    hasCapturedRef.current = false;
    setPayload(null);
    setCapturing(false);
    setFaceDetected(false);
    setFaceRect(null);
    setDetecting(false);
    setComparing(false);
    setMessage('Align your face and tap capture');
  }, []);

  const confirmAttendance = useCallback(async () => {
    console.log('[AttendanceScreen] confirmAttendance pressed. faceDetected:', faceDetected, 'payload:', !!payload);
    if (!faceDetected || !payload) {
      console.log('[AttendanceScreen] Cannot confirm: missing face or payload');
      return;
    }

    setComparing(true);
    setMessage('Comparing faces…');

    try {
      console.log('[AttendanceScreen] Loading profile from AsyncStorage...');
      const profileData = await AsyncStorage.getItem('profile');
      if (!profileData) {
        console.log('[AttendanceScreen] Error: No profile found in storage');
        setMessage('No profile found — set up your profile first');
        setComparing(false);
        return;
      }

      const profile = JSON.parse(profileData);
      if (!profile.faceImage?.uri) {
        console.log('[AttendanceScreen] Error: No faceImage found in profile');
        setMessage('No profile photo found — update your profile');
        setComparing(false);
        return;
      }

      const profileRect = profile.faceRect || null;
      console.log('[AttendanceScreen] Comparing captured face vs profile face...');
      console.log('[AttendanceScreen] Captured URI:', payload.uri, 'Rect:', faceRect);
      console.log('[AttendanceScreen] Profile URI:', profile.faceImage.uri, 'Rect:', profileRect);

      // Run on-device face comparison via TFLite native module
      const similarity = await compareFaces(
        payload.uri,
        faceRect,
        profile.faceImage.uri,
        profileRect
      );
      
      const matched = isFaceMatch(similarity);
      console.log('[AttendanceScreen] Comparison result similarity:', similarity, 'Matched:', matched);

      navigation.replace('Status', { matched, similarity });
    } catch (e: any) {
      console.error('[AttendanceScreen] Face comparison error:', e);
      setMessage('Face comparison failed — please retry');
    } finally {
      setComparing(false);
    }
  }, [faceDetected, navigation, payload, faceRect]);

  /* ---------- RENDER ---------- */

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permTitle}>Camera Permission</Text>
        <Text style={styles.permBody}>
          We need camera access to verify your face for attendance.
        </Text>
        <Pressable style={styles.permBtn} onPress={grantPermission}>
          <Text style={styles.permBtnTxt}>Allow Camera</Text>
        </Pressable>
        <Pressable style={styles.permSecBtn} onPress={() => Linking.openSettings()}>
          <Text style={styles.permSecTxt}>Open Settings</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={Colors.light.buttonBg} />
        <Text style={styles.permBody}>Loading camera…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={Math.round(0.062 * getWidth())} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Facial Check-In</Text>
        {isProfileDone ? (
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={Math.round(0.072 * getWidth())} color={Colors.light.buttonBg} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>
      <View style={isHaversineTrue ? styles.approvedLoc : styles.rejectedLoc}>
        <View
          style={{
            width: 0.026 * getWidth(),
            height: 0.026 * getWidth(),
            borderRadius: 0.015 * getWidth(),
            backgroundColor: isHaversineTrue ? '#059668' : '#DC2626',
            marginRight: 0.021 * getWidth(),
          }}
        />
        <Text style={isHaversineTrue ? styles.approvedLocText : styles.rejectedLocText}>
          Location {isHaversineTrue ? 'Verified' : 'Not Verified'}
        </Text>
      </View>

      {/* camera card */}
      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          {/* camera feed OR captured preview */}
          {payload ? (
            <Image 
              source={{ uri: payload.uri }} 
              style={[styles.cameraFeed, { transform: [{ scaleX: 1 }] }]} 
            />
          ) : (
            <Camera
              ref={cameraRef}
              style={styles.cameraFeed}
              device={device}
              isActive={!payload}
              photo={true}
              onInitialized={() => setCameraReady(true)}
            />
          )}

          {/* corner brackets */}
          {!payload && (
            <>
              {/* top-left */}
              <View style={[styles.bracket, styles.bracketTL_H]} />
              <View style={[styles.bracket, styles.bracketTL_V]} />
              {/* top-right */}
              <View style={[styles.bracket, styles.bracketTR_H]} />
              <View style={[styles.bracket, styles.bracketTR_V]} />
              {/* bottom-left */}
              <View style={[styles.bracket, styles.bracketBL_H]} />
              <View style={[styles.bracket, styles.bracketBL_V]} />
              {/* bottom-right */}
              <View style={[styles.bracket, styles.bracketBR_H]} />
              <View style={[styles.bracket, styles.bracketBR_V]} />
            </>
          )}
        </View>

        {/* status badge */}
        <View
          style={[
            styles.statusBadge,
            payload && !faceDetected && !detecting && styles.statusBadgeError,
          ]}
        >
          <Ionicons
            name={
              detecting
                ? 'hourglass-outline'
                : payload
                  ? faceDetected
                    ? 'checkmark-circle'
                    : 'close-circle'
                  : 'scan-outline'
            }
            size={Math.round(0.041 * getWidth())}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.statusBadgeText}>
            {detecting
              ? 'DETECTING FACE…'
              : payload
                ? faceDetected
                  ? 'FACE VERIFIED'
                  : 'NO FACE FOUND'
                : 'ALIGN FACE'}
          </Text>
        </View>
      </View>

      {/* bottom message + actions */}
      <View style={styles.bottom}>
        {/* capture button */}
        {!payload && !capturing && (
          <Pressable style={styles.markBtn} onPress={() => void capture()}>
            <AntDesign name="camera" size={Math.round(0.051 * getWidth())} color={Colors.light.background} />
            <Text style={styles.markBtnTxt}>Capture Attendance</Text>
          </Pressable>
        )}

        {/* spinner while capturing */}
        {capturing && !payload && (
          <ActivityIndicator size="small" color={Colors.light.buttonBg} style={{ marginTop: 16 }} />
        )}

        {/* spinner while detecting face or comparing */}
        {(detecting || comparing) && payload && (
          <ActivityIndicator size="small" color={Colors.light.buttonBg} style={{ marginTop: 16 }} />
        )}

        {/* retake + confirm after capture */}
        {payload && !detecting && (
          <View style={styles.actionRow}>
            <Pressable style={styles.retakeBtn} onPress={retake}>
              <Ionicons name="camera-reverse-outline" size={Math.round(0.051 * getWidth())} color={Colors.light.buttonBg} />
              <Text style={styles.retakeTxt}>Retake</Text>
            </Pressable>
            <Pressable
              style={[
                styles.confirmBtn,
                (!faceDetected || comparing) && styles.confirmBtnDisabled,
              ]}
              onPress={confirmAttendance}
              disabled={!faceDetected || comparing}
            >
              {comparing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={Math.round(0.051 * getWidth())} color="#fff" />
                  <Text style={styles.confirmTxt}>Confirm</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* hint when no face detected */}
        {payload && !detecting && !faceDetected && (
          <Text style={styles.noFaceHint}>
            Please retake with your face clearly visible
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconStyle: {
    width: 0.051 * getWidth(),
    height: 0.051 * getWidth(),
    tintColor: '#fff',
  },
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    height: 0.09 * getHeight(),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0.051 * getWidth(),
    paddingTop: 0.022 * getHeight(),
    backgroundColor: Colors.light.background,
  },
  approvedLocText: {
    color: '#059668',
    fontSize: 0.036 * getWidth(),
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  rejectedLocText: {
    color: '#DC2626',
    fontSize: 0.036 * getWidth(),
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  approvedLoc: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 0.031 * getWidth(),
    paddingVertical: 0.007 * getHeight(),
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: 0.06 * getHeight(),
  },
  rejectedLoc: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 0.031 * getWidth(),
    paddingVertical: 0.007 * getHeight(),
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: 0.06 * getHeight(),
  },
  backBtn: {
    width: 0.103 * getWidth(),
    height: 0.103 * getWidth(),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 0.046 * getWidth(),
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: Fonts.sans,
  },

  /* camera card */
  cardWrapper: {
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 0.03 * getHeight(),
    marginBottom: 0.02 * getHeight(),
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 0.062 * getWidth(),
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  cameraFeed: {
    width: '100%',
    height: '100%',
  },

  /* corner brackets */
  bracket: {
    position: 'absolute',
    backgroundColor: BRACKET_COLOR,
    borderRadius: 2,
  },
  bracketTL_H: { top: BRACKET_OFFSET, left: BRACKET_OFFSET, width: BRACKET_LEN, height: BRACKET_THICK },
  bracketTL_V: { top: BRACKET_OFFSET, left: BRACKET_OFFSET, width: BRACKET_THICK, height: BRACKET_LEN },
  bracketTR_H: { top: BRACKET_OFFSET, right: BRACKET_OFFSET, width: BRACKET_LEN, height: BRACKET_THICK },
  bracketTR_V: { top: BRACKET_OFFSET, right: BRACKET_OFFSET, width: BRACKET_THICK, height: BRACKET_LEN },
  bracketBL_H: { bottom: BRACKET_OFFSET, left: BRACKET_OFFSET, width: BRACKET_LEN, height: BRACKET_THICK },
  bracketBL_V: { bottom: BRACKET_OFFSET, left: BRACKET_OFFSET, width: BRACKET_THICK, height: BRACKET_LEN },
  bracketBR_H: { bottom: BRACKET_OFFSET, right: BRACKET_OFFSET, width: BRACKET_LEN, height: BRACKET_THICK },
  bracketBR_V: { bottom: BRACKET_OFFSET, right: BRACKET_OFFSET, width: BRACKET_THICK, height: BRACKET_LEN },

  /* status badge below card */
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.buttonBg,
    paddingHorizontal: 0.041 * getWidth(),
    paddingVertical: 0.01 * getHeight(),
    borderRadius: 999,
    marginTop: -0.021 * getHeight(),
    zIndex: 10,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 0.031 * getWidth(),
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: Fonts.sans,
  },
  statusBadgeError: {
    backgroundColor: '#DC2626',
  },

  frame: {
    display: 'none',
  },

  /* bottom area */
  bottom: {
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 0.04 * getHeight(),
    marginBottom: 0.02 * getHeight(),
    paddingHorizontal: 0.051 * getWidth(),
  },
  msg: {
    color: Colors.light.text,
    fontSize: 0.041 * getWidth(),
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Fonts.sans,
    marginBottom: 0.005 * getHeight(),
  },

  /* capture button */
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0.031 * getWidth(),
    backgroundColor: Colors.light.buttonBg,
    paddingVertical: 0.019 * getHeight(),
    paddingHorizontal: 0.082 * getWidth(),
    borderRadius: 999,
    width: CARD_WIDTH,
    shadowColor: Colors.light.buttonBg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  markBtnTxt: {
    color: '#fff',
    fontSize: 0.041 * getWidth(),
    fontWeight: '700',
    fontFamily: Fonts.sans,
  },

  /* action buttons */
  actionRow: {
    flexDirection: 'row',
    gap: 0.036 * getWidth(),
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0.02 * getWidth(),
    paddingHorizontal: 0.095 * getWidth(),
    paddingVertical: 0.017 * getHeight(),
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.light.buttonBg,
    backgroundColor: Colors.light.background,
  },
  retakeTxt: {
    color: Colors.light.buttonBg,
    fontSize: 0.038 * getWidth(),
    fontWeight: '700',
    fontFamily: Fonts.sans,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0.02 * getWidth(),
    paddingHorizontal: 0.095 * getWidth(),
    paddingVertical: 0.017 * getHeight(),
    borderRadius: 999,
    backgroundColor: Colors.light.buttonBg,
    shadowColor: Colors.light.buttonBg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmTxt: {
    color: '#fff',
    fontSize: 0.038 * getWidth(),
    fontWeight: '700',
    fontFamily: Fonts.sans,
  },
  confirmBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  noFaceHint: {
    color: '#DC2626',
    fontSize: 0.033 * getWidth(),
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 0.014 * getHeight(),
    fontFamily: Fonts.sans,
  },

  /* permission screen */
  center: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0.062 * getWidth(),
    gap: 0.014 * getHeight(),
  },
  permTitle: { color: Colors.light.text, fontSize: 0.056 * getWidth(), fontWeight: '700', fontFamily: Fonts.sans },
  permBody: { color: Colors.light.text, fontSize: 0.038 * getWidth(), textAlign: 'center', fontFamily: Fonts.sans },
  permBtn: {
    marginTop: 0.01 * getHeight(),
    backgroundColor: Colors.light.buttonBg,
    borderRadius: 999,
    paddingHorizontal: 0.051 * getWidth(),
    paddingVertical: 0.014 * getHeight(),
  },
  permBtnTxt: { color: '#fff', fontSize: 0.036 * getWidth(), fontWeight: '700', fontFamily: Fonts.sans },
  permSecBtn: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 0.051 * getWidth(),
    paddingVertical: 0.014 * getHeight(),
  },
  permSecTxt: { color: '#475569', fontSize: 0.036 * getWidth(), fontWeight: '600', fontFamily: Fonts.sans },
});
