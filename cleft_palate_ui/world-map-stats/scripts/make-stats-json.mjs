// scripts/make-stats-json.mjs
import xlsx from "xlsx";
import fs from "fs";

const INPUT = "public/CLP Global Raw.xlsx";
const OUT_DIR = "src/data";
const OUT_STATS = `${OUT_DIR}/adjustedStats.json`;
const YEARS = ["2030", "2040", "2050"];

// --- Helpers ---
function toNum(v) {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const s = String(v).trim();
  if (!s || /^[-–—]+$/u.test(s) || /^n\/?a$/i.test(s)) return null;

  // Handle things like "<0.1", "≈0.2", "0.12%", "1,234", "1.5 per 1,000", "1.2 (SE 0.1)"
  // Grab the first number-looking token (digits, dot, minus)
  const m = s.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!m) return null;

  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? n : null;
}

function findCol(headers, patterns, label) {
  const tryMatch = (h) => {
    const cleaned = h.replace(/\s+/g, " ").trim();
    return patterns.some((p) =>
      typeof p === "string"
        ? cleaned.toLowerCase() === p.toLowerCase()
        : p.test(cleaned)
    );
  };
  const found = headers.find(tryMatch);
  if (!found) {
    console.warn(`⚠️  Column not found for "${label}". Tried patterns:`, patterns);
  }
  return found || null;
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`❌ Missing ${INPUT}. Put your Excel there.`);
    process.exit(1);
  }

  const wb = xlsx.readFile(INPUT);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: true });

  if (!rows.length) {
    console.error("❌ No rows found in the first sheet.");
    process.exit(1);
  }

  const headers = Object.keys(rows[0] || {});
  console.log("📄 Detected headers:", headers);

  // Columns — accept small header wording variations
  const yearCol = findCol(headers, [/^year$/i], "Year") || "Year";
  const countryCol = findCol(headers, [/^country$/i], "Country") || "Country";

  // Main adjusted incidence value
  const adjIncCol = findCol(
    headers,
    [
      /^Adjusted Incidence per Birth Population$/i,
      /^Adjusted Incidence Rate per Birth Population$/i, // some files include "Rate"
      /Adjusted.*Incidence.*Birth Population/i,
    ],
    "Adjusted Incidence per Birth Population"
  );

  const adjIncLowerCol = findCol(
    headers,
    [
      /^Adjusted Incidence Rate per Birth Population \(Lower\)$/i,
      /Adjusted.*Incidence.*Birth Population.*\(Lower\)/i,
    ],
    "Adjusted Incidence Rate per Birth Population (Lower)"
  );

  const adjIncUpperCol = findCol(
    headers,
    [
      /^Adjusted Incidence Rate per Birth Population \(Upper\)$/i,
      /Adjusted.*Incidence.*Birth Population.*\(Upper\)/i,
    ],
    "Adjusted Incidence Rate per Birth Population (Upper)"
  );

  const adjDalyCol = findCol(
    headers,
    [
      /^Adjusted Incidence of DALYs per Birth Population$/i,
      /Adjusted.*DALYs.*Birth Population/i,
    ],
    "Adjusted Incidence of DALYs per Birth Population"
  );

  const adjDalyLowerCol = findCol(
    headers,
    [
      /^Adjusted Incidence of DALYs per Birth Population \(Lower\)$/i,
      /Adjusted.*DALYs.*Birth Population.*\(Lower\)/i,
    ],
    "Adjusted Incidence of DALYs per Birth Population (Lower)"
  );

  const adjDalyUpperCol = findCol(
    headers,
    [
      /^Adjusted Incidence of DALYs per Birth Population \(Upper\)$/i,
      /Adjusted.*DALYs.*Birth Population.*\(Upper/i,
    ],
    "Adjusted Incidence of DALYs per Birth Population (Upper)"
  );

  console.log("✅ Matched columns:", {
    yearCol,
    countryCol,
    adjIncCol,
    adjIncLowerCol,
    adjIncUpperCol,
    adjDalyCol,
    adjDalyLowerCol,
    adjDalyUpperCol,
  });

  const stats = {};

  for (const r of rows) {
    const yearStr = String(r[yearCol]).trim();
    // tolerate numeric years in the sheet (2030) vs strings "2030"
    const yr = YEARS.find((y) => y === yearStr || Number(y) === Number(yearStr));
    if (!yr) continue;

    const country = String(r[countryCol] ?? "").trim();
    if (!country) continue;

    const ai = toNum(adjIncCol ? r[adjIncCol] : null);
    const ail = toNum(adjIncLowerCol ? r[adjIncLowerCol] : null);
    const aiu = toNum(adjIncUpperCol ? r[adjIncUpperCol] : null);
    const ad = toNum(adjDalyCol ? r[adjDalyCol] : null);
    const adl = toNum(adjDalyLowerCol ? r[adjDalyLowerCol] : null);
    const adu = toNum(adjDalyUpperCol ? r[adjDalyUpperCol] : null);

    if (!stats[country]) stats[country] = {};
    stats[country][yr] = {
      adjusted_incidence: ai,
      adjusted_incidence_ci: [ail, aiu],
      adjusted_daly: ad,
      adjusted_daly_ci: [adl, adu],
    };
  }

  // Debug: print a few samples to confirm parsing
  const sample = Object.entries(stats).slice(0, 5);
  console.log("🔎 Sample parsed entries:", JSON.stringify(Object.fromEntries(sample), null, 2));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_STATS, JSON.stringify(stats, null, 2));
  console.log(
    `✅ Wrote ${OUT_STATS} with ${Object.keys(stats).length} countries across years ${YEARS.join(", ")}`
  );
}

main();
