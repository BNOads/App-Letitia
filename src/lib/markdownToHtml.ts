/**
 * Converts Markdown content to HTML for rendering in the document viewer.
 * Handles the common Markdown patterns found in existing documents:
 * headings, bold, italic, lists, links, images, horizontal rules, tables, etc.
 */
export function markdownToHtml(md: string): string {
  if (!md) return '';
  
  // If content already looks like HTML (has tags), return as-is
  if (md.trim().startsWith('<') && /<[a-z][\s\S]*>/i.test(md)) {
    return md;
  }

  let html = md;

  // Escape HTML entities (but preserve existing HTML tags if mixed)
  // Only escape if it doesn't look like HTML at all
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Horizontal rules: --- or *** or ___ (on their own line)
  html = html.replace(/^(\s*[-*_]{3,}\s*)$/gm, '<hr />');

  // Images: ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0;" />');

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Headings: ### H3, ## H2, # H1
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold + Italic: ***text*** or ___text___
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (but not inside words with underscores)
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Strikethrough: ~~text~~
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f4f0eb;padding:2px 6px;border-radius:4px;font-size:0.85em;">$1</code>');

  // Blockquote: > text
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid #C4A265;padding-left:12px;margin:8px 0;color:#666;">$1</blockquote>');

  // Tables: | col | col |
  html = processMarkdownTables(html);

  // Unordered lists: - item or * item
  html = processLists(html);

  // Ordered lists: 1. item
  html = processOrderedLists(html);

  // Convert remaining newlines to paragraphs
  // Split by double newlines for paragraphs
  const blocks = html.split(/\n{2,}/);
  html = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    // Don't wrap already-wrapped block elements
    if (/^<(h[1-6]|ul|ol|li|blockquote|hr|table|div|p|img|pre|code)/i.test(trimmed)) {
      return trimmed;
    }
    // Convert single newlines within a block to <br>
    const withBreaks = trimmed.replace(/\n/g, '<br />');
    return `<p>${withBreaks}</p>`;
  }).filter(Boolean).join('\n');

  return html;
}

function processMarkdownTables(html: string): string {
  const lines = html.split('\n');
  const result: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect table row (starts and ends with |, or has multiple |)
    const pipeCount = (line.match(/\|/g) || []).length;
    if (pipeCount >= 2 && !line.startsWith('<')) {
      // Check if this is a separator row (| --- | --- |)
      const isSeparator = /^\|?\s*[-:]+\s*(\|\s*[-:]+\s*)+\|?\s*$/.test(line);
      
      if (isSeparator) {
        // Skip separator rows (they just indicate header)
        if (!inTable) {
          inTable = true;
        }
        continue;
      }

      if (!inTable) {
        inTable = true;
      }
      
      // Parse cells
      const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
      tableRows.push(cells.join('</td><td>'));
    } else {
      if (inTable && tableRows.length > 0) {
        // Flush table
        let tableHtml = '<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:0.9em;">';
        tableRows.forEach((row, idx) => {
          if (idx === 0) {
            tableHtml += `<thead><tr style="background:#f4f0eb;"><th style="padding:8px 12px;border:1px solid #ddd;text-align:left;font-weight:600;">${row.replace(/<\/td><td>/g, '</th><th style="padding:8px 12px;border:1px solid #ddd;text-align:left;font-weight:600;">')}</th></tr></thead><tbody>`;
          } else {
            tableHtml += `<tr><td style="padding:8px 12px;border:1px solid #eee;">${row}</td></tr>`;
          }
        });
        tableHtml += '</tbody></table>';
        result.push(tableHtml);
        tableRows = [];
        inTable = false;
      }
      result.push(lines[i]);
    }
  }

  // Flush remaining table
  if (inTable && tableRows.length > 0) {
    let tableHtml = '<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:0.9em;">';
    tableRows.forEach((row, idx) => {
      if (idx === 0) {
        tableHtml += `<thead><tr style="background:#f4f0eb;"><th style="padding:8px 12px;border:1px solid #ddd;text-align:left;font-weight:600;">${row.replace(/<\/td><td>/g, '</th><th style="padding:8px 12px;border:1px solid #ddd;text-align:left;font-weight:600;">')}</th></tr></thead><tbody>`;
      } else {
        tableHtml += `<tr><td style="padding:8px 12px;border:1px solid #eee;">${row}</td></tr>`;
      }
    });
    tableHtml += '</tbody></table>';
    result.push(tableHtml);
  }

  return result.join('\n');
}

function processLists(html: string): string {
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const match = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (match) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${match[2]}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(line);
    }
  }
  if (inList) result.push('</ul>');

  return result.join('\n');
}

function processOrderedLists(html: string): string {
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const match = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (match) {
      if (!inList) {
        result.push('<ol>');
        inList = true;
      }
      result.push(`<li>${match[1]}</li>`);
    } else {
      if (inList) {
        result.push('</ol>');
        inList = false;
      }
      result.push(line);
    }
  }
  if (inList) result.push('</ol>');

  return result.join('\n');
}
