const express = require('express');
const router = express.Router();
const CropListing = require('../models/CropListing');

// Get all listings with locations
router.get('/map/listings', async (req, res) => {
  try {
    const listings = await CropListing.find({
      'location.latitude': { $exists: true },
      'location.longitude': { $exists: true },
      status: 'active'
    })
    .populate('farmerId', 'name phone rating')
    .limit(100);

    res.json({
      success: true,
      listings: listings.map(listing => ({
        id: listing._id,
        crop: listing.crop,
        grade: listing.grade,
        pricePerKg: listing.pricePerKg,
        quantityKg: listing.quantityKg,
        farmer: listing.farmerId,
        location: {
          lat: listing.location.latitude,
          lng: listing.location.longitude,
          address: listing.location.address,
          city: listing.location.city
        }
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find listings near location
router.get('/map/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 50, cropType } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const query = {
      'location.latitude': { $exists: true },
      'location.longitude': { $exists: true },
      status: 'active'
    };

    if (cropType) {
      query.crop = cropType;
    }

    const listings = await CropListing.find(query)
      .populate('farmerId', 'name phone rating');

    // Filter by distance (simple calculation)
    const nearbyListings = listings.filter(listing => {
      const distance = calculateDistance(
        parseFloat(lat), parseFloat(lng),
        listing.location.latitude, listing.location.longitude
      );
      return distance <= radius;
    });

    res.json({
      success: true,
      count: nearbyListings.length,
      listings: nearbyListings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * Math.PI / 180;
}

module.exports = router;
