import React, { useState, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Link2,
  RefreshCw,
  X,
  Camera,
  PenLine,
  Image as ImageIcon,
  CloudDownload
} from 'lucide-react';
import { Pegawai, GasConfig } from '../types';
import { GasService } from '../services/gasService';

interface ManajemenPegawaiProps {
  pegawaiList: Pegawai[];
  onSavePegawai: (pegawai: Pegawai) => Promise<void>;
  onDeletePegawai: (id: string) => void;
  isSaving: boolean;
  gasConfig?: GasConfig;
  onUpdateGasConfig?: (config: GasConfig) => void;
  onReloadPegawaiList?: (list: Pegawai[]) => void;
}

export const ManajemenPegawai: React.FC<ManajemenPegawaiProps> = ({
  pegawaiList,
  onSavePegawai,
  onDeletePegawai,
  isSaving,
  gasConfig,
  onUpdateGasConfig,
  onReloadPegawaiList
}) => {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null);

  // Form states
  const [nip, setNip] = useState<string>('');
  const [nama, setNama] = useState<string>('');
  const [jabatan, setJabatan] = useState<string>('Guru Kelas VI');
  const [golongan, setGolongan] = useState<string>('Penata Tk. I (III/d)');
  const [status, setStatus] = useState<Pegawai['status']>('PNS');
  const [fotoBase64, setFotoBase64] = useState<string>('');
  const [ttdBase64, setTtdBase64] = useState<string>('');

  // Spreadsheet connection & sync states
  const [inputGasUrl, setInputGasUrl] = useState<string>(gasConfig?.webAppUrl || '');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [isFetchingFromGas, setIsFetchingFromGas] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);

  // Ref for quick row upload
  const rowFotoInputRef = useRef<HTMLInputElement>(null);
  const rowTtdInputRef = useRef<HTMLInputElement>(null);
  const [targetRowPegawai, setTargetRowPegawai] = useState<Pegawai | null>(null);

  const openAddModal = () => {
    setEditingPegawai(null);
    setNip('');
    setNama('');
    setJabatan('Guru Kelas');
    setGolongan('Penata Tk. I (III/d)');
    setStatus('PNS');
    setFotoBase64('');
    setTtdBase64('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Pegawai) => {
    setEditingPegawai(p);
    setNip(p.nip || '');
    setNama(p.nama);
    setJabatan(p.jabatan);
    setGolongan(p.golongan);
    setStatus(p.status);
    setFotoBase64(p.fotoBase64 || p.fotoUrl || '');
    setTtdBase64(p.ttdBase64 || p.ttdUrl || '');
    setIsModalOpen(true);
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) setFotoBase64(evt.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTtdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) setTtdBase64(evt.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick upload handler for table rows
  const triggerRowFotoUpload = (p: Pegawai) => {
    setTargetRowPegawai(p);
    if (rowFotoInputRef.current) {
      rowFotoInputRef.current.value = '';
      rowFotoInputRef.current.click();
    }
  };

  const triggerRowTtdUpload = (p: Pegawai) => {
    setTargetRowPegawai(p);
    if (rowTtdInputRef.current) {
      rowTtdInputRef.current.value = '';
      rowTtdInputRef.current.click();
    }
  };

  const handleRowFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && targetRowPegawai) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        if (evt.target?.result) {
          const updated: Pegawai = {
            ...targetRowPegawai,
            fotoBase64: evt.target.result as string
          };
          await onSavePegawai(updated);
          setSyncFeedback({
            type: 'success',
            message: `Foto profil untuk ${targetRowPegawai.nama} berhasil diunggah!`
          });
          setTimeout(() => setSyncFeedback({ type: null, message: '' }), 4000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRowTtdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && targetRowPegawai) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        if (evt.target?.result) {
          const updated: Pegawai = {
            ...targetRowPegawai,
            ttdBase64: evt.target.result as string
          };
          await onSavePegawai(updated);
          setSyncFeedback({
            type: 'success',
            message: `Tanda tangan digital untuk ${targetRowPegawai.nama} berhasil diunggah!`
          });
          setTimeout(() => setSyncFeedback({ type: null, message: '' }), 4000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const payload: Pegawai = {
      id: editingPegawai ? editingPegawai.id : 'peg-' + Date.now(),
      nip: nip.trim() || '-',
      nama: nama.trim(),
      jabatan: jabatan.trim(),
      golongan: golongan.trim(),
      status,
      unitKerja: 'SD Negeri Babelan Kota 01',
      fotoBase64,
      ttdBase64
    };

    await onSavePegawai(payload);
    setIsModalOpen(false);
    setSyncFeedback({
      type: 'success',
      message: `Data ${payload.nama} berhasil disimpan!`
    });
    setTimeout(() => setSyncFeedback({ type: null, message: '' }), 4000);
  };

  // Connect Google Spreadsheet handler
  const handleConnectSpreadsheet = async () => {
    if (!inputGasUrl.trim()) {
      setSyncFeedback({
        type: 'error',
        message: 'Masukkan URL Web App Google Apps Script terlebih dahulu.'
      });
      return;
    }

    setIsConnecting(true);
    setSyncFeedback({ type: null, message: '' });

    try {
      const result = await GasService.testConnection(inputGasUrl.trim());
      const updatedConfig: GasConfig = {
        webAppUrl: inputGasUrl.trim(),
        isConnected: true,
        autoSync: true
      };

      if (onUpdateGasConfig) {
        onUpdateGasConfig(updatedConfig);
      }

      // Ambil data pegawai yang ada di Spreadsheet secara langsung
      const fetchRes = await GasService.fetchPegawaiFromGas(inputGasUrl.trim());
      if (fetchRes.success && onReloadPegawaiList) {
        onReloadPegawaiList(fetchRes.data);
      }

      setShowConnectModal(false);
      setSyncFeedback({
        type: 'success',
        message: fetchRes.success && fetchRes.data.length > 0
          ? `Berhasil tersambung ke Spreadsheet! ${fetchRes.data.length} data guru/pegawai berhasil dimuat.`
          : 'Berhasil tersambung ke Google Spreadsheet SDN Babelan Kota 01!'
      });
      setTimeout(() => setSyncFeedback({ type: null, message: '' }), 5000);
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: 'Gagal menyambungkan: ' + String(err.message || err)
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Tarik Data Pegawai Langsung dari Google Spreadsheet
  const handleFetchFromSpreadsheet = async () => {
    const url = gasConfig?.webAppUrl || inputGasUrl;
    if (!url) {
      setShowConnectModal(true);
      return;
    }

    setIsFetchingFromGas(true);
    setSyncFeedback({ type: null, message: '' });

    try {
      const res = await GasService.fetchPegawaiFromGas(url);
      if (res.success) {
        if (onReloadPegawaiList) {
          onReloadPegawaiList(res.data);
        }
        setSyncFeedback({
          type: 'success',
          message: res.data.length > 0
            ? `Berhasil memuat ${res.data.length} data pegawai dari Google Spreadsheet!`
            : 'Koneksi aktif! Belum ada baris data pegawai di tab DATA_PEGAWAI Spreadsheet.'
        });
      } else {
        setSyncFeedback({
          type: 'error',
          message: res.message || 'Gagal memuat data dari Spreadsheet.'
        });
      }
      setTimeout(() => setSyncFeedback({ type: null, message: '' }), 5000);
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: 'Gagal mengambil data dari Spreadsheet: ' + String(err.message || err)
      });
    } finally {
      setIsFetchingFromGas(false);
    }
  };

  // Sync all data to spreadsheet
  const handleSyncAllToSpreadsheet = async () => {
    const url = gasConfig?.webAppUrl || inputGasUrl;
    if (!url) {
      setShowConnectModal(true);
      return;
    }

    setIsSyncingAll(true);
    setSyncFeedback({ type: null, message: '' });

    try {
      const res = await GasService.syncSemuaPegawai(url, pegawaiList);
      if (res.success) {
        setSyncFeedback({
          type: 'success',
          message: res.message
        });
      } else {
        setSyncFeedback({
          type: 'error',
          message: res.message
        });
      }
      setTimeout(() => setSyncFeedback({ type: null, message: '' }), 5000);
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: 'Terjadi kesalahan sinkronisasi: ' + String(err)
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const isConnected = !!(gasConfig?.webAppUrl && gasConfig.isConnected);

  return (
    <div className="space-y-5">
      {/* Hidden file inputs for direct row uploads */}
      <input
        ref={rowFotoInputRef}
        type="file"
        accept="image/*"
        onChange={handleRowFotoChange}
        className="hidden"
      />
      <input
        ref={rowTtdInputRef}
        type="file"
        accept="image/*"
        onChange={handleRowTtdChange}
        className="hidden"
      />

      {/* Header & Action Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Data Guru & Pegawai</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Total {pegawaiList.length} Orang
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Sambungkan / Status Spreadsheet */}
          <button
            onClick={() => setShowConnectModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
            title={isConnected ? 'Spreadsheet Terhubung' : 'Sambungkan ke Google Spreadsheet'}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{isConnected ? 'Spreadsheet Tersambung' : 'Sambungkan Spreadsheet'}</span>
            {isConnected ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          {/* Tombol Tarik Data dari Spreadsheet */}
          {isConnected && (
            <button
              onClick={handleFetchFromSpreadsheet}
              disabled={isFetchingFromGas}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              title="Ambil dan tampilkan data pegawai yang ada di Spreadsheet"
            >
              <CloudDownload className={`w-3.5 h-3.5 ${isFetchingFromGas ? 'animate-bounce' : ''}`} />
              <span>{isFetchingFromGas ? 'Memuat Data...' : 'Tarik Data Spreadsheet'}</span>
            </button>
          )}

          {/* Tombol Sinkron Semua Pegawai jika tersambung */}
          {isConnected && pegawaiList.length > 0 && (
            <button
              onClick={handleSyncAllToSpreadsheet}
              disabled={isSyncingAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer disabled:opacity-60"
              title="Kirim dan sinkronkan seluruh data guru ke Google Spreadsheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
              <span>{isSyncingAll ? 'Sinkronisasi...' : 'Sinkron Semua'}</span>
            </button>
          )}

          {/* Tombol Tambah Guru / Pegawai */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru / Pegawai</span>
          </button>
        </div>
      </div>

      {/* Alert Notifikasi Status */}
      {syncFeedback.type && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between gap-2 border transition-all ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            onClick={() => setSyncFeedback({ type: null, message: '' })}
            className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* TABEL DATA PEGAWAI SESUAI FORMAT JURNAL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center border-r border-slate-200">No</th>
                <th className="py-3 px-3.5 w-40 border-r border-slate-200">NIP</th>
                <th className="py-3 px-4 border-r border-slate-200">Nama Guru</th>
                <th className="py-3 px-3.5 border-r border-slate-200">Jabatan</th>
                <th className="py-3 px-3.5 border-r border-slate-200">Pangkat/Gol</th>
                <th className="py-3 px-3 w-28 text-center border-r border-slate-200">Status</th>
                <th className="py-3 px-3 w-36 text-center border-r border-slate-200">Upload Foto Profil</th>
                <th className="py-3 px-3 w-36 text-center border-r border-slate-200">Upload Tanda Tangan</th>
                <th className="py-3 px-3 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pegawaiList.map((p, idx) => (
                <tr
                  key={p.id}
                  className="hover:bg-blue-50/40 transition-colors group text-slate-800"
                >
                  {/* 1. No */}
                  <td className="py-2.5 px-3 text-center tabular-nums font-semibold border-r border-slate-200 text-slate-600">
                    {idx + 1}
                  </td>

                  {/* 2. NIP */}
                  <td className="py-2.5 px-3.5 border-r border-slate-200 font-mono text-[11px] text-slate-800 whitespace-nowrap">
                    {p.nip && p.nip !== '-' ? p.nip : <span className="text-slate-400 italic">-</span>}
                  </td>

                  {/* 3. Nama Guru */}
                  <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-xs overflow-hidden border border-blue-200">
                        {p.fotoBase64 || p.fotoUrl ? (
                          <img
                            src={p.fotoBase64 || p.fotoUrl}
                            alt={p.nama}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          p.nama.charAt(0)
                        )}
                      </div>
                      <span>{p.nama}</span>
                    </div>
                  </td>

                  {/* 4. Jabatan */}
                  <td className="py-2.5 px-3.5 border-r border-slate-200 text-slate-700">
                    {p.jabatan || 'Guru Kelas'}
                  </td>

                  {/* 5. Pangkat/Gol */}
                  <td className="py-2.5 px-3.5 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                    {p.golongan || '-'}
                  </td>

                  {/* 6. Status */}
                  <td className="py-2.5 px-3 text-center border-r border-slate-200">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'PNS'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : p.status === 'PPPK'
                          ? 'bg-teal-100 text-teal-800 border border-teal-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  {/* 7. Upload Foto Profil */}
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {p.fotoBase64 || p.fotoUrl ? (
                        <div className="flex items-center gap-1.5">
                          <img
                            src={p.fotoBase64 || p.fotoUrl}
                            alt="Foto"
                            className="w-8 h-8 rounded-full object-cover border border-slate-300 shadow-2xs"
                          />
                          <button
                            onClick={() => triggerRowFotoUpload(p)}
                            type="button"
                            className="text-[10px] text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
                            title="Ganti Foto Profil"
                          >
                            Ganti
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => triggerRowFotoUpload(p)}
                          type="button"
                          className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded font-medium transition-colors cursor-pointer"
                          title="Unggah Foto Profil"
                        >
                          <Camera className="w-3 h-3 text-slate-500" />
                          <span>Upload</span>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* 8. Upload Tanda Tangan */}
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {p.ttdBase64 || p.ttdUrl ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-6 bg-slate-50 border border-slate-200 rounded flex items-center justify-center p-0.5">
                            <img
                              src={p.ttdBase64 || p.ttdUrl}
                              alt="TTD"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <button
                            onClick={() => triggerRowTtdUpload(p)}
                            type="button"
                            className="text-[10px] text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
                            title="Ganti Tanda Tangan"
                          >
                            Ganti
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => triggerRowTtdUpload(p)}
                          type="button"
                          className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded font-medium transition-colors cursor-pointer"
                          title="Unggah Tanda Tangan Digital"
                        >
                          <PenLine className="w-3 h-3 text-slate-500" />
                          <span>Upload</span>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* 9. Aksi */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        type="button"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title="Edit Data Guru"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus data pegawai "${p.nama}"?`)) {
                            onDeletePegawai(p.id);
                          }
                        }}
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Hapus Data Guru"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {pegawaiList.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2.5 max-w-md mx-auto px-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        Belum Ada Data Guru / Pegawai
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {isConnected
                          ? 'Spreadsheet terhubung. Klik "Tarik Data Spreadsheet" untuk menampilkan data dari tab DATA_PEGAWAI, atau tambah data baru.'
                          : 'Data dummy bawaan telah dibersihkan. Sambungkan Google Spreadsheet Anda untuk menampilkan data pegawai resmi atau tambah manual.'}
                      </p>
                      <div className="flex items-center gap-2 pt-1.5">
                        {isConnected ? (
                          <button
                            type="button"
                            onClick={handleFetchFromSpreadsheet}
                            disabled={isFetchingFromGas}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
                          >
                            <CloudDownload className="w-3.5 h-3.5" />
                            <span>Tarik Data Spreadsheet</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowConnectModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Sambungkan Spreadsheet</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={openAddModal}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Pegawai</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SAMBUNGKAN GOOGLE SPREADSHEET */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Sambungkan ke Google Spreadsheet
                </h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Koneksi Google Apps Script Web App</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Menyambungkan sistem ini ke Spreadsheet resmi SD NEGERI BABELAN KOTA 01. Seluruh data guru, NIP, foto, dan tanda tangan digital akan tersinkron otomatis ke tab <strong>DATA_PEGAWAI</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Web App Google Apps Script
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={inputGasUrl}
                  onChange={(e) => setInputGasUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  *Dapatkan URL dari menu <em>Deploy &gt; Web App</em> di Google Apps Script spreadsheet Anda.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConnectSpreadsheet}
                  disabled={isConnecting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyambungkan...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Sambungkan Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM TAMBAH / UBAH GURU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">
                {editingPegawai ? 'Ubah Data Guru / Pegawai' : 'Tambah Guru / Pegawai Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              {/* NIP & Nama Guru */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP (Nomor Induk Pegawai)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 19850612 201001 1 015"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Kepegawaian <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
                    <option value="PPPK">PPPK (Pegawai Pemerintah dg Perjanjian Kerja)</option>
                    <option value="Honorer">Honorer / Non-ASN</option>
                    <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Guru & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rina Wijayanti, S.Pd."
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Jabatan & Pangkat/Gol */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Guru Kelas VI / Guru PJOK"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pangkat / Golongan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Penata Tk. I (III/d)"
                    value={golongan}
                    onChange={(e) => setGolongan(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Upload Foto Profil & Upload Tanda Tangan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Upload Foto Profil */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Foto Profil</span>
                  </label>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                      {fotoBase64 ? (
                        <img src={fotoBase64} alt="Preview Foto" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold transition-colors cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Pilih Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFotoUpload}
                          className="hidden"
                        />
                      </label>
                      {fotoBase64 && (
                        <button
                          type="button"
                          onClick={() => setFotoBase64('')}
                          className="block text-[10px] text-rose-600 hover:underline mt-1 cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload Tanda Tangan */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <PenLine className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Tanda Tangan</span>
                  </label>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-16 h-12 bg-white border border-slate-300 rounded flex items-center justify-center p-1 overflow-hidden shrink-0">
                      {ttdBase64 ? (
                        <img src={ttdBase64} alt="Preview TTD" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Kosong</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold transition-colors cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Pilih TTD</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleTtdUpload}
                          className="hidden"
                        />
                      </label>
                      {ttdBase64 && (
                        <button
                          type="button"
                          onClick={() => setTtdBase64('')}
                          className="block text-[10px] text-rose-600 hover:underline mt-1 cursor-pointer"
                        >
                          Hapus TTD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editingPegawai ? 'Simpan Perubahan' : 'Tambah Pegawai'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
