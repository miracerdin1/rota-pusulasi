<script setup lang="ts">
import { ref } from 'vue'
import type { Place } from '../lib/geocode'
import { geocode } from '../lib/geocode'

defineProps<{
  id: string
  label: string
  allowCurrent?: boolean
  placeholder?: string
}>()
const text = defineModel<string>('text', { required: true })
const place = defineModel<Place | null>('place', { required: true })
const current = defineModel<boolean>('current', { default: false })

const suggestions = ref<Place[]>([])
const open = ref(false)
const err = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
let seq = 0

function onInput() {
  place.value = null
  current.value = false
  err.value = ''
  clearTimeout(timer)
  const q = text.value.trim()
  if (q.length < 3) {
    suggestions.value = []
    return
  }
  timer = setTimeout(async () => {
    const my = ++seq
    try {
      const res = await geocode(q)
      if (my !== seq) return
      suggestions.value = res
      open.value = res.length > 0
    } catch (e) {
      if (my === seq) err.value = (e as Error).message
    }
  }, 500)
}

function choose(p: Place) {
  place.value = p
  text.value = p.label
  open.value = false
}

function onBlur() {
  setTimeout(() => (open.value = false), 150)
}

function useCurrent() {
  current.value = true
  place.value = null
  text.value = 'Konumum'
  open.value = false
}

function clear() {
  text.value = ''
  place.value = null
  current.value = false
  suggestions.value = []
  open.value = false
  err.value = ''
}

</script>

<template>
  <div class="field">
    <label class="lbl" :for="id">{{ label }}</label>
    <div class="row">
      <div class="input-wrap">
        <input
          :id="id"
          v-model="text"
          type="text"
          :placeholder="placeholder"
          autocomplete="off"
          enterkeyhint="search"
          @input="onInput"
          @focus="open = suggestions.length > 0 && !place"
          @blur="onBlur"
        />
        <button v-if="text" type="button" class="clear-btn" @mousedown.prevent="clear" title="Temizle" aria-label="Temizle">✕</button>
      </div>
      <button v-if="allowCurrent" type="button" class="icon-btn" :class="{ on: current }" @click="useCurrent" title="Konumumu kullan" aria-label="Konumumu kullan">◎</button>
    </div>
    <ul v-if="open" class="sugg" role="listbox">
      <li v-for="s in suggestions" :key="s.label + s.point.join()">
        <button type="button" @mousedown.prevent="choose(s)">{{ s.label }}</button>
      </li>
    </ul>
    <p v-if="place" class="ok">✓ {{ place.label }}</p>
    <p v-else-if="err" class="bad">{{ err }}</p>
  </div>
</template>

<style scoped>
.field { position: relative; display: flex; flex-direction: column; gap: 6px; }
.row { display: flex; gap: 8px; }
.input-wrap { position: relative; flex: 1; min-width: 0; display: flex; }
.input-wrap input { flex: 1; min-width: 0; padding-right: 36px; }
.clear-btn { position: absolute; top: 0; bottom: 0; right: 2px; width: 32px; border: 0; background: none; color: var(--muted); font-size: 15px; cursor: pointer; border-radius: 6px; }
.clear-btn:hover, .clear-btn:focus-visible { color: var(--ink); background: var(--bg); }
.icon-btn { width: 46px; flex: none; border-radius: 8px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink); font-size: 20px; cursor: pointer; }
.icon-btn.on { border-color: var(--sign); color: var(--sign); box-shadow: 0 0 0 1.5px var(--sign); }
.sugg { position: absolute; z-index: 1000; top: 100%; left: 0; right: 0; margin: 4px 0 0; padding: 4px; list-style: none; background: var(--surface); border: 1.5px solid var(--line); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.18); }
.sugg button { width: 100%; text-align: left; padding: 10px; border: 0; background: none; color: var(--ink); font: inherit; border-radius: 6px; cursor: pointer; }
.sugg button:hover, .sugg button:focus-visible { background: var(--bg); }
.ok { margin: 0; font-size: 13px; color: var(--sign); }
.bad { margin: 0; font-size: 13px; color: var(--stop); }
</style>
