const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const authMiddleware = require('../middleware/auth');
const axios = require('axios');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

router.post('/find', authMiddleware, async (req, res) => {
  const { pickup_lat, pickup_lng, drop_lat, drop_lng } = req.body;

  if (!pickup_lat || !pickup_lng || !drop_lat || !drop_lng) {
    return res.status(400).json({ error: 'All coordinates required' });
  }

  const { data: openRides, error } = await supabase
    .from('rides')
    .select('*, users!driver_id(name, rating, phone)')
    .eq('status', 'open')
    .gt('seats_available', 0);

  if (error) return res.status(500).json({ error: error.message });
  if (!openRides || openRides.length === 0) return res.json({ matches: [] });

  try {
    const aiResponse = await axios.post(`${AI_ENGINE_URL}/match`, {
      rider: { pickup_lat, pickup_lng, drop_lat, drop_lng },
      rides: openRides
    });
    return res.json({ matches: aiResponse.data.matches });
  } catch (aiError) {
    const matches = openRides
      .map(ride => {
        const d1 = haversine(pickup_lat, pickup_lng, ride.pickup_lat, ride.pickup_lng);
        const d2 = haversine(drop_lat, drop_lng, ride.drop_lat, ride.drop_lng);
        const score = Math.max(0, 100 - (d1 + d2) * 10);
        return { ...ride, match_score: Math.round(score) };
      })
      .filter(r => r.match_score > 40)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5);

    return res.json({ matches, note: 'Basic matching used (AI engine offline)' });
  }
});

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = router;
