import { ImageResponse } from "@vercel/og";
import { getCollegeBySlug } from "@/lib/data";

// Node runtime — we read from Postgres via lib/data, which uses the
// `postgres` driver. The Edge runtime lacks Node's perf_hooks.
export const runtime = "nodejs";

/**
 * Dynamic OG image per college. Renders a 1200x630 editorial composition:
 * large case-file number, college short name in 200px Fraunces, truth-score
 * counter, and the redaction-bar identity.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const college = slug ? await getCollegeBySlug(slug) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "#0B0B0B",
          color: "#EFE9DA",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}>
          <span style={{ letterSpacing: 4, textTransform: "uppercase" }}>UNFILTERED</span>
          <span style={{ letterSpacing: 4, textTransform: "uppercase", color: "#E63946" }}>
            Case · {college?.caseFileNumber ?? "UF-0000"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 28, color: "rgba(239,233,218,0.7)" }}>
            {college?.tier?.toUpperCase() ?? "TIER ?"} · {college?.category?.toUpperCase() ?? ""}
          </span>
          <span
            style={{
              fontSize: 140,
              lineHeight: 0.9,
              fontWeight: 900,
              letterSpacing: -6,
              marginTop: 10,
            }}
          >
            {(college?.shortName ?? "UNFILTERED").toUpperCase()}
          </span>
          <span style={{ fontSize: 32, fontStyle: "italic", color: "#E63946", marginTop: 16 }}>
            {college?.tagline ?? "Brochures lie. Students don't."}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "rgba(239,233,218,0.8)" }}>
          <span>Truth Score · {college?.truthScore ?? 0}/100</span>
          <span>Verified · {college?.verifiedCount ?? 0}</span>
          <span style={{ color: "#E63946" }}>BROCHURES LIE · STUDENTS DON'T</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
