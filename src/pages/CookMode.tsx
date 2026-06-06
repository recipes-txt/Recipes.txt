import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Sun, EyeOff, Check, ChevronLeft, Plus, X,
  Star, AlertCircle, Timer, Mic, MicOff,
} from 'lucide-react';
import { getRecipeById, addNote, addCookLog } from '../lib/storage';
import { Recipe, CookingNote, CookLog } from '../types';
import { generateId, formatDateTime } from '../lib/utils';
import { useToast } from '../components/Toast';
import { scaleIngredient, SCALE_OPTIONS } from '../lib/ingredientScaler';
import { detectTimer } from '../lib/timerParser';

// ── Confetti ─────────────────────────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#f97316'];
  const particles = Array.from({ length: 180 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 80,
    vx: (Math.random() - 0.5) * 7,
    vy: Math.random() * 4 + 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    w: Math.random() * 10 + 4,
    h: Math.random() * 6 + 3,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 12,
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.rotation += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / 180);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (++frame < 220) requestAnimationFrame(draw);
    else document.body.removeChild(canvas);
  }
  draw();
}

// ── Wake lock button ─────────────────────────────────────────────────────────
function WakeLockButton({ supported }: { supported: boolean }) {
  const [locked, setLocked] = useState(false);
  const ref = useRef<WakeLockSentinel | null>(null);

  const request = async () => {
    if (!supported) return;
    try {
      ref.current = await navigator.wakeLock.request('screen');
      setLocked(true);
      ref.current.addEventListener('release', () => setLocked(false));
    } catch { setLocked(false); }
  };

  const release = async () => {
    try { await ref.current?.release(); ref.current = null; setLocked(false); } catch { /* ignore */ }
  };

  useEffect(() => () => { release(); }, []);

  if (!supported) return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-800/50 border border-stone-700">
      <AlertCircle size={14} className="text-stone-500" />
      <span className="text-xs text-stone-500">Wake lock unavailable</span>
    </div>
  );

  return (
    <button
      onClick={locked ? release : request}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${locked
        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
        : 'bg-stone-800/50 border border-stone-700 text-stone-400 hover:text-stone-200 hover:border-stone-600'
      }`}
    >
      {locked ? <Sun size={14} /> : <EyeOff size={14} />}
      {locked ? 'Screen on' : 'Keep screen on'}
    </button>
  );
}

// ── Countdown timer ──────────────────────────────────────────────────────────
function StepTimer({ minutes }: { minutes: number }) {
  const [active, setActive] = useState(false);
  const [remaining, setRemaining] = useState(minutes * 60);
  const intervalRef = useRef<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setActive(false);
    setRemaining(minutes * 60);
  }, [minutes]);

  useEffect(() => {
    if (active && remaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current!);
            setActive(false);
            showToast('⏰ Timer done!', 'success');
            if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else if (!active && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = (remaining / (minutes * 60)) * 100;

  const toggle = () => {
    if (remaining === 0) { setRemaining(minutes * 60); setActive(false); return; }
    setActive(a => !a);
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border mt-3 ${
        active
          ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
          : remaining === 0
          ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
          : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:text-stone-200'
      }`}
    >
      <Timer size={13} />
      {remaining === 0 ? 'Done!' : `${mins}:${String(secs).padStart(2, '0')}`}
      {!active && remaining > 0 && remaining === minutes * 60 && (
        <span className="text-stone-500">· {minutes} min</span>
      )}
      {active && (
        <svg viewBox="0 0 20 4" className="w-12 h-1 ml-1">
          <rect width="20" height="4" rx="2" className="fill-stone-700" />
          <rect width={`${pct * 0.2}`} height="4" rx="2" className="fill-amber-500" />
        </svg>
      )}
    </button>
  );
}

// ── Finished cooking overlay ──────────────────────────────────────────────────
function FinishedOverlay({
  recipe,
  onDone,
}: {
  recipe: Recipe;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSave = () => {
    const log: CookLog = {
      id: generateId(),
      rating,
      note: note.trim() || undefined,
      cookedAt: new Date().toISOString(),
    };
    addCookLog(recipe.id, log);
    showToast('Cook logged! Great job. 🍳', 'success');
    navigate('/vault');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/95 flex items-center justify-center p-6">
      <div className="bg-stone-800 rounded-3xl p-8 max-w-sm w-full text-center border border-stone-700 shadow-2xl animate-slide-up">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-stone-100 mb-1">You did it!</h2>
        <p className="text-stone-400 text-sm mb-6">{recipe.title}</p>

        <p className="text-stone-300 text-sm font-medium mb-3">How did it turn out?</p>
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setRating(n)}>
              <Star
                size={32}
                className={`transition-all ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-stone-600 hover:text-amber-400'}`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder='Quick note — "Added extra garlic, perfect texture"…'
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-stone-700 border border-stone-600 text-stone-200 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-500 transition-colors"
          >
            {rating > 0 ? 'Save & finish' : 'Finish cooking'}
          </button>
          <button
            onClick={() => navigate('/vault')}
            className="px-4 py-3 rounded-xl border border-stone-600 text-stone-400 text-sm hover:text-stone-200 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main CookMode ─────────────────────────────────────────────────────────────
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
  const [scale, setScale] = useState(1);
  const [showFinished, setShowFinished] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => { setWakeLockSupported('wakeLock' in navigator); }, []);

  useEffect(() => {
    if (!id) return;
    const r = getRecipeById(id);
    if (r) { setRecipe(r); setNotes(r.notes); }
  }, [id]);

  const toggleIngredient = useCallback((i: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, []);

  const haptic = (pattern: number | number[]) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  const goNext = useCallback(() => {
    if (!recipe) return;
    if (currentStep < recipe.instructions.length - 1) {
      setCurrentStep(s => s + 1);
      haptic(40);
    }
  }, [recipe, currentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) { setCurrentStep(s => s - 1); haptic(40); }
  }, [currentStep]);

  // Voice commands
  const toggleVoice = () => {
    type SpeechRecCtor = new () => {
      continuous: boolean; interimResults: boolean; start(): void; stop(): void;
      onresult: ((e: { results: { length: number; [n: number]: { [n: number]: { transcript: string } } } }) => void) | null;
      onerror: (() => void) | null; onend: (() => void) | null;
    };
    const SpeechRec = ((window as unknown as Record<string, unknown>).SpeechRecognition
      || (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as SpeechRecCtor | undefined;
    if (!SpeechRec) { showToast('Voice commands not supported in this browser.', 'error'); return; }

    if (voiceActive) {
      (recognitionRef.current as { stop(): void } | null)?.stop();
      setVoiceActive(false);
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const t = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
      if (t.includes('next')) goNext();
      else if (t.includes('back') || t.includes('previous')) goPrev();
      else if (t.includes('repeat')) { /* stay on step */ haptic(20); }
      else if (t.includes('ingredient')) setShowIngredients(true);
    };
    rec.onerror = () => { setVoiceActive(false); };
    rec.onend = () => { setVoiceActive(false); };
    rec.start();
    recognitionRef.current = rec;
    setVoiceActive(true);
    showToast('Voice commands on — say "next", "back", or "repeat"', 'info');
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !recipe) return;
    const note: CookingNote = { id: generateId(), text: noteText.trim(), timestamp: new Date().toISOString() };
    addNote(recipe.id, note);
    setNotes(prev => [note, ...prev]);
    setNoteText('');
    showToast('Note saved!', 'success');
  };

  if (!recipe) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center flex-col gap-4 text-center px-4">
        <div className="text-5xl mb-2">🍳</div>
        <h2 className="text-white text-xl font-semibold">Recipe not found</h2>
        <p className="text-stone-400 text-sm">This recipe may have been deleted.</p>
        <Link to="/vault" className="btn-primary mt-2">Go to My Vault</Link>
      </div>
    );
  }

  const scaledIngredients = recipe.ingredients.map(i => scaleIngredient(i, scale));
  const totalSteps = recipe.instructions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isDone = currentStep === totalSteps - 1;

  // ── PREP STAGE ──────────────────────────────────────────────────────────────
  if (prepStage) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col">
        <div className="sticky top-0 z-10 bg-stone-900/95 backdrop-blur-sm border-b border-stone-800">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
            <button onClick={() => navigate('/vault')} className="flex items-center gap-2 text-stone-400 hover:text-stone-200 text-sm font-medium">
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
            <p className="text-stone-400 text-sm">Check off what you have before cooking starts.</p>
          </div>

          {/* Scale selector */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-xs text-stone-500 font-medium mr-1">Scale:</span>
            {SCALE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setScale(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  scale === opt.value
                    ? 'bg-amber-600 border-amber-600 text-white'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="bg-stone-800/60 rounded-2xl p-6 border border-stone-700/50 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-200">Ingredients</h3>
              <span className="text-xs text-stone-500">{checkedIngredients.size}/{recipe.ingredients.length} ready</span>
            </div>
            <ul className="space-y-3">
              {scaledIngredients.map((ing, i) => (
                <li key={i} onClick={() => toggleIngredient(i)} className={`flex items-start gap-3 cursor-pointer group transition-opacity ${checkedIngredients.has(i) ? 'opacity-40' : ''}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${checkedIngredients.has(i) ? 'bg-emerald-500 border-emerald-500' : 'border-stone-600 group-hover:border-stone-400'}`}>
                    {checkedIngredients.has(i) && <Check size={12} className="text-white" />}
                  </div>
                  <span className={`text-sm leading-relaxed ${checkedIngredients.has(i) ? 'line-through text-stone-500' : 'text-stone-300'}`}>{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => { setCheckedIngredients(new Set()); setPrepStage(false); }}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-amber-600 text-white font-semibold text-base hover:bg-amber-500 transition-colors"
          >
            Start Cooking <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ── COOK STAGE ──────────────────────────────────────────────────────────────
  const stepTimer = detectTimer(recipe.instructions[currentStep]);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      {showFinished && <FinishedOverlay recipe={recipe} onDone={() => setShowFinished(false)} />}

      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-stone-900/95 backdrop-blur-sm border-b border-stone-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/vault')} className="flex items-center gap-2 text-stone-400 hover:text-stone-200 text-sm font-medium">
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">{recipe.emoji || '🍳'}</span>
              <h1 className="text-sm font-semibold text-stone-200 truncate max-w-xs">{recipe.title}</h1>
              {scale !== 1 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-600/30 text-amber-300 text-xs font-bold">
                  {SCALE_OPTIONS.find(o => o.value === scale)?.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-lg text-xs transition-all ${voiceActive ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' : 'text-stone-500 hover:text-stone-300'}`}
              title="Voice commands"
            >
              {voiceActive ? <Mic size={15} /> : <MicOff size={15} />}
            </button>
            <WakeLockButton supported={wakeLockSupported} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-stone-800">
          <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main: step-by-step */}
          <div className="lg:col-span-2">
            {/* Step counter + dots */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-stone-500 text-sm font-medium">Step {currentStep + 1} of {totalSteps}</span>
              <div className="flex items-center gap-1">
                {recipe.instructions.map((_, i) => (
                  <button key={i} onClick={() => { setCurrentStep(i); haptic(20); }} className={`rounded-full transition-all ${i === currentStep ? 'bg-amber-400 w-4 h-2' : i < currentStep ? 'bg-amber-700 w-2 h-2' : 'bg-stone-700 w-2 h-2'}`} />
                ))}
              </div>
            </div>

            {/* Current step — large readable text */}
            <div className="bg-stone-800/60 rounded-2xl p-6 md:p-10 mb-4 border border-stone-700/50 min-h-[200px] flex flex-col justify-center">
              <p className="text-stone-100 leading-relaxed text-2xl md:text-3xl font-medium">
                {recipe.instructions[currentStep]}
              </p>
              {stepTimer && <StepTimer minutes={stepTimer.minutes} />}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={goPrev}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-stone-700 text-stone-300 font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-stone-600 hover:text-stone-100 transition-all"
              >
                <ArrowLeft size={16} /> Previous
              </button>

              {isDone ? (
                <button
                  onClick={() => { launchConfetti(); haptic([100, 50, 100, 50, 200]); setShowFinished(true); }}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors"
                >
                  <Check size={18} /> Finished! 🎉
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-500 transition-all"
                >
                  Next Step <ArrowRight size={16} />
                </button>
              )}
            </div>

            {/* All steps overview */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">All steps</h3>
              <ol className="space-y-2">
                {recipe.instructions.map((step, i) => (
                  <li key={i} onClick={() => { setCurrentStep(i); haptic(20); }} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all text-sm ${i === currentStep ? 'bg-amber-600/20 border border-amber-600/30' : i < currentStep ? 'opacity-50' : 'hover:bg-stone-800/50'}`}>
                    <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < currentStep ? 'bg-emerald-600 text-white' : i === currentStep ? 'bg-amber-500 text-white' : 'bg-stone-700 text-stone-400'}`}>
                      {i < currentStep ? <Check size={10} /> : i + 1}
                    </span>
                    <span className="leading-relaxed text-stone-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Cooking notes */}
            <div>
              <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">Cooking Notes</h3>
              <div className="flex gap-2 mb-4">
                <input
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder='"Added extra garlic" or "Needed 5 more minutes"'
                  className="flex-1 px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                />
                <button onClick={handleAddNote} disabled={!noteText.trim()} className="px-4 py-3 rounded-xl bg-amber-600 text-white font-medium disabled:opacity-40 hover:bg-amber-500 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              {notes.length > 0 && (
                <ul className="space-y-2">
                  {notes.map(note => (
                    <li key={note.id} className="flex items-start gap-3 p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
                      <Star size={13} className="text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-300">{note.text}</p>
                        <p className="text-xs text-stone-500 mt-1">{formatDateTime(note.timestamp)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Sidebar: ingredients */}
          <div className="lg:block">
            <div className="sticky top-24">
              {/* Scale buttons in sidebar */}
              <div className="bg-stone-800/60 rounded-2xl p-4 border border-stone-700/50 mb-3">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Scale</p>
                <div className="flex gap-1.5">
                  {SCALE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setScale(opt.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${scale === opt.value ? 'bg-amber-600 text-white' : 'bg-stone-700 text-stone-400 hover:text-stone-200'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowIngredients(!showIngredients)}
                className="lg:hidden w-full flex items-center justify-between p-4 bg-stone-800 rounded-xl mb-3 text-sm font-medium text-stone-300"
              >
                Ingredients ({recipe.ingredients.length})
                <span className="text-stone-500">{showIngredients ? '▲' : '▼'}</span>
              </button>

              <div className={`${showIngredients ? 'block' : 'hidden'} lg:block`}>
                <div className="bg-stone-800/60 rounded-2xl p-5 border border-stone-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-stone-300">Ingredients</h3>
                    <span className="text-xs text-stone-500">{checkedIngredients.size}/{recipe.ingredients.length}</span>
                  </div>
                  <ul className="space-y-2.5">
                    {scaledIngredients.map((ing, i) => (
                      <li key={i} onClick={() => toggleIngredient(i)} className={`flex items-start gap-2.5 cursor-pointer group transition-opacity ${checkedIngredients.has(i) ? 'opacity-40' : ''}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${checkedIngredients.has(i) ? 'bg-emerald-500 border-emerald-500' : 'border-stone-600 group-hover:border-stone-500'}`}>
                          {checkedIngredients.has(i) && <Check size={10} className="text-white" />}
                        </div>
                        <span className={`text-xs leading-relaxed ${checkedIngredients.has(i) ? 'line-through text-stone-500' : 'text-stone-300'}`}>{ing}</span>
                      </li>
                    ))}
                  </ul>
                  {checkedIngredients.size > 0 && (
                    <button onClick={() => setCheckedIngredients(new Set())} className="mt-4 w-full text-xs text-stone-600 hover:text-stone-400 transition-colors">
                      Reset checklist
                    </button>
                  )}
                </div>

                {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
                  <div className="mt-3 bg-stone-800/60 rounded-2xl p-4 border border-stone-700/50">
                    <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">At a glance</h3>
                    <div className="space-y-2 text-sm">
                      {recipe.prepTime && <div className="flex justify-between"><span className="text-stone-500">Prep</span><span className="text-stone-300 font-medium">{recipe.prepTime}</span></div>}
                      {recipe.cookTime && <div className="flex justify-between"><span className="text-stone-500">Cook</span><span className="text-stone-300 font-medium">{recipe.cookTime}</span></div>}
                      {recipe.servings && <div className="flex justify-between"><span className="text-stone-500">Serves</span><span className="text-stone-300 font-medium">{recipe.servings}</span></div>}
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
