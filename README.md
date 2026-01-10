# Modulr Wallet (Browser Extension)

Modulr Wallet is a Chrome/Chromium browser extension (MV3) built with React + Vite + TypeScript.

## Features (MVP)

- Encrypted local vault (password unlock)
- Account generation/import (seed phrase) + JSON export
- Send transfer transactions via node API
- Full-screen (tab) mode

## Prerequisites

- Node.js + npm

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

The build output is in `dist/`.

## Load into Chrome (unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

## Configure node URL

Open the wallet → **Settings** → set your node URL (default: `http://localhost:7332`).
