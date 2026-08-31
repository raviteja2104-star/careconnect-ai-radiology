const DoctorSchedule = require('../models/DoctorSchedule');
const Appointment = require('../models/Appointment');
const SlotReservation = require('../models/SlotReservation');
const moment = require('moment'); // For robust date/time math

class SchedulingEngine {
  
  /**
   * Generates available slots for a given doctor on a given date.
   */
  static async getAvailableSlots(doctorId, dateString, hospital = 'CareConnect Main Hospital') {
    const targetDate = moment(dateString);
    const dayOfWeek = targetDate.format('dddd'); // e.g., 'Monday'

    // 1. Fetch Doctor Schedule
    const schedule = await DoctorSchedule.findOne({
      doctor: doctorId,
      hospital: hospital,
      effectiveFrom: { $lte: targetDate.toDate() },
      $or: [
        { effectiveTo: null },
        { effectiveTo: { $gte: targetDate.toDate() } }
      ]
    }).sort({ effectiveFrom: -1 });

    if (!schedule) return []; // No schedule found

    // 2. Check for Cancellations or Leaves
    const isCancelled = schedule.exceptions.some(ex => moment(ex.date).isSame(targetDate, 'day') && ex.isCancelled);
    if (isCancelled) return [];

    const isOnLeave = schedule.leaves.some(leave => 
      targetDate.isBetween(moment(leave.startDate), moment(leave.endDate), 'day', '[]')
    );
    if (isOnLeave) return [];

    // 3. Determine shifts to use (Exceptions override normal weekly schedule)
    const exceptionDay = schedule.exceptions.find(ex => moment(ex.date).isSame(targetDate, 'day'));
    const shifts = exceptionDay && exceptionDay.shifts.length > 0 
      ? exceptionDay.shifts 
      : schedule.weeklySchedule[dayOfWeek];

    if (!shifts || shifts.length === 0) return [];

    // 4. Generate Base Slots
    let availableSlots = [];
    
    for (const shift of shifts) {
      const shiftStart = moment(`${dateString} ${shift.startTime}`, 'YYYY-MM-DD HH:mm');
      const shiftEnd = moment(`${dateString} ${shift.endTime}`, 'YYYY-MM-DD HH:mm');
      const duration = shift.consultationDuration || 15;
      const buffer = shift.bufferTime || 0;

      let currentSlot = shiftStart.clone();

      while (currentSlot.clone().add(duration, 'minutes').isSameOrBefore(shiftEnd)) {
        const timeStr = currentSlot.format('hh:mm A');
        
        // Check if slot falls in a break
        const isInBreak = shift.breaks.some(brk => {
          const brkStart = moment(`${dateString} ${brk.startTime}`, 'YYYY-MM-DD HH:mm');
          const brkEnd = moment(`${dateString} ${brk.endTime}`, 'YYYY-MM-DD HH:mm');
          return currentSlot.isBetween(brkStart, brkEnd, null, '[)');
        });

        if (!isInBreak) {
          availableSlots.push(timeStr);
        }

        currentSlot.add(duration + buffer, 'minutes');
      }
    }

    // 5. Remove Already Booked or Reserved Slots
    const appointments = await Appointment.find({
      doctor: doctorId,
      date: targetDate.toDate(),
      status: { $nin: ['Cancelled'] }
    });

    const reservations = await SlotReservation.find({
      doctor: doctorId,
      date: dateString,
      status: 'Reserved'
    });

    const blockedTimes = [
      ...appointments.map(a => a.timeSlot),
      ...reservations.map(r => r.time)
    ];

    return availableSlots.filter(slot => !blockedTimes.includes(slot));
  }

  /**
   * Reserves a slot to prevent double-booking (Optimistic Concurrency).
   * Automatically expires after 10 minutes via MongoDB TTL index.
   */
  static async reserveSlot(doctorId, patientId, dateString, timeString, sessionId) {
    try {
      const reservation = await SlotReservation.create({
        doctor: doctorId,
        patient: patientId,
        date: dateString,
        time: timeString,
        sessionId: sessionId,
        expiresAt: moment().add(10, 'minutes').toDate(),
        status: 'Reserved'
      });
      return { success: true, reservation };
    } catch (error) {
      // If code 11000, unique index collision means someone just grabbed it
      if (error.code === 11000) {
        throw new Error('SLOT_ALREADY_RESERVED');
      }
      throw error;
    }
  }

  static async confirmReservation(reservationId) {
    return await SlotReservation.findByIdAndUpdate(reservationId, { status: 'Confirmed' });
  }

  static async releaseReservation(reservationId) {
    return await SlotReservation.findByIdAndDelete(reservationId);
  }
}

module.exports = SchedulingEngine;
