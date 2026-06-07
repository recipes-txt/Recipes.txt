import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link2, FileText, Sparkles, Save, ChefHat, Clock, Users, AlertTriangle, RotateCcw, X,
  Camera, AlignLeft, LayoutTemplate, Check, Scale, Globe, Minus, Plus,
} from 'lucide-react';
import { parseRecipeText, parseRecipeFromUrl } from '../lib/recipeParser';
import { saveRecipe } from '../lib/storage';
import { isValidUrl, generateId } from '../lib/utils';
import { scaleIngredient } from '../lib/ingredientScaler';
import { toMetric } from '../lib/unitConverter';
import { parseBaseServings, adjustServingsLabel } from '../lib/servingScaler';
import { Recipe } from '../types';
import { useToast } from '../components/Toast';

type InputMode = 'url' | 'text' | 'image';

function recipeToPlainText(recipe: Partial<Recipe>, displayIngredients?: string[]): string {
  const lines: string[] = [];
  if (recipe.title) lines.push(recipe.title);
  if (recipe.description) lines.push(recipe.description);
  lines.push('');
  if (recipe.prepTime) lines.push(`Prep: ${recipe.prepTime}`);
  if (recipe.cookTime) lines.push(`Cook: ${recipe.cookTime}`);
  if (recipe.servings) lines.push(`Serves: ${recipe.servings}`);
  if (recipe.prepTime || recipe.cookTime || recipe.servings) lines.push('');
  const ings = displayIngredients ?? recipe.ingredients ?? [];
  if (ings.length) { lines.push('INGREDIENTS'); ings.forEach(i => lines.push(`• ${i}`)); lines.push(''); }
  if (recipe.instructions?.length) { lines.push('INSTRUCTIONS'); recipe.instructions.forEach((s, i) => lines.push(`${i + 1}. ${s}`)); lines.push(''); }
  if (recipe.tags?.length) lines.push(`Tags: ${recipe.tags.join(', ')}`);
  if (recipe.sourceUrl) lines.push(`Source: ${recipe.sourceUrl}`);
  return lines.join('\n');
}

// ── Serving + Unit controls ────────────────────────────────────────────────────
function ServingControls({
  baseServings,
  servingLabel,
  servingCount,
  isMetric,
  onServingChange,
  onMetricChange,
}: {
  baseServings: number | null;
  servingLabel: string;
  servingCount: number;
  isMetric: boolean;
  onServingChange: (n: number) => void;
  onMetricChange: (v: boolean) => void;
}) {
  const scaleFactor = baseServings ? servingCount / baseServings : 1;
  const showScale = baseServings !== null && servingCount !== baseServings;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Users size={14} className="text-amber-600 shrink-0" />
        <span className="text-sm font-semibold text-stone-700">Serves</span>
        <button
          onClick={() => onServingChange(Math.max(1, servingCount - 1))}
          className="stepper-btn bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200"
        >−</button>
        <input
          type="number"
          value={servingCount}
          min={1}
          onChange={e => onServingChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-14 text-center py-1.5 rounded-lg border border-stone-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
        />
        <button
          onClick={() => onServingChange(servingCount + 1)}
          className="stepper-btn bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200"
        >+</button>
        {showScale && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            {scaleFactor > 1 ? `${scaleFactor.toFixed(scaleFactor % 1 === 0 ? 0 : 1)}×` : `${(1 / scaleFactor).toFixed(1 % scaleFactor === 0 ? 0 : 1)}÷`}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200/60">
        <button
          onClick={() => onMetricChange(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!isMetric ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
        >
          Imperial
        </button>
        <button
          onClick={() => onMetricChange(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isMetric ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
        >
          Metric
        </button>
      </div>
    </div>
  );
}

// ── Cleaned recipe preview ─────────────────────────────────────────────────────
function CleanedRecipePreview({
  recipe,
  displayIngredients,
  adjustedServings,
  isDemo,
  onSave,
  onCook,
}: {
  recipe: Partial<Recipe>;
  displayIngredients: string[];
  adjustedServings: string;
  isDemo: boolean;
  onSave: () => void;
  onCook: () => void;
}) {
  const [plainText, setPlainText] = useState(false);
  const { showToast } = useToast();

  return (
    <div className="animate-slide-up">
      {isDemo && (
        <div className="flex items-start gap-3 p-4 mb-5 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Demo output</strong> — URL scraping is not live yet. Text paste parsing is fully functional.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Cleaned recipe</p>
        <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
          <button
            onClick={() => setPlainText(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${!plainText ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <LayoutTemplate size={11} />
            Card
          </button>
          <button
            onClick={() => setPlainText(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${plainText ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <AlignLeft size={11} />
            Plain text
          </button>
        </div>
      </div>

      {plainText ? (
        <div className="card p-6 mb-4">
          <pre className="font-mono text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{recipeToPlainText(recipe, displayIngredients)}</pre>
          <div className="flex gap-3 pt-4 border-t border-stone-100 mt-4">
            <button onClick={() => { navigator.clipboard.writeText(recipeToPlainText(recipe, displayIngredients)); showToast('Copied!', 'success'); }} className="btn-secondary flex-1 text-sm">Copy to clipboard</button>
            <button onClick={onSave} className="btn-primary flex-1 text-sm"><Save size={14} /> Save to My Vault</button>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start gap-3 mb-5">
              <span className="text-4xl shrink-0">{recipe.emoji || '📄'}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-extrabold text-stone-900 leading-tight">{recipe.title}</h2>
                {recipe.description && <p className="text-stone-500 text-sm mt-1.5 leading-relaxed">{recipe.description}</p>}
                {recipe.sourceUrl && (
                  <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-amber-600 hover:text-amber-700 hover:underline mt-1.5 inline-block truncate max-w-xs">
                    {recipe.sourceUrl}
                  </a>
                )}
              </div>
            </div>

            {/* Meta row */}
            {(recipe.prepTime || recipe.cookTime || adjustedServings) && (
              <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-stone-100">
                {recipe.prepTime && (
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-100 rounded-xl px-3 py-2">
                    <Clock size={13} className="text-stone-400" />
                    <div><p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">Prep</p><p className="text-sm font-bold text-stone-800">{recipe.prepTime}</p></div>
                  </div>
                )}
                {recipe.cookTime && (
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-100 rounded-xl px-3 py-2">
                    <Clock size={13} className="text-stone-400" />
                    <div><p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">Cook</p><p className="text-sm font-bold text-stone-800">{recipe.cookTime}</p></div>
                  </div>
                )}
                {adjustedServings && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <Users size={13} className="text-amber-500" />
                    <div><p className="text-[10px] text-amber-500 font-medium uppercase tracking-wide">Serves</p><p className="text-sm font-bold text-amber-800">{adjustedServings}</p></div>
                  </div>
                )}
              </div>
            )}

            {/* Content grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-stone-500">
                  <span className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center text-amber-700 text-[10px] font-extrabold">{displayIngredients.length}</span>
                  Ingredients
                </h3>
                <ul className="space-y-2.5">
                  {displayIngredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />{ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-stone-500">
                  <span className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center text-amber-700 text-[10px] font-extrabold">{recipe.instructions?.length ?? 0}</span>
                  Instructions
                </h3>
                <ol className="space-y-3">
                  {recipe.instructions?.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-stone-700">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-extrabold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">{recipe.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}</div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-100">
              <button onClick={onSave} className="btn-primary flex-1"><Save size={15} /> Save to My Vault</button>
              <button onClick={onCook} className="btn-secondary flex-1"><ChefHat size={15} /> Cook Mode</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Feature grid ───────────────────────────────────────────────────────────────
function FeatureGrid() {
  const features = [
    { icon: '📐', title: 'Scale for any crowd', body: 'Adjust to 2 or 20 people. Fractions handled automatically — ¼ cup becomes ½ cup, not 0.25 cups.' },
    { icon: '🌍', title: 'Imperial ↔ Metric', body: 'Toggle any recipe to metric on the fly. 1 cup → 240 ml, 1 lb → 454 g, 350°F → 177°C.' },
    { icon: '💾', title: 'Save & cook', body: 'One-click save to your Vault. Open Cook Mode for step-by-step guidance with timers and voice commands.' },
  ];

  return (
    <div className="grid sm:grid-cols-3 gap-4 mt-12 pb-12">
      {features.map(f => (
        <div key={f.title} className="p-5 rounded-2xl bg-white border border-stone-200/80 hover:border-amber-200 transition-colors"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span className="text-2xl block mb-3">{f.icon}</span>
          <h3 className="font-bold text-stone-900 text-sm mb-1.5">{f.title}</h3>
          <p className="text-xs text-stone-500 leading-relaxed">{f.body}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Cleaner (new homepage) ────────────────────────────────────────────────
export default function Cleaner() {
  const [mode, setMode] = useState<InputMode>('url');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Partial<Recipe> | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [servingCount, setServingCount] = useState(4);
  const [isMetric, setIsMetric] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const baseServings = useMemo(() => result ? parseBaseServings(result.servings || '') : null, [result]);

  useEffect(() => {
    if (baseServings !== null) setServingCount(baseServings);
  }, [baseServings]);

  const displayIngredients = useMemo(() => {
    if (!result?.ingredients) return [];
    const factor = baseServings ? servingCount / baseServings : 1;
    let ings = result.ingredients.map(i => scaleIngredient(i, factor));
    if (isMetric) ings = ings.map(i => toMetric(i));
    return ings;
  }, [result, servingCount, baseServings, isMetric]);

  const adjustedServings = useMemo(() => {
    if (!result?.servings) return '';
    if (baseServings) return adjustServingsLabel(result.servings, servingCount);
    return result.servings;
  }, [result, servingCount, baseServings]);

  const handleClean = async () => {
    if (!input.trim()) { showToast('Paste a recipe URL or text first.', 'error'); return; }
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
    let parsed: Partial<Recipe>;
    let demo = false;
    if (mode === 'url' || isValidUrl(input.trim())) {
      parsed = parseRecipeFromUrl(input.trim()); demo = true;
    } else {
      parsed = parseRecipeText(input.trim()); demo = false;
    }
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
    if (!savedId) handleSave();
    if (id) navigate(`/cook/${id}`);
  };

  const handleReset = () => { setInput(''); setResult(null); setSavedId(null); setIsDemo(false); };

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <div className="pt-14 pb-10 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/70 via-amber-50/20 to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200/80 text-amber-800 text-xs font-bold mb-5 tracking-wide uppercase">
            <Sparkles size={12} />
            Recipe Cleaner
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-stone-900 mb-4 leading-[1.05] tracking-tight">
            Any recipe.<br />
            <span className="gradient-text">Perfectly clean.</span>
          </h1>
          <p className="text-lg text-stone-500 max-w-lg mx-auto mb-7 leading-relaxed">
            Paste a URL or raw recipe text. Get a clean card you can scale for any crowd, convert to metric, and cook with confidence.
          </p>
          <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 text-sm text-stone-500">
            {['Free to use', 'Scale for any crowd', 'Imperial ↔ Metric'].map(t => (
              <span key={t} className="flex items-center gap-1.5"><Check size={13} className="text-amber-500" />{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tool ── */}
      <div className="max-w-3xl mx-auto px-4 pb-4">
        <div className="card p-6 mb-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)' }}>
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-stone-100 rounded-xl mb-5 w-fit">
            {([['url', Link2, 'Paste URL'], ['text', FileText, 'Paste Text'], ['image', Camera, 'Upload Photo']] as const).map(([m, Icon, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setInput(''); setResult(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* Input */}
          {mode === 'image' ? (
            <div className="border-2 border-dashed border-stone-200 rounded-2xl p-12 text-center bg-stone-50/60 hover:border-amber-300 hover:bg-amber-50/30 transition-all cursor-pointer mb-1">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
                <Camera size={22} className="text-stone-400" />
              </div>
              <p className="text-sm font-semibold text-stone-700 mb-1">Upload a photo of your recipe</p>
              <p className="text-xs text-stone-400 mb-4">JPG, PNG, or PDF — handwritten or printed</p>
              <input type="file" accept="image/*,.pdf" className="hidden" id="recipe-image-upload" />
              <label htmlFor="recipe-image-upload" className="btn-secondary text-xs px-5 py-2 cursor-pointer inline-flex items-center gap-2">Choose file</label>
              <p className="text-xs text-amber-600 font-semibold mt-4">OCR scanning coming soon — use Paste Text for now</p>
            </div>
          ) : mode === 'url' ? (
            <div className="relative">
              <Link2 size={15} className="absolute left-3.5 top-3.5 text-stone-400" />
              <input type="url" value={input} onChange={e => setInput(e.target.value)}
                placeholder="https://www.allrecipes.com/recipe/..."
                className="input-base pl-10"
                onKeyDown={e => e.key === 'Enter' && handleClean()} />
            </div>
          ) : (
            <div className="relative">
              <textarea value={input} onChange={e => setInput(e.target.value)} rows={9}
                placeholder={`Paste your recipe here:\n\nChocolate Chip Cookies\n\nIngredients\n- 2 cups flour\n- 1 tsp baking soda\n\nInstructions\n1. Preheat oven to 375°F\n2. Mix dry ingredients...`}
                className="input-base resize-none font-mono text-xs" />
              {input && <button onClick={() => setInput('')} className="absolute top-3 right-3 p-1 rounded text-stone-400 hover:text-stone-600 hover:bg-stone-100"><X size={13} /></button>}
            </div>
          )}

          {mode === 'text' && !result && <p className="text-xs text-stone-400 mt-2">Tip: Include "Ingredients" and "Instructions" section headers for best results.</p>}

          <div className="flex items-center gap-3 mt-4">
            <button onClick={handleClean} disabled={loading || (!input.trim() && mode !== 'image') || mode === 'image'}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Cleaning…</> : <><Sparkles size={15} />Clean Recipe</>}
            </button>
            {result && <button onClick={handleReset} className="btn-ghost"><RotateCcw size={13} />Start over</button>}
          </div>
        </div>

        {/* Serving + unit controls — show when result is available */}
        {result && (
          <div className="card px-5 py-4 mb-5 flex flex-wrap items-center justify-between gap-4 animate-scale-in">
            <ServingControls
              baseServings={baseServings}
              servingLabel={adjustedServings}
              servingCount={servingCount}
              isMetric={isMetric}
              onServingChange={setServingCount}
              onMetricChange={setIsMetric}
            />
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <Scale size={12} className="text-amber-500" />
              {baseServings
                ? <span>Base: <strong className="text-stone-600">{baseServings} {baseServings === 1 ? 'serving' : 'servings'}</strong></span>
                : <span className="italic">No serving info in this recipe</span>
              }
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <CleanedRecipePreview
            recipe={result}
            displayIngredients={displayIngredients}
            adjustedServings={adjustedServings}
            isDemo={isDemo}
            onSave={handleSave}
            onCook={handleCook}
          />
        )}

        {/* Examples + features */}
        {!result && !loading && (
          <>
            <div className="mb-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Try with an example:</p>
              <div className="flex flex-wrap gap-2">
                {['https://www.seriouseats.com/best-chocolate-chip-cookies', 'https://www.bonappetit.com/recipe/pasta-aglio-e-olio'].map(url => (
                  <button key={url} onClick={() => { setMode('url'); setInput(url); }}
                    className="text-xs px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700 transition-all truncate max-w-xs">
                    {url}
                  </button>
                ))}
              </div>
            </div>
            <FeatureGrid />
          </>
        )}
      </div>
    </div>
  );
}
