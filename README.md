# SideQuest

SideQuest is a retro mini-arcade built as part of my portfolio. It turns a simple portfolio interaction into a playable experience where visitors can explore mini-games, sign in, save scores, build streaks, and compete on leaderboards.

The project was created to show that I do not only design interfaces — I build interactive digital products with real functionality, playful UX, authentication, game logic, and cloud-based data.

---

## Live Site

[Visit SideQuest](https://dseikou-side-quest.netlify.app)

---

## Portfolio

[View Main Portfolio](https://portfolio.dseikou.co.za/)

---

## Features

- Retro pixel-inspired interface
- Mobile-friendly game layout
- Firebase authentication
- Player profiles
- Personal best scores
- Global leaderboards
- Daily streak tracking
- Multiple playable mini-games
- Phaser-powered game scenes
- Responsive Next.js app
- Deployed on Netlify

---

## Games

### Flappy Bird

Fly through the pipes and survive as long as possible.

### Block Blast

Place blocks, clear lines, and keep the board alive.

### Tetris

Stack falling blocks and clear rows for the highest score.

### Snake

Eat, grow, and avoid crashing into yourself or the walls.

### 2048

Merge matching tiles to build the biggest number possible.

### Ballz

Aim balls, break bricks, and stop them from reaching the bottom.

---

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Phaser
- Zustand
- Firebase Auth
- Firebase Firestore
- Netlify

---

## Project Structure

```txt
side-quests
├── app
│   ├── games
│   │   └── [slug]
│   │       └── page.tsx
│   ├── leaderboard
│   │   └── page.tsx
│   ├── profile
│   │   └── page.tsx
│   ├── login
│   │   └── page.tsx
│   ├── signup
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components
│   ├── auth
│   ├── game
│   ├── leaderboard
│   ├── profile
│   └── ui
│
├── config
│   └── games.ts
│
├── firebase
│   ├── auth.ts
│   ├── config.ts
│   ├── leaderboard.ts
│   ├── score.ts
│   ├── streak.ts
│   ├── streakLeaderboard.ts
│   └── user.ts
│
├── phaser
│   ├── ballz
│   ├── blockblast
│   ├── flappy
│   ├── snake
│   ├── tetris
│   └── twenty48
│
├── store
│   └── authStore.ts
│
├── types
│   └── game.ts
│
└── utils
    └── authState.ts
