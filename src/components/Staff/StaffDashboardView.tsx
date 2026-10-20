import React, { useState } from 'react';
import {
  StaffUser,
  Application,
  BonusTier,
  StaffBonusRecord,
  SystemSettings,
  StaffPerformanceSummary,
} from '../../types';
import { portalStore } from '../../services/store';
import {
  Share2,
  Copy,
  Check,
  TrendingUp,
  Award,
  Users,
  DollarSign,
  Lock,
  LogOut,
  QrCode,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  Home,
  FileText,
  KeyRound,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  X,
  Phone,
  Mail,
  User,
  Sparkles,
  Smartphone,
  Wallet,
} from 'lucide-react';

interface StaffDashboardViewProps {
  staff: StaffUser;
  applications: Application[];
  bonusTiers: BonusTier[];
  bonusRecords: StaffBonusRecord[];
  settings: SystemSettings;
  onLogout: () => void;
  onNavigateToPublic: () => void;
}

export const StaffDashboardView: React.FC<StaffDashboardViewProps> = ({
  staff,
  applications,
  bonusTiers,
  bonusRecords,
  settings,
  onLogout,
  onNavigateToPublic,
}) => {
  // Navigation tabs for mobile bottom navigation & desktop switcher
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'bonus' | 'profile'>('overview');

  // Interactive UI states
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Mandatory / Voluntary Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(staff.mustChangePassword);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Profile edit state
  const [phoneInput, setPhoneInput] = useState(staff.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Staff Payout Wallet State (JazzCash / EasyPaisa / Raast)
  const [payoutMethod, setPayoutMethod] = useState<'JazzCash' | 'EasyPaisa' | 'Raast' | 'Bank Transfer'>(
    staff.payoutMethod || 'JazzCash'
  );
  const [payoutAccountTitle, setPayoutAccountTitle] = useState(
    staff.payoutAccountTitle || staff.fullName || ''
  );
  const [payoutAccountNumber, setPayoutAccountNumber] = useState(
    staff.payoutAccountNumber || staff.phone || ''
  );
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  // Calculate authoritative performance metrics directly for THIS staff member
  const performance: StaffPerformanceSummary = portalStore.getStaffPerformance(staff.id);

  // Filter referrals tied to this staff member (ensuring strict confidentiality)
  const myReferrals = applications.filter(
    (a) =>
      a.referredByStaffId === staff.id ||
      (a.referralCode && a.referralCode.toUpperCase() === staff.referralCode.toUpperCase())
  );

  const filteredReferrals = myReferrals.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      a.trackingId.toLowerCase().includes(q) ||
      a.candidateName.toLowerCase().includes(q) ||
      a.jobTitle.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (paymentFilter === 'verified') return a.paymentStatus === 'Verified';
    if (paymentFilter === 'pending') return a.paymentStatus !== 'Verified';
    return true;
  });

  // Filter bonus records for this staff member
  const myBonusRecords = bonusRecords.filter((b) => b.staffId === staff.id);

  // Referral link builder
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://saudijobs.pk';
  const referralLink = `${baseUrl}?ref=${staff.referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setNotification('Referral link copied to clipboard!');
    setTimeout(() => {
      setCopiedLink(false);
      setNotification(null);
    }, 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(staff.referralCode);
    setCopiedCode(true);
    setNotification(`Referral code ${staff.referralCode} copied!`);
    setTimeout(() => {
      setCopiedCode(false);
      setNotification(null);
    }, 2500);
  };

  const handleShareWhatsApp = () => {
    const message = `Assalam-o-Alaikum! Apply for verified Saudi Arabia employment visas & work permits directly through the official Pakistan recruitment portal. Use my official Staff Referral Code: *${staff.referralCode}* to register your application:\n\n${referralLink}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Apply for Saudi Jobs - Ref: ${staff.referralCode}`,
          text: `Apply for verified Saudi Arabia work permits via official recruitment portal. Reference: ${staff.referralCode}`,
          url: referralLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please verify both fields.');
      return;
    }

    portalStore.changeStaffPassword(newPassword);
    setPasswordSuccess(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordSuccess(false);
      setNewPassword('');
      setConfirmPassword('');
      setNotification('Account password updated successfully.');
    }, 1200);
  };

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    portalStore.updateStaff(staff.id, { phone: phoneInput.trim() });
    setIsUpdatingProfile(false);
    setNotification('Contact phone number updated.');
    setTimeout(() => setNotification(null), 2500);
  };

  const handleSavePayoutWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAccountNumber.trim()) {
      setNotification('Please enter your JazzCash or EasyPaisa mobile account number.');
      return;
    }
    const res = portalStore.updateStaffPayoutAccount(staff.id, {
      payoutMethod,
      payoutAccountTitle: payoutAccountTitle.trim() || staff.fullName,
      payoutAccountNumber: payoutAccountNumber.trim(),
    });
    if (res.success) {
      setPayoutSuccessMsg(res.message);
      setNotification(res.message);
      setTimeout(() => {
        setPayoutSuccessMsg(null);
        setNotification(null);
      }, 3500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-12 antialiased selection:bg-emerald-700 selection:text-white">
      {/* Top Mobile & Desktop Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0 border border-emerald-500/30">
              {staff.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white truncate">
                  {staff.fullName}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/60 uppercase shrink-0">
                  {staff.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {staff.role.replace(/_/g, ' ')} · Ref: <span className="font-mono text-amber-300 font-bold">{staff.referralCode}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToPublic}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer min-h-[44px]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Portal</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/70 border border-red-800/60 rounded-lg transition-colors cursor-pointer min-h-[44px]"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="max-w-6xl mx-auto hidden md:flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'referrals'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>My Referrals ({myReferrals.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('bonus')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'bonus'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Bonus & Targets</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account & Security</span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] p-3 bg-emerald-900 border border-emerald-600 text-white text-xs rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-300 hover:text-white cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Responsive Canvas (360px-430px mobile first) */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Hero Banner with Referral Code & Direct Share */}
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border border-emerald-800/60 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Active Staff Field Accreditation
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                      Personal Candidate Referral Hub
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Share your unique referral link with prospective applicants. Every candidate who completes verified payment unlocks monthly performance bonuses for you.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowQrModal(true)}
                    className="self-start sm:self-auto px-3 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-amber-300 font-semibold flex items-center gap-2 cursor-pointer transition-colors min-h-[44px]"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Show QR Code</span>
                  </button>
                </div>

                {/* Referral Code & Link Box with Touch-Friendly Tap-to-Copy */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Your Unique Referral Code:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xl sm:text-2xl font-bold text-amber-400 tracking-wider">
                          {staff.referralCode}
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Copy Code"
                        >
                          {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Touch-Friendly Share Action Buttons (Min 44px) */}
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <button
                        onClick={handleCopyLink}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px] shadow-md active:scale-98"
                      >
                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                      </button>

                      <button
                        onClick={handleShareWhatsApp}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px] shadow-md active:scale-98"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={handleNativeShare}
                        className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex items-center justify-center cursor-pointer transition-colors min-h-[44px] min-w-[44px]"
                        title="Share Options"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-slate-400 truncate select-all text-[11px]">
                      {referralLink}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase shrink-0">
                      Auto-Attributed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Target Progress Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    Target Cycle: {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <h3 className="font-bold text-lg text-white">Monthly Target & Milestone Progress</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {performance.targetProgressPercent}%
                  </span>
                  <span className="text-[11px] text-slate-400 block">Quota Completion</span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>
                    Verified Paid Candidates: <strong className="text-white font-mono">{performance.verifiedPaidReferrals}</strong> / {performance.monthlyTarget} Target
                  </span>
                  <span className="font-semibold text-amber-300">
                    {performance.monthlyTarget - performance.verifiedPaidReferrals > 0
                      ? `${performance.monthlyTarget - performance.verifiedPaidReferrals} more to target`
                      : '🎯 Target Achieved!'}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${performance.targetProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* Bonus Tier Milestone Preview */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Current Milestone Achieved:</span>
                    <strong className="text-amber-300 font-bold text-sm">
                      {performance.currentTierName}
                    </strong>
                  </div>
                </div>

                {performance.nextTier ? (
                  <div className="text-left sm:text-right text-[11px] text-slate-400">
                    Next Tier: <strong className="text-white font-bold">{performance.nextTier.tierName}</strong>
                    <div className="text-emerald-400 font-semibold">
                      Need {performance.nextTier.neededReferrals} verified referrals for PKR {performance.nextTier.potentialBonusPKR.toLocaleString()} bonus
                    </div>
                  </div>
                ) : (
                  <div className="text-emerald-400 font-bold text-[11px]">
                    Top tier milestone unlocked!
                  </div>
                )}
              </div>
            </div>

            {/* Key Metrics Grid (Stacked cards on mobile) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Total Referrals</span>
                  <Users className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {performance.totalReferrals}
                </div>
                <div className="text-[11px] text-slate-400">
                  {performance.validReferrals} active dossiers
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-emerald-900/60 rounded-2xl space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Verified Paid</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {performance.verifiedPaidReferrals}
                </div>
                <div className="text-[11px] text-emerald-300/80">
                  Fee authenticated
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-amber-900/60 rounded-2xl space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-amber-400">
                  <span>Verified Revenue</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 truncate">
                  PKR {performance.verifiedRevenuePKR.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">
                  100% genuine received
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Eligible Bonus</span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
                  PKR {performance.eligibleBonusPKR.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-400">
                  PKR {performance.paidBonusPKR.toLocaleString()} disbursed
                </div>
              </div>
            </div>

            {/* Recent Referrals Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">Recent Candidate Submissions</h3>
                <button
                  onClick={() => setActiveTab('referrals')}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer min-h-[44px]"
                >
                  <span>View All ({myReferrals.length})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {myReferrals.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <p className="text-xs">You have not registered any candidate referrals yet.</p>
                  <p className="text-[11px] text-slate-500">
                    Share your referral code <strong className="text-amber-300 font-mono">{staff.referralCode}</strong> to start earning bonuses.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myReferrals.slice(0, 3).map((ref) => (
                    <div
                      key={ref.id}
                      className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate">{ref.candidateName}</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                            {ref.trackingId}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {ref.jobTitle} · Applied: {ref.appliedDate}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ref.paymentStatus === 'Verified'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                              : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                          }`}
                        >
                          {ref.paymentStatus === 'Verified' ? 'Fee Verified ✓' : 'Payment Pending'}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          PKR {settings.feeAmountPKR.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY REFERRALS */}
        {activeTab === 'referrals' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Attributed Candidate Dossiers</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  All applicants registered using referral code <span className="font-mono text-amber-300">{staff.referralCode}</span>.
                </p>
              </div>

              <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg w-fit">
                {performance.verifiedPaidReferrals} Verified / {myReferrals.length} Total
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by candidate name, Tracking ID, or vacancy..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaymentFilter('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors min-h-[44px] ${
                    paymentFilter === 'all'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All ({myReferrals.length})
                </button>
                <button
                  onClick={() => setPaymentFilter('verified')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors min-h-[44px] ${
                    paymentFilter === 'verified'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Verified Fee ({myReferrals.filter((a) => a.paymentStatus === 'Verified').length})
                </button>
                <button
                  onClick={() => setPaymentFilter('pending')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors min-h-[44px] ${
                    paymentFilter === 'pending'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Pending Fee
                </button>
              </div>
            </div>

            {/* Referrals List - Mobile-Friendly Stacked Cards */}
            {filteredReferrals.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="font-bold text-white text-sm">No matching candidate dossiers found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery ? 'Try clearing your search query or switching filters.' : 'Share your referral code STF-TRQ-9021 with candidates to register them under your portfolio.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReferrals.map((app) => {
                  const isVerified = app.paymentStatus === 'Verified';
                  // Sensitive CNIC Masking e.g. 37405-*****-2 for data privacy
                  const maskedCnic = app.candidateCnic
                    ? app.candidateCnic.length >= 7
                      ? `${app.candidateCnic.substring(0, 5)}-*****-${app.candidateCnic.slice(-1)}`
                      : app.candidateCnic
                    : 'Unregistered';

                  return (
                    <div
                      key={app.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex items-center justify-center font-bold text-xs shrink-0">
                            {app.candidateName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{app.candidateName}</h4>
                            <span className="font-mono text-[11px] text-amber-300 font-bold">
                              Tracking ID: {app.trackingId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isVerified
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80'
                                : 'bg-amber-950 text-amber-300 border border-amber-700/80'
                            }`}
                          >
                            {isVerified ? 'Fee Verified ✓' : 'Payment Under Review'}
                          </span>
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {app.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Designated Job:</span>
                          <span className="font-medium text-slate-200 truncate block">{app.jobTitle}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Candidate CNIC:</span>
                          <span className="font-mono text-slate-300">{maskedCnic}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">City / Province:</span>
                          <span className="text-slate-300">{app.candidateCity}, {app.candidateProvince}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Lodged Date:</span>
                          <span className="font-mono text-slate-400">{app.appliedDate}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Referral attribution validated</span>
                        </span>
                        <span className="font-semibold text-slate-300">
                          Fee Value: <strong className="text-white font-mono">PKR {settings.feeAmountPKR.toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BONUS & TARGETS */}
        {activeTab === 'bonus' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Bonus Structure & Earnings Ledger</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Transparent milestone-based bonus calculation and banking disbursement records.
              </p>
            </div>

            {/* Earnings Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-2xl space-y-1">
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                  Total Disbursed / Paid
                </span>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  PKR {performance.paidBonusPKR.toLocaleString()}
                </div>
                <p className="text-[11px] text-emerald-300/80">
                  Transferred via verified banking rails
                </p>
              </div>

              <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-2xl space-y-1">
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                  Approved & Pending Payout
                </span>
                <div className="text-2xl font-bold font-mono text-amber-300">
                  PKR {performance.approvedBonusPKR.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400">
                  Signed off by Chief Administrative Officer
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                  Eligible Current Month Bonus
                </span>
                <div className="text-2xl font-bold font-mono text-white">
                  PKR {performance.eligibleBonusPKR.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400">
                  Based on {performance.verifiedPaidReferrals} verified referrals
                </p>
              </div>
            </div>

            {/* Official Configurable Bonus Tiers Ladder */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">Authorized Bonus Tiers & Commission Schedule</h3>
                <p className="text-xs text-slate-400">
                  Fixed incentive amounts plus % commissions credited once candidate payment is verified.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {bonusTiers.map((tier) => {
                  const isCurrent = performance.currentTierName === tier.tierName;
                  return (
                    <div
                      key={tier.id}
                      className={`p-4 rounded-xl border space-y-2 transition-all ${
                        isCurrent
                          ? 'bg-amber-950/30 border-amber-500/80 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{tier.tierName}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-slate-950 uppercase">
                            Achieved
                          </span>
                        )}
                      </div>

                      <div className="text-lg font-bold font-mono text-amber-300">
                        PKR {tier.bonusAmountPKR.toLocaleString()}
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                        <div>Min Verified: <strong className="text-white">{tier.minVerifiedReferrals} Candidates</strong></div>
                        <div>Commission: <strong className="text-emerald-400">{tier.commissionPercent}% on Revenue</strong></div>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-tight">
                        {tier.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Configured Payout Wallet Info Banner */}
            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Configured Commission Payout Wallet:
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      payoutMethod === 'EasyPaisa' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'
                    }`}>
                      {payoutMethod}
                    </span>
                  </div>
                  <div className="text-white font-bold text-sm font-mono mt-0.5">
                    {payoutAccountNumber || 'No account configured'}
                    {payoutAccountTitle && <span className="font-sans font-normal text-slate-300 text-xs ml-2">({payoutAccountTitle})</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Admin disburses approved bonuses and commissions directly to this {payoutMethod} account.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold shrink-0 cursor-pointer transition-colors"
              >
                Change Wallet
              </button>
            </div>

            {/* Official Bonus Disbursement Ledger */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">Staff Bonus Claims & Disbursement Ledger</h3>
                <p className="text-xs text-slate-400">
                  Bank transfer references and administrative approval audit logs.
                </p>
              </div>

              {myBonusRecords.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No bonus payout records yet. Continue registering verified candidates to qualify.
                </div>
              ) : (
                <div className="space-y-3">
                  {myBonusRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{record.tierName}</span>
                            <span className="font-mono text-slate-400 text-[11px]">Cycle: {record.month}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {record.verifiedReferralsCount} verified candidates · Revenue: PKR {record.verifiedRevenuePKR.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold font-mono text-amber-300">
                            PKR {record.bonusAmountPKR.toLocaleString()}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              record.status === 'Disbursed / Paid'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80'
                                : record.status === 'Approved'
                                ? 'bg-amber-950 text-amber-300 border border-amber-700/80'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {record.status}
                          </span>
                        </div>
                      </div>

                      {record.paidRef && (
                        <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                          <span className="text-emerald-200">
                            Bank Disbursement Ref: <strong className="font-mono text-white">{record.paidRef}</strong>
                          </span>
                          <span className="text-slate-400 font-mono">Paid Date: {record.paidAt}</span>
                        </div>
                      )}

                      {record.notes && (
                        <p className="text-[11px] text-slate-400 italic">
                          Notes: {record.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE & SECURITY */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-2xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Staff Profile & Credentials</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your authorized consular field credentials and login credentials.
              </p>
            </div>

            {/* Officer Details Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg text-xs">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">
                Accreditation Particulars
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Full Legal Name:</span>
                  <span className="font-bold text-white text-sm">{staff.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Staff Username:</span>
                  <span className="font-mono text-slate-300 font-semibold">{staff.username}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Official Email:</span>
                  <span className="font-mono text-slate-300">{staff.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Operational Role:</span>
                  <span className="text-amber-400 font-semibold capitalize">{staff.role.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Unique Referral Code:</span>
                  <span className="font-mono text-emerald-400 font-bold">{staff.referralCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Account Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">{staff.status}</span>
                </div>
              </div>

              {/* Editable Phone */}
              <form onSubmit={handleSavePhone} className="pt-3 border-t border-slate-800 space-y-2">
                <label className="block text-slate-300 font-semibold">Contact Mobile Number:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. 0301-5582910"
                    className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono min-h-[44px]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold cursor-pointer transition-colors min-h-[44px]"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>

            {/* Staff Payout Wallet (JazzCash / EasyPaisa) Card */}
            <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Commission & Bonus Payout Wallet</h3>
                    <p className="text-[11px] text-slate-400">Admin sends your verified referral commission directly to this account</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600 uppercase">
                  Active
                </span>
              </div>

              {payoutSuccessMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-200 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{payoutSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSavePayoutWallet} className="space-y-4">
                {/* Wallet Provider Radio Buttons */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">
                    Select Payout Wallet / Account Provider:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('JazzCash')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2.5 ${
                        payoutMethod === 'JazzCash'
                          ? 'bg-rose-950/50 border-rose-500 text-white ring-1 ring-rose-500'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full border border-rose-500 flex items-center justify-center">
                        {payoutMethod === 'JazzCash' && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-rose-300">JazzCash</div>
                        <div className="text-[10px] text-slate-400">Mobile Wallet</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayoutMethod('EasyPaisa')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2.5 ${
                        payoutMethod === 'EasyPaisa'
                          ? 'bg-emerald-950/50 border-emerald-500 text-white ring-1 ring-emerald-500'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full border border-emerald-500 flex items-center justify-center">
                        {payoutMethod === 'EasyPaisa' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-emerald-300">EasyPaisa</div>
                        <div className="text-[10px] text-slate-400">Mobile Account</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayoutMethod('Raast')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2.5 col-span-2 sm:col-span-1 ${
                        payoutMethod === 'Raast'
                          ? 'bg-teal-950/50 border-teal-500 text-white ring-1 ring-teal-500'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full border border-teal-500 flex items-center justify-center">
                        {payoutMethod === 'Raast' && <div className="w-2 h-2 rounded-full bg-teal-500" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-teal-300">Raast / Bank</div>
                        <div className="text-[10px] text-slate-400">Instant Transfer</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Account Title */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Account Title / Beneficiary Name *
                  </label>
                  <input
                    type="text"
                    value={payoutAccountTitle}
                    onChange={(e) => setPayoutAccountTitle(e.target.value)}
                    placeholder="Registered name on your JazzCash or EasyPaisa account"
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs min-h-[44px]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Must match the account title registered with {payoutMethod}.
                  </span>
                </div>

                {/* Mobile / Account Number */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {payoutMethod} Mobile Number / Account Number *
                  </label>
                  <input
                    type="text"
                    value={payoutAccountNumber}
                    onChange={(e) => setPayoutAccountNumber(e.target.value)}
                    placeholder={payoutMethod === 'EasyPaisa' ? 'e.g. 0345-1234567' : 'e.g. 0300-1234567'}
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono min-h-[44px]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer min-h-[44px]"
                >
                  Save {payoutMethod} Payout Details
                </button>
              </form>
            </div>

            {/* Password Change Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-white text-sm">Security & Password Management</h3>
                </div>
                {staff.mustChangePassword && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-600 uppercase">
                    Mandatory Change Required
                  </span>
                )}
              </div>

              {passwordSuccess ? (
                <div className="p-3 bg-emerald-950/70 border border-emerald-700 text-emerald-200 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Password changed successfully. Your account is secured.</span>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                  {passwordError && (
                    <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      New Confidential Password *
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters with letters & numbers"
                      required
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      required
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs min-h-[44px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-colors cursor-pointer min-h-[44px]"
                  >
                    Update Account Password
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mandatory Password Change Blocking Modal (Triggered on First Login) */}
      {isChangingPassword && staff.mustChangePassword && !passwordSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/70 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Mandatory Security Requirement
                </span>
                <h3 className="font-bold text-base text-white">Change Temporary Password</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your staff account was initialized with temporary credentials. For security compliance, you must set a permanent private password before accessing your referral portal.
            </p>

            {passwordError && (
              <div className="p-3 bg-red-950/70 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  New Private Password (Min. 8 characters) *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Set strong confidential password"
                  required
                  autoFocus
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg cursor-pointer transition-colors min-h-[44px]"
              >
                Set Permanent Password & Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Presentation Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-white">In-Person Candidate Registration QR</span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block border-4 border-emerald-600 shadow-xl">
              <div className="w-48 h-48 flex items-center justify-center relative">
                <QrCode className="w-44 h-44 text-slate-950" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="bg-emerald-950 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold shadow-md">
                    {staff.referralCode}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-mono font-bold text-amber-300 text-sm block">
                {staff.referralCode}
              </span>
              <p className="text-[11px] text-slate-400">
                Applicants scan with any Android or iOS camera to immediately open the job portal with your referral code automatically applied.
              </p>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer min-h-[44px]"
            >
              Copy Referral Link
            </button>
          </div>
        </div>
      )}

      {/* Mobile-Friendly Bottom Navigation Bar (Android 360px-430px Optimized) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 backdrop-blur-lg border-t border-slate-800 px-2 py-1 shadow-2xl">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-colors cursor-pointer min-h-[50px] ${
              activeTab === 'overview' ? 'text-emerald-400 font-bold bg-emerald-950/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-colors cursor-pointer min-h-[50px] ${
              activeTab === 'referrals' ? 'text-emerald-400 font-bold bg-emerald-950/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="relative">
              <Users className="w-5 h-5" />
              {myReferrals.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-emerald-500 text-slate-950 font-mono text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {myReferrals.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Referrals</span>
          </button>

          <button
            onClick={() => setActiveTab('bonus')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-colors cursor-pointer min-h-[50px] ${
              activeTab === 'bonus' ? 'text-emerald-400 font-bold bg-emerald-950/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Bonus</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-colors cursor-pointer min-h-[50px] ${
              activeTab === 'profile' ? 'text-emerald-400 font-bold bg-emerald-950/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Account</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
