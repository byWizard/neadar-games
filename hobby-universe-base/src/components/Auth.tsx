import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthProps {
  user: User | null;
}

const provider = new GoogleAuthProvider();

const handleSignIn = () => {
  signInWithPopup(auth, provider).catch((error) => console.error("Ошибка входа: ", error));
};

const handleSignOut = () => {
  signOut(auth).catch((error) => console.error("Ошибка выхода: ", error));
};

export default function Auth({ user }: AuthProps) {
  return (
    <div className="text-right mb-8">
      {user ? (
        <div className="flex items-center justify-end gap-4">
          <p className="text-text-secondary text-sm">Вы вошли как {user.displayName}</p>
          <button onClick={handleSignOut} className="bg-bg-tertiary border border-[color:var(--border-color)] px-4 py-2 rounded-lg text-sm hover:bg-bg-secondary transition-colors">
            Выйти
          </button>
        </div>
      ) : (
        <button onClick={handleSignIn} className="bg-bg-tertiary border border-[color:var(--border-color)] px-4 py-2 rounded-lg text-sm hover:bg-bg-secondary transition-colors">
          Войти через Google
        </button>
      )}
    </div>
  );
}
