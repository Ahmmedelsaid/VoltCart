// بيولّد رسومات SVG بسيطة لمنتجات الـ demo (تليفون، لابتوب، سماعة...) في public/images/products/generated.
// الصور دي رسومات توضيحية مش صور حقيقية للمنتجات. شغّله بـ: node scripts/generate-product-images.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/images/products/generated');
fs.mkdirSync(out, { recursive: true });

// body = لون الجسم، dark = ظل، light = إضاءة
const COLORS = {
  black: { body: '#232936', dark: '#12151d', light: '#454d60' },
  white: { body: '#f1f3f8', dark: '#cdd3df', light: '#ffffff' },
  silver: { body: '#d0d5de', dark: '#98a0af', light: '#eef0f5' },
  gray: { body: '#8b92a1', dark: '#5b6271', light: '#b8bdc8' },
  blue: { body: '#3b6fe0', dark: '#2349a6', light: '#7fa3f3' },
  gold: { body: '#e4c78d', dark: '#b6955a', light: '#f5e4bd' },
  green: { body: '#4f9d7f', dark: '#2e6e57', light: '#90ceb3' },
  purple: { body: '#8b6bd9', dark: '#5a3ea7', light: '#baa3ef' },
  pink: { body: '#ee90b1', dark: '#c15a80', light: '#f8c2d7' },
  red: { body: '#d94a4a', dark: '#9c2a2a', light: '#ef8c8c' },
};

const screen = (id) => `
  <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#101a3b"/><stop offset="1" stop-color="#2f56c9"/>
  </linearGradient>`;

const glow = (cx, cy, r) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#7fb0ff" opacity="0.28"/><circle cx="${cx + r * 0.5}" cy="${cy + r * 0.4}" r="${r * 0.55}" fill="#ffffff" opacity="0.12"/>`;

const shadow = (rx = 120) => `<ellipse cx="200" cy="274" rx="${rx}" ry="9" fill="#0f172a" opacity="0.1"/>`;

const DRAW = {
  phone: (c) => `
    <defs>${screen('s')}</defs>
    ${shadow(130)}
    <rect x="190" y="30" width="110" height="232" rx="22" fill="${c.body}"/>
    <rect x="190" y="30" width="110" height="232" rx="22" fill="none" stroke="${c.dark}" stroke-width="2"/>
    <rect x="203" y="43" width="44" height="48" rx="12" fill="${c.dark}"/>
    <circle cx="217" cy="57" r="8" fill="#0b0d12" stroke="${c.light}" stroke-width="2"/>
    <circle cx="217" cy="77" r="8" fill="#0b0d12" stroke="${c.light}" stroke-width="2"/>
    <circle cx="236" cy="67" r="8" fill="#0b0d12" stroke="${c.light}" stroke-width="2"/>
    <rect x="100" y="42" width="112" height="236" rx="22" fill="${c.dark}"/>
    <rect x="104" y="46" width="104" height="228" rx="19" fill="${c.body}"/>
    <rect x="110" y="52" width="92" height="216" rx="14" fill="url(#s)"/>
    ${glow(150, 130, 38)}
    <rect x="144" y="58" width="24" height="7" rx="3.5" fill="#05070b"/>`,

  laptop: (c) => `
    <defs>${screen('s')}</defs>
    ${shadow(150)}
    <rect x="86" y="46" width="228" height="152" rx="9" fill="${c.dark}"/>
    <rect x="94" y="54" width="212" height="136" rx="4" fill="url(#s)"/>
    ${glow(160, 120, 46)}
    <path d="M62 200h276l20 17a6 6 0 0 1-4 10H46a6 6 0 0 1-4-10z" fill="${c.body}" stroke="${c.dark}" stroke-width="2"/>
    <rect x="172" y="200" width="56" height="6" rx="3" fill="${c.dark}"/>`,

  tablet: (c) => `
    <defs>${screen('s')}</defs>
    ${shadow(110)}
    <rect x="88" y="34" width="224" height="230" rx="22" fill="${c.body}" stroke="${c.dark}" stroke-width="2"/>
    <rect x="100" y="46" width="200" height="206" rx="10" fill="url(#s)"/>
    ${glow(160, 120, 48)}
    <circle cx="200" cy="40" r="2.5" fill="${c.dark}"/>`,

  headphones: (c) => `
    ${shadow(110)}
    <path d="M112 172C112 52 288 52 288 172" fill="none" stroke="${c.dark}" stroke-width="22" stroke-linecap="round"/>
    <path d="M112 172C112 58 288 58 288 172" fill="none" stroke="${c.body}" stroke-width="14" stroke-linecap="round"/>
    <rect x="80" y="150" width="58" height="98" rx="26" fill="${c.body}" stroke="${c.dark}" stroke-width="2"/>
    <rect x="262" y="150" width="58" height="98" rx="26" fill="${c.body}" stroke="${c.dark}" stroke-width="2"/>
    <ellipse cx="109" cy="199" rx="18" ry="34" fill="${c.dark}"/>
    <ellipse cx="291" cy="199" rx="18" ry="34" fill="${c.dark}"/>`,

  earbuds: (c) => `
    ${shadow(100)}
    <rect x="130" y="150" width="140" height="104" rx="44" fill="${c.body}" stroke="${c.dark}" stroke-width="2"/>
    <path d="M130 200h140" stroke="${c.dark}" stroke-width="3"/>
    <circle cx="200" cy="226" r="5" fill="${c.light}"/>
    <g><ellipse cx="164" cy="92" rx="26" ry="30" fill="${c.body}" stroke="${c.dark}" stroke-width="2"/><rect x="160" y="104" width="14" height="50" rx="7" fill="${c.body}" stroke="${c.dark}" stroke-width="2"/></g>
    <g><ellipse cx="236" cy="92" rx="26" ry="30" fill="${c.body}" stroke="${c.dark}" stroke-width="2"/><rect x="226" y="104" width="14" height="50" rx="7" fill="${c.body}" stroke="${c.dark}" stroke-width="2"/></g>`,

  watch: (c) => `
    <defs>${screen('s')}</defs>
    ${shadow(70)}
    <rect x="164" y="14" width="72" height="272" rx="22" fill="${c.dark}"/>
    <rect x="138" y="86" width="124" height="128" rx="36" fill="${c.body}" stroke="${c.dark}" stroke-width="3"/>
    <rect x="148" y="96" width="104" height="108" rx="28" fill="url(#s)"/>
    ${glow(190, 140, 26)}
    <rect x="262" y="128" width="11" height="26" rx="5" fill="${c.light}" stroke="${c.dark}" stroke-width="1.5"/>`,

  speaker: (c) => {
    let dots = '';
    for (let y = 0; y < 5; y++) for (let x = 0; x < 11; x++) dots += `<circle cx="${132 + x * 13.6}" cy="${122 + y * 13.6}" r="2.6" fill="#ffffff" opacity="0.16"/>`;
    return `
    ${shadow(120)}
    <rect x="100" y="86" width="200" height="130" rx="60" fill="${c.body}" stroke="${c.dark}" stroke-width="2"/>
    <rect x="120" y="106" width="160" height="90" rx="44" fill="${c.dark}"/>
    ${dots}
    <circle cx="200" cy="96" r="4" fill="${c.light}"/>`;
  },

  tv: (c) => `
    <defs>${screen('s')}</defs>
    ${shadow(130)}
    <rect x="36" y="42" width="328" height="192" rx="8" fill="#0b0d12"/>
    <rect x="43" y="49" width="314" height="178" rx="4" fill="url(#s)"/>
    ${glow(150, 130, 64)}
    <path d="M150 234h100l12 26H138z" fill="${COLORS.black.dark}"/>`,

  monitor: (c) => `
    <defs>${screen('s')}</defs>
    ${shadow(90)}
    <rect x="66" y="46" width="268" height="168" rx="8" fill="#0b0d12"/>
    <rect x="73" y="53" width="254" height="154" rx="4" fill="url(#s)"/>
    ${glow(150, 120, 50)}
    <rect x="186" y="214" width="28" height="34" fill="${COLORS.black.body}"/>
    <rect x="140" y="246" width="120" height="11" rx="5.5" fill="${COLORS.black.dark}"/>`,

  console: (c) => `
    ${shadow(80)}
    <rect x="158" y="28" width="84" height="246" rx="34" fill="${c.dark}"/>
    <rect x="166" y="28" width="68" height="246" rx="30" fill="${c.body}"/>
    <rect x="190" y="52" width="20" height="170" rx="10" fill="${COLORS.black.dark}" opacity="0.85"/>
    <circle cx="200" cy="244" r="5" fill="#4aa3ff"/>`,

  handheld: () => `
    <defs>${screen('s')}</defs>
    ${shadow(140)}
    <rect x="48" y="90" width="64" height="124" rx="26" fill="#35b4e8"/>
    <rect x="288" y="90" width="64" height="124" rx="26" fill="#f05a5a"/>
    <rect x="100" y="86" width="200" height="132" rx="10" fill="#1b1f2a"/>
    <rect x="108" y="94" width="184" height="104" rx="4" fill="url(#s)"/>
    ${glow(170, 140, 34)}
    <circle cx="80" cy="130" r="13" fill="#12151d"/>
    <circle cx="320" cy="176" r="13" fill="#12151d"/>`,

  gamepad: (c) => `
    ${shadow(110)}
    <path d="M96 156c0-40 26-64 56-64h96c30 0 56 24 56 64 0 48-14 100-46 100-22 0-30-34-58-34s-36 34-58 34c-32 0-46-52-46-100z" fill="${c.body}" stroke="${c.dark}" stroke-width="2.5"/>
    <circle cx="150" cy="150" r="19" fill="${c.dark}"/>
    <circle cx="238" cy="188" r="19" fill="${c.dark}"/>
    <path d="M148 186v-24m-12 12h24" stroke="${c.dark}" stroke-width="7" stroke-linecap="round" transform="translate(0 4)"/>
    <circle cx="262" cy="132" r="7" fill="${c.light}"/><circle cx="286" cy="150" r="7" fill="${c.light}"/>
    <circle cx="238" cy="150" r="7" fill="${c.light}"/><circle cx="262" cy="168" r="7" fill="${c.light}"/>`,

  keyboard: (c) => {
    let keys = '';
    for (let r = 0; r < 4; r++) {
      const n = r === 3 ? 0 : 13;
      for (let i = 0; i < n; i++) keys += `<rect x="${58 + i * 22.4}" y="${124 + r * 20}" width="18.5" height="15.5" rx="3.5" fill="${c.light}" opacity="0.85"/>`;
    }
    keys += `<rect x="118" y="184" width="150" height="15.5" rx="3.5" fill="${c.light}" opacity="0.85"/>`;
    return `
    ${shadow(150)}
    <path d="M48 112h304l14 100a8 8 0 0 1-8 9H42a8 8 0 0 1-8-9z" fill="${c.body}" stroke="${c.dark}" stroke-width="2.5"/>
    ${keys}`;
  },

  mouse: (c) => `
    ${shadow(60)}
    <path d="M200 40c52 0 76 42 76 100 0 68-24 112-76 112s-76-44-76-112c0-58 24-100 76-100z" fill="${c.body}" stroke="${c.dark}" stroke-width="2.5"/>
    <path d="M200 42v92M126 134h148" stroke="${c.dark}" stroke-width="2.5" fill="none"/>
    <rect x="192.5" y="66" width="15" height="30" rx="7.5" fill="${c.dark}"/>`,

  charger: (c) => `
    ${shadow(80)}
    <rect x="166" y="52" width="13" height="34" rx="3" fill="${COLORS.silver.dark}"/>
    <rect x="221" y="52" width="13" height="34" rx="3" fill="${COLORS.silver.dark}"/>
    <rect x="146" y="82" width="108" height="150" rx="20" fill="${c.body}" stroke="${c.dark}" stroke-width="2.5"/>
    <rect x="176" y="204" width="48" height="13" rx="6.5" fill="${c.dark}"/>
    <rect x="176" y="204" width="48" height="13" rx="6.5" fill="none" stroke="${c.light}" stroke-width="1.5"/>`,

  cable: (c) => `
    ${shadow(120)}
    <path d="M78 236C60 100 190 40 200 150S340 250 322 96" fill="none" stroke="${c.body}" stroke-width="9" stroke-linecap="round"/>
    <path d="M78 236C60 100 190 40 200 150S340 250 322 96" fill="none" stroke="${c.dark}" stroke-width="2" opacity="0.4" stroke-linecap="round"/>
    <rect x="66" y="232" width="24" height="38" rx="6" fill="${COLORS.silver.body}" stroke="${COLORS.silver.dark}" stroke-width="2"/>
    <rect x="310" y="52" width="24" height="38" rx="6" fill="${COLORS.silver.body}" stroke="${COLORS.silver.dark}" stroke-width="2"/>`,

  powerbank: (c) => `
    ${shadow(80)}
    <rect x="128" y="46" width="144" height="208" rx="24" fill="${c.body}" stroke="${c.dark}" stroke-width="2.5"/>
    <rect x="128" y="130" width="144" height="44" fill="#ffffff" opacity="0.16"/>
    ${[0, 1, 2, 3].map((i) => `<circle cx="${166 + i * 22}" cy="78" r="5" fill="#59e0a0"/>`).join('')}
    <rect x="168" y="228" width="64" height="12" rx="6" fill="${c.dark}"/>`,

  camera: () => `
    ${shadow(140)}
    <rect x="144" y="72" width="112" height="36" rx="10" fill="#14171e"/>
    <rect x="62" y="96" width="276" height="150" rx="18" fill="#1c2029" stroke="#0b0d12" stroke-width="2"/>
    <rect x="62" y="96" width="62" height="150" rx="18" fill="#12151c"/>
    <circle cx="214" cy="172" r="62" fill="#0b0d12"/>
    <circle cx="214" cy="172" r="50" fill="#1b2130" stroke="#3a4256" stroke-width="3"/>
    <circle cx="214" cy="172" r="32" fill="#0f1f4a"/>
    <circle cx="204" cy="160" r="10" fill="#7fb0ff" opacity="0.45"/>
    <circle cx="302" cy="84" r="9" fill="#d94a4a"/>`,
};

// النوع -> الألوان المتاحة
const VARIANTS = {
  phone: ['black', 'blue', 'silver', 'gold', 'green', 'purple'],
  laptop: ['silver', 'gray', 'black', 'blue'],
  tablet: ['silver', 'gray', 'blue', 'purple'],
  headphones: ['black', 'white', 'blue', 'silver'],
  earbuds: ['white', 'black', 'blue'],
  watch: ['black', 'silver', 'blue', 'pink'],
  speaker: ['black', 'blue', 'red', 'gray'],
  tv: ['black'],
  monitor: ['black'],
  console: ['white', 'black'],
  handheld: ['black'],
  gamepad: ['black', 'white', 'blue'],
  keyboard: ['black', 'white'],
  mouse: ['black', 'white'],
  charger: ['white', 'black'],
  cable: ['white', 'black'],
  powerbank: ['black', 'blue', 'white'],
  camera: ['black'],
};

let count = 0;
for (const [type, colors] of Object.entries(VARIANTS)) {
  for (const color of colors) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="${type}">${DRAW[type](COLORS[color])}</svg>\n`;
    fs.writeFileSync(path.join(out, `${type}-${color}.svg`), svg);
    count++;
  }
}
console.log(`wrote ${count} images to ${out}`);
