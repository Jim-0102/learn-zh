<script setup lang="ts">
import { RouterLink } from 'vue-router'

const features = [
	{
		to: '/what-is-this',
		emoji: '📷',
		title: 'AI 圖片學',
		desc: '拍下身邊的任何物品，AI 立刻給出華文與英文說法，並可播放發音。看完結果後，可直接進入朗讀練習，用語音跟讀並獲得即時相似度評分。',
	},
	{
		to: '/flashcards/body',
		emoji: '🃏',
		title: '字卡測驗',
		desc: '健康、情緒、在家情境、數字四大主題混合出題。看圖從四個句子中選出正確答案，支援中英文語音播報，答對即觸發煙花特效。答錯的題目排到最後重考，全部答對才結算。',
	},
	{
		to: '/mrt-quiz',
		emoji: '🎧',
		title: '語音選站名',
		desc: '聽華文或英文站名語音，從四個選項中選出正確答案。每輪 20 題，結束後顯示得分與答題紀錄。連續答對還有獎勵！',
	},
	{
		to: '/bopomofo-quiz',
		emoji: '🀄',
		title: '注音符號測驗',
		desc: '看注音符號說出例字，用語音輸入作答。37 個注音符號，每輪 20 題，支援計時模式，挑戰你的注音反應力！',
	},
	{
		to: '/alphabet-quiz',
		emoji: '🔡',
		title: '英文字母測驗',
		desc: '看英文字母選對應單字，支援大寫與小寫切換。26 個字母，每輪 20 題，支援語音播報與計時模式！',
	},
	{
		to: '/custom',
		emoji: '🎙️',
		title: '自訂朗讀',
		desc: '輸入中文或英文文字，立即聆聽標準發音。支援語音輸入、慢速播放，並可跟讀後與原文比對相似度分數。',
	},
	{
		to: '/taiwan-map-quiz',
		emoji: '🗺️',
		title: '台灣縣市地圖測驗',
		desc: '地圖上的紫色是哪個縣市？聽語音選答案，支援語音輸入直接說出縣市名稱，認識台灣各縣市地理位置。',
	},
	{
		to: '/train-station-quiz',
		emoji: '🚆',
		title: '台灣火車站測驗',
		desc: '從板橋出發，選擇南下或北上，環島一圈依序停靠 10 個車站。51 個車站涵蓋西部幹線、宜蘭線、花東線與南迴線，火車沿著軌道移動。支援語音播放、語音輸入，並附臺鐵觀光地圖。',
	},
	{
		to: '/bannan-line-quiz',
		emoji: '🚇',
		title: '站名學習',
		desc: '搭配路線圖，認識台北捷運七條路線的華文站名。支援中文與英文語音播報四個選項，逐題累積積分，輕鬆建立生活用字庫。',
	},
	{
		to: '/situations',
		emoji: '🎭',
		title: '情境識別互動題',
		desc: '依據圖片與對話判斷情境，分級題型可持續擴充題庫與圖片。',
	},
	{
		href: 'https://filedn.eu/ldt9Roov20oh8G5emLf3VCj/tools/MPS.html',
		emoji: '🀄',
		title: '注音符號閃卡（外部連結）',
		desc: '翻轉閃卡練習注音符號，加強符號辨識與記憶。',
	},
	{
		href: 'https://www.ifreesite.com/bopomofo-edu-2.htm',
		emoji: '📋',
		title: '注音符號表（外部連結）',
		desc: '完整注音符號對照表，含聲母、韻母與聲調說明，適合查閱與複習。',
	},
	{
		href: 'https://freemath-5yx.pages.dev/coin-exchange',
		emoji: '🪙',
		title: '兌幣練習（外部連結）',
		desc: '拖拉硬幣到兌換區，練習硬幣面額換算，培養日常生活的數感與金錢概念。',
	},
	{
		href: 'https://www.moedict.tw',
		emoji: '📚',
		title: '萌典（外部連結）',
		desc: '查詢華文單字、成語、詞組的釋義與用法。',
	},
]

const cardClass =
	'relative flex flex-col gap-2.5 rounded-xl border border-stone-200 bg-white/90 p-7 text-left text-zinc-700 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/80 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:border-emerald-400/70'
</script>

<template>
	<main class="mx-auto max-w-3xl px-6 pb-16 pt-8">
		<section class="px-2 py-10 text-center sm:py-12">
			<div class="mb-2 text-5xl">🇹🇼</div>
			<h1 class="mb-3 text-xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
				學齡前的早療小教室
			</h1>
			<p class="text-sm text-zinc-600 opacity-90 sm:text-lg dark:text-zinc-300">
				用最直覺的方式，讓華文學習融入每一天
			</p>
		</section>

		<section class="mt-8 grid gap-6 sm:grid-cols-2">
			<div v-for="f in features" :key="f.to || f.href">
				<RouterLink v-if="f.to" :to="f.to" :class="cardClass">
					<span class="text-3xl">{{ f.emoji }}</span>
					<h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
						{{ f.title }}
					</h2>
					<p class="flex-1 text-[0.95rem] leading-relaxed">{{ f.desc }}</p>
					<span class="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
						開始 →
					</span>
				</RouterLink>
				<a v-else :href="f.href" :class="cardClass" target="_blank" rel="noopener">
					<span class="text-3xl">{{ f.emoji }}</span>
					<h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
						{{ f.title }}
					</h2>
					<p class="flex-1 text-[0.95rem] leading-relaxed">{{ f.desc }}</p>
					<span class="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
						前往 →
					</span>
				</a>
			</div>
		</section>

		<div class="mt-16 flex flex-col items-center gap-3">
			<img src="/ig-cover.jpg" alt="王大明" class="w-48 rounded-full opacity-80" />
			<a
				href="https://www.instagram.com/wang.da.ming"
				target="_blank"
				rel="noopener"
				class="text-sm text-zinc-500 no-underline hover:text-pink-500 dark:text-zinc-400 dark:hover:text-pink-400"
			>
				ig: wang.da.ming
			</a>
		</div>

	</main>
</template>
