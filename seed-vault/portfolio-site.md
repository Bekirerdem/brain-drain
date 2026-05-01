---
title: bekirerdem.dev — Kişisel Portfolyo Sitesi
tags: [portfolio, site, astro, cloudflare, web]
created: 2026-04-19
updated: 2026-04-19
status: production
url: https://bekirerdem.dev
repo: https://github.com/Bekirerdem/bekirerdem.dev
---

# bekirerdem.dev

Kişisel portfolyo sitesi. Siyah-beyaz minimal tema, AW-2025-Portfolio fork'u tabanlı, ileri animasyon + tipografi odaklı.

> **Not:** Bu klasör vault şemasında "yatırım portfolyosu" için açılmıştı ama kullanıcı bu sayfayı `03-Portfolio` altında tutmayı istedi — kişisel portfolyo sitesi dokümantasyonu için kullanılıyor.

---

## Canlı Durum

- **Prod:** https://bekirerdem.dev
- **Preview deploy:** https://bekirerdem.pages.dev
- **Son deploy:** 2026-04-19 — `69ed6bd` (hero rework + menu + about/skills modernization)
- **Deploy tetiği:** Hem `wrangler pages deploy dist` (manuel) hem GitHub push (Cloudflare Pages'de Git provider `No` görünüyor — şu anda manuel wrangler üzerinden)

---

## Teknoloji Stack'i

| Katman | Teknoloji |
|---|---|
| Framework | Astro 5.7 |
| Stil | SCSS (module'lü), custom theme tokens |
| Animasyon | GSAP 3.13 + ScrollTrigger |
| Scroll | Lenis 1.3 (touch'ta devre dışı) |
| Görsel | `astro:assets` Image (AVIF/WebP otomatik) |
| Video | Native `<video>` + IntersectionObserver autoplay |
| i18n | Custom `translations.ts` → `build-i18n.mjs` → `public/i18n.js` inline script |
| Tip | TypeScript strict |
| Build tool | Bun v1.3.11 / npm |
| Deploy | Cloudflare Pages (`bekirerdem` projesi) |
| SEO | JSON-LD Schema.org Person+WebSite, OG, sitemap, robots |

---

## Mimari Bileşenler

### Ana Bölümler (sırayla)

1. **Hero (`SHero.astro`)** — isim, meslek tanımı (`AI & Blockchain Engineer`), üst/alt ASeparator'lar (Bekir-Erdem-Bursa-Türkiye / AI × Blockchain × Automation), fluid typografi
2. **About (`SAbout.astro`)** — 4 paragraflık self-description + Skills 4-kategori grid + dikey yan ticker yazıları (sol-sağ)
3. **Skills** — About bölümüyle aynı component içinde; Frontend (TS/Next/React/Astro), Web3 (Solidity/Foundry/Avalanche), AI (Claude/Gemini/Agents), Automation (n8n/Apify/MCP) + text row'lar (Backend, Deploy, Design)
4. **Work (`SWork.astro`)** — proje kartları (ChainBounty vb.)
5. **Dream It / Build It (`SDreamIt.astro`)** — büyük tipografi "HAYAL ET / İNŞA ET"
6. **My Way (`SMyWay.astro`)** — 18 görsellik timeline; `AMedia` component üzerinden hem image hem lazy-loaded video desteği
7. **Footer (`SiteFooter.astro`)** — iletişim + particle canvas

### Anahtar Component'ler

- **`AMedia.astro`** — reusable medya tile. `image` (Astro:assets) veya `video` (webm + poster) prop'ları. Video için `IntersectionObserver` autoplay-on-view (bandwidth korur)
- **`ASeparator.astro`** — binary-encoded metin stream'i, Hero'da kullanılır
- **`SiteHead.astro` / `SiteMobileMenu.astro`** — desktop/mobile menü; Blog + Studio linkleri "Coming Soon" rozetleriyle devre dışı

### i18n Pipeline

```
src/i18n/translations.ts  (tr / en kaynak)
        ↓
scripts/build-i18n.mjs    (build-time script)
        ↓
public/i18n.js            (inline client bundle)
        ↓
[data-i18n="key"] tüm component'lerde
```

Dil değişimi: `setLang('tr'|'en')` → localStorage + custom `langchange` event.

---

## Son Yapılan İş (2026-04-19 Session)

Tamamlanan:
- Hero: ASeparator metin yapıları + meslek ismi değişikliği (`Software Developer` → `AI & Blockchain Engineer`)
- Menü: Desktop + mobile'a Blog/Studio linkleri (soon badge'li, tıklanmaz)
- About: FunnyDog pozisyonlaması düzeltildi (ortaklık + tesis kapsamı), 4 paragraflık akış yeniden yazımı
- Skills: 4-kategori yapı (Frontend/Web3/AI/Automation), TypeScript/Git/Claude eklemeleri, Automation font taşması düzeltildi
- Dream It/Build It: "Build It" başlığı 12px yukarı hizalandı
- My Way: `AMedia` component abstraction + hacker-1/hacker-2 görselleri + webm altyapısı
- i18n: tüm TR/EN çeviriler güncel

Yarım bırakılanlar (sonraki session):
- **Work sağ/sol perspektif boş alanlar** — kullanıcı sonraya bıraktı
- **OG image yeniden üretim** — headless browser (Playwright) gerekir, kullanıcı onayı bekliyor
- **My Way'e site ekran görüntüleri ekleme** — aynı Playwright altyapısı gerekir
- **About/Skills yan perspektif alanlar** — 3 iterasyon denendi (floating tiles, full-width trapezoids, small cells), hepsi reddedildi; kullanıcı yeni fikir düşünecek. Dikey ticker yazıları duruyor

---

## Performans / SEO

- **AVIF/WebP** otomatik görsel optimizasyonu (16 görsel)
- **JSON-LD Schema.org**: Person (Bekir Erdem, AI & Blockchain Engineer, knowsAbout: [...14 kavram]) + WebSite
- **Sitemap** + `robots.txt` ile index izni
- **reduced-motion guard**: prefers-reduced-motion'da Lenis + GSAP ScrollTrigger devre dışı
- **Cache-Control headers** statik asset'ler için (`_headers`)

---

## Repo Yapısı

```
src/
├── assets/frames/      ← My Way görselleri (18 adet)
├── components/
│   ├── AMedia.astro    ← medya abstraction
│   ├── ASeparator.astro
│   ├── SHero.astro
│   ├── SAbout.astro
│   ├── SWork.astro
│   ├── SMyWay.astro
│   ├── SDreamIt.astro
│   ├── SiteHead.astro
│   ├── SiteMobileMenu.astro
│   └── SiteFooter.astro
├── i18n/
│   └── translations.ts
├── pages/
│   └── index.astro     ← meta + JSON-LD + component sırası
└── styles/             ← SCSS: tokens, mixins, theme
public/
├── i18n.js             ← build-i18n.mjs çıktısı
├── images/
├── videos/
└── _headers            ← Cloudflare Pages cache
scripts/
└── build-i18n.mjs      ← i18n bundler
```

---

## Komutlar

```bash
# Dev
npm run dev

# Build
npm run build

# i18n regenerate (translations.ts değişince)
node scripts/build-i18n.mjs

# Deploy (Cloudflare Pages)
npx wrangler pages deploy dist --project-name=bekirerdem --branch=main --commit-dirty=true
```

---

## Bağlantılar

- [[index]] — vault indeks
- [[schema]] — vault işletim kuralları
- [[log]] — aktivite kaydı

## Dış Kaynaklar

- Orijinal template: [waaark/AW-2025-Portfolio](https://github.com/waaark/AW-2025-Portfolio) (fork)
- Astro 5.7 docs: https://docs.astro.build
- Lenis: https://github.com/darkroomengineering/lenis
