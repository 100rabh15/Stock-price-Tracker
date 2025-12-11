require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');

const app = express();

// connect to MongoDB Atlas (or local Mongo)
const db = require('./utils/db');
db.connect();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.FRONTEND_ORIGIN || '*' } });

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());

// Simple in-memory "db" via lowdb file
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  // client can join rooms for specific stocks
  socket.on('subscribe', (symbol) => {
    socket.join(symbol);
  });
  socket.on('unsubscribe', (symbol) => {
    socket.leave(symbol);
  });
});

// --- Replace existing polling loop with this block ---
const axios = require('axios');
const User = require('./models/user');

const POLL_INTERVAL_MS = 15000; // 15s
let pollTimer = null;

async function fetchAndEmitPrices() {
  try {
    const users = await User.find({}).exec();
    const allSymbols = new Set();
    for (const u of users) {
      (u.watchlist || []).forEach(s => allSymbols.add(s));
    }
    const symbols = Array.from(allSymbols).slice(0, 5); // limit to 5 to avoid rate limits
    const key = process.env.ALPHA_VANTAGE_API_KEY;
    if (!key) return;
    for (const s of symbols) {
      try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(s)}&apikey=${key}`;
        const res = await axios.get(url);
        const quote = res.data['Global Quote'] || {};
        const price = quote['05. price'] || null;
        const payload = { symbol: s, price, raw: quote, timestamp: Date.now() };
        io.to(s).emit('price_update', payload);
      } catch (innerErr) {
        console.error('Error fetching price for', s, innerErr.message || innerErr);
      }
    }
  } catch (err) {
    console.error('Polling error', err.message || err);
  }
}

// Start polling after server start
if (!pollTimer) {
  pollTimer = setInterval(fetchAndEmitPrices, POLL_INTERVAL_MS);
}



const fetchInterval = 15000;
let subscriptions = new Set();

// Track subscriptions by reading from DB watchlists periodically (keeps example simple)
setInterval(async () => {
  try {
    const users = db.get('users').value() || [];
    const allSymbols = new Set();
    for (const u of users) {
      (u.watchlist||[]).forEach(s=>allSymbols.add(s));
    }
    const symbols = Array.from(allSymbols).slice(0,5); // limit to 5 to avoid API throttling in free tier
    for (const s of symbols) {
      // fetch quote from Alpha Vantage
      const key = process.env.ALPHA_VANTAGE_API_KEY;
      if (!key) continue;
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(s)}&apikey=${key}`;
      const res = await axios.get(url);
      const quote = res.data['Global Quote'] || {};
      const price = quote['05. price'] || null;
      const payload = { symbol: s, price, raw: quote, timestamp: Date.now() };
      io.to(s).emit('price_update', payload);
    }
  } catch (e) {
    console.error('Polling error', e.message);
  }
}, fetchInterval);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log('Server running on port', PORT));
