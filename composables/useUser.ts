import { ref, computed } from 'vue'

const currentUser = ref({
  id: 1,
  name: '张医生',
  role: 'APPLICANT',
  department: '骨科'
})

export function useUser() {
  const setUser = (user: any) => {
    currentUser.value = user
  }

  const isApplicant = computed(() => currentUser.value.role === 'APPLICANT')
  const isProcessor = computed(() => currentUser.value.role === 'PROCESSOR')
  const isReviewer = computed(() => currentUser.value.role === 'REVIEWER')
  const isArchivist = computed(() => currentUser.value.role === 'ARCHIVIST')

  const canAccept = computed(() => isProcessor.value)
  const canProcess = computed(() => isProcessor.value)
  const canReview = computed(() => isReviewer.value)
  const canArchive = computed(() => isArchivist.value)
  const canSupplement = computed(() => isApplicant.value)

  return {
    currentUser,
    setUser,
    isApplicant,
    isProcessor,
    isReviewer,
    isArchivist,
    canAccept,
    canProcess,
    canReview,
    canArchive,
    canSupplement
  }
}
