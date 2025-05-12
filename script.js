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
let isLoadingAuth = true;

// === Firebase Setup ===
const firebaseConfig = {
  apiKey: "AIzaSyDhMfbhd7emAXNKDexXxaCxZ0k2DfkRcVg",
  authDomain: "my-games-app-hub.firebaseapp.com",
  databaseURL: "https://my-games-app-hub-default-rtdb.firebaseio.com ",
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
  if (cached) return cached;
  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?key= ${RAWG_API_KEY}&search=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    const results = data.results || [];
    setToCache(query, results);
    return results;
  } catch (err) {
    console.error("Ошибка поиска:", err);
    return [];
  }
}

// === Обработчик поиска по играм ===
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
  updateParticleColor(theme);
}
themeToggle.addEventListener("click", () => {
  const currentTheme = localStorage.getItem("theme") || "dark";
  setTheme(currentTheme === "dark" ? "light" : "dark");
});
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  setTheme(savedTheme);
});

// === Авторизация ===
authBtn.addEventListener("click", () => {
  if (currentUser) {
    auth.signOut().then(() => {
      localStorage.removeItem("games");
    });
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
  isLoadingAuth = false;
  if (user) {
    currentUser = user;
    createProfileIfNotExists(user); // Автоматическое создание профиля
    authBtn.textContent = "Выйти";
    userStatus.textContent = `Вы вошли как ${user.displayName}`;
    database.ref(`users/${currentUser.uid}`).once("value").then(snapshot => {
      const data = snapshot.val();
      games = data?.games || [];
      applyFilters();
      toggleAuthUI(false);
    }).catch(console.error);
  } else {
    currentUser = null;
    authBtn.textContent = "Войти через Google";
    userStatus.textContent = "Вы не вошли";
    games = [];
    applyFilters();
    toggleAuthUI(true);
  }
});

function toggleAuthUI(isVisible) {
  if (isLoadingAuth) return;
  authOnlyOverlay.style.display = isVisible ? "flex" : "none";
}

// === Сохранение данных ===
function saveData() {
  if (currentUser) {
    database.ref(`users/${currentUser.uid}`).set({ games });
  } else {
    localStorage.setItem("games", JSON.stringify(games));
  }
}

// === Добавление игры ===
addGameForm.addEventListener("submit", e => {
  e.preventDefault();
  games.push({
    id: Date.now(),
    title: gameTitle.value.trim(),
    image: gameImage.value.trim(),
    description: gameDescription.value.trim(),
    status: "want",
    rating: 0
  });
  saveData();
  applyFilters();
  addGameForm.reset();
});

// === Фильтрация ===
document.addEventListener("DOMContentLoaded", () => {
  searchInput.addEventListener("input", applyFilters);
  filterSelect.addEventListener("change", applyFilters);
});
function applyFilters() {
  const term = searchInput.value.toLowerCase();
  const filter = filterSelect.value;
  const filtered = games.filter(g =>
    g.title.toLowerCase().includes(term) &&
    (filter === "all" || g.status === filter)
  );
  renderFilteredGames(filtered);
}
function renderFilteredGames(filteredGames) {
  const existingCards = [...cardsContainer.querySelectorAll(".card")];
  filteredGames.forEach((game, index) => {
    let card = existingCards.find(c => c.dataset.id == game.id);
    if (!card) {
      card = document.createElement("div");
      card.className = "card";
      card.setAttribute("data-id", game.id);
      card.innerHTML = `
        <img src="${game.image}" alt="${game.title}">
        <h2>${game.title}</h2>
        <span class="status ${game.status}">${game.status === "done" ? "Пройдена" : "Хочу пройти"}</span>
        <div class="stars" data-rating="${game.rating || 0}"></div>
        <small>Добавлено</small>
        <textarea class="description">${game.description || ""}</textarea>
        <button class="delete-btn">🗑️ Удалить</button>
      `;
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
          game.rating = parseInt(e.target.dataset.rating);
          updateStarDisplay(starsEl, game.rating);
          saveData();
        }
      });

      const statusEl = card.querySelector(".status");
      statusEl.addEventListener("click", () => {
        game.status = game.status === "done" ? "want" : "done";
        saveData();
        updateCard(card, game);
        updateStats();
      });

      const descEl = card.querySelector(".description");
      descEl.addEventListener("input", () => {
        game.description = descEl.value;
        saveData();
      });

      const deleteBtn = card.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", () => {
        games.splice(index, 1);
        saveData();
        applyFilters();
        updateStats();
      });

      cardsContainer.appendChild(card);
    } else {
      updateCard(card, game);
    }
  });

  existingCards.forEach(card => {
    if (!filteredGames.some(g => g.id == card.dataset.id)) {
      card.remove();
    }
  });

  updateStats();
}
function updateCard(card, game) {
  const statusEl = card.querySelector(".status");
  statusEl.className = `status ${game.status}`;
  statusEl.textContent = game.status === "done" ? "Пройдена" : "Хочу пройти";

  const starsEl = card.querySelector(".stars");
  updateStarDisplay(starsEl, game.rating || 0);

  const descEl = card.querySelector(".description");
  descEl.value = game.description || "";
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

// === Частицы через Canvas с реакцией на мышь и цветом под тему ===
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
let particles = [];
let width, height;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

function resizeCanvas() {
  width = (canvas.width = window.innerWidth);
  height = (canvas.height = window.innerHeight);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 2 + 1;
    this.alpha = Math.random() * 0.5 + 0.3;
    this.color = currentParticleColor;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
    ctx.fill();
  }
  update() {
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 200) {
      this.vx -= dx / 2000;
      this.vy -= dy / 2000;
    }
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > width) this.reset();
    if (this.y < 0 || this.y > height) this.reset();
  }
}

function createParticles(num = 190) {
  particles = [];
  for (let i = 0; i < num; i++) {
    particles.push(new Particle());
  }
}
let currentParticleColor = "255, 255, 255";
function setParticleColor(color) {
  currentParticleColor = color;
  particles.forEach(p => {
    p.color = color;
  });
}
function animateParticles() {
  ctx.clearRect(0, 0, width, height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i];
      const p2 = particles[j];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        ctx.strokeStyle = `rgba(${currentParticleColor}, ${0.7 * (1 - dist / 100)})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }

  ctx.strokeStyle = `rgba(${currentParticleColor}, 0.2)`;
  for (let p of particles) {
    const dx = p.x - mouseX;
    const dy = p.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 150) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(mouseX, mouseY);
      ctx.stroke();
    }
  }

  requestAnimationFrame(animateParticles);
}
function updateParticleColor(theme) {
  if (theme === "dark") {
    setParticleColor("255, 255, 255");
  } else {
    setParticleColor("50, 50, 50");
  }
}
createParticles();
animateParticles();

// === Боковое меню ===
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const menuClose = document.getElementById("menuClose");

function openSidebar() {
  sidebar.classList.add("open");
  menuToggle.style.zIndex = "1000";
}
function closeSidebar() {
  sidebar.classList.remove("open");
  menuToggle.style.zIndex = "1002";
}
menuToggle.addEventListener("click", openSidebar);
menuClose.addEventListener("click", closeSidebar);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSidebar();
  }
});
document.addEventListener("click", (e) => {
  if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
    closeSidebar();
  }
});

// === Генерация числового ID на основе UID Firebase ===
function generateNumericId(uid) {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = ((hash << 5) - hash + uid.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString().slice(0, 7);
}

// === Создание профиля при первом входе ===
function createProfileIfNotExists(user) {
  const profileRef = database.ref(`profiles/${user.uid}`);
  profileRef.once("value").then(snapshot => {
    if (!snapshot.exists()) {
      profileRef.set({
        nickname: user.displayName || "Пользователь",
        avatarUrl: user.photoURL || "https://i.pravatar.cc/150?img=1  ",
        description: "",
        userId: generateNumericId(user.uid),
        joinedAt: new Date().toISOString()
      }).catch(console.error);
    }
  });
}

// === DOM Elements для профиля ===
const profileSection = document.getElementById("profileSection");
const profileNickname = document.getElementById("profileNickname");
const profileUserId = document.getElementById("profileUserId")?.querySelector("span");
const profileAvatar = document.getElementById("profileAvatar");
const nicknameInput = document.getElementById("nicknameInput");
const avatarUrlInput = document.getElementById("avatarUrlInput");
const avatarInput = document.getElementById("avatarInput");
const profileDescriptionInput = document.getElementById("profileDescriptionInput");
const editProfileForm = document.getElementById("editProfileForm");
const copyUserIdBtn = document.querySelector(".copy-btn");

let uploadedAvatarDataURL = null;

// === Обновление UI профиля из Firebase ===
function updateProfileUI() {
  if (!currentUser) return;
  const userRef = database.ref(`users/${currentUser.uid}`);
  const profileRef = database.ref(`profiles/${currentUser.uid}`);
  Promise.all([
    userRef.once("value"),
    profileRef.once("value")
  ]).then(([userSnapshot, profileSnapshot]) => {
    const userData = userSnapshot.val() || {};
    const profileData = profileSnapshot.val() || {};
    const gamesList = userData.games || [];
    const nickname = profileData.nickname || currentUser.displayName || "Без ника";
    const avatarUrl = profileData.avatarUrl || currentUser.photoURL || "https://i.pravatar.cc/150?img=1  ";
    profileNickname.textContent = nickname;
    profileAvatar.src = avatarUrl;
    nicknameInput.value = nickname;
    avatarUrlInput.value = profileData.avatarUrl || "";
    profileDescriptionInput.value = profileData.description || "";
    if (profileUserId) profileUserId.textContent = generateNumericId(currentUser.uid);
  });
}

// === Клик по аватару — открывает выбор файла ===
profileAvatar.addEventListener("click", () => {
  avatarInput.click();
});
avatarInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (event) {
      profileAvatar.src = event.target.result;
      uploadedAvatarDataURL = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// === Сохранение изменений профиля ===
editProfileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newNick = nicknameInput.value.trim();
  let newAvatar = uploadedAvatarDataURL || avatarUrlInput.value.trim();
  const newDescription = profileDescriptionInput.value.trim();
  if (!newNick) {
    alert("Введите никнейм!");
    return;
  }
  if (!newAvatar) {
    newAvatar = "https://i.pravatar.cc/150?img=1  ";
  }
  if (currentUser && newNick) {
    firebase.auth().currentUser.updateProfile({
      displayName: newNick,
      photoURL: newAvatar
    }).then(() => {
      database.ref(`profiles/${currentUser.uid}`).set({
        nickname: newNick,
        avatarUrl: newAvatar,
        description: newDescription,
        userId: generateNumericId(currentUser.uid),
        joinedAt: new Date().toISOString()
      });
      alert("✅ Профиль успешно обновлён!");
      uploadedAvatarDataURL = null;
      updateProfileUI();
    }).catch(err => {
      alert("❌ Ошибка: " + err.message);
    });
  }
});

// === Копирование ID в буфер обмена ===
if (copyUserIdBtn) {
  copyUserIdBtn.addEventListener("click", () => {
    const userId = profileUserId.textContent;
    navigator.clipboard.writeText(userId).then(() => {
      copyUserIdBtn.textContent = "✅";
      copyUserIdBtn.title = "Скопировано!";
      setTimeout(() => {
        copyUserIdBtn.textContent = "📋";
        copyUserIdBtn.title = "Нажмите, чтобы скопировать";
      }, 1000);
    }).catch(() => {
      alert("Не удалось скопировать ID");
    });
  });
}

// === Добавление элементов друзей ===
const friendsSection = document.getElementById("friendsSection") || (() => {
  const sec = document.createElement("section");
  sec.id = "friendsSection";
  sec.className = "profile-section hidden";
  sec.innerHTML = `
    <h2>Мои друзья</h2>
    <div id="friendsList" class="friends-list"></div>
    <button id="addFriendBtn" class="accent-btn full-width">➕ Добавить друга</button>
    <button id="searchByIdBtn" class="accent-btn full-width" style="margin-top: 1rem;">🔍 Найти по ID</button>
  `;
  document.body.appendChild(sec);
  return sec;
})();
const friendsList = document.getElementById("friendsList") || document.createElement("div");
const addFriendBtn = document.getElementById("addFriendBtn");
const searchByIdBtn = document.getElementById("searchByIdBtn");

// === Поиск пользователя по числовому ID ===
function findUserByNumericId(searchedId) {
  return new Promise((resolve, reject) => {
    database.ref("profiles").once("value", snapshot => {
      const profiles = snapshot.val() || {};
      for (const uid in profiles) {
        if (profiles[uid].userId === searchedId) {
          resolve({ found: true, uid });
          return;
        }
      }
      resolve({ found: false });
    }).catch(reject);
  });
}

// === Открытие списка друзей ===
document.querySelector('[href="#friends"]')?.addEventListener("click", (e) => {
  e.preventDefault();
  closeSidebar();
  document.querySelectorAll(".cards, .add-game, .search-filter, .backup-section, #profileSection").forEach(el => el?.classList.add("hidden"));
  friendsSection.classList.remove("hidden");
  loadFriends();
});

// === Загрузка списка друзей ===
function loadFriends() {
  if (!currentUser) return;
  const friendsRef = database.ref(`friends/${currentUser.uid}`);
  friendsList.innerHTML = "<p>Загрузка друзей...</p>";

  friendsRef.once("value").then(snapshot => {
    const friends = snapshot.val() || {};
    const uids = Object.keys(friends);

    if (uids.length === 0) {
      friendsList.innerHTML = "<p>У вас пока нет друзей.</p>";
      return;
    }

    friendsList.innerHTML = "";

    uids.forEach(uid => {
      database.ref(`profiles/${uid}`).once("value").then(profileSnap => {
        const data = profileSnap.val();
        if (!data) return;

        const card = document.createElement("div");
        card.className = "friend-card";
        card.innerHTML = `
          <img src="${data.avatarUrl}" alt="${data.nickname}">
          <h4>${data.nickname}</h4>
          <small>ID: ${data.userId}</small>
          <button onclick="viewFriendProfile('${uid}')">👁 Просмотреть профиль</button>
        `;
        friendsList.appendChild(card);
      });
    });
  }).catch(console.error);
}

// === Просмотр профиля друга ===
window.viewFriendProfile = function(uid) {
  window.location.hash = `#friends/profile/${uid}`;
};

window.addEventListener("hashchange", () => {
  const hash = window.location.hash.substring(1);
  if (hash === "friends") {
    showFriendsList();
  } else if (hash.startsWith("friends/profile/")) {
    const friendUid = hash.replace("friends/profile/", "");
    showFriendProfile(friendUid);
  }
});

function showFriendsList() {
  document.querySelectorAll(".cards, .add-game, .search-filter, .backup-section, #profileSection").forEach(el => {
    el?.classList.add("hidden");
  });
  friendsSection.classList.remove("hidden");
  loadFriends();
}

function showFriendProfile(uid) {
  closeSidebar();
  document.querySelectorAll(".cards, .add-game, .search-filter, .backup-section, #profileSection").forEach(el => {
    el?.classList.add("hidden");
  });

  let friendProfileContainer = document.getElementById("friendProfile");
  if (!friendProfileContainer) {
    friendProfileContainer = document.createElement("section");
    friendProfileContainer.id = "friendProfile";
    friendProfileContainer.className = "profile-section hidden";
    document.body.appendChild(friendProfileContainer);
  }

  friendProfileContainer.classList.remove("hidden");

  Promise.all([
    database.ref(`profiles/${uid}`).once("value"),
    database.ref(`users/${uid}/games`).once("value")
  ]).then(([profileSnap, gamesSnap]) => {
    const profile = profileSnap.val();
    const games = gamesSnap.val() || [];
    const doneCount = games.filter(g => g.status === "done").length;
    friendProfileContainer.innerHTML = `
      <div class="profile-card">
        <img src="${profile?.avatarUrl || 'https://i.pravatar.cc/150?img=1  '}" class="profile-avatar" alt="Аватар">
        <h2>${profile?.nickname || "Гость"}</h2>
        <p class="profile-user-id">ID: <span>${profile?.userId || '—'}</span></p>
        <div class="profile-stats">
          <p>Пройдено игр: <strong>${doneCount}</strong></p>
        </div>
        <button onclick="goBackToFriends()" class="accent-btn full-width">⬅ Назад к списку друзей</button>
      </div>
    `;
  });
}

window.goBackToFriends = function() {
  window.location.hash = "#friends";
}

// === Обработчики событий для друзей ===
searchByIdBtn.addEventListener("click", async () => {
  const friendId = prompt("Введите числовой ID друга:");
  if (!friendId) return;
  const result = await findUserByNumericId(friendId);
  if (!result.found) {
    alert("❌ Пользователь с таким ID не найден.");
    return;
  }
  viewFriendProfile(result.uid);
});

addFriendBtn.addEventListener("click", () => {
  const friendUid = prompt("Введите UID друга:");
  if (!friendUid || friendUid === currentUser.uid) {
    alert("❌ Неверный UID или вы пытаетесь добавить сами себя.");
    return;
  }
  database.ref(`friends/${currentUser.uid}/${friendUid}`).set(true).then(() => {
    alert("✅ Друг добавлен!");
    loadFriends();
  }).catch(console.error);
});
