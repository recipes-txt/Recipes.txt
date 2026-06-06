import { Link } from 'react-router-dom';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}

export default function EmptyState({
  emoji,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-lg font-semibold text-stone-900 mb-2">{title}</h3>
      <p className="text-stone-500 text-sm max-w-xs leading-relaxed mb-6">{description}</p>
      {ctaLabel && (
        ctaHref ? (
          <Link to={ctaHref} className="btn-primary">
            {ctaLabel}
          </Link>
        ) : (
          <button onClick={onCtaClick} className="btn-primary">
            {ctaLabel}
          </button>
        )
      )}
    </div>
  );
}
