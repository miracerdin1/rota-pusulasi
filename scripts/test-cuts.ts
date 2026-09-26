// Gerçek O-7 verisiyle kesim sayısını ve kapsamını dener. Çalıştırma: npx tsx scripts/test-cuts.ts
import { readFileSync } from 'node:fs'
import { PRESET_ROADS, processWays } from '../src/lib/roads'

const fx = JSON.parse(readFileSync(new URL('./o7-fixture.json', import.meta.url), 'utf8'))
const kmo = PRESET_ROADS.find((r) => r.id === 'kmo')!
const d = processWays(kmo, { ways: fx.ways, junctions: new Set<number>(fx.junctions) })
console.log(`O-7: ${fx.ways.length} parça, ${fx.junctions.length} kavşak düğümü → ${d.cuts.length} kesim noktası`)
