interface Env {
	SITUATIONS_KV: KVNamespace
	EDITOR_SECRET?: string
	VOXCPM_SPACE_URL?: string
	CF_IMAGES_ACCOUNT_ID?: string
	CF_IMAGES_API_TOKEN?: string
	AI: {
		run: (model: string, input: unknown) => Promise<any>
	}
}

const KV_KEY = 'questions'
const DEFAULT_VOXCPM_SPACE_URL = 'https://openbmb-voxcpm-demo.hf.space'

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url)

		if (url.pathname === '/api/detect-image-zh') {
			if (request.method === 'OPTIONS') {
				return new Response(null, {
					status: 204,
					headers: {
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': 'POST, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type',
					},
				})
			}

			if (request.method !== 'POST') {
				return Response.json({ error: '只接受 POST 請求' }, { status: 405 })
			}

			try {
				const imageData = await parseImageFromRequest(request)
				if (!imageData || imageData.byteLength === 0) {
					return Response.json({ error: '未收到有效圖片資料' }, { status: 400 })
				}
				if (imageData.byteLength > 2 * 1024 * 1024) {
					return Response.json({ error: '圖片大小不能超過 2MB' }, { status: 413 })
				}

				const englishDescription = await describeImageInEnglish(imageData, env)
				const zhDescription = await translateEnToZh(englishDescription, env)

				return Response.json({
					description: zhDescription,
					descriptionEn: englishDescription,
					descriptionZh: zhDescription,
				})
			} catch (error) {
				const message = error instanceof Error ? error.message : '圖片辨識失敗'
				return Response.json({ error: message }, { status: 500 })
			}
		}

		if (url.pathname === '/api/tts') {
			if (request.method !== 'POST') {
				return Response.json({ error: 'POST only' }, { status: 405 })
			}
			const allowedOrigin = 'https://learn-zh.jim-aca.workers.dev'
			const origin = request.headers.get('Origin') ?? ''
			const referer = request.headers.get('Referer') ?? ''
			if (!origin.startsWith(allowedOrigin) && !referer.startsWith(allowedOrigin)) {
				return Response.json({ error: 'Forbidden' }, { status: 403 })
			}
			const { text, rate, control } = await request.json() as {
				text: string
				rate?: string
				control?: string
			}
			if (!text || typeof text !== 'string') {
				return Response.json({ error: 'text required' }, { status: 400 })
			}
			let audioBuffer: ArrayBuffer
			try {
				audioBuffer = await generateVoxCpmAudio(text, {
					spaceUrl: env.VOXCPM_SPACE_URL,
					control: typeof control === 'string' ? control : controlFromRate(rate),
				})
			} catch (error) {
				const message = error instanceof Error ? error.message : 'VoxCPM TTS failed'
				return Response.json({ error: message }, { status: 502 })
			}
			return new Response(audioBuffer, {
				headers: {
					'Content-Type': 'audio/mpeg',
					'Cache-Control': 'no-store',
				},
			})
		}

		if (url.pathname === '/api/situations/questions') {
			if (request.method === 'GET') {
				const raw = await env.SITUATIONS_KV.get(KV_KEY)
				return new Response(raw ?? '[]', {
					headers: { 'Content-Type': 'application/json' },
				})
			}

			if (request.method === 'POST') {
				const token = (request.headers.get('Authorization') ?? '').replace('Bearer ', '')
				if (!env.EDITOR_SECRET || token !== env.EDITOR_SECRET) {
					return new Response('Unauthorized', { status: 401 })
				}
				const body = await request.text()
				await env.SITUATIONS_KV.put(KV_KEY, body)
				return Response.json({ ok: true })
			}
		}

		if (url.pathname === '/api/upload-image') {
			if (request.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 })
			const token = (request.headers.get('Authorization') ?? '').replace('Bearer ', '')
			if (!env.EDITOR_SECRET || token !== env.EDITOR_SECRET) {
				return new Response('Unauthorized', { status: 401 })
			}
			if (!env.CF_IMAGES_ACCOUNT_ID || !env.CF_IMAGES_API_TOKEN) {
				return Response.json({ error: 'Cloudflare Images not configured' }, { status: 503 })
			}
			const body = await request.formData()
			const file = body.get('file')
			if (!(file instanceof File)) {
				return Response.json({ error: 'file field required' }, { status: 400 })
			}
			const uploadForm = new FormData()
			uploadForm.append('file', file)
			const cfRes = await fetch(
				`https://api.cloudflare.com/client/v4/accounts/${env.CF_IMAGES_ACCOUNT_ID}/images/v1`,
				{ method: 'POST', headers: { Authorization: `Bearer ${env.CF_IMAGES_API_TOKEN}` }, body: uploadForm },
			)
			if (!cfRes.ok) {
				const err = await cfRes.text()
				return Response.json({ error: `CF Images error ${cfRes.status}: ${err}` }, { status: 502 })
			}
			const data = await cfRes.json() as { result?: { variants?: string[] } }
			const imageUrl = data.result?.variants?.[0]
			if (!imageUrl) return Response.json({ error: 'No URL in response' }, { status: 502 })
			return Response.json({ url: imageUrl })
		}

		if (url.pathname.startsWith('/api/')) {
			return Response.json({ name: 'Cloudflare' })
		}

		return new Response(null, { status: 404 })
	},
} satisfies ExportedHandler<Env>

interface VoxCpmOptions {
	spaceUrl?: string
	control?: string
}

interface GradioPredictionResponse {
	event_id?: string
}

interface GradioFileData {
	url?: string
	path?: string
	mime_type?: string
}

async function generateVoxCpmAudio(text: string, options: VoxCpmOptions): Promise<ArrayBuffer> {
	const spaceUrl = normalizeSpaceUrl(options.spaceUrl)
	const eventId = await submitVoxCpmGeneration(spaceUrl, text, options.control ?? '')
	const audioUrl = await waitForVoxCpmAudioUrl(spaceUrl, eventId)
	const audioRes = await fetch(audioUrl)
	if (!audioRes.ok) {
		throw new Error(`VoxCPM audio download failed ${audioRes.status}`)
	}
	return audioRes.arrayBuffer()
}

async function submitVoxCpmGeneration(
	spaceUrl: string,
	text: string,
	control: string,
): Promise<string> {
	const response = await fetch(`${spaceUrl}/gradio_api/call/generate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			data: [
				text,
				control,
				null,
				false,
				'',
				2.0,
				true,
				false,
			],
		}),
	})
	if (!response.ok) {
		throw new Error(`VoxCPM request failed ${response.status}`)
	}
	const payload = await response.json() as GradioPredictionResponse
	if (!payload.event_id) {
		throw new Error('VoxCPM did not return an event id')
	}
	return payload.event_id
}

async function waitForVoxCpmAudioUrl(spaceUrl: string, eventId: string): Promise<string> {
	const response = await fetch(`${spaceUrl}/gradio_api/call/generate/${encodeURIComponent(eventId)}`)
	if (!response.ok) {
		throw new Error(`VoxCPM result polling failed ${response.status}`)
	}

	const streamText = await readLimitedText(response, 256 * 1024)
	const events = streamText.split(/\r?\n\r?\n/)
	for (const event of events) {
		const eventName = event.match(/^event:\s*(.+)$/m)?.[1]?.trim()
		if (eventName === 'error') {
			throw new Error('VoxCPM generation failed')
		}
		if (eventName !== 'complete') continue

		const dataText = event
			.split(/\r?\n/)
			.filter((line) => line.startsWith('data:'))
			.map((line) => line.slice(5).trimStart())
			.join('\n')
		const data = JSON.parse(dataText) as [GradioFileData]
		const file = data[0]
		if (file?.url) {
			return new URL(file.url, spaceUrl).toString()
		}
		if (file?.path) {
			return `${spaceUrl}/gradio_api/file=${file.path}`
		}
	}

	throw new Error('VoxCPM did not return an audio file')
}

async function readLimitedText(response: Response, limit: number): Promise<string> {
	const reader = response.body?.getReader()
	if (!reader) {
		return response.text()
	}
	const chunks: Uint8Array[] = []
	let total = 0
	while (true) {
		const { value, done } = await reader.read()
		if (done) break
		if (!value) continue
		total += value.byteLength
		if (total > limit) {
			throw new Error('VoxCPM response exceeded size limit')
		}
		chunks.push(value)
	}
	const bytes = new Uint8Array(total)
	let offset = 0
	for (const chunk of chunks) {
		bytes.set(chunk, offset)
		offset += chunk.byteLength
	}
	return new TextDecoder().decode(bytes)
}

function normalizeSpaceUrl(spaceUrl?: string): string {
	return (spaceUrl || DEFAULT_VOXCPM_SPACE_URL).replace(/\/+$/, '')
}

function controlFromRate(rate?: string): string {
	if (!rate) return ''
	const value = Number.parseFloat(rate)
	if (Number.isNaN(value)) return ''
	if (value < 0) return 'slow, clear Mandarin pronunciation'
	if (value > 0) return 'natural Mandarin pronunciation with a slightly faster pace'
	return ''
}

interface ImageRequestPayload {
	image: string
}

async function parseImageFromRequest(request: Request): Promise<ArrayBuffer> {
	const contentType = request.headers.get('Content-Type') ?? ''

	if (contentType.includes('multipart/form-data')) {
		const formData = await request.formData()
		const imageFile = formData.get('image')
		if (!(imageFile instanceof File)) {
			throw new Error('請求必須包含 image 檔案欄位')
		}
		return imageFile.arrayBuffer()
	}

	if (contentType.includes('application/json')) {
		const payload = (await request.json()) as ImageRequestPayload
		if (!payload.image || typeof payload.image !== 'string') {
			throw new Error('JSON 請求必須包含 base64 圖片字串')
		}
		const base64 = payload.image.replace(/^data:image\/\w+;base64,/, '')
		return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)).buffer
	}

	if (contentType.includes('image/')) {
		return request.arrayBuffer()
	}

	throw new Error('不支援的 Content-Type，請使用 multipart/form-data 或 application/json')
}

function normalizeQuotedText(text: string): string {
	const normalized = text.trim()
	if (normalized.startsWith('"') && normalized.endsWith('"')) {
		return normalized.slice(1, -1).trim()
	}
	return normalized
}

async function describeImageInEnglish(imageBytes: ArrayBuffer, env: Env): Promise<string> {
	const input = {
		image: [...new Uint8Array(imageBytes)],
		prompt: 'Describe the image in one short, clear English sentence.',
	}
	const aiResponse = await env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', input)
	const description =
		typeof aiResponse?.description === 'string' ? aiResponse.description : JSON.stringify(aiResponse)
	const normalized = normalizeQuotedText(description)
	if (!normalized) {
		throw new Error('AI 回傳空白描述')
	}
	return normalized
}

async function translateEnToZh(text: string, env: Env): Promise<string> {
	try {
		const translated = await env.AI.run('@cf/meta/m2m100-1.2b', {
			text,
			source_lang: 'en',
			target_lang: 'zh',
		})
		const zhText =
			typeof translated?.translated_text === 'string'
				? translated.translated_text
				: typeof translated?.translation === 'string'
					? translated.translation
					: ''
		return zhText.trim() || text
	} catch {
		return text
	}
}
