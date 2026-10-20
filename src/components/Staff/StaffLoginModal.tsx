import React, { useState } from 'react';
import { X, Shield, Lock, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { portalStore } from '../../services/store';
import { StaffUser } from '../../types';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (staff: StaffUser) => void;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!usernameOrEmail.trim()) {
      setError('Please enter your staff username or email address.');
      return;
    }

    if (!password) {
      setError('Please enter your assigned password or temporary access key.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      try {
        const res = portalStore.loginStaff(usernameOrEmail, password);
        if (res.success && res.staff) {
          setIsLoading(false);
          onSuccess(res.staff);
          onClose();
        } else {
          setIsLoading(false);
          setError(res.message);
        }
      } catch (err: any) {
        setIsLoading(false);
        setError(err?.message || 'Authentication error. Please verify your credentials.');
      }
    }, 350);
  };

  const handleQuickDemoFill = (username: string, pass: string) => {
    setUsernameOrEmail(username);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden my-auto text-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                Authorized Personnel Portal
              </span>
              <h3 className="font-bold text-lg text-white">Staff Member Login</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Statutory Policy Notice: No Public Staff Registration */}
          <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-[11px] text-emerald-200/90 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 text-emerald-300 mb-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Admin-Controlled Staff Provisioning</span>
            </div>
            Staff accounts and unique referral IDs are strictly provisioned by the Central Recruitment Directorate. Public registration is prohibited to protect quota integrity.
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 text-red-200 text-xs rounded-xl flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Username or Official Email *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g. staff_tariq or email@domain.pk"
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password or Temporary Access Key *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your confidential password"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <span>{isLoading ? 'Verifying Session...' : 'Sign In to Staff Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Pre-fills for Testing & Verification */}
          <div className="pt-3 border-t border-slate-800/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Fast Demo Accounts (Testing Only):
            </span>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickDemoFill('staff_tariq', 'ChangeMe@2026!')}
                className="p-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left cursor-pointer transition-colors"
              >
                <div className="font-semibold text-emerald-300 truncate">Tariq (Active)</div>
                <div className="text-[9px] text-slate-400 font-mono">STF-TRQ-9021</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('staff_ayesha', 'ChangeMe@2026!')}
                className="p-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left cursor-pointer transition-colors"
              >
                <div className="font-semibold text-emerald-300 truncate">Ayesha (Coord)</div>
                <div className="text-[9px] text-slate-400 font-mono">STF-AYS-4182</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('staff_bilal', 'STF!Pass92#')}
                className="p-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left cursor-pointer transition-colors"
              >
                <div className="font-semibold text-amber-300 truncate">Bilal (1st Login)</div>
                <div className="text-[9px] text-slate-400 font-mono">Pwd Reset Req</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 text-center">
          Security protected by bcrypt hash verification, session regeneration & rate-limiting protection.
        </div>
      </div>
    </div>
  );
};
