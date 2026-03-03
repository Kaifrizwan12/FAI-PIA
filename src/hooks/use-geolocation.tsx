import { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

type LocationObject = {
  coords: {
    accuracy: number;
    altitude: number;
    altitudeAccuracy: number;
    heading: number;
    latitude: number;
    longitude: number;
    speed: number;
  };
  mocked: boolean;
  timestamp: number;
};

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return true;
  }
  // Android
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Permission',
      message: 'This app needs access to your location for attendance verification.',
      buttonPositive: 'OK',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export function useGeolocation() {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [isHaversineTrue, setIsHaversineTrue] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    function toRad(value: number) {
      return (value * Math.PI) / 180;
    }

    async function getCurrentLocation() {
      try {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        Geolocation.getCurrentPosition(
          (position) => {
            const loc: LocationObject = {
              coords: {
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude ?? 0,
                altitudeAccuracy: position.coords.altitudeAccuracy ?? 0,
                heading: position.coords.heading ?? 0,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                speed: position.coords.speed ?? 0,
              },
              mocked: false,
              timestamp: position.timestamp,
            };
            setLocation(loc);

            // run haversine check immediately with the fetched location
            const loc1 = { latitude: 24.8950233, longitude: 67.1521653 };
            const R = 6371e3;
            const φ1 = toRad(loc1.latitude);
            const φ2 = toRad(loc.coords.latitude);
            const Δφ = toRad(loc.coords.latitude - loc1.latitude);
            const Δλ = toRad(loc.coords.longitude - loc1.longitude);
            const a =
              Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            setIsHaversineTrue(distance <= 100);
          },
          (error) => {
            setErrorMsg(error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          },
        );
      } catch (e) {
        setErrorMsg('Location module not available');
      }
    }

    getCurrentLocation();
  }, []);

  return { location, errorMsg, isHaversineTrue };
}