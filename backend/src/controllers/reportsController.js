const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Appointment = require('../models/Appointment');
const BedRecord = require('../models/BedRecord');
const PharmacyOrder = require('../models/PharmacyOrder');
const LabOrder = require('../models/LabOrder');

function dateRangeBounds(range) {
  const now = new Date();
  let start;
  switch (range) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      start = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      start = new Date(now - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default: // month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start, end: now };
}

function emptyReport(range) {
  return {
    kpis: { grossRevenue: 0, bedOccupancyPct: 0, totalBeds: 0, occupiedBeds: 0, patientFootfall: 0, avgLosDays: null, opdRevenue: 0, ipdRevenue: 0, pharmacyRevenue: 0 },
    deptRevenue: [],
    paymentModes: [],
    wardOccupancy: [],
    labVolume: [],
    pharmacyVolume: [],
    range,
    generatedAt: new Date().toISOString(),
  };
}

// @desc  Executive analytics report
// @route GET /api/reports/executive?range=today|week|month|quarter|year&dept=
// @access Private (admin, doctor)
const getExecutiveReport = async (req, res, next) => {
  try {
    const range = req.query.range || 'month';
    const { start, end } = dateRangeBounds(range);

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, data: emptyReport(range) });
    }

    const invoiceFilter = { issuedAt: { $gte: start, $lte: end }, status: { $in: ['PAID', 'PARTIALLY_PAID'] } };
    const aptFilter    = { date: { $gte: start, $lte: end } };

    const [invoiceAgg, aptCount, bedAgg, labAgg, pharmaAgg, occupiedBeds] = await Promise.all([
      Invoice.aggregate([
        { $match: invoiceFilter },
        { $group: {
          _id: '$type',
          total: { $sum: '$totalAmount' },
          tpaTotal: { $sum: { $cond: [{ $gt: ['$insuranceClaimId', null] }, '$totalAmount', 0] } },
        }},
      ]),

      Appointment.countDocuments(aptFilter),

      BedRecord.aggregate([
        { $group: {
          _id: '$ward',
          total: { $sum: 1 },
          occupied: { $sum: { $cond: [{ $eq: ['$status', 'Occupied'] }, 1, 0] } },
        }},
        { $sort: { total: -1 } },
      ]),

      LabOrder.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$panelName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      PharmacyOrder.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$medicines' },
        { $group: { _id: '$medicines', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      BedRecord.find({ status: 'Occupied', admittedAt: { $ne: null } }, { admittedAt: 1 }).lean(),
    ]);

    // KPIs — revenue
    const typeMap = {};
    let grossRevenue = 0;
    let tpaTotal = 0;
    for (const row of invoiceAgg) {
      typeMap[row._id] = row.total;
      grossRevenue += row.total;
      tpaTotal += row.tpaTotal || 0;
    }
    const otherTotal = grossRevenue - tpaTotal;

    // KPIs — beds
    const totalBeds     = bedAgg.reduce((s, w) => s + w.total, 0);
    const totalOccupied = bedAgg.reduce((s, w) => s + w.occupied, 0);
    const bedOccupancyPct = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

    // KPIs — ALOS from admittedAt on occupied beds
    let avgLosDays = null;
    if (occupiedBeds.length > 0) {
      const now = Date.now();
      const sumDays = occupiedBeds.reduce((s, b) => s + (now - new Date(b.admittedAt).getTime()), 0);
      avgLosDays = Math.round((sumDays / occupiedBeds.length / 86400000) * 10) / 10;
    }

    // Dept revenue breakdown
    const TYPE_LABELS = {
      OPD: 'OPD Consultations', IPD: 'IPD / Admissions',
      PHARMACY: 'Pharmacy', LABORATORY: 'Laboratory',
      EMERGENCY: 'Emergency', PACKAGE: 'Day Care / Packages',
    };
    const deptRevenue = Object.entries(typeMap)
      .map(([type, total]) => ({ dept: TYPE_LABELS[type] || type, total }))
      .sort((a, b) => b.total - a.total);

    // Add pct for chart
    const deptRevenueWithPct = deptRevenue.map(d => ({
      ...d,
      pct: grossRevenue > 0 ? Math.round((d.total / grossRevenue) * 100) : 0,
    }));

    // Ward occupancy
    const wardOccupancy = bedAgg.map(w => ({
      ward: w._id || 'General',
      total: w.total,
      occupied: w.occupied,
      pct: w.total > 0 ? Math.round((w.occupied / w.total) * 100) : 0,
    }));

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          grossRevenue,
          bedOccupancyPct,
          totalBeds,
          occupiedBeds: totalOccupied,
          patientFootfall: aptCount,
          avgLosDays,
          opdRevenue:       typeMap['OPD']       || 0,
          ipdRevenue:       typeMap['IPD']       || 0,
          pharmacyRevenue:  typeMap['PHARMACY']  || 0,
        },
        deptRevenue: deptRevenueWithPct,
        paymentModes: [
          { label: 'TPA / Health Insurance', total: tpaTotal, badge: 'Claims' },
          { label: 'Direct / Self-Pay',      total: otherTotal, badge: 'Direct' },
        ],
        wardOccupancy,
        labVolume: labAgg.map(r => ({ name: r._id, count: r.count })),
        pharmacyVolume: pharmaAgg.map(r => ({ name: r._id, count: r.count })),
        range,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExecutiveReport };
