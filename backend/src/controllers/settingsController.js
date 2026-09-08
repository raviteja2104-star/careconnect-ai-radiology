const mongoose = require('mongoose');
const User = require('../models/User');

const ALLOWED_SETTINGS_FIELDS = [
  'hospitalName',
  'hospitalTagline',
  'hospitalRegNo',
  'hospitalPhone',
  'hospitalEmail',
  'hospitalAddress',
  'hospitalTaxId',
  'firstName',
  'lastName',
  'phone',
  'address',
];

/**
 * GET /api/settings
 * Returns the authenticated user's document (includes any saved org-level
 * settings fields written by updateSettings below).
 */
exports.getSettings = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: req.user });
    }
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/settings
 * Persists safe settings fields onto the user document.
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const fieldsToUpdate = {};
    ALLOWED_SETTINGS_FIELDS.forEach((key) => {
      if (req.body[key] !== undefined) {
        fieldsToUpdate[key] = req.body[key];
      }
    });

    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: { ...req.user, ...fieldsToUpdate } });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: fieldsToUpdate },
      { new: true }
    );
    res.json({ success: true, message: 'Settings updated.', data: user });
  } catch (error) {
    next(error);
  }
};
