<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const text = ref('你好，這是 VoxCPM 語音測試。')
const control = ref('natural Mandarin pronunciation, warm and clear voice')
const isGenerating = ref(false)
const errorMessage = ref('')
const audioUrl = ref('')

function releaseAudioUrl() {
	if (audioUrl.value) {
		URL.revokeObjectURL(audioUrl.value)
		audioUrl.value = ''
	}
}

async function generateAudio() {
	const normalizedText = text.value.trim()
	if (!normalizedText || isGenerating.value) return

	isGenerating.value = true
	errorMessage.value = ''
	releaseAudioUrl()

	try {
		const response = await fetch('/api/voxcpm-tts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				text: normalizedText,
				control: control.value.trim(),
			}),
		})

		if (!response.ok) {
			let message = `VoxCPM error ${response.status}`
			try {
				const payload = await response.json() as { error?: string }
				if (payload.error) message = payload.error
			} catch {
				// Keep the status-based message.
			}
			throw new Error(message)
		}

		const blob = await response.blob()
		audioUrl.value = URL.createObjectURL(blob)
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'VoxCPM generation failed'
	} finally {
		isGenerating.value = false
	}
}

onBeforeUnmount(() => {
	releaseAudioUrl()
})
</script>

<template>
	<main class="mx-auto max-w-3xl px-6 pb-16 pt-10">
		<section class="py-8">
			<p class="mb-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">VoxCPM Space API</p>
			<h1 class="mb-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
				VoxCPM 語音測試
			</h1>
			<p class="max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
				這個頁面使用 Hugging Face Space 的 VoxCPM API；原本學習頁面的朗讀功能仍使用 Azure TTS。
			</p>
		</section>

		<section class="grid gap-5">
			<label class="grid gap-2">
				<span class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">文字</span>
				<textarea
					v-model="text"
					rows="5"
					class="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base leading-7 text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
				/>
			</label>

			<label class="grid gap-2">
				<span class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">聲音描述</span>
				<input
					v-model="control"
					type="text"
					class="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
				>
			</label>

			<div class="flex flex-wrap items-center gap-3">
				<button
					type="button"
					class="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
					:disabled="isGenerating || !text.trim()"
					@click="generateAudio"
				>
					{{ isGenerating ? '產生中...' : '產生語音' }}
				</button>
				<p v-if="isGenerating" class="text-sm text-zinc-500 dark:text-zinc-400">
					公共 Space 可能需要等待。
				</p>
			</div>

			<p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
				{{ errorMessage }}
			</p>

			<audio v-if="audioUrl" :src="audioUrl" controls class="w-full" />
		</section>
	</main>
</template>
