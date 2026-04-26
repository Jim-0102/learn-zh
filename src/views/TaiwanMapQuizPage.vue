<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useSpeechAvailability } from '@/composables/useSpeechAvailability'
import { getPreferredZhTwFemaleVoice, getVoicesAsync } from '../utils/speechVoice'

interface Region {
	id: string
	name: string
}

const REGIONS: Region[] = [
	{ id: 'taipei-city', name: '台北市' },
	{ id: 'new-taipei-city', name: '新北市' },
	{ id: 'taoyuan-city', name: '桃園市' },
	{ id: 'taichung-city', name: '台中市' },
	{ id: 'tainan-city', name: '台南市' },
	{ id: 'kaohsiung-city', name: '高雄市' },
	{ id: 'keelung-city', name: '基隆市' },
	{ id: 'hsinchu-city', name: '新竹市' },
	{ id: 'chiayi-city', name: '嘉義市' },
	{ id: 'yilan-county', name: '宜蘭縣' },
	{ id: 'hsinchu-county', name: '新竹縣' },
	{ id: 'miaoli-county', name: '苗栗縣' },
	{ id: 'changhua-county', name: '彰化縣' },
	{ id: 'nantou-county', name: '南投縣' },
	{ id: 'yunlin-county', name: '雲林縣' },
	{ id: 'chiayi-county', name: '嘉義縣' },
	{ id: 'pingtung-county', name: '屏東縣' },
	{ id: 'hualien-county', name: '花蓮縣' },
	{ id: 'taitung-county', name: '台東縣' },
	{ id: 'penghu-county', name: '澎湖縣' },
	{ id: 'kinmen-county', name: '金門縣' },
	{ id: 'lienchiang-county', name: '連江縣' },
]

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr]
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[a[i], a[j]] = [a[j]!, a[i]!]
	}
	return a
}

function newQuestion() {
	const idx = Math.floor(Math.random() * REGIONS.length)
	const correct = REGIONS[idx]!
	const others = shuffle(REGIONS.filter((_, i) => i !== idx)).slice(0, 3)
	const choices = shuffle([correct, ...others])
	return { correct, choices }
}

const question = ref(newQuestion())
const selected = ref<Region | null>(null)
const score = ref(0)
const streak = ref(0)
const totalAnswered = ref(0)
const showReward = ref(false)
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
		if (timeLeft.value <= 0) { stopTimer(); timeUp.value = true }
	}, 1000)
}

async function speakText(text: string, lang = 'zh-TW') {
	if (!voicePlaybackAvailable.value || typeof window === 'undefined' || !window.speechSynthesis) return
	const utterance = new SpeechSynthesisUtterance(text)
	utterance.lang = lang
	utterance.rate = 0.85
	if (lang === 'zh-TW') {
		const voices = await getVoicesAsync()
		const voice = getPreferredZhTwFemaleVoice(voices)
		if (voice) { utterance.voice = voice; utterance.lang = voice.lang }
	}
	window.speechSynthesis.cancel()
	window.speechSynthesis.speak(utterance)
}

async function speak() {
	await speakText(question.value.correct.name)
}

function regionFill(id: string): string {
	if (selected.value !== null && id === question.value.correct.id) return '#10b981'
	if (id === question.value.correct.id) return '#7c3aed'
	return '#d1d5db'
}

function choose(region: Region) {
	if (selected.value !== null || timeUp.value) return
	selected.value = region
	totalAnswered.value++
	if (region.id === question.value.correct.id) {
		score.value++
		streak.value++
		speakText('答對了')
		if (streak.value > 0 && streak.value % 5 === 0) showReward.value = true
	} else {
		streak.value = 0
	}
}

function next() {
	question.value = newQuestion()
	selected.value = null
	if (voiceEnabled.value) nextTick(() => speak())
}

function dismissReward() { showReward.value = false; next() }

function resetGame() {
	timeUp.value = false; score.value = 0; streak.value = 0
	totalAnswered.value = 0; selected.value = null
	question.value = newQuestion()
	if (timedMode.value) startTimer()
	else if (voiceEnabled.value) nextTick(() => speak())
}

watch(timedMode, (on) => {
	if (on) startTimer()
	else { stopTimer(); timeLeft.value = 60; timeUp.value = false }
})

onMounted(() => { if (voiceEnabled.value) nextTick(() => speak()) })
onBeforeUnmount(() => stopTimer())
</script>

<template>
	<div class="mx-auto max-w-lg px-4 pb-16 pt-8 text-center">
		<h1 class="mb-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">🗺️ 台灣縣市測驗</h1>
		<p class="mb-5 text-base text-zinc-600 opacity-80 dark:text-zinc-400">紫色的是哪個縣市？</p>

		<div class="mb-4 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
			<label class="flex cursor-pointer items-center gap-1.5">
				<input type="checkbox" v-model="voiceEnabled" class="accent-emerald-500" />
				🔊 語音播放
			</label>
			<label class="flex cursor-pointer items-center gap-1.5">
				<input type="checkbox" v-model="timedMode" class="accent-emerald-500" />
				⏱ 一分鐘答題
			</label>
		</div>

		<div class="mb-6 flex flex-wrap justify-center gap-5 text-sm text-zinc-700 dark:text-zinc-300">
			<span>得分：<strong>{{ score }}</strong></span>
			<span>連續答對：<strong>{{ streak }}</strong></span>
			<span>作答：<strong>{{ totalAnswered }}</strong> 題</span>
			<Transition name="fade">
				<span v-if="timedMode" :class="timeLeft <= 10 ? 'animate-pulse font-bold text-red-500' : ''">
					⏱ <strong>{{ timeLeft }}</strong> 秒
				</span>
			</Transition>
		</div>

		<!-- Reward overlay -->
		<div v-if="showReward" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/55" @click="dismissReward">
			<div class="w-[90%] max-w-sm rounded-3xl bg-white p-10 text-center dark:bg-zinc-900" @click.stop>
				<div class="mb-3 text-6xl">🎉</div>
				<h2 class="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">連續答對 {{ streak }} 題！</h2>
				<p class="mb-6 text-zinc-600 dark:text-zinc-300">太棒了，繼續加油！</p>
				<button type="button" class="cursor-pointer rounded-xl border-0 bg-emerald-500 px-7 py-2.5 text-base font-semibold text-white transition hover:opacity-90" @click.stop="dismissReward">繼續挑戰</button>
			</div>
		</div>

		<!-- Time's up overlay -->
		<div v-if="timeUp" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/55">
			<div class="w-[90%] max-w-sm rounded-3xl bg-white p-10 text-center dark:bg-zinc-900">
				<div class="mb-3 text-6xl">⏰</div>
				<h2 class="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">時間到！</h2>
				<p class="mb-1 text-zinc-600 dark:text-zinc-300">本輪答對 <strong>{{ score }}</strong> 題</p>
				<p class="mb-6 text-zinc-600 dark:text-zinc-300">共作答 <strong>{{ totalAnswered }}</strong> 題</p>
				<button type="button" class="cursor-pointer rounded-xl border-0 bg-emerald-500 px-7 py-2.5 text-base font-semibold text-white transition hover:opacity-90" @click="resetGame">再玩一次</button>
			</div>
		</div>

		<div class="rounded-2xl border border-stone-200 bg-white/80 px-4 py-6 dark:border-zinc-700 dark:bg-zinc-900/80">
			<!-- Taiwan SVG Map -->
			<svg
				viewBox="0 0 1000 1295"
				class="mx-auto mb-4 w-full max-w-xs"
				xmlns="http://www.w3.org/2000/svg"
				aria-label="台灣地圖"
			>
				<path id="changhua-county" :fill="regionFill('changhua-county')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M647.2 689.6l0.1 3.6-4.3 1.6-1.2 2.9 0.5 4-2 4.6-1.6 5.4-0.1 5.7-1.2 6.6-0.9 13.4 2.1 6.3 3.6 3.3 3.9 1.4 5.6 2.9-1 3.5-3.8 1.5-2.5 2.3-2.4 1.6-1 0.7-12-2.4-5.8 0.1-12.2-6-19.7-2.3-11.6-4.4-6.6-1.8-7.6-0.4-22 2.6-7.6-4.4 0.8-1.4 1.6-7.1 1.2-3 7.1-6.8 2-2.8 2.7-7.8 4.2-7.7 5.7-16.1 2.7-4.7 3-3 2.5-1.7 2.2-1.1 1.6-1.4 0.6-3 1.2-2.8 5.1-4 1.2-3 0.6-10.1 0.9-2.8 2.7-2.6 11.3-13.2 5.8 1.9 4 3.5 2.7 6.3 1 7.6 4.5 5.4 11.9 3.5 4.3 3.6 3.2 5 2 4 0.1 4 1.2 3.3 4.3 0.8 5.4 3.5 0 1.4z"/>
				<path id="chiayi-city" :fill="regionFill('chiayi-city')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M573.8 836.5l9.3-1.6 7.8-0.7 5.6 2.1 4.1 2.2 2.5 4 2.5 6.8-3 2.2-4.5 0.6-6.8 2.7-7.3-1.7-7-4.5-6.1-2.4-0.9-5.6 3.8-4.1z"/>
				<path id="chiayi-county" :fill="regionFill('chiayi-county')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M499.6 893.2l-1.8 1.4-0.4-1.1 2.4-3.1 0.9-2.4 1.1-1.5 0.6 0.5 0.1 1.1-1.4 2-1.5 3.1z m2.2-12.6l-0.7-0.7 2-3.8 0.9-0.4-0.5 1.9-1.7 3z m4.9-9l-0.1-4.4 0.5 0.4 0.1 2.9-0.5 1.1z m1.4-9.7l-0.8 1.6-0.5-2 1.3 0.4z m-1.3-6.1l-0.5 1.3-1.3-2.1 1.8 0.8z m-29.8 1l-3.2 1.6 3.8-5.4 13.9-14.1 10.6-13.5 2.5-0.8-9 14.7-4.5 4.5-2.9 3.5-3.8 3.8-3 2.1-4.4 3.6z m189.5-51.1l6.1 0.7 6.8 2.6 4.1 1.2 5.1 2.8-0.3 5.3-3 5.1 1.2 4.8 2.7 6.5 0.4 5.9 1.1 3.8 7.6 1.4 25.6 0.2 0.9 0.2-18.5 9.4-8.5 6.8-3.6 6.8-4.2 5-7.7 4.3-7.9 6.1-4.5 5.4-12.3 7.3-5.8 0.6-6.9-0.7-3.6 3.5-0.1 5 1.4 4.5 1 6.7-8.4-1-3.7-1.1-5 0.6-5.3 2.4-3.8 0-4.5-3.5-1.6-4.6 1.8-14.2-1-7.5-9.9-10.1-1.7-5.1-2.1-4.2-4-2.4-7.2-2.4-8.5 0.5-15.2 2.8-7.8 3.5-6.1 4.6-4.7 4.8-6.6 5.1-5.8 3.6-2.5 4.9-6.2 2.8-7.2-1.8-8.9-1.3-5.2-2 3.8-0.3 3.3-1.4 1.4 0.5-0.9-3.2-2.2 1.6-1.8-0.5-2.5-0.1 0-3.3 2.4-5.6 3.7-0.3 5.4 0.1-3.7-10.5-4.1-8 1.9-3.7 0-1.9-3.1-1.5 0.4-1.8 1.8-2 0.9-2.6 4-5.2-8.5 0.5-0.2-8.7 11.6-1.4 8.3 4.7 6.1 0.1 3.9-3.2 1.7-4.9 2.1-3 5.3-0.8 7-5.7 4.4-2.4 3.8-3.8 16.3-9.4 7.2-2 12.6-2.3 6.9-0.4 5.3 4.6 5 5.9 12.6 4.6 3.7-0.5 8.3-2.4 4.7 3.4 2.4 3.9 6.3-0.6 11.7-2.4 4-1.3 0-3.4 0.3-5 0.5 0z m-92.7 30.8l-3.8 4.1 0.9 5.6 6.1 2.4 7 4.5 7.3 1.7 6.8-2.7 4.5-0.6 3-2.2-2.5-6.8-2.5-4-4.1-2.2-5.6-2.1-7.8 0.7-9.3 1.6z"/>
				<path id="hualien-county" :fill="regionFill('hualien-county')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M935.4 601.5l0.6 0.8 1.6 2.9 0.2 1.1-1.4 2.4-5.8 5.7-6.2 8.6-4.7 3.7-1.4 2 0.7 2.1-0.9 1.5-6.6 5.1-2.5 2.4-2.8 6-2.9 12.2-7.4 10.9-1.5 4.4 0.2 4.7 1.8 5.2 1.5 2.3 1.3 1 0.8 1.4 0.1 3.2-1.1 3.6-3.7 5.8-0.7 3.5-0.4 6.4-3.2 16.3-6.4 17-8 40.1-4.8 9.8-11 64.1-3.5-1-10.8 5.2-3.9 5.4 1.7 6.9 0.6 6.9-3.6 6.9-3.4 5.2-2.7 6.6-2.4 8.4-3.7 7.7-4.8 13.2-3.1 6.1 0.1 6.7-0.9 6.2-6.5 3.7-8.2-1.1-11.7-9.7-9.2-16-5.7-1.5-6.3-0.9-5-4.8-6.1-2.9-7.8-2.8-5-8.1-1.2-7.4-0.3-2.5-2.8-7.6-6.3-5.2-5.6-3.6-1-4 1.4-3.2 5.6-2.4 3-5-1.9-5.8 6-3.5 3.1-2.8-1.7-6.2 1.5-2.7 1.5-4 5.2-3.9 7.4-1.6 7.4-0.3 5.3-4.7 1.3-8.5 4-5.2 7.6-2.8 4.5-3.1 1.6-5.1 3.2-12.6 1.2-8.4-0.9-7.2-1.2-5.4-3.2-4.1-2.1-4 5.7-9.4 0.2-3.7 2.5-7 3.9-8.5 3-8.8 1.6-9.9 0.6-7.6-1.8-4.5-2-3.3 2.3-7.6 5.1-10.7 8-10.4 0.3-3.9-1.5-4.5-5.2-3.4-2.9-3.1-0.2-9.9 3.7-2.9 6.6-2.2 5.2-2.4-0.2-3.7-1.4-6.2 2.8-2 1.2-2.1 3.4-1.7 3.1-3.8 1.3-5.1 3-5 7.5-4.7 2.4-6.2 0.4-4.2 4.7-4.9 2.5 2.1 6.5 3.1 15 3.8 8.3 3.2 6.5 0 4.9-4.5 2.4-6 3.8-0.9 18.5 11.1 11.1 1.7 1.1 0z"/>
				<path id="hsinchu-city" :fill="regionFill('hsinchu-city')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M724.3 489l-0.2 0.2-4.6 1.1-4.4-1.7-2.7-3.8-4.3-2.6-6.9-2.7 1.2-4.1 5.5-11.4 2.2-3 0.7-1.5 0-1.7-0.7-1.9-1.1-2.2 1.5-3 1.8-1.8 8.3 3.6 15.1 4.8 5.4 2.8 3.8 3.9 1.9 3.7-1 3.6-2.4 1.4-5.1 0.9-5.9 2.4-3.4 4.3-2.3 5.6-2.4 3.1z"/>
				<path id="hsinchu-county" :fill="regionFill('hsinchu-county')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M843.1 523.6l-2.3 6.5-1.4 4.7 0.6 4.4-3.8 5.8-14 14.2-4.3 10.5-2.8-0.8-10.6 1-0.8 0.6-0.6-4.9-4.6-7.8-3.3-3.3-1.3-4.4-5-4-12.5 3.2-4.8-0.5-6.8 0.5-7.7 2.1-4.1-1 0.9-5.1 1.3-4.6-1-4-1-2.9 1-3.1 0.8-3.5 0.3-3.9-0.7-5.2-3.9-3.4-12.1-5.7-6-4.5-3.9-4.4-4.4-11.1 2.4-3.1 2.3-5.6 3.4-4.3 5.9-2.4 5.1-0.9 2.4-1.4 1-3.6-1.9-3.7-3.8-3.9-5.4-2.8-15.1-4.8-8.3-3.6 1.5-2.3 0.6-3.9 0.9-2.9 2-2.9 2.7-2.1 2.5-0.9-0.2-1.2 0.7-2.9 2.2-6.1 2.1-3.3 3.1 1.1 13.7-1 4.6 3.1 4 8.7 5 2 4.3 1.2 4.1 2 6.8 2.2 3.6 4.2-1.1 5.8 3.5 3.7 6.5 2.1 4.2 3.1 3.1 3.1 3.8 0.7 3.9-0.3 3.4 3.5 2.6 4.5 4.3 2.2 3.4 2.6 0.4 5 1.6 7.3-1.9 7.8-4.6 6.5 0.5 4.3 5.2 3.9 6.2 3.8 5.5 0.9 4 2.9 7.3 4.1 4.8 2.2z"/>
				<path id="kaohsiung-city" :fill="regionFill('kaohsiung-city')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M739.8 857.3l1.9 5.8-3 5-5.6 2.4-1.4 3.2 1 4 5.6 3.6 6.3 5.2 2.8 7.6 0.3 2.5-15.6 3.8-6.4 4.1-4 3.9-7.8 5.1-0.9 5.7 2.3 6-2.7 4.9-7.4 4-0.8 6.9 2.1 9.9-3 13.2-0.1 11.2-4.3 5.9-8.5 7.2-2.3 9.8 1.3 8.1 3 4.6 6.2 6.4 1.2 4.9-3.9 0.5-5.2-0.9-4.3 0.2-8.5 6.7-5.9-5.5-7.6-8.9-7.2 1.8-6.6 5.9-13.1-6.6-9.4 4.5-6.4 7.1-8 2.8-17.8-1.1-1.7 4.9-1.3 7.2-2.6 7.9 0.5 7-0.1 9.5-5.7 21.2-0.1 7.1 2.7 7.5 0.4 8.2-8.1 20.5-2.6-1.1-1.6 0.1-1.8 0.7-2.2 0-13-10.2-12.1-17.1 12.7 15.4-1.5-7.4-3.8-7.2-5.3-6-9-8.4-3.5-4.2-1.6-4.8 2.2-4.6 1.1-4.1-1.5-5.8-2.7-5.6-4.9-7.7-4.6-10.2-1-4.5 0.1-3 1.5-3.6 0.3-2.4-0.5-1.2-2.7-2.3-0.5-2.3-2.9-4.9-0.7-2-2.1-13.6 6.1-3.7 0.2 0.5 3.9 8.6 4.8 2.5 15.7 2.2 8.2-0.9 8.4 1 4.2-1.5 3.5-2.6 6.5-2.6 6.3-4.4 2.4-5.5 3-5.2 5.3-7.1 6.1-6.4 6.5-5.4 7.4-7.2 6.5-8.4 10-17 10.4-15.1 2.3-6.6-1-6.7-1.4-4.5 0.1-5 3.6-3.5 6.9 0.7 5.8-0.6 12.3-7.3 4.5-5.4 7.9-6.1 7.7-4.3 4.2-5 3.6-6.8 8.5-6.8 18.5-9.4 4.3 1 5.8 2.2 4.2 5.9 0.7 2z"/>
				<path id="keelung-city" :fill="regionFill('keelung-city')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M934.8 365l-0.3 11.9 0.2 3 3.7 3.9-0.4 2.5-2.5 1.8-4 1.5-5.1-0.6-10.6-4.4-3-2.2-3.7-3.4-2.8-3.5-1.7-3.5-2.9-3.7-0.6-2.9 3.2-2.2 7.2-3.1 4.4-2.9 1.4 0.9 2.4 2.7 3.9 1.4 11.2 2.8z"/>
				<path id="kinmen-county" :fill="regionFill('kinmen-county')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M9.2 576.4l-5.2 1.5-3-1.2 5-9.9 1.3-1.4 2.1-0.5 2.1-0.1 2 1.4 1.6 1.8 0 3.1-1.4 2.1-1.6 0.1-1.1 1.2-0.6 1.2-1.2 0.7z m55-26.8l4.7 12.6-1 8.8-3.9 4.6-6.8-4.3-5-1.6-8.1 0.8-7.1 4.5-3.9 6.1-3.4 1.7-3.9-1.9-2.7-0.1-2.4-1.1-1.2-2.1 0.5-0.7 2.1-2.8 0.7-1.2 0.2-2.1-0.1-2.5-0.7-4.3-1.8-4.2-0.2-2.1 1.5-0.9 7.6-3.7 10 6.6 7-0.9 1.1-8.7 2.3-5.5 7.5-1.5 7 6.5z m269.3-137.7l-2.9 1.5-1.3-1.2 0.7-3.2 2.4-1.4 1.7 0.3 0.2 1.9-0.8 2.1z"/>
				<path id="lienchiang-county" :fill="regionFill('lienchiang-county')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M469.2 123.9l-0.2 2.3-1.9 2.1-4.1 2 2.5-5.6 2.5 0.5 0.1-0.9 1.1-0.4z m-11.8-0.8l-2 2.1-2.4-3.4 3.6-1.3 2.7 1.5-1.9 1.1z m-3.2-54.9l1 0.5 4.4-2.6 2.8 0 0 1.8-2.8 3.2-5.5 2.9-1.7 0.3-2.5-1.7-0.8-2.4 0.5-2.8 1.1-2 1-0.2 0.3 2.2 2.2 0.8z m21.3-17.8l-0.6 2.2 0.6 1.2-1.4-0.2-1.5-2.2-1.1-0.7-2.3 1.3-1-0.4-1.3 0.3-1.5 1.7-1.2 5-1.1-0.7-0.5-1.5 0.5-4.3 0.5-1.6 1.1-0.7 2.7-0.9 0.7-0.9 2.2-1.3 2.5 0.4 1.3 1.9 1.4 1.4z m129.8-45.6l-1.2 0.4-1.1-0.4-1.4 1.3-1.1 2.1-0.3-0.5-1.2-0.2-1.8-1 1.1-1.7-0.5-1.4 0.9-0.6 2.2-1.8 2.6 1.5 0.6 1.3 1.2 1z"/>
				<path id="miaoli-county" :fill="regionFill('miaoli-county')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M724.3 489l4.4 11.1 3.9 4.4 6 4.5 12.1 5.7 3.9 3.4 0.7 5.2-0.3 3.9-0.8 3.5-1 3.1 1 2.9 1 4-1.3 4.6-0.9 5.1 4.1 1 7.7-2.1 6.8-0.5 4.8 0.5 12.5-3.2 5 4 1.3 4.4 3.3 3.3 4.6 7.8 0.6 4.9-3.7 2.6-1.8 5.6-4.9 2-5.3-0.1-4.2 3-4.6 4.4-5.9 3.2-11.6 9.2-6.8 2.9-8.9 4.7-5.4-2.1-5-5.6-6-2.4-9.9-0.8-5.5 3.3-0.9 7.4-5.2 2.8-12.1 0.7-11.6-6.7-6.6-1.2-7.3-3.6-15.1-11.1-6.3-5.5-4.7-5-9.2-14.3 7.2-8.1 1.9-4 0.9-6.6 2.2-5.6 5.9-10.4 1.6-6.3 1.5-2.7 6.8-2 1.9-2.1 1.1-2.6 1.4-2.5 4.2-4.3 4.6-3.4 5.6-1.5 7.1 1.3-0.9-5.4 2.7-3.7 3.7-3.8 1.9-5.7 0.8-1.9 3.6-1.8 0.3-1.3 6.9 2.7 4.3 2.6 2.7 3.8 4.4 1.7 4.6-1.1 0.2-0.2z"/>
				<path id="nantou-county" :fill="regionFill('nantou-county')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M825 627.6l1.4 6.2 0.2 3.7-5.2 2.4-6.6 2.2-3.7 2.9 0.2 9.9 2.9 3.1 5.2 3.4 1.5 4.5-0.3 3.9-8 10.4-5.1 10.7-2.3 7.6 2 3.3 1.8 4.5-0.6 7.6-1.6 9.9-3 8.8-3.9 8.5-2.5 7-0.2 3.7-5.7 9.4 2.1 4 3.2 4.1 1.2 5.4 0.9 7.2-1.2 8.4-3.2 12.6-1.6 5.1-4.5 3.1-7.6 2.8-4 5.2-1.3 8.5-5.3 4.7-7.4 0.3-7.4 1.6-5.2 3.9-1.5 4-1.5 2.7 1.7 6.2-3.1 2.8-6 3.5-0.7-2-4.2-5.9-5.8-2.2-4.3-1-0.9-0.2-25.6-0.2-7.6-1.4-1.1-3.8-0.4-5.9-2.7-6.5-1.2-4.8 3-5.1 0.3-5.3-5.1-2.8-4.1-1.2-6.8-2.6-6.1-0.7-2.6-3.5-8.2 0.9-6.8 2-5.8-2.5-4-4.7 0.9-5.7 1.9-5.2-1-7.7 1-7.2 2-4.7-1.9-7.2 2.4-1.6 2.5-2.3 3.8-1.5 1-3.5-5.6-2.9-3.9-1.4-3.6-3.3-2.1-6.3 0.9-13.4 1.2-6.6 0.1-5.7 1.6-5.4 2-4.6-0.5-4 1.2-2.9 4.3-1.6-0.1-3.6 4.3 0.2 17.9 2.5 4.2-0.6 5-4.8 7.6-14.4 3.7-8.5 6.4-3 10.1 1.4 6-0.2 5.8-7.7 3-1.9 8.9 6.7 3.5-0.9 2.6-5.5 4.7-3.9 6.6 0.1 5-1.9 7.9-7.6 5.1-2.9 4.4-0.8 8.8-4.7 6.2-0.2 6.3-1 11.1-4.4 4.6-0.3 4.7 1 13.4 1.3z"/>
				<path id="new-taipei-city" :fill="regionFill('new-taipei-city')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M915.9 357.2l-4.4 2.9-7.2 3.1-3.2 2.2 0.6 2.9 2.9 3.7 1.7 3.5 2.8 3.5 3.7 3.4 3 2.2 10.6 4.4 5.1 0.6 4-1.5 2.5-1.8 0.4-2.5-3.7-3.9-0.2-3 0.3-11.9 34.6 8.4 3.2 2-1.6 3.7-0.4 2.9 0.7 5.2 2.4 8.7 2.6 4.1 2.2 0.9 7-1 3.6 0.4 4.2 1.1 3.7 1.9 2 2.5-8.7 4.3-0.8-1.1-3.3-1.9-5.9 1.3-8.4 4.4-3.7 2.5-11.2 2.3-1.4 2.9 2.5 3.6-1.6 3.8-4.6 2.9-3.5 1.2-3.7 2-3.3 4.1-3.1 5-5 3.6-6.2 1.9-13.5 8.1-13 5.3-3.8 2.3-4.7 4-2 4.9 0.2 4.2 1 3.2 0.4 2-3.9 2.8-6.6 3.2-5 3.5-3.8 3.3-4.9 1.8-5.7 1.6-2.5-5.4-8.9-8.5-1.4-5.6-0.8-5.2 3.1-3.7 1.5-5.3-8.5-12.3-5-2-7.4 0.4-5.1-2.9 1.3-6.7-1-5.1-5.4-5.1-1-5.1 1-5.8-0.2-6.2 3.7-4 13.1-3.9 3.3-3.4 1-4.2-0.5-4.1-5.1-7.5-4.2-2.2-4.1-1-3.2-2.8-4.7-3.1-6.3-3-4.2-4.6 11.2-2.1 4.8-1.8 6.1-5.2 1.9-0.9 2.2-0.4 3.1 0 3.5 1.1 1.9 2.7 1.2 2.7 1.5 1.6 3.5-1.4-3.6-5.7-5.8-5.9-3.1-1.9 0.9-2.7 1.8-1.5 1.9-0.9 0.8-1 2.1-5.1 3.2-5.9 6.6-5.9 9.6-4.9 11-2.5 10.8 1.2 4.5 3.4 10 14.2 3.6 7.4 1.2-0.5 2.7-0.7 3-0.4 2.2 0.6-0.1 0.9-1.1 1.3-1 1.8 0.1 2.2 1.1 1.2 2.3 1.7z m-18.5 56l7.6-9.6 2-4.3-3.8-3.2-4.6-2.6-0.1-5.1 1.6-6.6-1.6-4.4-3.9-3.5-2.5-10-3.2-6.8-0.4-3.5 0.5-3.6-2.1-2.2-3.8-1.2-4 2-2.9 2.5-10.9 6.4-3.6 4-2.1 4.6-1.8 2.4-1.6 3 3.8 4.2 5.7 5.5 1.2 6.3-1.5 7.4 3.9 6.7 5.8 4.6 3.8 4.3 3.7 3.3 4.8 1 5.8 0.1 4.2-1.7z"/>
				<path id="penghu-county" :fill="regionFill('penghu-county')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M320.7 926.5l-1.8 0.9-1.3-1.5-1.5-4.7 1-1.2 3.8-1.3 2.7 0.7 0.1 2.1-0.2 1.6-1.2 1.2-1.6 2.2z m-1.2-12l-1.7 3.1-2.2-0.6-2-2.5-0.3-2.5 1.2-1.1 3.2 0.5 1.8 3.1z m48.8-3.2l-0.4 0.1-1.2-1.5 0.3-0.6 2.5-0.2 0.8 2-2 0.2z m14-4.6l0.3 0.2 2.3 0 0 1.3-1.1 1.5-0.7 1.8-1.1-2.8 0.3-2z m-33.5-29.6l-1.7 0.1-3 1.8-0.4-0.4 0.4-1.3 1.1-1.5 0.7-0.6 1.6-0.3 1.5 0.9-0.2 1.3z m-8.4-6.7l0.1 2.3 0.5 1.6 1.4 1.2-0.6 1.6-1.2 1.2 0.6 1.9-1.5 0.6-3.1-0.3-1.6-0.7 1.4-3.1-0.2-4.2-0.9 0.6-2 0.6-0.6-2.3 2.1-5.1 1.6-0.3 2.7 3.6 1.3 0.8z m-49.5-5.7l2.4 0.6 0 1.6-0.6 0.9-2.1 0.6-1.1-1.1 1.4-2.6z m58.5-24.8l-3.2 2.1-2.1 0.6-2.2 1.1-1.3-0.5-0.3-1.8 0.7-0.6 1.8 0.5 4-2 2.6 0.6z m19.5-28l-0.6 1.3 4-1.3 3.1 0.4 2.3-0.2 1.6-2.7 4.7 8.7 1.2 4-0.5 3-2-2-2.5-1.7-2.8-0.5-4 2.2-2.8 0.3-1.4 0.8-0.7 1.5-1.1 4.1-0.7 1.2-4.7 2.7-4.8 0.7-4.8-1.9-4.9-4.9 1.3-2.5 2.7 3.2 4 0.9 4.3-1.2 3.5-2.9-2.4-0.9-2-1.2-1.5-1.6-1.4-2.2-0.8 1.4-1 0.6-0.3-4 0.3-4 1.8 0 2.1 0.5 7.4-4.6 4.6-1.6-1.2 4.4z m-39.9 9.3l-3.8 0 0.7-2.1 1.2-1.3 1.9-0.5 2.5-0.2 2.2-0.9 0.6-2 0.1-4.8 3.2-10.4 3.1-3 4.2 3.6-2.5 1.5-1.7 3.6-2.8 8.5-0.1 2.2 0.7 2-0.3 1.3-3 0.5-2.2 0.1-1.5 0.3-1.3 0.6-1.2 1z m33.8-17.9l-2.2 0.7-1.1-1.5-0.9-3.5-2-2.9-4.3-4.3 5.5-4.1 3.3 1.7 3.2 2.8 1.4 2.9-2.5 2.4 1 3.5-1.4 2.3z m2.6-30.4l-0.3 0.9-1.3-3-0.2-1.4 1.8-1.5 1.6-3 0.5 1.1 2.5 1.4-0.4 1.8-2.2 1.3-2 2.4z"/>
				<path id="pingtung-county" :fill="regionFill('pingtung-county')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M569.4 1166l2 2.9-0.3 1-2.7 1.8-5 4.3-0.9-3.3 1.4-2.7 2.8-3.6 2 0 0.7-0.4z m126.7-143.3l3.5 6.6 0.7 4.9 5.4 1.3 5.5 3.6-2.8 13.8-0.1 5.2-2 5-9.8 4.1-4.8 2.7-7.6 1.6-5.4 4.5-2.4 6.6-3.7 6.6-3 7.5-0.8 14.7 1.2 6.5 2 6.1 1.1 7.1 0 5.4 2.6 5 4.6 5.6-2.5 3.8-5.3 3.2-2.1 3.9-0.5 4.5 2.7 3.9 3.4 1.7 3.1 4.4-0.1 5.7 0.6 6.1 3.2 5.9 4.6 4.9 10.2 4.7 4.5-0.3 0.9 51.6-1.6 7.3-2.5 6-3.4 2.5-4 3.7 0.1 8.3 1.5 9.2-0.4 5.9-4.5-6.8-6.8-5.2-7.8-3.5-8-1.9-0.3 6.6-2.3 2.3-3.4-0.8-3.7-3.1-0.2-2.4 1.3-7-5.5-9.2-0.5-2.4 0.1-2.1 0.4-3.2 0-10.8 0.5-3.1 2.5-3.6 0.5-3-19.9-51.6-1.6-2.9-5.5-6.8-4.4-9.9-2-2.8-8.2-6.5-5.4-3-0.9-3.7-0.7-1.3-4.4-2.9-10-4.8-4.5-3.1-4.8-4.2-2.6-1.6 8.1-20.5-0.4-8.2-2.7-7.5 0.1-7.1 5.7-21.2 0.1-9.5-0.5-7 2.6-7.9 1.3-7.2 1.7-4.9 17.8 1.1 8-2.8 6.4-7.1 9.4-4.5 13.1 6.6 6.6-5.9 7.2-1.8 7.6 8.9 5.9 5.5 8.5-6.7 4.3-0.2 5.2 0.9z"/>
				<path id="taichung-city" :fill="regionFill('taichung-city')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M803.7 570.5l0.8-0.6 10.6-1 2.8 0.8 3.6 1-0.6 5.5 1.4 3.8 4.9 1 4.4 2.6 3.7 2.5 4-0.6 4.7-2.3 4.9 0 5.9 4.7-4.7 4.9-0.4 4.2-2.4 6.2-7.5 4.7-3 5-1.3 5.1-3.1 3.8-3.4 1.7-1.2 2.1-2.8 2-13.4-1.3-4.7-1-4.6 0.3-11.1 4.4-6.3 1-6.2 0.2-8.8 4.7-4.4 0.8-5.1 2.9-7.9 7.6-5 1.9-6.6-0.1-4.7 3.9-2.6 5.5-3.5 0.9-8.9-6.7-3 1.9-5.8 7.7-6 0.2-10.1-1.4-6.4 3-3.7 8.5-7.6 14.4-5 4.8-4.2 0.6-17.9-2.5-4.3-0.2 0-1.4-5.4-3.5-4.3-0.8-1.2-3.3-0.1-4-2-4-3.2-5-4.3-3.6-11.9-3.5-4.5-5.4-1-7.6-2.7-6.3-4-3.5-5.8-1.9 0.6-0.8 0.8-3.3 3.3-2.7 2.2-6.5 2.7-12.3 9.3-16.1 2.8-9.9 3.4-5.5 13.3-14.8 9.2 14.3 4.7 5 6.3 5.5 15.1 11.1 7.3 3.6 6.6 1.2 11.6 6.7 12.1-0.7 5.2-2.8 0.9-7.4 5.5-3.3 9.9 0.8 6 2.4 5 5.6 5.4 2.1 8.9-4.7 6.8-2.9 11.6-9.2 5.9-3.2 4.6-4.4 4.2-3 5.3 0.1 4.9-2 1.8-5.6 3.7-2.6z"/>
				<path id="tainan-city" :fill="regionFill('tainan-city')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M483.8 968.3l-0.6 1.2-2.3-2-1.7-4.2 0.3-1.3 0.7 0 0.9 1.2 0.7 1.9 2.1 2.2-0.1 1z m0.5-27.6l-2.9 6.8 3.9-13.3 0.6 0.1-1.6 6.4z m3.5-12.8l3.5-9.9 0.5-0.1 0.2 1.9-4.2 8.1z m6.3-22.5l-0.4 2.4 0.6-10.6 0.5 0.2-0.7 8z m149.5 11.5l-2.3 6.6-10.4 15.1-10 17-6.5 8.4-7.4 7.2-6.5 5.4-6.1 6.4-5.3 7.1-3 5.2-2.4 5.5-6.3 4.4-6.5 2.6-3.5 2.6-4.2 1.5-8.4-1-8.2 0.9-15.7-2.2-4.8-2.5-3.9-8.6-0.2-0.5-6.1 3.7-1-6.3-1.8-3.6-3.9-3.9 4.7-3.4 2.7-6.1-1.1-5.2-6.3-0.9-1.2 1.8-1.1 3.4-1.8 2.7-3.3-0.1-1.3-2.3 0.5-7-0.8-2.4-4.1-1.8-2.3 2.1-1.8 2.9-2.8 0.7-2.9-2.5-0.7-3.5 0.7-3.4 1.1-2.3 3-1.6 3.7-0.5 3.1-1 1-3-1.4-1.5-9.4-2.4 0-1.9 7.9-0.1-0.8-2.6-4.3-3.7-2.8-3.2 0.7-4 2.5-1.5 2.7-0.9 1.4-2.5-0.8-3.9-1.4-3.2 0.9-3 1.4-3.7 2.3-2.6-0.5-2.3 0.5-2.3 3.3-9 1.6-1.7 2.6-0.6-3.7-2.5 1.6-4.1 5.2 2 8.9 1.3 7.2 1.8 6.2-2.8 2.5-4.9 5.8-3.6 6.6-5.1 4.7-4.8 6.1-4.6 7.8-3.5 15.2-2.8 8.5-0.5 7.2 2.4 4 2.4 2.1 4.2 1.7 5.1 9.9 10.1 1 7.5-1.8 14.2 1.6 4.6 4.5 3.5 3.8 0 5.3-2.4 5-0.6 3.7 1.1 8.4 1z"/>
				<path id="taipei-city" :fill="regionFill('taipei-city')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M897.4 413.2l-4.2 1.7-5.8-0.1-4.8-1-3.7-3.3-3.8-4.3-5.8-4.6-3.9-6.7 1.5-7.4-1.2-6.3-5.7-5.5-3.8-4.2 1.6-3 1.8-2.4 2.1-4.6 3.6-4 10.9-6.4 2.9-2.5 4-2 3.8 1.2 2.1 2.2-0.5 3.6 0.4 3.5 3.2 6.8 2.5 10 3.9 3.5 1.6 4.4-1.6 6.6 0.1 5.1 4.6 2.6 3.8 3.2-2 4.3-7.6 9.6z"/>
				<path id="taitung-county" :fill="regionFill('taitung-county')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M889.2 1263l-5.5 1.7-7.3-2.9-6.8-4.8-3.9-3.7 1.2-2.7-0.1-2.5-1-2.4-1.7-2.1 19.5 0 0 1.8-1.3 3.5-0.4 2.9 0.9 2.5 4.7 3.5 2 2.5-0.3 2.7z m-24-177.6l-0.1 1.1-3.4-0.4-0.4-0.6-2.7-1-2.8-4.9-1.4-4.3 0.6-0.6 10-0.7 1.1 0.6 0.8 2-0.8 3.9-0.9 1.6-0.4 1.7 0.4 1.6z m-163.1 114.1l-4.5 0.3-10.2-4.7-4.6-4.9-3.2-5.9-0.6-6.1 0.1-5.7-3.1-4.4-3.4-1.7-2.7-3.9 0.5-4.5 2.1-3.9 5.3-3.2 2.5-3.8-4.6-5.6-2.6-5 0-5.4-1.1-7.1-2-6.1-1.2-6.5 0.8-14.7 3-7.5 3.7-6.6 2.4-6.6 5.4-4.5 7.6-1.6 4.8-2.7 9.8-4.1 2-5 0.1-5.2 2.8-13.8-5.5-3.6-5.4-1.3-0.7-4.9-3.5-6.6 3.9-0.5-1.2-4.9-6.2-6.4-3-4.6-1.3-8.1 2.3-9.8 8.5-7.2 4.3-5.9 0.1-11.2 3-13.2-2.1-9.9 0.8-6.9 7.4-4 2.7-4.9-2.3-6 0.9-5.7 7.8-5.1 4-3.9 6.4-4.1 15.6-3.8 1.2 7.4 5 8.1 7.8 2.8 6.1 2.9 5 4.8 6.3 0.9 5.7 1.5 9.2 16 11.7 9.7 8.2 1.1 6.5-3.7 0.9-6.2-0.1-6.7 3.1-6.1 4.8-13.2 3.7-7.7 2.4-8.4 2.7-6.6 3.4-5.2 3.6-6.9-0.6-6.9-1.7-6.9 3.9-5.4 10.8-5.2 3.5 1-4.6 26.4-2.2 4.9-7.1 9.4-2.6 4.9-2.1 6.1-1.5 11.4 0.2 10.2-1 9.7-4.9 9.9-2.1 2.1-4.7 3.5-2.2 2.2-1 2.3-1.7 5.8-4.8 8.4-2.9 13.1-2.1 5.9-10.3 14.8-1.3 2.7-13.9 11.8-3.3 3.8-0.4 2.7 0.6 6.2-0.2 2.8-1.2 3.2-2.2 3.5-4.7 6.1-4.7 4.5-16.1 10.7-10.8 11.9-2.7 1.4-2.1 2.7-5.2 13.5-2.6 5-8 10-3.3 6-1.9 12.3-4.8 16.8-9.5 16.7-1.4 5.7-1.7 16.1 0.3 14.7z"/>
				<path id="taoyuan-city" :fill="regionFill('taoyuan-city')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M861.8 498.8l-3.1 0.9-5.4 3.9 3.1 12.4-2.2 3.8-3.4 1.3-3.3-0.6-3.9 1.6-0.5 1.5-4.8-2.2-7.3-4.1-4-2.9-5.5-0.9-6.2-3.8-5.2-3.9-0.5-4.3 4.6-6.5 1.9-7.8-1.6-7.3-0.4-5-3.4-2.6-4.3-2.2-2.6-4.5-3.4-3.5-3.9 0.3-3.8-0.7-3.1-3.1-4.2-3.1-6.5-2.1-3.5-3.7 1.1-5.8-3.6-4.2-6.8-2.2-4.1-2-4.3-1.2-5-2-4-8.7-4.6-3.1-13.7 1-3.1-1.1 8.9-14.2 6.9-8.3 7.2-6.1 18.4-6.1 4.3-2.7 3.7-3.2 4.5-2.5 9-3.2 20.1-3.6 4.2 4.6 6.3 3 4.7 3.1 3.2 2.8 4.1 1 4.2 2.2 5.1 7.5 0.5 4.1-1 4.2-3.3 3.4-13.1 3.9-3.7 4 0.2 6.2-1 5.8 1 5.1 5.4 5.1 1 5.1-1.3 6.7 5.1 2.9 7.4-0.4 5 2 8.5 12.3-1.5 5.3-3.1 3.7 0.8 5.2 1.4 5.6 8.9 8.5 2.5 5.4z"/>
				<path id="yilan-county" :fill="regionFill('yilan-county')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M982.4 448.9l2.1 0.5 1.6 2.2-0.7 2.3-3.8-0.1-1.4-0.8-1.7-2.7 0.9 0.3 3-1.7z m-47 152.6l-1.1 0-11.1-1.7-18.5-11.1-3.8 0.9-2.4 6-4.9 4.5-6.5 0-8.3-3.2-15-3.8-6.5-3.1-2.5-2.1-5.9-4.7-4.9 0-4.7 2.3-4 0.6-3.7-2.5-4.4-2.6-4.9-1-1.4-3.8 0.6-5.5-3.6-1 4.3-10.5 14-14.2 3.8-5.8-0.6-4.4 1.4-4.7 2.3-6.5 0.5-1.5 3.9-1.6 3.3 0.6 3.4-1.3 2.2-3.8-3.1-12.4 5.4-3.9 3.1-0.9 5.7-1.6 4.9-1.8 3.8-3.3 5-3.5 6.6-3.2 3.9-2.8-0.4-2-1-3.2-0.2-4.2 2-4.9 4.7-4 3.8-2.3 13-5.3 13.5-8.1 6.2-1.9 5-3.6 3.1-5 3.3-4.1 3.7-2 3.5-1.2 4.6-2.9 1.6-3.8-2.5-3.6 1.4-2.9 11.2-2.3 3.7-2.5 8.4-4.4 5.9-1.3 3.3 1.9 0.8 1.1-12 6-5.5 4.7-18.7 22.8-2.9 4.8-2.3 6.8-1.6 7.7-0.5 7.6 0.3 7.4 3.3 15.5-0.2 4-1.5 3.9 0.2 8.1 3.5 6.3 6.5 4 7.6 1.4 0 1.8-3.2-0.3-3.1 0.3-2.6 0.8-1.9 1.4 2.7 5 1.3 6.5-0.8 5.6-6 3.4-0.4 2.5 0.7 3 1.7 2.7 0.6 2.8-2.5 2.4-6.2 3.6-7 8-0.3 3.2 0.5 7-1.2 2.6-1.3 2.3-0.8 3.2-0.5 6.4-0.6 1.6-1 1.3-0.5 1.4 1.3 1.9z"/>
				<path id="yunlin-county" :fill="regionFill('yunlin-county')" stroke="white" stroke-width="3" stroke-linejoin="round" d="M642 760.2l1.9 7.2-2 4.7-1 7.2 1 7.7-1.9 5.2-0.9 5.7 4 4.7 5.8 2.5 6.8-2 8.2-0.9 2.6 3.5-0.5 0-0.3 5 0 3.4-4 1.3-11.7 2.4-6.3 0.6-2.4-3.9-4.7-3.4-8.3 2.4-3.7 0.5-12.6-4.6-5-5.9-5.3-4.6-6.9 0.4-12.6 2.3-7.2 2-16.3 9.4-3.8 3.8-4.4 2.4-7 5.7-5.3 0.8-2.1 3-1.7 4.9-3.9 3.2-6.1-0.1-8.3-4.7-11.6 1.4 4.6-5.2-0.2-16.4 0.7-12.3 2.8-9.8 4.3-7.7 1.3-10 2.3-8.8 1.3-3 6.1-8.1 1.1-2.8 0.7-1.5 5.6-4.3 0.8-1.6 7.6 4.4 22-2.6 7.6 0.4 6.6 1.8 11.6 4.4 19.7 2.3 12.2 6 5.8-0.1 12 2.4 1-0.7z"/>
			</svg>

			<button
				type="button"
				class="mb-4 rounded-lg border border-stone-300 bg-transparent px-4 py-1.5 text-base text-zinc-800 transition hover:border-emerald-500/80 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-600 dark:text-zinc-200"
				:disabled="voicePlaybackBlocked"
				@click="speak"
			>
				🔊 播放題目
			</button>

			<p class="mb-4 text-base text-zinc-700 dark:text-zinc-300">紫色的是哪個縣市？</p>

			<div class="grid grid-cols-2 gap-3">
				<button
					v-for="region in question.choices"
					:key="region.id"
					type="button"
					class="cursor-pointer rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base font-semibold text-zinc-800 transition hover:border-emerald-500/70 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
					:class="{
						'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100':
							selected !== null && region.id === question.correct.id,
						'border-red-500 bg-red-50 text-red-900 dark:border-red-500 dark:bg-red-950/40 dark:text-red-100':
							selected?.id === region.id && region.id !== question.correct.id,
						'cursor-default opacity-45':
							selected !== null && region.id !== question.correct.id && selected?.id !== region.id,
					}"
					@click="choose(region)"
				>
					{{ region.name }}
				</button>
			</div>

			<div v-if="selected !== null" class="mt-6 flex flex-col items-center gap-4">
				<span v-if="selected.id === question.correct.id" class="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
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
