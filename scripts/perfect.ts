// Hazır yolların (Kuzey Marmara, Avrasya, Osmangazi, 1915 Çanakkale) verisini ve Marmara
// otoyol ağını önceden indirip public/data/prebuilt.json olarak kaydeder. Site bu dosyayı
// kullandığı için telefonda ilk hesaplama Overpass'i beklemez.
// GitHub Actions'ta derlemeden önce çalışır: npm run prefetch
import { mkdirSync, writeFileSync } from "node:fs";
import {
  PRESET_ROADS,
  fetchAnchors,
  overpass,
  processWays,
} from "../src/lib/roads";
import type { Prebuilt } from "../src/lib/roads";

// Tüm hazır yollar kapalıyken oluşan bölgeyi (+20 km) rahatça kapsayan kutu
const ANCHOR_BOX = { s: 39.9, w: 26.0, n: 41.7, e: 31.3 };

async function main() {
  const out: Prebuilt = {
    generatedAt: Date.now(),
    roads: {},
    anchors: { box: ANCHOR_BOX, a: [] },
  };
  let failures = 0;

  for (const def of PRESET_ROADS) {
    try {
      const d = processWays(def, await overpass(def.query));
      if (!d.wayCount) throw new Error("yol bulunamadı");
      out.roads[def.id] = { ...d, query: def.query };
      console.log(
        `✓ ${def.label}: ${d.wayCount} parça, ${d.cuts.length} kesim`,
      );
    } catch (err) {
      failures++;
      console.warn(`✗ ${def.label}: ${(err as Error).message ?? err}`);
    }
  }

  try {
    out.anchors.a = await fetchAnchors(ANCHOR_BOX, false);
    console.log(`✓ Otoyol ağı: ${out.anchors.a.length} ara nokta adayı`);
  } catch (err) {
    failures++;
    console.warn(`✗ Otoyol ağı: ${(err as Error).message ?? err}`);
    // Kutu boş kalırsa site bu kısım için canlı indirmeye döner
    out.anchors.box = { s: 0, w: 0, n: 0, e: 0 };
  }

  mkdirSync("public/data", { recursive: true });
  writeFileSync("public/data/prebuilt.json", JSON.stringify(out));
  console.log(
    `public/data/prebuilt.json yazıldı${failures ? ` (${failures} kalem eksik, site onları canlı indirir)` : ""}`,
  );
}

// Overpass'e ulaşılamasa bile derleme durmasın: eksik kalemler sitede canlı indirilir.
main().catch((err) => {
  console.warn("Ön hazırlık başarısız, site canlı indirmeye döner:", err);
});
