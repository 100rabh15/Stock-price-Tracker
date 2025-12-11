// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const axios = require('axios');
const { Server } = require('socket.io');

// connect to mongoose
const dbUtil = require('./utils/db'); // expects module with connect()
dbUtil.connect().catch(err => {
  console.error('Mongo connect failed at startup', err);
  // don't exit immediately so logs show; but you may want to process.exit(1) in prod
});

const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.FRONTEND_ORIGIN || '*' } });

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());

// install routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);

// basic health route
app.get('/health', (req, res) => res.json({ ok: true }));

// websocket connections
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('subscribe', (symbol) => {
    if (symbol) socket.join(symbol.toUpperCase());
  });
  socket.on('unsubscribe', (symbol) => {
    if (symbol) socket.leave(symbol.toUpperCase());
  });
});

// ---- Unified polling loop (ONLY ONE) ----
// This block is deliberately self-contained and uses unique names so it won't clash.
const User = require('./models/user'); // Mongoose model
const POLL_INTERVAL_MS = 15000; // 15s
let pollTimer = null;

async function fetchAndEmitPricesOnce() {
  try {
    const users = await User.find({}).exec();
    const allSymbols = new Set();
    for (const u of users || []) {
      if (u && Array.isArray(u.watchlist)) {
        u.watchlist.forEach(s => {
          if (s) allSymbols.add(s.toUpperCase());
        });
      }
    }

    const symbols = Array.from(allSymbols).slice(0, 5); // limit to avoid rate-limit
    const key = process.env.ALPHA_VANTAGE_API_KEY;
    if (!key) {
      console.warn('Alpha Vantage key not set; skipping polling.');
      return;
    }

    for (const symbol of symbols) {
      try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${key}`;
        const res = await axios.get(url, { timeout: 10000 });
        const quote = res.data && res.data['Global Quote'] ? res.data['Global Quote'] : {};
        const price = quote['05. price'] || null;
        const payload = { symbol, price, raw: quote, timestamp: Date.now() };
        io.to(symbol).emit('price_update', payload);
      } catch (innerErr) {
        console.error('Fetch error for', symbol, innerErr.message || innerErr);
      }
    }
  } catch (err) {
    console.error('Polling loop error', err && err.message ? err.message : err);
  }
}

// start polling only once
function startPollingIfNeeded() {
  if (!pollTimer) {
    pollTimer = setInterval(fetchAndEmitPricesOnce, POLL_INTERVAL_MS);
    // fire once immediately (catch unhandled)
    fetchAndEmitPricesOnce().catch(e => console.error('Initial fetch failed', e));
    console.log('Polling started, interval ms=', POLL_INTERVAL_MS);
  }
}

// Start the server after a tiny delay to allow DB connect logs to appear
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log('Server listening on port', PORT);
  // start polling once server is listening
  startPollingIfNeeded();
});

module.exports = { app, server, io };
