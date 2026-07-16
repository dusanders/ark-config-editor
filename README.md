# ARK Config Editor

ARK Config Editor is a browser-based tool for working with ARK: Survival Evolved configuration files. It helps you upload, inspect, edit, and download Game.ini and GameUserSettings.ini files without needing to hand-edit raw INI content.

## What this project does

This app provides a simple workflow for ARK server config management:

- Create or upload a Game.ini file
- Create or upload a GameUserSettings.ini file
- Edit settings through a structured interface
- Add NPC replacement entries with the spawn replacer helper
- Apply difficulty override helpers for user settings
- Download the updated INI files for use in your server setup

## Features

- Supports editing common ARK config sections and values
- Includes sample INI files to get started quickly
- Provides helpers for advanced config tasks such as spawn replacement and difficulty overrides
- Runs as a Vite + React web app

## Tech stack

- React
- TypeScript
- Vite
- ESLint

## Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

## Build

Create a production build:

```bash
npm run build
```

## Deploy

Deploy the app to GitHub Pages:

```bash
npm run deploy
```

The deployment script builds the app and publishes the contents of the dist folder using gh-pages.

## Project structure

- src/components: UI components for the different config editors and helpers
- src/services: INI parsing, upload, and download logic
- src/assets: example INI files used as starting points
