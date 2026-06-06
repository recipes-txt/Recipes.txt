import { useState } from 'react';
import { Check, Zap, Users, Heart, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: '$0', yearly: '$0' },
    description: 'Perfect for getting started.',
    badge: null,
    icon: Zap,
    color: 'border-stone-200',
    headerColor: 'bg-stone-50',
    cta: 'Start for free',
    ctaStyle: 'btn-secondary',
    ctaHref: '/cleaner',
    features: [
      'Up to 10 saved recipes',
      'Recipe Cleaner (text paste)',
      'Cook Mode — screen stays on',
      'Ingredient checklist',
      'Personal cooking notes',
      'Local vault (device only)',
    ],
    missing: [
      'Unlimited recipes',
      'Family Vault',
      'URL scraping (when live)',
      'Cloud sync',
    ],
  },
  {
    id: 'family',
    name: 'Family Vault',
    price: { monthly: '$5.99/mo', yearly: '$49/yr' },
    description: 'For serious home cooks and family recipe keepers.',
    badge: 'Most Popular',
    icon: Users,
    color: 'border-amber-400',
    headerColor: 'bg-amber-50',
    cta: 'Join waitlist',
    ctaStyle: 'btn-primary',
    ctaHref: null,
    features: [
      'Unlimited saved recipes',
      'Everything in Free',
      'Family Vault — unlimited entries',
      'Family sharing (up to 6 members)',
      'URL recipe scraping',
      'Cloud sync across devices',
      'Tags and collections',
      'PDF & print export',
      'Priority support',
    ],
    missing: [],
  },
  {
    id: 'rescue',
    name: 'Recipe Rescue',
    price: { monthly: '$79 one-time', yearly: '$79 one-time' },
    description: 'We digitize your family recipes for you.',
    badge: 'Done For You',
    icon: Heart,
    color: 'border-rose-300',
    headerColor: 'bg-rose-50',
    cta: 'Join waitlist',
    ctaStyle: 'btn-secondary',
    ctaHref: null,
    features: [
      'Send us up to 50 recipe cards',
      'We transcribe every recipe by hand',
      'Returned as clean digital cards',
      'Family Vault subscription included (1 yr)',
      'Photo scans of original cards',
      '2-week turnaround',
      'Concierge support',
    ],
    missing: [],
  },
];

const FAQ = [
  {
    q: 'Is my data stored on your servers?',
    a: "In the free tier, everything lives in your browser's local storage — nothing is sent to our servers. With Family Vault, we sync recipes securely to the cloud so you can access them anywhere.",
  },
  {
    q: 'What happens to my free recipes if I upgrade?',
    a: "Nothing. They carry over automatically. Upgrading just unlocks more capacity and features — you never lose anything.",
  },
  {
    q: 'Can I share my vault with family members who are not tech-savvy?',
    a: "Yes — that's a core goal. Family members join via a simple link and can view and add recipes without needing to understand how the app works.",
  },
  {
    q: "What's the Recipe Rescue service exactly?",
    a: "You mail us (or email photos of) your handwritten recipe cards. Our team transcribes each one into a clean digital card, adds it to your vault, and returns the originals. It's a concierge digitization service.",
  },
  {
    q: 'Is there a free trial of Family Vault?',
    a: "Yes — early waitlist members get a 30-day free trial of Family Vault, no credit card required at signup.",
  },
  {
    q: 'What happens if my subscription lapses?',
    a: "Your most recent recipes stay visible — you never lose access to your newest content. And because we support offline export, you always own a copy of everything you saved. Your data is yours, subscription or not.",
  },
];

export default function Pricing() {
  const [billing, setBilling] = useState<'yearly' | 'monthly'>('yearly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { showToast('Please enter a valid email.', 'error'); return; }
    setSubmitted(true);
    showToast("You're on the waitlist! We'll be in touch. 🎉", 'success');
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold text-stone-900 tracking-tight mb-4">
            Simple, honest pricing
          </h1>
          <p className="text-xl text-stone-500 max-w-xl mx-auto mb-8">
            Start free. Upgrade when your recipe collection outgrows the basics.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                billing === 'monthly' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billing === 'yearly' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                Save 32%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`card border-2 ${plan.color} flex flex-col overflow-hidden relative`}
              >
                {plan.badge && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 bg-amber-600 text-white text-xs font-bold rounded-b-lg shadow">
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className={`p-6 ${plan.headerColor} border-b border-stone-100`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                      <Icon size={16} className="text-stone-700" />
                    </div>
                    <span className="font-bold text-stone-900">{plan.name}</span>
                  </div>

                  <div className="mb-2">
                    <span className="text-3xl font-bold text-stone-900">
                      {plan.price[billing]}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500">{plan.description}</p>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-stone-700">
                        <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {plan.missing.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-stone-400">
                        <span className="w-3.5 h-3.5 mt-0.5 shrink-0 flex items-center justify-center text-stone-300">
                          —
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {plan.ctaHref ? (
                    <Link to={plan.ctaHref} className={`${plan.ctaStyle} justify-center`}>
                      {plan.cta}
                      <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <button
                      onClick={() => document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' })}
                      className={`${plan.ctaStyle} justify-center`}
                    >
                      {plan.cta}
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Compare callout */}
        <div className="card p-6 mb-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Star size={18} className="text-amber-400 fill-amber-400" />
            <h3 className="font-bold text-stone-900">All plans include Cook Mode</h3>
            <Star size={18} className="text-amber-400 fill-amber-400" />
          </div>
          <p className="text-stone-500 text-sm max-w-lg mx-auto">
            Every plan gets full Cook Mode access — screen-on cooking, step-by-step navigation, ingredient checklist, and cooking notes. No ads. No pop-ups. Just cooking.
          </p>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-2 max-w-2xl mx-auto">
            {FAQ.map((item, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-3 hover:bg-stone-50 transition-colors"
                >
                  <span className="font-semibold text-stone-900 text-sm">{item.q}</span>
                  <span className={`text-stone-400 transition-transform duration-200 shrink-0 ${openFaq === i ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 animate-fade-in">
                    <p className="text-stone-600 text-sm leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Waitlist CTA */}
        <div id="waitlist-form" className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Join the waitlist</h2>
          <p className="text-amber-100 mb-7 max-w-md mx-auto">
            Family Vault and Recipe Rescue are launching soon. Join the list for early access, founding pricing, and to help shape the product.
          </p>

          {submitted ? (
            <div className="bg-white/20 border border-white/30 rounded-2xl p-5 max-w-sm mx-auto text-white">
              <div className="text-3xl mb-2">🎉</div>
              <p className="font-semibold mb-1">You're on the list!</p>
              <p className="text-amber-100 text-sm">We'll reach out when your spot opens.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-5 py-3.5 rounded-xl bg-white text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button type="submit" className="px-6 py-3.5 rounded-xl bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition-colors whitespace-nowrap">
                Get Early Access
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
