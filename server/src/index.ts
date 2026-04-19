import express from 'express';
import { config } from './config';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

export default app;
