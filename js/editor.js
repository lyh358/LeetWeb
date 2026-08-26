/* =========================================================
   公共 Markdown 编辑器组件
   工具栏 · 图片粘贴/插入 · 单界面所见即所得编辑
   依赖全局：renderMarkdown, hljs, toast
   用法：const mde = createMde({...}); mount.appendChild(mde.el);
   ========================================================= */

// 图片压缩为 data URL（内嵌进 markdown，随笔记一同同步，私库/离线均可用）
function imageToDataUrl(file, maxDim = 1400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width, h = img.height;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      w = Math.round(w * scale); h = Math.round(h * scale);
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      const isPng = /png/i.test(file.type);
      let out = cv.toDataURL(isPng ? "image/png" : "image/jpeg", quality);
      if (isPng && out.length > 1.6 * 1024 * 1024) out = cv.toDataURL("image/jpeg", quality); // 过大的 PNG 退回 JPEG
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("图片读取失败")); };
    img.src = url;
  });
}

function openMdePrompt(opts) {
  return new Promise(resolve => {
    const mask = document.createElement("div");
    mask.className = "modal-mask mde-prompt-mask";
    mask.innerHTML = `<div class="modal mde-prompt" role="dialog" aria-modal="true">
      <h3></h3><p class="modal-sub"></p><div class="field"><label></label></div>
      <div class="modal-actions"><div class="spacer"></div><button type="button" class="btn" data-cancel>取消</button><button type="button" class="btn primary" data-confirm>确定</button></div>
    </div>`;
    const title = mask.querySelector("h3"), description = mask.querySelector(".modal-sub"), field = mask.querySelector(".field"), label = field.querySelector("label");
    title.textContent = opts.title || "输入内容";
    description.textContent = opts.description || "";
    description.hidden = !opts.description;
    label.textContent = opts.label || "内容";
    const control = document.createElement(opts.multiline ? "textarea" : "input");
    if (!opts.multiline) control.type = opts.type || "text";
    else control.rows = opts.rows || 6;
    control.value = opts.value || "";
    control.placeholder = opts.placeholder || "";
    control.setAttribute("aria-label", opts.label || "内容");
    field.append(control);
    document.body.append(mask);
    const close = value => { mask.remove(); resolve(value); };
    const confirm = () => close(control.value.trim());
    mask.addEventListener("mousedown", event => { if (event.target === mask) close(null); });
    mask.querySelector("[data-cancel]").onclick = () => close(null);
    mask.querySelector("[data-confirm]").onclick = confirm;
    mask.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); close(null); }
      else if (event.key === "Enter" && (!opts.multiline || event.ctrlKey || event.metaKey)) { event.preventDefault(); confirm(); }
    });
    setTimeout(() => { control.focus(); control.select(); }, 0);
  });
}

function _wrapSel(ta, before, after, placeholder) {
  const s = ta.selectionStart, e = ta.selectionEnd;
  const sel = ta.value.slice(s, e) || placeholder || "";
  ta.value = ta.value.slice(0, s) + before + sel + after + ta.value.slice(e);
  ta.focus(); ta.selectionStart = s + before.length; ta.selectionEnd = s + before.length + sel.length;
}
function _linePrefix(ta, prefix) {
  const s = ta.selectionStart, e = ta.selectionEnd, val = ta.value;
  const lineStart = val.lastIndexOf("\n", s - 1) + 1;
  const ordered = prefix === "1. ";
  const seg = val.slice(lineStart, e).split("\n").map((ln, i) => (ordered ? `${i + 1}. ` : prefix) + ln).join("\n");
  ta.value = val.slice(0, lineStart) + seg + val.slice(e);
  ta.focus(); ta.selectionStart = lineStart; ta.selectionEnd = lineStart + seg.length;
}
function _insertAt(ta, text) {
  const s = ta.selectionStart, e = ta.selectionEnd;
  ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
  const pos = s + text.length; ta.focus(); ta.selectionStart = ta.selectionEnd = pos;
}

function _toggleHighlightSel(ta, color, placeholder) {
  const value = ta.value;
  let s = ta.selectionStart, e = ta.selectionEnd;
  const selected = value.slice(s, e);
  const full = selected.match(/^==\{(yellow|green|pink)\}([\s\S]*?)==$/);
  if (full) {
    const replacement = full[1] === color ? full[2] : `=={${color}}${full[2]}==`;
    ta.value = value.slice(0, s) + replacement + value.slice(e);
    ta.focus(); ta.selectionStart = s; ta.selectionEnd = s + replacement.length;
    return;
  }
  const opener = value.slice(0, s).match(/==\{(yellow|green|pink)\}$/);
  if (opener && value.slice(e, e + 2) === "==") {
    const openStart = s - opener[0].length;
    if (opener[1] === color) {
      ta.value = value.slice(0, openStart) + selected + value.slice(e + 2);
      ta.focus(); ta.selectionStart = openStart; ta.selectionEnd = openStart + selected.length;
    } else {
      const nextOpen = `=={${color}}`;
      ta.value = value.slice(0, openStart) + nextOpen + selected + value.slice(e);
      ta.focus(); ta.selectionStart = openStart + nextOpen.length; ta.selectionEnd = openStart + nextOpen.length + selected.length;
    }
    return;
  }
  _wrapSel(ta, `=={${color}}`, "==", placeholder || "重点内容");
}

// 将可编辑预览区的常见 HTML 结构转换回 Markdown，供预览模式直接编辑后保存。
function _previewHtmlToMarkdown(root) {
  function wrapInline(text, before, after) {
    const match = String(text || "").match(/^(\s*)([\s\S]*?\S)(\s*)$/);
    return match ? `${match[1]}${before}${match[2]}${after}${match[3]}` : text;
  }
  function math(node) {
    let source = node.dataset.mathSource || "";
    try { source = decodeURIComponent(source); } catch (error) {}
    return node.dataset.mathDisplay === "true" ? `$$\n${source}\n$$` : `$${source}$`;
  }
  const children = node => [...node.childNodes].map(inline).join("");
  function inline(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    if (node.hasAttribute("data-math-source")) return math(node);
    const tag = node.tagName.toLowerCase();
    const text = children(node);
    if (tag === "br") return "\n";
    if (tag === "strong" || tag === "b") return wrapInline(text, "**", "**");
    if (tag === "em" || tag === "i") return wrapInline(text, "_", "_");
    if (tag === "del" || tag === "s") return wrapInline(text, "~~", "~~");
    if (tag === "mark") {
      const color = node.classList.contains("highlight-green") ? "green" : node.classList.contains("highlight-pink") ? "pink" : "yellow";
      return wrapInline(text, `=={${color}}`, "==");
    }
    if (tag === "span" && node.hasAttribute("style")) {
      const style = node.style;
      let formatted = text;
      if (style.textDecorationLine.includes("line-through") || style.textDecoration.includes("line-through")) formatted = wrapInline(formatted, "~~", "~~");
      if (style.fontStyle === "italic") formatted = wrapInline(formatted, "_", "_");
      if (style.fontWeight === "bold" || Number(style.fontWeight) >= 600) formatted = wrapInline(formatted, "**", "**");
      return formatted;
    }
    if (tag === "code" && (!node.parentElement || node.parentElement.tagName !== "PRE")) return `\`${node.textContent || ""}\``;
    if (tag === "a") return `[${text}](${node.getAttribute("href") || ""})`;
    if (tag === "img") return `![${node.getAttribute("alt") || "image"}](${node.getAttribute("src") || ""})`;
    if (tag === "input" && node.type === "checkbox") return "";
    return text;
  }
  function list(el, ordered) {
    const items = [...el.children].filter(x => x.tagName === "LI");
    return items.map((li, i) => {
      const nested = [...li.children].filter(x => x.tagName === "UL" || x.tagName === "OL");
      const body = [...li.childNodes].filter(x => !(x.nodeType === Node.ELEMENT_NODE && (x.tagName === "UL" || x.tagName === "OL"))).map(inline).join("").trim();
      const tail = nested.map(x => list(x, x.tagName === "OL").trimEnd().split("\n").map(line => "  " + line).join("\n")).join("\n");
      const checkbox = [...li.querySelectorAll('input[type="checkbox"]')].find(input => input.closest("li") === li);
      const marker = ordered ? `${i + 1}. ` : checkbox ? `- [${checkbox.checked ? "x" : " "}] ` : "- ";
      return `${marker}${body}${tail ? "\n" + tail : ""}`;
    }).join("\n") + "\n\n";
  }
  function table(el) {
    const rows = [...el.querySelectorAll("tr")].map(tr => [...tr.children].map(cell => children(cell).trim()));
    if (!rows.length) return "";
    const width = Math.max(...rows.map(row => row.length));
    const normalized = rows.map(row => [...row, ...Array(Math.max(0, width - row.length)).fill("")]);
    const line = row => `| ${row.join(" | ")} |\n`;
    return line(normalized[0]) + line(Array(width).fill("---")) + normalized.slice(1).map(line).join("") + "\n";
  }
  function block(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    if (node.classList.contains("markdown-diagram")) return "";
    if (node.hasAttribute("data-math-source")) return `${math(node)}\n\n`;
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) return `${"#".repeat(Number(tag[1]))} ${children(node).trim()}\n\n`;
    if (tag === "p") return `${children(node).trimEnd()}\n\n`;
    if (tag === "pre") {
      const code = node.querySelector("code");
      const cls = code ? [...code.classList].find(x => x.startsWith("language-")) : "";
      const lang = cls ? cls.slice(9) : "";
      return `\`\`\`${lang}\n${(node.textContent || "").replace(/\n$/, "")}\n\`\`\`\n\n`;
    }
    if (tag === "ul" || tag === "ol") return list(node, tag === "ol");
    if (tag === "blockquote") return [...node.childNodes].map(block).join("").trim().split("\n").map(line => `> ${line}`).join("\n") + "\n\n";
    if (tag === "table") return table(node);
    if (tag === "hr") return "---\n\n";
    if (tag === "div") {
      const hasBlockChildren = [...node.children].some(child => /^(H[1-6]|P|PRE|UL|OL|BLOCKQUOTE|TABLE|HR|DIV)$/.test(child.tagName));
      return hasBlockChildren ? [...node.childNodes].map(block).join("") : `${children(node).trimEnd()}\n`;
    }
    return inline(node);
  }
  return [...root.childNodes].map(block).join("").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

const MDE_TOOL_GROUPS = [
  [
    ["undo", "撤销 (Ctrl/⌘ Z)", '<svg viewBox="0 0 24 24"><path d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6"/></svg>'],
    ["redo", "重做 (Ctrl/⌘ Y)", '<svg viewBox="0 0 24 24"><path d="m15 7 5 5-5 5m4-5h-8a6 6 0 0 0-6 6"/></svg>'],
  ],
  [
    ["bold", "加粗 (Ctrl/⌘ B)", "<b>B</b>"], ["italic", "斜体 (Ctrl/⌘ I)", "<i>I</i>"], ["strike", "删除线", "<s>S</s>"],
  ],
  [
    ["highlight-yellow", "黄色高亮 (Ctrl/⌘ Q)", '<span class="mde-highlight-icon yellow">✦</span>'], ["highlight-green", "绿色高亮 (Ctrl/⌘ W)", '<span class="mde-highlight-icon green">✦</span>'], ["highlight-pink", "粉色高亮 (Ctrl/⌘ E)", '<span class="mde-highlight-icon pink">✦</span>'],
  ],
  [
    ["code", "行内代码", "&lt;/&gt;"], ["codeblock", "代码块", "{ }"], ["quote", "引用", "❝"],
  ],
  [
    ["ul", "无序列表", '<svg viewBox="0 0 24 24"><circle cx="5" cy="7" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17" r="1"/><path d="M9 7h10M9 12h10M9 17h10"/></svg>'],
    ["ol", "有序列表", "1."], ["task", "任务列表", '<span class="mde-task-icon">✓</span>'],
    ["hr", "分割线", '<span class="mde-hr-icon"></span>'],
    ["table", "插入表格", '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M9 4v16M15 4v16"/></svg>'],
  ],
  [
    ["link", "插入链接 (Ctrl/⌘ K)", '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/></svg>'],
    ["image", "插入图片", '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4-4L6 20"/></svg>'],
    ["math-inline", "行内公式", '<span class="mde-math-icon">∑</span>'],
    ["math-block", "块级公式", '<span class="mde-math-icon block">∑</span>'],
  ],
];

/*
  opts:
    value            初始文本
    placeholder      占位符
    mode             兼容旧调用；单界面编辑器始终处于 live 模式
    onInput(value)   每次输入回调（用于自动保存，调用方自行防抖）
    decoratePreview()  可选，返回预览区顶部要额外插入的 HTML（如 PDF）
    documentReader    启用 A4 阅读版式与单双页、缩放控制
*/
function createMde(opts) {
  opts = opts || {};
  const root = document.createElement("div");
  root.className = "mde" + (opts.documentReader ? " document-reader" : "");
  root.innerHTML = `
    <div class="mde-tools">
      <button type="button" class="mde-outline-toggle" title="显示或隐藏文档大纲" aria-label="显示或隐藏文档大纲" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6h4M4 12h4M4 18h4M11 6h9M11 12h9M11 18h9"/></svg></button>
      <div class="mde-fmt">
        <label class="mde-heading-picker" title="标题级别">
          <span class="sr-only">标题级别</span>
          <select data-heading aria-label="标题级别">
            <option value="">标题</option>
            <option value="paragraph">正文</option>
            <option value="h1">一级标题 H1</option>
            <option value="h2">二级标题 H2</option>
            <option value="h3">三级标题 H3</option>
            <option value="h4">四级标题 H4</option>
            <option value="h5">五级标题 H5</option>
            <option value="h6">六级标题 H6</option>
          </select>
        </label>
        ${MDE_TOOL_GROUPS.map(group => `<span class="mde-tool-group">${group.map(([c, t, l]) => `<button type="button" data-cmd="${c}" title="${t}" aria-label="${t}">${l}</button>`).join("")}</span>`).join("")}
      </div>
      <div class="spacer"></div>
      ${opts.documentReader ? `<div class="mde-reader-controls" aria-label="阅读版式">
        <button type="button" data-reader-pages="one" title="单页阅读">单页</button>
        <button type="button" data-reader-pages="two" title="双页阅读">双页</button>
        <span class="reader-divider"></span>
        <button type="button" data-reader-zoom="out" title="缩小">−</button>
        <button type="button" data-reader-zoom="reset" title="重置缩放">100%</button>
        <button type="button" data-reader-zoom="in" title="放大">＋</button>
      </div>` : ""}
    </div>
    <div class="mde-body">
      <aside class="mde-outline" aria-label="文档大纲" hidden>
        <div class="mde-outline-head"><span>文档大纲</span><button type="button" class="mde-outline-collapse" title="折叠全部章节" aria-label="折叠全部章节"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m7 10 5 5 5-5M4 5h16"/></svg></button></div>
        <nav class="mde-outline-list" aria-label="标题导航"></nav>
      </aside>
      <textarea class="mde-ta" hidden aria-hidden="true"></textarea>
      <div class="mde-view"></div>
    </div>`;

  const ta = root.querySelector(".mde-ta");
  const view = root.querySelector(".mde-view");
  const outline = root.querySelector(".mde-outline");
  const outlineList = root.querySelector(".mde-outline-list");
  const outlineToggle = root.querySelector(".mde-outline-toggle");
  const collapsedHeadings = new Set();
  ta.value = opts.value || "";
  ta.placeholder = opts.placeholder || "";
  const mode = "view";
  let imgInput = null;
  let readerPages = "one", readerScale = 1;
  let savedRange = null;

  function rememberLiveSelection() {
    const editable = view.querySelector("[data-preview-editable]");
    const selection = window.getSelection();
    if (!editable || !selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (editable.contains(range.commonAncestorContainer)) savedRange = range.cloneRange();
  }

  function restoreLiveSelection(editable) {
    if (!savedRange || !savedRange.commonAncestorContainer.isConnected || !editable.contains(savedRange.commonAncestorContainer)) return false;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
    return true;
  }

  function updateOutline() {
    const headings = [...view.querySelectorAll(".markdown h1, .markdown h2, .markdown h3, .markdown h4, .markdown h5, .markdown h6")];
    if (!headings.length) {
      outlineList.innerHTML = '<div class="mde-outline-empty">暂无标题</div>';
      return;
    }
    const ids = new Map();
    const minLevel = Math.min(...headings.map(heading => Number(heading.tagName.slice(1))));
    const items = headings.map((heading, index) => {
      const text = heading.textContent.trim() || "无标题";
      const base = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "section";
      const count = ids.get(base) || 0;
      ids.set(base, count + 1);
      heading.id = `${base}${count ? `-${count}` : ""}`;
      const level = Number(heading.tagName.slice(1));
      const next = headings[index + 1];
      return { heading, text, level, depth: level - minLevel, hasChildren: !!next && Number(next.tagName.slice(1)) > level };
    });
    outlineList.innerHTML = "";
    const hiddenParents = [];
    items.forEach(item => {
      while (hiddenParents.length && item.level <= hiddenParents[hiddenParents.length - 1]) hiddenParents.pop();
      const row = document.createElement("div");
      row.className = "mde-outline-item";
      row.style.setProperty("--outline-depth", String(item.depth));
      row.hidden = hiddenParents.length > 0;
      const fold = document.createElement("button");
      fold.type = "button";
      fold.className = "mde-outline-fold";
      fold.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m7 5 5 5-5 5"/></svg>';
      fold.disabled = !item.hasChildren;
      fold.classList.toggle("collapsed", collapsedHeadings.has(item.heading.id));
      fold.title = collapsedHeadings.has(item.heading.id) ? "展开章节" : "折叠章节";
      fold.onclick = () => {
        if (collapsedHeadings.has(item.heading.id)) collapsedHeadings.delete(item.heading.id);
        else collapsedHeadings.add(item.heading.id);
        updateOutline();
      };
      const link = document.createElement("button");
      link.type = "button";
      link.className = "mde-outline-link";
      link.textContent = item.text;
      link.title = item.text;
      link.dataset.target = item.heading.id;
      link.onclick = () => {
        item.heading.scrollIntoView({ behavior: "smooth", block: "start" });
        outlineList.querySelectorAll(".mde-outline-link").forEach(entry => entry.classList.toggle("active", entry === link));
      };
      row.append(fold, link);
      outlineList.append(row);
      if (collapsedHeadings.has(item.heading.id) && item.hasChildren) hiddenParents.push(item.level);
    });
  }

  outlineToggle.onclick = () => {
    const open = outline.hidden;
    outline.hidden = !open;
    root.classList.toggle("outline-open", open);
    outlineToggle.classList.toggle("active", open);
    outlineToggle.setAttribute("aria-expanded", String(open));
    if (open) updateOutline();
  };
  root.querySelector(".mde-outline-collapse").onclick = () => {
    const headings = [...view.querySelectorAll(".markdown h1, .markdown h2, .markdown h3, .markdown h4, .markdown h5, .markdown h6")];
    const shouldExpand = collapsedHeadings.size > 0;
    collapsedHeadings.clear();
    if (!shouldExpand) headings.forEach((heading, index) => {
      const next = headings[index + 1];
      if (next && Number(next.tagName.slice(1)) > Number(heading.tagName.slice(1))) collapsedHeadings.add(heading.id);
    });
    updateOutline();
  };
  view.addEventListener("scroll", () => {
    if (outline.hidden) return;
    const headings = [...view.querySelectorAll(".markdown h1, .markdown h2, .markdown h3, .markdown h4, .markdown h5, .markdown h6")];
    const top = view.getBoundingClientRect().top + 48;
    const current = [...headings].reverse().find(heading => heading.getBoundingClientRect().top <= top) || headings[0];
    outlineList.querySelectorAll(".mde-outline-link").forEach(link => link.classList.toggle("active", !!current && link.dataset.target === current.id));
  }, { passive: true });

  function updateReaderControls() {
    root.querySelectorAll("[data-reader-pages]").forEach(b => b.classList.toggle("active", b.dataset.readerPages === readerPages));
    const reset = root.querySelector('[data-reader-zoom="reset"]');
    if (reset) reset.textContent = `${Math.round(readerScale * 100)}%`;
  }

  function renderPreview() {
    let html = "";
    if (opts.decoratePreview) html += opts.decoratePreview() || "";
    const md = ta.value;
    const content = `<div class="markdown" contenteditable="true" spellcheck="true" data-preview-editable="true" data-placeholder="${(ta.placeholder || "在这里开始书写…").replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" role="textbox" aria-multiline="true" aria-label="Markdown 实时编辑区">${md.trim() ? renderMarkdown(md) : ""}</div>`;
    html += opts.documentReader
      ? `<div class="md-reader" data-pages="${readerPages}" style="--reader-scale:${readerScale}"><div class="md-reader-stage">${content}</div></div>`
      : content;
    view.innerHTML = html;
    renderMarkdownMath(view);
    view.querySelectorAll("pre code").forEach(b => { try { hljs.highlightElement(b); } catch (e) {} });
    renderMarkdownDiagrams(view);
    const editable = view.querySelector("[data-preview-editable]");
    if (editable) bindLiveEditor(editable);
    updateOutline();
  }
  function syncPreviewSource(editable) {
    ta.value = _previewHtmlToMarkdown(editable);
    if (!outline.hidden) updateOutline();
    if (opts.onInput) opts.onInput(ta.value);
  }
  function selectedPreviewRoot() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
    const anchor = sel.anchorNode && (sel.anchorNode.nodeType === Node.ELEMENT_NODE ? sel.anchorNode : sel.anchorNode.parentElement);
    const editable = anchor && anchor.closest && anchor.closest("[data-preview-editable]");
    return editable && view.contains(editable) ? editable : null;
  }
  function retainLiveSelection(nodes) {
    const connected = [...new Set(nodes)].filter(node => node && node.isConnected);
    if (!connected.length) return;
    connected.sort((a, b) => {
      if (a === b) return 0;
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    const range = document.createRange();
    range.setStartBefore(connected[0]);
    range.setEndAfter(connected[connected.length - 1]);
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
    rememberLiveSelection();
  }
  function highlightPreview(color) {
    const editable = selectedPreviewRoot();
    if (!editable) return false;
    const range = window.getSelection().getRangeAt(0);
    const walker = document.createTreeWalker(editable, NodeFilter.SHOW_TEXT);
    const parts = [];
    let textNode;
    while ((textNode = walker.nextNode())) {
      if (!range.intersectsNode(textNode) || textNode.parentElement.closest('pre, code, [contenteditable="false"], [data-math-source], .markdown-diagram')) continue;
      const start = textNode === range.startContainer ? range.startOffset : 0;
      const end = textNode === range.endContainer ? range.endOffset : textNode.nodeValue.length;
      // Ctrl/Cmd+A 在 contenteditable 中常会把段落间的换行文本也选中；
      // 不给纯空白节点套 mark，否则保存时会产生一段孤立的 ==...== 源码。
      if (end > start && textNode.nodeValue.slice(start, end).trim()) parts.push({ node: textNode, start, end });
    }
    const marks = [...new Set(parts.map(part => part.node.parentElement.closest("mark")).filter(Boolean))];
    const removeHighlight = parts.length > 0 && parts.every(part => {
      const mark = part.node.parentElement.closest("mark");
      return mark && mark.classList.contains(`highlight-${color}`);
    });
    if (removeHighlight) {
      const restored = [];
      marks.forEach(mark => {
        const children = [...mark.childNodes];
        restored.push(...children); mark.replaceWith(...children);
      });
      syncPreviewSource(editable);
      retainLiveSelection(restored);
      return true;
    }
    const highlighted = [];
    parts.reverse().forEach(part => {
      const parentMark = part.node.parentElement.closest("mark");
      if (parentMark) {
        parentMark.className = `highlight-${color}`;
        highlighted.push(parentMark);
        return;
      }
      const value = part.node.nodeValue;
      const fragment = document.createDocumentFragment();
      fragment.append(document.createTextNode(value.slice(0, part.start)));
      const mark = document.createElement("mark");
      mark.className = `highlight-${color}`;
      mark.textContent = value.slice(part.start, part.end);
      fragment.append(mark, document.createTextNode(value.slice(part.end)));
      part.node.replaceWith(fragment);
      highlighted.push(mark);
    });
    syncPreviewSource(editable);
    retainLiveSelection(highlighted);
    return true;
  }

  function activeEditor() {
    const editable = view.querySelector("[data-preview-editable]");
    const hasSavedSelection = savedRange && savedRange.commonAncestorContainer.isConnected && editable && editable.contains(savedRange.commonAncestorContainer);
    return editable && (editable.contains(document.activeElement) || document.activeElement === editable || selectedPreviewRoot() || hasSavedSelection) ? editable : null;
  }
  function execLive(command, value) {
    const editable = activeEditor();
    const current = editable || view.querySelector("[data-preview-editable]");
    if (!current) return;
    current.focus();
    restoreLiveSelection(current);
    try { document.execCommand("styleWithCSS", false, false); } catch (error) {}
    document.execCommand(command, false, value || null);
    rememberLiveSelection();
    syncPreviewSource(current);
  }
  function insertLiveNode(node) {
    const editable = view.querySelector("[data-preview-editable]");
    if (!editable) return;
    editable.focus();
    restoreLiveSelection(editable);
    const sel = window.getSelection();
    if (sel && sel.rangeCount && editable.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents(); range.insertNode(node); range.setStartAfter(node); range.collapse(true);
      sel.removeAllRanges(); sel.addRange(range);
    } else editable.append(node);
    rememberLiveSelection();
    syncPreviewSource(editable);
  }
  function insertLiveBlock(node) {
    const editable = view.querySelector("[data-preview-editable]");
    if (!editable) return;
    editable.focus();
    restoreLiveSelection(editable);
    const selection = window.getSelection();
    let anchor = null;
    if (selection && selection.rangeCount && editable.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      anchor = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
      while (anchor && anchor.parentElement !== editable) anchor = anchor.parentElement;
    }
    if (anchor && anchor !== editable) anchor.insertAdjacentElement("afterend", node);
    else editable.append(node);
    const nextLine = document.createElement("p");
    nextLine.append(document.createElement("br"));
    node.insertAdjacentElement("afterend", nextLine);
    const range = document.createRange();
    range.setStart(nextLine, 0); range.collapse(true);
    selection.removeAllRanges(); selection.addRange(range);
    rememberLiveSelection();
    syncPreviewSource(editable);
  }
  function bindLiveEditor(editable) {
    editable.addEventListener("input", () => syncPreviewSource(editable));
    editable.addEventListener("keyup", rememberLiveSelection);
    editable.addEventListener("mouseup", rememberLiveSelection);
    editable.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.disabled = false;
      checkbox.contentEditable = "false";
      checkbox.addEventListener("change", () => syncPreviewSource(editable));
    });
    editable.addEventListener("keydown", e => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (e.key === "Tab") { e.preventDefault(); document.execCommand("insertText", false, "  "); }
      else if (mod && !e.altKey && !e.shiftKey && key === "q") { e.preventDefault(); runCmd("highlight-yellow"); }
      else if (mod && !e.altKey && !e.shiftKey && key === "w") { e.preventDefault(); runCmd("highlight-green"); }
      else if (mod && !e.altKey && !e.shiftKey && key === "e") { e.preventDefault(); runCmd("highlight-pink"); }
      else if (mod && key === "b") { e.preventDefault(); runCmd("bold"); }
      else if (mod && key === "i") { e.preventDefault(); runCmd("italic"); }
      else if (mod && e.shiftKey && key === "x") { e.preventDefault(); runCmd("strike"); }
      else if (mod && key === "k") { e.preventDefault(); runCmd("link"); }
      else if (mod && key === "s") {
        e.preventDefault();
        // 兼容各业务模块原先绑定在 textarea 上的手动保存处理器。
        ta.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: e.ctrlKey, metaKey: e.metaKey, bubbles: true, cancelable: true }));
      }
      else if (mod && e.shiftKey && e.key === "7") { e.preventDefault(); runCmd("ol"); }
      else if (mod && e.shiftKey && e.key === "8") { e.preventDefault(); runCmd("ul"); }
      else if (mod && e.altKey && /^[1-6]$/.test(e.key)) { e.preventDefault(); execLive("formatBlock", `h${e.key}`); }
    });
    editable.addEventListener("dblclick", async e => {
      const formula = e.target.closest && e.target.closest("[data-math-source]");
      if (!formula || !editable.contains(formula)) return;
      e.preventDefault();
      let source = formula.dataset.mathSource || "";
      try { source = decodeURIComponent(source); } catch (error) {}
      const displayMode = formula.dataset.mathDisplay === "true";
      const next = await openMdePrompt({
        title: displayMode ? "编辑块级公式" : "编辑行内公式",
        description: "支持 Typora / LaTeX 数学语法。",
        label: "公式源码",
        value: source,
        multiline: displayMode,
      });
      if (next === null || !next.trim()) return;
      formula.dataset.mathSource = encodeURIComponent(next.trim());
      renderMarkdownMath(formula);
      syncPreviewSource(editable);
    });
    editable.addEventListener("paste", e => {
      const items = (e.clipboardData && e.clipboardData.items) || [];
      for (const it of items) if (it.type && it.type.startsWith("image/")) { e.preventDefault(); insertImage(it.getAsFile()); break; }
    });
    editable.addEventListener("blur", () => setTimeout(() => {
      if (!root.contains(document.activeElement)) renderPreview();
    }, 0));
  }

  // 图片：粘贴 或 工具栏按钮
  async function insertImage(file) {
    if (!file || !/^image\//.test(file.type)) return;
    try {
      const url = await imageToDataUrl(file);
      const img = document.createElement("img");
      img.src = url; img.alt = (file.name || "image").replace(/\.[^.]+$/, "");
      insertLiveNode(img); toast("已插入图片");
    }
    catch (e) { toast("图片插入失败：" + e.message); }
  }
  function pickImage() {
    if (!imgInput) { imgInput = document.createElement("input"); imgInput.type = "file"; imgInput.accept = "image/*"; imgInput.onchange = () => { const f = imgInput.files[0]; imgInput.value = ""; insertImage(f); }; }
    imgInput.click();
  }

  function selectedLiveText() {
    const editable = view.querySelector("[data-preview-editable]");
    if (!editable) return "";
    restoreLiveSelection(editable);
    const selection = window.getSelection();
    return selection && selection.rangeCount && editable.contains(selection.getRangeAt(0).commonAncestorContainer) ? selection.toString() : "";
  }

  function insertTable() {
    const table = document.createElement("table");
    const thead = document.createElement("thead"), headRow = document.createElement("tr");
    ["列 1", "列 2", "列 3"].forEach(label => {
      const th = document.createElement("th"); th.textContent = label; headRow.append(th);
    });
    thead.append(headRow);
    const tbody = document.createElement("tbody");
    for (let rowIndex = 0; rowIndex < 2; rowIndex++) {
      const row = document.createElement("tr");
      for (let columnIndex = 0; columnIndex < 3; columnIndex++) {
        const cell = document.createElement("td"); cell.textContent = "内容"; row.append(cell);
      }
      tbody.append(row);
    }
    table.append(thead, tbody);
    insertLiveBlock(table);
  }

  function insertTaskList() {
    const list = document.createElement("ul"), item = document.createElement("li");
    list.className = "contains-task-list"; item.className = "task-list-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox"; checkbox.contentEditable = "false";
    checkbox.addEventListener("change", () => syncPreviewSource(view.querySelector("[data-preview-editable]")));
    item.append(checkbox, document.createTextNode(" 待办事项"));
    list.append(item); insertLiveBlock(list);
  }

  async function insertMath(displayMode) {
    const selected = selectedLiveText().trim();
    const fallback = displayMode ? "\\begin{aligned}\na^2 + b^2 &= c^2\n\\end{aligned}" : "E = mc^2";
    const source = await openMdePrompt({
      title: displayMode ? "插入块级公式" : "插入行内公式",
      description: displayMode ? "保存后使用 $$ ... $$ 语法，可用 Ctrl/⌘ + Enter 确认。" : "保存后使用 $ ... $ 语法。",
      label: "LaTeX 公式",
      value: selected || fallback,
      multiline: displayMode,
    });
    if (source === null || !source.trim()) return;
    const formula = document.createElement(displayMode ? "div" : "span");
    formula.className = `markdown-math markdown-math-${displayMode ? "display" : "inline"}`;
    formula.dataset.mathDisplay = String(displayMode);
    formula.dataset.mathSource = encodeURIComponent(source.trim());
    if (displayMode) insertLiveBlock(formula);
    else insertLiveNode(formula);
    renderMarkdownMath(formula);
  }

  function runCmd(name) {
    if (name.startsWith("highlight-")) {
      const color = name.slice("highlight-".length);
      if (highlightPreview(color)) return;
      toast("请先选择要高亮的文字"); return;
    }
    if (view.querySelector("[data-preview-editable]")) {
      switch (name) {
        case "undo": execLive("undo"); return;
        case "redo": execLive("redo"); return;
        case "bold": execLive("bold"); return;
        case "italic": execLive("italic"); return;
        case "strike": execLive("strikeThrough"); return;
        case "paragraph": execLive("formatBlock", "p"); return;
        case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": execLive("formatBlock", name); return;
        case "quote": execLive("formatBlock", "blockquote"); return;
        case "ul": execLive("insertUnorderedList"); return;
        case "ol": execLive("insertOrderedList"); return;
        case "task": insertTaskList(); return;
        case "hr": { insertLiveBlock(document.createElement("hr")); return; }
        case "table": insertTable(); return;
        case "math-inline": insertMath(false); return;
        case "math-block": insertMath(true); return;
        case "image": pickImage(); return;
        case "link": {
          openMdePrompt({ title: "插入链接", label: "链接地址", value: "https://", type: "url" }).then(href => {
            if (href) execLive("createLink", href);
          });
          return;
        }
        case "code": {
          const code = document.createElement("code");
          const sel = window.getSelection(); code.textContent = sel && !sel.isCollapsed ? sel.toString() : "code";
          insertLiveNode(code); return;
        }
        case "codeblock": {
          const pre = document.createElement("pre"), code = document.createElement("code");
          const sel = window.getSelection(); code.textContent = sel && !sel.isCollapsed ? sel.toString() : "代码";
          pre.append(code); insertLiveBlock(pre); return;
        }
      }
    }
    switch (name) {
      case "bold": _wrapSel(ta, "**", "**", "粗体"); break;
      case "italic": _wrapSel(ta, "_", "_", "斜体"); break;
      case "strike": _wrapSel(ta, "~~", "~~", "删除线"); break;
      case "highlight-yellow": _toggleHighlightSel(ta, "yellow", "重点内容"); break;
      case "highlight-green": _toggleHighlightSel(ta, "green", "重点内容"); break;
      case "highlight-pink": _toggleHighlightSel(ta, "pink", "重点内容"); break;
      case "code": _wrapSel(ta, "`", "`", "code"); break;
      case "codeblock": _wrapSel(ta, "\n```\n", "\n```\n", "代码"); break;
      case "quote": _linePrefix(ta, "> "); break;
      case "ul": _linePrefix(ta, "- "); break;
      case "ol": _linePrefix(ta, "1. "); break;
      case "task": _linePrefix(ta, "- [ ] "); break;
      case "hr": _insertAt(ta, "\n\n---\n\n"); break;
      case "table": _insertAt(ta, "\n\n| 列 1 | 列 2 | 列 3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n| 内容 | 内容 | 内容 |\n\n"); break;
      case "math-inline": _wrapSel(ta, "$", "$", "E = mc^2"); break;
      case "math-block": _wrapSel(ta, "\n\n$$\n", "\n$$\n\n", "\\begin{aligned}\na^2 + b^2 &= c^2\n\\end{aligned}"); break;
      case "paragraph": break;
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": _linePrefix(ta, `${"#".repeat(Number(name[1]))} `); break;
      case "link": _wrapSel(ta, "[", "](https://)", "链接文字"); break;
      case "image": pickImage(); return;
    }
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
  root.querySelectorAll(".mde-fmt [data-cmd]").forEach(b => {
    b.addEventListener("mousedown", e => { rememberLiveSelection(); e.preventDefault(); });
    b.onclick = () => runCmd(b.dataset.cmd);
  });
  const headingPicker = root.querySelector("[data-heading]");
  headingPicker.addEventListener("mousedown", rememberLiveSelection);
  headingPicker.addEventListener("change", () => {
    const command = headingPicker.value;
    if (command) runCmd(command);
    headingPicker.value = "";
  });
  root.querySelectorAll("[data-reader-pages]").forEach(b => b.onclick = () => { readerPages = b.dataset.readerPages; renderPreview(); updateReaderControls(); });
  root.querySelectorAll("[data-reader-zoom]").forEach(b => b.onclick = () => {
    const action = b.dataset.readerZoom;
    readerScale = action === "reset" ? 1 : Math.max(.7, Math.min(1.4, readerScale + (action === "in" ? .1 : -.1)));
    renderPreview(); updateReaderControls();
  });

  updateReaderControls();
  renderPreview();
  if (opts.onModeChange) opts.onModeChange(mode);

  return {
    el: root,
    get: () => ta.value,
    set: v => { ta.value = v || ""; renderPreview(); },
    getMode: () => mode,
    setMode: () => { renderPreview(); },
    refresh: renderPreview,
    focus: () => view.querySelector("[data-preview-editable]")?.focus(),
    textarea: ta,
  };
}
