/**
 * Centralized API service for Company A Real Estate Platform
 */

const API_BASE = '/api';

export const api = {
  // Projects
  async getProjects() {
    const res = await fetch(`${API_BASE}/projects`);
    return res.json();
  },

  async getProject(id) {
    const res = await fetch(`${API_BASE}/projects/${id}`);
    return res.json();
  },

  // Leads
  async getLeads(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/leads?${query}`);
    return res.json();
  },

  async checkDuplicate(phone, email) {
    const res = await fetch(`${API_BASE}/leads/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, email })
    });
    return res.json();
  },

  async createLead(leadData) {
    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
    return res.json();
  },

  async mergeLeads(primaryId, duplicateId) {
    const res = await fetch(`${API_BASE}/leads/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primary_id: primaryId, duplicate_id: duplicateId })
    });
    return res.json();
  },

  async updateLead(id, updates) {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  // Chat & AI
  async startChat({ lead_id, project_id, language }) {
    const res = await fetch(`${API_BASE}/chat/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id, project_id, language })
    });
    return res.json();
  },

  async sendMessage({ conversation_id, lead_id, project_id, text, language }) {
    const res = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id, lead_id, project_id, text, language })
    });
    return res.json();
  },

  async getConversation(id) {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`);
    return res.json();
  },

  async requestHandoff({ conversation_id, lead_id, reason }) {
    const res = await fetch(`${API_BASE}/chat/handoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id, lead_id, reason })
    });
    return res.json();
  },

  async getFlaggedChats() {
    const res = await fetch(`${API_BASE}/chat/flagged`);
    return res.json();
  },

  // Slots & Booking
  async getSlots(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/slots?${query}`);
    return res.json();
  },

  async bookSlot({ lead_id, slot_id, project_id }) {
    const res = await fetch(`${API_BASE}/slots/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id, slot_id, project_id })
    });
    return res.json();
  },

  async createSlot(slotData) {
    const res = await fetch(`${API_BASE}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slotData)
    });
    return res.json();
  },

  async updateSlot(id, updates) {
    const res = await fetch(`${API_BASE}/slots/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  // Site Visits
  async getVisits(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/visits?${query}`);
    return res.json();
  },

  async updateVisitStatus(id, status, notes) {
    const res = await fetch(`${API_BASE}/visits/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
    return res.json();
  },

  async triggerReminder(id, type) {
    const res = await fetch(`${API_BASE}/visits/${id}/reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    return res.json();
  },

  // Analytics Dashboard
  async getDashboardAnalytics() {
    const res = await fetch(`${API_BASE}/analytics/dashboard`);
    return res.json();
  },

  // Fact Sheet
  async getFactSheet(projectId) {
    const res = await fetch(`${API_BASE}/factsheet/${projectId}`);
    return res.json();
  },

  async updateFactSheet(projectId, data) {
    const res = await fetch(`${API_BASE}/factsheet/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Auth & Staff Profiles
  async getProfiles() {
    const res = await fetch(`${API_BASE}/auth/profiles`);
    return res.json();
  },

  async switchRole(role, userId) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, user_id: userId })
    });
    return res.json();
  }
};

export default api;
