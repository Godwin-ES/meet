import { Braces, CircleAlert } from 'lucide-react';
import { CardProps, text } from './types';

export function GenericCard({ result }: CardProps) {
  if (result.kind === 'error')
    return (
      <div className="result-card result-card__error">
        <CircleAlert size={14} /> {text(result.say, 'The tool could not finish.')}
      </div>
    );
  return (
    <div className="result-card">
      <span className="result-card__label">
        <Braces size={12} /> Tool result
      </span>
      <p>{text(result.say ?? result.value, JSON.stringify(result).slice(0, 360))}</p>
    </div>
  );
}
