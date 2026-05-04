# Brain Drain — 11-Day Sprint Roadmap

## Tek cümle
> Sen Obsidian vault'unu yüklersin, AI agent'lar sorularına cevap için sana USDC öder.

## Faz tablosu

| Gün | Tarih | Faz | Çıktı | Bekir | Claude (kod) |
|---|---|---|---|---|---|
| 0 | 1 May Cuma | Setup | Hesaplar açık, repo init, .env şablonu | Grant başvurusu, Phantom CASH, Helius/CDP keys | Repo + scaffold + .env.example |
| 1 | 2 May Cmt | Çekirdek | Next.js + Obsidian markdown loader, RAG temel | Vault'tan 50-100 .md seç | RAG pipeline (embeddings + similarity) |
| 2 | 3 May Pzr | x402 Gateway | `/query` endpoint x402 standartında 402 dönüyor | Devnet 1 USDC test transferi | x402 middleware + Helius doğrulama |
| 3 | 4 May Pzt | CDP Wallet | Buyer-side MPC wallet auto-fund + auto-sign | CDP API key, KYC varsa onayla | CDP SDK entegrasyonu |
| 4 | 5 May Sal | Phantom CASH | Seller payouts CASH cüzdanına geliyor | Phantom Cash ekran kontrolleri | CASH payout flow + balance dashboard |
| 5 ✅ | 6 May Çar | Agent Client | MCP server Claude Desktop'tan sorgu yapıyor | MCP config dosyası | MCP tool definition + demo client |
| 6 | 7 May Per | Dashboard | Web UI: kim sordu, ne kazandın, hangi snippet | Tasarım brief (Gemini ile) | shadcn dashboard + tx history |
| 7 | 8 May Cum | Polish + Mainnet | Devnet → mainnet, gerçek demo akışı | Mainnet $10-20 USDC | Mainnet config, edge cases |
| 8 | 9 May Cmt | Demo Video | 3 dakika video + cilalı README | Video çekimi (sen anlatıcı) | README + Mermaid + business case |
| 9 | 10 May Pzr | **SUBMIT** | Colosseum portal'a teslim, Twitter duyurusu | Submit + sosyal duyuru | Last-min fix, video upload, repo public |
| 10 | 11 May Pzt | Buffer | Acil bug fix | İzle ve tepki ver | Stand-by |

## Kritik milestone'lar

- **M1:** x402 endpoint devnet'te ödeme alıyor → 3 May akşamı ✅
- **M2:** CDP MPC wallet auto-sign çalışıyor → 5 May akşamı ✅
- **M3:** MCP client agent ödeme + sorgu yapıyor → 7 May akşamı ✅ (4 May'de production'da kanıtlandı)
- **M4:** Mainnet'te gerçek bir akış tamamlandı → 8 May akşamı
- **M5:** Video + submit hazır → 10 May 18:00 TRT

## Day 5 production verification (2026-05-04)

Deploy: `https://brain-drain-iota.vercel.app` (Vercel hobby tier, master branch).

| Test | Latency | Result |
|---|---|---|
| `tools/list` | 1.77s | 2 tools registered (query + payouts) |
| `brain_drain_payouts` (limit=5) | 4.49s | 2 real devnet payout events |
| `brain_drain_query` (paid) | 3.41s | RAG top-2 + on-chain payment |

Sample paid query tx: `48YttoTNkdBzKyopsNtLbRW3ydXL7USDZTUTYsxmDbruVVLaU4gDNMk5Komwc7e4F3yFEmm9mpZNJfsXcHHsX7J5` (devnet, 0.05 USDC buyer→seller).

## Risk register

| Risk | Olasılık | Mitigation |
|---|---|---|
| CDP MPC SDK Solana SVM henüz tam değil | Orta | Fallback: Privy embedded wallets |
| Phantom CASH bounty UX'i devnet'te test edilemiyor | Düşük | Mainnet $10-20 ile direkt test |
| MCP server stdio mode Windows'ta sorun çıkarır | Düşük | HTTP transport'a fallback |
| OpenAI embeddings rate limit dev sırasında | Düşük | Batch + retry, küçük corpus |
| Mainnet demo tx fail | Orta | Devnet fallback + 3 buffer attempt |

## Sponsor bounty mapping

| Bounty | Day vurulur |
|---|---|
| x402 Integration | Day 2 (M1) |
| CDP Embedded Wallets | Day 3 (M2) |
| Phantom CASH | Day 4 |
| Multi-Protocol Agent | Day 5 (MCP layer) |
| AgentPay | Day 7 (mainnet polish) |
