import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X, ChefHat } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Recipe Cleaner', href: '/cleaner' },
  { label: 'My Vault', href: '/vault' },
  { label: 'Grocery', href: '/grocery' },
  { label: 'Family Vault', href: '/family-vault' },
  { label: 'Pricing', href: '/pricing' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-40 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center shadow-sm group-hover:bg-amber-700 transition-colors">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-bold text-stone-900 tracking-tight">
              Recipes<span className="text-amber-600">.txt</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/cleaner" className="btn-primary text-xs px-4 py-2">
              <ChefHat size={14} />
              Clean a Recipe
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-stone-200 bg-white animate-fade-in">
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/cleaner"
              onClick={() => setOpen(false)}
              className="mt-2 btn-primary justify-center"
            >
              <ChefHat size={14} />
              Clean a Recipe
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
