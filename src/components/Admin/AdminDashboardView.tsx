import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  FileText,
  CreditCard,
  Award,
  Search,
  Bell,
  Download,
  AlertCircle,
  Clock,
  Settings,
  Shield,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  ChevronRight,
  ShieldAlert,
  FileCheck,
  Eye,
  ZoomIn,
  ZoomOut,
  Printer,
  Pencil,
  Menu,
  Users2,
  X,
  Sliders,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  AdminUser,
  Application,
  JobVacancy,
  JobCategory,
  PaymentRecord,
  BallotEvent,
  SystemSettings,
  AuditLog,
  OfficialNotice,
  CandidateUser,
  NextStageStatus,
} from '../../types';
import { portalStore } from '../../services/store';
import { StaffManagementModule } from './StaffManagementModule';
import { PaymentSettingsModule } from './PaymentSettingsModule';

interface AdminDashboardViewProps {
  admin: AdminUser;
  applications: Application[];
  candidates: CandidateUser[];
  jobs: JobVacancy[];
  categories: JobCategory[];
  payments: PaymentRecord[];
  ballot: BallotEvent;
  settings: SystemSettings;
  notices: OfficialNotice[];
  auditLogs: AuditLog[];
  admins: AdminUser[];
  onLogoutAdmin: () => void;
  onNavigateToPublic: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  admin,
  applications,
  candidates,
  jobs,
  categories,
  payments,
  ballot,
  settings,
  notices,
  auditLogs,
  admins,
  onLogoutAdmin,
  onNavigateToPublic,
}) => {
  const [activeModule, setActiveModule] = useState<string>('overview');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'verified' | 'rejected' | 'duplicate'>('all');

  // Filter & Search states
  const [appSearch, setAppSearch] = useState('');
  const [selectedAppDetail, setSelectedAppDetail] = useState<Application | null>(null);

  // New Job modal state
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobCategory, setNewJobCategory] = useState(categories[0]?.name || 'Driver');
  const [newJobEmployer, setNewJobEmployer] = useState('');
  const [newJobLocation, setNewJobLocation] = useState('Riyadh, Saudi Arabia');
  const [newJobSalary, setNewJobSalary] = useState(3000);
  const [newJobPositions, setNewJobPositions] = useState(20);
  const [newJobGender, setNewJobGender] = useState<'Male' | 'Female' | 'Any'>('Any');
  const [newJobAgeLimit, setNewJobAgeLimit] = useState('21 - 40 Years');
  const [newJobEligibility, setNewJobEligibility] = useState('');
  const [newJobQualification, setNewJobQualification] = useState('Matric / Intermediate');
  const [newJobExperience, setNewJobExperience] = useState('2+ years');
  const [newJobDesc, setNewJobDesc] = useState('');

  // Edit Job modal state
  const [editingJob, setEditingJob] = useState<JobVacancy | null>(null);
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editJobCategory, setEditJobCategory] = useState('');
  const [editJobEmployer, setEditJobEmployer] = useState('');
  const [editJobLocation, setEditJobLocation] = useState('');
  const [editJobSalary, setEditJobSalary] = useState(3000);
  const [editJobPositions, setEditJobPositions] = useState(20);
  const [editJobGender, setEditJobGender] = useState<'Male' | 'Female' | 'Any'>('Any');
  const [editJobAgeLimit, setEditJobAgeLimit] = useState('21 - 40 Years');
  const [editJobEligibility, setEditJobEligibility] = useState('');
  const [editJobQualification, setEditJobQualification] = useState('');
  const [editJobExperience, setEditJobExperience] = useState('');
  const [editJobContract, setEditJobContract] = useState('2 Years (Renewable)');
  const [editJobDeadline, setEditJobDeadline] = useState('2026-12-10');
  const [editJobDesc, setEditJobDesc] = useState('');

  // Ballot Runner state
  const [ballotDrawQuota, setBallotDrawQuota] = useState(25);
  const [ballotSeedInput, setBallotSeedInput] = useState('');
  const [ballotDrawResult, setBallotDrawResult] = useState<{ count: number; seed: string } | null>(null);

  // Notice Creator state
  const [isAddingNotice, setIsAddingNotice] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeSummary, setNoticeSummary] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [noticeCategory, setNoticeCategory] = useState<'Recruitment Advisory' | 'Ballot Notice' | 'Fee Regulation' | 'Fraud Warning'>('Recruitment Advisory');

  // Settings state
  const [authPermitRef, setAuthPermitRef] = useState(settings.authorizationDocumentRef);
  const [enableFeeCollection, setEnableFeeCollection] = useState(settings.feeCollectionAuthorized);
  const [ballotDateInput, setBallotDateInput] = useState(settings.ballotDate);
  const [feeAmountInput, setFeeAmountInput] = useState(settings.feeAmountPKR);

  // Rejection modal state
  const [rejectAppId, setRejectAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Incomplete educational documentation or unverified CNIC');

  // Next-stage updater state
  const [nextStageAppId, setNextStageAppId] = useState<string | null>(null);
  const [nextStageSelection, setNextStageSelection] = useState<NextStageStatus>('Selected for Next Stage');

  // Payment screenshot inspection modal state
  const [viewingReceiptPayment, setViewingReceiptPayment] = useState<PaymentRecord | null>(null);
  const [screenshotZoom, setScreenshotZoom] = useState<number>(1);

  const flashMessage = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Metrics
  const totalCandidates = candidates.length;
  const totalApplications = applications.length;
  const pendingPayments = payments.filter((p) => p.status === 'Submitted for Verification').length;
  const verifiedPayments = payments.filter((p) => p.status === 'Verified').length;
  const processingPending = applications.filter((a) => a.status === 'Processing Pending' || a.status === 'Submitted').length;
  const processingApproved = applications.filter((a) => a.status === 'Processing Approved' || a.status === 'Ballot Eligible').length;
  const ballotEligible = applications.filter((a) => a.status === 'Ballot Eligible').length;
  const selectedNextStage = applications.filter((a) => a.nextStageStatus === 'Selected for Next Stage').length;
  const rejectedApps = applications.filter((a) => a.status === 'Rejected').length;

  // Module Permissions Check
  const canManageRecruitment = admin.role === 'super_admin' || admin.role === 'recruitment_admin';
  const canManagePayments = admin.role === 'super_admin' || admin.role === 'payment_reviewer';
  const canManageSettings = admin.role === 'super_admin';

  // Export to CSV generator
  const exportCandidatesCsv = () => {
    const headers = ['Tracking ID', 'Candidate Name', 'CNIC', 'Mobile', 'Job Title', 'Applied Date', 'App Status', 'Payment Status', 'Next Stage'];
    const rows = applications.map((a) => [
      a.trackingId,
      `"${a.candidateName}"`,
      `"${a.candidateCnic}"`,
      `"${a.candidateMobile}"`,
      `"${a.jobTitle}"`,
      a.appliedDate,
      a.status,
      a.paymentStatus,
      a.nextStageStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `saudi_recruitment_applicants_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    flashMessage('Candidate applications exported to CSV successfully.');
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    portalStore.addJobVacancy({
      title: newJobTitle,
      category: newJobCategory,
      employer: newJobEmployer || 'Authorized Saudi Consortium',
      location: newJobLocation,
      positions: Number(newJobPositions),
      genderEligibility: newJobGender,
      ageLimit: newJobAgeLimit || '21 - 40 Years',
      eligibility: newJobEligibility || newJobQualification,
      qualification: newJobQualification,
      experienceRequired: newJobExperience,
      salarySAR: Number(newJobSalary),
      contractDuration: '2 Years (Renewable)',
      deadline: '2026-12-10',
      description: newJobDesc || 'Qualified candidate wanted for authorized employment quota.',
      requiredDocuments: ['CNIC Copy', 'Valid Passport', 'Educational Certificate'],
      verificationStatus: 'Corporate Quota Approved',
      isPublished: true,
    });
    setIsAddingJob(false);
    flashMessage('New job vacancy added and published successfully.');
  };

  const openEditJobModal = (job: JobVacancy) => {
    setEditingJob(job);
    setEditJobTitle(job.title);
    setEditJobCategory(job.category);
    setEditJobEmployer(job.employer);
    setEditJobLocation(job.location);
    setEditJobSalary(job.salarySAR);
    setEditJobPositions(job.positions);
    setEditJobGender(job.genderEligibility);
    setEditJobAgeLimit(job.ageLimit || '21 - 40 Years');
    setEditJobEligibility(job.eligibility || job.qualification);
    setEditJobQualification(job.qualification);
    setEditJobExperience(job.experienceRequired);
    setEditJobContract(job.contractDuration);
    setEditJobDeadline(job.deadline);
    setEditJobDesc(job.description);
  };

  const handleUpdateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    portalStore.updateJobVacancy(editingJob.id, {
      title: editJobTitle,
      category: editJobCategory,
      employer: editJobEmployer,
      location: editJobLocation,
      salarySAR: Number(editJobSalary),
      positions: Number(editJobPositions),
      genderEligibility: editJobGender,
      ageLimit: editJobAgeLimit,
      eligibility: editJobEligibility,
      qualification: editJobQualification,
      experienceRequired: editJobExperience,
      contractDuration: editJobContract,
      deadline: editJobDeadline,
      description: editJobDesc,
    });
    setEditingJob(null);
    flashMessage(`Vacancy "${editJobTitle}" updated successfully (Salary, Age Limit, Eligibility, Quota).`);
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    portalStore.addNotice({
      title: noticeTitle,
      summary: noticeSummary,
      content: noticeContent,
      priority: noticePriority,
      category: noticeCategory,
      isPublic: true,
      publishDate: new Date().toISOString().substring(0, 10),
    });
    setIsAddingNotice(false);
    flashMessage('Official circular notice published.');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      portalStore.updateSystemSettings({
        isEmbassyAuthorized: !!authPermitRef.trim(),
        authorizationDocumentRef: authPermitRef.trim(),
        feeCollectionAuthorized: enableFeeCollection,
        feeAmountPKR: Number(feeAmountInput),
        ballotDate: ballotDateInput,
      });
      flashMessage('System governance settings updated successfully.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      {/* Mobile Top Header with Collapsible Drawer Trigger (Android 360px-430px Optimized) */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between z-30 sticky top-0 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center border border-slate-700 transition-colors"
            aria-label="Toggle navigation drawer"
          >
            {isMobileDrawerOpen ? <X className="w-5 h-5 text-amber-300" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <span className="font-bold text-xs text-white block">Consular Administration</span>
            <span className="text-[10px] text-amber-300 font-mono capitalize">
              {admin.name} · {admin.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        <button
          onClick={onLogoutAdmin}
          className="p-2 text-red-400 hover:text-red-300 bg-red-950/40 rounded-xl cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center border border-red-900/60 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Sidebar (Collapsible Drawer on Mobile, Fixed Sidebar on Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-64 ${
          isMobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                ADM
              </div>
              <div>
                <span className="font-bold text-xs text-white block">Portal Administration</span>
                <span className="text-[10px] text-amber-300 font-mono">
                  {admin.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-2 space-y-1 text-xs overflow-y-auto max-h-[calc(100vh-140px)] md:max-h-none">
            <button
              onClick={() => {
                setActiveModule('overview');
                setIsMobileDrawerOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer min-h-[44px] ${
                activeModule === 'overview' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => {
                setActiveModule('staff');
                setIsMobileDrawerOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer min-h-[44px] ${
                activeModule === 'staff' ? 'bg-emerald-500/20 text-emerald-300 font-bold ring-1 ring-emerald-500/40' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users2 className="w-4 h-4 text-emerald-400" />
                <span>Staff & Referral System</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-bold">
                {portalStore.staff.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveModule('applications');
                setIsMobileDrawerOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer min-h-[44px] ${
                activeModule === 'applications' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Application Processing</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {applications.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveModule('payments');
                setIsMobileDrawerOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer min-h-[44px] ${
                activeModule === 'payments' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4" />
                <span>Payment Verification</span>
              </div>
              {pendingPayments > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold">
                  {pendingPayments}
                </span>
              )}
            </button>

            {canManagePayments && (
              <button
                onClick={() => {
                  setActiveModule('payment_settings');
                  setIsMobileDrawerOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer min-h-[44px] ${
                  activeModule === 'payment_settings' ? 'bg-emerald-500/20 text-emerald-300 font-bold ring-1 ring-emerald-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Payment Settings & QR</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-bold">
                  {portalStore.paymentMethods.filter((m) => m.status === 'active').length}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveModule('ballot');
                setIsMobileDrawerOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer min-h-[44px] ${
                activeModule === 'ballot' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Ballot Engine (22 Dec)</span>
            </button>

            <button
              onClick={() => {
                setActiveModule('jobs');
                setIsMobileDrawerOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer min-h-[44px] ${
                activeModule === 'jobs' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Job Vacancies Quotas</span>
            </button>

            <button
              onClick={() => {
                setActiveModule('candidates');
                setIsMobileDrawerOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer min-h-[44px] ${
                activeModule === 'candidates' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Candidate Dossiers</span>
            </button>

            <button
              onClick={() => {
                setActiveModule('notices');
                setIsMobileDrawerOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer min-h-[44px] ${
                activeModule === 'notices' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Official Notices</span>
            </button>

            <button
              onClick={() => {
                setActiveModule('reports');
                setIsMobileDrawerOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer min-h-[44px] ${
                activeModule === 'reports' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Reports & CSV Export</span>
            </button>

            <button
              onClick={() => {
                setActiveModule('audit');
                setIsMobileDrawerOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer min-h-[44px] ${
                activeModule === 'audit' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Immutable Audit Logs</span>
            </button>

            {canManageSettings && (
              <button
                onClick={() => {
                  setActiveModule('settings');
                  setIsMobileDrawerOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer min-h-[44px] ${
                  activeModule === 'settings' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Embassy Legal Settings</span>
              </button>
            )}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-2 text-xs">
          <div className="text-slate-400 text-[11px]">
            Officer: <strong className="text-slate-200">{admin.name}</strong>
          </div>
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onNavigateToPublic}
              className="text-amber-400 hover:text-amber-300 text-[11px] underline cursor-pointer min-h-[44px] flex items-center"
            >
              ← Public Portal
            </button>
            <button
              onClick={onLogoutAdmin}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer text-[11px] min-h-[44px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Toast alert */}
        {notificationMsg && (
          <div className="p-3 bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs rounded-md shadow-lg flex items-center justify-between animate-fadeIn">
            <span>{notificationMsg}</span>
            <button onClick={() => setNotificationMsg(null)} className="text-emerald-400 hover:text-white cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* MODULE: OVERVIEW */}
        {activeModule === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Consular Recruitment Control Console</h2>
                <p className="text-xs text-slate-400">
                  Real-time status of candidate queues, payment verification, and 22 Dec 2026 computerized draw.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportCandidatesCsv}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Metric KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[11px]">Total Registered Candidates</span>
                <span className="text-2xl font-bold font-mono text-white mt-1 block tabular-nums">
                  {totalCandidates}
                </span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[11px]">Total Applications Lodged</span>
                <span className="text-2xl font-bold font-mono text-white mt-1 block tabular-nums">
                  {totalApplications}
                </span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[11px]">Pending Payment Verifications</span>
                <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block tabular-nums">
                  {pendingPayments}
                </span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[11px]">Verified Bank Payments</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block tabular-nums">
                  {verifiedPayments}
                </span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[11px]">Processing Queue Pending</span>
                <span className="text-2xl font-bold font-mono text-sky-400 mt-1 block tabular-nums">
                  {processingPending}
                </span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[11px]">Ballot Eligible (22 Dec)</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block tabular-nums">
                  {ballotEligible}
                </span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[11px]">Selected for Next Stage</span>
                <span className="text-2xl font-bold font-mono text-amber-300 mt-1 block tabular-nums">
                  {selectedNextStage}
                </span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[11px]">Rejected / Closed</span>
                <span className="text-2xl font-bold font-mono text-red-400 mt-1 block tabular-nums">
                  {rejectedApps}
                </span>
              </div>
            </div>

            {/* Quick Action Queue Previews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Applications table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">Recent Application Filings</h3>
                  <button
                    onClick={() => setActiveModule('applications')}
                    className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    View All Queue →
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  {applications.slice(0, 5).map((app) => (
                    <div
                      key={app.id}
                      className="p-3 bg-slate-800/60 rounded border border-slate-700/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono font-bold text-white">{app.trackingId}</div>
                        <div className="text-slate-400">{app.candidateName} · {app.jobTitle}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-emerald-400 block">{app.status}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{app.appliedDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statutory Legal Status Notice Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-white">Statutory Authority & Compliance Status</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-800/80 rounded border border-slate-700 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Public Entity Title:</span>
                    <div className="text-white font-semibold">{settings.activePublicName}</div>
                    <span className="text-[11px] text-slate-400 block">
                      Status: {settings.isEmbassyAuthorized ? 'Officially Verified Diplomatic Quota' : 'Temporary Public Title (Embassy Unverified)'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded border border-slate-700 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Application Fee Collection:</span>
                    <div className="text-amber-300 font-semibold font-mono">
                      PKR {settings.feeAmountPKR.toLocaleString()} ({settings.feeCollectionAuthorized ? 'COLLECTION ACTIVE' : 'COLLECTION DISABLED'})
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded border border-slate-700 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Scheduled Ballot:</span>
                    <div className="text-white font-mono font-semibold">{settings.ballotDate}</div>
                    <span className="text-[11px] text-slate-400 block">
                      Eligible Pool: <strong className="text-emerald-400">{ballotEligible} candidates</strong> ready for computerized draw
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE: STAFF MANAGEMENT & REFERRAL EARNINGS SYSTEM */}
        {activeModule === 'staff' && (
          <StaffManagementModule
            admin={admin}
            applications={applications}
            settings={settings}
            onFlashMessage={(msg) => setNotificationMsg(msg)}
          />
        )}

        {/* MODULE: APPLICATIONS PROCESSING */}
        {activeModule === 'applications' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Application Review & Processing Queue</h2>
                <p className="text-xs text-slate-400">
                  Review submitted dossiers, authenticate CNIC/passports, and approve for ballot eligibility.
                </p>
              </div>
              <input
                type="text"
                placeholder="Search Tracking ID, Name, CNIC..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white w-64 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Tracking ID</th>
                      <th className="py-3 px-4">Applicant & CNIC</th>
                      <th className="py-3 px-4">Job Quota</th>
                      <th className="py-3 px-4">App Status</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Next Stage</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {applications
                      .filter((a) =>
                        a.trackingId.toLowerCase().includes(appSearch.toLowerCase()) ||
                        a.candidateName.toLowerCase().includes(appSearch.toLowerCase()) ||
                        a.candidateCnic.includes(appSearch)
                      )
                      .map((app) => (
                        <tr key={app.id} className="hover:bg-slate-800/50">
                          <td className="py-3 px-4 font-mono font-bold text-amber-300">
                            {app.trackingId}
                          </td>
                          <td className="py-3 px-4">
                            <strong className="text-white block">{app.candidateName}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">{app.candidateCnic}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {app.jobTitle}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              app.status === 'Ballot Eligible' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                              app.status === 'Rejected' ? 'bg-red-950 text-red-300 border border-red-800' :
                              'bg-sky-950 text-sky-300 border border-sky-800'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span className={app.paymentStatus === 'Verified' ? 'text-emerald-400' : 'text-amber-400'}>
                              {app.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {app.nextStageStatus}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {canManageRecruitment && app.status !== 'Ballot Eligible' && (
                              <button
                                onClick={() => {
                                  portalStore.approveApplicationProcessing(app.id);
                                  flashMessage(`Application ${app.trackingId} approved as Ballot Eligible.`);
                                }}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-semibold cursor-pointer"
                              >
                                Approve
                              </button>
                            )}

                            {canManageRecruitment && app.status !== 'Rejected' && (
                              <button
                                onClick={() => {
                                  setRejectAppId(app.id);
                                }}
                                className="px-2 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 rounded text-[11px] cursor-pointer"
                              >
                                Reject
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setNextStageAppId(app.id);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] cursor-pointer border border-slate-700"
                            >
                              Status
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reject Modal */}
            {rejectAppId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
                  <h3 className="font-bold text-sm text-red-400">Reject Recruitment Application</h3>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">State Reason for Rejection:</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setRejectAppId(null)}
                      className="px-3 py-1.5 border border-slate-700 rounded text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        portalStore.rejectApplication(rejectAppId, rejectReason);
                        setRejectAppId(null);
                        flashMessage('Application rejected.');
                      }}
                      className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white font-semibold rounded cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Next Stage Modal */}
            {nextStageAppId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
                  <h3 className="font-bold text-sm text-amber-300">Update Next-Stage Approval Status</h3>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Select Stage:</label>
                    <select
                      value={nextStageSelection}
                      onChange={(e) => setNextStageSelection(e.target.value as NextStageStatus)}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    >
                      <option value="Selected for Next Stage">Selected for Next Stage</option>
                      <option value="Interview Scheduled">Interview Scheduled</option>
                      <option value="Medical Examination Pending">Medical Examination Pending</option>
                      <option value="Employer Review Pending">Employer Review Pending</option>
                      <option value="Final Decision Pending">Final Decision Pending</option>
                      <option value="Further Documents Required">Further Documents Required</option>
                      <option value="Not Selected">Not Selected</option>
                      <option value="Application Closed">Application Closed</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setNextStageAppId(null)}
                      className="px-3 py-1.5 border border-slate-700 rounded text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        portalStore.updateNextStageStatus(nextStageAppId, nextStageSelection);
                        setNextStageAppId(null);
                        flashMessage(`Updated status to ${nextStageSelection}`);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded cursor-pointer"
                    >
                      Save Status
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODULE: PAYMENT VERIFICATION & RECONCILIATION QUEUE */}
        {activeModule === 'payments' && (() => {
          const filteredPayments = payments.filter((p) => {
            if (paymentFilter === 'pending') return p.status === 'Submitted for Verification' || p.status === 'Pending';
            if (paymentFilter === 'verified') return p.status === 'Verified';
            if (paymentFilter === 'rejected') return p.status === 'Rejected';
            if (paymentFilter === 'duplicate') return p.isDuplicateFlagged;
            return true;
          });

          const duplicateCount = payments.filter((p) => p.isDuplicateFlagged).length;

          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    <span>Candidate Payment Verification Queue</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Inspect candidate deposit proofs, reconcile bank journal references, and approve verified fees.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-amber-300 font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                    Approved Fee: <strong>PKR {settings.feeAmountPKR.toLocaleString()}</strong>
                  </div>
                  <button
                    onClick={() => setActiveModule('payment_settings')}
                    className="px-3 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Manage Gateways</span>
                  </button>
                </div>
              </div>

              {/* Statutory Review Warning */}
              <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs flex items-start gap-2.5 shadow-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Mandatory Verification Protocol:</strong> Never automatically approve a payment based solely on an uploaded screenshot. Consular finance officers must independently match the transaction reference against the official bank account ledger before marking a candidate as verified.
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setPaymentFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap min-h-[38px] ${
                    paymentFilter === 'all'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All Submissions ({payments.length})
                </button>
                <button
                  onClick={() => setPaymentFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap min-h-[38px] ${
                    paymentFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-amber-300 hover:text-white border border-slate-800'
                  }`}
                >
                  Pending Review ({payments.filter((p) => p.status === 'Submitted for Verification' || p.status === 'Pending').length})
                </button>
                <button
                  onClick={() => setPaymentFilter('verified')}
                  className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap min-h-[38px] ${
                    paymentFilter === 'verified'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Verified ({payments.filter((p) => p.status === 'Verified').length})
                </button>
                <button
                  onClick={() => setPaymentFilter('rejected')}
                  className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap min-h-[38px] ${
                    paymentFilter === 'rejected'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Rejected ({payments.filter((p) => p.status === 'Rejected').length})
                </button>
                {duplicateCount > 0 && (
                  <button
                    onClick={() => setPaymentFilter('duplicate')}
                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors whitespace-nowrap min-h-[38px] flex items-center gap-1.5 ${
                      paymentFilter === 'duplicate'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-red-950/60 text-red-300 border border-red-800 hover:bg-red-900'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>Duplicates Flagged ({duplicateCount})</span>
                  </button>
                )}
              </div>

              {/* Mobile Cards (Android 360px-430px optimized) */}
              <div className="md:hidden space-y-3">
                {filteredPayments.length === 0 ? (
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
                    No payment submissions match the selected filter.
                  </div>
                ) : (
                  filteredPayments.map((p) => (
                    <div
                      key={p.id}
                      className={`p-4 bg-slate-900 border rounded-xl space-y-3 text-xs ${
                        p.isDuplicateFlagged ? 'border-red-800/80 bg-red-950/15' : 'border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-mono font-bold text-amber-300 block">{p.trackingId}</span>
                          <strong className="text-white text-xs">{p.candidateName}</strong>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'Verified'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : p.status === 'Rejected'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>

                      {p.isDuplicateFlagged && (
                        <div className="p-2 bg-red-950/70 border border-red-800 rounded text-red-200 text-[11px] font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>Duplicate Reference! Matches tracking {p.duplicateMatchingTrackingId || 'record'}</span>
                        </div>
                      )}

                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Method:</span>
                          <span className="text-slate-300">{p.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Trx Ref:</span>
                          <span className="text-amber-300 font-bold">{p.transactionRef}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Amount:</span>
                          <span className="text-emerald-400 font-bold">PKR {p.amountPKR.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Date:</span>
                          <span className="text-slate-400">{p.paymentDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/70">
                        <button
                          onClick={() => {
                            setViewingReceiptPayment(p);
                            setScreenshotZoom(1);
                          }}
                          className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                        >
                          <Eye className="w-4 h-4 text-amber-400" />
                          <span>View Proof</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {canManagePayments && p.status !== 'Verified' && (
                            <button
                              onClick={() => {
                                portalStore.verifyPayment(p.id, true);
                                flashMessage(`Payment verified for ${p.trackingId}.`);
                              }}
                              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer min-h-[44px]"
                            >
                              Verify
                            </button>
                          )}
                          {canManagePayments && p.status !== 'Rejected' && (
                            <button
                              onClick={() => {
                                const reason = prompt('State rejection reason (e.g. Unreconciled bank statement):');
                                if (reason) {
                                  portalStore.verifyPayment(p.id, false, reason);
                                  flashMessage(`Payment rejected for ${p.trackingId}.`);
                                }
                              }}
                              className="px-3 py-2 bg-red-900/60 hover:bg-red-800 text-red-200 rounded-lg text-xs font-semibold cursor-pointer min-h-[44px]"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs shadow-md">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Tracking ID</th>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Gateway & Snapshot</th>
                      <th className="py-3 px-4">Transaction Reference</th>
                      <th className="py-3 px-4">Receipt / Proof</th>
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Verification Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredPayments.map((p) => (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          p.isDuplicateFlagged ? 'bg-red-950/15' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-amber-300">
                          {p.trackingId}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{p.candidateName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">PKR {p.amountPKR.toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 space-y-0.5">
                          <span className="font-medium text-slate-200 block truncate max-w-[160px]">{p.paymentMethod}</span>
                          {p.accountNumberSnapshot && (
                            <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[160px]">
                              Acc: {p.accountNumberSnapshot}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <span className="font-mono font-semibold text-slate-200 block">{p.transactionRef}</span>
                            {p.isDuplicateFlagged && (
                              <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                                <span>Duplicate Trx Ref ({p.duplicateMatchingTrackingId})</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setViewingReceiptPayment(p);
                              setScreenshotZoom(1);
                            }}
                            className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>View Proof</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {p.paymentDate}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === 'Verified'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : p.status === 'Rejected'
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {canManagePayments && p.status !== 'Verified' && (
                            <button
                              onClick={() => {
                                portalStore.verifyPayment(p.id, true);
                                flashMessage(`Payment verified for ${p.trackingId}.`);
                              }}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-semibold cursor-pointer transition-colors shadow-xs"
                            >
                              Verify
                            </button>
                          )}
                          {canManagePayments && p.status !== 'Rejected' && (
                            <button
                              onClick={() => {
                                const reason = prompt('State rejection reason (e.g. Unreconciled bank statement, invalid amount):');
                                if (reason) {
                                  portalStore.verifyPayment(p.id, false, reason);
                                  flashMessage(`Payment rejected for ${p.trackingId}.`);
                                }
                              }}
                              className="px-2 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 rounded text-[11px] cursor-pointer transition-colors"
                            >
                              Reject
                            </button>
                          )}
                          {canManagePayments && p.status === 'Verified' && (
                            <button
                              onClick={() => {
                                const ref = prompt('Enter refund banking transaction reference:');
                                if (ref) {
                                  portalStore.recordRefund(p.id, ref);
                                  flashMessage('Refund recorded.');
                                }
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[11px] cursor-pointer border border-slate-700 transition-colors"
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* MODULE: PAYMENT SETTINGS & GATEWAYS MANAGEMENT */}
        {activeModule === 'payment_settings' && (
          <PaymentSettingsModule
            admin={admin}
            settings={settings}
            paymentMethods={portalStore.paymentMethods}
            payments={payments}
            onFlashMessage={(msg) => flashMessage(msg)}
          />
        )}

        {/* MODULE: BALLOT MANAGEMENT (22 DEC 2026) */}
        {activeModule === 'ballot' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Computerized Ballot Engine — 22 December 2026</h2>
              <p className="text-xs text-slate-400">
                Auditable, verifiable selection draw for candidates meeting statutory qualifications and fee criteria.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[11px]">Scheduled Draw Date</span>
                <span className="text-lg font-bold font-mono text-amber-400 mt-1 block">
                  {ballot.scheduledDate}
                </span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[11px]">Cutoff Deadline</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">
                  {ballot.applicationDeadline}
                </span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[11px]">Eligible Pool Size</span>
                <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
                  {ballotEligible} Verified Applicants
                </span>
              </div>
            </div>

            {/* Run Ballot Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-base text-white">Execute Verifiable Computerized Selection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The draw algorithm utilizes a cryptographic hash seed to guarantee deterministic, un-tampered selection across the eligible pool. Selection result stamps are logged into the permanent audit trail.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Positions to Draw:</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={ballotDrawQuota}
                    onChange={(e) => setBallotDrawQuota(Number(e.target.value))}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Custom Audit Proof Seed (Optional):</label>
                  <input
                    type="text"
                    value={ballotSeedInput}
                    onChange={(e) => setBallotSeedInput(e.target.value)}
                    placeholder="Leave blank for auto-generated seed"
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
              </div>

              {canManageRecruitment && (
                <button
                  onClick={() => {
                    if (ballotEligible === 0) {
                      alert('There are no candidates in "Ballot Eligible" status yet. Please approve application processing first.');
                      return;
                    }
                    if (confirm(`Execute computerized ballot draw for ${ballotDrawQuota} candidate positions?`)) {
                      const res = portalStore.executeVerifiableBallot(ballotDrawQuota, ballotSeedInput || undefined);
                      setBallotDrawResult({ count: res.selectedCount, seed: res.seed });
                      flashMessage(`Ballot draw completed! ${res.selectedCount} candidates selected for next stage.`);
                    }
                  }}
                  className="py-2.5 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-colors shadow-xs cursor-pointer"
                >
                  Conduct Computerized Draw
                </button>
              )}

              {ballotDrawResult && (
                <div className="p-4 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-200 text-xs space-y-1 font-mono">
                  <div className="font-bold text-white">Ballot Draw Completed Successfully:</div>
                  <div>Selected Count: {ballotDrawResult.count} Candidates</div>
                  <div>Cryptographic Seed Proof: {ballotDrawResult.seed}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODULE: JOB VACANCIES */}
        {activeModule === 'jobs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Job Vacancies & Quota Management</h2>
                <p className="text-xs text-slate-400">Manage Saudi employer quotas, salary in SAR, and required dossiers.</p>
              </div>
              {canManageRecruitment && (
                <button
                  onClick={() => setIsAddingJob(true)}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Vacancy</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {jobs.map((j) => (
                <div key={j.id} className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{j.title}</h4>
                      <span className="text-slate-400 text-[11px]">{j.employer} · {j.location}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded text-xs bg-slate-800 text-amber-300 font-mono font-bold shrink-0 border border-amber-500/20">
                      {j.salarySAR} SAR
                    </span>
                  </div>

                  {/* Age limit and eligibility badges */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Age Limit:</span>
                      <strong className="text-amber-200">{j.ageLimit || '21 - 40 Years'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Eligibility:</span>
                      <strong className="text-slate-200 line-clamp-1">{j.eligibility || j.qualification}</strong>
                    </div>
                  </div>

                  <p className="text-slate-400 text-[11px] line-clamp-2">{j.description}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                    <span>Positions: {j.positions} | Gender: {j.genderEligibility}</span>
                    {canManageRecruitment && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditJobModal(j)}
                          className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Pencil className="w-3 h-3 text-amber-400" />
                          <span>Edit Vacancy</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete vacancy ${j.title}?`)) {
                              portalStore.deleteJobVacancy(j.id);
                              flashMessage('Vacancy deleted.');
                            }
                          }}
                          className="text-red-400 hover:text-red-300 cursor-pointer ml-1"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Job Modal */}
            {isAddingJob && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white">Create Verified Job Vacancy</h3>
                    <button
                      type="button"
                      onClick={() => setIsAddingJob(false)}
                      className="text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1">Job Title *</label>
                      <input
                        type="text"
                        value={newJobTitle}
                        onChange={(e) => setNewJobTitle(e.target.value)}
                        required
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1">Category *</label>
                        <select
                          value={newJobCategory}
                          onChange={(e) => setNewJobCategory(e.target.value)}
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Monthly Salary (SAR) *</label>
                        <input
                          type="number"
                          value={newJobSalary}
                          onChange={(e) => setNewJobSalary(Number(e.target.value))}
                          required
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1">Age Limit (e.g. 21 - 40 Years) *</label>
                        <input
                          type="text"
                          value={newJobAgeLimit}
                          onChange={(e) => setNewJobAgeLimit(e.target.value)}
                          placeholder="21 - 40 Years"
                          required
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Eligibility Criteria *</label>
                        <input
                          type="text"
                          value={newJobEligibility}
                          onChange={(e) => setNewJobEligibility(e.target.value)}
                          placeholder="Physical fitness, valid license, trade diploma..."
                          required
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1">Qualification *</label>
                        <input
                          type="text"
                          value={newJobQualification}
                          onChange={(e) => setNewJobQualification(e.target.value)}
                          required
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Experience Required *</label>
                        <input
                          type="text"
                          value={newJobExperience}
                          onChange={(e) => setNewJobExperience(e.target.value)}
                          required
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1">Quota Positions *</label>
                        <input
                          type="number"
                          value={newJobPositions}
                          onChange={(e) => setNewJobPositions(Number(e.target.value))}
                          required
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Gender *</label>
                        <select
                          value={newJobGender}
                          onChange={(e) => setNewJobGender(e.target.value as any)}
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        >
                          <option value="Any">Equal Opportunity (Any)</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Duty Location in Saudi Arabia *</label>
                      <input
                        type="text"
                        value={newJobLocation}
                        onChange={(e) => setNewJobLocation(e.target.value)}
                        required
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Job Description</label>
                      <textarea
                        value={newJobDesc}
                        onChange={(e) => setNewJobDesc(e.target.value)}
                        rows={3}
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsAddingJob(false)}
                        className="px-3 py-1.5 border border-slate-700 rounded text-slate-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded cursor-pointer"
                      >
                        Create Vacancy
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Job Vacancy Modal (Admin can edit Age Limit, Eligibility, Salary, Quota, etc.) */}
            {editingJob && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400">Vacancy Editor</span>
                      <h3 className="font-bold text-sm text-white">Edit Vacancy: {editingJob.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingJob(null)}
                      className="text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleUpdateJob} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Job Title *</label>
                      <input
                        type="text"
                        value={editJobTitle}
                        onChange={(e) => setEditJobTitle(e.target.value)}
                        required
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">Category *</label>
                        <select
                          value={editJobCategory}
                          onChange={(e) => setEditJobCategory(e.target.value)}
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-amber-300 mb-1 font-semibold">Monthly Salary in SAR *</label>
                        <input
                          type="number"
                          value={editJobSalary}
                          onChange={(e) => setEditJobSalary(Number(e.target.value))}
                          required
                          className="w-full p-2 bg-slate-800 border border-amber-500/50 rounded text-amber-300 font-mono font-bold text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-amber-300 mb-1 font-semibold">Age Limit (e.g. 21 - 40 Years) *</label>
                        <input
                          type="text"
                          value={editJobAgeLimit}
                          onChange={(e) => setEditJobAgeLimit(e.target.value)}
                          placeholder="e.g. 21 - 40 Years"
                          required
                          className="w-full p-2 bg-slate-800 border border-amber-500/50 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-amber-300 mb-1 font-semibold">Eligibility Criteria *</label>
                        <input
                          type="text"
                          value={editJobEligibility}
                          onChange={(e) => setEditJobEligibility(e.target.value)}
                          placeholder="Trade diploma, physical fitness, valid license..."
                          required
                          className="w-full p-2 bg-slate-800 border border-amber-500/50 rounded text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1">Qualification *</label>
                        <input
                          type="text"
                          value={editJobQualification}
                          onChange={(e) => setEditJobQualification(e.target.value)}
                          required
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Experience Required *</label>
                        <input
                          type="text"
                          value={editJobExperience}
                          onChange={(e) => setEditJobExperience(e.target.value)}
                          required
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1">Quota Positions *</label>
                        <input
                          type="number"
                          value={editJobPositions}
                          onChange={(e) => setEditJobPositions(Number(e.target.value))}
                          required
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Gender *</label>
                        <select
                          value={editJobGender}
                          onChange={(e) => setEditJobGender(e.target.value as any)}
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        >
                          <option value="Any">Equal Opportunity (Any)</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Cutoff Deadline *</label>
                        <input
                          type="date"
                          value={editJobDeadline}
                          onChange={(e) => setEditJobDeadline(e.target.value)}
                          required
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1">Employer / Sponsor Consortium</label>
                        <input
                          type="text"
                          value={editJobEmployer}
                          onChange={(e) => setEditJobEmployer(e.target.value)}
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Duty Location in Saudi Arabia *</label>
                        <input
                          type="text"
                          value={editJobLocation}
                          onChange={(e) => setEditJobLocation(e.target.value)}
                          required
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Job Description & Responsibilities</label>
                      <textarea
                        value={editJobDesc}
                        onChange={(e) => setEditJobDesc(e.target.value)}
                        rows={3}
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingJob(null)}
                        className="px-3.5 py-1.5 border border-slate-700 rounded text-slate-300 cursor-pointer hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded cursor-pointer transition-colors"
                      >
                        Save Vacancy Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODULE: CANDIDATE DOSSIERS */}
        {activeModule === 'candidates' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Registered Candidate Profiles</h2>
              <p className="text-xs text-slate-400">Authenticated candidate records under personal data protections.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">CNIC Number</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">City / Province</th>
                    <th className="py-3 px-4">Qualification</th>
                    <th className="py-3 px-4">Passport Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-bold text-white">{c.fullName}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{c.cnic}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{c.mobile}</td>
                      <td className="py-3 px-4 text-slate-300">{c.city}, {c.province}</td>
                      <td className="py-3 px-4 text-slate-300">{c.education}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">{c.passportStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODULE: AUDIT LOGS */}
        {activeModule === 'audit' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Immutable Administrative Audit Logs</h2>
              <p className="text-xs text-slate-400">Cryptographically verifiable trail of all critical operations.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/50">
                      <td className="py-2.5 px-4 text-slate-400">{log.timestamp}</td>
                      <td className="py-2.5 px-4 text-white font-sans">{log.actor}</td>
                      <td className="py-2.5 px-4 text-amber-300 font-bold">{log.action}</td>
                      <td className="py-2.5 px-4 text-slate-300 font-sans">{log.details}</td>
                      <td className="py-2.5 px-4 text-slate-500">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODULE: REPORTS */}
        {activeModule === 'reports' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Reports & Data Export</h2>
              <p className="text-xs text-slate-400">Generate CSV exports for ministry audits and sponsor quotas.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-white text-sm">Full Candidate Applications Ledger</h4>
                <p className="text-slate-400">
                  Export all applications including Tracking IDs, candidate particulars, fee verification, and next-stage statuses.
                </p>
                <button
                  onClick={exportCandidatesCsv}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded cursor-pointer"
                >
                  Download Applications CSV
                </button>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-white text-sm">Ballot Selection Results (22 Dec)</h4>
                <p className="text-slate-400">
                  Export list of selected applicants with cryptographic seed proof for diplomatic observers.
                </p>
                <button
                  onClick={() => {
                    const selected = applications.filter((a) => a.nextStageStatus === 'Selected for Next Stage');
                    if (selected.length === 0) {
                      alert('No candidates currently have "Selected for Next Stage" status.');
                      return;
                    }
                    exportCandidatesCsv();
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded cursor-pointer"
                >
                  Export Ballot Selection CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODULE: STAFF MANAGEMENT & REFERRAL EARNINGS SYSTEM */}
        {activeModule === 'staff' && (
          <StaffManagementModule
            admin={admin}
            applications={applications}
            settings={settings}
            onFlashMessage={flashMessage}
          />
        )}

        {/* MODULE: SETTINGS & LEGAL EMBASSY AUTHORIZATION */}
        {activeModule === 'settings' && canManageSettings && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Recruitment Authorization & Statutory Governance</h2>
              <p className="text-xs text-slate-400">
                Configure official entity title and statutory application fee controls.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 text-xs max-w-2xl">
              {/* Organization name toggle */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-white">1. Diplomatic Organization Title Verification</h3>
                <p className="text-slate-400 leading-relaxed">
                  The proposed organization name is <strong>"Royal Saudi Embassy in Islamabad"</strong>. Compliance requires verified written diplomatic authorization before switching from the temporary public name.
                </p>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Written Authorization Permit / Gazette Reference:
                  </label>
                  <input
                    type="text"
                    value={authPermitRef}
                    onChange={(e) => setAuthPermitRef(e.target.value)}
                    placeholder="e.g. MFA/SAU-ISB/2026/AUTH-088"
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Leaving this empty keeps the compliant temporary title: <em>"{settings.temporaryPublicName}"</em>.
                  </span>
                </div>
              </div>

              {/* Fee Authorization Toggle */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="font-bold text-sm text-white">2. Application Fee Collection Authorization</h3>
                <p className="text-slate-400 leading-relaxed">
                  The PKR {settings.feeAmountPKR.toLocaleString()} administrative processing fee must remain disabled until the operator has verified legal authority to charge it.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="feeAuthCheck"
                    checked={enableFeeCollection}
                    onChange={(e) => setEnableFeeCollection(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded bg-slate-800 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="feeAuthCheck" className="text-white font-medium cursor-pointer">
                    Enable PKR 4,500 Fee Collection (Statutory Authority Verified)
                  </label>
                </div>
              </div>

              {/* Ballot Date */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="font-bold text-sm text-white">3. Proposed Ballot Date Configuration</h3>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ballot Date:</label>
                  <input
                    type="date"
                    value={ballotDateInput}
                    onChange={(e) => setBallotDateInput(e.target.value)}
                    className="w-full sm:w-64 p-2 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded cursor-pointer"
                >
                  Save Statutory Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Payment Screenshot Inspection Modal */}
      {viewingReceiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden my-auto text-xs animate-fadeIn">
            {/* Modal Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
                  Candidate Payment Verification & Audit
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <span>Bank Deposit Screenshot — {viewingReceiptPayment.trackingId}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    viewingReceiptPayment.status === 'Verified' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                    viewingReceiptPayment.status === 'Rejected' ? 'bg-red-950 text-red-300 border border-red-700' :
                    'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}>
                    {viewingReceiptPayment.status}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setViewingReceiptPayment(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Meta Info Strip */}
            <div className="bg-slate-800/80 px-6 py-3 border-b border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Candidate Applicant:</span>
                <strong className="text-white text-xs">{viewingReceiptPayment.candidateName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Payment Gateway:</span>
                <strong className="text-white text-xs">{viewingReceiptPayment.paymentMethod || 'Official QR Gateway'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Transaction Ref / Journal:</span>
                <strong className="text-amber-300 font-mono text-xs">{viewingReceiptPayment.transactionRef}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Deposit Amount & Date:</span>
                <strong className="text-emerald-400 font-mono text-xs">PKR {viewingReceiptPayment.amountPKR.toLocaleString()} · {viewingReceiptPayment.paymentDate}</strong>
              </div>
            </div>

            {/* Toolbar for image */}
            <div className="bg-slate-900 px-6 py-2 border-b border-slate-800 flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono">
                File: {viewingReceiptPayment.receiptFileName || 'deposit_receipt.jpg'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScreenshotZoom((z) => Math.max(0.7, z - 0.2))}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-slate-400 px-1">{Math.round(screenshotZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setScreenshotZoom((z) => Math.min(2.0, z + 0.2))}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow && viewingReceiptPayment.receiptImageData) {
                      printWindow.document.write(`
                        <html><head><title>Receipt Slip ${viewingReceiptPayment.trackingId}</title></head>
                        <body style="margin:0;display:flex;justify-content:center;align-items:center;padding:20px;">
                          <img src="${viewingReceiptPayment.receiptImageData}" style="max-width:100%;height:auto;"/>
                        </body></html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      printWindow.print();
                    }
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>

            {/* Screenshot Display Viewport */}
            <div className="p-6 overflow-auto max-h-[58vh] bg-slate-950 flex items-center justify-center min-h-[320px]">
              {viewingReceiptPayment.receiptImageData ? (
                <div
                  style={{ transform: `scale(${screenshotZoom})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
                  className="shadow-2xl rounded-lg overflow-hidden border border-slate-700"
                >
                  <img
                    src={viewingReceiptPayment.receiptImageData}
                    alt={`Payment receipt for ${viewingReceiptPayment.trackingId}`}
                    className="max-w-full h-auto object-contain block mx-auto"
                  />
                </div>
              ) : (
                <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-xl space-y-3 max-w-md">
                  <FileText className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-slate-300 font-semibold">Deposit Reference Registered via Bank Journal</p>
                  <p className="text-slate-500 text-[11px]">
                    Candidate filed voucher ref <strong className="text-amber-300 font-mono">{viewingReceiptPayment.transactionRef}</strong>.
                    File name: {viewingReceiptPayment.receiptFileName}.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Bottom Controls */}
            <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-slate-400 text-[11px]">
                {viewingReceiptPayment.verifiedBy && (
                  <span>Verified by: <strong className="text-slate-200">{viewingReceiptPayment.verifiedBy}</strong> on {viewingReceiptPayment.verifiedAt}</span>
                )}
                {viewingReceiptPayment.rejectionReason && (
                  <span className="text-red-400">Rejection note: {viewingReceiptPayment.rejectionReason}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingReceiptPayment(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium cursor-pointer"
                >
                  Close
                </button>

                {canManagePayments && viewingReceiptPayment.status !== 'Rejected' && (
                  <button
                    type="button"
                    onClick={() => {
                      const reason = prompt('State rejection reason (e.g. Unreconciled bank statement, invalid amount):');
                      if (reason) {
                        portalStore.verifyPayment(viewingReceiptPayment.id, false, reason);
                        setViewingReceiptPayment({ ...viewingReceiptPayment, status: 'Rejected', rejectionReason: reason });
                        flashMessage(`Payment for ${viewingReceiptPayment.trackingId} rejected.`);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-200 rounded font-semibold cursor-pointer"
                  >
                    Reject Payment
                  </button>
                )}

                {canManagePayments && viewingReceiptPayment.status !== 'Verified' && (
                  <button
                    type="button"
                    onClick={() => {
                      portalStore.verifyPayment(viewingReceiptPayment.id, true);
                      setViewingReceiptPayment({ ...viewingReceiptPayment, status: 'Verified' });
                      flashMessage(`Payment verified successfully for ${viewingReceiptPayment.trackingId}.`);
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Verify & Approve Payment</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
