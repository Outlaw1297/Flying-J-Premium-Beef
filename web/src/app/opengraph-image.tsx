import { ImageResponse } from "next/og";

export const alt =
  "Flying J Premium Beef — Ranch-raised beef from Scranton, North Dakota";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#2F4F3E",
          color: "#F8F5F0",
          display: "flex",
          height: "100%",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background:
              "radial-gradient(circle at 82% 18%, rgba(184,115,51,.5), transparent 33%), linear-gradient(120deg, #2F4F3E, #222222)",
            display: "flex",
            inset: 0,
            position: "absolute",
          }}
        />
        <div
          style={{
            border: "1px solid rgba(248,245,240,.15)",
            borderRadius: 999,
            height: 460,
            position: "absolute",
            right: -80,
            top: -120,
            width: 460,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 82px",
            position: "relative",
            width: "100%",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: 18 }}>
            <div
              style={{
                alignItems: "center",
                background: "#B87333",
                borderRadius: 999,
                display: "flex",
                fontSize: 22,
                fontWeight: 800,
                height: 62,
                justifyContent: "center",
                width: 62,
              }}
            >
              FJ
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 28, fontWeight: 700 }}>
                Flying J Beef
              </span>
              <span
                style={{
                  color: "rgba(248,245,240,.6)",
                  fontSize: 14,
                  letterSpacing: "0.18em",
                  marginTop: 6,
                  textTransform: "uppercase",
                }}
              >
                Ranch raised · North Dakota
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                color: "#D69B66",
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              Family owned · USDA inspected
            </span>
            <span
              style={{
                fontFamily: "Georgia",
                fontSize: 72,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.02,
                marginTop: 22,
                maxWidth: 900,
              }}
            >
              Premium beef, direct from the ranch.
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
