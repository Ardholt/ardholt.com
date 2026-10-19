# ardholt.com

The public site of Ardholt, a London engineering practice. Plain HTML, CSS and vanilla JavaScript: no framework, no build step, no package manager, no third-party scripts. The only external request is one Google Fonts stylesheet.

## Files

- `index.html` — the page and all copy
- `assets/site.css` — styles; palette and type live in `:root`
- `assets/site.js` — behaviour: motion control, line reveals, capabilities stepper, scroll-linked effects
- `assets/truss.js` — the hero structure, drawn with raw WebGL
- `assets/viz.js` — the eight capability visuals, drawn on one canvas
- `assets/favicon.svg`, `assets/mark.svg`, `assets/og.png`

## Accessibility and motion

Every autonomous movement on the page is governed by the Motion control in the header (WCAG 2.2.2). The system `prefers-reduced-motion` setting is honoured. All text is real DOM text; canvases are decorative and hidden from assistive technology. Contrast meets WCAG 2.2 AA.

## Deploy (Cloudflare Pages)

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → this repository.
2. Build command: none. Build output directory: `/`.
3. Custom domain: `ardholt.com` (and `www.ardholt.com` redirecting to the apex).

## Licence

© Ardholt. All rights reserved. Ardholt is the trading name of Genco Doganay.
