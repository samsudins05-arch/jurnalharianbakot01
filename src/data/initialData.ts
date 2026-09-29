import { Pegawai, JurnalHarian, SekolahConfig } from '../types';

export const INITIAL_SEKOLAH: SekolahConfig = {
  namaSekolah: 'SD NEGERI BABELAN KOTA 01',
  npsn: '20218386',
  alamat: 'Jl. Raya Babelan No. 01, Kel. Babelan Kota, Kec. Babelan, Kab. Bekasi 17610',
  kecamatan: 'Babelan',
  kabupaten: 'Kabupaten Bekasi',
  provinsi: 'Jawa Barat',
  tahunJurnal: 2026,
  kepalaSekolahNama: 'Hj. Siti Rohmah, M.Pd.',
  kepalaSekolahNIP: '19720514 199603 2 002',
  kepalaSekolahGolongan: 'Pembina Tk. I (IV/b)'
};

export const INITIAL_PEGAWAI: Pegawai[] = [];

export const INITIAL_JURNAL: JurnalHarian[] = [];

export const KATEGORI_AKTIVITAS = [
  'Pelaksanaan Pembelajaran (KBM)',
  'Penyusunan Perangkat / Modul Ajar',
  'Penilaian & Evaluasi Asesmen',
  'Bimbingan Siswa & Ekstrakurikuler',
  'Tugas Tambahan / Kepanitiaan',
  'Pengembangan Keprofesian (KKG/PMM)',
  'Pelayanan Administrasi Sekolah'
];

export const TEMPLATE_URAIAN = [
  {
    judul: 'KBM Matematika',
    kategori: 'Pelaksanaan Pembelajaran (KBM)',
    uraian: 'Melaksanakan kegiatan pembelajaran Matematika materi Bangun Ruang Kelas VI melalui pendekatan saintifik, penugasan kelompok terarah, dan asesmen formatif.',
    output: 'Nilai formatif 30 siswa & pemahaman konsep bangun ruang',
    volume: '30 Siswa'
  },
  {
    judul: 'KBM Bahasa Indonesia Literasi',
    kategori: 'Pelaksanaan Pembelajaran (KBM)',
    uraian: 'Melaksanakan pembelajaran Bahasa Indonesia fokus pemahaman teks narasi dan menulis ringkasan cerita dengan teknik peta konsep pikiran (mind mapping).',
    output: 'Lembar kerja ringkasan narasi siswa kelas VI',
    volume: '28 Dokumen LKPD'
  },
  {
    judul: 'Penyusunan Modul Ajar / RPP',
    kategori: 'Penyusunan Perangkat / Modul Ajar',
    uraian: 'Menyusun dan mereview Modul Ajar Kurikulum Merdeka untuk pekan berjalan, melengkapi rubrik penilaian asesmen otentik, dan media ajar berbasis audio-visual.',
    output: 'Dokumen Modul Ajar Lengkap dengan Rubrik Asesmen',
    volume: '1 Dokumen Modul'
  },
  {
    judul: 'Asesmen & Koreksi Tugas',
    kategori: 'Penilaian & Evaluasi Asesmen',
    uraian: 'Melakukan koreksi hasil Asesmen Sumatif Lingkup Materi pada mata pelajaran IPAS, merekap nilai ke dalam buku leger nilai, dan menganalisis butir soal remedial.',
    output: 'Rekapitulasi Nilai Asesmen & Analisis Hasil Belajar',
    volume: '32 Lembar Asesmen'
  },
  {
    judul: 'Kegiatan KKG / Komunitas Belajar',
    kategori: 'Pengembangan Keprofesian (KKG/PMM)',
    uraian: 'Mengikuti pertemuan Komunitas Belajar / Kelompok Kerja Guru (KKG) gugus membahas integrasi Pembelajaran Berdiferensiasi dan pemanfaatan Platform Merdeka Mengajar (PMM).',
    output: 'Notula Kegiatan KKG & Rencana Aksi Kelas',
    volume: '1 Laporan Notula'
  },
  {
    judul: 'Upacara / Pembiasaan Pagi',
    kategori: 'Tugas Tambahan / Kepanitiaan',
    uraian: 'Bertindak sebagai pembina/pendamping upacara bendera hari Senin dan pengawasan tata tertib siswa serta pembiasaan karakter Profil Pelajar Pancasila.',
    output: 'Keterlaksanaan upacara bendera yang tertib & khidmat',
    volume: '1 Kegiatan Upacara'
  }
];
