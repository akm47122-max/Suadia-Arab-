import React, { useState } from 'react';
import { Search, MapPin, Briefcase, Filter, ChevronRight, CheckCircle2 } from 'lucide-react';
import { JobVacancy, JobCategory } from '../../types';

interface JobsViewProps {
  jobs: JobVacancy[];
  categories: JobCategory[];
  onSelectJob: (job: JobVacancy) => void;
  onApplyJob: (job: JobVacancy) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({
  jobs,
  categories,
  onSelectJob,
  onApplyJob,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
  const [minSalary, setMinSalary] = useState<number>(0);
  const [selectedCity, setSelectedCity] = useState('All');

  const filteredJobs = jobs.filter((job) => {
    if (!job.isPublished) return false;
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.employer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || job.category === selectedCategory;
    const matchesGender = selectedGender === 'All' || job.genderEligibility === selectedGender || job.genderEligibility === 'Any';
    const matchesSalary = job.salarySAR >= minSalary;
    const matchesCity = selectedCity === 'All' || job.location.toLowerCase().includes(selectedCity.toLowerCase());

    return matchesSearch && matchesCat && matchesGender && matchesSalary && matchesCity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
          Verified Quota Directory
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Available Job Vacancies in Saudi Arabia
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          All positions are authorized under bilateral manpower agreements with verified corporate sponsors.
        </p>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Driver, Nurse, Technician..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Trade / Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-emerald-700"
            >
              <option value="All">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Eligibility */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Gender Eligibility</label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-emerald-700"
            >
              <option value="All">All Eligible Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Any">Equal Opportunity (Any)</option>
            </select>
          </div>

          {/* Saudi City */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Saudi Duty Station</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-emerald-700"
            >
              <option value="All">All Duty Stations</option>
              <option value="Riyadh">Riyadh Region</option>
              <option value="Jeddah">Jeddah / Western Province</option>
              <option value="Dammam">Dammam / Eastern Province</option>
              <option value="Madinah">Madinah Munawwarah</option>
              <option value="Jubail">Jubail Industrial City</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Found <strong className="text-slate-900">{filteredJobs.length}</strong> matching vacancies</span>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSelectedGender('All');
              setSelectedCity('All');
              setMinSalary(0);
            }}
            className="text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs hover:border-emerald-600 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-emerald-800">{job.category}</span>
                <span className="font-mono text-amber-800">{job.deadline} Cutoff</span>
              </div>

              <h3 className="font-bold text-base text-slate-900">{job.title}</h3>
              <p className="text-xs text-slate-500">{job.employer}</p>

              <div className="py-2 border-y border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Remuneration:</span>
                  <strong className="text-emerald-800 font-bold font-mono">{job.salarySAR.toLocaleString()} SAR</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Age Limit:</span>
                  <strong className="text-amber-800 font-semibold">{job.ageLimit || '21 - 40 Years'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Eligibility / Pre-req:</span>
                  <span className="text-slate-900 font-medium truncate max-w-[170px]" title={job.eligibility || job.qualification}>
                    {job.eligibility || job.qualification}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deployment Location:</span>
                  <span className="text-slate-900">{job.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available Quota:</span>
                  <span className="text-slate-900">{job.positions} Positions ({job.genderEligibility})</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">
                {job.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => onSelectJob(job)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                View Full Dossier
              </button>
              <button
                onClick={() => onApplyJob(job)}
                className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                Apply for Vacancy
              </button>
            </div>
          </div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="col-span-full bg-slate-50 border border-slate-200 rounded-lg p-12 text-center text-slate-500 text-sm">
            No vacancies matched your selected search criteria. Try clearing some filters.
          </div>
        )}
      </div>
    </div>
  );
};
