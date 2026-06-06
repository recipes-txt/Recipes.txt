import { Recipe, FamilyRecipe, CookingNote, CookLog, Collection } from '../types';
import { sampleRecipes, sampleFamilyRecipes } from './sampleData';

const VAULT_KEY = 'recipes_txt_vault';
const FAMILY_KEY = 'recipes_txt_family';
const COLLECTIONS_KEY = 'recipes_txt_collections';
const INIT_KEY = 'recipes_txt_initialized';

const init = () => {
  if (!localStorage.getItem(INIT_KEY)) {
    localStorage.setItem(VAULT_KEY, JSON.stringify(sampleRecipes));
    localStorage.setItem(FAMILY_KEY, JSON.stringify(sampleFamilyRecipes));
    localStorage.setItem(INIT_KEY, 'true');
  }
};

// ── Vault ──────────────────────────────────────────────────────────────────
export const getRecipes = (): Recipe[] => {
  init();
  try { return JSON.parse(localStorage.getItem(VAULT_KEY) || '[]'); }
  catch { return []; }
};

export const getRecipeById = (id: string): Recipe | undefined =>
  getRecipes().find(r => r.id === id);

export const saveRecipe = (recipe: Recipe): void => {
  const recipes = getRecipes();
  const idx = recipes.findIndex(r => r.id === recipe.id);
  if (idx >= 0) recipes[idx] = recipe;
  else recipes.unshift(recipe);
  localStorage.setItem(VAULT_KEY, JSON.stringify(recipes));
};

export const updateRecipe = (recipe: Recipe): void => saveRecipe(recipe);

export const deleteRecipe = (id: string): void => {
  localStorage.setItem(VAULT_KEY, JSON.stringify(getRecipes().filter(r => r.id !== id)));
};

export const toggleFavorite = (id: string): void => {
  const recipes = getRecipes();
  const r = recipes.find(r => r.id === id);
  if (r) { r.isFavorite = !r.isFavorite; localStorage.setItem(VAULT_KEY, JSON.stringify(recipes)); }
};

export const addNote = (id: string, note: CookingNote): void => {
  const recipes = getRecipes();
  const r = recipes.find(r => r.id === id);
  if (r) { r.notes = [note, ...(r.notes || [])]; localStorage.setItem(VAULT_KEY, JSON.stringify(recipes)); }
};

export const deleteNote = (recipeId: string, noteId: string): void => {
  const recipes = getRecipes();
  const r = recipes.find(r => r.id === recipeId);
  if (r) { r.notes = r.notes.filter(n => n.id !== noteId); localStorage.setItem(VAULT_KEY, JSON.stringify(recipes)); }
};

export const addCookLog = (recipeId: string, log: CookLog): void => {
  const recipes = getRecipes();
  const r = recipes.find(r => r.id === recipeId);
  if (r) { r.cookLog = [log, ...(r.cookLog || [])]; localStorage.setItem(VAULT_KEY, JSON.stringify(recipes)); }
};

export const getRecipeCount = (): number => getRecipes().length;

// ── Family Vault ───────────────────────────────────────────────────────────
export const getFamilyRecipes = (): FamilyRecipe[] => {
  init();
  try { return JSON.parse(localStorage.getItem(FAMILY_KEY) || '[]'); }
  catch { return []; }
};

export const saveFamilyRecipe = (recipe: FamilyRecipe): void => {
  const recipes = getFamilyRecipes();
  recipes.unshift(recipe);
  localStorage.setItem(FAMILY_KEY, JSON.stringify(recipes));
};

export const deleteFamilyRecipe = (id: string): void => {
  localStorage.setItem(FAMILY_KEY, JSON.stringify(getFamilyRecipes().filter(r => r.id !== id)));
};

// ── Collections ────────────────────────────────────────────────────────────
export const getCollections = (): Collection[] => {
  try { return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || '[]'); }
  catch { return []; }
};

export const saveCollection = (c: Collection): void => {
  const cols = getCollections();
  const idx = cols.findIndex(x => x.id === c.id);
  if (idx >= 0) cols[idx] = c;
  else cols.unshift(c);
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols));
};

export const deleteCollection = (id: string): void => {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(getCollections().filter(c => c.id !== id)));
};

export const addToCollection = (collectionId: string, recipeId: string): void => {
  const cols = getCollections();
  const c = cols.find(x => x.id === collectionId);
  if (c && !c.recipeIds.includes(recipeId)) {
    c.recipeIds.push(recipeId);
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols));
  }
};

export const removeFromCollection = (collectionId: string, recipeId: string): void => {
  const cols = getCollections();
  const c = cols.find(x => x.id === collectionId);
  if (c) {
    c.recipeIds = c.recipeIds.filter(id => id !== recipeId);
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols));
  }
};
