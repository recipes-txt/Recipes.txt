import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sun, EyeOff, Check, ChevronLeft, Plus, X, Star, AlertCircle } from 'lucide-react';
import { getRecipeById, addNote } from '../lib/storage';
import { Recipe, CookingNote } from '../types';
import { generateId, formatDateTime } from '../lib/utils';
import { useToast } from '../components/Toast';

function WakeLockButton({ supported }: { supported: boolean }) {
  const [locked, setLocked] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = async () => {
    if (!supported) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setLocked(true);
      wakeLockRef.current.addEventListener('release', () => setLocked(false));
    } catch {
      setLocked(false);
    }
  };

  const releaseWakeLock = async () => {
    try {
      await wakeLockRef.current?.release();
      wakeLockRef.current = null;
      setLocked(false);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => () => { releaseWakeLock(); }, []);

  if (!supported) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-800/50 border border-stone-700">
        <AlertCircle size={14} className="text-stone-500" />
        <span className="text-xs text-stone-500">Wake Lock not supported in this browser</span>
      </div>
    );
  }

  return (
    <button
      onClick={locked ? releaseWakeLock : requestWakeLock}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
        locked
          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
          : 'bg-stone-800/50 border border-stone-700 text-stone-400 hover:text-stone-200 hover:border-stone-600'
      }`}
    >
      {locked ? <Sun size={14} /> : <EyeOff size={14} />}
      {locked ? 'Screen staying on' : 'Keep screen on'}
    </button>
  );
}

export default function CookMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [prepStage, setPrepStage] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<CookingNote[]>([]);
  const [wakeLockSupported, setWakeLockSupported] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);

  useEffect(() => {
    setWakeLockSupported('wakeLock' in navigator);
  }, []);

  useEffect(() => {
    if (!id) return;
    const r = getRecipeById(id);
    if (r) {
      setRecipe(r);
      setNotes(r.notes);
    }
  }, [id]);

  const toggleIngredient = useCallback((i: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, []);

  const handleAddNote = () => {
    if (!noteText.trim() || !recipe) return;
    const note: CookingNote = {
      id: generateId(),
      text: noteText.trim(),
      timestamp: new Date().toISOString(),
    };
    addNote(recipe.id, note);
    setNotes(prev => [note, ...prev]);
    setNoteText('');
    showToast('Cooking note saved!', 'success');
  };

  const handleDeleteNote = (noteId: string) => {
    if (!recipe) return;
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const goNext = () => {
    if (recipe && currentStep < recipe.instructions.length - 1) {
      setCurrentStep(s => s + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  if (!recipe) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center flex-col gap-4 text-center px-4">
        <div className="text-5xl mb-2">🍳</div>
        <h2 className="text-white text-xl font-semibold">Recipe not found</h2>
        <p className="text-stone-400 text-sm">This recipe might have been deleted from your vault.</p>
        <Link to="/vault" className="btn-primary mt-2">Go to My Vault</Link>
      </div>
    );
  }

  const totalSteps = recipe.instructions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isDone = currentStep === totalSteps - 1;

  if (prepStage) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col">
        <div className="sticky top-0 z-10 bg-stone-900/95 backdrop-blur-sm border-b border-stone-800">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
            <button
              onClick={() => navigate('/vault')}
              className="flex items-center gap-2 text-stone-400 hover:text-stone-200 text-sm font-medium"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Back to Vault</span>
            </button>
            <div className="flex-1 text-center">
              <span className="text-lg mr-2">{recipe.emoji || '🍳'}</span>
              <span className="text-sm font-semibold text-stone-200">{recipe.title}</span>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-10 flex-1 w-full">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-600/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-100 mb-2">Prep your ingredients</h2>
            <p className="text-stone-400 text-sm">Check off what you have ready before cooking starts.</p>
          </div>

          <div className="bg-stone-800/60 rounded-2xl p-6 border border-stone-700/50 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-200">Ingredients</h3>
              <span className="text-xs text-stone-500">{checkedIngredients.size}/{recipe.ingredients.length} ready</span>
            </div>
            <ul className="space-y-3">
              {recipe.ingredients.map((ing, i) => (
                <li
                  key={i}
                  onClick={() => toggleIngredient(i)}
                  className={`flex items-start gap-3 cursor-pointer group transition-opacity ${checkedIngredients.has(i) ? 'opacity-50' : 'opacity-100'}`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    checkedIngredients.has(i) ? 'bg-emerald-500 border-emerald-500' : 'border-stone-600 group-hover:border-stone-400'
                  }`}>
                    {checkedIngredients.has(i) && <Check size={12} className="text-white" />}
                  </div>
                  <span className={`text-sm leading-relaxed ${checkedIngredients.has(i) ? 'line-through text-stone-500' : 'text-stone-300'}`}>
                    {ing}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => { setCheckedIngredients(new Set()); setPrepStage(false); }}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-amber-600 text-white font-semibold text-base hover:bg-amber-500 transition-colors"
          >
            Start Cooking
            <ArrowRight size={18} />
          </button>
          <p className="text-center text-xs text-stone-600 mt-3">
            {checkedIngredients.size === 0 ? "Skip prep and jump straight in" : `${recipe.ingredients.length - checkedIngredients.size} ingredients not checked`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-stone-900/95 backdrop-blur-sm border-b border-stone-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(`/vault`)}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-200 transition-colors text-sm font-medium"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Exit Cook Mode</span>
          </button>

          <div className="flex-1 min-w-0 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">{recipe.emoji || '🍳'}</span>
              <h1 className="text-sm font-semibold text-stone-200 truncate max-w-xs">{recipe.title}</h1>
            </div>
          </div>

          <WakeLockButton supported={wakeLockSupported} />
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-stone-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main: step-by-step */}
          <div className="lg:col-span-2">
            {/* Step counter */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-stone-500 text-sm font-medium">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <div className="flex items-center gap-1">
                {recipe.instructions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentStep
                        ? 'bg-amber-400 w-4'
                        : i < currentStep
                        ? 'bg-amber-700'
                        : 'bg-stone-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Current step */}
            <div className="bg-stone-800/60 rounded-2xl p-6 md:p-10 mb-6 border border-stone-700/50 min-h-[200px] flex items-center">
              <p className="cook-step-text text-stone-100 leading-relaxed text-2xl md:text-3xl font-medium">
                {recipe.instructions[currentStep]}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={goPrev}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-stone-700 text-stone-300 font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-stone-600 hover:text-stone-100 transition-all"
              >
                <ArrowLeft size={16} />
                Previous
              </button>

              {isDone ? (
                <button
                  onClick={() => showToast("You're done! Great cooking! 🎉", 'success')}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors"
                >
                  <Check size={18} />
                  Finished! Add a note?
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-500 transition-all"
                >
                  Next Step
                  <ArrowRight size={16} />
                </button>
              )}
            </div>

            {/* All steps overview */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">All steps</h3>
              <ol className="space-y-2">
                {recipe.instructions.map((step, i) => (
                  <li
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all text-sm ${
                      i === currentStep
                        ? 'bg-amber-600/20 border border-amber-600/30'
                        : i < currentStep
                        ? 'opacity-50'
                        : 'hover:bg-stone-800/50'
                    }`}
                  >
                    <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < currentStep
                        ? 'bg-emerald-600 text-white'
                        : i === currentStep
                        ? 'bg-amber-500 text-white'
                        : 'bg-stone-700 text-stone-400'
                    }`}>
                      {i < currentStep ? <Check size={10} /> : i + 1}
                    </span>
                    <span className="leading-relaxed text-stone-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Cooking notes */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Cooking Notes
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder='e.g. "Added extra garlic" or "Needed 5 more minutes"'
                  className="flex-1 px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent"
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  className="px-4 py-3 rounded-xl bg-amber-600 text-white font-medium disabled:opacity-40 hover:bg-amber-500 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              {notes.length > 0 ? (
                <ul className="space-y-2">
                  {notes.map(note => (
                    <li key={note.id} className="flex items-start gap-3 p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
                      <Star size={13} className="text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-300">{note.text}</p>
                        <p className="text-xs text-stone-500 mt-1">{formatDateTime(note.timestamp)}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-stone-600 hover:text-red-400 rounded transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-stone-600 text-sm italic">
                  Notes you add while cooking will appear here and save to your vault.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar: ingredients */}
          <div className="lg:block">
            <div className="sticky top-24">
              <button
                onClick={() => setShowIngredients(!showIngredients)}
                className="lg:hidden w-full flex items-center justify-between p-4 bg-stone-800 rounded-xl mb-4 text-sm font-medium text-stone-300"
              >
                Ingredients ({recipe.ingredients.length})
                <span className="text-stone-500">{showIngredients ? '▲' : '▼'}</span>
              </button>

              <div className={`${showIngredients ? 'block' : 'hidden'} lg:block`}>
                <div className="bg-stone-800/60 rounded-2xl p-5 border border-stone-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-stone-300">Ingredients</h3>
                    <span className="text-xs text-stone-500">
                      {checkedIngredients.size}/{recipe.ingredients.length}
                    </span>
                  </div>

                  <ul className="space-y-2.5">
                    {recipe.ingredients.map((ing, i) => (
                      <li
                        key={i}
                        onClick={() => toggleIngredient(i)}
                        className={`flex items-start gap-2.5 cursor-pointer group transition-opacity ${
                          checkedIngredients.has(i) ? 'opacity-40' : 'opacity-100'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          checkedIngredients.has(i)
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-stone-600 group-hover:border-stone-500'
                        }`}>
                          {checkedIngredients.has(i) && <Check size={10} className="text-white" />}
                        </div>
                        <span className={`text-xs leading-relaxed ${
                          checkedIngredients.has(i) ? 'line-through text-stone-500' : 'text-stone-300'
                        }`}>
                          {ing}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {checkedIngredients.size > 0 && (
                    <button
                      onClick={() => setCheckedIngredients(new Set())}
                      className="mt-4 w-full text-xs text-stone-600 hover:text-stone-400 transition-colors"
                    >
                      Reset checklist
                    </button>
                  )}
                </div>

                {/* Times */}
                {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
                  <div className="mt-3 bg-stone-800/60 rounded-2xl p-4 border border-stone-700/50">
                    <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">At a glance</h3>
                    <div className="space-y-2 text-sm">
                      {recipe.prepTime && (
                        <div className="flex justify-between">
                          <span className="text-stone-500">Prep</span>
                          <span className="text-stone-300 font-medium">{recipe.prepTime}</span>
                        </div>
                      )}
                      {recipe.cookTime && (
                        <div className="flex justify-between">
                          <span className="text-stone-500">Cook</span>
                          <span className="text-stone-300 font-medium">{recipe.cookTime}</span>
                        </div>
                      )}
                      {recipe.servings && (
                        <div className="flex justify-between">
                          <span className="text-stone-500">Serves</span>
                          <span className="text-stone-300 font-medium">{recipe.servings}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
