<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

interface AlphabetEntry {
  upper: string
  lower: string
  example: string
}

const ALPHABET: AlphabetEntry[] = [
  { upper: 'A', lower: 'a', example: 'Apple' },
  { upper: 'B', lower: 'b', example: 'Ball' },
  { upper: 'C', lower: 'c', example: 'Cat' },
  { upper: 'D', lower: 'd', example: 'Dog' },
  { upper: 'E', lower: 'e', example: 'Egg' },
  { upper: 'F', lower: 'f', example: 'Fish' },
  { upper: 'G', lower: 'g', example: 'Goat' },
  { upper: 'H', lower: 'h', example: 'Hat' },
  { upper: 'I', lower: 'i', example: 'Igloo' },
  { upper: 'J', lower: 'j', example: 'Jam' },
  { upper: 'K', lower: 'k', example: 'Kite' },
  { upper: 'L', lower: 'l', example: 'Lion' },
  { upper: 'M', lower: 'm', example: 'Moon' },
  { upper: 'N', lower: 'n', example: 'Nose' },
  { upper: 'O', lower: 'o', example: 'Orange' },
  { upper: 'P', lower: 'p', example: 'Pig' },
  { upper: 'Q', lower: 'q', example: 'Queen' },
  { upper: 'R', lower: 'r', example: 'Rain' },
  { upper: 'S', lower: 's', example: 'Sun' },
  { upper: 'T', lower: 't', example: 'Tiger' },
  { upper: 'U', lower: 'u', example: 'Umbrella' },
  { upper: 'V', lower: 'v', example: 'Van' },
  { upper: 'W', lower: 'w', example: 'Water' },
  { upper: 'X', lower: 'x', example: 'X-ray' },
  { upper: 'Y', lower: 'y', example: 'Yarn' },
  { upper: 'Z', lower: 'z', example: 'Zebra' },
]

const ROUND_SIZE = 20

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function buildPool(): AlphabetEntry[] {
  const base = shuffle([...ALPHABET])
  const pool: AlphabetEntry[] = []
  while (pool.length < ROUND_SIZE) pool.push(...base)
  return pool.slice(0, ROUND_SIZE)
}

interface HistoryEntry {
  letter: string
  example: string
  wasCorrect: boolean
  chosenExample: string
}

// ── Mode toggle ───────────────────────────────────────────────────────────────
const caseMode = ref<'upper' | 'lower'>('upper')

function displayLetter(entry: AlphabetEntry): string {
  return caseMode.value === 'upper' ? entry.upper : entry.lower
}

// ── Quiz state ────────────────────────────────────────────────────────────────
const voiceEnabled = ref(false)
const timedMode = ref(false)

const pool = ref<AlphabetEntry[]>(buildPool())
const current = ref(0)
const history = ref<HistoryEntry[]>([])
const roundComplete = ref(false)
const hasAnswered = ref(false)
const answerState = ref<'correct' | 'wrong' | null>(null)
const chosenExample = ref('')

const timeLeft = ref(60)
let timerInterval: ReturnType<typeof setInterval> | null = null

const currentEntry = () => pool.value[current.value]!
const score = () => history.value.filter(h => h.wasCorrect).length

function getChoices(entry: AlphabetEntry): AlphabetEntry[] {
  const others = shuffle(ALPHABET.filter(e => e.upper !== entry.upper)).slice(0, 3)
  return shuffle([entry, ...others])
}

const choices = ref<AlphabetEntry[]>([])
let nextForceEntry: AlphabetEntry | null = null

// ── Announcement (播報題目) ────────────────────────────────────────────────────
let announceGen = 0
const speakingIdx = ref<number | null>(null)

function stopAnnouncement() {
  announceGen++
  speakingIdx.value = null
  window.speechSynthesis?.cancel()
}

function speakChoiceAt(idx: number, gen: number) {
  if (gen !== announceGen) return
  if (idx >= choices.value.length) {
    speakingIdx.value = null
    return
  }
  speakingIdx.value = idx
  const utter = new SpeechSynthesisUtterance(choices.value[idx]!.example)
  utter.lang = 'en-US'
  utter.rate = 0.85
  utter.onend = () => { if (gen === announceGen) setTimeout(() => speakChoiceAt(idx + 1, gen), 350) }
  utter.onerror = () => { if (gen === announceGen) speakingIdx.value = null }
  window.speechSynthesis.speak(utter)
}

function announceChoices() {
  stopAnnouncement()
  const gen = announceGen
  speakChoiceAt(0, gen)
}

function speakLetter() {
  stopAnnouncement()
  const utter = new SpeechSynthesisUtterance(displayLetter(currentEntry()))
  utter.lang = 'en-US'
  utter.rate = 0.8
  window.speechSynthesis.speak(utter)
}

// ── Feedback TTS ──────────────────────────────────────────────────────────────
function speakFeedback(text: string) {
  window.speechSynthesis?.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'zh-TW'
  utter.rate = 0.9
  window.speechSynthesis.speak(utter)
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
  if (!timedMode.value) return
  timeLeft.value = 60
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval!)
      timerInterval = null
      if (!hasAnswered.value) selectChoice(null)
    }
  }, 1000)
}
function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
}

// ── Answer selection ──────────────────────────────────────────────────────────
function selectChoice(c: AlphabetEntry | null) {
  if (hasAnswered.value) return
  stopAnnouncement()
  stopTimer()
  hasAnswered.value = true
  const correct = c !== null && c.upper === currentEntry().upper
  answerState.value = correct ? 'correct' : 'wrong'
  chosenExample.value = c?.example ?? ''
  history.value.push({
    letter: displayLetter(currentEntry()),
    example: currentEntry().example,
    wasCorrect: correct,
    chosenExample: c?.example ?? '',
  })
  nextForceEntry = (!correct && c !== null) ? c : null
  speakFeedback(correct ? '答對了，你好棒' : '加油喔，再試一次')
}

function nextQuestion() {
  stopAnnouncement()
  hasAnswered.value = false
  answerState.value = null
  chosenExample.value = ''
  const prevUpper = pool.value[current.value]?.upper
  current.value++
  if (current.value >= ROUND_SIZE) {
    roundComplete.value = true
    return
  }
  if (nextForceEntry !== null) {
    pool.value[current.value] = nextForceEntry
    nextForceEntry = null
  } else if (pool.value[current.value]?.upper === prevUpper) {
    const altIdx = pool.value.findIndex((e, i) => i > current.value && e.upper !== prevUpper)
    if (altIdx !== -1) {
      const temp = pool.value[current.value]!
      pool.value[current.value] = pool.value[altIdx]!
      pool.value[altIdx] = temp
    }
  }
  choices.value = getChoices(pool.value[current.value]!)
  if (voiceEnabled.value) setTimeout(() => announceChoices(), 300)
  if (timedMode.value) startTimer()
}

function resetGame() {
  stopAnnouncement()
  stopTimer()
  nextForceEntry = null
  pool.value = buildPool()
  current.value = 0
  history.value = []
  roundComplete.value = false
  hasAnswered.value = false
  answerState.value = null
  chosenExample.value = ''
  choices.value = getChoices(pool.value[0]!)
  if (voiceEnabled.value) setTimeout(() => announceChoices(), 300)
  if (timedMode.value) startTimer()
}

function switchMode(mode: 'upper' | 'lower') {
  caseMode.value = mode
}

// init
choices.value = getChoices(pool.value[0]!)

onBeforeUnmount(() => {
  stopAnnouncement()
  stopTimer()
})
</script>

<template>
  <main class="mx-auto max-w-xl px-4 pb-16 pt-6">
    <h1 class="mb-4 text-center text-2xl font-bold text-zinc-800 dark:text-zinc-100">
      英文字母測驗
    </h1>

    <!-- Case mode toggle -->
    <div class="mb-4 flex justify-center">
      <div class="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1 dark:border-zinc-700 dark:bg-zinc-800">
        <button
          @click="switchMode('upper')"
          :class="[
            'rounded-lg px-5 py-1.5 text-sm font-semibold transition',
            caseMode === 'upper'
              ? 'bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
          ]"
        >大寫字母</button>
        <button
          @click="switchMode('lower')"
          :class="[
            'rounded-lg px-5 py-1.5 text-sm font-semibold transition',
            caseMode === 'lower'
              ? 'bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
          ]"
        >小寫字母</button>
      </div>
    </div>

    <!-- Options row -->
    <div class="mb-4 flex flex-wrap justify-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
      <label class="flex cursor-pointer items-center gap-1.5">
        <input v-model="voiceEnabled" type="checkbox" class="h-4 w-4 rounded" />
        語音播放
      </label>
      <label class="flex cursor-pointer items-center gap-1.5">
        <input v-model="timedMode" type="checkbox" class="h-4 w-4 rounded" />
        一分鐘答題
      </label>
    </div>

    <!-- Progress -->
    <div class="mb-5">
      <div class="mb-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>第 {{ Math.min(current + 1, ROUND_SIZE) }} / {{ ROUND_SIZE }} 題</span>
        <span v-if="timedMode && !roundComplete" :class="timeLeft <= 10 ? 'font-bold text-red-500' : ''">
          {{ timeLeft }}秒
        </span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-700">
        <div
          class="h-full rounded-full bg-emerald-500 transition-all"
          :style="{ width: `${(current / ROUND_SIZE) * 100}%` }"
        />
      </div>
      <div class="mt-2 flex flex-wrap justify-center gap-1">
        <span
          v-for="(h, i) in history"
          :key="i"
          :class="['inline-block h-2.5 w-2.5 rounded-full', h.wasCorrect ? 'bg-emerald-500' : 'bg-red-400']"
        />
        <span
          v-for="i in ROUND_SIZE - history.length"
          :key="'e' + i"
          class="inline-block h-2.5 w-2.5 rounded-full bg-stone-200 dark:bg-zinc-600"
        />
      </div>
    </div>

    <!-- Round complete -->
    <div
      v-if="roundComplete"
      class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-900/30"
    >
      <div class="mb-2 text-4xl">🎉</div>
      <div class="mb-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
        {{ score() }} / {{ ROUND_SIZE }}
      </div>
      <p class="mb-4 text-zinc-600 dark:text-zinc-300">
        {{ score() >= 18 ? '太厲害了！' : score() >= 14 ? '答得不錯！' : '繼續加油！' }}
      </p>
      <div class="mb-4 max-h-60 overflow-y-auto rounded-xl bg-white/70 p-3 dark:bg-zinc-800/50">
        <div
          v-for="(h, i) in history"
          :key="i"
          class="flex items-center gap-2 border-b border-stone-100 py-1 text-sm last:border-0 dark:border-zinc-700"
        >
          <span :class="h.wasCorrect ? 'text-emerald-500' : 'text-red-400'">
            {{ h.wasCorrect ? '✓' : '✗' }}
          </span>
          <span class="w-6 text-center font-bold">{{ h.letter }}</span>
          <span class="text-zinc-500">{{ h.example }}</span>
          <span v-if="!h.wasCorrect" class="ml-auto text-zinc-400">
            {{ h.chosenExample ? `選了「${h.chosenExample}」` : '未作答' }}
          </span>
        </div>
      </div>
      <button
        @click="resetGame"
        class="rounded-xl bg-emerald-500 px-8 py-2.5 font-semibold text-white hover:bg-emerald-600"
      >
        再玩一次
      </button>
    </div>

    <!-- Quiz area -->
    <div v-else>
      <!-- Letter card -->
      <button
        @click="speakLetter"
        class="mb-3 w-full rounded-2xl border border-stone-200 bg-white/90 p-6 text-center shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/80 dark:hover:border-emerald-500"
      >
        <div class="mb-1 select-none font-bold leading-none text-zinc-800 dark:text-zinc-100"
          :class="caseMode === 'upper' ? 'text-[6rem]' : 'text-[7rem]'"
        >
          {{ displayLetter(currentEntry()) }}
        </div>
        <div class="mt-2 text-xs text-zinc-300 dark:text-zinc-600">點擊播放發音</div>
      </button>

      <!-- Answer feedback -->
      <div
        v-if="hasAnswered"
        class="mb-3 rounded-xl px-4 py-3 text-center text-base font-semibold"
        :class="answerState === 'correct'
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'"
      >
        <span v-if="answerState === 'correct'">✓ 答對了！正確答案是「{{ currentEntry().example }}」</span>
        <span v-else>✗ 再加油！正確答案是「{{ currentEntry().example }}」</span>
      </div>

      <!-- Choices -->
      <div class="mb-4 grid grid-cols-2 gap-3">
        <button
          v-for="(c, i) in choices"
          :key="c.upper"
          :disabled="hasAnswered"
          @click="selectChoice(c)"
          :class="[
            'rounded-xl border py-5 text-2xl font-bold transition',
            speakingIdx === i && !hasAnswered
              ? 'animate-pulse border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-300'
              : hasAnswered && c.upper === currentEntry().upper
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300'
                : hasAnswered && c.example === chosenExample && answerState === 'wrong'
                  ? 'border-red-400 bg-red-50 text-red-600 dark:border-red-500 dark:bg-red-900/30 dark:text-red-300'
                  : 'border-stone-200 bg-white/90 text-zinc-800 hover:border-emerald-400 hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:border-emerald-500',
          ]"
        >
          {{ c.example }}
        </button>
      </div>

      <!-- Action buttons -->
      <div class="flex justify-center gap-3">
        <button
          v-if="!hasAnswered"
          @click="announceChoices"
          :class="[
            'rounded-xl px-5 py-2 text-sm font-semibold transition',
            speakingIdx !== null
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              : 'border border-stone-200 bg-stone-50 text-zinc-600 hover:bg-stone-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
          ]"
        >
          {{ speakingIdx !== null ? '🔊 播報中…' : '🔊 播報題目' }}
        </button>
        <button
          v-if="hasAnswered"
          @click="nextQuestion"
          class="rounded-xl bg-zinc-700 px-8 py-2.5 font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-600 dark:hover:bg-zinc-500"
        >
          {{ current + 1 >= ROUND_SIZE ? '查看結果' : '下一題 →' }}
        </button>
      </div>
    </div>
  </main>
</template>
