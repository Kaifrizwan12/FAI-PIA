# FAI 🚀 — Facial Attendance Intelligence

> **Next-gen attendance system powered by on-device face recognition and smart location verification!**

Experience the future of employee attendance tracking. FAI combines cutting-edge face recognition technology with intelligent geolocation verification to create a secure, privacy-first attendance system. Your data stays on your device—no cloud uploads, no compromise on privacy.

---

## 🎯 What Makes FAI Special

✨ **AI-Powered Recognition**
- Advanced on-device face detection using ML Kit
- TFLite-based face embedding comparison (128-d vectors)
- Cosine similarity matching (0.85+ threshold)

🔐 **Privacy First**
- Zero face data transmission—all processing happens locally
- No cloud uploads, no biometric databases
- Your phone, your data, your control

📍 **Smart Location Verification**
- Haversine-based GPS verification (±100m radius)
- Real-time geolocation capture at check-in
- Graceful fallback for permission denials

⚡ **Bulletproof Logic**
- Three-layer attendance gates (time → location → daily limit)
- Automatic daily reset (no manual handling)
- Offline-first architecture with smart syncing

🎬 **Smooth User Experience**
- Real-time face detection feedback
- Instant visual feedback (detected → verified → failed)
- Non-blocking error states

---

## 🛠️ Tech Stack

| Component | Technology | Why? |
|-----------|-----------|------|
| **Mobile** | React Native 0.73+ | Cross-platform, native performance |
| **Language** | TypeScript (strict) | Type safety, better IDE support |
| **Face Detection** | ML Kit (Android) | On-device, zero latency |
| **Face Embedding** | Custom TFLite Module | 128-d vectors, cosine similarity |
| **Camera** | react-native-vision-camera | High-performance native camera feed |
| **Storage** | AsyncStorage | Local-first persistence |
| **Navigation** | React Navigation v6 | Typed, performant routing |
| **Location** | @react-native-community/geolocation | Fine-grained GPS access |
| **Backend** | ASP.NET Core REST API | Scalable, secure, multipart support |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 16+ and npm/yarn
- **Android SDK** 21+ (emulator or physical device)
- **Git** (for version control)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/FAI.git
cd FAI

# Install dependencies
npm install

# Start Metro (JS bundler)
npm start
```

### Running on Android

In a new terminal:
```bash
npm run android
```

The app will build and install automatically on your emulator or connected device!

### Development Tips

- **Hot Reload** — Changes auto-refresh via Fast Refresh
- **Force Reload** — Press `R` twice in terminal
- **Debug** — Use React Native Debugger or Chrome DevTools
- **Clear Cache** — `npm start -- --reset-cache`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│         APP ENTRY POINT (Home)          │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┼────────────┐
        │                         │
        ▼                         ▼
   [New User]            [Existing User]
        │                         │
        ▼                         ▼
  ProfileSetup              Attendance
        │                         │
        │ POST /api/employees     │ Face Capture
        │                         │ + Geolocation
        ▼                         ▼
     Status                    Status
        │                         │
        └─────────────┬───────────┘
                      ▼
               Home (Complete)
```

### Core Modules

```
src/
├── screens/                           # UI Components
│   ├── CameraPermissionScreen.tsx     # Permission gateway
│   ├── ProfileSetupScreen.tsx         # Employee registration
│   ├── AttendanceScreen.tsx           # Daily check-in
│   ├── StatusScreen.tsx               # Result verification
│   └── ProfileScreen.tsx              # Profile management
│
├── services/
│   ├── api.ts                         # REST API client
│   ├── face-embedding.ts              # Face comparison logic
│   └── geolocation.ts                 # Location services
│
├── hooks/                             # React Hooks
│   ├── use-geolocation.tsx           # Location logic
│   ├── use-network-status.ts         # Connectivity check
│   └── use-status.tsx                # Attendance status
│
├── navigation/
│   ├── RootNavigator.tsx             # Screen stack
│   └── types.ts                      # Navigation types
│
├── components/                        # Reusable UI
├── constants/                         # Theme & config
└── types/                             # TypeScript interfaces
```

---

## 🔑 Key Features Deep Dive

### 🎬 On-Device Face Recognition

**Pipeline:**
1. **Capture** — User takes a selfie (ProfileSetup or Attendance)
2. **Detect** — ML Kit extracts face bounding box
3. **Extract** — TFLite model converts face to 128-d embedding vector
4. **Compare** — Cosine similarity against stored embedding
5. **Decide** — Match if similarity ≥ 0.85 (configurable)

```typescript
// Example: isFaceMatch(0.87) → true (exceeds 0.85 threshold)
```

**Why Cosine Similarity?**
- Invariant to lighting changes and slight rotations
- Numerically stable (ranges 0.0–1.0)
- Fast computation on mobile

### 🛡️ Three-Layer Attendance Gates

**Gate 1: Time Window**
```
Available: 9:00 AM – 4:59 PM (local device time)
Outside: Red banner + disabled button
```

**Gate 2: Geolocation**
```
Required: Within 100m of office (Haversine formula)
Denied: Red banner + disabled button
```

**Gate 3: Daily Limit**
```
Rule: One check-in per calendar day
Stored: AsyncStorage key "attendanceDate" → "YYYY-MM-DD"
Reset: Automatic (tomorrow's date never equals today)
```

### 🌐 Offline-First Sync

Local data persists in AsyncStorage:
- Profile info + face image
- Face bounding rectangle
- Employee UUID (after registration)
- Attendance date flag

On network restore, sync happens automatically. App remains 100% functional offline for profile viewing and face comparison.

---

## 📡 API Endpoints

### Base URL
```
Android Emulator: http://10.0.2.2:5063 (localhost proxy)
Physical Device: http://<your-machine-ip>:5063
```

### Endpoints

| Endpoint | Method | Purpose | Trigger |
|----------|--------|---------|---------|
| `/api/employees` | POST | Register employee | ProfileSetupScreen.handleSubmit() |
| `/api/attendance` | POST | Mark attendance | StatusScreen (on face match) |

### Request/Response Examples

**POST /api/employees** (multipart/form-data)
```
Fields: fullName, email, phone, department, position, joinDate, faceImage (file)
Response: { success: true, uuid: "550e8400-e29b-41d4-a716-446655440000" }
Error: 409 Conflict (duplicate email)
```

**POST /api/attendance** (JSON)
```
Body: { uuid: "550e8400-..." }
Response: { success: true, timestamp: "2026-03-17T14:32:00Z" }
Error: 409 Already Marked (today)
```

---

## 💾 Data Storage

### AsyncStorage Keys

| Key | Example Value | Scope |
|-----|---------------|---------| 
| `profile` | `{"fullName":"John","email":"john@...","faceImage":"..."}` | User profile |
| `employeeUuid` | `"550e8400-e29b-41d4-a716-446655440000"` | API registration |
| `attendanceDate` | `"2026-03-17"` | Daily gate |
| `profileSetupDone` | `"true"` | Onboarding flag |

---

## 🔒 Security & Privacy

| Area | Implementation |
|------|-----------------|
| **Face Privacy** | Embeddings generated locally, never transmitted |
| **Location** | Haversine with ±100m tolerance (spoofing-resistant) |
| **Data Storage** | AsyncStorage (device-level encryption) |
| **API Auth** | UUID-based (extensible to JWT) |
| **Device Clock** | Uses local time (future: NTP hardening) |

---

## 🧪 Testing the Flow

✅ **Fresh Install**
- [ ] Grant camera + location permissions
- [ ] Register with profile photo
- [ ] See "Profile Setup Complete" message
- [ ] Navigate to Attendance screen

✅ **Daily Attendance**
- [ ] Check-in within 9 AM – 5 PM
- [ ] Confirm within office boundary
- [ ] Take attendance selfie
- [ ] See success confirmation + timestamp

✅ **Error Cases**
- [ ] Try check-in outside time window → blocked
- [ ] Try check-in outside office → blocked
- [ ] Try check-in twice same day → blocked
- [ ] Face mismatch → "Verification Failed" state
- [ ] Network error → non-blocking banner + retry option

---

## 🚀 Future Roadmap

- 🎯 **Liveness Detection** — Prevent spoofing with blink/movement detection
- 📊 **Attendance Dashboard** — View check-in history + analytics
- 🔐 **JWT Authentication** — Replace UUID with secure tokens
- 🌙 **Dark Mode** — System-aware theme switching
- 🔔 **Push Notifications** — Sync alerts + reminders
- 📈 **Admin Portal** — Server-side attendance review interface

---

## 🐛 Troubleshooting

**Face not detecting?**
- Ensure good lighting (avoid backlight)
- Face camera directly at device
- Try registering again with clearer photo

**Location not working?**
- Grant `ACCESS_FINE_LOCATION` in Settings > Apps > FAI
- Ensure GPS is enabled on device
- Move closer to office boundary (check Haversine distance)

**App won't build?**
```bash
# Clear caches and rebuild
rm -rf node_modules package-lock.json
npm install
npm run android
```

**"Already Checked In" error?**
- This is expected if you've already checked in today
- Error resets automatically at midnight (local date change)

---

## 📄 License

MIT License — Open source and free to use!

---

## 🤝 Contributing

Found a bug or have ideas? We'd love your help!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-idea`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push and open a Pull Request

---

## 👥 Credits

Built with ❤️ and cutting-edge tech:
- **React Native** — Cross-platform mobile dev
- **ML Kit** — On-device face detection
- **TFLite** — Lightweight embeddings
- **ASP.NET Core** — Robust backend

---

## 📞 Support

- 🐛 **Issues** → [GitHub Issues](https://github.com/yourusername/FAI/issues)
- 💬 **Questions** → [GitHub Discussions](https://github.com/yourusername/FAI/discussions)
- 📧 **Email** → support@fai-attendance.com

---

<div align="center">

**Attendance. Reimagined. 🎯**

[⭐ Make this project shine — Star it on GitHub!](https://github.com/yourusername/FAI)

**Made with 🔬 ML precision and 💡 innovation**

</div>
