import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Send,
  Trash2,
  User,
  Settings2,
  Layers,
  Image as ImageIcon,
  Plus
} from 'lucide-react';
import { Pegawai, JurnalHarian, KegiatanItem } from '../types';
import { TEMPLATE_URAIAN } from '../data/initialData';

export const SHIFT_OPTIONS = [
  { id: 'guru-pagi', label: 'Guru: Shift Pagi (06.30 - 14.00)', jamMulai: '06:30', jamSelesai: '14:00' },
  { id: 'guru-siang', label: 'Guru: Shift Siang (10.00 - 17.00)', jamMulai: '10:00', jamSelesai: '17:00' },
  { id: 'tendik', label: 'Tendik: Administrasi (07.00 - 15.30)', jamMulai: '07:00', jamSelesai: '15:30' },
];

const JAM_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MENIT_OPTIONS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

interface FormInputJurnalProps {
  pegawaiList: Pegawai[];
  selectedPegawaiId: string;
  setSelectedPegawaiId: (id: string) => void;
  onSaveJurnal: (jurnal: JurnalHarian) => Promise<void>;
  onViewPreview?: (jurnal: JurnalHarian) => void;
  onLiveUpdate?: (jurnal: JurnalHarian) => void;
  isSaving: boolean;
  saveStatus: { type: 'success' | 'error' | null; message: string };
}

export const FormInputJurnal: React.FC<FormInputJurnalProps> = ({
  pegawaiList,
  selectedPegawaiId,
  setSelectedPegawaiId,
  onSaveJurnal,
  onViewPreview,
  onLiveUpdate,
  isSaving,
  saveStatus
}) => {
  const getTodayDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getHariFromDate = (dateStr: string) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Senin' : days[d.getDay()];
  };

  const formatDisplayDateIndo = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // State
  const [selectedShift, setSelectedShift] = useState<string>('Guru: Shift Pagi (06.30 - 14.00)');
  const [showCustomHours, setShowCustomHours] = useState<boolean>(false);
  const [tanggal, setTanggal] = useState<string>(getTodayDate());
  const [hari, setHari] = useState<string>(getHariFromDate(getTodayDate()));
  const [shiftJamMulai, setShiftJamMulai] = useState<string>('06:30');
  const [shiftJamSelesai, setShiftJamSelesai] = useState<string>('14:00');

  // List kegiatan dinamis sesuai gambar
  const [kegiatanList, setKegiatanList] = useState<KegiatanItem[]>([
    {
      id: 'kg-1',
      jamMulaiJam: '06',
      jamMulaiMenit: '30',
      jamSelesaiJam: '07',
      jamSelesaiMenit: '30',
      uraian: 'Melaksanakan apel pagi, pembiasaan karakter 5S (Senyum, Sapa, Salam, Sopan, Santun), dan literasi pagi.',
      buktiDukung: '',
      keterangan: '',
      fotoBase64: ''
    }
  ]);

  const [activeTemplateIndex, setActiveTemplateIndex] = useState<number | null>(null);

  const selectedPegawai = pegawaiList.find((p) => p.id === selectedPegawaiId) || pegawaiList[0];

  const handleShiftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedShift(val);
    const matched = SHIFT_OPTIONS.find((s) => s.label === val);
    if (matched) {
      setShiftJamMulai(matched.jamMulai);
      setShiftJamSelesai(matched.jamSelesai);
      if (matched.id === 'custom') {
        setShowCustomHours(true);
      }
      // Update item pertama jika masih kosong
      if (kegiatanList.length === 1 && !kegiatanList[0].uraian) {
        const [smJam, smMenit] = matched.jamMulai.split(':');
        const [ssJam, ssMenit] = matched.jamSelesai.split(':');
        setKegiatanList([
          {
            ...kegiatanList[0],
            jamMulaiJam: smJam || '06',
            jamMulaiMenit: smMenit || '30',
            jamSelesaiJam: ssJam || '14',
            jamSelesaiMenit: ssMenit || '00',
            keterangan: ''
          }
        ]);
      }
    }
  };

  const handleTanggalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTanggal(val);
    setHari(getHariFromDate(val));
  };

  const handleResetToday = () => {
    const today = getTodayDate();
    setTanggal(today);
    setHari(getHariFromDate(today));
  };

  // Handlers Kegiatan Dinamis
  const handleUpdateKegiatan = (index: number, field: keyof KegiatanItem, value: string) => {
    const updated = [...kegiatanList];
    updated[index] = { ...updated[index], [field]: value };
    setKegiatanList(updated);
  };

  const handleAddKegiatan = () => {
    const last = kegiatanList[kegiatanList.length - 1];
    const nextStartJam = last ? last.jamSelesaiJam : '07';
    const nextStartMenit = last ? last.jamSelesaiMenit : '00';
    const nextEndJam = String(Math.min(23, parseInt(nextStartJam, 10) + 1)).padStart(2, '0');

    const newItem: KegiatanItem = {
      id: 'kg-' + Date.now(),
      jamMulaiJam: nextStartJam,
      jamMulaiMenit: nextStartMenit,
      jamSelesaiJam: nextEndJam,
      jamSelesaiMenit: nextStartMenit,
      uraian: '',
      buktiDukung: '',
      keterangan: '',
      fotoBase64: ''
    };
    setKegiatanList([...kegiatanList, newItem]);
  };

  const handleDeleteKegiatan = (index: number) => {
    if (kegiatanList.length <= 1) return;
    const updated = kegiatanList.filter((_, i) => i !== index);
    setKegiatanList(updated);
  };

  const handleApplyTemplateToItem = (index: number, tpl: typeof TEMPLATE_URAIAN[0]) => {
    const updated = [...kegiatanList];
    updated[index] = {
      ...updated[index],
      uraian: tpl.uraian,
      buktiDukung: '',
      keterangan: ''
    };
    setKegiatanList(updated);
    setActiveTemplateIndex(null);
  };

  const handleUploadFotoItem = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file foto maksimal 5 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handleUpdateKegiatan(index, 'fotoBase64', evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPegawai) {
      alert('Silakan pilih pegawai terlebih dahulu.');
      return;
    }

    const firstItem = kegiatanList[0];
    const lastItem = kegiatanList[kegiatanList.length - 1];

    const jamMulai = firstItem ? `${firstItem.jamMulaiJam}:${firstItem.jamMulaiMenit}` : shiftJamMulai;
    const jamSelesai = lastItem ? `${lastItem.jamSelesaiJam}:${lastItem.jamSelesaiMenit}` : shiftJamSelesai;

    // Gabungkan uraian kegiatan
    const combinedUraian = kegiatanList
      .map((item, idx) => `${idx + 1}. [${item.jamMulaiJam}:${item.jamMulaiMenit} - ${item.jamSelesaiJam}:${item.jamSelesaiMenit}] ${item.uraian}`)
      .join('\n\n');

    // Gabungkan output / bukti dukung
    const combinedOutput = kegiatanList
      .map((item) => item.buktiDukung)
      .filter(Boolean)
      .join('; ') || 'Selesai';

    // Cari foto dokumentasi pertama yang tersedia
    const fotoItem = kegiatanList.find((k) => k.fotoBase64)?.fotoBase64 || '';

    const newJurnal: JurnalHarian = {
      id: 'JUR-' + Date.now(),
      pegawaiId: selectedPegawai.id,
      pegawaiNama: selectedPegawai.nama,
      tanggal,
      hari,
      jamMulai,
      jamSelesai,
      kategori: 'Pelaksanaan Tugas Pokok & KBM',
      uraianKegiatan: combinedUraian || 'Pelaksanaan pembelajaran dan kegiatan sekolah.',
      outputHasil: combinedOutput,
      volumeOutput: `${kegiatanList.length} Kegiatan`,
      kendala: 'Tidak ada kendala',
      tindakLanjut: '',
      fotoDokumentasiBase64: fotoItem,
      kegiatanList,
      statusVerifikasi: 'Disetujui',
      catatanKepalaSekolah: 'Aktivitas terverifikasi sesuai program kerja.',
      timestamp: new Date().toISOString()
    };

    await onSaveJurnal(newJurnal);
  };

  const onLiveUpdateRef = useRef(onLiveUpdate);
  useEffect(() => {
    onLiveUpdateRef.current = onLiveUpdate;
  }, [onLiveUpdate]);

  const currentPreviewData: JurnalHarian = useMemo(() => {
    const firstItem = kegiatanList[0];
    const lastItem = kegiatanList[kegiatanList.length - 1];
    return {
      id: 'PREVIEW-TEMP',
      pegawaiId: selectedPegawai?.id || 'peg-1',
      pegawaiNama: selectedPegawai?.nama || 'Dr. H. Samsudin, M.Pd.',
      tanggal,
      hari,
      jamMulai: firstItem ? `${firstItem.jamMulaiJam}:${firstItem.jamMulaiMenit}` : shiftJamMulai,
      jamSelesai: lastItem ? `${lastItem.jamSelesaiJam}:${lastItem.jamSelesaiMenit}` : shiftJamSelesai,
      kategori: 'Pelaksanaan Tugas Pokok & KBM',
      uraianKegiatan: kegiatanList
        .map((item, idx) => `${idx + 1}. [${item.jamMulaiJam}:${item.jamMulaiMenit} - ${item.jamSelesaiJam}:${item.jamSelesaiMenit}] ${item.uraian}`)
        .join('\n\n') || 'Belum ada uraian kegiatan...',
      outputHasil: kegiatanList.map((item) => item.buktiDukung).filter(Boolean).join('; ') || '-',
      volumeOutput: `${kegiatanList.length} Kegiatan`,
      kendala: 'Tidak ada kendala',
      tindakLanjut: '',
      fotoDokumentasiBase64: kegiatanList.find((k) => k.fotoBase64)?.fotoBase64 || '',
      kegiatanList,
      statusVerifikasi: 'Disetujui'
    };
  }, [selectedPegawai, tanggal, hari, kegiatanList, shiftJamMulai, shiftJamSelesai]);

  useEffect(() => {
    onLiveUpdateRef.current?.(currentPreviewData);
  }, [currentPreviewData]);

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 sm:p-6">
      {saveStatus.type && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs mb-5 ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-semibold">
              {saveStatus.type === 'success' ? 'Berhasil Tersimpan!' : 'Perhatian'}
            </div>
            <div className="mt-0.5">{saveStatus.message}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ========================================================================= */}
        {/* 1. CARD 1: Pilih Shift Kerja (Tombol Terapkan Template Atas DIHAPUS)       */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-blue-50/90 via-sky-50/70 to-blue-50/80 border border-blue-200/90 rounded-2xl p-4 shadow-2xs transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-blue-950 font-bold text-sm">
              <Clock className="w-4.5 h-4.5 text-blue-600" />
              <span>Pilih Shift Kerja</span>
            </div>
          </div>

          <div className="relative mt-1">
            <select
              value={selectedShift}
              onChange={handleShiftChange}
              className="w-full bg-white border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-400/30 cursor-pointer shadow-2xs transition-colors"
            >
              {SHIFT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.label}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Keterangan jam kerja default */}
          <div className="mt-2.5 flex items-center justify-between text-xs text-blue-900/90 font-medium">
            <span>
              Waktu Standar: <strong className="font-bold text-blue-950">{shiftJamMulai} - {shiftJamSelesai} WIB</strong>
            </span>
            <button
              type="button"
              onClick={() => setShowCustomHours(!showCustomHours)}
              className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Settings2 className="w-3 h-3" />
              <span>{showCustomHours ? 'Sembunyikan' : 'Sesuaikan Standar'}</span>
            </button>
          </div>

          {showCustomHours && (
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-blue-200/70">
              <div>
                <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                  Jam Mulai
                </label>
                <input
                  type="time"
                  value={shiftJamMulai}
                  onChange={(e) => setShiftJamMulai(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                  Jam Selesai
                </label>
                <input
                  type="time"
                  value={shiftJamSelesai}
                  onChange={(e) => setShiftJamSelesai(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. CARD 2: Pilih Pegawai, NIP, & Status Aktif (Warna Biru Elegan)          */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-sky-50/80 via-blue-50/70 to-sky-50/90 border border-sky-200/90 rounded-2xl p-4 shadow-2xs transition-all">
          <div className="flex items-center gap-2 text-blue-950 font-bold text-sm mb-2">
            <User className="w-4.5 h-4.5 text-blue-600" />
            <span>Pilih Pegawai</span>
          </div>

          <div className="relative mt-1">
            <select
              value={selectedPegawaiId}
              onChange={(e) => setSelectedPegawaiId(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-400/30 cursor-pointer shadow-2xs transition-colors"
              required
            >
              {pegawaiList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-blue-900/90 font-semibold font-mono text-xs">
              NIP: {selectedPegawai?.nip || '196805121991031005'}
            </span>
            <span className="px-3 py-0.5 rounded-md bg-blue-600 text-white font-bold text-xs shadow-xs">
              Aktif
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. CARD 3: Hari / Tanggal & Tombol Hari Ini (Warna Biru Elegan)             */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-blue-50/90 border border-blue-200/90 rounded-2xl p-4 shadow-2xs transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-blue-950 font-bold text-sm">
              <Calendar className="w-4.5 h-4.5 text-blue-600" />
              <span>Hari / Tanggal</span>
            </div>
            <button
              type="button"
              onClick={handleResetToday}
              className="px-3 py-1 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white rounded-md text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Hari Ini
            </button>
          </div>

          <div className="relative mt-1">
            <input
              type="date"
              value={tanggal}
              onChange={handleTanggalChange}
              className="w-full bg-white border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-400/30 shadow-2xs cursor-pointer"
              required
            />
          </div>

          <div className="flex items-center justify-between mt-2.5 text-xs text-blue-900 font-semibold">
            <span>
              Hari: <strong className="font-bold text-blue-950">{hari}</strong>
            </span>
            <span className="font-mono text-blue-800 font-bold">
              {formatDisplayDateIndo(tanggal)}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. CARD KEGIATAN HARI INI (Menggantikan Kategori Aktivitas Kerja Sesuai Gambar) */}
        {/* ========================================================================= */}
        <div className="bg-white border border-blue-100 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-blue-950">
                  Kegiatan Hari Ini
                </h3>
              </div>
            </div>

            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
              {kegiatanList.length} Kegiatan
            </span>
          </div>

          {/* Baris-Baris Kegiatan */}
          <div className="space-y-4">
            {kegiatanList.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-sky-50/20 border border-sky-100 rounded-2xl p-3 sm:p-4 space-y-3 hover:border-blue-300 transition-colors w-full max-w-full overflow-hidden box-border"
              >
                {/* Baris Jam Mulai, Selesai & Tombol Hapus - Selalu 1 Baris Rapi di Android & Layar Apapun */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full max-w-full flex-nowrap">
                  <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs font-bold text-slate-700 min-w-0 flex-nowrap shrink">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] sm:text-xs flex items-center justify-center">
                      {index + 1}
                    </span>

                    {/* Jam Mulai */}
                    <div className="flex items-center gap-0.5 sm:gap-1 bg-white border border-blue-200/90 rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 shadow-2xs shrink-0">
                      <span className="text-slate-500 font-semibold text-[10px] sm:text-[11px]">Mulai:</span>
                      <select
                        value={item.jamMulaiJam}
                        onChange={(e) => handleUpdateKegiatan(index, 'jamMulaiJam', e.target.value)}
                        className="bg-transparent font-bold text-blue-950 text-[11px] sm:text-xs cursor-pointer focus:outline-none p-0"
                      >
                        {JAM_OPTIONS.map((j) => (
                          <option key={j} value={j}>{j}</option>
                        ))}
                      </select>
                      <span className="text-slate-400 font-bold text-[10px] sm:text-xs">:</span>
                      <select
                        value={item.jamMulaiMenit}
                        onChange={(e) => handleUpdateKegiatan(index, 'jamMulaiMenit', e.target.value)}
                        className="bg-transparent font-bold text-blue-950 text-[11px] sm:text-xs cursor-pointer focus:outline-none p-0"
                      >
                        {MENIT_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    {/* Jam Selesai */}
                    <div className="flex items-center gap-0.5 sm:gap-1 bg-white border border-blue-200/90 rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 shadow-2xs shrink-0">
                      <span className="text-slate-500 font-semibold text-[10px] sm:text-[11px]">Selesai:</span>
                      <select
                        value={item.jamSelesaiJam}
                        onChange={(e) => handleUpdateKegiatan(index, 'jamSelesaiJam', e.target.value)}
                        className="bg-transparent font-bold text-blue-950 text-[11px] sm:text-xs cursor-pointer focus:outline-none p-0"
                      >
                        {JAM_OPTIONS.map((j) => (
                          <option key={j} value={j}>{j}</option>
                        ))}
                      </select>
                      <span className="text-slate-400 font-bold text-[10px] sm:text-xs">:</span>
                      <select
                        value={item.jamSelesaiMenit}
                        onChange={(e) => handleUpdateKegiatan(index, 'jamSelesaiMenit', e.target.value)}
                        className="bg-transparent font-bold text-blue-950 text-[11px] sm:text-xs cursor-pointer focus:outline-none p-0"
                      >
                        {MENIT_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {kegiatanList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteKegiatan(index)}
                      className="shrink-0 flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-rose-600 hover:text-rose-700 bg-rose-50/80 hover:bg-rose-100 rounded-lg border border-rose-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                      title="Hapus Baris Ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">Hapus</span>
                    </button>
                  )}
                </div>

                {/* Textarea Uraian Kegiatan */}
                <div>
                  <textarea
                    rows={3}
                    value={item.uraian}
                    onChange={(e) => handleUpdateKegiatan(index, 'uraian', e.target.value)}
                    placeholder="Ketik uraian kegiatan kerja..."
                    className="w-full bg-white border border-blue-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all placeholder:text-slate-400"
                    required
                  />
                </div>

                {/* Tombol Upload Foto & Template Bawah (Tetap Ada Sesuai Permintaan) */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-50/50 text-slate-700 rounded-lg border border-blue-200 text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                    <span>{item.fotoBase64 ? 'Ganti Foto' : 'Upload Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadFotoItem(index, e)}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setActiveTemplateIndex(activeTemplateIndex === index ? null : index)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Template</span>
                  </button>

                  {item.fotoBase64 && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-800 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                      <img
                        src={item.fotoBase64}
                        alt="Foto Dokumentasi"
                        className="w-6 h-6 object-cover rounded"
                      />
                      <span>Foto Terlampir</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateKegiatan(index, 'fotoBase64', '')}
                        className="text-rose-600 hover:text-rose-800 font-bold ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Laci Pilihan Template Khusus Baris Ini */}
                {activeTemplateIndex === index && (
                  <div className="p-3 bg-sky-50/80 border border-blue-200 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Pilih Template Kegiatan Baris {index + 1}:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTemplateIndex(null)}
                        className="text-blue-700 hover:text-blue-950 font-semibold cursor-pointer"
                      >
                        ✕ Tutup
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TEMPLATE_URAIAN.map((tpl, tIdx) => (
                        <button
                          key={tIdx}
                          type="button"
                          onClick={() => handleApplyTemplateToItem(index, tpl)}
                          className="text-left p-2.5 bg-white rounded-lg border border-blue-100 hover:border-blue-400 hover:shadow-xs transition-all text-xs cursor-pointer group"
                        >
                          <div className="font-bold text-blue-950 group-hover:text-blue-700">
                            {tpl.judul}
                          </div>
                          <div className="text-slate-500 line-clamp-1 mt-0.5">{tpl.uraian}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tombol + + Tambah Baris Baru (Sesuai Gambar) */}
          <button
            type="button"
            onClick={handleAddKegiatan}
            className="w-full py-3 border-2 border-dashed border-blue-200 hover:border-blue-500 bg-sky-50/30 hover:bg-sky-50/70 text-blue-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs group"
          >
            <Plus className="w-4 h-4 text-blue-400 group-hover:text-blue-600" />
            <span>+ + Tambah Baris Baru</span>
          </button>
        </div>

        {/* Submit Actions */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-60 hover:shadow"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan ke Spreadsheet...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Simpan Jurnal ke Spreadsheet</span>
              </>
            )}
          </button>

          {/* Footer Note Kustom Pindah ke Bawah Button Simpan Jurnal */}
          <div className="text-center text-[11px] text-slate-400 font-medium pt-3 pb-1">
            Informasi Jurnal Sikawan Harian - SAMSUDIN APP CUSTOM
          </div>
        </div>
      </form>
    </div>
  );
};
