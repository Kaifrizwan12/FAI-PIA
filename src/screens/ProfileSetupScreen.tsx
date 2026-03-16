import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FaceDetection from '@react-native-ml-kit/face-detection';

import { Colors, Fonts } from '@/constants/theme';
import { getHeight, getWidth } from '@/hooks/use-responsive-sizing';
import { registerEmployee } from '@/services/api';

export default function ProfileSetupScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [joinDate, setJoinDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [faceImage, setFaceImage] = useState<any>(null);
  const [faceRect, setFaceRect] = useState<any>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectingFace, setDetectingFace] = useState(false);

  // Format date for display
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // iOS keeps picker open
    if (selectedDate) {
      setJoinDate(selectedDate);
    }
  };

  // Capture from camera only
  const captureFromCamera = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 1,
        saveToPhotos: false,
        cameraType: 'front',
        includeBase64: false,
      });
      
      if (result.didCancel) {
        console.log('[ProfileSetupScreen] Camera cancelled by user');
        return;
      }
      
      if (result.errorCode) {
        console.error('[ProfileSetupScreen] Camera error:', result.errorMessage);
        if (result.errorCode === 'permission') {
          Alert.alert(
            'Camera Permission Required',
            'Please enable camera permission in device settings to capture your photo for profile setup.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Camera Error',
            'Failed to access camera. Please try again or check device settings.',
            [{ text: 'OK' }]
          );
        }
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        processSelectedImage({ ...result.assets[0], isCamera: true });
      }
    } catch (error) {
      console.error('[ProfileSetupScreen] Unexpected camera error:', error);
      Alert.alert(
        'Camera Error',
        'An unexpected error occurred while accessing the camera.',
        [{ text: 'OK' }]
      );
    }
  };

  const processSelectedImage = async (asset: any) => {
    setDetectingFace(true);
    try {
      const uri = asset.uri!;
      const faces = await FaceDetection.detect(uri);
      if (faces.length > 0) {
        setFaceImage(asset);
        setFaceDetected(true);
        const { frame } = faces[0];
        setFaceRect({
          x: Math.round(frame.left),
          y: Math.round(frame.top),
          width: Math.round(frame.width),
          height: Math.round(frame.height),
        });
      } else {
        setFaceImage(null);
        setFaceDetected(false);
        setFaceRect(null);
        Alert.alert('No Face Detected', 'Please select a photo where your face is clearly visible.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to process face image.');
      setFaceImage(null);
      setFaceDetected(false);
    } finally {
      setDetectingFace(false);
    }
  };

  // Show options to choose camera or gallery
  const handlePickImage = async () => {
    await captureFromCamera();
  };

  const handleSubmit = async () => {
    if (!fullName || !email || !phone || !department || !position || !joinDate || !faceImage) {
      Alert.alert('Validation', 'Please fill all fields and select a face image.');
      return;
    }
    setLoading(true);
    try {
      // ── 1. Save profile locally (offline-first) ──────────────────────────
      const profilePayload = {
        fullName,
        email,
        phone,
        department,
        position,
        joinDate: formatDate(joinDate),
        faceImage,
        faceRect,
      };
      await AsyncStorage.setItem('profile', JSON.stringify(profilePayload));
      await AsyncStorage.setItem('profileSetupDone', 'true');

      // ── 2. Register employee with server (POST /api/employees) ───────────
      try {
        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('department', department);
        formData.append('position', position);
        formData.append('joinDate', formatDate(joinDate));
        // Attach face image — DO NOT set Content-Type manually
        formData.append('faceImage', {
          uri: faceImage.uri,
          type: 'image/jpeg',
          name: 'face.jpg',
        } as any);

        const data = await registerEmployee(formData);
        // Save server-assigned UUID for attendance marking
        await AsyncStorage.setItem('employeeUuid', data.uuid);
        console.log('[ProfileSetup] Employee registered, UUID:', data.uuid);
      } catch (apiErr: any) {
        if (typeof apiErr?.message === 'string' && apiErr.message.startsWith('CONFLICT:')) {
          // Already registered — not a fatal error; user can still use the app
          console.warn('[ProfileSetup] Conflict (duplicate email) — continuing:', apiErr.message);
        } else {
          // Network / server error — non-fatal (profile is already saved locally)
          console.warn('[ProfileSetup] API error (non-fatal):', apiErr);
          Alert.alert(
            'Server Sync Failed',
            'Your profile was saved locally. Check-in will work on this device. Sync will retry on next sign-in.',
            [{ text: 'OK' }],
          );
        }
      }

      // ── 3. Navigate to Attendance ─────────────────────────────────────────
      navigation.replace('Attendance');
    } catch (e) {
      Alert.alert('Error', 'Error saving profile. Please try again.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-add-outline" size={0.07 * getWidth()} color="#fff" />
          </View>
          <Text style={styles.title}>Set Up Your Profile</Text>
          <Text style={styles.subtitle}>
            Complete your details to get started{'\n'}with Face Attendance
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={Colors.light.backButton}
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.light.backButton}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            placeholderTextColor={Colors.light.backButton}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Department"
            placeholderTextColor={Colors.light.backButton}
            value={department}
            onChangeText={setDepartment}
          />
          <TextInput
            style={styles.input}
            placeholder="Position"
            placeholderTextColor={Colors.light.backButton}
            value={position}
            onChangeText={setPosition}
          />

          {/* Date Picker */}
          <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
            <View style={styles.dateRow}>
              <Text style={joinDate ? styles.dateText : styles.datePlaceholder}>
                {joinDate ? formatDate(joinDate) : 'Join Date'}
              </Text>
              <AntDesign name="calendar" size={0.05 * getWidth()} color={Colors.light.backButton} />
            </View>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={joinDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Face Image Picker — Camera Only */}
          <View>
            <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} activeOpacity={0.7}>
              {faceImage ? (
              <Image
                  source={{ uri: faceImage.uri }}
                  style={styles.faceImage}
                />
              ) : (
                <View style={styles.imagePickerInner}>
                  <Ionicons name="camera-outline" size={0.08 * getWidth()} color={Colors.light.buttonBg} />
                  <Text style={styles.imagePickerText}>Tap to capture your face with camera</Text>
                </View>
              )}
            </TouchableOpacity>
            {/* Face detection status badge */}
            {faceImage && (
              <View style={[styles.faceStatusBadge, !faceDetected && styles.faceStatusBadgeError]}>
                <Ionicons
                  name={faceDetected ? 'checkmark-circle' : 'close-circle'}
                  size={Math.round(0.041 * getWidth())}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.faceStatusText}>
                  {detectingFace ? 'DETECTING…' : faceDetected ? 'FACE VERIFIED' : 'NO FACE FOUND'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>{loading ? 'Saving…' : 'Save & Continue'}</Text>
          {!loading && <AntDesign name="arrowright" size={Math.round(0.046 * getWidth())} color="white" />}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: 0.062 * getWidth(),
    paddingTop: 0.06 * getHeight(),
    paddingBottom: 0.04 * getHeight(),
  },

  /* Header */
  headerSection: {
    alignItems: 'center',
    marginBottom: 0.035 * getHeight(),
  },
  iconCircle: {
    width: 0.17 * getWidth(),
    height: 0.17 * getWidth(),
    borderRadius: 0.085 * getWidth(),
    backgroundColor: Colors.light.buttonBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0.015 * getHeight(),
    shadowColor: Colors.light.buttonBg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 0.06 * getWidth(),
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 0.036 * getWidth(),
    fontWeight: '400',
    color: Colors.light.backButton,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginTop: 0.006 * getHeight(),
    lineHeight: 0.024 * getHeight(),
  },

  /* Form */
  formSection: {
    gap: 0.012 * getHeight(),
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 0.031 * getWidth(),
    paddingVertical: 0.016 * getHeight(),
    paddingHorizontal: 0.041 * getWidth(),
    fontSize: 0.038 * getWidth(),
    color: Colors.light.text,
    fontFamily: Fonts.sans,
    backgroundColor: '#F8FAFC',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 0.038 * getWidth(),
    color: Colors.light.text,
    fontFamily: Fonts.sans,
  },
  datePlaceholder: {
    fontSize: 0.038 * getWidth(),
    color: Colors.light.backButton,
    fontFamily: Fonts.sans,
  },
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.light.buttonBg,
    borderStyle: 'dashed',
    borderRadius: 0.041 * getWidth(),
    height: 0.17 * getHeight(),
    backgroundColor: '#EFF6FF',
  },
  imagePickerInner: {
    alignItems: 'center',
    gap: 0.008 * getHeight(),
  },
  imagePickerText: {
    color: Colors.light.buttonBg,
    fontSize: 0.034 * getWidth(),
    fontWeight: '500',
    fontFamily: Fonts.sans,
  },
  faceImage: {
    width: 0.22 * getWidth(),
    height: 0.22 * getWidth(),
    borderRadius: 0.11 * getWidth(),
    borderWidth: 2,
    borderColor: Colors.light.buttonBg,
  },

  /* Submit */
  submitBtn: {
    marginTop: 0.03 * getHeight(),
    backgroundColor: Colors.light.buttonBg,
    paddingVertical: 0.019 * getHeight(),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 0.02 * getWidth(),
    shadowColor: Colors.light.buttonBg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 0.045 * getWidth(),
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },

  /* Face detection status badge */
  faceStatusBadge: {
    marginTop: 0.012 * getHeight(),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059668',
    borderRadius: 0.024 * getWidth(),
    paddingVertical: 0.008 * getHeight(),
    paddingHorizontal: 0.031 * getWidth(),
    justifyContent: 'center',
  },
  faceStatusBadgeError: {
    backgroundColor: '#DC2626',
  },
  faceStatusText: {
    color: '#fff',
    fontSize: 0.034 * getWidth(),
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
});
