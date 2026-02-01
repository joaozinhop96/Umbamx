# Tokyo Ghoul RPG — Ficha de Personagem

Sistema interativo de ficha de personagem para o Tokyo Ghoul RPG v3.5.

## Features

- Modo Mestre / Jogador
- Fichas multiplas via sidebar
- 8 separadores: Perfil, Atributos, Pericias, Kagune/Quinques, Habilidades, Inventario, Historia, Log
- Calculos automaticos em tempo real (HP, Stamina, RC, Defesa, Iniciativa)
- Bonus de Kagune automaticos

## Como executar localmente

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Deploy na Vercel

1. Login em vercel.com
2. Add New > Project
3. Liga conta do GitHub ou faz upload desta pasta
4. Deploy — a Vercel detecta automaticamente Vite + React

## Estrutura

```
tokyo-ghoul-rpg/
├── index.html
├── vite.config.js
├── package.json
├── public/favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    └── index.css
```
