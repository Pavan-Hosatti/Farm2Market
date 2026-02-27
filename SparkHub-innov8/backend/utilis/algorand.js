// utilis/algorand.js
// ============================================
// Algorand TestNet Integration
// Stores cryptographic hashes on blockchain as immutable proof
// ============================================

const algosdk = require("algosdk");
require("dotenv").config();

// Connect to Algorand TestNet via AlgoNode (public node)
const algodClient = new algosdk.Algodv2("", process.env.ALGO_NODE || "https://testnet-api.algonode.cloud", 443);

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
    throw err;
  }
};

/**
 * Call smart contract method on Algorand blockchain
 * @param {string} methodName - Contract method name (store_video_hash or store_hash)
 * @param {Array} args - Arguments to pass to the contract method
 * @returns {Promise<Object>} { success: boolean, txId: string|null }
 */
const callContractMethod = async (methodName, args) => {
  try {
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

    return { success: true, txId };

  } catch (err) {
    // ⚠️ CRITICAL: Never crash existing flow if blockchain fails
    // Blockchain is optional proof layer - app must work without it
    console.error(`⚠️ Blockchain call failed (non-critical) [${methodName}]:`, err.message);

    // Log additional details for debugging
    if (err.response) {
      console.error("Error details:", err.response.body || err.response.text);
    }

    return { success: false, txId: null, error: err.message };
  }
};

module.exports = { callContractMethod };
