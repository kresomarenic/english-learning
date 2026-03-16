import sharp from 'sharp'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#1d4ed8"/>
      <stop offset="50%"  stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1e40af"/>
    </linearGradient>
    <linearGradient id="pill" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.15"/>
    </linearGradient>
  </defs>

  <!-- Background rounded square -->
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>

  <!-- School building / house shape (roof triangle + body) -->
  <polygon points="256,68 340,138 172,138" fill="#fbbf24"/>
  <rect x="186" y="138" width="140" height="90" fill="#fde68a"/>
  <!-- Door -->
  <rect x="236" y="178" width="40" height="50" rx="4" fill="#1d4ed8"/>
  <!-- Windows -->
  <rect x="196" y="150" width="28" height="22" rx="3" fill="white" opacity="0.8"/>
  <rect x="288" y="150" width="28" height="22" rx="3" fill="white" opacity="0.8"/>

  <!-- School name: VK -->
  <text x="256" y="318"
    text-anchor="middle"
    fill="rgba(0,0,0,0.2)"
    font-size="112"
    font-family="Arial Black, Impact, sans-serif"
    font-weight="900"
    letter-spacing="4">VK</text>
  <text x="256" y="314"
    text-anchor="middle"
    fill="white"
    font-size="112"
    font-family="Arial Black, Impact, sans-serif"
    font-weight="900"
    letter-spacing="4">VK</text>

  <!-- English pill badge -->
  <rect x="100" y="338" width="312" height="60" rx="30" fill="url(#pill)"/>
  <text x="256" y="380"
    text-anchor="middle"
    fill="white"
    font-size="32"
    font-family="Arial, sans-serif"
    font-weight="700"
    letter-spacing="2">English</text>

  <!-- Gold stars -->
  <polygon points="52,44 60,68 86,68 65,83 73,107 52,92 31,107 39,83 18,68 44,68"
    fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/>
  <polygon points="460,44 468,68 494,68 473,83 481,107 460,92 439,107 447,83 426,68 452,68"
    fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/>
</svg>`

const buf = Buffer.from(SVG)

await sharp(buf).resize(512, 512).png().toFile('public/icon-512.png')
await sharp(buf).resize(192, 192).png().toFile('public/icon-192.png')

// Also generate apple-touch-icon
await sharp(buf).resize(180, 180).png().toFile('public/apple-touch-icon.png')

console.log('Icons generated ✓')
