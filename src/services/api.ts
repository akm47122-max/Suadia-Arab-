/**
 * Real Backend API Client connecting React Frontend to PHP / Server Endpoints
 * All operations communicate via /api/* with JSON payloads and credentials
 */

const API_BASE = '/api';

export const apiClient = {
  async fetchJobs() {
    const res = await fetch(`${API_BASE}/jobs/list`);
    if (!res.ok) throw new Error('Failed to load vacancies.');
    return await res.json();
  },

  async register(candidateData: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Registration failed.');
    return json;
  },

  async login(credentials: { type: 'candidate' | 'admin'; username?: string; email?: string; identifier?: string; password?: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Authentication failed.');
    return json;
  },

  async logout() {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  },

  async submitApplication(payload: { candidateId: string; jobId: string; documents?: any[] }) {
    const res = await fetch(`${API_BASE}/applications/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Application submission failed.');
    return json;
  },

  async trackApplication(trackingId: string, secondaryAuth?: string) {
    const params = new URLSearchParams({ id: trackingId });
    if (secondaryAuth) params.append('secondaryAuth', secondaryAuth);
    const res = await fetch(`${API_BASE}/applications/track?${params.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Tracking record lookup failed.');
    return json;
  },

  async submitPayment(payload: {
    applicationId: string;
    paymentMethod: string;
    bankName?: string;
    transactionRef: string;
    paymentDate: string;
    receiptFileName: string;
    receiptImageData?: string | null;
  }) {
    const res = await fetch(`${API_BASE}/payments/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Payment recording failed.');
    return json;
  },

  async fetchAdminDashboard() {
    const res = await fetch(`${API_BASE}/admin/dashboard`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load administrative console.');
    return json;
  },

  async verifyPayment(payload: { paymentId: string; action?: 'verify' | 'reject' | 'refund'; isVerified?: boolean; rejectionReason?: string; refundRef?: string }) {
    const res = await fetch(`${API_BASE}/admin/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Payment status update failed.');
    return json;
  },

  async approveApplication(payload: { applicationId: string; action: 'approve' | 'reject' | 'request_docs'; notes?: string; rejectionReason?: string; additionalDocs?: string }) {
    const res = await fetch(`${API_BASE}/admin/approve-application`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Application status update failed.');
    return json;
  },

  async runBallot(payload: { quotaCount: number; seed?: string }) {
    const res = await fetch(`${API_BASE}/admin/ballot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Ballot draw execution failed.');
    return json;
  },

  async updateStatus(payload: {
    type?: 'application_next_stage' | 'settings';
    applicationId?: string;
    nextStageStatus?: string;
    notes?: string;
    isEmbassyAuthorized?: boolean;
    authorizationDocumentRef?: string;
    feeCollectionAuthorized?: boolean;
    ballotDate?: string;
    feeAmountPKR?: number;
  }) {
    const res = await fetch(`${API_BASE}/admin/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Update failed.');
    return json;
  },
};
