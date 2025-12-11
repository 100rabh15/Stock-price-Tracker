const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// middleware to get user
async function auth(req,res,next){
  const token = (req.headers.authorization||'').replace('Bearer ','');
  if (!token) return res.status(401).json({ error: 'unauth' });
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(data.id).exec();
    if (!user) return res.status(401).json({ error: 'unauth' });
    req.user = user;
    next();
  } catch(e){
    return res.status(401).json({ error: 'invalid token' });
  }
}

// search symbol using Alpha Vantage SYMBOL_SEARCH
router.get('/search', async (req,res)=>{
  const q = req.query.q;
  if (!q) return res.json({ matches: [] });
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return res.status(500).json({ error: 'missing API key' });
  const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(q)}&apikey=${key}`;
  const r = await axios.get(url);
  const matches = r.data.bestMatches || [];
  const parsed = matches.map(m=>({
    symbol: m['1. symbol'],
    name: m['2. name'],
    region: m['4. region']
  }));
  res.json({ matches: parsed });
});

// get historical daily (TIME_SERIES_DAILY_ADJUSTED)
router.get('/history/:symbol', async (req,res)=>{
  const symbol = req.params.symbol;
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return res.status(500).json({ error: 'missing API key' });
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${key}`;
  const r = await axios.get(url);
  const data = r.data['Time Series (Daily)'] || {};
  const series = Object.keys(data).slice(0,90).map(date=>({ date, ...data[date] })).reverse();
  res.json({ series });
});

// watchlist CRUD
router.get('/watchlist', auth, async (req,res)=>{
  const user = await User.findById(req.user._id).exec();
  res.json({ watchlist: user.watchlist || [] });
});

router.post('/watchlist', auth, async (req,res)=>{
  const symbol = req.body.symbol;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  const user = await User.findById(req.user._id).exec();
  user.watchlist = Array.from(new Set([...(user.watchlist||[]), symbol.toUpperCase()]));
  await user.save();
  res.json({ watchlist: user.watchlist });
});

router.delete('/watchlist/:symbol', auth, async (req,res)=>{
  const symbol = req.params.symbol.toUpperCase();
  const user = await User.findById(req.user._id).exec();
  user.watchlist = (user.watchlist||[]).filter(s=>s!==symbol);
  await user.save();
  res.json({ watchlist: user.watchlist });
});

module.exports = router;
