// utilis/generateAgreement.js
// ============================================
// PDF Agreement Generator with Blockchain Hash Storage
// Generates tamper-proof agreements when buyer places bid
// ============================================

const PDFDocument = require("pdfkit");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { callContractMethod } = require("./algorand");

/**
 * Generate PDF agreement and store hash on blockchain
 * @param {Object} params - Agreement parameters
 * @param {string} params.buyerName - Buyer's full name
 * @param {string} params.buyerEmail - Buyer's email
 * @param {string} params.farmerName - Farmer's full name
 * @param {string} params.farmerEmail - Farmer's email
 * @param {string} params.cropName - Name of the crop
 * @param {string} params.quantity - Crop quantity (e.g., "500kg")
 * @param {number} params.price - Bid amount in rupees
 * @param {string} params.bidId - MongoDB bid ID for reference
 * @returns {Promise<Object>} { success, fileName, filePath, hash, blockchain }
 */
const generateAndStoreAgreement = async ({
  buyerName,
  buyerEmail,
  farmerName,
  farmerEmail,
  cropName,
  quantity,
  price,
  bidId,
}) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📄 GENERATING AGREEMENT PDF');
    console.log('='.repeat(60));
    console.log('Buyer:', buyerName);
    console.log('Farmer:', farmerName);
    console.log('Crop:', cropName);
    console.log('Bid ID:', bidId);

    // Generate unique agreement ID
    const agreementId = `AGR-${bidId}-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const fileName = `agreement_${agreementId}.pdf`;

    // Ensure agreements folder exists
    const agreementsDir = path.join(__dirname, "../uploads/agreements");
    if (!fs.existsSync(agreementsDir)) {
      fs.mkdirSync(agreementsDir, { recursive: true });
      console.log('📁 Created agreements directory');
    }

    const filePath = path.join(agreementsDir, fileName);

    // ══════════════════════════════════════════════════════════
    // BUILD PDF DOCUMENT
    // ══════════════════════════════════════════════════════════
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // ──────────────────────────────────────────────────────────
    // HEADER
    // ──────────────────────────────────────────────────────────
    doc.fontSize(22)
       .font("Helvetica-Bold")
       .fillColor('#065f46')
       .text("FARM PURCHASE AGREEMENT", { align: "center" });

    doc.fontSize(11)
       .font("Helvetica")
       .fillColor('#666')
       .text("Agricultural Marketplace Platform - Farm2Market", { align: "center" });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#065f46');
    doc.moveDown();

    // ──────────────────────────────────────────────────────────
    // AGREEMENT METADATA
    // ──────────────────────────────────────────────────────────
    doc.fillColor('#000');
    doc.fontSize(11)
       .font("Helvetica-Bold")
       .text("Agreement ID: ", { continued: true })
       .font("Helvetica")
       .fillColor('#065f46')
       .text(agreementId);

    doc.fillColor('#000')
       .font("Helvetica-Bold")
       .text("Date & Time: ", { continued: true })
       .font("Helvetica")
       .text(new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

    doc.moveDown();

    // ──────────────────────────────────────────────────────────
    // PARTIES INVOLVED
    // ──────────────────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc');
    doc.moveDown(0.5);

    doc.fontSize(13)
       .font("Helvetica-Bold")
       .fillColor('#065f46')
       .text("PARTIES INVOLVED");

    doc.moveDown(0.5);

    // Buyer details
    doc.fontSize(11)
       .font("Helvetica-Bold")
       .fillColor('#000')
       .text("BUYER / PURCHASER");

    doc.font("Helvetica")
       .text(`Name: ${buyerName}`)
       .text(`Email: ${buyerEmail}`)
       .text(`Role: Buyer`);

    doc.moveDown();

    // Farmer details
    doc.font("Helvetica-Bold")
       .text("FARMER / SELLER");

    doc.font("Helvetica")
       .text(`Name: ${farmerName}`)
       .text(`Email: ${farmerEmail}`)
       .text(`Role: Farmer/Producer`);

    doc.moveDown();

    // ──────────────────────────────────────────────────────────
    // CROP & DEAL DETAILS
    // ──────────────────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc');
    doc.moveDown(0.5);

    doc.fontSize(13)
       .font("Helvetica-Bold")
       .fillColor('#065f46')
       .text("CROP & DEAL DETAILS");

    doc.moveDown(0.5);
    doc.fillColor('#000');

    doc.fontSize(11)
       .font("Helvetica-Bold")
       .text("Crop Name: ", { continued: true })
       .font("Helvetica")
       .text(cropName);

    doc.font("Helvetica-Bold")
       .text("Quantity: ", { continued: true })
       .font("Helvetica")
       .text(quantity);

    doc.font("Helvetica-Bold")
       .text("Agreed Price: ", { continued: true })
       .font("Helvetica")
       .fillColor('#059669')
       .text(`₹${price.toLocaleString('en-IN')}`);

    doc.fillColor('#000')
       .font("Helvetica-Bold")
       .text("Bid Reference ID: ", { continued: true })
       .font("Helvetica")
       .text(String(bidId));

    doc.moveDown();

    // ──────────────────────────────────────────────────────────
    // TERMS & CONDITIONS
    // ──────────────────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc');
    doc.moveDown(0.5);

    doc.fontSize(13)
       .font("Helvetica-Bold")
       .fillColor('#065f46')
       .text("TERMS & CONDITIONS");

    doc.moveDown(0.5);

    const terms = [
      "The farmer agrees to deliver the stated crop quantity as described above in good condition.",
      "The buyer agrees to complete payment upon successful delivery and quality verification.",
      "Both parties agree to abide by the platform's dispute resolution policy.",
      "This agreement is legally binding between both parties from the time of bid placement.",
      "Any modifications to this agreement must be done through the platform only.",
      "Quality standards must match the grade specified in the original crop listing.",
      "Delivery timeline and logistics to be coordinated through platform messaging."
    ];

    doc.fillColor('#000')
       .fontSize(10)
       .font("Helvetica")
       .list(terms, { 
         bulletRadius: 2, 
         textIndent: 15,
         bulletIndent: 5 
       });

    doc.moveDown();

    // ──────────────────────────────────────────────────────────
    // BLOCKCHAIN VERIFICATION
    // ──────────────────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc');
    doc.moveDown(0.5);

    doc.fontSize(13)
       .font("Helvetica-Bold")
       .fillColor('#065f46')
       .text("🔐 BLOCKCHAIN VERIFICATION");

    doc.moveDown(0.5);

    doc.fontSize(10)
       .font("Helvetica")
       .fillColor('#000')
       .text(
         "This agreement has been cryptographically hashed using SHA-256 and recorded on the " +
         "Algorand blockchain (TestNet). The hash below serves as an immutable, tamper-proof " +
         "record of this document at the time of generation. Any modification to this PDF will " +
         "result in a different hash, proving document integrity."
       );

    doc.moveDown(0.5);

    doc.font("Helvetica-Bold")
       .text("Algorand App ID: ", { continued: true })
       .font("Helvetica")
       .text(process.env.ALGO_APP_ID || "756282697");

    doc.font("Helvetica-Bold")
       .text("Network: ", { continued: true })
       .font("Helvetica")
       .text("Algorand TestNet");

    doc.font("Helvetica-Bold")
       .text("Document Hash (SHA-256): ", { continued: true })
       .font("Helvetica")
       .text("Generated after PDF creation — see transaction ID below");

    doc.moveDown(0.5);

    doc.fontSize(9)
       .fillColor('#666')
       .font("Helvetica-Oblique")
       .text("Transaction ID and final hash will be appended after blockchain confirmation.", { italics: true });

    doc.moveDown();

    // ──────────────────────────────────────────────────────────
    // ACKNOWLEDGEMENT / SIGNATURES
    // ──────────────────────────────────────────────────────────
    doc.fillColor('#000')
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke('#ccc');

    doc.moveDown(0.5);

    doc.fontSize(13)
       .font("Helvetica-Bold")
       .fillColor('#065f46')
       .text("ACKNOWLEDGEMENT");

    doc.moveDown(0.5);

    doc.fontSize(10)
       .font("Helvetica")
       .fillColor('#000')
       .text(`Buyer (${buyerName}) — Digitally acknowledged on ${new Date(timestamp).toLocaleString('en-IN')}`);

    doc.moveDown(0.5);

    doc.text(`Farmer (${farmerName}) — Listed crop and accepted terms on platform`);

    doc.moveDown();

    doc.fontSize(9)
       .fillColor('#666')
       .text("This is a digitally generated agreement. Physical signatures are not required.", { align: "center" });

    doc.moveDown(0.5);

    doc.fontSize(8)
       .fillColor('#999')
       .text("Generated by Farm2Market Platform | farm2market.io | support@farm2market.io", { align: "center" });

    // ──────────────────────────────────────────────────────────
    // FINALIZE PDF
    // ──────────────────────────────────────────────────────────
    doc.end();

    // Wait for PDF write to finish
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    console.log(`✅ PDF generated: ${fileName}`);

    // ══════════════════════════════════════════════════════════
    // HASH THE PDF
    // ══════════════════════════════════════════════════════════
    const pdfBuffer = fs.readFileSync(filePath);
    const fullHash = crypto.createHash("sha256").update(pdfBuffer).digest("hex");

    // Truncate to 64 chars to fit Algorand ABI string limit (128 bytes)
    const agreementHash = fullHash.substring(0, 64);

    console.log(`🔑 Agreement hash (SHA-256): ${agreementHash}`);

    // ══════════════════════════════════════════════════════════
    // STORE HASH ON BLOCKCHAIN
    // ══════════════════════════════════════════════════════════
    const blockchainResult = await callContractMethod("store_hash", [agreementHash]);

    console.log('='.repeat(60));
    console.log(`📄 Agreement Result:`, {
      success: true,
      fileName,
      hash: agreementHash,
      blockchainVerified: blockchainResult.success,
      txId: blockchainResult.txId
    });
    console.log('='.repeat(60) + '\n');

    return {
      success: true,
      fileName,
      filePath,
      hash: agreementHash,
      blockchain: blockchainResult,
    };

  } catch (err) {
    console.error("⚠️ Agreement generation failed (non-critical):", err.message);
    console.error(err.stack);
    return { 
      success: false, 
      error: err.message 
    };
  }
};

module.exports = { generateAndStoreAgreement };
