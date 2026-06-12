import SupportQuery from '../models/SupportQuery.js';

// ============ SUBMIT QUERY ============
export const submitQuery = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const query = new SupportQuery({
      userId: req.userId,
      subject,
      message,
      status: 'pending'
    });

    await query.save();

    res.status(201).json({
      success: true,
      message: 'Your query has been submitted. We will get back to you soon!',
      query
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ GET USER QUERIES ============
export const getMyQueries = async (req, res) => {
  try {
    const queries = await SupportQuery.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, queries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { submitQuery, getMyQueries };
