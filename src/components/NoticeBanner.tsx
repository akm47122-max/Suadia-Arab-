import React from 'react';
import { AlertTriangle, ShieldCheck, FileCheck } from 'lucide-react';
import { SystemSettings } from '../types';

interface NoticeBannerProps {
  settings: SystemSettings;
  onOpenSettings?: () => void;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ settings, onOpenSettings }) => {
  if (settings.isEmbassyAuthorized) {
    return (
      <div className="bg-emerald-900 text-emerald-100 px-4 py-2 text-xs font-medium border-b border-emerald-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Official Embassy Authorization Verified — Reference: <span className="font-mono text-emerald-300">{settings.authorizationDocumentRef || 'DIP/ISB-2026/AUTH-09'}</span>
            </span>
          </div>
          <span className="hidden sm:inline text-emerald-300/80">Recruitment Division Protocol Active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-950 text-amber-200 px-4 py-2.5 text-xs border-b border-amber-900/60">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-100">Statutory Transparency Notice:</strong> Operating under temporary title{' '}
            <span className="underline font-medium text-amber-100">"{settings.temporaryPublicName}"</span> pending verified written diplomatic authorization. No official government or embassy endorsement is claimed.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-amber-300/90 text-xs">
          <span>Fee Collection: {settings.feeCollectionAuthorized ? 'Active (Authorized)' : 'Disabled by Policy'}</span>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-amber-400 hover:text-amber-200 underline flex items-center gap-1 cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Admin Verify</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
