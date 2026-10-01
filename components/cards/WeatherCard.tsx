import { CloudSun } from 'lucide-react';
import { CardProps, text } from './types';

export function WeatherCard({ result }: CardProps) {
  const forecast = Array.isArray(result.forecast) ? result.forecast : [];
  return (
    <div className="result-card">
      <span className="result-card__label">
        <CloudSun size={12} /> {text(result.place, 'Weather')}
      </span>
      <div className="result-card__hero">
        {text(result.temperature)}° · {text(result.condition)}
      </div>
      <div className="result-card__grid">
        {forecast.slice(0, 3).map((day, index) => {
          const item = typeof day === 'object' && day ? (day as Record<string, unknown>) : {};
          return (
            <div className="result-card__cell" key={text(item.date, String(index))}>
              <b>{text(item.high)}°</b>
              {text(item.condition)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
