/**
 * masterDataController.js
 * Feature flags and key/value config management via MasterConfig model.
 */

exports.getFeatureFlags = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      return res.status(503).json({ success: false, error: 'Database unavailable. Please try again shortly.' });
    }
    const MasterConfig = require('../models/MasterConfig');
    const flags = await MasterConfig.find({ isFeatureFlag: true }).lean();
    res.json({ success: true, data: flags });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.setFeatureFlag = async (req, res) => {
  try {
    const { key } = req.params;
    const { isEnabled } = req.body;
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isEnabled must be a boolean' });
    }
    const mongoose = require('mongoose');
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      return res.status(503).json({ success: false, error: 'Database unavailable. Please try again shortly.' });
    }
    const MasterConfig = require('../models/MasterConfig');
    const updated = await MasterConfig.findOneAndUpdate(
      { key, isFeatureFlag: true },
      { $set: { isEnabled, updatedBy: req.user._id } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getConfigItems = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      return res.json({ success: true, data: [] });
    }
    const MasterConfig = require('../models/MasterConfig');
    const filter = { isFeatureFlag: false };
    if (req.query.category) filter.category = req.query.category;
    const items = await MasterConfig.find(filter).lean();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.upsertConfigItem = async (req, res) => {
  try {
    const { key, value, category, description } = req.body;
    if (!key) {
      return res.status(400).json({ success: false, error: 'key is required' });
    }
    const mongoose = require('mongoose');
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }
    const MasterConfig = require('../models/MasterConfig');
    const item = await MasterConfig.findOneAndUpdate(
      { key },
      { $set: { value, category, description, updatedBy: req.user._id } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
