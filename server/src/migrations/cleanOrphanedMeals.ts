import mongoose from 'mongoose';
import { MealSelection } from '../models/MealSelection.js';
import { Recipe } from '../models/Recipe.js';
import { User } from '../models/User.js';
import { config } from '../config.js';

async function cleanOrphanedMeals() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Find all confirmed meals
    const meals = await MealSelection.find({ status: 'confirmed' });
    console.log(`Found ${meals.length} confirmed meals`);

    let deleted = 0;
    let errors = 0;

    // Check each meal for orphaned references
    for (const meal of meals) {
      const recipe = await Recipe.findById(meal.recipe);
      const user = await User.findById(meal.selectedBy);

      if (!recipe || !user) {
        console.log(
          `Deleting orphaned meal ${meal._id.toString()} (recipe: ${recipe ? '✓' : '✗'}, user: ${user ? '✓' : '✗'})`
        );
        try {
          await MealSelection.deleteOne({ _id: meal._id });
          deleted++;
        } catch (err) {
          console.error(`Error deleting meal ${meal._id}: ${err}`);
          errors++;
        }
      }
    }

    console.log(`\n✓ Migration complete:`);
    console.log(`  - Meals checked: ${meals.length}`);
    console.log(`  - Meals deleted: ${deleted}`);
    console.log(`  - Errors: ${errors}`);

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    process.exit(errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

cleanOrphanedMeals();
