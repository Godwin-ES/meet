import { ArrowRightLeft } from 'lucide-react';
import { CardProps, text } from './types';

export function CurrencyCard({ result }: CardProps) {
  return (
    <div className="result-card">
      <span className="result-card__label">
        <ArrowRightLeft size={12} /> Exchange · {text(result.date)}
      </span>
      <div className="result-card__hero">
        {text(result.amount)} {text(result.from)} → {text(result.converted)} {text(result.to)}
      </div>
      <p>Rate {text(result.rate)}</p>
    </div>
  );
}
