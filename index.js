// ============================================================
// index.js — YouTube Shorts Pipeline Entry Point
// ============================================================
// Usage: INPUT_FILE=./input/cod_crazy_1v3_clutch.mp4 node index.js
// The GitHub Actions workflow sets INPUT_FILE automatically.
// ============================================================

"use strict";

const fs           = require("fs");
const path         = require("path");
const { execSync } = require("child_process");

// ── 1. Load config ──────────────────────────────────────────
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

// ── 2. Resolve the input file ───────────────────────────────
const inputFile = process.env.INPUT_FILE;
if (!inputFile) {
  console.error("❌  Set INPUT_FILE environment variable to the clip path.");
  process.exit(1);
}
if (!fs.existsSync(inputFile)) {
  console.error(`❌  File not found: ${inputFile}`);
  process.exit(1);
}

const basename  = path.basename(inputFile, path.extname(inputFile)); // e.g. "cod_crazy_1v3_clutch"
const parts     = basename.split("_");
const gameKey   = parts[0].toLowerCase();                            // e.g. "cod"
const descWords = parts.slice(1);                                    // ["crazy","1v3","clutch"]

console.log(`🎮  Game detected : ${gameKey}`);
console.log(`📝  Description   : ${descWords.join(" ")}`);

// ── 3. Validate game mapping ────────────────────────────────
const scriptPath = config.games[gameKey];
if (!scriptPath) {
  console.error(
    `❌  No script mapped for game "${gameKey}". ` +
    `Add it to config.json. Available: ${Object.keys(config.games).join(", ")}`
  );
  process.exit(1);
}
if (!fs.existsSync(scriptPath)) {
  console.error(`❌  Script not found: ${scriptPath}`);
  process.exit(1);
}

// ── 4. Prepare output directory ─────────────────────────────
const outputDir = path.join(config.outputFolder, basename);
fs.mkdirSync(outputDir, { recursive: true });

const outputVideo = path.join(outputDir, "video.mp4");
const outputSeo   = path.join(outputDir, "seo.txt");

// ── 5. Run the FFmpeg bash script ───────────────────────────
console.log(`\n🎬  Running FFmpeg script: ${scriptPath}`);
try {
  execSync(`bash "${scriptPath}"`, {
    env: {
      ...process.env,
      INPUT:  path.resolve(inputFile),
      OUTPUT: path.resolve(outputVideo),
    },
    stdio: "inherit",   // stream FFmpeg output to Actions log
  });
  console.log(`✅  Video encoded → ${outputVideo}`);
} catch (err) {
  console.error("❌  FFmpeg script failed:", err.message);
  process.exit(1);
}

// ── 6. Generate SEO text ────────────────────────────────────
const seoText = generateSeo(gameKey, descWords);
fs.writeFileSync(outputSeo, seoText, "utf8");
console.log(`✅  SEO written  → ${outputSeo}`);
console.log("\n── SEO Preview ──────────────────────────────────────────");
console.log(seoText);
console.log("────────────────────────────────────────────────────────\n");

// ============================================================
// SEO GENERATOR — 100% local, zero external APIs
// ============================================================

function generateSeo(game, words) {
  // ── Keyword detection ──────────────────────────────────────
  const HYPE_KEYWORDS = [
    "clutch","ace","headshot","nuke","triple","double","quad","penta",
    "insane","crazy","godlike","sick","wild","epic","nuts","insanity",
  ];
  const DRIVING_KEYWORDS = [
    "drift","overtake","crash","spin","launch","race","podium","win",
    "fastest","lap","speed","boost","burnout","slide","airtime",
  ];
  const FUNNY_KEYWORDS  = ["fail","funny","lol","wtf","bruh","noob","troll","baited"];
  const WIN_KEYWORDS    = ["win","victory","won","champion","mvp","best","first"];

  const joined  = words.join(" ").toLowerCase();
  const isHype  = HYPE_KEYWORDS.some(k  => joined.includes(k));
  const isDrive = DRIVING_KEYWORDS.some(k => joined.includes(k));
  const isFunny = FUNNY_KEYWORDS.some(k  => joined.includes(k));
  const isWin   = WIN_KEYWORDS.some(k    => joined.includes(k));

  // Capitalise each word for display
  const cleanDesc = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // ── Per-game templates ─────────────────────────────────────
  const templates = {
    cod: {
      name: "Call of Duty",
      titlePrefixes: [
        "When ${desc} Goes Wrong 💀",
        "${desc} — You Won't Believe This",
        "The CRAZIEST ${desc} Moment",
        "${desc} on COD 🔥",
        "This ${desc} Clip is INSANE",
      ],
      descLines: [
        "Caught this ${desc} moment live — ${game} never disappoints.",
        "The ${desc} moments that keep you coming back to ${game}.",
        "Dropped into ${game} and this happened: ${desc}. Absolutely wild.",
        "Not gonna lie, this ${desc} play was completely unexpected. ${game} 🔥",
      ],
      extraTags: "#callofduty #cod #fps #warzone #mw3 #gaming",
    },
    forza: {
      name: "Forza",
      titlePrefixes: [
        "${desc} in Forza 🚗",
        "This ${desc} Moment in Forza is WILD",
        "When ${desc} Happens in Forza 💨",
        "The Smoothest ${desc} You'll Ever See",
        "Forza ${desc} — Insane Clip",
      ],
      descLines: [
        "Took the car out for a ${desc} session — the result speaks for itself.",
        "Forza never gets old when you pull off a ${desc} like this.",
        "This ${desc} clip in Forza was completely unscripted. Pure chaos.",
        "Pushed the car to its limits for this ${desc} moment. Forza 🚗💨",
      ],
      extraTags: "#forza #forzahorizon #racing #drivinggames #cargames #gaming",
    },
    apex: {
      name: "Apex Legends",
      titlePrefixes: [
        "${desc} in Apex 🏆",
        "This ${desc} Play in Apex is NUTS",
        "When ${desc} Carries the Game",
        "Apex ${desc} — No Way This Happened",
        "The ${desc} That Won the Match",
      ],
      descLines: [
        "Apex Legends delivering again — this ${desc} was unreal.",
        "Clutched it out with a ${desc}. Apex never stops giving.",
        "You can't script a ${desc} this good. Apex Legends 🏆",
        "The ${desc} moment that made this Apex session worth it.",
      ],
      extraTags: "#apex #apexlegends #battleroyal #apexclips #gaming",
    },
    // ── Default fallback (works for any game not listed above) ──
    default: {
      name: game.toUpperCase(),
      titlePrefixes: [
        "${desc} — Gaming Clip 🎮",
        "This ${desc} Moment is CRAZY",
        "When ${desc} Happens in ${gameName}",
        "The Best ${desc} You'll See Today",
      ],
      descLines: [
        "Caught this ${desc} moment in ${gameName}. What a play.",
        "${gameName} delivering insane ${desc} moments as always.",
        "This ${desc} clip came out of nowhere. Gaming never disappoints.",
      ],
      extraTags: "#gaming #gamer #gamingclips",
    },
  };

  const tpl    = templates[game] || templates.default;
  const gName  = tpl.name;
  const gameTag = `#${game.replace(/\s+/g, "").toLowerCase()}`;

  // ── Pick template variants (vary by word count = cheap randomness) ──
  // We avoid Math.random() so the output is deterministic for the same input.
  const seed       = words.reduce((acc, w) => acc + w.length, 0);
  const titleTpl   = tpl.titlePrefixes[seed % tpl.titlePrefixes.length];
  const descTpl    = tpl.descLines[seed % tpl.descLines.length];

  // ── Build the title ────────────────────────────────────────
  let title = titleTpl
    .replace(/\$\{desc\}/g,     cleanDesc)
    .replace(/\$\{game\}/g,     game)
    .replace(/\$\{gameName\}/g, gName);

  // Append emotion suffix based on keyword detection
  if (isFunny && !title.toLowerCase().includes("fail")) title += " 😂";
  if (isWin   && !isFunny)  title += " 🏆";
  if (isHype  && !isFunny)  title += " 🔥";
  if (isDrive && !isHype)   title += " 💨";

  // Enforce 60-char soft limit (trim words from end if needed)
  const TITLE_LIMIT = 57; // leave 3 chars for " #s" → " #shorts"
  let   titleCore   = title;
  if (titleCore.length > TITLE_LIMIT) {
    // Remove emoji suffix first, then truncate
    titleCore = titleCore.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim();
    if (titleCore.length > TITLE_LIMIT) {
      titleCore = titleCore.substring(0, TITLE_LIMIT).trim();
    }
  }
  const finalTitle = `${titleCore} #shorts`;

  // ── Build the description ──────────────────────────────────
  let descLine = descTpl
    .replace(/\$\{desc\}/g,     cleanDesc.toLowerCase())
    .replace(/\$\{game\}/g,     gName)
    .replace(/\$\{gameName\}/g, gName);

  // Extra context lines based on detected keywords
  const bonusLines = [];
  if (isHype)  bonusLines.push("The hype was real on this one. Drop a 🔥 if you agree.");
  if (isDrive) bonusLines.push("Clean driving is an art form. This one came close.");
  if (isFunny) bonusLines.push("Sometimes the game just breaks your brain 😂");
  if (isWin)   bonusLines.push("Victory feels different when you earn it like this.");

  const bonusLine = bonusLines.length > 0
    ? bonusLines[seed % bonusLines.length]
    : "Subscribe for more clips like this every week.";

  // ── Build hashtag line ─────────────────────────────────────
  const baseTags    = `#shorts #gaming ${gameTag}`;
  const extraTags   = tpl.extraTags || "";
  const keywordTags = [
    isHype  ? "#clutch #insane"           : "",
    isDrive ? "#drift #racing"            : "",
    isFunny ? "#funny #fails"             : "",
    isWin   ? "#win #victory"             : "",
  ].filter(Boolean).join(" ");

  const allTags = [baseTags, keywordTags, extraTags]
    .filter(s => s.length > 0)
    .join(" ");

  // ── Assemble final seo.txt ─────────────────────────────────
  return [
    "TITLE",
    finalTitle,
    "",
    "DESCRIPTION",
    descLine,
    bonusLine,
    "",
    allTags,
  ].join("\n");
}