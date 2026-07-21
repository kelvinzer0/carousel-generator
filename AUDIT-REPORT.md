# 🔍 Code Audit Report — carousel-generator

**Date**: 2026-07-21  
**Commit**: `63bc733` (fix(export): embed Google Fonts as data URIs)  
**Auditor**: AI Agent  
**Scope**: Full codebase (~14,139 LOC across 50+ TypeScript/TSX files)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 5 |
| 🟡 Medium | 8 |
| 🟢 Low | 4 |

**Overall Score**: 6.5/10 — Functional but has runtime stability issues and security gaps.

---

## 🔴 Critical Issues

### 1. Runtime Crash: `.source` accessed without null check
**Location**: 5 files  
**Impact**: App crashes when slide elements have incomplete data

```tsx
// ❌ Crashes if image.source is undefined
const source = image.source.src || "https://placehold.co/400x200";

// ✅ Fix
const source = image?.source?.src || "https://placehold.co/400x200";
```

**Files affected**:
- `src/components/elements/content-image.tsx:33`
- `src/components/elements/background-image-layer.tsx:23`
- `src/components/elements/signature.tsx:64,67`
- `src/components/pages/common-page.tsx:110`
- `src/components/ai-textarea-form.tsx:125-127`

### 2. Runtime Crash: `.style` accessed without null check
**Location**: 3 files  
**Impact**: App crashes when image style data is missing

```tsx
// ❌ Crashes if image.style is undefined
opacity: image.style.opacity / 100;

// ✅ Fix
opacity: (image?.style?.opacity ?? 100) / 100;
```

**Files affected**:
- `src/components/elements/content-image.tsx:54,56,61`
- `src/components/elements/background-image-layer.tsx:26`
- `src/components/elements/signature.tsx:71`

### 3. Runtime Crash: Missing `filename` in document object
**Location**: `src/components/slides-editor.tsx:46`  
**Impact**: TypeScript error in CI, potential runtime issues

```tsx
// ❌ Missing filename field
const document = { config, slides };

// ✅ Fix
const filename = watch("filename") as z.infer<typeof DocumentSchema>["filename"];
const document = { config, slides, filename };
```

---

## 🟠 High Severity Issues

### 4. XSS Risk: `dangerouslySetInnerHTML` Usage
**Location**: 3 files  
**Impact**: Potential XSS if markdown content is malicious

```tsx
// src/components/ai-textarea-form.tsx:203
dangerouslySetInnerHTML={{ __html: htmlContent }}

// src/components/ui/auto-text-area.tsx:78
dangerouslySetInnerHTML={{ __html: inlineMarkdownToHtml(textValue) + "\n" }}

// src/components/ui/gradient-textarea.tsx:111
dangerouslySetInnerHTML={{ __html: inlineMarkdownToHtml(textValue) + "\n" }}
```

**Recommendation**: Sanitize HTML output with DOMPurify or similar library.

### 5. SSRF Risk: Open Proxy Routes
**Location**: `src/app/api/proxy/route.ts`  
**Impact**: Can be abused to fetch arbitrary URLs

```tsx
// ❌ No domain restrictions — can fetch ANY URL
const response = await fetch(imageUrl, { ... });
```

**Recommendation**: Add domain allowlist similar to `fonts-proxy/route.ts`.

### 6. No Rate Limiting on API Routes
**Location**: All API routes  
**Impact**: Vulnerable to abuse, can rack up API costs

**Affected routes**:
- `/api/proxy` — No rate limit
- `/api/pixabay` — No rate limit
- `/api/fonts-proxy` — No rate limit
- `/api/upload` — No rate limit

**Recommendation**: Implement rate limiting with Upstash Redis (already configured for server actions).

### 7. Error Handling: User-facing `alert()` for Errors
**Location**: `src/lib/hooks/use-component-printer.tsx`  
**Impact**: Poor UX, blocks UI thread

```tsx
// ❌ Blocking alert for errors
alert(`PDF export failed: ${msg}`);
alert(`Image export failed: ${msg}`);
```

**Recommendation**: Use toast notifications (already available via `useToast`).

### 8. Deprecated Dependencies
**Location**: `package.json`  
**Impact**: Security vulnerabilities, missing features

```
next@14.0.4 — Deprecated, has security vulnerability
eslint@8.57.1 — Deprecated
```

**Recommendation**: Upgrade to Next.js 15+ and ESLint 9+.

---

## 🟡 Medium Severity Issues

### 9. Performance: All Fonts Preloaded in Layout
**Location**: `src/app/layout.tsx`  
**Impact**: Slower initial page load (10+ font families loaded upfront)

```tsx
// ❌ Loading 10+ font families synchronously
const dm_sans = DM_Sans({ ... });
const dm_serif_display = DM_Serif_Display({ ... });
const montserrat = Montserrat({ ... });
// ... 7 more fonts
```

**Recommendation**: Load fonts dynamically based on user selection, not all at once.

### 10. Type Safety: `any` Types Used
**Location**: Multiple files  
**Impact**: Loss of type safety, potential bugs

```tsx
// src/lib/hooks/use-component-printer.tsx:258
(info.element.style as any).WebkitBackdropFilter = "none";

// src/app/api/pixabay/route.ts:42
const images = data.hits.map((hit: any) => ({
```

**Recommendation**: Define proper types for WebkitCSSProperties and Pixabay API response.

### 11. Missing Error Boundaries
**Location**: `src/app/page.tsx`  
**Impact**: Entire app crashes on unhandled errors

**Recommendation**: Add React Error Boundary at app level.

### 12. Console Logging in Production
**Location**: 39 instances across codebase  
**Impact**: Performance overhead, potential info leakage

```tsx
console.error("PDF export failed:", err);
console.warn("Failed to embed font file:", url, err);
```

**Recommendation**: Use proper logging library with environment-based levels.

### 13. Hardcoded External URLs
**Location**: `src/app/layout.tsx`  
**Impact**: External dependency, potential breakage

```tsx
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
  integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
/>
```

**Recommendation**: Self-host Font Awesome or use as npm package.

### 14. Missing Input Validation on Server Actions
**Location**: `src/app/actions.tsx`  
**Impact**: Potential abuse, no input sanitization

```tsx
export async function generateCarouselSlidesAction(userPrompt: string) {
  // ❌ No validation on prompt length or content
  const generatedSlides = await generateCarouselSlides(userPrompt, ...);
}
```

**Recommendation**: Add input validation (max length, content filtering).

### 15. Memory Leak: Font Cache Never Cleared
**Location**: `src/lib/google-fonts.ts`  
**Impact**: Memory grows unbounded in long sessions

```tsx
// ❌ Caches grow forever
const loadedFonts = new Set<string>();
const embeddedFontCSSCache = new Map<string, string>();
```

**Recommendation**: Implement LRU cache with size limits.

### 16. Accessibility: Missing ARIA Labels
**Location**: Multiple interactive components  
**Impact**: Screen reader users can't identify controls

**Examples**:
- Image upload buttons
- Export/download buttons
- Slide navigation controls

---

## 🟢 Low Severity Issues

### 17. Code Style: Inconsistent Naming
**Location**: Various  
**Impact**: Readability

- Mix of `camelCase` and `snake_case` in API routes (`folder_path` vs `folderPath`)
- Inconsistent component file naming (`ai-textarea-form.tsx` vs `auto-textarea.tsx`)

### 18. Unused Imports
**Location**: Various files  
**Impact**: Bundle size (minimal)

### 19. Missing JSDoc Comments
**Location**: Most functions  
**Impact**: Developer experience

### 20. Duplicate Font Loading Logic
**Location**: `src/lib/google-fonts.ts` and `src/app/layout.tsx`  
**Impact**: Maintenance burden

---

## Positive Findings ✅

1. **Good use of Zod schemas** — Strong runtime validation for document structure
2. **Proper TypeScript generics** — Well-typed form hooks with react-hook-form
3. **Good separation of concerns** — Components, hooks, providers, validation layers
4. **Smart export approach** — Font embedding for html-to-image is well-implemented
5. **Proper cleanup patterns** — DOM modifications are properly restored after export
6. **Rate limiting on AI actions** — Server actions have Upstash rate limiting
7. **Good proxy security** — `fonts-proxy` has proper domain allowlist

---

## Recommendations by Priority

### Immediate (This Sprint)
1. ✅ ~~Fix `.source` and `.style` optional chaining~~ (Fixed in commits, rolled back)
2. Fix `filename` missing in document object
3. Add domain allowlist to `/api/proxy` route
4. Replace `alert()` with toast notifications

### Short-term (Next Sprint)
1. Sanitize `dangerouslySetInnerHTML` output
2. Add rate limiting to all API routes
3. Upgrade deprecated dependencies
4. Add React Error Boundary

### Medium-term
1. Implement dynamic font loading
2. Add proper TypeScript types (remove `any`)
3. Self-host Font Awesome
4. Add input validation to server actions

### Long-term
1. Implement LRU cache for fonts
2. Add comprehensive ARIA labels
3. Set up proper logging infrastructure
4. Add E2E tests for export functionality

---

## Files Requiring Immediate Attention

| File | Issues | Priority |
|------|--------|----------|
| `src/components/elements/content-image.tsx` | `.source`, `.style` crashes | 🔴 Critical |
| `src/components/elements/background-image-layer.tsx` | `.source`, `.style` crashes | 🔴 Critical |
| `src/components/elements/signature.tsx` | `.source`, `.style` crashes | 🔴 Critical |
| `src/components/slides-editor.tsx` | Missing `filename` | 🔴 Critical |
| `src/app/api/proxy/route.ts` | SSRF vulnerability | 🟠 High |
| `src/lib/hooks/use-component-printer.tsx` | `alert()` usage | 🟠 High |

---

*End of Audit Report*
