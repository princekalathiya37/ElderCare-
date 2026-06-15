// ============ API SERVICE ============
// All API calls to backend

// Priority: VITE env var → REACT_APP env var → Render production URL
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ||
  'https://eldercare-backend-n4v6.onrender.com/api';

class APIService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Set token after login
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // ============ AUTH ENDPOINTS ============

  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return this.handleResponse(response);
  }

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await this.handleResponse(response);
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async googleLogin(googleData) {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleData)
    });
    const data = await this.handleResponse(response);
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async updateProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData)
    });
    return this.handleResponse(response);
  }

  async updateFCMToken(fcmToken) {
    const response = await fetch(`${API_BASE_URL}/auth/update-fcm`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ fcmToken })
    });
    return this.handleResponse(response);
  }

  async savePushSubscription(subscription) {
    const response = await fetch(`${API_BASE_URL}/auth/subscribe`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ subscription })
    });
    return this.handleResponse(response);
  }

  async updateEmergencyContacts(contacts) {
    const response = await fetch(`${API_BASE_URL}/auth/emergency-contacts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ contacts })
    });
    return this.handleResponse(response);
  }

  async getUserProfile() {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async updateNotificationPreferences(prefs) {
    const response = await fetch(`${API_BASE_URL}/auth/notification-preferences`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(prefs)
    });
    return this.handleResponse(response);
  }

  // ============ MEDICINE ENDPOINTS ============

  async getAllMedicines() {
    const response = await fetch(`${API_BASE_URL}/medicines`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getMedicine(medicineId) {
    const response = await fetch(`${API_BASE_URL}/medicines/${medicineId}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async addMedicine(medicineData) {
    const response = await fetch(`${API_BASE_URL}/medicines`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(medicineData)
    });
    return this.handleResponse(response);
  }

  async updateMedicine(medicineId, medicineData) {
    const response = await fetch(`${API_BASE_URL}/medicines/${medicineId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(medicineData)
    });
    return this.handleResponse(response);
  }

  async deleteMedicine(medicineId) {
    const response = await fetch(`${API_BASE_URL}/medicines/${medicineId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async confirmMedicineTaken(medicineId, time) {
    const response = await fetch(`${API_BASE_URL}/medicines/${medicineId}/confirm`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ time })
    });
    return this.handleResponse(response);
  }

  async getTodaysMedicines() {
    const response = await fetch(`${API_BASE_URL}/medicines/today/list`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getMedicineConfirmations(medicineId) {
    const response = await fetch(`${API_BASE_URL}/medicines/${medicineId}/confirmations`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getAdherenceStats() {
    const response = await fetch(`${API_BASE_URL}/medicines/adherence/30days`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // ============ APPOINTMENT ENDPOINTS ============

  async getAppointments() {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async addAppointment(appointmentData) {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(appointmentData)
    });
    return this.handleResponse(response);
  }

  async updateAppointment(id, appointmentData) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(appointmentData)
    });
    return this.handleResponse(response);
  }

  async deleteAppointment(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // ============ SUPPORT ENDPOINTS ============

  async sendSupportQuery(subject, message) {
    const response = await fetch(`${API_BASE_URL}/support/query`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ subject, message })
    });
    return this.handleResponse(response);
  }

  async getMyQueries() {
    const response = await fetch(`${API_BASE_URL}/support/queries`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // ============ SOS ENDPOINTS ============

  async triggerEmergencySOS(location) {
    const response = await fetch(`${API_BASE_URL}/sos/trigger`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ location })
    });
    return this.handleResponse(response);
  }

  async getActiveSOS() {
    const response = await fetch(`${API_BASE_URL}/sos/active`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async resolveSOS(sosId) {
    const response = await fetch(`${API_BASE_URL}/sos/${sosId}/resolve`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getSOSHistory() {
    const response = await fetch(`${API_BASE_URL}/sos/history`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }


  // ============ RESPONSE HANDLER ============

  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }
}

export default new APIService();
