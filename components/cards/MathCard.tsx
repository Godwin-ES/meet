import { Calculator } from 'lucide-react';
import { CardProps, text } from './types';

export function MathCard({ result }: CardProps) {
  return (
    <div className="result-card">
      <span className="result-card__label">
        <Calculator size={12} /> {text(result.expression, 'Calculation')}
      </span>
      <div className="result-card__hero">{text(result.result)}</div>
    </div>
  );
}
