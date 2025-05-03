document.getElementById("game-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const id = document.getElementById("game-id").value.trim();
  const title = document.getElementById("game-title").value.trim();
  const img = document.getElementById("game-img").value.trim();
  const status = document.getElementById("game-status").value;
  const desc = document.getElementById("game-desc").value;

  const gameData = { title, img, status, desc };

  localStorage.setItem(`game_${id}`, JSON.stringify(gameData));
  alert("Игра сохранена!");
});
