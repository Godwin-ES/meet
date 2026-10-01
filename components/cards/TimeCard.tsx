import { Clock3 } from 'lucide-react';
import { CardProps, text } from './types';

export function TimeCard({ result }: CardProps) {
  return (
    <div className="result-card">
      <span className="result-card__label">
        <Clock3 size={12} /> {text(result.place)}
      </span>
      <div className="result-card__hero">{text(result.time)}</div>
      <p>
        {text(result.timezone)} · UTC {text(result.utc_offset)}
      </p>
    </div>
  );
}
