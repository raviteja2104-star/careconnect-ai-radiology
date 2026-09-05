/**
 * CareConnect — Email Notification Service
 * Uses raw fetch to SendGrid API (no SDK dependency).
 * Falls back to console logging when SENDGRID_API_KEY is not set.
 */

const SENDGRID_API = 'https://api.sendgrid.com/v3/mail/send';
const FROM_EMAIL   = process.env.SENDGRID_FROM_EMAIL  || 'noreply@careconnect.in';
const FROM_NAME    = 'CareConnect';
const ENABLED      = !!process.env.SENDGRID_API_KEY;

async function sendEmail({ to, toName, subject, html, text }) {
    if (!ENABLED) {
        console.log(`📧 [EMAIL DEMO] To: ${to} | ${subject}`);
        return { demo: true };
    }
    try {
        const res = await fetch(SENDGRID_API, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: to, name: toName || to }] }],
                from: { email: FROM_EMAIL, name: FROM_NAME },
                subject,
                content: [
                    { type: 'text/html', value: html },
                    ...(text ? [{ type: 'text/plain', value: text }] : []),
                ],
            }),
        });
        if (!res.ok && res.status !== 202) {
            const body = await res.text().catch(() => '');
            console.error(`[EmailNotification] SendGrid ${res.status}: ${body}`);
        }
        return { sent: true, status: res.status };
    } catch (err) {
        console.error('[EmailNotification] fetch error:', err.message);
        return { error: err.message };
    }
}

// ── Email templates ──────────────────────────────────────────────────────────

function appointmentConfirmationEmail({ patientName, doctorName, specialty, date, time, address, bookingId, consultationType }) {
    const subject = `Appointment Confirmed — ${doctorName}`;
    const html = `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;color:#0A1F44;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:linear-gradient(135deg,#1A54A8,#0B96A0);padding:24px;border-radius:12px;margin-bottom:24px">
    <h1 style="color:#fff;margin:0;font-size:22px">Appointment Confirmed</h1>
    <p style="color:rgba(255,255,255,.8);margin:8px 0 0">CareConnect</p>
  </div>
  <p>Hi <strong>${patientName}</strong>,</p>
  <p>Your appointment has been confirmed. Here are your details:</p>
  <div style="background:#F6F9FF;border:1px solid #DDE6F5;border-radius:10px;padding:20px;margin:20px 0">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#7A95B8">Doctor</td><td style="padding:6px 0;font-weight:600">${doctorName}</td></tr>
      <tr><td style="padding:6px 0;color:#7A95B8">Specialty</td><td style="padding:6px 0">${specialty || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#7A95B8">Type</td><td style="padding:6px 0">${consultationType || 'In-clinic'}</td></tr>
      <tr><td style="padding:6px 0;color:#7A95B8">Date</td><td style="padding:6px 0;font-weight:600">${date}</td></tr>
      <tr><td style="padding:6px 0;color:#7A95B8">Time</td><td style="padding:6px 0;font-weight:600">${time}</td></tr>
      ${address ? `<tr><td style="padding:6px 0;color:#7A95B8">Location</td><td style="padding:6px 0">${address}</td></tr>` : ''}
    </table>
  </div>
  <p style="font-size:13px;color:#7A95B8">Booking reference: <strong>${bookingId}</strong></p>
  <p style="font-size:12px;color:#A8BCE0;margin-top:32px">
    CareConnect Health Technologies Pvt. Ltd.<br>
    This is an automated notification. Please do not reply to this email.
  </p>
</body></html>`;
    return { subject, html };
}

function labBookingConfirmationEmail({ patientName, testName, providerName, collectionMethod, date, time, address, bookingId }) {
    const subject = `Lab Booking Confirmed — ${testName}`;
    const html = `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;color:#0A1F44;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:linear-gradient(135deg,#0B96A0,#1A8C50);padding:24px;border-radius:12px;margin-bottom:24px">
    <h1 style="color:#fff;margin:0;font-size:22px">Lab Booking Confirmed</h1>
    <p style="color:rgba(255,255,255,.8);margin:8px 0 0">CareConnect</p>
  </div>
  <p>Hi <strong>${patientName}</strong>,</p>
  <p>Your lab test booking has been confirmed.</p>
  <div style="background:#F6F9FF;border:1px solid #DDE6F5;border-radius:10px;padding:20px;margin:20px 0">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#7A95B8">Test</td><td style="padding:6px 0;font-weight:600">${testName}</td></tr>
      <tr><td style="padding:6px 0;color:#7A95B8">Provider</td><td style="padding:6px 0">${providerName || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#7A95B8">Collection</td><td style="padding:6px 0">${collectionMethod || 'Centre visit'}</td></tr>
      <tr><td style="padding:6px 0;color:#7A95B8">Date</td><td style="padding:6px 0;font-weight:600">${date}</td></tr>
      <tr><td style="padding:6px 0;color:#7A95B8">Time</td><td style="padding:6px 0;font-weight:600">${time}</td></tr>
      ${address ? `<tr><td style="padding:6px 0;color:#7A95B8">Address</td><td style="padding:6px 0">${address}</td></tr>` : ''}
    </table>
  </div>
  <p style="font-size:13px;color:#7A95B8">Booking reference: <strong>${bookingId}</strong></p>
  <p style="font-size:12px;color:#A8BCE0;margin-top:32px">CareConnect Health Technologies Pvt. Ltd.</p>
</body></html>`;
    return { subject, html };
}

function appointmentReminderEmail({ patientName, doctorName, date, time, address, bookingId }) {
    const subject = `Reminder: Appointment Tomorrow — ${doctorName}`;
    const html = `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;color:#0A1F44;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#1A54A8;padding:24px;border-radius:12px;margin-bottom:24px">
    <h1 style="color:#fff;margin:0;font-size:20px">Appointment Reminder</h1>
  </div>
  <p>Hi <strong>${patientName}</strong>,</p>
  <p>This is a reminder that you have an appointment tomorrow.</p>
  <div style="background:#F6F9FF;border:1px solid #DDE6F5;border-radius:10px;padding:20px;margin:20px 0">
    <p style="margin:0;font-size:16px;font-weight:700">${doctorName}</p>
    <p style="margin:6px 0;color:#3D5475">${date} at ${time}</p>
    ${address ? `<p style="margin:6px 0;color:#7A95B8;font-size:13px">${address}</p>` : ''}
  </div>
  <p style="font-size:13px;color:#7A95B8">Booking ref: ${bookingId}</p>
</body></html>`;
    return { subject, html };
}

function paymentConfirmationEmail({ patientName, amount, purpose, transactionId }) {
    const subject = `Payment Confirmed — ₹${amount}`;
    const html = `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;color:#0A1F44;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:linear-gradient(135deg,#1A8C50,#0B96A0);padding:24px;border-radius:12px;margin-bottom:24px">
    <h1 style="color:#fff;margin:0;font-size:22px">Payment Confirmed</h1>
  </div>
  <p>Hi <strong>${patientName}</strong>,</p>
  <p>Your payment of <strong>₹${amount}</strong> has been received.</p>
  <div style="background:#F6F9FF;border:1px solid #DDE6F5;border-radius:10px;padding:20px;margin:20px 0">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#7A95B8">Amount</td><td style="padding:6px 0;font-weight:700;color:#1A8C50">₹${amount}</td></tr>
      <tr><td style="padding:6px 0;color:#7A95B8">Purpose</td><td style="padding:6px 0">${purpose || 'Healthcare service'}</td></tr>
      <tr><td style="padding:6px 0;color:#7A95B8">Transaction ID</td><td style="padding:6px 0;font-family:monospace;font-size:12px">${transactionId}</td></tr>
    </table>
  </div>
</body></html>`;
    return { subject, html };
}

module.exports = {
    sendEmail,
    templates: {
        appointmentConfirmationEmail,
        labBookingConfirmationEmail,
        appointmentReminderEmail,
        paymentConfirmationEmail,
    },
};
