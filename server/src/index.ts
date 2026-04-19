import express from 'express';
import { config } from './config';
import { connectDB } from './db';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  await connectDB();
  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
}

start().catch(console.error);

export default app;
