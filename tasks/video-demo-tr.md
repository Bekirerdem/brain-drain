# Product Demo Video — Türkçe Script (~100 sn)

> **Format:** ekran + ses, yüz yok. SoundCore 2 Hands-Free mic. OBS 1920x1080.
> **Konu:** Brain Drain canlı ürün — operatör mount + agent settle + multi-vault network.
> **Form brief:** "Show the live product, not a slide deck, not a code walkthrough."
> **Altyazı:** post-prod'da İngilizce yakılacak (burned-in).

---

## Sahne 1 — Landing + tanıtım (0:00–0:08)

**Ekran:** `https://brain-drain-iota.vercel.app` → hero görünür.

**Türkçe konuşma:**

> "Brain Drain canlı, Solana devnet üzerinde. Bu, yapay zeka ajanlarının uzman vault operatörlerine USDC ödediği protokolün ana sayfası. Şimdi nasıl çalıştığını gerçekten göstereyim."

---

## Sahne 2 — Vault catalog tour (0:08–0:25)

**Ekran:** `/vaults` katalog sayfası. Kategori chip filter row görünür. 7 vault gözüküyor.

**Türkçe konuşma:**

> "Buraya kadar yedi vault yüklenmiş. Engineering, trading, research kategorileri var. İkisi benim dışımdan operatörler tarafından mount edilmiş — biri DevPack Türkiye birincisi olan Snowball ekibinden geldi. 'Herkes mount edebilir' iddiası teorik değil, canlı."

**Hareket:** Kategori chip'lerinin üstüne hover, "engineering" filter'a tıkla, sonra "all" geri. `llm-agent-debugging-logs` vault'una hover et.

---

## Sahne 3 — Mount akışı (0:25–0:48)

**Ekran:** `/vaults/new` sayfası açık.

**Türkçe konuşma:**

> "Bir vault nasıl yüklenir? Önce Phantom bağlanıyor. Tek seferlik bir mesaj imzalanıyor — bu sign-in-with-Solana, parola yok, e-posta yok. Sonra kategori seçiliyor, markdown dosyalarını sürüklüyorsun. Brain Drain, Gemini embedding ile chunk'lıyor, Supabase Storage'a yazıyor, vault'u operatörün payout adresine bağlıyor. Birkaç saniye içinde public bir x402 endpoint'i çıkıyor."

**Hareket:** Phantom connect tıklat (test cüzdan, hızlı sign), kategori dropdown'unu aç → "engineering" seç → "Choose folder" veya örnek markdown dosya drop et. Mount başla, progress göster.

---

## Sahne 4 — Vault detail + canlı 402 quote (0:48–1:05)

**Ekran:** `/vaults/{bekir-erdem}` veya canlı bir vault detay sayfası. VaultProbeWidget görünür.

**Türkçe konuşma:**

> "Her vault'un detay sayfasında VaultProbeWidget var. Buraya bir sorgu yazıp 'Test query' tıklayınca canlı 402 Payment Required yanıtı dönüyor — USDC fiyatı, payout adresi, vault'un kim olduğu. Bu ödeme yapılmadan önceki son kontrol."

**Hareket:** VaultProbe input'a kısa bir Türkçe veya İngilizce sorgu yaz → "Get quote" tıkla → JSON response görünür. Önemli alanlar (price, payTo, ttl) highlight edilebilir post-prod'da.

---

## Sahne 5 — Agent settle (terminal + feed) (1:05–1:25)

**Ekran:** Split — sol terminal, sağ landing page LiveActivity feed (ya da sırayla cut).

**Türkçe konuşma:**

> "Bir ajan ödeme yaptığında ne oluyor? Terminal'den `multi-buyer-traffic` script'i ile bir CDP Embedded Wallet sorgu atıyorum. Bu wallet MPC ile imzalıyor, kullanıcı raw key görmüyor. Helius RPC dört yüz milisaniyede transferi doğruluyor. Endpoint top-k snippet'i + alıntıları + tx imzasını döndürüyor."

**Hareket:** `bun scripts/multi-buyer-traffic.ts` çalıştır — terminal log'da "402 Payment Required → CDP wallet auto-fund → SPL transfer → confirmed in 412ms" satırları görünsün.

Sonra landing page'in LiveActivity feed'ine geç — yeni settlement satırı pop-in animasyonu, settlement packet motion. Yeni satır yeşil flash atar.

---

## Sahne 5.5 — Yabancı operatöre canlı ödeme (1:25–1:45) **YENİ — Bekir'in fikri**

**Ekran:** Sadece landing page LiveActivity feed (terminal değil — terminal Claude'un tarafında, ekran kaydında yalnızca feed).

**Türkçe konuşma (canlı narrate, "şimdi" diyerek beklenti yarat):**

> "Bunu daha da somutlaştıralım. Az önce vault yükleyen yabancı operatörlerden biri Snowball ekibinden geldi — DevPack Türkiye birincisi. Onların vault'una şu anda canlı bir ödeme atıyorum. Brain Drain protokolü aynı şekilde çalışacak: 402 quote → CDP wallet imzalayacak → Helius doğrulayacak → USDC doğrudan onların adresine düşecek. Ben bu protokole bir kuruş elimle bile dokunmuyorum."

**Hareket:** Bekir konuşmaya başlarken **Claude bir Bash komutu tetikler** (background):

```bash
bun scripts/pay-vault.ts llm-agent-debugging-logs "How does the team debug runaway LLM agents in production?"
```

3-8 saniye sonra LiveActivity feed'de yeni settle satırı pop-in olur — vault `llm-agent-debugging-logs`, payout adres `8aEm9m4cbe...` (Snowball ekibinin cüzdanı). Settlement packet motion + green flash + yeni signature görünür.

**Türkçe devam (settle olunca):**

> "İşte oldu. Brain Drain'in bu konuda yapay zekaca bilmediği bir şey: bu cüzdan kime ait. Sadece operatörün vault'a koyduğu payout adresine para gönderdi. Snowball ekibi şimdi Phantom'larında devnet USDC bakiyesini görüyor olacak. Protokol gerçekten çalışıyor — ben sadece bir ödeme akıttım."

> **İkinci yabancı vault için tekrarlanabilir** — Bekir `react-pattern` slug'unu söylerse Claude `bun scripts/pay-vault.ts react-pattern "..."` çalıştırır, ikinci yabancı cüzdana ödeme akar. Bekir bunu zinciri uzatmak isterse 2-3 vault üst üste ödeme yapılır (5-7 sn aralıkla feed'de pop'lar).

**Lower third (post-prod):**
- "Live settlement → llm-agent-debugging-logs"
- "Payout: 8aEm9m4cbe... (Snowball team wallet, devnet)"
- "Brain Drain custodies nothing"

---

## Sahne 6 — MCP demo (opsiyonel, 1:25–1:40)

**Ekran:** Claude Desktop veya Cursor → Brain Drain MCP server bağlı, paid tool çağrısı.

**Türkçe konuşma:**

> "Aynı protokol, MCP üzerinden Claude Desktop ve Cursor gibi tüm büyük client'lara düşüyor. Burada bir MCP query atıyorum — `brain_drain_query_vault` paid tool çağrılıyor, otomatik ödeme yapıyor, vault'tan alıntı dönüyor. Bu, ajanların kendi başlarına ödeme yaptığı format."

**Hareket:** Claude Desktop chat → "ask the koza-l1-playbook vault about Subnet-EVM gotchas" → tool kullanıyor + cevap geliyor + citation görünür.

> Bu sahne opsiyonel — MCP Claude Desktop kurulumu zor olursa atla, demo Sahne 5'ten doğrudan Sahne 7'ye geç (toplam ~85 sn olur).

---

## Sahne 7 — Network proof + kapanış (1:40–1:55)

**Ekran:** Landing page LiveActivity full görünüm — 9 settle, 5 buyer, ~$3.70 paid out (canlı rakamlar).

**Türkçe konuşma:**

> "Şu anda dokuz settlement, beş farklı buyer cüzdan, dört vault operatörüne yaklaşık üç buçuk dolar ödenmiş. Network çalışıyor. Hepsi devnet'te, ama mainnet'e geçiş tek bir environment flag değişikliği. Protokol mantığı her iki ağda da aynı."

**Hareket:** Stats stripe yakın çekim. Sonra kapanış — Brain Drain logo veya hero görünür, 1 sn dur.

---

## Çekim notları

- **Süre hedefi:** ~100 sn (Sahne 6 dahil), ~85 sn (Sahne 6 atlanırsa). Maks 3 dk.
- **Konuşma temposu:** rahat, demo akarken doğal narrate et. Linear/Stripe tarzı "bunu yapıyorum, şunu görüyorsun".
- **Çekim metodu:** sahne sahne. Her sahne ayrı OBS kaydı, hata varsa o sahneyi yenile.
- **Browser:** Chrome incognito, bookmark gizli, %100 zoom.
- **OBS kaynak:** Display Capture (laptop ekranı), Audio Input → SoundCore 2 Hands-Free.
- **Demo state:** her çekimden önce Brain Drain prod canlı olduğunu doğrula (curl payouts).
- **Çekim öncesi**: terminal hazırla (bun script test), Phantom devnet'te USDC olsun, vault catalog 7 vault gösteriyor mu kontrol.

## Post-prod

- DaVinci Resolve / CapCut'ta sahne sahne birleştir
- Türkçe ses üzerine **İngilizce altyazı yak** (burned-in subtitles)
- İngilizce altyazı metni — Türkçe transcript'ten ben çeviririm, SRT olarak veririm
- Lower thirds (opsiyonel): "x402 Payment Required", "CDP MPC wallet auto-sign", "Helius parsed-tx ~400ms", "USDC → operator wallet"
- Export: 1920x1080, 30 fps, MP4, x264 CRF 18, AAC 192k audio
- YouTube unlisted yükle → URL'i form'un **PRODUCT DEMO VIDEO** alanına yapıştır
