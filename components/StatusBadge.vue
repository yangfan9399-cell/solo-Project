<script setup lang="ts">
import type { ClaimStatus } from '~/composables/mockData'
import { statusLabels } from '~/composables/mockData'

interface Props {
  status: ClaimStatus
}

defineProps<Props>()

const statusBadgeClass: Record<ClaimStatus, string> = {
  DRAFT: 'badge-gray',
  MATERIALS_MISSING: 'badge-warning',
  MATERIALS_SUPPLEMENTED: 'badge-success',
  UNDER_REVIEW: 'badge-primary',
  LIABILITY_DISPUTE: 'badge-danger',
  AMOUNT_EXCEEDED: 'badge-orange',
  APPROVED: 'badge-purple',
  PAID: 'badge-success',
  REJECTED: 'badge-danger',
  ARCHIVED: 'badge-gray',
  REOPENED: 'badge-info'
}
</script>

<template>
  <span :class="['badge', statusBadgeClass[status]]">
    {{ statusLabels[status] }}
  </span>
</template>
