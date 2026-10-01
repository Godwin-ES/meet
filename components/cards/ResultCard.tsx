import { ArticleCard } from './ArticleCard';
import { CurrencyCard } from './CurrencyCard';
import { GenericCard } from './GenericCard';
import { MathCard } from './MathCard';
import { NotesCard } from './NotesCard';
import { SearchCard } from './SearchCard';
import { StockCard } from './StockCard';
import { TimeCard } from './TimeCard';
import { WeatherCard } from './WeatherCard';
import { CardProps } from './types';

export function ResultCard({ result }: CardProps) {
  switch (result.kind) {
    case 'weather':
      return <WeatherCard result={result} />;
    case 'time':
      return <TimeCard result={result} />;
    case 'currency':
      return <CurrencyCard result={result} />;
    case 'math':
      return <MathCard result={result} />;
    case 'notes':
      return <NotesCard result={result} />;
    case 'search':
    case 'list':
      return <SearchCard result={result} />;
    case 'stock':
      return <StockCard result={result} />;
    case 'article':
    case 'wiki':
      return <ArticleCard result={result} />;
    default:
      return <GenericCard result={result} />;
  }
}
