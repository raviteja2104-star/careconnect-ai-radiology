/**
 * CareConnect — Push Notification Service (Firebase Cloud Messaging)
 * Config: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL in .env
 *   OR   FIREBASE_SERVICE_ACCOUNT_PATH pointing to the JSON key file
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');

let admin;
try { admin = require('firebase-admin'); } catch (_) { admin = null; }

let fcmInitialized = false;

const initFCM = () => {
    if (fcmInitialized || !admin) return;
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        } else if (process.env.FIREBASE_PROJECT_ID) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                }),
            });
        }
        fcmInitialized = true;
        console.log('🔔 FCM initialized');
    } catch (e) { console.warn('⚠️  FCM init skipped:', e.message); }
};
initFCM();

const isLive = () => fcmInitialized && admin;
const isDB = () => { const m = require('mongoose'); return m.connection.readyState === 1; };

// ── Send push notification ────────────────────────────────────────────────────
const sendPush = async (token, title, body, data = {}) => {
    if (!isLive()) {
        console.log(`📲 [DEMO PUSH] ${title}: ${body}`);
        return { demo: true, messageId: `msg_demo_${Date.now()}` };
    }
    const message = { notification: { title, body }, data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' }, token };
    return admin.messaging().send(message);
};

// ── Send to multiple tokens ──────────────────────────────────────────────────
const sendMulticast = async (tokens, title, body, data = {}) => {
    if (!isLive() || !tokens.length) {
        console.log(`📲 [DEMO MULTICAST] ${title} → ${tokens.length} devices`);
        return { demo: true, successCount: tokens.length };
    }
    return admin.messaging().sendEachForMulticast({ tokens, notification: { title, body }, data });
};

// ── Register device token ─────────────────────────────────────────────────────
router.post('/register-device', protect, async (req, res, next) => {
    try {
        const { fcmToken, platform = 'android' } = req.body;
        if (!fcmToken) return res.status(400).json({ success: false, message: 'fcmToken required' });
        if (isDB()) {
            const User = require('../models/User');
            await User.findByIdAndUpdate(req.user._id, {
                $addToSet: { fcmTokens: { token: fcmToken, platform, updatedAt: new Date() } },
            });
        }
        res.json({ success: true, message: 'Device registered.' });
    } catch (err) { next(err); }
});

// ── Get notifications ─────────────────────────────────────────────────────────
router.get('/', protect, async (req, res, next) => {
    try {
        if (!isDB()) {
            return res.json({ success: true, data: [
                { _id: 'n1', type: 'report_ready', title: 'Report Approved', message: 'Your CT Head report has been approved.', read: false, createdAt: new Date() },
                { _id: 'n2', type: 'appointment', title: 'Upcoming Appointment', message: 'Dr. Raj Sharma — Tomorrow 3:00 PM', read: false, createdAt: new Date(Date.now() - 3600000) },
                { _id: 'n3', type: 'wallet', title: 'Payment Received', message: '₹500 credited to your wallet.', read: true, createdAt: new Date(Date.now() - 86400000) },
                { _id: 'n4', type: 'system', title: 'Welcome to CareConnect', message: 'Your account has been verified.', read: true, createdAt: new Date(Date.now() - 172800000) },
            ], unreadCount: 2 });
        }
        const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
        const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
        res.json({ success: true, data: notifications, unreadCount });
    } catch (err) { next(err); }
});

// ── Mark as read ──────────────────────────────────────────────────────────────
router.put('/:id/read', protect, async (req, res, next) => {
    try {
        if (!isDB()) return res.json({ success: true, message: 'Marked as read (demo).' });
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true, message: 'Marked as read.' });
    } catch (err) { next(err); }
});

// ── Mark all as read ──────────────────────────────────────────────────────────
router.put('/read-all', protect, async (req, res, next) => {
    try {
        if (!isDB()) return res.json({ success: true, message: 'All marked as read (demo).' });
        await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
        res.json({ success: true, message: 'All marked as read.' });
    } catch (err) { next(err); }
});

// ── Send test notification (admin) ────────────────────────────────────────────
router.post('/send', protect, async (req, res, next) => {
    try {
        const { userId, title, body, type = 'system' } = req.body;
        // Store in DB
        if (isDB()) {
            await Notification.create({ userId, type, title, message: body, read: false });
        }
        // Send push
        const result = await sendPush(null, title, body, { type });
        req.io?.emit('notification', { userId, title, body, type });
        res.json({ success: true, message: 'Notification sent.', data: result });
    } catch (err) { next(err); }
});

// Export helpers for use in other modules
module.exports = router;
module.exports.sendPush = sendPush;
module.exports.sendMulticast = sendMulticast;
