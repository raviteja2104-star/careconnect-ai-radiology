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
    const mongoose = require('mongoose');
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
    const mongoose = require('mongoose');
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

/**
 * GET /api/settings/prescription
 * Returns the authenticated user's saved prescription template (if any).
 */
exports.getPrescriptionTemplate = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isDBConnected = () => mongoose.connection.readyState === 1;
    if (!isDBConnected() || !mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.json({ success: true, data: null });
    }
    const user = await User.findById(req.user._id).select('prescriptionTemplate').lean();
    res.json({ success: true, data: user?.prescriptionTemplate || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/settings/prescription
 * Saves the prescription template onto the user document.
 */
exports.savePrescriptionTemplate = async (req, res) => {
  try {
    const { template } = req.body;
    if (!template) {
      return res.status(400).json({ success: false, message: 'template is required.' });
    }
    const mongoose = require('mongoose');
    const isDBConnected = () => mongoose.connection.readyState === 1;
    if (!isDBConnected() || !mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.json({ success: true, data: template });
    }
    await User.findByIdAndUpdate(req.user._id, { $set: { prescriptionTemplate: template } });
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
