const User = require('../models/User');

function maskPhone(phone) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '****';
    return '******' + digits.slice(-4);
}

function maskEmail(email) {
    if (!email) return null;
    const at = email.indexOf('@');
    if (at < 0) return email.slice(0, 2) + '***';
    const local = email.slice(0, at);
    const domain = email.slice(at);
    const visible = local.length <= 2 ? local : local.slice(0, 2) + '***';
    return visible + domain;
}

function ccDisplayId(id) {
    const hex = String(id).toUpperCase();
    return 'CC-' + hex.slice(-8, -4) + '-' + hex.slice(-4);
}

function roleToUserType(role) {
    if (role === 'patient') return 'PATIENT';
    if (role === 'doctor') return 'DOCTOR';
    if (role === 'nurse') return 'NURSE';
    return 'STAFF';
}

// GET /api/users/search?q=<query>
// Requires authentication (applied at route layer). Rate-limited to 30/min.
// Returns at most 10 users. Never returns: password, pin, tokens, clinical data.
// Phone and email are masked to prevent enumeration of the patient database.
exports.searchUsers = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (q.length < 2) {
            return res.status(400).json({ success: false, message: 'Query must be at least 2 characters.' });
        }
        if (q.length > 50) {
            return res.status(400).json({ success: false, message: 'Query is too long.' });
        }

        // Escape regex metacharacters before building patterns.
        const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(esc(q), 'i');

        const conditions = [
            { firstName: re },
            { lastName: re },
        ];

        // Phone suffix search — only when the query looks numeric.
        if (/^[+\d\s\-]{4,}$/.test(q)) {
            const digits = q.replace(/\D/g, '');
            if (digits.length >= 4) {
                conditions.push({ phone: { $regex: esc(digits) + '$', $options: 'i' } });
            }
        }

        // Email search — only when @ is present.
        if (q.includes('@')) {
            conditions.push({ email: re });
        }

        // Full-name search: split on whitespace and match first+last.
        const parts = q.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            conditions.push({
                $and: [
                    { firstName: new RegExp('^' + esc(parts[0]), 'i') },
                    { lastName: new RegExp('^' + esc(parts.slice(1).join(' ')), 'i') },
                ],
            });
        }

        // Exclude the requesting user — you cannot grant yourself caregiver access.
        const selfId = req.user._id || req.user.id;

        const users = await User.find({
            $or: conditions,
            isActive: true,
            _id: { $ne: selfId },
        })
            .select('firstName lastName phone email role')
            .limit(10)
            .lean();

        const results = users.map((u) => ({
            id: String(u._id),
            displayName: `${u.firstName} ${u.lastName}`,
            maskedPhone: maskPhone(u.phone),
            maskedEmail: maskEmail(u.email),
            userType: roleToUserType(u.role),
            ccDisplayId: ccDisplayId(u._id),
        }));

        return res.json({ success: true, results });
    } catch (err) {
        console.error('userSearch error:', err);
        return res.status(500).json({ success: false, message: 'Search failed. Please try again.' });
    }
};
