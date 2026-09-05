import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:5000';
const SENDGRID_KEY = process.env.SENDGRID_API_KEY ?? '';
const NOTIFY_EMAIL = process.env.PROVIDER_NOTIFY_EMAIL ?? 'providers@careconnect.in';
const FROM_EMAIL   = process.env.SENDGRID_FROM_EMAIL  ?? 'noreply@careconnect.in';

function validate(body: Record<string, unknown>) {
    const { name, email, providerType } = body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) return 'Name is required.';
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Valid email is required.';
    if (!providerType || typeof providerType !== 'string') return 'Provider type is required.';
    return null;
}

async function sendNotificationEmail(data: Record<string, string>) {
    if (!SENDGRID_KEY) return;
    try {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SENDGRID_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: NOTIFY_EMAIL }] }],
                from: { email: FROM_EMAIL, name: 'CareConnect Provider Team' },
                subject: `New provider enquiry — ${data.providerType} from ${data.city || 'Unknown city'}`,
                content: [{
                    type: 'text/html',
                    value: `
                        <h2>New Provider Enquiry</h2>
                        <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
                            <tr><td><strong>Name</strong></td><td>${data.name}</td></tr>
                            <tr><td><strong>Email</strong></td><td>${data.email}</td></tr>
                            <tr><td><strong>Phone</strong></td><td>${data.phone || '—'}</td></tr>
                            <tr><td><strong>Type</strong></td><td>${data.providerType}</td></tr>
                            <tr><td><strong>City</strong></td><td>${data.city || '—'}</td></tr>
                            <tr><td><strong>Message</strong></td><td>${data.message || '—'}</td></tr>
                        </table>
                        <p style="margin-top:16px;color:#666;font-size:12px">
                            Submitted at ${new Date().toISOString()} via CareConnect /business page.
                        </p>
                    `,
                }],
            }),
        });
    } catch (err) {
        console.error('[provider-enquiry] SendGrid error:', err);
    }
}

export async function POST(req: NextRequest) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON.' }, { status: 400 });
    }

    const validationError = validate(body);
    if (validationError) {
        return NextResponse.json({ success: false, message: validationError }, { status: 422 });
    }

    const data: Record<string, string> = {
        name:         String(body.name ?? '').trim(),
        email:        String(body.email ?? '').trim().toLowerCase(),
        phone:        String(body.phone ?? '').trim(),
        providerType: String(body.providerType ?? '').trim(),
        city:         String(body.city ?? '').trim(),
        message:      String(body.message ?? '').trim(),
    };

    // Persist to MongoDB via backend
    let backendId: string | null = null;
    try {
        const response = await fetch(`${BACKEND}/api/provider-enquiry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(8000),
        });
        const json = await response.json();
        backendId = json?.data?.id ?? null;
    } catch (err) {
        // Backend unavailable — still send email + return success to user
        console.warn('[provider-enquiry] Backend unreachable:', err);
    }

    // Fire email notification (non-blocking)
    void sendNotificationEmail(data);

    return NextResponse.json(
        { success: true, data: { id: backendId } },
        { status: 201 }
    );
}

export async function GET() {
    return NextResponse.json({ success: false, message: 'Use the admin dashboard.' }, { status: 403 });
}
