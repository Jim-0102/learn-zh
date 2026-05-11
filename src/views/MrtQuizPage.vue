<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useSpeechAvailability } from '@/composables/useSpeechAvailability'
import { getPreferredZhTwFemaleVoice, getVoicesAsync } from '../utils/speechVoice'

interface Station {
	name: string
	line: string
	english?: string
}

const STORAGE_STATIONS = 'mrt-quiz-custom-stations'
const STORAGE_USE_CUSTOM = 'mrt-quiz-use-custom'

const DEFAULT_STATIONS: Station[] = [
	// 板南線
	...([
		['頂埔','Dingpu'],['永寧','Yongning'],['土城','Tucheng'],['海山','Haishan'],
		['亞東醫院','Far Eastern Hospital'],['府中','Fuzhong'],['板橋','Banqiao'],
		['新埔','Xinpu'],['江子翠','Jiangzicui'],['龍山寺','Longshan Temple'],
		['西門','Ximen'],['台北車站','Taipei Main Station'],['善導寺','Shandao Temple'],
		['忠孝新生','Zhongxiao Xinsheng'],['忠孝復興','Zhongxiao Fuxing'],
		['忠孝敦化','Zhongxiao Dunhua'],['國父紀念館','Sun Yat-Sen Memorial Hall'],
		['市政府','Taipei City Hall'],['永春','Yongchun'],['後山埤','Houshanpi'],
		['昆陽','Kunyang'],['南港','Nangang'],['南港展覽館','Taipei Nangang Exhibition Center'],
	] as [string,string][]).map(([name,english]) => ({ name, english, line: '板南線' })),
	// 淡水信義線
	...([
		['淡水','Tamsui'],['紅樹林','Hongshulin'],['竹圍','Zhuwei'],['關渡','Guandu'],
		['忠義','Zhongyi'],['復興崗','Fuxinggang'],['北投','Beitou'],['奇岩','Qiyan'],
		['唭哩岸','Qilian'],['石牌','Shipai'],['明德','Mingde'],['芝山','Zhishan'],
		['士林','Shilin'],['劍潭','Jiantan'],['圓山','Yuanshan'],
		['民權西路','Minquan W. Rd.'],['中山','Zhongshan'],['台大醫院','NTU Hospital'],
		['中正紀念堂','Chiang Kai-Shek Memorial Hall'],['東門','Dongmen'],
		['大安森林公園','Daan Park'],['大安','Daan'],['信義安和','Xinyi Anhe'],
		['台北101/世貿','Taipei 101/World Trade Center'],['象山','Xiangshan'],
	] as [string,string][]).map(([name,english]) => ({ name, english, line: '淡水信義線' })),
	// 環狀線
	...([
		['大坪林','Dapinglin'],['十四張','Shisizhang'],['秀朗橋','Xiulang Bridge'],
		['景平','Jingping'],['景安','Jingan'],['中和','Zhonghe'],['橋和','Qiaohe'],
		['中原','Zhongyuan'],['板新','Banxin'],['新埔民生','Xinpu Minsheng'],
		['頭前庄','Touqianzhuang'],['幸福','Xinfu'],['新北產業園區','New Taipei Industrial Park'],
	] as [string,string][]).map(([name,english]) => ({ name, english, line: '環狀線' })),
	// 文湖線
	...([
		['動物園','Taipei Zoo'],['木柵','Muzha'],['萬芳社區','Wanfang Community'],
		['萬芳醫院','Wanfang Hospital'],['辛亥','Xinhai'],['麟光','Linguang'],
		['六張犁','Liuzhangli'],['科技大樓','Technology Building'],['大安','Daan'],
		['忠孝復興','Zhongxiao Fuxing'],['南京復興','Nanjing Fuxing'],
		['中山國中','Zhongshan Junior High School'],['松山機場','Songshan Airport'],
		['大直','Dazhi'],['劍南路','Jiannan Rd.'],['西湖','Xihu'],['港墘','Gangqian'],
		['文德','Wende'],['內湖','Neihu'],['大湖公園','Dahu Park'],['葫洲','Huzhou'],
		['東湖','Donghu'],['南港軟體園區','Nangang Software Park'],
		['南港展覽館','Taipei Nangang Exhibition Center'],
	] as [string,string][]).map(([name,english]) => ({ name, english, line: '文湖線' })),
	// 松山新店線
	...([
		['新店','Xindian'],['新店區公所','Xindian District Office'],['七張','Qizhang'],
		['小碧潭','Xiaobitan'],['大坪林','Dapinglin'],['景美','Jingmei'],['萬隆','Wanlong'],
		['公館','Gongguan'],['台電大樓','Taipower Building'],['古亭','Guting'],
		['中正紀念堂','Chiang Kai-Shek Memorial Hall'],['小南門','Xiaonanmen'],
		['北門','Beimen'],['中山','Zhongshan'],['松江南京','Songjiang Nanjing'],
		['南京復興','Nanjing Fuxing'],['台北小巨蛋','Taipei Arena'],
		['南京三民','Nanjing Sanmin'],['松山','Songshan'],['南港','Nangang'],
	] as [string,string][]).map(([name,english]) => ({ name, english, line: '松山新店線' })),
	// 中和新蘆線
	...([
		['南勢角','Nanshijiao'],['景安','Jingan'],['永安市場','Yongan Market'],
		['頂溪','Dingxi'],['古亭','Guting'],['東門','Dongmen'],
		['忠孝新生','Zhongxiao Xinsheng'],['松江南京','Songjiang Nanjing'],
		['行天宮','Xingtian Temple'],['中山國小','Zhongshan Elementary School'],
		['民權西路','Minquan W. Rd.'],['大橋頭','Daqiaotou'],['台北橋','Taipei Bridge'],
		['菜寮','Cailiao'],['三重','Sanchong'],['先嗇宮','Xianse Temple'],
		['頭前庄','Touqianzhuang'],['新莊','Xinzhuang'],['輔大','Fu Jen University'],
		['丹鳳','Danfeng'],['迴龍','Huilong'],['三重國小','Sanchong Elementary School'],
		['三和國中','Sanhe Junior High School'],['徐匯中學','St. Ignatius High School'],
		['三民高中','Sanmin Senior High School'],['蘆洲','Luzhou'],
	] as [string,string][]).map(([name,english]) => ({ name, english, line: '中和新蘆線' })),
	// 貓空纜車
	...([
		['動物園','Taipei Zoo Station'],['動物園南','Taipei Zoo South Station'],
		['指南宮','Zhinan Temple Station'],['貓空','Maokong Station'],
	] as [string,string][]).map(([name,english]) => ({ name, english, line: '貓空纜車' })),
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

function newQuestion(forceStation?: Station) {
	if (forceStation) {
		const others = shuffle(activePool.filter(s => s.name !== forceStation.name)).slice(0, 3)
		return { correct: forceStation, choices: shuffle([forceStation, ...others]) }
	}
	const idx = Math.floor(Math.random() * activePool.length)
	const correct = activePool[idx]!
	const others = shuffle(activePool.filter((_, i) => i !== idx)).slice(0, 3)
	return { correct, choices: shuffle([correct, ...others]) }
}

let nextForceStation: Station | null = null

const ROUND_SIZE = 20

const question = ref(newQuestion())
const selected = ref<Station | null>(null)
const score = ref(0)
const streak = ref(0)
const showReward = ref(false)
const totalAnswered = ref(0)
const roundDone = ref(false)
const history = ref<{ name: string; line: string; correct: boolean }[]>([])

const progressPct = computed(() =>
	Math.min(100, Math.round((totalAnswered.value / ROUND_SIZE) * 100)),
)
const resultPercent = computed(() => Math.round((score.value / ROUND_SIZE) * 100))
const resultMessage = computed(() => {
	const pct = resultPercent.value
	if (score.value === ROUND_SIZE) return '完美！全部答對！🎉'
	if (pct >= 80) return '太棒了！非常熟練！'
	if (pct >= 60) return '不錯喔！繼續加油！'
	return '多練習幾次，加油！'
})

const { voicePlaybackAvailable, voicePlaybackBlocked } = useSpeechAvailability()

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
function stopCurrentAzureAudio() {
	if (currentAzureAudio) { currentAzureAudio.pause(); currentAzureAudio.src = ''; currentAzureAudio = null }
	if (currentAzureAudioUrl) { URL.revokeObjectURL(currentAzureAudioUrl); currentAzureAudioUrl = '' }
}

const voiceEnabled = ref(true)
const englishMode = ref(false)
const timedMode = ref(false)
const timeLeft = ref(60)
const timeUp = ref(false)
let timerId: number | null = null

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

async function speakText(text: string, lang: string = 'zh-TW') {
	if (lang === 'zh-TW' && !azureFallbackActive.value) {
		stopCurrentAzureAudio()
		window.speechSynthesis?.cancel()
		try {
			const res = await fetch('/api/tts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text }),
			})
			if (res.status === 429) {
				setAzureFallback()
				// fall through to Web Speech below
			} else if (res.ok) {
				const blob = await res.blob()
				currentAzureAudioUrl = URL.createObjectURL(blob)
				currentAzureAudio = new Audio(currentAzureAudioUrl)
				currentAzureAudio.onended = () => { URL.revokeObjectURL(currentAzureAudioUrl); currentAzureAudioUrl = ''; currentAzureAudio = null }
				currentAzureAudio.onerror = () => { URL.revokeObjectURL(currentAzureAudioUrl); currentAzureAudioUrl = ''; currentAzureAudio = null }
				await currentAzureAudio.play()
				return
			} else {
				return
			}
		} catch {
			return
		}
	}
	// Web Speech API (English or zh-TW fallback)
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
	const useEnglish = englishMode.value && !!question.value.correct.english
	const raw = useEnglish ? question.value.correct.english! : question.value.correct.name
	const text = useEnglish ? raw : raw.replace(/\//g, '、')
	await speakText(text, useEnglish ? 'en-US' : 'zh-TW')
}

function choose(station: Station) {
	if (selected.value !== null || timeUp.value) return
	selected.value = station
	const correct = station.name === question.value.correct.name
	history.value.push({ name: question.value.correct.name, line: question.value.correct.line, correct })
	totalAnswered.value++
	if (correct) {
		score.value++
		streak.value++
		speakText('答對了')
		if (streak.value > 0 && streak.value % 5 === 0) {
			showReward.value = true
		}
		nextForceStation = null
	} else {
		streak.value = 0
		nextForceStation = station
	}
}

function next() {
	if (totalAnswered.value >= ROUND_SIZE) {
		stopTimer()
		roundDone.value = true
		return
	}
	const forced = nextForceStation
	nextForceStation = null
	question.value = forced ? newQuestion(forced) : newQuestion()
	selected.value = null
	if (voiceEnabled.value) nextTick(() => speak())
}

function dismissReward() {
	showReward.value = false
	next()
}

function resetGame() {
	timeUp.value = false
	roundDone.value = false
	score.value = 0
	streak.value = 0
	totalAnswered.value = 0
	selected.value = null
	history.value = []
	nextForceStation = null
	question.value = newQuestion()
	if (timedMode.value) startTimer()
	else if (voiceEnabled.value) nextTick(() => speak())
}

watch(timedMode, (on) => {
	if (on) startTimer()
	else { stopTimer(); timeLeft.value = 60; timeUp.value = false }
})

onMounted(() => {
	azureFallbackActive.value = checkAzureFallback()
	activePool = loadActivePool()
	question.value = newQuestion()
	if (voiceEnabled.value) nextTick(() => speak())
})

onBeforeUnmount(() => {
	stopTimer()
	stopCurrentAzureAudio()
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
				<input type="checkbox" v-model="englishMode" class="accent-emerald-500" />
				🔤 英文播報
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

		<template v-if="!roundDone">
			<div class="mb-8 flex flex-wrap justify-center gap-6 text-sm text-zinc-700 dark:text-zinc-300">
				<span>得分：<strong>{{ score }}</strong></span>
				<span>連續答對：<strong>{{ streak }}</strong></span>
				<Transition name="fade">
					<span v-if="timedMode" :class="timeLeft <= 10 ? 'animate-pulse font-bold text-red-500' : ''">
						⏱ <strong>{{ timeLeft }}</strong> 秒
					</span>
				</Transition>
			</div>

			<div class="mb-4">
				<div class="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
					<span>答題進度</span>
					<span>{{ totalAnswered }} / {{ ROUND_SIZE }}</span>
				</div>
				<div class="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-700">
					<div
						class="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out"
						:style="{ width: progressPct + '%' }"
					/>
				</div>
			</div>

			<div
				class="rounded-2xl border border-stone-200 bg-white/80 px-6 py-8 dark:border-zinc-700 dark:bg-zinc-900/80"
			>
				<button
					type="button"
					class="mb-5 rounded-lg border border-stone-300 bg-transparent px-4 py-1.5 text-base text-zinc-800 transition hover:border-emerald-500/80 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-600 dark:text-zinc-200"
					:disabled="(englishMode || azureFallbackActive) && voicePlaybackBlocked"
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
						{{ totalAnswered >= ROUND_SIZE ? '查看結果 →' : '下一題 →' }}
					</button>
				</div>
			</div>
		</template>

		<template v-else>
			<div class="px-2 pb-4 pt-4 text-center">
				<div
					class="mx-auto mb-5 flex h-28 w-28 flex-col items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
				>
					<div class="text-4xl font-bold leading-none">{{ score }}</div>
					<div class="text-xs opacity-80">/ {{ ROUND_SIZE }} 題</div>
				</div>
				<div class="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">{{ resultMessage }}</div>
				<div class="mb-7 text-sm text-zinc-500 dark:text-zinc-400">
					答對率 {{ resultPercent }}%，共作答 {{ ROUND_SIZE }} 題
				</div>
				<div
					class="mb-6 rounded-xl border border-stone-200 bg-white p-4 text-left dark:border-zinc-600 dark:bg-zinc-900"
				>
					<div class="mb-2.5 text-xs text-zinc-500 dark:text-zinc-400">本次答題紀錄</div>
					<div
						v-for="(h, i) in history"
						:key="i"
						class="flex items-center gap-2 border-t border-stone-200 py-1.5 text-sm first:border-t-0 dark:border-zinc-700"
					>
						<div class="h-2 w-2 shrink-0 rounded-full" :class="h.correct ? 'bg-emerald-500' : 'bg-red-500'" />
						<span class="min-w-0 flex-1 font-medium dark:text-zinc-100">{{ h.name }}</span>
						<span class="text-xs text-zinc-400 dark:text-zinc-500">{{ h.line }}</span>
						<span
							class="ml-1 text-xs font-medium"
							:class="h.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
						>
							{{ h.correct ? '✓ 答對' : '✗ 答錯' }}
						</span>
					</div>
				</div>
				<button
					type="button"
					class="cursor-pointer rounded-xl border-0 bg-emerald-500 px-10 py-3.5 text-base font-bold text-white transition hover:bg-emerald-600"
					@click="resetGame"
				>
					再挑戰一次
				</button>
			</div>
		</template>
	</div>
</template>
