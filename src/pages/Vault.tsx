import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, SlidersHorizontal, Heart, ChefHat, Clock, Users, Trash2, Star, X, Plus,
  ArrowUpDown, ChevronLeft, ChevronRight, Download, Edit2, AlignLeft, LayoutTemplate,
  Tag, ArrowRight, Check,
} from 'lucide-react';
import { getRecipes, deleteRecipe, toggleFavorite, addNote, deleteNote, updateRecipe, saveFamilyRecipe } from '../lib/storage';
import { Recipe, CookingNote, FamilyRecipe } from '../types';
import { formatDate, formatDateTime, generateId } from '../lib/utils';
import { useToast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

type SortOption = 'newest' | 'name' | 'favorites';

function recipeToPlainText(recipe: Recipe): string {
  const lines: string[] = [];
  lines.push(recipe.title);
  if (recipe.description) lines.push(recipe.description);
  lines.push('');
  if (recipe.prepTime || recipe.cookTime || recipe.servings) {
    if (recipe.prepTime) lines.push(`Prep: ${recipe.prepTime}`);
    if (recipe.cookTime) lines.push(`Cook: ${recipe.cookTime}`);
    if (recipe.servings) lines.push(`Serves: ${recipe.servings}`);
    lines.push('');
  }
  if (recipe.ingredients.length) {
    lines.push('INGREDIENTS');
    recipe.ingredients.forEach(i => lines.push(`• ${i}`));
    lines.push('');
  }
  if (recipe.instructions.length) {
    lines.push('INSTRUCTIONS');
    recipe.instructions.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push('');
  }
  if (recipe.tags?.length) lines.push(`Tags: ${recipe.tags.join(', ')}`);
  if (recipe.sourceUrl) lines.push(`Source: ${recipe.sourceUrl}`);
  return lines.join('\n');
}

function RecipeDetailModal({
  recipe,
  recipes,
  onClose,
  onDelete,
  onToggleFavorite,
  onAddNote,
  onDeleteNote,
  onUpdate,
  onNavigate,
}: {
  recipe: Recipe;
  recipes: Recipe[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddNote: (id: string, note: CookingNote) => void;
  onDeleteNote: (recipeId: string, noteId: string) => void;
  onUpdate: (recipe: Recipe) => void;
  onNavigate: (recipe: Recipe) => void;
}) {
  const [noteText, setNoteText] = useState('');
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions' | 'notes' | 'plaintext'>('ingredients');
  const [editMode, setEditMode] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Edit state
  const [editTitle, setEditTitle] = useState(recipe.title);
  const [editDesc, setEditDesc] = useState(recipe.description || '');
  const [editIngredients, setEditIngredients] = useState(recipe.ingredients.join('\n'));
  const [editInstructions, setEditInstructions] = useState(recipe.instructions.join('\n'));
  const [editTags, setEditTags] = useState<string[]>(recipe.tags || []);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const currentIndex = recipes.findIndex(r => r.id === recipe.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < recipes.length - 1;

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

  const handleSaveEdit = () => {
    const updated: Recipe = {
      ...recipe,
      title: editTitle.trim() || recipe.title,
      description: editDesc.trim() || undefined,
      ingredients: editIngredients.split('\n').map(l => l.trim()).filter(Boolean),
      instructions: editInstructions.split('\n').map(l => l.trim()).filter(Boolean),
      tags: editTags,
    };
    onUpdate(updated);
    setEditMode(false);
    showToast('Recipe updated!', 'success');
  };

  const handleExport = () => {
    const text = recipeToPlainText(recipe);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Recipe exported as .txt!', 'success');
  };

  const handleMoveToFamily = () => {
    const familyRecipe: FamilyRecipe = {
      id: generateId(),
      title: recipe.title,
      contributor: 'Me',
      relationship: 'Other',
      familyStory: '',
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      notes: [],
      savedAt: new Date().toISOString(),
    };
    saveFamilyRecipe(familyRecipe);
    showToast(`"${recipe.title}" added to Family Vault!`, 'success');
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || editTags.includes(tag)) return;
    setEditTags([...editTags, tag]);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — 75% width */}
      <div className="relative w-full max-w-[75vw] bg-white rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
          {/* Prev/Next nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => hasPrev && onNavigate(recipes[currentIndex - 1])}
              disabled={!hasPrev}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="Previous recipe"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs text-stone-400 font-medium px-1">
              {currentIndex + 1} / {recipes.length}
            </span>
            <button
              onClick={() => hasNext && onNavigate(recipes[currentIndex + 1])}
              disabled={!hasNext}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="Next recipe"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`p-2 rounded-lg transition-colors ${editMode ? 'bg-amber-100 text-amber-700' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}
              title="Edit recipe"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              title="Export as .txt"
            >
              <Download size={16} />
            </button>
            <button
              onClick={handleMoveToFamily}
              className="p-2 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              title="Add to Family Vault"
            >
              <Heart size={16} />
            </button>
            <button
              onClick={() => onToggleFavorite(recipe.id)}
              className={`p-2 rounded-lg transition-colors ${recipe.isFavorite ? 'text-red-500 bg-red-50' : 'text-stone-400 hover:text-red-400 hover:bg-red-50'}`}
              title="Favourite"
            >
              <Star size={16} fill={recipe.isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => { onDelete(recipe.id); onClose(); }}
              className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Recipe header */}
        <div className="px-6 pt-4 pb-5 border-b border-stone-100 shrink-0">
          {editMode ? (
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="text-xl font-bold text-stone-900 w-full border-b-2 border-amber-400 bg-transparent focus:outline-none pb-1 mb-2"
            />
          ) : (
            <div className="flex items-start gap-3">
              <span className="text-3xl">{recipe.emoji || '📄'}</span>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-stone-900 leading-tight">{recipe.title}</h2>
                {recipe.description && <p className="text-stone-500 text-sm mt-1">{recipe.description}</p>}
                <p className="text-xs text-stone-400 mt-1">Saved {formatDate(recipe.savedAt)}</p>
              </div>
            </div>
          )}

          {/* Meta */}
          {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
            <div className="flex flex-wrap gap-3 mt-4 text-sm">
              {recipe.prepTime && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg text-stone-700 font-medium">
                  <Clock size={13} className="text-stone-500" /> Prep: {recipe.prepTime}
                </span>
              )}
              {recipe.cookTime && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg text-stone-700 font-medium">
                  <Clock size={13} className="text-stone-500" /> Cook: {recipe.cookTime}
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg text-stone-700 font-medium">
                  <Users size={13} className="text-stone-500" /> {recipe.servings}
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(editMode ? editTags : recipe.tags ?? []).map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                {tag}
                {editMode && (
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 ml-0.5">
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}
            {editMode && (
              <div className="flex items-center gap-1">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                  placeholder="add tag…"
                  className="px-2.5 py-1 rounded-full border border-dashed border-stone-300 text-xs focus:outline-none focus:border-amber-400 w-24"
                />
                <button onClick={handleAddTag} className="p-1 text-stone-400 hover:text-amber-600">
                  <Tag size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Cook Mode CTA */}
          {!editMode && (
            <button
              onClick={() => navigate(`/cook/${recipe.id}`)}
              className="mt-4 w-full btn-primary justify-center"
            >
              <ChefHat size={16} />
              Open Cook Mode
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Description</label>
                <input
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Short description…"
                  className="input-base text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Ingredients <span className="font-normal normal-case text-stone-400">(one per line)</span>
                </label>
                <textarea
                  value={editIngredients}
                  onChange={e => setEditIngredients(e.target.value)}
                  rows={8}
                  className="input-base resize-none font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Instructions <span className="font-normal normal-case text-stone-400">(one step per line)</span>
                </label>
                <textarea
                  value={editInstructions}
                  onChange={e => setEditInstructions(e.target.value)}
                  rows={8}
                  className="input-base resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveEdit} className="btn-primary flex-1">
                  <Check size={16} />
                  Save changes
                </button>
                <button onClick={() => setEditMode(false)} className="btn-ghost px-5">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-stone-100 rounded-xl mb-5">
                {([
                  { key: 'ingredients', label: 'Ingredients', icon: null },
                  { key: 'instructions', label: 'Instructions', icon: null },
                  { key: 'notes', label: `Notes${recipe.notes.length > 0 ? ` (${recipe.notes.length})` : ''}`, icon: null },
                  { key: 'plaintext', label: 'Plain Text', icon: null },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

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

              {activeTab === 'plaintext' && (
                <div>
                  <pre className="font-mono text-sm text-stone-700 whitespace-pre-wrap leading-relaxed bg-stone-50 rounded-xl p-5 border border-stone-200">
                    {recipeToPlainText(recipe)}
                  </pre>
                  <button
                    onClick={() => { navigator.clipboard.writeText(recipeToPlainText(recipe)); showToast('Copied to clipboard!', 'success'); }}
                    className="btn-secondary mt-3 w-full justify-center"
                  >
                    Copy to clipboard
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Vault() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = () => setRecipes(getRecipes());

  useEffect(() => { load(); }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach(r => r.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [recipes]);

  const filtered = useMemo(() => {
    let list = recipes.filter(r => {
      if (showFavoritesOnly && !r.isFavorite) return false;
      if (activeTagFilter && !r.tags?.includes(activeTagFilter)) return false;
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
  }, [recipes, search, sortBy, showFavoritesOnly, activeTagFilter]);

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

  const handleUpdate = (recipe: Recipe) => {
    updateRecipe(recipe);
    load();
    setSelectedRecipe(recipe);
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
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
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

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTagFilter(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                activeTagFilter === null
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  activeTagFilter === tag
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

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
            description={`No recipes matching "${search || activeTagFilter}". Try a different keyword or browse all recipes.`}
            ctaLabel="Clear search"
            onCtaClick={() => { setSearch(''); setShowFavoritesOnly(false); setActiveTagFilter(null); }}
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
          recipes={filtered}
          onClose={() => setSelectedRecipe(null)}
          onDelete={handleDelete}
          onToggleFavorite={handleToggleFavorite}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          onUpdate={handleUpdate}
          onNavigate={r => {
            const fresh = getRecipes().find(x => x.id === r.id);
            setSelectedRecipe(fresh || r);
          }}
        />
      )}
    </div>
  );
}
