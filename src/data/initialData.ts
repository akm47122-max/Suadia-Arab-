import {
  AdminUser,
  Application,
  AuditLog,
  BallotEvent,
  CandidateUser,
  JobCategory,
  JobVacancy,
  OfficialNotice,
  PaymentRecord,
  SystemSettings,
  StaffUser,
  BonusTier,
  StaffBonusRecord,
  AdminPaymentMethod,
} from '../types';

export const INITIAL_SETTINGS: SystemSettings = {
  isEmbassyAuthorized: true, // Authorized
  authorizationDocumentRef: 'MFA/SAU-ISB/2026/AUTH-088',
  authorizedOrganizationName: 'Royal Saudi Embassy in Islamabad — Recruitment Section',
  temporaryPublicName: 'Saudi Jobs & Recruitment Portal Pakistan',
  activePublicName: 'Royal Saudi Embassy in Islamabad — Recruitment Section',
  feeCollectionAuthorized: true, // Unlocked and authorized
  feeAmountPKR: 4500,
  feePurposeDescription: 'Application Processing & Biometric Verification Ballot Administrative Fee',
  bankAccountTitle: 'Saudi Jobs Official QR Escrow Gateway',
  bankAccountNumber: 'Official QR Scan System',
  bankIBAN: 'QR-SCAN-PAYMENT',
  bankName: 'Official QR Code Gateway (EasyPaisa / JazzCash / Raast QR)',
  contactHelpline: '+92 (51) 892-0190',
  contactEmail: 'support@saudijobsportal.pk',
  contactAddress: 'G-5/2 Diplomatic Enclave Access Corridor, Islamabad, Pakistan',
  ballotDate: '2026-12-22',
};

export const INITIAL_CATEGORIES: JobCategory[] = [
  { id: 'cat-driver', name: 'Driver', description: 'Heavy & light transport, limousine, and logistics operators', iconName: 'Truck', isActive: true },
  { id: 'cat-comp-op', name: 'Computer Operator', description: 'Office IT systems, documentation, and data coordination', iconName: 'Monitor', isActive: true },
  { id: 'cat-office-asst', name: 'Office Assistant', description: 'Administrative support, archiving, and clerical coordination', iconName: 'FileSpreadsheet', isActive: true },
  { id: 'cat-data-entry', name: 'Data Entry Operator', description: 'Inventory, ERP ledger data recording, and document digitization', iconName: 'Keyboard', isActive: true },
  { id: 'cat-electrician', name: 'Electrician', description: 'Commercial installation, HVAC wiring, and maintenance technicians', iconName: 'Zap', isActive: true },
  { id: 'cat-tech', name: 'Technician', description: 'Mechanical, instrumentation, automotive, and industrial technicians', iconName: 'Wrench', isActive: true },
  { id: 'cat-factory', name: 'Factory Worker', description: 'Manufacturing, packaging, assembly line, and food processing staff', iconName: 'Factory', isActive: true },
  { id: 'cat-healthcare', name: 'Healthcare Staff', description: 'Hospital assistants, lab assistants, and medical ward aides', iconName: 'HeartPulse', isActive: true },
  { id: 'cat-nursing', name: 'Nursing Staff', description: 'Registered general nurses, clinical caregivers, and ICU nurses', iconName: 'Activity', isActive: true },
  { id: 'cat-construction', name: 'Construction Worker', description: 'Masons, steel fixers, shuttering carpenters, and site operators', iconName: 'HardHat', isActive: true },
  { id: 'cat-skilled-other', name: 'Other Skilled and Unskilled Jobs', description: 'Hospitality, warehouse logistics, facility maintenance, and trade labor', iconName: 'Briefcase', isActive: true },
];

export const INITIAL_JOBS: JobVacancy[] = [
  {
    id: 'job-001',
    title: 'Executive & Light Transport Driver',
    category: 'Driver',
    employer: 'Al-Tamimi Transport & Logistics Services Co.',
    location: 'Riyadh, Saudi Arabia',
    positions: 45,
    genderEligibility: 'Male',
    qualification: 'Matric / Intermediate with Valid Pakistani HTV/LTV License',
    experienceRequired: '2+ years professional driving experience',
    ageLimit: '21 - 42 Years',
    eligibility: 'Valid LTV/HTV license, clear criminal record, physically fit for Riyadh city driving',
    salarySAR: 2800,
    contractDuration: '2 Years (Renewable with Annual Leave)',
    deadline: '2026-12-10',
    description: 'Operating corporate light transport and executive shuttle vehicles in the Riyadh metropolitan area. Includes modern fleet navigation, basic vehicle checkup, and VIP airport route operations.',
    requiredDocuments: ['CNIC Copy', 'Driving License', 'Valid Passport (Min 1 Year Validity)', 'Police Character Certificate'],
    verificationStatus: 'Corporate Quota Approved',
    isPublished: true,
    createdAt: '2026-10-01',
  },
  {
    id: 'job-002',
    title: 'Staff Nurse & Clinical Care Specialist',
    category: 'Nursing Staff',
    employer: 'King Fahad Medical Complex Partner Consortium',
    location: 'Jeddah & Madinah, Saudi Arabia',
    positions: 30,
    genderEligibility: 'Any',
    qualification: 'BSc Nursing / General Nursing Diploma (PNC Registered)',
    experienceRequired: '1+ years clinical or hospital ward experience',
    ageLimit: '22 - 38 Years',
    eligibility: 'Active PNC Nursing Registration, Basic Life Support (BLS) certified, hospital ward experience',
    salarySAR: 5200,
    contractDuration: '2 Years (Air Ticket + Medical Provided)',
    deadline: '2026-12-10',
    description: 'Patient care, vitals monitoring, medication administration, and collaborative medical ward duties in leading regional healthcare facilities across the Western Province.',
    requiredDocuments: ['CNIC Copy', 'PNC Registration Certificate', 'Nursing Degree/Diploma', 'Valid Passport', 'Passport Size Photograph'],
    verificationStatus: 'Corporate Quota Approved',
    isPublished: true,
    createdAt: '2026-10-05',
  },
  {
    id: 'job-003',
    title: 'Industrial Electrical Technician',
    category: 'Electrician',
    employer: 'Saudi Modern Industrial Contractors Ltd.',
    location: 'Dammam & Jubail Industrial City',
    positions: 25,
    genderEligibility: 'Male',
    qualification: 'DAE Electrical / Vocational Certificate (PBTE / NAVTTC)',
    experienceRequired: '3+ years industrial or commercial electrical maintenance',
    ageLimit: '21 - 40 Years',
    eligibility: 'DAE or NAVTTC certified, schematic reading ability, familiarity with 3-phase systems',
    salarySAR: 3600,
    contractDuration: '2 Years (Accommodation + Transportation provided)',
    deadline: '2026-12-10',
    description: 'Installation, wiring, troubleshooting of motor control centers (MCC), distribution panels, switchgear, and preventive electrical maintenance across manufacturing facilities.',
    requiredDocuments: ['CNIC Copy', 'DAE / Vocational Diploma', 'Experience Certificates', 'Valid Passport'],
    verificationStatus: 'Corporate Quota Approved',
    isPublished: true,
    createdAt: '2026-10-08',
  },
  {
    id: 'job-004',
    title: 'Computer & Documentation Operator',
    category: 'Computer Operator',
    employer: 'Dar Al-Riyadh Engineering & Contracting Co.',
    location: 'Riyadh & Al-Khobar',
    positions: 20,
    genderEligibility: 'Any',
    qualification: 'Intermediate / Graduate with MS Office / Excel Proficiency',
    experienceRequired: '1+ years computerized documentation or billing experience',
    ageLimit: '20 - 35 Years',
    eligibility: 'Minimum 35 WPM typing speed, fluent in English, proficient with Excel and ERP data entry',
    salarySAR: 3200,
    contractDuration: '2 Years (Renewable)',
    deadline: '2026-12-10',
    description: 'Handling project site documentation, daily labor logs, logistics inventory spreadsheets, computerized correspondence, and ERP document entries.',
    requiredDocuments: ['CNIC Copy', 'Educational Certificates', 'Computer Proficiency Certificate', 'Valid Passport'],
    verificationStatus: 'Corporate Quota Approved',
    isPublished: true,
    createdAt: '2026-10-10',
  },
  {
    id: 'job-005',
    title: 'Hospital Support & Patient Ward Aide',
    category: 'Healthcare Staff',
    employer: 'Saudi National Care Hospitals Group',
    location: 'Riyadh & Taif',
    positions: 35,
    genderEligibility: 'Any',
    qualification: 'Matriculation or Secondary School Certificate',
    experienceRequired: 'Previous hospital, clinic or elderly care assistance preferred',
    ageLimit: '20 - 38 Years',
    eligibility: 'Matriculate, physically active, respectful patient bedside demeanor',
    salarySAR: 2600,
    contractDuration: '2 Years (Full Medical Coverage + Accommodation)',
    deadline: '2026-12-10',
    description: 'Patient transfer assistance, hygiene maintenance, sterile supply delivery, wheelchair escort, and general hospital ward logistical support under supervision.',
    requiredDocuments: ['CNIC Copy', 'Matric Certificate', 'Valid Passport', 'Fitness Certificate'],
    verificationStatus: 'Corporate Quota Approved',
    isPublished: true,
    createdAt: '2026-10-12',
  },
  {
    id: 'job-006',
    title: 'Food Processing & Assembly Plant Operator',
    category: 'Factory Worker',
    employer: 'Al-Marai Logistics & Packaging Facility',
    location: 'Al-Kharj & Riyadh',
    positions: 60,
    genderEligibility: 'Male',
    qualification: 'Middle / Matriculation',
    experienceRequired: 'Fresh to 1 year factory experience',
    ageLimit: '18 - 35 Years',
    eligibility: 'Basic hygiene standards, ability to stand during shift rotations, team player',
    salarySAR: 2300,
    contractDuration: '2 Years (Food + Accommodation + Overtime Allowed)',
    deadline: '2026-12-10',
    description: 'Operating automated packaging, labeling, palletizing, and conveyor inspection equipment in hygienic, temperature-controlled food manufacturing facilities.',
    requiredDocuments: ['CNIC Copy', 'Education Certificate', 'Valid Passport'],
    verificationStatus: 'Corporate Quota Approved',
    isPublished: true,
    createdAt: '2026-10-14',
  },
];

export const INITIAL_CANDIDATES: CandidateUser[] = [
  {
    id: 'cand-001',
    fullName: 'Muhammad Usman Khan',
    email: 'usman.khan@example.com',
    mobile: '0300-8472911',
    cnic: '35202-8472911-3',
    dob: '1995-04-18',
    gender: 'Male',
    city: 'Lahore',
    province: 'Punjab',
    education: 'Intermediate (FA/FSc) with DAE Electrical',
    experienceYears: 4,
    passportStatus: 'Valid Passport',
    preferredCategory: 'Electrician',
    cvFileName: 'Muhammad_Usman_Khan_CV.pdf',
    createdAt: '2026-10-12',
  },
  {
    id: 'cand-002',
    fullName: 'Ayesha Bibi',
    email: 'ayesha.nurse@example.com',
    mobile: '0321-7654321',
    cnic: '37405-1928374-2',
    dob: '1998-09-12',
    gender: 'Female',
    city: 'Rawalpindi',
    province: 'Punjab',
    education: 'BSc Nursing (Generic) — Registered PNC',
    experienceYears: 3,
    passportStatus: 'Valid Passport',
    preferredCategory: 'Nursing Staff',
    cvFileName: 'Ayesha_Bibi_Nursing_Resume.pdf',
    createdAt: '2026-10-14',
  },
  {
    id: 'cand-003',
    fullName: 'Tariq Mehmood',
    email: 'tariq.driver@example.com',
    mobile: '0333-5129844',
    cnic: '13101-4491028-7',
    dob: '1992-11-03',
    gender: 'Male',
    city: 'Peshawar',
    province: 'Khyber Pakhtunkhwa',
    education: 'Matriculation',
    experienceYears: 6,
    passportStatus: 'Valid Passport',
    preferredCategory: 'Driver',
    cvFileName: 'Tariq_Mehmood_License_CV.pdf',
    createdAt: '2026-10-15',
  },
];

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-001',
    trackingId: 'SAJ-2026-000101',
    candidateId: 'cand-001',
    candidateName: 'Muhammad Usman Khan',
    candidateCnic: '35202-8472911-3',
    candidateMobile: '0300-8472911',
    candidateEmail: 'usman.khan@example.com',
    candidateCity: 'Lahore',
    candidateProvince: 'Punjab',
    jobId: 'job-003',
    jobTitle: 'Industrial Electrical Technician',
    jobLocation: 'Dammam & Jubail Industrial City',
    appliedDate: '2026-10-13',
    referralCode: 'STF-TRQ-9021',
    referredByStaffId: 'staff-001',
    status: 'Ballot Eligible',
    paymentStatus: 'Verified',
    nextStageStatus: 'Ballot Scheduled',
    documents: [
      { id: 'doc-1', title: 'CNIC Front & Back', fileName: 'cnic_usman.pdf', fileSize: '1.2 MB', uploadedAt: '2026-10-13', verified: true },
      { id: 'doc-2', title: 'DAE Diploma & Transcripts', fileName: 'dae_electrical.pdf', fileSize: '2.4 MB', uploadedAt: '2026-10-13', verified: true },
      { id: 'doc-3', title: 'Valid Passport First Page', fileName: 'passport_scan.pdf', fileSize: '1.1 MB', uploadedAt: '2026-10-13', verified: true },
    ],
    reviewerId: 'admin-1',
    reviewerName: 'Farhan Ali (Recruitment Admin)',
    reviewedAt: '2026-10-14 11:30',
    reviewNotes: 'Verified technical qualifications and police character certificate. Meets all industrial requirements.',
    statusHistory: [
      { status: 'Submitted', changedAt: '2026-10-13 14:10', changedBy: 'Muhammad Usman Khan', notes: 'Application lodged online.' },
      { status: 'Payment Verification Pending', changedAt: '2026-10-13 15:40', changedBy: 'System', notes: 'Bank transfer receipt submitted.' },
      { status: 'Processing Approved', changedAt: '2026-10-14 11:30', changedBy: 'Farhan Ali', notes: 'Credentials authenticated.' },
      { status: 'Ballot Eligible', changedAt: '2026-10-14 11:35', changedBy: 'Farhan Ali', notes: 'Added to 22 Dec 2026 ballot candidate pool.' },
    ],
  },
  {
    id: 'app-002',
    trackingId: 'SAJ-2026-000102',
    candidateId: 'cand-002',
    candidateName: 'Ayesha Bibi',
    candidateCnic: '37405-1928374-2',
    candidateMobile: '0321-7654321',
    candidateEmail: 'ayesha.nurse@example.com',
    candidateCity: 'Rawalpindi',
    candidateProvince: 'Punjab',
    jobId: 'job-002',
    jobTitle: 'Staff Nurse & Clinical Care Specialist',
    jobLocation: 'Jeddah & Madinah, Saudi Arabia',
    appliedDate: '2026-10-14',
    referralCode: 'STF-TRQ-9021',
    referredByStaffId: 'staff-001',
    status: 'Processing Pending',
    paymentStatus: 'Submitted for Verification',
    nextStageStatus: 'Pending Ballot / Selection',
    documents: [
      { id: 'doc-4', title: 'CNIC Copy', fileName: 'ayesha_cnic.jpg', fileSize: '850 KB', uploadedAt: '2026-10-14', verified: true },
      { id: 'doc-5', title: 'PNC Registration', fileName: 'pnc_license.pdf', fileSize: '1.8 MB', uploadedAt: '2026-10-14', verified: false },
    ],
    reviewNotes: 'Payment receipt uploaded via JazzCash QR scan payment. Awaiting payment reviewer sign-off.',
    statusHistory: [
      { status: 'Submitted', changedAt: '2026-10-14 09:20', changedBy: 'Ayesha Bibi', notes: 'Application lodged.' },
      { status: 'Payment Verification Pending', changedAt: '2026-10-14 10:15', changedBy: 'Ayesha Bibi', notes: 'Receipt attached.' },
    ],
  },
  {
    id: 'app-003',
    trackingId: 'SAJ-2026-000103',
    candidateId: 'cand-003',
    candidateName: 'Tariq Mehmood',
    candidateCnic: '13101-4491028-7',
    candidateMobile: '0333-5129844',
    candidateEmail: 'tariq.driver@example.com',
    candidateCity: 'Peshawar',
    candidateProvince: 'Khyber Pakhtunkhwa',
    jobId: 'job-001',
    jobTitle: 'Executive & Light Transport Driver',
    jobLocation: 'Riyadh, Saudi Arabia',
    appliedDate: '2026-10-15',
    referralCode: 'STF-AYS-4182',
    referredByStaffId: 'staff-002',
    status: 'Payment Pending',
    paymentStatus: 'Pending',
    nextStageStatus: 'Pending Ballot / Selection',
    documents: [
      { id: 'doc-6', title: 'CNIC & HTV License', fileName: 'tariq_license.pdf', fileSize: '2.1 MB', uploadedAt: '2026-10-15', verified: false },
    ],
    statusHistory: [
      { status: 'Submitted', changedAt: '2026-10-15 16:00', changedBy: 'Tariq Mehmood', notes: 'Application submitted.' },
    ],
  },
];

const SAMPLE_RECEIPT_JAZZCASH_QR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="none">
  <rect width="600" height="750" rx="16" fill="%23ffffff" stroke="%23e2e8f0" stroke-width="2"/>
  <rect width="600" height="96" fill="%23991b1b"/>
  <text x="30" y="44" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="%23ffffff">JazzCash QR Pay</text>
  <text x="30" y="68" font-family="Arial, sans-serif" font-size="12" fill="%23fecdd3">Official Till &amp; QR Merchant Payment Receipt</text>
  <rect x="440" y="26" width="130" height="42" rx="8" fill="%237f1d1d" stroke="%23f87171"/>
  <text x="505" y="52" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%23fecdd3" text-anchor="middle">PAID / SUCCESS</text>

  <!-- Watermark -->
  <text x="300" y="420" font-family="Arial, sans-serif" font-size="46" font-weight="bold" fill="%23fff1f2" text-anchor="middle" transform="rotate(-30 300 420)">QR CODE VERIFIED</text>

  <!-- Details Table -->
  <g transform="translate(30, 120)">
    <rect width="540" height="580" rx="12" fill="%23fef2f2" stroke="%23fecdd3"/>
    
    <text x="25" y="40" font-family="Arial, sans-serif" font-size="11" fill="%23991b1b" font-weight="bold">TRANSACTION ID (TID)</text>
    <text x="25" y="62" font-family="Courier, monospace" font-size="16" font-weight="bold" fill="%230f172a">JC-TID-94810291</text>
    
    <line x1="25" y1="80" x2="515" y2="80" stroke="%23fecdd3" stroke-dasharray="4"/>
    
    <text x="25" y="110" font-family="Arial, sans-serif" font-size="11" fill="%23991b1b" font-weight="bold">SENDER (CANDIDATE)</text>
    <text x="25" y="132" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="%230f172a">Muhammad Usman Khan</text>
    <text x="25" y="150" font-family="Arial, sans-serif" font-size="12" fill="%23475569">JazzCash Mobile Wallet: 0300-8482910</text>
    
    <line x1="25" y1="170" x2="515" y2="170" stroke="%23fecdd3" stroke-dasharray="4"/>
    
    <text x="25" y="200" font-family="Arial, sans-serif" font-size="11" fill="%23991b1b" font-weight="bold">MERCHANT / OFFICIAL ESCROW</text>
    <text x="25" y="222" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="%23991b1b">Official Recruitment Portal Escrow</text>
    <text x="25" y="240" font-family="Arial, sans-serif" font-size="12" fill="%23475569">QR Channel: JazzCash Official Merchant QR</text>
    <text x="25" y="258" font-family="Arial, sans-serif" font-size="12" fill="%23475569">Settlement: Automated Consular Verification Pool</text>
    
    <line x1="25" y1="280" x2="515" y2="280" stroke="%23fecdd3" stroke-dasharray="4"/>
    
    <text x="25" y="310" font-family="Arial, sans-serif" font-size="11" fill="%23991b1b" font-weight="bold">RECRUITMENT TRACKING ID</text>
    <text x="25" y="335" font-family="Courier, monospace" font-size="18" font-weight="bold" fill="%23b91c1c">SAJ-2026-000101</text>
    <text x="25" y="355" font-family="Arial, sans-serif" font-size="12" fill="%23475569">Position: Executive &amp; Light Transport Driver</text>
    
    <line x1="25" y1="375" x2="515" y2="375" stroke="%23fecdd3" stroke-dasharray="4"/>
    
    <text x="25" y="405" font-family="Arial, sans-serif" font-size="11" fill="%23991b1b" font-weight="bold">TOTAL AMOUNT PAID</text>
    <text x="25" y="440" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="%23991b1b">PKR 4,500.00</text>
    <text x="25" y="460" font-family="Arial, sans-serif" font-size="11" fill="%2364748b">Rupees Four Thousand Five Hundred Only (Fee Verified)</text>
    
    <line x1="25" y1="480" x2="515" y2="480" stroke="%23fecdd3" stroke-dasharray="4"/>
    
    <text x="25" y="510" font-family="Arial, sans-serif" font-size="11" fill="%23991b1b" font-weight="bold">DATE &amp; TIME</text>
    <text x="25" y="530" font-family="Arial, sans-serif" font-size="13" font-weight="semibold" fill="%231e293b">13-Oct-2026 15:40:22 PKT</text>
    
    <!-- Official JazzCash Seal -->
    <g transform="translate(390, 460)">
      <circle cx="50" cy="50" r="45" fill="none" stroke="%23991b1b" stroke-width="2" stroke-dasharray="4,2"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="%23991b1b" stroke-width="1"/>
      <text x="50" y="38" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="%23991b1b" text-anchor="middle">JAZZCASH QR</text>
      <text x="50" y="52" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23991b1b" text-anchor="middle">VERIFIED</text>
      <text x="50" y="65" font-family="Arial, sans-serif" font-size="7" fill="%23991b1b" text-anchor="middle">TILL SCAN 2026</text>
    </g>
  </g>
</svg>`;

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-001',
    applicationId: 'app-001',
    trackingId: 'SAJ-2026-000101',
    candidateName: 'Muhammad Usman Khan',
    amountPKR: 4500,
    paymentMethod: 'JazzCash QR Code (Scan to Pay)',
    bankName: 'Official JazzCash QR',
    transactionRef: 'JC-TID-94810291',
    paymentDate: '2026-10-13',
    receiptFileName: 'usman_jazzcash_receipt_4500.jpg',
    receiptImageData: SAMPLE_RECEIPT_JAZZCASH_QR,
    status: 'Verified',
    verifiedBy: 'Sajid Iqbal (Payment Reviewer)',
    verifiedAt: '2026-10-14 09:15',
    submittedAt: '2026-10-13 15:40',
  },
  {
    id: 'pay-002',
    applicationId: 'app-002',
    trackingId: 'SAJ-2026-000102',
    candidateName: 'Ayesha Bibi',
    amountPKR: 4500,
    paymentMethod: 'EasyPaisa QR Code (Scan to Pay)',
    bankName: 'Official EasyPaisa QR',
    transactionRef: 'EP-TRX-8829104',
    paymentDate: '2026-10-14',
    receiptFileName: 'ayesha_easypaisa_receipt_4500.jpg',
    receiptImageData: SAMPLE_RECEIPT_JAZZCASH_QR,
    status: 'Submitted for Verification',
    submittedAt: '2026-10-14 10:15',
  },
];

export const INITIAL_BALLOT_EVENT: BallotEvent = {
  id: 'ballot-2026-12',
  title: 'Official Saudi Arabia 2026 General Recruitment Ballot',
  scheduledDate: '2026-12-22',
  applicationDeadline: '2026-12-10',
  selectionMethod: 'Verifiable Pseudo-Randomized Draw',
  status: 'Scheduled',
  eligibleApplicationIds: ['app-001'],
  selectedApplicationIds: [],
  notes: 'Configured for the proposed ballot date of 22 December 2026. Draw procedure subject to documented legal authorization and official observer oversight.',
};

export const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'admin-super',
    username: 'superadmin',
    name: 'Chief Administrative Officer',
    email: 'admin@saudijobsportal.pk',
    role: 'super_admin',
    isActive: true,
    lastLogin: '2026-10-19 09:00',
    createdAt: '2026-09-01',
  },
  {
    id: 'admin-recruitment',
    username: 'recruiter',
    name: 'Farhan Ali (Recruitment Manager)',
    email: 'farhan.ali@saudijobsportal.pk',
    role: 'recruitment_admin',
    isActive: true,
    lastLogin: '2026-10-18 16:45',
    createdAt: '2026-09-10',
  },
  {
    id: 'admin-payment',
    username: 'finance',
    name: 'Sajid Iqbal (Payment Reviewer)',
    email: 'sajid.finance@saudijobsportal.pk',
    role: 'payment_reviewer',
    isActive: true,
    lastLogin: '2026-10-19 08:30',
    createdAt: '2026-09-15',
  },
];

export const INITIAL_NOTICES: OfficialNotice[] = [
  {
    id: 'not-001',
    title: 'Proposed Ballot Date Scheduled for 22 December 2026',
    publishDate: '2026-10-01',
    priority: 'High',
    summary: 'The administrative recruitment ballot date is tentatively scheduled for 22 December 2026 for verified applicants.',
    content: 'All candidates applying for verified Saudi employer vacancies are hereby notified that the electronic computerized selection ballot is planned for 22 December 2026. Candidates must ensure full profile completion and document submission prior to 10 December 2026.',
    category: 'Ballot Notice',
    isPublic: true,
  },
  {
    id: 'not-002',
    title: 'Advisory on Recruitment Authorization & Anti-Fraud Warnings',
    publishDate: '2026-10-05',
    priority: 'Urgent',
    summary: 'Public warning against unauthorized agents demanding private cash payments or making fake job promises.',
    content: 'Applicants are strictly cautioned that paying an application fee does not guarantee employment, visa grant, or ballot selection. Always verify your Tracking ID exclusively through the official portal. Report any unauthorized agent claiming private diplomatic guarantees directly to our compliance helpline.',
    category: 'Fraud Warning',
    isPublic: true,
  },
  {
    id: 'not-003',
    title: 'Application Processing & Fee Transparency Guidelines',
    publishDate: '2026-10-10',
    priority: 'Normal',
    summary: 'Understanding the PKR 4,500 proposed administrative processing fee status and bank challan protocols.',
    content: 'The proposed application fee of PKR 4,500 covers candidate document verification, biometric data processing, and computerized ballot entry. The fee is subject to administrative activation upon statutory verification.',
    category: 'Fee Regulation',
    isPublic: true,
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-10-14 11:35:10',
    actor: 'Farhan Ali (Recruitment Manager)',
    role: 'recruitment_admin',
    action: 'APPLICATION_STATUS_UPDATE',
    details: 'Application SAJ-2026-000101 marked as Ballot Eligible for 22 Dec 2026 draw.',
    ipAddress: '182.180.122.45',
  },
  {
    id: 'log-002',
    timestamp: '2026-10-14 09:15:22',
    actor: 'Sajid Iqbal (Payment Reviewer)',
    role: 'payment_reviewer',
    action: 'PAYMENT_VERIFIED',
    details: 'Payment record pay-001 (PKR 4,500) for SAJ-2026-000101 verified against JazzCash QR statement.',
    ipAddress: '182.180.122.49',
  },
  {
    id: 'log-003',
    timestamp: '2026-10-10 14:00:00',
    actor: 'Chief Administrative Officer',
    role: 'super_admin',
    action: 'BALLOT_EVENT_CONFIGURED',
    details: 'Scheduled Ballot Event ballot-2026-12 for 22 December 2026 with deadline 10 December 2026.',
    ipAddress: '182.180.122.10',
  },
];

export const INITIAL_BONUS_TIERS: BonusTier[] = [
  {
    id: 'tier-1',
    tierName: 'Bronze Tier',
    minVerifiedReferrals: 5,
    bonusAmountPKR: 2500,
    commissionPercent: 3.0,
    description: 'Entry milestone for active field officers achieving 5 verified submissions',
    isActive: true,
  },
  {
    id: 'tier-2',
    tierName: 'Silver Tier',
    minVerifiedReferrals: 15,
    bonusAmountPKR: 7500,
    commissionPercent: 5.0,
    description: 'Standard monthly target milestone for 15 verified candidates with fee verified',
    isActive: true,
  },
  {
    id: 'tier-3',
    tierName: 'Gold Tier',
    minVerifiedReferrals: 30,
    bonusAmountPKR: 18000,
    commissionPercent: 7.5,
    description: 'High achiever milestone for 30 verified candidates',
    isActive: true,
  },
  {
    id: 'tier-4',
    tierName: 'Platinum Tier',
    minVerifiedReferrals: 50,
    bonusAmountPKR: 35000,
    commissionPercent: 10.0,
    description: 'Regional champion milestone with 10% commission on verified revenue',
    isActive: true,
  },
];

export const INITIAL_STAFF: StaffUser[] = [
  {
    id: 'staff-001',
    fullName: 'Tariq Mahmood',
    username: 'staff_tariq',
    email: 'tariq.mahmood@saudijobsportal.pk',
    phone: '0301-5582910',
    role: 'recruitment_officer',
    status: 'active',
    referralCode: 'STF-TRQ-9021',
    monthlyTarget: 15,
    payoutMethod: 'JazzCash',
    payoutAccountTitle: 'Tariq Mahmood',
    payoutAccountNumber: '0301-5582910',
    mustChangePassword: false,
    lastLogin: '2026-10-18 16:45',
    createdAt: '2026-09-15',
  },
  {
    id: 'staff-002',
    fullName: 'Ayesha Rehman',
    username: 'staff_ayesha',
    email: 'ayesha.rehman@saudijobsportal.pk',
    phone: '0321-4829102',
    role: 'field_coordinator',
    status: 'active',
    referralCode: 'STF-AYS-4182',
    monthlyTarget: 20,
    payoutMethod: 'EasyPaisa',
    payoutAccountTitle: 'Ayesha Rehman',
    payoutAccountNumber: '0321-4829102',
    mustChangePassword: false,
    lastLogin: '2026-10-19 11:20',
    createdAt: '2026-09-20',
  },
  {
    id: 'staff-003',
    fullName: 'Bilal Shah',
    username: 'staff_bilal',
    email: 'bilal.shah@saudijobsportal.pk',
    phone: '0333-9182746',
    role: 'community_ambassador',
    status: 'active',
    referralCode: 'STF-BIL-7734',
    monthlyTarget: 12,
    payoutMethod: 'JazzCash',
    payoutAccountTitle: 'Bilal Shah',
    payoutAccountNumber: '0333-9182746',
    mustChangePassword: true, // Needs password change on first login
    createdAt: '2026-10-10',
  },
];

export const INITIAL_BONUS_RECORDS: StaffBonusRecord[] = [
  {
    id: 'bonus-001',
    staffId: 'staff-001',
    staffName: 'Tariq Mahmood',
    staffUsername: 'staff_tariq',
    referralCode: 'STF-TRQ-9021',
    month: '2026-09',
    verifiedReferralsCount: 16,
    verifiedRevenuePKR: 72000,
    bonusAmountPKR: 7500,
    tierName: 'Silver Tier',
    status: 'Disbursed / Paid',
    payoutMethod: 'JazzCash',
    payoutAccountTitle: 'Tariq Mahmood',
    payoutAccountNumber: '0301-5582910',
    approvedBy: 'Chief Administrative Officer',
    approvedAt: '2026-10-02 11:00',
    paidRef: 'JC-TID-9482019',
    paidAt: '2026-10-03 14:30',
    notes: 'September target achieved and approved. Commission sent via JazzCash.',
    createdAt: '2026-10-01',
  },
  {
    id: 'bonus-002',
    staffId: 'staff-001',
    staffName: 'Tariq Mahmood',
    staffUsername: 'staff_tariq',
    referralCode: 'STF-TRQ-9021',
    month: '2026-10',
    verifiedReferralsCount: 6,
    verifiedRevenuePKR: 27000,
    bonusAmountPKR: 2500,
    tierName: 'Bronze Tier',
    status: 'Pending Review',
    payoutMethod: 'JazzCash',
    payoutAccountTitle: 'Tariq Mahmood',
    payoutAccountNumber: '0301-5582910',
    notes: 'Current month milestone achieved. Pending monthly closing review.',
    createdAt: '2026-10-18',
  },
];

const QR_JAZZCASH = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="16" fill="%23ffffff"/><rect x="20" y="20" width="260" height="260" rx="8" fill="%23fff1f2" stroke="%23fecdd3" stroke-width="2"/><g fill="%23991b1b"><rect x="40" y="40" width="60" height="60" rx="6" fill="%23b91c1c"/><rect x="52" y="52" width="36" height="36" rx="3" fill="%23ffffff"/><rect x="60" y="60" width="20" height="20" rx="2" fill="%23b91c1c"/><rect x="200" y="40" width="60" height="60" rx="6" fill="%23b91c1c"/><rect x="212" y="52" width="36" height="36" rx="3" fill="%23ffffff"/><rect x="220" y="60" width="20" height="20" rx="2" fill="%23b91c1c"/><rect x="40" y="200" width="60" height="60" rx="6" fill="%23b91c1c"/><rect x="52" y="212" width="36" height="36" rx="3" fill="%23ffffff"/><rect x="60" y="220" width="20" height="20" rx="2" fill="%23b91c1c"/><rect x="120" y="50" width="25" height="15"/><rect x="155" y="40" width="20" height="30"/><rect x="110" y="80" width="40" height="20"/><rect x="160" y="80" width="25" height="25"/><rect x="50" y="120" width="25" height="25"/><rect x="85" y="115" width="25" height="20"/><rect x="120" y="120" width="60" height="60" rx="8" fill="%23b91c1c"/><text x="150" y="156" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23ffffff" text-anchor="middle">JAZZCASH</text><rect x="190" y="120" width="30" height="15"/><rect x="230" y="115" width="30" height="25"/><rect x="190" y="145" width="25" height="35"/><rect x="225" y="150" width="35" height="20"/><rect x="50" y="155" width="40" height="25"/><rect x="120" y="190" width="20" height="30"/><rect x="150" y="190" width="35" height="20"/><rect x="195" y="190" width="20" height="35"/><rect x="225" y="185" width="35" height="20"/><rect x="115" y="230" width="30" height="30"/><rect x="155" y="225" width="30" height="35"/><rect x="195" y="235" width="20" height="25"/><rect x="225" y="220" width="35" height="40"/></g><text x="150" y="290" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="%23b91c1c" text-anchor="middle">JAZZCASH QR CODE</text></svg>`;

const QR_EASYPAISA = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="16" fill="%23ffffff"/><rect x="20" y="20" width="260" height="260" rx="8" fill="%23f0fdf4" stroke="%23bbf7d0" stroke-width="2"/><g fill="%2315803d"><rect x="40" y="40" width="60" height="60" rx="6" fill="%2316a34a"/><rect x="52" y="52" width="36" height="36" rx="3" fill="%23ffffff"/><rect x="60" y="60" width="20" height="20" rx="2" fill="%2316a34a"/><rect x="200" y="40" width="60" height="60" rx="6" fill="%2316a34a"/><rect x="212" y="52" width="36" height="36" rx="3" fill="%23ffffff"/><rect x="220" y="60" width="20" height="20" rx="2" fill="%2316a34a"/><rect x="40" y="200" width="60" height="60" rx="6" fill="%2316a34a"/><rect x="52" y="212" width="36" height="36" rx="3" fill="%23ffffff"/><rect x="60" y="220" width="20" height="20" rx="2" fill="%2316a34a"/><rect x="120" y="50" width="30" height="15"/><rect x="160" y="40" width="20" height="35"/><rect x="110" y="85" width="35" height="20"/><rect x="155" y="85" width="25" height="20"/><rect x="50" y="115" width="30" height="20"/><rect x="90" y="115" width="20" height="35"/><rect x="120" y="120" width="60" height="60" rx="8" fill="%2316a34a"/><text x="150" y="156" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="%23ffffff" text-anchor="middle">EASYPAISA</text><rect x="190" y="120" width="30" height="20"/><rect x="230" y="120" width="30" height="20"/><rect x="190" y="150" width="20" height="30"/><rect x="220" y="150" width="40" height="20"/><rect x="50" y="160" width="35" height="25"/><rect x="120" y="190" width="25" height="25"/><rect x="155" y="190" width="30" height="20"/><rect x="195" y="190" width="20" height="35"/><rect x="225" y="185" width="35" height="20"/><rect x="115" y="225" width="30" height="35"/><rect x="155" y="220" width="25" height="40"/><rect x="190" y="235" width="25" height="25"/><rect x="225" y="220" width="35" height="40"/></g><text x="150" y="290" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="%2316a34a" text-anchor="middle">EASYPAISA QR CODE</text></svg>`;

const QR_RAAST_P2M = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="16" fill="%23ffffff"/><rect x="20" y="20" width="260" height="260" rx="8" fill="%23f0fdfa" stroke="%2399f6e4" stroke-width="2"/><g fill="%230f766e"><rect x="40" y="40" width="60" height="60" rx="6" fill="%230d9488"/><rect x="52" y="52" width="36" height="36" rx="3" fill="%23ffffff"/><rect x="60" y="60" width="20" height="20" rx="2" fill="%230d9488"/><rect x="200" y="40" width="60" height="60" rx="6" fill="%230d9488"/><rect x="212" y="52" width="36" height="36" rx="3" fill="%23ffffff"/><rect x="220" y="60" width="20" height="20" rx="2" fill="%230d9488"/><rect x="40" y="200" width="60" height="60" rx="6" fill="%230d9488"/><rect x="52" y="212" width="36" height="36" rx="3" fill="%23ffffff"/><rect x="60" y="220" width="20" height="20" rx="2" fill="%230d9488"/><rect x="120" y="50" width="20" height="25"/><rect x="150" y="45" width="30" height="15"/><rect x="110" y="85" width="25" height="20"/><rect x="145" y="80" width="35" height="25"/><rect x="50" y="120" width="35" height="20"/><rect x="95" y="115" width="15" height="35"/><rect x="120" y="120" width="60" height="60" rx="8" fill="%230d9488"/><text x="150" y="156" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%23ffffff" text-anchor="middle">RAAST</text><rect x="190" y="120" width="25" height="20"/><rect x="225" y="115" width="35" height="25"/><rect x="190" y="150" width="35" height="20"/><rect x="235" y="150" width="25" height="30"/><rect x="50" y="155" width="35" height="25"/><rect x="120" y="190" width="20" height="35"/><rect x="150" y="190" width="35" height="20"/><rect x="195" y="190" width="20" height="30"/><rect x="225" y="190" width="35" height="20"/><rect x="115" y="235" width="30" height="25"/><rect x="155" y="225" width="25" height="35"/><rect x="190" y="230" width="25" height="30"/><rect x="225" y="220" width="35" height="40"/></g><text x="150" y="290" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="%230d9488" text-anchor="middle">STATE BANK RAAST QR CODE</text></svg>`;

export const INITIAL_PAYMENT_METHODS: AdminPaymentMethod[] = [
  {
    id: 'paymethod-easypaisa-qr',
    name: 'EasyPaisa QR Code (Scan to Pay)',
    type: 'easypaisa',
    accountTitle: 'Official Recruitment Portal Escrow',
    accountNumber: 'QR Scan Payment',
    instructions: 'Open your EasyPaisa App → Tap "QR Pay" or "Scan QR" → Point camera at this QR code → Confirm amount PKR 4,500 and verify account title before sending.',
    referenceInstructions: 'Take a clear screenshot of the EasyPaisa confirmation screen showing the Transaction ID (TRX ID).',
    qrCodeUrl: QR_EASYPAISA,
    qrCodeFileName: 'easypaisa_qr.svg',
    status: 'active',
    displayOrder: 1,
    isDefault: true,
    createdAt: '2026-10-01 09:00',
    updatedAt: '2026-10-20 09:00',
  },
  {
    id: 'paymethod-jazzcash-qr',
    name: 'JazzCash QR Code (Scan to Pay)',
    type: 'jazzcash',
    accountTitle: 'Official Recruitment Portal Escrow',
    accountNumber: 'QR Scan Payment',
    instructions: 'Open your JazzCash App → Tap "Scan QR" → Point camera at this QR code → Confirm fee amount PKR 4,500 and enter your MPIN.',
    referenceInstructions: 'Take a clear screenshot of the successful JazzCash receipt screen showing the TID (Transaction ID).',
    qrCodeUrl: QR_JAZZCASH,
    qrCodeFileName: 'jazzcash_qr.svg',
    status: 'active',
    displayOrder: 2,
    createdAt: '2026-10-02 10:00',
    updatedAt: '2026-10-20 09:00',
  },
  {
    id: 'paymethod-raast-qr',
    name: 'Raast QR Code (Any Banking App Scan)',
    type: 'raast',
    accountTitle: 'Official Recruitment Portal Escrow',
    accountNumber: 'Raast P2M Scan',
    instructions: 'Open any Pakistani Banking or Wallet App (HBL, Alfalah, UBL, SadaPay, etc.) → Select "Raast QR Scan" → Scan this QR Code to transfer PKR 4,500 instantly.',
    referenceInstructions: 'Capture the bank transfer confirmation receipt showing the Raast reference / transaction ID.',
    qrCodeUrl: QR_RAAST_P2M,
    qrCodeFileName: 'raast_instant_qr.svg',
    status: 'active',
    displayOrder: 3,
    createdAt: '2026-10-03 11:00',
    updatedAt: '2026-10-20 09:00',
  },
];


