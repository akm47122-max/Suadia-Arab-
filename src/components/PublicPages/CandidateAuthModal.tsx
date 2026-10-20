import React, { useState } from 'react';
import { X, UserPlus, LogIn, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { portalStore } from '../../services/store';
import { INITIAL_CATEGORIES } from '../../data/initialData';

interface CandidateAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  onSuccess: () => void;
}

export const CandidateAuthModal: React.FC<CandidateAuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login form state
  const [loginEmailOrCnic, setLoginEmailOrCnic] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regCnic, setRegCnic] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regGender, setRegGender] = useState<'Male' | 'Female'>('Male');
  const [regCity, setRegCity] = useState('');
  const [regProvince, setRegProvince] = useState('Punjab');
  const [regEducation, setRegEducation] = useState('Matriculation');
  const [regExperience, setRegExperience] = useState<number>(2);
  const [regPassportStatus, setRegPassportStatus] = useState<'Valid Passport' | 'In-process' | 'Not Applied'>('Valid Passport');
  const [regPreferredCategory, setRegPreferredCategory] = useState(INITIAL_CATEGORIES[0].name);
  const [regCvName, setRegCvName] = useState<string>('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmailOrCnic.trim()) {
      setError('Please provide your registered Email or CNIC number.');
      return;
    }

    const res = portalStore.loginCandidate(loginEmailOrCnic);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message);
    }
  };

  const handleQuickDemoLogin = (email: string) => {
    setError(null);
    const res = portalStore.loginCandidate(email);
    if (res.success) {
      onSuccess();
      onClose();
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Pakistani CNIC check (13 digits: e.g. 35202-1234567-1 or 3520212345671)
    const cnicDigits = regCnic.replace(/\D/g, '');
    if (cnicDigits.length !== 13) {
      setError('Please enter a valid 13-digit Pakistani CNIC number (e.g. 35202-1234567-1).');
      return;
    }

    // Pakistani mobile check (03xx-xxxxxxx)
    const mobileDigits = regMobile.replace(/\D/g, '');
    if (mobileDigits.length !== 11 || !mobileDigits.startsWith('03')) {
      setError('Please enter a valid 11-digit Pakistani mobile number starting with 03 (e.g. 0300-1234567).');
      return;
    }

    const formattedCnic = `${cnicDigits.slice(0, 5)}-${cnicDigits.slice(5, 12)}-${cnicDigits.slice(12)}`;
    const formattedMobile = `${mobileDigits.slice(0, 4)}-${mobileDigits.slice(4)}`;

    const res = portalStore.registerCandidate({
      fullName: regFullName.trim(),
      email: regEmail.trim(),
      mobile: formattedMobile,
      cnic: formattedCnic,
      dob: regDob || '1996-01-01',
      gender: regGender,
      city: regCity.trim() || 'Islamabad',
      province: regProvince,
      education: regEducation,
      experienceYears: Number(regExperience) || 0,
      passportStatus: regPassportStatus,
      preferredCategory: regPreferredCategory,
      cvFileName: regCvName || 'Candidate_Resume.pdf',
    });

    if (res.success) {
      setSuccessMsg('Candidate registration completed successfully! You can now apply for vacancies.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-800 flex items-center justify-center text-amber-300 font-bold text-xs">
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-base">
                {mode === 'login' ? 'Candidate Portal Login' : 'Candidate Registration Form'}
              </h3>
              <p className="text-xs text-emerald-300/80">Recruitment Division — Pakistan Applicants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'login' ? 'border-emerald-700 text-emerald-900 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Candidate Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'register' ? 'border-emerald-700 text-emerald-900 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create New Candidate Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Registered Email Address or 13-digit CNIC
                </label>
                <input
                  type="text"
                  value={loginEmailOrCnic}
                  onChange={(e) => setLoginEmailOrCnic(e.target.value)}
                  placeholder="e.g. usman.khan@example.com or 35202-8472911-3"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Account Password / PIN
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  defaultValue="Password@123"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Password protected with PHP password_hash(PASSWORD_BCRYPT) standard in backend database.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white font-medium text-sm rounded-md transition-colors shadow-xs cursor-pointer"
              >
                Sign In to Candidate Dashboard
              </button>

              {/* Demo quick logins for easy evaluation */}
              <div className="pt-4 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Instant Demo Test Accounts:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('usman.khan@example.com')}
                    className="p-2 border border-slate-200 rounded text-left hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="font-medium text-slate-900">M. Usman (Electrician)</div>
                    <div className="text-[10px] text-slate-500 font-mono">SAJ-2026-000101</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('ayesha.nurse@example.com')}
                    className="p-2 border border-slate-200 rounded text-left hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="font-medium text-slate-900">Ayesha Bibi (Nurse)</div>
                    <div className="text-[10px] text-slate-500 font-mono">SAJ-2026-000102</div>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="As per CNIC/Passport"
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="candidate@example.pk"
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    placeholder="0300-1234567"
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">CNIC Number (13 Digits) *</label>
                  <input
                    type="text"
                    value={regCnic}
                    onChange={(e) => setRegCnic(e.target.value)}
                    placeholder="35202-1234567-1"
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Gender *</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as 'Male' | 'Female')}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Passport Status *</label>
                  <select
                    value={regPassportStatus}
                    onChange={(e) => setRegPassportStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="Valid Passport">Valid Passport</option>
                    <option value="In-process">In-process</option>
                    <option value="Not Applied">Not Applied</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="e.g. Lahore, Rawalpindi"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Province *</label>
                  <select
                    value={regProvince}
                    onChange={(e) => setRegProvince(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Islamabad ICT">Islamabad ICT</option>
                    <option value="Azad Jammu & Kashmir">Azad Jammu & Kashmir</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Education / Qualification</label>
                  <input
                    type="text"
                    value={regEducation}
                    onChange={(e) => setRegEducation(e.target.value)}
                    placeholder="e.g. DAE, Matric, BSc Nursing"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={regExperience}
                    onChange={(e) => setRegExperience(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Job Category</label>
                <select
                  value={regPreferredCategory}
                  onChange={(e) => setRegPreferredCategory(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                >
                  {INITIAL_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Resume / CV Document</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-md text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{regCvName ? regCvName : 'Select PDF/DOCX CV file'}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setRegCvName(e.target.files[0].name);
                        }
                      }}
                    />
                  </label>
                  {regCvName && <span className="text-xs text-emerald-700 font-medium">Ready</span>}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm rounded-md transition-colors shadow-xs cursor-pointer"
                >
                  Create Candidate Profile & Register
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
