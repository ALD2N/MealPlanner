import { ObjectId } from 'mongoose';

// ===== User =====
export interface IUser {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  isAdmin: boolean;
  createdAt?: Date;
}

export interface IUserResponse {
  _id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: Date;
}

// ===== Recipe =====
export interface IRecipeRating {
  userId: ObjectId;
  rating: 1 | 2 | 3 | 4 | 5;
}

export interface IRecipe {
  _id?: ObjectId;
  title: string;
  image?: string;
  ingredients: string[];
  steps: string[];
  author: ObjectId;
  tags: string[];
  ratings: IRecipeRating[];
  timesChosen: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRecipeResponse {
  _id: string;
  title: string;
  image?: string;
  ingredients: string[];
  steps: string[];
  author: IUserResponse;
  tags: string[];
  ratings: {
    userId: string;
    rating: 1 | 2 | 3 | 4 | 5;
  }[];
  timesChosen: number;
  createdAt: Date;
  updatedAt: Date;
}

// ===== MealSelection =====
export interface IMealSelection {
  _id?: ObjectId;
  recipe: ObjectId;
  selectedBy: ObjectId;
  date: Date;
  createdAt?: Date;
}

export interface IMealSelectionResponse {
  _id: string;
  recipe: IRecipeResponse;
  selectedBy: IUserResponse;
  date: Date;
  createdAt: Date;
}

// ===== InviteLink =====
export interface IInviteLink {
  _id?: ObjectId;
  token: string;
  createdBy: ObjectId;
  expiresAt: Date;
  usedCount: number;
  createdAt?: Date;
}

export interface IInviteLinkResponse {
  token: string;
  url: string;
  expiresAt: Date;
  usedCount: number;
  createdBy?: IUserResponse;
  createdAt?: Date;
}

// ===== API Responses =====
export interface IAPIError {
  error: string;
  code: string;
  statusCode: number;
}

export interface IAuthResponse {
  token: string;
  user: IUserResponse;
}

export interface ICurrentMealResponse {
  meal: IMealSelectionResponse | null;
}

// ===== WebSocket Events =====
export interface IWebSocketPayloads {
  'meal:selected': {
    recipe: IRecipeResponse;
    selectedBy: IUserResponse;
    date: Date;
  };
  'recipe:added': {
    recipe: IRecipeResponse;
  };
  'recipe:updated': {
    recipe: IRecipeResponse;
  };
  'recipe:deleted': {
    recipeId: string;
  };
  'rating:added': {
    recipeId: string;
    userId: string;
    rating: 1 | 2 | 3 | 4 | 5;
  };
}
