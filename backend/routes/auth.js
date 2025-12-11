const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

module.exports = router;

// register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    const exist = await User.findOne({ email }).exec();
    if (exist) return res.status(400).json({ error: 'user exists' });
    const hash = await bcrypt.hash(password, 8);
    const user = new User({ email, password: hash });
    await user.save();
    const token = jwt.sign({ id: user._id.toString(), email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, watchlist: user.watchlist } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    const user = await User.findOne({ email }).exec();
    if (!user) return res.status(400).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'invalid credentials' });
    const token = jwt.sign({ id: user._id.toString(), email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, watchlist: user.watchlist } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// get me
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'unauth' });
  const token = auth.replace('Bearer ', '');
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(data.id).exec();
    if (!user) return res.status(404).json({ error: 'not found' });
    return res.json({ user: { id: user._id, email: user.email, watchlist: user.watchlist }});
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
});
