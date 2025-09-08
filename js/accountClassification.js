/**
 * Helper functions untuk klasifikasi akun di frontend
 * ✅ SOLUSI LENGKAP: Sinkron dengan backend accountHelper.js
 * Mengatasi semua kesalahan klasifikasi umum SAK EMKM
 */

/**
 * Menentukan tipe akun berdasarkan nama atau kode akun
 * ✅ SOLUSI LENGKAP: Mencegah semua kesalahan klasifikasi umum
 * @param {string} name - Nama akun
 * @param {string} code - Kode akun (opsional)
 * @returns {Object} - {type: string, normalBalance: string, category: string}
 */
function classifyAccount(name, code = '') {
  const accountName = (name || '').toUpperCase().trim();
  const accountCode = (code || '').toString().trim();
  
  // ✅ SOLUSI 1: Validasi input terlebih dahulu
  if (!accountName) {
    console.warn('⚠️ [CLASSIFICATION-FRONTEND] Account name is empty');
    return {
      type: 'LAIN',
      normalBalance: 'DEBIT',
      category: 'LAIN'
    };
  }
  
  console.log(`🔍 [CLASSIFICATION-FRONTEND] Classifying: "${accountName}" (Code: ${accountCode})`);
  
  // ✅ PRIORITAS TERTINGGI: Berdasarkan kode SAK EMKM (lebih akurat)
  if (accountCode) {
    const classification = classifyByCode(accountCode, accountName);
    if (classification.type !== 'LAIN') {
      console.log(`✅ [CLASSIFICATION-FRONTEND] Result by CODE: ${classification.type} (${classification.category})`);
      return classification;
    }
  }
  
  // ✅ SOLUSI 2: Cek BEBAN terlebih dahulu untuk mencegah salah klasifikasi
  // "Beban Listrik" harus jadi BEBAN, bukan ASET
  if (isExpenseAccount(accountName, accountCode)) {
    const result = {
      type: 'BEBAN',
      normalBalance: 'DEBIT',
      category: 'BEBAN'
    };
    console.log(`✅ [CLASSIFICATION-FRONTEND] Result by NAME (EXPENSE): ${result.type}`);
    return result;
  }
  
  // ✅ SOLUSI 3: Cek PENDAPATAN dengan validasi ketat
  // "Pendapatan Penjualan" harus jadi PENDAPATAN, bukan EKUITAS/MODAL
  if (isRevenueAccount(accountName, accountCode)) {
    const result = {
      type: 'PENDAPATAN',
      normalBalance: 'CREDIT',
      category: 'PENDAPATAN'
    };
    console.log(`✅ [CLASSIFICATION-FRONTEND] Result by NAME (REVENUE): ${result.type}`);
    return result;
  }
  
  // ✅ SOLUSI 4: ASET dengan pengecekan spesifik
  // "Perlengkapan" harus jadi ASET, bukan BEBAN
  if (isAssetAccount(accountName, accountCode)) {
    const result = {
      type: 'ASET',
      normalBalance: 'DEBIT',
      category: getAssetCategory(accountName)
    };
    console.log(`✅ [CLASSIFICATION-FRONTEND] Result by NAME (ASSET): ${result.type} (${result.category})`);
    return result;
  }
  
  // LIABILITAS/UTANG (Normal Balance: CREDIT)
  if (isLiabilityAccount(accountName, accountCode)) {
    const result = {
      type: 'LIABILITAS', 
      normalBalance: 'CREDIT',
      category: 'UTANG'
    };
    console.log(`✅ [CLASSIFICATION-FRONTEND] Result by NAME (LIABILITY): ${result.type}`);
    return result;
  }
  
  // ✅ SOLUSI 5: EKUITAS/MODAL dengan validasi
  // Hanya modal investasi & laba ditahan, bukan pendapatan
  if (isEquityAccount(accountName, accountCode)) {
    const result = {
      type: 'EKUITAS',
      normalBalance: 'CREDIT', 
      category: 'MODAL'
    };
    console.log(`✅ [CLASSIFICATION-FRONTEND] Result by NAME (EQUITY): ${result.type}`);
    return result;
  }
  
  // Default untuk akun yang tidak dikenal
  console.warn(`⚠️ [CLASSIFICATION-FRONTEND] Unknown account type: "${accountName}" (${accountCode}) -> Default to LAIN`);
  return {
    type: 'LAIN',
    normalBalance: 'DEBIT',
    category: 'LAIN'
  };
}

/**
 * ✅ SOLUSI: Klasifikasi berdasarkan kode SAK EMKM (paling akurat)
 * @param {string} code - Kode akun
 * @param {string} name - Nama akun untuk validasi
 * @returns {Object} - Klasifikasi berdasarkan kode
 */
function classifyByCode(code, name) {
  const firstDigit = code.charAt(0);
  
  switch (firstDigit) {
    case '1':
      return {
        type: 'ASET',
        normalBalance: 'DEBIT',
        category: getAssetCategory(name)
      };
    case '2':
      return {
        type: 'LIABILITAS',
        normalBalance: 'CREDIT',
        category: 'UTANG'
      };
    case '3':
      return {
        type: 'EKUITAS',
        normalBalance: 'CREDIT',
        category: 'MODAL'
      };
    case '4':
      return {
        type: 'PENDAPATAN',
        normalBalance: 'CREDIT',
        category: 'PENDAPATAN'
      };
    case '5':
      return {
        type: 'BEBAN',
        normalBalance: 'DEBIT',
        category: 'BEBAN'
      };
    default:
      return {
        type: 'LAIN',
        normalBalance: 'DEBIT',
        category: 'LAIN'
      };
  }
}

/**
 * ✅ SOLUSI: Cek apakah akun adalah ASET dengan validasi ketat
 * Fixes: "Perlengkapan dicatat ke Beban" & "Beban Perlengkapan vs Perlengkapan"
 */
function isAssetAccount(name, code) {
  const upperName = name.toUpperCase();
  const upperCode = code.toString();
  
  // ✅ PRIORITAS 1: Berdasarkan kode SAK EMKM (1xxx untuk ASET)
  if (upperCode.startsWith('1')) {
    console.log(`🎯 [ASSET-CODE-FRONTEND] "${name}" classified as ASET (code: ${code})`);
    return true;
  }
  
  // ✅ PRIORITAS 2: CRITICAL - TOLAK jika dimulai dengan "BEBAN" atau "BIAYA" (anti-konflik)
  // Solusi untuk: "Beban Listrik", "Beban Perlengkapan" tidak boleh jadi ASET
  if (upperName.startsWith('BEBAN ') || upperName === 'BEBAN' || 
      upperName.startsWith('BIAYA ') || upperName === 'BIAYA') {
    console.log(`🙅 [ASSET-REJECT-FRONTEND] "${name}" REJECTED as ASET (starts with BEBAN/BIAYA)`);
    return false;
  }
  
  // ✅ PRIORITAS 3: Validasi spesifik untuk aset yang sering salah klasifikasi
  // Solusi untuk: "Perlengkapan" harus ASET, bukan BEBAN
  const specificAssets = [
    'PERLENGKAPAN', // Khusus untuk "Perlengkapan" (bukan "Beban Perlengkapan")
    'KAS', 'KAS KECIL', 'KAS BESAR',
    'BANK BCA', 'BANK MANDIRI', 'BANK BRI', 'REKENING BANK',
    'PIUTANG USAHA', 'PIUTANG DAGANG',
    'PERSEDIAAN BARANG', 'STOK BARANG',
    'TANAH DAN BANGUNAN', 'GEDUNG KANTOR',
    'KENDARAAN OPERASIONAL', 'MOTOR DINAS',
    'PERALATAN KANTOR', 'KOMPUTER', 'PRINTER'
  ];
  
  if (specificAssets.some(asset => upperName === asset)) {
    console.log(`🎯 [ASSET-SPECIFIC-FRONTEND] "${name}" classified as ASET (specific asset match)`);
    return true;
  }
  
  // ✅ PRIORITAS 4: Keyword umum aset (dengan validasi ketat)
  const assetKeywords = [
    'TUNAI', 'CASH', 'GIRO', 'DEPOSITO',
    'TAGIHAN', 'DEBITUR', 'BARANG DAGANGAN',
    'TANAH', 'BANGUNAN', 'GEDUNG', 'KENDARAAN', 'MESIN',
    'INVENTARIS', 'SUPPLIES',
    'DIBAYAR DIMUKA', 'MASIH HARUS DITERIMA',
    'AKUMULASI PENYUSUTAN', 'INVESTASI JANGKA PANJANG',
    'HAK PATEN', 'GOODWILL', 'LISENSI', 'ASET TAKBERWUJUD'
  ];
  
  const hasAssetKeyword = assetKeywords.some(keyword => upperName.includes(keyword));
  
  if (hasAssetKeyword) {
    // ✅ VALIDASI TAMBAHAN: Pastikan bukan beban yang kebetulan mengandung keyword
    const expenseIndicators = [
      'BEBAN ', 'BIAYA ', 'UPAH', 'GAJI', 'SEWA GEDUNG', 'LISTRIK', 'AIR'
    ];
    
    const hasExpenseIndicator = expenseIndicators.some(indicator => upperName.includes(indicator));
    
    if (!hasExpenseIndicator) {
      console.log(`🎯 [ASSET-KEYWORD-FRONTEND] "${name}" classified as ASET (keyword match, no expense conflict)`);
      return true;
    }
  }
  
  return false;
}

/**
 * ✅ SOLUSI: Cek apakah akun adalah LIABILITAS dengan validasi ketat
 */
function isLiabilityAccount(name, code) {
  const upperName = name.toUpperCase();
  const upperCode = code.toString();
  
  // Berdasarkan kode (2xxx untuk LIABILITAS menurut SAK EMKM)
  if (upperCode.startsWith('2')) {
    console.log(`🎯 [LIABILITY-CODE-FRONTEND] "${name}" classified as LIABILITAS (code: ${code})`);
    return true;
  }
  
  // Berdasarkan nama
  const liabilityKeywords = [
    'UTANG', 'HUTANG', 'KREDIT', 'PINJAMAN', 'KREDITUR',
    'LIABILITAS', 'KEWAJIBAN', 'CICILAN',
    'BEBAN YANG MASIH HARUS DIBAYAR', 'MASIH HARUS DIBAYAR',
    'PENDAPATAN DITERIMA DIMUKA', 'DITERIMA DIMUKA',
    'OBLIGASI', 'HIPOTIK', 'HIPOTEK'
  ];
  
  const isLiability = liabilityKeywords.some(keyword => upperName.includes(keyword));
  if (isLiability) {
    console.log(`🎯 [LIABILITY-KEYWORD-FRONTEND] "${name}" classified as LIABILITAS`);
  }
  
  return isLiability;
}

/**
 * ✅ SOLUSI: Cek apakah akun adalah EKUITAS dengan validasi ketat
 * Fixes: "Pendapatan Penjualan masuk ke akun Modal"
 */
function isEquityAccount(name, code) {
  const upperName = name.toUpperCase();
  const upperCode = code.toString();
  
  // ✅ PRIORITAS 1: Berdasarkan kode SAK EMKM (3xxx untuk EKUITAS)
  if (upperCode.startsWith('3')) {
    console.log(`🎯 [EQUITY-CODE-FRONTEND] "${name}" classified as EKUITAS (code: ${code})`);
    return true;
  }
  
  // ✅ PRIORITAS 2: Validasi nama spesifik modal/ekuitas
  // Solusi untuk: Hanya modal investasi & laba ditahan, bukan pendapatan
  const specificEquity = [
    'MODAL PEMILIK', 'MODAL SAHAM', 'MODAL DISETOR',
    'LABA DITAHAN', 'CADANGAN', 'PRIVE',
    'INVESTASI PEMILIK', 'SETORAN MODAL'
  ];
  
  if (specificEquity.some(equity => upperName.includes(equity))) {
    console.log(`🎯 [EQUITY-SPECIFIC-FRONTEND] "${name}" classified as EKUITAS (specific equity match)`);
    return true;
  }
  
  // ✅ PRIORITAS 3: Keyword ekuitas (hati-hati dengan pendapatan)
  const equityKeywords = ['MODAL', 'SAHAM', 'EKUITAS', 'CADANGAN', 'PRIVE'];
  
  const isDefinitelyEquity = equityKeywords.some(keyword => upperName.includes(keyword));
  
  // Validasi tambahan: jangan sampai pendapatan masuk ke modal
  const revenueIndicators = ['PENDAPATAN', 'PENJUALAN', 'JASA', 'KOMISI'];
  const hasRevenueIndicator = revenueIndicators.some(indicator => upperName.includes(indicator));
  
  const isEquity = isDefinitelyEquity && !hasRevenueIndicator;
  if (isEquity) {
    console.log(`🎯 [EQUITY-KEYWORD-FRONTEND] "${name}" classified as EKUITAS (no revenue conflict)`);
  }
  
  return isEquity;
}

/**
 * ✅ SOLUSI: Cek apakah akun adalah PENDAPATAN dengan validasi ketat
 * Fixes: "Pendapatan Penjualan masuk ke akun Modal"
 */
function isRevenueAccount(name, code) {
  const upperName = name.toUpperCase();
  const upperCode = code.toString();
  
  // ✅ PRIORITAS 1: Berdasarkan kode SAK EMKM (4xxx untuk PENDAPATAN)
  if (upperCode.startsWith('4')) {
    console.log(`🎯 [REVENUE-CODE-FRONTEND] "${name}" classified as PENDAPATAN (code: ${code})`);
    return true;
  }
  
  // ✅ PRIORITAS 2: CRITICAL - Validasi nama spesifik untuk pendapatan
  // Solusi untuk: "Pendapatan Penjualan" harus PENDAPATAN, bukan MODAL
  const specificRevenue = [
    'PENDAPATAN JASA', 'PENDAPATAN PENJUALAN', 'PENDAPATAN USAHA',
    'PENJUALAN BARANG', 'PENJUALAN JASA',
    'HASIL PENJUALAN', 'OMZET PENJUALAN'
  ];
  
  if (specificRevenue.some(revenue => upperName === revenue || upperName.startsWith(revenue))) {
    console.log(`🎯 [REVENUE-SPECIFIC-FRONTEND] "${name}" classified as PENDAPATAN (specific revenue match)`);
    return true;
  }
  
  // ✅ PRIORITAS 3: Validasi nama yang dimulai dengan "PENDAPATAN" atau "PENJUALAN"
  if (upperName.startsWith('PENDAPATAN ') || upperName === 'PENDAPATAN' ||
      upperName.startsWith('PENJUALAN ') || upperName === 'PENJUALAN') {
    console.log(`🎯 [REVENUE-PREFIX-FRONTEND] "${name}" classified as PENDAPATAN (starts with PENDAPATAN/PENJUALAN)`);
    return true;
  }
  
  // ✅ PRIORITAS 4: Keyword pendapatan yang spesifik
  const revenueKeywords = [
    'JASA KONSULTASI', 'KOMISI PENJUALAN',
    'BUNGA DITERIMA', 'DIVIDEN DITERIMA', 'ROYALTI DITERIMA',
    'SEWA DITERIMA', 'REVENUE', 'INCOME OPERASIONAL',
    'LABA PENJUALAN ASET'
  ];
  
  const hasRevenueKeyword = revenueKeywords.some(keyword => upperName.includes(keyword));
  
  if (hasRevenueKeyword) {
    // ✅ VALIDASI TAMBAHAN: Pastikan bukan modal yang kebetulan mengandung keyword
    const equityIndicators = [
      'MODAL ', 'SAHAM ', 'INVESTASI PEMILIK', 'SETORAN MODAL',
      'LABA DITAHAN', 'CADANGAN '
    ];
    
    const hasEquityIndicator = equityIndicators.some(indicator => upperName.includes(indicator));
    
    if (!hasEquityIndicator) {
      console.log(`🎯 [REVENUE-KEYWORD-FRONTEND] "${name}" classified as PENDAPATAN (keyword match, no equity conflict)`);
      return true;
    }
  }
  
  return false;
}

/**
 * ✅ SOLUSI: Cek apakah akun adalah BEBAN dengan validasi ketat
 * Fixes: "Beban Listrik salah dicatat ke Aktiva" & "Beban Perlengkapan vs Perlengkapan"
 */
function isExpenseAccount(name, code) {
  const upperName = name.toUpperCase();
  const upperCode = code.toString();
  
  // ✅ PRIORITAS 1: Berdasarkan kode SAK EMKM (5xxx untuk BEBAN)
  if (upperCode.startsWith('5')) {
    console.log(`🎯 [EXPENSE-CODE-FRONTEND] "${name}" classified as BEBAN (code: ${code})`);
    return true;
  }
  
  // ✅ PRIORITAS 2: CRITICAL - Nama yang dimulai dengan "BEBAN" atau "BIAYA" (paling spesifik)
  // Solusi untuk: "Beban Listrik", "Beban Perlengkapan", "Beban Gaji" harus jadi BEBAN
  if (upperName.startsWith('BEBAN ') || upperName === 'BEBAN' || 
      upperName.startsWith('BIAYA ') || upperName === 'BIAYA') {
    console.log(`🎯 [EXPENSE-PRIORITY-FRONTEND] "${name}" classified as BEBAN (starts with BEBAN/BIAYA)`);
    return true;
  }
  
  // ✅ PRIORITAS 3: Validasi spesifik untuk menghindari konflik dengan aset
  // Solusi untuk: "Perlengkapan" (ASET) vs "Beban Perlengkapan" (BEBAN)
  const specificExpenses = [
    'BEBAN GAJI', 'BEBAN LISTRIK', 'BEBAN AIR', 'BEBAN SEWA',
    'BEBAN PERLENGKAPAN', 'BEBAN TELEPON', 'BEBAN INTERNET',
    'BIAYA GAJI', 'BIAYA LISTRIK', 'BIAYA OPERASIONAL'
  ];
  
  if (specificExpenses.some(expense => upperName === expense || upperName.includes(expense))) {
    console.log(`🎯 [EXPENSE-SPECIFIC-FRONTEND] "${name}" classified as BEBAN (specific expense match)`);
    return true;
  }
  
  // ✅ PRIORITAS 4: Keyword beban yang spesifik (lebih hati-hati)
  const expenseKeywords = [
    'UPAH', 'GAJI KARYAWAN', 'HONORARIUM',
    'HARGA POKOK', 'ONGKOS', 'TRANSPORT',
    'MAKAN MINUM', 'OPERASIONAL', 'EXPENSE',
    'ADMINISTRASI', 'MARKETING', 'PROMOSI',
    'PENYUSUTAN', 'PAJAK PENGHASILAN', 'BUNGA PINJAMAN'
  ];
  
  // Cek keyword dengan validasi tambahan
  const hasExpenseKeyword = expenseKeywords.some(keyword => upperName.includes(keyword));
  
  if (hasExpenseKeyword) {
    // ✅ VALIDASI TAMBAHAN: Pastikan bukan aset yang kebetulan mengandung keyword
    const assetIndicators = [
      'PIUTANG', 'PERSEDIAAN', 'KAS', 'BANK', 'TANAH', 'BANGUNAN',
      'PERALATAN', 'KENDARAAN', 'MESIN', 'INVENTARIS'
    ];
    
    const hasAssetIndicator = assetIndicators.some(indicator => upperName.includes(indicator));
    
    if (!hasAssetIndicator) {
      console.log(`🎯 [EXPENSE-KEYWORD-FRONTEND] "${name}" classified as BEBAN (keyword match, no asset conflict)`);
      return true;
    }
  }
  
  return false;
}

/**
 * Menentukan subkategori untuk ASET
 */
function getAssetCategory(name) {
  if (name.includes('KAS') || name.includes('TUNAI') || name.includes('CASH')) {
    return 'KAS';
  }
  if (name.includes('BANK') || name.includes('REKENING') || name.includes('GIRO')) {
    return 'BANK';
  }
  if (name.includes('PIUTANG') || name.includes('TAGIHAN')) {
    return 'PIUTANG';
  }
  if (name.includes('PERSEDIAAN') || name.includes('STOK') || name.includes('BARANG')) {
    return 'PERSEDIAAN';
  }
  if (name.includes('PERLENGKAPAN') || name.includes('SUPPLIES')) {
    return 'PERLENGKAPAN';
  }
  return 'ASET';
}

/**
 * ✅ SOLUSI: Hitung saldo akun berdasarkan transaksi dan normal balance
 * Fixes: "Nominal kosong/nol tapi tetap disimpan" & "Saldo awal tidak diinput dengan benar"
 * @param {Object} account - Data akun
 * @param {Array} transactions - Array transaksi
 * @returns {number} - Saldo akhir yang valid
 */
function calculateAccountBalance(account, transactions) {
  // Validasi input account
  if (!account || !account.name) {
    console.warn('⚠️ [BALANCE-FRONTEND] Invalid account data');
    return 0;
  }
  
  const classification = classifyAccount(account.name, account.code);
  let balance = Number(account.balance || 0);
  
  // ✅ SOLUSI: Validasi saldo awal - jangan sampai NaN atau invalid
  if (isNaN(balance) || !isFinite(balance)) {
    console.warn(`⚠️ [BALANCE-FRONTEND] Invalid initial balance for account: ${account.name}, setting to 0`);
    balance = 0;
  }
  
  // Validasi input transactions
  if (!Array.isArray(transactions)) {
    console.warn('⚠️ [BALANCE-FRONTEND] Invalid transactions data');
    return balance;
  }
  
  let transactionCount = 0;
  
  transactions.forEach(transaction => {
    // ✅ SOLUSI: Validasi transaksi - skip yang invalid atau kosong
    if (!transaction || typeof transaction !== 'object') {
      return;
    }
    
    const amount = Number(transaction.amount || transaction.nominal || 0);
    
    // ✅ SOLUSI: Skip transaksi dengan nominal kosong/invalid tapi tidak error
    // "Nominal kosong/nol tapi tetap disimpan" - biarkan tersimpan tapi tidak mempengaruhi saldo
    if (!amount || amount === 0 || isNaN(amount) || !isFinite(amount)) {
      return; // Skip transaksi kosong/invalid dengan aman
    }
    
    // Jika akun di-DEBIT
    if (transaction.debit_account_id === account.id) {
      transactionCount++;
      if (classification.normalBalance === 'DEBIT') {
        balance += amount; // Normal balance DEBIT: debit menambah saldo
      } else {
        balance -= amount; // Normal balance CREDIT: debit mengurangi saldo
      }
    }
    
    // Jika akun di-KREDIT
    if (transaction.credit_account_id === account.id || transaction.creditAccountId === account.id) {
      transactionCount++;
      if (classification.normalBalance === 'DEBIT') {
        balance -= amount; // Normal balance DEBIT: kredit mengurangi saldo
      } else {
        balance += amount; // Normal balance CREDIT: kredit menambah saldo
      }
    }
  });
  
  // ✅ SOLUSI: Pastikan hasil tidak NaN atau infinite
  if (isNaN(balance) || !isFinite(balance)) {
    console.error(`❌ [BALANCE-FRONTEND] Final balance is invalid for ${account.name}, setting to 0`);
    return 0;
  }
  
  return balance;
}

/**
 * Backward compatibility - alias untuk fungsi lama
 */
function inferCategory(name) {
  const classification = classifyAccount(name);
  return classification.category;
}

function isCreditNormal(category) {
  return ['UTANG', 'MODAL', 'PENDAPATAN', 'LIABILITAS', 'EKUITAS'].includes(category);
}

// Export functions untuk penggunaan global
window.classifyAccount = classifyAccount;
window.calculateAccountBalance = calculateAccountBalance;
window.inferCategory = inferCategory;
window.isCreditNormal = isCreditNormal;

console.log('✅ [ACCOUNT-CLASSIFICATION] Loaded successfully - SAK EMKM Compatible');