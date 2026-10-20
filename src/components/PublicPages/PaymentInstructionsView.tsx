import React, { useState } from 'react';
import {
  AlertTriangle,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  CreditCard,
  Building2,
  Smartphone,
  Eye,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  SystemSettings,
  CandidateUser,
  Application,
  AdminPaymentMethod,
} from '../../types';
import { portalStore } from '../../services/store';

interface PaymentInstructionsViewProps {
  settings: SystemSettings;
  candidate: CandidateUser | null;
  applications: Application[];
  paymentMethods?: AdminPaymentMethod[];
  onNavigateToDashboard: () => void;
  onOpenCandidateAuth: () => void;
}

export const PaymentInstructionsView: React.FC<PaymentInstructionsViewProps> = ({
  settings,
  candidate,
  applications,
  paymentMethods,
  onNavigateToDashboard,
  onOpenCandidateAuth,
}) => {
  // Candidate applications
  const candidateApps = candidate
    ? applications.filter((a) => a.candidateId === candidate.id)
    : [];

  const [selectedAppId, setSelectedAppId] = useState<string>(candidateApps[0]?.id || applications[0]?.id || '');

  // Active payment methods configured by authorized admin
  const activeMethods: AdminPaymentMethod[] = (paymentMethods && paymentMethods.length > 0)
    ? paymentMethods.filter((m) => m.status === 'active').sort((a, b) => a.displayOrder - b.displayOrder)
    : portalStore.getActivePaymentMethods();

  const [selectedMethodId, setSelectedMethodId] = useState<string>(activeMethods[0]?.id || 'paymethod-easypaisa-qr');
  const [trxRef, setTrxRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptImageData, setReceiptImageData] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Active selected method object
  const currentMethod = activeMethods.find((m) => m.id === selectedMethodId) || activeMethods[0];

  // Currently selected application
  const currentApp = applications.find((a) => a.id === selectedAppId);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePrintChallan = () => {
    window.print();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmissionError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate format
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setSubmissionError('Invalid file type. Please upload a clear JPG, PNG, WEBP, or PDF proof.');
        return;
      }

      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        setSubmissionError('File size exceeds 5 MB. Please upload a smaller compressed image.');
        return;
      }

      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setReceiptImageData(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    setSubmissionSuccess(null);

    if (!selectedAppId) {
      setSubmissionError('Please select a submitted recruitment application to associate this payment.');
      return;
    }
    if (!trxRef.trim()) {
      setSubmissionError('Please enter the bank transaction reference number / deposit slip journal number.');
      return;
    }
    if (!receiptImageData) {
      setSubmissionError('Please upload a screenshot or scan of your bank deposit slip / mobile receipt proof.');
      return;
    }

    const res = portalStore.submitPayment(selectedAppId, {
      paymentMethodId: currentMethod?.id,
      paymentMethod: currentMethod?.name || 'Bank Transfer',
      bankName: currentMethod?.bankName,
      transactionRef: trxRef.trim(),
      paymentDate,
      receiptFileName: receiptFileName || 'deposit_receipt_proof.jpg',
      receiptImageData,
    });

    if (res.success) {
      setSubmissionSuccess(res.message);
      setTrxRef('');
      setReceiptFileName('');
      setReceiptImageData(null);
    } else {
      setSubmissionError(res.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Institutional Heading */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
          <Building2 className="w-4 h-4" />
          <span>Official Financial Channels & Fee Regulations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Recruitment Application Fee & Payment Submission
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Review admin-authorized payment methods, deposit guidelines, and submit verified proof for consular manual reconciliation.
        </p>
      </div>

      {/* Statutory Legal Authorization Status Warning */}
      {!settings.feeCollectionAuthorized ? (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 text-amber-950 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Statutory Legal Notice: Application Fee Collection Locked</span>
            </div>
            <button
              type="button"
              onClick={() => portalStore.unlockFeeCollection('MFA/SAU-ISB/2026/AUTH-088')}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Unlock & Authorize Fee Collection Now</span>
            </button>
          </div>
          <p className="text-xs leading-relaxed text-amber-800">
            Under strict regulatory guidelines, the proposed application/ballot fee of{' '}
            <strong>PKR {settings.feeAmountPKR.toLocaleString()}</strong> is governed by administrative verification.
            Click the button above to certify official authorization under statutory permit reference{' '}
            <strong>MFA/SAU-ISB/2026/AUTH-088</strong>.
          </p>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="text-sm font-bold text-emerald-900">
                  Statutory Fee Collection Verified & Unlocked
                </strong>
                <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded font-semibold">
                  Permit Ref: {settings.authorizationDocumentRef || 'MFA/SAU-ISB/2026/AUTH-088'}
                </span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Fee collection is officially authorized for candidate document verification, biometric indexing, and computerized ballot entry. Fixed statutory fee:{' '}
                <strong className="font-mono text-emerald-950 font-bold">PKR {settings.feeAmountPKR.toLocaleString()}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN-CONFIGURED QR PAYMENT METHODS SELECTOR */}
      <div className="space-y-5">
        <div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Select Official QR Payment Channel:
          </span>
          <p className="text-xs text-slate-500">
            Scan the official QR code using EasyPaisa, JazzCash, or any Pakistani banking mobile application.
          </p>
        </div>

        {/* QR Channels Tab Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {activeMethods.map((m) => {
            const isSelected = m.id === currentMethod?.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMethodId(m.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 min-h-[64px] ${
                  isSelected
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/50'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-emerald-800 text-emerald-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs block truncate leading-snug">{m.name}</span>
                    <span className={`text-[10px] block truncate ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                      Scan & Pay
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Dedicated QR Code Scan & Pay Showcase Card */}
        {currentMethod && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-900">{currentMethod.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Official QR Gateway
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Merchant: <strong className="text-slate-700">{currentMethod.accountTitle || 'Official Recruitment Portal'}</strong>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Authorized Statutory Fee:</span>
                <span className="text-2xl font-bold font-mono text-emerald-800">
                  PKR {settings.feeAmountPKR.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Main QR Code Centerpiece */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left: Large High-Contrast QR Code */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-gradient-to-b from-slate-50 to-slate-100/70 rounded-2xl border border-slate-200 text-center space-y-3.5">
                <div className="relative group">
                  <div
                    onClick={() => setIsQrModalOpen(true)}
                    className="w-56 h-56 bg-white p-3.5 rounded-2xl border-2 border-emerald-600/60 shadow-lg cursor-pointer hover:shadow-xl transition-all flex items-center justify-center relative overflow-hidden"
                    title="Click to Zoom QR Code Fullscreen"
                  >
                    {currentMethod.qrCodeUrl ? (
                      <img
                        src={currentMethod.qrCodeUrl}
                        alt={currentMethod.name}
                        className="max-w-full max-h-full object-contain block mx-auto"
                      />
                    ) : (
                      <QrCode className="w-24 h-24 text-slate-300" />
                    )}
                  </div>
                  <div className="absolute top-2 right-2 pointer-events-none">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-800 text-white shadow-xs">
                      SCAN ME
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 w-full">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
                    <QrCode className="w-4 h-4 text-emerald-700" />
                    <span>Point Phone Camera / Banking App</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Works directly with EasyPaisa, JazzCash, Raast & all mobile banking apps.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Enlarge QR</span>
                  </button>

                  {currentMethod.qrCodeUrl && (
                    <a
                      href={currentMethod.qrCodeUrl}
                      download={`${currentMethod.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_qr.svg`}
                      className="flex-1 py-2 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Right: Step-by-Step Payment Instructions */}
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-emerald-800 tracking-wider">
                    How to Pay Using QR Code:
                  </span>
                  <h4 className="text-base font-bold text-slate-900">
                    Complete 4-Step Instant Mobile Remittance
                  </h4>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 block font-semibold">Open your Mobile Wallet or Banking App</strong>
                      Launch your EasyPaisa, JazzCash, HBL, Alfalah, UBL, or any Raast-enabled banking app on your phone.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 block font-semibold">Tap "QR Pay" / "Scan QR"</strong>
                      Point your phone's camera at the official QR code shown on the left (or select the downloaded QR image from your gallery).
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 block font-semibold">Confirm Amount & Complete Transfer</strong>
                      Verify the official account title matches <strong className="text-emerald-900">"{currentMethod.accountTitle || 'Official Recruitment Portal'}"</strong> and confirm fee of <strong className="font-mono text-emerald-900">PKR {settings.feeAmountPKR.toLocaleString()}</strong>.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </div>
                    <div className="text-xs text-amber-950 leading-relaxed">
                      <strong className="text-amber-950 block font-semibold">Take Receipt Screenshot with Transaction ID (TRX ID / TID)</strong>
                      Capture a clear screenshot of the successful transaction screen. Enter the TRX ID and upload your screenshot proof in the form below.
                    </div>
                  </div>
                </div>

                {/* Tracking ID reference note */}
                {currentApp && (
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Your Application Tracking ID:</span>
                    <strong className="font-mono text-emerald-900 font-bold bg-white px-2 py-1 rounded border border-slate-200">
                      {currentApp.trackingId}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PAYMENT SUBMISSION SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span>Submit Payment Proof & Transaction Reference</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Attach receipt screenshot for consular finance officers manual bank reconciliation queue
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-amber-300 font-semibold">
            Status: {settings.feeCollectionAuthorized ? 'Queue Active' : 'Fee Locked'}
          </span>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {/* Statutory Verification Warning */}
          <div className="p-4 mb-6 bg-slate-50 border border-slate-300 rounded-xl text-xs space-y-2 text-slate-700">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Info className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>Statutory Compliance & Receipt Disclaimer</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-600">
              Uploading a payment screenshot or bank transaction reference does not constitute confirmed payment receipt or guarantee vacancy eligibility. All submissions undergo mandatory administrative reconciliation against verified bank statement ledgers before candidate status is updated to <em>Processing Approved</em> or <em>Ballot Eligible</em>.
            </p>
          </div>

          {submissionSuccess && (
            <div className="p-4 mb-6 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 shadow-xs animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="space-y-0.5">
                <strong className="block font-bold">Payment Proof Submitted Successfully</strong>
                <span>{submissionSuccess}</span>
              </div>
            </div>
          )}

          {submissionError && (
            <div className="p-4 mb-6 bg-red-50 border border-red-300 text-red-900 rounded-xl text-xs flex items-center gap-2 shadow-xs animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div className="space-y-0.5">
                <strong className="block font-bold">Submission Failed</strong>
                <span>{submissionError}</span>
              </div>
            </div>
          )}

          {candidate ? (
            candidateApps.length > 0 ? (
              <form onSubmit={handlePaymentSubmit} className="space-y-5">
                {/* Application Selector */}
                <div className="space-y-1 text-xs">
                  <label className="block font-semibold text-slate-800">
                    Select Your Recruitment Application <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-700 bg-white cursor-pointer"
                  >
                    {candidateApps.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.trackingId} — {app.jobTitle} (Payment: {app.paymentStatus} | Dossier: {app.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Separation Indicator */}
                {currentApp && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Application Status:</span>
                      <strong className="text-slate-900 font-medium">{currentApp.status}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Payment Status:</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                          currentApp.paymentStatus === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : currentApp.paymentStatus === 'Submitted for Verification'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {currentApp.paymentStatus}
                      </span>
                    </div>
                  </div>
                )}

                {/* Form Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-800">
                      Payment Remittance Method <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={currentMethod?.name || 'QR Code Payment'}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Snapshot of QR gateway method will be recorded permanently.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-800">
                      Transaction ID / Reference (TRX ID / TID) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={trxRef}
                      onChange={(e) => setTrxRef(e.target.value)}
                      placeholder="e.g. EP-982104829 or JC-TID-882190"
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-700"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      From your EasyPaisa, JazzCash, or bank transfer confirmation screen.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-800">
                      Date of Payment <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-800">
                      Fee Amount Verified <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`PKR ${settings.feeAmountPKR.toLocaleString()}`}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-emerald-900 font-bold font-mono cursor-not-allowed"
                    />
                  </div>

                  {/* Screenshot Upload with Live Preview */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block font-semibold text-slate-800">
                      Payment Receipt Screenshot / Deposit Slip Scan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={handleFileChange}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-800 file:text-white hover:file:bg-emerald-700"
                    />

                    {receiptImageData && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
                        <div className="flex items-center gap-3">
                          <img
                            src={receiptImageData}
                            alt="Receipt Preview"
                            className="w-14 h-14 object-cover rounded-lg border border-emerald-300 shadow-2xs"
                          />
                          <div className="text-xs text-emerald-950">
                            <p className="font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Receipt Proof Attached</span>
                            </p>
                            <span className="font-mono text-[11px] text-slate-600">{receiptFileName}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setReceiptImageData(null);
                            setReceiptFileName('');
                          }}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Action Strip */}
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-2 min-h-[44px]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Submit Payment Proof for Admin Verification</span>
                  </button>

                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Statutory Fee Authorization Certified</span>
                  </span>
                </div>
              </form>
            ) : (
              <div className="p-8 bg-slate-50 rounded-xl text-center space-y-3 text-xs text-slate-600">
                <Info className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No Active Vacancy Applications Found</h4>
                <p className="max-w-md mx-auto">
                  You have not submitted any recruitment vacancy applications yet. Browse available jobs and submit your dossier first before lodging payment.
                </p>
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-xl cursor-pointer shadow-xs min-h-[44px]"
                >
                  Browse Available Vacancies
                </button>
              </div>
            )
          ) : (
            <div className="p-8 bg-slate-50 rounded-xl text-center space-y-3 text-xs text-slate-600">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Candidate Sign-In Required</h4>
              <p className="max-w-md mx-auto">
                Please sign in to your registered candidate account to associate your payment reference with your tracking ID.
              </p>
              <button
                type="button"
                onClick={onOpenCandidateAuth}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-xl cursor-pointer shadow-xs min-h-[44px]"
              >
                Sign In to Candidate Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QR ZOOM MODAL */}
      {isQrModalOpen && currentMethod?.qrCodeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 text-xs animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900 text-sm">{currentMethod.name}</span>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 max-w-[260px] mx-auto shadow-inner">
              <img
                src={currentMethod.qrCodeUrl}
                alt="Enlarged QR Code"
                className="w-full h-auto block mx-auto"
              />
            </div>

            <div className="font-mono text-[11px] text-slate-700 space-y-0.5">
              <span className="text-slate-500 block text-[10px]">Account Title: {currentMethod.accountTitle}</span>
              <strong className="text-emerald-900 text-xs font-bold">{currentMethod.accountNumber}</strong>
            </div>

            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl cursor-pointer min-h-[44px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
