import { useState, useMemo } from 'react';
import { ShoppingCart, Check, Trash2, ChevronDown, ChevronUp, Plus, X, RefreshCcw } from 'lucide-react';
import { getRecipes } from '../lib/storage';
import { Recipe } from '../types';
import { useToast } from '../components/Toast';

// ── Category detection ────────────────────────────────────────────────────────
const CATEGORY_PATTERNS: [string, RegExp][] = [
  ['Produce 🥦', /\b(lettuce|spinach|kale|arugula|tomato|tomatoes|onion|onions|garlic|ginger|carrot|carrots|celery|bell pepper|zucchini|broccoli|cauliflower|mushroom|mushrooms|cucumber|avocado|lemon|lime|limes|apple|apples|banana|berries|strawberr|blueberr|herb|basil|cilantro|parsley|thyme|rosemary|mint|dill|scallion|green onion|shallot|jalapeño|pepper|peppers|potato|potatoes|sweet potato|corn|pea|peas|bean sprout|bok choy|eggplant|asparagus|artichoke|beet|beets|radish|turnip|leek|fennel|mango|pineapple|peach|plum|grape|orange|oranges|melon|watermelon|cherry|cherries|fig|date|kiwi)\b/i],
  ['Meat & Seafood 🥩', /\b(chicken|beef|pork|lamb|turkey|duck|salmon|shrimp|tuna|cod|tilapia|halibut|bass|sausage|bacon|ham|ground beef|ground turkey|steak|ribs|brisket|loin|tenderloin|fillet|filo|crab|lobster|clam|mussel|oyster|scallop|anchov|sardine)\b/i],
  ['Dairy & Eggs 🥛', /\b(milk|cream|butter|cheese|cheddar|mozzarella|parmesan|ricotta|feta|brie|gouda|gruyère|yogurt|sour cream|cream cheese|egg|eggs|half.and.half|heavy cream|whipping cream|condensed milk|evaporated milk)\b/i],
  ['Pantry & Dry Goods 🥫', /\b(flour|sugar|salt|pepper|oil|olive oil|vinegar|soy sauce|balsamic|hot sauce|ketchup|mustard|mayonnaise|honey|maple syrup|jam|rice|pasta|noodle|quinoa|oat|oats|bread|tortilla|cracker|cereal|canned|can of|tomato sauce|tomato paste|broth|stock|lentil|chickpea|black bean|kidney bean|couscous|barley|panko|breadcrumb|cornstarch|baking powder|baking soda|yeast|vanilla|cocoa|chocolate|raisin|nut|almond|walnut|pecan|peanut|cashew|sesame|flaxseed|chia|coconut milk)\b/i],
  ['Spices & Seasonings 🌶', /\b(cumin|coriander|paprika|turmeric|oregano|cinnamon|cayenne|chili flake|chili powder|curry|cardamom|clove|nutmeg|allspice|bay leaf|star anise|fennel seed|mustard seed|black pepper|white pepper|smoked paprika|garlic powder|onion powder|italian seasoning|herbes de provence|za.atar|sumac|garam masala|five spice)\b/i],
  ['Frozen ❄️', /\b(frozen|ice cream|gelato|sorbet|popsicle)\b/i],
  ['Beverages 🧃', /\b(juice|wine|beer|coffee|tea|broth|stock|coconut water|sparkling water|soda)\b/i],
];

function categorize(ingredient: string): string {
  const lower = ingredient.toLowerCase();
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(lower)) return category;
  }
  return 'Other 🛒';
}

// ── Ingredient merging ─────────────────────────────────────────────────────────
function normalizeIngredient(ing: string): string {
  return ing.trim().toLowerCase().replace(/^[•\-*]\s*/, '');
}

interface GroceryItem {
  id: string;
  text: string;
  category: string;
  checked: boolean;
  fromRecipes: string[];
}

function mergeIngredients(selectedRecipes: Recipe[]): GroceryItem[] {
  const seen = new Map<string, GroceryItem>();

  selectedRecipes.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      const norm = normalizeIngredient(ing);
      // Simple dedup: if the normalized text already exists, just add source
      const existing = Array.from(seen.values()).find(i => {
        const a = norm.replace(/[\d½¼¾⅓⅔⅛⅜⅝⅞.,/\-\s]+/g, '').slice(0, 12);
        const b = i.text.toLowerCase().replace(/[\d½¼¾⅓⅔⅛⅜⅝⅞.,/\-\s]+/g, '').slice(0, 12);
        return a.length > 3 && a === b;
      });
      if (existing) {
        if (!existing.fromRecipes.includes(recipe.title)) existing.fromRecipes.push(recipe.title);
      } else {
        const id = `${Date.now()}-${Math.random()}`;
        seen.set(id, { id, text: ing.trim(), category: categorize(ing), checked: false, fromRecipes: [recipe.title] });
      }
    });
  });

  return Array.from(seen.values());
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GroceryList() {
  const recipes = getRecipes();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groceries, setGroceries] = useState<GroceryItem[] | null>(null);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [customText, setCustomText] = useState('');
  const { showToast } = useToast();

  const selectedRecipes = useMemo(() => recipes.filter(r => selectedIds.includes(r.id)), [recipes, selectedIds]);

  const handleGenerate = () => {
    if (!selectedIds.length) return;
    setGroceries(mergeIngredients(selectedRecipes));
    showToast('Grocery list ready!', 'success');
  };

  const handleCheck = (id: string) => {
    setGroceries(prev => prev!.map(g => g.id === id ? { ...g, checked: !g.checked } : g));
  };

  const handleRemove = (id: string) => {
    setGroceries(prev => prev!.filter(g => g.id !== id));
  };

  const handleAddCustom = () => {
    const text = customText.trim();
    if (!text) return;
    const item: GroceryItem = { id: `custom-${Date.now()}`, text, category: categorize(text), checked: false, fromRecipes: ['Custom'] };
    setGroceries(prev => prev ? [item, ...prev] : [item]);
    setCustomText('');
  };

  const toggleRecipe = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleCat = (cat: string) => {
    setCollapsedCats(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  };

  const groupedGroceries = useMemo(() => {
    if (!groceries) return {};
    const groups: Record<string, GroceryItem[]> = {};
    groceries.forEach(g => { (groups[g.category] ??= []).push(g); });
    return groups;
  }, [groceries]);

  const checked = groceries?.filter(g => g.checked).length ?? 0;
  const total = groceries?.length ?? 0;
  const progress = total ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
              <ShoppingCart size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Grocery List</h1>
          </div>
          <p className="text-stone-500 text-sm ml-13">Pick recipes, get a smart shopping list.</p>
        </div>

        {/* Recipe selector */}
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">Select recipes</h2>
          {recipes.length === 0
            ? <p className="text-stone-400 text-sm text-center py-4">No recipes in your vault yet. <a href="/cleaner" className="text-amber-600 hover:underline">Add some first →</a></p>
            : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 max-h-72 overflow-y-auto pr-1">
                {recipes.map(r => (
                  <button
                    key={r.id}
                    onClick={() => toggleRecipe(r.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${selectedIds.includes(r.id) ? 'bg-amber-50 border-amber-400 text-amber-800' : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${selectedIds.includes(r.id) ? 'bg-amber-600 border-amber-600' : 'border-stone-300'}`}>
                      {selectedIds.includes(r.id) && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-lg shrink-0">{r.emoji || '📄'}</span>
                    <span className="font-medium text-sm leading-snug line-clamp-2">{r.title}</span>
                  </button>
                ))}
              </div>
          }

          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400">{selectedIds.length} recipe{selectedIds.length !== 1 ? 's' : ''} selected</span>
            <button
              onClick={handleGenerate}
              disabled={!selectedIds.length}
              className="btn-primary disabled:opacity-40"
            >
              <ShoppingCart size={15} /> Build list
            </button>
          </div>
        </div>

        {/* Grocery list */}
        {groceries !== null && (
          <div className="space-y-4">

            {/* Progress + add custom */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-stone-700">{checked} / {total} items</span>
                <div className="flex gap-2">
                  <button onClick={() => setGroceries(prev => prev!.map(g => ({ ...g, checked: false })))} className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1">
                    <RefreshCcw size={11} /> Reset
                  </button>
                  <button onClick={() => { setGroceries(null); setSelectedIds([]); }} className="text-xs text-stone-400 hover:text-red-500 flex items-center gap-1">
                    <Trash2 size={11} /> Clear all
                  </button>
                </div>
              </div>
              <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              {progress === 100 && (
                <p className="text-center text-sm font-semibold text-amber-700 animate-bounce-in">All done — happy cooking! 🎉</p>
              )}

              {/* Add custom item */}
              <div className="flex gap-2 mt-3">
                <input
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                  placeholder="Add item manually…"
                  className="input-base flex-1 text-sm py-2"
                />
                <button onClick={handleAddCustom} disabled={!customText.trim()} className="btn-secondary px-4 py-2 disabled:opacity-40"><Plus size={15} /></button>
              </div>
            </div>

            {/* Grouped items */}
            {Object.entries(groupedGroceries).sort().map(([cat, items]) => {
              const collapsed = collapsedCats.has(cat);
              const catChecked = items.filter(i => i.checked).length;
              return (
                <div key={cat} className="card overflow-hidden">
                  <button
                    onClick={() => toggleCat(cat)}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-stone-50 border-b border-stone-100 hover:bg-stone-100 transition-colors"
                  >
                    <span className="font-semibold text-stone-800 text-sm">{cat}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-400">{catChecked}/{items.length}</span>
                      {collapsed ? <ChevronDown size={15} className="text-stone-400" /> : <ChevronUp size={15} className="text-stone-400" />}
                    </div>
                  </button>
                  {!collapsed && (
                    <ul className="divide-y divide-stone-50">
                      {items.map(item => (
                        <li key={item.id} className={`flex items-center gap-3 px-5 py-3.5 transition-all ${item.checked ? 'opacity-50' : ''}`}>
                          <button
                            onClick={() => handleCheck(item.id)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${item.checked ? 'bg-green-500 border-green-500' : 'border-stone-300 hover:border-amber-400'}`}
                          >
                            {item.checked && <Check size={11} className="text-white" strokeWidth={3} />}
                          </button>
                          <span className={`flex-1 text-sm text-stone-800 ${item.checked ? 'line-through text-stone-400' : ''}`}>{item.text}</span>
                          {item.fromRecipes.length > 0 && item.fromRecipes[0] !== 'Custom' && (
                            <span className="text-xs text-stone-400 shrink-0 hidden sm:inline">{item.fromRecipes.join(', ')}</span>
                          )}
                          <button onClick={() => handleRemove(item.id)} className="p-1 text-stone-300 hover:text-red-400 rounded transition-colors shrink-0">
                            <X size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
