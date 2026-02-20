import { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ref, onValue, set, remove } from 'firebase/database';
import { auth, database } from './services/firebase';

import AddGameForm from './components/AddGameForm';
import GameCard from './components/GameCard';
import Header from './components/Header';
import Auth from './components/Auth';
import LoginScreen from './components/LoginScreen';
import FilterControls from './components/FilterControls';
import type { Game } from './types';


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        const gamesRef = ref(database, `users/${currentUser.uid}/games`);
                onValue(gamesRef, (snapshot) => {
          const data = snapshot.val();
          const gamesArray = data ? Object.values(data) as Game[] : [];
          // Sort by ID descending to show newest first
          gamesArray.sort((a, b) => b.id - a.id);
          setGames(gamesArray);
        });
      } else {
        setGames([]);
      }
    });

    return () => unsubscribe();
  }, []);

    const handleAddGame = (newGame: Omit<Game, 'id' | 'status' | 'rating'>) => {
    if (!user) return;

    const gameWithDetails: Game = {
      ...newGame,
      id: Date.now(),
      status: 'want',
      rating: 0,
    };

    const newGames = [gameWithDetails, ...games];
    // We need to convert array to object for Firebase because Firebase doesn't handle arrays well with indexes.
    const gamesRef = ref(database, `users/${user.uid}/games`);
    set(gamesRef, newGames.reduce((acc, game) => ({...acc, [game.id]: game}), {}));
  };

  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || game.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [games, searchTerm, filterStatus]);

  const handleUpdateGame = (updatedGame: Game) => {
    if (!user) return;
    const gameRef = ref(database, `users/${user.uid}/games/${updatedGame.id}`);
    set(gameRef, updatedGame);
  };

  const handleDeleteGame = (gameId: number) => {
    if (!user) return;
    const gameRef = ref(database, `users/${user.uid}/games/${gameId}`);
    remove(gameRef);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Загрузка...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Header />
      <Auth user={user} />
      <main>
                        <AddGameForm onAddGame={handleAddGame} />
        <FilterControls onSearch={setSearchTerm} onFilter={setFilterStatus} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map(game => (
            <GameCard 
              key={game.id} 
              game={game} 
              onUpdate={handleUpdateGame} 
              onDelete={handleDeleteGame} 
            />
          ))}
        </div>
      </main>
    </div>
  );
}
