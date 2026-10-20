import React, { useState } from 'react';
import { ShieldAlert, FileText, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';
import { SystemSettings } from '../../types';

interface PoliciesViewProps {
  settings: SystemSettings;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({ settings }) => {
  const [activeSection, setActiveSection] = useState<'about' | 'contact' | 'privacy' | 'terms' | 'refund'>('about');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
          Governance & Statutory Disclosures
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Policies, Terms & Verification Disclosures
        </h1>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveSection('about')}
          className={`py-2 px-4 rounded-md cursor-pointer transition-colors ${
            activeSection === 'about' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          About the Portal
        </button>
        <button
          onClick={() => setActiveSection('contact')}
          className={`py-2 px-4 rounded-md cursor-pointer transition-colors ${
            activeSection === 'contact' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Contact & Helplines
        </button>
        <button
          onClick={() => setActiveSection('privacy')}
          className={`py-2 px-4 rounded-md cursor-pointer transition-colors ${
            activeSection === 'privacy' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Privacy & CNIC Safeguards
        </button>
        <button
          onClick={() => setActiveSection('terms')}
          className={`py-2 px-4 rounded-md cursor-pointer transition-colors ${
            activeSection === 'terms' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Terms & Anti-Fraud Rules
        </button>
        <button
          onClick={() => setActiveSection('refund')}
          className={`py-2 px-4 rounded-md cursor-pointer transition-colors ${
            activeSection === 'refund' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          PKR 4,500 Fee & Refund Regulations
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">
        {activeSection === 'about' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">About {settings.activePublicName}</h2>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
              <strong>Recruitment Name Disclosure:</strong> The proposed organization name is "Royal Saudi Embassy in Islamabad". Prior to displaying official diplomatic titles, logos, or sovereign endorsements, our compliance rules mandate documented written authorization. Operating in the interim under <strong>"{settings.temporaryPublicName}"</strong> ensures absolute transparency with no false diplomatic claims.
            </div>
            <p>
              The portal serves as a structured digital bridge for Pakistani job seekers aspiring to work in Saudi Arabia. We ensure all job vacancies are authenticated against verified commercial employers with approved labor visas under the Saudi Ministry of Human Resources & Social Development (MHRSD).
            </p>
            <p>
              By eliminating rogue agents and third-party fee gouging, candidates submit applications directly through secure cryptographic tracking IDs backed by an immutable audit trail.
            </p>
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Official Contact & Coordination Desk</h2>
            <p>
              For candidate inquiry, fee verification assistance, or reporting unauthorized recruitment solicitations:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <MapPin className="w-4 h-4 text-emerald-800" />
                  <span>Physical Address</span>
                </div>
                <p className="text-slate-600">{settings.contactAddress}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Phone className="w-4 h-4 text-emerald-800" />
                  <span>National Recruitment Helpline</span>
                </div>
                <p className="font-mono text-slate-900 font-bold">{settings.contactHelpline}</p>
                <span className="text-[11px] text-slate-500 block">Mon–Fri: 9:00 AM – 5:00 PM PKT</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Mail className="w-4 h-4 text-emerald-800" />
                  <span>Electronic Mail Support</span>
                </div>
                <p className="font-mono text-slate-900">{settings.contactEmail}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Anti-Fraud Whistleblower Line</span>
                </div>
                <p className="text-slate-600">complaints@saudijobsportal.pk</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Privacy Policy & National CNIC Safeguards</h2>
            <p>
              We adhere to the highest digital security standards under Pakistani and international data protection laws:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>
                <strong>Public Tracking Redaction:</strong> Our public lookup tool displays only non-sensitive application milestones. CNIC numbers, mobile contacts, residential addresses, and passports are never rendered publicly.
              </li>
              <li>
                <strong>Strict Encryption:</strong> User passwords are encrypted using PHP's native <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">password_hash(PASSWORD_BCRYPT)</code>. Plaintext passwords are never recorded in database or session memory.
              </li>
              <li>
                <strong>Prepared SQL Statements:</strong> All database queries utilize PDO prepared statements with strict parameter binding to eliminate SQL injection vulnerabilities.
              </li>
              <li>
                <strong>Restricted Administrative Access:</strong> Role-based access control (RBAC) ensures only authorized payment and recruitment officers view sensitive identity documents.
              </li>
            </ul>
          </div>
        )}

        {activeSection === 'terms' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Terms of Service & Candidate Code</h2>
            <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs space-y-1">
              <strong>CRITICAL RECRUITMENT DISCLAIMER:</strong>
              <p>
                1. Submission of an application or payment of the administrative processing fee DOES NOT guarantee employment, a ballot win, biometric issuance, visa approval, or final employer selection.
              </p>
              <p>
                2. Final visa issuance remains the exclusive sovereign jurisdiction of the Kingdom of Saudi Arabia's Ministry of Foreign Affairs and Ministry of Human Resources.
              </p>
            </div>
            <p>
              Candidates agree to provide strictly authentic educational and vocational certificates. Lodging fabricated degrees or forged police certificates results in immediate permanent blacklist from all Saudi recruitment quotas.
            </p>
          </div>
        )}

        {activeSection === 'refund' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">PKR 4,500 Fee & Refund Regulations</h2>
            <p>
              The proposed administrative fee of <strong>PKR 4,500</strong> covers document authentication, technical qualification attestation, and computerized ballot entry costs.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <span>
                  <strong>Disabled Collection Status:</strong> The fee cannot be collected until statutory regulatory approval is active in portal settings.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <span>
                  <strong>Full Refund on Quota Cancellation:</strong> If a sponsor cancels an authorized job quota prior to ballot draw, candidates receive 100% reimbursement to their originating bank account.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <span>
                  <strong>Reconciliation Timeline:</strong> Approved refunds are credited within 7 to 10 banking days through official banking channels with audit tracking reference.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
