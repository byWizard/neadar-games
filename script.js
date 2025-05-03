const DEFAULT_GAMES = {
  witcher: {
    title: "The Witcher 3: Wild Hunt",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/499450/header.jpg",
    status: "done",
    desc: "Мир, в котором хочется потеряться. Каждый персонаж — история сам по себе."
  },
  elden: {
    title: "Elden Ring",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg",
    status: "want",
    desc: "Открытый мир, где каждый шаг — битва за выживание."
  }
};

function getGame(id) {
  return JSON.parse(localStorage.getItem(`game_${id}`)) || DEFAULT_GAMES[id] || null;
}

function getAllGames() {
  const games = [];

  for (const key in DEFAULT_GAMES) {
    const custom = JSON.parse(localStorage.getItem(`game_${key}`));
    games.push({ id: key, ...custom });
  }

  return games.filter(Boolean);
}

function loadGames(filter = "all") {
  const container = document.getElementById("game-cards");
  container.innerHTML = "";

  getAllGames().forEach(game => {
    if (filter !== "all" && game.status !== filter) return;

    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => window.location.href = `game.html?id=${game.id}`;
    card.innerHTML = `
      <img src="${game.img}" alt="${game.title}">
      <div class="card-content">
        <h2>${game.title}</h2>
        <span class="status ${game.status}">${game.status === "done" ? "✅ Пройдено" : "🧭 Хочу пройти"}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function openAdmin() {
  if (localStorage.getItem('isAdmin') === 'true') {
    window.location.href = 'admin-panel.html';
  } else {
    window.location.href = 'admin.html';
  }
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
