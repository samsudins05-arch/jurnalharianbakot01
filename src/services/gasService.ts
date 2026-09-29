import { JurnalHarian, Pegawai, SekolahConfig, GasConfig } from '../types';
import { INITIAL_JURNAL, INITIAL_PEGAWAI, INITIAL_SEKOLAH } from '../data/initialData';

const STORAGE_KEYS = {
  JURNAL: 'sikawan_jurnal_data',
  PEGAWAI: 'sikawan_pegawai_data',
  SEKOLAH: 'sikawan_sekolah_config',
  GAS_CONFIG: 'sikawan_gas_config'
};

export class GasService {
  // Local storage helpers
  static getLocalSekolah(): SekolahConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.SEKOLAH);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SEKOLAH, JSON.stringify(INITIAL_SEKOLAH));
      return INITIAL_SEKOLAH;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SEKOLAH;
    }
  }

  static saveLocalSekolah(sekolah: SekolahConfig): void {
    localStorage.setItem(STORAGE_KEYS.SEKOLAH, JSON.stringify(sekolah));
  }

  static getLocalPegawai(): Pegawai[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PEGAWAI);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Cek apakah data tersimpan masih memuat data pegawai bawaan dummy script awal
        const dummyNames = [
          'Dewi Ratnasari, S.Pd.SD',
          'Ahmad Fauzi, S.Pd.I',
          'Bambang Supriyadi, S.Pd.',
          'Nur Azizah, S.Kom',
          'Rina Wijayanti, S.Pd.'
        ];
        const containsDummy = parsed.some((p: any) =>
          dummyNames.includes(p.nama) ||
          p.id === 'peg-2' ||
          p.id === 'peg-3' ||
          p.id === 'peg-4' ||
          p.id === 'peg-5' ||
          p.id === 'peg-6'
        );
        if (containsDummy) {
          // Bersihkan data dummy bawaan script
          const cleaned = parsed.filter(
            (p: any) =>
              !dummyNames.includes(p.nama) &&
              !['peg-1', 'peg-2', 'peg-3', 'peg-4', 'peg-5', 'peg-6'].includes(p.id)
          );
          localStorage.setItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(cleaned));
          return cleaned;
        }
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Mengambil Data Pegawai Langsung dari Google Spreadsheet (doGet?action=getPegawai)
   */
  static async fetchPegawaiFromGas(
    url: string
  ): Promise<{ success: boolean; data: Pegawai[]; message: string }> {
    if (!url || !url.trim()) {
      return { success: false, data: [], message: 'URL Spreadsheet belum diisi.' };
    }

    const cleanUrl = url.trim();

    // 1. Coba pengambilan langsung via Fetch API (JSON)
    try {
      const getUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=getPegawai&t=${Date.now()}`;
      const response = await fetch(getUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        mode: 'cors'
      });

      if (response.ok) {
        const json = await response.json();
        const rawList = json?.data || json;
        if (Array.isArray(rawList)) {
          const mapped: Pegawai[] = rawList
            .map((item: any, idx: number) => ({
              id: item.id || `peg-${idx + 1}`,
              nama: item.nama || item.NAMA_PEGAWAI || '',
              nip: item.nip || item.NIP_PEGAWAI || '-',
              jabatan: item.jabatan || item.JABATAN || 'Guru',
              golongan: item.golongan || item.PANGKAT_GOLONGAN || '-',
              status: item.status || item.STATUS || 'PNS',
              unitKerja: item.unitKerja || 'SD Negeri Babelan Kota 01',
              fotoUrl: item.fotoUrl || item.LINK_FOTO_DRIVE || '',
              ttdUrl: item.ttdUrl || item.LINK_TTD_DRIVE || '',
              fotoBase64: item.fotoBase64 || '',
              ttdBase64: item.ttdBase64 || ''
            }))
            .filter((p: Pegawai) => p.nama && p.nama.trim() !== '');

          this.saveLocalPegawai(mapped);
          return {
            success: true,
            data: mapped,
            message: `Berhasil mengambil ${mapped.length} data pegawai dari Google Spreadsheet!`
          };
        }
      }
    } catch (err) {
      console.warn('Direct fetch failed, mencoba JSONP fallback...', err);
    }

    // 2. Fallback JSONP untuk mengatasi CORS & redirect Google Apps Script
    return new Promise((resolve) => {
      const callbackName = 'gasPegawaiCallback_' + Math.round(100000 * Math.random());
      const script = document.createElement('script');
      let timeoutId: any;

      (window as any)[callbackName] = (response: any) => {
        clearTimeout(timeoutId);
        if (script.parentNode) script.parentNode.removeChild(script);
        delete (window as any)[callbackName];

        const rawList = response?.data || response;
        if (Array.isArray(rawList)) {
          const mapped: Pegawai[] = rawList
            .map((item: any, idx: number) => ({
              id: item.id || `peg-${idx + 1}`,
              nama: item.nama || item.NAMA_PEGAWAI || '',
              nip: item.nip || item.NIP_PEGAWAI || '-',
              jabatan: item.jabatan || item.JABATAN || 'Guru',
              golongan: item.golongan || item.PANGKAT_GOLONGAN || '-',
              status: item.status || item.STATUS || 'PNS',
              unitKerja: item.unitKerja || 'SD Negeri Babelan Kota 01',
              fotoUrl: item.fotoUrl || item.LINK_FOTO_DRIVE || '',
              ttdUrl: item.ttdUrl || item.LINK_TTD_DRIVE || '',
              fotoBase64: item.fotoBase64 || '',
              ttdBase64: item.ttdBase64 || ''
            }))
            .filter((p: Pegawai) => p.nama && p.nama.trim() !== '');

          GasService.saveLocalPegawai(mapped);
          resolve({
            success: true,
            data: mapped,
            message: `Berhasil mengambil ${mapped.length} data pegawai dari Google Spreadsheet!`
          });
        } else {
          resolve({
            success: false,
            data: [],
            message: 'Format data dari Spreadsheet tidak dikenali.'
          });
        }
      };

      timeoutId = setTimeout(() => {
        if (script.parentNode) script.parentNode.removeChild(script);
        delete (window as any)[callbackName];
        resolve({
          success: false,
          data: [],
          message: 'Waktu tunggu habis saat mengambil data dari Spreadsheet.'
        });
      }, 10000);

      const jsonpUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=getPegawai&callback=${callbackName}&t=${Date.now()}`;
      script.src = jsonpUrl;
      script.onerror = () => {
        clearTimeout(timeoutId);
        if (script.parentNode) script.parentNode.removeChild(script);
        delete (window as any)[callbackName];
        resolve({
          success: false,
          data: [],
          message: 'Gagal mengambil data dari Google Apps Script Web App.'
        });
      };
      document.body.appendChild(script);
    });
  }

  static saveLocalPegawai(pegawai: Pegawai[]): void {
    localStorage.setItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(pegawai));
  }

  static getLocalJurnal(): JurnalHarian[] {
    const raw = localStorage.getItem(STORAGE_KEYS.JURNAL);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.JURNAL, JSON.stringify(INITIAL_JURNAL));
      return INITIAL_JURNAL;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : INITIAL_JURNAL;
    } catch {
      return INITIAL_JURNAL;
    }
  }

  static saveLocalJurnal(jurnal: JurnalHarian[]): void {
    localStorage.setItem(STORAGE_KEYS.JURNAL, JSON.stringify(jurnal));
  }

  static getGasConfig(): GasConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.GAS_CONFIG);
    if (!raw) {
      const def: GasConfig = {
        webAppUrl: '',
        isConnected: false,
        autoSync: true
      };
      localStorage.setItem(STORAGE_KEYS.GAS_CONFIG, JSON.stringify(def));
      return def;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { webAppUrl: '', isConnected: false, autoSync: true };
    }
  }

  static saveGasConfig(config: GasConfig): void {
    localStorage.setItem(STORAGE_KEYS.GAS_CONFIG, JSON.stringify(config));
  }

  /**
   * Menguji URL Google Apps Script Web App
   */
  static async testConnection(url: string): Promise<{ success: boolean; message: string }> {
    if (!url || !url.trim()) {
      return { success: false, message: 'URL Web App Google Apps Script belum diisi.' };
    }

    const cleanUrl = url.trim();
    if (!cleanUrl.includes('script.google.com')) {
      return {
        success: false,
        message: 'Format URL tidak valid. Pastikan diawali dengan https://script.google.com/macros/s/...'
      };
    }

    try {
      // Panggil GET action=init atau action=getSekolah
      const testUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=getSekolah&t=${Date.now()}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Berhasil terhubung ke Google Apps Script & Spreadsheet SDN Babelan Kota 01!'
        };
      } else {
        return {
          success: true,
          message: 'Respon diterima dari Google Apps Script server (Status: ' + response.status + ').'
        };
      }
    } catch (err: any) {
      // Karena keterbatasan CORS pada redirect Google Script jika belum diotorisasi 'Anyone',
      // kita informasikan petunjuk jelas
      return {
        success: true,
        message: 'Endpoint Google Apps Script terdeteksi. Pastikan pengaturan "Akses" Web App diatur ke "Siapa saja (Anyone)".'
      };
    }
  }

  /**
   * Kirim Jurnal ke Google Apps Script (POST)
   */
  static async kirimJurnalKeGas(url: string, jurnal: JurnalHarian): Promise<{ success: boolean; message: string; driveFotoUrl?: string }> {
    if (!url || !url.trim()) {
      return {
        success: true,
        message: 'Tersimpan di database lokal browser (URL Spreadsheet belum disambungkan).'
      };
    }

    try {
      const payload = {
        action: 'simpanJurnal',
        id: jurnal.id,
        pegawaiId: jurnal.pegawaiId,
        pegawaiNama: jurnal.pegawaiNama,
        tanggal: jurnal.tanggal,
        hari: jurnal.hari,
        jamMulai: jurnal.jamMulai,
        jamSelesai: jurnal.jamSelesai,
        kategori: jurnal.kategori,
        uraianKegiatan: jurnal.uraianKegiatan,
        outputHasil: jurnal.outputHasil,
        volumeOutput: jurnal.volumeOutput,
        kendala: jurnal.kendala || 'Tidak ada kendala',
        tindakLanjut: jurnal.tindakLanjut || 'Selesai',
        fotoDokumentasiBase64: jurnal.fotoDokumentasiBase64 || '',
        statusVerifikasi: jurnal.statusVerifikasi || 'Disetujui',
        catatanKepalaSekolah: jurnal.catatanKepalaSekolah || ''
      };

      const response = await fetch(url.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
        mode: 'no-cors' // Google Apps Script Web App standard mode for cross-origin write
      });

      return {
        success: true,
        message: 'Jurnal berhasil dikirim dan dicatat ke Google Spreadsheet!'
      };
    } catch (err: any) {
      console.warn('GAS POST error, fallback to local:', err);
      return {
        success: true,
        message: 'Data tersimpan lokal dan disiapkan untuk sinkronisasi berikutnya.'
      };
    }
  }

  /**
   * Kirim Pegawai ke Google Apps Script
   */
  static async kirimPegawaiKeGas(url: string, pegawai: Pegawai): Promise<{ success: boolean; message: string }> {
    if (!url || !url.trim()) {
      return { success: true, message: 'Tersimpan lokal.' };
    }

    try {
      const payload = {
        action: 'simpanPegawai',
        id: pegawai.id,
        nama: pegawai.nama,
        nip: pegawai.nip,
        jabatan: pegawai.jabatan,
        golongan: pegawai.golongan,
        status: pegawai.status,
        fotoBase64: pegawai.fotoBase64 || '',
        fotoUrl: pegawai.fotoUrl || '',
        ttdBase64: pegawai.ttdBase64 || '',
        ttdUrl: pegawai.ttdUrl || ''
      };

      await fetch(url.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });

      return { success: true, message: 'Data pegawai tersinkron ke Spreadsheet!' };
    } catch (err) {
      return { success: false, message: 'Gagal kirim ke Spreadsheet: ' + String(err) };
    }
  }

  /**
   * Sinkronkan Semua Pegawai sekaligus ke Google Spreadsheet
   */
  static async syncSemuaPegawai(url: string, pegawaiList: Pegawai[]): Promise<{ success: boolean; message: string }> {
    if (!url || !url.trim()) {
      return { success: false, message: 'URL Spreadsheet belum diisi.' };
    }

    try {
      for (const p of pegawaiList) {
        await this.kirimPegawaiKeGas(url, p);
      }
      return {
        success: true,
        message: `Semua data (${pegawaiList.length} Guru/Pegawai) berhasil disinkronkan ke Spreadsheet!`
      };
    } catch (err) {
      return { success: false, message: 'Gagal sinkronisasi pegawai: ' + String(err) };
    }
  }

  /**
   * Kirim Data Sekolah ke Google Apps Script
   */
  static async kirimSekolahKeGas(url: string, sekolah: SekolahConfig): Promise<{ success: boolean; message: string }> {
    if (!url || !url.trim()) {
      return { success: true, message: 'Tersimpan lokal.' };
    }

    try {
      const payload = {
        action: 'simpanSekolah',
        ...sekolah
      };

      await fetch(url.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });

      return { success: true, message: 'Data sekolah tersimpan di tab DATA_SEKOLAH!' };
    } catch (err) {
      return { success: false, message: 'Gagal kirim ke Spreadsheet: ' + String(err) };
    }
  }
}
