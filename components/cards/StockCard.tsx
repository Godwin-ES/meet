import { ChartNoAxesCombined } from 'lucide-react';
import { CardProps, text } from './types';

export function StockCard({ result }: CardProps) {
  const data =
    typeof result.data === 'object' && result.data
      ? (result.data as Record<string, unknown>)
      : result;
  return (
    <div className="result-card">
      <span className="result-card__label">
        <ChartNoAxesCombined size={12} /> Market data
      </span>
      <div className="result-card__hero">
        {text(data['Current Stock Price'] ?? data.price ?? data.value)}
      </div>
      <p>{text(data.Name ?? data.Symbol ?? result.say, 'Latest quote')}</p>
    </div>
  );
}
