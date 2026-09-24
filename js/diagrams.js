// Tiny SVG diagram builders (pure string functions, no DOM). Colours come from CSS classes (css/app.css)
// so every diagram follows the light/dark theme. Used as `diagram: flow({...})` on lesson blocks.

let uid = 0;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lines = (s) => String(s).split('\n');
const n = (v) => Math.round(v * 10) / 10;
const tone = (t) => (t ? ` t-${t}` : '');
const LH = 16; // line height

function root(width, height, title, id, body) {
  const t = title ? `<title>${esc(title)}</title>` : '';
  const label = title ? ` role="img" aria-label="${esc(title)}"` : '';
  const heads = ['', 'danger', 'ok'].map((k) =>
    `<marker id="dg${id}${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrowhead${k ? ` t-${k}` : ''}" d="M0 0 L10 5 L0 10 z"/></marker>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" class="dg" viewBox="0 0 ${Math.ceil(width)} ${Math.ceil(height)}" style="max-width:${Math.ceil(width)}px;min-width:${Math.min(Math.ceil(width), 520)}px"${label}>${t}<defs>${heads}</defs>${body}</svg>`;
}

function textBlock(cx, cy, label, sub) {
  const l = lines(label);
  const s = sub ? lines(sub) : [];
  const total = l.length + s.length;
  let y = cy - ((total - 1) * LH) / 2 + 4;
  let out = '';
  for (const t of l) { out += `<text class="dg-label" x="${n(cx)}" y="${n(y)}">${esc(t)}</text>`; y += LH; }
  for (const t of s) { out += `<text class="dg-sub" x="${n(cx)}" y="${n(y)}">${esc(t)}</text>`; y += LH; }
  return out;
}

function edgePath(points, { dashed, tn, id }) {
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${n(x)} ${n(y)}`).join(' ');
  return `<path class="dg-edge${dashed ? ' dashed' : ''}${tone(tn)}" d="${d}" marker-end="url(#dg${id}${tn === 'danger' || tn === 'ok' ? tn : ''})"/>`;
}

function edgeLabel(x, y, text, anchor = 'middle') {
  return text ? `<text class="dg-elabel" x="${n(x)}" y="${n(y)}" text-anchor="${anchor}">${esc(text)}</text>` : '';
}

// ---------------- flow: boxes on a grid connected by arrows ----------------
export function flow({ title = '', nodes, edges = [], nodeW = 150, gapX = 70, gapY = 46 }) {
  const id = ++uid;
  const pad = 14;
  const need = Math.max(...nodes.map((x) => lines(x.label).length + (x.sub ? lines(x.sub).length : 0)));
  const nodeH = Math.max(52, 20 + need * LH);
  const cols = Math.max(...nodes.map((x) => x.col)) + 1;
  const rows = Math.max(...nodes.map((x) => x.row)) + 1;
  const width = pad * 2 + cols * nodeW + (cols - 1) * gapX;
  const height = pad * 2 + rows * nodeH + (rows - 1) * gapY;
  const pos = {};
  for (const x of nodes) {
    const px = pad + x.col * (nodeW + gapX);
    const py = pad + x.row * (nodeH + gapY);
    pos[x.id] = { ...x, x: px, y: py, cx: px + nodeW / 2, cy: py + nodeH / 2 };
  }
  let out = '';
  for (const x of nodes) {
    const p = pos[x.id];
    out += `<g><rect class="dg-node${tone(x.tone)}" x="${n(p.x)}" y="${n(p.y)}" width="${nodeW}" height="${nodeH}" rx="10"/>${textBlock(p.cx, p.cy, x.label, x.sub)}</g>`;
  }
  edges.forEach((e) => {
    const a = pos[e.from];
    const b = pos[e.to];
    if (!a) throw new Error(`diagram edge: unknown node '${e.from}'`);
    if (!b) throw new Error(`diagram edge: unknown node '${e.to}'`);
    const reverse = edges.some((o) => o.from === e.to && o.to === e.from);
    const off = reverse ? (e.from < e.to ? -7 : 7) : 0;
    let pts;
    let lx;
    let ly;
    let anchor = 'middle';
    if (a.row === b.row) {
      const y = a.cy + off;
      pts = b.col > a.col ? [[a.x + nodeW, y], [b.x, y]] : [[a.x, y], [b.x + nodeW, y]];
      lx = (pts[0][0] + pts[1][0]) / 2; ly = y - (off > 0 ? -14 : 6);
    } else if (a.col === b.col) {
      const x = a.cx + off;
      pts = b.row > a.row ? [[x, a.y + nodeH], [x, b.y]] : [[x, a.y], [x, b.y + nodeH]];
      lx = x + 8; ly = (pts[0][1] + pts[1][1]) / 2 + 4; anchor = 'start';
    } else {
      const startX = b.col > a.col ? a.x + nodeW : a.x;
      const endY = b.row > a.row ? b.y : b.y + nodeH;
      pts = [[startX, a.cy], [b.cx, a.cy], [b.cx, endY]];
      lx = (startX + b.cx) / 2; ly = a.cy - 6;
    }
    out += edgePath(pts, { dashed: e.dashed, tn: e.tone, id }) + edgeLabel(lx, ly, e.label, anchor);
  });
  return root(width, height, title, id, out);
}

// ---------------- sequence: actors, lifelines, messages ----------------
export function sequence({ title = '', actors, steps, gap = 240 }) {
  const id = ++uid;
  const pad = 14;
  const boxW = 130;
  const boxH = 36;
  const rowH = 46;
  const cx = {};
  actors.forEach((a, i) => { cx[a.id] = pad + boxW / 2 + i * gap; });
  const width = pad * 2 + boxW + (actors.length - 1) * gap;
  const top = pad + boxH;
  const height = top + 26 + steps.length * rowH + 10;
  let out = '';
  for (const a of actors) {
    out += `<line class="dg-life" x1="${n(cx[a.id])}" y1="${top}" x2="${n(cx[a.id])}" y2="${n(height - 6)}"/>`;
    out += `<g><rect class="dg-node" x="${n(cx[a.id] - boxW / 2)}" y="${pad}" width="${boxW}" height="${boxH}" rx="8"/>${textBlock(cx[a.id], pad + boxH / 2, a.label)}</g>`;
  }
  steps.forEach((s, i) => {
    const y = top + 26 + i * rowH + rowH / 2 - 8;
    if (s.note !== undefined) {
      const ax = cx[s.at ?? actors[0].id];
      if (ax === undefined) throw new Error(`diagram note: unknown actor '${s.at}'`);
      const half = (String(s.note).length * 6.2) / 2; // approximate text half-width
      const x = Math.min(Math.max(ax, half + 6), width - half - 6); // keep the note inside the canvas
      out += `<text class="dg-note" x="${n(x)}" y="${n(y)}" text-anchor="middle">${esc(s.note)}</text>`;
      return;
    }
    if (cx[s.from] === undefined) throw new Error(`diagram step: unknown actor '${s.from}'`);
    if (cx[s.to] === undefined) throw new Error(`diagram step: unknown actor '${s.to}'`);
    const dir = cx[s.to] > cx[s.from] ? 1 : -1;
    out += edgePath([[cx[s.from] + dir * 6, y], [cx[s.to] - dir * 6, y]], { dashed: s.dashed, tn: s.tone, id });
    out += edgeLabel((cx[s.from] + cx[s.to]) / 2, y - 7, s.label);
  });
  return root(width, height, title, id, out);
}

// ---------------- stack: layers with arrows between them ----------------
export function stack({ title = '', layers, between = [], layerW = 300, gap = 58 }) {
  const id = ++uid;
  const pad = 14;
  const need = Math.max(...layers.map((l) => lines(l.label).length + (l.sub ? lines(l.sub).length : 0)));
  const h = Math.max(48, 18 + need * LH);
  const width = pad * 2 + layerW + 220;
  const height = pad * 2 + layers.length * h + (layers.length - 1) * gap;
  const x = (width - layerW) / 2;
  let out = '';
  layers.forEach((l, i) => {
    const y = pad + i * (h + gap);
    out += `<g><rect class="dg-node${tone(l.tone)}" x="${n(x)}" y="${n(y)}" width="${layerW}" height="${h}" rx="10"/>${textBlock(x + layerW / 2, y + h / 2, l.label, l.sub)}</g>`;
    const b = between[i];
    if (b && i < layers.length - 1) {
      const y1 = y + h;
      const y2 = y + h + gap;
      const cxm = x + layerW / 2;
      if (b.down) {
        out += edgePath([[cxm - 34, y1 + 2], [cxm - 34, y2 - 2]], { dashed: false, tn: b.downTone || (b.tone === 'danger' ? '' : b.tone), id });
        out += edgeLabel(cxm - 42, (y1 + y2) / 2 + 4, typeof b.down === 'string' ? b.down : '', 'end');
      }
      if (b.up) {
        out += edgePath([[cxm + 34, y2 - 2], [cxm + 34, y1 + 2]], { dashed: true, tn: b.tone, id });
        out += edgeLabel(cxm + 42, (y1 + y2) / 2 + 4, typeof b.up === 'string' ? b.up : '', 'start');
      }
    }
  });
  return root(width, height, title, id, out);
}
