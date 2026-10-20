/**
 * Unified Full-Stack Express Server for Saudi Jobs & Recruitment Portal
 * Serves /api/* endpoints in development and mounts Vite middlewares
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INITIAL_ADMINS,
  INITIAL_APPLICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BALLOT_EVENT,
  INITIAL_CANDIDATES,
  INITIAL_CATEGORIES,
  INITIAL_JOBS,
  INITIAL_NOTICES,
  INITIAL_PAYMENTS,
  INITIAL_SETTINGS,
} from './src/data/initialData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parsing with support for payment screenshots (up to 20MB)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Persistent File-based Server Database
const DB_FILE = path.join(__dirname, 'server-database.json');

interface ServerDb {
  settings: typeof INITIAL_SETTINGS;
  categories: typeof INITIAL_CATEGORIES;
  jobs: typeof INITIAL_JOBS;
  candidates: typeof INITIAL_CANDIDATES;
  applications: typeof INITIAL_APPLICATIONS;
  payments: typeof INITIAL_PAYMENTS;
  ballot: typeof INITIAL_BALLOT_EVENT;
  admins: typeof INITIAL_ADMINS;
  notices: typeof INITIAL_NOTICES;
  auditLogs: typeof INITIAL_AUDIT_LOGS;
  sequences: { [year: number]: number };
}

function loadDatabase(): ServerDb {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading server database file, resetting to initial data:', e);
    }
  }

  const initialDb: ServerDb = {
    settings: {
      ...INITIAL_SETTINGS,
      feeCollectionAuthorized: true,
      isEmbassyAuthorized: true,
      authorizationDocumentRef: 'MFA/SAU-ISB/2026/AUTH-088',
      activePublicName: 'Royal Saudi Embassy in Islamabad — Recruitment Section',
    },
    categories: INITIAL_CATEGORIES,
    jobs: INITIAL_JOBS,
    candidates: INITIAL_CANDIDATES,
    applications: INITIAL_APPLICATIONS,
    payments: INITIAL_PAYMENTS,
    ballot: INITIAL_BALLOT_EVENT,
    admins: INITIAL_ADMINS,
    notices: INITIAL_NOTICES,
    auditLogs: INITIAL_AUDIT_LOGS,
    sequences: { 2026: 125 },
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(data: ServerDb): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving server database:', e);
  }
}

const db = loadDatabase();

function addAudit(action: string, details: string, actor: string = 'System', role: string = 'system') {
  db.auditLogs.unshift({
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    actor,
    role,
    action,
    details,
    ipAddress: '127.0.0.1',
  });
  saveDatabase(db);
}

// --- 1. JOBS & VACANCIES DIRECTORY API ---
const handleGetJobs = (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Jobs list retrieved.',
    jobs: db.jobs.filter((j) => j.isPublished),
    categories: db.categories,
    notices: db.notices.filter((n) => n.isPublic),
    settings: db.settings,
  });
};
app.get('/api/jobs/list', handleGetJobs);
app.get('/api/jobs/list.php', handleGetJobs);

// --- 2. CANDIDATE REGISTRATION API ---
const handleRegister = (req: Request, res: Response) => {
  const { fullName, email, mobile, cnic, dob, gender, city, province, education, experienceYears, passportStatus, preferredCategory, cvFileName } = req.body;

  if (!fullName || !email || !cnic || !mobile) {
    return res.status(400).json({ success: false, error: 'Full name, email, CNIC, and mobile are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCnic = cnic.trim();

  if (db.candidates.some((c) => c.cnic === cleanCnic || c.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ success: false, error: 'A candidate with this Email or CNIC is already registered.' });
  }

  const newCandidate = {
    id: `cand-${Date.now()}`,
    fullName: fullName.trim(),
    email: cleanEmail,
    mobile: mobile.trim(),
    cnic: cleanCnic,
    dob: dob || '1995-01-01',
    gender: gender || 'Male',
    city: city || 'Islamabad',
    province: province || 'Punjab',
    education: education || 'Matriculation',
    experienceYears: Number(experienceYears) || 0,
    passportStatus: passportStatus || 'Valid Passport',
    preferredCategory: preferredCategory || 'Driver',
    cvFileName: cvFileName || '',
    createdAt: new Date().toISOString().substring(0, 10),
  };

  db.candidates.push(newCandidate);
  addAudit('CANDIDATE_REGISTERED', `New candidate registered: ${fullName} (${cleanCnic})`, fullName, 'candidate');
  saveDatabase(db);

  return res.json({
    success: true,
    message: 'Registration completed successfully.',
    candidate: newCandidate,
  });
};
app.post('/api/auth/register', handleRegister);
app.post('/api/auth/register.php', handleRegister);

// --- 3. UNIFIED LOGIN API ---
const handleLogin = (req: Request, res: Response) => {
  const { type = 'candidate', username, email, identifier } = req.body;
  const query = (username || email || identifier || '').trim().toLowerCase();

  if (!query) {
    return res.status(400).json({ success: false, error: 'Please enter your login identifier.' });
  }

  if (type === 'admin') {
    const admin = db.admins.find((a) => a.username.toLowerCase() === query || a.email.toLowerCase() === query);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid administrative username or suspended account.' });
    }
    admin.lastLogin = new Date().toISOString().replace('T', ' ').substring(0, 19);
    addAudit('ADMIN_LOGIN', `Admin signed in: ${admin.name} [${admin.role}]`, admin.name, admin.role);
    saveDatabase(db);

    return res.json({
      success: true,
      message: 'Administrative authentication successful.',
      userType: 'admin',
      admin,
    });
  } else {
    const cleanCnicDigits = query.replace(/\D/g, '');
    const candidate = db.candidates.find((c) =>
      c.email.toLowerCase() === query || c.cnic.replace(/\D/g, '') === cleanCnicDigits
    );

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'No candidate found with that Email or CNIC.' });
    }

    addAudit('CANDIDATE_LOGIN', `Candidate logged in: ${candidate.fullName}`, candidate.fullName, 'candidate');
    saveDatabase(db);

    return res.json({
      success: true,
      message: 'Candidate sign in successful.',
      userType: 'candidate',
      candidate,
    });
  }
};
app.post('/api/auth/login', handleLogin);
app.post('/api/auth/login.php', handleLogin);

// --- 4. LOGOUT API ---
const handleLogout = (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};
app.post('/api/auth/logout', handleLogout);
app.post('/api/auth/logout.php', handleLogout);

// --- 5. APPLICATION SUBMISSION & ATOMIC TRACKING ID API ---
const handleApply = (req: Request, res: Response) => {
  const { candidateId, jobId, documents = [] } = req.body;

  const candidate = db.candidates.find((c) => c.id === candidateId);
  if (!candidate) {
    return res.status(401).json({ success: false, error: 'Candidate authentication required.' });
  }

  const job = db.jobs.find((j) => j.id === jobId && j.isPublished);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job vacancy not found.' });
  }

  const existing = db.applications.find((a) => a.candidateId === candidate.id && a.jobId === job.id && a.status !== 'Rejected');
  if (existing) {
    return res.status(400).json({ success: false, error: `You have already applied for this vacancy with Tracking ID: ${existing.trackingId}.` });
  }

  // Atomic unique Tracking ID generation
  const year = new Date().getFullYear();
  if (!db.sequences[year]) db.sequences[year] = 100;
  db.sequences[year] += 1;
  const trackingId = `SAJ-${year}-${String(db.sequences[year]).padStart(6, '0')}`;
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const newApp = {
    id: `app-${Date.now()}`,
    trackingId,
    candidateId: candidate.id,
    candidateName: candidate.fullName,
    candidateCnic: candidate.cnic,
    candidateMobile: candidate.mobile,
    candidateEmail: candidate.email,
    candidateCity: candidate.city,
    candidateProvince: candidate.province,
    jobId: job.id,
    jobTitle: job.title,
    jobLocation: job.location,
    appliedDate: nowStr.substring(0, 10),
    status: 'Processing Pending' as const,
    paymentStatus: 'Pending' as const,
    nextStageStatus: 'Pending Ballot / Selection' as const,
    documents: documents.map((d: any, idx: number) => ({
      id: `doc-${Date.now()}-${idx}`,
      title: d.title || 'Dossier Document',
      fileName: d.fileName || 'doc.pdf',
      fileSize: d.fileSize || '1.0 MB',
      uploadedAt: nowStr,
      verified: false,
    })),
    statusHistory: [
      {
        status: 'Submitted' as const,
        changedAt: nowStr,
        changedBy: candidate.fullName,
        notes: 'Application lodged through recruitment portal.',
      },
    ],
  };

  db.applications.unshift(newApp);
  addAudit('APPLICATION_LODGED', `Tracking ID ${trackingId} lodged for ${job.title}`, candidate.fullName, 'candidate');
  saveDatabase(db);

  return res.json({
    success: true,
    message: 'Application lodged successfully.',
    trackingId,
    application: newApp,
  });
};
app.post('/api/applications/submit', handleApply);
app.post('/api/applications/submit.php', handleApply);

// --- 6. PRIVACY-PRESERVING TRACKING API ---
const handleTrack = (req: Request, res: Response) => {
  const query = ((req.query.id || req.body.id || req.body.trackingId) as string || '').trim().toUpperCase();
  const secondaryAuth = ((req.query.secondaryAuth || req.body.secondaryAuth) as string || '').trim();

  if (!query) {
    return res.status(400).json({ success: false, error: 'Please provide a Tracking ID.' });
  }

  const appRecord = db.applications.find((a) => a.trackingId === query);
  if (!appRecord) {
    return res.status(404).json({ success: false, error: `No active recruitment record found for Tracking ID ${query}.` });
  }

  // Check secondary auth (last 4 digits of CNIC or mobile)
  let isUnlocked = false;
  if (secondaryAuth) {
    const cleanAuth = secondaryAuth.replace(/\D/g, '');
    const cnicDigits = appRecord.candidateCnic.replace(/\D/g, '');
    const mobileDigits = appRecord.candidateMobile.replace(/\D/g, '');
    if (cleanAuth.length >= 4 && (cnicDigits.endsWith(cleanAuth) || mobileDigits.endsWith(cleanAuth))) {
      isUnlocked = true;
    }
  }

  if (isUnlocked) {
    return res.json({
      success: true,
      found: true,
      isRestricted: false,
      application: appRecord,
    });
  } else {
    return res.json({
      success: true,
      found: true,
      isRestricted: true,
      data: {
        trackingId: appRecord.trackingId,
        jobTitle: appRecord.jobTitle,
        jobLocation: appRecord.jobLocation,
        appliedDate: appRecord.appliedDate,
        status: appRecord.status,
        paymentStatus: appRecord.paymentStatus,
        nextStageStatus: appRecord.nextStageStatus,
        statusHistory: appRecord.statusHistory,
      },
    });
  }
};
app.get('/api/applications/track', handleTrack);
app.get('/api/applications/track.php', handleTrack);
app.post('/api/applications/track', handleTrack);
app.post('/api/applications/track.php', handleTrack);

// --- 7. PAYMENT SUBMISSION & RECEIPT SCREENSHOT API ---
const handlePaymentSubmit = (req: Request, res: Response) => {
  const { applicationId, paymentMethod = 'Bank Transfer', bankName = 'Meezan Bank Ltd', transactionRef, paymentDate, receiptFileName, receiptImageData } = req.body;

  if (!applicationId || !transactionRef) {
    return res.status(400).json({ success: false, error: 'Application selection and transaction reference are required.' });
  }

  const appRecord = db.applications.find((a) => a.id === applicationId);
  if (!appRecord) {
    return res.status(404).json({ success: false, error: 'Application record not found.' });
  }

  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const newPayment = {
    id: `pay-${Date.now()}`,
    applicationId: appRecord.id,
    trackingId: appRecord.trackingId,
    candidateName: appRecord.candidateName,
    amountPKR: db.settings.feeAmountPKR,
    paymentMethod,
    bankName,
    transactionRef: transactionRef.trim(),
    paymentDate: paymentDate || nowStr.substring(0, 10),
    receiptFileName: receiptFileName || 'receipt_screenshot.jpg',
    receiptImageData: receiptImageData || null, // Full screenshot image base64 data for admin inspection!
    status: 'Submitted for Verification' as const,
    submittedAt: nowStr,
  };

  // Replace or add payment record
  db.payments = db.payments.filter((p) => p.applicationId !== appRecord.id);
  db.payments.unshift(newPayment);

  // Update application statuses
  appRecord.paymentStatus = 'Submitted for Verification';
  appRecord.status = 'Payment Verification Pending';
  appRecord.statusHistory.push({
    status: 'Payment Verification Pending',
    changedAt: nowStr,
    changedBy: appRecord.candidateName,
    notes: `Payment receipt submitted via ${paymentMethod}. Ref: ${transactionRef}`,
  });

  addAudit('PAYMENT_SUBMITTED', `Receipt screenshot uploaded for ${appRecord.trackingId}. Ref: ${transactionRef}`, appRecord.candidateName, 'candidate');
  saveDatabase(db);

  return res.json({
    success: true,
    message: 'Payment details and receipt screenshot submitted for admin verification.',
    payment: newPayment,
  });
};
app.post('/api/payments/submit', handlePaymentSubmit);
app.post('/api/payments/submit.php', handlePaymentSubmit);

// --- 8. ADMIN DASHBOARD DATA API ---
const handleAdminDashboard = (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Admin console data loaded.',
    applications: db.applications,
    payments: db.payments,
    candidates: db.candidates,
    jobs: db.jobs,
    categories: db.categories,
    ballot: db.ballot,
    settings: db.settings,
    auditLogs: db.auditLogs,
    admins: db.admins,
  });
};
app.get('/api/admin/dashboard', handleAdminDashboard);
app.get('/api/admin/dashboard.php', handleAdminDashboard);

// --- 9. ADMIN PAYMENT VERIFICATION API ---
const handleVerifyPayment = (req: Request, res: Response) => {
  const { paymentId, action = 'verify', isVerified, rejectionReason, refundRef } = req.body;

  const payment = db.payments.find((p) => p.id === paymentId);
  if (!payment) {
    return res.status(404).json({ success: false, error: 'Payment record not found.' });
  }

  const appRecord = db.applications.find((a) => a.id === payment.applicationId);
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  if (action === 'verify' || isVerified === true) {
    payment.status = 'Verified';
    payment.verifiedBy = 'Payment Reviewer';
    payment.verifiedAt = nowStr;

    if (appRecord) {
      appRecord.paymentStatus = 'Verified';
      appRecord.status = 'Processing Pending';
      appRecord.statusHistory.push({
        status: 'Processing Pending',
        changedAt: nowStr,
        changedBy: 'Finance & Accounts',
        notes: 'Bank deposit verified against escrow account statement.',
      });
    }

    addAudit('PAYMENT_VERIFIED', `Payment for ${payment.trackingId} verified.`, 'Payment Reviewer', 'payment_reviewer');
  } else if (action === 'reject' || isVerified === false) {
    payment.status = 'Rejected';
    payment.rejectionReason = rejectionReason || 'Transaction reference not found in bank statement.';

    if (appRecord) {
      appRecord.paymentStatus = 'Rejected';
      appRecord.status = 'Payment Pending';
      appRecord.statusHistory.push({
        status: 'Payment Pending',
        changedAt: nowStr,
        changedBy: 'Finance & Accounts',
        notes: `Payment rejected: ${payment.rejectionReason}`,
      });
    }

    addAudit('PAYMENT_REJECTED', `Payment for ${payment.trackingId} rejected: ${payment.rejectionReason}`, 'Payment Reviewer', 'payment_reviewer');
  } else if (action === 'refund') {
    payment.status = 'Refunded';
    payment.refundRef = refundRef || `REF-${Date.now()}`;
    payment.refundDate = nowStr.substring(0, 10);

    if (appRecord) {
      appRecord.paymentStatus = 'Refunded';
    }

    addAudit('PAYMENT_REFUNDED', `Refund processed for ${payment.trackingId}. Ref: ${payment.refundRef}`, 'Payment Reviewer', 'payment_reviewer');
  }

  saveDatabase(db);
  return res.json({ success: true, message: 'Payment record updated successfully.' });
};
app.post('/api/admin/verify-payment', handleVerifyPayment);
app.post('/api/admin/verify-payment.php', handleVerifyPayment);

// --- 10. ADMIN APPLICATION APPROVAL API ---
const handleApproveApplication = (req: Request, res: Response) => {
  const { applicationId, action = 'approve', notes, rejectionReason, additionalDocs } = req.body;

  const appRecord = db.applications.find((a) => a.id === applicationId);
  if (!appRecord) {
    return res.status(404).json({ success: false, error: 'Application not found.' });
  }

  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  if (action === 'approve') {
    appRecord.status = 'Ballot Eligible';
    appRecord.nextStageStatus = 'Ballot Scheduled';
    appRecord.reviewerName = 'Recruitment Manager';
    appRecord.reviewedAt = nowStr;
    appRecord.reviewNotes = notes || 'All credentials, CNIC, and educational requirements authenticated.';

    appRecord.statusHistory.push({
      status: 'Ballot Eligible',
      changedAt: nowStr,
      changedBy: 'Recruitment Manager',
      notes: appRecord.reviewNotes,
    });

    if (!db.ballot.eligibleApplicationIds.includes(appRecord.id)) {
      db.ballot.eligibleApplicationIds.push(appRecord.id);
    }

    addAudit('APPLICATION_APPROVED', `Application ${appRecord.trackingId} approved as Ballot Eligible`, 'Recruitment Manager', 'recruitment_admin');
  } else if (action === 'reject') {
    appRecord.status = 'Rejected';
    appRecord.nextStageStatus = 'Application Closed';
    appRecord.rejectionReason = rejectionReason || 'Incomplete dossier documents.';
    appRecord.reviewerName = 'Recruitment Manager';
    appRecord.reviewedAt = nowStr;

    appRecord.statusHistory.push({
      status: 'Rejected',
      changedAt: nowStr,
      changedBy: 'Recruitment Manager',
      notes: `Rejected: ${appRecord.rejectionReason}`,
    });

    db.ballot.eligibleApplicationIds = db.ballot.eligibleApplicationIds.filter((id) => id !== appRecord.id);
    addAudit('APPLICATION_REJECTED', `Application ${appRecord.trackingId} rejected: ${appRecord.rejectionReason}`, 'Recruitment Manager', 'recruitment_admin');
  } else if (action === 'request_docs') {
    appRecord.status = 'Documents Required';
    appRecord.additionalDocumentsRequested = additionalDocs || 'Police character certificate';

    appRecord.statusHistory.push({
      status: 'Documents Required',
      changedAt: nowStr,
      changedBy: 'Recruitment Manager',
      notes: `Additional documents requested: ${appRecord.additionalDocumentsRequested}`,
    });

    addAudit('DOCUMENTS_REQUESTED', `Requested docs for ${appRecord.trackingId}: ${appRecord.additionalDocumentsRequested}`, 'Recruitment Manager', 'recruitment_admin');
  }

  saveDatabase(db);
  return res.json({ success: true, message: 'Application processing status updated.' });
};
app.post('/api/admin/approve-application', handleApproveApplication);
app.post('/api/admin/approve-application.php', handleApproveApplication);

// --- 11. ADMIN BALLOT SELECTION API ---
const handleBallot = (req: Request, res: Response) => {
  const { quotaCount = 25, seed } = req.body;
  const eligible = db.applications.filter((a) => a.status === 'Ballot Eligible');

  if (eligible.length === 0) {
    return res.status(400).json({ success: false, error: 'No candidates currently have "Ballot Eligible" status.' });
  }

  const customSeed = seed || `SEED-SAJ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // Deterministic shuffle using seed
  const shuffled = [...eligible].sort((a, b) => {
    const hashA = (a.id + customSeed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hashB = (b.id + customSeed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hashA % 1000) - (hashB % 1000);
  });

  const selected = shuffled.slice(0, Math.min(Number(quotaCount), shuffled.length));
  const selectedIds = selected.map((s) => s.id);
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  for (const app of db.applications) {
    if (selectedIds.includes(app.id)) {
      app.nextStageStatus = 'Selected for Next Stage';
      app.statusHistory.push({
        status: 'Selected for Next Stage',
        changedAt: nowStr,
        changedBy: 'Computerized Ballot Draw Engine',
        notes: `Selected in official draw. Seed Proof: ${customSeed}`,
      });
    } else if (app.status === 'Ballot Eligible') {
      app.nextStageStatus = 'Not Selected';
      app.statusHistory.push({
        status: 'Not Selected',
        changedAt: nowStr,
        changedBy: 'Computerized Ballot Draw Engine',
        notes: 'Candidate retained in standby pool.',
      });
    }
  }

  db.ballot.status = 'Draw Completed';
  db.ballot.selectedApplicationIds = selectedIds;
  db.ballot.seedOrProof = customSeed;
  db.ballot.publishedAt = nowStr;

  addAudit('BALLOT_DRAW_EXECUTED', `Ballot draw conducted with seed ${customSeed}. Selected ${selected.length} candidates.`, 'Chief Administrative Officer', 'super_admin');
  saveDatabase(db);

  return res.json({
    success: true,
    message: `Ballot draw completed! ${selected.length} candidates selected.`,
    selectedCount: selected.length,
    seed: customSeed,
  });
};
app.post('/api/admin/ballot', handleBallot);
app.post('/api/admin/ballot.php', handleBallot);

// --- 12. ADMIN UPDATE STATUS & SETTINGS API ---
const handleUpdateStatus = (req: Request, res: Response) => {
  const { type = 'application_next_stage', applicationId, nextStageStatus, notes, isEmbassyAuthorized, authorizationDocumentRef, feeCollectionAuthorized, ballotDate, feeAmountPKR } = req.body;

  if (type === 'settings') {
    db.settings.isEmbassyAuthorized = Boolean(isEmbassyAuthorized);
    db.settings.authorizationDocumentRef = authorizationDocumentRef || '';
    db.settings.feeCollectionAuthorized = Boolean(feeCollectionAuthorized);
    if (ballotDate) db.settings.ballotDate = ballotDate;
    if (feeAmountPKR) db.settings.feeAmountPKR = Number(feeAmountPKR);
    db.settings.activePublicName = db.settings.isEmbassyAuthorized
      ? db.settings.authorizedOrganizationName
      : db.settings.temporaryPublicName;

    addAudit('SETTINGS_UPDATED', `Settings updated. Embassy authorized: ${db.settings.isEmbassyAuthorized}`, 'Super Administrator', 'super_admin');
    saveDatabase(db);
    return res.json({ success: true, message: 'Settings saved.' });
  } else {
    const appRecord = db.applications.find((a) => a.id === applicationId);
    if (!appRecord) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    appRecord.nextStageStatus = nextStageStatus;
    appRecord.statusHistory.push({
      status: nextStageStatus,
      changedAt: nowStr,
      changedBy: 'Recruitment Manager',
      notes: notes || `Next-stage status updated to "${nextStageStatus}"`,
    });
    addAudit('NEXT_STAGE_UPDATE', `Application ${appRecord.trackingId} status updated to ${nextStageStatus}`, 'Recruitment Manager', 'recruitment_admin');
    saveDatabase(db);
    return res.json({ success: true, message: 'Status updated.' });
  }
};
app.post('/api/admin/update-status', handleUpdateStatus);
app.post('/api/admin/update-status.php', handleUpdateStatus);

// Mount Vite in dev mode
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Saudi Jobs & Recruitment Portal Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
