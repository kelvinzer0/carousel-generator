# Carousel Generator

**Carousel Generator** — open-source tool untuk membuat dan mengkustomisasi carousel untuk LinkedIn, Instagram, dan TikTok.

🔗 [Website](https://carouselgenerator.vercel.app)

## Features

### Core
- 🪄 Generate carousels with AI (OpenAI GPT-4o-mini)
- ✍️ Forms powered by [react-hook-form](https://react-hook-form.com/) + [ZOD](https://zod.dev/) validation
- 🎨 Sleek UI components from [Shadcn/ui](https://ui.shadcn.com/)
- 🌐 Responsive layout
- 🔄 Real-time preview — automatic updates on changes
- 💾 Data persists with browser refresh
- ➕ Add, remove, or reorder slides
- 🖼️ Slide types: Intro, Content, Outro
- 📤 Export & Import settings and slide content
- 😃 Emoji support
- 📝 Multiple font selection for titles and content

### Export & Output
- 📥 **Multi-format export** — PNG, WEBP, JPEG, PDF
- 📦 **ZIP bundling** — batch export all slides as a single ZIP file
- 🎯 **High quality export** — better font handling and rendering fidelity
- 🧹 **Clean export** — UI elements (buttons, placeholders) automatically hidden during export

### Design & Styling
- 🎨 **Gradient & texture support** for text colors
- 📐 **Size presets** — LinkedIn, Instagram, TikTok carousel dimensions
- 🆎 Titles auto-balance (no orphan words)
- 🍥 Icons from [Lucide Dev](https://lucide.dev/)

## Usage

1. Visit [carouselgenerator.vercel.app](https://carouselgenerator.vercel.app)
2. Choose a size preset (LinkedIn / Instagram / TikTok)
3. Customize settings and add/edit slides
4. Use AI to generate content, or write manually
5. Export as PNG, WEBP, JPEG, or PDF

## Installation

```bash
# 1. Clone
git clone https://github.com/kelvinzer0/carousel-generator.git
cd carousel-generator

# 2. Environment
cp .env.example .env.local
# Edit .env.local with your OpenAI API key

# 3. Install
pnpm i

# 4. Run
pnpm dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (default: `http://localhost:3000`) |
| `OPENAI_API_KEY` | For AI | [OpenAI API key](https://platform.openai.com/account/api-keys) |
| `KV_REST_API_URL` | Optional | Vercel KV URL (for rate limiting) |
| `KV_REST_API_TOKEN` | Optional | Vercel KV token (for rate limiting) |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + Shadcn/ui + Radix UI
- **Forms:** react-hook-form + ZOD
- **AI:** OpenAI via LangChain
- **Export:** html-to-image + jsPDF
- **Language:** TypeScript

## License

[MIT License](LICENSE)
