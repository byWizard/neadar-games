import { useState } from 'react';
import type { Game } from '../types';

interface GameCardProps {
  game: Game;
  onUpdate: (game: Game) => void;
  onDelete: (gameId: number) => void;
}

const statusClasses = {
  done: 'bg-success text-black',
  want: 'bg-warning text-black',
  postponed: 'bg-error text-white',
};

const statusText = {
  done: 'Пройдена',
  want: 'Хочу пройти',
  postponed: 'Отложена',
};

export default function GameCard({ game, onUpdate, onDelete }: GameCardProps) {
  const [description, setDescription] = useState(game.description || '');

  const handleStatusChange = () => {
    const statuses: Game['status'][] = ['want', 'postponed', 'done'];
    const currentIndex = statuses.indexOf(game.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    onUpdate({ ...game, status: statuses[nextIndex] });
  };

  const handleRatingChange = (newRating: number) => {
    onUpdate({ ...game, rating: newRating });
  };

  const handleDescriptionBlur = () => {
    if (description !== game.description) {
      onUpdate({ ...game, description });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Вы уверены, что хотите удалить "${game.title}"?`)) {
      onDelete(game.id);
    }
  };

  return (
    <div className="bg-bg-secondary border border-[color:var(--border-color)] rounded-xl overflow-hidden transition-transform hover:-translate-y-1 flex flex-col">
      <img referrerPolicy="no-referrer" src={game.image} alt={game.title} className="w-full h-48 object-cover" />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg truncate mb-2">{game.title}</h3>
        <button onClick={handleStatusChange} className={`text-xs font-bold px-3 py-1 rounded-full self-start ${statusClasses[game.status]}`}>
          {statusText[game.status]}
        </button>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          placeholder="Описание отсутствует."
          className="text-text-secondary text-sm my-4 flex-grow bg-transparent w-full resize-none focus:outline-none focus:bg-bg-tertiary rounded p-1"
        />
        <div className="flex justify-between items-center mt-auto">
          <div className="flex text-2xl text-text-secondary cursor-pointer">
            {[...Array(5)].map((_, i) => (
              <span key={i} onClick={() => handleRatingChange(i + 1)} className={`${i < game.rating ? 'text-yellow-400' : ''} hover:text-yellow-300`}>★</span>
            ))}
          </div>
          <button onClick={handleDelete} className="text-xs text-error hover:underline">Удалить</button>
        </div>
      </div>
    </div>
  );
}
