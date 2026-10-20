import React from 'react';
import { X, MapPin, Briefcase, Calendar, CheckCircle2, ShieldCheck, FileText, AlertCircle } from 'lucide-react';
import { JobVacancy } from '../../types';

interface JobDetailModalProps {
  job: JobVacancy | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (job: JobVacancy) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onApply,
}) => {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-start justify-between border-b border-emerald-900">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <span>{job.category}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {job.verificationStatus}
              </span>
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-white">{job.title}</h3>
            <p className="text-xs text-emerald-200/80">{job.employer}</p>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[11px] text-slate-500 block">Monthly Salary</span>
              <span className="text-base font-bold text-emerald-800 font-mono">
                {job.salarySAR.toLocaleString()} SAR
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[11px] text-slate-500 block">Positions</span>
              <span className="text-base font-bold text-slate-900">{job.positions} Openings</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[11px] text-slate-500 block">Gender Eligibility</span>
              <span className="text-base font-bold text-slate-900">{job.genderEligibility}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[11px] text-slate-500 block">Cutoff Deadline</span>
              <span className="text-xs font-bold font-mono text-amber-700 mt-1 block">{job.deadline}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Job Description & Duties</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 border border-slate-100 rounded-lg">
              {job.description}
            </p>
          </div>

          {/* Requirements & Criteria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg">
              <span className="font-semibold text-amber-900 block uppercase text-[11px] tracking-wide">Age Limit:</span>
              <p className="text-slate-900 font-bold">{job.ageLimit || '21 - 40 Years'}</p>
            </div>
            <div className="space-y-1.5 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
              <span className="font-semibold text-emerald-900 block uppercase text-[11px] tracking-wide">Eligibility Criteria:</span>
              <p className="text-slate-800">{job.eligibility || job.qualification}</p>
            </div>
            <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-900 block">Required Qualification:</span>
              <p className="text-slate-600">{job.qualification}</p>
            </div>
            <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-900 block">Experience Requisite:</span>
              <p className="text-slate-600">{job.experienceRequired}</p>
            </div>
            <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-900 block">Contract Terms & Leave:</span>
              <p className="text-slate-600">{job.contractDuration}</p>
            </div>
            <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-900 block">Saudi Duty Station:</span>
              <p className="text-slate-600">{job.location}</p>
            </div>
          </div>

          {/* Required Documents */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Required Dossier Documents</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {job.requiredDocuments.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-emerald-50/50 border border-emerald-100 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="text-slate-700 font-medium">{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transparency & Anti-Fraud Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              <strong>Employer Verification Declaration:</strong> This vacancy has been reviewed against registered commercial registration quotas. Neither the portal nor authorized employers collect unauthorized cash fees outside official bank channels.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onApply(job);
            }}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Proceed to Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
