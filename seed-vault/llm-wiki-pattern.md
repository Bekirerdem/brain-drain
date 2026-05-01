---
title: LLM Wiki Pattern
tags: [agentic-systems, knowledge-management, pattern]
created: 2026-04-18
updated: 2026-04-18
sources: [[src-karpathy-llm-wiki]]
---

# LLM Wiki Pattern

**Pattern:** LLM'in bir markdown tabanlı kişisel wiki'yi sürekli inşa edip bakımını yapması.

**Kim önerdi:** Andrej Karpathy, 2026 gist'inde formalize etti. Kaynak: [[src-karpathy-llm-wiki]].

**Bu vault'ta uygulanıyor:** Evet — [[schema]] v1.0, [[index]], [[log]].

---

## RAG vs LLM Wiki

| Boyut | Klasik RAG | LLM Wiki |
|---|---|---|
| Kalıcılık | Ephemeral — her query'de yeniden çek | Persistent, compounding artifact |
| Cross-ref | Sorgu anında hesaplanır | Önceden yazılmış |
| Güncelleme | Dokümanlar statik | Wiki sayfaları LLM tarafından sürekli güncellenir |
| Maliyet | Her sorgu tam retrieval | Sayfalar hazır, sadece sentez |
| İnsan emeği | Yok (ama sonuç karmaşık) | Kaynak besleme + yön |

## Üç Katman

1. **Raw sources** — değişmez, `_sources/` altında
2. **Wiki** — 00-05 numaralı kategori klasörleri
3. **Schema** — [[schema]] dosyası, bu wiki'nin kurallarını tanımlar

## Üç Operasyon

- **Ingest** → [[schema#5. Ingest Workflow]]
- **Query** → [[schema#6. Query Workflow]]
- **Lint** → [[schema#7. Lint Workflow]]

## Neden Bu Vault İçin İdeal

- Bekir çoklu alanda çalışıyor (trading, DAO, clients, öğrenme) → bookkeeping yükü büyük
- Obsidian zaten markdown + `[[wiki-link]]` native → pattern'e hazır
- Claude direkt dosya erişimiyle (Seçenek A) → ingest ve sentez rahat
- GitHub backup → wiki kayıpsız versiyonlanır

## Bilinen Kısıtlar

Karpathy gist yorumlarındaki eleştiriler:

- **Scale:** ~100 sayfa ötesi LLM'in tutarlılığı zorlanır → **lint disiplini** kritik
- **Reliability:** LLM hallucination → **her claim source-citation'lı** (kural [[schema#4. Linkleme Kuralları]])
- **Structured data:** Markdown = metin; yapısal veri için frontmatter + tablolar yeterli mi? → tablo bazlı bilgi `03-Portfolio`, `00-Trading-Agent` gibi yerlerde denenecek

## İlgili

- [[src-karpathy-llm-wiki]] — orijinal kaynak
- [[schema]] — bu vault'un işletim kuralları
- [[index]] — kategori katalogu
