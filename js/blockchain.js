// ========================================
// BLOCKCHAIN.JS - KONFIGURASI BLOCKCHAIN
// ========================================

/**
 * Konfigurasi jaringan blockchain untuk deployment token
 * Setiap jaringan mencakup:
 * - chainId: Hexadecimal chain ID untuk MetaMask
 * - chainIdDecimal: Decimal chain ID untuk pengecekan jaringan
 * - chainName: Nama tampilan
 * - rpcUrl: URL endpoint RPC
 * - factoryAddress: Alamat kontrak factory
 * - nativeCurrency: Simbol token asli
 * - blockExplorer: URL block explorer
 * - symbol: Simbol token asli untuk ditampilkan
 */
const blockchainConfig = {
  bnb: {
    chainId: "0x38",
    chainIdDecimal: "56",
    chainName: "BNB Smart Chain",
    rpcUrl: "https://bsc-dataseed1.binance.org",
    factoryAddress: "0xbf03140Fe24b72a1049996A7AcDa0105321e1f71",
    nativeCurrency: "BNB",
    blockExplorer: "https://bscscan.com",
    symbol: "BNB",
    description: "Jaringan paling populer dengan biaya rendah dan likuiditas tinggi",
    gasFees: "~$0.20 - $0.50",
    status: "active",
  },
  core: {
    chainId: "0x45C",
    chainIdDecimal: "1116",
    chainName: "Core Chain",
    rpcUrl: "https://rpc.coredao.org",
    factoryAddress: "0xa46bE644029d60108641759eB7dc656bB17A2Da9",
    nativeCurrency: "CORE",
    blockExplorer: "https://scan.coredao.org",
    symbol: "CORE",
    description: "Layer-1 yang kompatibel dengan EVM dengan biaya sangat rendah",
    gasFees: "~$0.05 - $0.15",
    status: "active",
  },
  ric: {
    chainId: "0x203BA",
    chainIdDecimal: "132026",
    chainName: "Riche Chain",
    rpcUrl: "https://seed-richechain.com",
    factoryAddress: "0xbf03140Fe24b72a1049996A7AcDa0105321e1f71",
    nativeCurrency: "RIC",
    blockExplorer: "https://richescan.com",
    symbol: "RIC",
    description: "Jaringan biaya ultra-rendah untuk token eksperimental",
    gasFees: "~$0.02 - $0.08",
    status: "active",
  },
  eth: {
    chainId: "0x1",
    chainIdDecimal: "1",
    chainName: "Ethereum Mainnet",
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/demo",
    factoryAddress: "",
    nativeCurrency: "ETH",
    blockExplorer: "https://etherscan.io",
    symbol: "ETH",
    description: "Platform smart contract asli (Pemeliharaan)",
    gasFees: "~$5 - $20",
    status: "maintenance",
  },
  sol: {
    chainId: "",
    chainIdDecimal: "",
    chainName: "Solana",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    factoryAddress: "",
    nativeCurrency: "SOL",
    blockExplorer: "https://solscan.io",
    symbol: "SOL",
    description: "Blockchain berkinerja tinggi (Segera Hadir)",
    gasFees: "~$0.001 - $0.01",
    status: "coming_soon",
  },
  matic: {
    chainId: "0x89",
    chainIdDecimal: "137",
    chainName: "Polygon Mainnet",
    rpcUrl: "https://polygon-rpc.com",
    factoryAddress: "",
    nativeCurrency: "MATIC",
    blockExplorer: "https://polygonscan.com",
    symbol: "MATIC",
    description: "Solusi scaling Layer-2 (Ditangguhkan)",
    gasFees: "~$0.05 - $0.30",
    status: "suspended",
  },
};

// ========================================
// ABI KONTRAK CERDAS
// ========================================

/**
 * ABI Kontrak Factory Token
 * Ini adalah ABI minimal yang diperlukan untuk berinteraksi dengan kontrak factory token
 * Factory men-deploy kontrak token baru dan mengelola biaya pembuatan
 */
const factoryABI = [
  // Event
  "event TokenCreated(address indexed tokenAddress, address indexed creator, string name, string symbol, uint8 decimals, uint256 totalSupply)",

  // Fungsi Baca
  "function creationFee() view returns (uint256)",
  "function owner() view returns (address)",

  // Fungsi Tulis
  "function createToken(string memory name, string memory symbol, uint8 decimals, uint256 totalSupply) payable returns (address)",
  "function setCreationFee(uint256 _fee) external",
  "function withdraw() external",
];

// ========================================
// FUNGSI PEMBANTU
// ========================================

/**
 * Dapatkan daftar blockchain aktif untuk dropdown
 * @returns {Array} Array konfigurasi blockchain aktif
 */
function getActiveBlockchains() {
  return Object.keys(blockchainConfig)
    .filter((key) => blockchainConfig[key].status === "active")
    .map((key) => ({
      id: key,
      ...blockchainConfig[key],
    }));
}

/**
 * Dapatkan konfigurasi blockchain berdasarkan ID
 * @param {string} chainId - Identifier blockchain (bnb, core, dll.)
 * @returns {Object} Konfigurasi blockchain
 */
function getBlockchainConfig(chainId) {
  return blockchainConfig[chainId] || null;
}

/**
 * Periksa apakah jaringan didukung
 * @param {string} chainId - Identifier blockchain
 * @returns {boolean} True jika jaringan didukung
 */
function isNetworkSupported(chainId) {
  return !!blockchainConfig[chainId];
}

/**
 * Periksa apakah jaringan aktif
 * @param {string} chainId - Identifier blockchain
 * @returns {boolean} True jika jaringan aktif
 */
function isNetworkActive(chainId) {
  const config = blockchainConfig[chainId];
  return config && config.status === "active";
}

/**
 * Dapatkan alamat factory untuk blockchain
 * @param {string} chainId - Identifier blockchain
 * @returns {string} Alamat kontrak factory
 */
function getFactoryAddress(chainId) {
  const config = blockchainConfig[chainId];
  return config ? config.factoryAddress : null;
}

/**
 * Dapatkan URL block explorer untuk alamat token
 * @param {string} chainId - Identifier blockchain
 * @param {string} tokenAddress - Alamat kontrak token
 * @returns {string} URL lengkap untuk melihat token di block explorer
 */
function getTokenExplorerUrl(chainId, tokenAddress) {
  const config = blockchainConfig[chainId];
  if (!config) return null;
  return `${config.blockExplorer}/token/${tokenAddress}`;
}

/**
 * Dapatkan URL block explorer untuk transaksi
 * @param {string} chainId - Identifier blockchain
 * @param {string} txHash - Hash transaksi
 * @returns {string} URL lengkap untuk melihat transaksi di block explorer
 */
function getTransactionExplorerUrl(chainId, txHash) {
  const config = blockchainConfig[chainId];
  if (!config) return null;
  return `${config.blockExplorer}/tx/${txHash}`;
}

/**
 * Format jumlah token dengan desimal yang tepat
 * @param {string|number} amount - Jumlah token
 * @param {number} decimals - Desimal token
 * @returns {string} String jumlah yang diformat
 */
function formatTokenAmount(amount, decimals = 18) {
  if (!amount) return "0";
  const formatted = parseFloat(amount);
  if (isNaN(formatted)) return "0";
  return formatted.toFixed(Math.min(decimals, 6));
}

/**
 * Konversi jumlah token ke wei dengan desimal
 * @param {string|number} amount - Jumlah token
 * @param {number} decimals - Desimal token
 * @returns {bigint} Jumlah dalam wei
 */
function tokenAmountToWei(amount, decimals = 18) {
  const value = parseFloat(amount);
  if (isNaN(value) || value <= 0) return 0n;
  const multiplier = 10n ** BigInt(decimals);
  return BigInt(Math.floor(value * Number(multiplier)));
}

/**
 * Konversi wei ke jumlah token dengan desimal
 * @param {bigint} wei - Jumlah dalam wei
 * @param {number} decimals - Desimal token
 * @returns {string} Jumlah dalam unit token
 */
function weiToTokenAmount(wei, decimals = 18) {
  if (!wei) return "0";
  const divisor = 10n ** BigInt(decimals);
  const whole = wei / divisor;
  const remainder = wei % divisor;
  if (remainder === 0n) return whole.toString();
  const remainderStr = remainder.toString().padStart(Number(decimals), "0");
  return `${whole.toString()}.${remainderStr}`;
}

/**
 * Dapatkan jaringan yang direkomendasikan untuk deployment
 * @returns {string} ID jaringan yang direkomendasikan
 */
function getRecommendedNetwork() {
  return "bnb";
}

/**
 * Dapatkan perbandingan biaya jaringan untuk ditampilkan
 * @returns {Object} Objek perbandingan biaya
 */
function getNetworkFeeComparison() {
  const networks = getActiveBlockchains();
  return networks.map((network) => ({
    id: network.id,
    name: network.chainName,
    symbol: network.symbol,
    gasFees: network.gasFees,
    description: network.description,
  }));
}

// ========================================
// EKSPOR KONFIGURASI UNTUK DIGUNAKAN DI MAIN.JS
// ========================================
window.blockchainConfig = blockchainConfig;
window.factoryABI = factoryABI;
window.getActiveBlockchains = getActiveBlockchains;
window.getBlockchainConfig = getBlockchainConfig;
window.isNetworkSupported = isNetworkSupported;
window.isNetworkActive = isNetworkActive;
window.getFactoryAddress = getFactoryAddress;
window.getTokenExplorerUrl = getTokenExplorerUrl;
window.getTransactionExplorerUrl = getTransactionExplorerUrl;
window.formatTokenAmount = formatTokenAmount;
window.tokenAmountToWei = tokenAmountToWei;
window.weiToTokenAmount = weiToTokenAmount;
window.getRecommendedNetwork = getRecommendedNetwork;
window.getNetworkFeeComparison = getNetworkFeeComparison;

console.log("Konfigurasi Blockchain Dimuat:");
console.log("Jaringan Aktif:", getActiveBlockchains().length);
console.log("Direkomendasikan:", getRecommendedNetwork());
console.log("Jaringan Didukung:", Object.keys(blockchainConfig));