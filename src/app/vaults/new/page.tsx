"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const MAX_FILES = 100;
const MAX_FILE_BYTES = 200_000;
const MAX_BUNDLE_BYTES = 5_000_000;

interface SelectedFile {
  readonly source: string;
  readonly content: string;
  readonly bytes: number;
}

interface FormState {
  name: string;
  description: string;
  slug: string;
  ownerWallet: string;
  payoutAddress: string;
  priceUsdc: string;
  domains: string;
  files: SelectedFile[];
}

const INITIAL: FormState = {
  name: "",
  description: "",
  slug: "",
  ownerWallet: "",
  payoutAddress: "",
  priceUsdc: "0.25",
  domains: "",
  files: [],
};

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; reason: string; field?: string }
  | { kind: "success"; slug: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}

export default function NewVaultPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [slugDirty, setSlugDirty] = useState(false);
  const [payoutMatchesOwner, setPayoutMatchesOwner] = useState(true);
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  // Auto-derive slug from name unless user has edited slug manually.
  useEffect(() => {
    if (slugDirty) return;
    setForm((f) => ({ ...f, slug: slugify(f.name) }));
  }, [form.name, slugDirty]);

  // Auto-mirror owner -> payout unless user has overridden.
  useEffect(() => {
    if (!payoutMatchesOwner) return;
    setForm((f) => ({ ...f, payoutAddress: f.ownerWallet }));
  }, [form.ownerWallet, payoutMatchesOwner]);

  const totalBytes = useMemo(
    () => form.files.reduce((sum, f) => sum + f.bytes, 0),
    [form.files],
  );

  async function onPickFiles(picked: FileList | null): Promise<void> {
    if (!picked || picked.length === 0) return;
    if (picked.length > MAX_FILES) {
      setState({
        kind: "error",
        reason: `Too many files (${picked.length}). Max ${MAX_FILES}.`,
        field: "files",
      });
      return;
    }
    const next: SelectedFile[] = [];
    for (const file of Array.from(picked)) {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".md") && !lower.endsWith(".mdx")) continue;
      const content = await file.text();
      const bytes = new Blob([content]).size;
      if (bytes > MAX_FILE_BYTES) {
        setState({
          kind: "error",
          reason: `${file.name}: exceeds ${MAX_FILE_BYTES.toLocaleString()} bytes.`,
          field: "files",
        });
        return;
      }
      next.push({
        source: (file.webkitRelativePath || file.name).replaceAll("\\", "/"),
        content,
        bytes,
      });
    }
    if (next.length === 0) {
      setState({
        kind: "error",
        reason: "No .md or .mdx files in selection.",
        field: "files",
      });
      return;
    }
    setForm((f) => ({ ...f, files: next }));
    setState({ kind: "idle" });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (state.kind === "submitting") return;
    if (totalBytes > MAX_BUNDLE_BYTES) {
      setState({
        kind: "error",
        reason: `Bundle exceeds ${MAX_BUNDLE_BYTES.toLocaleString()} byte limit.`,
        field: "files",
      });
      return;
    }
    setState({ kind: "submitting" });

    const body = {
      slug: form.slug,
      name: form.name,
      description: form.description || undefined,
      ownerWallet: form.ownerWallet.trim(),
      payoutAddress: form.payoutAddress.trim(),
      priceUsdc: Number(form.priceUsdc) || 0.25,
      domains: form.domains
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0),
      public: true,
      files: form.files.map((f) => ({ source: f.source, content: f.content })),
    };

    try {
      const res = await fetch("/api/vaults", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        field?: string | null;
        vault?: { slug: string };
      };
      if (!res.ok) {
        setState({
          kind: "error",
          reason: data.error ?? `request failed (${res.status})`,
          field: data.field ?? undefined,
        });
        return;
      }
      const newSlug = data.vault?.slug ?? form.slug;
      setState({ kind: "success", slug: newSlug });
      router.push(`/vaults/${newSlug}`);
    } catch (err) {
      setState({ kind: "error", reason: (err as Error).message });
    }
  }

  return (
    <section className="bg-aurora bg-grain relative overflow-hidden">
      <div className="bg-aurora-canvas opacity-50" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      <div className="relative mx-auto max-w-[920px] px-6 lg:px-10 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <Link
          href="/vaults"
          className="text-mono-tight text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] transition-colors"
        >
          ← All vaults
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
        >
          <p className="text-eyebrow mt-6">Mount a vault</p>
          <h1 className="mt-6 text-display text-[clamp(36px,5.5vw,64px)] text-[var(--color-text)]">
            Drop your markdown.{" "}
            <em className="not-italic font-normal text-[var(--color-accent)]">
              Get paid by agents.
            </em>
          </h1>
          <p className="mt-5 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
            Pick a directory of markdown files (Obsidian, Notion export,
            engineering wiki, anything). Brain Drain chunks + embeds it,
            mounts an x402-gated endpoint, and routes USDC settlements
            straight to your Solana address.
          </p>
        </motion.div>

        <form
          onSubmit={onSubmit}
          className="mt-12 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 backdrop-blur-md p-7 lg:p-9 space-y-7"
        >
          <Field
            label="Vault name"
            required
            error={errFor(state, "name")}
            input={
              <input
                type="text"
                required
                maxLength={80}
                placeholder="e.g. React patterns vault"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="form-input"
              />
            }
          />

          <Field
            label="Slug (URL path)"
            hint={`/vaults/${form.slug || "your-slug"}`}
            error={errFor(state, "slug")}
            input={
              <input
                type="text"
                required
                pattern="^[a-z0-9-]+$"
                minLength={3}
                maxLength={64}
                placeholder="auto from name"
                value={form.slug}
                onChange={(e) => {
                  setSlugDirty(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
                className="form-input"
              />
            }
          />

          <Field
            label="Description"
            hint="optional — what's in here, who it's for"
            input={
              <textarea
                maxLength={500}
                rows={3}
                placeholder="Lived experience across X, Y, Z. Decision logs with tradeoffs."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="form-input resize-none"
              />
            }
          />

          <div className="grid sm:grid-cols-2 gap-5">
            <Field
              label="Owner wallet"
              required
              hint="your Solana address (base58, 32–44 chars)"
              error={errFor(state, "ownerWallet")}
              input={
                <input
                  type="text"
                  required
                  minLength={32}
                  maxLength={44}
                  placeholder="2SUm7fDR…PAYMPb3L"
                  value={form.ownerWallet}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ownerWallet: e.target.value }))
                  }
                  className="form-input text-mono-tight text-[13px]"
                />
              }
            />
            <Field
              label="Payout address"
              required
              hint={
                payoutMatchesOwner
                  ? "matches owner — toggle to override"
                  : "USDC settlements land here"
              }
              error={errFor(state, "payoutAddress")}
              input={
                <input
                  type="text"
                  required
                  minLength={32}
                  maxLength={44}
                  placeholder="default: owner wallet"
                  value={form.payoutAddress}
                  onChange={(e) => {
                    setPayoutMatchesOwner(false);
                    setForm((f) => ({ ...f, payoutAddress: e.target.value }));
                  }}
                  className="form-input text-mono-tight text-[13px]"
                />
              }
            />
          </div>

          <Field
            label="Price per query (USDC)"
            hint="0.05 – 5.00 · operator-controlled"
            error={errFor(state, "priceUsdc")}
            input={
              <input
                type="number"
                min={0.05}
                max={5}
                step={0.05}
                value={form.priceUsdc}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priceUsdc: e.target.value }))
                }
                className="form-input tabular-nums"
              />
            }
          />

          <Field
            label="Domains"
            hint="comma-separated tags — e.g. solana, x402, mcp"
            input={
              <input
                type="text"
                maxLength={300}
                placeholder="solana, rag, x402"
                value={form.domains}
                onChange={(e) =>
                  setForm((f) => ({ ...f, domains: e.target.value }))
                }
                className="form-input"
              />
            }
          />

          <Field
            label={`Markdown bundle ${form.files.length > 0 ? `· ${form.files.length} files · ${(totalBytes / 1024).toFixed(1)} KB` : ""}`}
            required
            hint="select multiple .md / .mdx files"
            error={errFor(state, "files")}
            input={
              <input
                type="file"
                multiple
                accept=".md,.mdx,text/markdown"
                onChange={(e) => onPickFiles(e.target.files)}
                className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-[var(--radius-pill)] file:border file:border-[var(--color-border-strong)] file:bg-[var(--color-bg-card)] file:text-[var(--color-text)] file:text-[12px] file:cursor-pointer hover:file:bg-[var(--color-bg-card-hover)]"
              />
            }
          />

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={
                state.kind === "submitting" ||
                form.files.length === 0 ||
                form.name.length === 0 ||
                form.ownerWallet.length === 0 ||
                form.payoutAddress.length === 0
              }
              className="inline-flex h-11 px-7 items-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 hover:shadow-[0_0_36px_-6px_var(--color-accent)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.kind === "submitting" ? "Indexing…" : "Mount vault"}
            </button>
            <p className="text-mono-tight text-[11px] text-[var(--color-text-faint)] flex-1">
              First pass embeds + uploads ~30 s for 100 chunks. Re-mount any
              time to pick up edits.
            </p>
          </div>

          {state.kind === "error" && !state.field && (
            <p className="text-mono-tight text-[12px] text-[#ff8a8a]">
              error · {state.reason}
            </p>
          )}
        </form>
      </div>

      <style jsx global>{`
        .form-input {
          display: block;
          width: 100%;
          height: 44px;
          padding: 0 16px;
          border-radius: var(--radius-pill);
          background: var(--color-bg);
          border: 1px solid var(--color-border-strong);
          color: var(--color-text);
          font-size: 14px;
          transition: border-color 200ms;
          outline: none;
        }
        textarea.form-input {
          height: auto;
          padding: 12px 16px;
          border-radius: 14px;
          line-height: 1.55;
        }
        input[type="file"].form-input {
          padding: 6px 6px 6px 0;
          line-height: 30px;
          font-size: 12px;
          color: var(--color-text-muted);
        }
        .form-input::placeholder {
          color: var(--color-text-faint);
        }
        .form-input:focus {
          border-color: var(--color-accent);
        }
      `}</style>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  input,
}: {
  readonly label: string;
  readonly required?: boolean;
  readonly hint?: string;
  readonly error?: string;
  readonly input: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-mono-tight text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">
        {label}
        {required && <span className="text-[var(--color-accent)] ml-1">*</span>}
      </span>
      <div className="mt-2">{input}</div>
      {error ? (
        <p className="mt-1.5 text-mono-tight text-[11px] text-[#ff8a8a]">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-mono-tight text-[11px] text-[var(--color-text-faint)]">
          {hint}
        </p>
      ) : null}
    </label>
  );
}

function errFor(state: SubmitState, field: string): string | undefined {
  if (state.kind !== "error") return undefined;
  if (state.field === field) return state.reason;
  return undefined;
}
