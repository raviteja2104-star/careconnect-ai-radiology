const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const pusher = require('../lib/pusher');

// POST /api/pusher/auth
// Authenticates a client for a private or presence Pusher channel.
// Called automatically by pusher-js before subscribing to any private-* or
// presence-* channel. The JWT in the Authorization header is validated by
// the `protect` middleware — the same guard used on all other API routes.
router.post('/auth', protect, (req, res) => {
  if (!pusher) {
    return res.status(503).json({ error: 'Real-time service not configured.' });
  }

  const { socket_id, channel_name } = req.body;
  if (!socket_id || !channel_name) {
    return res.status(400).json({ error: 'socket_id and channel_name are required.' });
  }

  const userId = req.user._id.toString();

  // Enforce channel-level access:
  //  private-patient-{userId}  → only that patient
  //  private-doctor-{userId}   → only that doctor
  //  presence-webrtc-{session} → any authenticated user (patient or doctor)
  if (channel_name.startsWith('private-patient-') || channel_name.startsWith('private-doctor-')) {
    const prefix = channel_name.startsWith('private-patient-') ? 'private-patient-' : 'private-doctor-';
    const targetId = channel_name.slice(prefix.length);
    if (targetId !== userId) {
      return res.status(403).json({ error: 'Not authorised for this channel.' });
    }
  }

  if (channel_name.startsWith('presence-')) {
    const presenceData = {
      user_id: userId,
      user_info: {
        role: req.user.role,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
      },
    };
    const auth = pusher.authorizeChannel(socket_id, channel_name, presenceData);
    return res.json(auth);
  }

  const auth = pusher.authorizeChannel(socket_id, channel_name);
  res.json(auth);
});

module.exports = router;
