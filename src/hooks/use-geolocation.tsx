import { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

// ─── Office Location Config ────────────────────────────────────────────────────
// Update these to your actual office coordinates.
// Tip: open Google Maps, tap your office → copy the lat/long from the share link.
const OFFICE_LATITUDE  = 24.8950233;
const OFFICE_LONGITUDE = 67.1521653;

// Allowed check-in radius in metres.
// 300 m accounts for GPS drift on real devices (typically ±15–50 m).
const ALLOWED_RADIUS_METRES = 300;
// ─────────────────────────────────────────────────────────────────────────────

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
  const [distanceMetres, setDistanceMetres] = useState<number | null>(null);

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

            // Haversine formula — great-circle distance in metres
            const R = 6371e3;
            const φ1 = toRad(OFFICE_LATITUDE);
            const φ2 = toRad(loc.coords.latitude);
            const Δφ = toRad(loc.coords.latitude - OFFICE_LATITUDE);
            const Δλ = toRad(loc.coords.longitude - OFFICE_LONGITUDE);
            const a =
              Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            console.log(
              `[Geolocation] Device: ${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}` +
              ` | Office: ${OFFICE_LATITUDE}, ${OFFICE_LONGITUDE}` +
              ` | Distance: ${Math.round(distance)} m (limit: ${ALLOWED_RADIUS_METRES} m)` +
              ` | GPS Accuracy: ±${Math.round(loc.coords.accuracy)} m`,
            );

            setDistanceMetres(Math.round(distance));
            setIsHaversineTrue(distance <= ALLOWED_RADIUS_METRES);
          },
          (error) => {
            setErrorMsg(error.message);
            console.error('[Geolocation] Error:', error.message);
          },
          {
            enableHighAccuracy: false,  // network/WiFi loc — faster, works indoors
            timeout: 20000,
            maximumAge: 60000,          // accept a position up to 60 s old
          },
        );
      } catch (e) {
        setErrorMsg('Location module not available');
      }
    }

    getCurrentLocation();
  }, []);

  return { location, errorMsg, isHaversineTrue, distanceMetres };
}