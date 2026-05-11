<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

// Taiwan island outline from potrace SVG; applied with transform="translate(0,1280) scale(0.1,-0.1)"
const TAIWAN_OUTLINE_PATH = `M7600 12779 c-45 -13 -79 -17 -112 -13 -44 6 -53 3 -125 -42 -126 -78 -191 -139 -208 -196 -8 -30 -46 -93 -97 -162 l-83 -114 -150 -46 c-226 -68 -270 -78 -390 -85 l-110 -7 -120 -66 c-66 -37 -181 -89 -255 -117 -74 -27 -161 -61 -194 -74 l-59 -24 -89 -159 c-49 -88 -158 -263 -244 -389 l-155 -231 -8 -128 c-8 -123 -10 -129 -38 -157 -16 -16 -56 -41 -88 -54 -36 -15 -59 -30 -57 -37 12 -45 13 -82 2 -108 -20 -47 -61 -63 -170 -66 -109 -4 -120 -11 -142 -99 -16 -66 -40 -92 -106 -112 -71 -23 -101 -62 -171 -231 -29 -70 -85 -186 -124 -259 -61 -114 -87 -150 -195 -270 -113 -126 -129 -148 -179 -253 -35 -75 -69 -131 -97 -160 -40 -41 -44 -50 -50 -111 -10 -110 -30 -158 -93 -231 -32 -36 -69 -82 -83 -102 -14 -19 -36 -41 -50 -48 -32 -16 -40 -28 -40 -55 -1 -110 -153 -326 -326 -464 -36 -29 -64 -59 -64 -69 0 -36 -58 -247 -80 -291 -14 -27 -91 -112 -205 -224 -178 -176 -183 -183 -262 -320 -120 -208 -119 -206 -126 -323 -5 -79 -13 -123 -37 -190 -62 -173 -64 -182 -50 -232 18 -63 15 -81 -25 -147 -19 -32 -35 -67 -35 -78 0 -11 16 -33 36 -50 32 -27 36 -37 45 -105 19 -143 -2 -303 -71 -550 -65 -234 -95 -322 -124 -369 -29 -45 -62 -140 -72 -207 l-7 -46 31 7 c18 3 36 4 42 0 17 -11 -16 -60 -69 -100 -27 -21 -52 -47 -55 -59 -3 -12 -6 -58 -6 -104 0 -75 2 -85 25 -107 14 -15 36 -25 52 -25 48 -1 110 -36 233 -135 66 -53 122 -100 125 -105 3 -5 7 -58 9 -117 4 -123 22 -182 81 -258 34 -45 35 -48 29 -113 -8 -89 5 -133 70 -231 55 -82 105 -190 128 -274 10 -38 10 -55 -1 -89 -19 -62 -17 -79 20 -172 42 -108 90 -179 159 -235 47 -38 55 -49 53 -75 -2 -28 -1 -28 5 -7 7 24 9 24 47 -24 138 -169 137 -168 251 -229 60 -32 168 -97 239 -145 72 -47 151 -93 176 -102 26 -9 80 -34 120 -54 194 -97 300 -222 349 -412 18 -69 27 -87 69 -130 53 -55 69 -90 127 -282 47 -153 84 -316 84 -370 0 -40 -4 -47 -55 -94 -71 -65 -72 -84 -4 -157 28 -30 54 -64 59 -76 4 -11 4 -54 -1 -95 -13 -115 -14 -109 31 -109 35 0 40 3 40 24 0 35 41 88 75 98 45 12 81 1 175 -52 86 -49 165 -79 176 -67 4 4 -1 33 -10 65 -30 108 -19 146 71 237 61 63 105 132 124 195 9 30 8 47 -5 86 -34 103 -46 197 -36 286 5 45 14 156 19 244 9 156 9 163 -12 205 -17 35 -22 61 -22 124 1 79 2 83 87 270 47 105 129 293 182 418 114 272 115 274 156 312 18 17 41 42 51 57 18 25 19 29 4 57 -18 36 -20 91 -2 113 6 9 91 62 187 119 320 187 373 228 413 319 11 25 31 59 43 76 30 38 30 49 -1 99 -14 22 -25 47 -25 56 0 23 47 62 111 92 82 39 142 109 199 231 27 56 88 163 135 237 95 147 153 255 179 337 18 53 56 88 126 119 l25 10 -6 109 c-10 152 2 245 35 289 15 19 31 35 37 35 5 0 9 5 9 10 0 18 97 206 140 272 24 38 56 112 84 197 72 216 86 284 96 436 8 145 18 187 72 305 26 59 29 71 23 132 -6 62 -5 71 33 155 30 68 40 105 45 163 3 49 20 121 46 200 84 260 148 507 181 695 19 109 26 133 45 148 55 42 52 138 -6 205 -33 37 -34 43 -16 128 17 79 35 105 105 152 l57 38 -3 111 c-3 87 0 117 12 142 9 17 58 64 110 105 181 145 286 296 286 415 0 90 17 168 43 203 14 18 27 53 30 77 3 27 17 57 36 81 17 22 31 48 31 60 0 11 17 39 39 63 52 57 61 77 61 134 0 66 29 113 70 113 42 0 54 28 46 107 -10 98 -42 242 -66 298 -35 81 -70 214 -70 264 0 32 -10 67 -31 111 -30 60 -31 68 -26 147 16 219 91 375 271 557 50 51 118 110 150 132 50 33 67 39 113 39 63 0 67 7 61 100 -1 30 1 55 6 55 5 0 7 3 3 6 -3 3 -12 2 -19 -2 -7 -5 -24 -8 -38 -7 l-25 2 25 -7 c18 -6 21 -10 12 -16 -13 -8 -41 10 -69 44 -7 8 -31 49 -53 92 l-40 76 0 132 0 132 -27 -7 c-159 -40 -361 -46 -490 -15 -126 30 -195 70 -301 174 -52 50 -125 121 -163 158 -59 58 -70 74 -75 111 l-6 44 -104 51 c-57 29 -108 52 -112 51 -4 0 -36 -9 -72 -20z`

// Screen coords: x = (lon − 120.0) × 326 + 192,  y = (25.3 − lat) × 353 + 2
interface Station {
	id: string
	name: string
	x: number
	y: number
}

const STATIONS: Station[] = [
	// Western trunk N → S
	{ id: 'keelung',    name: '基隆',   x: 759, y:  62 },
	{ id: 'xizhi',      name: '汐止',   x: 733, y:  83 },
	{ id: 'nangang',    name: '南港',   x: 717, y:  87 },
	{ id: 'songshan',   name: '松山',   x: 703, y:  90 },
	{ id: 'taipei',     name: '臺北',   x: 688, y:  90 },
	{ id: 'wanhua',     name: '萬華',   x: 681, y:  97 },
	{ id: 'banqiao',    name: '板橋',   x: 668, y: 104 },
	{ id: 'shulin',     name: '樹林',   x: 652, y: 115 },
	{ id: 'yingge',     name: '鶯歌',   x: 629, y: 126 },
	{ id: 'taoyuan',    name: '桃園',   x: 619, y: 111 },
	{ id: 'zhongli',    name: '中壢',   x: 590, y: 126 },
	{ id: 'yangmei',    name: '楊梅',   x: 560, y: 139 },
	{ id: 'hsinchu',    name: '新竹',   x: 508, y: 178 },
	{ id: 'liujia',     name: '六家',   x: 521, y: 164 },
	{ id: 'zhunan',     name: '竹南',   x: 482, y: 221 },
	{ id: 'miaoli',     name: '苗栗',   x: 459, y: 263 },
	{ id: 'dajia',      name: '大甲',   x: 394, y: 337 },
	{ id: 'fengyuan',   name: '豐原',   x: 427, y: 373 },
	{ id: 'taichung',   name: '臺中',   x: 414, y: 411 },
	{ id: 'wuri',       name: '烏日',   x: 407, y: 426 },
	{ id: 'changhua',   name: '彰化',   x: 368, y: 433 },
	{ id: 'yuanlin',    name: '員林',   x: 381, y: 475 },
	{ id: 'tianzhong',  name: '田中',   x: 378, y: 510 },
	{ id: 'douliu',     name: '斗六',   x: 368, y: 563 },
	{ id: 'chiayi',     name: '嘉義',   x: 332, y: 644 },
	{ id: 'xinying',    name: '新營',   x: 293, y: 708 },
	{ id: 'tainan',     name: '臺南',   x: 261, y: 817 },
	{ id: 'shalun',     name: '沙崙',   x: 244, y: 810 },
	{ id: 'gangshan',   name: '岡山',   x: 290, y: 884 },
	{ id: 'xinzuoying', name: '新左營', x: 303, y: 923 },
	{ id: 'kaohsiung',  name: '高雄',   x: 290, y: 941 },
	{ id: 'fengshan',   name: '鳳山',   x: 309, y: 944 },
	{ id: 'pingtung',   name: '屏東',   x: 348, y: 930 },
	{ id: 'chaozhou',   name: '潮州',   x: 365, y: 973 },
	{ id: 'fangliao',   name: '枋寮',   x: 388, y: 1036 },
	// South Link Line (南迴線)
	{ id: 'fangshan',   name: '枋山',   x: 402, y: 1069 },
	{ id: 'taimali',    name: '太麻里', x: 532, y:  954 },
	{ id: 'zhiben',     name: '知本',   x: 519, y:  919 },
	// Yilan line
	{ id: 'ruifang',    name: '瑞芳',   x: 779, y:  69 },
	{ id: 'toucheng',   name: '頭城',   x: 792, y: 154 },
	{ id: 'yilan',      name: '宜蘭',   x: 763, y: 196 },
	{ id: 'luodong',    name: '羅東',   x: 769, y: 221 },
	{ id: 'suao',       name: '蘇澳',   x: 792, y: 249 },
	// East coast (花東線)
	{ id: 'hualien',    name: '花蓮',   x: 717, y: 471 },
	{ id: 'guangfu',    name: '光復',   x: 661, y: 559 },
	{ id: 'ruisui',     name: '瑞穗',   x: 665, y: 637 },
	{ id: 'yuli',       name: '玉里',   x: 619, y: 694 },
	{ id: 'chishang',   name: '池上',   x: 590, y: 775 },
	{ id: 'guanshan',   name: '關山',   x: 573, y: 796 },
	{ id: 'luye',       name: '鹿野',   x: 564, y: 845 },
	{ id: 'taitung',    name: '臺東',   x: 567, y: 902 },
]

// Ordered station IDs per route — used to compute neighbor context
const ROUTE_SEQUENCES: string[][] = [
	// 西部幹線
	['keelung','xizhi','nangang','songshan','taipei','wanhua','banqiao','shulin','yingge','taoyuan','zhongli','yangmei','hsinchu','zhunan','miaoli','dajia','fengyuan','taichung','wuri','changhua','yuanlin','tianzhong','douliu','chiayi','xinying','tainan','gangshan','xinzuoying','kaohsiung','fengshan','pingtung','chaozhou','fangliao'],
	// 六家支線
	['hsinchu','liujia'],
	// 沙崙支線
	['tainan','shalun'],
	// 宜蘭線 + 北迴線 + 花東線
	['nangang','ruifang','toucheng','yilan','luodong','suao','hualien','guangfu','ruisui','yuli','chishang','guanshan','luye','taitung'],
	// 南迴線
	['fangliao','fangshan','taimali','zhiben','taitung'],
]

// Full loop route pools — 3 rounds of 20 covers every station at least once
// 南下順時針：西部幹線南下 → 南迴線 → 花東線+宜蘭線北上 → 回板橋（43 站）
const SOUTH_ROUTE_FULL = [
	'banqiao','shulin','yingge','taoyuan','zhongli','yangmei','hsinchu','zhunan','miaoli',
	'dajia','fengyuan','taichung','wuri','changhua','yuanlin','tianzhong','douliu','chiayi',
	'xinying','tainan','gangshan','xinzuoying','kaohsiung','fengshan','pingtung','chaozhou',
	'fangliao','fangshan','taimali','zhiben','taitung','luye','guanshan','chishang','yuli',
	'ruisui','guangfu','hualien','suao','luodong','yilan','toucheng','ruifang',
]
// 北上逆時針：宜蘭線東行 → 花東線南下 → 南迴線 → 西部幹線北上 → 回板橋（49 站）
const NORTH_ROUTE_FULL = [
	'banqiao','wanhua','taipei','songshan','nangang','xizhi','keelung','ruifang','toucheng',
	'yilan','luodong','suao','hualien','guangfu','ruisui','yuli','chishang','guanshan','luye',
	'taitung','zhiben','taimali','fangshan','fangliao','chaozhou','pingtung','fengshan',
	'kaohsiung','xinzuoying','gangshan','tainan','xinying','chiayi','douliu','tianzhong',
	'yuanlin','changhua','wuri','taichung','fengyuan','dajia','miaoli','zhunan','hsinchu',
	'yangmei','zhongli','taoyuan','yingge','shulin',
]

// Union of both routes — 49 unique stations (north adds: wanhua, taipei, songshan, nangang, xizhi, keelung)
const ALL_ROUTE_STATIONS = [...new Set([...SOUTH_ROUTE_FULL, ...NORTH_ROUTE_FULL])]

// Station sets for the three mandatory lines
const SOUTH_LINK_IDS = new Set(['fangshan', 'taimali', 'zhiben'])
const EAST_LINE_IDS  = new Set(['ruifang', 'toucheng', 'yilan', 'luodong', 'suao', 'hualien', 'guangfu', 'ruisui', 'yuli', 'chishang', 'guanshan', 'luye', 'taitung'])

// ── 軌道路徑（含彎道中間點） ───────────────────────────────
// SVG coords match polyline points exactly; non-station points are track curves.
// Each path is a closed loop starting and ending at 板橋 (668,104).
type Pt = [number, number]

// 南下順時針：西部幹線南下 → 南迴線 → 花東線北上 → 宜蘭線 → 北迴線 → 西部幹線回板橋
const SOUTH_PATH: Pt[] = [
	[668,104],[652,115],[629,126],[619,111],[590,126],[560,139],[508,178],[482,221],[459,263],
	[394,337],[427,373],[414,411],[407,426],[368,433],[381,475],[378,510],[368,563],[332,644],
	[293,708],[261,817],[290,884],[303,923],[290,941],[309,944],[348,930],[365,973],[388,1036],
	[402,1069],[450,1100],[492,1102],[530,1050],[532,954],[519,919],[567,902],
	[564,845],[573,796],[590,775],[619,694],[665,637],[661,559],[717,471],
	[792,249],[769,221],[763,196],[792,154],[779,69],
	[717,87],[703,90],[688,90],[681,97],[668,104],
]
const SOUTH_PATH_INDEX: Record<string, number> = {
	banqiao:0,shulin:1,yingge:2,taoyuan:3,zhongli:4,yangmei:5,hsinchu:6,zhunan:7,miaoli:8,
	dajia:9,fengyuan:10,taichung:11,wuri:12,changhua:13,yuanlin:14,tianzhong:15,douliu:16,
	chiayi:17,xinying:18,tainan:19,gangshan:20,xinzuoying:21,kaohsiung:22,fengshan:23,
	pingtung:24,chaozhou:25,fangliao:26,fangshan:27,
	// 28–30: south-link curve waypoints
	taimali:31,zhiben:32,taitung:33,
	luye:34,guanshan:35,chishang:36,yuli:37,ruisui:38,guangfu:39,hualien:40,
	suao:41,luodong:42,yilan:43,toucheng:44,ruifang:45,
	// 46–49: return segment (nangang→songshan→taipei→wanhua); 50: banqiao
}

// 北上逆時針：西部幹線北上 → 宜蘭線 → 北迴線 → 花東線南下 → 南迴線 → 西部幹線回板橋
const NORTH_PATH: Pt[] = [
	[668,104],[681,97],[688,90],[703,90],[717,87],[733,83],[759,62],
	[779,69],[792,154],[763,196],[769,221],[792,249],[717,471],
	[661,559],[665,637],[619,694],[590,775],[573,796],[564,845],[567,902],
	[519,919],[532,954],[530,1050],[492,1102],[450,1100],[402,1069],[388,1036],
	[365,973],[348,930],[309,944],[290,941],[303,923],[290,884],[261,817],
	[293,708],[332,644],[368,563],[378,510],[381,475],[368,433],[407,426],
	[414,411],[427,373],[394,337],[459,263],[482,221],[508,178],[560,139],
	[590,126],[619,111],[629,126],[652,115],[668,104],
]
const NORTH_PATH_INDEX: Record<string, number> = {
	banqiao:0,wanhua:1,taipei:2,songshan:3,nangang:4,xizhi:5,keelung:6,
	ruifang:7,toucheng:8,yilan:9,luodong:10,suao:11,hualien:12,
	guangfu:13,ruisui:14,yuli:15,chishang:16,guanshan:17,luye:18,taitung:19,
	zhiben:20,taimali:21,
	// 22–24: south-link reverse curve waypoints
	fangshan:25,fangliao:26,
	chaozhou:27,pingtung:28,fengshan:29,kaohsiung:30,xinzuoying:31,gangshan:32,
	tainan:33,xinying:34,chiayi:35,douliu:36,tianzhong:37,yuanlin:38,changhua:39,
	wuri:40,taichung:41,fengyuan:42,dajia:43,miaoli:44,zhunan:45,hsinchu:46,
	yangmei:47,zhongli:48,taoyuan:49,yingge:50,shulin:51,
	// 52: banqiao return
}

// Azure TTS via /api/tts Cloudflare Worker proxy
let currentAudio: HTMLAudioElement | null = null

function stopAudio() {
	if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null }
}

async function azureTts(text: string): Promise<void> {
	stopAudio()
	try {
		const res = await fetch('/api/tts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text }),
		})
		if (!res.ok) return
		const blob = await res.blob()
		const url = URL.createObjectURL(blob)
		await new Promise<void>((resolve) => {
			const audio = new Audio(url)
			currentAudio = audio
			audio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; resolve() }
			audio.onerror = () => { URL.revokeObjectURL(url); currentAudio = null; resolve() }
			audio.play().catch(() => { URL.revokeObjectURL(url); currentAudio = null; resolve() })
		})
	} catch { /* silently ignore */ }
}

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr]
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[a[i], a[j]] = [a[j]!, a[i]!]
	}
	return a
}

interface HistoryEntry {
	no: number
	correctName: string
	selectedName: string
	wasCorrect: boolean
}

const ROUND_SIZE = 10

// Direction, coverage tracking, and journey state
const direction = ref<'south' | 'north'>('south')
const seen = ref(new Set<string>())  // shared across both directions
const currentJourney = ref<string[]>(SOUTH_ROUTE_FULL.slice(0, ROUND_SIZE))
const stopIndex = ref(0)
const trainAnimating = ref(false)
const trainX = ref(668) // 板橋 x
const trainY = ref(104) // 板橋 y

let animFrame: number | null = null
let autoAdvanceTimer: number | null = null

// Animate train along a multi-point path; speed is constant in SVG units.
function animateTrainAlongPath(waypoints: Pt[], done: () => void, dur = 700) {
	if (animFrame !== null) { cancelAnimationFrame(animFrame); animFrame = null }
	if (waypoints.length === 0) { done(); return }
	trainAnimating.value = true
	const pts: Pt[] = [[trainX.value, trainY.value], ...waypoints]
	// Pre-compute cumulative distances
	const cum: number[] = [0]
	for (let i = 1; i < pts.length; i++) {
		cum.push(cum[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]))
	}
	const totalLen = cum[cum.length - 1]!
	const t0 = performance.now()
	function step(now: number) {
		const p = Math.min((now - t0) / dur, 1)
		const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p
		const target = e * totalLen
		let x = pts[pts.length - 1]![0], y = pts[pts.length - 1]![1]
		for (let i = 1; i < pts.length; i++) {
			if (cum[i]! >= target) {
				const segLen = cum[i]! - cum[i - 1]!
				const t = segLen > 0 ? (target - cum[i - 1]!) / segLen : 0
				x = pts[i - 1]![0] + (pts[i]![0] - pts[i - 1]![0]) * t
				y = pts[i - 1]![1] + (pts[i]![1] - pts[i - 1]![1]) * t
				break
			}
		}
		trainX.value = x; trainY.value = y
		if (p < 1) { animFrame = requestAnimationFrame(step) }
		else {
			trainX.value = pts[pts.length - 1]![0]; trainY.value = pts[pts.length - 1]![1]
			trainAnimating.value = false; done()
		}
	}
	animFrame = requestAnimationFrame(step)
}

// Returns track waypoints from fromId to toId in route order (excl. start, incl. end).
function getPathWaypoints(fromId: string, toId: string): Pt[] {
	const path = direction.value === 'south' ? SOUTH_PATH : NORTH_PATH
	const idx  = direction.value === 'south' ? SOUTH_PATH_INDEX : NORTH_PATH_INDEX
	const fi = idx[fromId] ?? -1
	const ti = idx[toId]   ?? -1
	if (fi >= 0 && ti > fi) return path.slice(fi + 1, ti + 1)
	const dest = STATIONS.find(s => s.id === toId)
	return dest ? [[dest.x, dest.y]] : []
}

// Returns track waypoints from current station back to 板橋 along the loop.
function getReturnPathWaypoints(): Pt[] {
	const path = direction.value === 'south' ? SOUTH_PATH : NORTH_PATH
	const idx  = direction.value === 'south' ? SOUTH_PATH_INDEX : NORTH_PATH_INDEX
	const fromId = currentJourney.value[stopIndex.value] ?? 'banqiao'
	const fi = idx[fromId] ?? -1
	if (fi < 0 || fi >= path.length - 1) return [[668, 104]]
	return path.slice(fi + 1)
}

function getFullRoute() {
	return direction.value === 'south' ? SOUTH_ROUTE_FULL : NORTH_ROUTE_FULL
}

// Per game: 板橋(1) + 南迴線(1) + 東部幹線(4) + 西部幹線(4) = 10
// Coverage: south route 26 western stations ÷ 4/game → all seen within 7 games.
// Shared seen resets after all 49 unique stations across both directions seen.
function pickJourney(): string[] {
	const fullRoute = getFullRoute()
	if (seen.value.size >= ALL_ROUTE_STATIONS.length) seen.value.clear()
	const rest = fullRoute.slice(1) // banqiao handled separately

	// Pick n stations from pool in route order, prioritising unseen then random seen
	function pickNFrom(pool: string[], n: number): string[] {
		if (pool.length === 0) return []
		const unseen = pool.filter(id => !seen.value.has(id))
		if (unseen.length >= n) return unseen.slice(0, n)
		const seenPool = shuffle(pool.filter(id => seen.value.has(id))).slice(0, n - unseen.length)
		const picked = new Set([...unseen, ...seenPool])
		return pool.filter(id => picked.has(id))
	}

	const southPicks = pickNFrom(rest.filter(id => SOUTH_LINK_IDS.has(id)), 1)
	const eastPicks  = pickNFrom(rest.filter(id => EAST_LINE_IDS.has(id)),  4)
	const westPicks  = pickNFrom(rest.filter(id => !SOUTH_LINK_IDS.has(id) && !EAST_LINE_IDS.has(id)), 4)

	const pickSet = new Set([...southPicks, ...eastPicks, ...westPicks])
	return ['banqiao', ...rest.filter(id => pickSet.has(id))]
}

function buildStop(idx: number) {
	const id = currentJourney.value[idx]!
	const correct = STATIONS.find(s => s.id === id)!
	seen.value.add(id)
	const others = shuffle(STATIONS.filter(s => s.id !== correct.id)).slice(0, 3)
	return { correct, choices: shuffle([correct, ...others]) }
}

const question = ref(buildStop(0))
const selected = ref<Station | null>(null)
const score = ref(0)
const streak = ref(0)
const totalAnswered = ref(0)
const showReward = ref(false)
const history = ref<HistoryEntry[]>([])
const roundComplete = ref(false)
const showMap = ref(false)
const timerEnabled = ref(false)
let timerStart: number | null = null
const elapsedSeconds = ref(0)

const stationContext = computed(() => {
	const id = question.value.correct.id
	for (const seq of ROUTE_SEQUENCES) {
		const idx = seq.indexOf(id)
		if (idx === -1) continue
		const start = Math.max(0, idx - 2)
		const end = Math.min(seq.length - 1, idx + 2)
		return seq.slice(start, end + 1).map(sid => ({
			station: STATIONS.find(s => s.id === sid)!,
			isQuestion: sid === id,
		}))
	}
	return [{ station: question.value.correct, isQuestion: true }]
})

const contextLineColor = computed(() => {
	const id = question.value.correct.id
	for (let ri = 0; ri < ROUTE_SEQUENCES.length; ri++) {
		if (ROUTE_SEQUENCES[ri]!.includes(id)) {
			if (ri === 3) return '#10b981'
			if (ri === 4) return '#f97316'
			return '#3b82f6'
		}
	}
	return '#3b82f6'
})

const speakingId = ref<string | null>(null)
const listening = ref(false)
const srSupported = ref(false)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any
let recognition: SR = null

function stopListening() {
	if (recognition) { recognition.abort(); recognition = null }
	listening.value = false
}

function startListening() {
	if (selected.value !== null || trainAnimating.value) return
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const SRClass = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
	if (!SRClass) return
	stopAudio()
	speakingId.value = null
	stopListening()
	recognition = new SRClass()
	recognition.lang = 'zh-TW'
	recognition.interimResults = false
	recognition.maxAlternatives = 5
	recognition.onstart = () => { listening.value = true }
	recognition.onresult = (event: SR) => {
		listening.value = false
		for (let i = 0; i < event.results[0].length; i++) {
			const spoken: string = event.results[0][i].transcript.trim()
			const match = question.value.choices.find(s =>
				s.name.includes(spoken) || spoken.includes(s.name)
			)
			if (match) { choose(match); return }
		}
	}
	recognition.onerror = () => { listening.value = false }
	recognition.onend = () => { listening.value = false }
	recognition.start()
}

const voiceEnabled = ref(false)
const voiceInput = ref(false)

async function speakText(text: string) {
	await azureTts(text)
}

async function speak() {
	speakingId.value = null
	for (const station of question.value.choices) {
		speakingId.value = station.id
		await azureTts(station.name)
	}
	speakingId.value = null
}

function choose(station: Station) {
	if (selected.value !== null || roundComplete.value || trainAnimating.value) return
	selected.value = station
	totalAnswered.value++
	if (timerEnabled.value && totalAnswered.value === 1) timerStart = Date.now()
	const wasCorrect = station.id === question.value.correct.id
	history.value.push({ no: history.value.length + 1, correctName: question.value.correct.name, selectedName: station.name, wasCorrect })
	if (timerEnabled.value && history.value.length === ROUND_SIZE && timerStart !== null) {
		elapsedSeconds.value = Math.round((Date.now() - timerStart) / 1000)
	}
	if (wasCorrect) {
		score.value++
		streak.value++
		speakText('答對了')
		if (streak.value > 0 && streak.value % 5 === 0) {
			showReward.value = true
		} else {
			autoAdvanceTimer = window.setTimeout(() => { autoAdvanceTimer = null; next() }, 700)
		}
	} else {
		streak.value = 0
		speakText('答錯了')
	}
}

function next() {
	if (history.value.length >= ROUND_SIZE) {
		const waypoints = getReturnPathWaypoints()
		// Duration proportional to path length, 1.5 ms/unit, capped at 5 s
		let len = 0
		let [px, py]: Pt = [trainX.value, trainY.value]
		for (const [x, y] of waypoints) { len += Math.hypot(x - px, y - py); px = x; py = y }
		animateTrainAlongPath(waypoints, () => { roundComplete.value = true }, Math.max(700, Math.min(len * 1.5, 5000)))
		return
	}
	const nextIdx = stopIndex.value + 1
	const waypoints = getPathWaypoints(currentJourney.value[stopIndex.value]!, currentJourney.value[nextIdx]!)
	animateTrainAlongPath(waypoints, () => {
		stopIndex.value = nextIdx
		question.value = buildStop(nextIdx)
		selected.value = null
		if (voiceEnabled.value) nextTick(() => speak())
	})
}

function dismissReward() { showReward.value = false; next() }

function resetGame() {
	if (animFrame !== null) { cancelAnimationFrame(animFrame); animFrame = null }
	if (autoAdvanceTimer !== null) { window.clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null }
	score.value = 0; streak.value = 0
	totalAnswered.value = 0; selected.value = null
	history.value = []; roundComplete.value = false
	trainAnimating.value = false
	timerStart = null; elapsedSeconds.value = 0
	const picked = pickJourney()
	currentJourney.value = picked
	const first = STATIONS.find(s => s.id === picked[0])!
	trainX.value = first.x; trainY.value = first.y
	stopIndex.value = 0
	question.value = buildStop(0)
	if (voiceEnabled.value) nextTick(() => speak())
}

watch(direction, (val) => {
	if (history.value.length === 0) {
		const picked = pickJourney()
		currentJourney.value = picked
		const first = STATIONS.find(s => s.id === picked[0])!
		trainX.value = first.x; trainY.value = first.y
		stopIndex.value = 0
		question.value = buildStop(0)
	}
	const msg = val === 'south' ? '這裡是一號月台，我們是南下列車' : '這裡是二號月台，我們是北上列車'
	azureTts(msg)
})

onMounted(() => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	srSupported.value = !!((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
	azureTts('這裡是一號月台，我們是南下列車')
})
onBeforeUnmount(() => {
	if (animFrame !== null) { cancelAnimationFrame(animFrame); animFrame = null }
	if (autoAdvanceTimer !== null) { window.clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null }
	stopListening(); stopAudio()
})
</script>

<template>
	<div class="mx-auto max-w-lg px-4 pb-16 pt-8 text-center">
		<h1 class="mb-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">🚆 台灣火車站測驗</h1>
		<p class="mb-5 text-base text-zinc-600 opacity-80 dark:text-zinc-400">🚂 從板橋出發，停在哪一站？</p>

		<!-- Direction selector -->
		<div class="mb-4 flex justify-center gap-6 text-sm text-zinc-700 dark:text-zinc-300">
			<label
				class="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 transition"
				:class="direction === 'south' ? 'bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'hover:opacity-70'"
			>
				<input
					type="radio"
					v-model="direction"
					value="south"
					class="accent-blue-500"
					:disabled="history.length > 0"
				/>
				🚂 南下
			</label>
			<label
				class="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 transition"
				:class="direction === 'north' ? 'bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'hover:opacity-70'"
			>
				<input
					type="radio"
					v-model="direction"
					value="north"
					class="accent-emerald-500"
					:disabled="history.length > 0"
				/>
				🚂 北上
			</label>
		</div>

		<div class="mb-4 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
			<label class="flex cursor-pointer items-center gap-1.5">
				<input type="checkbox" v-model="voiceEnabled" class="accent-emerald-500" />
				🔊 語音播放
			</label>
			<label class="flex cursor-pointer items-center gap-1.5">
				<input type="checkbox" v-model="voiceInput" class="accent-violet-500" />
				🎤 語音輸入
			</label>
			<label class="flex cursor-pointer items-center gap-1.5">
				<input type="checkbox" v-model="timerEnabled" class="accent-amber-500" />
				⏱️ 計算秒數
			</label>
		</div>
		<p v-if="voiceInput" class="mb-3 text-xs text-zinc-400 dark:text-zinc-500">建議使用 Chrome / Edge 瀏覽器</p>

		<div class="mb-3 flex flex-wrap justify-center gap-5 text-sm text-zinc-700 dark:text-zinc-300">
			<span>得分：<strong>{{ score }}</strong></span>
			<span>連續答對：<strong>{{ streak }}</strong></span>
			<span>第 <strong>{{ Math.min(history.length + 1, ROUND_SIZE) }}</strong> / {{ ROUND_SIZE }} 站</span>
		</div>

		<div class="mb-5 flex flex-wrap justify-center gap-1.5">
			<span
				v-for="i in ROUND_SIZE"
				:key="i"
				class="h-3 w-3 rounded-full transition-colors duration-300"
				:class="{
					'bg-emerald-500': history[i - 1]?.wasCorrect === true,
					'bg-red-400': history[i - 1]?.wasCorrect === false,
					'bg-stone-300 dark:bg-zinc-600': history[i - 1] === undefined,
				}"
			/>
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

		<!-- Round complete overlay -->
		<div v-if="roundComplete" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/55">
			<div class="flex w-[92%] max-w-sm flex-col rounded-3xl bg-white p-8 text-center dark:bg-zinc-900" @click.stop>
				<div class="mb-2 text-5xl">🏆</div>
				<h2 class="mb-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">列車已抵達終點！</h2>
				<p class="mb-0.5 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{{ score }} / {{ ROUND_SIZE }}</p>
				<p class="text-sm text-zinc-500 dark:text-zinc-400" :class="timerEnabled && elapsedSeconds > 0 ? 'mb-1' : 'mb-4'">正確率 {{ Math.round(score / ROUND_SIZE * 100) }}%</p>
				<p v-if="timerEnabled && elapsedSeconds > 0" class="mb-4 text-sm font-semibold text-amber-600 dark:text-amber-400">⏱️ 完成時間：{{ elapsedSeconds }} 秒</p>
				<div class="mb-5 max-h-64 overflow-y-auto rounded-2xl border border-stone-200 text-left dark:border-zinc-700">
					<div
						v-for="entry in history"
						:key="entry.no"
						class="flex items-baseline gap-2 border-b border-stone-100 px-3 py-2 text-sm last:border-b-0 dark:border-zinc-800"
						:class="entry.wasCorrect ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'bg-red-50/50 dark:bg-red-950/20'"
					>
						<span class="shrink-0">{{ entry.wasCorrect ? '✅' : '❌' }}</span>
						<span class="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">第{{ entry.no }}站</span>
						<span class="font-medium text-zinc-700 dark:text-zinc-200">{{ entry.correctName }}</span>
						<span v-if="!entry.wasCorrect" class="ml-auto shrink-0 text-xs text-red-500">你答：{{ entry.selectedName }}</span>
					</div>
				</div>
				<button type="button" class="cursor-pointer rounded-xl border-0 bg-emerald-500 px-7 py-2.5 text-base font-semibold text-white transition hover:opacity-90" @click="resetGame">再出發</button>
			</div>
		</div>

		<div class="rounded-2xl border border-stone-200 bg-white/80 px-4 py-6 dark:border-zinc-700 dark:bg-zinc-900/80">
			<!--
				viewBox maps to the screen-space after transform="translate(0,1280) scale(0.1,-0.1)".
				Station x/y are screen coords: x=(lon-120)×326+192, y=(25.3-lat)×353+2
			-->
			<svg
				viewBox="185 0 700 1180"
				class="mx-auto mb-3 w-full max-w-xs"
				xmlns="http://www.w3.org/2000/svg"
				aria-label="台灣鐵路路線圖"
			>
				<!-- Taiwan island outline (potrace vector, data-space path transformed to screen) -->
				<g transform="translate(0,1280) scale(0.1,-0.1)">
					<path
						:d="TAIWAN_OUTLINE_PATH"
						stroke-width="15"
						class="fill-stone-100 stroke-stone-300 dark:fill-zinc-800 dark:stroke-zinc-600"
					/>
				</g>

				<!-- Western trunk (西部幹線) -->
				<polyline
					points="759,62 733,83 717,87 703,90 688,90 681,97 668,104 652,115 629,126 619,111 590,126 560,139 508,178 482,221 459,263 394,337 427,373 414,411 407,426 368,433 381,475 378,510 368,563 332,644 293,708 261,817 290,884 303,923 290,941 309,944 348,930 365,973 388,1036"
					fill="none" stroke="#3b82f6" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"
				/>
				<!-- 六家 branch -->
				<line x1="508" y1="178" x2="521" y2="164" stroke="#3b82f6" stroke-width="3.5" stroke-dasharray="8 5" />
				<!-- 沙崙 branch -->
				<line x1="261" y1="817" x2="244" y2="810" stroke="#3b82f6" stroke-width="3.5" stroke-dasharray="8 5" />

				<!-- Yilan line + North-link (宜蘭線 + 北迴線) -->
				<polyline
					points="717,87 779,69 792,154 763,196 769,221 792,249 717,471"
					fill="none" stroke="#10b981" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"
				/>
				<!-- East coast (花東線) -->
				<polyline
					points="717,471 661,559 665,637 619,694 590,775 573,796 564,845 567,902"
					fill="none" stroke="#10b981" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"
				/>
				<!-- South-link (南迴線): 枋寮 → 臺東 -->
				<polyline
					points="388,1036 402,1069 450,1100 492,1102 530,1050 532,954 519,919 567,902"
					fill="none" stroke="#f59e0b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="10 6"
				/>

				<!-- All station dots -->
				<circle
					v-for="s in STATIONS"
					:key="s.id"
					:cx="s.x" :cy="s.y"
					:r="s.id === question.correct.id ? 7 : 5"
					:fill="selected !== null && s.id === question.correct.id ? '#10b981' : s.id === question.correct.id ? '#7c3aed' : '#9ca3af'"
					stroke="white" stroke-width="1.5"
				/>

				<!-- Pulsing ring at current question station -->
				<g v-if="selected === null && !trainAnimating" :transform="`translate(${question.correct.x},${question.correct.y})`">
					<circle r="18" fill="#7c3aed" fill-opacity="0.2" stroke="#7c3aed" stroke-width="1.5" stroke-opacity="0.4" class="animate-ping" />
				</g>

				<!-- Train emoji — animates along journey route -->
				<text
					:x="trainX"
					:y="trainY - 26"
					text-anchor="middle"
					font-size="42"
					:class="selected === null && !trainAnimating ? 'train-blink select-none' : 'select-none'"
				>🚂</text>
			</svg>

			<!-- Route context strip: 2 stations before / ? / 2 stations after -->
			<div class="mb-3 flex items-start justify-center">
				<div
					v-for="(item, i) in stationContext"
					:key="item.station.id"
					class="flex flex-col items-center"
					style="min-width:52px"
				>
					<!-- Neighbor station: clickable, plays name via Azure TTS -->
					<button
						v-if="!item.isQuestion"
						type="button"
						class="mb-1.5 cursor-pointer px-0.5 text-center text-xs font-bold leading-tight text-zinc-800 transition hover:opacity-60 dark:text-white"
						@click="azureTts(item.station.name)"
					>
						{{ item.station.name }}
					</button>
					<!-- Question station: shows ? until answered -->
					<div
						v-else
						class="mb-1.5 px-0.5 text-center text-xs font-semibold leading-tight text-violet-600 dark:text-violet-400"
					>
						{{ selected === null ? '？' : item.station.name }}
					</div>
					<div class="relative flex h-4 w-full items-center justify-center">
						<div
							v-if="i > 0"
							class="absolute left-0 right-1/2 h-1"
							:style="{ backgroundColor: contextLineColor }"
						/>
						<div
							v-if="i < stationContext.length - 1"
							class="absolute left-1/2 right-0 h-1"
							:style="{ backgroundColor: contextLineColor }"
						/>
						<div
							class="relative z-10 rounded-full"
							:class="item.isQuestion
								? 'h-3.5 w-3.5 bg-violet-500 ring-2 ring-violet-300 dark:bg-violet-400 dark:ring-violet-700'
								: 'h-3 w-3'"
							:style="!item.isQuestion ? { backgroundColor: contextLineColor } : {}"
						/>
					</div>
				</div>
			</div>

		<!-- Map legend -->
			<div class="mb-4 flex flex-wrap justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
				<span class="flex items-center gap-1.5">
					<svg width="18" height="6" class="shrink-0"><line x1="0" y1="3" x2="18" y2="3" stroke="#3b82f6" stroke-width="2.5"/></svg>西部幹線
				</span>
				<span class="flex items-center gap-1.5">
					<svg width="18" height="6" class="shrink-0"><line x1="0" y1="3" x2="18" y2="3" stroke="#10b981" stroke-width="2.5"/></svg>東部幹線
				</span>
				<span class="flex items-center gap-1.5">
					<svg width="18" height="6" class="shrink-0"><line x1="0" y1="3" x2="18" y2="3" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5 3"/></svg>南迴線
				</span>
			</div>

			<div class="mb-4 flex justify-center gap-3">
				<button
					type="button"
					class="rounded-lg border border-stone-300 bg-transparent px-4 py-1.5 text-base text-zinc-800 transition hover:border-emerald-500/80 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-600 dark:text-zinc-200"
					@click="speak"
				>
					🔊 播放題目
				</button>
				<button
					v-if="voiceInput && srSupported"
					type="button"
					class="rounded-lg border border-stone-300 bg-transparent px-4 py-1.5 text-base text-zinc-800 transition hover:border-violet-500/80 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-600 dark:text-zinc-200"
					:disabled="listening || selected !== null || trainAnimating"
					@click="startListening"
				>
					{{ listening ? '🎙️ 聆聽中…' : '🎤 說答案' }}
				</button>
			</div>

			<p class="mb-4 text-base text-zinc-700 dark:text-zinc-300">
				{{ trainAnimating ? '🚂 列車行進中…' : '🚂 停在哪一站？' }}
			</p>

			<div class="grid grid-cols-2 gap-3">
				<button
					v-for="station in question.choices"
					:key="station.id"
					type="button"
					class="cursor-pointer rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base font-semibold text-zinc-800 transition hover:border-emerald-500/70 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
					:class="{
						'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100':
							selected !== null && station.id === question.correct.id,
						'border-red-500 bg-red-50 text-red-900 dark:border-red-500 dark:bg-red-950/40 dark:text-red-100':
							selected?.id === station.id && station.id !== question.correct.id,
						'cursor-default opacity-45':
							selected !== null && station.id !== question.correct.id && selected?.id !== station.id,
						'animate-pulse border-amber-400 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/40':
							speakingId === station.id && selected === null,
						'cursor-not-allowed opacity-50': trainAnimating && selected === null,
					}"
					:disabled="trainAnimating"
					@click="choose(station)"
				>
					{{ station.name }}
				</button>
			</div>

			<div v-if="selected !== null && selected.id !== question.correct.id" class="mt-6 flex flex-col items-center gap-4">
				<span class="text-base font-semibold text-red-600 dark:text-red-400">
					❌ 答錯了，是「{{ question.correct.name }}」
				</span>
				<button
					type="button"
					class="cursor-pointer rounded-xl border-0 bg-emerald-500 px-7 py-2.5 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
					:disabled="trainAnimating"
					@click="next"
				>
					{{ history.length >= ROUND_SIZE ? '查看結果' : '下一站 →' }}
				</button>
			</div>
		</div>

		<!-- Show map button -->
		<div class="mt-6 flex justify-center">
			<button
				type="button"
				class="cursor-pointer rounded-xl border border-stone-300 bg-transparent px-5 py-2 text-sm text-zinc-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-blue-400 dark:hover:text-blue-400"
				@click="showMap = true"
			>
				🗺️ 顯示臺鐵地圖
			</button>
		</div>
	</div>

	<!-- Map modal -->
	<div
		v-if="showMap"
		class="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/70 p-4"
		@click.self="showMap = false"
	>
		<div class="relative mt-4 w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900">
			<img
				src="/taiwan-railway-map.jpg"
				alt="臺灣鐵路觀光地圖 TPASS"
				class="w-full rounded-2xl"
			/>
			<button
				type="button"
				class="absolute bottom-3 left-3 z-10 cursor-pointer rounded-xl border-0 bg-black/75 px-4 py-2.5 text-base font-bold text-white shadow-lg transition hover:bg-black"
				@click="showMap = false"
			>
				✕ 點選關閉
			</button>
		</div>
	</div>
</template>

<style scoped>
@keyframes train-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.15; }
}
.train-blink {
  animation: train-blink 0.85s ease-in-out infinite;
}
</style>
