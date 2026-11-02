# Design system

Source of truth in code: `frontend/src/shared/styles/globals.css`. Update both together.
UI primitives come from shadcn/ui (`radix-nova`, RTL enabled) and are branded through CSS variables.

## Colors (sampled from the logo)

### shadcn semantic variables (what components use)

| Variable | Value | Use |
|---|---|---|
| `--background` | linen `#FAF6F1` | page background |
| `--foreground` | ink `#141414` | main text |
| `--card` / `--popover` | `#FFFFFF` | cards, menus, drawers |
| `--primary` / `--primary-foreground` | `#832F88` / white | primary buttons, links, story rings |
| `--secondary` | blush `#F6E9EC` | soft buttons, soft sections |
| `--muted` / `--muted-foreground` | `#F2ECE6` / `#5C5560` | muted areas, secondary text |
| `--accent` | `primary-50` | hover tint in menus and lists (shadcn meaning) |
| `--destructive` | yarn red `#C32C3C` | errors, delete |
| `--border` / `--input` | `#E9E1D8` | borders, inputs |
| `--ring` | `primary-400` | focus ring |
| `--radius` | `1rem` | rounded, soft corners |
| `--chart-1…5` | purple, yarn red, primary-300, blush-dark, ink-muted | dashboard charts |
| `--sidebar-*` | solid brand purple with light text | dashboard sidebar (designs 09-12) |

### Brand scales (decorative)

| Token | Hex |
|---|---|
| `primary-50…900` | `#F8F0F8` … `#832F88` (600) … `#3F1742` |
| `yarn-50…600` | `#FCEDEE` · `#F8D5D8` · `#C32C3C` (500) · `#A62331` |
| `canvas` · `blush` · `ink` · `ink-muted` · `line` | `#FAF6F1` · `#F6E9EC` · `#141414` · `#5C5560` · `#E9E1D8` |
| `petal` | `#E7A3C4` (soft pink for line-art flowers) |
| `whatsapp` · `whatsapp-dark` | `#25D366` · `#1DA851` (floating chat button only) |
| `success` · `warning` · `info` (+ `-50` tints) | `#2F855A` · `#B7791F` · `#2B6CB0` (order status badges) |

A dark theme is only planned for the dashboard (later). The storefront is light only.

## Typography

| Token | Arabic | English |
|---|---|---|
| `font-sans` | Alexandria | DM Sans |
| `font-display` | Alexandria | Fraunces (serif) |
| `font-script` | Aref Ruqaa | Allura (hand-lettered accents only: "Handmade with love", "Just for you"; not preloaded) |

In RTL the Arabic font leads the stack automatically (`[dir="rtl"]` override).

## Logo

- `public/brand/logo.png`: transparent, for light backgrounds.
- `public/brand/logo-light.png`: needle + "osa" in cream, for dark backgrounds (footer, story viewer).
- The source is a 388px PNG, fine for header sizes up to ~120px tall. A vector (SVG) version is still
  recommended for print and large hero use.
- Never place the logo inside a white box.

## Motifs

- **Thread line** (`ThreadLine`): thin purple SVG path that "sews" sections together, drawn on scroll. Variants: `wave`, `heart` (loops into a small heart; used under stacked section titles).
- **Stitch borders:** `stitch` (dashed primary-300) and `stitch-soft` (dashed primary-200) for dividers, badges, cards.
- **Yarn ball** (`YarnBall`): line-drawn SVG accent at the end of inline section titles; `spinning` makes it a loader.
- **Section titles** (`SectionTitle`): `stacked` (centered + heart thread) or `inline` (title, stitched line, yarn ball, optional "view all").
- Rounded cards, soft purple-tinted shadows (`shadow-soft`, `shadow-card`), generous whitespace, real lifestyle photography.

## Illustrations (fixed brand artwork)

Source PNGs live in `docs/assets/`; optimized WebP copies in `frontend/public/illustrations/`, rendered with
`<Illustration name=... />` (`shared/components/illustration`). Content images (hero, banners, products) are NOT
here: they are uploaded from the dashboard to Cloudinary. `hero-baby-set` is only the default hero.

| Name | Use |
|---|---|
| `yarn-ball` | brand accent |
| `handmade-with-love` | blush signature on dark/purple areas |
| `yarn-happy` | order success page |
| `yarn-basket` | login page |
| `sidebar-flowers` | bottom of the dashboard sidebar |
| `empty-cart` · `empty-search` | empty states (cart, no results, 404) |

## Dashboard notes

- Sidebar: solid brand purple, cream logo (`logo-light.png` is the full logo recolored cream, yarn ball kept red).
- Cards are `Panel` (title + icon + optional action); stat cards use a stitched bottom line; tables are shadcn `Table`.
- Status colors for charts and badges are tokens (`success`, `warning`, `info`, `yarn`, `primary-*`); never raw hex.
- Color swatches of products (data from the database) are the one place that uses an inline `style`,
  because the color is data, not a brand value.
- `app/global-error.tsx` is the other exception: it renders when the root layout itself failed, so it carries
  its own plain styles and a two-language message.

Generated images come with a glow/halo around the edges; clean them before adding (erode the alpha edge, keep
the large components) and check them on the real background colour.
