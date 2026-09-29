import React, { useState } from 'react';
import {
  Code,
  FileCode,
  Copy,
  Check,
  Download,
  ExternalLink,
  Database,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { CODE_GS_CONTENT, INDEX_HTML_CONTENT, downloadFile } from '../data/gasTemplates';
import { GasConfig } from '../types';
import { GasService } from '../services/gasService';

interface PanduanGasModalProps {
  gasConfig: GasConfig;
  onUpdateGasConfig: (config: GasConfig) => void;
}

export const PanduanGasModal: React.FC<PanduanGasModalProps> = ({
  gasConfig,
  onUpdateGasConfig
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'codegs' | 'indexhtml'>('codegs');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>(gasConfig.webAppUrl || '');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleTestAndSave = async () => {
    if (!inputUrl.trim()) {
      alert('Silakan masukkan URL Web App Google Apps Script.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    const result = await GasService.testConnection(inputUrl.trim());
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      onUpdateGasConfig({
        ...gasConfig,
        webAppUrl: inputUrl.trim(),
        isConnected: true,
        lastSync: new Date().toISOString()
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Kartu Sambungan Google Spreadsheet & Drive */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Google Spreadsheet
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                gasConfig.webAppUrl
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {gasConfig.webAppUrl ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Spreadsheet Terhubung</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Penyimpanan Lokal Aktif</span>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            URL Aplikasi Web Google Apps Script (Web App URL Deployment)
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <button
              onClick={handleTestAndSave}
              disabled={isTesting}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap hover:shadow"
            >
              {isTesting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menguji...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-100" />
                  <span>Tes & Sambungkan</span>
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>{testResult.message}</div>
            </div>
          )}
        </div>
      </div>

      {/* Petunjuk Langkah demi Langkah */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>Panduan Pemasangan di Google Spreadsheet (5 Menit Selesai)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">
                1
              </span>
              <span>Buat Spreadsheet & Buka Apps Script</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Buka <a href="https://spreadsheet.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">Google Sheets</a> baru. Beri judul misal <code className="bg-white px-1 py-0.5 border rounded">JURNAL SIKAWAN SDN BABELAN KOTA 01 2026</code>. Buka menu <strong>Ekstensi</strong> &gt; <strong>Apps Script</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Tempel Script Code.gs</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Hapus isi file bawaan <code className="bg-white px-1 py-0.5 border rounded">Kode.gs</code>, lalu salin dan tempelkan kode lengkap dari tab <strong>Code.gs</strong> di bawah ini.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">
                3
              </span>
              <span>Buat File Index.html</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Di Apps Script, klik tombol <strong>+ (Tambah file)</strong> &gt; pilih <strong>HTML</strong> &gt; beri nama persis <code className="bg-white px-1 py-0.5 border rounded">Index</code> &gt; tempelkan kode dari tab <strong>Index.html</strong> di bawah.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">
                4
              </span>
              <span>Terapkan sebagai Aplikasi Web (Deploy)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Klik <strong>Terapkan (Deploy)</strong> &gt; <strong>Penerapan Baru</strong> &gt; Jenis: <strong>Aplikasi Web</strong>. Pilih <em>Akses: Siapa saja (Anyone)</em>. Salin URL Web App dan tempelkan di atas!
            </p>
          </div>
        </div>
      </div>

      {/* Script Viewer & 1-Click Copy */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('codegs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeCodeTab === 'codegs'
                  ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code.gs (Backend Spreadsheet & Drive)</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('indexhtml')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeCodeTab === 'indexhtml'
                  ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Index.html (Frontend Web App)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handleCopy(activeCodeTab === 'codegs' ? CODE_GS_CONTENT : INDEX_HTML_CONTENT)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-sky-200 hover:bg-sky-50 text-blue-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-600" />
                  <span>Salin Script {activeCodeTab === 'codegs' ? 'Code.gs' : 'Index.html'}</span>
                </>
              )}
            </button>

            <button
              onClick={() =>
                downloadFile(
                  activeCodeTab === 'codegs' ? 'Code.gs' : 'Index.html',
                  activeCodeTab === 'codegs' ? CODE_GS_CONTENT : INDEX_HTML_CONTENT
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 hover:bg-sky-100 text-blue-800 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Unduh File</span>
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed">
          <pre>
            <code>{activeCodeTab === 'codegs' ? CODE_GS_CONTENT : INDEX_HTML_CONTENT}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
