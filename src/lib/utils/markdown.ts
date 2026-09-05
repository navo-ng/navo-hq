import DOMPurify from "isomorphic-dompurify";

const MARKDOWN_SANITIZER_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3",
    "p", "br", "blockquote", "pre", "code",
    "strong", "em", "del",
    "ul", "ol", "li",
    "a", "img",
  ],
  ALLOWED_ATTR: [
    "href", "target", "rel", "title",
    "src", "alt", "width", "height",
    "class",
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^:]|$))/i,
  ADD_ATTR: ["target"],
  FORBID_TAGS: ["script", "style", "iframe", "form", "object", "embed"],
  FORBID_ATTR: ["onerror", "onload", "onclick"],
};

export function renderMarkdown(content: string): string {
  if (!content) return "";

  let html = content
    // Code blocks (triple backtick)
    .replace(/```([\s\S]*?)```/g, '<pre class="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 my-2 overflow-x-auto text-sm"><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-sm">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Strikethrough
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-navo-blue hover:underline">$1</a>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-gray-900 dark:text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-2">$1</h1>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-700 dark:text-gray-300">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700 dark:text-gray-300">$1</li>')
    // Line breaks
    .replace(/\n/g, "<br />");

  // Wrap consecutive list items
  html = html.replace(/(<li[^>]*>.*?<\/li>(\s*<br\s*\/?>)?)+/g, (match) => {
    return `<ul class="my-1">${match.replace(/<br \/>/g, "")}</ul>`;
  });

  return DOMPurify.sanitize(html, MARKDOWN_SANITIZER_CONFIG);
}
