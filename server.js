const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL manquant : ajoute une base PostgreSQL dans Render.');
  process.exit(1);
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});
app.disable('x-powered-by');
app.use(express.json({ limit: '20mb' }));
// Mode maintenance activable dans Render avec MAINTENANCE_MODE=true.
// La route de santé reste accessible pour permettre le contrôle du service.
app.use((req, res, next) => {
  const maintenance = String(process.env.MAINTENANCE_MODE || '').toLowerCase() === 'true';
  if (!maintenance || req.path === '/api/health') return next();
  res.status(503).set('Retry-After', '300').sendFile(path.join(__dirname, '404.html'));
});
app.use(express.static(path.join(__dirname), { index: false, setHeaders(res, filePath) { if (filePath.toLowerCase().endsWith('.pdf')) { res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Cache-Control', 'public, max-age=300'); } } }));
// Alias stables pour le guide : les liens fonctionnent même depuis une route interne.
const guidePath = path.join(__dirname, 'Guide_utilisateur_GS_SIGMA.pdf');
app.get(['/Guide_utilisateur_GS_SIGMA.pdf', '/guide-utilisateur.pdf', '/guide.pdf'], (_req, res) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Content-Disposition', 'inline; filename="Guide_utilisateur_GS_SIGMA.pdf"');
  res.set('Cache-Control', 'no-store');
  res.type('application/pdf');
  res.sendFile(guidePath, (err) => {
    if (err && !res.headersSent) res.status(err.statusCode || 404).type('text').send('Guide PDF introuvable. Vérifiez que Guide_utilisateur_GS_SIGMA.pdf est à la racine du projet Render.');
  });
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sigma_shared_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, service: 'GS SIGMA' }); }
  catch (_) { res.status(503).json({ ok: false }); }
});
app.get('/api/shared-db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT payload, updated_at FROM sigma_shared_state WHERE id=1');
    res.set('Cache-Control', 'no-store');
    res.json(result.rows.length ? result.rows[0].payload : null);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Lecture de la base impossible.' }); }
});
app.put('/api/shared-db', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Format de base invalide.' });
    }
    const raw = JSON.stringify(req.body);
    if (Buffer.byteLength(raw, 'utf8') > 15 * 1024 * 1024) {
      return res.status(413).json({ error: 'La base dépasse la taille autorisée (15 Mo).' });
    }
    await pool.query(
      `INSERT INTO sigma_shared_state(id,payload,updated_at) VALUES(1,$1::jsonb,NOW())
       ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload, updated_at=NOW()`,
      [raw]
    );
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Enregistrement de la base impossible.' }); }
});
app.get('/404', (_req, res) => res.status(404).sendFile(path.join(__dirname, '404.html')));
app.get('*', (_req, res) => res.status(404).sendFile(path.join(__dirname, '404.html'), (err) => {
  if (err && !res.headersSent) res.status(404).type('text').send('Page introuvable (404).');
}));
init().then(() => app.listen(port, () => console.log(`GS SIGMA prêt sur le port ${port}`)))
  .catch(e => { console.error('Initialisation PostgreSQL impossible', e); process.exit(1); });
