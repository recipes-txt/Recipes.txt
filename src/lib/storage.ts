import { Recipe, FamilyRecipe, CookingNote } from '../types';
import { sampleRecipes, sampleFamilyRecipes } from './sampleData';

const VAULT_KEY = 'recipes_txt_vault';
const FAMILY_KEY = 'recipes_txt_family';
const INIT_KEY = 'recipes_txt_initialized';

const init = () => {
  if (!localStorage.getItem(INIT_KEY)) {
    localStorage.setItem(VAULT_KEY, JSON.stringify(sampleRecipes));
    localStorage.setItem(FAMILY_KEY, JSON.stringify(sampleFamilyRecipes));
    localStorage.setItem(INIT_KEY, 'true');
  }
};

export const getRecipes = (): Recipe[] => {
  init();
  try {
    return JSON.parse(localStorage.getItem(VAULT_KEY) || '[]');
  } catch {
    return [];
  }
};

export const getRecipeById = (id: string): Recipe | undefined =>
  getRecipes().find(r => r.id === id);

export const saveRecipe = (recipe: Recipe): void => {
  const recipes = getRecipes();
  const idx = recipes.findIndex(r => r.id === recipe.id);
  if (idx >= 0) {
    recipes[idx] = recipe;
  } else {
    recipes.unshift(recipe);
  }
  localStorage.setItem(VAULT_KEY, JSON.stringify(recipes));
};

export const deleteRecipe = (id: string): void => {
  const recipes = getRecipes().filter(r => r.id !== id);
  localStorage.setItem(VAULT_KEY, JSON.stringify(recipes));
};

export const toggleFavorite = (id: string): void => {
  const recipes = getRecipes();
  const recipe = recipes.find(r => r.id === id);
  if (recipe) {
    recipe.isFavorite = !recipe.isFavorite;
    localStorage.setItem(VAULT_KEY, JSON.stringify(recipes));
  }
};

export const addNote = (id: string, note: CookingNote): void => {
  const recipes = getRecipes();
  const recipe = recipes.find(r => r.id === id);
  if (recipe) {
    recipe.notes = [note, ...(recipe.notes || [])];
    localStorage.setItem(VAULT_KEY, JSON.stringify(recipes));
  }
};

export const deleteNote = (recipeId: string, noteId: string): void => {
  const recipes = getRecipes();
  const recipe = recipes.find(r => r.id === recipeId);
  if (recipe) {
    recipe.notes = recipe.notes.filter(n => n.id !== noteId);
    localStorage.setItem(VAULT_KEY, JSON.stringify(recipes));
  }
};

export const getFamilyRecipes = (): FamilyRecipe[] => {
  init();
  try {
    return JSON.parse(localStorage.getItem(FAMILY_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveFamilyRecipe = (recipe: FamilyRecipe): void => {
  const recipes = getFamilyRecipes();
  recipes.unshift(recipe);
  localStorage.setItem(FAMILY_KEY, JSON.stringify(recipes));
};

export const deleteFamilyRecipe = (id: string): void => {
  const recipes = getFamilyRecipes().filter(r => r.id !== id);
  localStorage.setItem(FAMILY_KEY, JSON.stringify(recipes));
};

export const updateRecipe = (recipe: Recipe): void => {
  saveRecipe(recipe);
};

export const getRecipeCount = (): number => getRecipes().length;
