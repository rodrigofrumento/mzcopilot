# MZ Copilot

Webapp local de uso pessoal que serve como copiloto para o jogo **ManagerZone** (managerzone.com) — foco em futebol.

Autentica no MZ via cookie de sessão, faz scraping das páginas do jogo e apresenta os dados de forma organizada para auxiliar decisões de gestão do time.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + Express (porta 3001) |
| Scraping | Puppeteer (Chromium headless) |
| Banco de dados | SQLite via `node-sqlite3-wasm` |
| Frontend | React + Vite (porta 5173) |

---

## Pré-requisitos

- Node.js v18+
- npm

---

## Instalação

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## Rodando

```bash
# Terminal 1 — backend
cd backend
node index.js
# ou: npm run dev  (com hot-reload via nodemon)

# Terminal 2 — frontend
cd frontend
npm run dev
```

Acesse: **http://localhost:5173**

---

## Primeiro acesso

1. Abra o app no browser
2. Insira seu usuário e senha do ManagerZone
3. O Puppeteer faz login automaticamente e salva o cookie de sessão
4. A sessão dura **7 dias** — após isso, reconecte

> Sua senha **não é armazenada**. Apenas o cookie de sessão é salvo no banco local.

---

## Estrutura

```
mz-copilot/
├── backend/
│   ├── api/            # Rotas Express REST (/api/v1/)
│   ├── db/             # SQLite: schema, queries por módulo
│   ├── scraper/        # Módulos Puppeteer + selectors.js
│   ├── sync/           # Agendador de sincronização
│   └── index.js        # Entry point (porta 3001)
├── frontend/
│   ├── src/
│   │   ├── api/        # Funções de chamada ao backend
│   │   ├── components/ # Componentes reutilizáveis
│   │   └── pages/      # Squad, Youth, Training, Tactics
│   └── index.html
└── db/                 # Arquivo mzcopilot.sqlite (gerado automaticamente)
```

---

## Módulos — status

| Módulo | Status |
|---|---|
| Auth — login + sessão | ✅ Feito |
| Elenco — Squad Summary | 🔲 Pendente |
| Juniores — potencial H/L/T | 🔲 Pendente |
| Treino — histórico por jogador | 🔲 Pendente |
| Táticas — visualização da escalação | 🔲 Pendente |

---

## .gitignore recomendado

```
node_modules/
db/mzcopilot.sqlite
```
