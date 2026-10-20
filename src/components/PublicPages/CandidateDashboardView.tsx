import React, { useState } from 'react';
import { User, FileText, CreditCard, Bell, ShieldCheck, Printer, Calendar, Clock, ChevronRight, Eye } from 'lucide-react';
import { CandidateUser, Application, SystemSettings, PaymentRecord } from '../../types';
import { portalStore } from '../../services/store';

interface CandidateDashboardViewProps {
  candidate: CandidateUser;
  applications: Application[];
  settings: SystemSettings;
  onOpenReceipt: (app: Application) => void;
  onNavigateToPayment: () => void;
  onNavigateToJobs: () => void;
}

export const CandidateDashboardView: React.FC<CandidateDashboardViewProps> = ({
  candidate,
  applications,
  settings,
  onOpenReceipt,
  onNavigateToPayment,
  onNavigateToJobs,
}) => {
  const [activeTab, setActiveTab] = useState<'applications' | 'profile' | 'notifications'>('applications');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<PaymentRecord | null>(null);
  const [educationInput, setEducationInput] = useState(candidate.education);
  const [experienceInput, setExperienceInput] = useState(candidate.experienceYears);
  const [passportInput, setPassportInput] = useState(candidate.passportStatus);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  const myApplications = applications.filter((a) => a.candidateId === candidate.id);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    portalStore.updateCandidateProfile({
      education: educationInput,
      experienceYears: Number(experienceInput),
      passportStatus: passportInput,
    });
    setIsEditingProfile(false);
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-emerald-950 text-white rounded-xl p-6 border border-emerald-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">
            Applicant Control Center
          </span>
          <h1 className="text-2xl font-bold text-white">{candidate.fullName}</h1>
          <div className="flex items-center gap-3 text-xs text-emerald-200/80 font-mono">
            <span>CNIC: {candidate.cnic}</span>
            <span>·</span>
            <span>Mobile: {candidate.mobile}</span>
            <span>·</span>
            <span className="text-amber-200 font-sans">{candidate.city}, {candidate.province}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToJobs}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-md transition-colors cursor-pointer"
          >
            Browse More Vacancies
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold bg-white rounded-t-lg border-t border-x">
        <button
          onClick={() => setActiveTab('applications')}
          className={`py-3 px-6 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'applications'
              ? 'border-emerald-700 text-emerald-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-800" />
          <span>My Applications ({myApplications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-6 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'profile'
              ? 'border-emerald-700 text-emerald-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 text-emerald-800" />
          <span>Profile & Qualifications</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`py-3 px-6 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'notifications'
              ? 'border-emerald-700 text-emerald-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4 text-emerald-800" />
          <span>Ballot & Alerts</span>
        </button>
      </div>

      {/* Tab 1: Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {myApplications.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-b-xl border border-slate-200 text-slate-500 space-y-3">
              <p className="text-sm">You haven't lodged any vacancy applications yet.</p>
              <button
                onClick={onNavigateToJobs}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded cursor-pointer"
              >
                Apply for Saudi Arabia Jobs
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[11px] font-mono text-slate-500">Tracking Reference</span>
                      <div className="text-lg font-bold font-mono text-emerald-900">{app.trackingId}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onOpenReceipt(app)}
                        className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Application Slip</span>
                      </button>
                      {portalStore.payments.find((p) => p.applicationId === app.id) ? (
                        <button
                          onClick={() => setViewingPayment(portalStore.payments.find((p) => p.applicationId === app.id) || null)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-700" />
                          <span>View Payment Slip</span>
                        </button>
                      ) : null}
                      <button
                        onClick={onNavigateToPayment}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded cursor-pointer"
                      >
                        Fee / Payment Status
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Position</span>
                      <strong className="text-slate-900 block mt-0.5">{app.jobTitle}</strong>
                      <span className="text-slate-500 text-[11px]">{app.jobLocation}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Application Status</span>
                      <strong className="text-emerald-900 block mt-0.5">{app.status}</strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Fee Verification</span>
                      <strong className={`block mt-0.5 ${
                        app.paymentStatus === 'Verified' ? 'text-emerald-700' : 'text-amber-800'
                      }`}>
                        {app.paymentStatus}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Ballot / Next Stage</span>
                      <strong className="text-amber-900 block mt-0.5">{app.nextStageStatus}</strong>
                    </div>
                  </div>

                  {app.rejectionReason && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs">
                      <strong>Rejection Note:</strong> {app.rejectionReason}
                    </div>
                  )}

                  {app.additionalDocumentsRequested && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded text-xs">
                      <strong>Action Required:</strong> Administrator requested further documents: {app.additionalDocumentsRequested}
                    </div>
                  )}

                  {/* History Preview */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Applied on: <strong className="font-mono text-slate-700">{app.appliedDate}</strong></span>
                    <span>Ballot Schedule: <strong className="font-mono text-amber-800">{settings.ballotDate}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Personal & Professional Credentials</h3>
              <p className="text-xs text-slate-500">Details authenticated for Saudi recruitment quotas</p>
            </div>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold cursor-pointer"
              >
                Edit Profile
              </button>
            )}
          </div>

          {profileSavedMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded">
              Profile changes saved successfully.
            </div>
          )}

          {!isEditingProfile ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-700">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">Full Name:</span>
                  <strong className="text-slate-900 text-sm">{candidate.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Email Address:</span>
                  <span className="font-mono">{candidate.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Mobile Number:</span>
                  <span className="font-mono">{candidate.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">National CNIC:</span>
                  <span className="font-mono font-bold text-slate-900">{candidate.cnic}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">Education / Qualifications:</span>
                  <strong className="text-slate-900">{candidate.education}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Work Experience:</span>
                  <strong className="text-slate-900">{candidate.experienceYears} Years</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Passport Status:</span>
                  <strong className="text-emerald-800">{candidate.passportStatus}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Attached CV:</span>
                  <span className="font-mono text-slate-600">{candidate.cvFileName || 'Uploaded'}</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Education / Degree</label>
                  <input
                    type="text"
                    value={educationInput}
                    onChange={(e) => setEducationInput(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={experienceInput}
                    onChange={(e) => setExperienceInput(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                    min="0"
                    max="40"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Passport Status</label>
                  <select
                    value={passportInput}
                    onChange={(e) => setPassportInput(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  >
                    <option value="Valid Passport">Valid Passport</option>
                    <option value="In-process">In-process</option>
                    <option value="Not Applied">Not Applied</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded cursor-pointer"
                >
                  Save Updates
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 border-b border-slate-200 pb-3">
            Ballot & Recruitment Advisories
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-start gap-3">
              <Calendar className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-950 font-bold block">
                  Ballot Date Tentatively Scheduled: {settings.ballotDate}
                </strong>
                <p className="text-emerald-900 mt-1">
                  Computerized selection draw will be performed for all candidates whose documents and payment verifications are completed by 10 December 2026.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 font-bold block">
                  SMS & Email Delivery Status
                </strong>
                <p className="text-slate-600 mt-1">
                  System notices are mirrored in this portal dashboard. To prevent carrier filtering, check this dashboard regularly for status updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Payment Receipt Preview Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto text-xs animate-fadeIn">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider block">
                  Official Bank Deposit Receipt
                </span>
                <h3 className="font-bold text-base mt-0.5">
                  Payment Slip — Tracking ID: {viewingPayment.trackingId}
                </h3>
              </div>
              <button
                onClick={() => setViewingPayment(null)}
                className="text-emerald-300 hover:text-white p-1 rounded-md cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Payment Method:</span>
                <strong className="text-slate-900">{viewingPayment.paymentMethod || 'Official QR Code Gateway'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Transaction Ref:</span>
                <strong className="text-amber-800 font-mono">{viewingPayment.transactionRef}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Amount:</span>
                <strong className="text-emerald-800 font-mono">PKR {viewingPayment.amountPKR.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Verification Status:</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  viewingPayment.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                  viewingPayment.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {viewingPayment.status}
                </span>
              </div>
            </div>

            <div className="p-6 overflow-auto max-h-[55vh] flex items-center justify-center bg-slate-100">
              {viewingPayment.receiptImageData ? (
                <img
                  src={viewingPayment.receiptImageData}
                  alt={`Payment slip for ${viewingPayment.trackingId}`}
                  className="max-w-full h-auto object-contain rounded shadow-md border border-slate-300"
                />
              ) : (
                <div className="p-8 text-center bg-white rounded-lg border border-slate-200 space-y-2">
                  <p className="font-semibold text-slate-800">Deposit Slip Recorded</p>
                  <p className="text-slate-500 text-xs">File: {viewingPayment.receiptFileName}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">
                Submitted on {viewingPayment.submittedAt}
              </span>
              <button
                type="button"
                onClick={() => setViewingPayment(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
