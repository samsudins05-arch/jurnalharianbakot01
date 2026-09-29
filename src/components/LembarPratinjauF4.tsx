import React, { useRef, useState } from 'react';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';
import { JurnalHarian, Pegawai, SekolahConfig } from '../types';
import schoolLogo from '../assets/images/logo-bakot-01.png';

interface LembarPratinjauF4Props {
  jurnal: JurnalHarian;
  pegawai?: Pegawai;
  sekolah: SekolahConfig;
  onPrint?: () => void;
}

export const LembarPratinjauF4: React.FC<LembarPratinjauF4Props> = ({
  jurnal,
  pegawai,
  sekolah
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const formatTanggalIndo = (dateStr: string) => {
    if (!dateStr) return '2026';
    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      return `${day} ${bulan[monthIdx] || ''} ${year}`;
    }
    return dateStr;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || isDownloading) return;
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      const element = printRef.current;

      // Render citra resolusi tinggi dengan html-to-image (mendukung format warna oklch dari Tailwind v4)
      const imgData = await toJpeg(element, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true,
        style: {
          boxShadow: 'none',
          border: 'none',
          outline: 'none',
          margin: '0',
        },
      });

      // Muat gambar untuk memastikan aspek rasio dan dimensi akurat
      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Gagal memproses gambar hasil render'));
      });

      const canvasWidth = img.naturalWidth || img.width;
      const canvasHeight = img.naturalHeight || img.height;

      // Standar Ukuran Folio / F4 Resmi Indonesia: 215 mm x 330 mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [215, 330],
        compress: true,
      });

      const pdfWidth = 215;
      const pdfHeight = 330;

      // Lembar sudah memiliki margin presisi: margin kiri-kanan 1.2cm (12mm) dan atas-bawah 1cm (10mm).
      // Memetakan citra langsung ke koordinat (0, 0, 215, 330) menghasilkan lembar 100% full dengan margin akurat.
      const canvasAspect = canvasHeight / canvasWidth;
      const f4Aspect = pdfHeight / pdfWidth; // 330 / 215 = 1.53488

      if (canvasAspect <= f4Aspect + 0.03) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      } else {
        const scaledHeight = (canvasHeight * pdfWidth) / canvasWidth;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(scaledHeight, pdfHeight), undefined, 'FAST');
      }

      // Generate Nama File Bersih
      const cleanDate = jurnal.tanggal ? jurnal.tanggal.replace(/-/g, '') : '2026';
      const cleanPegawai = (jurnal.pegawaiNama || pegawai?.nama || 'Pegawai')
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Jurnal_F4_${cleanPegawai}_${cleanDate}.pdf`;

      pdf.save(filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (error) {
      console.error('Gagal membuat PDF langsung:', error);
      // Fallback ke dialog print sistem browser jika terjadi kegagalan render
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar (Hidden during Print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
            F4
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              LEMBAR KERJA:
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer hover:shadow disabled:opacity-60"
            title="Download Dokumen F4 Langsung dalam Format PDF"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 text-emerald-100 animate-spin" />
                <span>Menyiapkan PDF...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                <span>PDF Berhasil Diunduh!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-emerald-100" />
                <span>Simpan PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Wrapper agar di layar perangkat apapun tetap rapi dan pas ukuran F4 */}
      <div className="overflow-x-auto pb-6 flex justify-center">
        <div className="bg-white shadow-md mx-auto">
          {/* Lembar Dokumen F4 (Target Cetak & Simpan PDF) - Murni tanpa shadow dan tanpa garis sisi */}
          <div
            ref={printRef}
            className="print-container bg-white text-black leading-normal flex flex-col justify-between shrink-0"
            style={{
              width: '215mm',
              minHeight: '330mm',
              boxSizing: 'border-box',
              paddingTop: '10mm', // Margin atas 1cm
              paddingBottom: '10mm', // Margin bawah 1cm
              paddingLeft: '12mm', // Margin kiri 1.2cm
              paddingRight: '12mm', // Margin kanan 1.2cm
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: '10pt',
              boxShadow: 'none',
              border: 'none',
              outline: 'none',
            }}
          >
          <div className="flex-1 w-full">
            {/* Kop Surat Resmi - Full 100% */}
            {sekolah.kopSekolahBase64 ? (
              <div className="relative border-b-4 border-double border-black pb-2 mb-4 flex justify-center w-full">
                <img
                  src={sekolah.kopSekolahBase64}
                  alt="Kop Sekolah Resmi"
                  className="w-full max-h-32 object-contain"
                />
              </div>
            ) : (
              <div className="relative border-b-4 border-double border-black pb-3 mb-4 w-full">
                <div className="flex items-center justify-between gap-4 w-full">
              <img
                src={schoolLogo}
                alt="Logo Sekolah"
                className="w-20 h-20 object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="text-center flex-1">
                <h4 className="text-sm sm:text-base font-bold tracking-wider uppercase m-0 leading-tight">
                  Pemerintah Kabupaten Bekasi
                </h4>
                <h3 className="text-base sm:text-lg font-extrabold tracking-wider uppercase m-0 mt-0.5 leading-tight">
                  Dinas Pendidikan
                </h3>
                <h2 className="text-lg sm:text-xl font-black tracking-wide uppercase m-0 mt-0.5 text-blue-900 print:text-black leading-tight">
                  {sekolah.namaSekolah}
                </h2>
                {sekolah.npsn && (
                  <p className="text-[11px] sm:text-xs m-0 mt-1 font-sans text-slate-700 print:text-black leading-tight">
                    NPSN: {sekolah.npsn} {sekolah.alamat ? `· ${sekolah.alamat}` : ''}
                  </p>
                )}
                {sekolah.kecamatan && (
                  <p className="text-[10px] sm:text-[11px] m-0 font-sans text-slate-600 print:text-black">
                    Kecamatan {sekolah.kecamatan}, {sekolah.kabupaten || 'Kabupaten Bekasi'}, {sekolah.provinsi || 'Jawa Barat'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Judul Lembar Jurnal - Ukuran tetap tidak diubah */}
        <div className="text-center mb-4">
          <h3 className="text-base sm:text-lg font-bold underline tracking-wider uppercase m-0">
            JURNAL KERJA HARIAN
          </h3>
        </div>

        {/* Identitas Pegawai - Jarak No Spacing & Ukuran 10pt */}
        <table className="w-full text-[10pt] mb-3 border-collapse leading-tight" style={{ borderSpacing: 0 }}>
          <tbody>
            <tr>
              <td className="w-36 py-0 font-semibold text-black align-top">Nama</td>
              <td className="w-3 py-0 text-black align-top">:</td>
              <td className="py-0 font-bold text-black align-top">
                {jurnal.pegawaiNama || pegawai?.nama || '-'}
              </td>
            </tr>
            <tr>
              <td className="py-0 font-semibold text-black align-top">NIP</td>
              <td className="py-0 text-black align-top">:</td>
              <td className="py-0 text-black align-top">
                {pegawai?.nip || '-'}
              </td>
            </tr>
            <tr>
              <td className="py-0 font-semibold text-black align-top">Jabatan</td>
              <td className="py-0 text-black align-top">:</td>
              <td className="py-0 text-black align-top">
                {pegawai?.jabatan || 'Guru Kelas'}
              </td>
            </tr>
            <tr>
              <td className="py-0 font-semibold text-black align-top">Unit Kerja</td>
              <td className="py-0 text-black align-top">:</td>
              <td className="py-0 text-black align-top">
                {pegawai?.unitKerja || sekolah.namaSekolah}
              </td>
            </tr>
            <tr>
              <td className="py-0 font-semibold text-black align-top">Pangkat / Gol</td>
              <td className="py-0 text-black align-top">:</td>
              <td className="py-0 text-black align-top">
                {pegawai?.golongan || '-'}
              </td>
            </tr>
            <tr>
              <td className="py-0 font-semibold text-black align-top">Status Pegawai</td>
              <td className="py-0 text-black align-top">:</td>
              <td className="py-0 text-black align-top">
                {pegawai?.status || 'PNS'}
              </td>
            </tr>
            <tr>
              <td className="py-0 font-semibold text-black align-top">Hari / Tanggal</td>
              <td className="py-0 text-black align-top">:</td>
              <td className="py-0 font-medium text-black align-top">
                {jurnal.hari}, {formatTanggalIndo(jurnal.tanggal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Tabel Aktivitas Harian - Font 10pt */}
        <table className="w-full border-collapse border border-black text-[10pt] mb-5">
          <thead>
            <tr className="bg-slate-100 print:bg-slate-200 text-center font-bold text-black border-b border-black">
              <th className="border border-black px-2 py-1.5 w-8 text-[10pt]">No</th>
              <th className="border border-black px-2 py-1.5 w-24 text-[10pt]">Waktu</th>
              <th className="border border-black px-2 py-1.5 text-[10pt]">Kegiatan</th>
              <th className="border border-black px-2 py-1.5 w-28 sm:w-36 text-[10pt]">Bukti Dukung</th>
              <th className="border border-black px-2 py-1.5 w-14 text-[10pt]">Ket</th>
            </tr>
          </thead>
          <tbody>
            {jurnal.kegiatanList && jurnal.kegiatanList.length > 0 ? (
              jurnal.kegiatanList.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="border border-black px-2 py-2 text-center align-top tabular-nums font-semibold text-[10pt] leading-snug">
                    {idx + 1}
                  </td>
                  <td className="border border-black px-2 py-2 text-center align-top tabular-nums font-medium whitespace-nowrap text-[10pt] leading-snug">
                    {item.jamMulaiJam || '06'}:{item.jamMulaiMenit || '30'} - {item.jamSelesaiJam || '14'}:{item.jamSelesaiMenit || '00'}
                  </td>
                  <td className="border border-black px-2 py-2 align-top text-[10pt] leading-snug">
                    <div className="leading-snug text-justify whitespace-pre-wrap">
                      {item.uraian || <span className="text-slate-400 italic">Belum ada uraian kegiatan...</span>}
                    </div>
                  </td>
                  <td className="border border-black px-2 py-2 align-middle text-center text-[10pt] leading-snug">
                    {(item.fotoBase64 || (idx === 0 && jurnal.fotoDokumentasiBase64 && !jurnal.kegiatanList?.some((k) => k.fotoBase64))) ? (
                      <div className="w-full flex justify-center">
                        <img
                          src={item.fotoBase64 || jurnal.fotoDokumentasiBase64}
                          alt="Bukti Dukung"
                          className="max-w-full max-h-24 sm:max-h-28 object-contain rounded border border-slate-300 print:border-black shadow-2xs bg-slate-50 print:bg-transparent"
                        />
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="border border-black px-2 py-2 text-center align-top text-black font-medium text-[10pt] leading-snug">
                    {item.keterangan || ''}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border border-black px-2 py-2 text-center align-top tabular-nums font-semibold text-[10pt] leading-snug">1</td>
                <td className="border border-black px-2 py-2 text-center align-top tabular-nums font-medium whitespace-nowrap text-[10pt] leading-snug">
                  {jurnal.jamMulai} - {jurnal.jamSelesai}
                </td>
                <td className="border border-black px-2 py-2 align-top text-[10pt] leading-snug">
                  <div className="leading-snug text-justify whitespace-pre-wrap">
                    {jurnal.uraianKegiatan || '-'}
                  </div>
                  {jurnal.kendala && jurnal.kendala !== 'Tidak ada kendala' && (
                    <div className="mt-1.5 text-[10pt] text-black bg-slate-50 print:bg-transparent p-1 rounded border border-slate-200 print:border-black">
                      <span className="font-semibold">Kendala:</span> {jurnal.kendala}
                    </div>
                  )}
                </td>
                <td className="border border-black px-2 py-2 align-middle text-center text-[10pt] leading-snug">
                  {jurnal.fotoDokumentasiBase64 ? (
                    <div className="w-full flex justify-center">
                      <img
                        src={jurnal.fotoDokumentasiBase64}
                        alt="Bukti Dukung"
                        className="max-w-full max-h-24 sm:max-h-28 object-contain rounded border border-slate-300 print:border-black shadow-2xs bg-slate-50 print:bg-transparent"
                      />
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="border border-black px-2 py-2 text-center align-top text-black font-medium text-[10pt] leading-snug">
                  {jurnal.tindakLanjut && jurnal.tindakLanjut !== 'Selesai' ? jurnal.tindakLanjut : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Kolom Tanda Tangan Resmi - Font 10pt */}
        <div className="grid grid-cols-2 gap-8 text-center text-[10pt] mt-8 pt-4 pb-14">
          <div>
            <p className="m-0">Mengetahui,</p>
            <p className="m-0 font-semibold">
              Kepala Sekolah,
            </p>
            <div className="h-[65px] flex items-end justify-center relative my-0.5">
              {/* Stempel Sekolah (jika diupload) - Ukuran 43x43 (43mm x 43mm), digeser ke kiri 16mm (tambahan 8mm ke kiri) */}
              {sekolah.stempelSekolahBase64 && (
                <img
                  src={sekolah.stempelSekolahBase64}
                  alt="Stempel Sekolah"
                  style={{
                    width: '43mm',
                    height: '43mm',
                    left: 'calc(50% - 21.5mm - 16mm)',
                    top: '35%',
                    transform: 'translateY(-50%)'
                  }}
                  className="absolute object-contain pointer-events-none mix-blend-multiply opacity-90 z-0"
                />
              )}
              {/* TTD Kepala Sekolah (jika diupload) - Dibesarkan dan menempel ke nama kepala sekolah */}
              {sekolah.kepalaSekolahTtdBase64 ? (
                <img
                  src={sekolah.kepalaSekolahTtdBase64}
                  alt="TTD Kepala Sekolah"
                  className="h-[72px] max-h-[72px] w-auto object-contain relative z-10 -mb-2 scale-110 origin-bottom"
                />
              ) : (
                <div className="w-28 h-14" />
              )}
            </div>
            <p className="m-0 font-bold underline relative z-10 -mt-0.5">{sekolah.kepalaSekolahNama}</p>
            <p className="m-0 text-[10pt] relative z-10">NIP. {sekolah.kepalaSekolahNIP}</p>
          </div>

          <div>
            <p className="m-0">
              Babelan, {formatTanggalIndo(jurnal.tanggal)}
            </p>
            <p className="m-0 font-semibold">Pegawai Yang Bersangkutan,</p>
            <div className="h-[65px] flex items-end justify-center my-0.5">
              {pegawai?.ttdBase64 ? (
                <img
                  src={pegawai.ttdBase64}
                  alt="TTD Pegawai"
                  className="max-h-14 object-contain -mb-1"
                />
              ) : (
                <div className="w-24 h-14" />
              )}
            </div>
            <p className="m-0 font-bold underline -mt-0.5">
              {jurnal.pegawaiNama || pegawai?.nama || '[Nama Pegawai]'}
            </p>
            <p className="m-0 text-[10pt]">
              NIP. {pegawai?.nip && pegawai.nip !== '-' ? pegawai.nip : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Dokumen - Terkunci di Paling Dasar Halaman (mt-auto) tanpa menempel stempel - Font 10pt Normal (Tidak Ditebalkan) */}
      <div className="mt-auto pt-2.5 border-t border-black print:border-black flex justify-between items-center text-[10pt] text-black shrink-0 font-normal w-full">
        <div className="tracking-tight font-normal">
          Jurnal_Harian_{jurnal.pegawaiNama || pegawai?.nama || 'Dr. H. Samsudin, M.Pd.'}_{pegawai?.nip && pegawai.nip !== '-' ? pegawai.nip : '196805121991031005'}
        </div>
        <div className="font-normal">
          Dicetak: {new Date().toLocaleDateString('id-ID')} · Halaman 1 dari 1
        </div>
      </div>
    </div>
    </div>
    </div>
    </div>
  );
};
