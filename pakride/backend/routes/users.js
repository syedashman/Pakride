const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const authMiddleware = require('../middleware/auth');

router.get('/profile', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone, role, rating, cnic_verified, created_at')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/profile', authMiddleware, async (req, res) => {
  const { name, phone } = req.body;

  const { data, error } = await supabase
    .from('users')
    .update({ name, phone })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Profile updated', user: data });
});

router.get('/stats', authMiddleware, async (req, res) => {
  const { data: rides } = await supabase
    .from('rides')
    .select('cost_pkr, distance_km, status')
    .or(`driver_id.eq.${req.user.id},rider_id.eq.${req.user.id}`)
    .eq('status', 'completed');

  const totalRides = rides ? rides.length : 0;
  const totalSaved = rides ? rides.reduce((sum, r) => sum + (r.cost_pkr || 0), 0) : 0;
  const totalKm = rides ? rides.reduce((sum, r) => sum + (r.distance_km || 0), 0) : 0;

  res.json({
    totalRides,
    totalMoneySavedPKR: Math.round(totalSaved * 0.5),
    totalKmTravelled: Math.round(totalKm),
    co2SavedKg: Math.round(totalKm * 0.12)
  });
});

module.exports = router;
