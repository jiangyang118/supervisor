import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const EMPLOYEES = [
  {
    userId: 'E001',
    name: '张三',
    post: '配餐员',
    portraitPhoto: '',
    healthNumber: 'HN-001',
    healthStartTime: '2025-01-01',
    healthEndTime: '2025-12-31',
    healthUrl: '',
    updateTime: new Date().toISOString(),
  },
  {
    userId: 'E002',
    name: '李四',
    post: '验收员',
    portraitPhoto: '',
    healthNumber: 'HN-002',
    healthStartTime: '2025-01-01',
    healthEndTime: '2025-12-31',
    healthUrl: '',
    updateTime: new Date().toISOString(),
  },
];

// Mock upstream: heartbeat
app.post('/device/morningChecker/heartBeatInfo', (req, res) => {
  return res.set('content-type', 'text/html;charset=UTF-8').send(
    JSON.stringify({ statusCode: 200, message: 'ok', success: true })
  );
});

// Mock upstream: employee list
app.get('/device/morningChecker/employeeList', (req, res) => {
  return res.json({ statusCode: 200, message: 'ok', data: EMPLOYEES });
});

const port = Number(process.env.PORT_DEVICE_MOCK || 4003);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[device-mock] listening on :${port}`);
});

export default app;

