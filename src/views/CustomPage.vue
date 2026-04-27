<template>
	<div class="min-h-dvh bg-gradient-to-br from-stone-100 via-amber-50/40 to-stone-200 px-4 py-6 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
		<div class="mx-auto max-w-3xl">
			<h1 class="mb-4 text-3xl font-bold text-amber-950 dark:text-amber-100">
				自訂朗讀
			</h1>

			<section
				class="mb-4 rounded-lg border border-stone-200 bg-white/90 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90"
			>
				<div class="mb-2 text-xl font-bold text-stone-800 dark:text-stone-100">
					1) 輸入長篇文字
				</div>
				<p class="mb-3 leading-relaxed text-stone-600 dark:text-zinc-300">
					使用說明：將想朗讀的內容貼到下方，可輸入多段文字。系統會保留換行，朗讀時依目前內容播放。
				</p>
				<textarea
					v-model="rawText"
					class="box-border w-full resize-y rounded border border-stone-300 bg-white p-2 font-inherit text-base text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
					placeholder="請輸入要朗讀的內容..."
					rows="4"
				/>
			</section>

			<section
				class="mb-4 rounded-lg border border-stone-200 bg-white/90 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90"
			>
				<div class="mb-2 text-xl font-bold text-stone-800 dark:text-stone-100">
					2) 按鍵朗讀（台灣口音優先）
				</div>
				<p class="mb-3 leading-relaxed text-stone-600 dark:text-zinc-300">
					使用說明：按「開始朗讀」播放，按「停止朗讀」可立即停止。語音會優先使用 zh-TW 與台灣相關語音。
				</p>
				<div class="flex flex-wrap items-center gap-3">
					<button
						type="button"
						class="rounded border-0 px-4 py-2 text-base font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
						:class="isSpeaking ? 'bg-red-500' : 'bg-emerald-500'"
						:disabled="voicePlaybackBlocked"
						@click="toggleSpeech"
					>
						{{ isSpeaking ? '停止朗讀' : '開始朗讀' }}
					</button>
					<span class="text-sm text-stone-600 dark:text-zinc-400">{{ statusText }}</span>
				</div>
			</section>

			<section
				class="mb-4 rounded-lg border border-stone-200 bg-white/90 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90"
			>
				<div class="mb-2 text-xl font-bold text-stone-800 dark:text-stone-100">
					3) 請念一遍上面的文字
				</div>
				<p class="mb-1 leading-relaxed text-stone-600 dark:text-zinc-300">
					按「開始錄音」後，對麥克風念出上方文字，結束後按「停止錄音」。
				</p>
				<p class="mb-3 text-xs text-zinc-400 dark:text-zinc-500">建議使用 Chrome / Edge 瀏覽器</p>
				<div class="mb-3 flex flex-wrap items-center gap-3">
					<button
						v-if="srSupported"
						type="button"
						class="rounded border-0 px-4 py-2 text-base font-medium text-white transition hover:opacity-90"
						:class="listening ? 'bg-red-500' : 'bg-violet-500'"
						@click="toggleListening"
					>
						{{ listening ? '⏹ 停止錄音' : '🎤 開始錄音' }}
					</button>
					<span v-if="!srSupported" class="text-sm text-zinc-500 dark:text-zinc-400">
						此瀏覽器不支援語音輸入，請改用 Chrome 或 Edge。
					</span>
					<span v-if="listening" class="animate-pulse text-sm font-medium text-red-500">🔴 聆聽中…</span>
				</div>
				<textarea
					v-model="spokenText"
					class="box-border w-full resize-y rounded border border-stone-300 bg-white p-2 font-inherit text-base text-zinc-900 outline-none ring-violet-500/30 focus:border-violet-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
					placeholder="語音辨識結果會顯示在這裡…"
					rows="4"
				/>
			</section>

			<section
				class="mb-4 rounded-lg border border-stone-200 bg-white/90 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90"
			>
				<div class="mb-2 text-xl font-bold text-stone-800 dark:text-stone-100">
					4) 兩個答案有沒有差別呢
				</div>
				<div v-if="!spokenText.trim()" class="text-stone-400 dark:text-zinc-500">
					請先完成第 3) 步驟的語音輸入。
				</div>
				<template v-else>
					<div class="mb-3 flex items-center gap-4">
						<span
							class="text-4xl font-bold tabular-nums"
							:class="similarityColor"
						>{{ similarityPct }}%</span>
						<span class="text-base text-stone-600 dark:text-zinc-300">{{ similarityLabel }}</span>
					</div>
					<div class="h-3 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-700">
						<div
							class="h-full rounded-full transition-all duration-500"
							:class="similarityBarColor"
							:style="{ width: similarityPct + '%' }"
						/>
					</div>
					<p class="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
						比對方式：去除空白與標點後，以字元編輯距離計算相似度。
					</p>
				</template>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useSpeechAvailability } from '@/composables/useSpeechAvailability'
import { ZH_TW_PREFERRED_KEYWORDS, getPreferredVoice, getVoicesAsync } from '@/utils/speechVoice'

const rawText = ref(`人之初，性本善，性相近，習相遠。
苟不教，性乃遷，教之道，貴以專。`)

const isSpeaking = ref(false)
const { voicePlaybackAvailable, voicePlaybackBlocked } = useSpeechAvailability()

// ── Speech recognition ──────────────────────────────────────────────────────

const spokenText = ref('')
const listening = ref(false)
const srSupported = ref(false)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any
let recognition: SR = null

function stopListening() {
	if (recognition) { recognition.stop(); recognition = null }
	listening.value = false
}

function toggleListening() {
	if (listening.value) { stopListening(); return }
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const SRClass = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
	if (!SRClass) return
	window.speechSynthesis?.cancel()
	spokenText.value = ''
	recognition = new SRClass()
	recognition.lang = 'zh-TW'
	recognition.continuous = true
	recognition.interimResults = false
	recognition.maxAlternatives = 1
	recognition.onstart = () => { listening.value = true }
	recognition.onresult = (event: SR) => {
		let text = ''
		for (let i = 0; i < event.results.length; i++) {
			if (event.results[i].isFinal) text += event.results[i][0].transcript
		}
		spokenText.value = text
	}
	recognition.onerror = () => { listening.value = false }
	recognition.onend = () => { listening.value = false }
	recognition.start()
}

// ── Similarity ───────────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
	const m = a.length, n = b.length
	let prev = Array.from({ length: n + 1 }, (_, i) => i)
	for (let i = 1; i <= m; i++) {
		const curr: number[] = [i]
		for (let j = 1; j <= n; j++) {
			curr[j] = a[i - 1] === b[j - 1]
				? prev[j - 1]!
				: 1 + Math.min(prev[j]!, curr[j - 1]!, prev[j - 1]!)
		}
		prev = curr
	}
	return prev[n]!
}

const similarityPct = computed(() => {
	const normalize = (s: string) => s.replace(/[\s　\p{P}]/gu, '')
	const a = normalize(rawText.value)
	const b = normalize(spokenText.value)
	if (!a && !b) return 100
	if (!a || !b) return 0
	const maxLen = Math.max(a.length, b.length)
	return Math.round(Math.max(0, (1 - levenshtein(a, b) / maxLen) * 100))
})

const similarityColor = computed(() => {
	const p = similarityPct.value
	if (p >= 90) return 'text-emerald-600 dark:text-emerald-400'
	if (p >= 70) return 'text-amber-600 dark:text-amber-400'
	return 'text-red-600 dark:text-red-400'
})

const similarityBarColor = computed(() => {
	const p = similarityPct.value
	if (p >= 90) return 'bg-emerald-500'
	if (p >= 70) return 'bg-amber-500'
	return 'bg-red-500'
})

const similarityLabel = computed(() => {
	const p = similarityPct.value
	if (p === 100) return '🎉 完全一樣！'
	if (p >= 90) return '👍 非常接近'
	if (p >= 70) return '😊 不錯，繼續練習'
	if (p >= 50) return '🤔 有些差異'
	return '😅 差異較多，再試一次'
})

// ── TTS ──────────────────────────────────────────────────────────────────────

const statusText = computed(() => isSpeaking.value ? '朗讀中...' : '待命中')

const createUtterance = async () => {
	const voices = await getVoicesAsync()
	const utterance = new SpeechSynthesisUtterance(rawText.value)
	utterance.lang = 'zh-TW'
	utterance.rate = 0.9
	const preferredVoice = getPreferredVoice('zh-TW', ZH_TW_PREFERRED_KEYWORDS, voices)
	if (preferredVoice) { utterance.voice = preferredVoice; utterance.lang = preferredVoice.lang }
	utterance.onend = () => { isSpeaking.value = false }
	utterance.onerror = () => { isSpeaking.value = false }
	return utterance
}

const toggleSpeech = async () => {
	if (!voicePlaybackAvailable.value || typeof window === 'undefined' || !window.speechSynthesis) return
	if (isSpeaking.value) { window.speechSynthesis.cancel(); isSpeaking.value = false; return }
	if (!rawText.value.trim()) return
	window.speechSynthesis.cancel()
	window.speechSynthesis.speak(await createUtterance())
	isSpeaking.value = true
}

onMounted(() => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	srSupported.value = !!((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
	const preset = new URLSearchParams(window.location.search).get('text')
	if (preset) rawText.value = preset
})

onBeforeUnmount(() => {
	if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
	stopListening()
})
</script>
