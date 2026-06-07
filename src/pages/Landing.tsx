import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChefHat, Sparkles, Lock, Camera, FileText, Clock, Check,
  ArrowRight, Star, Heart, Zap, Users, Image, Scale,
  Mic, Timer, Link2, Globe,
} from 'lucide-react';
import { useToast } from '../components/Toast';

const PAIN_POINTS = [
  { icon: FileText, title: 'No more recipe blog clutter', desc: 'Recipe blogs are 80% life story and ads. We extract just the recipe.', color: 'text-rose-500 bg-rose-50' },
  { icon: Camera, title: 'No more lost screenshots', desc: 'Screenshots get buried in your camera roll. Your vault is searchable and organized.', color: 'text-violet-500 bg-violet-50' },
  { icon: Lock, title: 'No more locked screen while cooking', desc: 'Cook Mode keeps your screen awake. No more flour-covered unlocking.', color: 'text-amber-500 bg-amber-50' },
  { icon: Heart, title: 'No more forgotten family recipes', desc: "Grandma's handwritten cards deserve more than a kitchen drawer. Keep them forever.", color: 'text-emerald-500 bg-emerald-50' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Paste or upload a recipe', desc: 'Drop in a URL, paste raw text, upload a photo, or type it yourself.' },
  { step: '02', title: 'Get a clean cooking card', desc: 'We strip the clutter and format it perfectly every time.' },
  { step: '03', title: 'Cook with screen-on mode', desc: 'Hands-free step-by-step mode that keeps your screen awake.' },
  { step: '04', title: 'Add notes and keep forever', desc: 'Log what you changed, what the kids liked, and what to do next time.' },
];

const TESTIMONIALS = [
  { quote: "I had recipes in 4 different apps, a Google Doc, and 200 screenshots. This finally fixed that.", author: 'Sarah M.', role: 'Mom of 3, Seattle', avatar: '👩‍🍳' },
  { quote: "The Cook Mode alone is worth it. My phone used to lock every 30 seconds mid-recipe.", author: 'James T.', role: 'Home cook, Austin', avatar: '👨‍🍳' },
  { quote: "I digitized my grandmother's recipe box in an afternoon. These recipes were nearly lost.", author: 'Maria K.', role: 'Family recipe keeper, Chicago', avatar: '👵' },
];

const THUMBNAIL_CARDS = [
  { gradient: 'bg-gradient-to-br from-amber-300 via-orange-300 to-orange-400', emoji: '🍪', title: "Grandma's Cookies", time: '25 min', serves: '48 cookies', tags: ['dessert', 'baking'] },
  { gradient: 'bg-gradient-to-br from-emerald-300 via-teal-300 to-teal-500', emoji: '🥗', title: 'Mango Avocado Salad', time: '15 min', serves: '4 servings', tags: ['healthy', 'quick'] },
  { gradient: 'bg-gradient-to-br from-red-300 via-rose-400 to-rose-500', emoji: '🍝', title: 'Sunday Bolognese', time: '3 hrs', serves: '6 servings', tags: ['italian', 'slow cook'] },
];

// ── Mock UI components ────────────────────────────────────────────────────────

function MessyBlogMock() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden w-full max-w-xs opacity-80">
      <div className="bg-stone-100 px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded px-2 py-0.5 text-xs text-stone-400 truncate">
          bestrecipesblog.com/chocolate-chip-cookies-my-grannys-story...
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="h-3 w-3/4 bg-stone-200 rounded animate-pulse" />
        <div className="h-2 w-full bg-stone-100 rounded" />
        <div className="h-2 w-5/6 bg-stone-100 rounded" />
        <div className="h-16 w-full bg-amber-100 rounded border border-amber-200 flex items-center justify-center">
          <span className="text-xs text-amber-600 font-medium">📢 AD — Sign up for our newsletter!</span>
        </div>
        <div className="h-2 w-full bg-stone-100 rounded" />
        <div className="h-2 w-4/5 bg-stone-100 rounded" />
        <div className="h-10 w-full bg-blue-100 rounded border border-blue-200 flex items-center justify-center">
          <span className="text-xs text-blue-600">🔔 Allow notifications?</span>
        </div>
        <div className="h-2 w-full bg-stone-100 rounded" />
        <p className="text-xs text-stone-400 italic text-center pt-2">scroll down 3,000px for actual recipe…</p>
      </div>
    </div>
  );
}

function MockRecipeCard() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden w-full max-w-sm">
      <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">🍪</span>
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">Grandma's Chocolate Chip Cookies</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-stone-500"><Clock size={10} />15 min prep</span>
              <span className="flex items-center gap-1 text-xs text-stone-500"><Clock size={10} />11 min cook</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold text-stone-900 mb-2">Ingredients</p>
            <ul className="space-y-1">
              {['2¼ cups flour', '1 tsp baking soda', '1 cup butter', '¾ cup brown sugar'].map(i => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-stone-600">
                  <span className="mt-1 w-1 h-1 rounded-full bg-amber-400 shrink-0" />{i}
                </li>
              ))}
              <li className="text-xs text-stone-400">+ 5 more…</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-900 mb-2">Instructions</p>
            <ul className="space-y-1">
              {['Preheat to 375°F', 'Mix dry ingredients', 'Cream butter & sugar'].map((s, i) => (
                <li key={s} className="flex items-start gap-1.5 text-xs text-stone-600">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  {s}
                </li>
              ))}
              <li className="text-xs text-stone-400">+ 5 more…</li>
            </ul>
          </div>
        </div>
        <div className="flex gap-2 pt-3 border-t border-stone-100">
          <div className="flex-1 py-2 rounded-lg bg-amber-600 text-center text-xs font-semibold text-white">Cook Mode</div>
          <div className="flex-1 py-2 rounded-lg border border-stone-200 text-center text-xs font-semibold text-stone-700">Save to Vault</div>
        </div>
      </div>
    </div>
  );
}

function CleanerMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-amber-100/60 rounded-3xl blur-2xl -z-10" />
      <div className="bg-stone-100 rounded-2xl p-4 shadow-2xl border border-stone-200">
        <div className="bg-white rounded-xl p-3 mb-3 border border-stone-200">
          <div className="flex gap-1 mb-2.5">
            {['URL', 'Text', 'Photo'].map((m, i) => (
              <div key={m} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${i === 0 ? 'bg-amber-600 text-white' : 'text-stone-500'}`}>{m}</div>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-3 py-2 border border-stone-200">
            <Link2 size={10} className="text-stone-400 shrink-0" />
            <span className="text-xs text-stone-400 truncate">allrecipes.com/recipe/chocolate-chip-cookies-ii</span>
          </div>
        </div>
        <div className="bg-amber-600 rounded-xl p-2.5 text-center mb-3 flex items-center justify-center gap-1.5 cursor-default">
          <Sparkles size={11} className="text-amber-100" />
          <span className="text-white text-xs font-semibold">Clean Recipe</span>
        </div>
        <div className="flex items-center justify-center mb-3 gap-2">
          <div className="flex gap-0.5">
            {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
          </div>
          <span className="text-xs text-stone-400">cleaned in 1.2s</span>
        </div>
        <div className="bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xl">🍪</span>
              <div>
                <p className="text-xs font-bold text-stone-900">Chocolate Chip Cookies</p>
                <p className="text-xs text-stone-400">48 cookies · 15 min prep · 11 min bake</p>
              </div>
            </div>
            <div className="space-y-1 mb-2.5">
              {['2¼ cups all-purpose flour', '1 tsp baking soda', '1 cup butter, softened'].map(i => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-stone-600">
                  <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />{i}
                </div>
              ))}
              <div className="text-xs text-stone-400">+ 6 more ingredients…</div>
            </div>
            <div className="flex gap-1.5">
              <div className="flex-1 py-1.5 rounded-lg bg-amber-600 text-center text-xs font-semibold text-white">Cook Mode</div>
              <div className="flex-1 py-1.5 rounded-lg border border-stone-200 text-center text-xs font-semibold text-stone-700">Save</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThumbnailCardMock({ gradient, emoji, title, time, serves, tags }: typeof THUMBNAIL_CARDS[0]) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden group cursor-default" style={{ boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
      <div className={`h-36 ${gradient} relative flex items-end overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 to-transparent" />
        <div className="relative p-3">
          <span className="text-2xl drop-shadow">{emoji}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-stone-900 text-sm mb-1">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-stone-400 mb-2.5">
          <span className="flex items-center gap-1"><Clock size={9} />{time}</span>
          <span className="flex items-center gap-1"><Users size={9} />{serves}</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      </div>
    </div>
  );
}

function ScaleMockup() {
  const [count, setCount] = useState(4);
  const ings: [number, string][] = [
    [2.25, 'cups all-purpose flour'],
    [1, 'cup butter'],
    [0.75, 'cup brown sugar'],
    [2, 'large eggs'],
    [2, 'tsp vanilla extract'],
  ];

  const fmt = (n: number): string => {
    if (n <= 0) return '0';
    const FRACS: [number, string][] = [[0.25, '¼'], [1/3, '⅓'], [0.5, '½'], [2/3, '⅔'], [0.75, '¾']];
    const whole = Math.floor(n);
    const rem = n - whole;
    const fracStr = FRACS.find(([v]) => Math.abs(v - rem) < 0.07)?.[1] ?? (rem > 0.01 ? `.${Math.round(rem * 10)}` : '');
    return whole > 0 ? `${whole}${fracStr}` : fracStr || n.toFixed(1);
  };

  return (
    <div className="card p-6">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-5 text-center">Try it — drag the serving count</p>
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={() => setCount(c => Math.max(1, c - 1))} className="stepper-btn bg-stone-100 hover:bg-amber-100 text-stone-700">−</button>
        <div className="text-center min-w-[5rem]">
          <div className="text-5xl font-bold text-stone-900 leading-none tabular-nums">{count}</div>
          <div className="text-xs text-stone-500 mt-1.5">servings</div>
        </div>
        <button onClick={() => setCount(c => Math.min(24, c + 1))} className="stepper-btn bg-stone-100 hover:bg-amber-100 text-stone-700">+</button>
      </div>
      <ul className="space-y-2.5">
        {ings.map(([base, label], i) => {
          const scaled = base * count / 4;
          return (
            <li key={i} className="flex items-center gap-2.5 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="font-semibold text-amber-700 min-w-[3.5rem]">{fmt(scaled)}</span>
              <span className="text-stone-600">{label}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 pt-4 border-t border-stone-100 flex justify-center gap-2">
        {['Imperial', 'Metric'].map((u, i) => (
          <div key={u} className={`px-3 py-1 rounded-lg text-xs font-semibold border ${i === 0 ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-500 border-stone-200'}`}>{u}</div>
        ))}
      </div>
    </div>
  );
}

function CookModeMock() {
  return (
    <div className="bg-stone-900 rounded-2xl p-6 border border-stone-800" style={{ boxShadow: '0 25px 50px rgba(0,0,0,.4)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-1.5 bg-stone-700 rounded-full overflow-hidden">
          <div className="w-3/5 h-full bg-amber-500 rounded-full" />
        </div>
        <span className="text-xs text-stone-400 shrink-0">Step 3 of 5</span>
      </div>
      <div className="mb-5">
        <div className="text-xs text-stone-500 mb-2 font-medium uppercase tracking-wider">Step 3</div>
        <p className="text-stone-100 text-lg leading-relaxed font-medium">
          Cream together the butter and sugars until light and fluffy, about{' '}
          <span className="text-amber-400 font-bold">2 minutes</span>.
        </p>
      </div>
      <div className="flex items-center gap-2 mb-5 w-fit px-3 py-2 rounded-xl bg-amber-600/15 border border-amber-600/25 cursor-default">
        <Timer size={13} className="text-amber-400" />
        <span className="text-amber-300 text-xs font-medium">Start 2-min timer</span>
      </div>
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs">
          <Mic size={11} /> Say "next" or "back"
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Screen on
        </div>
      </div>
      <div className="flex gap-3">
        <button className="flex-1 py-3 rounded-xl border border-stone-700 text-stone-400 text-sm font-medium">← Prev</button>
        <button className="flex-1 py-3 rounded-xl bg-amber-600 text-white text-sm font-bold">Next step →</button>
      </div>
    </div>
  );
}

// ── Main Landing page ─────────────────────────────────────────────────────────

export default function Landing() {
  const [email, setEmail] = useState('');
  const [heroEmail, setHeroEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [heroSubmitted, setHeroSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleHeroSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroEmail.includes('@')) { showToast('Please enter a valid email.', 'error'); return; }
    setHeroSubmitted(true);
    showToast("You're signed up for early access! 🎉", 'success');
    setHeroEmail('');
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { showToast('Please enter a valid email.', 'error'); return; }
    setSubmitted(true);
    showToast("You're on the list! 🎉", 'success');
    setEmail('');
  };

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-amber-50/60 to-stone-50 pt-20 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold mb-6">
                <Sparkles size={12} /> Early access — join the waitlist today
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-stone-900 tracking-tight leading-[1.05] mb-6 text-balance">
                Save any recipe.{' '}
                <span className="text-amber-600">Cook it anywhere.</span>{' '}
                Keep it forever.
              </h1>
              <p className="text-xl text-stone-500 leading-relaxed mb-8 max-w-lg">
                Recipes.md turns cluttered food blog posts, screenshots, and handwritten cards into beautiful, searchable recipe cards — ready to cook from.
              </p>
              {heroSubmitted ? (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 mb-6">
                  <Check size={20} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-emerald-800 text-sm">You're signed up!</p>
                    <p className="text-emerald-700 text-xs">We'll email you when early access opens.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleHeroSignup} className="flex flex-col sm:flex-row gap-2 mb-6 max-w-md">
                  <input type="email" value={heroEmail} onChange={e => setHeroEmail(e.target.value)} placeholder="your@email.com"
                    className="flex-1 px-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 shadow-sm" />
                  <button type="submit" className="btn-primary px-6 py-3 whitespace-nowrap">Sign Up Free</button>
                </form>
              )}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Link to="/cleaner" className="btn-secondary text-sm px-5 py-2.5">
                  <Zap size={16} /> Try Recipe Cleaner <ArrowRight size={14} />
                </Link>
                <Link to="/family-vault" className="btn-ghost text-sm px-5 py-2.5">
                  <Heart size={16} /> Preserve Family Recipes
                </Link>
              </div>
              <div className="flex items-center gap-5 text-sm text-stone-500">
                <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" />Free 10 recipes</span>
                <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" />No credit card</span>
                <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" />Works offline</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-4 justify-center lg:justify-end">
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Before</p>
                <MessyBlogMock />
              </div>
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-600 text-white text-xs font-semibold shadow-lg">
                  <Sparkles size={12} /> Cleaned
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">After</p>
                <MockRecipeCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ─────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-stone-200 py-5">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-stone-500">
          {[['🏠', 'Built for home cooks'], ['🔒', 'Data stays on your device'], ['⚡', 'Works instantly, no account'], ['👨‍👩‍👧', 'Share with family'], ['📱', 'Mobile-first']].map(([icon, label]) => (
            <span key={label} className="flex items-center gap-2"><span>{icon}</span>{label}</span>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title mb-4">The recipe chaos is <span className="text-amber-600">real.</span></h2>
            <p className="section-subtitle mx-auto">Every home cook deals with the same mess. It doesn't have to be this way.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {PAIN_POINTS.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card p-6 flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}><Icon size={20} /></div>
                <div>
                  <h3 className="font-semibold text-stone-900 mb-1">{title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title mb-4">How it works</h2>
            <p className="section-subtitle mx-auto">Four simple steps. Start cooking better today.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                  <span className="text-sm font-bold text-amber-700">{step}</span>
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/cleaner" className="btn-primary text-base px-8 py-4">
              <Zap size={16} /> Try it free — no signup
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURE: RECIPE CLEANER ─────────────────────────────────────── */}
      <section className="py-24 px-4 bg-amber-50/40">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold mb-5">
                <Sparkles size={12} /> Feature highlight
              </div>
              <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-5 leading-tight">
                Any recipe. One clean card.
              </h2>
              <p className="text-stone-500 text-lg leading-relaxed mb-7">
                Paste a URL, type out a recipe, or photograph a handwritten card. We remove every ad, pop-up, and life story — and give you exactly what you need to cook.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: Globe, text: 'Works with any recipe website or blog' },
                  { icon: FileText, text: 'Paste raw text — we extract the structure' },
                  { icon: Camera, text: 'Upload a photo of a handwritten recipe card' },
                  { icon: Check, text: 'Ingredients, steps, times — perfectly formatted' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-stone-700 text-sm">
                    <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={11} className="text-amber-700" />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
              <Link to="/cleaner" className="btn-primary">
                Try Recipe Cleaner <ArrowRight size={16} />
              </Link>
            </div>
            <CleanerMockup />
          </div>
        </div>
      </section>

      {/* ── FEATURE: RECIPE PHOTOS ──────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-800 text-xs font-semibold mb-5">
              <Image size={12} /> Feature highlight
            </div>
            <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-4 leading-tight">
              Beautiful recipe cards, with your photos
            </h2>
            <p className="section-subtitle mx-auto">
              Add a food photo to any recipe. Your vault goes from a plain text list to a visual cookbook you're proud to scroll through.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {THUMBNAIL_CARDS.map(card => <ThumbnailCardMock key={card.title} {...card} />)}
          </div>
          <div className="card p-6 max-w-xl mx-auto flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-2xl">📸</div>
            <div>
              <p className="font-semibold text-stone-900 mb-1">Adding a photo is one tap</p>
              <p className="text-stone-500 text-sm">After cleaning any recipe, click "Add a photo" and upload from your camera roll or take a new one. It's saved with the recipe forever.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE: SCALE & CONVERT ────────────────────────────────────── */}
      <section className="py-24 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <ScaleMockup />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-5">
                <Scale size={12} /> Feature highlight
              </div>
              <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-5 leading-tight">
                Scale for any crowd. Convert any unit.
              </h2>
              <p className="text-stone-500 text-lg leading-relaxed mb-7">
                Cooking for 2 or 20? Dial in the serving count and every ingredient updates instantly — fractions and all. Plus one-tap Imperial ↔ Metric conversion.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Serving count 1–24 with live ingredient scaling',
                  'Fractions stay readable: 2¼ cups, ⅓ tsp',
                  'Cups → mL · oz → g · °F → °C · inches → cm',
                  'Works in Cleaner, Vault modal, and Cook Mode',
                ].map(text => (
                  <li key={text} className="flex items-start gap-3 text-stone-700 text-sm">
                    <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    {text}
                  </li>
                ))}
              </ul>
              <Link to="/cleaner" className="btn-primary">
                Try it now <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE: COOK MODE ──────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-stone-900">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-600/20 border border-amber-600/30 text-amber-400 text-xs font-semibold mb-5">
                <ChefHat size={12} /> Feature highlight
              </div>
              <h2 className="text-4xl font-bold text-stone-100 tracking-tight mb-5 leading-tight">
                Cook Mode. Hands-free. Screen stays on.
              </h2>
              <p className="text-stone-400 text-lg leading-relaxed mb-7">
                No more phone-unlocking with floury hands. Cook Mode presents one step at a time, detects timers, and listens for voice commands.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: Zap, text: 'Screen stays on — Wake Lock API' },
                  { icon: Mic, text: 'Say "next", "back", or "repeat"' },
                  { icon: Timer, text: 'Auto-detects timers in your steps' },
                  { icon: Star, text: 'Rate and log every cook session' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-stone-300 text-sm">
                    <div className="w-5 h-5 rounded-full bg-amber-600/20 border border-amber-600/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={11} className="text-amber-400" />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
              <Link to="/vault" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-500 transition-colors">
                Start Cooking <ArrowRight size={16} />
              </Link>
            </div>
            <CookModeMock />
          </div>
        </div>
      </section>

      {/* ── FAMILY VAULT ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-rose-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-5">👵</div>
          <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-4">
            Preserve the recipes that matter most.
          </h2>
          <p className="text-stone-500 text-xl leading-relaxed mb-8 max-w-xl mx-auto">
            Your Family Vault is for handwritten cards, secret sauces, and dishes passed down through generations. Add the story, the decade, the memory.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
            {[
              { emoji: '🍲', title: "Mom's Beef Stew", rel: 'Mom · 1970s' },
              { emoji: '🥧', title: 'Apple Kuchen', rel: 'Oma · 1950s' },
              { emoji: '🥘', title: 'Chicken Adobo', rel: 'Lola · 1990s' },
            ].map(r => (
              <div key={r.title} className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm text-center">
                <div className="text-2xl mb-2">{r.emoji}</div>
                <div className="text-xs font-semibold text-stone-900 mb-1 line-clamp-2">{r.title}</div>
                <div className="text-xs text-rose-500">{r.rel}</div>
              </div>
            ))}
          </div>
          <Link to="/family-vault" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500 text-white font-semibold text-sm hover:bg-rose-600 transition-colors">
            <Heart size={16} fill="currentColor" /> Start Your Family Vault
          </Link>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">Home cooks love it.</h2>
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} size={20} className="text-amber-400 fill-amber-400" />)}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ quote, author, role, avatar }) => (
              <div key={author} className="card p-6">
                <div className="text-3xl mb-4">{avatar}</div>
                <p className="text-stone-700 text-sm leading-relaxed mb-4 italic">"{quote}"</p>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">{author}</p>
                  <p className="text-stone-400 text-xs">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-stone-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="section-title mb-4">Simple pricing.</h2>
          <p className="section-subtitle mx-auto mb-12">Start free. Upgrade when you need more.</p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              { name: 'Free', price: '$0', period: 'forever', features: ['10 saved recipes', 'Cook Mode', 'Recipe Cleaner', 'Family Vault (3 recipes)'], cta: 'Get started free', href: '/cleaner', highlight: false },
              { name: 'Home Cook', price: '$4', period: '/month', features: ['Unlimited recipes', 'Collections & tags', 'Grocery list', 'Family Vault (unlimited)', 'Export & print'], cta: 'Join the waitlist', href: '/pricing', highlight: true },
            ].map(plan => (
              <div key={plan.name} className={`card p-7 flex flex-col text-left ${plan.highlight ? 'ring-2 ring-amber-500' : ''}`}>
                {plan.highlight && <div className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-3">Most popular</div>}
                <h3 className="text-xl font-bold text-stone-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-bold text-stone-900">{plan.price}</span>
                  <span className="text-stone-400 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-stone-700">
                      <Check size={14} className="text-emerald-500 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.href} className={plan.highlight ? 'btn-primary' : 'btn-secondary'}>{plan.cta}</Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-stone-400 text-sm">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-amber-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white tracking-tight mb-4">Your recipe box. Upgraded.</h2>
          <p className="text-amber-100 text-xl mb-8">Join home cooks who've finally got their recipes organized.</p>
          {submitted ? (
            <div className="inline-flex items-center gap-3 p-4 rounded-2xl bg-white/20 border border-white/30 text-white">
              <Check size={20} />
              <span className="font-semibold">You're on the list!</span>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-sm" />
              <button type="submit" className="px-6 py-3 rounded-xl bg-white text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-colors whitespace-nowrap">Join Waitlist</button>
            </form>
          )}
          <div className="mt-6 flex justify-center gap-6 text-amber-100 text-sm">
            <Link to="/cleaner" className="hover:text-white transition-colors">Try Cleaner →</Link>
            <Link to="/vault" className="hover:text-white transition-colors">My Vault →</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing →</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
