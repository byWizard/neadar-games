// === DOM Elements ===
const cardsContainer = document.getElementById("cardsContainer");
const addGameForm = document.getElementById("addGameForm");
const gameTitle = document.getElementById("gameTitle");
const gameImage = document.getElementById("gameImage");
const gameDescription = document.getElementById("gameDescription");
const gameSearchInput = document.getElementById("gameSearch");
const searchResults = document.getElementById("searchResults");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const doneCountEl = document.getElementById("doneCount");
const authBtn = document.getElementById("authBtn");
const userStatus = document.getElementById("userStatus");
const themeToggle = document.getElementById("themeToggle");
const authOnlyOverlay = document.getElementById("authOnlyOverlay");
const authRequiredLoginBtn = document.getElementById("authRequiredLoginBtn");

let games = [];
let currentUser = null;

// === Firebase Setup ===
const firebaseConfig = {
  apiKey: "AIzaSyDhMfbhd7emAXNKDexXxaCxZ0k2DfkRcVg",
  authDomain: "my-games-app-hub.firebaseapp.com",
  databaseURL: "https://my-games-app-hub-default-rtdb.firebaseio.com",
  projectId: "my-games-app-hub",
  storageBucket: "my-games-app-hub.appspot.com",
  messagingSenderId: "251367004030",
  appId: "1:251367004030:web:2b1be1b1c76ee80c0d052f"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// === Кэширование поиска ===
const CACHE_KEY = "gameSearchCache";
const searchCache = loadCacheFromStorage();

function loadCacheFromStorage() {
  return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
}

function saveCacheToStorage() {
  localStorage.setItem(CACHE_KEY, JSON.stringify(searchCache));
}

function getFromCache(query) {
  const cached = searchCache[query];
  if (cached && Date.now() < cached.expiresAt) return cached.data;
  return null;
}

function setToCache(query, data, ttl = 3600000) {
  searchCache[query] = { data, expiresAt: Date.now() + ttl };
  saveCacheToStorage();
}

// === RAWG API поиск ===
const RAWG_API_KEY = "48b79844fcc44af7860a5fa89de88ca8";

async function searchGame(query) {
  const cached = getFromCache(query);
  if (cached) {
    console.log("Берём из кэша:", query);
    return cached;
  }
  try {
    const response = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}`);
    const data = await response.json();
    const results = data.results || [];
    setToCache(query, results);
    return results;
  } catch (err) {
    console.error("Ошибка поиска:", err);
    return [];
  }
}

// === Обработчик поиска ===
let debounceTimer;
gameSearchInput.addEventListener("input", e => {
  const query = e.target.value.trim();
  if (query.length < 2) {
    searchResults.innerHTML = "";
    return;
  }
  clearTimeout(debounceTimer);
  searchResults.innerHTML = "<li>Ищем игры...</li>";
  debounceTimer = setTimeout(async () => {
    const results = await searchGame(query);
    renderSearchResults(results);
  }, 500);
});

function renderSearchResults(results) {
  searchResults.innerHTML = "";
  if (results.length === 0) {
    searchResults.innerHTML = "<li>Ничего не найдено</li>";
    return;
  }
  results.slice(0, 5).forEach(game => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div style="display: flex; align-items: center;">
        <img src="${game.background_image}" alt="${game.name}" width="40" style="margin-right: 10px; border-radius: 4px;">
        <div>
          <strong>${game.name}</strong><br>
          <small>${game.short_description || 'Описание отсутствует'}</small>
        </div>
      </div>
    `;
    li.addEventListener("click", () => {
      gameTitle.value = game.name;
      gameImage.value = game.background_image;
      gameDescription.value = game.short_description || "";
      searchResults.innerHTML = "";
    });
    searchResults.appendChild(li);
  });
}

// === Тема ===
function setTheme(theme) {
  document.body.classList.remove("dark-theme", "light-theme");
  document.body.classList.add(`${theme}-theme`);
  themeToggle.textContent = theme === "dark" ? "🌙 Переключить тему" : "☀️ Переключить тему";
  localStorage.setItem("theme", theme);
}

themeToggle.addEventListener("click", () => {
  const currentTheme = localStorage.getItem("theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(newTheme);
});

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  setTheme(savedTheme);
});

// === Авторизация ===
authBtn.addEventListener("click", () => {
  if (currentUser) {
    auth.signOut();
  } else {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => alert("Ошибка входа: " + err.message));
  }
});

authRequiredLoginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => alert("Ошибка входа: " + err.message));
});

// === Слушатель состояния пользователя ===
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    authBtn.textContent = "Выйти";
    userStatus.textContent = `Вы вошли как ${user.displayName}`;
    database.ref(`users/${currentUser.uid}`).once("value").then(snapshot => {
      const data = snapshot.val();
      const firebaseData = data?.games || [];
      games = firebaseData.length > 0 ? firebaseData : JSON.parse(localStorage.getItem("games")) || [];
      localStorage.setItem("games", JSON.stringify(games));
      applyFilters();
      toggleAuthUI(false);
    }).catch(console.error);
  } else {
    currentUser = null;
    authBtn.textContent = "Войти через Google";
    userStatus.textContent = "Вы не вошли";
    games = JSON.parse(localStorage.getItem("games")) || [];
    applyFilters();
    toggleAuthUI(true);
  }
});

function toggleAuthUI(isVisible) {
  authOnlyOverlay.style.display = isVisible ? "flex" : "none";
}

// === Сохранение данных ===
function saveData() {
  localStorage.setItem("games", JSON.stringify(games));
  if (currentUser) {
    database.ref(`users/${currentUser.uid}`).set({ games });
  }
}

// === Добавление игры ===
addGameForm.addEventListener("submit", e => {
  e.preventDefault();
  const newGame = {
    title: gameTitle.value.trim(),
    image: gameImage.value.trim(),
    description: gameDescription.value.trim(),
    status: "want",
    rating: 0
  };
  games.push(newGame);
  saveData();
  applyFilters();
  addGameForm.reset();
});

// === Фильтрация ===
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const filterSelect = document.getElementById("filterSelect");

  if (searchInput && filterSelect) {
    searchInput.addEventListener("input", applyFilters);
    filterSelect.addEventListener("change", applyFilters);
  }
});

function applyFilters() {
  const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();
  const filterValue = document.getElementById("filterSelect").value;

  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(searchTerm) &&
    (filterValue === "all" || game.status === filterValue)
  );

  renderFilteredGames(filteredGames);
}

function renderGames() {
  cardsContainer.innerHTML = "";
  games.forEach((game, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${game.image}" alt="${game.title}">
      <h2>${game.title}</h2>
      <span class="status ${game.status === "done" ? "done" : "want"}">${game.status === "done" ? "Пройдена" : "Хочу пройти"}</span>
      <div class="stars" data-rating="${game.rating || 0}"></div>
      <small>Добавлено</small>
      <textarea class="description">${game.description || ""}</textarea>
      <button class="delete-btn">🗑️ Удалить</button>
    `;

    // Звёзды рейтинга
    const starsEl = card.querySelector(".stars");
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
      star.textContent = "★";
      star.dataset.rating = i;
      starsEl.appendChild(star);
    }
    updateStarDisplay(starsEl, game.rating || 0);
    starsEl.addEventListener("click", e => {
      if (e.target.tagName === "SPAN") {
        const rating = parseInt(e.target.dataset.rating);
        game.rating = rating;
        updateStarDisplay(starsEl, rating);
        saveData();
      }
    });

    // Статус игры
    const statusEl = card.querySelector(".status");
    statusEl.addEventListener("click", () => {
      game.status = game.status === "done" ? "want" : "done";
      saveData();
      renderGames(); // Перерисовываем с новым статусом
    });

    // Описание
    const descEl = card.querySelector(".description");
    descEl.value = game.description || "";
    descEl.addEventListener("input", () => {
      game.description = descEl.value;
      saveData();
    });

    // Удаление
    const deleteBtn = card.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => {
      games.splice(index, 1);
      saveData();
      renderGames();
    });

    cardsContainer.appendChild(card);
  });
  updateStats();
}

    cardsContainer.appendChild(card);
  });
  updateStats();
}

function updateStarDisplay(container, rating) {
  container.querySelectorAll("span").forEach((star, idx) => {
    star.classList.toggle("active", idx < rating);
  });
}

function updateStats() {
  doneCountEl.textContent = games.filter(g => g.status === "done").length;
}

// ==== ЭКСПОРТ / ИМПОРТ ====
document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(games, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "my-games.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = event => {
    try {
      games = JSON.parse(event.target.result);
      saveData();
      applyFilters();
      alert("✅ Игры импортированы!");
    } catch (e) {
      alert("❌ Ошибка импорта.");
    }
  };
  reader.readAsText(file);
});

// === Частицы фона ===
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
let width, height;
let particles = [];
const mouse = {
  x: null,
  y: null,
  radius: 100
};

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

window.addEventListener("mousemove", function (e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.radius = Math.random() * 2 + 1;
    this.alpha = Math.random() * 0.5 + 0.2;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
    ctx.fill();
  }

  update() {
    if (mouse.x !== null && mouse.y !== null) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        const angle = Math.atan2(dy, dx);
        this.vx += -Math.cos(angle) * force * 0.3;
        this.vy += -Math.sin(angle) * force * 0.3;
      }
    }
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.y < 0 || this.x > width || this.y > height) {
      this.reset();
    }
  }
}

function initParticles(count = 150) {
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }
}

function animate() {
  ctx.clearRect(0, 0, width, height);
  for (let p of particles) {
    p.update();
    p.draw();
  }
  requestAnimationFrame(animate);
}

resizeCanvas();
initParticles();
animate();
window.addEventListener("resize", () => {
  resizeCanvas();
  initParticles();
});
