function getGameById(id) {
  const custom = JSON.parse(localStorage.getItem(`game_${id}`));
  const def = DEFAULT_GAMES[id] || {};
  return { ...def, ...custom, id };
}

function loadGamePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get("id");

  const game = getGameById(gameId);
  if (!game) return;

  document.getElementById("game-title").textContent = game.title;
  document.getElementById("game-img").src = game.img;

  const textarea = document.getElementById("game-description");
  textarea.value = game.desc || "";

  if (localStorage.getItem('isAdmin') === 'true') {
    textarea.disabled = false;
    textarea.oninput = () => {
      const updated = { ...game, desc: textarea.value };
      localStorage.setItem(`game_${game.id}`, JSON.stringify(updated));
    };
  } else {
    textarea.disabled = true;
  }
}

loadGamePage();
