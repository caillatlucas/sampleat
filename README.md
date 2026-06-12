# sampleat 🎵

A fully functional, modern, and interactive Drum Pad / Sampler web application built with **React**, **Vite**, **Tailwind CSS**, and **Tone.js**. 

This application uses a Neumorphic / Glassmorphic UI in Absolute Dark Mode to provide a premium, tactile, and low-latency digital instrument experience.

## Features

- **Upload & Play**: Drag and drop or click to upload local `.wav` or `.mp3` files to any pad.
- **Keyboard Mapped**: Play the pads like a real MPC using your keyboard (`1-4`, `Q-R`, `A-F`, `Z-V`).
- **Low Latency Audio**: Powered by **Tone.js** (Web Audio API) for instant playback.
- **Pad Settings**: Every pad has independent Loop, Pitch, and Volume controls via the `PadEditor`.
- **Master Controls**: Global BPM with Tap Tempo functionality.
- **Premium Design**: Absolute Dark Mode (`#000000`), Neumorphic 3D buttons, glossy accents, and smooth Framer Motion / CSS transitions.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`.

## Architecture & Code

- `src/utils/audioEngine.ts` : The core wrapper around Tone.js managing 16 independent Players and PitchShifters.
- `src/components/DrumPad.tsx` : Handles individual pad UI state, hotkeys, and file drops.
- `src/components/PadEditor.tsx` : The detailed inspector modal for modifying Pitch and Volume.
- `src/App.tsx` : Composes the UI and global state.

## Limitations (YouTube API)
Due to browser CORS restrictions, YouTube IFrame audio cannot be securely piped directly into the Web Audio API without an external proxy server. Local audio files provide the best zero-latency experience with full effect support.
