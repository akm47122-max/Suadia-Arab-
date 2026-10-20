import React, { useState } from 'react';
import { X, Shield, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { portalStore } from '../../services/store';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Admin@Saudi2026!');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = portalStore.loginAdmin(username);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message);
    }
  };

  const handleQuickRole = (roleUsername: string) => {
    setError(null);
    const res = portalStore.loginAdmin(roleUsername);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">Administrative Portal Login</h3>
              <p className="text-[11px] text-slate-400">Restricted Consular & Recruitment Staff</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Administrative Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="superadmin or recruiter"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password / Setup Token
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded transition-colors shadow-xs cursor-pointer"
            >
              Authenticate & Enter Admin Console
            </button>
          </form>

          {/* Quick Staff Demo Profiles for Evaluation */}
          <div className="pt-4 border-t border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Role Authentication (Select for Demo):
            </span>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickRole('superadmin')}
                className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded text-left flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-semibold text-amber-300">Super Administrator</div>
                  <div className="text-[10px] text-slate-400">Full control, legal permits & fee toggle</div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">superadmin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('recruiter')}
                className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded text-left flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-semibold text-emerald-400">Recruitment Admin</div>
                  <div className="text-[10px] text-slate-400">Vacancy quotas, candidate approvals, ballot</div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">recruiter</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('finance')}
                className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded text-left flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-semibold text-sky-400">Payment Reviewer</div>
                  <div className="text-[10px] text-slate-400">Bank challans, transaction refs & refund audit</div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">finance</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
