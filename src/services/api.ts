/**
 * FAI — Central API Service
 * Base URL: http://10.0.2.2:5063  (Android emulator → localhost)
 * For a physical device on the same Wi-Fi, replace with your machine's LAN IP.
 */

export const BASE_URL = 'http://192.168.137.236:5063';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegisterEmployeeResponse = {
    uuid: string;
    fullName: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    joinDate: string;
    createdAt: string;
};

export type MarkAttendanceResponse = {
    attendanceId: string;
    uuid: string;
    markedAt: string;
    status: string;
};

export type ApiError = {
    message: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a non-OK response body and throw a descriptive Error.
 */
async function handleError(res: Response): Promise<never> {
    let message = `HTTP ${res.status}`;
    let bodyText = '';
    try {
        bodyText = await res.text();
        console.log(`[API] Error Response Body:`, bodyText);
        const body: ApiError = JSON.parse(bodyText);
        if (body?.message) {
            message = body.message;
        }
    } catch {
        // body is not JSON — keep status code message
    }
    console.error(`[API] Error thrown:`, message);
    throw new Error(message);
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * POST /api/employees  (multipart/form-data)
 * Register a new employee with their face image.
 * DO NOT manually set Content-Type — fetch sets it with the multipart boundary.
 */
export async function registerEmployee(
    formData: FormData,
): Promise<RegisterEmployeeResponse> {
    const url = `${BASE_URL}/api/employees`;
    console.log(`[API] Req -> POST ${url}`);
    
    // Log form parts if possible without consuming it (FormData in React Native can be tricky to log extensively)
    // We'll just log we're attempting it.
    
    const res = await fetch(url, {
        method: 'POST',
        body: formData,
        // No Content-Type header — required for multipart boundary to work
    });
    
    console.log(`[API] Res <- POST ${url} [Status: ${res.status}]`);

    if (!res.ok && res.status !== 409) {
        await handleError(res);
    }

    if (res.status === 409) {
        // Duplicate email — treat as already registered; return partial info
        const text = await res.text();
        console.log(`[API] Conflict Response Body:`, text);
        let message = 'Conflict';
        try {
            const body: ApiError = JSON.parse(text);
            if (body?.message) message = body.message;
        } catch {}
        console.error(`[API] Conflict error thrown: CONFLICT:${message}`);
        throw new Error(`CONFLICT:${message}`);
    }

    const responseData = await res.json();
    console.log(`[API] Response Data <- POST ${url}:`, responseData);
    return responseData as RegisterEmployeeResponse;
}

/**
 * POST /api/attendance  (application/json)
 * Mark attendance for the employee identified by UUID.
 * Call this only after on-device face match succeeds.
 */
export async function markAttendance(
    uuid: string,
): Promise<MarkAttendanceResponse> {
    const url = `${BASE_URL}/api/attendance`;
    console.log(`[API] Req -> POST ${url} | body:`, { uuid });
    
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid }),
    });
    
    console.log(`[API] Res <- POST ${url} [Status: ${res.status}]`);

    if (res.status === 409) {
        // Already marked today server-side — not a hard failure
        console.log(`[API] ALREADY_MARKED for ${uuid}`);
        throw new Error('ALREADY_MARKED');
    }

    if (!res.ok) {
        await handleError(res);
    }

    const responseData = await res.json();
    console.log(`[API] Response Data <- POST ${url}:`, responseData);
    return responseData as MarkAttendanceResponse;
}
