/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { portalStore } from './services/store';
import { NoticeBanner } from './components/NoticeBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/PublicPages/HomeView';
import { JobsView } from './components/PublicPages/JobsView';
import { JobDetailModal } from './components/PublicPages/JobDetailModal';
import { ApplyModal } from './components/PublicPages/ApplyModal';
import { ApplicationReceiptModal } from './components/PublicPages/ApplicationReceiptModal';
import { CandidateAuthModal } from './components/PublicPages/CandidateAuthModal';
import { TrackApplicationView } from './components/PublicPages/TrackApplicationView';
import { PaymentInstructionsView } from './components/PublicPages/PaymentInstructionsView';
import { CandidateDashboardView } from './components/PublicPages/CandidateDashboardView';
import { OfficialNoticesView } from './components/PublicPages/OfficialNoticesView';
import { PoliciesView } from './components/PublicPages/PoliciesView';
import { AdminLoginModal } from './components/Admin/AdminLoginModal';
import { AdminDashboardView } from './components/Admin/AdminDashboardView';
import { HostingerPackageView } from './components/HostingerPackageView';
import { StaffDashboardView } from './components/Staff/StaffDashboardView';
import { StaffLoginModal } from './components/Staff/StaffLoginModal';
import { Application, JobVacancy } from './types';
import { Award } from 'lucide-react';

export default function App() {
  const [storeState, setStoreState] = useState(() => ({
    settings: portalStore.settings,
    categories: portalStore.categories,
    jobs: portalStore.jobs,
    candidates: portalStore.candidates,
    applications: portalStore.applications,
    payments: portalStore.payments,
    paymentMethods: portalStore.paymentMethods,
    ballot: portalStore.ballot,
    admins: portalStore.admins,
    staff: portalStore.staff,
    bonusTiers: portalStore.bonusTiers,
    bonusRecords: portalStore.bonusRecords,
    notices: portalStore.notices,
    auditLogs: portalStore.auditLogs,
    currentCandidate: portalStore.currentCandidate,
    currentAdmin: portalStore.currentAdmin,
    currentStaff: portalStore.currentStaff,
  }));

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = portalStore.subscribe(() => {
      setStoreState({
        settings: { ...portalStore.settings },
        categories: [...portalStore.categories],
        jobs: [...portalStore.jobs],
        candidates: [...portalStore.candidates],
        applications: [...portalStore.applications],
        payments: [...portalStore.payments],
        paymentMethods: [...portalStore.paymentMethods],
        ballot: { ...portalStore.ballot },
        admins: [...portalStore.admins],
        staff: [...portalStore.staff],
        bonusTiers: [...portalStore.bonusTiers],
        bonusRecords: [...portalStore.bonusRecords],
        notices: [...portalStore.notices],
        auditLogs: [...portalStore.auditLogs],
        currentCandidate: portalStore.currentCandidate,
        currentAdmin: portalStore.currentAdmin,
        currentStaff: portalStore.currentStaff,
      });
    });
    return unsubscribe;
  }, []);

  // View state
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedJob, setSelectedJob] = useState<JobVacancy | null>(null);
  const [applyJobTarget, setApplyJobTarget] = useState<JobVacancy | null>(null);
  const [receiptApp, setReceiptApp] = useState<Application | null>(null);
  const [trackedIdQuery, setTrackedIdQuery] = useState<string>('');

  // Modals state
  const [isCandidateAuthOpen, setIsCandidateAuthOpen] = useState(false);
  const [candidateAuthMode, setCandidateAuthMode] = useState<'login' | 'register'>('login');
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);

  // Capture URL referral parameter e.g. ?ref=STF-TRQ-9021
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        localStorage.setItem('saj_active_ref', ref.trim().toUpperCase());
      }
    } catch {}
  }, []);

  // Handlers
  const handleSelectJob = (job: JobVacancy) => {
    setSelectedJob(job);
  };

  const handleApplyJob = (job: JobVacancy) => {
    if (!storeState.currentCandidate) {
      setCandidateAuthMode('login');
      setIsCandidateAuthOpen(true);
    } else {
      setApplyJobTarget(job);
    }
  };

  const handleApplicationLodged = (trackingId: string) => {
    setApplyJobTarget(null);
    const newApp = storeState.applications.find((a) => a.trackingId === trackingId) || null;
    setReceiptApp(newApp);
  };

  const handleTrackSearch = (trackingId: string) => {
    setTrackedIdQuery(trackingId);
    setCurrentView('track');
  };

  // If in admin view and not logged in as admin, show login modal or fallback
  const handleOpenAdmin = () => {
    if (storeState.currentAdmin) {
      setCurrentView('admin');
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans antialiased selection:bg-emerald-800 selection:text-white">
      {/* Statutory Legal Transparency Notice Banner */}
      <NoticeBanner
        settings={storeState.settings}
        onOpenSettings={() => {
          if (!storeState.currentAdmin) {
            setIsAdminLoginOpen(true);
          } else {
            setCurrentView('admin');
          }
        }}
      />

      {/* Main Top Bar Contract Navigation Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'admin') {
            handleOpenAdmin();
          } else if (view === 'staff-dashboard') {
            if (storeState.currentStaff) {
              setCurrentView('staff-dashboard');
            } else {
              setIsStaffLoginOpen(true);
            }
          } else {
            setCurrentView(view);
          }
        }}
        candidate={storeState.currentCandidate}
        admin={storeState.currentAdmin}
        staff={storeState.currentStaff}
        settings={storeState.settings}
        onOpenCandidateAuth={() => {
          setCandidateAuthMode('login');
          setIsCandidateAuthOpen(true);
        }}
        onOpenAdminAuth={() => setIsAdminLoginOpen(true)}
        onOpenStaffAuth={() => setIsStaffLoginOpen(true)}
        onLogoutCandidate={() => {
          portalStore.logoutCandidate();
          if (currentView === 'candidate-dashboard') setCurrentView('home');
        }}
        onLogoutAdmin={() => {
          portalStore.logoutAdmin();
          if (currentView === 'admin') setCurrentView('home');
        }}
        onLogoutStaff={() => {
          portalStore.logoutStaff();
          if (currentView === 'staff-dashboard') setCurrentView('home');
        }}
      />

      {/* View Routing */}
      <div className="flex-1">
        {currentView === 'home' && (
          <HomeView
            jobs={storeState.jobs}
            categories={storeState.categories}
            notices={storeState.notices}
            settings={storeState.settings}
            onSelectJob={handleSelectJob}
            onNavigate={setCurrentView}
            onTrackSearch={handleTrackSearch}
            onApplyJob={handleApplyJob}
          />
        )}

        {currentView === 'jobs' && (
          <JobsView
            jobs={storeState.jobs}
            categories={storeState.categories}
            onSelectJob={handleSelectJob}
            onApplyJob={handleApplyJob}
          />
        )}

        {currentView === 'track' && (
          <TrackApplicationView
            initialTrackingId={trackedIdQuery}
            onNavigateToCandidateDashboard={() => {
              if (storeState.currentCandidate) {
                setCurrentView('candidate-dashboard');
              } else {
                setCandidateAuthMode('login');
                setIsCandidateAuthOpen(true);
              }
            }}
          />
        )}

        {currentView === 'payment' && (
          <PaymentInstructionsView
            settings={storeState.settings}
            candidate={storeState.currentCandidate}
            applications={storeState.applications}
            paymentMethods={storeState.paymentMethods}
            onNavigateToDashboard={() => setCurrentView('candidate-dashboard')}
            onOpenCandidateAuth={() => {
              setCandidateAuthMode('login');
              setIsCandidateAuthOpen(true);
            }}
          />
        )}

        {currentView === 'candidate-dashboard' && (
          storeState.currentCandidate ? (
            <CandidateDashboardView
              candidate={storeState.currentCandidate}
              applications={storeState.applications}
              settings={storeState.settings}
              onOpenReceipt={(app) => setReceiptApp(app)}
              onNavigateToPayment={() => setCurrentView('payment')}
              onNavigateToJobs={() => setCurrentView('jobs')}
            />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-xl border border-slate-200 text-center space-y-4">
              <h3 className="font-bold text-lg text-slate-900">Candidate Session Required</h3>
              <p className="text-xs text-slate-600">
                Please sign in to view your submitted applications, payment receipts, and ballot status.
              </p>
              <button
                onClick={() => {
                  setCandidateAuthMode('login');
                  setIsCandidateAuthOpen(true);
                }}
                className="py-2.5 px-6 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Sign In to Candidate Dashboard
              </button>
            </div>
          )
        )}

        {currentView === 'notices' && (
          <OfficialNoticesView notices={storeState.notices} />
        )}

        {currentView === 'policies' && (
          <PoliciesView settings={storeState.settings} />
        )}

        {currentView === 'hostinger-package' && (
          <HostingerPackageView />
        )}

        {currentView === 'staff-dashboard' && (
          storeState.currentStaff ? (
            <StaffDashboardView
              staff={storeState.currentStaff}
              applications={storeState.applications}
              bonusTiers={storeState.bonusTiers}
              bonusRecords={storeState.bonusRecords}
              settings={storeState.settings}
              onLogout={() => {
                portalStore.logoutStaff();
                setCurrentView('home');
              }}
              onNavigateToPublic={() => setCurrentView('home')}
            />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 text-white rounded-2xl border border-slate-800 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 mx-auto flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">Staff Accreditation Required</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Please authenticate with your official staff username or email and confidential credentials to access your referral earnings ledger.
              </p>
              <button
                onClick={() => setIsStaffLoginOpen(true)}
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition-colors min-h-[44px]"
              >
                Sign In to Staff Dashboard
              </button>
            </div>
          )
        )}

        {currentView === 'admin' && (
          storeState.currentAdmin ? (
            <AdminDashboardView
              admin={storeState.currentAdmin}
              applications={storeState.applications}
              candidates={storeState.candidates}
              jobs={storeState.jobs}
              categories={storeState.categories}
              payments={storeState.payments}
              ballot={storeState.ballot}
              settings={storeState.settings}
              notices={storeState.notices}
              auditLogs={storeState.auditLogs}
              admins={storeState.admins}
              onLogoutAdmin={() => {
                portalStore.logoutAdmin();
                setCurrentView('home');
              }}
              onNavigateToPublic={() => setCurrentView('home')}
            />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 text-white rounded-xl border border-slate-800 text-center space-y-4">
              <h3 className="font-bold text-lg">Staff Authentication Required</h3>
              <p className="text-xs text-slate-400">
                This administrative section is restricted to authorized consular and recruitment officers.
              </p>
              <button
                onClick={() => setIsAdminLoginOpen(true)}
                className="py-2.5 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-bold cursor-pointer"
              >
                Enter Administrative Credentials
              </button>
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <JobDetailModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={(job) => {
          setSelectedJob(null);
          handleApplyJob(job);
        }}
      />

      <ApplyModal
        job={applyJobTarget}
        candidate={storeState.currentCandidate}
        isOpen={!!applyJobTarget}
        onClose={() => setApplyJobTarget(null)}
        onRequireAuth={() => {
          setCandidateAuthMode('login');
          setIsCandidateAuthOpen(true);
        }}
        onApplicationLodged={handleApplicationLodged}
      />

      <ApplicationReceiptModal
        application={receiptApp}
        settings={storeState.settings}
        isOpen={!!receiptApp}
        onClose={() => setReceiptApp(null)}
        onNavigateToPayment={() => setCurrentView('payment')}
      />

      <CandidateAuthModal
        isOpen={isCandidateAuthOpen}
        onClose={() => setIsCandidateAuthOpen(false)}
        defaultMode={candidateAuthMode}
        onSuccess={() => {
          if (applyJobTarget) {
            // Re-open apply modal if was waiting to apply
          } else {
            setCurrentView('candidate-dashboard');
          }
        }}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => setCurrentView('admin')}
      />

      <StaffLoginModal
        isOpen={isStaffLoginOpen}
        onClose={() => setIsStaffLoginOpen(false)}
        onSuccess={() => setCurrentView('staff-dashboard')}
      />

      {/* Institutional Footer */}
      <Footer settings={storeState.settings} onNavigate={setCurrentView} />
    </div>
  );
}
