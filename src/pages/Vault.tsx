import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Heart, ChefHat, Clock, Users, Trash2, Star, X, Plus, ArrowUpDown } from 'lucide-react';
import { getRecipes, deleteRecipe, toggleFavorite, addNote, deleteNote } from '../lib/storage';
import { Recipe, CookingNote } from '../types';
import { formatDate, formatDateTime, generateId } from '../lib/utils';
import { useToast } from '../components/Toast';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

type SortOption = 'newest' | 'name' | 'favorites';

function RecipeDetailModal({
  recipe,
  onClose,
  onDelete,
  onToggleFavorite,
  onAddNote,
  onDeleteNote,
}: {
  recipe: Recipe;
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddNote: (id: string, note: CookingNote) => void;
  onDeleteNote: (recipeId: string, noteId: string) => void;
}) {
  const [noteText, setNoteText] = useState('');
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions' | 'notes'>('ingredients');
  const navigate = useNavigate();

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const note: CookingNote = {
      id: generateId(),
      text: noteText.trim(),
      timestamp: new Date().toISOString(),
    };
    onAddNote(recipe.id, note);
    setNoteText('');
  };

  return (
    <Modal open onClose={onClose} title="" maxWidth="max-w-2xl">
      {/* Recipe header */}
      <div className="-mx-6 -mt-6 px-6 pt-6 pb-5 border-b border-stone-100 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-3xl">{recipe.emoji || '📄'}</span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-stone-900 leading-tight">{recipe.title}</h2>
              {recipe.description && (
                <p className="text-stone-500 text-sm mt-1">{recipe.description}</p>
              )}
              <p className="text-xs text-stone-400 mt-1">Saved {formatDate(recipe.savedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleFavorite(recipe.id)}
              className={`p-2 rounded-lg transition-colors ${
                recipe.isFavorite ? 'text-red-500 bg-red-50' : 'text-stone-400 hover:text-red-400 hover:bg-red-50'
              }`}
            >
              <Heart size={16} fill={recipe.isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => { onDelete(recipe.id); onClose(); }}
              className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Meta */}
        {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
          <div className="flex flex-wrap gap-3 mt-4 text-sm">
            {recipe.prepTime && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg text-stone-700 font-medium">
                <Clock size={13} className="text-stone-500" />
                Prep: {recipe.prepTime}
              </span>
            )}
            {recipe.cookTime && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg text-stone-700 font-medium">
                <Clock size={13} className="text-stone-500" />
                Cook: {recipe.cookTime}
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg text-stone-700 font-medium">
                <Users size={13} className="text-stone-500" />
                {recipe.servings}
              </span>
            )}
          </div>
        )}

        {/* Cook Mode CTA */}
        <button
          onClick={() => navigate(`/cook/${recipe.id}`)}
          className="mt-4 w-full btn-primary justify-center"
        >
          <ChefHat size={16} />
          Open Cook Mode
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-xl mb-5">
        {(['ingredients', 'instructions', 'notes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab}
            {tab === 'notes' && recipe.notes.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                {recipe.notes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'ingredients' && (
        <ul className="space-y-2.5">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              {ing}
            </li>
          ))}
        </ul>
      )}

      {activeTab === 'instructions' && (
        <ol className="space-y-4">
          {recipe.instructions.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-stone-700">
              <span className="shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      )}

      {activeTab === 'notes' && (
        <div>
          {/* Add note */}
          <div className="flex gap-2 mb-5">
            <input
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder='e.g. "Used less sugar" or "Make again!"'
              className="input-base flex-1"
              onKeyDown={e => e.key === 'Enter' && handleAddNote()}
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim()}
              className="btn-primary px-4 disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>

          {recipe.notes.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <Star size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notes yet. Add what you changed, what worked, or what to try next time.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recipe.notes.map(note => (
                <li key={note.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <Star size={14} className="text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-800">{note.text}</p>
                    <p className="text-xs text-stone-400 mt-1">{formatDateTime(note.timestamp)}</p>
                  </div>
                  <button
                    onClick={() => onDeleteNote(recipe.id, note.id)}
                    className="p-1 text-stone-400 hover:text-red-500 rounded transition-colors"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function Vault() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { showToast } = useToast();

  const load = () => setRecipes(getRecipes());

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = recipes.filter(r => {
      if (showFavoritesOnly && !r.isFavorite) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.tags?.some(t => t.toLowerCase().includes(q)) ||
        r.ingredients.some(i => i.toLowerCase().includes(q))
      );
    });

    if (sortBy === 'name') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'favorites') list = [...list].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));

    return list;
  }, [recipes, search, sortBy, showFavoritesOnly]);

  const handleDelete = (id: string) => {
    deleteRecipe(id);
    load();
    showToast('Recipe deleted.', 'info');
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    load();
    if (selectedRecipe?.id === id) {
      const updated = getRecipes().find(r => r.id === id);
      if (updated) setSelectedRecipe(updated);
    }
  };

  const handleAddNote = (id: string, note: CookingNote) => {
    addNote(id, note);
    load();
    const updated = getRecipes().find(r => r.id === id);
    if (updated) setSelectedRecipe(updated);
    showToast('Note saved!', 'success');
  };

  const handleDeleteNote = (recipeId: string, noteId: string) => {
    deleteNote(recipeId, noteId);
    load();
    const updated = getRecipes().find(r => r.id === recipeId);
    if (updated) setSelectedRecipe(updated);
  };

  const favorites = recipes.filter(r => r.isFavorite).length;
  const totalNotes = recipes.reduce((sum, r) => sum + r.notes.length, 0);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-1">My Recipe Vault</h1>
            <div className="flex items-center gap-4 text-sm text-stone-500">
              <span>{recipes.length} recipes</span>
              {favorites > 0 && <span>❤️ {favorites} favorites</span>}
              {totalNotes > 0 && <span>⭐ {totalNotes} notes</span>}
            </div>
          </div>
          <a href="/cleaner" className="btn-primary shrink-0">
            <Plus size={16} />
            Add Recipe
          </a>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3.5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes, ingredients, tags…"
              className="input-base pl-10"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-3 p-0.5 text-stone-400 hover:text-stone-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                showFavoritesOnly
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              <Heart size={14} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
              Favorites
            </button>

            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-600 hover:border-stone-300 transition-colors">
                <ArrowUpDown size={14} />
                Sort
              </button>
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden z-10 hidden group-hover:block">
                {([['newest', 'Newest first'], ['name', 'A → Z'], ['favorites', 'Favorites first']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setSortBy(val)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      sortBy === val ? 'bg-amber-50 text-amber-700 font-medium' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-600 hover:border-stone-300 transition-colors">
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 && recipes.length === 0 ? (
          <EmptyState
            emoji="📭"
            title="Your vault is empty"
            description="Save your first recipe with the Recipe Cleaner. Paste any URL or recipe text and we'll clean it up for you."
            ctaLabel="Clean your first recipe"
            ctaHref="/cleaner"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="No recipes found"
            description={`No recipes matching "${search}". Try a different keyword or browse all recipes.`}
            ctaLabel="Clear search"
            onCtaClick={() => { setSearch(''); setShowFavoritesOnly(false); }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(recipe => (
              <button
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className="text-left card-hover flex flex-col overflow-hidden group"
              >
                {/* Color strip */}
                <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-t-2xl" />

                <div className="p-5 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl shrink-0">{recipe.emoji || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-stone-900 text-sm leading-snug">{recipe.title}</h3>
                      {recipe.description && (
                        <p className="text-stone-500 text-xs mt-1 line-clamp-2">{recipe.description}</p>
                      )}
                    </div>
                    {recipe.isFavorite && (
                      <Heart size={14} className="text-red-400 fill-red-400 shrink-0 mt-0.5" />
                    )}
                  </div>

                  {/* Tags */}
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {recipe.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-stone-500 mb-3 flex-wrap">
                    {recipe.prepTime && (
                      <span className="flex items-center gap-1"><Clock size={10} /> {recipe.prepTime}</span>
                    )}
                    {recipe.servings && (
                      <span className="flex items-center gap-1"><Users size={10} /> {recipe.servings}</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {recipe.notes.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <Star size={10} fill="currentColor" />
                          {recipe.notes.length}
                        </span>
                      )}
                      <span className="text-xs text-stone-400">{formatDate(recipe.savedAt)}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                      <ChefHat size={11} />
                      Cook
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recipe detail modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onDelete={handleDelete}
          onToggleFavorite={handleToggleFavorite}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
        />
      )}
    </div>
  );
}
