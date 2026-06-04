import { createRouter, createWebHistory } from 'vue-router'
import WorkOrderList from '@/pages/WorkOrderList.vue'
import WorkOrderDetail from '@/pages/WorkOrderDetail.vue'
import ReviewPage from '@/pages/ReviewPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: WorkOrderList
  },
  {
    path: '/order/:id',
    name: 'order-detail',
    component: WorkOrderDetail
  },
  {
    path: '/review',
    name: 'review',
    component: ReviewPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
