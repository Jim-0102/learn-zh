<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useSpeechAvailability } from '@/composables/useSpeechAvailability'
import { getPreferredZhTwFemaleVoice, getVoicesAsync } from '@/utils/speechVoice'

type SituationLevel = 1 | 2 | 3
interface SituationQuestion {
  id: string
  level: SituationLevel
  image: string
  prompt: string
  dialogue?: string
  options: string[]
  answer: string
}

const levels = [
  { value: 1 as const, label: '等級一', description: '看圖片，選出最合適的答案。' },
  { value: 2 as const, label: '等級二', description: '看圖片與對話，選出最合適的答案。' },
  { value: 3 as const, label: '等級三', description: '看四格漫畫，選出最合適的答案。' },
]

const defaultQuestions: SituationQuestion[] = [
  {
    id: '1-1',
    level: 1,
    image: '/images/situations/level1-1.svg',
    prompt: '這個孩子看起來最可能有哪種情緒？',
    options: ['男孩很開心。', '男孩很傷心。', '女孩在生氣。', '女孩很擔心。'],
    answer: '男孩很開心。',
  },
  {
    id: '1-2',
    level: 1,
    image: '/images/situations/level1-2.svg',
    prompt: '這個情境最可能描述什麼感覺？',
    options: ['她很驚訝。', '他很生氣。', '她很無聊。', '他很緊張。'],
    answer: '她很驚訝。',
  },
  {
    id: '2-1',
    level: 2,
    image: '/images/situations/level2-1.svg',
    dialogue: '「你今天還好嗎？」「我沒事，謝謝你。」',
    prompt: '根據對話，這位孩子最可能的心情是什麼？',
    options: ['他很開心。', '他很緊張。', '他很難過。', '他很生氣。'],
    answer: '他很開心。',
  },
  {
    id: '2-2',
    level: 2,
    image: '/images/situations/level2-2.svg',
    dialogue: '「你為什麼哭了？」「我被老師罵了。」',
    prompt: '這段對話最可能對應哪種情緒？',
    options: ['他很緊張。', '他很難過。', '她很興奮。', '她很驚訝。'],
    answer: '他很難過。',
  },
  {
    id: '3-1',
    level: 3,
    image: '/images/situations/level3-1.svg',
    prompt: '這個四格漫畫最可能在描述什麼情境？',
    options: ['男孩選擇玩積木。', '女孩在騎腳踏車。', '男孩搶走了女孩的洋娃娃。', '男孩在哭泣。'],
    answer: '男孩搶走了女孩的洋娃娃。',
  },
]

const questions = ref<SituationQuestion[]>(defaultQuestions)

onMounted(async () => {
  azureFallbackActive.value = checkAzureFallback()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  srSupported.value = !!((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
  try {
    const res = await fetch('/api/situations/questions')
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      questions.value = data
    }
  } catch {
    // keep defaultQuestions
  }
})

const selectedLevel = ref<SituationLevel>(1)
const currentQuestionIndex = ref(0)
const selectedOption = ref<string | null>(null)
const answerState = ref<'idle' | 'correct' | 'wrong'>('idle')
const completed = ref(false)
const score = ref(0)
const speakingText = ref('')
const speakingOptionIndex = ref<number | null>(null)
let speakOptionsSessionId = 0
const { voicePlaybackAvailable, voicePlaybackBlocked } = useSpeechAvailability()

const voiceInput = ref(false)
const listening = ref(false)
const srSupported = ref(false)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any
let recognition: SR = null

function stopListening() {
  if (recognition) { recognition.abort(); recognition = null }
  listening.value = false
}

function startListening() {
  if (hasAnswered.value || !currentQuestion.value) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SRClass = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
  if (!SRClass) return
  stopListening()
  recognition = new SRClass()
  recognition.lang = 'zh-TW'
  recognition.interimResults = false
  recognition.maxAlternatives = 5
  recognition.onstart = () => { listening.value = true }
  recognition.onresult = (event: SR) => {
    listening.value = false
    const options = currentQuestion.value?.options ?? []
    for (let i = 0; i < event.results[0].length; i++) {
      const spoken: string = event.results[0][i].transcript.trim()
      const match = options.find(o => o.includes(spoken) || spoken.includes(o))
      if (match) { selectOption(match); return }
    }
  }
  recognition.onerror = () => { listening.value = false }
  recognition.onend = () => { listening.value = false }
  recognition.start()
}

const AZURE_FALLBACK_KEY = 'azure_tts_fallback_until'
const azureFallbackActive = ref(false)
let currentAzureAudio: HTMLAudioElement | null = null
let currentAzureAudioUrl = ''

function checkAzureFallback(): boolean {
  const until = parseInt(localStorage.getItem(AZURE_FALLBACK_KEY) ?? '0') || 0
  return Date.now() < until
}
function setAzureFallback() {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  localStorage.setItem(AZURE_FALLBACK_KEY, nextMonth.getTime().toString())
  azureFallbackActive.value = true
}
function stopAzureAudio() {
  if (currentAzureAudio) { currentAzureAudio.pause(); currentAzureAudio.src = ''; currentAzureAudio = null }
  if (currentAzureAudioUrl) { URL.revokeObjectURL(currentAzureAudioUrl); currentAzureAudioUrl = '' }
}

const showFireworks = ref(false)
const fireworksCanvas = ref<HTMLCanvasElement | null>(null)

function launchFireworks() {
  showFireworks.value = true
  nextTick(() => {
    const canvas = fireworksCanvas.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    interface Particle { x: number; y: number; vx: number; vy: number; alpha: number; color: string; r: number }
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8', '#f06595', '#74c0fc']
    const particles: Particle[] = []
    const bursts = [
      { x: canvas.width * 0.25, y: canvas.height * 0.28 },
      { x: canvas.width * 0.75, y: canvas.height * 0.22 },
      { x: canvas.width * 0.5,  y: canvas.height * 0.18 },
    ]
    for (const b of bursts) {
      for (let i = 0; i < 55; i++) {
        const angle = (i / 55) * Math.PI * 2
        const speed = 3 + Math.random() * 5
        particles.push({ x: b.x, y: b.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, alpha: 1, color: colors[Math.floor(Math.random() * colors.length)]!, r: 3 + Math.random() * 3 })
      }
    }

    const cx: CanvasRenderingContext2D = ctx
    const W = canvas.width
    const H = canvas.height
    let frame = 0
    const maxFrames = 85
    function animate() {
      if (frame >= maxFrames) { showFireworks.value = false; return }
      cx.clearRect(0, 0, W, H)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.alpha -= 1 / maxFrames
        cx.globalAlpha = Math.max(0, p.alpha)
        cx.fillStyle = p.color
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI * 2); cx.fill()
      }
      cx.globalAlpha = 1
      frame++
      requestAnimationFrame(animate)
    }
    animate()
  })
}

const currentPool = computed(() => questions.value.filter((item) => item.level === selectedLevel.value))
const currentQuestion = computed(() => currentPool.value[currentQuestionIndex.value] ?? null)
const questionNumber = computed(() => currentQuestionIndex.value + 1)
const totalQuestions = computed(() => currentPool.value.length)
const hasAnswered = computed(() => answerState.value !== 'idle')

const feedbackMessage = computed(() => {
  if (!currentQuestion.value) return ''
  if (answerState.value === 'correct') return '答對了！'
  if (answerState.value === 'wrong') return `答錯了，正確答案是「${currentQuestion.value.answer}」。`
  return ''
})

const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

async function speakText(text: string) {
  if (!ttsSupported || !text.trim()) return
  stopAzureAudio()
  window.speechSynthesis?.cancel()
  speakingText.value = text

  if (!azureFallbackActive.value) {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (res.status === 429) {
        setAzureFallback()
      } else if (res.ok) {
        const blob = await res.blob()
        currentAzureAudioUrl = URL.createObjectURL(blob)
        currentAzureAudio = new Audio(currentAzureAudioUrl)
        currentAzureAudio.onended = () => { speakingText.value = ''; stopAzureAudio() }
        currentAzureAudio.onerror = () => { speakingText.value = ''; stopAzureAudio() }
        await currentAzureAudio.play()
        return
      } else {
        speakingText.value = ''; return
      }
    } catch {
      speakingText.value = ''; return
    }
  }

  // Web Speech fallback
  if (!voicePlaybackAvailable.value || voicePlaybackBlocked.value) { speakingText.value = ''; return }
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-TW'
  utterance.rate = 0.95
  const voices = await getVoicesAsync()
  const preferred = getPreferredZhTwFemaleVoice(voices)
  if (preferred) { utterance.voice = preferred; utterance.lang = preferred.lang }
  utterance.onend = () => { speakingText.value = '' }
  utterance.onerror = () => { speakingText.value = '' }
  window.speechSynthesis.speak(utterance)
}

async function speakOptionsSequentially() {
  const sessionId = ++speakOptionsSessionId
  stopAzureAudio()
  window.speechSynthesis?.cancel()
  speakingText.value = ''
  speakingOptionIndex.value = null
  if (!ttsSupported || !currentQuestion.value) return
  const options = currentQuestion.value.options

  for (let i = 0; i < options.length; i++) {
    if (sessionId !== speakOptionsSessionId) return
    speakingOptionIndex.value = i

    if (!azureFallbackActive.value) {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: options[i] }),
        })
        if (res.status === 429) {
          setAzureFallback()
          // fall through to Web Speech for this and remaining options
        } else if (res.ok) {
          if (sessionId !== speakOptionsSessionId) return
          const blob = await res.blob()
          const audioUrl = URL.createObjectURL(blob)
          await new Promise<void>((resolve) => {
            const audio = new Audio(audioUrl)
            audio.onended = () => { URL.revokeObjectURL(audioUrl); resolve() }
            audio.onerror = () => { URL.revokeObjectURL(audioUrl); resolve() }
            audio.play().catch(() => { URL.revokeObjectURL(audioUrl); resolve() })
          })
          if (sessionId !== speakOptionsSessionId) return
          await new Promise(resolve => setTimeout(resolve, 300))
          continue
        } else {
          break
        }
      } catch {
        break
      }
    }

    // Web Speech fallback
    if (!voicePlaybackAvailable.value || voicePlaybackBlocked.value) break
    if (sessionId !== speakOptionsSessionId) return
    const voices = await getVoicesAsync()
    const preferred = getPreferredZhTwFemaleVoice(voices)
    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(options[i]!)
      utterance.lang = 'zh-TW'
      utterance.rate = 0.95
      if (preferred) { utterance.voice = preferred; utterance.lang = preferred.lang }
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.speak(utterance)
    })
    if (sessionId !== speakOptionsSessionId) return
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  if (sessionId === speakOptionsSessionId) speakingOptionIndex.value = null
}

function cancelOptionsSpeak() {
  speakOptionsSessionId++
  speakingOptionIndex.value = null
  stopAzureAudio()
  window.speechSynthesis?.cancel()
}

function setLevel(level: SituationLevel) {
  cancelOptionsSpeak()
  selectedLevel.value = level
  currentQuestionIndex.value = 0
  selectedOption.value = null
  answerState.value = 'idle'
  completed.value = false
  score.value = 0
}

function selectOption(option: string) {
  if (!currentQuestion.value || hasAnswered.value) return
  stopListening()
  selectedOption.value = option
  if (option === currentQuestion.value.answer) {
    answerState.value = 'correct'
    score.value += 1
    speakText('答對了，你好棒')
    launchFireworks()
  } else {
    answerState.value = 'wrong'
    speakText('加油喔，再答一次')
  }
}

function nextQuestion() {
  if (!currentQuestion.value) return
  cancelOptionsSpeak()
  if (currentQuestionIndex.value + 1 >= totalQuestions.value) {
    completed.value = true
    return
  }
  currentQuestionIndex.value += 1
  selectedOption.value = null
  answerState.value = 'idle'
}

function restart() {
  cancelOptionsSpeak()
  stopListening()
  currentQuestionIndex.value = 0
  selectedOption.value = null
  answerState.value = 'idle'
  completed.value = false
  score.value = 0
}

onBeforeUnmount(() => { stopListening() })
</script>

<template>
  <canvas
    v-show="showFireworks"
    ref="fireworksCanvas"
    class="pointer-events-none fixed inset-0 z-50"
  />
  <main class="mx-auto max-w-5xl px-4 pb-12 pt-6">
    <section>
      <header class="mb-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 class="text-3xl font-bold text-zinc-900 dark:text-zinc-100">情境識別互動題</h1>
            <p class="mt-3 max-w-3xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
              依據圖片、對話或四格漫畫選出最適合的答案。題庫可透過後台持續擴充，所有瀏覽器皆可同步看到最新題目。
            </p>
          </div>
          <RouterLink
            to="/situations/editor"
            class="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-stone-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            前往題庫編輯
          </RouterLink>
        </div>
      </header>

      <section class="mb-8 grid gap-3 sm:grid-cols-3">
        <button
          v-for="level in levels"
          :key="level.value"
          type="button"
          class="rounded-2xl border px-4 py-3 text-left transition focus:outline-none"
          :class="{
            'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-200': selectedLevel === level.value,
            'border-stone-200 bg-white text-zinc-800 shadow-sm hover:border-stone-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100': selectedLevel !== level.value,
          }"
          @click="setLevel(level.value)"
        >
          <div class="text-sm font-semibold">{{ level.label }}</div>
          <p class="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{{ level.description }}</p>
        </button>
      </section>

      <section class="mb-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
        <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">目前題庫</p>
            <h2 class="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ levels.find((item) => item.value === selectedLevel)?.label }}</h2>
          </div>
          <div class="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            題目：{{ questionNumber }} / {{ totalQuestions }}<br />
            分數：{{ score }}
          </div>
        </div>

        <div v-if="currentQuestion" class="space-y-6">
          <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div class="space-y-4">
              <p class="text-base leading-7 text-zinc-700 dark:text-zinc-200">{{ currentQuestion.prompt }}</p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 shadow-sm transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  :disabled="!ttsSupported || (azureFallbackActive && voicePlaybackBlocked)"
                  @click="speakText(currentQuestion.prompt + (currentQuestion.dialogue ? ' ' + currentQuestion.dialogue : ''))"
                >
                  {{ speakingText === currentQuestion.prompt ? '朗讀中…' : '朗讀題目' }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 shadow-sm transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  :disabled="!ttsSupported || (azureFallbackActive && voicePlaybackBlocked)"
                  @click="speakingOptionIndex !== null ? cancelOptionsSpeak() : speakOptionsSequentially()"
                >
                  {{ speakingOptionIndex !== null ? '停止朗讀' : '朗讀選項' }}
                </button>
                <button
                  v-if="voiceInput && srSupported"
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border border-violet-300 bg-white px-4 py-2 text-sm text-violet-800 shadow-sm transition hover:border-violet-400 dark:border-violet-700 dark:bg-zinc-900 dark:text-violet-300"
                  :disabled="listening || hasAnswered"
                  @click="startListening"
                >
                  {{ listening ? '🎙️ 聆聽中…' : '🎤 說答案' }}
                </button>
              </div>
              <label class="mt-1 inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <input type="checkbox" v-model="voiceInput" class="accent-violet-500" />
                🎤 語音輸入
              </label>
              <p v-if="voiceInput" class="text-xs text-zinc-400 dark:text-zinc-500">建議使用 Chrome / Edge 瀏覽器</p>
              <div v-if="currentQuestion.dialogue" class="rounded-3xl border border-stone-200 bg-stone-50 p-4 text-sm leading-7 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                <p class="font-semibold text-zinc-900 dark:text-zinc-100">對話</p>
                <p class="mt-2 whitespace-pre-line">{{ currentQuestion.dialogue }}</p>
              </div>
            </div>

            <div class="overflow-hidden rounded-3xl border border-stone-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900">
              <img
                :src="currentQuestion.image"
                :alt="currentQuestion.prompt"
                class="h-full min-h-[260px] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <button
              v-for="(option, idx) in currentQuestion.options"
              :key="option"
              type="button"
              class="rounded-2xl border px-4 py-4 text-left text-base transition focus:outline-none"
              :class="{
                'border-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-200': selectedOption === option && answerState === 'correct',
                'border-rose-500 bg-rose-50 text-rose-950 dark:border-rose-400 dark:bg-rose-950/50 dark:text-rose-200': selectedOption === option && answerState === 'wrong',
                'border-stone-200 bg-white text-zinc-800 hover:border-stone-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600': selectedOption !== option || answerState === 'idle',
                'animate-pulse border-amber-400 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/40': speakingOptionIndex === idx && answerState === 'idle',
              }"
              :disabled="hasAnswered"
              @click="selectOption(option)"
            >
              {{ option }}
            </button>
          </div>

          <div v-if="hasAnswered" class="rounded-3xl border border-stone-200 bg-stone-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-950">
            <p class="font-semibold text-zinc-900 dark:text-zinc-100">結果</p>
            <p class="mt-2 text-zinc-700 dark:text-zinc-200">{{ feedbackMessage }}</p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              class="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!hasAnswered"
              @click="nextQuestion"
            >
              {{ completed ? '已完成！再玩一次' : currentQuestionIndex + 1 >= totalQuestions ? '完成測驗' : '下一題' }}
            </button>
            <button
              type="button"
              class="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:border-stone-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              @click="restart"
            >
              重新開始
            </button>
          </div>
        </div>

        <div v-else class="rounded-3xl border border-stone-200 bg-stone-50 p-6 text-center text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
          目前這個等級尚無題目。請在題庫中新增題目後再試一次。
        </div>
      </section>

    </section>
  </main>
</template>
