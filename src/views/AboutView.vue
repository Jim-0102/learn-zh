<template>
	<div
		class="mx-auto max-w-xl px-6 py-12 leading-loose lg:min-h-dvh lg:flex lg:flex-col lg:justify-center"
	>
		<h1 class="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
			關於本站
		</h1>
		<p class="mb-4 text-base text-zinc-700 dark:text-zinc-300">
			<strong>學齡前的早療小教室</strong> 是一個開放、免費的華文自學平台，
			讓任何人都能隨時隨地透過聆聽、跟讀與 AI 輔助，輕鬆學習華文。
		</p>

		<h2 class="mb-2 mt-8 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
			我們的理念
		</h2>
		<p class="mb-4 text-base text-zinc-700 dark:text-zinc-300">
			語言學習不應受限於時間與地點。我們相信，只要有好的工具與足夠的練習，
			每個人都能掌握台灣華文的基礎。
		</p>
		<p class="mb-4 text-base text-zinc-700 dark:text-zinc-300">
			經歷過才知道身障兒家長的辛苦。祝福每一個遲緩的孩子，都有足夠的支持。
		</p>

		<h2 class="mb-2 mt-8 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
			功能介紹
		</h2>
		<ul class="list-disc space-y-2 pl-5 text-base text-zinc-700 dark:text-zinc-300">
			<li><strong>📷 AI 圖片學</strong> — 拍下身邊的任何物品，AI 立刻給出華文與英文說法，並可播放發音。看完結果後，可直接進入朗讀練習，用語音跟讀並獲得即時相似度評分。</li>
			<li><strong>🃏 字卡測驗</strong> — 健康、情緒、在家情境、數字四大主題混合出題。看圖從四個句子中選出正確答案，支援中英文語音播報，答對即觸發煙花特效。答錯的題目排到最後重考，全部答對才結算。</li>
			<li><strong>🎧 語音選站名</strong> — 聽華文或英文站名語音，從四個選項中選出正確答案。每輪 20 題，結束後顯示得分與答題紀錄。連續答對還有獎勵！</li>
			<li><strong>🀄 注音符號測驗</strong> — 看注音符號說出例字，用語音輸入作答。37 個注音符號，每輪 20 題，支援計時模式，挑戰你的注音反應力！</li>
			<li><strong>🔡 英文字母測驗</strong> — 看英文字母選對應單字，支援大寫與小寫切換。26 個字母，每輪 20 題，支援語音播報與計時模式！</li>
			<li><strong>🎙️ 自訂朗讀</strong> — 輸入中文或英文文字，立即聆聽標準發音。支援語音輸入、慢速播放，並可跟讀後與原文比對相似度分數。</li>
			<li><strong>🗺️ 台灣縣市地圖測驗</strong> — 地圖上的紫色是哪個縣市？聽語音選答案，支援語音輸入直接說出縣市名稱，認識台灣各縣市地理位置。</li>
			<li><strong>🚆 台灣火車站測驗</strong> — 從板橋出發，選擇南下或北上，環島一圈依序停靠 10 個車站。51 個車站涵蓋西部幹線、宜蘭線、花東線與南迴線，火車沿著軌道移動。支援語音播放、語音輸入，並附臺鐵觀光地圖。</li>
			<li><strong>🚇 站名學習</strong> — 搭配路線圖，認識台北捷運七條路線的華文站名。支援中文與英文語音播報四個選項，逐題累積積分，輕鬆建立生活用字庫。</li>
			<li><strong>🎭 情境識別互動題</strong> — 依據圖片與對話判斷情境，分級題型可持續擴充題庫與圖片。</li>
			<li><strong>🀄 注音符號閃卡</strong>（外部連結）— 翻轉閃卡練習注音符號，加強符號辨識與記憶。</li>
			<li><strong>📋 注音符號表</strong>（外部連結）— 完整注音符號對照表，含聲母、韻母與聲調說明，適合查閱與複習。</li>
			<li><strong>🪙 兌幣練習</strong>（外部連結）— 拖拉硬幣到兌換區，練習硬幣面額換算，培養日常生活的數感與金錢概念。</li>
			<li><strong>📚 萌典</strong>（外部連結）— 查詢華文單字、成語、詞組的釋義與用法。</li>
		</ul>

		<h2 class="mb-2 mt-8 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
			技術資訊
		</h2>
		<p class="mb-4 text-base text-zinc-700 dark:text-zinc-300">
			本站以 <strong>Vue 3</strong> 開發，部署於 <strong>Cloudflare Workers</strong>，
			原始碼公開於
			<a
				href="https://github.com/Jim-0102/learn-zh"
				target="_blank"
				rel="noopener"
				class="text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
			>
				GitHub
			</a>。
			網站架構和相關技術學習自
			<a
				href="https://zh.alearn.org.tw/"
				target="_blank"
				rel="noopener"
				class="text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
			>
				自主學華文
			</a>
			網站，在此感謝。
		</p>

		<p class="mt-8 text-base text-zinc-700 dark:text-zinc-300">
			如有任何問題請聯繫
			<a
				href="https://www.instagram.com/wang.da.ming"
				target="_blank"
				rel="noopener"
				class="text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
			>
				wang.da.ming
			</a>。
		</p>
	</div>
</template>
