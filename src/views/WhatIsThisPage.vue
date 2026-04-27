<template>
	<div class="bg-stone-100 px-4 py-6 text-lg dark:bg-zinc-900">
		<div
			class="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-sm dark:border dark:border-zinc-800 dark:bg-zinc-950"
		>
			<h1 class="mb-4 font-bold text-zinc-900 dark:text-zinc-50">
				AI 圖片學英文/華文
			</h1>

			<div class="mb-4 text-center">
				<div class="mb-2 flex flex-wrap items-center justify-center gap-2.5">
					<button
						type="button"
						class="cursor-pointer rounded border-0 bg-emerald-500 px-4 py-2 text-base text-white transition hover:bg-emerald-600"
						@click="openCamera"
					>
						使用相機拍照
					</button>

					<label
						class="inline-block cursor-pointer rounded bg-emerald-500 px-4 py-2 text-base text-white transition hover:bg-emerald-600"
					>
						<input
							type="file"
							accept=".jpg,.jpeg,.png,.heic,.heif"
							class="hidden"
							@change="onFileChange"
						/>
						上傳圖片
					</label>
				</div>

				<video
					v-show="showCamera"
					ref="videoRef"
					autoplay
					playsinline
					class="mx-auto mb-4 block max-w-[300px] rounded-lg"
				/>

				<button
					v-if="showCamera"
					type="button"
					class="cursor-pointer rounded border-0 bg-emerald-500 px-4 py-2 text-base text-white transition hover:bg-emerald-600"
					@click="takePhoto"
				>
					拍照
				</button>

				<div v-if="imagePreview" class="mt-4 flex justify-center">
					<img :src="imagePreview" alt="預覽圖片" class="max-w-[200px] rounded-lg" />
				</div>
			</div>

			<div v-if="loading" class="py-8 text-center">
				<div
					class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-[3px] border-stone-200 border-t-emerald-500 dark:border-zinc-700 dark:border-t-emerald-400"
				/>
				<p class="text-zinc-600 dark:text-zinc-300">正在分析圖片並產生學習句...</p>
			</div>

			<div v-if="resultZh || resultEn" class="mx-auto mt-8 max-w-xl">
				<h2 class="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
					學習內容：
				</h2>
				<div
					class="mt-2 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-zinc-700 dark:bg-zinc-900"
				>
					<div class="mb-2 text-zinc-900 dark:text-zinc-100">華文：{{ resultZh }}</div>
					<div class="mb-4 text-zinc-500 dark:text-zinc-400">英文原句：{{ resultEn }}</div>

					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							class="rounded border-0 bg-emerald-500 px-4 py-2 text-base text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-45"
							:disabled="voicePlaybackBlocked"
							@click="playZhAudio"
						>
							播放華文發音
						</button>
						<button
							type="button"
							class="rounded border-0 bg-teal-600 px-4 py-2 text-base text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-45"
							:disabled="voicePlaybackBlocked"
							@click="playEnAudio"
						>
							播放英文發音
						</button>
					</div>

					<div v-if="srSupported" class="mt-4 space-y-4 border-t border-stone-200 pt-4 dark:border-zinc-700">
						<!-- Chinese pronunciation -->
						<div>
							<p class="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">華文朗讀練習</p>
							<div class="mb-2 flex flex-wrap items-center gap-3">
								<button
									type="button"
									class="rounded border-0 px-4 py-2 text-base text-white transition hover:opacity-90"
									:class="listening ? 'bg-red-500' : 'bg-violet-500'"
									@click="toggleListening"
								>
									{{ listening ? '⏹ 停止錄音' : '🎤 請念一遍上面的文字' }}
								</button>
								<span v-if="listening" class="animate-pulse text-sm font-medium text-red-500">🔴 聆聽中…</span>
							</div>
							<template v-if="spokenText">
								<p class="mb-2 text-sm text-zinc-500 dark:text-zinc-400">你說的：{{ spokenText }}</p>
								<div class="mb-2 flex items-center gap-3">
									<span class="text-3xl font-bold tabular-nums" :class="similarityColor">{{ similarityPct }}%</span>
									<span class="text-sm text-zinc-600 dark:text-zinc-300">{{ similarityLabel }}</span>
								</div>
								<div class="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-700">
									<div class="h-full rounded-full transition-all duration-500" :class="similarityBarColor" :style="{ width: similarityPct + '%' }" />
								</div>
							</template>
						</div>
						<!-- English pronunciation -->
						<div>
							<p class="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">英文朗讀練習</p>
							<div class="mb-2 flex flex-wrap items-center gap-3">
								<button
									type="button"
									class="rounded border-0 px-4 py-2 text-base text-white transition hover:opacity-90"
									:class="listeningEn ? 'bg-red-500' : 'bg-teal-600'"
									@click="toggleListeningEn"
								>
									{{ listeningEn ? '⏹ Stop recording' : '🎤 Read the English aloud' }}
								</button>
								<span v-if="listeningEn" class="animate-pulse text-sm font-medium text-red-500">🔴 Listening…</span>
							</div>
							<template v-if="spokenEnText">
								<p class="mb-2 text-sm text-zinc-500 dark:text-zinc-400">You said: {{ spokenEnText }}</p>
								<div class="mb-2 flex items-center gap-3">
									<span class="text-3xl font-bold tabular-nums" :class="similarityColorEn">{{ similarityPctEn }}%</span>
									<span class="text-sm text-zinc-600 dark:text-zinc-300">{{ similarityLabelEn }}</span>
								</div>
								<div class="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-700">
									<div class="h-full rounded-full transition-all duration-500" :class="similarityBarColorEn" :style="{ width: similarityPctEn + '%' }" />
								</div>
							</template>
						</div>
						<p class="text-xs text-zinc-400 dark:text-zinc-500">建議使用 Chrome / Edge 瀏覽器</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue'
import heic2any from 'heic2any'
import Pica from 'pica'
import { useSpeechAvailability } from '@/composables/useSpeechAvailability'
import {
	EN_US_PREFERRED_KEYWORDS,
	ZH_TW_PREFERRED_KEYWORDS,
	speakTextWithPreferredVoice,
} from '@/utils/speechVoice'

export default defineComponent({
	name: 'WhatIsThisPage',

	setup() {
		const { voicePlaybackAvailable, voicePlaybackBlocked } = useSpeechAvailability()
		const DETECT_IMAGE_API =
			(import.meta.env.VITE_DETECT_IMAGE_API as string | undefined) ?? '/api/detect-image-zh'
		const imagePreview = ref('')
		const loading = ref(false)
		const resultEn = ref('')
		const resultZh = ref('')
		const videoRef = ref<HTMLVideoElement | null>(null)
		const showCamera = ref(false)
		let stream: MediaStream | null = null

		const onFileChange = (e: Event) => {
			const target = e.target as HTMLInputElement
			const file = target.files?.[0]
			if (file) handleImageUpload(file)
			target.value = ''
		}

		// ── Speech recognition ──────────────────────────────────────────
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

		// ── Similarity ───────────────────────────────────────────────────
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
			const a = normalize(resultZh.value)
			const b = normalize(spokenText.value)
			if (!a && !b) return 100
			if (!a || !b) return 0
			return Math.round(Math.max(0, (1 - levenshtein(a, b) / Math.max(a.length, b.length)) * 100))
		})

		const similarityColor = computed(() => {
			const p = similarityPct.value
			if (p >= 90) return 'text-emerald-500'
			if (p >= 70) return 'text-amber-500'
			return 'text-red-500'
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

		// ── English speech recognition ──────────────────────────────────
		const spokenEnText = ref('')
		const listeningEn = ref(false)
		let recognitionEn: SR = null

		function stopListeningEn() {
			if (recognitionEn) { recognitionEn.stop(); recognitionEn = null }
			listeningEn.value = false
		}

		function toggleListeningEn() {
			if (listeningEn.value) { stopListeningEn(); return }
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const SRClass = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
			if (!SRClass) return
			window.speechSynthesis?.cancel()
			spokenEnText.value = ''
			recognitionEn = new SRClass()
			recognitionEn.lang = 'en-US'
			recognitionEn.continuous = true
			recognitionEn.interimResults = false
			recognitionEn.maxAlternatives = 1
			recognitionEn.onstart = () => { listeningEn.value = true }
			recognitionEn.onresult = (event: SR) => {
				let text = ''
				for (let i = 0; i < event.results.length; i++) {
					if (event.results[i].isFinal) text += event.results[i][0].transcript
				}
				spokenEnText.value = text
			}
			recognitionEn.onerror = () => { listeningEn.value = false }
			recognitionEn.onend = () => { listeningEn.value = false }
			recognitionEn.start()
		}

		const similarityPctEn = computed(() => {
			const normalize = (s: string) => s.replace(/[\s\p{P}]/gu, '').toLowerCase()
			const a = normalize(resultEn.value)
			const b = normalize(spokenEnText.value)
			if (!a && !b) return 100
			if (!a || !b) return 0
			return Math.round(Math.max(0, (1 - levenshtein(a, b) / Math.max(a.length, b.length)) * 100))
		})

		const similarityColorEn = computed(() => {
			const p = similarityPctEn.value
			if (p >= 90) return 'text-emerald-500'
			if (p >= 70) return 'text-amber-500'
			return 'text-red-500'
		})

		const similarityBarColorEn = computed(() => {
			const p = similarityPctEn.value
			if (p >= 90) return 'bg-emerald-500'
			if (p >= 70) return 'bg-amber-500'
			return 'bg-red-500'
		})

		const similarityLabelEn = computed(() => {
			const p = similarityPctEn.value
			if (p === 100) return '🎉 Perfect!'
			if (p >= 90) return '👍 Very close!'
			if (p >= 70) return '😊 Good, keep going'
			if (p >= 50) return '🤔 Some differences'
			return '😅 Try again'
		})

		const blobToDataUrl = (blob: Blob) =>
			new Promise<string>((resolve, reject) => {
				const reader = new FileReader()
				reader.onloadend = () => resolve(reader.result as string)
				reader.onerror = reject
				reader.readAsDataURL(blob)
			})

		const toTraditionalChinese = async (text: string) => {
			const { tify } = await import('chinese-conv/dist')
			return tify(text)
		}

		const createLowResImage = async () => {
			if (!imagePreview.value) return ''

			const previewResponse = await fetch(imagePreview.value)
			const sourceBlob = await previewResponse.blob()
			const imageElement = new Image()
			const imageLoaded = new Promise<void>((resolve, reject) => {
				imageElement.onload = () => resolve()
				imageElement.onerror = reject
			})
			imageElement.src = URL.createObjectURL(sourceBlob)
			await imageLoaded

			const canvas = document.createElement('canvas')
			const maxWidth = 320
			const targetWidth = Math.min(maxWidth, imageElement.width)
			const targetHeight = Math.max(
				1,
				Math.floor((targetWidth / imageElement.width) * imageElement.height),
			)
			canvas.width = targetWidth
			canvas.height = targetHeight

			const context = canvas.getContext('2d')
			if (!context) return ''
			context.drawImage(imageElement, 0, 0, targetWidth, targetHeight)

			let quality = 0.7
			let compressedBlob = await new Promise<Blob>((resolve) => {
				canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality)
			})

			const MAX_IMAGE_SIZE = 90 * 1024
			while (compressedBlob.size > MAX_IMAGE_SIZE && quality > 0.4) {
				quality -= 0.1
				compressedBlob = await new Promise<Blob>((resolve) => {
					canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality)
				})
			}

			return blobToDataUrl(compressedBlob)
		}

		const handleImageUpload = async (file: File) => {
			if (!file) return

			const MAX_FILE_SIZE = 1.5 * 1024 * 1024

			let processedFile = file
			const isHeic = /\.(heic|HEIC|heif|HEIF)$/.test(file.name)

			if (isHeic) {
				try {
					const blob = await heic2any({
						blob: file,
						toType: 'image/jpeg',
						quality: 0.95,
					})

					const resultBlob = Array.isArray(blob) ? blob[0] : blob
					if (!resultBlob) return

					processedFile = new File(
						[resultBlob],
						file.name.replace(/\.(heic|HEIC|heif|HEIF)$/, '.jpg'),
						{ type: 'image/jpeg' },
					)
				} catch (heicError: unknown) {
					if ((heicError as Error).message.includes('already browser readable')) {
						processedFile = file
					} else {
						console.error('HEIC 轉換錯誤:', heicError)
						window.alert('HEIC 圖片轉換失敗，請重試')
						return
					}
				}
			}

			if (processedFile.size > MAX_FILE_SIZE) {
				try {
					const img = new Image()
					const imgLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
						img.onload = () => resolve(img)
						img.onerror = reject
					})

					img.src = URL.createObjectURL(processedFile)
					await imgLoadPromise

					let width = img.width
					let height = img.height
					const aspectRatio = width / height
					let scale = 0.8

					const canvas = document.createElement('canvas')
					const pica = new Pica({ features: ['js', 'wasm', 'cib'] })

					let attempts = 0
					let compressedBlob: Blob

					do {
						width = Math.floor(img.width * scale)
						height = Math.floor(width / aspectRatio)

						canvas.width = width
						canvas.height = height

						await pica.resize(img, canvas, {
							quality: 3,
							unsharpAmount: 80,
							unsharpRadius: 0.6,
							unsharpThreshold: 2,
						})

						compressedBlob = await new Promise<Blob>((resolve) => {
							canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95)
						})

						scale *= 0.9
						attempts++
					} while (compressedBlob.size > MAX_FILE_SIZE && attempts < 5)

					processedFile = new File([compressedBlob], processedFile.name, {
						type: 'image/jpeg',
					})
				} catch (error) {
					console.error('圖片壓縮失敗:', error)
					window.alert('圖片壓縮失敗，請重試')
					return
				}
			}

			imagePreview.value = URL.createObjectURL(processedFile)

			loading.value = true
			resultEn.value = ''
			resultZh.value = ''
			spokenText.value = ''
			spokenEnText.value = ''
			stopListening()
			stopListeningEn()

			try {
				const formData = new FormData()
				formData.append('image', processedFile)

				const response = await fetch(DETECT_IMAGE_API, {
					method: 'POST',
					body: formData,
				})
				if (!response.ok) {
					const errorPayload = (await response.json().catch(() => ({}))) as { error?: string }
					throw new Error(errorPayload.error || '圖片辨識請求失敗')
				}
				const data = await response.json()

				resultEn.value = data.descriptionEn || ''
				resultZh.value = await toTraditionalChinese(
					data.descriptionZh || data.description || '',
				)
			} catch (error) {
				console.error('上傳圖片失敗:', error)
			} finally {
				loading.value = false
			}
		}

		const playZhAudio = () => {
			if (!voicePlaybackAvailable.value) return
			speakTextWithPreferredVoice(resultZh.value, 'zh-TW', ZH_TW_PREFERRED_KEYWORDS, 0.72)
		}

		const playEnAudio = () => {
			if (!voicePlaybackAvailable.value) return
			speakTextWithPreferredVoice(resultEn.value, 'en-US', EN_US_PREFERRED_KEYWORDS)
		}

		const openCamera = async () => {
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: 'environment' },
					audio: false,
				})

				if (videoRef.value) {
					videoRef.value.srcObject = stream
					showCamera.value = true
				}
			} catch (error) {
				console.error('無法存取相機:', error)
				window.alert('無法存取相機，請確認權限設定')
			}
		}

		const takePhoto = () => {
			if (!videoRef.value || !stream) return

			const canvas = document.createElement('canvas')
			canvas.width = videoRef.value.videoWidth
			canvas.height = videoRef.value.videoHeight

			const ctx = canvas.getContext('2d')
			if (!ctx) return

			ctx.drawImage(videoRef.value, 0, 0)

			canvas.toBlob(
				(blob) => {
					if (!blob) return

					const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' })
					handleImageUpload(file)

					if (stream) {
						stream.getTracks().forEach((track) => track.stop())
						stream = null
					}
					showCamera.value = false
				},
				'image/jpeg',
				0.95,
			)
		}

		onMounted(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			srSupported.value = !!((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
		})

		onUnmounted(() => {
			if (stream) stream.getTracks().forEach((track) => track.stop())
			stopListening()
			stopListeningEn()
		})

		return {
			imagePreview,
			loading,
			resultEn,
			resultZh,
			onFileChange,
			playZhAudio,
			playEnAudio,
			voicePlaybackAvailable,
			voicePlaybackBlocked,
			videoRef,
			showCamera,
			openCamera,
			takePhoto,
			spokenText,
			listening,
			srSupported,
			toggleListening,
			similarityPct,
			similarityColor,
			similarityBarColor,
			similarityLabel,
			spokenEnText,
			listeningEn,
			toggleListeningEn,
			similarityPctEn,
			similarityColorEn,
			similarityBarColorEn,
			similarityLabelEn,
		}
	},
})
</script>
