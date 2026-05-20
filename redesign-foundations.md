# Redesign Foundations: Terminal Brutalism (Phase 2A)

Bu belge, "Brain Drain" front-end tasarımını "Terminal Brutalism" estetiğine geçirirken oluşturulan tasarım sisteminin temellerini, tipografi ve renk kararlarını ve pilot `Hero` kesitinde uygulanan referansları belgeler.

## 1. Token Eşleme (Eski → Yeni)

| Eski Token / Tasarım Stili | Yeni Token / Brutalist Karşılığı | Durum | Gerekçe / Açıklama |
| :--- | :--- | :--- | :--- |
| `bg-aurora` | *Kaldırıldı / Etkisizleştirildi* | **Deprecated** | Canlı renkli gradient ve bulanık blob arka planlar brutalist sadeliğe aykırıdır. |
| `bg-aurora-canvas` | `background: transparent` | **Deprecated** | Radial gradient'ler tamamen temizlendi; derleme hatası olmaması için boş bir element olarak korundu. |
| `--color-bg: #0a0a0a` | `--color-bg: #080809` | **Aktif** | Daha koyu ve soğuk bir off-black tonuna geçildi. |
| `--color-bg-card: #18181c` | `--color-bg-card: #0f0f11` | **Aktif** | Kartların arka planı arka plan rengine yaklaştırılarak kontrast sınırları çizgilere devredildi. |
| `--radius-card: 15px` | `--radius-card: 0px` | **Aktif** | Tüm kart ve kutulardaki yuvarlatılmış köşeler sıfırlandı. Keskin köşeler. |
| `--radius-pill: 9999px` | `--radius-pill: 0px` | **Aktif** | Düğme ve rozetlerdeki hap (pill) tasarımı kaldırılarak tamamen dikdörtgen tasarıma geçildi. |
| `--font-sans: Geist Sans` | `--font-sans: Geist Mono` | **Aktif** | Arayüzdeki ana yazı karakteri monospace yapıldı. |
| `--font-brand: Audiowide` | `--font-brand: JetBrains Mono` | **Aktif** | Logolar ve marka isimleri dahil tüm başlıklar monospace karakterlere çekildi. |

---

## 2. Tipografi Seçimleri ve Gerekçesi

Kullanıcının yönlendirmesi doğrultusunda şu kararlar uygulandı:
- **Terminal & Kod Blokları:** `JetBrains Mono` (Next.js Google Fonts entegrasyonu ile `@font-mono` olarak tanımlı). Sayısal değerler ve terminal çıktıları için en yüksek okunabilirliği sağlar.
- **Arayüz Elemanları & Başlıklar (Geri Kalanı):** `Geist Mono` (`next/font/google` aracılığıyla layout.tsx üzerinden yüklenerek `@font-sans` olarak tanımlandı). Modern, geometrik ve geliştirici araçları için optimize edilmiş, temiz brutalist başlıklar oluşturmamızı sağlar.

---

## 3. Renk Paleti ve Sadeleştirme Kararları

Yeni palet, gereksiz tüm renkli gradient'leri ve dekoratif neon parlamalarını eleyerek yalnızca kritik veriyi ve aksiyonları öne çıkarmayı amaçlar:
1. **Zemin (Base):** `#080809` (Off-black) ve `#0f0f11` (Elevated dark).
2. **Yazı/Metin (Text):** Ana metin için `#f5f5f7`, ikincil açıklamalar için `#8e8e93`.
3. **Sınırlar (Borders):** `#1c1c1f` (Görünür ızgara sınır çizgileri) ve `#2e2e33` (Belirgin kart sınırları).
4. **Vurgu (Accent):** `#19fb9b` (Solana ekosistemine sadık, canlı yeşil renk - sadece buton hover'ları, stat durum noktaları ve önemli metin vurguları için kullanılır).
5. **Uyarı (Alert):** `#ff453a` (Hata ve kritik sistem uyarıları için).

---

## 4. GSAP Animasyon Yardımcıları (`src/lib/motion/gsap.ts`)

Brutalist geçişler için hazırlanan animasyon araçları şunlardır:
- **`animateTypewriter`**: Metinleri daktilo stilinde, harf harf ve stepped (adımlı) şekilde yazdırır. Hero'daki log stream kısmında sıralı (sequential) olarak çalıştırılmıştır.
- **`animateSteppedFade`**: Easing (yaylı/akıcı yumuşama) içermeyen, `steps(n)` mantığıyla çalışan kesik geçişli opaklık animasyonudur.
- **`animateGlitchSnap`**: Elemanın pozisyonunu milisaniyeler içinde hafifçe sarsıp (offset) opaklığıyla birlikte yerine "oturtan" ani brutalist yüklenme efektidir.

---

## 5. Hero Kesitinde Uygulanan Referans Tasarımlar

- **Family (Wallet) Referansı:** Başlıklarda ve stat sayılarında monospace yazı tipi hiyerarşisi kullanılarak rakamların genişliği eşitlendi ve okunabilirliği artırıldı.
- **Raycast Referansı:** Sınır çizgileri ve padding (iç boşluk) oranları sıkı bir disiplinle düzenlendi, butonlara tırnak işareti stili `[ Button ]` brutalist parantezleri yerleştirildi.
- **Retool (Landing) Referansı:** Butonlar ve stat hücresi sınırları görünür ince çizgilerle ayrıldı, arka planda saydam 12-sütunlu kılavuz çizgileri kullanıldı. Dinamik console/CLI log akışı ile "canlı sistem" hissi simüle edildi.
