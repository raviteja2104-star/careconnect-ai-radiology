const FormTemplate = require('../models/FormTemplate');

exports.listTemplates = async (req, res) => {
  try {
    const templates = await FormTemplate.find().sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const { name, description, fields } = req.body;
    const template = await FormTemplate.create({
      name: name || 'Untitled Form',
      description,
      fields: fields || [],
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { name, description, fields } = req.body;
    const template = await FormTemplate.findByIdAndUpdate(
      req.params.id,
      { name, description, fields },
      { new: true, runValidators: true }
    ).lean();
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.publishTemplate = async (req, res) => {
  try {
    const template = await FormTemplate.findByIdAndUpdate(
      req.params.id,
      { status: 'published', $inc: { version: 1 } },
      { new: true }
    ).lean();
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
