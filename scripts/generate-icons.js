import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateIcons() {
  const sourceIcon = path.join(__dirname, '../static/pwa-512x512.png');
  const sizes = [192, 256, 384, 512];

  console.log('🖼️ Generating PWA icons...');

  for (const size of sizes) {
    const outputPath = path.join(
      __dirname,
      `../static/pwa-${size}x${size}.png`
    );

    try {
      await sharp(sourceIcon).resize(size, size).png().toFile(outputPath);

      console.log(`✅ Generated ${size}x${size} icon`);
    } catch (error) {
      console.error(
        `❌ Failed to generate ${size}x${size} icon:`,
        error.message
      );
    }
  }

  console.log('🎉 Icon generation complete!');
}

generateIcons().catch(console.error);
