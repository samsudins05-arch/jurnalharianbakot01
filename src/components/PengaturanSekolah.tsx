import React, { useState, useRef } from 'react';
import {
  School,
  Save,
  CheckCircle2,
  ShieldCheck,
  Upload,
  Trash2,
  Image as ImageIcon,
  Database,
  Link as LinkIcon,
  AlertCircle
} from 'lucide-react';
import { SekolahConfig, GasConfig } from '../types';

interface PengaturanSekolahProps {
  sekolah: SekolahConfig;
  onSaveSekolah: (sekolah: SekolahConfig) => Promise<void>;
  isSaving: boolean;
  gasConfig?: GasConfig;
  onUpdateGasConfig?: (config: GasConfig) => void;
}

export const PengaturanSekolah: React.FC<PengaturanSekolahProps> = ({
  sekolah,
  onSaveSekolah,
  isSaving,
  gasConfig,
  onUpdateGasConfig
}) => {
  const [formData, setFormData] = useState<SekolahConfig>(sekolah);
  const [showSavedAlert, setShowSavedAlert] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [webAppUrlInput, setWebAppUrlInput] = useState<string>(gasConfig?.webAppUrl || '');

  const ttdInputRef = useRef<HTMLInputElement>(null);
  const stempelInputRef = useRef<HTMLInputElement>(null);
  const kopInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'kepalaSekolahTtdBase64' | 'stempelSekolahBase64' | 'kopSekolahBase64'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setFormData((prev) => ({
            ...prev,
            [field]: evt.target?.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (
    field: 'kepalaSekolahTtdBase64' | 'stempelSekolahBase64' | 'kopSekolahBase64'
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Jika URL Apps Script diisi/diubah, simpan konfigurasi GAS
    if (onUpdateGasConfig && webAppUrlInput.trim() !== (gasConfig?.webAppUrl || '')) {
      onUpdateGasConfig({
        webAppUrl: webAppUrlInput.trim(),
        isConnected: Boolean(webAppUrlInput.trim()),
        autoSync: true,
        lastSync: new Date().toISOString()
      });
    }

    await onSaveSekolah(formData);

    const isConnected = Boolean(webAppUrlInput.trim() || gasConfig?.webAppUrl);
    setSaveMessage(
      isConnected
        ? 'Perubahan berhasil disimpan dan langsung disinkronkan ke Google Spreadsheet!'
        : 'Perubahan berhasil disimpan ke database aplikasi.'
    );
    setShowSavedAlert(true);
    setTimeout(() => setShowSavedAlert(false), 4500);
  };

  return (
    <div className="bg-white p-5 sm:p-7 rounded-xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
      {/* Header Identitas Satuan Pendidikan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <School className="w-5 h-5 text-blue-600" />
            <span>Pejabat Penilai</span>
          </h2>
        </div>

        {/* Badge Status Spreadsheet */}
        <div className="flex items-center gap-2">
          {gasConfig?.webAppUrl || webAppUrlInput ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Spreadsheet Aktif</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Simpan Lokal</span>
            </span>
          )}
        </div>
      </div>

      {showSavedAlert && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-semibold animate-fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Nama Resmi Sekolah */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Nama Resmi Sekolah
          </label>
          <input
            type="text"
            name="namaSekolah"
            value={formData.namaSekolah}
            onChange={handleChange}
            placeholder="Contoh: SD NEGERI BABELAN KOTA 01"
            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900 uppercase"
            required
          />
        </div>

        {/* 2. Bagian Pejabat Penilai / Kepala Sekolah */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Pejabat Penilai / Kepala Sekolah</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kepala Sekolah
              </label>
              <input
                type="text"
                name="kepalaSekolahNama"
                value={formData.kepalaSekolahNama}
                onChange={handleChange}
                placeholder="Nama Lengkap & Gelar Kepala Sekolah"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                name="kepalaSekolahNIP"
                value={formData.kepalaSekolahNIP}
                onChange={handleChange}
                placeholder="18 digit NIP Kepala Sekolah"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Upload Dokumen & Aset: TTD, Stempel, Kop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Upload Ttd Kepala Sekolah */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2.5">
              <label className="block text-xs font-bold text-slate-800">
                Upload TTD Kepala Sekolah
              </label>
              <input
                type="file"
                ref={ttdInputRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'kepalaSekolahTtdBase64')}
                className="hidden"
              />

              {formData.kepalaSekolahTtdBase64 ? (
                <div className="space-y-2">
                  <div className="h-20 bg-white border border-slate-200 rounded flex items-center justify-center p-1.5">
                    <img
                      src={formData.kepalaSekolahTtdBase64}
                      alt="TTD Kepala Sekolah"
                      className="max-h-full object-contain"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => ttdInputRef.current?.click()}
                      className="flex-1 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                    >
                      Ganti TTD
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('kepalaSekolahTtdBase64')}
                      className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                      title="Hapus TTD"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => ttdInputRef.current?.click()}
                  className="h-24 border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors p-2 text-center"
                >
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] font-medium text-slate-600">
                    Pilih Berkas TTD
                  </span>
                  <span className="text-[9px] text-slate-400">PNG / JPG Transparan</span>
                </div>
              )}
            </div>

            {/* Upload Stempel Sekolah */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2.5">
              <label className="block text-xs font-bold text-slate-800">
                Upload Stempel Sekolah
              </label>
              <input
                type="file"
                ref={stempelInputRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'stempelSekolahBase64')}
                className="hidden"
              />

              {formData.stempelSekolahBase64 ? (
                <div className="space-y-2">
                  <div className="h-20 bg-white border border-slate-200 rounded flex items-center justify-center p-1.5">
                    <img
                      src={formData.stempelSekolahBase64}
                      alt="Stempel Sekolah"
                      className="max-h-full object-contain"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => stempelInputRef.current?.click()}
                      className="flex-1 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                    >
                      Ganti Stempel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('stempelSekolahBase64')}
                      className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                      title="Hapus Stempel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => stempelInputRef.current?.click()}
                  className="h-24 border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors p-2 text-center"
                >
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] font-medium text-slate-600">
                    Pilih Berkas Stempel
                  </span>
                  <span className="text-[9px] text-slate-400">Format PNG Stempel</span>
                </div>
              )}
            </div>

            {/* Upload Kop Sekolah */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2.5">
              <label className="block text-xs font-bold text-slate-800">
                Upload Kop Sekolah
              </label>
              <input
                type="file"
                ref={kopInputRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'kopSekolahBase64')}
                className="hidden"
              />

              {formData.kopSekolahBase64 ? (
                <div className="space-y-2">
                  <div className="h-20 bg-white border border-slate-200 rounded flex items-center justify-center p-1.5">
                    <img
                      src={formData.kopSekolahBase64}
                      alt="Kop Sekolah"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => kopInputRef.current?.click()}
                      className="flex-1 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                    >
                      Ganti Kop
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('kopSekolahBase64')}
                      className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                      title="Hapus Kop"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => kopInputRef.current?.click()}
                  className="h-24 border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors p-2 text-center"
                >
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] font-medium text-slate-600">
                    Pilih Gambar Kop
                  </span>
                  <span className="text-[9px] text-slate-400">Kop Surat / Banner Atas</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Sambungan Google Spreadsheet */}
        <div className="pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>URL Integrasi Google Spreadsheet (Web App URL)</span>
            </label>
            <span className="text-[10px] text-slate-500 font-medium">
              Tersimpan Langsung ke Spreadsheet saat tombol Simpan diklik
            </span>
          </div>
          <div className="relative">
            <input
              type="url"
              value={webAppUrlInput}
              onChange={(e) => setWebAppUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono bg-white"
            />
            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-500">
            Pastikan Web App Google Apps Script telah disiapkan sesuai panduan pada menu <em>Script Code.gs</em>.
          </p>
        </div>

        {/* Tombol Simpan Perubahan Langsung Tersimpan di Spreadsheet */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 hover:shadow"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? 'Menyimpan ke Spreadsheet...'
                : 'Simpan Perubahan (Langsung Tersimpan di Spreadsheet)'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
