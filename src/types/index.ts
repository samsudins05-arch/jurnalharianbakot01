export interface Pegawai {
  id: string;
  nip: string;
  nama: string;
  jabatan: string;
  golongan: string;
  status: 'PNS' | 'PPPK' | 'Honorer' | 'Tenaga Kependidikan';
  unitKerja?: string;
  fotoUrl?: string;
  fotoBase64?: string;
  ttdUrl?: string;
  ttdBase64?: string;
}

export interface KegiatanItem {
  id: string;
  jamMulaiJam: string;
  jamMulaiMenit: string;
  jamSelesaiJam: string;
  jamSelesaiMenit: string;
  uraian: string;
  buktiDukung: string;
  keterangan?: string;
  fotoBase64?: string;
}

export interface JurnalHarian {
  id: string;
  pegawaiId: string;
  pegawaiNama: string;
  tanggal: string; // YYYY-MM-DD
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  kategori: string;
  uraianKegiatan: string;
  outputHasil: string;
  volumeOutput: string;
  kendala?: string;
  tindakLanjut?: string;
  fotoDokumentasi?: string;
  fotoDokumentasiBase64?: string;
  kegiatanList?: KegiatanItem[];
  statusVerifikasi?: 'Disetujui' | 'Menunggu' | 'Perbaikan';
  catatanKepalaSekolah?: string;
  timestamp?: string;
}

export interface SekolahConfig {
  namaSekolah: string;
  npsn?: string;
  alamat?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  tahunJurnal?: number;
  kepalaSekolahNama: string;
  kepalaSekolahNIP: string;
  kepalaSekolahGolongan?: string;
  kepalaSekolahFoto?: string;
  kepalaSekolahTtd?: string;
  kepalaSekolahTtdBase64?: string;
  stempelSekolahBase64?: string;
  kopSekolahBase64?: string;
  kopSekolahUrl?: string;
  stempelSekolahUrl?: string;
}

export interface GasConfig {
  webAppUrl: string;
  isConnected: boolean;
  lastSync?: string;
  autoSync: boolean;
}
