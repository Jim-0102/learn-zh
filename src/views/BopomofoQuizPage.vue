<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

interface BopomofoSymbol {
  symbol: string
  category: '聲母' | '介母' | '韻母'
  example: string
}

const SYMBOLS: BopomofoSymbol[] = [
  // 聲母 (21)
  { symbol: 'ㄅ', category: '聲母', example: '爸' },
  { symbol: 'ㄆ', category: '聲母', example: '婆' },
  { symbol: 'ㄇ', category: '聲母', example: '媽' },
  { symbol: 'ㄈ', category: '聲母', example: '飛' },
  { symbol: 'ㄉ', category: '聲母', example: '刀' },
  { symbol: 'ㄊ', category: '聲母', example: '兔' },
  { symbol: 'ㄋ', category: '聲母', example: '牛' },
  { symbol: 'ㄌ', category: '聲母', example: '鹿' },
  { symbol: 'ㄍ', category: '聲母', example: '瓜' },
  { symbol: 'ㄎ', category: '聲母', example: '哭' },
  { symbol: 'ㄏ', category: '聲母', example: '喝' },
  { symbol: 'ㄐ', category: '聲母', example: '雞' },
  { symbol: 'ㄑ', category: '聲母', example: '七' },
  { symbol: 'ㄒ', category: '聲母', example: '西' },
  { symbol: 'ㄓ', category: '聲母', example: '蛛' },
  { symbol: 'ㄔ', category: '聲母', example: '車' },
  { symbol: 'ㄕ', category: '聲母', example: '獅' },
  { symbol: 'ㄖ', category: '聲母', example: '肉' },
  { symbol: 'ㄗ', category: '聲母', example: '字' },
  { symbol: 'ㄘ', category: '聲母', example: '刺' },
  { symbol: 'ㄙ', category: '聲母', example: '絲' },
  // 介母 (3)
  { symbol: 'ㄧ', category: '介母', example: '衣' },
  { symbol: 'ㄨ', category: '介母', example: '烏' },
  { symbol: 'ㄩ', category: '介母', example: '魚' },
  // 韻母 (13)
  { symbol: 'ㄚ', category: '韻母', example: '啊' },
  { symbol: 'ㄛ', category: '韻母', example: '哦' },
  { symbol: 'ㄜ', category: '韻母', example: '鵝' },
  { symbol: 'ㄝ', category: '韻母', example: '欸' },
  { symbol: 'ㄞ', category: '韻母', example: '愛' },
  { symbol: 'ㄟ', category: '韻母', example: '微' },
  { symbol: 'ㄠ', category: '韻母', example: '凹' },
  { symbol: 'ㄡ', category: '韻母', example: '歐' },
  { symbol: 'ㄢ', category: '韻母', example: '安' },
  { symbol: 'ㄣ', category: '韻母', example: '恩' },
  { symbol: 'ㄤ', category: '韻母', example: '昂' },
  { symbol: 'ㄥ', category: '韻母', example: '嗯' },
  { symbol: 'ㄦ', category: '韻母', example: '兒' },
]

// Standard Taiwan MOE bopomofo symbol names (as taught in 1st grade)
// 聲母: 玻坡摸佛 得特訥勒 哥科喝 基欺希 知蚩詩日 資雌思
// 介母/韻母: vowel sounds mapped to canonical characters
const SYMBOL_READING: Record<string, string> = {
  'ㄅ': '玻', 'ㄆ': '坡', 'ㄇ': '摸', 'ㄈ': '佛',
  'ㄉ': '得', 'ㄊ': '特', 'ㄋ': '訥', 'ㄌ': '勒',
  'ㄍ': '哥', 'ㄎ': '科', 'ㄏ': '喝',
  'ㄐ': '基', 'ㄑ': '欺', 'ㄒ': '希',
  'ㄓ': '知', 'ㄔ': '蚩', 'ㄕ': '詩', 'ㄖ': '日',
  'ㄗ': '資', 'ㄘ': '雌', 'ㄙ': '思',
  'ㄧ': '衣', 'ㄨ': '烏', 'ㄩ': '魚',
  'ㄚ': '啊', 'ㄛ': '喔', 'ㄜ': '鵝', 'ㄝ': '欸',
  'ㄞ': '哀', 'ㄟ': 'ㄟ', 'ㄠ': '凹', 'ㄡ': '歐',
  'ㄢ': '安', 'ㄣ': '恩', 'ㄤ': '昂', 'ㄥ': '嗯', 'ㄦ': '兒',
}

// Azure TTS for symbol pronunciation via /api/tts proxy
let symbolAudio: HTMLAudioElement | null = null

function stopSymbolAudio() {
  if (symbolAudio) { symbolAudio.pause(); symbolAudio.src = ''; symbolAudio = null }
}

async function azureSpeakSymbol(symbol: string): Promise<void> {
  stopSymbolAudio()
  const text = SYMBOL_READING[symbol] ?? symbol
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    await new Promise<void>((resolve) => {
      const audio = new Audio(url)
      symbolAudio = audio
      audio.onended = () => { URL.revokeObjectURL(url); symbolAudio = null; resolve() }
      audio.onerror = () => { URL.revokeObjectURL(url); symbolAudio = null; resolve() }
      audio.play().catch(() => { URL.revokeObjectURL(url); symbolAudio = null; resolve() })
    })
  } catch { /* silently ignore */ }
}

const ROUND_SIZE = 20

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function buildPool(): BopomofoSymbol[] {
  const base = shuffle([...SYMBOLS])
  const pool: BopomofoSymbol[] = []
  while (pool.length < ROUND_SIZE) pool.push(...base)
  return pool.slice(0, ROUND_SIZE)
}

interface HistoryEntry {
  symbol: string
  example: string
  wasCorrect: boolean
  chosenExample: string
}

// ── Quiz state ───────────────────────────────────────────────────────────────
const voiceEnabled = ref(false)
const timedMode = ref(false)

const pool = ref<BopomofoSymbol[]>(buildPool())
const current = ref(0)
const history = ref<HistoryEntry[]>([])
const roundComplete = ref(false)
const hasAnswered = ref(false)
const answerState = ref<'correct' | 'wrong' | null>(null)
const chosenExample = ref('')

const timeLeft = ref(60)
let timerInterval: ReturnType<typeof setInterval> | null = null

const currentSymbol = () => pool.value[current.value]!
const score = () => history.value.filter(h => h.wasCorrect).length

function getChoices(sym: BopomofoSymbol): BopomofoSymbol[] {
  const others = shuffle(SYMBOLS.filter(s => s.symbol !== sym.symbol)).slice(0, 3)
  return shuffle([sym, ...others])
}

const choices = ref<BopomofoSymbol[]>([])
let nextForceSymbol: BopomofoSymbol | null = null

// ── Announcement (播報題目) ───────────────────────────────────────────────────
let announceGen = 0
const speakingIdx = ref<number | null>(null)

function stopAnnouncement() {
  announceGen++
  speakingIdx.value = null
  window.speechSynthesis?.cancel()
  stopSymbolAudio()
}

function speakChoiceAt(idx: number, gen: number) {
  if (gen !== announceGen) return
  if (idx >= choices.value.length) {
    speakingIdx.value = null
    return
  }
  speakingIdx.value = idx
  const utter = new SpeechSynthesisUtterance(choices.value[idx]!.example)
  utter.lang = 'zh-TW'
  utter.rate = 0.8
  utter.onend = () => { if (gen === announceGen) setTimeout(() => speakChoiceAt(idx + 1, gen), 350) }
  utter.onerror = () => { if (gen === announceGen) speakingIdx.value = null }
  window.speechSynthesis.speak(utter)
}

function announceChoices() {
  stopAnnouncement()
  const gen = announceGen
  speakChoiceAt(0, gen)
}

function speakSymbol() {
  stopAnnouncement()
  azureSpeakSymbol(currentSymbol().symbol)
}

// ── Feedback TTS (Web Speech, brief phrases) ────────────────────────────────
function speakFeedback(text: string) {
  window.speechSynthesis?.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'zh-TW'
  utter.rate = 0.9
  window.speechSynthesis.speak(utter)
}

// ── Timer ────────────────────────────────────────────────────────────────────
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

// ── Answer selection ─────────────────────────────────────────────────────────
function selectChoice(c: BopomofoSymbol | null) {
  if (hasAnswered.value) return
  stopAnnouncement()
  stopTimer()
  hasAnswered.value = true
  const correct = c !== null && c.symbol === currentSymbol().symbol
  answerState.value = correct ? 'correct' : 'wrong'
  chosenExample.value = c?.example ?? ''
  history.value.push({
    symbol: currentSymbol().symbol,
    example: currentSymbol().example,
    wasCorrect: correct,
    chosenExample: c?.example ?? '',
  })
  if (!correct && c !== null) {
    nextForceSymbol = c
  } else {
    nextForceSymbol = null
  }
  speakFeedback(correct ? '答對了，你好棒' : '加油喔，再試一次')
}

function nextQuestion() {
  stopAnnouncement()
  hasAnswered.value = false
  answerState.value = null
  chosenExample.value = ''
  const prevSymbol = pool.value[current.value]?.symbol
  current.value++
  if (current.value >= ROUND_SIZE) {
    roundComplete.value = true
    return
  }
  if (nextForceSymbol !== null) {
    pool.value[current.value] = nextForceSymbol
    nextForceSymbol = null
  } else if (pool.value[current.value]?.symbol === prevSymbol) {
    const altIdx = pool.value.findIndex((s, i) => i > current.value && s.symbol !== prevSymbol)
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
  nextForceSymbol = null
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

// init
choices.value = getChoices(pool.value[0]!)

onBeforeUnmount(() => {
  stopAnnouncement()
  stopTimer()
  stopSymbolAudio()
})
</script>

<template>
  <main class="mx-auto max-w-xl px-4 pb-16 pt-6">
    <h1 class="mb-4 text-center text-2xl font-bold text-zinc-800 dark:text-zinc-100">
      注音符號測驗
    </h1>

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
          <span class="font-bold">{{ h.symbol }}</span>
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
      <!-- Symbol card -->
      <button
        @click="speakSymbol"
        class="mb-3 w-full rounded-2xl border border-stone-200 bg-white/90 p-6 text-center shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/80 dark:hover:border-emerald-500"
      >
        <div class="mb-1 select-none text-[6rem] font-bold leading-none text-zinc-800 dark:text-zinc-100">
          {{ currentSymbol().symbol }}
        </div>
        <div class="text-sm text-zinc-400 dark:text-zinc-500">{{ currentSymbol().category }}</div>
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
        <span v-if="answerState === 'correct'">✓ 答對了！正確答案是「{{ currentSymbol().example }}」</span>
        <span v-else>✗ 再加油！正確答案是「{{ currentSymbol().example }}」</span>
      </div>

      <!-- Choices -->
      <div class="mb-4 grid grid-cols-2 gap-3">
        <button
          v-for="(c, i) in choices"
          :key="c.symbol"
          :disabled="hasAnswered"
          @click="selectChoice(c)"
          :class="[
            'rounded-xl border py-5 text-4xl font-bold transition',
            speakingIdx === i && !hasAnswered
              ? 'animate-pulse border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-300'
              : hasAnswered && c.symbol === currentSymbol().symbol
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
