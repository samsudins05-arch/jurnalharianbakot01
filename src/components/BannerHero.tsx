import React from 'react';
import {
  PenTool,
  FileCheck,
  ClipboardList,
  Users,
  School,
  Code,
  Database,
  Printer,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import schoolLogo from '../assets/images/logo-bakot-01.png';
import { SekolahConfig, GasConfig } from '../types';

interface BannerHeroProps {
  sekolah: SekolahConfig;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  gasConfig: GasConfig;
  onOpenGasModal: () => void;
  onPrintPreview: () => void;
}

export const BannerHero: React.FC<BannerHeroProps> = ({
  sekolah,
  activeTab,
  setActiveTab,
  gasConfig,
  onOpenGasModal,
  onPrintPreview
}) => {
  const navItems = [
    { id: 'input', label: 'Jurnal Harian', icon: PenTool },
    { id: 'preview', label: 'Lembar Kerja', icon: FileCheck },
    { id: 'rekap', label: 'Rekap Harian', icon: ClipboardList },
    { id: 'pegawai', label: 'Data Pegawai', icon: Users },
    { id: 'sekolah', label: 'Pejabat Penilai', icon: School },
    { id: 'panduan', label: 'Script Code.gs & Panduan', icon: Code }
  ];

  return (
    <header className="no-print bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 text-white border-b border-blue-400/30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Baris Atas: Logo, Identitas Resmi Sekolah & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="relative shrink-0 flex items-center justify-center">
              <img
                src={schoolLogo}
                alt="Logo SD NEGERI BABELAN KOTA 01"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md shrink-0"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold tracking-wider text-sky-100 uppercase">
                <span>Pemerintah Kab. Bekasi</span>
                <span>·</span>
                <span>Dinas Pendidikan</span>
                {sekolah.npsn && (
                  <>
                    <span>·</span>
                    <span>NPSN {sekolah.npsn}</span>
                  </>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-0.5 drop-shadow-xs">
                Jurnal Harian SIKAWAN {sekolah.tahunJurnal || 2026}
              </h1>
              <p className="text-xs sm:text-sm text-sky-100 font-bold uppercase tracking-wide">
                {(sekolah.namaSekolah || 'SD NEGERI BABELAN KOTA 01').toUpperCase()}
              </p>
            </div>
          </div>

          {/* Tombol Aksi Cepat di Pojok Kanan Atas dengan Biru Manis & Bersih */}
          <div className="flex items-center gap-2 sm:gap-2.5 self-start md:self-center shrink-0">
            <button
              onClick={onOpenGasModal}
              title={
                gasConfig.webAppUrl
                  ? 'Terhubung dengan Google Spreadsheet'
                  : 'Klik untuk menghubungkan ke Google Spreadsheet'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer whitespace-nowrap font-medium backdrop-blur-xs shadow-xs ${
                gasConfig.webAppUrl
                  ? 'border-emerald-300/60 bg-emerald-500/25 text-white hover:bg-emerald-500/35'
                  : 'border-white/30 bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-sky-100" />
              <span>
                {gasConfig.webAppUrl ? 'Spreadsheet Terhubung' : 'Sambungkan Spreadsheet'}
              </span>
              {gasConfig.webAppUrl ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
              )}
            </button>

            <button
              onClick={onPrintPreview}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-white hover:bg-sky-50 text-blue-700 shadow-sm transition-all whitespace-nowrap cursor-pointer hover:shadow"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Cetak F4</span>
            </button>
          </div>
        </div>

        {/* Baris Bawah: Navigasi / Button Tepat Di Bawah Judul Jurnal Harian */}
        <div className="mt-4 pt-3.5 border-t border-white/20">
          <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-md ring-2 ring-white/70 transform scale-[1.02]'
                      : 'bg-blue-800/40 text-sky-100 hover:text-white hover:bg-blue-800/60 border border-white/20 backdrop-blur-xs'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-blue-600' : 'text-sky-200'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
