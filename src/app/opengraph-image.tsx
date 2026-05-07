import { ImageResponse } from "next/og";

export const alt = "Brain Drain — x402 + RAG reference implementation on Solana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 18% 28%, rgba(25,251,155,0.18), transparent 52%), radial-gradient(circle at 82% 72%, rgba(153,69,255,0.14), transparent 55%)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: "1.5px solid rgba(25,251,155,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 22,
                height: 22,
                borderRadius: 9999,
                border: "1.5px solid rgba(25,251,155,0.55)",
              }}
            />
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: 9999,
                background: "#19fb9b",
                boxShadow: "0 0 18px rgba(25,251,155,0.55)",
              }}
            />
          </div>
          <span
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#ababba",
            }}
          >
            Brain Drain
          </span>
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            fontSize: 72,
            lineHeight: 1.06,
            letterSpacing: "-0.025em",
            fontWeight: 600,
          }}
        >
          <span style={{ display: "flex" }}>The protocol AI agents pay</span>
          <span
            style={{
              display: "flex",
              color: "#19fb9b",
              fontWeight: 500,
            }}
          >
            vault operators through.
          </span>
        </div>

        <div
          style={{
            marginTop: 56,
            display: "flex",
            alignItems: "center",
            gap: 40,
            fontSize: 20,
            fontFamily: "monospace",
            color: "#6b6b7b",
          }}
        >
          <span style={{ display: "flex" }}>0.25 USDC per snippet</span>
          <span style={{ display: "flex", color: "#4a4a55" }}>·</span>
          <span style={{ display: "flex" }}>~400ms confirmation</span>
          <span style={{ display: "flex", color: "#4a4a55" }}>·</span>
          <span style={{ display: "flex" }}>Solana</span>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            fontSize: 20,
            fontFamily: "monospace",
            color: "#19fb9b",
            letterSpacing: "0.04em",
          }}
        >
          x402 + RAG reference implementation
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(25,251,155,0.6) 22%, rgba(153,69,255,0.5) 78%, transparent 100%)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
