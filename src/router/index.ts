import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from) {
    if (to.fullPath === from.fullPath) return false

    return { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/custom',
      name: 'custom',
      component: () => import('../views/CustomPage.vue'),
    },
    {
      path: '/three-character',
      name: 'three-character',
      component: () => import('../views/ThreeCharacterPage.vue'),
    },
    {
      path: '/what-is-this',
      name: 'what-is-this',
      component: () => import('../views/WhatIsThisPage.vue'),
    },
    {
      path: '/situations',
      name: 'situations',
      component: () => import('../views/SituationRecognitionPage.vue'),
    },
    {
      path: '/situations/editor',
      name: 'situations-editor',
      component: () => import('../views/SituationEditorPage.vue'),
    },
    {
      path: '/bannan-line-quiz',
      name: 'bannan-line-quiz',
      component: () => import('../views/BannanLineQuizPage.vue'),
    },
    {
      path: '/tamshui-line-quiz',
      name: 'tamshui-line-quiz',
      component: () => import('../views/BannanLineQuizPage.vue'),
    },
    {
      path: '/circular-line-quiz',
      name: 'circular-line-quiz',
      component: () => import('../views/BannanLineQuizPage.vue'),
    },
    {
      path: '/wenhu-line-quiz',
      name: 'wenhu-line-quiz',
      component: () => import('../views/BannanLineQuizPage.vue'),
    },
    {
      path: '/songshan-line-quiz',
      name: 'songshan-line-quiz',
      component: () => import('../views/BannanLineQuizPage.vue'),
    },
    {
      path: '/zhonghe-line-quiz',
      name: 'zhonghe-line-quiz',
      component: () => import('../views/BannanLineQuizPage.vue'),
    },
    {
      path: '/maokong-gondola-quiz',
      name: 'maokong-gondola-quiz',
      component: () => import('../views/BannanLineQuizPage.vue'),
    },
    {
      path: '/line-quiz/:lineKey(bannan|tamshui|circular|wenhu|songshan|zhonghe|maokong)',
      name: 'line-quiz',
      component: () => import('../views/BannanLineQuizPage.vue'),
    },
    {
      path: '/taiwan-map-quiz',
      name: 'taiwan-map-quiz',
      component: () => import('../views/TaiwanMapQuizPage.vue'),
    },
    {
      path: '/mrt-quiz',
      name: 'mrt-quiz',
      component: () => import('../views/MrtQuizPage.vue'),
    },
    {
      path: '/mrt-quiz/editor',
      name: 'mrt-quiz-editor',
      component: () => import('../views/MrtQuizEditorPage.vue'),
    },
    {
      path: '/voice-install-guide',
      name: 'voice-install-guide',
      component: () => import('../views/VoiceInstallGuidePage.vue'),
    },
    {
      path: '/flashcards/body',
      name: 'flashcards-body',
      component: () => import('../views/BodyPage.vue'),
    },
    {
      path: '/flashcards/emotion',
      name: 'flashcards-emotion',
      component: () => import('../views/EmotionCardsPage.vue'),
    },
    {
      path: '/flashcards/env1-at-home',
      name: 'flashcards-env1-at-home',
      component: () => import('../views/Env1AtHomePage.vue'),
    },
    {
      path: '/flashcards/number',
      name: 'flashcards-number',
      component: () => import('../views/NumberPage.vue'),
    },
  ],
})

export default router
