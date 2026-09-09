/**
 * commercialController.js
 * Tenant management and financial reporting for the commercial admin portal.
 */

exports.getTenants = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      return res.status(503).json({ success: false, error: 'Database unavailable. Please try again shortly.' });
    }
    const Tenant = require('../models/Tenant');
    const tenants = await Tenant.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: tenants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createTenant = async (req, res) => {
  try {
    const { name, region, plan, maxUsers, contactEmail } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'name is required' });
    }
    const mongoose = require('mongoose');
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      return res.status(503).json({ success: false, error: 'Database unavailable — cannot create tenant' });
    }
    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.create({ name, region, plan, maxUsers, contactEmail });
    res.status(201).json({ success: true, data: tenant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getFinancials = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      return res.json({
        success: true,
        data: { totalRevenue: 0, monthRevenue: 0, pendingRevenue: 0, invoiceCount: 0 },
      });
    }
    const Invoice = require('../models/Invoice');
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRevResult, monthRevResult, pendingRevResult, invoiceCount] = await Promise.all([
      Invoice.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, sum: { $sum: '$totalAmount' } } },
      ]),
      Invoice.aggregate([
        { $match: { status: 'Completed', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, sum: { $sum: '$totalAmount' } } },
      ]),
      Invoice.aggregate([
        { $match: { status: 'Pending' } },
        { $group: { _id: null, sum: { $sum: '$totalAmount' } } },
      ]),
      Invoice.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevResult[0] ? totalRevResult[0].sum : 0,
        monthRevenue: monthRevResult[0] ? monthRevResult[0].sum : 0,
        pendingRevenue: pendingRevResult[0] ? pendingRevResult[0].sum : 0,
        invoiceCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
