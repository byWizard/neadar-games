let games = [];

async function loadGames() {
  const res = await fetch('games.json');
  games = await res.json();
  renderGames(games);
}

function renderGames(list) {
  const container = document.getElementById("game-list");
  container.innerHTML = "";

  list.forEach(game => {
    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => openGame(game.id);
    card.innerHTML = `
      <img src="${game.img}" alt="${game.title}">
      <div class="card-content">
        <h2>${game.title}</h2>
        <span class="status ${game.status}">${game.status === "done" ? "✅ Пройдено" : "🧭 Хочу пройти"}</span>
        <p>${game.desc.substring(0, 100)}...</p>
      </div>
    `;
    container.appendChild(card);
  });
}

function filter(type) {
  if (type === 'all') {
    renderGames(games);
  } else {
    renderGames(games.filter(g => g.status === type));
  }
}

function toggleTheme() {
  const body = document.getElementById("page-body");
  const btn = document.getElementById("theme-btn");

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

function openGame(id) {
  window.location.href = `game.html?id=${id}`;
}

function goToAdmin() {
  if (localStorage.getItem('isAdmin') === 'true') {
    window.location.href = 'admin-panel.html';
  } else {
    window.location.href = 'admin.html';
  }
}

loadGames();
