const SecondOpinion = require('../models/SecondOpinion');
const RadiologyScan = require('../models/RadiologyScan');
const { deductCredits } = require('./walletController');

// Credit pricing per modality
const SCAN_CREDIT_COST = { XRAY: 2, CT: 5, MRI: 8 };

/**
 * GET /api/marketplace/specialists
 * Returns curated specialist directory (static + future DB-driven).
 */
exports.listSpecialists = async (req, res) => {
    // In production → query User.find({ role: 'radiologist', isMarketplaceListed: true })
    res.json({
        success: true,
        data: [
            { id: 's1', name: 'Dr. Sarah Wilson', specialization: 'Neuroradiology', rating: 4.9, fee: 45, tat: '2-4hrs', available: true },
            { id: 's2', name: 'Dr. James Chen', specialization: 'Cardiothoracic', rating: 4.8, fee: 60, tat: '1-3hrs', available: true },
            { id: 's3', name: 'Dr. Priya Verma', specialization: 'Musculoskeletal', rating: 5.0, fee: 35, tat: '4-6hrs', available: true },
            { id: 's4', name: 'Dr. Arjun Mehta', specialization: 'Abdominal', rating: 4.7, fee: 50, tat: '3-5hrs', available: false },
            { id: 's5', name: 'Dr. Aiko Tanaka', specialization: 'Paediatric', rating: 4.9, fee: 55, tat: '2-4hrs', available: true },
        ]
    });
};

/**
 * POST /api/marketplace/request
 * Request a second opinion. Deducts credits from requester's wallet.
 * Body: { scanId, specialistId, specialistMeta, clinicalQuestion, priority }
 */
exports.requestOpinion = async (req, res, next) => {
    try {
        const { scanId, specialistId, specialistMeta, clinicalQuestion, priority = 'normal' } = req.body;

        const scan = await RadiologyScan.findById(scanId);
        if (!scan) return res.status(404).json({ success: false, message: 'Scan not found' });

        const fee = specialistMeta?.fee;
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
