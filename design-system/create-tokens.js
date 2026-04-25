// ============================================================
// App Design System — Figma Variable Creator
// ============================================================
// HOW TO RUN:
//   1. Open your Figma file (des-sys)
//   2. Menu → Plugins → Development → New Plugin
//   3. Choose "Run once" → paste this entire file → Run
//   OR: Menu → Plugins → Development → Open Console → paste & Enter
// ============================================================

async function createDesignSystem() {
  // Create the variable collection
  const collection = figma.variables.createVariableCollection("App Design System");
  const modeId = collection.defaultModeId;
  collection.renameMode(modeId, "Light");

  // Helper: hex string → Figma RGBA
  function hex(h) {
    return {
      r: parseInt(h.slice(1, 3), 16) / 255,
      g: parseInt(h.slice(3, 5), 16) / 255,
      b: parseInt(h.slice(5, 7), 16) / 255,
      a: 1,
    };
  }

  function color(name, hexValue) {
    const v = figma.variables.createVariable(name, collection.id, "COLOR");
    v.setValueForMode(modeId, hex(hexValue));
    return v;
  }

  function float(name, value) {
    const v = figma.variables.createVariable(name, collection.id, "FLOAT");
    v.setValueForMode(modeId, value);
    return v;
  }

  // ── BACKGROUNDS ──────────────────────────────────────────
  color("color/bg/base",     "#F7F7F8"); // main canvas (warm off-white)
  color("color/bg/sidebar",  "#EFEFEF"); // left file tree panel
  color("color/bg/panel",    "#FFFFFF"); // right chat/diff panel
  color("color/bg/elevated", "#FFFFFF"); // modals, dropdowns

  // ── BORDERS ──────────────────────────────────────────────
  color("color/border/default", "#E2E2E5");
  color("color/border/strong",  "#C8C8CE");

  // ── TEXT ─────────────────────────────────────────────────
  color("color/text/primary",   "#1A1A2E");
  color("color/text/secondary", "#6B6B7B");
  color("color/text/disabled",  "#A8A8B8");

  // ── ACCENT (blue-violet, Microsoft 365-adjacent) ──────────
  color("color/accent/500", "#5B5BD6"); // primary buttons, active states
  color("color/accent/400", "#7070E0"); // hover
  color("color/accent/100", "#EBEBFB"); // selected items, accent backgrounds

  // ── SUCCESS (Approve flow) ────────────────────────────────
  color("color/success/500", "#1A9E5C"); // Approve button, cell highlight
  color("color/success/100", "#E6F7EF"); // approved change row background

  // ── DANGER (Reject flow) ─────────────────────────────────
  color("color/danger/500", "#D93025"); // Reject button, error states
  color("color/danger/100", "#FDECEA"); // rejected change row background

  // ── WARNING ──────────────────────────────────────────────
  color("color/warning/500", "#D97706"); // unsaved changes indicator
  color("color/warning/100", "#FEF3C7");

  // ── NEUTRALS ─────────────────────────────────────────────
  color("color/neutral/50",  "#F9F9FA");
  color("color/neutral/100", "#F2F2F4");
  color("color/neutral/200", "#E4E4E8");
  color("color/neutral/500", "#8B8B9A");
  color("color/neutral/900", "#1A1A2E");

  // ── SPACING (4px base, desktop-compact) ──────────────────
  float("space/1",  4);
  float("space/2",  8);
  float("space/3",  12);
  float("space/4",  16);
  float("space/5",  20);
  float("space/6",  24);
  float("space/8",  32);
  float("space/10", 40);

  // ── BORDER RADIUS ────────────────────────────────────────
  float("radius/sm",   4);    // inputs, small badges
  float("radius/md",   6);    // buttons, dropdowns
  float("radius/lg",   10);   // modals, panels
  float("radius/full", 9999); // pills

  // ── FONT SIZES ───────────────────────────────────────────
  float("font-size/xs",   11); // file tree labels, metadata
  float("font-size/sm",   12); // timestamps, secondary labels
  float("font-size/base", 13); // body, chat messages, change list
  float("font-size/md",   14); // tab labels, panel headers
  float("font-size/lg",   16); // section headings
  float("font-size/xl",   20); // modal/page titles

  // ── FONT WEIGHTS ─────────────────────────────────────────
  float("font-weight/regular",  400);
  float("font-weight/medium",   500);
  float("font-weight/semibold", 600);

  // ── LINE HEIGHTS ─────────────────────────────────────────
  float("line-height/tight",  1.3); // headings
  float("line-height/normal", 1.5); // body text

  figma.closePlugin("✅ App Design System tokens created! Check the Variables panel.");
}

createDesignSystem().catch((err) =>
  figma.closePlugin("❌ Error: " + err.message)
);
