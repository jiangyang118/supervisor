import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router } from './routes';

const app = express();
app.use(cors());
app.use(router);

const port = Number(process.env.PORT_SCHOOL || 4001);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[school-api] listening on :${port}`);
});

export default app;

