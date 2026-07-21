/**
 * HTML Sanitization Utility
 * 
 * Uses DOMPurify to sanitize HTML content before rendering with
 * dangerouslySetInnerHTML to prevent XSS attacks.
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content for safe rendering.
 * Removes script tags, event handlers, and other dangerous content.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code", "pre",
      "span", "div", "img", "hr", "sub", "sup", "mark",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "class", "id",
      "title", "width", "height",
    ],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize inline markdown HTML (simpler subset).
 * Used for inline text rendering with basic formatting.
 */
export function sanitizeInlineHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "b", "i", "em", "strong", "code", "mark", "br", "span",
    ],
    ALLOWED_ATTR: ["class"],
    ALLOW_DATA_ATTR: false,
  });
}
