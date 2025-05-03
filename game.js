function getGameById(id) {
  return {
    witcher: {
      title: "The Witcher 3: Wild Hunt",
      image: "https://cdn.akamai.steamstatic.com/steam/apps/499450/header.jpg",
      descriptionKey: "description_witcher"
    },
    elden: {
      title: "Elden Ring",
      image: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg",
      descriptionKey: "description_elden"
    },
    acorigins: {
      title: "Assassin's Creed Origins",
      image: "https://cdn.akamai.steamstatic.com/steam/apps/537400/header.jpg",
      descriptionKey: "description_acorigins"
    }
  }[id];
}

function loadGamePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get("id");

  const game = getGameById(gameId);
  if (!game) return;

  document.getElementById("game-title").textContent = game.title;
  document.getElementById("game-img").src = game.image;

  const savedDesc = localStorage.getItem(game.descriptionKey) || game.defaultDesc;
  document.getElementById("game-description").value = savedDesc;
}

function saveDescription() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get("id");

  const game = getGameById(gameId);
  if (!game) return;

  const desc = document.getElementById("game-description").value;
  localStorage.setItem(game.descriptionKey, desc);
}

loadGamePage();
