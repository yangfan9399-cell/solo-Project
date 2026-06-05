import { createRouter, createWebHistory } from 'vue-router'
import ApplicationList from '../views/ApplicationList.vue'
import ApplicationDetail from '../views/ApplicationDetail.vue'
import ApplicationForm from '../views/ApplicationForm.vue'

const routes = [
  {
    path: '/',
    name: 'ApplicationList',
    component: ApplicationList
  },
  {
    path: '/application/:id',
    name: 'ApplicationDetail',
    component: ApplicationDetail
  },
  {
    path: '/create',
    name: 'ApplicationCreate',
    component: ApplicationForm
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
