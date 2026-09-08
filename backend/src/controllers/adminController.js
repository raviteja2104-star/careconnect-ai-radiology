/**
 * adminController.js
 * Handles admin-specific API endpoints: command-center telemetry, AI scribe,
 * and simplified invoice creation from the billing dashboard.
 */

exports.getCommandCenter = async (req, res) => {
  try {
    const isDBConnected = () => require('mongoose').connection.readyState === 1;
    if (!isDBConnected()) {
      return res.json({
        success: true,
        data: {
          activeSessions: 0,
          apiLatencyMs: 0,
          dbConnected: false,
          uptime: process.uptime(),
          memUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          queueDepth: 0,
          activeAlerts: [],
        },
      });
    }
    const User = require('../models/User');
    const Appointment = require('../models/Appointment');
    const [userCount, todayAppts] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Appointment.countDocuments({
        date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);
    res.json({
      success: true,
      data: {
        activeSessions: userCount,
        todayAppointments: todayAppts,
        apiLatencyMs: 0, // populated by Telemetry middleware in observability dashboard
        dbConnected: true,
        uptime: process.uptime(),
        memUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        queueDepth: 0,
        activeAlerts: [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPlatformStats = async (req, res) => {
  try {
    const isDBConnected = () => require('mongoose').connection.readyState === 1;
    if (!isDBConnected()) {
      return res.json({
        success: true,
        data: { totalUsers: 0, activeUsers: 0, todayAppointments: 0, uptimeSeconds: process.uptime(), dbConnected: false },
      });
    }
    const User = require('../models/User');
    const Appointment = require('../models/Appointment');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [totalUsers, activeUsers, todayAppointments] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      Appointment.countDocuments({ date: { $gte: today } }),
    ]);
    res.json({
      success: true,
      data: { totalUsers, activeUsers, todayAppointments, uptimeSeconds: process.uptime(), dbConnected: true },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.generateScribe = async (req, res) => {
  try {
    const { dictationText } = req.body;
    if (!dictationText) {
      return res.status(400).json({ success: false, message: 'dictationText is required.' });
    }
    // Rule-based SOAP generation — AI service can enhance later
    const soap = {
      subjective: dictationText,
      objective: 'Examination findings pending.',
      assessment: 'Assessment pending clinical review.',
      plan: 'Plan to be determined by attending physician.',
    };
    res.json({ success: true, data: { soap, generatedAt: new Date() } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const { patientId, items, totalAmount, dueDate } = req.body;
    if (!patientId || !totalAmount) {
      return res.status(400).json({ success: false, message: 'patientId and totalAmount are required.' });
    }
    const mongoose = require('mongoose');
    const isDBConnected = () => require('mongoose').connection.readyState === 1;
    if (!isDBConnected() || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.json({
        success: true,
        data: {
          _id: 'demo-inv-' + Date.now(),
          patientId,
          totalAmount,
          status: 'Pending',
          invoiceNumber: 'INV-' + Date.now(),
        },
      });
    }
    const Invoice = require('../models/Invoice');
    const inv = await Invoice.create({
      patient: patientId,
      items: items || [],
      totalAmount,
      dueDate,
      status: 'Pending',
      invoiceNumber: 'INV-' + Date.now(),
    });
    res.json({ success: true, data: inv });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSystemHealth = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const readyState = mongoose.connection.readyState;
    const dbConnected = readyState === 1;
    const dbStatus = readyState === 1 ? 'Operational' : readyState === 2 ? 'Connecting' : 'Degraded';

    let queueStatus = 'Operational';
    let queueDetail = 'Queue is idle';
    if (dbConnected) {
      try {
        const QueueToken = require('../models/QueueToken');
        const queueDepth = await QueueToken.countDocuments({ status: 'WAITING' });
        if (queueDepth > 50) {
          queueStatus = 'Degraded';
          queueDetail = `Queue depth: ${queueDepth} (high load)`;
        } else {
          queueDetail = `Queue depth: ${queueDepth}`;
        }
      } catch (e) {
        queueStatus = 'Degraded';
        queueDetail = 'Queue engine error';
      }
    }

    const services = [
      { service: 'Primary Database', status: dbStatus, detail: `readyState: ${readyState}` },
      { service: 'Queue Engine', status: dbConnected ? queueStatus : 'Degraded', detail: dbConnected ? queueDetail : 'DB offline' },
      { service: 'API Server', status: 'Operational', detail: `Uptime: ${Math.round(process.uptime())}s` },
      { service: 'Authentication', status: dbConnected ? 'Operational' : 'Degraded', detail: dbConnected ? 'JWT auth active' : 'DB required for token validation' },
    ];

    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getOrganizations = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      return res.json({ success: true, data: [] });
    }
    const User = require('../models/User');
    const roles = ['patient', 'doctor', 'admin', 'nurse', 'pharmacist', 'radiologist', 'reception'];
    const counts = await Promise.all(roles.map((role) => User.countDocuments({ role })));
    const roleBreakdown = {};
    roles.forEach((role, i) => { roleBreakdown[role] = counts[i]; });
    const total = counts.reduce((sum, c) => sum + c, 0);

    const data = [
      {
        name: 'CareConnect Platform',
        region: 'APAC',
        plan: 'Enterprise',
        users: total,
        status: 'Active',
        roleBreakdown,
      },
    ];
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAdminAuditLogs = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      return res.json({ success: true, data: [], total: 0 });
    }
    const AuditLog = require('../models/AuditLog');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find().sort({ at: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(),
    ]);

    const data = logs.map((log) => ({
      time: log.at ? new Date(log.at).toISOString() : null,
      user: log.actorId ? String(log.actorId) : null,
      action: log.action,
      resource: log.resource,
      ip: log.ip || null,
    }));

    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
