/**
 * CareConnect — Provider Self-Registration API
 * Public endpoint: providers register themselves, get set to DRAFT status,
 * then go through admin verification before becoming discoverable.
 *
 * POST /api/provider/register       — create a draft registration
 * GET  /api/provider/register/:id   — check status (no auth — uses token in URL)
 * POST /api/provider/register/:id/submit — submit for review (requires registration token)
 */
const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const { sendEmail, templates } = require('../services/EmailNotificationService');

const isDB = () => require('mongoose').connection.readyState === 1;

// Lazy-load model
let ProviderRegistration;
function getModel() {
    if (!ProviderRegistration) ProviderRegistration = require('../models/ProviderRegistration');
    return ProviderRegistration;
}

// ── POST /api/provider/register ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const {
            providerType, name, contactName, email, phone, city, state, pincode,
            specialties, description, website, step,
        } = req.body;

        if (!providerType || !name || !contactName || !email || !phone) {
            return res.status(422).json({
                success: false,
                message: 'providerType, name, contactName, email and phone are required.',
            });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(422).json({ success: false, message: 'Invalid email address.' });
        }

        if (!isDB()) {
            // Demo mode — return a fake registration token
            const demoToken = `demo_reg_${Date.now()}`;
            return res.status(201).json({
                success: true, demo: true,
                data: { id: `draft_${Date.now()}`, token: demoToken, status: 'DRAFT', step: step || 1 },
            });
        }

        const Model = getModel();

        // Upsert: if same email+type already has a DRAFT, resume it
        const existing = await Model.findOne({ email: email.toLowerCase(), providerType, status: { $in: ['DRAFT', 'NEEDS_CHANGES'] } });
        if (existing) {
            Object.assign(existing, { name, contactName, phone, city, state, pincode, specialties, description, website, lastStep: step || existing.lastStep });
            await existing.save();
            return res.json({
                success: true,
                data: { id: String(existing._id), token: existing.token, status: existing.status, step: existing.lastStep },
            });
        }

        const token = crypto.randomBytes(24).toString('hex');
        const registration = await Model.create({
            providerType, name, contactName,
            email: email.toLowerCase(), phone, city, state, pincode,
            specialties, description, website,
            token, status: 'DRAFT', lastStep: step || 1,
        });

        // Send a welcome / save-progress email (non-blocking)
        void sendEmail({
            to: email,
            toName: contactName,
            subject: 'CareConnect — Your provider registration has been started',
            html: `
<!DOCTYPE html><html><body style="font-family:sans-serif;color:#0A1F44;max-width:560px;margin:0 auto;padding:24px">
  <div style="background:linear-gradient(135deg,#1A54A8,#0B96A0);padding:20px;border-radius:10px;margin-bottom:20px">
    <h2 style="color:#fff;margin:0">Registration Started</h2><p style="color:rgba(255,255,255,.8);margin:6px 0 0">CareConnect Provider Network</p>
  </div>
  <p>Hi <strong>${contactName}</strong>,</p>
  <p>Your provider registration for <strong>${name}</strong> has been saved as a draft. You can return and complete it at any time using your email address.</p>
  <p style="font-size:13px;color:#7A95B8">Registration ID: <code>${String(registration._id)}</code></p>
  <p style="font-size:12px;color:#A8BCE0">CareConnect Health Technologies Pvt. Ltd.</p>
</body></html>`,
        });

        return res.status(201).json({
            success: true,
            data: { id: String(registration._id), token, status: 'DRAFT', step: 1 },
        });
    } catch (err) {
        console.error('[ProviderRegistration] POST error:', err.message);
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'A registration with this email and type already exists.' });
        }
        res.status(500).json({ success: false, message: 'Registration temporarily unavailable.' });
    }
});

// ── PUT /api/provider/register/:id — save progress ───────────────────────────
router.put('/register/:id', async (req, res) => {
    try {
        const { token, step, ...fields } = req.body;
        if (!isDB()) return res.json({ success: true, demo: true, data: { status: 'DRAFT', step } });

        const Model = getModel();
        const reg = await Model.findOne({ _id: req.params.id, token });
        if (!reg) return res.status(404).json({ success: false, message: 'Registration not found.' });
        if (['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(reg.status)) {
            return res.status(409).json({ success: false, message: `Cannot edit a registration in ${reg.status} status.` });
        }

        const allowed = ['providerType','name','contactName','phone','city','state','pincode','specialties','description','website','services','documents','qualifications','operatingHours'];
        for (const k of allowed) { if (Object.prototype.hasOwnProperty.call(fields, k)) reg[k] = fields[k]; }
        if (step) reg.lastStep = step;
        await reg.save();

        return res.json({ success: true, data: { id: String(reg._id), status: reg.status, step: reg.lastStep } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET /api/provider/register/:id?token=... — check status ──────────────────
router.get('/register/:id', async (req, res) => {
    try {
        const { token } = req.query;
        if (!isDB()) return res.json({ success: true, demo: true, data: { status: 'DRAFT' } });

        const Model = getModel();
        const reg = await Model.findOne({ _id: req.params.id, token }).lean();
        if (!reg) return res.status(404).json({ success: false, message: 'Registration not found.' });

        return res.json({
            success: true,
            data: {
                id: String(reg._id),
                status: reg.status,
                step: reg.lastStep,
                providerType: reg.providerType,
                name: reg.name,
                contactName: reg.contactName,
                email: reg.email,
                phone: reg.phone,
                city: reg.city,
                state: reg.state,
                adminNotes: reg.status === 'NEEDS_CHANGES' ? reg.adminNotes : undefined,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /api/provider/register/:id/submit — submit for review ───────────────
router.post('/register/:id/submit', async (req, res) => {
    try {
        const { token } = req.body;
        if (!isDB()) return res.json({ success: true, demo: true, data: { status: 'SUBMITTED' } });

        const Model = getModel();
        const reg = await Model.findOne({ _id: req.params.id, token });
        if (!reg) return res.status(404).json({ success: false, message: 'Registration not found.' });
        if (!['DRAFT', 'NEEDS_CHANGES'].includes(reg.status)) {
            return res.status(409).json({ success: false, message: `Cannot submit from ${reg.status} status.` });
        }

        reg.status = 'SUBMITTED';
        reg.submittedAt = new Date();
        await reg.save();

        // Notify provider
        void sendEmail({
            to: reg.email,
            toName: reg.contactName,
            subject: 'CareConnect — Registration submitted for review',
            html: `
<!DOCTYPE html><html><body style="font-family:sans-serif;color:#0A1F44;max-width:560px;margin:0 auto;padding:24px">
  <div style="background:linear-gradient(135deg,#1A8C50,#0B96A0);padding:20px;border-radius:10px;margin-bottom:20px">
    <h2 style="color:#fff;margin:0">Registration Submitted</h2>
  </div>
  <p>Hi <strong>${reg.contactName}</strong>,</p>
  <p>Your registration for <strong>${reg.name}</strong> has been submitted and is now under review. Our team will get back to you within 1–2 business days.</p>
  <p style="font-size:12px;color:#A8BCE0">CareConnect Health Technologies Pvt. Ltd.</p>
</body></html>`,
        });

        // Notify admin team
        void sendEmail({
            to: process.env.PROVIDER_NOTIFY_EMAIL || 'providers@careconnect.in',
            subject: `New provider submission — ${reg.name} (${reg.providerType})`,
            html: `
<p>A new provider has submitted their registration for review.</p>
<table cellpadding="6" style="font-family:sans-serif;font-size:14px">
  <tr><td><strong>Name</strong></td><td>${reg.name}</td></tr>
  <tr><td><strong>Type</strong></td><td>${reg.providerType}</td></tr>
  <tr><td><strong>Contact</strong></td><td>${reg.contactName}</td></tr>
  <tr><td><strong>Email</strong></td><td>${reg.email}</td></tr>
  <tr><td><strong>Phone</strong></td><td>${reg.phone}</td></tr>
  <tr><td><strong>City</strong></td><td>${reg.city || '—'}</td></tr>
</table>`,
        });

        return res.json({ success: true, data: { id: String(reg._id), status: 'SUBMITTED' } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS (require JWT + admin role)
// ══════════════════════════════════════════════════════════════════════════════
const { protect, authorize } = require('../middleware/auth');

// ── GET /api/provider/admin/registrations — list all registrations ────────────
router.get('/admin/registrations', protect, authorize('admin'), async (req, res) => {
    try {
        if (!isDB()) return res.json({ success: true, demo: true, data: [] });
        const { status, page = '1', limit = '20' } = req.query;
        const Model = getModel();
        const filter = {};
        if (status) filter.status = status;
        const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, parseInt(limit, 10) || 20);
        const [registrations, total] = await Promise.all([
            Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10) || 20).lean(),
            Model.countDocuments(filter),
        ]);
        return res.json({ success: true, data: { registrations, total, page: parseInt(page, 10) } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET /api/provider/admin/registrations/:id — get one registration ──────────
router.get('/admin/registrations/:id', protect, authorize('admin'), async (req, res) => {
    try {
        if (!isDB()) return res.json({ success: true, demo: true, data: null });
        const reg = await getModel().findById(req.params.id).lean();
        if (!reg) return res.status(404).json({ success: false, message: 'Registration not found.' });
        return res.json({ success: true, data: reg });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /api/provider/admin/registrations/:id/approve — approve and create Provider ──
router.post('/admin/registrations/:id/approve', protect, authorize('admin'), async (req, res) => {
    try {
        if (!isDB()) return res.json({ success: true, demo: true, data: { status: 'APPROVED' } });
        const Model = getModel();
        const reg = await Model.findById(req.params.id);
        if (!reg) return res.status(404).json({ success: false, message: 'Registration not found.' });
        if (!['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CHANGES'].includes(reg.status)) {
            return res.status(409).json({ success: false, message: `Cannot approve from ${reg.status} status.` });
        }

        // Map registration providerType → Provider.type (lowercase)
        const TYPE_MAP = { DOCTOR: 'doctor', CLINIC: 'clinic', HOSPITAL: 'hospital', LAB: 'lab', PHARMACY: 'pharmacy', ORGANISATION: 'organisation' };
        const providerType = (TYPE_MAP[reg.providerType] || reg.providerType.toLowerCase());

        // Create the real Provider record
        const Provider = require('../models/Provider');
        const provider = await Provider.create({
            name: reg.name,
            type: providerType,
            specialties: reg.specialties || [],
            description: reg.description,
            city: reg.city,
            state: reg.state,
            pincode: reg.pincode,
            phone: reg.phone,
            email: reg.email,
            website: reg.website,
            servicesOffered: reg.services || [],
            verificationStatus: 'VERIFIED',
            careconnectVerified: true,
            lastVerifiedAt: new Date(),
            verifiedByUserId: req.user._id,
            verificationNotes: req.body.notes || 'Approved via admin panel',
            active: true,
            discovery: { source: 'self_registration' },
        });

        reg.status = 'APPROVED';
        reg.reviewedAt = new Date();
        reg.reviewedBy = req.user._id;
        reg.approvedProviderId = provider._id;
        await reg.save();

        // Notify provider
        void sendEmail({
            to: reg.email,
            toName: reg.contactName,
            subject: 'CareConnect — Your registration has been approved!',
            html: `
<!DOCTYPE html><html><body style="font-family:sans-serif;color:#0A1F44;max-width:560px;margin:0 auto;padding:24px">
  <div style="background:linear-gradient(135deg,#1A8C50,#0B96A0);padding:20px;border-radius:10px;margin-bottom:20px">
    <h2 style="color:#fff;margin:0">Registration Approved ✓</h2>
  </div>
  <p>Hi <strong>${reg.contactName}</strong>,</p>
  <p>Great news! Your registration for <strong>${reg.name}</strong> has been approved. Your practice is now listed on CareConnect.</p>
  <p style="font-size:12px;color:#A8BCE0">CareConnect Health Technologies Pvt. Ltd.</p>
</body></html>`,
        });

        return res.json({ success: true, data: { id: String(reg._id), status: 'APPROVED', providerId: String(provider._id) } });
    } catch (err) {
        console.error('[ProviderRegistration] approve error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /api/provider/admin/registrations/:id/reject — reject ────────────────
router.post('/admin/registrations/:id/reject', protect, authorize('admin'), async (req, res) => {
    try {
        if (!isDB()) return res.json({ success: true, demo: true, data: { status: 'REJECTED' } });
        const Model = getModel();
        const reg = await Model.findById(req.params.id);
        if (!reg) return res.status(404).json({ success: false, message: 'Registration not found.' });
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(reg.status)) {
            return res.status(409).json({ success: false, message: `Cannot reject from ${reg.status} status.` });
        }
        reg.status = 'REJECTED';
        reg.reviewedAt = new Date();
        reg.reviewedBy = req.user._id;
        reg.adminNotes = req.body.reason || '';
        await reg.save();

        void sendEmail({
            to: reg.email,
            toName: reg.contactName,
            subject: 'CareConnect — Registration update',
            html: `
<!DOCTYPE html><html><body style="font-family:sans-serif;color:#0A1F44;max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#DC2626;padding:20px;border-radius:10px;margin-bottom:20px">
    <h2 style="color:#fff;margin:0">Registration Not Approved</h2>
  </div>
  <p>Hi <strong>${reg.contactName}</strong>,</p>
  <p>We were unable to approve your registration for <strong>${reg.name}</strong> at this time.</p>
  ${reg.adminNotes ? `<p><strong>Reason:</strong> ${reg.adminNotes}</p>` : ''}
  <p>Please contact us at providers@careconnect.in if you have questions.</p>
</body></html>`,
        });

        return res.json({ success: true, data: { id: String(reg._id), status: 'REJECTED' } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /api/provider/admin/registrations/:id/needs-changes — request changes ─
router.post('/admin/registrations/:id/needs-changes', protect, authorize('admin'), async (req, res) => {
    try {
        if (!isDB()) return res.json({ success: true, demo: true, data: { status: 'NEEDS_CHANGES' } });
        const { notes } = req.body;
        if (!notes) return res.status(400).json({ success: false, message: 'notes (reason) is required.' });
        const Model = getModel();
        const reg = await Model.findById(req.params.id);
        if (!reg) return res.status(404).json({ success: false, message: 'Registration not found.' });
        reg.status = 'NEEDS_CHANGES';
        reg.adminNotes = notes;
        reg.reviewedAt = new Date();
        reg.reviewedBy = req.user._id;
        await reg.save();

        void sendEmail({
            to: reg.email,
            toName: reg.contactName,
            subject: 'CareConnect — Action required on your registration',
            html: `
<!DOCTYPE html><html><body style="font-family:sans-serif;color:#0A1F44;max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#D97706;padding:20px;border-radius:10px;margin-bottom:20px">
    <h2 style="color:#fff;margin:0">Changes Required</h2>
  </div>
  <p>Hi <strong>${reg.contactName}</strong>,</p>
  <p>Our team has reviewed your registration for <strong>${reg.name}</strong> and requires some changes before we can approve it.</p>
  <div style="background:#FFF9EC;border:1px solid #FCD34D;border-radius:8px;padding:16px;margin:16px 0">
    <strong>Requested changes:</strong><br>${notes}
  </div>
  <p>Please log in and update your registration. If you need help, contact providers@careconnect.in.</p>
</body></html>`,
        });

        return res.json({ success: true, data: { id: String(reg._id), status: 'NEEDS_CHANGES' } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
