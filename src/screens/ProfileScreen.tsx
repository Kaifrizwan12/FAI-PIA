import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FaceDetection from '@react-native-ml-kit/face-detection';

import { Colors, Fonts } from '@/constants/theme';
import { getHeight, getWidth } from '@/hooks/use-responsive-sizing';

type ProfileData = {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joinDate: string;
  faceImage: { uri: string, isCamera?: boolean } | null;
  faceRect: { x: number; y: number; width: number; height: number } | null;
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const data = await AsyncStorage.getItem('profile');
      if (data) {
        setProfile(JSON.parse(data));
      }
    };
    loadProfile();
  }, []);

  // Update face image — camera or gallery, no mirroring
  const handleUpdatePhoto = () => {
    console.log('[ProfileScreen] handleUpdatePhoto pressed');
    Alert.alert('Update Face Photo', 'Choose how to update your photo', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await launchCamera({
            mediaType: 'photo',
            quality: 1,
            saveToPhotos: false,
            cameraType: 'front',
            includeBase64: false,
          });
          if (!result.didCancel && result.assets && result.assets.length > 0) {
            updateProfileImage({ ...result.assets[0], isCamera: true });
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 1,
            selectionLimit: 1,
            includeBase64: false,
          });
          if (!result.didCancel && result.assets && result.assets.length > 0) {
            updateProfileImage({ ...result.assets[0], isCamera: false });
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const updateProfileImage = async (imageAsset: any) => {
    if (!profile) return;
    console.log('[ProfileScreen] updateProfileImage called with asset:', imageAsset.uri);
    
    try {
      const uri = imageAsset.uri!;
      const faces = await FaceDetection.detect(uri);
      
      if (faces.length > 0) {
        const { frame } = faces[0];
        const faceRect = {
          x: Math.round(frame.left),
          y: Math.round(frame.top),
          width: Math.round(frame.width),
          height: Math.round(frame.height),
        };
        
        const updatedProfile = { 
          ...profile, 
          faceImage: imageAsset,
          faceRect: faceRect
        };
        setProfile(updatedProfile);
        await AsyncStorage.setItem('profile', JSON.stringify(updatedProfile));
        Alert.alert('Success', 'Profile photo updated successfully.');
      } else {
        Alert.alert('No Face Detected', 'Please select a photo where your face is clearly visible.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to process face image.');
    }
  };

  if (!profile) {
    return (
      <View style={styles.loader}>
        <Text style={styles.loaderText}>Loading…</Text>
      </View>
    );
  }

  const fields = [
    { label: 'FULL NAME', value: profile.fullName, icon: 'person-outline' as const },
    { label: 'EMAIL', value: profile.email, icon: 'mail-outline' as const },
    { label: 'PHONE', value: profile.phone, icon: 'call-outline' as const },
    { label: 'DEPARTMENT', value: profile.department, icon: 'business-outline' as const },
    { label: 'POSITION', value: profile.position, icon: 'briefcase-outline' as const },
    { label: 'JOIN DATE', value: profile.joinDate, icon: 'calendar-outline' as const },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={Math.round(0.062 * getWidth())} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Avatar + Update Button */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          {profile.faceImage ? (
            <Image
              source={{ uri: profile.faceImage.uri }}
              style={[styles.avatar, { transform: [{ scaleX: profile.faceImage.isCamera ? -1 : 1 }] }]}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={0.12 * getWidth()} color="#fff" />
            </View>
          )}
          {/* Camera overlay icon */}
          <Pressable style={styles.editPhotoBtn} onPress={handleUpdatePhoto}>
            <Ionicons name="camera" size={Math.round(0.04 * getWidth())} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.profileName}>{profile.fullName}</Text>
        <Text style={styles.profileRole}>{profile.position}</Text>

        <Pressable style={styles.updatePhotoBtn} onPress={handleUpdatePhoto}>
          <Ionicons name="camera-outline" size={Math.round(0.04 * getWidth())} color={Colors.light.buttonBg} />
          <Text style={styles.updatePhotoText}>Update Photo</Text>
        </Pressable>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        {fields.map((field, index) => (
          <React.Fragment key={field.label}>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons
                  name={field.icon}
                  size={Math.round(0.051 * getWidth())}
                  color={Colors.light.buttonBg}
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{field.label}</Text>
                <Text style={styles.rowValue}>{field.value}</Text>
              </View>
            </View>
            {index < fields.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loader: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    fontSize: 0.038 * getWidth(),
    color: Colors.light.backButton,
    fontFamily: Fonts.sans,
  },

  /* Header */
  header: {
    width: '100%',
    height: 0.09 * getHeight(),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0.051 * getWidth(),
    paddingTop: 0.022 * getHeight(),
    backgroundColor: Colors.light.background,
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

  /* Avatar Section */
  avatarSection: {
    alignItems: 'center',
    marginTop: 0.02 * getHeight(),
    marginBottom: 0.03 * getHeight(),
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 0.015 * getHeight(),
  },
  avatar: {
    width: 0.28 * getWidth(),
    height: 0.28 * getWidth(),
    borderRadius: 0.14 * getWidth(),
    borderWidth: 3,
    borderColor: Colors.light.buttonBg,
  },
  avatarPlaceholder: {
    width: 0.28 * getWidth(),
    height: 0.28 * getWidth(),
    borderRadius: 0.14 * getWidth(),
    backgroundColor: Colors.light.buttonBg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.buttonBg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editPhotoBtn: {
    position: 'absolute',
    bottom: 0.005 * getHeight(),
    right: 0,
    width: 0.09 * getWidth(),
    height: 0.09 * getWidth(),
    borderRadius: 0.045 * getWidth(),
    backgroundColor: Colors.light.buttonBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  profileName: {
    fontSize: 0.056 * getWidth(),
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: Fonts.sans,
  },
  profileRole: {
    fontSize: 0.036 * getWidth(),
    fontWeight: '400',
    color: Colors.light.backButton,
    fontFamily: Fonts.sans,
    marginTop: 0.003 * getHeight(),
  },
  updatePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0.015 * getWidth(),
    marginTop: 0.015 * getHeight(),
    paddingVertical: 0.008 * getHeight(),
    paddingHorizontal: 0.04 * getWidth(),
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.light.buttonBg,
    backgroundColor: Colors.light.background,
  },
  updatePhotoText: {
    color: Colors.light.buttonBg,
    fontSize: 0.034 * getWidth(),
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },

  /* Details card */
  card: {
    marginHorizontal: 0.051 * getWidth(),
    backgroundColor: Colors.light.background,
    borderRadius: 0.051 * getWidth(),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 0.01 * getHeight(),
    paddingHorizontal: 0.051 * getWidth(),
    marginBottom: 0.04 * getHeight(),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0.036 * getWidth(),
    paddingVertical: 0.017 * getHeight(),
  },
  rowIcon: {
    width: 0.103 * getWidth(),
    height: 0.103 * getWidth(),
    borderRadius: 0.051 * getWidth(),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 0.028 * getWidth(),
    fontWeight: '600',
    color: Colors.light.backButton,
    letterSpacing: 0.6,
    fontFamily: Fonts.sans,
    marginBottom: 0.002 * getHeight(),
  },
  rowValue: {
    fontSize: 0.041 * getWidth(),
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: Fonts.sans,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
});
