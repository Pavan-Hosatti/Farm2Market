// utilis/algorand.js
// ============================================
// Algorand TestNet Integration with Fallbacks
// Real Deployment: App ID 756282697
// Explorer: https://lora.algokit.io/testnet/application/756282697
// Stores cryptographic hashes on blockchain as immutable proof
// ============================================

const algosdk = require("algosdk");
require("dotenv").config();

// Feature flags for graceful degradation
const ENABLE_ALGORAND_FALLBACK = process.env.ENABLE_ALGORAND_FALLBACK === 'true';
const ENABLE_MOCK_BLOCKCHAIN = process.env.ENABLE_MOCK_BLOCKCHAIN === 'true';
const BLOCKCHAIN_PROOF_MODE = process.env.BLOCKCHAIN_PROOF_MODE || 'algorand'; // 'algorand', 'mock', or 'disabled'
const MOCK_TXN_ID_PREFIX = process.env.MOCK_TXN_ID_PREFIX || 'MOCKTEST_';

// Connect to Algorand TestNet via AlgoNode (public node)
let algodClient = null;
try {
  algodClient = new algosdk.Algodv2("", process.env.ALGO_NODE || "https://testnet-api.algonode.cloud", 443);
  console.log('✅ Algorand TestNet client initialized');
} catch (err) {
  console.warn('⚠️ Failed to initialize Algorand client:', err.message);
}

/**
 * Get account from mnemonic stored in .env
 * @returns {Object} Algorand account with address and secret key
 */
const getAccount = () => {
  try {
    const mnemonic = process.env.ALGO_MNEMONIC;
    if (!mnemonic) {
      throw new Error("ALGO_MNEMONIC not found in .env");
    }
    return algosdk.mnemonicToSecretKey(mnemonic);
  } catch (err) {
    console.error("⚠️ Error loading Algorand account:", err.message);
    
    // Still return a mock account for fallback mode
    if (ENABLE_MOCK_BLOCKCHAIN) {
      console.log("📝 Using mock account for development");
      return {
        addr: "MOCKACCOUNT" + process.env.ALGO_APP_ID || "1234567890",
        sk: new Uint8Array(64) // Dummy secret key for mock mode
      };
    }
    throw err;
  }
};

/**
 * Generate mock Algorand transaction ID
 * @param {string} methodName - Method name for tracking
 * @returns {string} Mock transaction ID
 */
const generateMockTxId = (methodName) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `${MOCK_TXN_ID_PREFIX}${methodName.toUpperCase()}_${timestamp}_${random}`;
};

/**
 * Call smart contract method on Algorand blockchain
 * With fallback to mock mode when testnet unavailable
 * @param {string} methodName - Contract method name (store_video_hash or store_hash)
 * @param {Array} args - Arguments to pass to the contract method
 * @returns {Promise<Object>} { success: boolean, txId: string|null, mode: 'algorand'|'mock'|'disabled' }
 */
const callContractMethod = async (methodName, args) => {
  // Check blockchain proof mode setting
  if (BLOCKCHAIN_PROOF_MODE === 'disabled') {
    console.log(`⏭️  Blockchain proof disabled - skipping ${methodName}`);
    return { success: true, txId: null, mode: 'disabled', message: 'Blockchain proof disabled' };
  }

  // Try real Algorand first if enabled
  if (BLOCKCHAIN_PROOF_MODE === 'algorand') {
    try {
      return await callAlgorandContract(methodName, args);
    } catch (err) {
      console.error(`❌ Algorand call failed: ${err.message}`);
      
      // Fall back to mock mode if enabled
      if (ENABLE_MOCK_BLOCKCHAIN && ENABLE_ALGORAND_FALLBACK) {
        console.log(`⚡ Falling back to mock blockchain for ${methodName}`);
        return await callMockContractMethod(methodName, args);
      }
      
      // Return error without crashing
      return { 
        success: false, 
        txId: null, 
        mode: 'algorand',
        error: err.message,
        message: 'Algorand testnet unavailable and fallback disabled'
      };
    }
  }

  // Use mock mode directly if configured
  if (BLOCKCHAIN_PROOF_MODE === 'mock') {
    console.log(`🎭 Using mock blockchain mode for ${methodName}`);
    return await callMockContractMethod(methodName, args);
  }
};

/**
 * Call actual Algorand contract on testnet
 * @private
 */
const callAlgorandContract = async (methodName, args) => {
  if (!algodClient) {
    throw new Error("Algorand client not initialized");
  }

  const account = getAccount();
  const appId = parseInt(process.env.ALGO_APP_ID);

  if (!appId) {
    throw new Error("ALGO_APP_ID not found in .env");
  }

  console.log(`🔗 Calling Algorand contract method: ${methodName}`);
  console.log(`📍 App ID: ${appId}`);
  console.log(`📤 Args:`, args);

  const suggestedParams = await algodClient.getTransactionParams().do();

  // Define ABI contract interface matching deployed contract
  const contract = new algosdk.ABIContract({
    name: "FarmEscrowApp",
    methods: [
      {
        name: "store_video_hash",
        args: [{ type: "string", name: "hash_value" }],
        returns: { type: "void" },
      },
      {
        name: "store_certificate_hash",
        args: [{ type: "string", name: "hash_value" }],
        returns: { type: "void" },
      },
      {
        name: "get_video_hash",
        args: [],
        returns: { type: "string" },
      },
      {
        name: "get_certificate_hash",
        args: [],
        returns: { type: "string" },
      },
    ],
  });

  const atc = new algosdk.AtomicTransactionComposer();
  const method = contract.getMethodByName(methodName);

  // Add unique note to prevent "transaction already in ledger" error on TestNet
  const uniqueNote = `${methodName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  atc.addMethodCall({
    appID: appId,
    method,
    methodArgs: args,
    sender: account.addr,
    suggestedParams,
    note: new Uint8Array(Buffer.from(uniqueNote)),
    signer: algosdk.makeBasicAccountTransactionSigner(account),
  });

  // Execute transaction
  const result = await atc.execute(algodClient, 4);
  const txId = result.txIDs[0];

  console.log(`✅ Blockchain TX Success [${methodName}]: ${txId}`);
  console.log(`🔍 View on explorer: https://testnet.algoexplorer.io/tx/${txId}`);

  return { success: true, txId, mode: 'algorand' };
};

/**
 * Mock blockchain contract call (when testnet unavailable)
 * Generates realistic transaction IDs and timestamps
 * @private
 */
const callMockContractMethod = async (methodName, args) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

  const mockTxId = generateMockTxId(methodName);
  console.log(`🎭 Mock TX ID [${methodName}]: ${mockTxId}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`📝 Data: ${args.join(', ')}`);

  return {
    success: true,
    txId: mockTxId,
    mode: 'mock',
    message: 'Mock blockchain (testnet unavailable)',
    timestamp: new Date().toISOString()
  };
};

module.exports = { callContractMethod };
