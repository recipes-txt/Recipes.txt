import { Link } from 'react-router-dom';
import { BookOpen, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-stone-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center">
                <BookOpen size={14} className="text-white" />
              </div>
              <span className="font-bold text-stone-900">
                Recipes<span className="text-amber-600">.txt</span>
              </span>
            </div>
            <p className="text-stone-500 text-sm leading-relaxed max-w-xs">
              Save any recipe. Cook it anywhere. Keep it forever. Your kitchen's second brain.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-stone-900 mb-3">Product</h4>
            <ul className="space-y-2">
              {[
                { label: 'Recipe Cleaner', href: '/cleaner' },
                { label: 'My Vault', href: '/vault' },
                { label: 'Family Vault', href: '/family-vault' },
                { label: 'Pricing', href: '/pricing' },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-stone-900 mb-3">About</h4>
            <ul className="space-y-2">
              {['Why Recipes.md', 'Family Stories', 'Cook Mode', 'Roadmap'].map(item => (
                <li key={item}>
                  <span className="text-sm text-stone-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} Recipes.md. All rights reserved.
          </p>
          <p className="text-xs text-stone-400 flex items-center gap-1">
            Made with <Heart size={11} className="text-red-400 fill-red-400" /> for home cooks everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
