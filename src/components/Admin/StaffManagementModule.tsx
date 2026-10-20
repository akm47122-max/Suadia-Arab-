import React, { useState } from 'react';
import {
  StaffUser,
  StaffRole,
  StaffStatus,
  BonusTier,
  StaffBonusRecord,
  Application,
  AdminUser,
  SystemSettings,
  StaffPerformanceSummary,
} from '../../types';
import { portalStore } from '../../services/store';
import {
  Users,
  UserPlus,
  Award,
  DollarSign,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  Lock,
  Shield,
  KeyRound,
  Pencil,
  Trash2,
  AlertTriangle,
  TrendingUp,
  X,
  CreditCard,
  FileText,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  Percent,
  Smartphone,
  Wallet,
} from 'lucide-react';

interface StaffManagementModuleProps {
  admin: AdminUser;
  applications: Application[];
  settings: SystemSettings;
  onFlashMessage: (msg: string) => void;
}

export const StaffManagementModule: React.FC<StaffManagementModuleProps> = ({
  admin,
  applications,
  settings,
  onFlashMessage,
}) => {
  // Local reactive copy from store
  const [staffList, setStaffList] = useState<StaffUser[]>(portalStore.staff);
  const [bonusTiers, setBonusTiers] = useState<BonusTier[]>(portalStore.bonusTiers);
  const [bonusRecords, setBonusRecords] = useState<StaffBonusRecord[]>(portalStore.bonusRecords);

  const refreshState = () => {
    setStaffList([...portalStore.staff]);
    setBonusTiers([...portalStore.bonusTiers]);
    setBonusRecords([...portalStore.bonusRecords]);
  };

  // Subtabs within Staff Management
  const [subTab, setSubTab] = useState<'directory' | 'referrals' | 'bonuses' | 'tiers'>('directory');

  // Search & Filters for Staff Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Date Filter for Referral Reports
  const [dateFilterMonth, setDateFilterMonth] = useState<string>('');

  // 1. ADD STAFF MODAL STATE
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('recruitment_officer');
  const [newTarget, setNewTarget] = useState(15);
  const [staffCreationResult, setStaffCreationResult] = useState<{
    staff: StaffUser;
    temporaryPassword: string;
    referralCode: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // 2. EDIT STAFF MODAL STATE
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<StaffRole>('recruitment_officer');
  const [editTarget, setEditTarget] = useState(15);
  const [editPayoutMethod, setEditPayoutMethod] = useState<'JazzCash' | 'EasyPaisa' | 'Raast' | 'Bank Transfer'>('JazzCash');
  const [editPayoutAccountTitle, setEditPayoutAccountTitle] = useState('');
  const [editPayoutAccountNumber, setEditPayoutAccountNumber] = useState('');
  const [copiedWalletStaffId, setCopiedWalletStaffId] = useState<string | null>(null);

  // 3. RESET CREDENTIALS MODAL STATE
  const [resettingStaff, setResettingStaff] = useState<StaffUser | null>(null);
  const [resetResult, setResetResult] = useState<{ username: string; temporaryPassword: string } | null>(null);

  // 4. BONUS APPROVAL & PAYOUT MODALS
  const [approvingBonus, setApprovingBonus] = useState<StaffBonusRecord | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  const [payingBonus, setPayingBonus] = useState<StaffBonusRecord | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [paymentNotesInput, setPaymentNotesInput] = useState('');

  // 5. MANUAL BONUS AWARD MODAL
  const [isAwardingBonus, setIsAwardingBonus] = useState(false);
  const [awardStaffId, setAwardStaffId] = useState('');
  const [awardAmount, setAwardAmount] = useState(5000);
  const [awardMonth, setAwardMonth] = useState(new Date().toISOString().substring(0, 7));
  const [awardTierName, setAwardTierName] = useState('Special Milestone Incentive');
  const [awardNotes, setAwardNotes] = useState('');

  // 6. EDIT TIER MODAL
  const [editingTier, setEditingTier] = useState<BonusTier | null>(null);
  const [tierNameInput, setTierNameInput] = useState('');
  const [tierMinRefsInput, setTierMinRefsInput] = useState(5);
  const [tierBonusPkrInput, setTierBonusPkrInput] = useState(2500);
  const [tierCommissionInput, setTierCommissionInput] = useState(3.0);
  const [tierDescInput, setTierDescInput] = useState('');

  // ---------------------------------------------------------------------------
  // Aggregate Metrics (Strictly Real Ledger - Never trust client guesses)
  // ---------------------------------------------------------------------------
  const totalStaffCount = staffList.length;
  const activeStaffCount = staffList.filter((s) => s.status === 'active').length;

  // Filter valid applications attributed to staff
  const staffAttributedApps = applications.filter(
    (a) => a.referredByStaffId || (a.referralCode && a.referralCode.startsWith('STF-'))
  );

  // Genuinely verified payments ONLY
  const verifiedPaidApps = staffAttributedApps.filter((a) => a.paymentStatus === 'Verified');
  const totalVerifiedReferrals = verifiedPaidApps.length;
  const totalVerifiedRevenuePKR = totalVerifiedReferrals * (settings.feeAmountPKR || 4500);

  // Bonus ledger totals
  const totalPendingBonusesPKR = bonusRecords
    .filter((b) => b.status === 'Pending Review')
    .reduce((sum, b) => sum + b.bonusAmountPKR, 0);

  const totalPaidBonusesPKR = bonusRecords
    .filter((b) => b.status === 'Disbursed / Paid')
    .reduce((sum, b) => sum + b.bonusAmountPKR, 0);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = portalStore.addStaff({
        fullName: newFullName,
        username: newUsername,
        email: newEmail,
        phone: newPhone,
        role: newRole,
        monthlyTarget: newTarget,
      });

      refreshState();
      setStaffCreationResult(res);
      setIsAddingStaff(false);
      // Reset form
      setNewFullName('');
      setNewUsername('');
      setNewEmail('');
      setNewPhone('');
      setNewRole('recruitment_officer');
      setNewTarget(15);
      onFlashMessage(`Staff account created for ${res.staff.fullName} with code ${res.referralCode}`);
    } catch (err: any) {
      alert(err?.message || 'Error creating staff account.');
    }
  };

  const handleOpenEdit = (stf: StaffUser) => {
    setEditingStaff(stf);
    setEditFullName(stf.fullName);
    setEditEmail(stf.email);
    setEditPhone(stf.phone || '');
    setEditRole(stf.role);
    setEditTarget(stf.monthlyTarget || 15);
    setEditPayoutMethod(stf.payoutMethod || 'JazzCash');
    setEditPayoutAccountTitle(stf.payoutAccountTitle || stf.fullName);
    setEditPayoutAccountNumber(stf.payoutAccountNumber || stf.phone || '');
  };

  const handleUpdateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      portalStore.updateStaff(editingStaff.id, {
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        role: editRole,
        monthlyTarget: Number(editTarget),
        payoutMethod: editPayoutMethod,
        payoutAccountTitle: editPayoutAccountTitle.trim(),
        payoutAccountNumber: editPayoutAccountNumber.trim(),
      });
      refreshState();
      setEditingStaff(null);
      onFlashMessage(`Staff account updated for ${editFullName}`);
    } catch (err: any) {
      alert(err?.message || 'Error updating staff account.');
    }
  };

  const handleToggleStatus = (stf: StaffUser) => {
    const nextStatus: StaffStatus = stf.status === 'active' ? 'suspended' : 'active';
    const confirmMsg =
      nextStatus === 'suspended'
        ? `Are you sure you want to suspend ${stf.fullName}? They will not be able to log in or earn new referrals.`
        : `Reactivate staff member ${stf.fullName}?`;

    if (window.confirm(confirmMsg)) {
      portalStore.setStaffStatus(stf.id, nextStatus);
      refreshState();
      onFlashMessage(`Staff member marked as ${nextStatus}`);
    }
  };

  const handleResetCredentials = (stf: StaffUser) => {
    if (window.confirm(`Generate new temporary credentials for ${stf.fullName} (${stf.username})?`)) {
      try {
        const res = portalStore.resetStaffCredentials(stf.id);
        refreshState();
        setResetResult(res);
        onFlashMessage(`Credentials reset for ${stf.username}`);
      } catch (err: any) {
        alert(err?.message || 'Error resetting credentials.');
      }
    }
  };

  const handleDeleteStaff = (stf: StaffUser) => {
    if (
      window.confirm(
        `Safely deactivate/remove ${stf.fullName}? If active referrals exist, the account will be safely suspended to preserve referral ledger audit history.`
      )
    ) {
      try {
        const res = portalStore.deleteStaff(stf.id);
        refreshState();
        alert(res.message);
        onFlashMessage(res.message);
      } catch (err: any) {
        alert(err?.message || 'Error deleting staff account.');
      }
    }
  };

  const handleApproveBonusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingBonus) return;
    try {
      portalStore.approveStaffBonus(approvingBonus.id, approvalNotes.trim());
      refreshState();
      setApprovingBonus(null);
      setApprovalNotes('');
      onFlashMessage(`Bonus claim #${approvingBonus.id} approved.`);
    } catch (err: any) {
      alert(err?.message || 'Error approving bonus.');
    }
  };

  const handlePayBonusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBonus) return;
    if (!paymentRefInput.trim()) {
      alert('Transaction reference (TID) is required.');
      return;
    }
    try {
      const payingStaff = staffList.find((s) => s.id === payingBonus.staffId);
      const payoutMethod = payingBonus.payoutMethod || payingStaff?.payoutMethod || 'JazzCash';
      const payoutAccountTitle = payingBonus.payoutAccountTitle || payingStaff?.payoutAccountTitle || payingBonus.staffName;
      const payoutAccountNumber = payingBonus.payoutAccountNumber || payingStaff?.payoutAccountNumber || payingStaff?.phone || '0300-1234567';

      portalStore.markStaffBonusPaid(
        payingBonus.id,
        paymentRefInput.trim(),
        paymentNotesInput.trim(),
        {
          payoutMethod,
          payoutAccountTitle,
          payoutAccountNumber,
        }
      );
      refreshState();
      setPayingBonus(null);
      setPaymentRefInput('');
      setPaymentNotesInput('');
      onFlashMessage(`Bonus disbursed to ${payingBonus.staffName} via ${payoutMethod} (${payoutAccountNumber}). Ref: ${paymentRefInput}`);
    } catch (err: any) {
      alert(err?.message || 'Error marking bonus paid.');
    }
  };

  const handleAwardBonusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardStaffId) {
      alert('Please select a staff member.');
      return;
    }
    try {
      portalStore.createBonusAward(
        awardStaffId,
        Number(awardAmount),
        awardMonth,
        awardTierName,
        awardNotes.trim()
      );
      refreshState();
      setIsAwardingBonus(false);
      setAwardNotes('');
      onFlashMessage('Milestone bonus awarded successfully.');
    } catch (err: any) {
      alert(err?.message || 'Error awarding bonus.');
    }
  };

  const handleOpenEditTier = (tier: BonusTier) => {
    setEditingTier(tier);
    setTierNameInput(tier.tierName);
    setTierMinRefsInput(tier.minVerifiedReferrals);
    setTierBonusPkrInput(tier.bonusAmountPKR);
    setTierCommissionInput(tier.commissionPercent);
    setTierDescInput(tier.description);
  };

  const handleSaveTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;
    const updated = bonusTiers.map((t) =>
      t.id === editingTier.id
        ? {
            ...t,
            tierName: tierNameInput.trim(),
            minVerifiedReferrals: Number(tierMinRefsInput),
            bonusAmountPKR: Number(tierBonusPkrInput),
            commissionPercent: Number(tierCommissionInput),
            description: tierDescInput.trim(),
          }
        : t
    );
    portalStore.updateBonusTiers(updated);
    refreshState();
    setEditingTier(null);
    onFlashMessage(`Bonus tier "${tierNameInput}" updated successfully.`);
  };

  // Export Staff & Referral Ledger CSV
  const exportStaffLedgerCsv = () => {
    const headers = [
      'Staff ID',
      'Full Name',
      'Username',
      'Official Email',
      'Role',
      'Account Status',
      'Referral Code',
      'Monthly Target',
      'Total Referrals',
      'Verified Paid Referrals',
      'Verified Revenue Generated (PKR)',
      'Current Bonus Tier',
      'Target Progress %',
      'Total Paid Bonuses (PKR)',
    ];

    const rows = staffList.map((stf) => {
      const perf = portalStore.getStaffPerformance(stf.id);
      return [
        stf.id,
        `"${stf.fullName.replace(/"/g, '""')}"`,
        stf.username,
        stf.email,
        stf.role,
        stf.status,
        stf.referralCode,
        perf.monthlyTarget,
        perf.totalReferrals,
        perf.verifiedPaidReferrals,
        perf.verifiedRevenuePKR,
        perf.currentTierName,
        `${perf.targetProgressPercent}%`,
        perf.paidBonusPKR,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Staff_Referral_Ledger_Export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onFlashMessage('Staff referral ledger exported to CSV successfully.');
  };

  // Filtered staff list for search
  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.referralCode.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (roleFilter !== 'all' && s.role !== roleFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Module Header & High-Level Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Consular Field Operations
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              Admin-Authorized Only
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Staff Management & Referral Earnings System
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Admin-controlled staff creation, unique referral attribution codes, monthly target tracking, verified revenue accounting, and banking bonus disbursement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportStaffLedgerCsv}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors min-h-[44px]"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export Staff CSV</span>
          </button>

          <button
            onClick={() => setIsAddingStaff(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-colors min-h-[44px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 text-xs">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-sm">
          <span className="text-slate-400 text-[11px] block">Total Staff Accounts</span>
          <div className="text-2xl font-bold font-mono text-white">{totalStaffCount}</div>
          <span className="text-[10px] text-emerald-400 font-semibold">No hardcoded limit</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-sm">
          <span className="text-slate-400 text-[11px] block">Active Field Officers</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">{activeStaffCount}</div>
          <span className="text-[10px] text-slate-500">{totalStaffCount - activeStaffCount} suspended</span>
        </div>

        <div className="p-4 bg-slate-900 border border-emerald-950 rounded-2xl space-y-1 shadow-sm">
          <span className="text-slate-400 text-[11px] block">Verified Referrals</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">{totalVerifiedReferrals}</div>
          <span className="text-[10px] text-emerald-400 font-semibold">Fee verified only</span>
        </div>

        <div className="p-4 bg-slate-900 border border-amber-950 rounded-2xl space-y-1 shadow-sm">
          <span className="text-slate-400 text-[11px] block">Verified Revenue (PKR)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 truncate">
            {totalVerifiedRevenuePKR.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Genuinely received</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-sm">
          <span className="text-slate-400 text-[11px] block">Pending Bonuses</span>
          <div className="text-xl font-bold font-mono text-amber-400 truncate">
            PKR {totalPendingBonusesPKR.toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-300">Awaiting approval</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-sm">
          <span className="text-slate-400 text-[11px] block">Disbursed Bonuses</span>
          <div className="text-xl font-bold font-mono text-emerald-400 truncate">
            PKR {totalPaidBonusesPKR.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-300">Paid with bank refs</span>
        </div>
      </div>

      {/* Subtab Navigation (Touch-Friendly min 44px) */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-4 overflow-x-auto text-xs font-semibold scrollbar-none">
        <button
          onClick={() => setSubTab('directory')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer min-h-[44px] whitespace-nowrap ${
            subTab === 'directory'
              ? 'border-emerald-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Staff Directory & Accounts ({staffList.length})
        </button>

        <button
          onClick={() => setSubTab('referrals')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer min-h-[44px] whitespace-nowrap ${
            subTab === 'referrals'
              ? 'border-emerald-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Referral Performance Ledger
        </button>

        <button
          onClick={() => setSubTab('bonuses')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer min-h-[44px] whitespace-nowrap flex items-center gap-2 ${
            subTab === 'bonuses'
              ? 'border-emerald-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Bonus Approvals & Payouts</span>
          {bonusRecords.filter((b) => b.status === 'Pending Review').length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
              {bonusRecords.filter((b) => b.status === 'Pending Review').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('tiers')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer min-h-[44px] whitespace-nowrap ${
            subTab === 'tiers'
              ? 'border-emerald-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Configurable Bonus Tiers
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* SUBTAB 1: STAFF DIRECTORY & ACCOUNTS                                 */}
      {/* -------------------------------------------------------------------- */}
      {subTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, username, email, or referral code..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white min-h-[44px] cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="recruitment_officer">Recruitment Officer</option>
                <option value="field_coordinator">Field Coordinator</option>
                <option value="community_ambassador">Community Ambassador</option>
                <option value="senior_agent">Senior Agent</option>
                <option value="regional_supervisor">Regional Supervisor</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white min-h-[44px] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          </div>

          {/* Desktop Table (hidden on mobile, stacked cards shown on 360-430px) */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Officer</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Referral Code</th>
                  <th className="py-3 px-4">Target Progress</th>
                  <th className="py-3 px-4">Verified Revenue</th>
                  <th className="py-3 px-4">Commission Wallet</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStaff.map((stf) => {
                  const perf = portalStore.getStaffPerformance(stf.id);
                  const isActive = stf.status === 'active';

                  return (
                    <tr key={stf.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{stf.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          @{stf.username} · {stf.email}
                        </div>
                        {stf.phone && <div className="text-[10px] text-slate-500">{stf.phone}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="capitalize text-slate-300 font-medium">
                          {stf.role.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2 py-1 rounded text-[11px]">
                          {stf.referralCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-white font-bold">
                              {perf.verifiedPaidReferrals} / {perf.monthlyTarget}
                            </span>
                            <span className="text-emerald-400 font-bold">{perf.targetProgressPercent}%</span>
                          </div>
                          <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${perf.targetProgressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                        PKR {perf.verifiedRevenuePKR.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        {stf.payoutAccountNumber ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  stf.payoutMethod === 'EasyPaisa'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                    : 'bg-rose-950 text-rose-300 border border-rose-700/60'
                                }`}
                              >
                                {stf.payoutMethod || 'JazzCash'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(stf.payoutAccountNumber || '');
                                  setCopiedWalletStaffId(stf.id);
                                  setTimeout(() => setCopiedWalletStaffId(null), 2000);
                                }}
                                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                                title="Copy Wallet Number"
                              >
                                {copiedWalletStaffId === stf.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="font-mono text-white text-xs font-semibold">
                              {stf.payoutAccountNumber}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                              {stf.payoutAccountTitle || stf.fullName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Not configured</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                              : 'bg-red-950 text-red-300 border border-red-700/60'
                          }`}
                        >
                          {stf.status}
                        </span>
                        {stf.mustChangePassword && (
                          <span className="block text-[9px] text-amber-400 mt-0.5">
                            Password Reset Req
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(stf)}
                            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                            title="Edit Staff Particulars"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(stf)}
                            className={`p-1.5 rounded cursor-pointer ${
                              isActive
                                ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40'
                                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
                            }`}
                            title={isActive ? 'Suspend Account' : 'Activate Account'}
                          >
                            {isActive ? <Lock className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleResetCredentials(stf)}
                            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 rounded cursor-pointer"
                            title="Reset Temporary Credentials"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteStaff(stf)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded cursor-pointer"
                            title="Safe Delete / Deactivate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (Optimized for 360px-430px Android Screens) */}
          <div className="md:hidden space-y-3">
            {filteredStaff.map((stf) => {
              const perf = portalStore.getStaffPerformance(stf.id);
              const isActive = stf.status === 'active';

              return (
                <div
                  key={stf.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div>
                      <h4 className="font-bold text-white text-sm">{stf.fullName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">@{stf.username}</p>
                      <span className="text-[10px] text-slate-400 capitalize block mt-0.5">
                        {stf.role.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                            : 'bg-red-950 text-red-300 border border-red-700/60'
                        }`}
                      >
                        {stf.status}
                      </span>
                      <span className="font-mono font-bold text-amber-300 text-xs block mt-1">
                        {stf.referralCode}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Target Progress:</span>
                      <span className="font-mono text-white font-bold">
                        {perf.verifiedPaidReferrals} / {perf.monthlyTarget} ({perf.targetProgressPercent}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Verified Revenue:</span>
                      <span className="font-mono text-amber-300 font-bold">
                        PKR {perf.verifiedRevenuePKR.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Staff Payout Wallet Box for Commission Sharing */}
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Commission Payout Wallet:</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          stf.payoutMethod === 'EasyPaisa' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                        }`}>
                          {stf.payoutMethod || 'JazzCash'}
                        </span>
                        <span className="font-mono text-white font-bold text-xs">{stf.payoutAccountNumber || 'Not set'}</span>
                      </div>
                      {stf.payoutAccountTitle && (
                        <span className="text-[10px] text-slate-400 block truncate">{stf.payoutAccountTitle}</span>
                      )}
                    </div>
                    {stf.payoutAccountNumber && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(stf.payoutAccountNumber || '');
                          setCopiedWalletStaffId(stf.id);
                          setTimeout(() => setCopiedWalletStaffId(null), 2000);
                        }}
                        className="px-2.5 py-1 bg-slate-800 text-slate-200 hover:text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {copiedWalletStaffId === stf.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedWalletStaffId === stf.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  {/* Actions for Mobile (Min 44px tap targets) */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
                    <button
                      onClick={() => handleOpenEdit(stf)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleToggleStatus(stf)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer min-h-[44px] ${
                        isActive
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800/80'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80'
                      }`}
                    >
                      {isActive ? <Lock className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      <span>{isActive ? 'Suspend' : 'Activate'}</span>
                    </button>

                    <button
                      onClick={() => handleResetCredentials(stf)}
                      className="py-2 px-3 bg-blue-950/60 text-blue-300 border border-blue-800/80 text-xs font-semibold rounded-xl flex items-center justify-center cursor-pointer min-h-[44px]"
                      title="Reset Password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteStaff(stf)}
                      className="py-2 px-3 bg-red-950/60 text-red-300 border border-red-800/80 text-xs font-semibold rounded-xl flex items-center justify-center cursor-pointer min-h-[44px]"
                      title="Delete / Suspend"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUBTAB 2: REFERRAL PERFORMANCE LEDGER                                */}
      {/* -------------------------------------------------------------------- */}
      {subTab === 'referrals' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Field Officer Quotas & Attributed Revenue</h3>
                <p className="text-slate-400">
                  Strictly counts verified application fees received in authorized escrow. Pending fees are NEVER counted.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={dateFilterMonth}
                  onChange={(e) => setDateFilterMonth(e.target.value)}
                  className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
                {dateFilterMonth && (
                  <button
                    onClick={() => setDateFilterMonth('')}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {staffList.map((stf) => {
                const perf = portalStore.getStaffPerformance(stf.id);

                return (
                  <div
                    key={stf.id}
                    className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{stf.fullName}</span>
                          <span className="font-mono text-amber-300 font-bold bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                            {stf.referralCode}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {stf.role.replace(/_/g, ' ')} · Target: {perf.monthlyTarget} Verified Referrals
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Verified Revenue:</span>
                          <span className="font-mono font-bold text-amber-300 text-sm">
                            PKR {perf.verifiedRevenuePKR.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Bonus Tier:</span>
                          <span className="font-bold text-emerald-400 text-sm">
                            {perf.currentTierName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>
                          Achieved: <strong className="text-white">{perf.verifiedPaidReferrals}</strong> verified candidates
                        </span>
                        <span className="font-bold text-emerald-400">{perf.targetProgressPercent}% of Quota</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full"
                          style={{ width: `${perf.targetProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUBTAB 3: BONUS APPROVALS & PAYOUTS                                  */}
      {/* -------------------------------------------------------------------- */}
      {subTab === 'bonuses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base">Bonus Ledger & Banking Payout Authorization</h3>
              <p className="text-xs text-slate-400">
                Authorized officers approve bonuses and record official bank disbursement transaction references.
              </p>
            </div>

            <button
              onClick={() => setIsAwardingBonus(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md min-h-[44px]"
            >
              <Award className="w-4 h-4" />
              <span>Award Custom Incentive</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {bonusRecords.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                No bonus records generated yet.
              </div>
            ) : (
              bonusRecords.map((record) => {
                const isPending = record.status === 'Pending Review';
                const isApproved = record.status === 'Approved';
                const isPaid = record.status === 'Disbursed / Paid';

                return (
                  <div
                    key={record.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{record.staffName}</span>
                          <span className="font-mono text-slate-400 text-[11px]">@{record.staffUsername}</span>
                          <span className="font-mono text-amber-300 font-bold text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                            {record.referralCode}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Cycle: <strong className="text-slate-200">{record.month}</strong> · Tier: <strong className="text-amber-400">{record.tierName}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-base font-bold font-mono text-amber-300">
                            PKR {record.bonusAmountPKR.toLocaleString()}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80'
                              : isApproved
                              ? 'bg-amber-950 text-amber-300 border border-amber-700/80'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                      <div>
                        {record.paidRef ? (
                          <span className="text-emerald-300 font-semibold">
                            Disbursement Ref: <strong className="font-mono text-white">{record.paidRef}</strong> on {record.paidAt}
                          </span>
                        ) : record.approvedBy ? (
                          <span className="text-amber-300">
                            Approved by: <strong className="text-white">{record.approvedBy}</strong> on {record.approvedAt}
                          </span>
                        ) : (
                          <span>Pending administrative sign-off</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={() => {
                              setApprovingBonus(record);
                              setApprovalNotes('');
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer transition-colors min-h-[44px]"
                          >
                            Approve Bonus Claim
                          </button>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => {
                              setPayingBonus(record);
                              setPaymentRefInput('');
                              setPaymentNotesInput('');
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs cursor-pointer transition-colors min-h-[44px]"
                          >
                            Mark as Disbursed (Enter Bank Ref)
                          </button>
                        )}
                      </div>
                    </div>

                    {record.notes && (
                      <div className="p-2 bg-slate-950 rounded text-[11px] text-slate-400">
                        {record.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUBTAB 4: CONFIGURABLE BONUS TIERS                                   */}
      {/* -------------------------------------------------------------------- */}
      {subTab === 'tiers' && (
        <div className="space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base">Bonus Tiers & Commission Parameters</h3>
            <p className="text-xs text-slate-400">
              Configure target thresholds, base rewards, and commission rates. All changes are permanently recorded in the immutable audit log.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {bonusTiers.map((tier) => (
              <div
                key={tier.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{tier.tierName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Active
                    </span>
                  </div>

                  <div className="text-xl font-bold font-mono text-amber-300">
                    PKR {tier.bonusAmountPKR.toLocaleString()}
                  </div>

                  <div className="space-y-1 text-slate-300 pt-1 border-t border-slate-800 text-[11px]">
                    <div>
                      Min Verified Referrals: <strong className="text-white">{tier.minVerifiedReferrals}</strong>
                    </div>
                    <div>
                      Commission Rate: <strong className="text-emerald-400">{tier.commissionPercent}%</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight">
                    {tier.description}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenEditTier(tier)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold cursor-pointer transition-colors min-h-[44px]"
                >
                  Configure Tier
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 1: ADD STAFF ACCOUNT                                           */}
      {/* -------------------------------------------------------------------- */}
      {isAddingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-200 my-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Admin-Controlled Staff Provisioning
                </span>
                <h3 className="font-bold text-base text-white">Create New Staff Member</h3>
              </div>
              <button
                onClick={() => setIsAddingStaff(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Tariq Mahmood"
                  required
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Unique Username *
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. staff_tariq"
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="tariq@domain.pk"
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0301-5582910"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Monthly Target *
                  </label>
                  <input
                    type="number"
                    value={newTarget}
                    onChange={(e) => setNewTarget(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Designated Role *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as StaffRole)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[44px] cursor-pointer"
                >
                  <option value="recruitment_officer">Recruitment Officer</option>
                  <option value="field_coordinator">Field Coordinator</option>
                  <option value="community_ambassador">Community Ambassador</option>
                  <option value="senior_agent">Senior Agent</option>
                  <option value="regional_supervisor">Regional Supervisor</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-[11px] text-emerald-200">
                <span className="font-bold block text-emerald-300 mb-0.5">Automated Credentials & Referral Code:</span>
                A collision-resistant unique referral code and secure temporary password will be automatically generated. The staff member will be required to change their password on first sign-in.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingStaff(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 cursor-pointer hover:bg-slate-800 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-md min-h-[44px]"
                >
                  Provision Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 2: CREATED CREDENTIALS HANDOFF DIALOG                          */}
      {/* -------------------------------------------------------------------- */}
      {staffCreationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-emerald-500/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Account Successfully Provisioned
                </span>
                <h3 className="font-bold text-base text-white">Staff Credentials Handoff</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Provide these temporary credentials securely to <strong className="text-white">{staffCreationResult.staff.fullName}</strong>. Plaintext passwords are never stored in the database.
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Username:</span>
                <span className="text-white font-bold">{staffCreationResult.staff.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Temporary Password:</span>
                <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
                  {staffCreationResult.temporaryPassword}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unique Referral Code:</span>
                <span className="text-emerald-400 font-bold">{staffCreationResult.referralCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role:</span>
                <span className="text-slate-300 capitalize">{staffCreationResult.staff.role.replace(/_/g, ' ')}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const credsText = `Assalam-o-Alaikum ${staffCreationResult.staff.fullName},\nYour official Staff Account has been activated.\n\nPortal: ${window.location.origin}\nUsername: ${staffCreationResult.staff.username}\nTemporary Password: ${staffCreationResult.temporaryPassword}\nReferral Code: ${staffCreationResult.referralCode}\n\nPlease change your temporary password upon first login.`;
                  navigator.clipboard.writeText(credsText);
                  setCopiedCreds(true);
                  setTimeout(() => setCopiedCreds(false), 2000);
                }}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                {copiedCreds ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>

              <button
                onClick={() => setStaffCreationResult(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer min-h-[44px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 3: RESET CREDENTIALS RESULT DIALOG                             */}
      {/* -------------------------------------------------------------------- */}
      {resetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-blue-500/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                  Credentials Reset Completed
                </span>
                <h3 className="font-bold text-base text-white">New Temporary Password</h3>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Username:</span>
                <span className="text-white font-bold">{resetResult.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Temporary Password:</span>
                <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
                  {resetResult.temporaryPassword}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(resetResult.temporaryPassword);
                setResetResult(null);
                onFlashMessage('New temporary password copied.');
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer min-h-[44px]"
            >
              Copy Password & Close
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 4: EDIT STAFF MEMBER                                           */}
      {/* -------------------------------------------------------------------- */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Account Management
                </span>
                <h3 className="font-bold text-base text-white">Edit Staff: {editingStaff.fullName}</h3>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Official Email *</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Monthly Target *</label>
                  <input
                    type="number"
                    value={editTarget}
                    onChange={(e) => setEditTarget(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Role *</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as StaffRole)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[44px] cursor-pointer"
                >
                  <option value="recruitment_officer">Recruitment Officer</option>
                  <option value="field_coordinator">Field Coordinator</option>
                  <option value="community_ambassador">Community Ambassador</option>
                  <option value="senior_agent">Senior Agent</option>
                  <option value="regional_supervisor">Regional Supervisor</option>
                </select>
              </div>

              {/* Commission / Bonus Payout Wallet (JazzCash / EasyPaisa) */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-800/60 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Commission Payout Account (JazzCash / EasyPaisa)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Wallet Type *</label>
                    <select
                      value={editPayoutMethod}
                      onChange={(e) => setEditPayoutMethod(e.target.value as any)}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs cursor-pointer min-h-[40px]"
                    >
                      <option value="JazzCash">JazzCash</option>
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="Raast">Raast</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Account Title</label>
                    <input
                      type="text"
                      value={editPayoutAccountTitle}
                      onChange={(e) => setEditPayoutAccountTitle(e.target.value)}
                      placeholder="e.g. Tariq Mahmood"
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Mobile / Account No.</label>
                    <input
                      type="text"
                      value={editPayoutAccountNumber}
                      onChange={(e) => setEditPayoutAccountNumber(e.target.value)}
                      placeholder="e.g. 0301-5582910"
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs min-h-[40px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer min-h-[44px]"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 5: APPROVE BONUS CLAIM                                         */}
      {/* -------------------------------------------------------------------- */}
      {approvingBonus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-base">Approve Staff Bonus Claim</span>
              <button
                onClick={() => setApprovingBonus(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div>Staff: <strong className="text-white">{approvingBonus.staffName}</strong></div>
              <div>Tier Milestone: <strong className="text-amber-400">{approvingBonus.tierName}</strong></div>
              <div>Bonus Amount: <strong className="text-emerald-400 font-mono text-sm">PKR {approvingBonus.bonusAmountPKR.toLocaleString()}</strong></div>
            </div>

            <form onSubmit={handleApproveBonusSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Administrative Review Notes:
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="e.g. Verified against bank statement and candidate dossier criteria."
                  rows={3}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setApprovingBonus(null)}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer min-h-[44px]"
                >
                  Confirm Sign-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 6: MARK BONUS AS DISBURSED / PAID (With JazzCash / EasyPaisa)  */}
      {/* -------------------------------------------------------------------- */}
      {payingBonus && (() => {
        const payingStaff = staffList.find((s) => s.id === payingBonus.staffId);
        const method = payingBonus.payoutMethod || payingStaff?.payoutMethod || 'JazzCash';
        const title = payingBonus.payoutAccountTitle || payingStaff?.payoutAccountTitle || payingBonus.staffName;
        const number = payingBonus.payoutAccountNumber || payingStaff?.payoutAccountNumber || payingStaff?.phone || '0300-1234567';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-emerald-500/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Commission & Bonus Payout Authorization
                  </span>
                  <h3 className="font-bold text-base text-white">Share Commission / Disburse Bonus</h3>
                </div>
                <button
                  onClick={() => setPayingBonus(null)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Beneficiary & Amount Card */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Beneficiary Staff Officer:</span>
                  <strong className="text-white text-sm">{payingBonus.staffName}</strong>
                  <span className="text-slate-400 block text-[11px] font-mono">@{payingBonus.staffUsername} · {payingBonus.tierName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Payable Commission:</span>
                  <span className="text-emerald-400 font-mono font-bold text-lg">
                    PKR {payingBonus.bonusAmountPKR.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Staff JazzCash / EasyPaisa Payout Wallet Box */}
              <div className={`p-4 rounded-xl border space-y-2.5 ${
                method === 'JazzCash'
                  ? 'bg-rose-950/30 border-rose-600/70'
                  : method === 'EasyPaisa'
                  ? 'bg-emerald-950/30 border-emerald-600/70'
                  : 'bg-teal-950/30 border-teal-600/70'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Staff Registered Payout Wallet</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    method === 'JazzCash'
                      ? 'bg-rose-900 text-rose-200 border border-rose-700'
                      : method === 'EasyPaisa'
                      ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                      : 'bg-teal-900 text-teal-200 border border-teal-700'
                  }`}>
                    {method} Wallet
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Account Title:</span>
                    <strong className="text-white text-xs">{title}</strong>
                    <div className="text-emerald-400 font-mono font-bold text-sm mt-0.5 tracking-wider">
                      {number}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(number);
                      setCopiedWalletStaffId(payingBonus.id);
                      setTimeout(() => setCopiedWalletStaffId(null), 2500);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                  >
                    {copiedWalletStaffId === payingBonus.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Number</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-snug">
                  👉 Open your <strong>{method}</strong> app on your phone, send <strong>PKR {payingBonus.bonusAmountPKR.toLocaleString()}</strong> to <strong className="font-mono text-white">{number}</strong>, then enter the Transaction ID (TID) below.
                </p>
              </div>

              <form onSubmit={handlePayBonusSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {method} Transaction Reference (TID / Ref #) *
                  </label>
                  <input
                    type="text"
                    value={paymentRefInput}
                    onChange={(e) => setPaymentRefInput(e.target.value)}
                    placeholder={method === 'JazzCash' ? 'e.g. JC-TID-9482019' : 'e.g. EP-TRX-442109'}
                    required
                    autoFocus
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono min-h-[44px]"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Found in your {method} payment confirmation SMS or app transfer receipt.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Disbursement Ledger Notes (Optional):
                  </label>
                  <input
                    type="text"
                    value={paymentNotesInput}
                    onChange={(e) => setPaymentNotesInput(e.target.value)}
                    placeholder={`e.g. Commission transferred via ${method} for verified quota referrals`}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[44px]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPayingBonus(null)}
                    className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 cursor-pointer min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer min-h-[44px] flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Mark Disbursed</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 7: AWARD MANUAL INCENTIVE BONUS                                */}
      {/* -------------------------------------------------------------------- */}
      {isAwardingBonus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-base">Award Milestone Incentive</span>
              <button
                onClick={() => setIsAwardingBonus(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAwardBonusSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Staff Officer *</label>
                <select
                  value={awardStaffId}
                  onChange={(e) => setAwardStaffId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[44px] cursor-pointer"
                >
                  <option value="">Select Staff Officer...</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.referralCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bonus Amount (PKR) *</label>
                  <input
                    type="number"
                    value={awardAmount}
                    onChange={(e) => setAwardAmount(Number(e.target.value))}
                    min={500}
                    step={500}
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Month Cycle *</label>
                  <input
                    type="month"
                    value={awardMonth}
                    onChange={(e) => setAwardMonth(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tier / Reason Label *</label>
                <input
                  type="text"
                  value={awardTierName}
                  onChange={(e) => setAwardTierName(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Award Citation / Notes</label>
                <textarea
                  value={awardNotes}
                  onChange={(e) => setAwardNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Exceptional recruitment drive performance in Gujranwala district."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAwardingBonus(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer min-h-[44px]"
                >
                  Grant Bonus Award
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 8: CONFIGURE BONUS TIER                                        */}
      {/* -------------------------------------------------------------------- */}
      {editingTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-base">Configure Bonus Tier: {editingTier.tierName}</span>
              <button
                onClick={() => setEditingTier(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tier Name *</label>
                <input
                  type="text"
                  value={tierNameInput}
                  onChange={(e) => setTierNameInput(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min Verified Referrals *</label>
                  <input
                    type="number"
                    value={tierMinRefsInput}
                    onChange={(e) => setTierMinRefsInput(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base Bonus Amount (PKR) *</label>
                  <input
                    type="number"
                    value={tierBonusPkrInput}
                    onChange={(e) => setTierBonusPkrInput(Number(e.target.value))}
                    min={0}
                    step={500}
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Commission on Verified Revenue (%) *
                </label>
                <input
                  type="number"
                  value={tierCommissionInput}
                  onChange={(e) => setTierCommissionInput(Number(e.target.value))}
                  min={0}
                  max={50}
                  step={0.5}
                  required
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  value={tierDescInput}
                  onChange={(e) => setTierDescInput(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer min-h-[44px]"
                >
                  Save Tier Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
