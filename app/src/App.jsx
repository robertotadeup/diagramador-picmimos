import React, { useMemo, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";

const MAX_PAGES = 120;
const MIN_PAGES = 20;
const SAFETY_MARGIN_CM = 0.3;

const FORMATS = [
  { id: "15x15", label: "15x15", closedW: 15, closedH: 15, spreadW: 30, spreadH: 15.2, orientation: "quadrado" },
  { id: "15x21-v", label: "15x21 vertical", closedW: 15, closedH: 21, spreadW: 30, spreadH: 20.4, orientation: "vertical" },
  { id: "15x21-h", label: "15x21 horizontal", closedW: 21, closedH: 15, spreadW: 42, spreadH: 15.2, orientation: "horizontal" },
  { id: "20x20", label: "20x20", closedW: 20, closedH: 20, spreadW: 40, spreadH: 20.3, orientation: "quadrado" },
  { id: "20x25-v", label: "20x25 vertical", closedW: 20, closedH: 25, spreadW: 40, spreadH: 25.4, orientation: "vertical" },
  { id: "20x25-h", label: "20x25 horizontal", closedW: 25, closedH: 20, spreadW: 50, spreadH: 20.3, orientation: "horizontal" },
  { id: "25x25", label: "25x25", closedW: 25, closedH: 25, spreadW: 50, spreadH: 25.4, orientation: "quadrado" },
  { id: "30x30", label: "30x30", closedW: 30, closedH: 30, spreadW: 60, spreadH: 30.5, orientation: "quadrado" },
  { id: "30x40", label: "30x40", closedW: 30, closedH: 40, spreadW: 60, spreadH: 40.0, orientation: "vertical" },
];

const TEXTURES = [
  { id: "preto", label: "Courino Preto", css: "linear-gradient(135deg, #111 0%, #333 50%, #080808 100%)" },
  { id: "marrom", label: "Courino Marrom", css: "linear-gradient(135deg, #5a351f 0%, #7d5132 48%, #3b2114 100%)" },
  { id: "champagne", label: "Dune Champagne", css: "linear-gradient(135deg, #d7c5a0 0%, #efe3c7 52%, #bca878 100%)" },
  { id: "cinza", label: "Courino Cinza", css: "linear-gradient(135deg, #5f6265 0%, #9a9da0 50%, #404245 100%)" },
  { id: "branco", label: "Courino Branco", css: "linear-gradient(135deg, #eeeeee 0%, #ffffff 45%, #d7d7d7 100%)" },
];

const TEXT_FONTS = [
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Playfair Display, Georgia, serif", label: "Playfair" },
  { value: "Montserrat, Arial, sans-serif", label: "Montserrat" },
  { value: "Great Vibes, cursive", label: "Cursiva" },
  { value: "Cinzel, Georgia, serif", label: "Cinzel" },
];

const TEXT_COLORS = ["#222222", "#ffffff", "#d9a441", "#5b5b5b", "#244236", "#9d2f2f"];

const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
];

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function makeDemoPhotos() {
  return DEMO_PHOTOS.map((src, index) => ({ id: uid("demo"), src, name: `Foto demo ${index + 1}` }));
}

function loadImageFiles(files) {
  const list = Array.from(files || []).filter((file) => file.type?.startsWith("image/"));
  if (!list.length) return Promise.resolve([]);
  return Promise.all(list.map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ id: uid("photo"), src: reader.result, name: file.name });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));
}

function makeText(overrides = {}) {
  return {
    id: uid("text"),
    value: "Digite seu texto",
    x: 50,
    y: 50,
    w: 30,
    size: 26,
    color: "#ffffff",
    fontFamily: TEXT_FONTS[0].value,
    weight: 800,
    align: "center",
    ...overrides,
  };
}

function createBlankSpread(index) {
  return {
    id: uid("spread"),
    name: `Página ${index * 2 + 1}-${index * 2 + 2}`,
    frames: [],
    texts: [],
    layoutVariant: 0,
  };
}

function buildBlankSpreads(pageCount) {
  const spreadCount = pageCount / 2;
  return Array.from({ length: spreadCount }, (_, index) => createBlankSpread(index));
}

function getSpineCm(pageCount) {
  const laminas = pageCount / 2;
  return laminas * 0.1; // 1 mm por lâmina = 0,1 cm
}

function gapPct(format, gapMm, axis = "x") {
  const cm = gapMm / 10;
  const base = axis === "x" ? format.spreadW : format.spreadH;
  return round((cm / base) * 100);
}

function getLayouts(count, variant = 0, format = FORMATS[3], gapMm = 1) {
  const safeCount = clamp(count, 1, 20);
  const gapX = gapPct(format, gapMm, "x");
  const gapY = gapPct(format, gapMm, "y");
  const layouts = [];

  const grid = (n, cols, rows, x = 0, y = 0, w = 100, h = 100) => gridLayout(n, cols, rows, x, gapX, gapY, w, h, y);

  // 1) Grade limpa ocupando a lâmina inteira
  const gridCols = safeCount <= 2 ? safeCount : Math.ceil(Math.sqrt(safeCount * 2));
  const gridRows = Math.ceil(safeCount / gridCols);
  layouts.push(grid(safeCount, gridCols, gridRows));

  // 2) Foto única sempre ocupa tudo
  if (safeCount === 1) {
    layouts.push([{ x: 0, y: 0, w: 100, h: 100 }]);
  }

  // 3) Uma grande à esquerda + mosaico à direita
  if (safeCount > 1) {
    const rest = safeCount - 1;
    const bigW = 58;
    const rightX = bigW + gapX;
    const rightW = Math.max(8, 100 - rightX);
    const rightCols = rest <= 3 ? 1 : rest <= 8 ? 2 : 3;
    const rightRows = Math.ceil(rest / rightCols);
    layouts.push([
      { x: 0, y: 0, w: round(bigW), h: 100 },
      ...grid(rest, rightCols, rightRows, rightX, 0, rightW, 100),
    ]);
  }

  // 4) Uma grande à direita + mosaico à esquerda
  if (safeCount > 1) {
    const rest = safeCount - 1;
    const leftW = 41.2;
    const bigX = leftW + gapX;
    const bigW = Math.max(8, 100 - bigX);
    const leftCols = rest <= 3 ? 1 : rest <= 8 ? 2 : 3;
    const leftRows = Math.ceil(rest / leftCols);
    layouts.push([
      ...grid(rest, leftCols, leftRows, 0, 0, leftW, 100),
      { x: round(bigX), y: 0, w: round(bigW), h: 100 },
    ]);
  }

  // 5) Editorial: faixa superior + mosaico inferior
  if (safeCount >= 3) {
    const top = Math.min(3, safeCount);
    const bottom = safeCount - top;
    const topH = 39;
    const bottomY = topH + gapY;
    const bottomH = Math.max(8, 100 - bottomY);
    const slots = grid(top, top, 1, 0, 0, 100, topH);
    if (bottom > 0) {
      const bCols = Math.ceil(Math.sqrt(bottom * 2));
      const bRows = Math.ceil(bottom / bCols);
      slots.push(...grid(bottom, bCols, bRows, 0, bottomY, 100, bottomH));
    }
    layouts.push(slots.slice(0, safeCount));
  }

  // 6) Smart-style: cada página tem sua própria composição
  if (safeCount >= 2) {
    const leftCount = Math.ceil(safeCount / 2);
    const rightCount = safeCount - leftCount;
    const leftCols = leftCount <= 2 ? 1 : 2;
    const leftRows = Math.ceil(leftCount / leftCols);
    const rightCols = rightCount <= 2 ? 1 : 2;
    const rightRows = Math.max(1, Math.ceil(rightCount / rightCols));
    const leftW = 50 - gapX / 2;
    const rightX = 50 + gapX / 2;
    const rightW = 50 - gapX / 2;
    layouts.push([
      ...grid(leftCount, leftCols, leftRows, 0, 0, leftW, 100),
      ...grid(rightCount, rightCols, rightRows, rightX, 0, rightW, 100),
    ].slice(0, safeCount));
  }

  // 7) Página esquerda editorial + foto grande na direita
  if (safeCount >= 3) {
    const leftCount = safeCount - 1;
    const leftCols = leftCount <= 2 ? 1 : 2;
    const leftRows = Math.ceil(leftCount / leftCols);
    const leftW = 50 - gapX / 2;
    const rightX = 50 + gapX / 2;
    const rightW = 50 - gapX / 2;
    layouts.push([
      ...grid(leftCount, leftCols, leftRows, 0, 0, leftW, 100),
      { x: round(rightX), y: 0, w: round(rightW), h: 100 },
    ].slice(0, safeCount));
  }

  // 8) Foto grande no meio/direita com detalhes ao lado, bom para 4 a 8 fotos
  if (safeCount >= 4) {
    const sideCount = safeCount - 1;
    const sideW = 33;
    const bigX = sideW + gapX;
    const bigW = Math.max(8, 100 - bigX);
    const sideRows = Math.ceil(sideCount / 1);
    layouts.push([
      ...grid(sideCount, 1, sideRows, 0, 0, sideW, 100),
      { x: round(bigX), y: 0, w: round(bigW), h: 100 },
    ].slice(0, safeCount));
  }

  return layouts[((variant % layouts.length) + layouts.length) % layouts.length] || layouts[0];
}

function gridLayout(count, cols, rows, startX = 0, gapX = 0.8, gapY = 0.8, areaW = 100, areaH = 100, startY = 0) {
  if (!count) return [];
  const cellW = (areaW - gapX * (cols - 1)) / cols;
  const cellH = (areaH - gapY * (rows - 1)) / rows;
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      x: round(startX + col * (cellW + gapX)),
      y: round(startY + row * (cellH + gapY)),
      w: round(Math.max(4, cellW)),
      h: round(Math.max(4, cellH)),
    };
  });
}

function round(v) {
  return Math.round(v * 100) / 100;
}

function createFrames(photoIds, variant = 0, format = FORMATS[3], gapMm = 1) {
  const slots = getLayouts(photoIds.length, variant, format, gapMm);
  return slots.map((slot, index) => ({
    id: uid("frame"),
    photoId: photoIds[index],
    ...slot,
    cropScale: 1,
    cropX: 0,
    cropY: 0,
  }));
}


function makeFrameRef(id, spreadIndex) {
  return { kind: "frame", id, spreadIndex };
}

function makeTextRef(scope, id, spreadIndex = 0) {
  return { kind: "text", scope, id, spreadIndex };
}

function sameObjectRef(a, b) {
  if (!a || !b) return false;
  return a.kind === b.kind
    && a.id === b.id
    && (a.scope || null) === (b.scope || null)
    && (a.spreadIndex ?? null) === (b.spreadIndex ?? null);
}

function estimateTextHeight(text) {
  return clamp(round(((text.size || 26) * 1.5) / 4.2), 5, 24);
}

function getObjectBounds(ref, cover, spreads) {
  if (!ref) return null;
  if (ref.kind === "frame") {
    const spread = spreads[ref.spreadIndex];
    const frame = spread?.frames?.find((item) => item.id === ref.id);
    if (!frame) return null;
    return { left: frame.x, top: frame.y, width: frame.w, height: frame.h };
  }

  const texts = ref.scope === "cover" ? cover.texts : spreads[ref.spreadIndex]?.texts;
  const textItem = texts?.find((item) => item.id === ref.id);
  if (!textItem) return null;
  const width = textItem.w || 30;
  const height = estimateTextHeight(textItem);
  return {
    left: round((textItem.x || 50) - width / 2),
    top: round((textItem.y || 50) - height / 2),
    width,
    height,
  };
}

function getStageObjects(active, cover, spreads) {
  if (active.type === "cover") {
    return (cover.texts || []).map((item) => ({
      ref: makeTextRef("cover", item.id, 0),
      bounds: getObjectBounds(makeTextRef("cover", item.id, 0), cover, spreads),
    })).filter((item) => item.bounds);
  }

  const spread = spreads[active.index];
  const frameItems = (spread?.frames || []).map((item) => ({
    ref: makeFrameRef(item.id, active.index),
    bounds: getObjectBounds(makeFrameRef(item.id, active.index), cover, spreads),
  }));
  const textItems = (spread?.texts || []).map((item) => ({
    ref: makeTextRef("spread", item.id, active.index),
    bounds: getObjectBounds(makeTextRef("spread", item.id, active.index), cover, spreads),
  }));

  return [...frameItems, ...textItems].filter((item) => item.bounds);
}

function findBestSnap(value, targets, threshold = 1.1) {
  let best = null;
  for (const target of targets) {
    const diff = Math.abs(value - target);
    if (diff <= threshold && (!best || diff < best.diff)) {
      best = { target, diff };
    }
  }
  return best;
}

function GuideLines({ guides }) {
  if (!guides || (!guides.vertical?.length && !guides.horizontal?.length)) return null;
  return (
    <>
      {(guides.vertical || []).map((value, index) => (
        <div key={`v-${index}-${value}`} className="guide-line vertical" style={{ left: `${value}%` }} />
      ))}
      {(guides.horizontal || []).map((value, index) => (
        <div key={`h-${index}-${value}`} className="guide-line horizontal" style={{ top: `${value}%` }} />
      ))}
    </>
  );
}

function Photo({ src, frame }) {
  if (!src) return <div className="empty-photo">Solte uma foto aqui</div>;
  return (
    <img
      src={src}
      alt=""
      draggable="false"
      style={{ transform: `translate(${frame.cropX || 0}%, ${frame.cropY || 0}%) scale(${frame.cropScale || 1})` }}
    />
  );
}

function Button({ children, onClick, variant = "primary", disabled = false, title }) {
  return (
    <button type="button" className={`btn ${variant}`} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

export default function App() {
  const [formatId, setFormatId] = useState("20x20");
  const [pageCount, setPageCount] = useState(20);
  const [textureId, setTextureId] = useState("champagne");
  const [photos, setPhotos] = useState([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [cover, setCover] = useState({ photoId: null, cropScale: 1, cropX: 0, cropY: 0, texts: [] });
  const [spreads, setSpreads] = useState(() => buildBlankSpreads(20));
  const [active, setActive] = useState({ type: "cover", index: 0 });
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [guides, setGuides] = useState({ vertical: [], horizontal: [] });
  const [showSafety, setShowSafety] = useState(true);
  const [frameGapMm, setFrameGapMm] = useState(1);
  const [modal, setModal] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const fileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);
  const stageRef = useRef(null);

  const format = useMemo(() => FORMATS.find((item) => item.id === formatId) || FORMATS[3], [formatId]);
  const texture = useMemo(() => TEXTURES.find((item) => item.id === textureId) || TEXTURES[0], [textureId]);
  const photoMap = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);
  const currentSpread = active.type === "spread" ? spreads[active.index] : null;
  const selectedFrame = currentSpread?.frames.find((frame) => frame.id === selectedFrameId) || null;
  const usedPhotoIds = useMemo(() => {
    const used = new Set();
    if (cover.photoId) used.add(cover.photoId);
    spreads.forEach((spread) => spread.frames.forEach((frame) => frame.photoId && used.add(frame.photoId)));
    return used;
  }, [cover.photoId, spreads]);

  const spineCm = getSpineCm(pageCount);
  const coverTotalW = format.closedW * 2 + spineCm;
  const coverAspect = coverTotalW / format.closedH;
  const spreadAspect = format.spreadW / format.spreadH;
  const activeAspect = active.type === "cover" ? coverAspect : spreadAspect;


  function clearGuides() {
    setGuides({ vertical: [], horizontal: [] });
  }

  function isSameStageSelection(current, incoming) {
    if (!current || !incoming || current.kind !== incoming.kind && (current.kind === "frame" || incoming.kind === "frame")) {
      if ((current.kind === "frame" || incoming.kind === "frame") && active.type !== "spread") return false;
    }
    if (incoming.kind === "frame") return active.type === "spread" && incoming.spreadIndex === active.index;
    if (incoming.scope === "cover") return active.type === "cover";
    return active.type === "spread" && incoming.spreadIndex === active.index;
  }

  function selectObject(ref, event) {
    if (event?.shiftKey) {
      setSelectedObjects((prev) => {
        const scoped = prev.filter((item) => isSameStageSelection(item, ref));
        const withoutCurrent = scoped.filter((item) => !sameObjectRef(item, ref));
        if (!withoutCurrent.length) return [ref];
        return [...withoutCurrent.slice(-1), ref];
      });
      return;
    }
    setSelectedObjects([ref]);
  }

  function isObjectSelected(ref) {
    return selectedObjects.some((item) => sameObjectRef(item, ref));
  }

  function getSnapTargets(ref) {
    const stageObjects = getStageObjects(active, cover, spreads).filter((item) => !sameObjectRef(item.ref, ref));
    const vertical = [];
    const horizontal = [];
    stageObjects.forEach((item) => {
      vertical.push(item.bounds.left, item.bounds.left + item.bounds.width / 2, item.bounds.left + item.bounds.width);
      horizontal.push(item.bounds.top, item.bounds.top + item.bounds.height / 2, item.bounds.top + item.bounds.height);
    });
    if (active.type === "spread") {
      vertical.push(25, 50, 75);
      horizontal.push(50);
    }
    return { vertical, horizontal };
  }

  function snapMoveBounds(bounds, ref) {
    const targets = getSnapTargets(ref);
    const vCandidates = [
      { value: bounds.left, apply: (target) => ({ ...bounds, left: target }) },
      { value: bounds.left + bounds.width / 2, apply: (target) => ({ ...bounds, left: target - bounds.width / 2 }) },
      { value: bounds.left + bounds.width, apply: (target) => ({ ...bounds, left: target - bounds.width }) },
    ];
    const hCandidates = [
      { value: bounds.top, apply: (target) => ({ ...bounds, top: target }) },
      { value: bounds.top + bounds.height / 2, apply: (target) => ({ ...bounds, top: target - bounds.height / 2 }) },
      { value: bounds.top + bounds.height, apply: (target) => ({ ...bounds, top: target - bounds.height }) },
    ];

    let next = { ...bounds };
    const nextGuides = { vertical: [], horizontal: [] };

    let best = null;
    vCandidates.forEach((candidate) => {
      const found = findBestSnap(candidate.value, targets.vertical);
      if (found && (!best || found.diff < best.diff)) best = { ...found, candidate };
    });
    if (best) {
      next = best.candidate.apply(best.target);
      nextGuides.vertical = [round(best.target)];
    }

    best = null;
    hCandidates.forEach((candidate) => {
      const found = findBestSnap(candidate.value, targets.horizontal);
      if (found && (!best || found.diff < best.diff)) best = { ...found, candidate };
    });
    if (best) {
      next = best.candidate.apply(best.target);
      nextGuides.horizontal = [round(best.target)];
    }

    return { bounds: next, guides: nextGuides };
  }

  function alignSelected(mode) {
    if (selectedObjects.length !== 2) return;
    const movingRef = selectedObjects[0];
    const referenceRef = selectedObjects[1];
    const moving = getObjectBounds(movingRef, cover, spreads);
    const reference = getObjectBounds(referenceRef, cover, spreads);
    if (!moving || !reference) return;

    let nextLeft = moving.left;
    let nextTop = moving.top;

    if (mode === "left") nextLeft = reference.left;
    if (mode === "center") nextLeft = reference.left + reference.width / 2 - moving.width / 2;
    if (mode === "right") nextLeft = reference.left + reference.width - moving.width;

    if (mode === "top") nextTop = reference.top;
    if (mode === "middle") nextTop = reference.top + reference.height / 2 - moving.height / 2;
    if (mode === "bottom") nextTop = reference.top + reference.height - moving.height;

    nextLeft = clamp(nextLeft, 0, 100 - moving.width);
    nextTop = clamp(nextTop, 0, 100 - moving.height);

    if (movingRef.kind === "frame") {
      updateFrame(movingRef.id, { x: round(nextLeft), y: round(nextTop) }, movingRef.spreadIndex);
      setSelectedFrameId(movingRef.id);
    } else {
      updateText(movingRef.id, { x: round(nextLeft + moving.width / 2), y: round(nextTop + moving.height / 2) }, movingRef.scope, movingRef.spreadIndex);
      setSelectedTextId({ scope: movingRef.scope, id: movingRef.id, spreadIndex: movingRef.spreadIndex });
    }

    const vGuides = (mode === "left" || mode === "center" || mode === "right")
      ? [mode === "left" ? reference.left : mode === "center" ? reference.left + reference.width / 2 : reference.left + reference.width]
      : [];
    const hGuides = (mode === "top" || mode === "middle" || mode === "bottom")
      ? [mode === "top" ? reference.top : mode === "middle" ? reference.top + reference.height / 2 : reference.top + reference.height]
      : [];
    setGuides({ vertical: vGuides.map(round), horizontal: hGuides.map(round) });
    setTimeout(() => clearGuides(), 700);
  }

  function handleSelectFrame(id, event) {
    setSelectedFrameId(id);
    selectObject(makeFrameRef(id, active.index), event);
    if (!event?.shiftKey) setSelectedTextId(null);
  }

  function handleSelectText(ref, event) {
    setSelectedTextId(ref);
    selectObject({ ...ref, kind: "text" }, event);
    if (!event?.shiftKey) setSelectedFrameId(null);
  }

  function handlePagesChange(value) {
    const next = Number(value);
    setPageCount(next);
    setSpreads((old) => {
      const needed = next / 2;
      if (old.length === needed) return old;
      if (old.length > needed) return old.slice(0, needed).map((spread, index) => ({ ...spread, name: `Página ${index * 2 + 1}-${index * 2 + 2}` }));
      const extra = Array.from({ length: needed - old.length }, (_, i) => createBlankSpread(old.length + i));
      return [...old, ...extra];
    });
    if (active.type === "spread" && active.index >= next / 2) setActive({ type: "spread", index: 0 });
  }

  async function importFiles(files) {
    const loaded = await loadImageFiles(files);
    if (!loaded.length) return;
    setPhotos((prev) => [...prev, ...loaded]);
    setSelectedPhotoIds(loaded.slice(0, 8).map((p) => p.id));
  }

  async function importCoverFiles(files) {
    const loaded = await loadImageFiles(files);
    if (!loaded.length) return;
    const coverPhoto = loaded[0];
    setPhotos((prev) => [...prev, ...loaded]);
    setSelectedPhotoIds([coverPhoto.id]);
    applyPhotoToCover(coverPhoto.id);
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
  }

  function loadDemo() {
    const demo = makeDemoPhotos();
    setPhotos(demo);
    setSelectedPhotoIds(demo.slice(0, 6).map((p) => p.id));
  }

  function togglePhoto(photoId, event) {
    if (event?.shiftKey && selectedPhotoIds.length) {
      const lastId = selectedPhotoIds[selectedPhotoIds.length - 1];
      const start = photos.findIndex((p) => p.id === lastId);
      const end = photos.findIndex((p) => p.id === photoId);
      if (start >= 0 && end >= 0) {
        const [a, b] = [Math.min(start, end), Math.max(start, end)];
        const range = photos.slice(a, b + 1).map((p) => p.id);
        setSelectedPhotoIds(Array.from(new Set([...selectedPhotoIds, ...range])).slice(0, 20));
        return;
      }
    }
    if (event?.metaKey || event?.ctrlKey || event?.altKey) {
      setSelectedPhotoIds((prev) => prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId].slice(0, 20));
      return;
    }
    setSelectedPhotoIds((prev) => prev.includes(photoId) && prev.length === 1 ? [] : [photoId]);
  }

  function applyPhotoToCover(photoId) {
    if (!photoId) return;
    setCover((prev) => ({ ...prev, photoId, cropScale: 1, cropX: 0, cropY: 0 }));
    setActive({ type: "cover", index: 0 });
    setSelectedFrameId(null);
  }

  function applySelectedToCover() {
    const id = selectedPhotoIds[0];
    if (!id) return alert("Selecione uma foto no rodapé primeiro.");
    applyPhotoToCover(id);
  }

  function handleFrameGapChange(nextGap) {
    setFrameGapMm(nextGap);
    if (active.type !== "spread") return;
    setSpreads((prev) => prev.map((spread, index) => {
      if (index !== active.index || !spread.frames.length) return spread;
      const photoIds = spread.frames.map((frame) => frame.photoId).filter(Boolean);
      return { ...spread, frames: createFrames(photoIds, spread.layoutVariant || 0, format, nextGap) };
    }));
  }

  function autoBuildCurrentSpread() {
    if (active.type !== "spread") {
      alert("Clique em uma página do miolo no rodapé para montar a lâmina.");
      return;
    }
    let ids = selectedPhotoIds.slice(0, 20);
    if (!ids.length) {
      ids = photos.filter((p) => !usedPhotoIds.has(p.id)).slice(0, 4).map((p) => p.id);
    }
    if (!ids.length) return alert("Importe ou selecione fotos primeiro.");
    setSpreads((prev) => prev.map((spread, index) => index === active.index ? { ...spread, frames: createFrames(ids, spread.layoutVariant || 0, format, frameGapMm) } : spread));
  }

  function changeLayout(direction) {
    if (active.type !== "spread") return;
    setSpreads((prev) => prev.map((spread, index) => {
      if (index !== active.index || !spread.frames.length) return spread;
      const nextVariant = (spread.layoutVariant || 0) + direction;
      const photoIds = spread.frames.map((frame) => frame.photoId).filter(Boolean);
      return { ...spread, layoutVariant: nextVariant, frames: createFrames(photoIds, nextVariant, format, frameGapMm) };
    }));
  }

  function insertBlankSpread() {
    setSpreads((prev) => {
      const insertAt = active.type === "spread" ? active.index + 1 : 0;
      const next = [...prev.slice(0, insertAt), createBlankSpread(insertAt), ...prev.slice(insertAt)];
      return next.map((spread, index) => ({ ...spread, name: `Página ${index * 2 + 1}-${index * 2 + 2}` }));
    });
    setPageCount((p) => Math.min(MAX_PAGES, p + 2));
  }

  function duplicateSpread() {
    if (active.type !== "spread") return alert("Escolha uma página do miolo para duplicar.");
    setSpreads((prev) => {
      const original = prev[active.index];
      const copy = {
        ...original,
        id: uid("spread"),
        frames: original.frames.map((frame) => ({ ...frame, id: uid("frame") })),
        texts: original.texts.map((text) => ({ ...text, id: uid("text") })),
      };
      const next = [...prev.slice(0, active.index + 1), copy, ...prev.slice(active.index + 1)];
      return next.map((spread, index) => ({ ...spread, name: `Página ${index * 2 + 1}-${index * 2 + 2}` }));
    });
    setPageCount((p) => Math.min(MAX_PAGES, p + 2));
  }

  function removeSpread() {
    if (active.type !== "spread") return alert("A capa não pode ser removida.");
    if (spreads.length <= MIN_PAGES / 2) return alert("O produto precisa manter pelo menos 20 páginas.");
    setSpreads((prev) => prev.filter((_, index) => index !== active.index).map((spread, index) => ({ ...spread, name: `Página ${index * 2 + 1}-${index * 2 + 2}` })));
    setPageCount((p) => Math.max(MIN_PAGES, p - 2));
    setActive({ type: "spread", index: Math.max(0, active.index - 1) });
  }

  function addText() {
    const text = active.type === "cover"
      ? makeText({ color: "#ffffff", size: 28 })
      : makeText({ color: "#222222", size: 24 });

    if (active.type === "cover") {
      setCover((prev) => ({ ...prev, texts: [...prev.texts, text] }));
      setSelectedTextId({ scope: "cover", id: text.id });
      setSelectedObjects([{ kind: "text", scope: "cover", id: text.id, spreadIndex: 0 }]);
    } else {
      setSpreads((prev) => prev.map((spread, index) => index === active.index ? { ...spread, texts: [...spread.texts, text] } : spread));
      setSelectedTextId({ scope: "spread", spreadIndex: active.index, id: text.id });
      setSelectedObjects([{ kind: "text", scope: "spread", spreadIndex: active.index, id: text.id }]);
    }
    setSelectedFrameId(null);
  }

  function updateText(textId, patch, scope = active.type, spreadIndex = active.index) {
    if (scope === "cover") {
      setCover((prev) => ({ ...prev, texts: prev.texts.map((text) => text.id === textId ? { ...text, ...patch } : text) }));
      return;
    }
    setSpreads((prev) => prev.map((spread, index) => index === spreadIndex ? {
      ...spread,
      texts: spread.texts.map((text) => text.id === textId ? { ...text, ...patch } : text),
    } : spread));
  }

  function updateSelectedText(patch) {
    if (!selectedTextId) return;
    updateText(selectedTextId.id, patch, selectedTextId.scope, selectedTextId.spreadIndex);
  }

  function removeSelectedText() {
    if (!selectedTextId) return;
    if (selectedTextId.scope === "cover") {
      setCover((prev) => ({ ...prev, texts: prev.texts.filter((text) => text.id !== selectedTextId.id) }));
    } else {
      setSpreads((prev) => prev.map((spread, index) => index === selectedTextId.spreadIndex ? {
        ...spread,
        texts: spread.texts.filter((text) => text.id !== selectedTextId.id),
      } : spread));
    }
    setSelectedTextId(null);
    setSelectedObjects([]);
    clearGuides();
  }

  function startTextMove(event, text, scope, spreadIndex) {
    event.preventDefault();
    event.stopPropagation();
    const area = event.currentTarget.closest(scope === "cover" ? ".cover-front" : ".spread-layout");
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const startLeft = event.clientX;
    const startTop = event.clientY;
    const startX = text.x || 50;
    const startY = text.y || 50;
    const ref = makeTextRef(scope, text.id, spreadIndex);
    const move = (moveEvent) => {
      const dx = ((moveEvent.clientX - startLeft) / rect.width) * 100;
      const dy = ((moveEvent.clientY - startTop) / rect.height) * 100;
      const w = text.w || 30;
      const h = estimateTextHeight(text);
      let left = clamp(startX + dx - w / 2, 0, 100 - w);
      let top = clamp(startY + dy - h / 2, 0, 100 - h);
      const snapped = snapMoveBounds({ left, top, width: w, height: h }, ref);
      left = snapped.bounds.left;
      top = snapped.bounds.top;
      setGuides(snapped.guides);
      updateText(text.id, { x: round(left + w / 2), y: round(top + h / 2) }, scope, spreadIndex);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      clearGuides();
    };
    const refInfo = { scope, id: text.id, spreadIndex };
    setSelectedTextId(refInfo);
    selectObject({ ...refInfo, kind: "text" }, { shiftKey: event.shiftKey });
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startTextResize(event, text, scope, spreadIndex, handle) {
    event.preventDefault();
    event.stopPropagation();
    const area = event.currentTarget.closest(scope === "cover" ? ".cover-front" : ".spread-layout");
    if (!area) return;

    const rect = area.getBoundingClientRect();
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const startW = text.w || 30;
    const startX = text.x || 50;
    const startSize = text.size || 26;

    const move = (moveEvent) => {
      const dxPx = moveEvent.clientX - startClientX;
      const dyPx = moveEvent.clientY - startClientY;
      const dxPct = (dxPx / rect.width) * 100;
      let nextW = startW;
      let nextX = startX;
      let nextSize = startSize;

      if (handle.includes("e")) {
        nextW = startW + dxPct;
        nextX = startX + (nextW - startW) / 2;
      }
      if (handle.includes("w")) {
        nextW = startW - dxPct;
        nextX = startX - (nextW - startW) / 2;
      }

      nextW = clamp(nextW, 8, 92);
      nextX = clamp(nextX, nextW / 2, 100 - nextW / 2);

      if (handle.includes("s") || handle.includes("n")) {
        const verticalDelta = handle.includes("s") ? dyPx : -dyPx;
        nextSize = startSize + verticalDelta / 2.5;
      }

      if ((handle === "se" || handle === "ne" || handle === "sw" || handle === "nw")) {
        const horizontalSignal = handle.includes("e") ? dxPx : -dxPx;
        const verticalSignal = handle.includes("s") ? dyPx : -dyPx;
        nextSize = startSize + Math.max(horizontalSignal, verticalSignal) / 3.2;
      }

      nextSize = clamp(Math.round(nextSize), 8, 140);
      updateText(text.id, { w: round(nextW), x: round(nextX), size: nextSize }, scope, spreadIndex);
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      clearGuides();
    };

    setSelectedTextId(scope === "cover" ? { scope: "cover", id: text.id } : { scope: "spread", spreadIndex, id: text.id });
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function clearActive() {
    if (active.type === "cover") {
      setCover((prev) => ({ ...prev, photoId: null, cropScale: 1, cropX: 0, cropY: 0, texts: [] }));
    } else {
      setSpreads((prev) => prev.map((spread, index) => index === active.index ? { ...spread, frames: [], texts: [] } : spread));
      setSelectedFrameId(null);
    }
    setSelectedTextId(null);
    setSelectedObjects([]);
    clearGuides();
  }

  function updateCoverCrop(patch) {
    setCover((prev) => ({ ...prev, ...patch }));
  }

  function updateFrameCrop(patch) {
    if (!selectedFrame) return;
    setSpreads((prev) => prev.map((spread, sIndex) => {
      if (sIndex !== active.index) return spread;
      return { ...spread, frames: spread.frames.map((frame) => frame.id === selectedFrame.id ? { ...frame, ...patch } : frame) };
    }));
  }

  function updateFrame(frameId, patch, spreadIndex = active.index) {
    setSpreads((prev) => prev.map((spread, sIndex) => {
      if (sIndex !== spreadIndex) return spread;
      return { ...spread, frames: spread.frames.map((frame) => frame.id === frameId ? { ...frame, ...patch } : frame) };
    }));
  }

  function startFrameMove(event, frame) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const area = event.currentTarget.closest(".spread-layout");
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const startX = frame.x;
    const startY = frame.y;
    const ref = makeFrameRef(frame.id, active.index);

    const move = (moveEvent) => {
      const dx = ((moveEvent.clientX - startClientX) / rect.width) * 100;
      const dy = ((moveEvent.clientY - startClientY) / rect.height) * 100;
      let left = clamp(startX + dx, 0, 100 - frame.w);
      let top = clamp(startY + dy, 0, 100 - frame.h);
      const snapped = snapMoveBounds({ left, top, width: frame.w, height: frame.h }, ref);
      left = snapped.bounds.left;
      top = snapped.bounds.top;
      setGuides(snapped.guides);
      updateFrame(frame.id, { x: round(left), y: round(top) });
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      clearGuides();
    };

    handleSelectFrame(frame.id, { shiftKey: event.shiftKey });
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startFrameResize(event, frame, handle = "se") {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const area = event.currentTarget.closest(".spread-layout");
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const start = { left: frame.x, top: frame.y, width: frame.w, height: frame.h };
    const ref = makeFrameRef(frame.id, active.index);

    const move = (moveEvent) => {
      const dx = ((moveEvent.clientX - startClientX) / rect.width) * 100;
      const dy = ((moveEvent.clientY - startClientY) / rect.height) * 100;

      let left = start.left;
      let top = start.top;
      let width = start.width;
      let height = start.height;

      if (handle.includes("e")) width = start.width + dx;
      if (handle.includes("s")) height = start.height + dy;
      if (handle.includes("w")) {
        left = start.left + dx;
        width = start.width - dx;
      }
      if (handle.includes("n")) {
        top = start.top + dy;
        height = start.height - dy;
      }

      const minW = 5;
      const minH = 5;
      if (width < minW) {
        if (handle.includes("w")) left = start.left + start.width - minW;
        width = minW;
      }
      if (height < minH) {
        if (handle.includes("n")) top = start.top + start.height - minH;
        height = minH;
      }

      left = clamp(left, 0, 100 - width);
      top = clamp(top, 0, 100 - height);
      width = clamp(width, minW, 100 - left);
      height = clamp(height, minH, 100 - top);

      const targets = getSnapTargets(ref);
      const nextGuides = { vertical: [], horizontal: [] };

      const leftSnap = handle.includes("w") ? findBestSnap(left, targets.vertical) : null;
      const rightSnap = handle.includes("e") ? findBestSnap(left + width, targets.vertical) : null;
      const topSnap = handle.includes("n") ? findBestSnap(top, targets.horizontal) : null;
      const bottomSnap = handle.includes("s") ? findBestSnap(top + height, targets.horizontal) : null;

      if (leftSnap) {
        const oldRight = left + width;
        left = leftSnap.target;
        width = oldRight - left;
        nextGuides.vertical = [round(leftSnap.target)];
      } else if (rightSnap) {
        width = rightSnap.target - left;
        nextGuides.vertical = [round(rightSnap.target)];
      }

      if (topSnap) {
        const oldBottom = top + height;
        top = topSnap.target;
        height = oldBottom - top;
        nextGuides.horizontal = [round(topSnap.target)];
      } else if (bottomSnap) {
        height = bottomSnap.target - top;
        nextGuides.horizontal = [round(bottomSnap.target)];
      }

      left = clamp(left, 0, 100 - width);
      top = clamp(top, 0, 100 - height);
      width = clamp(width, minW, 100 - left);
      height = clamp(height, minH, 100 - top);

      setGuides(nextGuides);
      updateFrame(frame.id, { x: round(left), y: round(top), w: round(width), h: round(height) });
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      clearGuides();
    };

    handleSelectFrame(frame.id, { shiftKey: event.shiftKey });
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function applyPhotoToFrame(spreadIndex, frameId, photoId) {
    setSpreads((prev) => prev.map((spread, sIndex) => {
      if (sIndex !== spreadIndex) return spread;
      return {
        ...spread,
        frames: spread.frames.map((frame) => frame.id === frameId ? { ...frame, photoId, cropScale: 1, cropX: 0, cropY: 0 } : frame),
      };
    }));
    setSelectedFrameId(frameId);
    setSelectedTextId(null);
  }

  function handleDrop(event) {
    event.preventDefault();
    const photoId = event.dataTransfer.getData("photo/id");
    if (!photoId) return;
    if (active.type === "cover") {
      applyPhotoToCover(photoId);
    } else {
      const ids = Array.from(new Set([photoId, ...selectedPhotoIds])).slice(0, 20);
      setSpreads((prev) => prev.map((spread, index) => index === active.index ? { ...spread, frames: createFrames(ids, spread.layoutVariant || 0, format, frameGapMm) } : spread));
    }
  }

  function startPhotoPan(event, target, frameId = null, frameSnapshot = null) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = target === "cover"
      ? { cropX: cover.cropX || 0, cropY: cover.cropY || 0 }
      : { cropX: frameSnapshot?.cropX || 0, cropY: frameSnapshot?.cropY || 0 };

    const move = (moveEvent) => {
      const dx = ((moveEvent.clientX - startX) / rect.width) * 100;
      const dy = ((moveEvent.clientY - startY) / rect.height) * 100;
      const patch = {
        cropX: round(clamp(initial.cropX + dx, -80, 80)),
        cropY: round(clamp(initial.cropY + dy, -80, 80)),
      };
      if (target === "cover") {
        updateCoverCrop(patch);
      } else {
        setSpreads((prev) => prev.map((spread, sIndex) => {
          if (sIndex !== active.index) return spread;
          return { ...spread, frames: spread.frames.map((frame) => frame.id === frameId ? { ...frame, ...patch } : frame) };
        }));
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function zoomPhoto(event, target, frame = null) {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    if (target === "cover") {
      updateCoverCrop({ cropScale: round(clamp((cover.cropScale || 1) + delta, 1, 3)) });
      return;
    }
    if (!frame) return;
    setSpreads((prev) => prev.map((spread, sIndex) => {
      if (sIndex !== active.index) return spread;
      return { ...spread, frames: spread.frames.map((item) => item.id === frame.id ? { ...item, cropScale: round(clamp((item.cropScale || 1) + delta, 1, 3)) } : item) };
    }));
  }

  function saveProject() {
    const payload = getProjectPayload();
    localStorage.setItem("picmimos-diagramador-v5-6", JSON.stringify(payload));
    setSavedAt(new Date());
    setModal({ type: "saved" });
  }

  function getProjectPayload() {
    return {
      version: "V5.6",
      product: "Meia Capa Fotográfica",
      format: format.label,
      pages: pageCount,
      laminas: pageCount / 2,
      spineCm,
      texture: texture.label,
      safetyMarginCm: SAFETY_MARGIN_CM,
      frameGapMm,
      production: {
        output: "JPG limpo",
        dpi: 300,
        paper: "Fuji com UV Fosco",
        cover: "Somente frente fotográfica; verso/lombada revestimento",
      },
      cover,
      spreads,
      photosCount: photos.length,
      savedAt: new Date().toISOString(),
    };
  }

  async function makePreview() {
    try {
      const node = stageRef.current;
      const dataUrl = node ? await htmlToImage.toJpeg(node, { quality: 0.92, backgroundColor: "#f6f2eb" }) : null;
      setModal({ type: "preview", dataUrl });
    } catch (error) {
      console.error(error);
      setModal({ type: "preview", dataUrl: null });
    }
  }

  function finalizeProject() {
    const emptySpreads = spreads.map((spread, index) => ({ spread, index })).filter(({ spread }) => !spread.frames.length);
    const problems = [];
    if (!cover.photoId) problems.push("A capa frontal ainda não tem foto.");
    if (emptySpreads.length) problems.push(`${emptySpreads.length} lâmina(s) do miolo estão vazias.`);
    setModal({ type: "finalize", problems, emptySpreads });
  }

  function simulatedExport() {
    const files = [
      "00-FICHA-PRODUCAO.html",
      "00-DADOS-PEDIDO.json",
      "00-PREVIEW.jpg",
      "01-CAPA-FRENTE.jpg",
      ...spreads.map((_, index) => `${String(index + 2).padStart(2, "0")}-LAMINA-${String(index + 1).padStart(2, "0")}.jpg`),
    ];
    setModal({ type: "export", files });
  }

  const activeLabel = active.type === "cover" ? "Capa" : currentSpread?.name;
  const currentPhotoForPanel = active.type === "cover" ? photoMap.get(cover.photoId) : selectedFrame?.photoId ? photoMap.get(selectedFrame.photoId) : null;
  const selectedText = selectedTextId?.scope === "cover" && active.type === "cover"
    ? cover.texts.find((text) => text.id === selectedTextId.id)
    : selectedTextId?.scope === "spread" && active.type === "spread" && selectedTextId.spreadIndex === active.index
      ? currentSpread?.texts.find((text) => text.id === selectedTextId.id)
      : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo">P</div>
          <div>
            <strong>Diagramador Picmimos V5.6</strong>
            <span>Meia Capa Fotográfica · foto cheia + enquadramento livre + Smart Guides</span>
          </div>
        </div>
        <div className="top-actions">
          <Button variant="secondary" onClick={saveProject}>Salvar projeto</Button>
          <Button variant="secondary" onClick={makePreview}>Pré-visualizar</Button>
          <Button variant="warning" onClick={finalizeProject}>Finalizar</Button>
        </div>
      </header>

      <aside className="left-panel">
        <section className="panel-card">
          <h3>Produto</h3>
          <label>Formato fechado</label>
          <select value={formatId} onChange={(e) => setFormatId(e.target.value)}>
            {FORMATS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>

          <label>Quantidade de páginas</label>
          <select value={pageCount} onChange={(e) => handlePagesChange(e.target.value)}>
            {Array.from({ length: (MAX_PAGES - MIN_PAGES) / 2 + 1 }, (_, i) => MIN_PAGES + i * 2).map((p) => <option key={p} value={p}>{p} páginas ({p / 2} lâminas)</option>)}
          </select>

          <label>Textura do verso/lombada</label>
          <select value={textureId} onChange={(e) => setTextureId(e.target.value)}>
            {TEXTURES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>

          <div className="spec-grid">
            <div><span>Miolo</span><strong>{format.spreadW} x {format.spreadH} cm</strong></div>
            <div><span>Lombada</span><strong>{(spineCm * 10).toFixed(0)} mm</strong></div>
            <div><span>Refilo</span><strong>3 mm total</strong></div>
            <div><span>Saída</span><strong>JPG limpo</strong></div>
          </div>
        </section>

        <section className="panel-card">
          <h3>Fotos</h3>
          <div className="button-grid">
            <Button onClick={() => fileInputRef.current?.click()}>Importar fotos</Button>
            <Button variant="secondary" onClick={loadDemo}>Fotos demo</Button>
          </div>
          <Button variant="ghost" onClick={() => { setPhotos([]); setSelectedPhotoIds([]); }}>Limpar biblioteca</Button>
          <p className="hint">Clique para selecionar. Shift seleciona intervalo nas fotos e também permite selecionar 2 elementos na página para alinhar. Arraste para capa ou lâmina.</p>
        </section>
      </aside>

      <main className="workspace">
        <div className="workspace-toolbar">
          <div>
            <strong>{activeLabel}</strong>
            <span>{active.type === "cover" ? "Frente editável + verso/lombada texturizados" : `${format.spreadW} x ${format.spreadH} cm · Fuji UV Fosco`}</span>
          </div>
          <div className="toolbar-actions">
            {active.type === "spread" && <Button variant="secondary" onClick={autoBuildCurrentSpread}>Montar automático</Button>}
            {active.type === "spread" && <Button variant="secondary" onClick={() => changeLayout(-1)}>Layout ‹</Button>}
            {active.type === "spread" && <Button variant="secondary" onClick={() => changeLayout(1)}>Layout ›</Button>}
            {active.type === "spread" && (
              <label className="gap-control" title="Distância entre os quadros do layout automático">
                <span>Espaço</span>
                <select value={frameGapMm} onChange={(event) => handleFrameGapChange(Number(event.target.value))}>
                  {[0, 1, 2, 3, 4, 5].map((mm) => <option key={mm} value={mm}>{mm} mm</option>)}
                </select>
              </label>
            )}
            <Button variant={showSafety ? "active" : "secondary"} onClick={() => setShowSafety(!showSafety)}>Corte 3 mm (visual)</Button>
            <Button variant="secondary" onClick={addText}>Texto</Button>
            <Button variant="danger" onClick={clearActive}>Limpar</Button>
          </div>
        </div>

        <div className="stage-holder" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
          <div ref={stageRef} className={`stage ${active.type}`} style={{ aspectRatio: activeAspect }}>
            {active.type === "cover" ? (
              <CoverStage
                cover={cover}
                photoMap={photoMap}
                texture={texture}
                format={format}
                spineCm={spineCm}
                showSafety={showSafety}
                selectedPhotoIds={selectedPhotoIds}
                onPickCoverPhoto={() => coverFileInputRef.current?.click()}
                onUseSelected={(photoId) => photoId ? applyPhotoToCover(photoId) : applySelectedToCover()}
                onPhotoPan={startPhotoPan}
                onPhotoWheel={zoomPhoto}
                selectedTextId={selectedTextId}
                selectedObjects={selectedObjects}
                guides={guides}
                onSelectText={handleSelectText}
                onMoveText={startTextMove}
                onResizeText={startTextResize}
                onChangeText={updateText}
              />
            ) : (
              <SpreadStage
                spread={currentSpread}
                spreadIndex={active.index}
                photoMap={photoMap}
                showSafety={showSafety}
                onSelectFrame={handleSelectFrame}
                selectedFrameId={selectedFrameId}
                selectedObjects={selectedObjects}
                guides={guides}
                onDropPhoto={applyPhotoToFrame}
                onPhotoPan={startPhotoPan}
                onPhotoWheel={zoomPhoto}
                onMoveFrame={startFrameMove}
                onResizeFrame={startFrameResize}
                selectedTextId={selectedTextId}
                onSelectText={handleSelectText}
                onMoveText={startTextMove}
                onResizeText={startTextResize}
                onChangeText={updateText}
              />
            )}
          </div>
        </div>
      </main>

      <aside className="right-panel">
        <section className="panel-card">
          <h3>Ajustes</h3>
          <SelectionHelp count={selectedObjects.length} />
          {selectedObjects.length === 2 && <AlignmentControls objects={selectedObjects} onAlign={alignSelected} />}
          {selectedText ? (
            <TextControls text={selectedText} onChange={updateSelectedText} onRemove={removeSelectedText} />
          ) : active.type === "cover" ? (
            <CropControls label="Foto da capa" photo={currentPhotoForPanel} target={cover} onChange={updateCoverCrop} emptyText="Clique no ícone de upload dentro da capa ou arraste uma foto para a frente." />
          ) : selectedFrame ? (
            <CropControls label="Foto selecionada" photo={currentPhotoForPanel} target={selectedFrame} onChange={updateFrameCrop} />
          ) : (
            <div className="empty-state">Clique em uma foto da lâmina para ajustar zoom/enquadramento, ou arraste outra foto para trocar. Ao selecionar 2 elementos com Shift, aparecem os botões de alinhamento.</div>
          )}
        </section>

        <section className="panel-card">
          <h3>Páginas</h3>
          <div className="button-grid">
            <Button variant="secondary" onClick={insertBlankSpread}>Inserir</Button>
            <Button variant="secondary" onClick={duplicateSpread}>Duplicar</Button>
            <Button variant="danger" onClick={removeSpread}>Remover</Button>
            <Button variant="secondary" onClick={simulatedExport}>Exportação</Button>
          </div>
          <p className="hint">A exportação real em JPG 300 DPI será feita depois que o fluxo visual estiver aprovado.</p>
        </section>

        <section className="panel-card">
          <h3>Status</h3>
          <ul className="status-list">
            <li><span>Capa com foto</span><strong>{cover.photoId ? "Sim" : "Não"}</strong></li>
            <li><span>Lâminas vazias</span><strong>{spreads.filter((s) => !s.frames.length).length}</strong></li>
            <li><span>Fotos usadas</span><strong>{usedPhotoIds.size}/{photos.length}</strong></li>
            <li><span>Salvo</span><strong>{savedAt ? savedAt.toLocaleTimeString("pt-BR") : "Ainda não"}</strong></li>
          </ul>
        </section>
      </aside>

      <section className="filmstrip">
        <div className="spread-strip">
          <button className={`thumb-nav ${active.type === "cover" ? "on" : ""}`} onClick={() => { setActive({ type: "cover", index: 0 }); setSelectedFrameId(null); setSelectedTextId(null); setSelectedObjects([]); clearGuides(); }}>
            <span>Capa</span>
            <small>{cover.photoId ? "ok" : "vazia"}</small>
          </button>
          {spreads.map((spread, index) => (
            <button key={spread.id} className={`thumb-nav ${active.type === "spread" && active.index === index ? "on" : ""}`} onClick={() => { setActive({ type: "spread", index }); setSelectedFrameId(null); setSelectedTextId(null); setSelectedObjects([]); clearGuides(); }}>
              <span>{spread.name}</span>
              <small>{spread.frames.length ? `${spread.frames.length} foto(s)` : "em branco"}</small>
            </button>
          ))}
        </div>
        <div className="photo-strip">
          {photos.length ? photos.map((photo, index) => (
            <button
              key={photo.id}
              className={`photo-tile ${selectedPhotoIds.includes(photo.id) ? "selected" : ""} ${usedPhotoIds.has(photo.id) ? "used" : ""}`}
              onClick={(event) => togglePhoto(photo.id, event)}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("photo/id", photo.id)}
              title={photo.name}
            >
              <img src={photo.src} alt="" />
              <span className="photo-index">{index + 1}</span>
              {selectedPhotoIds.includes(photo.id) && <b>{selectedPhotoIds.indexOf(photo.id) + 1}</b>}
              {usedPhotoIds.has(photo.id) && <small>usada</small>}
            </button>
          )) : <div className="filmstrip-empty">Importe fotos ou clique em “Fotos demo”.</div>}
        </div>
      </section>

      <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => importFiles(e.target.files)} />
      <input ref={coverFileInputRef} type="file" accept="image/*" hidden onChange={(e) => importCoverFiles(e.target.files)} />
      {modal && <Modal modal={modal} onClose={() => setModal(null)} onExport={simulatedExport} />}
    </div>
  );
}

function CoverStage({
  cover,
  photoMap,
  texture,
  format,
  spineCm,
  showSafety,
  selectedPhotoIds,
  onPickCoverPhoto,
  onUseSelected,
  onPhotoPan,
  onPhotoWheel,
  selectedTextId,
  selectedObjects,
  guides,
  onSelectText,
  onMoveText,
  onResizeText,
  onChangeText,
}) {
  const photo = cover.photoId ? photoMap.get(cover.photoId) : null;
  const selectedPhotoId = selectedPhotoIds[0];
  const frontWidth = (format.closedW / (format.closedW * 2 + spineCm)) * 100;
  const spineWidth = (spineCm / (format.closedW * 2 + spineCm)) * 100;
  const backWidth = 100 - frontWidth - spineWidth;

  return (
    <div className="cover-layout">
      <div className="cover-back" style={{ width: `${backWidth}%`, background: texture.css }}>VERSO</div>
      <div className="cover-spine" style={{ width: `${spineWidth}%`, background: texture.css }}>LOMBADA</div>
      <div
        className={`cover-front ${!cover.photoId ? "needs-photo" : ""}`}
        style={{ width: `${frontWidth}%` }}
        onDrop={(event) => {
          event.preventDefault();
          const photoId = event.dataTransfer.getData("photo/id");
          if (photoId) onUseSelected(photoId);
        }}
        onDragOver={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (photo) onPhotoPan(event, "cover");
        }}
        onWheel={(event) => photo && onPhotoWheel(event, "cover")}
      >
        {photo ? <Photo src={photo.src} frame={cover} /> : (
          <div className="cover-upload-zone">
            <button type="button" className="cover-upload-button" onClick={onPickCoverPhoto}>
              <span>＋</span>
              <strong>Inserir foto da capa</strong>
              <small>Obrigatório para finalizar</small>
            </button>
            {selectedPhotoId && <button type="button" className="cover-selected-button" onClick={() => onUseSelected(selectedPhotoId)}>Usar foto selecionada</button>}
          </div>
        )}
        {photo && <button type="button" className="cover-change-button" onClick={onPickCoverPhoto}>Trocar foto da capa</button>}
        <GuideLines guides={guides} />
        {showSafety && <div className="safety cover-safe">Margem de segurança 0,3 cm</div>}
        {cover.texts.map((text) => {
          const ref = makeTextRef("cover", text.id, 0);
          return (
            <TextBox
              key={text.id}
              text={text}
              scope="cover"
              selected={selectedTextId?.scope === "cover" && selectedTextId?.id === text.id}
              highlighted={selectedObjects.some((item) => sameObjectRef(item, { ...ref }))}
              onSelect={(event) => onSelectText({ scope: "cover", id: text.id, spreadIndex: 0 }, event)}
              onMove={(event) => onMoveText(event, text, "cover", 0)}
              onResize={(event, handle) => onResizeText(event, text, "cover", 0, handle)}
              onChange={(value) => onChangeText(text.id, { value }, "cover", 0)}
            />
          );
        })}
      </div>
    </div>
  );
}

function SpreadStage({
  spread,
  spreadIndex,
  photoMap,
  showSafety,
  onSelectFrame,
  selectedFrameId,
  selectedObjects,
  guides,
  onDropPhoto,
  onPhotoPan,
  onPhotoWheel,
  onMoveFrame,
  onResizeFrame,
  selectedTextId,
  onSelectText,
  onMoveText,
  onResizeText,
  onChangeText,
}) {
  const resizeHandles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

  return (
    <div className="spread-layout">
      <div className="page-label left">Página esquerda</div>
      <div className="page-label right">Página direita</div>
      <div className="center-fold" />
      {showSafety && <><div className="page-center-guide left-center" /><div className="page-center-guide right-center" /><div className="page-middle-guide" /></>}
      <GuideLines guides={guides} />
      {showSafety && <div className="safety spread-safe">Área segura 0,3 cm</div>}
      {spread?.frames?.length ? spread.frames.map((frame, index) => {
        const photo = frame.photoId ? photoMap.get(frame.photoId) : null;
        const ref = makeFrameRef(frame.id, spreadIndex);
        const selected = selectedFrameId === frame.id;
        const highlighted = selectedObjects.some((item) => sameObjectRef(item, ref));
        return (
          <div
            key={frame.id}
            className={`frame ${selected ? "selected" : ""} ${highlighted ? "highlighted" : ""}`}
            style={{ left: `${frame.x}%`, top: `${frame.y}%`, width: `${frame.w}%`, height: `${frame.h}%` }}
            role="button"
            tabIndex={0}
            onClick={(event) => onSelectFrame(frame.id, event)}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const photoId = event.dataTransfer.getData("photo/id");
              if (photoId) onDropPhoto(spreadIndex, frame.id, photoId);
            }}
            onDragOver={(event) => event.preventDefault()}
            onPointerDown={(event) => {
              if (event.target.closest(".frame-transform-handle") || event.target.closest(".frame-move-label")) return;
              onSelectFrame(frame.id, event);
            }}
            onWheel={(event) => onPhotoWheel(event, "frame", frame)}
            title="Arraste a foto para enquadrar. Use Mover para mover o quadro e as bolinhas para redimensionar."
          >
            <div
              className="frame-crop"
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelectFrame(frame.id, event);
                if (!event.shiftKey && photo) onPhotoPan(event, "frame", frame.id, frame);
              }}
            >
              <Photo src={photo?.src} frame={frame} />
            </div>
            <span>{index + 1}</span>
            {selected && (
              <>
                {resizeHandles.map((handle) => (
                  <button
                    key={handle}
                    type="button"
                    className={`frame-transform-handle handle-${handle}`}
                    onPointerDown={(event) => onResizeFrame(event, frame, handle)}
                    title="Redimensionar quadro"
                    aria-label="Redimensionar quadro"
                  />
                ))}
                <button type="button" className="frame-move-label" onPointerDown={(event) => onMoveFrame(event, frame)} title="Mover quadro">Mover</button>
              </>
            )}
          </div>
        );
      }) : <div className="blank-spread-message">Lâmina em branco. Selecione fotos e clique em “Montar automático”.</div>}
      {spread?.texts?.map((text) => {
        const ref = makeTextRef("spread", text.id, spreadIndex);
        return (
          <TextBox
            key={text.id}
            text={text}
            scope="spread"
            selected={selectedTextId?.scope === "spread" && selectedTextId?.spreadIndex === spreadIndex && selectedTextId?.id === text.id}
            highlighted={selectedObjects.some((item) => sameObjectRef(item, ref))}
            onSelect={(event) => onSelectText({ scope: "spread", spreadIndex, id: text.id }, event)}
            onMove={(event) => onMoveText(event, text, "spread", spreadIndex)}
            onResize={(event, handle) => onResizeText(event, text, "spread", spreadIndex, handle)}
            onChange={(value) => onChangeText(text.id, { value }, "spread", spreadIndex)}
          />
        );
      })}
    </div>
  );
}

function TextBox({ text, scope, selected, highlighted, onSelect, onMove, onResize, onChange }) {
  const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

  return (
    <div
      className={`text-box ${selected ? "selected" : ""} ${highlighted ? "highlighted" : ""}`}
      style={{
        left: `${text.x}%`,
        top: `${text.y}%`,
        width: `${text.w || 30}%`,
        fontSize: `${text.size}px`,
        color: text.color,
        fontFamily: text.fontFamily,
        fontWeight: text.weight,
        textAlign: text.align,
        pointerEvents: "auto",
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect(event);
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(event);
      }}
      data-scope={scope}
    >
      {selected && (
        <button
          type="button"
          className="text-drag-layer"
          onPointerDown={onMove}
          title="Arraste para mover o texto"
        />
      )}

      <span
        className="text-content"
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onInput={(event) => onChange(event.currentTarget.textContent || "")}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {text.value}
      </span>

      {selected && handles.map((handle) => (
        <button
          key={handle}
          type="button"
          className={`text-resize-handle handle-${handle}`}
          onPointerDown={(event) => onResize(event, handle)}
          title="Redimensionar texto"
          aria-label="Redimensionar texto"
        />
      ))}
    </div>
  );
}

function SelectionHelp({ count }) {
  return (
    <div className="selection-help">
      <strong>Seleção para alinhar</strong>
      <span>{count}/2 selecionado(s)</span>
      <p>Para alinhar: clique em um texto/foto, segure Shift e clique em outro. Com 2 selecionados, use os botões abaixo.</p>
    </div>
  );
}

function AlignmentControls({ objects, onAlign }) {
  const moving = objects[0];
  const reference = objects[1];
  const describe = (item) => item.kind === "frame" ? "foto/quadro" : "texto";

  return (
    <div className="alignment-box">
      <strong>Alinhar elementos</strong>
      <p className="hint">Último clique = referência. Agora: <b>{describe(moving)}</b> será alinhado em relação a <b>{describe(reference)}</b>.</p>
      <div className="align-grid">
        <Button variant="secondary" onClick={() => onAlign("left")}>Esquerda</Button>
        <Button variant="secondary" onClick={() => onAlign("center")}>Centro H</Button>
        <Button variant="secondary" onClick={() => onAlign("right")}>Direita</Button>
        <Button variant="secondary" onClick={() => onAlign("top")}>Topo</Button>
        <Button variant="secondary" onClick={() => onAlign("middle")}>Meio V</Button>
        <Button variant="secondary" onClick={() => onAlign("bottom")}>Base</Button>
      </div>
    </div>
  );
}

function TextControls({ text, onChange, onRemove }) {
  return (
    <div className="text-controls">
      <label>Texto</label>
      <input
        type="text"
        value={text.value}
        onChange={(event) => onChange({ value: event.target.value })}
        placeholder="Digite o texto"
      />

      <label>Fonte</label>
      <select value={text.fontFamily} onChange={(event) => onChange({ fontFamily: event.target.value })}>
        {TEXT_FONTS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
      </select>

      <label>Tamanho</label>
      <input type="range" min="10" max="90" step="1" value={text.size} onChange={(event) => onChange({ size: Number(event.target.value) })} />
      <small>{text.size}px</small>

      <label>Cor</label>
      <div className="color-row" style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0 10px" }}>
        {TEXT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange({ color })}
            title={color}
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              border: text.color === color ? "3px solid #111" : "1px solid #ccc",
              background: color,
              cursor: "pointer",
            }}
          />
        ))}
        <input type="color" value={text.color} onChange={(event) => onChange({ color: event.target.value })} style={{ width: 42, height: 30, padding: 0 }} />
      </div>

      <div className="button-grid">
        <Button variant={text.weight >= 800 ? "active" : "secondary"} onClick={() => onChange({ weight: text.weight >= 800 ? 400 : 900 })}>Negrito</Button>
        <Button variant="secondary" onClick={() => onChange({ align: text.align === "center" ? "left" : text.align === "left" ? "right" : "center" })}>Alinhar</Button>
      </div>
      <Button variant="danger" onClick={onRemove}>Apagar texto</Button>
      <p className="hint">Clique no texto para escrever. Arraste o texto para mover e use as bolinhas amarelas para redimensionar, como no SmartAlbums.</p>
    </div>
  );
}

function CropControls({ label, photo, target, onChange, emptyText = "Selecione uma foto no rodapé e aplique aqui." }) {
  if (!photo) return <div className="empty-state">{emptyText}</div>;
  return (
    <div className="crop-controls">
      <div className="crop-preview">
        <img src={photo.src} alt="" />
      </div>
      <strong>{label}</strong>
      <p className="hint">A foto preenche o quadro como no SmartAlbums. Arraste a própria foto no canvas para enquadrar; use zoom e Horizontal/Vertical para ajuste fino.</p>
      <label>Zoom</label>
      <input type="range" min="1" max="3" step="0.01" value={target.cropScale || 1} onChange={(e) => onChange({ cropScale: Number(e.target.value) })} />
      <label>Horizontal</label>
      <input type="range" min="-80" max="80" step="1" value={target.cropX || 0} onChange={(e) => onChange({ cropX: Number(e.target.value) })} />
      <label>Vertical</label>
      <input type="range" min="-80" max="80" step="1" value={target.cropY || 0} onChange={(e) => onChange({ cropY: Number(e.target.value) })} />
      <Button variant="secondary" onClick={() => onChange({ cropScale: 1, cropX: 0, cropY: 0 })}>Centralizar</Button>
    </div>
  );
}

function Modal({ modal, onClose, onExport }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        {modal.type === "saved" && (
          <>
            <h2>Projeto salvo</h2>
            <p>O projeto foi salvo no navegador para teste da V5.</p>
          </>
        )}
        {modal.type === "preview" && (
          <>
            <h2>Pré-visualização</h2>
            {modal.dataUrl ? <img className="preview-img" src={modal.dataUrl} alt="Prévia" /> : <div className="empty-state">Prévia simulada indisponível neste navegador.</div>}
            <p>Esta é uma prévia visual. A prévia 3D interativa entra em uma fase posterior.</p>
          </>
        )}
        {modal.type === "finalize" && (
          <>
            <h2>Conferência antes de finalizar</h2>
            {modal.problems.length ? (
              <div className="warning-box">
                {modal.problems.map((p) => <p key={p}>⚠ {p}</p>)}
              </div>
            ) : <p className="success-box">Projeto sem alertas principais.</p>}
            <label className="confirm-check"><input type="checkbox" /> Confirmo que revisei meu projeto e autorizo produção conforme exibido.</label>
            <div className="modal-actions"><Button variant="secondary" onClick={onClose}>Voltar e revisar</Button><Button variant="warning" onClick={onExport}>Ver exportação simulada</Button></div>
          </>
        )}
        {modal.type === "export" && (
          <>
            <h2>Exportação simulada</h2>
            <p>Na próxima fase, estes arquivos serão JPGs reais em 300 DPI, prontos para a pasta de produção.</p>
            <div className="file-list">{modal.files.map((file) => <code key={file}>{file}</code>)}</div>
          </>
        )}
        {modal.type !== "finalize" && <div className="modal-actions"><Button onClick={onClose}>Fechar</Button></div>}
      </div>
    </div>
  );
}
