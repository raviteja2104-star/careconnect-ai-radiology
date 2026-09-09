const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const DoctorSchedule = require('../models/DoctorSchedule');
const bcrypt = require('bcryptjs');

// @desc    List all doctors (admin view) with optional filters
// @route   GET /api/admin/doctors?hospital=&department=&specialty=&status=
exports.listDoctors = async (req, res) => {
  try {
    const { hospital, department, specialty, status, search } = req.query;
    const profileQuery = {};
    if (hospital) profileQuery.hospital = hospital;
    if (department) profileQuery.department = department;
    if (specialty) profileQuery.specialty = specialty;

    const profiles = await DoctorProfile.find(profileQuery)
      .populate('user', 'firstName lastName email phone gender dateOfBirth isActive avatar specialization department hospital')
      .lean();

    let results = profiles.map(p => ({
      _id: p.user?._id,
      profileId: p._id,
      name: p.user ? `${p.user.firstName} ${p.user.lastName}` : 'Unknown',
      email: p.user?.email || '',
      phone: p.user?.phone || '',
      gender: p.user?.gender || '',
      dateOfBirth: p.user?.dateOfBirth || null,
      specialty: p.specialty,
      department: p.department || p.user?.department || '',
      hospital: p.hospital || p.user?.hospital || 'CareConnect Main Hospital',
      qualification: p.qualification || '',
      experienceYears: p.experienceYears || 0,
      consultationFee: p.consultationFee || 0,
      medicalRegNumber: p.medicalRegNumber || '',
      consultationType: p.consultationType || 'In-Person',
      room: p.room || '',
      isActive: p.user?.isActive !== false,
      avatar: p.user?.avatar || '',
    }));

    if (status === 'active') results = results.filter(d => d.isActive);
    if (status === 'inactive') results = results.filter(d => !d.isActive);
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.department.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: results, total: results.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single doctor by userId
// @route   GET /api/admin/doctors/:id
exports.getDoctorById = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ user: req.params.id })
      .populate('user', 'firstName lastName email phone gender dateOfBirth isActive avatar')
      .lean();
    if (!profile) return res.status(404).json({ success: false, error: 'Doctor not found' });

    const u = profile.user || {};
    res.json({
      success: true,
      data: {
        _id: u._id,
        profileId: profile._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        gender: u.gender,
        dateOfBirth: u.dateOfBirth,
        isActive: u.isActive !== false,
        avatar: u.avatar,
        specialty: profile.specialty,
        department: profile.department,
        hospital: profile.hospital,
        qualification: profile.qualification,
        experienceYears: profile.experienceYears,
        consultationFee: profile.consultationFee,
        medicalRegNumber: profile.medicalRegNumber,
        consultationType: profile.consultationType,
        room: profile.room,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new doctor (User + DoctorProfile + blank DoctorSchedule)
// @route   POST /api/admin/doctors
exports.createDoctor = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, password, gender, dateOfBirth,
      specialty, department, hospital, qualification, experienceYears,
      consultationFee, medicalRegNumber, consultationType, room, status,
      createLogin,
    } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'firstName and lastName are required' });
    }
    if (!specialty) {
      return res.status(400).json({ success: false, error: 'specialty is required' });
    }
    if (email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(409).json({ success: false, error: 'Email already in use' });
    }

    // Create User record
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'doctor',
      isActive: status !== 'inactive',
      isVerified: true,
    };
    if (email) userData.email = email.toLowerCase().trim();
    if (phone) userData.phone = phone.trim();
    if (gender) userData.gender = gender;
    if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);

    if (createLogin && password) {
      userData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.create(userData);

    // Create DoctorProfile
    const profile = await DoctorProfile.create({
      user: user._id,
      specialty: specialty.trim(),
      department: department?.trim() || '',
      hospital: hospital?.trim() || 'CareConnect Main Hospital',
      qualification: qualification?.trim() || '',
      experienceYears: Number(experienceYears) || 0,
      consultationFee: Number(consultationFee) || 0,
      medicalRegNumber: medicalRegNumber?.trim() || '',
      consultationType: consultationType || 'In-Person',
      room: room?.trim() || '',
      availability: [],
    });

    // Create blank DoctorSchedule
    await DoctorSchedule.create({
      doctor: user._id,
      hospital: hospital?.trim() || 'CareConnect Main Hospital',
      weeklySchedule: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] },
      leaves: [],
      exceptions: [],
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        profileId: profile._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        specialty: profile.specialty,
        department: profile.department,
        hospital: profile.hospital,
        isActive: user.isActive,
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update doctor profile
// @route   PATCH /api/admin/doctors/:id
exports.updateDoctor = async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      firstName, lastName, email, phone, gender, dateOfBirth,
      specialty, department, hospital, qualification, experienceYears,
      consultationFee, medicalRegNumber, consultationType, room, status,
    } = req.body;

    const userUpdates = {};
    if (firstName) userUpdates.firstName = firstName.trim();
    if (lastName) userUpdates.lastName = lastName.trim();
    if (email) userUpdates.email = email.toLowerCase().trim();
    if (phone) userUpdates.phone = phone.trim();
    if (gender) userUpdates.gender = gender;
    if (dateOfBirth) userUpdates.dateOfBirth = new Date(dateOfBirth);
    if (status !== undefined) userUpdates.isActive = status !== 'inactive';

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdates);
    }

    const profileUpdates = {};
    if (specialty) profileUpdates.specialty = specialty.trim();
    if (department !== undefined) profileUpdates.department = department?.trim() || '';
    if (hospital) profileUpdates.hospital = hospital.trim();
    if (qualification !== undefined) profileUpdates.qualification = qualification?.trim() || '';
    if (experienceYears !== undefined) profileUpdates.experienceYears = Number(experienceYears) || 0;
    if (consultationFee !== undefined) profileUpdates.consultationFee = Number(consultationFee) || 0;
    if (medicalRegNumber !== undefined) profileUpdates.medicalRegNumber = medicalRegNumber?.trim() || '';
    if (consultationType) profileUpdates.consultationType = consultationType;
    if (room !== undefined) profileUpdates.room = room?.trim() || '';

    if (Object.keys(profileUpdates).length > 0) {
      await DoctorProfile.findOneAndUpdate({ user: userId }, profileUpdates);
    }

    const updated = await DoctorProfile.findOne({ user: userId })
      .populate('user', 'firstName lastName email phone gender isActive')
      .lean();

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Toggle doctor active status
// @route   PATCH /api/admin/doctors/:id/status
exports.toggleDoctorStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    await User.findByIdAndUpdate(req.params.id, { isActive: Boolean(isActive) });
    res.json({ success: true, data: { _id: req.params.id, isActive: Boolean(isActive) } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
