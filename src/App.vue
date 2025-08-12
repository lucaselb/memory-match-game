<template>
  <div class="container">
    <header>
      <div>
        <h1>
          Pokemon Memory
          <span style="font-size: 18px; margin-left: 4px">⚡️</span>
        </h1>
        <p class="small">
          Flip cards to match pairs — beginner-friendly. No external assets
          required.
        </p>
      </div>

      <div class="controls">
        <label class="small" for="size">Difficulty</label>
        <select id="size" v-model.number="pairsCount">
          <option value="8">Easy — 8 pairs</option>
          <option value="10">Normal — 10 pairs</option>
          <option value="12">Hard — 12 pairs</option>
        </select>
        <button class="primary" @click="resetGame">Start / Restart</button>
      </div>
    </header>

    <main>
      <section class="board-wrap">
        <div class="status" style="margin-bottom: 10px">
          <div>
            <small>Time</small>
            <strong>{{ formatTime(timeLeft) }}</strong>
          </div>
          <div>
            <small>Score</small>
            <strong>{{ score }}</strong>
          </div>
          <div>
            <small>Moves</small>
            <strong>{{ moves }}</strong>
          </div>
        </div>

        <div
          id="board"
          class="board"
          :style="{ gridTemplateColumns: `repeat(${boardCols}, 1fr)` }"
        >
          <div
            v-for="(card, idx) in deck"
            :key="idx"
            class="card"
            :class="{
              flipped: flipped.includes(idx),
              matched: matched.has(idx),
            }"
            @click="onCardClick(idx)"
          >
            <div class="card-inner">
              <div class="face back">?</div>
              <div class="face front">
                <div class="emoji">{{ card.emoji }}</div>
                <div class="name">{{ card.name }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside class="sidebar">
        <h3>How to play</h3>
        <p class="small">
          Click a card to flip. Match two identical Pokemon to score points.
          Match all pairs before time runs out!
        </p>

        <div style="margin-top: 12px">
          <h4 style="margin: 0 0 8px">Pokemon used</h4>
          <div class="pairs small">
            <div
              v-for="p in POKEMON.slice(0, pairsCount)"
              :key="p.name"
              style="
                padding: 6px 8px;
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.02);
                font-size: 14px;
              "
            >
              {{ p.emoji }} {{ p.name }}
            </div>
          </div>
        </div>

        <div class="moves">
          <button @click="showHint">Show Hint (reveal 2s)</button>
        </div>

        <div style="margin-top: 12px">
          <h4 style="margin: 0 0 8px">Best score</h4>
          <div class="small">{{ bestScore || "—" }}</div>
        </div>
      </aside>
    </main>

    <footer>Built with Vue 3 • Pokemon Memory Game</footer>

    <div class="overlay" v-if="showOverlay">
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title">{{ modalTitle }}</h2>
        <p class="small">{{ modalBody }}</p>
        <div
          style="
            display: flex;
            gap: 8px;
            margin-top: 12px;
            justify-content: flex-end;
          "
        >
          <button class="primary" @click="restartFromModal">Play again</button>
          <button @click="showOverlay = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";

const POKEMON = [
  { name: "Pikachu", emoji: "⚡" },
  { name: "Bulbasaur", emoji: "🌿" },
  { name: "Charmander", emoji: "🔥" },
  { name: "Squirtle", emoji: "💧" },
  { name: "Eevee", emoji: "🐾" },
  { name: "Jigglypuff", emoji: "🎤" },
  { name: "Snorlax", emoji: "💤" },
  { name: "Meowth", emoji: "🐱" },
  { name: "Pidgey", emoji: "🕊️" },
  { name: "Abra", emoji: "✨" },
  { name: "Psyduck", emoji: "🤯" },
  { name: "Magikarp", emoji: "🐟" },
];

const BEST_KEY = "pokemon-memory-best";

const pairsCount = ref(8);
const deck = ref([]);
const flipped = ref([]);
const matched = reactive(new Set());
const moves = ref(0);
const score = ref(0);
const timeLeft = ref(60);
const boardCols = ref(4);
const timer = ref(null);
const bestScore = ref(null);
const showOverlay = ref(false);
const modalTitle = ref("");
const modalBody = ref("");

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function formatTime(s) {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function buildDeck(nPairs) {
  const chosen = POKEMON.slice(0, nPairs);
  const cards = [];
  chosen.forEach((p, i) => {
    cards.push({ ...p, id: i });
    cards.push({ ...p, id: i });
  });
  return shuffle(cards);
}

function onCardClick(idx) {
  if (matched.has(idx)) return;
  if (flipped.value.includes(idx)) return;
  if (flipped.value.length >= 2) return;

  flipped.value.push(idx);

  if (flipped.value.length === 2) {
    moves.value++;
    checkMatch();
  }
}

function checkMatch() {
  const [a, b] = flipped.value;
  const cardA = deck.value[a];
  const cardB = deck.value[b];

  setTimeout(() => {
    if (cardA.id === cardB.id) {
      matched.add(a);
      matched.add(b);
      score.value += 100;
      if (matched.size === deck.value.length) {
        endGame(true);
      }
    } else {
      score.value = Math.max(0, score.value - 10);
    }
    flipped.value = [];
  }, 700);
}

function startTimer() {
  stopTimer();
  timer.value = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      endGame(false);
    }
  }, 1000);
}

function stopTimer() {
  if (timer.value) clearInterval(timer.value);
  timer.value = null;
}

function endGame(won) {
  stopTimer();
  modalTitle.value = won ? "You win!" : "Time up — try again!";
  modalBody.value = won
    ? `Score: ${score.value} • Moves: ${moves.value} • Time left: ${timeLeft.value}s`
    : `Score: ${score.value} • Moves: ${moves.value}`;
  showOverlay.value = true;

  const key = `${BEST_KEY}-${pairsCount.value}`;
  const best = Number(localStorage.getItem(key) || 0);
  if (won && score.value > best) {
    localStorage.setItem(key, score.value);
    bestScore.value = score.value + " ✨";
  }
}

function resetGame() {
  deck.value = buildDeck(pairsCount.value);
  flipped.value = [];
  matched.clear();
  moves.value = 0;
  score.value = 0;
  timeLeft.value = Math.max(60, pairsCount.value * 6);
  boardCols.value = pairsCount.value <= 8 ? 4 : 5;

  const key = `${BEST_KEY}-${pairsCount.value}`;
  bestScore.value = localStorage.getItem(key) || null;
  startTimer();
}

function showHint() {
  const allIdx = deck.value.map((_, i) => i).filter((i) => !matched.has(i));
  if (allIdx.length <= 2) return;
  shuffle(allIdx);
  const reveal = allIdx.slice(0, 2);
  flipped.value.push(...reveal);
  setTimeout(() => {
    flipped.value = [];
  }, 1200);
  score.value = Math.max(0, score.value - 20);
}

function restartFromModal() {
  showOverlay.value = false;
  resetGame();
}

onMounted(resetGame);
</script>
