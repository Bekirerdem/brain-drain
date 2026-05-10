# Vault Category Hints — paste-ready content

Bu dosya `src/lib/supabase/types.ts`'teki `VAULT_CATEGORY_HINTS` map'ine yapıştırmak için hazır içerik içerir.

**Beğendiğin metinleri seç → ilgili kategoriyi `types.ts`'te değiştir → push.**
Veya: aşağıdaki "v1 — Operator-faced" bloğunu olduğu gibi kopyala, mevcut map'i komple replace et.

---

## v1 — Operator-faced (önerilen, doğrudan yapıştırılabilir)

```ts
export const VAULT_CATEGORY_HINTS: Record<VaultCategory, string> = {
  engineering:
    "Spesifik debugging war story'leri, kullandığın gerçek kütüphane versiyonları, aldığın asıl error mesajıyla birlikte çalışan kod. Soyut pattern değil. Bir agent 'X kütüphanesi v2.3'te neden Y koştu' diye sorabiliyorsa ve cevabı bu vault'taysa — uyar.",
  trading:
    "Gerçek PnL sonuçları, spesifik ticker ve timing, bifurcation verisiyle anti-pattern'lar. Soyut tavsiye veya 'long mu açayım' yorumu değil. Vakanın içinde '14 Nisan'da $HIGH 30 dakikada +%35 squeeze yaptı çünkü...' geçiyorsa — uyar.",
  defi:
    "Matematikle birlikte protokol mekaniği, gerekçeli governance kararları, likidite stratejisinin sonuç verileri. 'AMM nasıl çalışır' özeti değil. Citation-grade pool verisi + kendi yorumun.",
  research:
    "Citation'larla long-form sentez, başkalarının çalışmasının üzerine kendi çerçeven. Paper özeti değil. Okuyan yeni bir mental model'le ayrılıyorsa — uyar.",
  productivity:
    "Tekrarlanabilir kurulumlar, birebir komut dizileri, gerçekten uyguladığın karar kuralları. 'Şu aracı dene' listesi değil. Yabancı biri sıfırdan replicate edebiliyorsa — uyar.",
  design:
    "Referans ekranlar, anti-slop kontrolleri, hangi trade-off'u seçtiğini açıklayan component varyasyonları. 'Figma kullan' tarzı genel tavsiye değil. Agent yönlendirme yerine çalışan bir component pattern'i çekebiliyorsa — uyar.",
  legal:
    "Citation-grade dava analizi, redacted gerçek emsal, yargı yetkisine özgü karar ağaçları. 'Avukatına danış' uyarısı değil. Bir hukuk asistanı bu vault'la araştırmasını kısaltabiliyorsa — uyar.",
  other:
    "Üst kategorilerden hiçbirine sığmıyor. Agent'lar kategoriye göre filtreliyor — 'other' en zayıf discovery'ye sahip. Yakın bir match varsa onu seç, scope kayarsa sonra yeniden kategorize et.",
};
```

---

## v2 — Punchy (daha kısa, slogan-ı tarzı)

Kategori dropdown'ı küçükse veya helper text'in fazla uzun göründüğünü düşünüyorsan:

```ts
export const VAULT_CATEGORY_HINTS: Record<VaultCategory, string> = {
  engineering: "Gerçek error mesajları + kütüphane versiyonu + çalışan kod. Soyut yok.",
  trading:    "Gerçek PnL + spesifik ticker + timing. Soyut tavsiye yok.",
  defi:       "Pool matematiği + governance kararı + likidite verisi. Açıklayıcı özet yok.",
  research:   "Citation + sentez. Sadece özet yok.",
  productivity: "Tekrarlanabilir setup + komut dizisi. 'Şu aracı dene' listesi yok.",
  design:     "Referans + anti-slop + variant trade-off. Generic guidance yok.",
  legal:      "Citation-grade emsal + yargı-spesifik decision tree. Disclaimer yok.",
  other:      "Yakın match yoksa burada — discovery zayıf, mümkünse yukarıdan birini seç.",
};
```

---

## v3 — English-only (jüri için, eğer İngilizce sürüm istiyorsan)

```ts
export const VAULT_CATEGORY_HINTS: Record<VaultCategory, string> = {
  engineering:
    "Specific debugging war stories, named library versions, working code with the actual error message you hit. Not abstract patterns. If an agent could ask 'why did X break in Y v2.3' and your vault has the answer — fits.",
  trading:
    "Real PnL outcomes, specific tickers and timing, anti-patterns with bifurcation data. Not abstract advice or 'should I long?'. If your case has 'on April 14, $HIGH squeezed +35% in 30m because...' — fits.",
  defi:
    "Protocol mechanics with math, governance decisions with rationale, liquidity strategy outcomes. Not 'how does AMM work' explainers. Citation-grade pool data plus your interpretation.",
  research:
    "Long-form synthesis with citations, original framing on top of others' work. Not paper summaries. If your reader walks away with a new mental model — fits.",
  productivity:
    "Reproducible setups, exact command sequences, decision rules you actually follow. Not generic 'try X tool' lists. If a stranger could replicate your workflow from this — fits.",
  design:
    "Reference shots, anti-slop checks, component variants with the trade-off you picked. Not 'use Figma'. If the agent can pull a working component pattern, not just guidance — fits.",
  legal:
    "Citation-grade case law analysis, redacted real precedent, jurisdiction-specific decision trees. Not 'consult a lawyer' disclaimers. If a paralegal could shortcut research using this — fits.",
  other:
    "Fits none of the above. Agents filter by category, so 'other' has the weakest discovery. Prefer a close match — re-categorize later if scope shifts.",
};
```

---

## Notlar

- Brain Drain'in vault depth standardı (`feedback_brain_drain_vault_depth` memory) bu helper'lara yansıdı: spesifik tarih/tutar/error mesajı, war story, anti-pattern.
- Trading kategorisinin örneği bilerek senin haber-trade-agent vault'undaki **HIGH short-squeeze case** üzerinden — yükleyeceğin vault'la kategorisinin tonu örtüşsün.
- v1 default olarak types.ts'e yazıldı; v2 veya v3 istersen bana söyle, replace ederim.
- Türkçe sürümlerde "uyar" → "fits" karşılığı; jüri İngilizceyse v3'e geçmek tek satır.
