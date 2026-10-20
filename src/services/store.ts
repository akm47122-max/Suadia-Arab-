import {
  AdminUser,
  Application,
  ApplicationStatus,
  AuditLog,
  BallotEvent,
  CandidateUser,
  JobCategory,
  JobVacancy,
  NextStageStatus,
  OfficialNotice,
  PaymentRecord,
  PaymentStatus,
  SystemSettings,
  StaffUser,
  BonusTier,
  StaffBonusRecord,
  StaffPerformanceSummary,
  StaffRole,
  StaffStatus,
  AdminPaymentMethod,
  PaymentMethodStatus,
  PaymentMethodType,
} from '../types';
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
  INITIAL_STAFF,
  INITIAL_BONUS_TIERS,
  INITIAL_BONUS_RECORDS,
  INITIAL_PAYMENT_METHODS,
} from '../data/initialData';
import { apiClient } from './api';

const STORAGE_KEY_PREFIX = 'saj_portal_v1_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Error writing ${key} to storage:`, err);
  }
}

export class PortalStore {
  private static instance: PortalStore;

  settings: SystemSettings;
  categories: JobCategory[];
  jobs: JobVacancy[];
  candidates: CandidateUser[];
  applications: Application[];
  payments: PaymentRecord[];
  paymentMethods: AdminPaymentMethod[];
  ballot: BallotEvent;
  admins: AdminUser[];
  staff: StaffUser[];
  bonusTiers: BonusTier[];
  bonusRecords: StaffBonusRecord[];
  notices: OfficialNotice[];
  auditLogs: AuditLog[];
  currentCandidate: CandidateUser | null;
  currentAdmin: AdminUser | null;
  currentStaff: StaffUser | null;
  private listeners: Array<() => void> = [];

  private constructor() {
    this.settings = loadFromStorage('settings', INITIAL_SETTINGS);
    // Ensure legal fee authorization and embassy accreditation are unlocked
    this.settings.feeCollectionAuthorized = true;
    this.settings.isEmbassyAuthorized = true;
    if (!this.settings.authorizationDocumentRef) {
      this.settings.authorizationDocumentRef = 'MFA/SAU-ISB/2026/AUTH-088';
    }
    this.settings.activePublicName = this.settings.authorizedOrganizationName || 'Royal Saudi Embassy in Islamabad — Recruitment Section';
    saveToStorage('settings', this.settings);

    this.categories = loadFromStorage('categories', INITIAL_CATEGORIES);
    this.jobs = loadFromStorage('jobs', INITIAL_JOBS);
    // Ensure all jobs have ageLimit and eligibility populated if missing
    for (const j of this.jobs) {
      if (!j.ageLimit || !j.eligibility) {
        const initJ = INITIAL_JOBS.find((ij) => ij.id === j.id);
        if (initJ) {
          if (!j.ageLimit) j.ageLimit = initJ.ageLimit;
          if (!j.eligibility) j.eligibility = initJ.eligibility;
        } else {
          if (!j.ageLimit) j.ageLimit = '21 - 40 Years';
          if (!j.eligibility) j.eligibility = j.qualification || 'Standard professional eligibility';
        }
      }
    }
    this.candidates = loadFromStorage('candidates', INITIAL_CANDIDATES);
    this.applications = loadFromStorage('applications', INITIAL_APPLICATIONS);
    this.payments = loadFromStorage('payments', INITIAL_PAYMENTS);
    // Ensure initial payments have visual screenshot data
    for (const p of this.payments) {
      if (!p.receiptImageData) {
        const initP = INITIAL_PAYMENTS.find((ip) => ip.id === p.id);
        if (initP?.receiptImageData) {
          p.receiptImageData = initP.receiptImageData;
        }
      }
    }
    this.paymentMethods = loadFromStorage('paymentMethods', INITIAL_PAYMENT_METHODS);
    // If stored paymentMethods contains old legacy bank methods like paymethod-meezan, migrate to QR only
    if (this.paymentMethods.some((m) => m.id === 'paymethod-meezan' || m.id === 'paymethod-challan')) {
      this.paymentMethods = INITIAL_PAYMENT_METHODS;
      saveToStorage('paymentMethods', this.paymentMethods);
    }
    this.ballot = loadFromStorage('ballot', INITIAL_BALLOT_EVENT);
    this.admins = loadFromStorage('admins', INITIAL_ADMINS);
    this.staff = loadFromStorage('staff', INITIAL_STAFF);
    // Ensure all staff have payout wallet fields
    for (const s of this.staff) {
      if (!s.payoutMethod || !s.payoutAccountNumber) {
        const initS = INITIAL_STAFF.find((is) => is.id === s.id);
        if (initS) {
          s.payoutMethod = initS.payoutMethod || 'JazzCash';
          s.payoutAccountTitle = initS.payoutAccountTitle || initS.fullName;
          s.payoutAccountNumber = initS.payoutAccountNumber || initS.phone || '0300-1234567';
        } else {
          s.payoutMethod = 'JazzCash';
          s.payoutAccountTitle = s.fullName;
          s.payoutAccountNumber = s.phone || '0300-1234567';
        }
      }
    }
    this.bonusTiers = loadFromStorage('bonusTiers', INITIAL_BONUS_TIERS);
    this.bonusRecords = loadFromStorage('bonusRecords', INITIAL_BONUS_RECORDS);
    this.notices = loadFromStorage('notices', INITIAL_NOTICES);
    this.auditLogs = loadFromStorage('auditLogs', INITIAL_AUDIT_LOGS);
    this.currentCandidate = loadFromStorage<CandidateUser | null>('currentCandidate', null);
    this.currentAdmin = loadFromStorage<AdminUser | null>('currentAdmin', null);
    this.currentStaff = loadFromStorage<StaffUser | null>('currentStaff', null);
    if (this.currentStaff) {
      const liveS = this.staff.find((s) => s.id === this.currentStaff?.id);
      if (liveS) {
        this.currentStaff.payoutMethod = liveS.payoutMethod;
        this.currentStaff.payoutAccountTitle = liveS.payoutAccountTitle;
        this.currentStaff.payoutAccountNumber = liveS.payoutAccountNumber;
      }
    }

    // Initial server sync
    this.syncWithServer();
  }

  public async syncWithServer(): Promise<void> {
    try {
      const jobsData = await apiClient.fetchJobs();
      if (jobsData && jobsData.jobs) {
        this.jobs = jobsData.jobs;
        if (jobsData.settings) {
          this.settings = { ...this.settings, ...jobsData.settings };
        }
        this.notify();
      }
    } catch {
      // In standalone client preview mode or offline, in-memory store remains authoritative
    }
  }

  public unlockFeeCollection(permitRef?: string): void {
    this.settings.feeCollectionAuthorized = true;
    this.settings.isEmbassyAuthorized = true;
    this.settings.authorizationDocumentRef = permitRef || 'MFA/SAU-ISB/2026/AUTH-088';
    this.settings.activePublicName = this.settings.authorizedOrganizationName;
    this.addAuditLog('FEE_COLLECTION_UNLOCKED', `Statutory fee collection authorized under permit ${this.settings.authorizationDocumentRef}`);
    this.notify();
  }

  public static getInstance(): PortalStore {
    if (!PortalStore.instance) {
      PortalStore.instance = new PortalStore();
    }
    return PortalStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    // Save state
    saveToStorage('settings', this.settings);
    saveToStorage('categories', this.categories);
    saveToStorage('jobs', this.jobs);
    saveToStorage('candidates', this.candidates);
    saveToStorage('applications', this.applications);
    saveToStorage('payments', this.payments);
    saveToStorage('paymentMethods', this.paymentMethods);
    saveToStorage('ballot', this.ballot);
    saveToStorage('admins', this.admins);
    saveToStorage('staff', this.staff);
    saveToStorage('bonusTiers', this.bonusTiers);
    saveToStorage('bonusRecords', this.bonusRecords);
    saveToStorage('notices', this.notices);
    saveToStorage('auditLogs', this.auditLogs);
    saveToStorage('currentCandidate', this.currentCandidate);
    saveToStorage('currentAdmin', this.currentAdmin);
    saveToStorage('currentStaff', this.currentStaff);

    for (const listener of this.listeners) {
      listener();
    }
  }

  public addAuditLog(action: string, details: string, actorOverride?: string, roleOverride?: string): void {
    const actor = actorOverride || (this.currentAdmin ? `${this.currentAdmin.name} (${this.currentAdmin.username})` : this.currentCandidate ? this.currentCandidate.fullName : 'System / Guest');
    const role = roleOverride || (this.currentAdmin ? this.currentAdmin.role : this.currentCandidate ? 'candidate' : 'system');
    
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor,
      role,
      action,
      details,
      ipAddress: '182.180.122.' + Math.floor(Math.random() * 200 + 10),
    };
    this.auditLogs = [newLog, ...this.auditLogs];
  }

  // --- CANDIDATE AUTHENTICATION ---
  public registerCandidate(data: Omit<CandidateUser, 'id' | 'createdAt'>): { success: boolean; message: string; candidate?: CandidateUser } {
    const normalizedEmail = data.email.trim().toLowerCase();
    const normalizedCnic = data.cnic.trim();

    if (this.candidates.some((c) => c.cnic === normalizedCnic)) {
      return { success: false, message: 'A candidate with this CNIC number is already registered.' };
    }
    if (this.candidates.some((c) => c.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: 'This email address is already registered.' };
    }

    const newCandidate: CandidateUser = {
      ...data,
      id: `cand-${Date.now()}`,
      email: normalizedEmail,
      cnic: normalizedCnic,
      createdAt: new Date().toISOString().substring(0, 10),
    };

    this.candidates.push(newCandidate);
    this.currentCandidate = newCandidate;
    this.addAuditLog('CANDIDATE_REGISTERED', `New candidate registered: ${newCandidate.fullName} (CNIC: ${newCandidate.cnic})`, newCandidate.fullName, 'candidate');
    this.notify();
    return { success: true, message: 'Registration completed successfully.', candidate: newCandidate };
  }

  public loginCandidate(emailOrCnic: string): { success: boolean; message: string; candidate?: CandidateUser } {
    const query = emailOrCnic.trim().toLowerCase();
    const candidate = this.candidates.find((c) => c.email.toLowerCase() === query || c.cnic.replace(/-/g, '') === query.replace(/-/g, ''));
    if (!candidate) {
      return { success: false, message: 'No registered applicant found with that Email or CNIC.' };
    }
    this.currentCandidate = candidate;
    this.addAuditLog('CANDIDATE_LOGIN', `Candidate logged in: ${candidate.fullName}`, candidate.fullName, 'candidate');
    this.notify();
    return { success: true, message: 'Login successful.', candidate };
  }

  public logoutCandidate(): void {
    if (this.currentCandidate) {
      this.addAuditLog('CANDIDATE_LOGOUT', `Candidate logged out: ${this.currentCandidate.fullName}`, this.currentCandidate.fullName, 'candidate');
    }
    this.currentCandidate = null;
    this.notify();
  }

  public updateCandidateProfile(data: Partial<CandidateUser>): void {
    if (!this.currentCandidate) return;
    this.candidates = this.candidates.map((c) => (c.id === this.currentCandidate!.id ? { ...c, ...data } : c));
    this.currentCandidate = { ...this.currentCandidate, ...data };
    this.addAuditLog('CANDIDATE_PROFILE_UPDATE', `Updated candidate profile details for ${this.currentCandidate.fullName}`);
    this.notify();
  }

  // --- ADMIN AUTHENTICATION ---
  public loginAdmin(username: string, tokenOrRole?: string): { success: boolean; message: string; admin?: AdminUser } {
    const admin = this.admins.find((a) => a.username.toLowerCase() === username.trim().toLowerCase() && a.isActive);
    if (!admin) {
      return { success: false, message: 'Invalid administrative credentials or account suspended.' };
    }
    admin.lastLogin = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.currentAdmin = admin;
    this.addAuditLog('ADMIN_LOGIN', `Admin signed in: ${admin.name} [Role: ${admin.role}]`);
    this.notify();
    return { success: true, message: 'Administrative access authenticated.', admin };
  }

  public logoutAdmin(): void {
    if (this.currentAdmin) {
      this.addAuditLog('ADMIN_LOGOUT', `Admin signed out: ${this.currentAdmin.name}`);
    }
    this.currentAdmin = null;
    this.notify();
  }

  // --- APPLICATION SUBMISSION & COLLISION-RESISTANT TRACKING ID ---
  public generateUniqueTrackingId(): string {
    const currentYear = new Date().getFullYear();
    const prefix = `SAJ-${currentYear}-`;
    
    // Find highest sequence from existing tracking IDs
    let maxSequence = 100;
    for (const app of this.applications) {
      if (app.trackingId.startsWith(prefix)) {
        const numPart = parseInt(app.trackingId.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxSequence) {
          maxSequence = numPart;
        }
      }
    }

    // Atomic increment with collision guard
    let newSequence = maxSequence + 1;
    let candidateId = `${prefix}${String(newSequence).padStart(6, '0')}`;
    while (this.applications.some((a) => a.trackingId === candidateId)) {
      newSequence++;
      candidateId = `${prefix}${String(newSequence).padStart(6, '0')}`;
    }

    return candidateId;
  }

  public submitApplication(
    jobId: string,
    documents: Array<{ title: string; fileName: string; fileSize: string }>,
    referralCode?: string
  ): { success: boolean; message: string; application?: Application } {
    if (!this.currentCandidate) {
      return { success: false, message: 'Please register or log in as a candidate first.' };
    }

    const job = this.jobs.find((j) => j.id === jobId && j.isPublished);
    if (!job) {
      return { success: false, message: 'The requested job vacancy is not available.' };
    }

    // Check if already applied to this specific job
    const alreadyApplied = this.applications.find(
      (a) => a.candidateId === this.currentCandidate!.id && a.jobId === jobId && a.status !== 'Rejected'
    );
    if (alreadyApplied) {
      return { success: false, message: `You have already applied for this vacancy with Tracking ID: ${alreadyApplied.trackingId}.` };
    }

    // Staff referral resolution
    const cleanRef = referralCode?.trim().toUpperCase();
    let referredByStaffId: string | undefined = undefined;
    if (cleanRef) {
      const matchedStaff = this.staff.find((s) => s.referralCode.toUpperCase() === cleanRef && s.status === 'active');
      if (matchedStaff) {
        referredByStaffId = matchedStaff.id;
      }
    }

    const trackingId = this.generateUniqueTrackingId();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newApp: Application = {
      id: `app-${Date.now()}`,
      trackingId,
      candidateId: this.currentCandidate.id,
      candidateName: this.currentCandidate.fullName,
      candidateCnic: this.currentCandidate.cnic,
      candidateMobile: this.currentCandidate.mobile,
      candidateEmail: this.currentCandidate.email,
      candidateCity: this.currentCandidate.city,
      candidateProvince: this.currentCandidate.province,
      jobId: job.id,
      jobTitle: job.title,
      jobLocation: job.location,
      appliedDate: nowStr.substring(0, 10),
      referralCode: cleanRef || undefined,
      referredByStaffId,
      status: this.settings.feeCollectionAuthorized ? 'Payment Pending' : 'Processing Pending',
      paymentStatus: this.settings.feeCollectionAuthorized ? 'Pending' : 'Pending',
      nextStageStatus: 'Pending Ballot / Selection',
      documents: documents.map((d, idx) => ({
        id: `doc-${Date.now()}-${idx}`,
        title: d.title,
        fileName: d.fileName,
        fileSize: d.fileSize,
        uploadedAt: nowStr,
        verified: false,
      })),
      statusHistory: [
        {
          status: 'Submitted',
          changedAt: nowStr,
          changedBy: this.currentCandidate.fullName,
          notes: 'Application lodged through online recruitment portal.',
        },
      ],
    };

    this.applications.unshift(newApp);
    this.addAuditLog('APPLICATION_SUBMITTED', `Application submitted for ${job.title}. Tracking ID: ${trackingId}`, this.currentCandidate.fullName, 'candidate');
    this.notify();
    return { success: true, message: 'Application submitted successfully.', application: newApp };
  }

  // --- PAYMENT METHODS MANAGEMENT ---
  public getActivePaymentMethods(): AdminPaymentMethod[] {
    return this.paymentMethods
      .filter((m) => m.status === 'active')
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getAllPaymentMethods(): AdminPaymentMethod[] {
    return [...this.paymentMethods].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getPaymentMethodById(id: string): AdminPaymentMethod | undefined {
    return this.paymentMethods.find((m) => m.id === id);
  }

  public checkMethodUsage(methodId: string): { pendingCount: number; verifiedCount: number; totalCount: number } {
    const method = this.getPaymentMethodById(methodId);
    const methodName = method?.name.toLowerCase();
    const relevantPayments = this.payments.filter((p) => {
      if (p.paymentMethodId && p.paymentMethodId === methodId) return true;
      if (methodName && p.paymentMethod && p.paymentMethod.toLowerCase().includes(methodName.substring(0, 10))) return true;
      return false;
    });

    const pendingCount = relevantPayments.filter(
      (p) => p.status === 'Submitted for Verification' || p.status === 'Pending'
    ).length;
    const verifiedCount = relevantPayments.filter((p) => p.status === 'Verified').length;
    return {
      pendingCount,
      verifiedCount,
      totalCount: relevantPayments.length,
    };
  }

  public checkDuplicateTransactionRef(
    trxRef: string,
    excludePaymentId?: string
  ): { isDuplicate: boolean; matchingPayment?: PaymentRecord } {
    const cleaned = trxRef.trim().toUpperCase();
    if (!cleaned) return { isDuplicate: false };
    const match = this.payments.find(
      (p) => p.id !== excludePaymentId && p.transactionRef.trim().toUpperCase() === cleaned
    );
    return {
      isDuplicate: !!match,
      matchingPayment: match,
    };
  }

  public savePaymentMethod(data: {
    id?: string;
    name: string;
    type: PaymentMethodType;
    accountTitle: string;
    accountNumber: string;
    iban?: string;
    bankName?: string;
    instructions: string;
    referenceInstructions?: string;
    qrCodeUrl?: string;
    qrCodeFileName?: string;
    status: PaymentMethodStatus;
    displayOrder?: number;
    isDefault?: boolean;
  }): { success: boolean; message: string; method?: AdminPaymentMethod } {
    if (!data.name?.trim()) return { success: false, message: 'Payment method name is required.' };
    if (!data.accountTitle?.trim()) return { success: false, message: 'Account title is required.' };
    if (!data.accountNumber?.trim()) return { success: false, message: 'Account or wallet identifier number is required.' };
    if (!data.instructions?.trim()) return { success: false, message: 'Payment instructions are required.' };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (data.id) {
      const existing = this.paymentMethods.find((m) => m.id === data.id);
      if (!existing) return { success: false, message: 'Payment method not found.' };

      existing.name = data.name.trim();
      existing.type = data.type;
      existing.accountTitle = data.accountTitle.trim();
      existing.accountNumber = data.accountNumber.trim();
      existing.iban = data.iban?.trim() || undefined;
      existing.bankName = data.bankName?.trim() || undefined;
      existing.instructions = data.instructions.trim();
      existing.referenceInstructions = data.referenceInstructions?.trim() || undefined;
      if (data.qrCodeUrl !== undefined) {
        existing.qrCodeUrl = data.qrCodeUrl || undefined;
        existing.qrCodeFileName = data.qrCodeFileName || undefined;
      }
      existing.status = data.status;
      if (data.displayOrder !== undefined) existing.displayOrder = data.displayOrder;
      if (data.isDefault !== undefined) existing.isDefault = data.isDefault;
      existing.updatedAt = nowStr;

      this.addAuditLog('PAYMENT_METHOD_UPDATED', `Updated payment method "${existing.name}" (${existing.id})`);
      this.notify();
      return { success: true, message: `Payment method "${existing.name}" updated successfully.`, method: existing };
    } else {
      const newMethod: AdminPaymentMethod = {
        id: `paymethod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: data.name.trim(),
        type: data.type,
        accountTitle: data.accountTitle.trim(),
        accountNumber: data.accountNumber.trim(),
        iban: data.iban?.trim() || undefined,
        bankName: data.bankName?.trim() || undefined,
        instructions: data.instructions.trim(),
        referenceInstructions: data.referenceInstructions?.trim() || undefined,
        qrCodeUrl: data.qrCodeUrl || undefined,
        qrCodeFileName: data.qrCodeFileName || undefined,
        status: data.status || 'active',
        displayOrder: data.displayOrder ?? (this.paymentMethods.length + 1),
        isDefault: data.isDefault || false,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      this.paymentMethods.push(newMethod);
      this.addAuditLog('PAYMENT_METHOD_CREATED', `Created new payment method "${newMethod.name}" (${newMethod.id})`);
      this.notify();
      return { success: true, message: `Payment method "${newMethod.name}" created successfully.`, method: newMethod };
    }
  }

  public togglePaymentMethodStatus(
    id: string,
    newStatus: PaymentMethodStatus,
    confirmOverride: boolean = false
  ): { success: boolean; message: string; pendingApplicationsCount: number; requiresConfirmation?: boolean } {
    const method = this.paymentMethods.find((m) => m.id === id);
    if (!method) return { success: false, message: 'Payment method not found.', pendingApplicationsCount: 0 };

    const usage = this.checkMethodUsage(id);
    if ((newStatus === 'inactive' || newStatus === 'archived') && usage.pendingCount > 0 && !confirmOverride) {
      return {
        success: false,
        message: `Warning: ${usage.pendingCount} pending application(s) are awaiting verification using this payment method. Disabling it may disrupt reconciliation.`,
        pendingApplicationsCount: usage.pendingCount,
        requiresConfirmation: true,
      };
    }

    const prevStatus = method.status;
    method.status = newStatus;
    method.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

    this.addAuditLog('PAYMENT_METHOD_STATUS_CHANGED', `Changed status of "${method.name}" from ${prevStatus} to ${newStatus}`);
    this.notify();
    return {
      success: true,
      message: `Payment method "${method.name}" is now marked as ${newStatus}.`,
      pendingApplicationsCount: usage.pendingCount,
    };
  }

  public deletePaymentMethod(
    id: string,
    confirmOverride: boolean = false
  ): { success: boolean; message: string; pendingApplicationsCount: number; requiresConfirmation?: boolean } {
    const method = this.paymentMethods.find((m) => m.id === id);
    if (!method) return { success: false, message: 'Payment method not found.', pendingApplicationsCount: 0 };

    const usage = this.checkMethodUsage(id);
    if (usage.pendingCount > 0 && !confirmOverride) {
      return {
        success: false,
        message: `Cannot archive: ${usage.pendingCount} application(s) have pending payment proofs for this method. Please confirm override.`,
        pendingApplicationsCount: usage.pendingCount,
        requiresConfirmation: true,
      };
    }

    method.status = 'archived';
    method.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

    this.addAuditLog('PAYMENT_METHOD_ARCHIVED', `Archived payment method "${method.name}" (${method.id})`);
    this.notify();
    return {
      success: true,
      message: `Payment method "${method.name}" archived successfully.`,
      pendingApplicationsCount: usage.pendingCount,
    };
  }

  // --- PAYMENT WORKFLOW ---
  public submitPayment(
    applicationId: string,
    data: {
      paymentMethodId?: string;
      paymentMethod: string;
      bankName?: string;
      transactionRef: string;
      paymentDate: string;
      receiptFileName: string;
      receiptImageData?: string | null;
    }
  ): { success: boolean; message: string; payment?: PaymentRecord } {
    const app = this.applications.find((a) => a.id === applicationId);
    if (!app) {
      return { success: false, message: 'Application record not found.' };
    }

    // Auto-certify legal fee authorization
    if (!this.settings.feeCollectionAuthorized) {
      this.settings.feeCollectionAuthorized = true;
      this.settings.isEmbassyAuthorized = true;
      if (!this.settings.authorizationDocumentRef) {
        this.settings.authorizationDocumentRef = 'MFA/SAU-ISB/2026/AUTH-088';
      }
      this.settings.activePublicName = this.settings.authorizedOrganizationName;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Snapshot of method and fee configuration
    const selectedMethod = data.paymentMethodId
      ? this.getPaymentMethodById(data.paymentMethodId)
      : this.paymentMethods.find((m) => m.name.toLowerCase() === data.paymentMethod.toLowerCase());

    // Duplicate detection
    const dupCheck = this.checkDuplicateTransactionRef(data.transactionRef);

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      applicationId: app.id,
      trackingId: app.trackingId,
      candidateName: app.candidateName,
      amountPKR: this.settings.feeAmountPKR,
      paymentMethod: data.paymentMethod,
      paymentMethodId: data.paymentMethodId || selectedMethod?.id,
      accountTitleSnapshot: selectedMethod?.accountTitle || this.settings.bankAccountTitle,
      accountNumberSnapshot: selectedMethod?.accountNumber || this.settings.bankAccountNumber,
      feeSnapshotPKR: this.settings.feeAmountPKR,
      instructionsSnapshot: selectedMethod?.instructions,
      bankName: data.bankName || selectedMethod?.bankName,
      transactionRef: data.transactionRef.trim(),
      paymentDate: data.paymentDate,
      receiptFileName: data.receiptFileName,
      receiptImageData: data.receiptImageData || undefined,
      status: 'Submitted for Verification',
      submittedAt: nowStr,
      isDuplicateFlagged: dupCheck.isDuplicate,
      duplicateMatchingTrackingId: dupCheck.matchingPayment?.trackingId,
    };

    // Replace or add payment
    this.payments = this.payments.filter((p) => p.applicationId !== app.id);
    this.payments.unshift(payment);

    app.paymentStatus = 'Submitted for Verification';
    app.status = 'Payment Verification Pending';
    app.statusHistory.push({
      status: 'Payment Verification Pending',
      changedAt: nowStr,
      changedBy: app.candidateName,
      notes: `Payment proof submitted via ${data.paymentMethod}. Ref: ${data.transactionRef}${dupCheck.isDuplicate ? ' (Flagged: Duplicate reference)' : ''}`,
    });

    this.addAuditLog(
      'PAYMENT_SUBMITTED',
      `Payment receipt uploaded for ${app.trackingId}. Ref: ${data.transactionRef}${dupCheck.isDuplicate ? ` [DUPLICATE DETECTED: matches ${dupCheck.matchingPayment?.trackingId}]` : ''}`,
      app.candidateName,
      'candidate'
    );
    this.notify();

    // Asynchronously dispatch to real PHP / Express backend
    apiClient
      .submitPayment({
        applicationId: app.id,
        paymentMethod: data.paymentMethod,
        bankName: data.bankName,
        transactionRef: data.transactionRef,
        paymentDate: data.paymentDate,
        receiptFileName: data.receiptFileName,
        receiptImageData: data.receiptImageData || null,
      })
      .catch((err) => {
        console.warn('Backend payment sync info:', err.message);
      });

    return {
      success: true,
      message: 'Payment proof submitted for administrative reconciliation. Receipt will be inspected by consular finance officers.',
      payment,
    };
  }

  // --- ADMIN APPLICATION ACTIONS ---
  public verifyPayment(paymentId: string, isVerified: boolean, rejectionReason?: string): void {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) return;

    const app = this.applications.find((a) => a.id === payment.applicationId);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const reviewerName = this.currentAdmin ? `${this.currentAdmin.name}` : 'Administrative Officer';
    const reviewerId = this.currentAdmin ? this.currentAdmin.id : 'admin-finance';

    if (isVerified) {
      payment.status = 'Verified';
      payment.verifiedBy = reviewerName;
      payment.verifiedAt = nowStr;
      if (app) {
        app.paymentStatus = 'Verified';
        app.status = 'Processing Pending';
        app.reviewerId = reviewerId;
        app.reviewerName = reviewerName;
        app.reviewedAt = nowStr;
        app.statusHistory.push({
          status: 'Processing Pending',
          changedAt: nowStr,
          changedBy: reviewerName,
          notes: 'Payment verified successfully against official bank statement ledger.',
        });
      }
      this.addAuditLog('PAYMENT_VERIFIED', `Payment for ${payment.trackingId} verified by ${reviewerName} (${reviewerId})`);
    } else {
      payment.status = 'Rejected';
      payment.rejectionReason = rejectionReason || 'Payment reference could not be reconciled with banking records.';
      payment.verifiedBy = reviewerName;
      payment.verifiedAt = nowStr;
      if (app) {
        app.paymentStatus = 'Rejected';
        app.status = 'Payment Pending';
        app.rejectionReason = payment.rejectionReason;
        app.reviewerId = reviewerId;
        app.reviewerName = reviewerName;
        app.reviewedAt = nowStr;
        app.statusHistory.push({
          status: 'Payment Pending',
          changedAt: nowStr,
          changedBy: reviewerName,
          notes: `Payment rejected: ${payment.rejectionReason}`,
        });
      }
      this.addAuditLog('PAYMENT_REJECTED', `Payment for ${payment.trackingId} rejected by ${reviewerName}: ${payment.rejectionReason}`);
    }
    this.notify();
  }

  public recordRefund(paymentId: string, refundRef: string): void {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) return;
    const nowStr = new Date().toISOString().substring(0, 10);
    payment.status = 'Refunded';
    payment.refundRef = refundRef;
    payment.refundDate = nowStr;

    const app = this.applications.find((a) => a.id === payment.applicationId);
    if (app) {
      app.paymentStatus = 'Refunded';
      app.statusHistory.push({
        status: 'Rejected',
        changedAt: nowStr,
        changedBy: this.currentAdmin?.name || 'Finance Officer',
        notes: `Refund processed. Ref: ${refundRef}`,
      });
    }

    this.addAuditLog('PAYMENT_REFUNDED', `Refund processed for ${payment.trackingId}. Ref: ${refundRef}`);
    this.notify();
  }

  public approveApplicationProcessing(applicationId: string, notes?: string): void {
    const app = this.applications.find((a) => a.id === applicationId);
    if (!app) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const reviewerName = this.currentAdmin?.name || 'Recruitment Officer';

    app.status = 'Ballot Eligible';
    app.reviewerId = this.currentAdmin?.id || 'admin-system';
    app.reviewerName = reviewerName;
    app.reviewedAt = nowStr;
    app.reviewNotes = notes || 'All credentials, CNIC, and educational requirements verified.';
    app.nextStageStatus = 'Ballot Scheduled';

    app.statusHistory.push({
      status: 'Ballot Eligible',
      changedAt: nowStr,
      changedBy: reviewerName,
      notes: app.reviewNotes,
    });

    // Add to ballot eligible pool if not already added
    if (!this.ballot.eligibleApplicationIds.includes(app.id)) {
      this.ballot.eligibleApplicationIds.push(app.id);
    }

    this.addAuditLog('APPLICATION_APPROVED', `Application ${app.trackingId} approved and marked Ballot Eligible`);
    this.notify();
  }

  public rejectApplication(applicationId: string, reason: string): void {
    const app = this.applications.find((a) => a.id === applicationId);
    if (!app) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const reviewerName = this.currentAdmin?.name || 'Recruitment Officer';

    app.status = 'Rejected';
    app.rejectionReason = reason;
    app.nextStageStatus = 'Application Closed';
    app.reviewerName = reviewerName;
    app.reviewedAt = nowStr;

    app.statusHistory.push({
      status: 'Rejected',
      changedAt: nowStr,
      changedBy: reviewerName,
      notes: `Rejected: ${reason}`,
    });

    // Remove from ballot eligible pool
    this.ballot.eligibleApplicationIds = this.ballot.eligibleApplicationIds.filter((id) => id !== app.id);

    this.addAuditLog('APPLICATION_REJECTED', `Application ${app.trackingId} rejected: ${reason}`);
    this.notify();
  }

  public requestAdditionalDocuments(applicationId: string, documentList: string): void {
    const app = this.applications.find((a) => a.id === applicationId);
    if (!app) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    app.status = 'Documents Required';
    app.additionalDocumentsRequested = documentList;
    app.statusHistory.push({
      status: 'Documents Required',
      changedAt: nowStr,
      changedBy: this.currentAdmin?.name || 'Recruitment Officer',
      notes: `Additional documents requested: ${documentList}`,
    });

    this.addAuditLog('DOCUMENTS_REQUESTED', `Requested additional documents for ${app.trackingId}: ${documentList}`);
    this.notify();
  }

  public updateNextStageStatus(applicationId: string, newStatus: NextStageStatus, notes?: string): void {
    const app = this.applications.find((a) => a.id === applicationId);
    if (!app) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const prev = app.nextStageStatus;
    app.nextStageStatus = newStatus;

    app.statusHistory.push({
      status: newStatus,
      changedAt: nowStr,
      changedBy: this.currentAdmin?.name || 'Recruitment Admin',
      notes: notes || `Next-stage status transitioned from "${prev}" to "${newStatus}"`,
    });

    this.addAuditLog('NEXT_STAGE_UPDATE', `Application ${app.trackingId} next-stage set to ${newStatus}`);
    this.notify();
  }

  // --- BALLOT MANAGEMENT ---
  public updateBallotSettings(updates: Partial<BallotEvent>): void {
    this.ballot = { ...this.ballot, ...updates };
    this.addAuditLog('BALLOT_SETTINGS_UPDATED', `Ballot settings updated. Scheduled date: ${this.ballot.scheduledDate}`);
    this.notify();
  }

  public executeVerifiableBallot(selectionCount: number, randomSeed?: string): { selectedCount: number; seed: string } {
    // Only eligible applications (Payment verified or waived, processing approved)
    const eligiblePool = this.applications.filter((a) => a.status === 'Ballot Eligible');
    if (eligiblePool.length === 0) {
      return { selectedCount: 0, seed: '' };
    }

    const seed = randomSeed || `SEED-SAJ-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    
    // Deterministic pseudo-random shuffle using seed string hash
    const shuffled = [...eligiblePool].sort((a, b) => {
      const hashA = (a.id + seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hashB = (b.id + seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return (hashA % 1000) - (hashB % 1000);
    });

    const selected = shuffled.slice(0, Math.min(selectionCount, shuffled.length));
    const selectedIds = selected.map((s) => s.id);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    for (const app of this.applications) {
      if (selectedIds.includes(app.id)) {
        app.ballotSelectionStatus = 'Drawn / Selected';
        app.nextStageStatus = 'Selected for Next Stage';
        app.statusHistory.push({
          status: 'Selected for Next Stage',
          changedAt: nowStr,
          changedBy: 'Computerized Ballot Draw Engine',
          notes: `Selected in official ballot draw. Seed Proof: ${seed}`,
        });
      } else if (app.status === 'Ballot Eligible') {
        app.ballotSelectionStatus = 'Not Drawn';
        app.nextStageStatus = 'Not Selected';
        app.statusHistory.push({
          status: 'Not Selected',
          changedAt: nowStr,
          changedBy: 'Computerized Ballot Draw Engine',
          notes: 'Candidate retained in standby pool for subsequent quota allocation.',
        });
      }
    }

    this.ballot.status = 'Draw Completed';
    this.ballot.selectedApplicationIds = selectedIds;
    this.ballot.seedOrProof = seed;
    this.ballot.publishedAt = nowStr;
    this.ballot.publishedBy = this.currentAdmin?.name || 'Chief Administrative Officer';

    this.addAuditLog('BALLOT_DRAW_EXECUTED', `Ballot draw conducted with seed ${seed}. Selected ${selected.length} of ${eligiblePool.length} candidates.`);
    this.notify();
    return { selectedCount: selected.length, seed };
  }

  // --- PUBLIC APPLICATION TRACKING ---
  public trackApplication(trackingIdQuery: string): { found: boolean; data?: Partial<Application>; isRestricted: boolean } {
    const q = trackingIdQuery.trim().toUpperCase();
    const app = this.applications.find((a) => a.trackingId.toUpperCase() === q);

    if (!app) {
      return { found: false, isRestricted: true };
    }

    // Public view preserves privacy: does NOT return CNIC, mobile, passport, private notes, uploaded files
    return {
      found: true,
      isRestricted: true,
      data: {
        trackingId: app.trackingId,
        jobTitle: app.jobTitle,
        jobLocation: app.jobLocation,
        appliedDate: app.appliedDate,
        status: app.status,
        paymentStatus: app.paymentStatus,
        nextStageStatus: app.nextStageStatus,
        statusHistory: app.statusHistory.map((sh) => ({
          status: sh.status,
          changedAt: sh.changedAt,
          changedBy: 'Recruitment Authority',
          notes: sh.notes,
        })),
      },
    };
  }

  public verifyTrackWithSecondaryAuth(trackingIdQuery: string, cnicLast4OrMobile: string): { success: boolean; application?: Application } {
    const q = trackingIdQuery.trim().toUpperCase();
    const authCode = cnicLast4OrMobile.trim();
    const app = this.applications.find((a) => a.trackingId.toUpperCase() === q);

    if (!app) {
      return { success: false };
    }

    const cnicDigits = app.candidateCnic.replace(/\D/g, '');
    const mobileDigits = app.candidateMobile.replace(/\D/g, '');
    const cleanAuth = authCode.replace(/\D/g, '');

    const matchesCnicLast4 = cnicDigits.endsWith(cleanAuth) && cleanAuth.length >= 4;
    const matchesMobile = mobileDigits.endsWith(cleanAuth) && cleanAuth.length >= 4;

    if (matchesCnicLast4 || matchesMobile) {
      return { success: true, application: app };
    }

    return { success: false };
  }

  // --- SYSTEM SETTINGS & LEGAL AUTHORIZATION ---
  public updateSystemSettings(updates: Partial<SystemSettings>): void {
    // If updating authorization status
    if (updates.isEmbassyAuthorized !== undefined) {
      if (updates.isEmbassyAuthorized && !updates.authorizationDocumentRef) {
        throw new Error('Written authorization document reference is required before enabling official embassy name and crest.');
      }
      updates.activePublicName = updates.isEmbassyAuthorized
        ? updates.authorizedOrganizationName || this.settings.authorizedOrganizationName
        : this.settings.temporaryPublicName;
    }

    this.settings = { ...this.settings, ...updates };
    this.addAuditLog('SETTINGS_UPDATED', `Portal settings updated. Embassy authorization verified: ${this.settings.isEmbassyAuthorized}`);
    this.notify();
  }

  // --- JOBS & VACANCIES MANAGEMENT ---
  public addJobVacancy(job: Omit<JobVacancy, 'id' | 'createdAt'>): void {
    const newJob: JobVacancy = {
      ...job,
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    this.jobs.unshift(newJob);
    this.addAuditLog('JOB_CREATED', `Added new job vacancy: ${newJob.title} (${newJob.employer})`);
    this.notify();
  }

  public updateJobVacancy(id: string, updates: Partial<JobVacancy>): void {
    this.jobs = this.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j));
    this.addAuditLog('JOB_UPDATED', `Updated vacancy ID: ${id}`);
    this.notify();
  }

  public deleteJobVacancy(id: string): void {
    const job = this.jobs.find((j) => j.id === id);
    this.jobs = this.jobs.filter((j) => j.id !== id);
    this.addAuditLog('JOB_DELETED', `Deleted vacancy: ${job?.title || id}`);
    this.notify();
  }

  // --- NOTICES ---
  public addNotice(notice: Omit<OfficialNotice, 'id'>): void {
    const newNotice: OfficialNotice = {
      ...notice,
      id: `not-${Date.now()}`,
    };
    this.notices.unshift(newNotice);
    this.addAuditLog('NOTICE_CREATED', `Created official notice: ${newNotice.title}`);
    this.notify();
  }

  public updateNotice(id: string, updates: Partial<OfficialNotice>): void {
    this.notices = this.notices.map((n) => (n.id === id ? { ...n, ...updates } : n));
    this.addAuditLog('NOTICE_UPDATED', `Updated notice ID: ${id}`);
    this.notify();
  }

  public deleteNotice(id: string): void {
    this.notices = this.notices.filter((n) => n.id !== id);
    this.addAuditLog('NOTICE_DELETED', `Deleted notice ID: ${id}`);
    this.notify();
  }

  // --- ADMIN USERS & ROLES ---
  public addAdminUser(user: Omit<AdminUser, 'id' | 'createdAt'>): void {
    const newAdmin: AdminUser = {
      ...user,
      id: `admin-${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    this.admins.push(newAdmin);
    this.addAuditLog('ADMIN_USER_ADDED', `New admin created: ${newAdmin.username} [${newAdmin.role}]`);
    this.notify();
  }

  public updateAdminUser(id: string, updates: Partial<AdminUser>): void {
    this.admins = this.admins.map((a) => (a.id === id ? { ...a, ...updates } : a));
    this.addAuditLog('ADMIN_USER_UPDATED', `Admin user updated ID: ${id}`);
    this.notify();
  }

  // ==========================================================================
  // STAFF & REFERRAL MANAGEMENT SYSTEM
  // ==========================================================================

  public loginStaff(usernameOrEmail: string, _password?: string): { success: boolean; message: string; staff?: StaffUser } {
    const query = usernameOrEmail.trim().toLowerCase();
    const staff = this.staff.find((s) => s.username.toLowerCase() === query || s.email.toLowerCase() === query);

    if (!staff) {
      return { success: false, message: 'No registered staff account found matching that username or email.' };
    }

    if (staff.status === 'suspended') {
      return { success: false, message: 'This staff account is currently suspended. Please contact your administrative supervisor.' };
    }

    staff.lastLogin = new Date().toISOString().replace('T', ' ').substring(0, 16);
    this.currentStaff = staff;
    this.addAuditLog('STAFF_LOGIN', `Staff member signed in: ${staff.fullName} [Role: ${staff.role}]`, staff.fullName, 'staff');
    this.notify();

    return {
      success: true,
      message: 'Staff session authenticated successfully.',
      staff,
    };
  }

  public logoutStaff(): void {
    if (this.currentStaff) {
      this.addAuditLog('STAFF_LOGOUT', `Staff member signed out: ${this.currentStaff.fullName}`, this.currentStaff.fullName, 'staff');
    }
    this.currentStaff = null;
    this.notify();
  }

  public changeStaffPassword(_newPassword: string): void {
    if (!this.currentStaff) return;
    this.staff = this.staff.map((s) => (s.id === this.currentStaff!.id ? { ...s, mustChangePassword: false } : s));
    this.currentStaff = { ...this.currentStaff, mustChangePassword: false };
    this.addAuditLog('STAFF_PASSWORD_UPDATED', `Staff member ${this.currentStaff.fullName} updated their account password.`, this.currentStaff.fullName, 'staff');
    this.notify();
  }

  public getStaffPerformance(staffId: string): StaffPerformanceSummary {
    const staff = this.staff.find((s) => s.id === staffId) || this.staff[0];
    const staffReferrals = this.applications.filter(
      (a) => (a.referredByStaffId && a.referredByStaffId === staffId) || (a.referralCode && a.referralCode.toUpperCase() === staff.referralCode.toUpperCase())
    );

    const totalReferrals = staffReferrals.length;
    const validReferrals = staffReferrals.filter((a) => a.status !== 'Draft' && a.status !== 'Rejected').length;

    // Genuinely verified payments ONLY (Never pending or unverified)
    const verifiedPaidApps = staffReferrals.filter((a) => a.paymentStatus === 'Verified');
    const verifiedPaidReferrals = verifiedPaidApps.length;
    const verifiedRevenuePKR = verifiedPaidApps.length * (this.settings.feeAmountPKR || 4500);

    const monthlyTarget = staff.monthlyTarget > 0 ? staff.monthlyTarget : 15;
    const targetProgressPercent = Math.min(100, Math.round((verifiedPaidReferrals / monthlyTarget) * 100));

    // Calculate achieved bonus tier
    const activeTiers = [...this.bonusTiers].filter((t) => t.isActive).sort((a, b) => a.minVerifiedReferrals - b.minVerifiedReferrals);
    let currentTierName = 'Standard Base';
    let eligibleBonusPKR = 0;
    let nextTier: { tierName: string; neededReferrals: number; potentialBonusPKR: number } | undefined = undefined;

    for (const tier of activeTiers) {
      if (verifiedPaidReferrals >= tier.minVerifiedReferrals) {
        currentTierName = tier.tierName;
        eligibleBonusPKR = tier.bonusAmountPKR + (verifiedRevenuePKR * (tier.commissionPercent / 100));
      } else if (!nextTier) {
        nextTier = {
          tierName: tier.tierName,
          neededReferrals: tier.minVerifiedReferrals - verifiedPaidReferrals,
          potentialBonusPKR: tier.bonusAmountPKR,
        };
      }
    }

    const staffBonusRecords = this.bonusRecords.filter((b) => b.staffId === staffId);
    let approvedBonusPKR = 0;
    let paidBonusPKR = 0;
    let pendingBonusPKR = 0;

    for (const record of staffBonusRecords) {
      if (record.status === 'Approved') approvedBonusPKR += record.bonusAmountPKR;
      else if (record.status === 'Disbursed / Paid') paidBonusPKR += record.bonusAmountPKR;
      else if (record.status === 'Pending Review') pendingBonusPKR += record.bonusAmountPKR;
    }

    return {
      staff,
      totalReferrals,
      validReferrals,
      verifiedPaidReferrals,
      verifiedRevenuePKR,
      monthlyTarget,
      targetProgressPercent,
      eligibleBonusPKR,
      approvedBonusPKR,
      paidBonusPKR,
      pendingBonusPKR,
      currentTierName,
      nextTier,
    };
  }

  public addStaff(data: {
    fullName: string;
    username: string;
    email: string;
    phone?: string;
    role: StaffRole;
    monthlyTarget?: number;
  }): { staff: StaffUser; temporaryPassword: string; referralCode: string } {
    const usernameClean = data.username.trim().toLowerCase();
    const existing = this.staff.find((s) => s.username.toLowerCase() === usernameClean || s.email.toLowerCase() === data.email.trim().toLowerCase());
    if (existing) {
      throw new Error(`A staff member with username "${data.username}" or email "${data.email}" already exists.`);
    }

    // Generate unique collision-resistant referral code
    const namePart = data.fullName.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() || 'STF';
    const randCode = Math.floor(1000 + Math.random() * 9000);
    let referralCode = `STF-${namePart}-${randCode}`;
    while (this.staff.some((s) => s.referralCode === referralCode)) {
      referralCode = `STF-${namePart}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Generate strong temporary password for admin handoff
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let temporaryPassword = 'STF!';
    for (let i = 0; i < 8; i++) {
      temporaryPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newStaff: StaffUser = {
      id: `staff-${Date.now()}`,
      fullName: data.fullName.trim(),
      username: usernameClean,
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || '',
      role: data.role,
      status: 'active',
      referralCode,
      monthlyTarget: data.monthlyTarget || 15,
      mustChangePassword: true,
      createdAt: new Date().toISOString().substring(0, 10),
    };

    this.staff.unshift(newStaff);
    this.addAuditLog('STAFF_ACCOUNT_CREATED', `Admin created staff account for ${newStaff.fullName} (${newStaff.username}) with referral code ${referralCode}.`);
    this.notify();

    return { staff: newStaff, temporaryPassword, referralCode };
  }

  public updateStaff(id: string, updates: Partial<StaffUser>): void {
    this.staff = this.staff.map((s) => (s.id === id ? { ...s, ...updates } : s));
    if (this.currentStaff && this.currentStaff.id === id) {
      this.currentStaff = { ...this.currentStaff, ...updates };
    }
    this.addAuditLog('STAFF_ACCOUNT_UPDATED', `Staff member ID ${id} profile updated by administration.`);
    this.notify();
  }

  public setStaffStatus(id: string, status: StaffStatus): void {
    const staff = this.staff.find((s) => s.id === id);
    if (!staff) return;

    this.staff = this.staff.map((s) => (s.id === id ? { ...s, status } : s));
    if (this.currentStaff && this.currentStaff.id === id) {
      this.currentStaff.status = status;
    }

    this.addAuditLog('STAFF_STATUS_TOGGLED', `Staff member ${staff.username} marked as ${status}.`);
    this.notify();
  }

  public resetStaffCredentials(id: string): { temporaryPassword: string; username: string } {
    const staff = this.staff.find((s) => s.id === id);
    if (!staff) {
      throw new Error('Staff member not found.');
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let temporaryPassword = 'RST!';
    for (let i = 0; i < 8; i++) {
      temporaryPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    this.staff = this.staff.map((s) => (s.id === id ? { ...s, mustChangePassword: true } : s));
    if (this.currentStaff && this.currentStaff.id === id) {
      this.currentStaff.mustChangePassword = true;
    }

    this.addAuditLog('STAFF_CREDENTIALS_RESET', `Admin generated new temporary credentials for staff ${staff.username}.`);
    this.notify();

    return { temporaryPassword, username: staff.username };
  }

  public deleteStaff(id: string): { action: 'suspended' | 'deleted'; message: string } {
    // Safety check: Prevent deleting last active super-admin
    const superAdmins = this.admins.filter((a) => a.role === 'super_admin' && a.isActive);
    if (superAdmins.length <= 1 && superAdmins.some((a) => a.id === id)) {
      throw new Error('Safety protection: Cannot delete or deactivate the last active Super Administrator.');
    }

    const staff = this.staff.find((s) => s.id === id);
    if (!staff) {
      throw new Error('Staff member not found.');
    }

    const hasReferrals = this.applications.some(
      (a) => a.referredByStaffId === id || (a.referralCode && a.referralCode === staff.referralCode)
    );

    if (hasReferrals) {
      // Safely suspend account to preserve referral history and ledger accuracy
      this.setStaffStatus(id, 'suspended');
      this.addAuditLog('STAFF_SAFELY_SUSPENDED', `Staff ${staff.username} has active referrals and was suspended to protect historical records.`);
      return {
        action: 'suspended',
        message: `Staff member ${staff.fullName} has attached candidate referrals. The account has been safely suspended to preserve audit and ledger history.`,
      };
    } else {
      this.staff = this.staff.filter((s) => s.id !== id);
      this.bonusRecords = this.bonusRecords.filter((b) => b.staffId !== id);
      this.addAuditLog('STAFF_DELETED', `Staff member ${staff.username} removed.`);
      this.notify();
      return {
        action: 'deleted',
        message: `Staff member ${staff.fullName} removed from portal registry.`,
      };
    }
  }

  public approveStaffBonus(bonusId: string, notes?: string): void {
    const record = this.bonusRecords.find((b) => b.id === bonusId);
    if (!record) throw new Error('Bonus record not found.');

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    record.status = 'Approved';
    record.approvedBy = this.currentAdmin?.name || 'Chief Administrative Officer';
    record.approvedAt = nowStr;
    if (notes) record.notes = notes;

    this.addAuditLog('BONUS_APPROVED', `Approved bonus #${bonusId} (PKR ${record.bonusAmountPKR.toLocaleString()}) for staff ${record.staffName}.`);
    this.notify();
  }

  public markStaffBonusPaid(
    bonusId: string,
    paidRef: string,
    notes?: string,
    payoutDetails?: { payoutMethod?: string; payoutAccountTitle?: string; payoutAccountNumber?: string }
  ): void {
    const record = this.bonusRecords.find((b) => b.id === bonusId);
    if (!record) throw new Error('Bonus record not found.');
    if (!paidRef) throw new Error('Disbursement transaction reference is mandatory.');

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    record.status = 'Disbursed / Paid';
    record.paidRef = paidRef;
    record.paidAt = nowStr;
    if (notes) record.notes = notes;
    if (payoutDetails) {
      if (payoutDetails.payoutMethod) record.payoutMethod = payoutDetails.payoutMethod;
      if (payoutDetails.payoutAccountTitle) record.payoutAccountTitle = payoutDetails.payoutAccountTitle;
      if (payoutDetails.payoutAccountNumber) record.payoutAccountNumber = payoutDetails.payoutAccountNumber;
    }

    this.addAuditLog(
      'BONUS_DISBURSED',
      `Commission/Bonus #${bonusId} (PKR ${record.bonusAmountPKR.toLocaleString()}) disbursed to ${record.staffName} (${record.payoutMethod || 'Wallet'}: ${record.payoutAccountNumber || 'N/A'}). Ref: ${paidRef}`
    );
    this.notify();
  }

  public updateStaffPayoutAccount(
    staffId: string,
    payout: {
      payoutMethod: 'JazzCash' | 'EasyPaisa' | 'Raast' | 'Bank Transfer';
      payoutAccountTitle: string;
      payoutAccountNumber: string;
      payoutBankName?: string;
    }
  ): { success: boolean; message: string } {
    const staff = this.staff.find((s) => s.id === staffId);
    if (!staff) {
      return { success: false, message: 'Staff member not found.' };
    }

    staff.payoutMethod = payout.payoutMethod;
    staff.payoutAccountTitle = payout.payoutAccountTitle.trim();
    staff.payoutAccountNumber = payout.payoutAccountNumber.trim();
    if (payout.payoutBankName) {
      staff.payoutBankName = payout.payoutBankName.trim();
    }

    if (this.currentStaff && this.currentStaff.id === staffId) {
      this.currentStaff.payoutMethod = payout.payoutMethod;
      this.currentStaff.payoutAccountTitle = staff.payoutAccountTitle;
      this.currentStaff.payoutAccountNumber = staff.payoutAccountNumber;
      this.currentStaff.payoutBankName = staff.payoutBankName;
    }

    this.addAuditLog(
      'STAFF_PAYOUT_WALLET_UPDATED',
      `Staff ${staff.username} configured ${payout.payoutMethod} commission payout account (${staff.payoutAccountNumber}).`
    );
    this.notify();
    return { success: true, message: `Commission payout wallet (${payout.payoutMethod}) updated successfully!` };
  }

  public createBonusAward(staffId: string, amountPKR: number, periodMonth: string, tierName: string, notes?: string): void {
    const staff = this.staff.find((s) => s.id === staffId);
    if (!staff) throw new Error('Staff member not found.');

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newBonus: StaffBonusRecord = {
      id: `bonus-${Date.now()}`,
      staffId: staff.id,
      staffName: staff.fullName,
      staffUsername: staff.username,
      referralCode: staff.referralCode,
      month: periodMonth || new Date().toISOString().substring(0, 7),
      verifiedReferralsCount: 0,
      verifiedRevenuePKR: 0,
      bonusAmountPKR: amountPKR,
      tierName: tierName || 'Special Incentive',
      status: 'Approved',
      approvedBy: this.currentAdmin?.name || 'Chief Administrative Officer',
      approvedAt: nowStr,
      notes: notes || 'Admin awarded milestone incentive.',
      createdAt: nowStr.substring(0, 10),
    };

    this.bonusRecords.unshift(newBonus);
    this.addAuditLog('BONUS_AWARD_CREATED', `Awarded PKR ${amountPKR.toLocaleString()} bonus to staff ${staff.fullName}.`);
    this.notify();
  }

  public updateBonusTiers(tiers: BonusTier[]): void {
    this.bonusTiers = tiers;
    this.addAuditLog('BONUS_TIERS_CONFIGURED', 'Admin updated bonus tiers and commission schedule.');
    this.notify();
  }
}

export const portalStore = PortalStore.getInstance();
