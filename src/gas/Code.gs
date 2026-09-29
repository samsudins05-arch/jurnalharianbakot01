/**
 * =========================================================================
 * JURNAL HARIAN SIKAWAN - SD NEGERI BABELAN KOTA 01 TAHUN 2026
 * Backend Script (Code.gs) - Google Apps Script
 * =========================================================================
 * Lembaga   : SD Negeri Babelan Kota 01 - Dinas Pendidikan Kab. Bekasi
 * Platform  : Google Spreadsheet & Google Drive
 * Fitur     : Web App SPA Lengkap, Simpan Jurnal, Sinkronisasi Spreadsheet,
 *             Simpan Foto Bukti Dukung ke Drive, Cetak Dokumen F4 Resmi
 * =========================================================================
 */

// Konfigurasi Folder Google Drive
const ROOT_FOLDER_NAME = "SIKAWAN_SDN_BABELAN_KOTA_01_2026";

// Nama Sheet di Google Spreadsheet
const SHEET_PEGAWAI = "DATA_PEGAWAI";
const SHEET_JURNAL  = "JURNAL_HARIAN";
const SHEET_SEKOLAH = "DATA_SEKOLAH";

/**
 * Endpoint Utama Web App (doGet)
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "";
  const callback = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;

  try {
    if (action === "getInitialData") {
      const data = getInitialData();
      return createJsonResponse({ status: "success", data: data }, callback);
    } else if (action === "getPegawai") {
      return createJsonResponse({ status: "success", data: getPegawaiList() }, callback);
    } else if (action === "getJurnal") {
      const pegawaiId = (e.parameter && e.parameter.pegawaiId) ? e.parameter.pegawaiId : "";
      return createJsonResponse({ status: "success", data: getJurnalList(pegawaiId) }, callback);
    } else if (action === "getSekolah") {
      return createJsonResponse({ status: "success", data: getSekolahData() }, callback);
    } else if (action === "init") {
      initSpreadsheet();
      return createJsonResponse({
        status: "success",
        message: "Spreadsheet & Folder Google Drive SDN Babelan Kota 01 Berhasil Diinisialisasi!"
      }, callback);
    }

    // Default: Render Antarmuka Web App SIKAWAN Lengkap
    return HtmlService.createTemplateFromFile("Index")
      .evaluate()
      .setTitle("SIKAWAN 2026 - SDN Babelan Kota 01")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag("viewport", "width=device-width, initial-scale=1, maximum-scale=1");
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() }, callback);
  }
}

/**
 * Endpoint API Pengiriman Data (doPost)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;

    if (action === "simpanJurnal") {
      return createJsonResponse(saveJurnal(payload));
    } else if (action === "simpanPegawai") {
      return createJsonResponse(savePegawai(payload));
    } else if (action === "hapusPegawai") {
      return createJsonResponse(deletePegawai(payload.id));
    } else if (action === "hapusJurnal") {
      return createJsonResponse(deleteJurnal(payload.id));
    } else if (action === "simpanSekolah") {
      return createJsonResponse(saveSekolah(payload));
    } else if (action === "initSpreadsheet") {
      initSpreadsheet();
      return createJsonResponse({ status: "success", message: "Struktur Spreadsheet berhasil disiapkan!" });
    }

    return createJsonResponse({ status: "error", message: "Action tidak dikenal: " + action });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * Mengambil semua data awal aplikasi sekaligus (Pegawai, Jurnal, Profil Sekolah)
 */
function getInitialData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sPegawai = ss.getSheetByName(SHEET_PEGAWAI);
  if (!sPegawai) {
    initSpreadsheet();
  }

  return {
    pegawaiList: getPegawaiList(),
    jurnalList: getJurnalList(),
    sekolah: getSekolahData(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Folder Management di Google Drive
 */
function getOrCreateFolder(folderName, parentFolder) {
  const parent = parentFolder || DriveApp.getRootFolder();
  const folders = parent.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  const created = parent.createFolder(folderName);
  created.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return created;
}

function getAppFolders() {
  const root = getOrCreateFolder(ROOT_FOLDER_NAME);
  return {
    root: root,
    fotoPegawai: getOrCreateFolder("FOTO_PEGAWAI", root),
    ttdPegawai: getOrCreateFolder("TTD_PEGAWAI", root),
    dokumentasi: getOrCreateFolder("DOKUMENTASI_KEGIATAN", root),
    sekolah: getOrCreateFolder("BERKAS_SEKOLAH", root)
  };
}

function saveBase64ToDrive(base64Data, filename, folder) {
  try {
    if (!base64Data || base64Data.indexOf("data:") === -1) return "";
    const parts = base64Data.split(",");
    const contentType = parts[0].split(";")[0].replace("data:", "");
    const decodedBytes = Utilities.base64Decode(parts[1]);
    const blob = Utilities.newBlob(decodedBytes, contentType, filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    Logger.log("Error saveBase64ToDrive: " + e.toString());
    return "";
  }
}

/**
 * Simpan Data Jurnal Harian ke Spreadsheet & Foto ke Drive
 */
function saveJurnal(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_JURNAL);
  if (!sheet) {
    initSpreadsheet();
    sheet = ss.getSheetByName(SHEET_JURNAL);
  }

  const folders = getAppFolders();
  const timestamp = new Date().getTime();
  const jurnalId = data.id || ("JRN-" + timestamp);

  let fotoUrl = data.fotoDokumentasi || "";
  if (data.fotoDokumentasiBase64 && data.fotoDokumentasiBase64.indexOf("data:") === 0) {
    fotoUrl = saveBase64ToDrive(
      data.fotoDokumentasiBase64,
      "DOK_" + (data.pegawaiNama || "GURU").replace(/\s+/g, "_") + "_" + timestamp + ".jpg",
      folders.dokumentasi
    );
  }

  let listKegiatanJson = "";
  if (data.kegiatanList && Array.isArray(data.kegiatanList)) {
    const processedKegiatan = data.kegiatanList.map(function(k, idx) {
      let subFotoUrl = k.buktiDukung || "";
      if (k.fotoBase64 && k.fotoBase64.indexOf("data:") === 0) {
        subFotoUrl = saveBase64ToDrive(
          k.fotoBase64,
          "SUBDOK_" + jurnalId + "_" + idx + ".jpg",
          folders.dokumentasi
        );
      }
      return {
        id: k.id || ("keg-" + idx),
        jamMulai: (k.jamMulaiJam || "07") + ":" + (k.jamMulaiMenit || "00"),
        jamSelesai: (k.jamSelesaiJam || "14") + ":" + (k.jamSelesaiMenit || "00"),
        uraian: k.uraian || "",
        buktiDukung: subFotoUrl,
        keterangan: k.keterangan || ""
      };
    });
    listKegiatanJson = JSON.stringify(processedKegiatan);
  }

  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == jurnalId) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    jurnalId,
    data.pegawaiId || "",
    data.pegawaiNama || "",
    data.tanggal || "",
    data.hari || "",
    data.jamMulai || "07:00",
    data.jamSelesai || "14:30",
    data.kategori || "Pelaksanaan Pembelajaran (KBM)",
    data.uraianKegiatan || "",
    data.outputHasil || "",
    data.volumeOutput || "1 Kegiatan",
    data.kendala || "Tidak ada kendala",
    data.tindakLanjut || "Selesai",
    fotoUrl,
    data.statusVerifikasi || "Disetujui",
    data.catatanKepalaSekolah || "",
    listKegiatanJson,
    new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return {
    status: "success",
    message: "Jurnal Harian berhasil disimpan ke Google Sheets & Berkas tersimpan di Google Drive!",
    jurnalId: jurnalId,
    fotoUrl: fotoUrl
  };
}

/**
 * Hapus Data Jurnal
 */
function deleteJurnal(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_JURNAL);
  if (!sheet) return { status: "error", message: "Sheet tidak ditemukan" };

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { status: "success", message: "Jurnal berhasil dihapus dari Spreadsheet." };
    }
  }
  return { status: "error", message: "Jurnal tidak ditemukan" };
}

/**
 * Simpan Data Pegawai
 */
function savePegawai(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_PEGAWAI);
  if (!sheet) {
    initSpreadsheet();
    sheet = ss.getSheetByName(SHEET_PEGAWAI);
  }

  const folders = getAppFolders();
  const timestamp = new Date().getTime();
  const pegId = data.id || ("PEG-" + timestamp);

  let fotoUrl = data.fotoUrl || "";
  if (data.fotoBase64 && data.fotoBase64.indexOf("data:") === 0) {
    fotoUrl = saveBase64ToDrive(data.fotoBase64, "FOTO_" + pegId + ".jpg", folders.fotoPegawai);
  }

  let ttdUrl = data.ttdUrl || "";
  if (data.ttdBase64 && data.ttdBase64.indexOf("data:") === 0) {
    ttdUrl = saveBase64ToDrive(data.ttdBase64, "TTD_" + pegId + ".png", folders.ttdPegawai);
  }

  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][8] == pegId || values[i][1] == data.nip) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    data.no || values.length,
    data.nip || "-",
    data.nama || "",
    data.jabatan || "Guru Kelas",
    data.golongan || "-",
    data.status || "PNS",
    fotoUrl,
    ttdUrl,
    pegId,
    new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return {
    status: "success",
    message: "Data pegawai berhasil disimpan ke Spreadsheet!",
    pegawai: {
      ...data,
      id: pegId,
      fotoUrl: fotoUrl,
      ttdUrl: ttdUrl
    }
  };
}

/**
 * Hapus Data Pegawai
 */
function deletePegawai(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PEGAWAI);
  if (!sheet) return { status: "error", message: "Sheet tidak ditemukan" };

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][8] == id || values[i][1] == id) {
      sheet.deleteRow(i + 1);
      return { status: "success", message: "Data pegawai berhasil dihapus." };
    }
  }
  return { status: "error", message: "Pegawai tidak ditemukan." };
}

/**
 * Simpan Data Profil & Pejabat Penilai Sekolah
 */
function saveSekolah(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SEKOLAH);
  if (!sheet) {
    initSpreadsheet();
    sheet = ss.getSheetByName(SHEET_SEKOLAH);
  }

  const folders = getAppFolders();
  const timestamp = new Date().getTime();

  let ttdKepsekUrl = data.kepalaSekolahTtd || "";
  const rawTtd = data.kepalaSekolahTtdBase64 || data.ttdKepsekBase64;
  if (rawTtd && rawTtd.indexOf("data:") === 0) {
    ttdKepsekUrl = saveBase64ToDrive(rawTtd, "TTD_KEPSEK_" + timestamp + ".png", folders.sekolah);
  }

  let stempelUrl = data.stempelSekolahUrl || "";
  if (data.stempelSekolahBase64 && data.stempelSekolahBase64.indexOf("data:") === 0) {
    stempelUrl = saveBase64ToDrive(data.stempelSekolahBase64, "STEMPEL_" + timestamp + ".png", folders.sekolah);
  }

  let kopUrl = data.kopSekolahUrl || "";
  if (data.kopSekolahBase64 && data.kopSekolahBase64.indexOf("data:") === 0) {
    kopUrl = saveBase64ToDrive(data.kopSekolahBase64, "KOP_" + timestamp + ".png", folders.sekolah);
  }

  sheet.clearContents();
  const headers = ["PARAMETER", "NILAI_DATA"];
  sheet.getRange(1, 1, 1, 2).setValues([headers]);
  formatHeaderRange(sheet.getRange(1, 1, 1, 2));

  const rows = [
    ["NAMA_SEKOLAH", data.namaSekolah || "SD NEGERI BABELAN KOTA 01"],
    ["NPSN", data.npsn || "20218386"],
    ["ALAMAT", data.alamat || "Jl. Raya Babelan No. 01, Kel. Babelan Kota, Kec. Babelan, Kab. Bekasi"],
    ["KECAMATAN", data.kecamatan || "Babelan"],
    ["KABUPATEN", data.kabupaten || "Kabupaten Bekasi"],
    ["PROVINSI", data.provinsi || "Jawa Barat"],
    ["TAHUN_JURNAL", data.tahunJurnal || 2026],
    ["NAMA_KEPALA_SEKOLAH", data.kepalaSekolahNama || "Hj. Siti Rohmah, M.Pd."],
    ["NIP_KEPALA_SEKOLAH", data.kepalaSekolahNIP || "19720514 199603 2 002"],
    ["GOLONGAN_KEPALA_SEKOLAH", data.kepalaSekolahGolongan || "Pembina Tk. I (IV/b)"],
    ["LINK_TTD_KEPSEK", ttdKepsekUrl],
    ["LINK_STEMPEL_SEKOLAH", stempelUrl],
    ["LINK_KOP_SEKOLAH", kopUrl],
    ["TIMESTAMP_UPDATE", new Date().toISOString()]
  ];

  sheet.getRange(2, 1, rows.length, 2).setValues(rows);

  return {
    status: "success",
    message: "Profil Pejabat Penilai Sekolah berhasil diperbarui di Spreadsheet!",
    sekolah: {
      ...data,
      kepalaSekolahTtd: ttdKepsekUrl,
      stempelSekolahUrl: stempelUrl,
      kopSekolahUrl: kopUrl
    }
  };
}

/**
 * Pembacaan Data
 */
function getPegawaiList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PEGAWAI);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const list = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[1] && !row[2]) continue;
    list.push({
      no: row[0],
      nip: row[1] || "-",
      nama: row[2] || "",
      jabatan: row[3] || "Guru Kelas",
      golongan: row[4] || "-",
      status: row[5] || "PNS",
      fotoUrl: row[6] || "",
      ttdUrl: row[7] || "",
      id: row[8] || ("peg-" + i),
      unitKerja: "SD Negeri Babelan Kota 01"
    });
  }
  return list;
}

function getJurnalList(pegawaiId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_JURNAL);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const list = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;
    if (pegawaiId && row[1] !== pegawaiId) continue;

    let tgl = row[3];
    if (tgl instanceof Date) {
      tgl = Utilities.formatDate(tgl, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }

    let parsedKegiatan = [];
    if (row[16]) {
      try {
        parsedKegiatan = JSON.parse(row[16]);
      } catch (e) {}
    }

    list.push({
      id: String(row[0]),
      pegawaiId: String(row[1]),
      pegawaiNama: String(row[2]),
      tanggal: String(tgl),
      hari: String(row[4] || ""),
      jamMulai: String(row[5] || "07:00"),
      jamSelesai: String(row[6] || "14:30"),
      kategori: String(row[7] || "Pelaksanaan Pembelajaran (KBM)"),
      uraianKegiatan: String(row[8] || ""),
      outputHasil: String(row[9] || ""),
      volumeOutput: String(row[10] || "1"),
      kendala: String(row[11] || "Tidak ada kendala"),
      tindakLanjut: String(row[12] || "Selesai"),
      fotoDokumentasi: String(row[13] || ""),
      statusVerifikasi: String(row[14] || "Disetujui"),
      catatanKepalaSekolah: String(row[15] || ""),
      kegiatanList: parsedKegiatan
    });
  }
  return list;
}

function getSekolahData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SEKOLAH);
  const defaults = {
    namaSekolah: "SD NEGERI BABELAN KOTA 01",
    npsn: "20218386",
    alamat: "Jl. Raya Babelan No. 01, Kel. Babelan Kota, Kec. Babelan, Kab. Bekasi",
    kecamatan: "Babelan",
    kabupaten: "Kabupaten Bekasi",
    provinsi: "Jawa Barat",
    tahunJurnal: 2026,
    kepalaSekolahNama: "Hj. Siti Rohmah, M.Pd.",
    kepalaSekolahNIP: "19720514 199603 2 002",
    kepalaSekolahGolongan: "Pembina Tk. I (IV/b)"
  };

  if (!sheet) return defaults;

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return defaults;

  const map = {};
  for (let i = 1; i < values.length; i++) {
    map[values[i][0]] = values[i][1];
  }

  return {
    namaSekolah: map["NAMA_SEKOLAH"] || defaults.namaSekolah,
    npsn: map["NPSN"] || defaults.npsn,
    alamat: map["ALAMAT"] || defaults.alamat,
    kecamatan: map["KECAMATAN"] || defaults.kecamatan,
    kabupaten: map["KABUPATEN"] || defaults.kabupaten,
    provinsi: map["PROVINSI"] || defaults.provinsi,
    tahunJurnal: Number(map["TAHUN_JURNAL"]) || 2026,
    kepalaSekolahNama: map["NAMA_KEPALA_SEKOLAH"] || defaults.kepalaSekolahNama,
    kepalaSekolahNIP: map["NIP_KEPALA_SEKOLAH"] || defaults.kepalaSekolahNIP,
    kepalaSekolahGolongan: map["GOLONGAN_KEPALA_SEKOLAH"] || defaults.kepalaSekolahGolongan,
    kepalaSekolahTtd: map["LINK_TTD_KEPSEK"] || "",
    stempelSekolahUrl: map["LINK_STEMPEL_SEKOLAH"] || "",
    kopSekolahUrl: map["LINK_KOP_SEKOLAH"] || ""
  };
}

/**
 * Format Header Kolom Spreadsheet
 */
function formatHeaderRange(range) {
  range.setBackground("#1e3a8a");
  range.setFontColor("#ffffff");
  range.setFontWeight("bold");
  range.setHorizontalAlignment("center");
  range.setVerticalAlignment("middle");
}

/**
 * Inisialisasi Sheet & Struktur Database
 */
function initSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. DATA_PEGAWAI
  let sPegawai = ss.getSheetByName(SHEET_PEGAWAI);
  if (!sPegawai) sPegawai = ss.insertSheet(SHEET_PEGAWAI);
  const hPeg = ["NO", "NIP_PEGAWAI", "NAMA_PEGAWAI", "JABATAN", "PANGKAT_GOLONGAN", "STATUS", "LINK_FOTO_DRIVE", "LINK_TTD_DRIVE", "ID_PEGAWAI", "TIMESTAMP_UPDATE"];
  sPegawai.getRange(1, 1, 1, hPeg.length).setValues([hPeg]);
  formatHeaderRange(sPegawai.getRange(1, 1, 1, hPeg.length));
  sPegawai.setFrozenRows(1);

  // Data Awal Pegawai jika kosong
  if (sPegawai.getLastRow() === 1) {
    const defaultPegawai = [
      [1, "196805121991031005", "Dr. H. Samsudin, M.Pd.", "Guru Kelas VI / Pembina", "Pembina Utama Muda (IV/c)", "PNS", "", "", "peg-1", new Date().toISOString()],
      [2, "197205141996032002", "Hj. Siti Rohmah, M.Pd.", "Kepala Sekolah", "Pembina Tk. I (IV/b)", "PNS", "", "", "peg-2", new Date().toISOString()],
      [3, "198304152009021003", "Ahmad Fauzi, S.Pd.", "Guru Pendidikan Jasmani & Olahraga", "Penata Tk. I (III/d)", "PNS", "", "", "peg-3", new Date().toISOString()],
      [4, "198811202022212015", "Nurul Hidayati, S.Pd.", "Guru Kelas I", "Ahli Pertama (IX)", "PPPK", "", "", "peg-4", new Date().toISOString()],
      [5, "-", "Rian Kurniawan, S.Kom.", "Operator Sekolah & Tata Usaha", "-", "Tenaga Kependidikan", "", "", "peg-5", new Date().toISOString()]
    ];
    sPegawai.getRange(2, 1, defaultPegawai.length, hPeg.length).setValues(defaultPegawai);
  }

  // 2. JURNAL_HARIAN
  let sJurnal = ss.getSheetByName(SHEET_JURNAL);
  if (!sJurnal) sJurnal = ss.insertSheet(SHEET_JURNAL);
  const hJurnal = [
    "ID_JURNAL", "ID_PEGAWAI", "NAMA_PEGAWAI", "TANGGAL", "HARI",
    "JAM_MULAI", "JAM_SELESAI", "KATEGORI_KEGIATAN", "URAIAN_KEGIATAN",
    "OUTPUT_HASIL", "VOLUME_OUTPUT", "KENDALA", "TINDAK_LANJUT",
    "LINK_FOTO_DOKUMENTASI", "STATUS_VERIFIKASI", "CATATAN_KEPSEK", "RINCIAN_KEGIATAN_JSON", "TIMESTAMP_INPUT"
  ];
  sJurnal.getRange(1, 1, 1, hJurnal.length).setValues([hJurnal]);
  formatHeaderRange(sJurnal.getRange(1, 1, 1, hJurnal.length));
  sJurnal.setFrozenRows(1);

  // 3. DATA_SEKOLAH
  let sSekolah = ss.getSheetByName(SHEET_SEKOLAH);
  if (!sSekolah) sSekolah = ss.insertSheet(SHEET_SEKOLAH);
  const hSek = ["PARAMETER", "NILAI_DATA"];
  sSekolah.getRange(1, 1, 1, 2).setValues([hSek]);
  formatHeaderRange(sSekolah.getRange(1, 1, 1, 2));

  const sekolahData = [
    ["NAMA_SEKOLAH", "SD NEGERI BABELAN KOTA 01"],
    ["NPSN", "20218386"],
    ["ALAMAT", "Jl. Raya Babelan No. 01, Kel. Babelan Kota, Kec. Babelan, Kab. Bekasi"],
    ["KECAMATAN", "Babelan"],
    ["KABUPATEN", "Kabupaten Bekasi"],
    ["PROVINSI", "Jawa Barat"],
    ["TAHUN_JURNAL", "2026"],
    ["NAMA_KEPALA_SEKOLAH", "Hj. Siti Rohmah, M.Pd."],
    ["NIP_KEPALA_SEKOLAH", "19720514 199603 2 002"],
    ["GOLONGAN_KEPALA_SEKOLAH", "Pembina Tk. I (IV/b)"]
  ];
  sSekolah.getRange(2, 1, sekolahData.length, 2).setValues(sekolahData);

  getAppFolders();
}

/**
 * Response Utility
 */
function createJsonResponse(data, callback) {
  let str = JSON.stringify(data);
  let mimeType = ContentService.MimeType.JSON;

  if (callback) {
    str = callback + "(" + str + ");";
    mimeType = ContentService.MimeType.JAVASCRIPT;
  }

  return ContentService.createTextOutput(str).setMimeType(mimeType);
}
