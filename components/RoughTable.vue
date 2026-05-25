<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  mode?: 'solid' | 'cell'
  border?: 'full' | 'outer' | 'inner' | 'rows'
  roughness?: number | string
  stroke?: string
  strokeWidth?: number | string
  bowing?: number | string
}>(), {
  mode: 'solid',
  border: 'full',
})

const root = ref<HTMLDivElement | null>(null)
let ro: ResizeObserver | null = null

async function ensureLib() {
  if ((window as any).RoughTable) return
  const rough = (await import('roughjs')).default
  ;(window as any).rough = rough
  await import('rough-table')
}

function getNodes() {
  const outer = root.value?.querySelector('.rough-table-outer') as HTMLElement | null
  const table = outer?.querySelector('table') as HTMLTableElement | null
  return { outer, table }
}

function redraw() {
  const RT = (window as any).RoughTable
  const { outer, table } = getNodes()
  if (!RT || !outer || !table) return
  RT.draw(table, outer)
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  await ensureLib()
  await nextTick()

  // フォントロード後に最初の描画（テーブル幅の確定タイミングに合わせる）
  if ((document as any).fonts?.ready) await (document as any).fonts.ready
  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  redraw()

  // テーブル自体のサイズ変更（resize / スライド切替後の再マウントなど）に追従
  // ※ rough-table 側にも内蔵の ResizeObserver があるが、最初の draw 時には
  //    まだ張られていない（init 経由でないと張られない）ので自前で持つ
  const { table } = getNodes()
  if (table && 'ResizeObserver' in window) {
    ro = new ResizeObserver(() => redraw())
    ro.observe(table)
  }
})

onBeforeUnmount(() => {
  ro?.disconnect()
})
</script>

<template>
  <div ref="root" class="rough-table-host">
    <div
      class="rough-table-outer"
      :data-mode="props.mode"
      :data-border="props.border"
      :data-roughness="props.roughness"
      :data-stroke="props.stroke"
      :data-stroke-width="props.strokeWidth"
      :data-bowing="props.bowing"
    >
      <slot />
    </div>
  </div>
</template>

<style>
.rough-table-host {
  display: inline-block;
}
.rough-table-outer table {
  border-collapse: collapse;
  background: transparent;
}
.rough-table-outer th,
.rough-table-outer td {
  padding: 0.4em 0.9em;
  border: none;
  background: transparent;
}
</style>
