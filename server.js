'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'leaderboard.json');
let board = [];
try { board = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); if (!Array.isArray(board)) board = []; } catch (e) {}
function saveBoard() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(board));
  } catch (e) {}
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'kart-rider.html')));
app.use('/img', express.static(path.join(__dirname, 'img'), { maxAge: '1d' }));

app.get('/api/health', (req, res) => res.json({ ok: true, entries: board.length }));

app.get('/api/leaderboard', (req, res) => {
  res.json(board.slice(0, 10));
});

app.post('/api/results', (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '루피').slice(0, 20);
  const charIdx = Number.isInteger(b.charIdx) ? Math.max(0, Math.min(3, b.charIdx)) : 0;
  const time = Number(b.time);
  const rank = Math.max(1, Math.min(4, Number(b.rank) || 4));
  if (!Number.isFinite(time) || time <= 0 || time > 3600) {
    return res.status(400).json({ error: 'invalid time' });
  }
  const entry = {
    name,
    charIdx,
    time: Math.round(time * 100) / 100,
    rank,
    at: new Date().toISOString()
  };
  board.push(entry);
  board.sort((a, b) => a.time - b.time);
  board = board.slice(0, 100);
  saveBoard();
  const bestRank = board.indexOf(entry) + 1;
  res.json({ ok: true, bestRank, total: board.length });
});

app.use((req, res) => res.status(404).json({ error: 'not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('loopy-kart server on :' + PORT));
