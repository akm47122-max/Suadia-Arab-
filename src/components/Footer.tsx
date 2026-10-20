import React from 'react';
import { ShieldAlert, Phone, Mail, MapPin, Download } from 'lucide-react';
import { SystemSettings } from '../types';

interface FooterProps {
  settings: SystemSettings;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      {/* Top Advisory Banner */}
      <div className="bg-emerald-950/60 border-b border-emerald-900/50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-slate-300">
              <strong className="text-white">Recruitment Anti-Fraud Advisory:</strong> Genuine employment visas to the Kingdom of Saudi Arabia are subject to Ministry of Human Resources & Social Development (MHRSD) quota regulations. Paying an administrative fee does not guarantee employment, ballot win, or visa clearance.
            </p>
          </div>
          <button
            onClick={() => onNavigate('policies')}
            className="text-amber-400 hover:text-amber-300 underline whitespace-nowrap shrink-0 cursor-pointer font-medium"
          >
            Review Recruitment Code & Policies
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <span className="w-6 h-6 rounded bg-emerald-800 flex items-center justify-center text-amber-300 text-xs">🇸🇦</span>
            <span>{settings.activePublicName}</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-xs">
            Facilitating structured manpower deployment between the Islamic Republic of Pakistan and the Kingdom of Saudi Arabia.
          </p>
          <div className="pt-2 text-[11px] text-slate-500">
            {settings.isEmbassyAuthorized ? (
              <span className="text-emerald-400">Verified Embassy Accreditation Active</span>
            ) : (
              <span className="text-amber-400/90">Autonomous recruitment facilitation service. Written diplomatic endorsement unverified.</span>
            )}
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-2">
          <h4 className="text-slate-200 font-semibold text-xs tracking-wider uppercase">Portal Access</h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors cursor-pointer">
                Home & Vacancies
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('jobs')} className="hover:text-white transition-colors cursor-pointer">
                Verified Jobs Directory
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('track')} className="hover:text-white transition-colors cursor-pointer">
                Track Application (Tracking ID)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('payment')} className="hover:text-white transition-colors cursor-pointer">
                Payment Verification & Bank Challan
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('notices')} className="hover:text-white transition-colors cursor-pointer">
                Official Notices & Circulars
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Legal & Statutory */}
        <div className="space-y-2">
          <h4 className="text-slate-200 font-semibold text-xs tracking-wider uppercase">Statutory Governance</h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button onClick={() => onNavigate('policies')} className="hover:text-white transition-colors cursor-pointer">
                Recruitment Authorization Terms
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('policies')} className="hover:text-white transition-colors cursor-pointer">
                Privacy & Data Protection (CNIC Safeguards)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('policies')} className="hover:text-white transition-colors cursor-pointer">
                PKR 4,500 Fee & Refund Regulations
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('hostinger-package')} className="text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer">
                <Download className="w-3.5 h-3.5" />
                <span>Hostinger PHP 8.2 & SQL Export</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4: Contact & Verification */}
        <div className="space-y-2">
          <h4 className="text-slate-200 font-semibold text-xs tracking-wider uppercase">Support & Coordination</h4>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{settings.contactAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono">{settings.contactHelpline}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{settings.contactEmail}</span>
            </div>
            <div className="pt-2 text-[11px] text-amber-300">
              Tentative Ballot Date: <strong className="font-mono">{settings.ballotDate}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <div>
          © 2026 {settings.activePublicName}. Technical deployment package ready for Hostinger Shared Hosting (PHP 8.2 + MySQL).
        </div>
        <div className="flex items-center gap-4">
          <span>Encrypted Session Protection</span>
          <span>·</span>
          <span>PDO Prepared Statements</span>
          <span>·</span>
          <span>Zero Plaintext Passwords</span>
        </div>
      </div>
    </footer>
  );
};
