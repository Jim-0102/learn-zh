<script setup lang="ts">
import ZhFlashCards from '@/components/ZhFlashCards.vue'

const cards = [
  { chinese: '一、二、三、四、五、六、七、八、九、十', image: '/number/counting.webp' },
  { chinese: '一加一等於二。', image: '/number/01_one_plus_one.png' },
  { chinese: '二乘以二等於四。', image: '/number/02_two_times_two.png' },
  { chinese: '十除以二等於五。', image: '/number/03_ten_divided_two.png' },
  { chinese: '這個數字太大了。', image: '/number/big_number.webp' },
  { chinese: '請數到十。', image: '/number/count_to_ten.png' },
  { chinese: '答案是多少？', image: '/number/answer.webp' },
  { chinese: '這題很簡單。', image: '/number/easy.webp' },
  { chinese: '我需要計算機。', image: '/number/05_need_calculator.png' },
  { chinese: '這是百分之五十。', image: '/number/06_fifty_percent.png' },
  { chinese: '總共是一百元。', image: '/number/07_one_hundred_yuan.png' },
  { chinese: '現在是三點半。', image: '/number/08_three_thirty.png' },
  { chinese: '這個數字是奇數。', image: '/number/09_odd_number.png' },
  { chinese: '那是偶數。', image: '/number/10_even_number.png' },
  { chinese: '請寫下這個數字。', image: '/number/11_write_number.png' },
  { chinese: '這是正確答案。', image: '/number/12_correct_answer.png' },
  { chinese: '我們來解這道數學題。', image: '/number/04_solve_math.png' },
  { chinese: '這是小數點。', image: '/number/13_decimal_point.png' },
  { chinese: '這是分數。', image: '/number/14_fraction.png' },
  { chinese: '這是無限大。', image: '/number/infinity.webp' },
]
</script>

<template>
  <ZhFlashCards title="數字字卡" :cards="cards" />
</template>
