import React, { useState } from 'react';
import { Search, ShieldAlert, CheckCircle2, Clock, Lock, KeyRound, AlertTriangle, ArrowRight } from 'lucide-react';
import { portalStore } from '../../services/store';
import { Application } from '../../types';

interface TrackApplicationViewProps {
  initialTrackingId?: string;
  onNavigateToCandidateDashboard: () => void;
}

export const TrackApplicationView: React.FC<TrackApplicationViewProps> = ({
  initialTrackingId = '',
  onNavigateToCandidateDashboard,
}) => {
  const [trackingInput, setTrackingInput] = useState(initialTrackingId);
  const [searchedId, setSearchedId] = useState(initialTrackingId);
  const [publicData, setPublicData] = useState<Partial<Application> | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [secondaryAuthCode, setSecondaryAuthCode] = useState('');
  const [unlockedFullApp, setUnlockedFullApp] = useState<Application | null>(null);
  const [secondaryAuthError, setSecondaryAuthError] = useState<string | null>(null);

  // Auto-search if initial tracking ID is provided
  React.useEffect(() => {
    if (initialTrackingId) {
      handleSearchId(initialTrackingId);
    }
  }, [initialTrackingId]);

  const handleSearchId = (idToSearch: string) => {
    const cleanId = idToSearch.trim().toUpperCase();
    setSearchedId(cleanId);
    setUnlockedFullApp(null);
    setSecondaryAuthError(null);

    if (!cleanId) return;

    const res = portalStore.trackApplication(cleanId);
    if (res.found && res.data) {
      setPublicData(res.data);
      setNotFound(false);
    } else {
      setPublicData(null);
      setNotFound(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchId(trackingInput);
  };

  const handleSecondaryVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setSecondaryAuthError(null);

    const res = portalStore.verifyTrackWithSecondaryAuth(searchedId, secondaryAuthCode);
    if (res.success && res.application) {
      setUnlockedFullApp(res.application);
    } else {
      setSecondaryAuthError('Verification code does not match registered applicant mobile or CNIC records.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
          Public Verification & Status Lookup
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Track Recruitment Application
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Verify your official application processing queue, fee verification status, and computerized ballot entry.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Enter 14-Character Collision-Resistant Tracking ID
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="e.g. SAJ-2026-000101"
                required
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm font-mono tracking-wider focus:ring-2 focus:ring-emerald-700 uppercase"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-6 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            >
              Verify Tracking ID
            </button>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Example demo IDs for testing: <span className="font-mono text-emerald-800 font-semibold cursor-pointer underline" onClick={() => { setTrackingInput('SAJ-2026-000101'); handleSearchId('SAJ-2026-000101'); }}>SAJ-2026-000101</span>, <span className="font-mono text-emerald-800 font-semibold cursor-pointer underline" onClick={() => { setTrackingInput('SAJ-2026-000102'); handleSearchId('SAJ-2026-000102'); }}>SAJ-2026-000102</span>
          </span>
        </form>
      </div>

      {/* Result Display */}
      {notFound && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>Tracking ID Not Recognized</span>
          </div>
          <p className="text-xs text-red-700 leading-relaxed">
            No active record found matching Tracking ID <strong className="font-mono">{searchedId}</strong> in the central database. Please confirm the number printed on your registration slip. To prevent candidate enumeration, detailed logs are safeguarded.
          </p>
        </div>
      )}

      {publicData && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden space-y-6">
          {/* Header Strip */}
          <div className="bg-emerald-950 text-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider block">
                Official Tracking Record
              </span>
              <h2 className="text-2xl font-bold font-mono tracking-wider text-white">
                {publicData.trackingId}
              </h2>
              <div className="text-xs text-emerald-200/80 mt-1">
                Designated Vacancy: <strong className="text-white">{publicData.jobTitle}</strong> ({publicData.jobLocation})
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-[10px] text-emerald-300 uppercase block font-semibold">Lodged Date</span>
              <span className="font-mono text-xs text-white">{publicData.appliedDate}</span>
            </div>
          </div>

          {/* Primary Status Cards */}
          <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Application Processing</span>
              <span className="text-sm font-bold text-emerald-900 mt-1 block">
                {publicData.status}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Fee Verification Status</span>
              <span className={`text-sm font-bold mt-1 block ${
                publicData.paymentStatus === 'Verified' ? 'text-emerald-700' : 'text-amber-800'
              }`}>
                {publicData.paymentStatus}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Next-Stage / Ballot</span>
              <span className="text-sm font-bold text-amber-900 mt-1 block">
                {publicData.nextStageStatus}
              </span>
            </div>
          </div>

          {/* Privacy Redaction Box */}
          <div className="mx-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Lock className="w-4 h-4 text-emerald-800" />
              <span>Public Privacy Protection Protocol Active</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              To protect personal privacy, candidate CNIC, passport information, contact numbers, and uploaded credentials are redacted in public searches.
            </p>
          </div>

          {/* Status Timeline History */}
          <div className="px-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Processing History & Milestones
            </h3>
            <div className="space-y-2">
              {publicData.statusHistory?.map((hist, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-md text-xs">
                  <Clock className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">{hist.status}</strong>
                      <span className="font-mono text-[11px] text-slate-500">{hist.changedAt}</span>
                    </div>
                    {hist.notes && <p className="text-slate-600 mt-1 text-[11px]">{hist.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Verification Unlock Accordion */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <KeyRound className="w-4 h-4 text-emerald-800" />
                <span>Applicant Secondary Verification (Unlock Full Details)</span>
              </div>
              <button
                onClick={onNavigateToCandidateDashboard}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold cursor-pointer underline"
              >
                Go to Candidate Dashboard →
              </button>
            </div>

            {!unlockedFullApp ? (
              <form onSubmit={handleSecondaryVerify} className="space-y-3">
                <p className="text-[11px] text-slate-600">
                  Are you the applicant? Enter the <strong>last 4 digits of your CNIC</strong> (or your registered Pakistani mobile number) to unlock your sensitive profile and document verification logs:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={secondaryAuthCode}
                    onChange={(e) => setSecondaryAuthCode(e.target.value)}
                    placeholder="e.g. 74-2 or 0321-7654321"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded cursor-pointer"
                  >
                    Unlock Confidential Dossier
                  </button>
                </div>
                {secondaryAuthError && (
                  <span className="text-[11px] text-red-600 block">{secondaryAuthError}</span>
                )}
              </form>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Applicant Identity Verified</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-800">
                  <div>Full Legal Name: <strong>{unlockedFullApp.candidateName}</strong></div>
                  <div>National CNIC: <span className="font-mono font-semibold">{unlockedFullApp.candidateCnic}</span></div>
                  <div>Mobile Number: <span className="font-mono font-semibold">{unlockedFullApp.candidateMobile}</span></div>
                  <div>Applicant Domicile: <span>{unlockedFullApp.candidateCity}, {unlockedFullApp.candidateProvince}</span></div>
                  {unlockedFullApp.reviewerName && (
                    <div className="col-span-2 text-slate-600 pt-1 border-t border-emerald-200">
                      Officer Review Stamp: <strong>{unlockedFullApp.reviewerName}</strong> ({unlockedFullApp.reviewedAt})
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
