const Invoice = require('../models/Invoice');
const User = require('../models/User');
const EventPublisher = require('../services/EventPublisher');
const { v4: uuidv4 } = require('uuid');

// @desc    Get Revenue Dashboard Metrics
// @route   GET /api/billing/dashboard
exports.getRevenueDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    const invoices = await Invoice.find({ issuedAt: { $gte: today } });
    
    let totalRevenue = 0;
    let pendingDues = 0;
    let collections = 0;

    invoices.forEach(inv => {
      totalRevenue += inv.totalAmount;
      pendingDues += inv.amountDue;
      collections += inv.amountPaid;
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        pendingDues,
        collections,
        totalInvoices: invoices.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Generate a new invoice
// @route   POST /api/billing/invoices
exports.createInvoice = async (req, res) => {
  try {
    const { patientId, type, items, discount = 0, tax = 0 } = req.body;
    
    let subTotal = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    let totalAmount = subTotal + tax - discount;
    
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const invoice = await Invoice.create({
      patient: patientId,
      invoiceNumber,
      type,
      items,
      subTotal,
      tax,
      discount,
      totalAmount,
      amountDue: totalAmount,
      amountPaid: 0,
      status: 'UNPAID'
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('INVOICE_CREATED', { invoice });
    }

    const patient = await User.findById(patientId);

    await EventPublisher.publish({
      eventType: 'InvoiceGenerated',
      version: '1.0',
      aggregateId: invoice._id.toString(),
      tenantId: req.headers['x-tenant-id'] || 't-default',
      traceId: req.headers['x-trace-id'] || uuidv4(),
      payload: {
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      recipient: {
        id: patientId.toString(),
        phone: patient ? patient.phone : '+15550001234',
        email: patient ? patient.email : 'patient@example.com',
        preferences: { sms: true, email: true, whatsapp: false, push: false }
      }
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all invoices
// @route   GET /api/billing/invoices
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('patient', 'name phone uhid')
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Process a payment for an invoice
// @route   POST /api/billing/payments
exports.processPayment = async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod } = req.body;
    
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

    invoice.amountPaid += amount;
    invoice.amountDue = invoice.totalAmount - invoice.amountPaid;

    if (invoice.amountDue <= 0) {
      invoice.status = 'PAID';
    } else {
      invoice.status = 'PARTIALLY_PAID';
    }

    await invoice.save();

    if (req.app.get('io')) {
      req.app.get('io').emit('PAYMENT_COMPLETED', { invoice, amount, paymentMethod });
    }

    const patient = await User.findById(invoice.patient);

    await EventPublisher.publish({
      eventType: 'PaymentSucceeded',
      version: '1.0',
      aggregateId: invoice._id.toString(),
      tenantId: req.headers['x-tenant-id'] || 't-default',
      traceId: req.headers['x-trace-id'] || uuidv4(),
      payload: {
        invoiceNumber: invoice.invoiceNumber,
        amountPaid: amount,
        paymentMethod: paymentMethod,
        amountDue: invoice.amountDue
      },
      recipient: {
        id: invoice.patient.toString(),
        phone: patient ? patient.phone : '+15550001234',
        email: patient ? patient.email : 'patient@example.com',
        preferences: { sms: true, email: true, whatsapp: true, push: false }
      }
    });

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
