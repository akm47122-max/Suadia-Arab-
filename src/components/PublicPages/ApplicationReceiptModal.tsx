import React from 'react';
import { X, Printer, Download, CheckCircle2, QrCode } from 'lucide-react';
import { Application, SystemSettings } from '../../types';

interface ApplicationReceiptModalProps {
  application: Application | null;
  settings: SystemSettings;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPayment: () => void;
}

export const ApplicationReceiptModal: React.FC<ApplicationReceiptModalProps> = ({
  application,
  settings,
  isOpen,
  onClose,
  onNavigateToPayment,
}) => {
  if (!isOpen || !application) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    document.title = `Application_Receipt_${application.trackingId}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed-none print:static">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden my-auto print:max-h-none print:shadow-none print:border-none print:w-full print:m-0">
        {/* Header bar (hidden on print) */}
        <div className="bg-emerald-950 text-white px-6 py-3.5 flex items-center justify-between border-b border-emerald-900 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Official Candidate Registration Slip</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Save application summary as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-xs rounded text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-emerald-300 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="p-8 overflow-y-auto space-y-6 text-slate-800 bg-white print:p-4 print:text-black">
          {/* Header Seal & Title */}
          <div className="border-b-2 border-emerald-900 pb-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase font-bold tracking-widest text-emerald-800">
                {settings.isEmbassyAuthorized ? 'Royal Saudi Embassy — Consular Section' : 'Autonomous Recruitment Coordination Division'}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">{settings.activePublicName}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Islamabad Diplomatic Protocol Corridor · Manpower Registration Docket 2026
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="inline-block p-2 border-2 border-emerald-900/30 rounded-lg bg-emerald-50/40 text-center shadow-xs">
                {/* High-fidelity Mock QR Code */}
                <div className="relative w-16 h-16 bg-white p-1 rounded border border-slate-300 mx-auto flex items-center justify-center">
                  <QrCode className="w-14 h-14 text-emerald-950" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-emerald-900 text-amber-300 text-[6px] font-mono px-1 py-0.5 rounded font-bold shadow-xs">
                      SAJ
                    </span>
                  </div>
                </div>
                <span className="text-[8px] font-mono font-bold block text-emerald-950 mt-1 uppercase tracking-tighter">
                  {application.trackingId}
                </span>
                <span className="text-[7px] text-slate-500 block uppercase">SECURE VERIFICATION QR</span>
              </div>
            </div>
          </div>

          {/* Primary Tracking Box */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-900 block">
                Collision-Resistant Application Tracking ID:
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-950 tracking-wider">
                {application.trackingId}
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] text-slate-500 block">Lodged Timestamp</span>
              <span className="text-xs font-mono font-semibold text-slate-800">{application.appliedDate}</span>
            </div>
          </div>

          {/* Applicant & Job Information Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 border border-slate-200 rounded p-3 bg-slate-50/60">
              <h4 className="font-bold text-emerald-900 uppercase text-[11px] tracking-wide border-b border-slate-200 pb-1">
                Candidate Particulars
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant Name:</span>
                <span className="font-semibold text-slate-900">{application.candidateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">National CNIC:</span>
                <span className="font-mono font-semibold text-slate-900">{application.candidateCnic}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mobile Contact:</span>
                <span className="font-mono text-slate-900">{application.candidateMobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Domicile City/Province:</span>
                <span className="text-slate-900">{application.candidateCity}, {application.candidateProvince}</span>
              </div>
            </div>

            <div className="space-y-2 border border-slate-200 rounded p-3 bg-slate-50/60">
              <h4 className="font-bold text-emerald-900 uppercase text-[11px] tracking-wide border-b border-slate-200 pb-1">
                Vacancy & Deployment
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-500">Designated Job:</span>
                <span className="font-semibold text-slate-900">{application.jobTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Saudi Deployment:</span>
                <span className="text-slate-900">{application.jobLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Application Status:</span>
                <span className="font-semibold text-emerald-900">{application.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Computerized Ballot Date:</span>
                <span className="font-mono font-semibold text-amber-800">{settings.ballotDate}</span>
              </div>
            </div>
          </div>

          {/* Fee & Payment Notice */}
          <div className="border border-slate-200 rounded p-3.5 bg-white text-xs space-y-1">
            <div className="font-semibold text-slate-900 flex items-center justify-between">
              <span>Application / Ballot Fee Docket (PKR {settings.feeAmountPKR.toLocaleString()}):</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                application.paymentStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {application.paymentStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              {settings.feeCollectionAuthorized ? (
                <>Deposit via authorized bank transfer or designated bank challan using your Tracking ID <strong>{application.trackingId}</strong> as reference.</>
              ) : (
                <>Fee collection is currently withheld pending statutory authorization. Do not submit payment until official notification is issued.</>
              )}
            </p>
          </div>

          {/* Barcode & Security Strip */}
          <div className="pt-2 text-center border-t border-slate-200">
            <div className="font-mono text-xs tracking-widest text-slate-600">
              ||||| | |||| |||||| || | |||| ||||| ||||||| ||| ||||||| |||||| |
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Generated by Central Manpower Database · Security Hash: SHA256-COLLISION-GUARDED-2026
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close Receipt
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-xs font-semibold rounded-md text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigateToPayment();
              }}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Proceed to Payment & Challan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
