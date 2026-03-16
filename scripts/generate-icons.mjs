import sharp from 'sharp'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#f97316"/>
      <stop offset="50%"  stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <linearGradient id="pill" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.15"/>
    </linearGradient>
  </defs>

  <!-- Background rounded square -->
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>

  <!-- Gold star top-left -->
  <polygon points="72,30 83,62 118,62 90,82 101,114 72,94 43,114 54,82 26,62 61,62"
    fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>

  <!-- Small gold star top-right -->
  <polygon points="410,44 418,66 442,66 423,80 431,102 410,88 389,102 397,80 378,66 402,66"
    fill="#fde68a" stroke="#f59e0b" stroke-width="2"/>

  <!-- Tiny star bottom-right -->
  <polygon points="434,390 440,408 460,408 444,419 450,437 434,426 418,437 424,419 408,408 428,408"
    fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/>

  <!-- Small star bottom-left -->
  <polygon points="68,390 74,408 94,408 78,419 84,437 68,426 52,437 58,419 42,408 62,408"
    fill="#fde68a" stroke="#f59e0b" stroke-width="1.5"/>

  <!-- Main name — shadow then white -->
  <text x="258" y="296"
    text-anchor="middle"
    fill="rgba(0,0,0,0.2)"
    font-size="168"
    font-family="Arial Black, Impact, sans-serif"
    font-weight="900"
    letter-spacing="2">KLEA</text>
  <text x="256" y="292"
    text-anchor="middle"
    fill="white"
    font-size="168"
    font-family="Arial Black, Impact, sans-serif"
    font-weight="900"
    letter-spacing="2">KLEA</text>

  <!-- English pill badge -->
  <rect x="126" y="326" width="260" height="62" rx="31" fill="url(#pill)"/>
  <text x="256" y="370"
    text-anchor="middle"
    fill="white"
    font-size="38"
    font-family="Arial, sans-serif"
    font-weight="700"
    letter-spacing="3">English</text>
</svg>`

const buf = Buffer.from(SVG)

await sharp(buf).resize(512, 512).png().toFile('public/icon-512.png')
await sharp(buf).resize(192, 192).png().toFile('public/icon-192.png')

// Also generate apple-touch-icon
await sharp(buf).resize(180, 180).png().toFile('public/apple-touch-icon.png')

console.log('Icons generated ✓')
