import React, { useState } from 'react';
import {
  AdminPaymentMethod,
  PaymentMethodType,
  PaymentMethodStatus,
  AdminUser,
  SystemSettings,
  PaymentRecord,
} from '../../types';
import { portalStore } from '../../services/store';
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  Eye,
  Shield,
  Upload,
  RefreshCw,
  Sliders,
  DollarSign,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Lock,
} from 'lucide-react';

interface PaymentSettingsModuleProps {
  admin: AdminUser;
  settings: SystemSettings;
  paymentMethods: AdminPaymentMethod[];
  payments: PaymentRecord[];
  onFlashMessage: (msg: string) => void;
}

export const PaymentSettingsModule: React.FC<PaymentSettingsModuleProps> = ({
  admin,
  settings,
  paymentMethods,
  payments,
  onFlashMessage,
}) => {
  const [methodsList, setMethodsList] = useState<AdminPaymentMethod[]>(paymentMethods);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<AdminPaymentMethod | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<PaymentMethodType>('bank_transfer');
  const [formAccountTitle, setFormAccountTitle] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formIban, setFormIban] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formRefInstructions, setFormRefInstructions] = useState('');
  const [formQrCodeUrl, setFormQrCodeUrl] = useState<string>('');
  const [formQrCodeFileName, setFormQrCodeFileName] = useState('');
  const [formStatus, setFormStatus] = useState<PaymentMethodStatus>('active');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirmation Safeguard Modal State
  const [confirmModalData, setConfirmModalData] = useState<{
    method: AdminPaymentMethod;
    targetStatus: PaymentMethodStatus;
    actionType: 'toggle' | 'archive';
    pendingCount: number;
  } | null>(null);

  // QR Preview Modal State
  const [viewingQrMethod, setViewingQrMethod] = useState<AdminPaymentMethod | null>(null);

  const refreshList = () => {
    setMethodsList(portalStore.getAllPaymentMethods());
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingMethod(null);
    setFormName('EasyPaisa QR Code (Scan to Pay)');
    setFormType('easypaisa');
    setFormAccountTitle('Official Recruitment Portal Escrow');
    setFormAccountNumber('QR Scan Payment');
    setFormIban('');
    setFormBankName('');
    setFormInstructions('Open EasyPaisa App → Tap "QR Pay" or "Scan QR" → Point camera at this QR code → Confirm amount PKR 4,500 and verify account title before sending.');
    setFormRefInstructions('Take a clear screenshot of the confirmation screen displaying the Transaction ID (TRX ID).');
    setFormQrCodeUrl('');
    setFormQrCodeFileName('');
    setFormStatus('active');
    setFormDisplayOrder(methodsList.length + 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: AdminPaymentMethod) => {
    setEditingMethod(m);
    setFormName(m.name);
    setFormType(m.type);
    setFormAccountTitle(m.accountTitle || 'Official Recruitment Portal Escrow');
    setFormAccountNumber(m.accountNumber || 'QR Scan Payment');
    setFormIban(m.iban || '');
    setFormBankName(m.bankName || '');
    setFormInstructions(m.instructions);
    setFormRefInstructions(m.referenceInstructions || '');
    setFormQrCodeUrl(m.qrCodeUrl || '');
    setFormQrCodeFileName(m.qrCodeFileName || '');
    setFormStatus(m.status);
    setFormDisplayOrder(m.displayOrder);
    setFormError(null);
    setIsModalOpen(true);
  };

  // QR Upload Handler with strict validation (MIME, max 2MB, randomized filename)
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // Allowed MIME types
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setFormError('Invalid file format. Allowed formats: PNG, JPG, WEBP, or SVG.');
      return;
    }

    // Max 2MB
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setFormError('QR image file size exceeds 2 MB limit.');
      return;
    }

    // Generate safe randomized filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const safeName = `qr_${formType}_${Date.now()}_${randomSuffix}.${ext}`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormQrCodeUrl(dataUrl);
      setFormQrCodeFileName(safeName);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Please enter a descriptive QR payment method name.');
      return;
    }
    if (!formQrCodeUrl) {
      setFormError('Please upload an official QR-Code image for this payment method.');
      return;
    }
    if (!formInstructions.trim()) {
      setFormError('Please provide clear scan and payment instructions for applicants.');
      return;
    }

    const safeTitle = formAccountTitle.trim() || 'Official Recruitment Portal Escrow';
    const safeAccountNum = formAccountNumber.trim() || 'QR Scan Payment';

    // Check if editing a method currently used by pending applications
    if (editingMethod) {
      const usage = portalStore.checkMethodUsage(editingMethod.id);
      if (usage.pendingCount > 0 && formStatus !== 'active') {
        // Trigger confirmation modal
        setConfirmModalData({
          method: editingMethod,
          targetStatus: formStatus,
          actionType: 'toggle',
          pendingCount: usage.pendingCount,
        });
        return;
      }
    }

    const res = portalStore.savePaymentMethod({
      id: editingMethod?.id,
      name: formName,
      type: formType,
      accountTitle: safeTitle,
      accountNumber: safeAccountNum,
      iban: formIban,
      bankName: formBankName,
      instructions: formInstructions,
      referenceInstructions: formRefInstructions,
      qrCodeUrl: formQrCodeUrl || undefined,
      qrCodeFileName: formQrCodeFileName || undefined,
      status: formStatus,
      displayOrder: Number(formDisplayOrder) || 1,
    });

    if (res.success) {
      refreshList();
      setIsModalOpen(false);
      onFlashMessage(res.message);
    } else {
      setFormError(res.message);
    }
  };

  const handleToggleStatus = (m: AdminPaymentMethod, newStatus: PaymentMethodStatus) => {
    const usage = portalStore.checkMethodUsage(m.id);
    if ((newStatus === 'inactive' || newStatus === 'archived') && usage.pendingCount > 0) {
      setConfirmModalData({
        method: m,
        targetStatus: newStatus,
        actionType: 'toggle',
        pendingCount: usage.pendingCount,
      });
      return;
    }

    const res = portalStore.togglePaymentMethodStatus(m.id, newStatus, true);
    refreshList();
    onFlashMessage(res.message);
  };

  const handleConfirmAction = () => {
    if (!confirmModalData) return;
    const { method, targetStatus, actionType } = confirmModalData;

    if (actionType === 'toggle') {
      portalStore.togglePaymentMethodStatus(method.id, targetStatus, true);
      onFlashMessage(`Payment method "${method.name}" status updated to ${targetStatus} (override confirmed).`);
    } else {
      portalStore.deletePaymentMethod(method.id, true);
      onFlashMessage(`Payment method "${method.name}" archived (override confirmed).`);
    }

    setConfirmModalData(null);
    setIsModalOpen(false);
    refreshList();
  };

  // Metrics
  const totalMethods = methodsList.length;
  const activeMethods = methodsList.filter((m) => m.status === 'active').length;
  const pendingProofs = payments.filter((p) => p.status === 'Submitted for Verification' || p.status === 'Pending').length;
  const verifiedTotal = payments.filter((p) => p.status === 'Verified').length * settings.feeAmountPKR;

  const filteredMethods = methodsList.filter((m) => {
    if (filterStatus === 'all') return true;
    return m.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Strip */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-400" />
              <span>Payment Methods & Banking Gateways</span>
            </h2>
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold">
              Admin Managed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure bank accounts, mobile wallets (JazzCash, EasyPaisa, Raast), QR codes, and deposit challans for applicant fee submission.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Payment Method</span>
        </button>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider block">Total Gateways</span>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">{totalMethods}</div>
          <span className="text-[10px] text-slate-500 block">Configured in system</span>
        </div>

        <div className="p-4 bg-slate-900 border border-emerald-900/50 rounded-xl space-y-1">
          <span className="text-emerald-400 text-[11px] uppercase tracking-wider block">Active Channels</span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-300 font-mono">{activeMethods}</div>
          <span className="text-[10px] text-emerald-400/80 block">Visible to applicants</span>
        </div>

        <div className="p-4 bg-slate-900 border border-amber-900/50 rounded-xl space-y-1">
          <span className="text-amber-400 text-[11px] uppercase tracking-wider block">Pending Proofs</span>
          <div className="text-xl sm:text-2xl font-bold text-amber-300 font-mono">{pendingProofs}</div>
          <span className="text-[10px] text-amber-400/80 block">Awaiting bank reconciliation</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider block">Verified Collection</span>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono truncate">
            PKR {verifiedTotal.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 block">Escrow cleared funds</span>
        </div>
      </div>

      {/* Statutory Fee Notice Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-200 block">
              Authorized Vacancy Application Fee: <strong className="text-emerald-400 font-mono">PKR {settings.feeAmountPKR.toLocaleString()}</strong>
            </span>
            <span className="text-slate-400 text-[11px]">
              {settings.feeCollectionAuthorized
                ? `Officially authorized under permit reference: ${settings.authorizationDocumentRef || 'MFA/SAU-ISB/2026/AUTH-088'}`
                : 'Fee collection is currently locked pending statutory authorization.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            settings.feeCollectionAuthorized ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
          }`}>
            {settings.feeCollectionAuthorized ? 'COLLECTION ACTIVE' : 'COLLECTION LOCKED'}
          </span>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors min-h-[38px] ${
              filterStatus === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Methods ({methodsList.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors min-h-[38px] ${
              filterStatus === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Active ({methodsList.filter((m) => m.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors min-h-[38px] ${
              filterStatus === 'inactive'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Inactive ({methodsList.filter((m) => m.status === 'inactive').length})
          </button>
          <button
            onClick={() => setFilterStatus('archived')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors min-h-[38px] ${
              filterStatus === 'archived'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Archived ({methodsList.filter((m) => m.status === 'archived').length})
          </button>
        </div>

        <button
          onClick={refreshList}
          className="text-slate-400 hover:text-white p-2 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer transition-colors"
          title="Refresh List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Methods Cards List (Mobile-First Stacked Cards & Detailed Table) */}
      <div className="space-y-4">
        {filteredMethods.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-3">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="font-bold text-white text-sm">No Payment Methods Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No payment channels match your filter criteria. Click "Add New Payment Method" to configure banking or wallet endpoints.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredMethods.map((m) => {
              const usage = portalStore.checkMethodUsage(m.id);

              return (
                <div
                  key={m.id}
                  className={`bg-slate-900 border rounded-xl p-5 space-y-4 transition-all shadow-md relative ${
                    m.status === 'active'
                      ? 'border-slate-800 hover:border-slate-700'
                      : m.status === 'inactive'
                      ? 'border-amber-900/40 opacity-80'
                      : 'border-red-950/60 opacity-60'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{m.name}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {m.type.replace('_', ' ')}
                        </span>
                        {m.isDefault && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block font-medium">
                        {m.bankName || m.accountTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'active'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : m.status === 'inactive'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {m.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* QR Image Thumbnail & Information */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3.5">
                    {m.qrCodeUrl ? (
                      <div
                        onClick={() => setViewingQrMethod(m)}
                        className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-700 shrink-0 cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all flex items-center justify-center shadow-xs"
                        title="Click to enlarge QR code"
                      >
                        <img src={m.qrCodeUrl} alt={m.name} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center shrink-0 text-slate-500">
                        <QrCode className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Title:</span>
                        <span className="text-white font-bold text-xs truncate block">{m.accountTitle || 'Official Portal'}</span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono font-semibold">
                        Official Scan & Pay QR Gateway
                      </div>
                      {m.qrCodeUrl && (
                        <button
                          type="button"
                          onClick={() => setViewingQrMethod(m)}
                          className="text-[10px] text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Enlarge QR Code</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Instructions & Reference Note */}
                  <div className="text-xs space-y-1.5 text-slate-300">
                    <p className="line-clamp-2 text-slate-400 text-[11px] leading-relaxed">
                      {m.instructions}
                    </p>
                    {m.referenceInstructions && (
                      <p className="text-[11px] text-amber-400/90 italic font-mono">
                        Ref: {m.referenceInstructions}
                      </p>
                    )}
                  </div>

                  {/* Usage & QR Code Strip */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>
                        Pending Proofs: <strong className={usage.pendingCount > 0 ? 'text-amber-300 font-bold' : 'text-slate-300'}>{usage.pendingCount}</strong>
                      </span>
                      <span>
                        Verified: <strong className="text-emerald-400">{usage.verifiedCount}</strong>
                      </span>
                    </div>

                    {m.qrCodeUrl && (
                      <button
                        onClick={() => setViewingQrMethod(m)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View QR</span>
                      </button>
                    )}
                  </div>

                  {/* Bottom Controls Strip */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      {m.status === 'active' ? (
                        <button
                          onClick={() => handleToggleStatus(m, 'inactive')}
                          className="px-2.5 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/70 rounded-lg text-xs font-semibold cursor-pointer transition-colors min-h-[38px]"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(m, 'active')}
                          className="px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/70 rounded-lg text-xs font-semibold cursor-pointer transition-colors min-h-[38px]"
                        >
                          Activate
                        </button>
                      )}

                      {m.status !== 'archived' && (
                        <button
                          onClick={() => {
                            const usage = portalStore.checkMethodUsage(m.id);
                            if (usage.pendingCount > 0) {
                              setConfirmModalData({
                                method: m,
                                targetStatus: 'archived',
                                actionType: 'archive',
                                pendingCount: usage.pendingCount,
                              });
                            } else {
                              portalStore.deletePaymentMethod(m.id, true);
                              refreshList();
                              onFlashMessage(`Payment method "${m.name}" archived.`);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-300 border border-red-900/60 rounded-lg text-xs font-semibold cursor-pointer transition-colors min-h-[38px]"
                          title="Archive Payment Method"
                        >
                          Archive
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors min-h-[38px]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Gateway</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT PAYMENT METHOD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto text-xs animate-fadeIn">
            {/* Modal Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
                  {editingMethod ? 'Modify Configured Gateway' : 'Add New Payment Channel'}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {editingMethod ? `Edit: ${editingMethod.name}` : 'Create Payment Method'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-red-950 border border-red-800 text-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <label className="block text-slate-400 text-[11px] font-semibold">
                  Quick Presets:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormName('EasyPaisa QR Code (Scan to Pay)');
                      setFormType('easypaisa');
                      setFormInstructions('Open EasyPaisa App → Tap "QR Pay" or "Scan QR" → Point camera at this QR code → Confirm PKR 4,500 fee payment.');
                      setFormRefInstructions('Take a clear screenshot of the EasyPaisa confirmation screen displaying the TRX ID.');
                    }}
                    className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                  >
                    EasyPaisa QR
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormName('JazzCash QR Code (Scan to Pay)');
                      setFormType('jazzcash');
                      setFormInstructions('Open JazzCash App → Tap "Scan QR" → Point camera at this QR code → Confirm PKR 4,500 payment with MPIN.');
                      setFormRefInstructions('Take a clear screenshot of the JazzCash receipt screen showing the TID.');
                    }}
                    className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                  >
                    JazzCash QR
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormName('Raast QR Code (Any Banking App)');
                      setFormType('raast');
                      setFormInstructions('Open any Banking or Mobile Wallet App (HBL, Alfalah, UBL, SadaPay, etc.) → Select Raast QR Scan → Scan this QR Code to transfer PKR 4,500.');
                      setFormRefInstructions('Upload transfer receipt clearly displaying the transaction reference.');
                    }}
                    className="px-2.5 py-1 bg-teal-950/60 hover:bg-teal-900 border border-teal-700/60 text-teal-300 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                  >
                    Raast QR
                  </button>
                </div>
              </div>

              {/* QR Code Upload & Live Preview Section (MANDATORY) */}
              <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-200 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>Official QR-Code Image <span className="text-red-400">*</span></span>
                  </label>
                  <span className="text-[10px] text-slate-500">Max 3 MB · PNG/JPG/SVG/WEBP</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Preview Canvas */}
                  <div className="w-32 h-32 bg-white rounded-xl border-2 border-emerald-500/50 p-2 flex items-center justify-center shrink-0 shadow-md">
                    {formQrCodeUrl ? (
                      <img
                        src={formQrCodeUrl}
                        alt="QR Code Preview"
                        className="max-w-full max-h-full object-contain block mx-auto"
                      />
                    ) : (
                      <div className="text-center text-slate-400 space-y-1">
                        <QrCode className="w-10 h-10 mx-auto text-slate-300" />
                        <span className="text-[10px] font-semibold block text-amber-400">Upload QR Image</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="space-y-2 flex-1 w-full">
                    <input
                      type="file"
                      id="qr-upload-input"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleQrUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="qr-upload-input"
                      className="w-full py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{formQrCodeUrl ? 'Replace Official QR Image' : 'Select & Upload QR Code Image'}</span>
                    </label>

                    {formQrCodeFileName && (
                      <div className="flex items-center justify-between text-[11px] text-emerald-300 font-mono bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1.5 rounded-lg">
                        <span className="truncate max-w-[200px]">{formQrCodeFileName}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormQrCodeUrl('');
                            setFormQrCodeFileName('');
                          }}
                          className="text-red-400 hover:text-red-300 ml-2 cursor-pointer font-sans"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    <span className="text-[10px] text-slate-400 block leading-tight">
                      Applicants will scan this QR code directly in their EasyPaisa / JazzCash / banking mobile application.
                    </span>
                  </div>
                </div>
              </div>

              {/* Method Name & Channel Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">
                    QR Gateway Display Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. EasyPaisa QR Code (Scan to Pay)"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">
                    Channel Provider <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as PaymentMethodType)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer min-h-[44px]"
                  >
                    <option value="easypaisa">EasyPaisa QR</option>
                    <option value="jazzcash">JazzCash QR</option>
                    <option value="raast">State Bank Raast QR</option>
                    <option value="other">Other Mobile Wallet QR</option>
                  </select>
                </div>
              </div>

              {/* Merchant Display Title */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">
                  Merchant / Account Title Displayed
                </label>
                <input
                  type="text"
                  value={formAccountTitle}
                  onChange={(e) => setFormAccountTitle(e.target.value)}
                  placeholder="e.g. Official Recruitment Portal Escrow"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
                <span className="text-[10px] text-slate-500 block">
                  Shown next to the QR code so the applicant can verify the merchant name when scanning.
                </span>
              </div>

              {/* Scan & Payment Instructions */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">
                  Scan & Payment Instructions for Applicant <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  rows={3}
                  placeholder="Explain step-by-step how to scan and pay via app..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  required
                />
              </div>

              {/* Reference Instructions */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Screenshot & TRX ID Instructions</label>
                <input
                  type="text"
                  value={formRefInstructions}
                  onChange={(e) => setFormRefInstructions(e.target.value)}
                  placeholder="e.g. Take a screenshot showing the Transaction ID (TRX ID / TID)"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>

              {/* Status & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Active Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PaymentMethodStatus)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="active">Active (Visible to Applicants)</option>
                    <option value="inactive">Inactive (Temporarily Hidden)</option>
                    <option value="archived">Archived (Retired Channel)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Display Sort Order</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-1.5 min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingMethod ? 'Save Changes' : 'Create Payment Method'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION SAFEGUARD MODAL FOR METHODS USED BY PENDING APPLICATIONS */}
      {confirmModalData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-amber-600/70 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Pending Applications Safeguard</h3>
                <span className="text-amber-400 font-semibold block">
                  Method is actively referenced in candidate submissions
                </span>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed">
              There are currently <strong className="text-amber-300 font-bold">{confirmModalData.pendingCount} pending application(s)</strong> awaiting payment verification that selected:
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-slate-200">
              <strong className="text-white block">{confirmModalData.method.name}</strong>
              <span className="text-slate-400 text-[11px]">{confirmModalData.method.accountNumber}</span>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Disabling, archiving, or altering this method may prevent consular finance officers from reconciling candidate deposit slips or receipts with the historical instructions they viewed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalData(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer min-h-[44px]"
              >
                Confirm Override & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR ZOOM & PREVIEW MODAL */}
      {viewingQrMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 text-xs animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-white">{viewingQrMethod.name}</span>
              <button
                onClick={() => setViewingQrMethod(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 max-w-[240px] mx-auto shadow-md">
              <img
                src={viewingQrMethod.qrCodeUrl}
                alt={`QR code for ${viewingQrMethod.name}`}
                className="w-full h-auto block mx-auto"
              />
            </div>

            <div className="text-slate-300 font-mono text-[11px] space-y-0.5">
              <span className="text-slate-500 block text-[10px]">Title: {viewingQrMethod.accountTitle}</span>
              <strong className="text-amber-300">{viewingQrMethod.accountNumber}</strong>
            </div>

            <button
              onClick={() => setViewingQrMethod(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold cursor-pointer min-h-[44px]"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
