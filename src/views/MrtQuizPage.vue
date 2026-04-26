<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useSpeechAvailability } from '@/composables/useSpeechAvailability'
import { getPreferredZhTwFemaleVoice, getVoicesAsync } from '../utils/speechVoice'

interface Station {
	name: string
	line: string
}

const STORAGE_STATIONS = 'mrt-quiz-custom-stations'
const STORAGE_USE_CUSTOM = 'mrt-quiz-use-custom'

const DEFAULT_STATIONS: Station[] = [
	// 板南線
	...['頂埔','永寧','土城','海山','亞東醫院','府中','板橋','新埔','江子翠',
		'龍山寺','西門','台北車站','善導寺','忠孝新生','忠孝復興','忠孝敦化',
		'國父紀念館','市政府','永春','後山埤','昆陽','南港','南港展覽館']
		.map(name => ({ name, line: '板南線' })),
	// 淡水信義線
	...['淡水','紅樹林','竹圍','關渡','忠義','復興崗','北投','奇岩','唭哩岸',
		'石牌','明德','芝山','士林','劍潭','圓山','民權西路','中山',
		'台大醫院','中正紀念堂','東門','大安森林公園','大安','信義安和',
		'台北101/世貿','象山']
		.map(name => ({ name, line: '淡水信義線' })),
	// 環狀線
	...[
		'大坪林',
		'十四張',
		'秀朗橋',
		'景平',
		'景安',
		'中和',
		'橋和',
		'中原',
		'板新',
		'新埔民生',
		'頭前庄',
		'幸福',
		'新北產業園區',
	].map(name => ({ name, line: '環狀線' })),
	// 文湖線
	...[
		'動物園','木柵','萬芳社區','萬芳醫院','辛亥','麟光','六張犁','科技大樓',
		'大安','忠孝復興','南京復興','中山國中','松山機場','大直','劍南路',
		'西湖','港墘','文德','內湖','大湖公園','葫洲','東湖','南港軟體園區','南港展覽館',
	].map(name => ({ name, line: '文湖線' })),
	// 松山新店線
	...[
		'新店','新店區公所','七張','小碧潭','大坪林','景美','萬隆','公館',
		'台電大樓','古亭','中正紀念堂','小南門','北門','中山','松江南京',
		'南京復興','台北小巨蛋','南京三民','松山','南港',
	].map(name => ({ name, line: '松山新店線' })),
	// 中和新蘆線
	...[
		'南勢角','景安','永安市場','頂溪','古亭','東門','忠孝新生','松江南京',
		'行天宮','中山國小','民權西路','大橋頭','台北橋',
		'菜寮','三重','先嗇宮','頭前庄','新莊','輔大','丹鳳','迴龍',
		'三重國小','三和國中','徐匯中學','三民高中','蘆洲',
	].map(name => ({ name, line: '中和新蘆線' })),
	// 貓空纜車
	...[
		'動物園','動物園南','指南宮','貓空',
	].map(name => ({ name, line: '貓空纜車' })),
]

function loadActivePool(): Station[] {
	try {
		const useCustom = localStorage.getItem(STORAGE_USE_CUSTOM) === 'true'
		if (!useCustom) return DEFAULT_STATIONS
		const raw = localStorage.getItem(STORAGE_STATIONS)
		const custom: Station[] = raw ? JSON.parse(raw) : []
		return custom.length >= 2 ? custom : DEFAULT_STATIONS
	} catch {
		return DEFAULT_STATIONS
	}
}

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr]
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[a[i], a[j]] = [a[j]!, a[i]!]
	}
	return a
}

let activePool = DEFAULT_STATIONS

function newQuestion() {
	const idx = Math.floor(Math.random() * activePool.length)
	const correct = activePool[idx]!
	const others = shuffle(activePool.filter((_, i) => i !== idx)).slice(0, 3)
	const choices = shuffle([correct, ...others])
	return { correct, choices }
}

const question = ref(newQuestion())
const selected = ref<Station | null>(null)
const score = ref(0)
const streak = ref(0)
const showReward = ref(false)
const totalAnswered = ref(0)
const { voicePlaybackAvailable, voicePlaybackBlocked } = useSpeechAvailability()

const voiceEnabled = ref(true)
const timedMode = ref(false)
const timeLeft = ref(60)
const timeUp = ref(false)
let timerId: ReturnType<typeof window.setInterval> | null = null

function stopTimer() {
	if (timerId !== null) { window.clearInterval(timerId); timerId = null }
}

function startTimer() {
	stopTimer()
	timeLeft.value = 60
	timeUp.value = false
	timerId = window.setInterval(() => {
		timeLeft.value--
		if (timeLeft.value <= 0) {
			stopTimer()
			timeUp.value = true
		}
	}, 1000)
}

async function speak() {
	if (!voicePlaybackAvailable.value || typeof window === 'undefined' || !window.speechSynthesis) return
	const voices = await getVoicesAsync()
	const utterance = new SpeechSynthesisUtterance(question.value.correct.name)
	utterance.lang = 'zh-TW'
	utterance.rate = 0.85
	const voice = getPreferredZhTwFemaleVoice(voices)
	if (voice) {
		utterance.voice = voice
		utterance.lang = voice.lang
	}
	window.speechSynthesis.cancel()
	window.speechSynthesis.speak(utterance)
}

function choose(station: Station) {
	if (selected.value !== null || timeUp.value) return
	selected.value = station
	totalAnswered.value++
	if (station.name === question.value.correct.name) {
		score.value++
		streak.value++
		if (streak.value > 0 && streak.value % 5 === 0) {
			showReward.value = true
		}
	} else {
		streak.value = 0
	}
}

function next() {
	question.value = newQuestion()
	selected.value = null
	if (voiceEnabled.value) nextTick(() => speak())
}

function dismissReward() {
	showReward.value = false
	next()
}

function resetGame() {
	timeUp.value = false
	score.value = 0
	streak.value = 0
	totalAnswered.value = 0
	selected.value = null
	question.value = newQuestion()
	if (timedMode.value) startTimer()
	else if (voiceEnabled.value) nextTick(() => speak())
}

watch(timedMode, (on) => {
	if (on) startTimer()
	else { stopTimer(); timeLeft.value = 60; timeUp.value = false }
})

onMounted(() => {
	activePool = loadActivePool()
	question.value = newQuestion()
	if (voiceEnabled.value) nextTick(() => speak())
})

onBeforeUnmount(() => {
	stopTimer()
})
</script>

<template>
	<div class="mx-auto max-w-md px-5 pb-16 pt-8 text-center">
		<h1 class="mb-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
			🚇 捷運站名測驗
		</h1>
		<p class="mb-3 text-base text-zinc-600 opacity-80 dark:text-zinc-400">
			聽語音，選出正確的站名！
		</p>
		<RouterLink
			to="/mrt-quiz/editor"
			class="mb-4 inline-block text-xs text-zinc-400 underline-offset-2 transition hover:text-emerald-600 hover:underline dark:text-zinc-500 dark:hover:text-emerald-400"
		>
			⚙ 自訂題目
		</RouterLink>

		<div class="mb-5 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
			<label class="flex cursor-pointer items-center gap-1.5">
				<input type="checkbox" v-model="voiceEnabled" class="accent-emerald-500" />
				🔊 語音播放
			</label>
			<label class="flex cursor-pointer items-center gap-1.5">
				<input type="checkbox" v-model="timedMode" class="accent-emerald-500" />
				⏱ 一分鐘答題
			</label>
		</div>

		<div
			v-if="showReward"
			class="fixed inset-0 z-[100] flex items-center justify-center bg-black/55"
			@click="dismissReward"
		>
			<div
				class="w-[90%] max-w-sm rounded-3xl bg-white p-10 text-center dark:bg-zinc-900"
				@click.stop
			>
				<div class="mb-3 text-6xl">🎉</div>
				<h2 class="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
					連續答對 {{ streak }} 題！
				</h2>
				<p class="mb-6 text-zinc-600 dark:text-zinc-300">太棒了，繼續加油！</p>
				<button
					type="button"
					class="cursor-pointer rounded-xl border-0 bg-emerald-500 px-7 py-2.5 text-base font-semibold text-white transition hover:opacity-90"
					@click.stop="dismissReward"
				>
					繼續挑戰
				</button>
			</div>
		</div>

		<div
			v-if="timeUp"
			class="fixed inset-0 z-[100] flex items-center justify-center bg-black/55"
		>
			<div
				class="w-[90%] max-w-sm rounded-3xl bg-white p-10 text-center dark:bg-zinc-900"
			>
				<div class="mb-3 text-6xl">⏰</div>
				<h2 class="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">時間到！</h2>
				<p class="mb-1 text-zinc-600 dark:text-zinc-300">本輪答對 <strong>{{ score }}</strong> 題</p>
				<p class="mb-6 text-zinc-600 dark:text-zinc-300">共作答 <strong>{{ totalAnswered }}</strong> 題</p>
				<button
					type="button"
					class="cursor-pointer rounded-xl border-0 bg-emerald-500 px-7 py-2.5 text-base font-semibold text-white transition hover:opacity-90"
					@click="resetGame"
				>
					再玩一次
				</button>
			</div>
		</div>

		<div class="mb-8 flex flex-wrap justify-center gap-6 text-sm text-zinc-700 dark:text-zinc-300">
			<span>得分：<strong>{{ score }}</strong></span>
			<span>連續答對：<strong>{{ streak }}</strong></span>
			<span>作答：<strong>{{ totalAnswered }}</strong> 題</span>
			<Transition name="fade">
				<span v-if="timedMode" :class="timeLeft <= 10 ? 'animate-pulse font-bold text-red-500' : ''">
					⏱ <strong>{{ timeLeft }}</strong> 秒
				</span>
			</Transition>
		</div>

		<div
			class="rounded-2xl border border-stone-200 bg-white/80 px-6 py-8 dark:border-zinc-700 dark:bg-zinc-900/80"
		>
			<button
				type="button"
				class="mb-5 rounded-lg border border-stone-300 bg-transparent px-4 py-1.5 text-base text-zinc-800 transition hover:border-emerald-500/80 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-600 dark:text-zinc-200"
				:disabled="voicePlaybackBlocked"
				@click="speak"
			>
				🔊 播報題目
			</button>
			<p class="mb-5 text-base text-zinc-700 dark:text-zinc-300">
				你聽到的是哪一個捷運站？
			</p>

			<div class="flex flex-col gap-3">
				<button
					v-for="station in question.choices"
					:key="station.name"
					type="button"
					class="flex cursor-pointer items-center justify-between rounded-xl border-2 border-stone-200 bg-stone-50 px-4 py-3.5 text-left text-zinc-800 transition hover:border-emerald-500/70 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
					:class="{
						'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100':
							selected !== null && station.name === question.correct.name,
						'border-red-500 bg-red-50 text-red-900 dark:border-red-500 dark:bg-red-950/40 dark:text-red-100':
							selected?.name === station.name && station.name !== question.correct.name,
						'cursor-default opacity-45':
							selected !== null &&
							station.name !== question.correct.name &&
							selected?.name !== station.name,
					}"
					@click="choose(station)"
				>
					<span class="text-lg font-semibold">{{ station.name }}</span>
					<span
						class="text-xs opacity-55"
						:class="{
							'opacity-70':
								selected !== null && station.name === question.correct.name,
						}"
					>
						{{ station.line }}
					</span>
				</button>
			</div>

			<div v-if="selected !== null" class="mt-6 flex flex-col items-center gap-4">
				<span
					v-if="selected.name === question.correct.name"
					class="text-lg font-semibold text-emerald-600 dark:text-emerald-400"
				>
					✅ 答對了！
				</span>
				<span v-else class="text-base font-semibold text-red-600 dark:text-red-400">
					❌ 答錯了，是「{{ question.correct.name }}」
				</span>
				<button
					type="button"
					class="cursor-pointer rounded-xl border-0 bg-emerald-500 px-7 py-2.5 text-base font-semibold text-white transition hover:opacity-90"
					@click="next"
				>
					下一題 →
				</button>
			</div>
		</div>
	</div>
</template>
