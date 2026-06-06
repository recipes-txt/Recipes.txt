export interface CookingNote {
  id: string;
  text: string;
  timestamp: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  emoji?: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  tags?: string[];
  sourceUrl?: string;
  notes: CookingNote[];
  savedAt: string;
  isFavorite?: boolean;
}

export interface FamilyRecipe {
  id: string;
  title: string;
  contributor: string;
  relationship: string;
  familyStory: string;
  decade?: string;
  ingredients: string[];
  instructions: string[];
  notes: CookingNote[];
  savedAt: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}
