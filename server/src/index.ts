import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { config } from './config.js';
import { connectDB } from './db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { setupWebSocketHandlers } from './websocket/handlers.js';
import authRoutes from './routes/auth.js';
import recipeRoutes from './routes/recipes.js';
import mealsRoutes from './routes/meals.js';
import adminRoutes from './routes/admin.js';

const app = express();
const server = http.createServer(app);
export const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
});

app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '20mb' }));

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
