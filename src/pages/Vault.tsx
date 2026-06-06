import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import {
  Search, SlidersHorizontal, Heart, ChefHat, Clock, Users, Trash2, Star, X, Plus,
  ArrowUpDown, ChevronLeft, ChevronRight, Download, Edit2, AlignLeft, Tag, Check,
  Printer, History, Folder, FolderPlus,
} from 'lucide-react';
import {
  getRecipes, deleteRecipe, toggleFavorite, addNote, deleteNote, updateRecipe,
  saveFamilyRecipe, getCollections, saveCollection, deleteCollection,
  addToCollection, removeFromCollection,
} from '../lib/storage';
import { Recipe, CookingNote, FamilyRecipe, Collection, CookLog } from '../types';
import { formatDate, formatDateTime, generateId } from '../lib/utils';
import { useToast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

type SortOption = 'newest' | 'name' | 'favorites';

// ── Utils ─────────────────────────────────────────────────────────────────────
function recipeToPlainText(recipe: Recipe): string {
  const lines: string[] = [recipe.title];
  if (recipe.description) lines.push(recipe.description);
  lines.push('');
  if (recipe.prepTime) lines.push(`Prep: ${recipe.prepTime}`);
  if (recipe.cookTime) lines.push(`Cook: ${recipe.cookTime}`);
  if (recipe.servings) lines.push(`Serves: ${recipe.servings}`);
  if (recipe.prepTime || recipe.cookTime || recipe.servings) lines.push('');
  if (recipe.ingredients.length) { lines.push('INGREDIENTS'); recipe.ingredients.forEach(i => lines.push(`• ${i}`)); lines.push(''); }
  if (recipe.instructions.length) { lines.push('INSTRUCTIONS'); recipe.instructions.forEach((s, i) => lines.push(`${i + 1}. ${s}`)); lines.push(''); }
  if (recipe.tags?.length) lines.push(`Tags: ${recipe.tags.join(', ')}`);
  if (recipe.sourceUrl) lines.push(`Source: ${recipe.sourceUrl}`);
  return lines.join('\n');
}

function printRecipe(recipe: Recipe) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${recipe.title}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 680px; margin: 40px auto; color: #1c1917; line-height: 1.6; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    .meta { color: #78716c; font-size: 14px; margin-bottom: 20px; }
    .meta span { margin-right: 16px; }
    h2 { font-size: 16px; text-transform: uppercase; letter-spacing: .08em; color: #92400e; border-bottom: 1px solid #fcd34d; padding-bottom: 4px; margin-top: 28px; }
    ul { padding-left: 20px; } li { margin: 6px 0; font-size: 15px; }
    ol li { margin: 10px 0; font-size: 15px; }
    .tags { margin-top: 24px; font-size: 13px; color: #78716c; }
    .source { margin-top: 8px; font-size: 12px; color: #a8a29e; }
    @media print { body { margin: 20px; } }
  </style></head><body>
  <h1>${recipe.emoji ? recipe.emoji + ' ' : ''}${recipe.title}</h1>
  ${recipe.description ? `<p style="color:#57534e;margin-bottom:12px">${recipe.description}</p>` : ''}
  <div class="meta">
    ${recipe.prepTime ? `<span>Prep: ${recipe.prepTime}</span>` : ''}
    ${recipe.cookTime ? `<span>Cook: ${recipe.cookTime}</span>` : ''}
    ${recipe.servings ? `<span>Serves: ${recipe.servings}</span>` : ''}
  </div>
  <h2>Ingredients</h2>
  <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
  <h2>Instructions</h2>
  <ol>${recipe.instructions.map(s => `<li>${s}</li>`).join('')}</ol>
  ${recipe.tags?.length ? `<div class="tags">Tags: ${recipe.tags.join(', ')}</div>` : ''}
  ${recipe.sourceUrl ? `<div class="source">Source: ${recipe.sourceUrl}</div>` : ''}
  </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

// ── New Collection Modal ──────────────────────────────────────────────────────
function NewCollectionModal({ onSave, onClose }: { onSave: (c: Collection) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📁');
  const EMOJIS = ['📁', '🍝', '🥗', '🍰', '🍳', '🌮', '🥘', '🫙', '🎉', '❤️'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-slide-up">
        <h2 className="text-lg font-bold text-stone-900 mb-4">New collection</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)} className={`text-xl p-2 rounded-xl transition-all ${emoji === e ? 'bg-amber-100 ring-2 ring-amber-400' : 'hover:bg-stone-100'}`}>{e}</button>
          ))}
        </div>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Collection name…"
          className="input-base mb-4"
          onKeyDown={e => e.key === 'Enter' && name.trim() && onSave({ id: generateId(), name: name.trim(), emoji, recipeIds: [], createdAt: new Date().toISOString() })}
        />
        <div className="flex gap-3">
          <button
            onClick={() => name.trim() && onSave({ id: generateId(), name: name.trim(), emoji, recipeIds: [], createdAt: new Date().toISOString() })}
            disabled={!name.trim()}
            className="btn-primary flex-1 disabled:opacity-40"
          >Create</button>
          <button onClick={onClose} className="btn-ghost px-4">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Recipe Detail Modal ───────────────────────────────────────────────────────
function RecipeDetailModal({
  recipe, recipes, collections, onClose, onDelete, onToggleFavorite,
  onAddNote, onDeleteNote, onUpdate, onNavigate,
}: {
  recipe: Recipe;
  recipes: Recipe[];
  collections: Collection[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddNote: (id: string, note: CookingNote) => void;
  onDeleteNote: (recipeId: string, noteId: string) => void;
  onUpdate: (recipe: Recipe) => void;
  onNavigate: (recipe: Recipe) => void;
}) {
  type Tab = 'ingredients' | 'instructions' | 'notes' | 'history' | 'plaintext';
  const [noteText, setNoteText] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('ingredients');
  const [editMode, setEditMode] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);

  const [editTitle, setEditTitle] = useState(recipe.title);
  const [editDesc, setEditDesc] = useState(recipe.description || '');
  const [editIngredients, setEditIngredients] = useState(recipe.ingredients.join('\n'));
  const [editInstructions, setEditInstructions] = useState(recipe.instructions.join('\n'));
  const [editTags, setEditTags] = useState<string[]>(recipe.tags || []);

  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentIndex = recipes.findIndex(r => r.id === recipe.id);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    onAddNote(recipe.id, { id: generateId(), text: noteText.trim(), timestamp: new Date().toISOString() });
    setNoteText('');
  };

  const handleSaveEdit = () => {
    onUpdate({
      ...recipe,
      title: editTitle.trim() || recipe.title,
      description: editDesc.trim() || undefined,
      ingredients: editIngredients.split('\n').map(l => l.trim()).filter(Boolean),
      instructions: editInstructions.split('\n').map(l => l.trim()).filter(Boolean),
      tags: editTags,
    });
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
    showToast('Exported as .txt!', 'success');
  };

  const handleMoveToFamily = () => {
    const fr: FamilyRecipe = {
      id: generateId(), title: recipe.title, contributor: 'My Vault',
      relationship: 'Other', familyStory: recipe.description || '',
      ingredients: recipe.ingredients, instructions: recipe.instructions,
      notes: [], savedAt: new Date().toISOString(),
    };
    saveFamilyRecipe(fr);
    showToast(`"${recipe.title}" added to Family Vault!`, 'success');
  };

  const recipeCollections = collections.filter(c => c.recipeIds.includes(recipe.id));

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ingredients', label: 'Ingredients' },
    { key: 'instructions', label: 'Instructions' },
    { key: 'notes', label: `Notes${recipe.notes.length > 0 ? ` (${recipe.notes.length})` : ''}` },
    { key: 'history', label: `History${recipe.cookLog?.length ? ` (${recipe.cookLog.length})` : ''}` },
    { key: 'plaintext', label: 'Plain Text' },
  ];

  const avgRating = recipe.cookLog?.length
    ? recipe.cookLog.filter(l => l.rating > 0).reduce((s, l) => s + l.rating, 0) / recipe.cookLog.filter(l => l.rating > 0).length
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[75vw] bg-white rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">

        {/* Header row */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
          <div className="flex items-center gap-1">
            <button onClick={() => currentIndex > 0 && onNavigate(recipes[currentIndex - 1])} disabled={currentIndex <= 0} className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 disabled:cursor-not-allowed">
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs text-stone-400 font-medium px-1">{currentIndex + 1} / {recipes.length}</span>
            <button onClick={() => currentIndex < recipes.length - 1 && onNavigate(recipes[currentIndex + 1])} disabled={currentIndex >= recipes.length - 1} className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 disabled:cursor-not-allowed">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setEditMode(!editMode)} className={`p-2 rounded-lg transition-colors ${editMode ? 'bg-amber-100 text-amber-700' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`} title="Edit">
              <Edit2 size={16} />
            </button>
            <button onClick={handleExport} className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors" title="Export .txt">
              <Download size={16} />
            </button>
            <button onClick={() => printRecipe(recipe)} className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors" title="Print">
              <Printer size={16} />
            </button>
            <button onClick={() => setShowCollectionPicker(!showCollectionPicker)} className={`p-2 rounded-lg transition-colors ${showCollectionPicker ? 'bg-amber-100 text-amber-700' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`} title="Add to collection">
              <Folder size={16} />
            </button>
            <button onClick={handleMoveToFamily} className="p-2 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-colors" title="Add to Family Vault">
              <Heart size={16} />
            </button>
            <button onClick={() => onToggleFavorite(recipe.id)} className={`p-2 rounded-lg transition-colors ${recipe.isFavorite ? 'text-red-500 bg-red-50' : 'text-stone-400 hover:text-red-400 hover:bg-red-50'}`}>
              <Star size={16} fill={recipe.isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => { onDelete(recipe.id); onClose(); }} className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Collection picker dropdown */}
        {showCollectionPicker && (
          <div className="mx-6 mt-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
            {collections.length === 0
              ? <p className="text-xs text-stone-400 text-center py-1">No collections yet — create one in the vault.</p>
              : <div className="flex flex-wrap gap-2">
                  {collections.map(c => {
                    const inCol = c.recipeIds.includes(recipe.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => { inCol ? removeFromCollection(c.id, recipe.id) : addToCollection(c.id, recipe.id); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${inCol ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300'}`}
                      >
                        {c.emoji} {c.name} {inCol && <Check size={10} />}
                      </button>
                    );
                  })}
                </div>
            }
          </div>
        )}

        {/* Recipe header */}
        <div className="px-6 pt-4 pb-5 border-b border-stone-100 shrink-0">
          {editMode ? (
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="text-xl font-bold text-stone-900 w-full border-b-2 border-amber-400 bg-transparent focus:outline-none pb-1 mb-2" />
          ) : (
            <div className="flex items-start gap-3">
              <span className="text-3xl">{recipe.emoji || '📄'}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-stone-900 leading-tight">{recipe.title}</h2>
                  {avgRating !== null && (
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(n => <Star key={n} size={12} className={n <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-stone-200 fill-stone-200'} />)}
                      <span className="text-xs text-stone-400">({recipe.cookLog!.length}×)</span>
                    </div>
                  )}
                </div>
                {recipe.description && <p className="text-stone-500 text-sm mt-1">{recipe.description}</p>}
                <p className="text-xs text-stone-400 mt-1">Saved {formatDate(recipe.savedAt)}</p>
              </div>
            </div>
          )}

          {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
            <div className="flex flex-wrap gap-3 mt-4 text-sm">
              {recipe.prepTime && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg text-stone-700 font-medium"><Clock size={13} className="text-stone-500" /> Prep: {recipe.prepTime}</span>}
              {recipe.cookTime && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg text-stone-700 font-medium"><Clock size={13} className="text-stone-500" /> Cook: {recipe.cookTime}</span>}
              {recipe.servings && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg text-stone-700 font-medium"><Users size={13} className="text-stone-500" /> {recipe.servings}</span>}
            </div>
          )}

          {/* Tags + collection badges */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(editMode ? editTags : recipe.tags ?? []).map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                {tag}
                {editMode && <button onClick={() => setEditTags(editTags.filter(t => t !== tag))} className="hover:text-red-500"><X size={10} /></button>}
              </span>
            ))}
            {editMode && (
              <div className="flex items-center gap-1">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { const t = tagInput.trim().toLowerCase(); if (t && !editTags.includes(t)) setEditTags([...editTags, t]); setTagInput(''); }}} placeholder="add tag…" className="px-2.5 py-1 rounded-full border border-dashed border-stone-300 text-xs focus:outline-none focus:border-amber-400 w-24" />
                <Tag size={12} className="text-stone-400" />
              </div>
            )}
            {recipeCollections.map(c => (
              <span key={c.id} className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">{c.emoji} {c.name}</span>
            ))}
          </div>

          {!editMode && (
            <button onClick={() => navigate(`/cook/${recipe.id}`)} className="mt-4 w-full btn-primary justify-center">
              <ChefHat size={16} /> Open Cook Mode
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Description</label>
                <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Short description…" className="input-base text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Ingredients <span className="font-normal normal-case text-stone-400">(one per line)</span></label>
                <textarea value={editIngredients} onChange={e => setEditIngredients(e.target.value)} rows={8} className="input-base resize-none font-mono text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Instructions <span className="font-normal normal-case text-stone-400">(one step per line)</span></label>
                <textarea value={editInstructions} onChange={e => setEditInstructions(e.target.value)} rows={8} className="input-base resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveEdit} className="btn-primary flex-1"><Check size={16} /> Save changes</button>
                <button onClick={() => setEditMode(false)} className="btn-ghost px-5">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-1 p-1 bg-stone-100 rounded-xl mb-5 overflow-x-auto">
                {tabs.map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'ingredients' && (
                <ul className="space-y-2.5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />{ing}
                    </li>
                  ))}
                </ul>
              )}

              {activeTab === 'instructions' && (
                <ol className="space-y-4">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-stone-700">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {activeTab === 'notes' && (
                <div>
                  <div className="flex gap-2 mb-5">
                    <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder='"Used less sugar" or "Make again!"' className="input-base flex-1" onKeyDown={e => e.key === 'Enter' && handleAddNote()} />
                    <button onClick={handleAddNote} disabled={!noteText.trim()} className="btn-primary px-4 disabled:opacity-40"><Plus size={16} /></button>
                  </div>
                  {recipe.notes.length === 0
                    ? <div className="text-center py-8 text-stone-400"><Star size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No notes yet.</p></div>
                    : <ul className="space-y-3">{recipe.notes.map(note => (
                        <li key={note.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                          <Star size={14} className="text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0"><p className="text-sm text-stone-800">{note.text}</p><p className="text-xs text-stone-400 mt-1">{formatDateTime(note.timestamp)}</p></div>
                          <button onClick={() => onDeleteNote(recipe.id, note.id)} className="p-1 text-stone-400 hover:text-red-500 rounded"><X size={12} /></button>
                        </li>
                      ))}</ul>
                  }
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  {!recipe.cookLog?.length
                    ? <div className="text-center py-8 text-stone-400"><History size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No cook history yet. Finish a Cook Mode session to log it here.</p></div>
                    : <ul className="space-y-3">
                        {(recipe.cookLog as CookLog[]).map(log => (
                          <li key={log.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1">
                                {log.rating > 0 && [1,2,3,4,5].map(n => <Star key={n} size={13} className={n <= log.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200 fill-stone-200'} />)}
                              </div>
                              <span className="text-xs text-stone-400">{formatDateTime(log.cookedAt)}</span>
                            </div>
                            {log.note && <p className="text-sm text-stone-700 mt-1 italic">"{log.note}"</p>}
                          </li>
                        ))}
                      </ul>
                  }
                </div>
              )}

              {activeTab === 'plaintext' && (
                <div>
                  <pre className="font-mono text-sm text-stone-700 whitespace-pre-wrap leading-relaxed bg-stone-50 rounded-xl p-5 border border-stone-200">{recipeToPlainText(recipe)}</pre>
                  <button onClick={() => { navigator.clipboard.writeText(recipeToPlainText(recipe)); showToast('Copied!', 'success'); }} className="btn-secondary mt-3 w-full justify-center">Copy to clipboard</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Vault ────────────────────────────────────────────────────────────────
export default function Vault() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [activeCollectionFilter, setActiveCollectionFilter] = useState<string | null>(null);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const pendingDeleteRef = useRef<{ recipe: Recipe; timeout: number } | null>(null);
  const { showToast } = useToast();

  const load = () => { setRecipes(getRecipes()); setCollections(getCollections()); };
  useEffect(() => { load(); }, []);

  // Fuse.js fuzzy search
  const fuse = useMemo(() => new Fuse(recipes, {
    keys: ['title', 'description', 'tags', 'ingredients'],
    threshold: 0.35,
    includeScore: true,
  }), [recipes]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    recipes.forEach(r => r.tags?.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [recipes]);

  const filtered = useMemo(() => {
    let list: Recipe[];

    if (search.trim()) {
      list = fuse.search(search.trim()).map(r => r.item);
    } else {
      list = [...recipes];
    }

    list = list.filter(r => {
      if (showFavoritesOnly && !r.isFavorite) return false;
      if (activeTagFilter && !r.tags?.includes(activeTagFilter)) return false;
      if (activeCollectionFilter) {
        const col = collections.find(c => c.id === activeCollectionFilter);
        if (col && !col.recipeIds.includes(r.id)) return false;
      }
      return true;
    });

    if (!search.trim()) {
      if (sortBy === 'name') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
      else if (sortBy === 'favorites') list = [...list].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    }

    return list;
  }, [recipes, search, sortBy, showFavoritesOnly, activeTagFilter, activeCollectionFilter, fuse, collections]);

  const handleDelete = (id: string) => {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;
    if (pendingDeleteRef.current) clearTimeout(pendingDeleteRef.current.timeout);

    // Optimistically remove
    setRecipes(prev => prev.filter(r => r.id !== id));
    setSelectedRecipe(null);

    const timeout = window.setTimeout(() => {
      deleteRecipe(id);
      pendingDeleteRef.current = null;
    }, 5500);

    pendingDeleteRef.current = { recipe, timeout };
    showToast('Recipe deleted.', 'info', {
      label: 'Undo',
      onClick: () => {
        if (pendingDeleteRef.current?.recipe.id === id) {
          clearTimeout(pendingDeleteRef.current.timeout);
          pendingDeleteRef.current = null;
          setRecipes(prev => [recipe, ...prev]);
          showToast('Undo — recipe restored.', 'success');
        }
      },
    });
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    load();
    if (selectedRecipe?.id === id) setSelectedRecipe(getRecipes().find(r => r.id === id) ?? null);
  };

  const handleAddNote = (id: string, note: CookingNote) => {
    addNote(id, note);
    load();
    setSelectedRecipe(getRecipes().find(r => r.id === id) ?? null);
    showToast('Note saved!', 'success');
  };

  const handleDeleteNote = (recipeId: string, noteId: string) => {
    deleteNote(recipeId, noteId);
    load();
    setSelectedRecipe(getRecipes().find(r => r.id === recipeId) ?? null);
  };

  const handleUpdate = (recipe: Recipe) => {
    updateRecipe(recipe);
    load();
    setSelectedRecipe(recipe);
  };

  const handleNewCollection = (c: Collection) => {
    saveCollection(c);
    load();
    setShowNewCollection(false);
    showToast(`Collection "${c.name}" created!`, 'success');
  };

  const handleDeleteCollection = (id: string) => {
    deleteCollection(id);
    if (activeCollectionFilter === id) setActiveCollectionFilter(null);
    load();
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
          <a href="/cleaner" className="btn-primary shrink-0"><Plus size={16} /> Add Recipe</a>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3.5 text-stone-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes, ingredients, tags… (fuzzy)" className="input-base pl-10" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-3 p-0.5 text-stone-400 hover:text-stone-600"><X size={14} /></button>}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFavoritesOnly ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'}`}>
              <Heart size={14} fill={showFavoritesOnly ? 'currentColor' : 'none'} /> Favorites
            </button>

            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-600 hover:border-stone-300 transition-colors">
                <ArrowUpDown size={14} /> Sort
              </button>
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden z-10 hidden group-hover:block">
                {(['newest', 'A → Z', 'Favorites first'] as const).map((label, i) => {
                  const vals: SortOption[] = ['newest', 'name', 'favorites'];
                  return (
                    <button key={label} onClick={() => setSortBy(vals[i])} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === vals[i] ? 'bg-amber-50 text-amber-700 font-medium' : 'text-stone-700 hover:bg-stone-50'}`}>{label}</button>
                  );
                })}
              </div>
            </div>

            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-600 hover:border-stone-300 transition-colors">
              <SlidersHorizontal size={14} /><span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* Collections row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Collections:</span>
          {collections.map(c => (
            <div key={c.id} className="relative group/col">
              <button
                onClick={() => setActiveCollectionFilter(activeCollectionFilter === c.id ? null : c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${activeCollectionFilter === c.id ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}
              >
                {c.emoji} {c.name} <span className="text-stone-400">{c.recipeIds.length}</span>
              </button>
              <button
                onClick={() => handleDeleteCollection(c.id)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-100 text-red-500 text-xs hidden group-hover/col:flex items-center justify-center hover:bg-red-200"
              >×</button>
            </div>
          ))}
          <button onClick={() => setShowNewCollection(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-stone-300 text-stone-500 hover:border-amber-400 hover:text-amber-700 transition-all">
            <FolderPlus size={12} /> New
          </button>
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setActiveTagFilter(null)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${activeTagFilter === null ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>All</button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${activeTagFilter === tag ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>{tag}</button>
            ))}
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 && recipes.length === 0 ? (
          <EmptyState emoji="📭" title="Your vault is empty" description="Save your first recipe with the Recipe Cleaner." ctaLabel="Clean your first recipe" ctaHref="/cleaner" />
        ) : filtered.length === 0 ? (
          <EmptyState emoji="🔍" title="No recipes found" description={`No recipes matching "${search || activeTagFilter}".`} ctaLabel="Clear search" onCtaClick={() => { setSearch(''); setShowFavoritesOnly(false); setActiveTagFilter(null); setActiveCollectionFilter(null); }} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(recipe => (
              <button key={recipe.id} onClick={() => setSelectedRecipe(recipe)} className="text-left card-hover flex flex-col overflow-hidden group">
                <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-t-2xl" />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl shrink-0">{recipe.emoji || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-stone-900 text-sm leading-snug">{recipe.title}</h3>
                      {recipe.description && <p className="text-stone-500 text-xs mt-1 line-clamp-2">{recipe.description}</p>}
                    </div>
                    {recipe.isFavorite && <Heart size={14} className="text-red-400 fill-red-400 shrink-0 mt-0.5" />}
                  </div>
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">{recipe.tags.slice(0, 3).map(tag => <span key={tag} className="tag">{tag}</span>)}</div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-stone-500 mb-3 flex-wrap">
                    {recipe.prepTime && <span className="flex items-center gap-1"><Clock size={10} /> {recipe.prepTime}</span>}
                    {recipe.servings && <span className="flex items-center gap-1"><Users size={10} /> {recipe.servings}</span>}
                    {recipe.cookLog && recipe.cookLog.length > 0 && (
                      <span className="flex items-center gap-1 text-amber-600"><ChefHat size={10} /> {recipe.cookLog.length}×</span>
                    )}
                  </div>
                  <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {recipe.notes.length > 0 && <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><Star size={10} fill="currentColor" />{recipe.notes.length}</span>}
                      <span className="text-xs text-stone-400">{formatDate(recipe.savedAt)}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600"><ChefHat size={11} /> Cook</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          recipes={filtered}
          collections={collections}
          onClose={() => setSelectedRecipe(null)}
          onDelete={handleDelete}
          onToggleFavorite={handleToggleFavorite}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          onUpdate={handleUpdate}
          onNavigate={r => { const fresh = getRecipes().find(x => x.id === r.id); setSelectedRecipe(fresh || r); }}
        />
      )}

      {showNewCollection && <NewCollectionModal onSave={handleNewCollection} onClose={() => setShowNewCollection(false)} />}
    </div>
  );
}
