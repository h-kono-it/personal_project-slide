import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { loadDefaultJapaneseParser } from 'budoux';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const parser = loadDefaultJapaneseParser();

async function initResvgWasm() {
  const wasmPath = path.join(root, 'node_modules', '@resvg', 'resvg-wasm', 'index_bg.wasm');
  const wasmBuffer = fs.readFileSync(wasmPath);
  try {
    await initWasm(wasmBuffer);
  } catch (e) {
    if (!(e instanceof Error && e.message.includes('Already initialized'))) throw e;
  }
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1];
  const titleMatch = yaml.match(/^title:\s*(.+)$/m);
  const authorMatch = yaml.match(/^author:\s*(.+)$/m);
  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    author: authorMatch ? authorMatch[1].trim() : '',
  };
}

async function main() {
  await initResvgWasm();

  const slidesContent = fs.readFileSync(path.join(root, 'slides.md'), 'utf-8');
  const { title, author } = parseFrontmatter(slidesContent);

  const notoFont = fs.readFileSync(path.join(__dirname, 'fonts', 'NotoSansJP-Bold.ttf'));
  const dotGothicFont = fs.readFileSync(path.join(__dirname, 'fonts', 'DotGothic16-Regular.ttf'));
  const iconBuffer = fs.readFileSync(path.join(root, 'public', 'kouno_400x400_icon.jpg'));
  const iconBase64 = `data:image/jpeg;base64,${iconBuffer.toString('base64')}`;

  const segments = parser.parse(title);

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fafaf9',
          position: 'relative',
          padding: '60px',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                maxWidth: '1000px',
                fontSize: '56px',
                fontWeight: 700,
                color: '#1a1a1a',
                textAlign: 'center',
                lineHeight: 1.4,
                fontFamily: 'Noto Sans JP',
              },
              children: segments.map((segment) => ({
                type: 'span',
                props: { style: { display: 'block' }, children: segment },
              })),
            },
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '40px',
                left: '40px',
                display: 'flex',
                alignItems: 'center',
              },
              children: [
                {
                  type: 'img',
                  props: {
                    src: iconBase64,
                    width: 80,
                    height: 80,
                    style: { borderRadius: '50%' },
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '50px',
                right: '50px',
                fontSize: '32px',
                color: '#666',
                fontFamily: 'DotGothic16',
              },
              children: `@${author}`,
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Noto Sans JP', data: notoFont, weight: 700, style: 'normal' },
        { name: 'DotGothic16', data: dotGothicFont, weight: 400, style: 'normal' },
      ],
    }
  );

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const png = resvg.render().asPng();

  const outPath = path.join(root, 'public', 'og-image.png');
  fs.writeFileSync(outPath, png);
  console.log(`OG image generated: ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
