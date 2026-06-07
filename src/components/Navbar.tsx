import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X, Vault } from 'lucide-react';

const NAV_LINKS = [
  { label: 'My Vault', href: '/vault' },
  { label: 'Grocery', href: '/grocery' },
  { label: 'Family Vault', href: '/family-vault' },
  { label: 'Pricing', href: '/pricing' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const isActive = (href: string) => pathname === href || (href === '/' && pathname === '/');

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-200/60"
      style={{ boxShadow: '0 1px 0 0 rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center shadow-sm group-hover:bg-amber-700 group-hover:shadow-amber-300/40 transition-all duration-200"
              style={{ boxShadow: '0 2px 8px rgba(180,83,9,0.3)' }}>
              <BookOpen size={15} className="text-white" />
            </div>
            <span className="font-bold text-stone-900 tracking-tight text-[15px]">
              Recipes<span className="text-amber-600">.txt</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive(link.href)
                    ? 'bg-amber-100/80 text-amber-800'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/vault" className="btn-primary text-xs px-4 py-2.5">
              <Vault size={13} />
              Open Vault
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-stone-100 bg-white/95 backdrop-blur-xl animate-slide-up">
          <div className="px-4 py-3 flex flex-col gap-1">
            <Link to="/" onClick={() => setOpen(false)} className={`px-3 py-3 rounded-xl text-sm font-medium transition-colors ${pathname === '/' ? 'bg-amber-100 text-amber-800' : 'text-stone-700 hover:bg-stone-100'}`}>
              Recipe Cleaner
            </Link>
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.href) ? 'bg-amber-100 text-amber-800' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/vault" onClick={() => setOpen(false)} className="mt-2 btn-primary justify-center">
              <Vault size={14} />
              Open Vault
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
