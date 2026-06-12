import Appointment from '../models/Appointment.js';

// ============ GET ALL APPOINTMENTS ============
export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.userId }).sort({ date: 1 });
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ ADD APPOINTMENT ============
export const addAppointment = async (req, res) => {
  try {
    const { doctorName, specialty, date, time, location, notes } = req.body;

    if (!doctorName || !date || !time) {
      return res.status(400).json({ error: 'Doctor name, date and time are required' });
    }

    const appointment = new Appointment({
      userId: req.userId,
      doctorName,
      specialty: specialty || '',
      date,
      time,
      location: location || '',
      notes: notes || '',
      status: 'upcoming'
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Appointment added successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ UPDATE APPOINTMENT ============
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updates,
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ success: true, message: 'Appointment updated', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ DELETE APPOINTMENT ============
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findOneAndDelete({ _id: id, userId: req.userId });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { getAppointments, addAppointment, updateAppointment, deleteAppointment };
