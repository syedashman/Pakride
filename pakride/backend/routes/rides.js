const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const authMiddleware = require('../middleware/auth');

router.post('/offer', authMiddleware, async (req, res) => {
  const { pickup_address, drop_address, pickup_lat, pickup_lng, drop_lat, drop_lng, seats_available, departure_time, cost_pkr } = req.body;

  if (!pickup_lat || !pickup_lng || !drop_lat || !drop_lng) {
    return res.status(400).json({ error: 'Coordinates required' });
  }

  const { data, error } = await supabase
    .from('rides')
    .insert([{
      driver_id: req.user.id,
      pickup_address,
      drop_address,
      pickup_lat,
      pickup_lng,
      drop_lat,
      drop_lng,
      seats_available: seats_available || 3,
      seats_booked: 0,
      departure_time,
      cost_pkr: cost_pkr || 0,
      status: 'open'
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Ride offered successfully', ride: data });
});

router.get('/available', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('rides')
    .select('*, users!driver_id(name, rating, phone)')
    .eq('status', 'open')
    .gt('seats_available', 0)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:rideId/book', authMiddleware, async (req, res) => {
  const { rideId } = req.params;

  const { data: ride, error: fetchErr } = await supabase
    .from('rides')
    .select('*')
    .eq('id', rideId)
    .single();

  if (fetchErr || !ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.seats_available < 1) return res.status(400).json({ error: 'No seats available' });
  if (ride.driver_id === req.user.id) return res.status(400).json({ error: 'Cannot book your own ride' });

  const { data: booking, error: bookErr } = await supabase
    .from('bookings')
    .insert([{ ride_id: rideId, rider_id: req.user.id, status: 'confirmed' }])
    .select()
    .single();

  if (bookErr) return res.status(500).json({ error: bookErr.message });

  await supabase
    .from('rides')
    .update({ seats_available: ride.seats_available - 1, seats_booked: ride.seats_booked + 1 })
    .eq('id', rideId);

  res.json({ message: 'Ride booked successfully!', booking });
});

router.get('/my-rides', authMiddleware, async (req, res) => {
  const { data: offered } = await supabase
    .from('rides')
    .select('*')
    .eq('driver_id', req.user.id)
    .order('created_at', { ascending: false });

  const { data: booked } = await supabase
    .from('bookings')
    .select('*, rides(*)')
    .eq('rider_id', req.user.id)
    .order('created_at', { ascending: false });

  res.json({ offered: offered || [], booked: booked || [] });
});

router.put('/:rideId/complete', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('rides')
    .update({ status: 'completed' })
    .eq('id', req.params.rideId)
    .eq('driver_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Ride completed!', ride: data });
});

router.post('/:rideId/rate', authMiddleware, async (req, res) => {
  const { score, comment, ratee_id } = req.body;
  const { rideId } = req.params;

  if (score < 1 || score > 5) return res.status(400).json({ error: 'Score must be 1-5' });

  const { data, error } = await supabase
    .from('ratings')
    .insert([{ ride_id: rideId, given_by: req.user.id, ratee_id, score, comment }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const { data: allRatings } = await supabase
    .from('ratings')
    .select('score')
    .eq('ratee_id', ratee_id);

  if (allRatings && allRatings.length > 0) {
    const avg = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
    await supabase.from('users').update({ rating: Math.round(avg * 10) / 10 }).eq('id', ratee_id);
  }

  res.json({ message: 'Rating submitted!', rating: data });
});

module.exports = router;
