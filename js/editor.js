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
  const children = node => [...node.childNodes].map(inline).join("");
  function inline(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const tag = node.tagName.toLowerCase();
    const text = children(node);
    if (tag === "br") return "\n";
    if (tag === "strong" || tag === "b") return `**${text}**`;
    if (tag === "em" || tag === "i") return `_${text}_`;
    if (tag === "del" || tag === "s") return `~~${text}~~`;
    if (tag === "mark") {
      const color = node.classList.contains("highlight-green") ? "green" : node.classList.contains("highlight-pink") ? "pink" : "yellow";
      return `=={${color}}${text}==`;
    }
    if (tag === "code" && (!node.parentElement || node.parentElement.tagName !== "PRE")) return `\`${node.textContent || ""}\``;
    if (tag === "a") return `[${text}](${node.getAttribute("href") || ""})`;
    if (tag === "img") return `![${node.getAttribute("alt") || "image"}](${node.getAttribute("src") || ""})`;
    return text;
  }
  function list(el, ordered) {
    const items = [...el.children].filter(x => x.tagName === "LI");
    return items.map((li, i) => {
      const nested = [...li.children].filter(x => x.tagName === "UL" || x.tagName === "OL");
      const body = [...li.childNodes].filter(x => !(x.nodeType === Node.ELEMENT_NODE && (x.tagName === "UL" || x.tagName === "OL"))).map(inline).join("").trim();
      const tail = nested.map(x => list(x, x.tagName === "OL").trimEnd().split("\n").map(line => "  " + line).join("\n")).join("\n");
      return `${ordered ? `${i + 1}. ` : "- "}${body}${tail ? "\n" + tail : ""}`;
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
    if (tag === "div") return [...node.childNodes].map(block).join("") || `${children(node)}\n`;
    return inline(node);
  }
  return [...root.childNodes].map(block).join("").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

const MDE_TOOLS = [
  ["h", "标题", "H"], ["bold", "加粗", "<b>B</b>"], ["italic", "斜体", "<i>I</i>"],
  ["highlight-yellow", "黄色高亮", "<span class=\"mde-highlight-icon yellow\">✦</span>"], ["highlight-green", "绿色高亮", "<span class=\"mde-highlight-icon green\">✦</span>"], ["highlight-pink", "粉色高亮", "<span class=\"mde-highlight-icon pink\">✦</span>"],
  ["code", "行内代码", "&lt;/&gt;"], ["codeblock", "代码块", "{ }"], ["quote", "引用", "❝"],
  ["ul", "无序列表", "•"], ["ol", "有序列表", "1."], ["link", "链接", "🔗"], ["image", "插入图片", "🖼"],
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
      <div class="mde-fmt">
        ${MDE_TOOLS.map(([c, t, l]) => `<button type="button" data-cmd="${c}" title="${t}">${l}</button>`).join("")}
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
      <textarea class="mde-ta" hidden aria-hidden="true"></textarea>
      <div class="mde-view"></div>
    </div>`;

  const ta = root.querySelector(".mde-ta");
  const view = root.querySelector(".mde-view");
  ta.value = opts.value || "";
  ta.placeholder = opts.placeholder || "";
  const mode = "view";
  let imgInput = null;
  let readerPages = "one", readerScale = 1;

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
    view.querySelectorAll("pre code").forEach(b => { try { hljs.highlightElement(b); } catch (e) {} });
    const editable = view.querySelector("[data-preview-editable]");
    if (editable) bindLiveEditor(editable);
  }
  function syncPreviewSource(editable) {
    ta.value = _previewHtmlToMarkdown(editable);
    if (opts.onInput) opts.onInput(ta.value);
  }
  function selectedPreviewRoot() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
    const anchor = sel.anchorNode && (sel.anchorNode.nodeType === Node.ELEMENT_NODE ? sel.anchorNode : sel.anchorNode.parentElement);
    const editable = anchor && anchor.closest && anchor.closest("[data-preview-editable]");
    return editable && view.contains(editable) ? editable : null;
  }
  function highlightPreview(color) {
    const editable = selectedPreviewRoot();
    if (!editable) return false;
    const range = window.getSelection().getRangeAt(0);
    const walker = document.createTreeWalker(editable, NodeFilter.SHOW_TEXT);
    const parts = [];
    let textNode;
    while ((textNode = walker.nextNode())) {
      if (!range.intersectsNode(textNode) || textNode.parentElement.closest("pre, code")) continue;
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
      marks.forEach(mark => mark.replaceWith(...mark.childNodes));
      syncPreviewSource(editable);
      window.getSelection().removeAllRanges();
      return true;
    }
    parts.reverse().forEach(part => {
      const parentMark = part.node.parentElement.closest("mark");
      if (parentMark) {
        parentMark.className = `highlight-${color}`;
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
    });
    syncPreviewSource(editable);
    window.getSelection().removeAllRanges();
    return true;
  }

  function activeEditor() {
    const editable = view.querySelector("[data-preview-editable]");
    return editable && (editable.contains(document.activeElement) || document.activeElement === editable || selectedPreviewRoot()) ? editable : null;
  }
  function execLive(command, value) {
    const editable = activeEditor();
    if (!editable) { view.querySelector("[data-preview-editable]")?.focus(); }
    document.execCommand(command, false, value || null);
    const current = view.querySelector("[data-preview-editable]");
    if (current) syncPreviewSource(current);
  }
  function insertLiveNode(node) {
    const editable = view.querySelector("[data-preview-editable]");
    if (!editable) return;
    editable.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount && editable.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents(); range.insertNode(node); range.setStartAfter(node); range.collapse(true);
      sel.removeAllRanges(); sel.addRange(range);
    } else editable.append(node);
    syncPreviewSource(editable);
  }
  function bindLiveEditor(editable) {
    editable.addEventListener("input", () => syncPreviewSource(editable));
    editable.addEventListener("keydown", e => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (e.key === "Tab") { e.preventDefault(); document.execCommand("insertText", false, "  "); }
      else if (mod && key === "b") { e.preventDefault(); runCmd("bold"); }
      else if (mod && key === "i") { e.preventDefault(); runCmd("italic"); }
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

  function runCmd(name) {
    if (name.startsWith("highlight-")) {
      const color = name.slice("highlight-".length);
      if (highlightPreview(color)) return;
      toast("请先选择要高亮的文字"); return;
    }
    if (activeEditor()) {
      switch (name) {
        case "bold": execLive("bold"); return;
        case "italic": execLive("italic"); return;
        case "h": execLive("formatBlock", "h2"); return;
        case "quote": execLive("formatBlock", "blockquote"); return;
        case "ul": execLive("insertUnorderedList"); return;
        case "ol": execLive("insertOrderedList"); return;
        case "link": {
          const href = window.prompt("链接地址", "https://");
          if (href) execLive("createLink", href);
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
          pre.append(code); insertLiveNode(pre); return;
        }
      }
    }
    switch (name) {
      case "bold": _wrapSel(ta, "**", "**", "粗体"); break;
      case "italic": _wrapSel(ta, "_", "_", "斜体"); break;
      case "highlight-yellow": _toggleHighlightSel(ta, "yellow", "重点内容"); break;
      case "highlight-green": _toggleHighlightSel(ta, "green", "重点内容"); break;
      case "highlight-pink": _toggleHighlightSel(ta, "pink", "重点内容"); break;
      case "code": _wrapSel(ta, "`", "`", "code"); break;
      case "codeblock": _wrapSel(ta, "\n```\n", "\n```\n", "代码"); break;
      case "quote": _linePrefix(ta, "> "); break;
      case "ul": _linePrefix(ta, "- "); break;
      case "ol": _linePrefix(ta, "1. "); break;
      case "h": _linePrefix(ta, "# "); break;
      case "link": _wrapSel(ta, "[", "](https://)", "链接文字"); break;
      case "image": pickImage(); return;
    }
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
  root.querySelectorAll(".mde-fmt button").forEach(b => {
    b.addEventListener("mousedown", e => e.preventDefault());
    b.onclick = () => runCmd(b.dataset.cmd);
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
