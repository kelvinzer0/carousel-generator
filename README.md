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

---

## Markdown Spec

Carousel Generator supports **Markdown input** for generating slides — both manually and via AI.

### Syntax Rules

| Markdown | Result |
|---|---|
| `# Title` | **Title** element (Large, centered) — starts a new slide |
| `## Subtitle` | **Subtitle** element (Medium, centered) — starts a new slide |
| `### Heading` | **Subtitle** within current slide (does NOT start new slide) |
| `![alt](url)` | **Image** element — `alt` becomes caption, `url` is image source |
| Plain text | **Description** element (Medium, left-aligned) |
| `---` | Ignored (slide split is driven by `#` / `##` headings) |

### Image Support

Images are embedded using standard Markdown image syntax:

```markdown
![Mountain Landscape](https://images.unsplash.com/photo-1506905925346-21bda4d32df4)
```

- Supports any publicly accessible image URL
- Default display: `object-fit: Cover` (crops to fill)
- Invalid URLs fall back to a placeholder
- Images can be mixed with text in the same slide

### Sample Markdown

```markdown
# 5 Tips for Better Productivity

Boost your workflow with these proven strategies

# Tip 1: Time Blocking

Dedicate specific time slots to focused work. No meetings, no distractions.

![Time Blocking](https://images.unsplash.com/photo-1506905925346-21bda4d32df4)

# Tip 2: The 2-Minute Rule

If a task takes less than 2 minutes, do it immediately.

# Tip 3: Batch Processing

Group similar tasks together — emails, calls, admin work.

![Batch Processing](https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b)

# Tip 4: Take Strategic Breaks

Work in 25-minute sprints (Pomodoro), then take a 5-minute break.

# Tip 5: Review & Reflect

End each day by reviewing what you accomplished and planning tomorrow.

# Start Today

Pick one tip and implement it this week.

small wins compound into big results.
```

This generates **7 slides**:
1. Intro slide (Title + Description)
2. Tip 1 (Subtitle + Description + Image)
3. Tip 2 (Subtitle + Description)
4. Tip 3 (Subtitle + Description + Image)
5. Tip 4 (Subtitle + Description)
6. Tip 5 (Subtitle + Description)
7. Outro slide (Subtitle + Description)

---

## Generate with AI

AI generation uses OpenAI to create carousel content from a text prompt.

### Limits & Recommendations

| Parameter | Limit | Recommended |
|---|---|---|
| **Slides** | ~15 max | 5–10 slides |
| **Prompt length** | 2–500 chars | 50–200 chars |
| **Title text** | ~40 chars/line | Under 30 chars |
| **Description text** | ~120 chars/slide | 1–2 short sentences |
| **Image URLs** | Public URLs only | Unsplash, Pexels, etc. |

### Tips for Better AI Output

- Be specific: "5 tips for remote workers" > "tips"
- Specify tone: "professional", "casual", "motivational"
- Mention target audience: "for LinkedIn", "for Instagram"
- Keep prompts under 200 chars for best results

### Markdown from AI

AI output is returned as **Markdown** and parsed into slides. You can:
1. Edit the generated markdown directly in the textarea
2. Paste your own markdown
3. Click **Generate** to convert markdown → slides

Example AI prompt:
```
Create a 5-slide carousel about sustainable fashion for LinkedIn audience. Professional tone.
```

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
