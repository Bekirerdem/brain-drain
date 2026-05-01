---
title: LLM Wiki Schema
version: 1.0
updated: 2026-04-18
tags: [meta, schema]
---

# Wiki Schema — İşletim Kuralları

Bu dosya, vault'un bir **LLM Wiki** olarak nasıl işletildiğini tanımlar. Andrej Karpathy'nin [LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)'ine dayanır.

**Rol dağılımı:**
- **Kullanıcı (Bekir):** Kaynak besler, soru sorar, yön verir
- **Claude:** Ingest, linking, sentez, lint — bookkeeping'in tamamı

---

## 1. Klasör Mantığı

| Klasör | İçerik |
|---|---|
| `00-Trading-Agent/` | Otonom trading agent araştırması — mimari, strateji, piyasa verileri |
| `01-Clients/` | Müşteri dosyaları — her müşteri için alt klasör |
| `02-KozaDAO/` | DAO governance, tokenomics, topluluk, roadmap |
| `03-Portfolio/` | Yatırım pozisyonları, risk analizleri |
| `04-Learning/` | Öğrenme notları — makale/video/kurs/kitap |
| `05-Agentic-Systems/` | AI agent mimarisi, tool use, orchestration, evals |
| `Daily/` | Günlük notlar — `YYYY-MM-DD.md` |
| `_sources/` | Ham kaynak ingestlerinin immutable katmanı — `src-[slug].md` |

Yeni üst kategori → önce `index.md`'de kayıt aç, sonra klasör oluştur.

---

## 2. Dosya İsimlendirme

- **Daily:** `YYYY-MM-DD.md`
- **Kavram/entity:** `Title Case.md` (Obsidian linking için)
- **Kaynak ingesti:** `src-[slug].md`
- **Lint raporu:** `Daily/YYYY-MM-DD-lint.md`
- **Yazım dili:** Türkçe, teknik terimler orijinal (Sharpe ratio, backtesting, slippage, RAG, vb.)

---

## 3. Frontmatter Şablonu

Her yeni sayfaya:

```yaml
---
title: <Başlık>
tags: [kategori, alt-kategori]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: [[src-slug-1]], [[src-slug-2]]
---
```

---

## 4. Linkleme Kuralları

- İçerik sayfalarında **`[[Wiki Link]]` formatı** kullanılır (Obsidian native)
- Her yeni sayfa en az **3 ilgili sayfaya** link vermeli — orphan oluşmasın
- Bilinmeyen kavram görünce **stub sayfa** aç (bir cümle + tag), sonra genişlet
- Aynı kavram farklı yerlerde geçerse → tek sayfaya link, duplicate açma

---

## 5. Ingest Workflow

Kullanıcı bir kaynak (PDF, URL, YouTube, tweet, not) verdiğinde:

1. Kaynağı oku, özümse
2. Ham özeti `_sources/src-[slug].md` olarak yaz (immutable)
3. Mevcut **10-15 sayfayı tara** — hangileri bu bilgiyle güncellenmeli?
4. İlgili sayfalara yeni bilgi + `[[src-slug]]` citation ekle
5. Gerekirse yeni kavram sayfaları aç
6. `log.md`'ye `[ingest]` entry ekle
7. `index.md`'de anchor listesini güncelle

---

## 6. Query Workflow

Kullanıcı soru sorduğunda:

1. `index.md`'den ilgili kategorileri tespit et
2. 3-5 en alakalı sayfayı oku
3. Cevabı **citation vererek** üret: *"... kaynak: [[sayfa]]"*
4. Cevap yeterince değerliyse sor: *"Bunu `04-Learning/<başlık>.md` olarak vault'a işleyeyim mi?"*
5. Onay → yeni sayfa + `log.md` kaydı

---

## 7. Lint Workflow

Kullanıcı "lint" dediğinde veya haftalık self-audit:

- [ ] **Orphan** sayfalar (hiçbir yerden link almayan)
- [ ] **Broken** linkler (`[[...]]` hedefi yok)
- [ ] **Çelişki** — aynı konuda farklı sayfalarda tutarsız ifade
- [ ] **Stub** kalmış, genişletilmemiş sayfalar
- [ ] **Tag tutarsızlığı** (aynı kavram farklı tag'lerle)
- [ ] **`index.md`** güncel mi?

Rapor → `Daily/YYYY-MM-DD-lint.md`, düzeltmeler uygulanır, log'a işlenir.

---

## 8. Log Formatı

Her aksiyon `log.md`'ye append (en yeni altta):

```markdown
## YYYY-MM-DD
- **[bootstrap]** açıklama
- **[ingest]** src: slug → N sayfa: [[sayfa-1]], [[sayfa-2]]
- **[query]** "soru" → [[sayfa]] kaynağından, `path/dosya.md`'ye kaydedildi
- **[lint]** N orphan düzeltildi, M broken link onarıldı
- **[schema-update]** vX.Y — değişiklik özeti
```

Aksiyon tipleri: `bootstrap`, `ingest`, `query`, `lint`, `schema-update`, `refactor`, `archive`.

---

## 9. Versiyon & Sync

- **Git:** Obsidian Git plugin 10 dk interval auto-commit (Obsidian açıkken)
- **Push:** Claude **manuel push** — kullanıcı açıkça söyleyince
- **Şema değişikliği:** `schema.md` version bump + `log.md` `[schema-update]` entry

---

## 10. Anti-Patterns (Yapmayacaklarımız)

- ❌ Aynı kavram için paralel sayfa (duplicate)
- ❌ Frontmatter-siz yeni sayfa
- ❌ Cross-link'siz izole sayfa
- ❌ Kaynak göstermeden "fact" ifadesi
- ❌ Karpathy'nin dediği gibi: "wiki rotting" — okunup güncellenmeyen eski sayfalar → lint'te yakalanır
