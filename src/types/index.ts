export type UserRole = 'candidate' | 'super_admin' | 'recruitment_admin' | 'payment_reviewer' | 'readonly_reviewer';

export type GenderEligibility = 'Male' | 'Female' | 'Any';

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Payment Pending'
  | 'Payment Verification Pending'
  | 'Processing Pending'
  | 'Processing Approved'
  | 'Documents Required'
  | 'Rejected'
  | 'Ballot Eligible';

export type PaymentStatus =
  | 'Pending'
  | 'Submitted for Verification'
  | 'Verified'
  | 'Rejected'
  | 'Refund Pending'
  | 'Refunded';

export type NextStageStatus =
  | 'Pending Ballot / Selection'
  | 'Ballot Scheduled'
  | 'Selected for Next Stage'
  | 'Not Selected'
  | 'Further Documents Required'
  | 'Interview Scheduled'
  | 'Medical Examination Pending'
  | 'Employer Review Pending'
  | 'Final Decision Pending'
  | 'Application Closed';

export interface CandidateUser {
  id: string;
  fullName: string;
  email: string;
  mobile: string; // e.g. 0300-1234567
  cnic: string; // e.g. 35201-1234567-1
  dob: string;
  gender: 'Male' | 'Female';
  city: string;
  province: string;
  education: string;
  experienceYears: number;
  passportStatus: 'Valid Passport' | 'In-process' | 'Not Applied';
  preferredCategory: string;
  cvFileName?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'super_admin' | 'recruitment_admin' | 'payment_reviewer' | 'readonly_reviewer';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface JobCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  isActive: boolean;
}

export interface JobVacancy {
  id: string;
  title: string;
  category: string;
  employer: string;
  location: string; // e.g. Riyadh, Jeddah, Dammam, Madinah
  positions: number;
  genderEligibility: GenderEligibility;
  qualification: string;
  experienceRequired: string;
  ageLimit?: string; // e.g. "21 - 40 Years"
  eligibility?: string; // Specific eligibility / prerequisites
  salarySAR: number;
  contractDuration: string; // e.g. "2 Years (Renewable)"
  deadline: string; // e.g. "2026-11-30"
  description: string;
  requiredDocuments: string[];
  verificationStatus: 'Verified by Labor Attache' | 'Corporate Quota Approved' | 'Pending Verification';
  isPublished: boolean;
  createdAt: string;
}

export interface ApplicationDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  verified: boolean;
}

export interface Application {
  id: string;
  trackingId: string; // e.g. SAJ-2026-000125
  candidateId: string;
  candidateName: string;
  candidateCnic: string;
  candidateMobile: string;
  candidateEmail: string;
  candidateCity: string;
  candidateProvince: string;
  jobId: string;
  jobTitle: string;
  jobLocation: string;
  appliedDate: string;
  status: ApplicationStatus;
  paymentStatus: PaymentStatus;
  nextStageStatus: NextStageStatus;
  documents: ApplicationDocument[];
  reviewerId?: string;
  reviewerName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  additionalDocumentsRequested?: string;
  ballotEventId?: string;
  ballotSelectionStatus?: 'Not Drawn' | 'Drawn / Selected' | 'Waitlist';
  referralCode?: string; // Staff member referral code e.g. STF-KHA-8492
  referredByStaffId?: string;
  statusHistory: Array<{
    status: ApplicationStatus | NextStageStatus;
    changedAt: string;
    changedBy: string;
    notes?: string;
  }>;
}

export type PaymentMethodType =
  | 'bank_transfer'
  | 'easypaisa'
  | 'jazzcash'
  | 'nayapay'
  | 'sadapay'
  | 'raast'
  | 'bank_challan'
  | 'other';

export type PaymentMethodStatus = 'active' | 'inactive' | 'archived';

export interface AdminPaymentMethod {
  id: string;
  name: string; // e.g. "EasyPaisa QR Code (Scan to Pay)" or "JazzCash QR Code"
  type: PaymentMethodType;
  accountTitle: string; // e.g. "Official Recruitment Portal Escrow"
  accountNumber: string; // e.g. "QR Scan Payment"
  iban?: string;
  bankName?: string;
  instructions: string; // Step-by-step QR scanning instructions
  referenceInstructions?: string; // e.g. "Enter your 14-character Tracking ID in remarks"
  qrCodeUrl?: string; // Data URL or URL for QR code
  qrCodeFileName?: string;
  status: PaymentMethodStatus; // 'active' | 'inactive' | 'archived'
  displayOrder: number;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  applicationId: string;
  trackingId: string;
  candidateName: string;
  amountPKR: number; // PKR 4,500
  paymentMethod: string; // Dynamic name of the payment method
  paymentMethodId?: string;
  accountTitleSnapshot?: string;
  accountNumberSnapshot?: string;
  feeSnapshotPKR?: number;
  instructionsSnapshot?: string;
  bankName?: string;
  transactionRef: string;
  paymentDate: string;
  receiptFileName?: string;
  receiptImageData?: string; // Base64 data URL or screenshot image for admin inspection
  receiptUrl?: string;
  status: PaymentStatus;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  refundRef?: string;
  refundDate?: string;
  submittedAt: string;
  isDuplicateFlagged?: boolean;
  duplicateMatchingTrackingId?: string;
}

export interface BallotEvent {
  id: string;
  title: string;
  scheduledDate: string; // 2026-12-22
  applicationDeadline: string; // 2026-12-10
  selectionMethod: 'Verifiable Pseudo-Randomized Draw' | 'Authorized Merit/Employer Quota Selection';
  status: 'Scheduled' | 'Registration Closed' | 'Eligible Pool Locked' | 'Draw Completed' | 'Results Published';
  eligibleApplicationIds: string[];
  selectedApplicationIds: string[];
  seedOrProof?: string;
  publishedAt?: string;
  publishedBy?: string;
  notes: string;
}

export interface OfficialNotice {
  id: string;
  title: string;
  publishDate: string;
  priority: 'High' | 'Normal' | 'Urgent';
  summary: string;
  content: string;
  category: 'Recruitment Advisory' | 'Ballot Notice' | 'Fee Regulation' | 'Fraud Warning';
  isPublic: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface SystemSettings {
  isEmbassyAuthorized: boolean; // false until written authorization is documented
  authorizationDocumentRef: string;
  authorizedOrganizationName: string; // "Royal Saudi Embassy in Islamabad"
  temporaryPublicName: string; // "Saudi Jobs & Recruitment Portal Pakistan"
  activePublicName: string;
  feeCollectionAuthorized: boolean; // MUST remain disabled until authorized
  feeAmountPKR: number; // 4500
  feePurposeDescription: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
  bankIBAN: string;
  bankName: string;
  contactHelpline: string;
  contactEmail: string;
  contactAddress: string;
  ballotDate: string; // "2026-12-22"
}

// ============================================================================
// STAFF MANAGEMENT & REFERRAL EARNINGS TYPES
// ============================================================================

export type StaffRole =
  | 'recruitment_officer'
  | 'field_coordinator'
  | 'community_ambassador'
  | 'senior_agent'
  | 'regional_supervisor';

export type StaffStatus = 'active' | 'suspended';

export interface StaffUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  role: StaffRole;
  status: StaffStatus;
  referralCode: string; // Unique collision-resistant referral code e.g. "STF-KHA-8492"
  monthlyTarget: number; // Monthly target of verified referrals (e.g. 15)
  mustChangePassword: boolean; // True on account creation or admin reset
  // Staff Payout Account (JazzCash / EasyPaisa / Raast / Bank) for Commission/Bonus Disbursement
  payoutMethod?: 'JazzCash' | 'EasyPaisa' | 'Raast' | 'Bank Transfer';
  payoutAccountTitle?: string; // Account title on JazzCash / EasyPaisa
  payoutAccountNumber?: string; // Mobile / account number (e.g. 0300-1234567)
  payoutBankName?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface BonusTier {
  id: string;
  tierName: string; // e.g. "Bronze", "Silver", "Gold", "Platinum"
  minVerifiedReferrals: number; // e.g. 5, 15, 30, 50
  bonusAmountPKR: number; // e.g. 2,500, 7,500, 18,000, 35,000
  commissionPercent: number; // e.g. 5.0% of verified revenue
  description: string;
  isActive: boolean;
}

export interface StaffBonusRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffUsername: string;
  referralCode: string;
  month: string; // e.g. "2026-10"
  verifiedReferralsCount: number;
  verifiedRevenuePKR: number; // Only verified payments counted
  bonusAmountPKR: number;
  tierName: string;
  status: 'Pending Review' | 'Approved' | 'Disbursed / Paid' | 'Rejected';
  // Staff Payout details at time of bonus disbursement
  payoutMethod?: string;
  payoutAccountTitle?: string;
  payoutAccountNumber?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidRef?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

export interface StaffPerformanceSummary {
  staff: StaffUser;
  totalReferrals: number;
  validReferrals: number;
  verifiedPaidReferrals: number;
  verifiedRevenuePKR: number; // Only genuinely received, verified payments
  monthlyTarget: number;
  targetProgressPercent: number;
  eligibleBonusPKR: number;
  approvedBonusPKR: number;
  paidBonusPKR: number;
  pendingBonusPKR: number;
  currentTierName: string;
  nextTier?: {
    tierName: string;
    neededReferrals: number;
    potentialBonusPKR: number;
  };
}

