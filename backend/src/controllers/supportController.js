/**
 * CareConnect — Support / Help-Center Controller
 * Serves a static FAQ dataset that can later be replaced with a CMS or DB.
 */

const FAQS = [
  { id: '1', category: 'Appointments', question: 'How do I book an appointment?', answer: 'Navigate to Appointments, click Book Appointment, select a doctor, date, and time slot.' },
  { id: '2', category: 'Appointments', question: 'How do I cancel an appointment?', answer: 'Go to Appointments, find your booked appointment, and click Cancel. Changes made at least 4 hours before the slot are free; later cancellations may incur a fee.' },
  { id: '3', category: 'Appointments', question: 'How do I reschedule an appointment?', answer: 'Open Appointments from the sidebar, select the visit you want to change, and choose Reschedule.' },
  { id: '4', category: 'Telemedicine', question: 'How do I start a video consultation?', answer: 'Go to Telemedicine, select your scheduled session, and click Join Session. Make sure your camera and microphone are allowed in your browser.' },
  { id: '5', category: 'Telemedicine', question: 'What do I need for a video consultation?', answer: 'A device with a camera and microphone, a stable internet connection, and an up-to-date browser. Join 5 minutes early for the automatic device check.' },
  { id: '6', category: 'Telemedicine', question: 'Is my video consultation private and secure?', answer: 'Yes. All consultations are end-to-end encrypted and are never recorded without your explicit consent.' },
  { id: '7', category: 'Billing', question: 'How do I view my invoices?', answer: 'Navigate to Billing to see all invoices and payment history.' },
  { id: '8', category: 'Billing', question: 'Where can I find my invoices and payment history?', answer: 'Billing lives under your profile menu. Every consultation, lab test, and pharmacy order generates an itemized invoice in INR (₹). You can pay outstanding balances online.' },
  { id: '9', category: 'Medical Records', question: 'How do I access my health records?', answer: 'Visit Health Records or the Patient Portal to view your complete medical history.' },
  { id: '10', category: 'Medical Records', question: 'How can I download my medical records and reports?', answer: 'Go to Health Records, open the document you need, and use the Download button. Lab results and radiology reports are available as PDFs.' },
  { id: '11', category: 'Account', question: 'How do I reset my password?', answer: 'On the login page click Forgot Password and follow the email instructions.' },
  { id: '12', category: 'Account', question: 'How do I update my contact details or emergency contact?', answer: 'Open Settings from your profile menu and edit the Personal Information section. Changes to your phone number require OTP verification.' },
];

exports.getFaqs = (req, res) => {
  const { category, q } = req.query;
  let data = FAQS;
  if (category) data = data.filter((f) => f.category === category);
  if (q) {
    const lower = q.toLowerCase();
    data = data.filter(
      (f) =>
        f.question.toLowerCase().includes(lower) ||
        f.answer.toLowerCase().includes(lower) ||
        f.category.toLowerCase().includes(lower),
    );
  }
  res.json({ success: true, data });
};

exports.getCategories = (_req, res) => {
  const categories = [...new Set(FAQS.map((f) => f.category))];
  res.json({ success: true, data: categories });
};
