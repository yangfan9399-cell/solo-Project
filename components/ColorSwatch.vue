<template>
  <div
    class="color-swatch"
    :style="{
      backgroundColor: hexColor,
      width: size + 'px',
      height: size + 'px'
    }"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import type { RGB } from '~/types/game'
import { rgbToHex, clampColor } from '~/utils/colorUtils'

const props = defineProps<{
  color: RGB
  size?: number
}>()

const size = computed(() => props.size || 60)

const hexColor = computed(() => rgbToHex(clampColor(props.color)))
</script>
