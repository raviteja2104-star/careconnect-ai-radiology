/**
 * adminController.js
 * Handles admin-specific API endpoints: command-center telemetry, AI scribe,
 * and simplified invoice creation from the billing dashboard.
 */

exports.getCommandCenter = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isDBConnected = () => mongoose.connection.readyState === 1;
    if (!isDBConnected()) {
      return res.json({
        success: true,
        data: {
          activeSessions: 0,
          dbConnected: false,
          uptime: process.uptime(),
          memUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          // All operational metrics unavailable without DB
          waitingPatientsCount: null,
          waitingPatientsAvgMins: null,
          revenueTodayINR: null,
          outstandingInvoicesCount: null,
          icuOccupancyPct: null,
          ipdOccupiedBeds: null,
          otUtilisationPct: null,
          availableBeds: null,
          labTurnaroundAvgMins: null,
          radiologyTurnaroundAvgMins: null,
          pharmacyStockHealthPct: null,
          pendingInsuranceClaimsINR: null,
          codeBlueCount: null,
          sepsisRiskAlerts: null,
          strokeAlerts: null,
          highNews2Count: null,
          criticalLabValues: null,
          aiConsultationsCount: null,
          acceptedRecommendationsPct: null,
          overrideCount: null,
          translationDispatches: null,
          apiLatencyMs: null,
        },
      });
    }

    const User = require('../models/User');
    const Appointment = require('../models/Appointment');
    const QueueToken = require('../models/QueueToken');
    const Invoice = require('../models/Invoice');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [userCount, todayAppts, waitingTokens, revenueAgg, outstandingInvoices] =
      await Promise.all([
        User.countDocuments({ isActive: true }),
        Appointment.countDocuments({ date: { $gte: today } }),
        QueueToken.find({ status: 'WAITING', createdAt: { $gte: today } }, { createdAt: 1 }).lean(),
        Invoice.aggregate([
          { $match: { issuedAt: { $gte: today }, status: { $in: ['PAID', 'PARTIALLY_PAID'] } } },
          { $group: { _id: null, total: { $sum: '$amountPaid' } } },
        ]).catch(() => []),
        Invoice.countDocuments({ status: 'PENDING' }).catch(() => 0),
      ]);

    // Compute average waiting time in minutes from queue tokens created today
    let waitingPatientsAvgMins = null;
    if (waitingTokens.length > 0) {
      const now = Date.now();
      const totalMs = waitingTokens.reduce((sum, t) => sum + (now - new Date(t.createdAt).getTime()), 0);
      waitingPatientsAvgMins = Math.round(totalMs / waitingTokens.length / 60000);
    }

    res.json({
      success: true,
      data: {
        activeSessions: userCount,
        todayAppointments: todayAppts,
        dbConnected: true,
        uptime: process.uptime(),
        memUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),

        // Real operational metrics derived from existing data
        waitingPatientsCount: waitingTokens.length,
        waitingPatientsAvgMins,
        revenueTodayINR: revenueAgg[0]?.total ?? 0,
        outstandingInvoicesCount: outstandingInvoices,

        // Features not yet implemented — explicitly null, NOT zero.
        // Frontend must render null as "—" rather than "0".
        icuOccupancyPct: null,
        ipdOccupiedBeds: null,
        otUtilisationPct: null,
        availableBeds: null,
        labTurnaroundAvgMins: null,
        radiologyTurnaroundAvgMins: null,
        pharmacyStockHealthPct: null,
        pendingInsuranceClaimsINR: null,
        codeBlueCount: null,
        sepsisRiskAlerts: null,
        strokeAlerts: null,
        highNews2Count: null,
        criticalLabValues: null,
        aiConsultationsCount: null,
        acceptedRecommendationsPct: null,
        overrideCount: null,
        translationDispatches: null,
        apiLatencyMs: null,
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

exports.getMigrationJobs = async (req, res) => {
  try {
    const isDBConnected = () => require('mongoose').connection.readyState === 1;
    if (!isDBConnected()) {
      return res.json({ success: true, data: [] });
    }
    const MigrationJob = require('../models/MigrationJob');
    const jobs = await MigrationJob.find().sort({ createdAt: -1 }).limit(50).lean();
    const data = jobs.map((j) => ({
      id: j._id.toString(),
      sourceSystem: j.sourceSystem,
      dataType: j.dataType,
      recordCount: j.recordCount,
      processedCount: j.processedCount,
      status: j.status,
      startedAt: j.createdAt,
      completedAt: j.completedAt || null,
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createMigrationJob = async (req, res) => {
  try {
    const isDBConnected = () => require('mongoose').connection.readyState === 1;
    if (!isDBConnected()) {
      return res.status(503).json({ success: false, message: 'Database unavailable — cannot create migration job.' });
    }
    const { sourceSystem, dataType, recordCount } = req.body;
    if (!sourceSystem || !dataType || !recordCount) {
      return res.status(400).json({ success: false, message: 'sourceSystem, dataType, and recordCount are required.' });
    }
    const MigrationJob = require('../models/MigrationJob');
    const job = await MigrationJob.create({
      sourceSystem,
      dataType,
      recordCount: Number(recordCount),
      processedCount: 0,
      status: 'PENDING',
      createdBy: req.user?._id || null,
    });
    res.json({
      success: true,
      data: {
        id: job._id.toString(),
        sourceSystem: job.sourceSystem,
        dataType: job.dataType,
        recordCount: job.recordCount,
        processedCount: job.processedCount,
        status: job.status,
        startedAt: job.createdAt,
        completedAt: null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSupportTickets = async (req, res) => {
  try {
    const isDBConnected = () => require('mongoose').connection.readyState === 1;
    if (!isDBConnected()) {
      return res.json({ success: true, data: [] });
    }
    const SupportTicket = require('../models/SupportTicket');
    const tickets = await SupportTicket.find({ status: { $ne: 'RESOLVED' } }).sort({ createdAt: -1 }).limit(100).lean();
    const data = tickets.map((t) => ({
      id: t._id.toString(),
      hospitalName: t.hospitalName,
      title: t.title,
      severity: t.severity,
      status: t.status,
      assignedEngineer: t.assignedEngineer,
      slaExpiresInMins: t.slaExpiresInMins,
      createdAt: t.createdAt,
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createSupportTicket = async (req, res) => {
  try {
    const isDBConnected = () => require('mongoose').connection.readyState === 1;
    if (!isDBConnected()) {
      return res.status(503).json({ success: false, message: 'Database unavailable — cannot create ticket.' });
    }
    const { hospitalName, title, severity } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'title is required.' });
    }
    const SupportTicket = require('../models/SupportTicket');
    const slaMap = { CRITICAL: 30, MAJOR: 120, MINOR: 240 };
    const ticket = await SupportTicket.create({
      hospitalName: hospitalName || 'CareConnect Platform',
      title,
      severity: severity || 'MINOR',
      status: 'OPEN',
      assignedEngineer: 'Unassigned',
      slaExpiresInMins: slaMap[severity] || 240,
      createdBy: req.user?._id || null,
    });
    res.json({
      success: true,
      data: {
        id: ticket._id.toString(),
        hospitalName: ticket.hospitalName,
        title: ticket.title,
        severity: ticket.severity,
        status: ticket.status,
        assignedEngineer: ticket.assignedEngineer,
        slaExpiresInMins: ticket.slaExpiresInMins,
        createdAt: ticket.createdAt,
      },
    });
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
      AuditLog.find()
        .sort({ at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'firstName lastName email role')
        .lean(),
      AuditLog.countDocuments(),
    ]);

    // Map to the shape the admin audit-log frontend expects (AuditLogEntry type).
    // actorId is populated so it now carries name/email/role rather than a raw ObjectId.
    const data = logs.map((log) => {
      const actor = log.actorId && typeof log.actorId === 'object' ? log.actorId : null;
      return {
        _id: String(log._id),
        seq: log.seq,
        at: log.at ? new Date(log.at).toISOString() : null,
        userId: actor
          ? {
              _id: String(actor._id),
              firstName: actor.firstName || null,
              lastName: actor.lastName || null,
              email: actor.email || null,
              role: actor.role || null,
            }
          : (log.actorId ? { _id: String(log.actorId) } : null),
        userRole: log.actorRole || null,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId || null,
        method: log.method || null,
        path: log.path || null,
        statusCode: log.statusCode || null,
        ip: log.ip || null,
        traceId: log.traceId || null,
        success: log.statusCode ? log.statusCode < 400 : true,
      };
    });

    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
