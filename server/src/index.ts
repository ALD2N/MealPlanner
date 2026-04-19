import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { config } from './config';
import { connectDB } from './db';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { setupWebSocketHandlers } from './websocket/handlers';
import authRoutes from './routes/auth';
import recipeRoutes from './routes/recipes';
import mealsRoutes from './routes/meals';
import adminRoutes from './routes/admin';

const app = express();
const server = http.createServer(app);
export const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/recipes', recipeRoutes);
app.use('/meals', mealsRoutes);
app.use('/admin', adminRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Setup WebSocket handlers
setupWebSocketHandlers(io);

async function start() {
  await connectDB();
  server.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
}

start().catch(console.error);

export default app;
