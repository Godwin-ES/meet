import { Search } from 'lucide-react';
import { CardProps, text } from './types';

export function SearchCard({ result }: CardProps) {
  const items = Array.isArray(result.results)
    ? result.results
    : Array.isArray(result.items)
      ? result.items
      : [];
  return (
    <div className="result-card">
      <span className="result-card__label">
        <Search size={12} /> Results
      </span>
      <ul className="result-card__list">
        {items.slice(0, 5).map((entry, index) => {
          const item = typeof entry === 'object' && entry ? (entry as Record<string, unknown>) : {};
          const title = text(item.title ?? item.name, `Result ${index + 1}`);
          const href =
            typeof item.href === 'string'
              ? item.href
              : typeof item.url === 'string'
                ? item.url
                : undefined;
          return (
            <li key={`${title}-${index}`}>
              {href ? (
                <a href={href} target="_blank" rel="noreferrer">
                  {title}
                </a>
              ) : (
                title
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
