const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get("id");

async function loadGame() {
  const res = await fetch('games.json');
  const allGames = await res.json();
  const game = allGames.find(g => g.id === gameId);

  if (!game) return;

  document.getElementById("game-title").textContent = game.title;
  document.getElementById("game-img").src = game.img;

  const textarea = document.getElementById("game-description");
  const savedDesc = localStorage.getItem(`desc_${gameId}`) || game.desc;
  textarea.value = savedDesc;

  if (localStorage.getItem('isAdmin') === 'true') {
    textarea.disabled = false;
  } else {
    textarea.disabled = true;
  }
}

function saveDescription() {
  const desc = document.getElementById("game-description").value;
  localStorage.setItem(`desc_${gameId}`, desc);
}

loadGame();
