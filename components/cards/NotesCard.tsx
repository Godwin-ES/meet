import { NotebookPen } from 'lucide-react';
import { CardProps, text } from './types';

export function NotesCard({ result }: CardProps) {
  const notes = Array.isArray(result.notes) ? result.notes : [];
  return (
    <div className="result-card">
      <span className="result-card__label">
        <NotebookPen size={12} /> Saved notes
      </span>
      <ul className="result-card__list">
        {notes.length ? (
          notes.map((note, index) => <li key={`${text(note)}-${index}`}>{text(note)}</li>)
        ) : (
          <li>No saved notes</li>
        )}
      </ul>
    </div>
  );
}
