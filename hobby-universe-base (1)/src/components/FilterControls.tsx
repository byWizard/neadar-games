interface FilterControlsProps {
  onSearch: (term: string) => void;
  onFilter: (status: string) => void;
}

export default function FilterControls({ onSearch, onFilter }: FilterControlsProps) {
  return (
    <div className="bg-bg-secondary border border-[color:var(--border-color)] rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4">
      <input
        type="text"
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Найти игру..."
        className="w-full p-3 bg-bg-tertiary border border-[color:var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
      />
      <select
        onChange={(e) => onFilter(e.target.value)}
        className="w-full md:w-64 p-3 bg-bg-tertiary border border-[color:var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a0a0a0' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
      >
        <option value="all">Все</option>
        <option value="done">Пройденные</option>
        <option value="want">Хочу пройти</option>
        <option value="postponed">Отложена</option>
      </select>
    </div>
  );
}
