import { BookOpenText } from 'lucide-react';
import { CardProps, text } from './types';

export function ArticleCard({ result }: CardProps) {
  const article =
    typeof result.article === 'object' && result.article
      ? (result.article as Record<string, unknown>)
      : result;
  return (
    <div className="result-card">
      <span className="result-card__label">
        <BookOpenText size={12} /> Article / knowledge
      </span>
      <div className="result-card__hero">{text(article.title ?? article.name, 'Background')}</div>
      <p>{text(article.summary ?? article.content ?? result.say).slice(0, 360)}</p>
    </div>
  );
}
