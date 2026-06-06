import { useState, useEffect } from 'react';
import { Heart, Upload, BookOpen, X, Plus, Clock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { getFamilyRecipes, saveFamilyRecipe, deleteFamilyRecipe } from '../lib/storage';
import { FamilyRecipe } from '../types';
import { generateId, formatDate } from '../lib/utils';
import { useToast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

const RELATIONSHIP_OPTIONS = [
  'Grandmother', 'Grandfather', 'Mother', 'Father', 'Aunt', 'Uncle',
  'Great-Grandmother', 'Great-Grandfather', 'Family Friend', 'Other',
];

const DECADE_OPTIONS = [
  '1920s', '1930s', '1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', 'Unknown',
];

function AddRecipeForm({ onSave, onCancel }: { onSave: (r: FamilyRecipe) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [contributor, setContributor] = useState('');
  const [relationship, setRelationship] = useState('Grandmother');
  const [story, setStory] = useState('');
  const [decade, setDecade] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructionsText, setInstructionsText] = useState('');
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { showToast('Please add a recipe title.', 'error'); return; }
    if (!contributor.trim()) { showToast('Please add the contributor\'s name.', 'error'); return; }

    const recipe: FamilyRecipe = {
      id: generateId(),
      title: title.trim(),
      contributor: contributor.trim(),
      relationship,
      familyStory: story.trim(),
      decade: decade || undefined,
      ingredients: ingredientsText.split('\n').map(l => l.trim()).filter(Boolean),
      instructions: instructionsText.split('\n').map(l => l.trim()).filter(Boolean),
      notes: [],
      savedAt: new Date().toISOString(),
    };

    onSave(recipe);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Recipe name */}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Recipe name *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Nana's Sunday Pot Roast"
          className="input-base"
        />
      </div>

      {/* Contributor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Who gave you this recipe? *</label>
          <input
            value={contributor}
            onChange={e => setContributor(e.target.value)}
            placeholder="e.g. Margaret Kowalski"
            className="input-base"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Relationship</label>
          <select
            value={relationship}
            onChange={e => setRelationship(e.target.value)}
            className="input-base"
          >
            {RELATIONSHIP_OPTIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Decade */}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Approximate era (optional)</label>
        <select value={decade} onChange={e => setDecade(e.target.value)} className="input-base">
          <option value="">Not sure</option>
          {DECADE_OPTIONS.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Story */}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Family story</label>
        <textarea
          value={story}
          onChange={e => setStory(e.target.value)}
          placeholder="Share the story behind this recipe. When was it made? What memories does it carry? What made it special?"
          rows={4}
          className="input-base resize-none"
        />
      </div>

      {/* Upload area (visual prototype) */}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
          Upload handwritten card{' '}
          <span className="font-normal text-stone-400">(coming soon)</span>
        </label>
        <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center bg-stone-50 hover:border-amber-300 hover:bg-amber-50/40 transition-colors cursor-pointer">
          <Upload size={24} className="mx-auto text-stone-400 mb-2" />
          <p className="text-sm text-stone-500">Drag & drop your handwritten recipe card</p>
          <p className="text-xs text-stone-400 mt-1">JPG, PNG, PDF supported · Coming in next release</p>
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
          Ingredients <span className="font-normal text-stone-400">(one per line)</span>
        </label>
        <textarea
          value={ingredientsText}
          onChange={e => setIngredientsText(e.target.value)}
          placeholder={"2 cups flour\n1 tsp baking soda\n..."}
          rows={5}
          className="input-base resize-none font-mono text-xs"
        />
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
          Instructions <span className="font-normal text-stone-400">(one step per line)</span>
        </label>
        <textarea
          value={instructionsText}
          onChange={e => setInstructionsText(e.target.value)}
          placeholder={"Mix dry ingredients first.\nCream butter and sugar together.\n..."}
          rows={5}
          className="input-base resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">
          <Heart size={16} />
          Preserve This Recipe
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost px-5">
          Cancel
        </button>
      </div>
    </form>
  );
}

function FamilyRecipeCard({
  recipe,
  onDelete,
}: {
  recipe: FamilyRecipe;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-rose-400 to-pink-500" />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-stone-900 text-lg">{recipe.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-stone-600">
                <Heart size={13} className="text-rose-400 fill-rose-400" />
                {recipe.relationship} — <strong>{recipe.contributor}</strong>
              </span>
              {recipe.decade && (
                <span className="flex items-center gap-1 text-xs text-stone-400">
                  <Clock size={11} />
                  {recipe.decade}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onDelete(recipe.id)}
            className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Story */}
        {recipe.familyStory && (
          <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-4 mb-4">
            <p className="text-sm text-stone-700 leading-relaxed italic">
              "{recipe.familyStory}"
            </p>
          </div>
        )}

        {/* Toggle full recipe */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Hide recipe' : 'Show full recipe'}
        </button>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-stone-100 grid sm:grid-cols-2 gap-5 animate-fade-in">
            {recipe.ingredients.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Ingredients</h4>
                <ul className="space-y-1.5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recipe.instructions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Instructions</h4>
                <ol className="space-y-2">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-stone-400 mt-4">Preserved on {formatDate(recipe.savedAt)}</p>
      </div>
    </div>
  );
}

export default function FamilyVault() {
  const [recipes, setRecipes] = useState<FamilyRecipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useToast();

  const load = () => setRecipes(getFamilyRecipes());
  useEffect(() => { load(); }, []);

  const handleSave = (recipe: FamilyRecipe) => {
    saveFamilyRecipe(recipe);
    load();
    setShowForm(false);
    showToast(`"${recipe.title}" added to your Family Vault 💛`, 'success');
  };

  const handleDelete = (id: string) => {
    deleteFamilyRecipe(id);
    load();
    showToast('Recipe removed from Family Vault.', 'info');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-rose-50 to-amber-50 border-b border-rose-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold mb-5">
              <Heart size={12} fill="currentColor" />
              Family Recipe Vault
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 tracking-tight mb-4 text-balance">
              Recipes that carry{' '}
              <span className="text-rose-500">family memory.</span>
            </h1>
            <p className="text-lg text-stone-500 max-w-lg mx-auto mb-8 leading-relaxed">
              Grandma's handwritten recipe cards. Family traditions. Stories tied to a dish.
              Too precious to lose. This vault keeps them forever.
            </p>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="btn-primary text-base px-7 py-4">
                <Plus size={18} />
                Add a Family Recipe
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Prototype notice */}
        <div className="flex items-start gap-3 p-4 mb-8 rounded-xl bg-amber-50 border border-amber-200">
          <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-0.5">Early Access Preview</p>
            <p className="text-sm text-amber-700">
              Text-based family recipes save to your device now. Handwritten card scanning, family sharing, and PDF export are coming in the next release. Add your recipes today — they'll all carry forward.
            </p>
          </div>
        </div>

        {/* Add recipe form */}
        {showForm && (
          <div className="card p-6 mb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-stone-900">Preserve a family recipe</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg text-stone-400 hover:bg-stone-100">
                <X size={18} />
              </button>
            </div>
            <AddRecipeForm onSave={handleSave} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {/* Recipe list */}
        {recipes.length === 0 && !showForm ? (
          <EmptyState
            emoji="📖"
            title="Your Family Vault is empty"
            description="Start preserving family recipes before they're lost to time. Add the first one today."
            ctaLabel="Add your first family recipe"
            onCtaClick={() => setShowForm(true)}
          />
        ) : (
          <div className="space-y-5">
            {!showForm && recipes.length > 0 && (
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900">
                  {recipes.length} preserved recipe{recipes.length !== 1 ? 's' : ''}
                </h2>
                <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2">
                  <Plus size={14} />
                  Add another
                </button>
              </div>
            )}
            {recipes.map(r => (
              <FamilyRecipeCard key={r.id} recipe={r} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Future features teaser */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Coming soon</h2>
          <p className="text-stone-500 mb-8">Features we're building based on early user feedback.</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                emoji: '📸',
                title: 'Handwriting scanner',
                desc: 'Snap a photo of any handwritten recipe card. We transcribe it automatically.',
              },
              {
                emoji: '👨‍👩‍👧',
                title: 'Family sharing',
                desc: 'Create a shared vault. The whole family can add, view, and preserve recipes together.',
              },
              {
                emoji: '📕',
                title: 'Print as cookbook',
                desc: 'Export your family vault as a beautifully designed printable cookbook. A perfect gift.',
              },
            ].map(f => (
              <div key={f.title} className="card p-5 border-dashed">
                <span className="text-2xl mb-3 block">{f.emoji}</span>
                <h3 className="font-semibold text-stone-900 mb-1">{f.title}</h3>
                <p className="text-stone-500 text-xs leading-relaxed">{f.desc}</p>
                <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 text-xs font-medium">
                  Coming soon
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
