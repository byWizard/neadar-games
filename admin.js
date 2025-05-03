document.getElementById("add-game-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const id = document.getElementById("game-id").value.trim();
  const title = document.getElementById("game-title").value.trim();
  const img = document.getElementById("game-img").value.trim();
  const status = document.getElementById("game-status").value;
  const desc = document.getElementById("game-desc").value;

  const game = { id, title, img, status, desc };

  localStorage.setItem(`custom_game_${id}`, JSON.stringify(game));
  alert("Игра добавлена/обновлена!");
});
