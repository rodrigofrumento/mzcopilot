# MZ Copilot — CLAUDE.md

Guia de contexto e regras para o Claude Code trabalhar neste projeto.

---

## O que é este projeto

webapp local (localhost) de uso pessoal que serve como copiloto para o jogo **ManagerZone** (managerzone.com) — foco exclusivo em futebol, sem hóquei.

O app autentica no MZ via cookie de sessão, faz scraping das páginas do jogo e apresenta os dados de forma organizada para auxiliar decisões de gestão do time.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + Express |
| Scraping | Puppeteer (Chromium headless) |
| Banco de dados | SQLite (via better-sqlite3) |
| Frontend | React + Vite |
| Estilização | CSS modules ou Tailwind (decidir no início) |

- Backend roda na porta **3001**
- Frontend roda na porta **5173** (padrão Vite)
- Banco de dados: arquivo `db/mzcopilot.sqlite` na raiz do backend

---

## Estrutura de pastas

```
mz-copilot/
├── backend/
│   ├── scraper/        # Módulos Puppeteer por página do MZ
│   ├── sync/           # Agendador de sincronização
│   ├── db/             # SQLite: schema, migrations, queries
│   ├── api/            # Rotas Express REST
│   └── index.js        # Entry point do servidor
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Squad/       # Elenco + skills
│   │   │   ├── Training/    # Planner + histórico
│   │   │   ├── Youth/       # Juniores + potencial
│   │   │   └── Tactics/     # Visualização de táticas
│   │   ├── components/      # Componentes reutilizáveis
│   │   └── api/             # Chamadas ao backend
│   └── index.html
├── CLAUDE.md
└── README.md
```

---

## Modelo de dados

### Tabela: `players`
```sql
id              TEXT PRIMARY KEY   -- ID do MZ (ex: 235535622)
name            TEXT
number          INTEGER
age             INTEGER
birth_season    INTEGER
foot            TEXT               -- Left / Right / Both
height          INTEGER            -- cm
weight          INTEGER            -- kg
nationality     TEXT
value           INTEGER            -- em R$ do jogo
salary          INTEGER            -- em R$ do jogo
total_skill_balls INTEGER
is_youth        BOOLEAN            -- 0 = sênior, 1 = junior
training_area   TEXT               -- skill em que está treinando

-- 14 skills (valor numérico)
skill_speed             INTEGER
skill_stamina           INTEGER
skill_play_intelligence INTEGER
skill_passing           INTEGER
skill_shooting          INTEGER
skill_heading           INTEGER
skill_keeping           INTEGER
skill_ball_control      INTEGER
skill_tackling          INTEGER
skill_aerial_passing    INTEGER
skill_set_plays         INTEGER
skill_experience        INTEGER
skill_form              INTEGER

-- Potencial (apenas juniores — NULL para sênior)
-- Formato: H4, H3, H2, H1, L1, L2 por skill
-- H = High potential, L = Low potential
-- H4 → teto 8-10 | H3 → 7-9 | H2 → 6-8 | H1 → 6-7
-- L2 → 5-6       | L1 → 4-5
potential_speed             TEXT
potential_stamina           TEXT
potential_play_intelligence TEXT
potential_passing           TEXT
potential_shooting          TEXT
potential_heading           TEXT
potential_keeping           TEXT
potential_ball_control      TEXT
potential_tackling          TEXT
potential_aerial_passing    TEXT
potential_set_plays         TEXT

-- Training speed do junior (T1-T4)
training_speed  TEXT

last_synced_at  DATETIME
```

### Tabela: `training_log`
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
player_id   TEXT REFERENCES players(id)
log_date    DATE
skill       TEXT       -- nome da skill treinada
improved    BOOLEAN    -- 1 = subiu, 0 = treinou mas não subiu
day_of_week TEXT       -- Mon/Tue/Wed/Thu/Fri/Sat
```

### Tabela: `tactics`
```sql
id          TEXT PRIMARY KEY   -- A, B, C, D, E
name        TEXT
formation   TEXT               -- ex: 5-2-3
passing     TEXT               -- Wings / Mixed / Center
mentality   TEXT               -- Attacking / Normal / Defensive
pressing    TEXT               -- Hard / Normal / Soft
players     TEXT               -- JSON com posições e player_ids
updated_at  DATETIME
```

### Tabela: `sync_log`
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
synced_at   DATETIME
module      TEXT       -- squad / training / youth / tactics
status      TEXT       -- success / error
message     TEXT       -- detalhes do erro se houver
```

### Tabela: `session`
```sql
id          INTEGER PRIMARY KEY  -- sempre 1 (linha única)
cookie      TEXT                 -- valor do cookie de sessão do MZ
captured_at DATETIME
expires_at  DATETIME             -- estimativa; reconectar se expirado
```

---

## Autenticação com o MZ

- O app **nunca armazena senha** — apenas o cookie de sessão
- Fluxo: usuário insere usuário/senha na tela de configuração → Puppeteer faz login → cookie é extraído e salvo na tabela `session`
- Toda operação de scraping verifica se `expires_at` está no futuro antes de usar o cookie
- Se expirado: frontend exibe aviso "Sessão expirada — reconecte" e bloqueia sincronização
- Cookie estimado: tratar como válido por **7 dias** (conservador); ajustar conforme comportamento real do MZ

---

## Páginas do MZ usadas por módulo

| Módulo | URL | Método |
|---|---|---|
| Login | `/?p=clubhouse` | Puppeteer (POST form) |
| Elenco — Squad Summary | `/?p=players&sub=squad_summary&sport_id=1` | Scraping autenticado |
| Perfil de jogador | `/?p=players&pid={id}` | Scraping autenticado |
| Treino diário | `/?p=training&sub=reports&sport_id=1` | Scraping autenticado |
| Treino semanal | `/?p=training&sub=reports&sport_id=1&week=current` | Scraping autenticado |
| Táticas | `/?p=tactics&sport_id=1` | Scraping autenticado |
| XML jogadores (público) | `/xml/team_playerlist.php?sport_id=1&team_id={id}` | XML fetch |

---

## Regras de desenvolvimento

### Geral
- Sempre perguntar antes de tomar decisões de arquitetura que não estejam documentadas aqui
- Preferir soluções simples — é um app pessoal, não um SaaS
- Nunca usar `any` em TypeScript (se migrar para TS futuramente)
- Commits pequenos e descritivos

### Backend
- Todas as rotas da API devem ter prefixo `/api/v1/`
- Erros devem retornar `{ error: string, detail?: string }`
- Scraping deve ter timeout de 30s por operação
- Puppeteer deve rodar em modo headless (`headless: true`) exceto em debug
- Nunca fazer scraping em loop sem delay — mínimo 1s entre requisições para não ser bloqueado

### Frontend
- Componentes em PascalCase, arquivos em kebab-case
- Sem bibliotecas de UI pesadas (sem MUI, sem Ant Design) — preferir componentes próprios ou Tailwind
- Dados de skills exibidos como bolinhas (como no MZ) E como número — usuário escolhe a visualização
- Potencial dos juniores exibido com cor: H = verde, L = vermelho, T = azul

### Scraping
- Todo seletor CSS usado no scraping deve estar em `scraper/selectors.js` — nunca hardcoded na lógica
- Se o seletor quebrar (MZ atualizou o HTML), o erro deve ser claro: `"Seletor não encontrado: [nome]"`
- Scraping do Squad Summary é suficiente para elenco — não fazer scraping individual de cada jogador exceto para juniores (buscar potencial)

---

## MVP — módulos na ordem de desenvolvimento

1. **Auth** — tela de login, captura de cookie, validação de sessão
2. **Elenco** — Squad Summary scraping + listagem com skills
3. **Juniores** — Player Profile scraping + potencial H/L/T
4. **Treino** — Training Reports + histórico por jogador
5. **Táticas** — visualização da escalação atual (scraping da página de táticas)

---

## Contexto do jogo — regras importantes para o copiloto

### Skills (14 no total)
Speed, Stamina, Play Intelligence, Passing, Shooting, Heading, Keeping, Ball Control, Tackling, Aerial Passing, Set Plays, Experience, Form

### Potencial dos juniores
Cada junior tem até 3 indicadores visíveis no perfil:
- **High (H1-H4)**: skills com teto alto — prioridade de treino
  - H4 → teto 8-10 | H3 → 7-9 | H2 → 6-8 | H1 → 6-7
- **Low (L1-L2)**: skills com teto baixo — evitar treinar
  - L2 → 5-6 | L1 → 4-5
- **Training Speed (T1-T4)**: velocidade geral de evolução do jogador
  - T4 = evolui muito rápido | T1 = evolui devagar

### Posições e skills relevantes (referência para recomendações)
| Posição | Skills prioritárias |
|---|---|
| GK | Keeping, Aerial Passing, Speed |
| CB | Tackling, Heading, Speed |
| FB | Speed, Tackling, Stamina |
| MF | Passing, Ball Control, Stamina |
| WG | Speed, Ball Control, Passing |
| ST | Shooting, Heading, Speed |

### Estilo de jogo do usuário
- Preferência: **Jogar pelas Pontas + Ofensivo + Marcação Cerrada**
- Isso valoriza: Speed, Stamina, Ball Control, Tackling nos laterais/médios

---

## O que este app NÃO faz (fora do escopo)

- Hóquei — ignorar completamente
- Transferências (fase 2)
- Finanças (fase 2)
- Federações
- Resultados de partidas ao vivo
- Qualquer integração que exija assinatura paga do MZ (ex: Import/Export XML de táticas)
