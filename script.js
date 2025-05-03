const games = [
  {
    id: "witcher",
    title: "The Witcher 3: Wild Hunt",
    status: "done",
    image: "https://cdn.akamai.steamstatic.com/steam/apps/499450/header.jpg",
    description: "Мир, в котором хочется потеряться. Каждый персонаж — история сам по себе."
  },
  {
    id: "elden",
    title: "Elden Ring",
    status: "want",
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg",
    description: "Открытый мир, где каждый шаг — битва за выживание."
  },
  {
    id: "acorigins",
    title: "Assassin's Creed Origins",
    status: "want",
    image: "https://cdn.akamai.steamstatic.com/steam/apps/537400/header.jpg",
    description: "Жду не дождусь, чтобы окунуться в новую историю."
  }
];

function loadGames(filter = "all") {
  const container = document.getElementById("game-cards");
  container.innerHTML = "";

  games.forEach(game => {
    if (filter !== "all" && game.status !== filter) return;

    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => window.location.href = `game.html?id=${game.id}`;
    card.innerHTML = `
      <img src="${game.image}" alt="${game.title}">
      <div class="card-content">
        <h2>${game.title}</h2>
        <span class="status ${game.status}">${game.status === "done" ? "✅ Пройдено" : "🧭 Хочу пройти"}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function filter(type) {
  loadGames(type);
}

function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById("theme-toggle");
  if (body.classList.contains("dark-theme")) {
    body.classList.remove("dark-theme");
    body.classList.add("light-theme");
    btn.textContent = "🌙 Тёмная";
  } else {
    body.classList.remove("light-theme");
    body.classList.add("dark-theme");
    btn.textContent = "🌞 Светлая";
  }
}

document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

loadGames();
