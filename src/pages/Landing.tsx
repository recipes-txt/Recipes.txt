import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChefHat, Sparkles, Lock, Camera, FileText, Clock, Check,
  ArrowRight, Star, BookOpen, Heart, Zap,
} from 'lucide-react';
import { useToast } from '../components/Toast';

const PAIN_POINTS = [
  {
    icon: FileText,
    title: 'No more recipe blog clutter',
    desc: 'Recipe blogs are 80% life story and ads. We extract just the recipe.',
    color: 'text-rose-500 bg-rose-50',
  },
  {
    icon: Camera,
    title: 'No more lost screenshots',
    desc: 'Screenshots get buried in your camera roll. Your vault is searchable and organized.',
    color: 'text-violet-500 bg-violet-50',
  },
  {
    icon: Lock,
    title: 'No more locked screen while cooking',
    desc: 'Cook Mode keeps your screen awake. No more flour-covered unlocking.',
    color: 'text-amber-500 bg-amber-50',
  },
  {
    icon: Heart,
    title: 'No more forgotten family recipes',
    desc: "Grandma's handwritten cards deserve more than a kitchen drawer. Keep them forever.",
    color: 'text-emerald-500 bg-emerald-50',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Paste or upload a recipe', desc: 'Drop in a URL, paste raw text, or type it yourself.' },
  { step: '02', title: 'Get a clean cooking card', desc: 'We strip the clutter and format it perfectly every time.' },
  { step: '03', title: 'Cook with screen-on mode', desc: 'Hands-free step-by-step mode that keeps your screen awake.' },
  { step: '04', title: 'Add notes and keep forever', desc: 'Log what you changed, what the kids liked, and what to do next time.' },
];

const TESTIMONIALS = [
  {
    quote: "I had recipes in 4 different apps, a Google Doc, and 200 screenshots. This finally fixed that.",
    author: 'Sarah M.',
    role: 'Mom of 3, Seattle',
    avatar: '👩‍🍳',
  },
  {
    quote: "The Cook Mode alone is worth it. My phone used to lock every 30 seconds mid-recipe.",
    author: 'James T.',
    role: 'Home cook, Austin',
    avatar: '👨‍🍳',
  },
  {
    quote: "I digitized my grandmother's recipe box in an afternoon. These recipes were nearly lost.",
    author: 'Maria K.',
    role: 'Family recipe keeper, Chicago',
    avatar: '👵',
  },
];

// Mini recipe card preview for the hero
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
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <Clock size={10} /> 15 min prep
              </span>
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <Clock size={10} /> 11 min cook
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold text-stone-900 mb-2">Ingredients</p>
            <ul className="space-y-1">
              {['2¼ cups flour', '1 tsp baking soda', '1 cup butter', '¾ cup brown sugar'].map(i => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-stone-600">
                  <span className="mt-1 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                  {i}
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
              <li className="text-xs text-stone-400">+ 5 more steps…</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-stone-100">
          <div className="flex-1 py-2 rounded-lg bg-amber-600 text-center text-xs font-semibold text-white">
            Cook Mode
          </div>
          <div className="flex-1 py-2 rounded-lg border border-stone-200 text-center text-xs font-semibold text-stone-700">
            Save to Vault
          </div>
        </div>
      </div>
    </div>
  );
}

// Messy "before" mockup
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
        <div className="h-2 w-full bg-stone-100 rounded" />
        <div className="h-2 w-3/4 bg-stone-100 rounded" />
        <div className="h-10 w-full bg-blue-100 rounded border border-blue-200 flex items-center justify-center">
          <span className="text-xs text-blue-600">🔔 Allow notifications?</span>
        </div>
        <div className="h-2 w-full bg-stone-100 rounded" />
        <div className="h-2 w-5/6 bg-stone-100 rounded" />
        <p className="text-xs text-stone-400 italic text-center pt-2">
          scroll down 3,000px for actual recipe…
        </p>
      </div>
    </div>
  );
}

export default function Landing() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setSubmitted(true);
    showToast('You\'re on the list! We\'ll be in touch soon. 🎉', 'success');
    setEmail('');
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-amber-50/60 to-stone-50 pt-20 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold mb-6">
                <Sparkles size={12} />
                Free to start — no credit card needed
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-stone-900 tracking-tight leading-[1.05] mb-6 text-balance">
                Save any recipe.{' '}
                <span className="text-amber-600">Cook it anywhere.</span>{' '}
                Keep it forever.
              </h1>

              <p className="text-xl text-stone-500 leading-relaxed mb-8 max-w-lg">
                Your recipes are scattered across screenshots, Instagram saves, blog tabs, sticky notes, and family memory. Recipes.txt fixes that.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/cleaner" className="btn-primary text-base px-7 py-4">
                  <ChefHat size={18} />
                  Try Recipe Cleaner
                  <ArrowRight size={16} />
                </Link>
                <Link to="/family-vault" className="btn-secondary text-base px-7 py-4">
                  <Heart size={18} />
                  Preserve Family Recipes
                </Link>
              </div>

              <div className="flex items-center gap-4 mt-8 text-sm text-stone-500">
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500" />
                  Free 10 recipes
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500" />
                  No signup required
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500" />
                  Works offline
                </span>
              </div>
            </div>

            {/* Right: product preview */}
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-4 justify-center lg:justify-end">
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Before</p>
                <MessyBlogMock />
              </div>

              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-600 text-white text-xs font-semibold shadow-lg">
                  <Sparkles size={12} />
                  Cleaned
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

      {/* Social proof strip */}
      <section className="bg-white border-y border-stone-200 py-5">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-stone-500">
          <span className="flex items-center gap-2">
            <span className="text-base">🏠</span> Built for home cooks
          </span>
          <span className="flex items-center gap-2">
            <span className="text-base">🔒</span> Data stays on your device
          </span>
          <span className="flex items-center gap-2">
            <span className="text-base">⚡</span> Works instantly, no account
          </span>
          <span className="flex items-center gap-2">
            <span className="text-base">👨‍👩‍👧</span> Share with family
          </span>
          <span className="flex items-center gap-2">
            <span className="text-base">📱</span> Mobile-first
          </span>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-24 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title mb-4">
              The recipe chaos is <span className="text-amber-600">real.</span>
            </h2>
            <p className="section-subtitle mx-auto">
              Every home cook is dealing with the same mess. It doesn't have to be this way.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {PAIN_POINTS.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card p-6 flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 mb-1">{title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title mb-4">How it works</h2>
            <p className="section-subtitle mx-auto">
              Four simple steps. Start cooking better today.
            </p>
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
              <Zap size={16} />
              Try it free — no signup
            </Link>
          </div>
        </div>
      </section>

      {/* Features highlight */}
      <section className="py-24 px-4 bg-amber-50/40">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '✨',
                title: 'Recipe Cleaner',
                desc: 'Paste any URL or raw text. Get a perfectly formatted recipe card — ingredients, steps, times. No blog noise. No pop-ups.',
                cta: 'Try Cleaner',
                href: '/cleaner',
              },
              {
                icon: '🔆',
                title: 'Cook Mode',
                desc: 'Full-screen, distraction-free cooking. Step-by-step navigation. Screen stays on. Ingredients checklist. Add notes as you cook.',
                cta: 'Open Vault',
                href: '/vault',
              },
              {
                icon: '📚',
                title: 'Family Vault',
                desc: "Upload handwritten recipe cards. Add the family story. Log who it came from. These recipes are irreplaceable — treat them that way.",
                cta: 'Start Preserving',
                href: '/family-vault',
              },
            ].map(f => (
              <div key={f.title} className="card p-7 flex flex-col">
                <span className="text-4xl mb-4">{f.icon}</span>
                <h3 className="text-xl font-bold text-stone-900 mb-3">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed flex-1 mb-5">{f.desc}</p>
                <Link to={f.href} className="btn-ghost text-amber-600 hover:bg-amber-50 hover:text-amber-700 px-0 justify-start font-semibold">
                  {f.cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title mb-4">Real cooks. Real kitchens.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.author} className="card p-6 flex flex-col">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-stone-700 text-sm leading-relaxed flex-1 mb-5 italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{t.author}</p>
                    <p className="text-xs text-stone-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-24 px-4 bg-stone-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-title mb-4">Simple, honest pricing</h2>
          <p className="section-subtitle mx-auto mb-10">
            Start free. Upgrade when your recipe collection grows.
          </p>
          <div className="grid sm:grid-cols-3 gap-5 text-left mb-8">
            {[
              { name: 'Free', price: '$0', desc: 'Up to 10 recipes', color: 'border-stone-200' },
              {
                name: 'Family Vault',
                price: '$49/yr',
                desc: 'Unlimited + family sharing',
                color: 'border-amber-400 bg-amber-50/60',
                badge: 'Popular',
              },
              {
                name: 'Recipe Rescue',
                price: '$79',
                desc: 'One-time digitization service',
                color: 'border-stone-200',
              },
            ].map(p => (
              <div key={p.name} className={`card p-5 border-2 ${p.color} relative`}>
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-full">
                    {p.badge}
                  </span>
                )}
                <p className="text-sm font-bold text-stone-900 mb-1">{p.name}</p>
                <p className="text-2xl font-bold text-stone-900 mb-2">{p.price}</p>
                <p className="text-xs text-stone-500">{p.desc}</p>
              </div>
            ))}
          </div>
          <Link to="/pricing" className="btn-ghost text-amber-600 hover:text-amber-700 font-semibold">
            View full pricing details <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Waitlist */}
      <section className="py-24 px-4 bg-gradient-to-br from-amber-600 to-amber-700">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <BookOpen size={24} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Join the waitlist
          </h2>
          <p className="text-amber-100 text-lg mb-8">
            We're onboarding early users. Get early access, founding member pricing, and help shape the product.
          </p>

          {submitted ? (
            <div className="bg-white/20 border border-white/30 rounded-2xl p-6 text-white">
              <div className="text-4xl mb-3">🎉</div>
              <p className="font-semibold text-lg mb-1">You're on the list!</p>
              <p className="text-amber-100 text-sm">We'll email you when your spot opens up. Thank you!</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-5 py-4 rounded-xl bg-white text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm"
              />
              <button type="submit" className="px-7 py-4 rounded-xl bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition-colors whitespace-nowrap shadow-sm">
                Get Early Access
              </button>
            </form>
          )}

          <p className="text-amber-200/80 text-xs mt-4">No spam. Unsubscribe anytime. We respect your inbox.</p>
        </div>
      </section>
    </div>
  );
}
