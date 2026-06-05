<script setup lang="ts">
interface Props {
  title: string
  visible: boolean
  width?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: '500px'
})

const emit = defineEmits<{
  close: []
}>()

function handleOverlayClick() {
  emit('close')
}

function handleContentClick(e: MouseEvent) {
  e.stopPropagation()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content" :style="{ width: props.width, maxWidth: props.width }" @click="handleContentClick">
        <div class="modal-header">
          <span class="modal-title">{{ title }}</span>
          <button class="close-btn" @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>
