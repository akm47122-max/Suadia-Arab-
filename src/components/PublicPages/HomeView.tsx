import React, { useState } from 'react';
import { Search, MapPin, Briefcase, Calendar, ShieldCheck, ChevronRight, ArrowRight, FileCheck, CheckCircle2 } from 'lucide-react';
import { JobVacancy, JobCategory, OfficialNotice, SystemSettings } from '../../types';

interface HomeViewProps {
  jobs: JobVacancy[];
  categories: JobCategory[];
  notices: OfficialNotice[];
  settings: SystemSettings;
  onSelectJob: (job: JobVacancy) => void;
  onNavigate: (view: string) => void;
  onTrackSearch: (trackingId: string) => void;
  onApplyJob: (job: JobVacancy) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  jobs,
  categories,
  notices,
  settings,
  onSelectJob,
  onNavigate,
  onTrackSearch,
  onApplyJob,
}) => {
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
  const [quickTrackInput, setQuickTrackInput] = useState('');

  const filteredJobs = jobs.filter((job) => {
    if (!job.isPublished) return false;
    const matchesTitle =
      job.title.toLowerCase().includes(searchTitle.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTitle.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTitle.toLowerCase());
    const matchesCat = selectedCategory === 'All' || job.category === selectedCategory;
    const matchesGender = selectedGender === 'All' || job.genderEligibility === selectedGender || job.genderEligibility === 'Any';
    return matchesTitle && matchesCat && matchesGender;
  });

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackInput.trim()) {
      onTrackSearch(quickTrackInput.trim());
      onNavigate('track');
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative bg-emerald-950 text-white overflow-hidden border-b border-emerald-900">
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src="/src/assets/images/hero_recruitment_saudi_pakistan_1792420331629.jpg"
            alt="Saudi Arabia Financial Center"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/90 to-emerald-950/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-900/80 border border-emerald-700/60 text-xs font-medium text-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Verified Saudi Arabia Employment Quota — 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Empowering Pakistani Professionals in <span className="text-amber-300">Saudi Arabia</span>
              </h1>

              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
                Official online gateway for skilled technical, healthcare, logistics, and industrial manpower recruitment. Transparent computerized tracking, verified sponsor quotas, and structured candidate evaluation.
              </p>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('jobs')}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs sm:text-sm rounded-md transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>Explore Verified Vacancies</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('payment')}
                  className="px-4 py-2.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/60 font-medium text-xs sm:text-sm rounded-md transition-colors cursor-pointer"
                >
                  Fee & Challan Policy
                </button>
              </div>

              {/* Stat row with unboxed clean typography */}
              <div className="pt-6 border-t border-emerald-900/80 flex items-center gap-6 text-xs text-emerald-200/80 font-mono">
                <div>
                  <span className="text-white font-bold text-base block tabular-nums">22 Dec 2026</span>
                  <span>Proposed Ballot Date</span>
                </div>
                <div className="text-emerald-800">|</div>
                <div>
                  <span className="text-white font-bold text-base block tabular-nums">PKR 4,500</span>
                  <span>Ballot Administrative Fee</span>
                </div>
                <div className="text-emerald-800">|</div>
                <div>
                  <span className="text-white font-bold text-base block tabular-nums">10 Dec 2026</span>
                  <span>Application Cutoff</span>
                </div>
              </div>
            </div>

            {/* Right Card: Instant Tracking Lookup */}
            <div className="lg:col-span-5">
              <div className="bg-white/95 backdrop-blur-md rounded-xl p-6 text-slate-900 shadow-2xl border border-slate-200">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm mb-1">
                  <Search className="w-4 h-4 text-emerald-700" />
                  <span>Track Existing Application</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Enter your assigned Tracking ID (e.g., SAJ-2026-000101) to verify processing, payment, and ballot status.
                </p>

                <form onSubmit={handleQuickTrackSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Tracking ID
                    </label>
                    <input
                      type="text"
                      value={quickTrackInput}
                      onChange={(e) => setQuickTrackInput(e.target.value)}
                      placeholder="SAJ-2026-XXXXXX"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Check Application Status</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Privacy Protected</span>
                  <span>·</span>
                  <span>No Public CNIC Disclosure</span>
                  <span>·</span>
                  <span>Instant Verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Filter & Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="Search job title, skills, or city (e.g. Driver, Nurse, Riyadh)..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {/* Category Filter */}
            <div className="sm:col-span-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
              >
                <option value="All">All Categories ({categories.length})</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Eligibility Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
              >
                <option value="All">Gender: All Eligible</option>
                <option value="Male">Male Applicants</option>
                <option value="Female">Female Applicants</option>
                <option value="Any">Equal Opportunity</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div>
              Showing <strong className="text-slate-800">{filteredJobs.length}</strong> verified vacancies
            </div>
            <button
              onClick={() => {
                setSearchTitle('');
                setSelectedCategory('All');
                setSelectedGender('All');
              }}
              className="text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Latest Vacancies Grid */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Authorized Vacancies
              </span>
              <h2 className="text-2xl font-bold text-slate-900">Current Saudi Recruitment Quotas</h2>
            </div>
            <button
              onClick={() => onNavigate('jobs')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Vacancies</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.slice(0, 6).map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs hover:border-emerald-600 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Clean unboxed metadata (anti-pill) */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-emerald-800">{job.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {job.location}
                    </span>
                  </div>

                  <h3 className="font-semibold text-base text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {job.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Authorized Sponsor:</span>
                      <span className="font-medium text-slate-900 truncate max-w-[180px]">{job.employer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Monthly Compensation:</span>
                      <strong className="text-emerald-800 font-mono font-bold">
                        {job.salarySAR.toLocaleString()} SAR
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Positions Available:</span>
                      <span className="font-medium text-slate-900">{job.positions} Positions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gender Eligibility:</span>
                      <span className="font-medium text-slate-900">{job.genderEligibility}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectJob(job)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => onApplyJob(job)}
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors shadow-2xs cursor-pointer"
                  >
                    Apply for Vacancy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4-Step Application Roadmap */}
        <section className="bg-slate-900 text-white rounded-xl p-8 border border-slate-800 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-300">
              Structured Recruitment Lifecycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold">Candidate Application Process</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Clear, auditable steps from initial profile registration to computerized ballot entry and deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-lg p-5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center font-mono">
                1
              </div>
              <h4 className="font-semibold text-sm text-white">Candidate Registration</h4>
              <p className="text-slate-400 leading-relaxed">
                Provide your CNIC, mobile, educational transcripts, passport status, and professional work experience.
              </p>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/60 rounded-lg p-5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center font-mono">
                2
              </div>
              <h4 className="font-semibold text-sm text-white">Vacancy Selection</h4>
              <p className="text-slate-400 leading-relaxed">
                Select your designated trade or skill quota and lodge an application with required document dossier.
              </p>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/60 rounded-lg p-5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center font-mono">
                3
              </div>
              <h4 className="font-semibold text-sm text-white">Unique Tracking ID</h4>
              <p className="text-slate-400 leading-relaxed">
                Receive an immediate collision-resistant Tracking ID (e.g., SAJ-2026-000125) and printable receipt slip.
              </p>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/60 rounded-lg p-5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center font-mono">
                4
              </div>
              <h4 className="font-semibold text-sm text-white">22 Dec 2026 Ballot</h4>
              <p className="text-slate-400 leading-relaxed">
                Candidates with verified credentials and fee status are entered into the auditable computerized ballot.
              </p>
            </div>
          </div>
        </section>

        {/* Workplace Showcase & Trust Section */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full">
            <img
              src="/src/assets/images/candidate_success_workplace_1792420332384.jpg"
              alt="Healthcare and engineering professionals"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-800">
              Workforce Bilateral Exchange
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Transparent, Direct Recruitment Without Unauthorized Middlemen
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every job listing on this portal is verified against registered Saudi commercial entities and licensed manpower quotas. All applications are tracked digitally to protect job seekers from sub-agent fraud and unverified promises.
            </p>

            <div className="space-y-2 pt-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Strict statutory compliance with Pakistan Emigration Ordinance & Saudi Labor Regulations.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Transparent fee structure (PKR 4,500) governed by administrative audit controls.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Auditable computerized ballot draw planned for 22 December 2026.</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('policies')}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                <span>Read Full Anti-Fraud & Regulatory Disclosure</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Official Notices Banner */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">Official Notices & Circulars</h3>
            <button
              onClick={() => onNavigate('notices')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
            >
              View All Notices
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-emerald-800">{notice.category}</span>
                    <span className="font-mono">{notice.publishDate}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900">{notice.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-3">{notice.summary}</p>
                </div>
                <button
                  onClick={() => onNavigate('notices')}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-900 pt-2 cursor-pointer text-left"
                >
                  Read full circular →
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
