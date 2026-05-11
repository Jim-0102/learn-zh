<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import QRCode from 'qrcode'
import HelloWorld from './components/HelloWorld.vue'
import { useSpeechAvailability } from './composables/useSpeechAvailability'

const linkClass =
	'inline-block border-l border-stone-200 px-4 py-0.5 text-xs text-zinc-600 no-underline transition first:border-0 first:pl-0 hover:bg-emerald-500/15 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-emerald-400/10'
const exactActiveClass = 'font-medium text-zinc-900 hover:bg-transparent dark:text-zinc-100 dark:hover:bg-transparent'
const mobileItemClass = 'block rounded-lg px-3 py-2.5 text-center text-sm font-medium text-zinc-700 no-underline transition hover:bg-emerald-500/10 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-emerald-400/10 dark:hover:text-zinc-100'
const mobileExactActiveClass = 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
const menuOpen = ref(false)
const { voicePlaybackBlocked } = useSpeechAvailability()

// ── PWA Install ───────────────────────────────────────────────────────────────
const deferredPrompt = ref<any>(null)
const showInstall = ref(false)

onMounted(() => {
	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault()
		deferredPrompt.value = e
		showInstall.value = true
	})
	window.addEventListener('appinstalled', () => {
		deferredPrompt.value = null
		showInstall.value = false
	})
})

async function installPWA() {
	if (!deferredPrompt.value) return
	deferredPrompt.value.prompt()
	await deferredPrompt.value.userChoice
	deferredPrompt.value = null
	showInstall.value = false
}

watchEffect(() => {
	if (typeof document === 'undefined') return
	const appRoot = document.getElementById('app')
	if (!appRoot) return
	appRoot.style.setProperty('--app-banner-height', voicePlaybackBlocked.value ? '2.875rem' : '0rem')
})

onBeforeUnmount(() => {
	if (typeof document === 'undefined') return
	const appRoot = document.getElementById('app')
	if (!appRoot) return
	appRoot.style.removeProperty('--app-banner-height')
})

// ── QR Code ──────────────────────────────────────────────────────────────────

const showQR = ref(false)
const qrDataUrl = ref('')
const canShareFiles = ref(false)

async function openQR() {
	const url = window.location.origin + '/'
	qrDataUrl.value = await QRCode.toDataURL(url, {
		width: 280,
		margin: 2,
		color: { dark: '#1c1917', light: '#ffffff' },
	})
	if (navigator.canShare) {
		const probe = new File([''], 'probe.png', { type: 'image/png' })
		canShareFiles.value = navigator.canShare({ files: [probe] })
	}
	showQR.value = true
}

function closeQR() { showQR.value = false }

async function buildComposedDataUrl(): Promise<string> {
	const qrSize = 280
	const pad = 24
	const titleH = 52
	const canvas = document.createElement('canvas')
	canvas.width = qrSize + pad * 2
	canvas.height = qrSize + pad * 2 + titleH
	const ctx = canvas.getContext('2d')!
	ctx.fillStyle = '#ffffff'
	ctx.fillRect(0, 0, canvas.width, canvas.height)
	ctx.fillStyle = '#1c1917'
	ctx.font = 'bold 22px sans-serif'
	ctx.textAlign = 'center'
	ctx.textBaseline = 'middle'
	ctx.fillText('學齡前的早療小教室', canvas.width / 2, pad + titleH / 2)
	const img = new Image()
	img.src = qrDataUrl.value
	await new Promise<void>(resolve => { img.onload = () => resolve() })
	ctx.drawImage(img, pad, pad + titleH, qrSize, qrSize)
	return canvas.toDataURL('image/png')
}

async function downloadQR() {
	const dataUrl = await buildComposedDataUrl()
	const a = document.createElement('a')
	a.href = dataUrl
	a.download = 'learn-zh-qrcode.png'
	a.click()
}

async function shareQR() {
	try {
		const dataUrl = await buildComposedDataUrl()
		const res = await fetch(dataUrl)
		const blob = await res.blob()
		const file = new File([blob], 'learn-zh-qrcode.png', { type: 'image/png' })
		await navigator.share({ title: '學齡前的早療小教室', text: '掃描 QR Code 開始學習', files: [file] })
	} catch { /* cancelled */ }
}
</script>

<template>
	<header class="fixed inset-x-0 top-0 z-[1000] border-b border-stone-200 bg-stone-50/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
		<div
			v-if="voicePlaybackBlocked"
			class="border-b border-amber-300 bg-amber-100/95 dark:border-amber-900 dark:bg-amber-950/95"
		>
			<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm text-amber-950 dark:text-amber-100">
				<p class="m-0">目前沒有可用的華語語音<span class="hidden md:inline">，語音播放按鈕已暫時停用</span></p>
				<RouterLink
					to="/voice-install-guide"
					class="rounded-md bg-amber-900 px-3 py-1 text-xs font-medium text-white no-underline transition hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
				>
					查看安裝說明
				</RouterLink>
			</div>
		</div>
		<div class="mx-auto max-w-7xl px-4 py-3 leading-snug">
			<HelloWorld msg="學齡前的早療小教室" />
			<nav class="mt-2">
				<!-- ── Mobile: hamburger row (< md) ── -->
				<div class="flex items-center justify-between md:hidden">
					<button
						type="button"
						class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold text-zinc-600 transition hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
						@click="menuOpen = !menuOpen"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0">
							<g v-if="menuOpen"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></g>
							<g v-else><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></g>
						</svg>
						{{ menuOpen ? '關閉' : '選單' }}
					</button>
					<div class="flex items-center gap-1.5">
						<button
							v-if="showInstall"
							type="button"
							class="flex items-center gap-1 rounded-md border border-emerald-400/70 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/50 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
							title="安裝為 App"
							@click="installPWA"
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
								<polyline points="7 10 12 15 17 10"/>
								<line x1="12" y1="15" x2="12" y2="3"/>
							</svg>
							加入主畫面
						</button>
						<button
							type="button"
							class="flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs text-zinc-600 transition hover:border-emerald-500/60 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-400/50 dark:hover:text-zinc-100"
							title="顯示 QR Code"
							@click="openQR"
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5">
								<rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
								<rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" /><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" /><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
								<path d="M14 14h2v2h-2z M18 14h3 M18 18h3 M14 18v3" />
							</svg>
							QR
						</button>
					</div>
				</div>

				<!-- ── Mobile dropdown panel ── -->
				<div
					v-if="menuOpen"
					class="mt-2 rounded-xl border border-stone-200 bg-stone-50/98 shadow-lg md:hidden dark:border-zinc-700 dark:bg-zinc-900/98"
				>
					<div class="grid grid-cols-2 gap-0.5 p-2">
						<RouterLink @click="menuOpen = false" to="/" :class="mobileItemClass" :exact-active-class="mobileExactActiveClass">首頁</RouterLink>
						<RouterLink @click="menuOpen = false" to="/what-is-this" :class="mobileItemClass" :exact-active-class="mobileExactActiveClass">AI 圖片學</RouterLink>
						<RouterLink @click="menuOpen = false" to="/flashcards/body" :class="mobileItemClass" :exact-active-class="mobileExactActiveClass">字卡</RouterLink>
						<RouterLink @click="menuOpen = false" to="/mrt-quiz" :class="mobileItemClass" :exact-active-class="mobileExactActiveClass">語音選站名</RouterLink>
						<RouterLink @click="menuOpen = false" to="/bopomofo-quiz" :class="mobileItemClass" :exact-active-class="mobileExactActiveClass">注音符號</RouterLink>
						<RouterLink @click="menuOpen = false" to="/alphabet-quiz" :class="mobileItemClass" :exact-active-class="mobileExactActiveClass">英文字母</RouterLink>
						<RouterLink @click="menuOpen = false" to="/custom" :class="mobileItemClass" :exact-active-class="mobileExactActiveClass">自訂朗讀</RouterLink>
						<RouterLink @click="menuOpen = false" to="/taiwan-map-quiz" :class="mobileItemClass" :exact-active-class="mobileExactActiveClass">縣市地圖</RouterLink>
						<RouterLink @click="menuOpen = false" to="/train-station-quiz" :class="mobileItemClass" :exact-active-class="mobileExactActiveClass">火車站</RouterLink>
						<RouterLink @click="menuOpen = false" to="/bannan-line-quiz" :class="mobileItemClass" :exact-active-class="mobileExactActiveClass">站名學習</RouterLink>
						<RouterLink @click="menuOpen = false" to="/situations" :class="mobileItemClass" :exact-active-class="mobileExactActiveClass">情境識別</RouterLink>
						<a @click="menuOpen = false" href="https://filedn.eu/ldt9Roov20oh8G5emLf3VCj/tools/MPS.html" target="_blank" rel="noopener" :class="mobileItemClass">注音閃卡 ↗</a>
						<a @click="menuOpen = false" href="https://www.ifreesite.com/bopomofo-edu-2.htm" target="_blank" rel="noopener" :class="mobileItemClass">注音符號表 ↗</a>
						<a @click="menuOpen = false" href="https://freemath-5yx.pages.dev/coin-exchange" target="_blank" rel="noopener" :class="mobileItemClass">兌幣練習 ↗</a>
						<a @click="menuOpen = false" href="https://www.moedict.tw" target="_blank" rel="noopener" :class="mobileItemClass">萌典 ↗</a>
						<RouterLink @click="menuOpen = false" to="/about" :class="mobileItemClass" :exact-active-class="mobileExactActiveClass">關於</RouterLink>
					</div>
				</div>

				<!-- ── Desktop: inline links (≥ md) ── -->
				<div class="hidden md:flex md:w-full md:flex-wrap md:items-center md:justify-center">
					<RouterLink to="/" :class="linkClass" :exact-active-class="exactActiveClass">首頁</RouterLink>
					<RouterLink to="/what-is-this" :class="linkClass" :exact-active-class="exactActiveClass">AI 圖片學</RouterLink>
					<RouterLink to="/flashcards/body" :class="linkClass" :exact-active-class="exactActiveClass">字卡</RouterLink>
					<RouterLink to="/mrt-quiz" :class="linkClass" :exact-active-class="exactActiveClass">語音選站名</RouterLink>
					<RouterLink to="/bopomofo-quiz" :class="linkClass" :exact-active-class="exactActiveClass">注音符號</RouterLink>
					<RouterLink to="/alphabet-quiz" :class="linkClass" :exact-active-class="exactActiveClass">英文字母</RouterLink>
					<RouterLink to="/custom" :class="linkClass" :exact-active-class="exactActiveClass">自訂朗讀</RouterLink>
					<RouterLink to="/taiwan-map-quiz" :class="linkClass" :exact-active-class="exactActiveClass">縣市地圖</RouterLink>
					<RouterLink to="/train-station-quiz" :class="linkClass" :exact-active-class="exactActiveClass">火車站</RouterLink>
					<RouterLink to="/bannan-line-quiz" :class="linkClass" :exact-active-class="exactActiveClass">站名學習</RouterLink>
					<RouterLink to="/situations" :class="linkClass" :exact-active-class="exactActiveClass">情境識別</RouterLink>
					<a href="https://filedn.eu/ldt9Roov20oh8G5emLf3VCj/tools/MPS.html" target="_blank" rel="noopener" :class="linkClass">注音閃卡</a>
					<a href="https://www.ifreesite.com/bopomofo-edu-2.htm" target="_blank" rel="noopener" :class="linkClass">注音符號表</a>
					<a href="https://freemath-5yx.pages.dev/coin-exchange" target="_blank" rel="noopener" :class="linkClass">兌幣練習</a>
					<a href="https://www.moedict.tw" target="_blank" rel="noopener" :class="linkClass">萌典</a>
					<RouterLink to="/about" :class="linkClass" :exact-active-class="exactActiveClass">關於</RouterLink>
					<button
						type="button"
						class="ml-3 flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs text-zinc-600 transition hover:border-emerald-500/60 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-400/50 dark:hover:text-zinc-100"
						title="顯示 QR Code"
						@click="openQR"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5">
							<rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
							<rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" /><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" /><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
							<path d="M14 14h2v2h-2z M18 14h3 M18 18h3 M14 18v3" />
						</svg>
						QR
					</button>
				</div>
			</nav>
		</div>
	</header>

	<main class="w-full">
		<RouterView />
	</main>

	<!-- QR Code Modal -->
	<Transition name="fade">
		<div
			v-if="showQR"
			class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4"
			@click.self="closeQR"
		>
			<div class="relative w-full max-w-xs rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
				<!-- close -->
				<button
					type="button"
					class="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-stone-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
					@click="closeQR"
				>✕</button>

				<!-- QR card (this area is what users screenshot) -->
				<div class="flex flex-col items-center px-8 pb-6 pt-8">
					<img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="mb-4 size-52 rounded-lg shadow-sm" />
					<p class="mb-0.5 text-base font-bold text-zinc-900 dark:text-zinc-100">學齡前的早療小教室</p>
					<p class="text-xs text-zinc-400 dark:text-zinc-500">learn-zh.jim-aca.workers.dev</p>
				</div>

				<!-- action buttons -->
				<div class="flex gap-2 border-t border-stone-100 px-6 py-4 dark:border-zinc-800">
					<button
						type="button"
						class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 py-2 text-sm font-medium text-zinc-700 transition hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
						@click="downloadQR"
					>
						📥 下載
					</button>
					<button
						v-if="canShareFiles"
						type="button"
						class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border-0 bg-emerald-500 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
						@click="shareQR"
					>
						📤 分享
					</button>
				</div>
			</div>
		</div>
	</Transition>
</template>
