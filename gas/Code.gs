/**
 * =========================================================================
 * JURNAL HARIAN SIKAWAN - SD NEGERI BABELAN KOTA 01 TAHUN 2026
 * Backend Script (Code.gs) - Google Apps Script
 * =========================================================================
 * Penulis / Instansi : SD Negeri Babelan Kota 01 - Kab. Bekasi
 * Platform           : Google Spreadsheet & Google Drive
 * Fungsi             :
 * 1. Penyimpanan Data Pegawai & Jurnal Harian ke Google Spreadsheet
 * 2. Penyimpanan Foto Pegawai, TTD Pegawai, & Foto Dokumentasi ke Google Drive
 * 3. Rest API & Web App Endpoint (doGet & doPost) dengan dukungan CORS
 * =========================================================================
 */

// Nama Folder Utama di Google Drive
const ROOT_FOLDER_NAME = "SIKAWAN_SDN_BABELAN_KOTA_01_2026";

// Nama Tab / Sheet di Spreadsheet
const SHEET_PEGAWAI = "DATA_PEGAWAI";
const SHEET_JURNAL  = "JURNAL_HARIAN";
const SHEET_SEKOLAH = "DATA_SEKOLAH";

/**
 * 1. Web App Entrypoint (GET)
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "";
  const callback = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;

  let responseData = null;

  try {
    if (action === "getPegawai") {
      responseData = { status: "success", data: getPegawaiList() };
    } else if (action === "getJurnal") {
      const pegawaiId = (e && e.parameter && e.parameter.pegawaiId) ? e.parameter.pegawaiId : "";
      responseData = { status: "success", data: getJurnalList(pegawaiId) };
    } else if (action === "getSekolah") {
      responseData = { status: "success", data: getSekolahData() };
    } else if (action === "init") {
      initSpreadsheet();
      responseData = {
        status: "success",
        message: "Inisialisasi Spreadsheet & Folder Drive SDN Babelan Kota 01 Berhasil!"
      };
    } else {
      // Jika diakses langsung via browser tanpa action, tampilkan UI Index.html
      return HtmlService.createTemplateFromFile("Index")
        .evaluate()
        .setTitle("JURNAL HARIAN SIKAWAN - SDN BABELAN KOTA 01")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag("viewport", "width=device-width, initial-scale=1");
    }
  } catch (err) {
    responseData = { status: "error", message: err.toString() };
  }

  return createJsonResponse(responseData, callback);
}

/**
 * 2. Web App Entrypoint (POST)
 */
function doPost(e) {
  let responseData = null;

  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      data = {};
    }

    const action = data.action;

    if (action === "simpanPegawai") {
      responseData = simpanPegawai(data);
    } else if (action === "simpanJurnal") {
      responseData = simpanJurnal(data);
    } else if (action === "simpanSekolah") {
      responseData = simpanSekolahData(data);
    } else if (action === "initSpreadsheet") {
      initSpreadsheet();
      responseData = { status: "success", message: "Struktur Spreadsheet Berhasil Disiapkan!" };
    } else {
      responseData = { status: "error", message: "Action tidak dikenal: " + action };
    }
  } catch (error) {
    responseData = { status: "error", message: error.toString() };
  }

  return createJsonResponse(responseData);
}

/**
 * 3. Helper Membuat & Mengambil Folder Google Drive
 */
function getOrCreateFolder(folderName, parentFolder) {
  const parent = parentFolder || DriveApp.getRootFolder();
  const folders = parent.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(folderName);
}

function getAppFolders() {
  const root = getOrCreateFolder(ROOT_FOLDER_NAME);
  const fotoFolder = getOrCreateFolder("FOTO_PEGAWAI", root);
  const ttdFolder = getOrCreateFolder("TTD_PEGAWAI", root);
  const dokFolder = getOrCreateFolder("DOKUMENTASI_KEGIATAN", root);

  try {
    fotoFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    ttdFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    dokFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch(err) {
    Logger.log("Info sharing folder: " + err);
  }

  return { root: root, fotoFolder: fotoFolder, ttdFolder: ttdFolder, dokFolder: dokFolder };
}

/**
 * 4. Helper Simpan Base64 Image ke Google Drive
 */
function saveBase64ToDrive(base64Data, fileName, folder) {
  if (!base64Data) return "";
  if (base64Data.indexOf("http") === 0) {
    return base64Data; // URL yang sudah ada
  }
  if (!base64Data.includes("base64,")) {
    return "";
  }

  try {
    const parts = base64Data.split("base64,");
    const contentType = parts[0].split(":")[1].split(";")[0] || "image/jpeg";
    const decodedData = Utilities.base64Decode(parts[1]);
    const blob = Utilities.newBlob(decodedData, contentType, fileName);

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return "https://lh3.googleusercontent.com/d/" + file.getId();
  } catch(e) {
    Logger.log("Gagal simpan gambar: " + e);
    return "";
  }
}

/**
 * 5. Simpan / Perbarui Data Pegawai
 */
function simpanPegawai(pegawai) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_PEGAWAI);
  if (!sheet) {
    initSpreadsheet();
    sheet = ss.getSheetByName(SHEET_PEGAWAI);
  }

  const folders = getAppFolders();
  const safeName = (pegawai.nama || "Pegawai").replace(/[^a-zA-Z0-9]/g, "_");
  const timestamp = new Date().getTime();

  let fotoUrl = pegawai.fotoUrl || "";
  if (pegawai.fotoBase64) {
    fotoUrl = saveBase64ToDrive(pegawai.fotoBase64, "FOTO_" + safeName + "_" + timestamp + ".jpg", folders.fotoFolder);
  }

  let ttdUrl = pegawai.ttdUrl || "";
  if (pegawai.ttdBase64) {
    ttdUrl = saveBase64ToDrive(pegawai.ttdBase64, "TTD_" + safeName + "_" + timestamp + ".png", folders.ttdFolder);
  }

  const pegawaiId = pegawai.id || ("PEG-" + timestamp);
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][8] == pegawaiId || (data[i][1] && data[i][1] == pegawai.nip && pegawai.nip !== "-")) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowValues = [
    data.length, // No urut
    pegawai.nip || "-",
    pegawai.nama || "",
    pegawai.jabatan || "",
    pegawai.golongan || "-",
    pegawai.status || "PNS",
    fotoUrl,
    ttdUrl,
    pegawaiId,
    new Date()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return {
    status: "success",
    message: "Data pegawai " + pegawai.nama + " berhasil disimpan ke Spreadsheet & Google Drive!",
    pegawai: {
      id: pegawaiId,
      nama: pegawai.nama,
      nip: pegawai.nip,
      jabatan: pegawai.jabatan,
      golongan: pegawai.golongan,
      status: pegawai.status,
      fotoUrl: fotoUrl,
      ttdUrl: ttdUrl
    }
  };
}

/**
 * 6. Simpan Jurnal Harian
 */
function simpanJurnal(jurnal) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_JURNAL);
  if (!sheet) {
    initSpreadsheet();
    sheet = ss.getSheetByName(SHEET_JURNAL);
  }

  const folders = getAppFolders();
  const timestamp = new Date().getTime();
  const safeDate = (jurnal.tanggal || "2026-00-00");

  let fotoDokUrl = jurnal.fotoDokumentasi || "";
  if (jurnal.fotoDokumentasiBase64 && jurnal.fotoDokumentasiBase64.indexOf("data:") === 0) {
    fotoDokUrl = saveBase64ToDrive(jurnal.fotoDokumentasiBase64, "DOK_" + safeDate + "_" + timestamp + ".jpg", folders.dokFolder);
  }

  const jurnalId = jurnal.id || ("JUR-" + timestamp);

  const rowValues = [
    jurnalId,
    jurnal.pegawaiId || "",
    jurnal.pegawaiNama || "",
    jurnal.tanggal || "",
    jurnal.hari || "",
    jurnal.jamMulai || "07:00",
    jurnal.jamSelesai || "14:30",
    jurnal.kategori || "Pelaksanaan Pembelajaran (KBM)",
    jurnal.uraianKegiatan || "",
    jurnal.outputHasil || "",
    jurnal.volumeOutput || "1 Dokumen",
    jurnal.kendala || "Tidak ada kendala",
    jurnal.tindakLanjut || "Selesai",
    fotoDokUrl,
    jurnal.statusVerifikasi || "Disetujui",
    jurnal.catatanKepalaSekolah || "",
    new Date()
  ];

  sheet.appendRow(rowValues);

  return {
    status: "success",
    message: "Jurnal Harian SIKAWAN tanggal " + jurnal.tanggal + " berhasil disimpan ke Spreadsheet!",
    jurnalId: jurnalId,
    fotoDokumentasi: fotoDokUrl
  };
}

/**
 * 7. Simpan Data Sekolah
 */
function simpanSekolahData(sekolah) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SEKOLAH);
  if (!sheet) {
    initSpreadsheet();
    sheet = ss.getSheetByName(SHEET_SEKOLAH);
  }

  const folders = getAppFolders();
  const timestamp = new Date().getTime();

  let fotoKepsekUrl = sekolah.kepalaSekolahFoto || "";
  if (sekolah.fotoKepsekBase64 && sekolah.fotoKepsekBase64.indexOf("data:") === 0) {
    fotoKepsekUrl = saveBase64ToDrive(sekolah.fotoKepsekBase64, "FOTO_KEPSEK_" + timestamp + ".jpg", folders.fotoFolder);
  }

  let ttdKepsekUrl = sekolah.kepalaSekolahTtd || "";
  if (sekolah.ttdKepsekBase64 && sekolah.ttdKepsekBase64.indexOf("data:") === 0) {
    ttdKepsekUrl = saveBase64ToDrive(sekolah.ttdKepsekBase64, "TTD_KEPSEK_" + timestamp + ".png", folders.ttdFolder);
  }

  sheet.clearContents();
  const headers = ["PARAMETER", "NILAI_DATA"];
  sheet.getRange(1, 1, 1, 2).setValues([headers]);
  formatHeaderRange(sheet.getRange(1, 1, 1, 2));

  const rows = [
    ["NAMA_SEKOLAH", sekolah.namaSekolah || "SD NEGERI BABELAN KOTA 01"],
    ["NPSN", sekolah.npsn || "20218386"],
    ["ALAMAT", sekolah.alamat || "Jl. Raya Babelan No. 01, Kec. Babelan, Kab. Bekasi 17610"],
    ["KABUPATEN", sekolah.kabupaten || "Kabupaten Bekasi"],
    ["PROVINSI", sekolah.provinsi || "Jawa Barat"],
    ["TAHUN_JURNAL", String(sekolah.tahunJurnal || 2026)],
    ["NAMA_KEPALA_SEKOLAH", sekolah.kepalaSekolahNama || "Hj. Siti Rohmah, M.Pd."],
    ["NIP_KEPALA_SEKOLAH", sekolah.kepalaSekolahNIP || "19720514 199603 2 002"],
    ["GOLONGAN_KEPALA_SEKOLAH", sekolah.kepalaSekolahGolongan || "Pembina Tk. I (IV/b)"],
    ["LINK_FOTO_KEPSEK", fotoKepsekUrl],
    ["LINK_TTD_KEPSEK", ttdKepsekUrl],
    ["TIMESTAMP_UPDATE", new Date().toISOString()]
  ];

  sheet.getRange(2, 1, rows.length, 2).setValues(rows);

  return {
    status: "success",
    message: "Data Sekolah berhasil disimpan ke Spreadsheet tab DATA_SEKOLAH!",
    sekolah: {
      ...sekolah,
      kepalaSekolahFoto: fotoKepsekUrl,
      kepalaSekolahTtd: ttdKepsekUrl
    }
  };
}

/**
 * 8. Ambil Data Sekolah
 */
function getSekolahData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SEKOLAH);
  if (!sheet) return null;

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return null;

  const result = {};
  for (let i = 1; i < values.length; i++) {
    const key = values[i][0];
    const val = values[i][1];
    if (key) result[key] = val;
  }
  return result;
}

/**
 * 9. Ambil Daftar Pegawai
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
    if (!row[0] && !row[2]) continue;
    list.push({
      no: row[0],
      nip: row[1] || "-",
      nama: row[2] || "",
      jabatan: row[3] || "",
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

/**
 * 10. Ambil Daftar Jurnal
 */
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

    let tglStr = row[3];
    if (tglStr instanceof Date) {
      tglStr = Utilities.formatDate(tglStr, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }

    list.push({
      id: row[0],
      pegawaiId: row[1],
      pegawaiNama: row[2],
      tanggal: tglStr,
      hari: row[4],
      jamMulai: row[5],
      jamSelesai: row[6],
      kategori: row[7],
      uraianKegiatan: row[8],
      outputHasil: row[9],
      volumeOutput: row[10],
      kendala: row[11],
      tindakLanjut: row[12],
      fotoDokumentasi: row[13],
      statusVerifikasi: row[14],
      catatanKepalaSekolah: row[15]
    });
  }
  return list;
}

/**
 * 11. Inisialisasi Spreadsheet
 */
function initSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Tab 1: DATA_PEGAWAI
  let sPegawai = ss.getSheetByName(SHEET_PEGAWAI);
  if (!sPegawai) {
    sPegawai = ss.insertSheet(SHEET_PEGAWAI);
  }
  const headersPegawai = [
    "NO", "NIP_PEGAWAI", "NAMA_PEGAWAI", "JABATAN", "PANGKAT_GOLONGAN",
    "STATUS", "LINK_FOTO_DRIVE", "LINK_TTD_DRIVE", "ID_PEGAWAI", "TIMESTAMP_UPDATE"
  ];
  sPegawai.getRange(1, 1, 1, headersPegawai.length).setValues([headersPegawai]);
  formatHeaderRange(sPegawai.getRange(1, 1, 1, headersPegawai.length));

  // Tab 2: JURNAL_HARIAN
  let sJurnal = ss.getSheetByName(SHEET_JURNAL);
  if (!sJurnal) {
    sJurnal = ss.insertSheet(SHEET_JURNAL);
  }
  const headersJurnal = [
    "ID_JURNAL", "ID_PEGAWAI", "NAMA_PEGAWAI", "TANGGAL", "HARI",
    "JAM_MULAI", "JAM_SELESAI", "KATEGORI_KEGIATAN", "URAIAN_KEGIATAN",
    "OUTPUT_HASIL", "VOLUME_OUTPUT", "KENDALA", "TINDAK_LANJUT",
    "LINK_FOTO_DOKUMENTASI", "STATUS_VERIFIKASI", "CATATAN_KEPSEK", "TIMESTAMP_INPUT"
  ];
  sJurnal.getRange(1, 1, 1, headersJurnal.length).setValues([headersJurnal]);
  formatHeaderRange(sJurnal.getRange(1, 1, 1, headersJurnal.length));

  // Tab 3: DATA_SEKOLAH
  let sSekolah = ss.getSheetByName(SHEET_SEKOLAH);
  if (!sSekolah) {
    sSekolah = ss.insertSheet(SHEET_SEKOLAH);
  }
  const headersSekolah = ["PARAMETER", "NILAI_DATA"];
  sSekolah.getRange(1, 1, 1, 2).setValues([headersSekolah]);
  formatHeaderRange(sSekolah.getRange(1, 1, 1, 2));

  const sekolahData = [
    ["NAMA_SEKOLAH", "SD NEGERI BABELAN KOTA 01"],
    ["NPSN", "20218386"],
    ["ALAMAT", "Jl. Raya Babelan No. 01, Kel. Babelan Kota, Kec. Babelan, Kab. Bekasi"],
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

function formatHeaderRange(range) {
  range.setBackground("#1e3a8a");
  range.setFontColor("#ffffff");
  range.setFontWeight("bold");
  range.setHorizontalAlignment("center");
}

function createJsonResponse(obj, callback) {
  let outputText = JSON.stringify(obj);
  let mimeType = ContentService.MimeType.JSON;

  if (callback) {
    outputText = callback + "(" + outputText + ");";
    mimeType = ContentService.MimeType.JAVASCRIPT;
  }

  return ContentService.createTextOutput(outputText).setMimeType(mimeType);
}
