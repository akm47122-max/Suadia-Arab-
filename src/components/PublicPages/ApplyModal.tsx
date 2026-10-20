import React, { useState } from 'react';
import { X, CheckCircle2, FileText, Upload, ShieldCheck, AlertCircle } from 'lucide-react';
import { JobVacancy, CandidateUser } from '../../types';
import { portalStore } from '../../services/store';

interface ApplyModalProps {
  job: JobVacancy | null;
  candidate: CandidateUser | null;
  isOpen: boolean;
  onClose: () => void;
  onRequireAuth: () => void;
  onApplicationLodged: (trackingId: string) => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  job,
  candidate,
  isOpen,
  onClose,
  onRequireAuth,
  onApplicationLodged,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedDocs, setAttachedDocs] = useState<Array<{ title: string; fileName: string; fileSize: string }>>([
    { title: 'Computerized National Identity Card (CNIC)', fileName: 'Candidate_CNIC_Scan.pdf', fileSize: '1.2 MB' },
    { title: 'Valid International Passport (First Page)', fileName: 'Passport_Copy.pdf', fileSize: '980 KB' },
    { title: 'Educational / Vocational Certificates', fileName: 'Academic_Transcripts.pdf', fileSize: '2.1 MB' },
  ]);
  const [referralCodeInput, setReferralCodeInput] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) return ref.trim().toUpperCase();
      return localStorage.getItem('saj_active_ref') || '';
    } catch {
      return '';
    }
  });

  if (!isOpen || !job) return null;

  const handleApply = () => {
    if (!candidate) {
      onRequireAuth();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = portalStore.submitApplication(job.id, attachedDocs, referralCodeInput);
      if (res.success && res.application) {
        setIsSubmitting(false);
        onApplicationLodged(res.application.trackingId);
      } else {
        setIsSubmitting(false);
        setError(res.message);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Error lodging application.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-900">
          <div>
            <span className="text-xs text-amber-300 font-semibold tracking-wide uppercase">
              Recruitment Application Submission
            </span>
            <h3 className="font-semibold text-lg">{job.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Job summary review */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-600">
              <span>Sponsor / Employer:</span>
              <strong className="text-slate-900">{job.employer}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Location:</span>
              <strong className="text-slate-900">{job.location}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Monthly Salary:</span>
              <strong className="text-emerald-800 font-semibold text-sm">{job.salarySAR.toLocaleString()} SAR</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Contract Duration:</span>
              <strong className="text-slate-900">{job.contractDuration}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Application Cutoff:</span>
              <strong className="text-amber-700 font-mono">{job.deadline}</strong>
            </div>
          </div>

          {/* Candidate Profile Verification */}
          {candidate ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Applying as Registered Candidate:</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-700 pt-1">
                <div>Applicant: <strong className="text-slate-900">{candidate.fullName}</strong></div>
                <div>CNIC: <span className="font-mono text-slate-900">{candidate.cnic}</span></div>
                <div>Mobile: <span className="font-mono text-slate-900">{candidate.mobile}</span></div>
                <div>Passport: <strong className="text-slate-900">{candidate.passportStatus}</strong></div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Candidate Sign-In Required</span>
              </div>
              <p>You must register or log into your candidate account before submitting an application.</p>
              <button
                onClick={onRequireAuth}
                className="mt-1 py-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer w-fit"
              >
                Sign In / Register Now
              </button>
            </div>
          )}

          {/* Optional Staff Referral Code */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800">
                Staff Referral Code <span className="font-normal text-slate-500">(Optional):</span>
              </label>
              {referralCodeInput && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Referral Linked
                </span>
              )}
            </div>
            <input
              type="text"
              value={referralCodeInput}
              onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. STF-TRQ-9021"
              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 font-mono text-xs uppercase"
            />
            <span className="text-[10px] text-slate-500 block">
              If a field recruitment officer or community ambassador assisted you, enter their unique code above.
            </span>
          </div>

          {/* Document checklist */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Required Dossier Documents:
            </label>
            <div className="space-y-1.5">
              {attachedDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-medium text-slate-800">{doc.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">{doc.fileSize}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Acknowledgement */}
          <div className="p-3 bg-slate-100 rounded text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Legal Certification & Attestation:</div>
            <p>
              I certify under penalty of disqualification that all attached documents and educational diplomas are genuine. I acknowledge that registration generates an official Tracking ID for computerized ballot entry and administrative evaluation.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Lodging Application...' : 'Confirm & Lodge Application'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
