import React from 'react';
import { User, Shield, LogOut, CheckCircle2, Award, Users } from 'lucide-react';
import { CandidateUser, AdminUser, SystemSettings, StaffUser } from '../types';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  candidate: CandidateUser | null;
  admin: AdminUser | null;
  staff: StaffUser | null;
  settings: SystemSettings;
  onOpenCandidateAuth: () => void;
  onOpenAdminAuth: () => void;
  onOpenStaffAuth: () => void;
  onLogoutCandidate: () => void;
  onLogoutAdmin: () => void;
  onLogoutStaff: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  candidate,
  admin,
  staff,
  settings,
  onOpenCandidateAuth,
  onOpenAdminAuth,
  onOpenStaffAuth,
  onLogoutCandidate,
  onLogoutAdmin,
  onLogoutStaff,
}) => {
  return (
    <header className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="text-left flex items-center gap-3 cursor-pointer group whitespace-nowrap shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-800 border border-emerald-600/60 flex items-center justify-center shrink-0 text-amber-300 font-bold text-xs tracking-wider">
            {settings.isEmbassyAuthorized ? '🇸🇦' : 'SAJ'}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm sm:text-base tracking-tight text-white group-hover:text-amber-200 transition-colors">
              {settings.activePublicName}
            </span>
            <span className="text-[10px] text-emerald-300/80 tracking-wide font-normal">
              {settings.isEmbassyAuthorized ? 'Consular Manpower Division' : 'Official Portal for Pakistani Applicants'}
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (single-line, concise) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium text-emerald-100/90">
          <button
            onClick={() => onNavigate('home')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentView === 'home' ? 'text-amber-300 font-semibold' : 'text-emerald-200/80'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('jobs')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentView === 'jobs' ? 'text-amber-300 font-semibold' : 'text-emerald-200/80'
            }`}
          >
            Available Jobs
          </button>
          <button
            onClick={() => onNavigate('track')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentView === 'track' ? 'text-amber-300 font-semibold' : 'text-emerald-200/80'
            }`}
          >
            Track Application
          </button>
          <button
            onClick={() => onNavigate('payment')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentView === 'payment' ? 'text-amber-300 font-semibold' : 'text-emerald-200/80'
            }`}
          >
            Fee & Challan
          </button>
          <button
            onClick={() => onNavigate('notices')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentView === 'notices' ? 'text-amber-300 font-semibold' : 'text-emerald-200/80'
            }`}
          >
            Official Notices
          </button>
          <button
            onClick={() => {
              if (staff) {
                onNavigate('staff-dashboard');
              } else {
                onOpenStaffAuth();
              }
            }}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-white flex items-center gap-1 ${
              currentView === 'staff-dashboard' ? 'text-amber-300 font-semibold' : 'text-emerald-200/80'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Staff Portal</span>
          </button>
          <button
            onClick={() => onNavigate('hostinger-package')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 px-2 py-1 rounded bg-emerald-900/80 border border-emerald-700/60 text-amber-200 hover:text-white ${
              currentView === 'hostinger-package' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : ''
            }`}
          >
            Hostinger PHP Source
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {candidate ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('candidate-dashboard')}
                className="px-3 py-1.5 text-xs font-medium text-emerald-100 bg-emerald-900 hover:bg-emerald-800 border border-emerald-700/70 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
              >
                <User className="w-3.5 h-3.5 text-emerald-300" />
                <span className="max-w-[120px] truncate">{candidate.fullName.split(' ')[0]} (Dashboard)</span>
              </button>
              <button
                onClick={onLogoutCandidate}
                title="Log out Candidate"
                className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-md transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : staff ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('staff-dashboard')}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs min-h-[38px]"
              >
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span className="max-w-[130px] truncate">Staff: {staff.fullName.split(' ')[0]}</span>
                <span className="text-[10px] text-amber-300 font-mono hidden sm:inline">({staff.referralCode})</span>
              </button>
              <button
                onClick={onLogoutStaff}
                title="Log out Staff"
                className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-900 rounded-md transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : admin ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('admin')}
                className="px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs min-h-[38px]"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console ({admin.role.replace('_', ' ')})</span>
              </button>
              <button
                onClick={onLogoutAdmin}
                title="Log out Admin"
                className="p-1.5 text-amber-300 hover:text-white hover:bg-emerald-800 rounded-md transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenCandidateAuth}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-white rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
              >
                Candidate Portal
              </button>
              <button
                onClick={onOpenStaffAuth}
                className="px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:text-white bg-emerald-900/90 hover:bg-emerald-800 border border-amber-500/40 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 min-h-[38px]"
                title="Staff Referral Dashboard"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xs:inline">Staff</span>
              </button>
              <button
                onClick={onOpenAdminAuth}
                className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-emerald-300 hover:text-white hover:bg-emerald-900 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 border border-emerald-800 min-h-[38px]"
                title="Admin Console"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
