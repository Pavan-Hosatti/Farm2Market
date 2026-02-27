// controllers/bidController.js
// ============================================
const Bid = require('../models/Bid');
const CropListing = require('../models/CropListing');
const Farmer = require('../models/Farmer');
const { generateAndStoreAgreement } = require('../utilis/generateAgreement');

exports.placeBid = async (req, res) => {
  try {
    const { cropListingId, buyerId, bidAmount, quantity, deliveryAddress, paymentMethod } = req.body;

    // Validate required fields
    if (!cropListingId || !buyerId || !bidAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: cropListingId, buyerId, bidAmount'
      });
    }

    // Fetch crop and validate
    const crop = await CropListing.findById(cropListingId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found',
      });
    }

    // Create and save bid
    const newBid = new Bid({
      cropListingId,
      buyerId,
      bidAmount,
      bidStatus: 'pending',
    });

    const savedBid = await newBid.save();
    console.log('✅ Bid saved:', savedBid._id);

    // ✅ GENERATE AGREEMENT PDF + BLOCKCHAIN HASH
    let agreementPath = null;
    let blockchain = { verified: false };

    try {
      console.log('\n🔐 Generating agreement for bid:', savedBid._id);
      
      // Fetch buyer and farmer details
      const buyer = await Farmer.findById(buyerId).select('name email');
      const farmer = await Farmer.findById(crop.farmerId).select('name email');

      if (buyer && farmer) {
        // Generate agreement with blockchain hash
        const agreementResult = await generateAndStoreAgreement({
          buyerName: buyer.name || 'Buyer',
          buyerEmail: buyer.email || 'buyer@example.com',
          farmerName: farmer.name || 'Farmer',
          farmerEmail: farmer.email || 'farmer@example.com',
          cropName: crop.crop,
          quantity: quantity ? `${quantity}kg` : `${crop.quantityKg}kg`,
          price: bidAmount,
          bidId: savedBid._id,
        });

        if (agreementResult.success) {
          agreementPath = agreementResult.filePath;
          blockchain = agreementResult.blockchain || { verified: false };
          
          // Save blockchain TX ID to bid record
          if (blockchain.verified && blockchain.txId) {
            await Bid.findByIdAndUpdate(savedBid._id, {
              $set: { 
                agreementBlockchainTxId: blockchain.txId,
                agreementFileName: agreementResult.fileName
              }
            });
            console.log('✅ Agreement blockchain TX saved to bid record');
          }
        }
      } else {
        console.warn('⚠️ Could not fetch buyer/farmer details for agreement');
      }
    } catch (agreementError) {
      console.error('⚠️ Agreement generation failed (non-critical):', agreementError.message);
      // Continue without agreement - don't fail the bid
    }

    // Send response with agreement data
    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      bid: savedBid,
      agreementPath: agreementPath,
      blockchain: blockchain,
    });
  } catch (error) {
    console.error('❌ Bid placement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error placing bid',
      error: error.message,
    });
  }
};
exports.getBidsForCrop = async (req, res) => {
try {
const { cropId } = req.params;
const bids = await Bid.find({ cropListingId: cropId })
  .populate('buyerId', 'name email phone')
  .sort({ bidAmount: -1 });

res.status(200).json({
  success: true,
  bids,
});
} catch (error) {
res.status(500).json({
success: false,
message: 'Error fetching bids',
error: error.message,
});
}
};
exports.markBidAsWon = async (req, res) => {
try {
const { bidId } = req.params;
const { deliveryDays, shippingCost } = req.body;
const bid = await Bid.findById(bidId);
if (!bid) {
  return res.status(404).json({
    success: false,
    message: 'Bid not found',
  });
}

const estimatedDelivery = new Date();
estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

bid.bidStatus = 'won';
bid.winnerLogistics = {
  deliveryDays,
  shippingCost,
  estimatedDelivery,
};

const updatedBid = await bid.save();

await CropListing.findByIdAndUpdate(bid.cropListingId, { status: 'sold' });

res.status(200).json({
  success: true,
  message: 'Bid marked as won',
  bid: updatedBid,
  logisticsMessage: `Congratulations! Your delivery will arrive in ${deliveryDays} days (${estimatedDelivery.toDateString()}). Shipping cost: ₹${shippingCost}`,
});
} catch (error) {
res.status(500).json({
success: false,
message: 'Error marking bid as won',
error: error.message,
});
}
};
