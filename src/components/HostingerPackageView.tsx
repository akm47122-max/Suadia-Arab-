import React, { useState } from 'react';
import { Download, FileCode, Database, Server, Check, Copy, ExternalLink, ShieldCheck, HelpCircle } from 'lucide-react';
import { getPhpPackageFiles, generateZipArchive, PhpFileEntry } from '../services/phpPackageGenerator';

export const HostingerPackageView: React.FC = () => {
  const files = getPhpPackageFiles();
  const [selectedFilePath, setSelectedFilePath] = useState<string>(files[0].path);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const selectedFile = files.find((f) => f.path === selectedFilePath) || files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const blob = await generateZipArchive();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saudi-jobs-portal-hostinger-php82-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
      alert('Error creating ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            Hostinger Shared Hosting Deployment Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Complete PHP 8.2 + MySQL / MariaDB Source Code
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            No Node.js runtime required on live production. Ready to upload directly to Hostinger <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">public_html/</code>.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'Generating ZIP...' : 'Download Full Hostinger ZIP Package'}</span>
        </button>
      </div>

      {/* Hostinger Step-by-Step Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <Database className="w-4 h-4 text-emerald-700" />
            <span>Step 1: MySQL Import</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Import <code className="font-mono text-emerald-800 font-semibold">database.sql</code> via Hostinger hPanel phpMyAdmin. Creates 16 relational tables with foreign keys and unique Tracking ID constraint.
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <FileCode className="w-4 h-4 text-emerald-700" />
            <span>Step 2: Database Credentials</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Update <code className="font-mono text-emerald-800 font-semibold">config/database.php</code> with your Hostinger DB user, DB name, and DB password. PDO handles connection pooling securely.
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <Server className="w-4 h-4 text-emerald-700" />
            <span>Step 3: Upload to public_html</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Extract the ZIP files into Hostinger <code className="font-mono text-emerald-800 font-semibold">public_html/</code>. The provided <code className="font-mono">.htaccess</code> sets security headers and protects SQL files.
          </p>
        </div>
      </div>

      {/* Code Browser */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left File Tree */}
        <div className="lg:col-span-4 border-r border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Package File Tree ({files.length} Files)
          </div>
          <div className="space-y-1 text-xs">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFilePath(file.path)}
                className={`w-full text-left p-2.5 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                  selectedFilePath === file.path
                    ? 'bg-emerald-800 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {file.path.endsWith('.sql') ? (
                    <Database className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="font-mono text-[11px] truncate">{file.path}</span>
                </div>
                <span className={`text-[10px] uppercase font-sans px-1.5 py-0.5 rounded ${
                  selectedFilePath === file.path ? 'bg-emerald-950 text-amber-300' : 'bg-slate-200 text-slate-600'
                }`}>
                  {file.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Code Display */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950 text-slate-200">
          {/* File bar */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="font-mono font-bold text-xs text-white">{selectedFile.path}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedFile.description}</p>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Syntax text */}
          <div className="p-4 overflow-auto flex-1 font-mono text-xs leading-relaxed text-slate-300">
            <pre className="whitespace-pre-wrap">{selectedFile.content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
