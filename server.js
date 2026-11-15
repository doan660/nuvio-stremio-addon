"use strict";

const fs = require('fs');
const path = require('path');
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');

const manifest = require('./manifest.json');
const DATA_FILE = path.join(__dirname, 'streams.json');

function loadLibrary() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (error) {
    console.error('Could not read streams.json:', error.message);
    return { movies: {}, series: {} };
  }
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (typeof entry.url !== 'string') return null;

  let parsed;
  try {
    parsed = new URL(entry.url);
  } catch (_) {
    return null;
  }

  // Only serve HTTPS media URLs. Add only streams you own or are licensed to distribute.
  if (parsed.protocol !== 'https:') return null;

  const stream = {
    name: String(entry.name || 'Authorized source'),
    title: String(entry.title || 'Play'),
    url: parsed.toString()
  };

  if (entry.description) stream.description = String(entry.description);
  if (entry.behaviorHints && typeof entry.behaviorHints === 'object') {
    stream.behaviorHints = entry.behaviorHints;
  }

  return stream;
}

function parseSeriesId(id) {
  // Stremio episode IDs commonly look like tt1234567:1:2 (season 1, episode 2).
  const match = /^((?:tt)?\d+):(\d+):(\d+)$/.exec(String(id || ''));
  if (!match) return null;
  return {
    imdbId: match[1].startsWith('tt') ? match[1] : `tt${match[1]}`,
    season: Number(match[2]),
    episode: Number(match[3]),
    episodeKey: `${match[1].startsWith('tt') ? match[1] : `tt${match[1]}`}:${Number(match[2])}:${Number(match[3])}`
  };
}

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
  const library = loadLibrary();

  if (type === 'movie') {
    const imdbId = String(id || '').split(':')[0];
    const entries = library.movies && library.movies[imdbId];
    const streams = (Array.isArray(entries) ? entries : [])
      .map(normalizeEntry)
      .filter(Boolean);
    return { streams };
  }

  if (type === 'series') {
    const parsed = parseSeriesId(id);
    if (!parsed) return { streams: [] };

    const exactEntries = library.series && library.series[parsed.episodeKey];
    const seriesEntries = library.series && library.series[parsed.imdbId];
    const entries = Array.isArray(exactEntries)
      ? exactEntries
      : (Array.isArray(seriesEntries) ? seriesEntries : []);

    const streams = entries.map(normalizeEntry).filter(Boolean);
    return { streams };
  }

  return { streams: [] };
});

const port = Number(process.env.PORT) || 7000;
serveHTTP(builder.getInterface(), { port });
console.log(`Nuvio Legal Streams addon listening on port ${port}`);
