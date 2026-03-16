# FAI Application - Flow & Error Handling Analysis

## 1. CAMERA PERMISSION FLOW ✅
**File**: `CameraPermissionScreen.tsx`

### Status: ✅ GOOD
- Clear permission request UI
- Two options: "Allow Camera Access" or "Open Settings"
- Auto-redirects to ProfileSetup if permission already granted
- **User Feedback**: ✅ Clear explanation of why camera is needed

---

## 2. PROFILE SETUP FLOW
**File**: `ProfileSetupScreen.tsx`

### Issues Found:

#### ❌ Issue 1: No user feedback when camera fails to open
- **Problem**: If `launchCamera()` fails, user gets no error message
- **Impact**: Silent failure, user confused
- **Fix**: Add error handling in `captureFromCamera()`

#### ❌ Issue 2: No user feedback for AsyncStorage errors
- **Problem**: If AsyncStorage.setItem fails during profile save, user only sees "Error saving profile"
- **Impact**: User doesn't know if profile was saved or not
- **Recommendation**: Add more specific error messages

#### ✅ Good: Face detection feedback
- Shows green badge "FACE VERIFIED" when face detected
- Shows red badge when no face found
- User knows face detection status

#### ⚠️ Concern: Server registration failures are non-fatal
- Profile saved locally even if API fails
- Shows alert: "Your profile was saved locally. Check-in will work on this device. Sync will retry."
- **Problem**: No UUID stored if registration fails, so attendance won't sync later
- **Current**: Sets `employeeUuid` only on success
- **Recommendation**: This is acceptable but user should know they might need to retry registration

---

## 3. ATTENDANCE CAPTURE FLOW
**File**: `AttendanceScreen.tsx`

### Issues Found:

#### ❌ Issue 1: Geolocation errors NOT shown to user
- **Problem**: If `Geolocation.getCurrentPosition()` fails, error is only logged
- `console.warn('[AttendanceScreen] Location capture error:', error.message)`
- User proceeds without knowing location capture failed
- **Impact**: User thinks location was sent to server, but it wasn't
- **Fix**: Show user alert: "Location capture failed. Check-in will proceed without location data."

#### ❌ Issue 2: Android location permission failures silently ignored
```typescript
if (granted === PermissionsAndroid.RESULTS.GRANTED) {
  // get location
} else {
  resolve(null);  // ← SILENTLY RETURNS NULL
}
```
- **Fix**: Show user alert explaining location permission needed

#### ❌ Issue 3: No user feedback during face comparison
- Message says "Comparing faces…" but if it takes long, user might think app froze
- **Recommendation**: Add timeout or loading animation (already has spinner, but message unclear)

#### ✅ Good: Face detection feedback
- Shows "DETECTING FACE" while processing
- Shows "FACE VERIFIED ✓" when detected
- Shows "NO FACE DETECTED" when none found
- Status badge is clear and actionable

#### ✅ Good: Time window and already checked-in gates
- Prevents check-in outside 9-5 hours
- Prevents duplicate check-in on same day
- User gets clear message: "Already Checked In"

---

## 4. ATTENDANCE STATUS FLOW
**File**: `StatusScreen.tsx`

### Issues Found:

#### ❌ Issue 1: UUID not available message is not shown to user
```typescript
if (!uuid) {
  console.warn('[StatusScreen] No employeeUuid found — skipping API call');
  setApiCallDone(true);
  setApiSuccess(false);
  return;
}
```
- **Problem**: User sees "Attendance Marked Successfully" but UUID wasn't sent to server
- **Impact**: Server won't have attendance record
- **Fix**: Show error state instead of success, tell user "Profile not synced with server"

#### ⚠️ Issue 2: Partial success message is unclear
- Shows: "Face matched. Local record saved.\nServer sync will retry."
- **Problem**: User doesn't know if they should retry immediately or wait
- **Recommendation**: Add "Retry" button or clear next steps

#### ❌ Issue 3: Location data passed but user never sees feedback
- Location is captured but not displayed to user
- If location capture failed, user has no way to know
- **Fix**: Show location coordinates in details card for transparency

#### ✅ Good: Face match display
- Shows match percentage (e.g., "92% Match")
- Green checkmark for success, red X for failure
- Clear visual feedback

#### ✅ Good: API error handling
- Distinguishes between 409 (already marked) and other errors
- Only marks attendance locally on success
- Shows error banner for retry scenarios

---

## 5. PROFILE UPDATE FLOW
**File**: `ProfileScreen.tsx`

### Issues Found:

#### ❌ Issue 1: Camera launch errors not handled
- No try-catch around `launchCamera()`
- If camera fails, user gets nothing

#### ✅ Good: Face detection feedback
- Shows "DETECTING…" (amber) while processing
- Shows "FACE VERIFIED" (green) on success
- Shows "NO FACE FOUND" (red) on failure
- Clear status badge

---

## 6. API ERROR HANDLING
**File**: `api.ts`

### Issues Found:

#### ⚠️ Issue: Generic error messages
- Shows `error.message` from server without user-friendly translation
- Examples: "Network timeout", "500 Internal Server Error"
- **Recommendation**: Map server errors to user-friendly messages

#### ✅ Good: 409 Already Marked is handled distinctly
- Treated as success case
- User not confused by "error"

---

## 7. GEOLOCATION HANDLING
**File**: `AttendanceScreen.tsx` (captureLocation function)

### Critical Issues:

#### ❌ Issue 1: Location errors silently fail
- Android permission denied → silently returns `null`
- Geolocation timeout → silently returns `null`
- User never informed

#### ❌ Issue 2: No fallback mechanism
- If location unavailable, user can still check in but server won't know location
- Could be abuse vector - someone checking in remotely

#### ❌ Issue 3: Privacy not transparent
- No message to user that location is being captured
- No "allow" dialog visible in UI (handled by permissions)
- **Recommendation**: Show user message: "Capturing location..." or after: "Location captured: [coordinates]"

---

## 8. FACE COMPARISON FLOW

### Issues Found:

#### ⚠️ Issue: No fallback if profile face image corrupted
```typescript
if (!profile.faceImage?.uri) {
  setMessage('No profile photo found — update your profile');
  setComparing(false);
  return;
}
```
- Good error handling, but user must go back and redo profile
- **Recommendation**: Offer "Update Profile" button on error screen

#### ⚠️ Issue: No timeout on face comparison
- Could hang if TFLite module has issue
- **Recommendation**: Add 30-second timeout with error message

---

## SUMMARY OF ISSUES

### 🔴 Critical (User doesn't know what happened)
1. **Geolocation errors silently fail** - User thinks location sent but it wasn't
2. **UUID missing not shown to user** - User sees success but attendance doesn't sync
3. **Camera/location permission failures silently ignored**

### 🟡 Important (User confusion)
1. **Partial success message unclear** - Doesn't explain next steps
2. **No location transparency** - User doesn't see if location captured
3. **Face comparison could hang** - No timeout

### 🟢 Good (But could improve)
1. **Face detection feedback** - Clear badges showing status
2. **Time windows** - Prevents off-hours check-in
3. **500 error messages** - Generic but handled

---

## RECOMMENDED FIXES

### Priority 1 (Must Fix):
1. Show user alert when geolocation fails
2. Show user alert when UUID is missing
3. Show location transparency (either "Location captured" or "Location unavailable")

### Priority 2 (Should Fix):
1. Add timeout to face comparison
2. Make "Partial Success" show retry button
3. Handle camera permission denial with alert

### Priority 3 (Nice to Have):
1. User-friendly server error messages
2. Offer "Update Profile" button on face comparison error
3. Show location coordinates in status screen details
