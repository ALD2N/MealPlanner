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

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

export const io = new SocketIOServer(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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

async function cleanOrphanedMeals() {
  try {
    const { MealSelection } = await import('./models/MealSelection.js');
    const { Recipe } = await import('./models/Recipe.js');
    const { User } = await import('./models/User.js');

    const meals = await MealSelection.find({ status: 'confirmed' });
    let deleted = 0;

    for (const meal of meals) {
      const recipe = await Recipe.findById(meal.recipe);
      const user = await User.findById(meal.selectedBy);

      if (!recipe || !user) {
        await MealSelection.deleteOne({ _id: meal._id });
        deleted++;
      }
    }

    if (deleted > 0) {
      console.log(`✓ Cleaned ${deleted} orphaned meal(s)`);
    }
  } catch (error) {
    console.error('Error cleaning orphaned meals:', error);
  }
}

async function start() {
  await connectDB();
  await cleanOrphanedMeals();
  server.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
}

start().catch(console.error);

export default app;
