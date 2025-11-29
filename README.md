# Mushland Game

A strategic card game where you cultivate mushrooms and manage resources in different habitats.

## Overview

Mushland is an interactive deck-building card game built with React and TypeScript. Manage your resources (Worms and Spores), strategically place mushroom cards in different habitats (Forest, Log, Soil), and maximize your score.

## Features

- **Dynamic Card Game**: Draw, play, and manage cards with unique abilities
- **Three Habitats**: Place cards strategically in Forest, Log, and Soil habitats
- **Resource Management**: Earn and spend Worms (nutrients) and Spores
- **Interactive UI**: Smooth drag-and-drop mechanics with visual feedback
- **Card Preview**: Hover over cards in hand to see detailed descriptions and special abilities
- **Background Music**: Immersive audio experience with background theme music

## Getting Started

### Prerequisites

- Node.js 20+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts the development server with hot module reloading. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

Produces an optimized production build in the `dist/` directory.

### Preview

```bash
npm preview
```

Preview the production build locally before deploying.

## Deployment

This project is configured to deploy automatically to GitHub Pages via GitHub Actions. Simply push to the `main` branch and the workflow will:

1. Build the project
2. Run tests and linting
3. Deploy to GitHub Pages

Your live site will be available at: `https://jwdomes.github.io/mushland-game/`

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **CSS3** - Styling with gradients and animations

## Game Mechanics

### Cards

Each mushroom card has:
- **Cost**: Worm cost to play
- **Points**: Victory points when played
- **Ability**: Special effect when played (draw card, gain resources, etc.)

### Habitats

Three distinct habitats with unique visual themes:
- **Forest** - Green habitat
- **Log** - Brown habitat  
- **Soil** - Dark brown habitat

### Resources

- **Worms (🐛)**: Currency for playing cards
- **Spores (✿)**: Secondary resource for card abilities

## License

MIT
