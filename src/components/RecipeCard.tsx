import { Clock, Users, Heart, Trash2, ChefHat, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Recipe } from '../types';
import { formatDate, truncate } from '../lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  showActions?: boolean;
}

export default function RecipeCard({
  recipe,
  onDelete,
  onToggleFavorite,
  showActions = true,
}: RecipeCardProps) {
  return (
    <div className="card-hover group flex flex-col overflow-hidden">
      {/* Top color strip */}
      <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-t-2xl" />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl leading-none mt-0.5 shrink-0">
              {recipe.emoji || '📄'}
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-stone-900 text-sm leading-snug">
                {truncate(recipe.title, 48)}
              </h3>
              {recipe.description && (
                <p className="text-stone-500 text-xs mt-1 leading-relaxed line-clamp-2">
                  {recipe.description}
                </p>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-1 shrink-0">
              {onToggleFavorite && (
                <button
                  onClick={e => { e.preventDefault(); onToggleFavorite(recipe.id); }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    recipe.isFavorite
                      ? 'text-red-500 bg-red-50'
                      : 'text-stone-400 hover:text-red-400 hover:bg-red-50'
                  }`}
                  title="Favorite"
                >
                  <Heart size={14} fill={recipe.isFavorite ? 'currentColor' : 'none'} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={e => { e.preventDefault(); onDelete(recipe.id); }}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {recipe.tags.slice(0, 3).map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-stone-500 mb-4 flex-wrap">
          {recipe.prepTime && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              Prep: {recipe.prepTime}
            </span>
          )}
          {recipe.cookTime && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              Cook: {recipe.cookTime}
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <Users size={11} />
              {recipe.servings}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-stone-100">
          <div className="flex items-center gap-2">
            {recipe.notes.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                <Star size={11} fill="currentColor" />
                {recipe.notes.length} note{recipe.notes.length !== 1 ? 's' : ''}
              </span>
            )}
            <span className="text-xs text-stone-400">{formatDate(recipe.savedAt)}</span>
          </div>

          <Link
            to={`/cook/${recipe.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
          >
            <ChefHat size={12} />
            Cook
          </Link>
        </div>
      </div>
    </div>
  );
}
