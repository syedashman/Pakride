const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');

router.post('/register', async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password || !phone || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, password: hashedPassword, phone, role, rating: 5.0, cnic_verified: false }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const token = jwt.sign(
    { id: data.id, email: data.email, role: data.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ message: 'Registered successfully', token, user: { id: data.id, name: data.name, email: data.email, role: data.role } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) return res.status(401).json({ error: 'Invalid email or password' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, rating: user.rating } });
});

module.exports = router;
