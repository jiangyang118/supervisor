import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type { RegulatedCheck } from './types';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

const store: { list: RegulatedCheck[] } = { list: [] };

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/regulator/morning-checks/push', (req, res) => {
  const id = `rg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const rec: RegulatedCheck = {
    id,
    schoolId: req.body?.schoolId,
    schoolName: req.body?.schoolName,
    payload: req.body,
    receivedAt: new Date().toISOString(),
  };
  store.list.push(rec);
  return res.json({ success: true, id });
});

app.get('/api/regulator/morning-checks', (_req, res) => {
  res.json({ data: store.list });
});

const port = Number(process.env.PORT_REGULATOR || 4002);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[regulator-api] listening on :${port}`);
});

export default app;

