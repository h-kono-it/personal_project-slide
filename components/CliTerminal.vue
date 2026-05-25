<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { attachTerminal, type TerminalHandle } from 'site-shell-core'
import 'site-shell-core/styles/terminal.css'

interface FileEntry {
  name: string
  url: string
  title: string
  pubDate?: string | Date
  body?: string
  tags?: string[]
}
interface Collection {
  name: string
  entries: FileEntry[]
}

const props = withDefaults(defineProps<{
  prompt?: string
  pages?: FileEntry[]
  collections?: Collection[]
}>(), {
  prompt: 'user@site',
  pages: () => [],
  collections: () => [],
})

const termEl = ref<HTMLDivElement | null>(null)
const outputEl = ref<HTMLDivElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const promptEl = ref<HTMLSpanElement | null>(null)

let handle: TerminalHandle | null = null

onMounted(() => {
  if (!termEl.value || !outputEl.value || !inputEl.value || !promptEl.value) return
  handle = attachTerminal({
    root: termEl.value,
    output: outputEl.value,
    input: inputEl.value,
    prompt: promptEl.value,
    promptLabel: props.prompt,
    pages: props.pages,
    collections: props.collections,
  })
})

onBeforeUnmount(() => {
  handle?.destroy()
  handle = null
})
</script>

<template>
  <div class="terminal" ref="termEl" role="region" aria-label="擬似CLIターミナル">
    <div ref="outputEl" class="terminal-output" aria-live="polite" aria-relevant="additions" />
    <div class="terminal-input-row">
      <span ref="promptEl" class="terminal-prompt" aria-hidden="true" />
      <input
        ref="inputEl"
        type="text"
        class="terminal-input"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        aria-label="コマンド入力（Tabキーで補完、↑↓で履歴）"
      />
    </div>
  </div>
</template>

<style scoped>
.terminal {
  background: #111;
  color: #e0e0e0;
  border-radius: 8px;
  border: 1px solid #2a2a2a;
  padding: 1rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  height: 320px;
  display: flex;
  flex-direction: column;
  cursor: text;
}
.terminal-output {
  flex: 1;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  scrollbar-width: thin;
  scrollbar-color: #444 transparent;
}
.terminal-output::-webkit-scrollbar { width: 4px; }
.terminal-output::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }
.terminal-input-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.375rem;
  border-top: 1px solid #222;
  margin-top: 0.25rem;
  flex-shrink: 0;
}
.terminal-prompt {
  color: #7dff7d;
  white-space: nowrap;
  user-select: none;
}
.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e0e0e0;
  font: inherit;
  caret-color: #e0e0e0;
}
</style>
