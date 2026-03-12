# FAI — Facial Attendance Intelligence
## Technical Architecture Document

---

## 1. Project Overview

FAI is a **React Native** mobile application that enables contactless, GPS-verified employee attendance using **on-device face recognition**. No biometric data is ever transmitted over the network — all face comparison is done locally on the device using a TFLite model.

---

## 2. Technology Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Mobile Framework | React Native | 0.73+ (bare workflow) |
| Language | TypeScript | Strict mode |
| Navigation | React Navigation (Stack) | v6 |
| Camera | react-native-vision-camera | High-perf native camera |
| Face Detection | @react-native-ml-kit/face-detection | On-device ML Kit |
| Face Embedding | Custom TFLite Native Module (`FaceEmbeddingModule`) | 128-d embeddings |
| Image Picker | react-native-image-picker | Gallery + native camera |
| Local Storage | @react-native-async-storage/async-storage | Key-value persistence |
| Geolocation | @react-native-community/geolocation | Fine-location |
| HTTP Client | Native `fetch` API | No extra lib |
| Animations | lottie-react-native | JSON Lottie animations |
| Icons | react-native-vector-icons (Ionicons, AntDesign, EvilIcons) | |
| Backend | ASP.NET Core Web API | REST, JSON/Multipart |

---

## 3. Screen Flow

```
App Launch
    │
    ▼
HomeScreen ──── profileSetupDone=true? ──► AttendanceScreen
    │                                           │
    │ No                                        │ Face scan + confirm
    ▼                                           ▼
ProfileSetupScreen                        StatusScreen
    │ POST /api/employees                       │ POST /api/attendance (on match)
    │ Save UUID + profile locally              │ Write attendanceDate
    ▼                                           ▼
AttendanceScreen                          Home (Done) / Retry (Fail)
```

---

## 4. Face Recognition Pipeline (On-Device)

1. **Profile Setup** — User captures a face photo. ML Kit detects the face and returns a bounding rect (`faceRect`). Both the image URI and rect are stored in AsyncStorage.

2. **Attendance Check-in** — User faces the front camera via `react-native-vision-camera`. They tap "Capture"; a photo is taken, ML Kit runs face detection, and the bounding rect is extracted from the captured image.

3. **Embedding Comparison** — The native `FaceEmbeddingModule` (TFLite) receives both URIs + rects, crops each image to the face region, runs them through a MobileNet-based face embedding model, and returns a **cosine similarity score** (0.0 – 1.0).

4. **Match Decision** — `isFaceMatch(similarity)` returns `true` if score ≥ **0.85** (configurable via `SIMILARITY_THRESHOLD` in `face-embedding.ts`).

> **Security note:** No face image or embedding is ever sent to the server. The API receives only the employee UUID.

---

## 5. Attendance Guard Logic

The attendance check-in has **three layered gates** that must all pass before the camera capture button is enabled:

### Gate 1 — Time Window (9 AM – 5 PM)
```typescript
function isWithinWindow(): boolean {
  const hour = new Date().getHours();
  return hour >= 9 && hour < 17; // 09:00–16:59 local device time
}
```
- Evaluated on screen mount and refreshed via `setInterval` every 60 seconds.
- Outside window: grey disabled button + amber banner "Check-in available 9:00 AM – 5:00 PM only".

### Gate 2 — Geolocation (Haversine ≤ 100 m)
```typescript
// Office coordinates hardcoded in use-geolocation.tsx
const loc1 = { latitude: 24.8950233, longitude: 67.1521653 };
// Haversine formula → distance in metres
setIsHaversineTrue(distance <= 100);
```
- Requires `ACCESS_FINE_LOCATION` permission.
- Outside radius: red banner "Must be within office premises".

### Gate 3 — One-Time Daily Check-In
```
AsyncStorage key: "attendanceDate"  →  value: "YYYY-MM-DD" (local)
```
- **Written** in `StatusScreen.tsx` after successful face match + API confirmation in `finally` block (always writes, even on 409 or network error).
- **Read** in `AttendanceScreen.tsx` via `useFocusEffect` on every screen focus.
- **Self-resets** automatically: tomorrow's date never equals today's stored string — no cron job, scheduler, or explicit reset needed.
- If already checked in → full-screen "Already Checked In" state with "Back to Home" button.

---

## 6. API Integration

### Base URL
```
http://10.0.2.2:5063   ← Android emulator (localhost proxy)
```
Swap to your machine's LAN IP for physical devices.

### Endpoints Used by the App

| Screen | Method | Endpoint | Trigger |
|---|---|---|---|
| ProfileSetupScreen | POST | `/api/employees` | multipart/form-data on first profile save |
| StatusScreen | POST | `/api/attendance` | After face match confirmed |

### Employee Registration Flow
```
ProfileSetupScreen.handleSubmit()
  1. Save profile + faceRect to AsyncStorage (offline-first)
  2. Build FormData (name, email, phone, dept, position, joinDate, faceImage file)
  3. POST /api/employees (no Content-Type header — fetch sets multipart boundary)
  4. On 201: save response.uuid → AsyncStorage key "employeeUuid"
  5. On 409 (duplicate): log warning, continue (app still works)
  6. On network error: show "Server Sync Failed" alert, still navigate to Attendance
```

### Attendance Marking Flow
```
StatusScreen (matched === true)
  1. Read "employeeUuid" from AsyncStorage
  2. POST /api/attendance  { uuid }
  3. On 201: log success
  4. On 409 "ALREADY_MARKED": log, treat as non-error
  5. On network error: show amber inline banner (non-blocking)
  6. finally: write attendanceDate = today → triggers Gate 3
```

---

## 7. Data Storage Model (AsyncStorage)

| Key | Value | Set By | Read By |
|---|---|---|---|
| `profile` | JSON — `{ fullName, email, phone, department, position, joinDate, faceImage, faceRect }` | ProfileSetupScreen / ProfileScreen | AttendanceScreen, ProfileScreen |
| `profileSetupDone` | `"true"` | ProfileSetupScreen | HomeScreen, AttendanceScreen, StatusScreen |
| `employeeUuid` | UUID string from API | ProfileSetupScreen | StatusScreen |
| `attendanceDate` | `"YYYY-MM-DD"` | StatusScreen (finally) | AttendanceScreen (useFocusEffect) |

---

## 8. Camera & Image Handling

- **Front camera live feed:** `react-native-vision-camera` renders a native camera view, photo taken via `cameraRef.takePhoto({ flash: 'off' })`.
- **Image picker (profile):** `react-native-image-picker` — the OS camera pipeline writes a correctly-oriented JPEG. **No `scaleX: -1` flip is applied** — the previous mirror was a double-flip bug (fixed in this release).
- **File URI:** Android requires `file://` prefix (`Platform.OS === 'android' ? 'file://${path}' : path`).

---

## 9. Offline-First Design

The app is designed to be **fully functional without a server** for the core attendance workflow:
1. Face images and profile data stored locally via AsyncStorage.
2. The face comparison is 100% on-device (TFLite native module).
3. The `attendanceDate` gate works independently of any API response.
4. API failures (registration/attendance) are non-fatal — the user is informed and can proceed.

---

## 10. Security Considerations

| Concern | Implementation |
|---|---|
| Face data privacy | Embeddings and images never leave the device |
| Location spoofing | GPS with high-accuracy mode; haversine ≤ 100 m |
| Replay attacks | One-time daily gate prevents double check-in |
| Time manipulation | Device clock used (could be hardened with NTP server time) |
| UUID exposure | UUID only used to attribute attendance; no PII |
| Rate limiting | Server enforces 100 req/min per IP |

---

## 11. Common Interview Q&A

**Q: How does the face recognition work?**
> On-device only. ML Kit detects face bounding boxes; a custom TFLite MobileNet model generates 128-d embeddings; cosine similarity ≥ 0.85 = match. No face data transmitted.

**Q: How do you prevent someone from checking in twice?**
> AsyncStorage stores today's date string after first successful check-in. On re-entry, `useFocusEffect` compares stored date with `new Date()` local date string — mismatch on any new day naturally resets access.

**Q: What happens if the server is unreachable?**
> The app is offline-first. Profile and face images are stored locally. Face comparison is local. The daily attendance gate writes regardless of API success (in a `finally` block). A non-blocking banner informs the user.

**Q: How is geolocation verified?**
> Haversine formula computes the great-circle distance in metres between the device's GPS coords and the hardcoded office location. Must be ≤ 100 m to enable check-in.

**Q: Why use cosine similarity for face matching?**
> Cosine similarity measures the angle between two embedding vectors rather than their magnitude, making it invariant to lighting changes and slight rotations — the same person in different conditions still produces vectors pointing in the same direction (high similarity).
