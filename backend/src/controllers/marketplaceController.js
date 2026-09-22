const SecondOpinion = require('../models/SecondOpinion');
const RadiologyScan = require('../models/RadiologyScan');
const { deductCredits } = require('./walletController');

// Credit pricing per modality
const SCAN_CREDIT_COST = { XRAY: 2, CT: 5, MRI: 8 };

const User = require('../models/User');

const FALLBACK_SPECIALISTS = [
    { _id: 's1', firstName: 'Sarah', lastName: 'Wilson', specialization: 'Neuroradiology', marketplaceRating: 4.9, marketplaceFee: 45, marketplaceTat: '2-4hrs', isMarketplaceAvailable: true },
    { _id: 's2', firstName: 'James', lastName: 'Chen', specialization: 'Cardiothoracic Radiology', marketplaceRating: 4.8, marketplaceFee: 60, marketplaceTat: '1-3hrs', isMarketplaceAvailable: true },
    { _id: 's3', firstName: 'Priya', lastName: 'Verma', specialization: 'Musculoskeletal Radiology', marketplaceRating: 5.0, marketplaceFee: 35, marketplaceTat: '4-6hrs', isMarketplaceAvailable: true },
    { _id: 's4', firstName: 'Arjun', lastName: 'Mehta', specialization: 'Abdominal Radiology', marketplaceRating: 4.7, marketplaceFee: 50, marketplaceTat: '3-5hrs', isMarketplaceAvailable: false },
    { _id: 's5', firstName: 'Aiko', lastName: 'Tanaka', specialization: 'Paediatric Radiology', marketplaceRating: 4.9, marketplaceFee: 55, marketplaceTat: '2-4hrs', isMarketplaceAvailable: true },
];

function formatSpecialist(u) {
    return {
        id: String(u._id),
        name: `Dr. ${u.firstName} ${u.lastName}`.trim(),
        specialization: u.specialization,
        rating: u.marketplaceRating ?? 4.8,
        fee: u.marketplaceFee ?? 50,
        tat: u.marketplaceTat ?? '4-6hrs',
        available: u.isMarketplaceAvailable ?? false,
    };
}

/**
 * GET /api/marketplace/specialists
 */
exports.listSpecialists = async (req, res) => {
    try {
        const { isDB } = require('./walletController'); // reuse helper
        const dbReady = require('mongoose').connection.readyState === 1;
        if (!dbReady) {
            return res.json({ success: true, data: FALLBACK_SPECIALISTS.map(formatSpecialist) });
        }
        const users = await User.find({ role: 'radiologist', isMarketplaceListed: true })
            .select('firstName lastName specialization marketplaceRating marketplaceFee marketplaceTat isMarketplaceAvailable avatar')
            .lean();
        const data = users.length > 0
            ? users.map(formatSpecialist)
            : FALLBACK_SPECIALISTS.map(formatSpecialist);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/marketplace/request
 * Request a second opinion. Deducts credits from requester's wallet.
 * Body: { scanId, specialistId, specialistMeta, clinicalQuestion, priority }
 */
const isDB = () => { const m = require('mongoose'); return m.connection.readyState === 1; };

exports.requestOpinion = async (req, res, next) => {
    try {
        const { scanId, specialistId, specialistMeta, clinicalQuestion, priority = 'normal' } = req.body;
        const fee = specialistMeta?.fee || 50;

        if (!isDB()) {
            return res.status(503).json({ success: false, message: 'Database unavailable. Please try again shortly.' });
        }

        const scan = await RadiologyScan.findById(scanId);
        if (!scan) return res.status(404).json({ success: false, message: 'Scan not found' });

        if (!fee) return res.status(400).json({ success: false, message: 'Specialist fee missing' });

        // Deduct credits
        const balanceAfter = await deductCredits(req.user._id, {
            amount: fee,
            label: `Second Opinion — ${specialistMeta.name}`,
            referenceId: scanId,
            referenceType: 'consultation',
        });

        // Calculate SLA deadline
        const slaHours = priority === 'emergency' ? 1 : priority === 'urgent' ? 4 : 8;
        const dueBy = new Date(Date.now() + slaHours * 60 * 60 * 1000);

        const opinion = await SecondOpinion.create({
            scanId, requestedBy: req.user._id,
            specialistId, specialistMeta,
            clinicalQuestion, priority,
            creditsCharged: fee, slaHours, dueBy,
        });

        // Notify via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.emit('second_opinion_request', { opinionId: opinion._id, specialistId, scanId, priority });
        }

        res.status(201).json({ success: true, data: opinion, balanceAfter });
    } catch (err) {
        if (err.message === 'Insufficient credits') {
            return res.status(402).json({ success: false, message: 'Insufficient credits. Please top up your wallet.' });
        }
        next(err);
    }
};

/**
 * GET /api/marketplace/my-opinions
 * Patient's second opinion requests.
 */
exports.myOpinions = async (req, res, next) => {
    try {
        const opinions = await SecondOpinion.find({ requestedBy: req.user._id })
            .populate('scanId', 'scanType bodyPart scanId')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: opinions });
    } catch (err) { next(err); }
};

/**
 * PUT /api/marketplace/opinions/:id/complete
 * Specialist submits completed second opinion.
 * Body: { findings, impression, recommendations }
 */
exports.completeOpinion = async (req, res, next) => {
    try {
        const { findings, impression, recommendations } = req.body;
        const opinion = await SecondOpinion.findByIdAndUpdate(
            req.params.id,
            {
                status: 'completed',
                report: { findings, impression, recommendations, completedAt: new Date() }
            },
            { new: true }
        );
        if (!opinion) return res.status(404).json({ success: false, message: 'Opinion not found' });

        const io = req.app.get('io');
        if (io) io.emit('opinion_completed', { opinionId: opinion._id, requestedBy: opinion.requestedBy });

        res.json({ success: true, data: opinion });
    } catch (err) { next(err); }
};
