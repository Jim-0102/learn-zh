<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSpeechAvailability } from '@/composables/useSpeechAvailability'
import { getPreferredZhTwFemaleVoice, getVoicesAsync } from '@/utils/speechVoice'

interface Card {
	chinese: string
	english: string
	image: string
}

const ALL_CARDS: Card[] = [
	// 身體健康
	{ chinese: '我身體很健康。', english: 'My body is very healthy.', image: '/body/healthy.webp' },
	{ chinese: '我的眼睛很明亮。', english: 'My eyes are bright.', image: '/body/eyes.webp' },
	{ chinese: '我的視力很好。', english: 'My eyesight is very good.', image: '/body/eyesight.webp' },
	{ chinese: '我的聽力很敏銳。', english: 'My hearing is very sharp.', image: '/body/hearing.webp' },
	{ chinese: '我的牙齒很整齊。', english: 'My teeth are very straight.', image: '/body/teeth.webp' },
	{ chinese: '我的手很靈活。', english: 'My hands are very flexible.', image: '/body/hands.webp' },
	{ chinese: '我的腿很有力。', english: 'My legs are very strong.', image: '/body/legs.webp' },
	{ chinese: '我的背很挺直。', english: 'My back is very straight.', image: '/body/back.webp' },
	{ chinese: '我的心跳很穩定。', english: 'My heartbeat is very steady.', image: '/body/heartbeat.webp' },
	{ chinese: '我的肌肉很結實。', english: 'My muscles are very firm.', image: '/body/muscles.webp' },
	{ chinese: '我的骨骼很強壯。', english: 'My bones are very strong.', image: '/body/bones.webp' },
	{ chinese: '我的肩膀很放鬆。', english: 'My shoulders are very relaxed.', image: '/body/shoulders.webp' },
	{ chinese: '我的皮膚很光滑。', english: 'My skin is very smooth.', image: '/body/skin.webp' },
	{ chinese: '我的頭髮很亮麗。', english: 'My hair is very shiny.', image: '/body/hair.webp' },
	{ chinese: '我的呼吸很順暢。', english: 'My breathing is very smooth.', image: '/body/breathing.webp' },
	{ chinese: '我的免疫力很強。', english: 'My immune system is very strong.', image: '/body/immunity.webp' },
	{ chinese: '我的平衡感很好。', english: 'My sense of balance is very good.', image: '/body/balance.webp' },
	{ chinese: '我的反應很敏捷。', english: 'My reflexes are very quick.', image: '/body/reflexes.webp' },
	{ chinese: '我的體溫很正常。', english: 'My body temperature is normal.', image: '/body/temperature.webp' },
	{ chinese: '我的睡眠很充足。', english: 'I sleep very well.', image: '/body/sleep.webp' },
	// 情緒
	{ chinese: '我很開心！', english: 'I am very happy!', image: '/images/emotions/happy.webp' },
	{ chinese: '我很難過。', english: 'I am very sad.', image: '/images/emotions/sad.webp' },
	{ chinese: '我生氣了！', english: 'I am angry!', image: '/images/emotions/angry.webp' },
	{ chinese: '我很緊張。', english: 'I am very nervous.', image: '/images/emotions/nervous.webp' },
	{ chinese: '我很興奮！', english: 'I am very excited!', image: '/images/emotions/excited.webp' },
	{ chinese: '我很累。', english: 'I am very tired.', image: '/images/emotions/tired.webp' },
	{ chinese: '我很睏。', english: 'I am very sleepy.', image: '/images/emotions/sleepy.webp' },
	{ chinese: '我餓了。', english: 'I am hungry.', image: '/images/emotions/hungry.webp' },
	{ chinese: '我渴了。', english: 'I am thirsty.', image: '/images/emotions/thirsty.webp' },
	{ chinese: '我很不舒服。', english: 'I am not feeling well.', image: '/images/emotions/not_feeling_well.webp' },
	{ chinese: '我很專注。', english: 'I am very focused.', image: '/images/emotions/focused.webp' },
	{ chinese: '我會分心。', english: 'I get distracted.', image: '/images/emotions/distracted.webp' },
	{ chinese: '我很放心。', english: 'I feel very relieved.', image: '/images/emotions/relieved.webp' },
	{ chinese: '我很平靜。', english: 'I am very calm.', image: '/images/emotions/calm.webp' },
	{ chinese: '我很煩躁。', english: 'I am very frustrated.', image: '/images/emotions/irritated.webp' },
	{ chinese: '我很擔心。', english: 'I am very worried.', image: '/images/emotions/worried.webp' },
	{ chinese: '我很害怕。', english: 'I am very scared.', image: '/images/emotions/scared.webp' },
	{ chinese: '我很驚訝！', english: 'I am very surprised!', image: '/images/emotions/surprised.webp' },
	{ chinese: '我很無聊。', english: 'I am very bored.', image: '/images/emotions/bored.webp' },
	{ chinese: '我很放鬆。', english: 'I am very relaxed.', image: '/images/emotions/relaxed.webp' },
	// 在家情境
	{ chinese: '早安，爸爸！', english: 'Good morning, Dad!', image: '/env1_at_home/good_morning_dad.webp' },
	{ chinese: '早安，媽媽！', english: 'Good morning, Mom!', image: '/env1_at_home/good_morning_mom.webp' },
	{ chinese: '今天是星期一，要開始學習的一週了。', english: 'Today is Monday, time to start a week of learning.', image: '/env1_at_home/monday_learning_week.webp' },
	{ chinese: '今天的功課是什麼？', english: "What is today's homework?", image: '/env1_at_home/homework_today.webp' },
	{ chinese: '我來做今天的早餐。', english: "I will make today's breakfast.", image: '/env1_at_home/make_breakfast.webp' },
	{ chinese: '我們一起吃飯吧！', english: "Let's eat together!", image: '/env1_at_home/eat_together.webp' },
	{ chinese: '我在學英文，今天學了新單字。', english: 'I am learning English and learned new words today.', image: '/env1_at_home/studying_english.webp' },
	{ chinese: '我準備做菜，誰想幫忙？', english: 'I am going to cook; who wants to help?', image: '/env1_at_home/help_cooking.webp' },
	{ chinese: '需要幫忙嗎？我可以幫你。', english: 'Do you need help? I can help you.', image: '/env1_at_home/need_help.webp' },
	{ chinese: '午餐準備好了嗎？', english: 'Is lunch ready?', image: '/env1_at_home/lunch_ready.webp' },
	{ chinese: '我想上廁所。', english: 'I need to use the bathroom.', image: '/env1_at_home/use_bathroom.webp' },
	{ chinese: '你能幫我澆花嗎？', english: 'Can you help me water the plants?', image: '/env1_at_home/water_plants.webp' },
	{ chinese: '我在看電視，你要一起看嗎？', english: 'I am watching TV; would you like to join me?', image: '/env1_at_home/watching_tv.webp' },
	{ chinese: '我們一起去看電影吧！', english: "Let's go watch a movie together!", image: '/env1_at_home/go_to_movies.webp' },
	{ chinese: '今晚有什麼計劃嗎？', english: 'What are the plans for tonight?', image: '/env1_at_home/plans_tonight.webp' },
	{ chinese: '請幫我關掉燈。', english: 'Please turn off the lights.', image: '/env1_at_home/turn_off_lights.webp' },
	{ chinese: '記得鎖門哦。', english: 'Remember to lock the door.', image: '/env1_at_home/lock_the_door.webp' },
	{ chinese: '我去洗碗，等我一下。', english: 'I am going to wash the dishes; wait a moment.', image: '/env1_at_home/wash_dishes.webp' },
	{ chinese: '我們去找奶奶吧。', english: "Let's go visit grandma.", image: '/env1_at_home/visit_grandma.webp' },
	{ chinese: '晚安，祝你好夢！', english: 'Good night, sweet dreams!', image: '/env1_at_home/good_night.webp' },
	// 數字
	{ chinese: '一、二、三、四、五、六、七、八、九、十', english: 'One, two, three, four, five, six, seven, eight, nine, ten', image: '/number/counting.webp' },
	{ chinese: '一加一等於二。', english: 'One plus one equals two.', image: '/number/01_one_plus_one.png' },
	{ chinese: '二乘以二等於四。', english: 'Two times two equals four.', image: '/number/02_two_times_two.png' },
	{ chinese: '十除以二等於五。', english: 'Ten divided by two equals five.', image: '/number/03_ten_divided_two.png' },
	{ chinese: '這個數字太大了。', english: 'This number is too large.', image: '/number/big_number.webp' },
	{ chinese: '請數到十。', english: 'Please count to ten.', image: '/number/count_to_ten.png' },
	{ chinese: '答案是多少？', english: 'What is the answer?', image: '/number/answer.webp' },
	{ chinese: '這題很簡單。', english: 'This question is easy.', image: '/number/easy.webp' },
	{ chinese: '我需要計算機。', english: 'I need a calculator.', image: '/number/05_need_calculator.png' },
	{ chinese: '這是百分之五十。', english: 'This is fifty percent.', image: '/number/06_fifty_percent.png' },
	{ chinese: '總共是一百元。', english: 'The total is one hundred dollars.', image: '/number/07_one_hundred_yuan.png' },
	{ chinese: '現在是三點半。', english: 'It is now three thirty.', image: '/number/08_three_thirty.png' },
	{ chinese: '這個數字是奇數。', english: 'This number is odd.', image: '/number/09_odd_number.png' },
	{ chinese: '那是偶數。', english: 'That is an even number.', image: '/number/10_even_number.png' },
	{ chinese: '請寫下這個數字。', english: 'Please write down this number.', image: '/number/11_write_number.png' },
	{ chinese: '這是正確答案。', english: 'This is the correct answer.', image: '/number/12_correct_answer.png' },
	{ chinese: '我們來解這道數學題。', english: "Let's solve this math problem.", image: '/number/04_solve_math.png' },
	{ chinese: '這是小數點。', english: 'This is a decimal point.', image: '/number/13_decimal_point.png' },
	{ chinese: '這是分數。', english: 'This is a fraction.', image: '/number/14_fraction.png' },
	{ chinese: '這是無限大。', english: 'This is infinity.', image: '/number/infinity.webp' },
]

const ROUND_SIZE = 20
const CONFETTI_COLORS = ['#f87171', '#fb923c', '#fbbf24', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6', '#34d399']

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr]
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[a[i], a[j]] = [a[j]!, a[i]!]
	}
	return a
}

const pool = ref<Card[]>([])
const options = ref<string[]>([])
const selected = ref<string | null>(null)

const score = ref(0)
const totalAnswered = ref(0)
const roundDone = ref(false)
const history = ref<{ chinese: string; correct: boolean }[]>([])

const showFireworks = ref(false)
const confettiPieces = ref<{ x: number; y: number; delay: number; color: string; rot: number }[]>([])

let speakSessionId = 0
const isSpeakingOptions = ref(false)
const speakingOptionIndex = ref<number | null>(null)

const currentCard = computed(() => pool.value[0] ?? null)
const progressPct = computed(() => Math.min(100, Math.round((score.value / ROUND_SIZE) * 100)))
const resultMessage = computed(() => {
	const pct = Math.round((score.value / ROUND_SIZE) * 100)
	if (score.value === ROUND_SIZE) return '完美！全部答對！🎉'
	if (pct >= 80) return '太棒了！非常熟練！'
	if (pct >= 60) return '不錯喔！繼續加油！'
	return '多練習幾次，加油！'
})

const { voicePlaybackAvailable, voicePlaybackBlocked } = useSpeechAvailability()

function generateOptions(card: Card): string[] {
	const wrong = shuffle(ALL_CARDS.filter(c => c.chinese !== card.chinese)).slice(0, 3)
	return shuffle([card.chinese, ...wrong.map(c => c.chinese)])
}

function initRound() {
	pool.value = shuffle([...ALL_CARDS]).slice(0, ROUND_SIZE)
	score.value = 0
	totalAnswered.value = 0
	roundDone.value = false
	history.value = []
	selected.value = null
	showFireworks.value = false
	const first = pool.value[0]
	if (first) options.value = generateOptions(first)
}

function stopSpeakingOptions() {
	speakSessionId++
	isSpeakingOptions.value = false
	speakingOptionIndex.value = null
	if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
}

function choose(text: string) {
	if (selected.value !== null) return
	stopSpeakingOptions()
	selected.value = text
	const card = currentCard.value!
	const correct = card.chinese === text
	history.value.push({ chinese: card.chinese, correct })
	totalAnswered.value++
	if (correct) {
		score.value++
		speakOnCorrect('答對了')
		confettiPieces.value = Array.from({ length: 24 }, () => ({
			x: 5 + Math.random() * 90,
			y: 5 + Math.random() * 90,
			delay: Math.random() * 0.5,
			color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
			rot: Math.random() * 360,
		}))
		showFireworks.value = true
		window.setTimeout(() => { showFireworks.value = false }, 1600)
	}
}

function next() {
	stopSpeakingOptions()
	const card = pool.value[0]!
	const correct = selected.value === card.chinese
	if (correct) {
		pool.value.splice(0, 1)
	} else {
		pool.value.push(pool.value.splice(0, 1)[0]!)
	}
	selected.value = null
	if (pool.value.length === 0) {
		roundDone.value = true
		return
	}
	const next = pool.value[0]
	if (next) options.value = generateOptions(next)
}

async function speakAllOptions() {
	if (!voicePlaybackAvailable.value || typeof window === 'undefined' || !window.speechSynthesis) return
	const sessionId = ++speakSessionId
	isSpeakingOptions.value = true
	window.speechSynthesis.cancel()
	const voices = await getVoicesAsync()
	const preferred = getPreferredZhTwFemaleVoice(voices)
	const opts = options.value
	let i = 0
	const speakNext = () => {
		if (sessionId !== speakSessionId) { isSpeakingOptions.value = false; speakingOptionIndex.value = null; return }
		if (i >= opts.length) { isSpeakingOptions.value = false; speakingOptionIndex.value = null; return }
		speakingOptionIndex.value = i
		const u = new SpeechSynthesisUtterance(opts[i]!)
		u.lang = 'zh-TW'
		u.rate = 0.9
		if (preferred) { u.voice = preferred; u.lang = preferred.lang }
		u.onend = () => {
			if (sessionId !== speakSessionId) return
			speakingOptionIndex.value = null
			i++
			window.setTimeout(speakNext, 350)
		}
		u.onerror = () => { isSpeakingOptions.value = false; speakingOptionIndex.value = null }
		window.speechSynthesis.speak(u)
	}
	speakNext()
}

async function speakOnCorrect(text: string) {
	if (!voicePlaybackAvailable.value || typeof window === 'undefined' || !window.speechSynthesis) return
	window.speechSynthesis.cancel()
	const u = new SpeechSynthesisUtterance(text)
	u.lang = 'zh-TW'
	u.rate = 0.9
	const voices = await getVoicesAsync()
	const preferred = getPreferredZhTwFemaleVoice(voices)
	if (preferred) { u.voice = preferred; u.lang = preferred.lang }
	window.speechSynthesis.speak(u)
}

function speakEnglish() {
	if (!voicePlaybackAvailable.value || !currentCard.value || typeof window === 'undefined' || !window.speechSynthesis) return
	window.speechSynthesis.cancel()
	const u = new SpeechSynthesisUtterance(currentCard.value.english)
	u.lang = 'en-US'
	u.rate = 0.9
	window.speechSynthesis.speak(u)
}

onMounted(initRound)
</script>

<template>
	<div class="mx-auto max-w-md px-5 pb-16 pt-8 text-center">
		<h1 class="mb-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">🃏 字卡測驗</h1>
		<p class="mb-6 text-base text-zinc-600 opacity-80 dark:text-zinc-400">看圖選出正確的句子！</p>

		<!-- Results -->
		<template v-if="roundDone">
			<div class="px-2 pb-4 pt-2 text-center">
				<div class="mx-auto mb-5 flex h-28 w-28 flex-col items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
					<div class="text-3xl font-bold leading-none">{{ score }}/{{ ROUND_SIZE }}</div>
					<div class="text-xs opacity-80 mt-1">答對題數</div>
				</div>
				<div class="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">{{ resultMessage }}</div>
				<div class="mb-7 text-sm text-zinc-500 dark:text-zinc-400">
					共 {{ ROUND_SIZE }} 題，答對 {{ score }} 題
				</div>
				<div class="mb-6 rounded-xl border border-stone-200 bg-white p-4 text-left dark:border-zinc-600 dark:bg-zinc-900">
					<div class="mb-2.5 text-xs text-zinc-500 dark:text-zinc-400">本次答題紀錄</div>
					<div
						v-for="(h, i) in history"
						:key="i"
						class="flex items-start gap-2 border-t border-stone-200 py-1.5 text-sm first:border-t-0 dark:border-zinc-700"
					>
						<div class="mt-1 h-2 w-2 shrink-0 rounded-full" :class="h.correct ? 'bg-emerald-500' : 'bg-red-500'" />
						<span class="min-w-0 flex-1 text-left leading-snug dark:text-zinc-100">{{ h.chinese }}</span>
						<span class="shrink-0 text-xs font-medium" :class="h.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
							{{ h.correct ? '✓ 答對' : '✗ 答錯' }}
						</span>
					</div>
				</div>
				<button
					type="button"
					class="cursor-pointer rounded-xl border-0 bg-emerald-500 px-10 py-3.5 text-base font-bold text-white transition hover:bg-emerald-600"
					@click="initRound"
				>
					再挑戰一次
				</button>
			</div>
		</template>

		<!-- Quiz -->
		<template v-else>
			<div class="mb-1 flex justify-center gap-6 text-sm text-zinc-700 dark:text-zinc-300">
				<span>答對：<strong>{{ score }} / {{ ROUND_SIZE }}</strong></span>
			</div>

			<div class="mb-4 mt-2">
				<div class="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
					<span>答對進度</span>
					<span>{{ score }} / {{ ROUND_SIZE }}</span>
				</div>
				<div class="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-700">
					<div
						class="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out"
						:style="{ width: progressPct + '%' }"
					/>
				</div>
			</div>

			<div class="rounded-2xl border border-stone-200 bg-white/80 px-5 py-6 dark:border-zinc-700 dark:bg-zinc-900/80">
				<!-- Image -->
				<div v-if="currentCard" class="mb-4 overflow-hidden rounded-xl border border-stone-100 bg-stone-50 dark:border-zinc-700 dark:bg-zinc-800">
					<img
						:src="currentCard.image"
						:alt="currentCard.chinese"
						class="mx-auto aspect-[4/3] w-full max-w-xs object-contain"
						loading="lazy"
						decoding="async"
					/>
				</div>

				<!-- Speak buttons -->
				<div class="mb-4 flex flex-wrap justify-center gap-2">
					<button
						type="button"
						class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45"
						:class="isSpeakingOptions
							? 'border-emerald-500 bg-emerald-500 text-white'
							: 'border-stone-300 bg-stone-50 text-zinc-700 hover:bg-stone-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'"
						:disabled="voicePlaybackBlocked"
						@click="speakAllOptions"
					>
						<span>🔊</span> {{ isSpeakingOptions ? '播報中…' : '播報題目' }}
					</button>
					<button
						type="button"
						class="flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-900/50"
						:disabled="voicePlaybackBlocked"
						@click="speakEnglish"
					>
						<span>🔈</span> 英文播報
					</button>
				</div>

				<!-- Options -->
				<div class="flex flex-col gap-3">
					<button
						v-for="(opt, idx) in options"
						:key="opt"
						type="button"
						class="rounded-xl border-2 px-4 py-3 text-left text-sm font-medium leading-snug transition"
						:class="{
							'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-100': selected === null && speakingOptionIndex === idx,
							'border-stone-200 bg-stone-50 text-zinc-800 hover:border-emerald-500/60 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100': selected === null && speakingOptionIndex !== idx,
							'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100': selected !== null && opt === currentCard?.chinese,
							'border-red-500 bg-red-50 text-red-900 dark:border-red-500 dark:bg-red-950/40 dark:text-red-100': selected === opt && opt !== currentCard?.chinese,
							'cursor-default opacity-40': selected !== null && opt !== currentCard?.chinese && selected !== opt,
						}"
						:disabled="selected !== null"
						@click="choose(opt)"
					>
						{{ opt }}
					</button>
				</div>

				<!-- Feedback + Next -->
				<div v-if="selected !== null" class="mt-6 flex flex-col items-center gap-4">
					<span v-if="selected === currentCard?.chinese" class="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
						✅ 答對了！
					</span>
					<span v-else class="text-sm font-semibold text-red-600 dark:text-red-400">
						❌ 答錯了，是「{{ currentCard?.chinese }}」
					</span>
					<button
						type="button"
						class="cursor-pointer rounded-xl border-0 bg-emerald-500 px-7 py-2.5 text-base font-semibold text-white transition hover:opacity-90"
						@click="next"
					>
						{{ pool.length === 1 && selected === currentCard?.chinese ? '查看結果 →' : '下一題 →' }}
					</button>
				</div>
			</div>
		</template>

		<!-- Confetti fireworks -->
		<Transition name="fade">
			<div v-if="showFireworks" class="pointer-events-none fixed inset-0 z-[500] overflow-hidden">
				<div
					v-for="(p, i) in confettiPieces"
					:key="i"
					class="confetti-piece absolute h-3 w-3 rounded-sm"
					:style="{
						left: p.x + '%',
						top: p.y + '%',
						backgroundColor: p.color,
						animationDelay: p.delay + 's',
						transform: 'rotate(' + p.rot + 'deg)',
					}"
				/>
			</div>
		</Transition>
	</div>
</template>

<style scoped>
@keyframes confetti-pop {
	0% { transform: scale(0) rotate(0deg); opacity: 1; }
	40% { transform: scale(1.6) rotate(180deg); opacity: 1; }
	100% { transform: scale(0.2) rotate(360deg) translateY(-20px); opacity: 0; }
}

.confetti-piece {
	animation: confetti-pop 1.2s ease-out forwards;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
