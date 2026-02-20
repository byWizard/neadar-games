export interface Game {
  id: number;
  title: string;
  image: string;
  description: string;
  status: 'want' | 'done' | 'postponed';
  rating: number;
}
