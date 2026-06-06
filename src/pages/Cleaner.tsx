import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, FileText, Sparkles, Save, ChefHat, Clock, Users, AlertTriangle, RotateCcw, X, Camera, AlignLeft, LayoutTemplate } from 'lucide-react';
import { parseRecipeText, parseRecipeFromUrl } from '../lib/recipeParser';
import { saveRecipe } from '../lib/storage';
import { isValidUrl, generateId } from '../lib/utils';
import { Recipe } from '../types';
import { useToast } from '../components/Toast';

type InputMode = 'url' | 'text' | 'image';

function recipeToPlainText(recipe: Partial<Recipe>): string {
  const lines: string[] = [];
  if (recipe.title) lines.push(recipe.title);
  if (recipe.description) lines.push(recipe.description);
  lines.push('');
  if (recipe.prepTime || recipe.cookTime || recipe.servings) {
    if (recipe.prepTime) lines.push(`Prep: ${recipe.prepTime}`);
    if (recipe.cookTime) lines.push(`Cook: ${recipe.cookTime}`);
    if (recipe.servings) lines.push(`Serves: ${recipe.servings}`);
    lines.push('');
  }
  if (recipe.ingredients?.length) {
    lines.push('INGREDIENTS');
    recipe.ingredients.forEach(i => lines.push(`• ${i}`));
    lines.push('');
  }
  if (recipe.instructions?.length) {
    lines.push('INSTRUCTIONS');
    recipe.instructions.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push('');
  }
  if (recipe.tags?.length) lines.push(`Tags: ${recipe.tags.join(', ')}`);
  if (recipe.sourceUrl) lines.push(`Source: ${recipe.sourceUrl}`);
  return lines.join('\n');
}

function CleanedRecipePreview({
  recipe,
  isDemo,
  onSave,
  onCook,
}: {
  recipe: Partial<Recipe>;
  isDemo: boolean;
  onSave: () => void;
  onCook: () => void;
}) {
  const [plainText, setPlainText] = useState(false);

  return (
    <div className="animate-slide-up">
      {isDemo && (
        <div className="flex items-start gap-3 p-4 mb-5 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Demo output</strong> — URL scraping is not active in the MVP. This is a sample clean recipe card to show what the output looks like. Text paste parsing is fully functional.
          </p>
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Cleaned recipe</p>
        <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
          <button
            onClick={() => setPlainText(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!plainText ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <LayoutTemplate size={12} />
            Card
          </button>
          <button
            onClick={() => setPlainText(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${plainText ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <AlignLeft size={12} />
            Plain text
          </button>
        </div>
      </div>

      {plainText ? (
        <div className="card p-6 mb-4">
          <pre className="font-mono text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{recipeToPlainText(recipe)}</pre>
          <div className="flex gap-3 pt-4 border-t border-stone-100 mt-4">
            <button
              onClick={() => { navigator.clipboard.writeText(recipeToPlainText(recipe)); }}
              className="btn-secondary flex-1"
            >
              Copy to clipboard
            </button>
            <button onClick={onSave} className="btn-primary flex-1">
              <Save size={16} />
              Save to My Vault
            </button>
          </div>
        </div>
      ) : (

      <div className="card overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{recipe.emoji || '📄'}</span>
              <div>
                <h2 className="text-xl font-bold text-stone-900">{recipe.title}</h2>
                {recipe.description && (
                  <p className="text-stone-500 text-sm mt-1">{recipe.description}</p>
                )}
                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600 hover:underline mt-1 inline-block truncate max-w-xs"
                  >
                    {recipe.sourceUrl}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Meta row */}
          {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
            <div className="flex flex-wrap gap-4 mb-5 pb-5 border-b border-stone-100">
              {recipe.prepTime && (
                <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2">
                  <Clock size={14} className="text-stone-500" />
                  <div>
                    <p className="text-xs text-stone-500">Prep time</p>
                    <p className="text-sm font-semibold text-stone-900">{recipe.prepTime}</p>
                  </div>
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2">
                  <Clock size={14} className="text-stone-500" />
                  <div>
                    <p className="text-xs text-stone-500">Cook time</p>
                    <p className="text-sm font-semibold text-stone-900">{recipe.cookTime}</p>
                  </div>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2">
                  <Users size={14} className="text-stone-500" />
                  <div>
                    <p className="text-xs text-stone-500">Servings</p>
                    <p className="text-sm font-semibold text-stone-900">{recipe.servings}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Ingredients */}
            <div>
              <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">
                  {recipe.ingredients?.length ?? 0}
                </span>
                Ingredients
              </h3>
              <ul className="space-y-2">
                {recipe.ingredients?.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">
                  {recipe.instructions?.length ?? 0}
                </span>
                Instructions
              </h3>
              <ol className="space-y-3">
                {recipe.instructions?.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-stone-700">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {recipe.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-100">
            <button onClick={onSave} className="btn-primary flex-1">
              <Save size={16} />
              Save to My Vault
            </button>
            <button onClick={onCook} className="btn-secondary flex-1">
              <ChefHat size={16} />
              Open Cook Mode
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default function Cleaner() {
  const [mode, setMode] = useState<InputMode>('url');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Partial<Recipe> | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleClean = async () => {
    if (!input.trim()) {
      showToast('Please paste a recipe URL or text first.', 'error');
      return;
    }

    setLoading(true);
    setResult(null);

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));

    let parsed: Partial<Recipe>;
    let demo = false;

    if (mode === 'url' || isValidUrl(input.trim())) {
      parsed = parseRecipeFromUrl(input.trim());
      demo = true;
    } else {
      parsed = parseRecipeText(input.trim());
      demo = false;
    }

    // Ensure id
    if (!parsed.id) parsed.id = generateId();

    setResult(parsed);
    setIsDemo(demo);
    setSavedId(null);
    setLoading(false);
  };

  const handleSave = () => {
    if (!result) return;
    const recipe: Recipe = {
      id: result.id || generateId(),
      title: result.title || 'Untitled Recipe',
      description: result.description,
      emoji: result.emoji,
      ingredients: result.ingredients || [],
      instructions: result.instructions || [],
      prepTime: result.prepTime,
      cookTime: result.cookTime,
      servings: result.servings,
      tags: result.tags,
      sourceUrl: result.sourceUrl,
      notes: [],
      savedAt: new Date().toISOString(),
    };
    saveRecipe(recipe);
    setSavedId(recipe.id);
    showToast(`"${recipe.title}" saved to your vault! 🎉`, 'success');
  };

  const handleCook = () => {
    if (!result) return;
    const id = savedId || result.id;
    if (!savedId) {
      // Save first, then navigate
      handleSave();
    }
    if (id) navigate(`/cook/${id}`);
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
    setSavedId(null);
    setIsDemo(false);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-amber-600 font-semibold text-sm mb-3">
            <Sparkles size={14} />
            Recipe Cleaner
          </div>
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight mb-3">
            Turn any recipe into a clean card
          </h1>
          <p className="text-stone-500 text-lg">
            Paste a recipe URL or raw recipe text. Get a perfectly formatted cooking card in seconds.
          </p>
        </div>

        {/* Input card */}
        <div className="card p-6 mb-6">
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-stone-100 rounded-xl mb-5 w-fit">
            <button
              onClick={() => { setMode('url'); setInput(''); setResult(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'url' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Link2 size={14} />
              Paste URL
            </button>
            <button
              onClick={() => { setMode('text'); setInput(''); setResult(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'text' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <FileText size={14} />
              Paste Text
            </button>
            <button
              onClick={() => { setMode('image'); setInput(''); setResult(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'image' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Camera size={14} />
              Upload Photo
            </button>
          </div>

          {/* Input */}
          {mode === 'image' ? (
            <div className="border-2 border-dashed border-stone-200 rounded-xl p-10 text-center bg-stone-50 hover:border-amber-300 hover:bg-amber-50/40 transition-colors cursor-pointer mb-1">
              <Camera size={28} className="mx-auto text-stone-400 mb-3" />
              <p className="text-sm font-medium text-stone-600 mb-1">Upload a photo of your recipe</p>
              <p className="text-xs text-stone-400 mb-4">JPG, PNG, or PDF — handwritten or printed</p>
              <input type="file" accept="image/*,.pdf" className="hidden" id="recipe-image-upload" />
              <label
                htmlFor="recipe-image-upload"
                className="btn-secondary text-sm px-5 py-2 cursor-pointer"
              >
                Choose file
              </label>
              <p className="text-xs text-amber-600 font-medium mt-4">
                OCR scanning coming soon — paste the text for now
              </p>
            </div>
          ) : mode === 'url' ? (
            <div className="relative">
              <Link2 size={16} className="absolute left-3.5 top-3.5 text-stone-400" />
              <input
                type="url"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="https://www.allrecipes.com/recipe/..."
                className="input-base pl-10"
                onKeyDown={e => e.key === 'Enter' && handleClean()}
              />
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Paste your recipe here. For best results, include:

Chocolate Chip Cookies

Ingredients
- 2 cups flour
- 1 tsp baking soda
- 1 cup butter

Instructions
1. Preheat oven to 375°F
2. Mix dry ingredients...`}
                rows={10}
                className="input-base resize-none font-mono text-xs"
              />
              {input && (
                <button
                  onClick={() => setInput('')}
                  className="absolute top-3 right-3 p-1 rounded text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Tips */}
          {mode === 'text' && !result && (
            <p className="text-xs text-stone-500 mt-2">
              Tip: Include section headers like "Ingredients" and "Instructions" for best results. Works with any format.
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleClean}
              disabled={loading || (!input.trim() && mode !== 'image') || mode === 'image'}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Cleaning…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Clean Recipe
                </>
              )}
            </button>
            {result && (
              <button onClick={handleReset} className="btn-ghost">
                <RotateCcw size={14} />
                Start over
              </button>
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <CleanedRecipePreview
            recipe={result}
            isDemo={isDemo}
            onSave={handleSave}
            onCook={handleCook}
          />
        )}

        {/* Example recipes */}
        {!result && !loading && (
          <div className="mt-8">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
              Or try with these example inputs:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'https://www.seriouseats.com/best-chocolate-chip-cookies',
                'https://www.bonappetit.com/recipe/pasta-aglio-e-olio',
              ].map(url => (
                <button
                  key={url}
                  onClick={() => { setMode('url'); setInput(url); }}
                  className="text-xs px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700 transition-colors truncate max-w-xs"
                >
                  {url}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
