import axios from 'axios';
import { config } from '../config';
import { IRecipeResponse } from '@dndmeal/shared';

export interface IDiscordUser {
  _id: string;
  name: string;
}

export class DiscordService {
  static async notifyMealSelected(
    user: IDiscordUser,
    recipe: IRecipeResponse
  ): Promise<void> {
    if (!config.DISCORD_WEBHOOK_URL) {
      console.log('Discord webhook not configured, skipping notification');
      return;
    }

    try {
      const embed = {
        title: '🍽️ Repas sélectionné!',
        color: 13876000, // Soleil color (#d4a017)
        fields: [
          {
            name: 'Recette',
            value: recipe.title,
            inline: false,
          },
          {
            name: 'Sélectionné et préparé par',
            value: user.name,
            inline: false,
          },
          {
            name: 'Lien',
            value: `[Voir la recette](${config.CORS_ORIGIN}/recipes/${recipe._id})`,
            inline: false,
          },
        ],
        image: recipe.image
          ? {
              url: recipe.image,
            }
          : undefined,
      };

      await axios.post(config.DISCORD_WEBHOOK_URL, {
        embeds: [embed],
      });
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
      // Don't throw; webhook failure shouldn't fail the meal selection
    }
  }
}
