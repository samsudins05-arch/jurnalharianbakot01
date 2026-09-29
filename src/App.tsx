import React, { useState, useEffect, useCallback } from 'react';
import { BannerHero } from './components/BannerHero';
import { FormInputJurnal } from './components/FormInputJurnal';
import { LembarPratinjauF4 } from './components/LembarPratinjauF4';
import { RekapJurnal } from './components/RekapJurnal';
import { ManajemenPegawai } from './components/ManajemenPegawai';
import { PengaturanSekolah } from './components/PengaturanSekolah';
import { PanduanGasModal } from './components/PanduanGasModal';
import { GasService } from './services/gasService';
import { JurnalHarian, Pegawai, SekolahConfig, GasConfig } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('input');

  // App data state
  const [sekolah, setSekolah] = useState<SekolahConfig>(() => GasService.getLocalSekolah());
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>(() => GasService.getLocalPegawai());
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>(() => {
    const list = GasService.getLocalPegawai();
    return list.length > 0 ? list[0].id : 'peg-1';
  });
  const [jurnalList, setJurnalList] = useState<JurnalHarian[]>(() => GasService.getLocalJurnal());
  const [gasConfig, setGasConfig] = useState<GasConfig>(() => GasService.getGasConfig());

  // Auto-fetch data pegawai langsung dari spreadsheet saat aplikasi dimulai atau URL diubah
  useEffect(() => {
    if (gasConfig.webAppUrl && gasConfig.webAppUrl.trim()) {
      GasService.fetchPegawaiFromGas(gasConfig.webAppUrl).then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setPegawaiList(res.data);
          if (!selectedPegawaiId || !res.data.some(p => p.id === selectedPegawaiId)) {
            setSelectedPegawaiId(res.data[0].id);
          }
        }
      });
    }
  }, [gasConfig.webAppUrl]);

  const handleReloadPegawaiList = (newList: Pegawai[]) => {
    setPegawaiList(newList);
    GasService.saveLocalPegawai(newList);
    if (newList.length > 0 && (!selectedPegawaiId || !newList.some(p => p.id === selectedPegawaiId))) {
      setSelectedPegawaiId(newList[0].id);
    }
  };

  // Active item for F4 Preview
  const [previewJurnal, setPreviewJurnal] = useState<JurnalHarian>(() => {
    const list = GasService.getLocalJurnal();
    return list[0] || {
      id: 'PREVIEW-1',
      pegawaiId: 'peg-1',
      pegawaiNama: 'Dr. H. Samsudin, M.Pd.',
      tanggal: '2026-03-02',
      hari: 'Senin',
      jamMulai: '06:30',
      jamSelesai: '14:00',
      kategori: 'Pelaksanaan Pembelajaran (KBM)',
      uraianKegiatan: 'Melaksanakan pembelajaran tatap muka Matematika materi Bangun Ruang Kelas VI SDN Babelan Kota 01.',
      outputHasil: 'Nilai formatif 28 siswa',
      volumeOutput: '28 Siswa',
      kendala: 'Tidak ada kendala',
      tindakLanjut: 'Selesai',
      statusVerifikasi: 'Disetujui'
    };
  });

  const handleLiveUpdate = useCallback((liveData: JurnalHarian) => {
    setPreviewJurnal(liveData);
  }, []);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  // Handlers for Jurnal
  const handleSaveJurnal = async (newJurnal: JurnalHarian) => {
    setIsSaving(true);
    setSaveStatus({ type: null, message: '' });

    // 1. Simpan ke local state & localStorage
    const updated = [newJurnal, ...jurnalList];
    setJurnalList(updated);
    GasService.saveLocalJurnal(updated);
    setPreviewJurnal(newJurnal);

    // 2. Jika Google Apps Script tersambung, kirim ke Google Spreadsheet & Drive
    let gasMessage = 'Tersimpan aman di penyimpanan lokal perangkat.';
    if (gasConfig.webAppUrl) {
      const res = await GasService.kirimJurnalKeGas(gasConfig.webAppUrl, newJurnal);
      if (res.success) {
        gasMessage = res.message;
      }
    }

    setIsSaving(false);
    setSaveStatus({
      type: 'success',
      message: `Jurnal tanggal ${newJurnal.tanggal} (${newJurnal.pegawaiNama}) berhasil dicatat. ${gasMessage}`
    });

    setTimeout(() => {
      setSaveStatus({ type: null, message: '' });
    }, 6000);
  };

  const handleDeleteJurnal = (id: string) => {
    const updated = jurnalList.filter((j) => j.id !== id);
    setJurnalList(updated);
    GasService.saveLocalJurnal(updated);
    if (previewJurnal.id === id && updated.length > 0) {
      setPreviewJurnal(updated[0]);
    }
  };

  // Handlers for Pegawai
  const handleSavePegawai = async (newOrUpdated: Pegawai) => {
    setIsSaving(true);
    const exists = pegawaiList.some((p) => p.id === newOrUpdated.id);
    let updated: Pegawai[];
    if (exists) {
      updated = pegawaiList.map((p) => (p.id === newOrUpdated.id ? newOrUpdated : p));
    } else {
      updated = [...pegawaiList, newOrUpdated];
    }
    setPegawaiList(updated);
    GasService.saveLocalPegawai(updated);

    if (gasConfig.webAppUrl) {
      await GasService.kirimPegawaiKeGas(gasConfig.webAppUrl, newOrUpdated);
    }
    setIsSaving(false);
  };

  const handleDeletePegawai = (id: string) => {
    const updated = pegawaiList.filter((p) => p.id !== id);
    setPegawaiList(updated);
    GasService.saveLocalPegawai(updated);
    if (selectedPegawaiId === id && updated.length > 0) {
      setSelectedPegawaiId(updated[0].id);
    }
  };

  // Handlers for Sekolah
  const handleSaveSekolah = async (newConfig: SekolahConfig) => {
    setIsSaving(true);
    setSekolah(newConfig);
    GasService.saveLocalSekolah(newConfig);

    if (gasConfig.webAppUrl) {
      await GasService.kirimSekolahKeGas(gasConfig.webAppUrl, newConfig);
    }
    setIsSaving(false);
  };

  // Handlers for GAS Config
  const handleUpdateGasConfig = (newConfig: GasConfig) => {
    setGasConfig(newConfig);
    GasService.saveGasConfig(newConfig);
  };

  const activePegawai =
    pegawaiList.find((p) => p.id === previewJurnal.pegawaiId) ||
    pegawaiList.find((p) => p.id === selectedPegawaiId) ||
    pegawaiList[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/40 via-slate-50 to-slate-100 text-slate-900 flex flex-col">
      {/* Header Banner Resmi dengan Navigasi Utama Tepat di Bawah Judul */}
      <BannerHero
        sekolah={sekolah}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gasConfig={gasConfig}
        onOpenGasModal={() => setActiveTab('panduan')}
        onPrintPreview={() => {
          setActiveTab('preview');
          setTimeout(() => window.print(), 300);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Input Jurnal (Dua Kolom: Kiri Form, Kanan Pratinjau Lembar F4 Langsung) */}
        {activeTab === 'input' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 xl:col-span-5">
              <FormInputJurnal
                pegawaiList={pegawaiList}
                selectedPegawaiId={selectedPegawaiId}
                setSelectedPegawaiId={setSelectedPegawaiId}
                onSaveJurnal={handleSaveJurnal}
                onLiveUpdate={handleLiveUpdate}
                onViewPreview={(tempJurnal) => {
                  setPreviewJurnal(tempJurnal);
                  setActiveTab('preview');
                }}
                isSaving={isSaving}
                saveStatus={saveStatus}
              />
            </div>

            <div className="lg:col-span-6 xl:col-span-7">
              <div className="sticky top-20">
                <LembarPratinjauF4
                  jurnal={previewJurnal}
                  pegawai={activePegawai}
                  sekolah={sekolah}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pratinjau Lembar F4 Penuh */}
        {activeTab === 'preview' && (
          <div className="max-w-4xl mx-auto">
            <LembarPratinjauF4
              jurnal={previewJurnal}
              pegawai={activePegawai}
              sekolah={sekolah}
            />
          </div>
        )}

        {/* Tab 3: Rekapitulasi & Riwayat Jurnal */}
        {activeTab === 'rekap' && (
          <RekapJurnal
            jurnalList={jurnalList}
            pegawaiList={pegawaiList}
            sekolah={sekolah}
            onSelectJurnalForPreview={(item) => {
              setPreviewJurnal(item);
              setActiveTab('preview');
            }}
            onDeleteJurnal={handleDeleteJurnal}
          />
        )}

        {/* Tab 4: Manajemen Guru & Pegawai */}
        {activeTab === 'pegawai' && (
          <ManajemenPegawai
            pegawaiList={pegawaiList}
            onSavePegawai={handleSavePegawai}
            onDeletePegawai={handleDeletePegawai}
            isSaving={isSaving}
            gasConfig={gasConfig}
            onUpdateGasConfig={handleUpdateGasConfig}
            onReloadPegawaiList={handleReloadPegawaiList}
          />
        )}

        {/* Tab 5: Pejabat Penilai */}
        {activeTab === 'sekolah' && (
          <PengaturanSekolah
            sekolah={sekolah}
            onSaveSekolah={handleSaveSekolah}
            isSaving={isSaving}
            gasConfig={gasConfig}
            onUpdateGasConfig={handleUpdateGasConfig}
          />
        )}

        {/* Tab 6: Panduan & Script Code.gs / Index.html */}
        {activeTab === 'panduan' && (
          <PanduanGasModal
            gasConfig={gasConfig}
            onUpdateGasConfig={handleUpdateGasConfig}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 {(sekolah.namaSekolah || 'SD NEGERI BABELAN KOTA 01').toUpperCase()} · Dinas Pendidikan Kabupaten Bekasi
          </div>
          <div className="flex items-center gap-3">
            <span>Sistem Informasi Jurnal Harian SIKAWAN</span>
            <span>·</span>
            <button
              onClick={() => setActiveTab('panduan')}
              className="text-blue-600 hover:underline font-medium cursor-pointer"
            >
              Script Google Apps Script
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
