# Nuvio Legal Streams — Stremio Addon

A small Stremio-protocol **stream addon** intended for clients that support Stremio addons, including Nuvio where compatible.

It supports:
- `movie` IDs (IMDb IDs such as `tt1234567`)
- `series` episode IDs (for example `tt1234567:1:2`)
- Direct HTTPS stream URLs that you own or are authorized to distribute

It does **not** scrape streaming sites, bypass DRM, unlock paid services, or provide pirated links. The repository starts with an empty source library; add only lawful media URLs.

## Files

- `manifest.json` — addon declaration
- `server.js` — Stremio SDK server and stream handler
- `streams.json` — your authorized stream mapping
- `package.json` — Node.js dependencies and start command

## 1. Add your authorized streams

Edit `streams.json`.

Movie example:
```json
{
  "movies": {
    "tt1254207": [
      {
        "name": "My licensed source",
        "title": "1080p",
        "url": "https://media.example.org/path/movie.mp4"
      }
    ]
  },
  "series": {}
}
```

Series episode example:
```json
{
  "movies": {},
  "series": {
    "tt1234567:1:2": [
      {
        "name": "My licensed source",
        "title": "Season 1 · Episode 2",
        "url": "https://media.example.org/path/episode-02.mp4"
      }
    ]
  }
}
```

Use the IMDb ID that the client sends. For series, the key format is `imdbId:season:episode`, such as `tt1234567:1:2`. You can also use the base series ID as a fallback key, but that will return the same stream list for every episode of that series.

Only `https://` URLs are accepted by the server. The URL must be a direct playable media URL, not a webpage that embeds a player. The addon does not host or proxy the media.

## 2. Test locally

Install Node.js 18 or newer, then run:

```bash
npm install
npm start
```

Open:
- `http://localhost:7000/manifest.json`
- `http://localhost:7000/stream/movie/tt1254207.json`
- `http://localhost:7000/stream/series/tt1234567%3A1%3A2.json`

The stream test returns an empty list until you add a matching authorized entry to `streams.json`.

## 3. Publish the source to GitHub

1. Create a new **public** repository on GitHub.
2. Upload all four files (`manifest.json`, `server.js`, `package.json`, `streams.json`) to the repository root.
3. Commit the changes.

GitHub stores the source code. It does not run this Node.js server, so GitHub Pages alone cannot provide the live addon API.

## 4. Deploy the Node.js server on Render

1. Sign in to Render and choose **New → Web Service**.
2. Connect the GitHub repository you just created.
3. Set:
   - Runtime: `Node`
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: Free (if available for your account/region)
4. Create the service and wait for deployment.
5. Render will assign a public HTTPS address, for example `https://your-addon-name.onrender.com`.

Free web services may sleep after inactivity, so the first request after a quiet period can take longer. Check Render's current plan limits before relying on it for continuous use.

## 5. Install in Nuvio

Open this address in a browser first:

`https://YOUR-SERVICE.onrender.com/manifest.json`

Replace `YOUR-SERVICE` with the actual Render hostname. You should see the JSON manifest.

Then in Nuvio, open its Addons area and choose the option to add an addon by URL. Paste the full HTTPS manifest URL. The exact menu wording can vary by Nuvio version.

## 6. Updating the addon

Whenever you change `streams.json` or the source code:
1. Commit and push to GitHub.
2. Wait for Render to redeploy.
3. Re-open the manifest URL to verify the service is online.
4. Refresh or reopen Nuvio.

## Troubleshooting

- **Application failed to respond:** check the Render deployment logs and confirm the start command is `npm start`.
- **Manifest opens but no streams appear:** confirm the IMDb ID and episode key match the requested item, and that the URL is a direct HTTPS media file.
- **Playback fails:** the media host may block the client, require cookies/headers, use an unsupported codec, or no longer provide the file.
- **Addon won't install:** verify the manifest URL uses HTTPS and ends in `/manifest.json`.

## References

- Official Stremio Addon SDK: https://github.com/Stremio/stremio-addon-sdk
- Stremio Addon Protocol: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/protocol.md
- Render deployment guide: https://render.com/docs/your-first-deploy
