interface Env {
	SITUATIONS_KV: KVNamespace
	EDITOR_SECRET?: string
	AZURE_SPEECH_KEY?: string
	AZURE_SPEECH_REGION?: string
	CF_IMAGES_ACCOUNT_ID?: string
	CF_IMAGES_API_TOKEN?: string
	AI: {
		run: (model: string, input: unknown) => Promise<any>
	}
}

const KV_KEY = 'questions'

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
			if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) {
				return Response.json({ error: 'Azure TTS not configured' }, { status: 503 })
			}
			const { text, rate } = await request.json() as { text: string; rate?: string }
			if (!text || typeof text !== 'string') {
				return Response.json({ error: 'text required' }, { status: 400 })
			}
			const inner = rate
				? `<prosody rate='${rate}'>${escapeXml(text)}</prosody>`
				: escapeXml(text)
			const ssml = `<speak version='1.0' xml:lang='zh-TW'><voice name='zh-TW-HsiaoChenNeural'>${inner}</voice></speak>`
			const azureRes = await fetch(
				`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
				{
					method: 'POST',
					headers: {
						'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
						'Content-Type': 'application/ssml+xml',
						'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
						'User-Agent': 'learn-zh',
					},
					body: ssml,
				},
			)
			if (!azureRes.ok) {
				const status = azureRes.status === 429 ? 429 : 502
				return Response.json({ error: `Azure TTS error ${azureRes.status}` }, { status })
			}
			const audioBuffer = await azureRes.arrayBuffer()
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

function escapeXml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
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
