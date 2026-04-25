// ============================================================
// App Themes — 3 Modes for Preview
// ============================================================
// HOW TO RUN:
//   Figma → Plugins → Development → Open Console
//   Paste this entire file → press Enter
// ============================================================
// After running:
//   Open Variables panel (right sidebar → Variables)
//   Switch between "Slate", "Warm Office", "Sage" modes to preview
//   Tell Claude which one you want
// ============================================================

async function createThemes() {
  const collection = figma.variables.createVariableCollection("App Themes");

  // Rename default mode and add the other two
  const modeSlate     = collection.defaultModeId;
  collection.renameMode(modeSlate, "Slate");
  const modeWarm  = collection.addMode("Warm Office");
  const modeSage  = collection.addMode("Sage");

  function hex(h) {
    return { r: parseInt(h.slice(1,3),16)/255, g: parseInt(h.slice(3,5),16)/255, b: parseInt(h.slice(5,7),16)/255, a: 1 };
  }

  // Create a COLOR variable with per-theme values
  function themeColor(name, slate, warm, sage) {
    const v = figma.variables.createVariable(name, collection.id, "COLOR");
    v.setValueForMode(modeSlate, hex(slate));
    v.setValueForMode(modeWarm,  hex(warm));
    v.setValueForMode(modeSage,  hex(sage));
    return v;
  }

  // Create a COLOR variable with the same value across all themes
  function sharedColor(name, value) {
    return themeColor(name, value, value, value);
  }

  // Create a FLOAT variable (same across all themes)
  function sharedFloat(name, value) {
    const v = figma.variables.createVariable(name, collection.id, "FLOAT");
    v.setValueForMode(modeSlate, value);
    v.setValueForMode(modeWarm,  value);
    v.setValueForMode(modeSage,  value);
    return v;
  }

  // ── THEME-SPECIFIC COLORS ─────────────────────────────────
  //                              Slate      Warm Office  Sage
  themeColor("color/bg/base",    "#F5F6F8", "#F7F7F8",  "#F6F6F4");
  themeColor("color/bg/sidebar", "#ECEEF2", "#EFEFEF",  "#EEEEE9");
  themeColor("color/bg/panel",   "#FFFFFF", "#FFFFFF",  "#FFFFFF");
  themeColor("color/bg/elevated","#FFFFFF", "#FFFFFF",  "#FFFFFF");

  themeColor("color/text/primary","#1C1E2E","#1A1A2E",  "#1C1C1A");

  themeColor("color/accent/500", "#4F6AF5", "#5B5BD6",  "#0D9488");
  themeColor("color/accent/400", "#6478F7", "#7070E0",  "#14B8A6");
  themeColor("color/accent/100", "#EEF1FE", "#EBEBFB",  "#CCFBF1");

  themeColor("color/success/500","#16A34A", "#1A9E5C",  "#16A34A");
  themeColor("color/danger/500", "#DC2626", "#D93025",  "#DC2626");

  // ── SHARED COLORS (same across all themes) ────────────────
  sharedColor("color/border/default",  "#E2E2E5");
  sharedColor("color/border/strong",   "#C8C8CE");

  sharedColor("color/text/secondary",  "#6B6B7B");
  sharedColor("color/text/disabled",   "#A8A8B8");

  sharedColor("color/success/100",     "#E6F7EF");
  sharedColor("color/danger/100",      "#FDECEA");
  sharedColor("color/warning/500",     "#D97706");
  sharedColor("color/warning/100",     "#FEF3C7");

  sharedColor("color/neutral/50",      "#F9F9FA");
  sharedColor("color/neutral/100",     "#F2F2F4");
  sharedColor("color/neutral/200",     "#E4E4E8");
  sharedColor("color/neutral/500",     "#8B8B9A");
  sharedColor("color/neutral/900",     "#1A1A2E");

  // ── SPACING ───────────────────────────────────────────────
  sharedFloat("space/1",  4);
  sharedFloat("space/2",  8);
  sharedFloat("space/3",  12);
  sharedFloat("space/4",  16);
  sharedFloat("space/5",  20);
  sharedFloat("space/6",  24);
  sharedFloat("space/8",  32);
  sharedFloat("space/10", 40);

  // ── BORDER RADIUS ─────────────────────────────────────────
  sharedFloat("radius/sm",   4);
  sharedFloat("radius/md",   6);
  sharedFloat("radius/lg",   10);
  sharedFloat("radius/full", 9999);

  // ── FONT SIZES ────────────────────────────────────────────
  sharedFloat("font-size/xs",   11);
  sharedFloat("font-size/sm",   12);
  sharedFloat("font-size/base", 13);
  sharedFloat("font-size/md",   14);
  sharedFloat("font-size/lg",   16);
  sharedFloat("font-size/xl",   20);

  // ── FONT WEIGHTS ──────────────────────────────────────────
  sharedFloat("font-weight/regular",  400);
  sharedFloat("font-weight/medium",   500);
  sharedFloat("font-weight/semibold", 600);

  // ── LINE HEIGHTS ──────────────────────────────────────────
  sharedFloat("line-height/tight",  1.3);
  sharedFloat("line-height/normal", 1.5);

  figma.closePlugin("✅ 3 themes created! Open Variables panel and switch between Slate / Warm Office / Sage to preview.");
}

createThemes().catch(err => figma.closePlugin("❌ Error: " + err.message));
