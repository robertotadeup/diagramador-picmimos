import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MIN_FRAME_SIZE = 5;
const SNAP_DISTANCE = 1.1;
const MAX_PHOTOS_PER_SPREAD = 20;
const DEFAULT_SPREAD_COUNT = 4;

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function pct(value) {
  return Math.round(value * 100) / 100;
}

function gridSlots(count, cols, rows, margin = 3, gap = 1.4) {
  const cellW = (100 - margin * 2 - gap * (cols - 1)) / cols;
  const cellH = (100 - margin * 2 - gap * (rows - 1)) / rows;
  const slots = [];

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    slots.push({
      x: pct(margin + col * (cellW + gap)),
      y: pct(margin + row * (cellH + gap)),
      w: pct(cellW),
      h: pct(cellH),
    });
  }

  return slots;
}

function bestGrid(count) {
  if (count <= 2) return { cols: count, rows: 1 };
  const cols = Math.ceil(Math.sqrt(count * 2));
  const rows = Math.ceil(count / cols);
  return { cols, rows };
}

function autoGridSlots(count) {
  const { cols, rows } = bestGrid(count);
  return gridSlots(count, cols, rows);
}

function heroRightSlots(count) {
  if (count === 1) return [{ x: 0, y: 0, w: 100, h: 100 }];
  if (count === 2) return [{ x: 3, y: 6, w: 62, h: 88 }, { x: 69, y: 18, w: 28, h: 64 }];

  const remaining = count - 1;
  const heroW = count <= 6 ? 54 : 46;
  const cols = remaining <= 3 ? 1 : remaining <= 8 ? 2 : 3;
  const rows = Math.ceil(remaining / cols);
  const margin = 3;
  const gap = 1.4;
  const leftAreaW = 100 - heroW - margin * 3;
  const cellW = (leftAreaW - gap * (cols - 1)) / cols;
  const cellH = (88 - gap * (rows - 1)) / rows;
  const slots = [];

  for (let i = 0; i < remaining; i += 1) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    slots.push({
      x: pct(margin + col * (cellW + gap)),
      y: pct(6 + row * (cellH + gap)),
      w: pct(cellW),
      h: pct(cellH),
    });
  }

  slots.push({ x: pct(100 - margin - heroW), y: 6, w: heroW, h: 88 });
  return slots;
}

function heroLeftSlots(count) {
  if (count === 1) return [{ x: 12, y: 10, w: 76, h: 80 }];
  if (count === 2) return [{ x: 3, y: 8, w: 45, h: 84 }, { x: 52, y: 8, w: 45, h: 84 }];

  const remaining = count - 1;
  const heroW = count <= 6 ? 54 : 43;
  const cols = remaining <= 3 ? 1 : remaining <= 8 ? 2 : 3;
  const rows = Math.ceil(remaining / cols);
  const margin = 3;
  const gap = 1.4;
  const rightX = margin * 2 + heroW;
  const rightAreaW = 100 - rightX - margin;
  const cellW = (rightAreaW - gap * (cols - 1)) / cols;
  const cellH = (88 - gap * (rows - 1)) / rows;
  const slots = [{ x: margin, y: 6, w: heroW, h: 88 }];

  for (let i = 0; i < remaining; i += 1) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    slots.push({
      x: pct(rightX + col * (cellW + gap)),
      y: pct(6 + row * (cellH + gap)),
      w: pct(cellW),
      h: pct(cellH),
    });
  }

  return slots;
}

function stripSlots(count) {
  if (count <= 3) return autoGridSlots(count);
  const topCount = Math.min(3, Math.ceil(count / 3));
  const bottomCount = count - topCount;
  const top = gridSlots(topCount, topCount, 1, 3, 1.4).map((slot) => ({ ...slot, y: 5, h: 34 }));
  const { cols, rows } = bestGrid(bottomCount);
  const bottom = gridSlots(bottomCount, cols, rows, 3, 1.4).map((slot) => ({
    ...slot,
    y: pct(45 + (slot.y - 3) * 0.54),
    h: pct(slot.h * 0.54),
  }));
  return [...top, ...bottom].slice(0, count);
}

function masonrySlots(count) {
  if (count <= 4) return autoGridSlots(count);
  const cols = count <= 8 ? 4 : count <= 14 ? 5 : 6;
  const rows = Math.ceil(count / cols);
  const base = gridSlots(count, cols, rows, 3, 1.2);
  return base.map((slot, index) => {
    const isHero = index === Math.floor(count / 2) && count >= 7;
    if (!isHero) return slot;
    return {
      ...slot,
      w: pct(Math.min(slot.w * 1.55, 30)),
      h: pct(Math.min(slot.h * 1.35, 45)),
    };
  });
}

function buildLayoutsForCount(count) {
  const layouts = [];

  layouts.push({
    id: `count-${count}-grid`,
    name: `${count} fotos · grade automática`,
    hint: `Distribuição limpa para ${count} fotos`,
    slots: autoGridSlots(count),
  });

  layouts.push({
    id: `count-${count}-hero-left`,
    name: `${count} fotos · destaque esquerda`,
    hint: "Uma imagem principal e apoios à direita",
    slots: heroLeftSlots(count),
  });

  layouts.push({
    id: `count-${count}-hero-right`,
    name: `${count} fotos · destaque direita`,
    hint: "Apoios à esquerda e imagem principal à direita",
    slots: heroRightSlots(count),
  });

  layouts.push({
    id: `count-${count}-strip`,
    name: `${count} fotos · faixa editorial`,
    hint: "Faixa superior com sequência abaixo",
    slots: stripSlots(count),
  });

  layouts.push({
    id: `count-${count}-masonry`,
    name: `${count} fotos · mosaico dinâmico`,
    hint: "Mosaico mais solto para eventos grandes",
    slots: masonrySlots(count),
  });

  if (count === 1) {
    layouts.push({
      id: "count-1-luxury-center",
      name: "1 foto · central luxo",
      hint: "Foto com respiro editorial",
      slots: [{ x: 12, y: 10, w: 76, h: 80 }],
    });
  }

  if (count === 2) {
    layouts.push({
      id: "count-2-overlap",
      name: "2 fotos · editorial assimétrico",
      hint: "Uma imagem maior e outra de apoio",
      slots: [{ x: 4, y: 10, w: 58, h: 80 }, { x: 66, y: 18, w: 30, h: 64 }],
    });
  }

  if (count === 3) {
    layouts.push({
      id: "count-3-triptych",
      name: "3 fotos · tríptico",
      hint: "Três imagens verticais iguais",
      slots: [{ x: 3, y: 8, w: 30, h: 84 }, { x: 35, y: 8, w: 30, h: 84 }, { x: 67, y: 8, w: 30, h: 84 }],
    });
  }

  if (count === 4) {
    layouts.push({
      id: "count-4-classic-2x2",
      name: "4 fotos · clássico 2x2",
      hint: "Quatro imagens equilibradas",
      slots: [{ x: 3, y: 6, w: 45, h: 42 }, { x: 52, y: 6, w: 45, h: 42 }, { x: 3, y: 52, w: 45, h: 42 }, { x: 52, y: 52, w: 45, h: 42 }],
    });
  }

  return layouts;
}

function buildAllLayouts(maxCount = MAX_PHOTOS_PER_SPREAD) {
  const all = [];
  for (let count = 1; count <= maxCount; count += 1) {
    all.push(...buildLayoutsForCount(count));
  }
  return all;
}

const layouts = buildAllLayouts();

const demoImages = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504151932400-72d4384f04b3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1496843916299-590492c751f4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
];

function Icon({ name, className = "" }) {
  const icons = {
    upload: "↑",
    left: "‹",
    right: "›",
    image: "▧",
    trash: "×",
    grid: "▦",
    book: "▰",
    click: "⌖",
    plus: "+",
    magnet: "U",
    reset: "⟲",
    swap: "↔",
    crop: "□",
    build: "⚡",
    drag: "☰",
    hand: "✋",
    home: "⌂",
    pointer: "↖",
    pan: "✋",
    text: "T",
    zoom: "⌕",
    export: "⇥",
    duplicate: "⧉",
    spread: "▭",
    save: "✓",
  };
  return <span aria-hidden="true" className={classNames("inline-flex items-center justify-center font-black leading-none", className)}>{icons[name] || "•"}</span>;
}

function Button({ children, onClick, variant = "primary", disabled = false, className = "", type = "button", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:cursor-not-allowed disabled:opacity-40";
  const styles = {
    primary: "bg-stone-800 text-white hover:bg-stone-700",
    secondary: "bg-stone-100 text-stone-900 hover:bg-white",
    outline: "border border-stone-300 bg-white text-stone-950 hover:border-stone-500 hover:bg-stone-50",
    ghost: "bg-transparent text-stone-600 hover:bg-stone-100",
    active: "border border-yellow-400 bg-yellow-400 text-stone-950",
    yellow: "bg-yellow-400 text-stone-950 hover:bg-yellow-300",
    dark: "bg-[#535353] text-white hover:bg-[#666]",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={classNames(base, styles[variant], className)} {...props}>{children}</button>;
}

function Panel({ children, className = "" }) {
  return <section className={classNames("border-b border-[#e7e7e7] bg-white", className)}>{children}</section>;
}

function isImageFile(file) {
  return Boolean(file && typeof file.type === "string" && file.type.startsWith("image/"));
}

function fileListToImageFiles(fileList) {
  return Array.from(fileList || []).filter(isImageFile);
}

function makePhotoObjects(srcList, prefix = "photo") {
  return srcList.map((src, index) => ({ id: `${prefix}-${index}-${Math.random().toString(36).slice(2, 8)}`, src, name: `${prefix}-${index + 1}` }));
}

function groupLayoutsByCount(allLayouts) {
  return allLayouts.reduce((acc, layout) => {
    const count = layout.slots.length;
    if (!acc[count]) acc[count] = [];
    acc[count].push(layout);
    return acc;
  }, {});
}

function createFramesFromLayout(layout, photoIds, previousFrames = []) {
  const previousByPhoto = new Map();
  previousFrames.forEach((frame) => {
    if (frame.photoId) previousByPhoto.set(frame.photoId, frame);
  });

  return layout.slots.map((slot, index) => {
    const photoId = photoIds[index] || null;
    const previous = photoId ? previousByPhoto.get(photoId) : null;
    return {
      id: uid("frame"),
      photoId,
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      rotate: slot.rotate || 0,
      z: index + 1,
      cropX: previous?.cropX || 0,
      cropY: previous?.cropY || 0,
      cropScale: previous?.cropScale || 1,
    };
  });
}

function createSpread({ title, layout, photoIds, variantIndex = 0, count = photoIds.length, previousFrames = [] }) {
  return {
    id: uid("spread"),
    title,
    targetPhotoCount: count,
    layoutVariantIndex: variantIndex,
    spreadPhotoIds: photoIds,
    frames: createFramesFromLayout(layout, photoIds, previousFrames),
  };
}

function duplicateSpread(spread) {
  return {
    ...spread,
    id: uid("spread"),
    title: `${spread.title} cópia`,
    frames: spread.frames.map((frame) => ({ ...frame, id: uid("frame") })),
  };
}

function swapFramePhotos(frames, sourceId, targetId) {
  const source = frames.find((frame) => frame.id === sourceId);
  const target = frames.find((frame) => frame.id === targetId);
  if (!source || !target) return frames;
  return frames.map((frame) => {
    if (frame.id === sourceId) return { ...frame, photoId: target.photoId, cropX: target.cropX || 0, cropY: target.cropY || 0, cropScale: target.cropScale || 1 };
    if (frame.id === targetId) return { ...frame, photoId: source.photoId, cropX: source.cropX || 0, cropY: source.cropY || 0, cropScale: source.cropScale || 1 };
    return frame;
  });
}

function syncSpreadPhotoIdsFromFrames(frames) {
  return frames.map((frame) => frame.photoId).filter(Boolean);
}

function pointInsideFrame(point, frame) {
  return point.x >= frame.x && point.x <= frame.x + frame.w && point.y >= frame.y && point.y <= frame.y + frame.h;
}

function findDropTarget(sourceId, pointerPoint, allFrames) {
  if (!pointerPoint) return null;
  const candidates = allFrames
    .filter((candidate) => candidate.id !== sourceId && pointInsideFrame(pointerPoint, candidate))
    .sort((a, b) => (b.z || 0) - (a.z || 0));
  return candidates[0] || null;
}

function getPointerPct(event, element) {
  const rect = element.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  };
}

function frameAnchors(frame) {
  return { left: frame.x, centerX: frame.x + frame.w / 2, right: frame.x + frame.w, top: frame.y, centerY: frame.y + frame.h / 2, bottom: frame.y + frame.h };
}

function resizeFrame(original, handle, dx, dy) {
  let next = { ...original };
  if (handle.includes("e")) next.w = original.w + dx;
  if (handle.includes("s")) next.h = original.h + dy;
  if (handle.includes("w")) { next.x = original.x + dx; next.w = original.w - dx; }
  if (handle.includes("n")) { next.y = original.y + dy; next.h = original.h - dy; }
  if (next.w < MIN_FRAME_SIZE) { if (handle.includes("w")) next.x = original.x + original.w - MIN_FRAME_SIZE; next.w = MIN_FRAME_SIZE; }
  if (next.h < MIN_FRAME_SIZE) { if (handle.includes("n")) next.y = original.y + original.h - MIN_FRAME_SIZE; next.h = MIN_FRAME_SIZE; }
  next.x = clamp(next.x, -60, 160);
  next.y = clamp(next.y, -60, 160);
  next.w = clamp(next.w, MIN_FRAME_SIZE, 160);
  next.h = clamp(next.h, MIN_FRAME_SIZE, 160);
  return next;
}

function nearestSnap(value, candidates) {
  let best = null;
  candidates.forEach((candidate) => {
    const distance = Math.abs(value - candidate.value);
    if (distance <= SNAP_DISTANCE && (!best || distance < best.distance)) best = { ...candidate, distance };
  });
  return best;
}

function buildSnapCandidates(sourceId, frames) {
  const vertical = [{ value: 0 }, { value: 50 }, { value: 100 }];
  const horizontal = [{ value: 0 }, { value: 50 }, { value: 100 }];
  frames.forEach((frame) => {
    if (frame.id === sourceId) return;
    const a = frameAnchors(frame);
    vertical.push({ value: a.left }, { value: a.centerX }, { value: a.right });
    horizontal.push({ value: a.top }, { value: a.centerY }, { value: a.bottom });
  });
  return { vertical, horizontal };
}

function applyResizeSnap(frame, sourceId, frames, handle) {
  let next = { ...frame };
  const guides = { vertical: [], horizontal: [], badges: [] };
  const { vertical, horizontal } = buildSnapCandidates(sourceId, frames);
  frames.forEach((target) => {
    if (target.id === sourceId) return;
    if (Math.abs(next.w - target.w) <= SNAP_DISTANCE) {
      if (handle.includes("w")) next.x = next.x + next.w - target.w;
      next.w = target.w;
      guides.badges.push({ x: next.x + next.w / 2, y: next.y - 3, text: "mesma largura" });
    }
    if (Math.abs(next.h - target.h) <= SNAP_DISTANCE) {
      if (handle.includes("n")) next.y = next.y + next.h - target.h;
      next.h = target.h;
      guides.badges.push({ x: next.x + next.w + 3, y: next.y + next.h / 2, text: "mesma altura" });
    }
  });
  const a = frameAnchors(next);
  if (handle.includes("w")) {
    const match = nearestSnap(a.left, vertical);
    if (match) { const right = next.x + next.w; next.x = match.value; next.w = Math.max(MIN_FRAME_SIZE, right - next.x); guides.vertical.push(match.value); }
  }
  if (handle.includes("e")) {
    const match = nearestSnap(a.right, vertical);
    if (match) { next.w = Math.max(MIN_FRAME_SIZE, match.value - next.x); guides.vertical.push(match.value); }
  }
  if (handle.includes("n")) {
    const match = nearestSnap(a.top, horizontal);
    if (match) { const bottom = next.y + next.h; next.y = match.value; next.h = Math.max(MIN_FRAME_SIZE, bottom - next.y); guides.horizontal.push(match.value); }
  }
  if (handle.includes("s")) {
    const match = nearestSnap(a.bottom, horizontal);
    if (match) { next.h = Math.max(MIN_FRAME_SIZE, match.value - next.y); guides.horizontal.push(match.value); }
  }
  return { frame: next, guides };
}

function updateFrame(frames, frameId, patch) {
  return frames.map((frame) => (frame.id === frameId ? { ...frame, ...patch } : frame));
}

function getSupportedCounts(layoutsByCount) {
  return Object.keys(layoutsByCount).map(Number).sort((a, b) => a - b);
}

function runSelfTests() {
  const grouped = groupLayoutsByCount(layouts);
  console.assert(getSupportedCounts(grouped).length === MAX_PHOTOS_PER_SPREAD, "Test failed: layouts should support 1 through 20 photos.");
  console.assert(grouped[20]?.length >= 5, "Test failed: should have multiple 20-photo layout variants.");
  const testPhotos = makePhotoObjects(["a", "b"], "test");
  const testLayout = { slots: [{ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 10, h: 10 }] };
  const frames = createFramesFromLayout(testLayout, testPhotos.map((p) => p.id));
  console.assert(frames.length === 2, "Test failed: should create one frame per slot.");
  const spread = createSpread({ title: "Teste", layout: testLayout, photoIds: testPhotos.map((p) => p.id), count: 2 });
  console.assert(spread.frames.length === 2, "Test failed: spread should create frames.");
  const copy = duplicateSpread(spread);
  console.assert(copy.id !== spread.id && copy.frames[0].id !== spread.frames[0].id, "Test failed: duplicate should create new ids.");
  const swapped = swapFramePhotos(frames, frames[0].id, frames[1].id);
  console.assert(swapped[0].photoId === frames[1].photoId && swapped[1].photoId === frames[0].photoId, "Test failed: photo swap should exchange ids.");
  const target = findDropTarget(frames[0].id, { x: 25, y: 5 }, frames);
  console.assert(target?.id === frames[1].id, "Test failed: pointer over second frame should find target.");
  console.assert(fileListToImageFiles([{ type: "image/jpeg" }, { type: "application/pdf" }]).length === 1, "Test failed: upload should filter non-images.");
}

runSelfTests();

function ToolbarButton({ icon, active = false, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={classNames(
        "flex h-8 w-8 items-center justify-center border-b border-[#6b6b6b] text-base font-black text-white transition-all hover:bg-[#777]",
        active ? "bg-yellow-400 text-stone-950" : "bg-[#595959]"
      )}
    >
      <Icon name={icon} />
    </button>
  );
}

function MiniLayoutPreview({ layout, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={classNames("rounded border p-2 text-left transition-all", active ? "border-yellow-400 bg-yellow-50" : "border-stone-200 bg-white hover:border-stone-400") }>
      <div className="relative aspect-[2/1] w-full overflow-hidden bg-stone-100">
        <div className="absolute left-1/2 top-0 h-full w-px bg-stone-300" />
        {layout.slots.map((slot, idx) => <div key={idx} className="absolute bg-stone-500" style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%` }} />)}
      </div>
      <div className="mt-1 truncate text-[11px] font-bold text-stone-700">{layout.name}</div>
    </button>
  );
}

function UploadDropzone({ isDragging, onDrop, onDragEnter, onDragLeave, onDragOver, onChooseFiles }) {
  return (
    <button type="button" onClick={onChooseFiles} onDrop={onDrop} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} className={classNames("w-full border border-dashed p-4 text-center transition-all", isDragging ? "border-yellow-400 bg-yellow-50" : "border-stone-300 bg-white hover:border-stone-500") }>
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded bg-stone-800 text-xl text-white"><Icon name="upload" /></div>
      <div className="text-sm font-black">Importar imagens</div>
      <div className="mt-1 text-xs leading-relaxed text-stone-500">JPG, PNG, WEBP e fotos do celular.</div>
    </button>
  );
}

function PhotoTile({ photo, index, selectedOrder, used, active, onClick, onPointerDown }) {
  return (
    <button type="button" onClick={onClick} onPointerDown={onPointerDown} className={classNames("relative shrink-0 overflow-hidden border-2 bg-white transition-all", active ? "border-yellow-400 shadow-lg" : selectedOrder ? "border-yellow-400" : used ? "border-white opacity-70" : "border-stone-500/60 hover:border-white")} title="Clique para selecionar. Shift seleciona intervalo. Alt/Ctrl adiciona. Arraste para a lâmina.">
      <img src={photo.src} alt={`Foto ${index + 1}`} className="h-12 w-18 object-cover" draggable="false" />
      <span className="absolute left-1 top-1 bg-white/90 px-1.5 py-0.5 text-[9px] font-black text-stone-700">{index + 1}</span>
      {selectedOrder ? <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-black text-stone-950">{selectedOrder}</span> : null}
      {used && !selectedOrder ? <span className="absolute bottom-1 right-1 bg-stone-950/80 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">usada</span> : null}
    </button>
  );
}

function ResizeHandles({ onStartResize }) {
  const handles = [
    { id: "nw", className: "-left-1.5 -top-1.5 cursor-nwse-resize" },
    { id: "n", className: "left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize" },
    { id: "ne", className: "-right-1.5 -top-1.5 cursor-nesw-resize" },
    { id: "e", className: "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize" },
    { id: "se", className: "-bottom-1.5 -right-1.5 cursor-nwse-resize" },
    { id: "s", className: "bottom-[-6px] left-1/2 -translate-x-1/2 cursor-ns-resize" },
    { id: "sw", className: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
    { id: "w", className: "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize" },
  ];
  return <>{handles.map((handle) => <button key={handle.id} type="button" onPointerDown={(event) => onStartResize(handle.id, event)} className={classNames("absolute z-40 h-4 w-4 border-2 border-stone-950 bg-white shadow-md", handle.className)} title="Arraste para redimensionar" />)}</>;
}

function CropImage({ photo, frame, className = "", onPointerDown }) {
  if (!photo) return <div className={classNames("flex h-full w-full items-center justify-center bg-stone-100 text-stone-400", className)}><Icon name="image" className="text-3xl" /></div>;
  return (
    <div className={classNames("relative h-full w-full overflow-hidden bg-stone-100", className)} onPointerDown={onPointerDown}>
      <img src={photo.src} alt="Foto enquadrada" draggable="false" className="h-full w-full select-none object-cover" style={{ transform: `translate(${frame.cropX || 0}%, ${frame.cropY || 0}%) scale(${frame.cropScale || 1})`, transformOrigin: "center center" }} />
    </div>
  );
}

function Frame({ frame, photo, index, selected, isDropTarget, onSelect, onStartResize, onStartSwap }) {
  return (
    <div className={classNames("group absolute select-none overflow-visible", selected ? "z-40" : "z-10", isDropTarget ? "shadow-[0_0_0_7px_rgba(245,158,11,0.45)]" : "")} style={{ left: `${frame.x}%`, top: `${frame.y}%`, width: `${frame.w}%`, height: `${frame.h}%`, transform: `rotate(${frame.rotate || 0}deg)`, zIndex: selected ? 60 : frame.z }}>
      <button type="button" onClick={onSelect} className={classNames("relative h-full w-full overflow-hidden bg-stone-100 text-left shadow-md ring-offset-2 transition-all", selected ? "ring-4 ring-yellow-400" : "ring-1 ring-black/10 hover:ring-2 hover:ring-stone-700")} title="Clique para selecionar, enquadrar e redimensionar">
        <CropImage photo={photo} frame={frame} />
        <span className="absolute left-1 top-1 bg-white/85 px-1.5 py-0.5 text-[9px] font-black text-stone-700">{index + 1}</span>
        {selected && <><div className="pointer-events-none absolute left-1/2 top-0 h-full w-px bg-white/85" /><div className="pointer-events-none absolute left-0 top-1/2 h-px w-full bg-white/85" /></>}
      </button>
      <button type="button" onPointerDown={(event) => onStartSwap(frame, event)} className="absolute left-1/2 top-1/2 z-50 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border border-white/70 bg-stone-950/45 text-2xl font-black text-white opacity-0 shadow-lg backdrop-blur transition-all hover:scale-105 hover:bg-stone-950/70 group-hover:opacity-100 active:cursor-grabbing" title="Arraste este botão até outra foto para trocar">
        <Icon name="swap" />
      </button>
      {selected && <ResizeHandles onStartResize={onStartResize} />}
    </div>
  );
}

function FullImageCropEditor({ frame, photo, editorRef, onStartCrop }) {
  if (!frame) return null;
  const aspect = Math.max(frame.w / frame.h, 0.2);
  const maskStyle = aspect >= 1 ? { width: "86%", aspectRatio: `${aspect}` } : { height: "86%", aspectRatio: `${aspect}` };
  return (
    <div ref={editorRef} onPointerDown={onStartCrop} className="relative h-[210px] w-full cursor-grab overflow-hidden border border-stone-400 bg-stone-200 shadow-inner active:cursor-grabbing" title="Arraste a foto completa para enquadrar dentro da máscara">
      {photo ? <img src={photo.src} alt="Foto completa para enquadramento" draggable="false" className="absolute left-1/2 top-1/2 max-h-[92%] max-w-[92%] select-none object-contain" style={{ transform: `translate(-50%, -50%) translate(${frame.cropX || 0}%, ${frame.cropY || 0}%) scale(${frame.cropScale || 1})`, transformOrigin: "center center" }} /> : <div className="flex h-full w-full items-center justify-center text-stone-400"><Icon name="image" className="text-4xl" /></div>}
      <div className="pointer-events-none absolute inset-0 bg-black/5" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.22)]" style={maskStyle}>
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/80" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-white/80" />
        <div className="absolute inset-0 border border-stone-950/45" />
        <div className="absolute left-2 top-2 bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-stone-700">área do layout</div>
      </div>
    </div>
  );
}

function CropPanel({ frame, photo, editorRef, onStartCrop, onZoom, onCenter, onUploadNew, onDelete, onResetFrame }) {
  if (!frame) return <div className="rounded border border-dashed border-stone-300 p-4 text-sm text-stone-500">Clique uma vez em uma foto da lâmina para abrir o enquadramento.</div>;
  return (
    <div className="space-y-4">
      <div className="bg-white">
        <div className="mb-2 flex items-center justify-between gap-2"><div><div className="text-sm font-black">Enquadramento da foto</div><div className="text-xs text-stone-500">A foto aparece inteira. Arraste para escolher o recorte.</div></div><span className="rounded bg-stone-100 px-2 py-1 text-[10px] font-black text-stone-600">{frame.w.toFixed(0)}×{frame.h.toFixed(0)}</span></div>
        <FullImageCropEditor frame={frame} photo={photo} editorRef={editorRef} onStartCrop={onStartCrop} />
        <label className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-stone-500">Zoom da foto</label>
        <input type="range" min="0.35" max="3" step="0.01" value={frame.cropScale || 1} onChange={(event) => onZoom(Number(event.target.value))} className="mt-1 w-full accent-yellow-400" />
        <div className="mt-1 text-xs text-stone-500">Zoom: {(frame.cropScale || 1).toFixed(2)}x</div>
        <div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" onClick={onCenter}><Icon name="crop" /> Centralizar</Button><Button variant="outline" onClick={onUploadNew}><Icon name="upload" /> Nova foto</Button></div>
      </div>
      <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={onResetFrame}><Icon name="reset" /> Resetar quadro</Button><Button variant="ghost" onClick={onDelete}><Icon name="trash" /> Remover</Button></div>
    </div>
  );
}

function SelectionStrip({ spreadPhotoIds, photoMap, onRemove, onClear, onBuild, onNext, onPrevious, layoutVariantIndex, activeLayoutOptionsLength }) {
  return (
    <div className="border-t border-[#4b4b4b] bg-[#5c5c5c] px-3 py-1.5 text-white">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div><div className="text-[9px] font-black uppercase tracking-[0.14em] text-stone-300">Fotos da lâmina atual</div><div className="text-xs font-black">{spreadPhotoIds.length} fotos selecionadas · variação {layoutVariantIndex + 1} de {activeLayoutOptionsLength || 0}</div></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="yellow" onClick={onBuild}><Icon name="build" /> Auto Build</Button>
          <Button variant="secondary" onClick={onPrevious}><Icon name="left" /> Layout</Button>
          <Button variant="secondary" onClick={onNext}>Layout <Icon name="right" /></Button>
          <Button variant="secondary" onClick={onClear}>Limpar</Button>
        </div>
      </div>
      <div className="hidden gap-2 overflow-x-auto pb-1 md:flex">
        {spreadPhotoIds.length ? spreadPhotoIds.map((photoId, index) => {
          const photo = photoMap.get(photoId);
          if (!photo) return null;
          return <button key={`${photoId}-${index}`} type="button" onClick={() => onRemove(photoId)} className="relative shrink-0 overflow-hidden border-2 border-yellow-400 bg-white" title="Clique para remover da seleção da lâmina"><img src={photo.src} alt={`Selecionada ${index + 1}`} className="h-9 w-14 object-cover" draggable="false" /><span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-black text-stone-950">{index + 1}</span></button>;
        }) : <div className="rounded border border-dashed border-white/25 px-4 py-4 text-sm text-stone-300">Selecione fotos no rodapé e arraste para a lâmina.</div>}
      </div>
    </div>
  );
}

function SpreadThumbnail({ spread, index, active, photoMap, onClick }) {
  return (
    <button type="button" onClick={onClick} className={classNames("group relative border bg-white p-1 transition-all", active ? "border-yellow-400 shadow-[0_0_0_2px_rgba(250,204,21,0.5)]" : "border-stone-200 hover:border-stone-400")}>
      <div className="relative aspect-[2/1] overflow-hidden bg-stone-100">
        <div className="absolute left-1/2 top-0 z-10 h-full w-px bg-stone-300" />
        {spread.frames.slice(0, 20).map((frame, idx) => {
          const photo = frame.photoId ? photoMap.get(frame.photoId) : null;
          return <div key={idx} className="absolute overflow-hidden bg-stone-300" style={{ left: `${frame.x}%`, top: `${frame.y}%`, width: `${frame.w}%`, height: `${frame.h}%` }}>{photo ? <img src={photo.src} alt="" className="h-full w-full object-cover" /> : null}</div>;
        })}
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] font-black text-stone-600">
        <span>Spread {index + 1}</span><span>{spread.spreadPhotoIds.length}</span>
      </div>
    </button>
  );
}

export default function App() {
  const initialPhotos = useMemo(() => makePhotoObjects(demoImages, "demo"), []);
  const layoutsByCount = useMemo(() => groupLayoutsByCount(layouts), []);
  const supportedCounts = useMemo(() => getSupportedCounts(layoutsByCount), [layoutsByCount]);
  const defaultSelected = useMemo(() => initialPhotos.slice(0, DEFAULT_SPREAD_COUNT).map((photo) => photo.id), [initialPhotos]);
  const initialLayout = layoutsByCount[DEFAULT_SPREAD_COUNT][0];

  const [photoLibrary, setPhotoLibrary] = useState(initialPhotos);
  const [usingDemoImages, setUsingDemoImages] = useState(true);
  const [spreads, setSpreads] = useState(() => [
    createSpread({ title: "Spread 1", layout: initialLayout, photoIds: defaultSelected, count: DEFAULT_SPREAD_COUNT }),
  ]);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const [albumName, setAlbumName] = useState("Proalbuns Studio");
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [interaction, setInteraction] = useState(null);
  const [swapInteraction, setSwapInteraction] = useState(null);
  const [trayDrag, setTrayDrag] = useState(null);
  const [lastClickedPhotoIndex, setLastClickedPhotoIndex] = useState(null);
  const [guides, setGuides] = useState({ vertical: [], horizontal: [], badges: [] });
  const [dropTargetId, setDropTargetId] = useState(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState("all");
  const [tool, setTool] = useState("pointer");
  const [rightPanelMode, setRightPanelMode] = useState("album");

  const spreadRef = useRef(null);
  const replaceInputRef = useRef(null);
  const addInputRef = useRef(null);
  const selectedInputRef = useRef(null);
  const cropStageRef = useRef(null);
  const spreadsRef = useRef(spreads);
  const snapRef = useRef(snapEnabled);
  const trayPointerStartRef = useRef(null);

  const currentSpread = spreads[currentSpreadIndex] || spreads[0];
  const targetPhotoCount = currentSpread?.targetPhotoCount || DEFAULT_SPREAD_COUNT;
  const layoutVariantIndex = currentSpread?.layoutVariantIndex || 0;
  const spreadPhotoIds = currentSpread?.spreadPhotoIds || [];
  const frames = currentSpread?.frames || [];
  const activeLayoutOptions = layoutsByCount[targetPhotoCount] || [];
  const activeLayout = activeLayoutOptions[layoutVariantIndex] || activeLayoutOptions[0] || layouts[0];

  useEffect(() => { spreadsRef.current = spreads; }, [spreads]);
  useEffect(() => { snapRef.current = snapEnabled; }, [snapEnabled]);

  const photoMap = useMemo(() => {
    const map = new Map();
    photoLibrary.forEach((photo) => map.set(photo.id, photo));
    return map;
  }, [photoLibrary]);

  const usedPhotoIds = useMemo(() => new Set(spreads.flatMap((spread) => spread.frames.map((frame) => frame.photoId).filter(Boolean))), [spreads]);
  const selectedFrame = selectedFrameId ? frames.find((frame) => frame.id === selectedFrameId) : null;
  const selectedPhoto = selectedFrame?.photoId ? photoMap.get(selectedFrame.photoId) : null;
  const totalPages = spreads.length * 2;
  const totalUsedImages = usedPhotoIds.size;

  const updateCurrentSpread = useCallback((patchOrUpdater) => {
    setSpreads((current) => current.map((spread, index) => {
      if (index !== currentSpreadIndex) return spread;
      return typeof patchOrUpdater === "function" ? patchOrUpdater(spread) : { ...spread, ...patchOrUpdater };
    }));
  }, [currentSpreadIndex]);

  const applyLayoutVariant = useCallback((count, variantIndex, photoIds, preserveFrames = frames) => {
    const cappedCount = Math.min(count, MAX_PHOTOS_PER_SPREAD);
    const options = layoutsByCount[cappedCount] || [];
    if (!options.length) return false;
    const safeIndex = ((variantIndex % options.length) + options.length) % options.length;
    const cleanPhotoIds = Array.from(new Set(photoIds)).slice(0, cappedCount);
    const nextFrames = createFramesFromLayout(options[safeIndex], cleanPhotoIds, preserveFrames);
    updateCurrentSpread((spread) => ({
      ...spread,
      targetPhotoCount: cappedCount,
      layoutVariantIndex: safeIndex,
      spreadPhotoIds: cleanPhotoIds,
      frames: nextFrames,
    }));
    setSelectedFrameId(nextFrames[0]?.id || null);
    setGuides({ vertical: [], horizontal: [], badges: [] });
    setDropTargetId(null);
    return true;
  }, [frames, layoutsByCount, updateCurrentSpread]);

  const buildFromPhotoIds = useCallback((photoIds, variantIndex = 0) => {
    const cleanIds = Array.from(new Set(photoIds)).slice(0, MAX_PHOTOS_PER_SPREAD);
    if (!cleanIds.length) return;
    applyLayoutVariant(cleanIds.length, variantIndex, cleanIds, frames);
  }, [applyLayoutVariant, frames]);

  const autoBuildFromSelection = useCallback(() => {
    if (!spreadPhotoIds.length) {
      alert("Selecione ou arraste algumas fotos para a lâmina primeiro.");
      return;
    }
    buildFromPhotoIds(spreadPhotoIds, 0);
  }, [buildFromPhotoIds, spreadPhotoIds]);

  const nextLayoutVariant = useCallback(() => {
    const options = layoutsByCount[targetPhotoCount] || [];
    if (!options.length) return;
    applyLayoutVariant(targetPhotoCount, layoutVariantIndex + 1, spreadPhotoIds, frames);
  }, [applyLayoutVariant, frames, layoutVariantIndex, layoutsByCount, spreadPhotoIds, targetPhotoCount]);

  const previousLayoutVariant = useCallback(() => {
    const options = layoutsByCount[targetPhotoCount] || [];
    if (!options.length) return;
    applyLayoutVariant(targetPhotoCount, layoutVariantIndex - 1, spreadPhotoIds, frames);
  }, [applyLayoutVariant, frames, layoutVariantIndex, layoutsByCount, spreadPhotoIds, targetPhotoCount]);

  const buildWithFirstN = (count) => {
    const photoIds = photoLibrary.slice(0, count).map((photo) => photo.id);
    buildFromPhotoIds(photoIds, 0);
  };

  const addBlankSpread = () => {
    const count = DEFAULT_SPREAD_COUNT;
    const photoIds = photoLibrary.slice(0, count).map((photo) => photo.id);
    const layout = layoutsByCount[count][0];
    const newSpread = createSpread({ title: `Spread ${spreads.length + 1}`, layout, photoIds, count });
    setSpreads((current) => {
      const next = [...current.slice(0, currentSpreadIndex + 1), newSpread, ...current.slice(currentSpreadIndex + 1)];
      return next.map((spread, index) => ({ ...spread, title: `Spread ${index + 1}` }));
    });
    setCurrentSpreadIndex((index) => index + 1);
    setSelectedFrameId(newSpread.frames[0]?.id || null);
  };

  const duplicateCurrentSpread = () => {
    const copy = duplicateSpread(currentSpread);
    setSpreads((current) => {
      const next = [...current.slice(0, currentSpreadIndex + 1), copy, ...current.slice(currentSpreadIndex + 1)];
      return next.map((spread, index) => ({ ...spread, title: `Spread ${index + 1}` }));
    });
    setCurrentSpreadIndex((index) => index + 1);
    setSelectedFrameId(copy.frames[0]?.id || null);
  };

  const deleteCurrentSpread = () => {
    if (spreads.length <= 1) {
      alert("O álbum precisa ter pelo menos uma lâmina.");
      return;
    }
    setSpreads((current) => {
      const next = current.filter((_, index) => index !== currentSpreadIndex).map((spread, index) => ({ ...spread, title: `Spread ${index + 1}` }));
      return next;
    });
    setCurrentSpreadIndex((index) => Math.max(0, index - 1));
    setSelectedFrameId(null);
  };

  const goToSpread = (index) => {
    setCurrentSpreadIndex(index);
    setSelectedFrameId(spreads[index]?.frames[0]?.id || null);
    setRightPanelMode("album");
  };

  const handlePhotoClick = (photoId, index, event) => {
    updateCurrentSpread((spread) => {
      let nextIds;
      if (event.shiftKey && lastClickedPhotoIndex !== null) {
        const start = Math.min(lastClickedPhotoIndex, index);
        const end = Math.max(lastClickedPhotoIndex, index);
        const rangeIds = photoLibrary.slice(start, end + 1).map((photo) => photo.id);
        nextIds = Array.from(new Set([...spread.spreadPhotoIds, ...rangeIds])).slice(0, MAX_PHOTOS_PER_SPREAD);
      } else if (event.altKey || event.ctrlKey || event.metaKey) {
        nextIds = spread.spreadPhotoIds.includes(photoId) ? spread.spreadPhotoIds.filter((id) => id !== photoId) : [...spread.spreadPhotoIds, photoId].slice(0, MAX_PHOTOS_PER_SPREAD);
      } else {
        nextIds = spread.spreadPhotoIds.includes(photoId) && spread.spreadPhotoIds.length === 1 ? [] : [photoId];
      }
      return { ...spread, spreadPhotoIds: nextIds };
    });
    setLastClickedPhotoIndex(index);
  };

  const removePhotoFromSpread = (photoId) => {
    updateCurrentSpread((spread) => ({ ...spread, spreadPhotoIds: spread.spreadPhotoIds.filter((id) => id !== photoId) }));
  };

  const clearSpreadSelection = () => {
    updateCurrentSpread({ spreadPhotoIds: [] });
  };

  const startTrayDrag = (photoId, index, event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const baseSelection = spreadPhotoIds.includes(photoId) ? spreadPhotoIds : [photoId];
    trayPointerStartRef.current = { photoId, index, startX: event.clientX, startY: event.clientY, selection: baseSelection };
  };

  useEffect(() => {
    const onPointerMove = (event) => {
      const start = trayPointerStartRef.current;
      if (!start || trayDrag) return;
      const dx = event.clientX - start.startX;
      const dy = event.clientY - start.startY;
      if (Math.sqrt(dx * dx + dy * dy) > 7) {
        setTrayDrag({ photoIds: start.selection.slice(0, MAX_PHOTOS_PER_SPREAD), clientX: event.clientX, clientY: event.clientY, overSpread: false });
      }
    };
    const onPointerUp = (event) => {
      if (trayDrag && spreadRef.current) {
        const rect = spreadRef.current.getBoundingClientRect();
        const over = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
        if (over) buildFromPhotoIds(trayDrag.photoIds, 0);
      }
      trayPointerStartRef.current = null;
      setTrayDrag(null);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [buildFromPhotoIds, trayDrag]);

  useEffect(() => {
    if (!trayDrag) return undefined;
    const onPointerMove = (event) => {
      const rect = spreadRef.current?.getBoundingClientRect();
      const over = rect ? event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom : false;
      setTrayDrag((current) => current ? { ...current, clientX: event.clientX, clientY: event.clientY, overSpread: over } : current);
    };
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [trayDrag]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
      if (event.key === "ArrowRight") nextLayoutVariant();
      if (event.key === "ArrowLeft") previousLayoutVariant();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextLayoutVariant, previousLayoutVariant]);

  useEffect(() => {
    if (!interaction) return undefined;
    const handlePointerMove = (event) => {
      if (!spreadRef.current && interaction.type !== "crop") return;
      if (interaction.type === "resize") {
        const spreadRect = spreadRef.current.getBoundingClientRect();
        const dx = ((event.clientX - interaction.startClientX) / spreadRect.width) * 100;
        const dy = ((event.clientY - interaction.startClientY) / spreadRect.height) * 100;
        const resized = resizeFrame(interaction.originalFrame, interaction.handle, dx, dy);
        const result = snapRef.current ? applyResizeSnap(resized, interaction.frameId, frames, interaction.handle) : { frame: resized, guides: { vertical: [], horizontal: [], badges: [] } };
        const nextFrames = updateFrame(frames, interaction.frameId, result.frame);
        updateCurrentSpread({ frames: nextFrames, spreadPhotoIds: syncSpreadPhotoIdsFromFrames(nextFrames) });
        setGuides(result.guides);
      }
      if (interaction.type === "crop") {
        const rect = cropStageRef.current?.getBoundingClientRect();
        if (!rect) return;
        const dx = ((event.clientX - interaction.startClientX) / rect.width) * 100;
        const dy = ((event.clientY - interaction.startClientY) / rect.height) * 100;
        const nextFrames = updateFrame(frames, interaction.frameId, { cropX: interaction.originalCropX + dx, cropY: interaction.originalCropY + dy });
        updateCurrentSpread({ frames: nextFrames });
      }
    };
    const handlePointerUp = () => {
      setInteraction(null);
      setGuides({ vertical: [], horizontal: [], badges: [] });
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [frames, interaction, updateCurrentSpread]);

  useEffect(() => {
    if (!swapInteraction) return undefined;
    const handlePointerMove = (event) => {
      if (!spreadRef.current) return;
      const point = getPointerPct(event, spreadRef.current);
      const target = findDropTarget(swapInteraction.sourceFrameId, point, frames);
      setDropTargetId(target?.id || null);
      setSwapInteraction((current) => current ? { ...current, point, clientX: event.clientX, clientY: event.clientY } : current);
    };
    const handlePointerUp = (event) => {
      if (!spreadRef.current) { setSwapInteraction(null); setDropTargetId(null); return; }
      const point = getPointerPct(event, spreadRef.current);
      const target = findDropTarget(swapInteraction.sourceFrameId, point, frames);
      if (target) {
        const swapped = swapFramePhotos(frames, swapInteraction.sourceFrameId, target.id);
        updateCurrentSpread({ frames: swapped, spreadPhotoIds: syncSpreadPhotoIdsFromFrames(swapped) });
        setSelectedFrameId(target.id);
      }
      setSwapInteraction(null);
      setDropTargetId(null);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [frames, swapInteraction, updateCurrentSpread]);

  const readFilesAsPhotos = async (files, prefix = "user") => {
    const imageFiles = fileListToImageFiles(files);
    if (!imageFiles.length) { alert("Escolha pelo menos uma imagem em JPG, PNG ou WEBP."); return []; }
    const readers = imageFiles.map((file, index) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ id: uid(prefix), src: reader.result, name: file.name || `${prefix}-${index + 1}` });
      reader.onerror = () => reject(new Error(`Não foi possível carregar ${file.name}`));
      reader.readAsDataURL(file);
    }));
    return Promise.all(readers);
  };

  const replaceAllPhotos = async (files) => {
    try {
      const newPhotos = await readFilesAsPhotos(files, "replace");
      if (!newPhotos.length) return;
      setPhotoLibrary(newPhotos);
      setUsingDemoImages(false);
      const count = Math.min(newPhotos.length, 8, MAX_PHOTOS_PER_SPREAD);
      const nextIds = newPhotos.slice(0, count).map((photo) => photo.id);
      const layout = layoutsByCount[count][0];
      const newSpread = createSpread({ title: "Spread 1", layout, photoIds: nextIds, count });
      setSpreads([newSpread]);
      setCurrentSpreadIndex(0);
      setSelectedFrameId(newSpread.frames[0]?.id || null);
    } catch (error) { console.error(error); alert("Erro ao carregar as fotos."); }
  };

  const appendPhotos = async (files, assignToSelected = false) => {
    try {
      const newPhotos = await readFilesAsPhotos(files, "append");
      if (!newPhotos.length) return;
      setPhotoLibrary((current) => [...current, ...newPhotos]);
      setUsingDemoImages(false);
      if (assignToSelected && selectedFrameId) {
        const nextFrames = updateFrame(frames, selectedFrameId, { photoId: newPhotos[0].id, cropX: 0, cropY: 0, cropScale: 1 });
        updateCurrentSpread({ frames: nextFrames, spreadPhotoIds: syncSpreadPhotoIdsFromFrames(nextFrames) });
      }
    } catch (error) { console.error(error); alert("Erro ao adicionar fotos."); }
  };

  const handleReplaceUpload = async (event) => { await replaceAllPhotos(event.target.files); if (event.target) event.target.value = ""; };
  const handleAddUpload = async (event) => { await appendPhotos(event.target.files, false); if (event.target) event.target.value = ""; };
  const handleSelectedUpload = async (event) => { await appendPhotos(event.target.files, true); if (event.target) event.target.value = ""; };
  const handleDropFiles = async (event) => { event.preventDefault(); event.stopPropagation(); setIsDraggingFiles(false); await replaceAllPhotos(event.dataTransfer.files); };

  const resetToDemoImages = () => {
    const demoObjects = makePhotoObjects(demoImages, "demo-reset");
    setPhotoLibrary(demoObjects);
    setUsingDemoImages(true);
    const nextIds = demoObjects.slice(0, DEFAULT_SPREAD_COUNT).map((photo) => photo.id);
    const layout = layoutsByCount[DEFAULT_SPREAD_COUNT][0];
    const newSpread = createSpread({ title: "Spread 1", layout, photoIds: nextIds, count: DEFAULT_SPREAD_COUNT });
    setSpreads([newSpread]);
    setCurrentSpreadIndex(0);
    setSelectedFrameId(newSpread.frames[0]?.id || null);
  };

  const choosePhotoForSelectedFrame = (photoId) => {
    if (!selectedFrameId) return;
    const nextFrames = updateFrame(frames, selectedFrameId, { photoId, cropX: 0, cropY: 0, cropScale: 1 });
    updateCurrentSpread({ frames: nextFrames, spreadPhotoIds: syncSpreadPhotoIdsFromFrames(nextFrames) });
  };

  const startResize = (frame, handle, event) => {
    event.preventDefault(); event.stopPropagation(); setSelectedFrameId(frame.id); setRightPanelMode("photo");
    setInteraction({ type: "resize", handle, frameId: frame.id, startClientX: event.clientX, startClientY: event.clientY, originalFrame: { ...frame } });
  };

  const startSwap = (frame, event) => {
    event.preventDefault(); event.stopPropagation(); if (!spreadRef.current) return;
    const point = getPointerPct(event, spreadRef.current);
    setSelectedFrameId(frame.id); setRightPanelMode("photo");
    setSwapInteraction({ sourceFrameId: frame.id, point, clientX: event.clientX, clientY: event.clientY });
  };

  const startCropDrag = (event) => {
    if (!selectedFrame) return;
    event.preventDefault(); event.stopPropagation();
    setInteraction({ type: "crop", frameId: selectedFrame.id, startClientX: event.clientX, startClientY: event.clientY, originalCropX: selectedFrame.cropX || 0, originalCropY: selectedFrame.cropY || 0 });
  };

  const setSelectedCropZoom = (value) => {
    if (!selectedFrameId) return;
    const nextFrames = updateFrame(frames, selectedFrameId, { cropScale: value });
    updateCurrentSpread({ frames: nextFrames });
  };

  const centerSelectedCrop = () => {
    if (!selectedFrameId) return;
    const nextFrames = updateFrame(frames, selectedFrameId, { cropX: 0, cropY: 0, cropScale: 1 });
    updateCurrentSpread({ frames: nextFrames });
  };

  const resetSelectedFrame = () => {
    if (!selectedFrameId) return;
    const index = frames.findIndex((frame) => frame.id === selectedFrameId);
    const slot = activeLayout.slots[index] || activeLayout.slots[0];
    if (!slot) return;
    const nextFrames = updateFrame(frames, selectedFrameId, { x: slot.x, y: slot.y, w: slot.w, h: slot.h, rotate: slot.rotate || 0, cropX: 0, cropY: 0, cropScale: 1 });
    updateCurrentSpread({ frames: nextFrames });
  };

  const deleteSelectedFrame = () => {
    if (!selectedFrameId) return;
    const nextFrames = frames.filter((frame) => frame.id !== selectedFrameId);
    updateCurrentSpread({ frames: nextFrames, spreadPhotoIds: syncSpreadPhotoIdsFromFrames(nextFrames), targetPhotoCount: nextFrames.length });
    setSelectedFrameId(nextFrames[0]?.id || null);
  };

  const filteredBottomPhotos = activeBottomTab === "selected" ? photoLibrary.filter((photo) => spreadPhotoIds.includes(photo.id)) : activeBottomTab === "unused" ? photoLibrary.filter((photo) => !usedPhotoIds.has(photo.id)) : photoLibrary;

  return (
    <div className="h-screen overflow-hidden bg-[#bdbdbd] text-stone-950 text-[13px]">
      <header className="flex h-10 items-center justify-between bg-[#555] px-3 text-white shadow">
        <div className="flex items-center gap-3">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-xl font-black text-stone-950"><Icon name="left" /></button>
          <div className="text-xs font-black tracking-wide">Pixellu SmartAlbums · Proalbuns</div>
          <input value={albumName} onChange={(event) => setAlbumName(event.target.value)} className="w-44 rounded border border-white/20 bg-white/10 px-2 py-1 text-xs font-bold outline-none focus:border-yellow-400" />
        </div>
        <div className="hidden text-[11px] font-bold text-stone-200 xl:block">{spreads.length} spreads ({totalPages} páginas), {totalUsedImages}/{photoLibrary.length} imagens usadas</div>
        <div className="flex items-center gap-2">
          <Button variant="dark" onClick={addBlankSpread}><Icon name="plus" /> Inserir páginas</Button>
          <Button variant="dark" onClick={duplicateCurrentSpread}><Icon name="duplicate" /> Duplicar</Button>
          <Button variant="yellow"><Icon name="export" /> Export</Button>
        </div>
      </header>

      <div className="grid h-[calc(100vh-40px)] grid-cols-[42px_minmax(0,1fr)_290px] grid-rows-[minmax(0,1fr)_138px]">
        <aside className="row-span-2 bg-[#4f4f4f] pt-2 shadow-inner">
          <ToolbarButton icon="home" title="Início" />
          <ToolbarButton icon="pointer" active={tool === "pointer"} title="Selecionar" onClick={() => setTool("pointer")} />
          <ToolbarButton icon="pan" active={tool === "pan"} title="Mover" onClick={() => setTool("pan")} />
          <ToolbarButton icon="text" active={tool === "text"} title="Texto" onClick={() => setTool("text")} />
          <ToolbarButton icon="crop" active={rightPanelMode === "photo"} title="Enquadrar" onClick={() => setRightPanelMode("photo")} />
          <ToolbarButton icon="zoom" title="Zoom" />
        </aside>

        <main className="relative overflow-auto bg-[#bfbfbf]">
          <div className="sticky left-0 right-0 top-0 z-10 flex h-7 items-center border-b border-[#9c9c9c] bg-[#c8c8c8] px-3 text-[10px] font-bold text-stone-600">
            <div className="flex-1">0&nbsp;&nbsp;&nbsp;&nbsp;10&nbsp;&nbsp;&nbsp;&nbsp;20&nbsp;&nbsp;&nbsp;&nbsp;30&nbsp;&nbsp;&nbsp;&nbsp;40&nbsp;&nbsp;&nbsp;&nbsp;50&nbsp;&nbsp;&nbsp;&nbsp;60</div>
            <div>{currentSpread?.title} · {targetPhotoCount} fotos · layout {layoutVariantIndex + 1}/{activeLayoutOptions.length}</div>
          </div>

          <div className={classNames("flex min-h-[calc(100%-28px)] items-center justify-center px-3 py-2 transition-all", trayDrag?.overSpread ? "bg-yellow-300/20" : "") }>
            <div className="w-[min(100%,920px,calc((100vh-245px)*2))]">
              <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.1em] text-stone-600">
                <span>Página esquerda 20x20</span>
                <div className="flex gap-1">
                  <Button variant="yellow" className="px-2 py-1 text-xs" onClick={previousLayoutVariant}><Icon name="left" /> Layout</Button>
                  <Button variant="yellow" className="px-2 py-1 text-xs" onClick={nextLayoutVariant}>Layout <Icon name="right" /></Button>
                  <Button variant={snapEnabled ? "active" : "secondary"} className="px-2 py-1 text-xs" onClick={() => setSnapEnabled((value) => !value)}><Icon name="magnet" /> Magnético</Button>
                </div>
                <span>Página direita 20x20</span>
              </div>
              <div ref={spreadRef} className="relative aspect-[2/1] w-full overflow-hidden bg-white shadow-xl ring-1 ring-black/30">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.035)_0_1px,transparent_1px_100%),linear-gradient(0deg,rgba(0,0,0,0.03)_0_1px,transparent_1px_100%)] bg-[size:5%_10%]" />
                <div className="absolute inset-[2.2%] border border-dashed border-red-300/80" />
                <div className="absolute left-1/2 top-0 z-20 h-full w-[2px] bg-gradient-to-b from-transparent via-stone-400/70 to-transparent" />
                {guides.vertical.map((x, index) => <div key={`v-${index}-${x}`} className="pointer-events-none absolute top-0 z-[80] h-full w-px bg-amber-500" style={{ left: `${x}%` }} />)}
                {guides.horizontal.map((y, index) => <div key={`h-${index}-${y}`} className="pointer-events-none absolute left-0 z-[80] h-px w-full bg-amber-500" style={{ top: `${y}%` }} />)}
                {guides.badges.map((badge, index) => <div key={`b-${index}`} className="pointer-events-none absolute z-[90] -translate-x-1/2 bg-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow" style={{ left: `${badge.x}%`, top: `${badge.y}%` }}>{badge.text}</div>)}
                {frames.map((frame, index) => <Frame key={frame.id} frame={frame} index={index} photo={frame.photoId ? photoMap.get(frame.photoId) : null} selected={selectedFrameId === frame.id} isDropTarget={dropTargetId === frame.id} onSelect={(event) => { event.stopPropagation(); setSelectedFrameId(frame.id); setRightPanelMode("photo"); }} onStartResize={(handle, event) => startResize(frame, handle, event)} onStartSwap={startSwap} />)}
                {swapInteraction && <div className="pointer-events-none fixed z-[9999] flex items-center gap-2 rounded-full bg-stone-950/85 px-3 py-2 text-xs font-black uppercase tracking-wide text-white shadow-xl" style={{ left: swapInteraction.clientX + 12, top: swapInteraction.clientY + 12 }}><Icon name="swap" /> solte sobre outra foto</div>}
                {trayDrag?.overSpread && <div className="pointer-events-none absolute inset-6 z-[100] flex items-center justify-center border-4 border-dashed border-yellow-400 bg-yellow-100/60 text-2xl font-black text-stone-950">Solte para montar {trayDrag.photoIds.length} fotos</div>}
              </div>
            </div>
          </div>
        </main>

        <aside className="row-span-2 overflow-y-auto border-l border-[#d8d8d8] bg-white">
          <div className="sticky top-0 z-10 border-b border-stone-200 bg-white px-3 py-3">
            <div className="flex items-center justify-between">
              <h2 className="max-w-[155px] truncate text-base font-black text-stone-700">{rightPanelMode === "photo" ? selectedPhoto?.name || "Foto" : albumName}</h2>
              <div className="flex gap-1">
                <button type="button" onClick={() => setRightPanelMode("album")} className={classNames("rounded px-2 py-1 text-xs font-black", rightPanelMode === "album" ? "bg-yellow-400" : "bg-stone-100")}>Álbum</button>
                <button type="button" onClick={() => setRightPanelMode("photo")} className={classNames("rounded px-2 py-1 text-xs font-black", rightPanelMode === "photo" ? "bg-yellow-400" : "bg-stone-100")}>Foto</button>
              </div>
            </div>
          </div>

          {rightPanelMode === "photo" ? (
            <Panel><div className="p-3"><CropPanel frame={selectedFrame} photo={selectedPhoto} editorRef={cropStageRef} onStartCrop={startCropDrag} onZoom={setSelectedCropZoom} onCenter={centerSelectedCrop} onUploadNew={() => selectedInputRef.current?.click()} onDelete={deleteSelectedFrame} onResetFrame={resetSelectedFrame} /></div></Panel>
          ) : (
            <>
              <Panel><div className="p-3"><h3 className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-stone-500">Album Info</h3><div className="space-y-2 text-sm text-stone-700"><div className="flex justify-between"><span>Spreads</span><strong>{spreads.length}</strong></div><div className="flex justify-between"><span>Páginas</span><strong>{totalPages}</strong></div><div className="flex justify-between"><span>Imagens usadas</span><strong>{totalUsedImages}/{photoLibrary.length}</strong></div><div className="flex justify-between"><span>Formato</span><strong>20x20</strong></div></div><div className="mt-4 grid grid-cols-2 gap-2"><Button variant="yellow" onClick={addBlankSpread}><Icon name="plus" /> Inserir</Button><Button variant="outline" onClick={duplicateCurrentSpread}><Icon name="duplicate" /> Duplicar</Button><Button variant="outline" onClick={deleteCurrentSpread}><Icon name="trash" /> Remover</Button><Button variant="outline" onClick={autoBuildFromSelection}><Icon name="build" /> Auto</Button></div></div></Panel>
              <Panel><div className="p-3"><h3 className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-stone-500">Album Preferences</h3><div className="space-y-3 text-xs font-bold text-stone-600"><label className="flex items-center justify-between gap-3">Color Profile <select className="rounded border border-stone-200 bg-white px-2 py-1"><option>sRGB</option><option>Adobe RGB</option></select></label><label className="flex items-center justify-between gap-3">Project Units <select className="rounded border border-stone-200 bg-white px-2 py-1"><option>Centimeters</option><option>Pixels</option></select></label></div></div></Panel>
              <Panel><div className="p-3"><h3 className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-stone-500">Spread Grid</h3><div className="grid grid-cols-2 gap-2">{spreads.map((spread, index) => <SpreadThumbnail key={spread.id} spread={spread} index={index} active={index === currentSpreadIndex} photoMap={photoMap} onClick={() => goToSpread(index)} />)}</div></div></Panel>
              <Panel><div className="p-3"><h3 className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-stone-500">Layouts desta lâmina</h3><div className="grid grid-cols-1 gap-2">{activeLayoutOptions.slice(0, 5).map((layout, idx) => <MiniLayoutPreview key={layout.id} layout={layout} active={idx === layoutVariantIndex} onClick={() => applyLayoutVariant(targetPhotoCount, idx, spreadPhotoIds)} />)}</div></div></Panel>
            </>
          )}
        </aside>

        <section className="col-span-2 min-w-0 overflow-hidden border-t border-[#4b4b4b] bg-[#676767] text-white">
          <SelectionStrip spreadPhotoIds={spreadPhotoIds} photoMap={photoMap} onRemove={removePhotoFromSpread} onClear={clearSpreadSelection} onBuild={autoBuildFromSelection} onNext={nextLayoutVariant} onPrevious={previousLayoutVariant} layoutVariantIndex={layoutVariantIndex} activeLayoutOptionsLength={activeLayoutOptions.length} />
          <div className="border-t border-[#747474] px-3 py-1.5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button variant={activeBottomTab === "all" ? "yellow" : "secondary"} className="px-2 py-1 text-xs" onClick={() => setActiveBottomTab("all")}>All images</Button>
                <Button variant={activeBottomTab === "selected" ? "yellow" : "secondary"} className="px-2 py-1 text-xs" onClick={() => setActiveBottomTab("selected")}>Selecionadas</Button>
                <Button variant={activeBottomTab === "unused" ? "yellow" : "secondary"} className="px-2 py-1 text-xs" onClick={() => setActiveBottomTab("unused")}>Não usadas</Button>
                <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => addInputRef.current?.click()}><Icon name="upload" /> Import</Button>
              </div>
              <div className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-stone-300 xl:block">Shift seleciona intervalo · Alt/Ctrl adiciona · Arraste para a lâmina</div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filteredBottomPhotos.map((photo) => { const index = photoLibrary.findIndex((item) => item.id === photo.id); return <PhotoTile key={photo.id} photo={photo} index={index} selectedOrder={spreadPhotoIds.indexOf(photo.id) + 1} used={usedPhotoIds.has(photo.id)} active={selectedFrame?.photoId === photo.id} onClick={(event) => handlePhotoClick(photo.id, index, event)} onPointerDown={(event) => startTrayDrag(photo.id, index, event)} />; })}
            </div>
          </div>
        </section>
      </div>

      <input ref={replaceInputRef} type="file" accept="image/*" multiple onChange={handleReplaceUpload} className="hidden" />
      <input ref={addInputRef} type="file" accept="image/*" multiple onChange={handleAddUpload} className="hidden" />
      <input ref={selectedInputRef} type="file" accept="image/*" onChange={handleSelectedUpload} className="hidden" />

      {trayDrag && <div className="pointer-events-none fixed z-[9999] rounded bg-stone-950/90 px-4 py-3 text-sm font-black text-white shadow-xl" style={{ left: trayDrag.clientX + 16, top: trayDrag.clientY + 16 }}><Icon name="hand" /> Arrastando {trayDrag.photoIds.length} foto{trayDrag.photoIds.length > 1 ? "s" : ""}</div>}
    </div>
  );
}
