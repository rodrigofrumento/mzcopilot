const express = require('express');
const cors = require('cors');

// Inicializa o banco (cria tabelas se não existirem)
require('./db/schema');

const authRouter = require('./api/auth');
const squadRouter = require('./api/squad');

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/squad', squadRouter);

app.get('/api/v1/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
