import { useState } from 'react';
import type { Game } from '../types';

interface AddGameFormProps {
  onAddGame: (game: Omit<Game, 'id' | 'status' | 'rating'>) => void;
}

export default function AddGameForm({ onAddGame }: AddGameFormProps) {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !image.trim()) {
      alert('Название и ссылка на картинку обязательны');
      return;
    }
    onAddGame({ title, image, description });
    setTitle('');
    setImage('');
    setDescription('');
  };

  return (
    <section className="bg-bg-secondary border border-[color:var(--border-color)] rounded-xl p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">Добавить новую игру</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название игры"
          required
          className="w-full p-3 bg-bg-tertiary border border-[color:var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
        />
        <input
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Ссылка на картинку"
          required
          className="w-full p-3 bg-bg-tertiary border border-[color:var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание"
          className="w-full p-3 bg-bg-tertiary border border-[color:var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary min-h-[100px]"
        />
        <button type="submit" className="w-full bg-accent-primary text-bg-primary font-bold py-3 rounded-lg hover:bg-accent-secondary transition-colors">
          Добавить игру
        </button>
      </form>
    </section>
  );
}
