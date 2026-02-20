import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase';

const provider = new GoogleAuthProvider();

const handleSignIn = () => {
  signInWithPopup(auth, provider).catch((error) => console.error("Ошибка входа: ", error));
};

export default function LoginScreen() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center bg-bg-secondary p-10 rounded-xl border border-[color:var(--border-color)]">
        <div className="mb-4">
          <span className="text-5xl font-bold">H</span>
          <span className="text-5xl font-bold">U</span>
          <span className="text-5xl font-bold">B</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">🔒 Войдите, чтобы продолжить</h2>
        <p className="text-text-secondary mb-6 max-w-xs">Добавляйте игры, сохраняйте прогресс и делитесь списком с друзьями.</p>
        <button onClick={handleSignIn} className="bg-accent-primary text-bg-primary font-bold py-3 px-6 rounded-lg hover:bg-accent-secondary transition-colors">
          Войти через Google
        </button>
      </div>
    </div>
  );
}
