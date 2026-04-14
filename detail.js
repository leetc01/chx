const loadState = document.getElementById("loadState");
const docContent = document.getElementById("docContent");
const tocList = document.getElementById("tocList");

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderInline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function slugify(text) {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "section";
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraphBuffer = [];

  function flushParagraph() {
    if (!paragraphBuffer.length) {
      return;
    }

    const text = paragraphBuffer.join(" ").trim();
    if (text) {
      html.push(`<p>${renderInline(text)}</p>`);
    }
    paragraphBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, "    ");
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      flushParagraph();
      html.push("<hr />");
      continue;
    }

    let match = trimmed.match(/^# (.+)$/);
    if (match) {
      flushParagraph();
      html.push(`<h1>${renderInline(match[1])}</h1>`);
      continue;
    }

    match = trimmed.match(/^## (.+)$/);
    if (match) {
      flushParagraph();
      const title = renderInline(match[1]);
      const id = slugify(match[1]);
      html.push(`<h2 id="${id}">${title}</h2>`);
      continue;
    }

    match = trimmed.match(/^### (.+)$/);
    if (match) {
      flushParagraph();
      const title = renderInline(match[1]);
      const id = slugify(match[1]);
      html.push(`<h3 id="${id}">${title}</h3>`);
      continue;
    }

    match = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (match) {
      flushParagraph();
      const depth = Math.min(Math.floor(match[1].length / 2), 3);
      html.push(
        `<div class="doc-li ordered depth-${depth}"><span class="marker">${escapeHtml(
          match[2]
        )}</span><div class="text">${renderInline(match[3].trim())}</div></div>`
      );
      continue;
    }

    match = line.match(/^(\s*)[*-]\s+(.*)$/);
    if (match) {
      flushParagraph();
      const depth = Math.min(Math.floor(match[1].length / 2), 3);
      html.push(
        `<div class="doc-li bullet depth-${depth}"><span class="marker">•</span><div class="text">${renderInline(
          match[2].trim()
        )}</div></div>`
      );
      continue;
    }

    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  return html.join("\n");
}

function buildToc() {
  const headings = Array.from(docContent.querySelectorAll("h2"));
  tocList.innerHTML = headings
    .map(
      (heading) =>
        `<a class="toc-item" href="#${heading.id}">${heading.textContent.replace(/\s+/g, " ").trim()}</a>`
    )
    .join("");
}

async function init() {
  try {
    const response = await fetch("./chx.md", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`读取 chx.md 失败：HTTP ${response.status}`);
    }

    const markdown = await response.text();
    docContent.innerHTML = parseMarkdown(markdown);
    docContent.hidden = false;
    loadState.hidden = true;
    buildToc();
  } catch (error) {
    loadState.classList.add("is-error");
    loadState.innerHTML = `
      无法载入详细方案内容。<br />
      常见原因是直接以 <code>file://</code> 打开页面导致浏览器限制读取本地 Markdown。<br />
      请通过静态服务器或部署环境访问，或直接打开 <a href="./chx.md">chx.md</a>。
    `;
    console.error(error);
  }
}

init();
