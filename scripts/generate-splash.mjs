import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const iconPath = join(root, "public", "icons", "rhythm-512x512.png");
const outDir = join(root, "public", "splash");

mkdirSync(outDir, { recursive: true });

const BG = { r: 254, g: 248, b: 245, alpha: 1 };
const LOGO_SIZE = 200;

const sizes = [
  { name: "splash-1290x2796.png", w: 1290, h: 2796 },
  { name: "splash-1179x2556.png", w: 1179, h: 2556 },
  { name: "splash-1170x2532.png", w: 1170, h: 2532 },
  { name: "splash-1125x2436.png", w: 1125, h: 2436 },
  { name: "splash-828x1792.png", w: 828, h: 1792 },
  { name: "splash-750x1334.png", w: 750, h: 1334 },
  { name: "splash-2048x2732.png", w: 2048, h: 2732 },
  { name: "splash-1536x2048.png", w: 1536, h: 2048 },
];

const logo = await sharp(iconPath).resize(LOGO_SIZE, LOGO_SIZE).toBuffer();

for (const { name, w, h } of sizes) {
  const left = Math.round((w - LOGO_SIZE) / 2);
  const top = Math.round((h - LOGO_SIZE) / 2);

  await sharp({
    create: { width: w, height: h, channels: 4, background: BG },
  })
    .composite([{ input: logo, left, top }])
    .png()
    .toFile(join(outDir, name));

  console.log(`  ✓ ${name}`);
}

console.log("Done — splash images written to public/splash/");
