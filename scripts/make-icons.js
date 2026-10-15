// Rasterise the SVG brand assets to the PNG sizes browsers and social networks need.
const sharp = require("sharp");
const path = require("path");
const b = (f) => path.join(__dirname, "..", "src", "assets", "brand", f);
(async () => {
  const mark = b("mark.svg");
  await sharp(mark, { density: 384 }).resize(32, 32).png().toFile(b("favicon-32.png"));
  await sharp(mark, { density: 384 }).resize(180, 180).png().toFile(b("apple-touch-icon.png"));
  await sharp(mark, { density: 384 }).resize(192, 192).png().toFile(b("mark-192.png"));
  await sharp(mark, { density: 384 }).resize(512, 512).png().toFile(b("mark-512.png"));
  await sharp(b("og-default.svg"), { density: 144 }).resize(1200, 630).png({ quality: 90 }).toFile(b("og-default.png"));
  console.log("icons written");
})().catch((e) => { console.error(e); process.exit(1); });
