import React from 'react';
import { Calendar, AlertCircle, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { OfficialNotice } from '../../types';

interface OfficialNoticesViewProps {
  notices: OfficialNotice[];
}

export const OfficialNoticesView: React.FC<OfficialNoticesViewProps> = ({ notices }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-5">
        <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
          Public Gazette & Circulars
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Official Recruitment Notices
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Authorized administrative announcements regarding candidate balloting, fee policies, and bilateral labor agreements.
        </p>
      </div>

      {/* Notices List */}
      <div className="space-y-6">
        {notices.map((notice) => (
          <article
            key={notice.id}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                  notice.priority === 'Urgent'
                    ? 'bg-red-100 text-red-800'
                    : notice.priority === 'High'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {notice.priority} Priority
                </span>
                <span className="text-xs font-semibold text-slate-700">{notice.category}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>Published: {notice.publishDate}</span>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-900">{notice.title}</h2>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-md text-xs font-medium text-slate-700">
              Summary: {notice.summary}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {notice.content}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Recruitment Coordination Division · Islamabad</span>
              <span className="font-mono">Circular Ref: {notice.id.toUpperCase()}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
