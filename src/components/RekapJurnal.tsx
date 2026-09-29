import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  Trash2,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { JurnalHarian, Pegawai, SekolahConfig } from '../types';

interface RekapJurnalProps {
  jurnalList: JurnalHarian[];
  pegawaiList: Pegawai[];
  sekolah: SekolahConfig;
  onSelectJurnalForPreview: (jurnal: JurnalHarian) => void;
  onDeleteJurnal: (id: string) => void;
}

export const RekapJurnal: React.FC<RekapJurnalProps> = ({
  jurnalList,
  pegawaiList,
  sekolah,
  onSelectJurnalForPreview,
  onDeleteJurnal
}) => {
  const [filterPegawaiId, setFilterPegawaiId] = useState<string>('all');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMonthlyPrintView, setIsMonthlyPrintView] = useState<boolean>(false);

  const filteredJurnal = useMemo(() => {
    return jurnalList.filter((item) => {
      if (filterPegawaiId !== 'all' && item.pegawaiId !== filterPegawaiId) {
        return false;
      }
      if (filterKategori !== 'all' && item.kategori !== filterKategori) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUraian = item.uraianKegiatan?.toLowerCase().includes(q);
        const matchOutput = item.outputHasil?.toLowerCase().includes(q);
        const matchNama = item.pegawaiNama?.toLowerCase().includes(q);
        if (!matchUraian && !matchOutput && !matchNama) return false;
      }
      return true;
    });
  }, [jurnalList, filterPegawaiId, filterKategori, searchQuery]);

  const handleExportCSV = () => {
    if (filteredJurnal.length === 0) {
      alert('Tidak ada data jurnal untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'ID Jurnal',
      'Tanggal',
      'Hari',
      'Waktu',
      'Nama Pegawai',
      'Kategori',
      'Uraian Kegiatan',
      'Output Hasil',
      'Volume',
      'Kendala',
      'Tindak Lanjut',
      'Status Verifikasi'
    ];

    const rows = filteredJurnal.map((item, index) => [
      index + 1,
      item.id,
      item.tanggal,
      item.hari,
      `${item.jamMulai} - ${item.jamSelesai}`,
      `"${item.pegawaiNama.replace(/"/g, '""')}"`,
      `"${item.kategori.replace(/"/g, '""')}"`,
      `"${item.uraianKegiatan.replace(/"/g, '""')}"`,
      `"${item.outputHasil.replace(/"/g, '""')}"`,
      `"${item.volumeOutput || '1'}"`,
      `"${(item.kendala || '').replace(/"/g, '""')}"`,
      `"${(item.tindakLanjut || '').replace(/"/g, '""')}"`,
      item.statusVerifikasi || 'Disetujui'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekap_Jurnal_Sikawan_${sekolah.namaSekolah.replace(/\s+/g, '_')}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedPegawai = pegawaiList.find((p) => p.id === filterPegawaiId);

  return (
    <div className="space-y-5">
      {/* Controls & Filter Bar */}
      <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Rekap Harian
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-blue-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Ekspor ke CSV/Excel</span>
            </button>

            <button
              onClick={() => {
                setIsMonthlyPrintView(!isMonthlyPrintView);
                if (!isMonthlyPrintView) {
                  setTimeout(() => window.print(), 300);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer hover:shadow"
            >
              <Printer className="w-3.5 h-3.5 text-sky-100" />
              <span>Cetak Rekapitulasi</span>
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Saring Berdasarkan Pegawai / Guru
            </label>
            <select
              value={filterPegawaiId}
              onChange={(e) => setFilterPegawaiId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="all">Semua Guru & Staf ({pegawaiList.length})</option>
              {pegawaiList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({p.jabatan})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori Aktivitas
            </label>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="all">Semua Kategori</option>
              <option value="Pelaksanaan Pembelajaran (KBM)">Pelaksanaan Pembelajaran (KBM)</option>
              <option value="Penyusunan Perangkat / Modul Ajar">Penyusunan Perangkat / Modul Ajar</option>
              <option value="Penilaian & Evaluasi Asesmen">Penilaian & Evaluasi Asesmen</option>
              <option value="Bimbingan Siswa & Ekstrakurikuler">Bimbingan Siswa & Ekstrakurikuler</option>
              <option value="Tugas Tambahan / Kepanitiaan">Tugas Tambahan / Kepanitiaan</option>
              <option value="Pengembangan Keprofesian (KKG/PMM)">Pengembangan Keprofesian (KKG/PMM)</option>
              <option value="Pelayanan Administrasi Sekolah">Pelayanan Administrasi Sekolah</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pencarian Kata Kunci
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari materi / kegiatan / nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Rekapitulasi Utama */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
          <div>
            Menampilkan <span className="font-semibold text-slate-900 tabular-nums">{filteredJurnal.length}</span> entri jurnal
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Tahun {sekolah.tahunJurnal}</span>
          </div>
        </div>

        {filteredJurnal.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-700">
              Belum Ada Entri Jurnal yang Sesuai
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Silakan input jurnal harian baru melalui menu "Input Jurnal" di atas atau sesuaikan kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-3 w-32">Hari / Tanggal</th>
                  <th className="py-2.5 px-3 w-28">Waktu</th>
                  <th className="py-2.5 px-3 w-40">Pegawai</th>
                  <th className="py-2.5 px-3">Uraian Aktivitas & Output</th>
                  <th className="py-2.5 px-3 w-28 text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJurnal.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-500 tabular-nums align-top">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 align-top">
                      <div className="font-semibold text-slate-900">{item.hari}</div>
                      <div className="text-slate-500 text-[11px] tabular-nums">{item.tanggal}</div>
                    </td>
                    <td className="py-3 px-3 align-top text-slate-600 tabular-nums">
                      {item.jamMulai} - {item.jamSelesai}
                    </td>
                    <td className="py-3 px-3 align-top">
                      <div className="font-semibold text-slate-900">{item.pegawaiNama}</div>
                      <div className="text-[11px] text-blue-700">{item.kategori}</div>
                    </td>
                    <td className="py-3 px-3 align-top">
                      <div className="text-slate-800 line-clamp-2 leading-relaxed">
                        {item.uraianKegiatan}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-600">
                        <span className="font-medium text-slate-700">Output:</span> {item.outputHasil}{' '}
                        {item.volumeOutput ? `(${item.volumeOutput})` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center align-top no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectJurnalForPreview(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                          title="Lihat Lembar Cetak F4"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Yakin ingin menghapus jurnal ini dari riwayat?')) {
                              onDeleteJurnal(item.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                          title="Hapus Entri"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lembar Rekap Bulanan Terstruktur untuk Pencetakan Massal */}
      <div className="hidden print:block font-official text-xs p-6 bg-white">
        <div className="text-center border-b-2 border-black pb-2 mb-4">
          <h3 className="text-sm font-bold uppercase m-0">PEMERINTAH KABUPATEN BEKASI - DINAS PENDIDIKAN</h3>
          <h2 className="text-base font-bold uppercase m-0">{sekolah.namaSekolah}</h2>
          <p className="text-[11px] m-0">REKAPITULASI LAPORAN JURNAL HARIAN SIKAWAN PEGAWAI</p>
        </div>

        <table className="w-full mb-3 text-[11px]">
          <tbody>
            <tr>
              <td className="w-28 font-semibold">Pegawai Terpilih</td>
              <td className="w-2">:</td>
              <td>{selectedPegawai ? `${selectedPegawai.nama} (NIP: ${selectedPegawai.nip})` : 'Seluruh Pegawai'}</td>
            </tr>
            <tr>
              <td className="font-semibold">Unit Kerja</td>
              <td>:</td>
              <td>{sekolah.namaSekolah}</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr className="bg-slate-200 text-center font-bold">
              <th className="border border-black p-1 w-8">No</th>
              <th className="border border-black p-1 w-20">Tanggal</th>
              <th className="border border-black p-1 w-20">Waktu</th>
              <th className="border border-black p-1 w-32">Pegawai</th>
              <th className="border border-black p-1">Uraian Aktivitas Tugas & KBM</th>
              <th className="border border-black p-1 w-32">Output Hasil</th>
            </tr>
          </thead>
          <tbody>
            {filteredJurnal.map((item, idx) => (
              <tr key={item.id}>
                <td className="border border-black p-1 text-center align-top">{idx + 1}</td>
                <td className="border border-black p-1 align-top">{item.hari}, {item.tanggal}</td>
                <td className="border border-black p-1 text-center align-top">{item.jamMulai}-{item.jamSelesai}</td>
                <td className="border border-black p-1 align-top">{item.pegawaiNama}</td>
                <td className="border border-black p-1 align-top">[{item.kategori}] {item.uraianKegiatan}</td>
                <td className="border border-black p-1 align-top">{item.outputHasil} ({item.volumeOutput || '1'})</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-4 text-center text-[10px] mt-8">
          <div>
            Mengetahui,<br />
            Kepala {sekolah.namaSekolah}<br /><br /><br /><br />
            <strong>{sekolah.kepalaSekolahNama}</strong><br />
            NIP. {sekolah.kepalaSekolahNIP}
          </div>
          <div>
            Babelan, {new Date().toLocaleDateString('id-ID')}<br />
            Pembuat Rekapitulasi,<br /><br /><br /><br />
            <strong>{selectedPegawai ? selectedPegawai.nama : '[Guru / Operator]'}</strong><br />
            NIP. {selectedPegawai ? selectedPegawai.nip : '-'}
          </div>
        </div>
      </div>
    </div>
  );
};
