---
title: "src: Karpathy — LLM Wiki"
type: source
source_url: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
author: Andrej Karpathy
retrieved: 2026-04-18
immutable: true
tags: [source, llm-wiki, knowledge-management]
---

# src: Karpathy — LLM Wiki

> Bu dosya **immutable** bir kaynak özetidir. İçerik değiştirilmez. Yeni bilgi geldiğinde bu dosya silinmez, üzerine yeni `src-*.md` eklenir.

## Ham Kaynak

**URL:** https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
**Başlık:** LLM Wiki: Key Concepts
**Yazar:** Andrej Karpathy

---

## Özet

### Temel Pattern

LLM Wiki, klasik RAG'den farklı bir yaklaşım önerir:

> "Rather than retrieving raw document fragments on each query, an LLM incrementally builds and maintains a persistent wiki — a structured, interlinked collection of markdown files."

Kilit fark: **wiki persistent, compounding bir artefakt.** Cross-reference'lar zaten oradadır — her sorguda yeniden üretilmez.

### Üç Katman

1. **Raw sources** — immutable orijinal dokümanlar
2. **The wiki** — LLM'in üretip sürdürdüğü markdown sayfalar
3. **The schema** — LLM'e yapıyı ve workflow'ları öğreten konfig dosyası

### Üç Primary Operasyon

**Ingesting sources:**
Yeni materyal geldiğinde LLM okur, bilgi çıkarır, özet yazar, mevcut 10-15 sayfayı yeni bağlantılarla günceller.

**Querying:**
Kullanıcı soru sorar; LLM ilgili sayfaları arar, citation'lu cevap sentezler. Değerli cevaplar **yeni sayfa olarak wiki'ye geri dosyalanabilir.**

**Linting:**
Periyodik sağlık kontrolleri — çelişki, orphan sayfa, eksik cross-reference, data boşlukları.

### Navigation

- **`index.md`** — kategori bazlı içerik katalogu
- **`log.md`** — kronolojik append-only aktivite kaydı

### Neden İşe Yarar

> "The tedious part of maintaining a knowledge base is not the reading or the thinking — it's the bookkeeping."

İnsanlar wiki'leri terk ederler çünkü bookkeeping yorucudur. LLM bu yükü kaldırır.

**İş bölümü:**
- **İnsan:** sourcing, yön verme, iyi soru sorma
- **LLM:** gerisi

---

## İlgili Araçlar (Karpathy'nin bahsettiği)

- **Obsidian** — wiki'yi gerçek zamanlı görüntülemek için
- **Claude Code** ve diğer LLM agent'ları — wiki'yi yazıp sürdürmek için
- **qmd** — lokal arama motoru (opsiyonel)
- **Marp** — slide deck (opsiyonel)

---

## Eleştiriler (gist yorumlarından)

- `@gnusupport`: Yaklaşımın fundamental kusurları var — LLM reliability, ~100 sayfa üzerinde scalability, gerçek structured data eksikliği
- Diğer kullanıcılar: MnemoVault, atomic-wiki varyasyonları önerildi

---

## Bu Vault'a Uygulama

Bu kaynak `beks-vault` için bootstrap referansıdır. İşletim kuralları [[schema]]'da, katalog [[index]]'de, aktivite kaydı [[log]]'da.

**Türetilmiş sayfalar:**
- [[LLM Wiki Pattern]] — patternin bu vault'taki uygulaması
