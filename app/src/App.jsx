import React, { useEffect, useMemo, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";

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

function buildFullMosaicLayout(count, gapX = 0.8, gapY = 0.8, variant = 0) {
  const safeCount = clamp(count, 1, 20);
  const patterns = {
    7: [[3, 4], [4, 3], [2, 2, 3]],
    8: [[4, 4], [3, 2, 3], [2, 3, 3]],
    9: [[3, 3, 3], [2, 3, 4], [4, 3, 2]],
    10: [[3, 3, 4], [4, 3, 3], [2, 4, 4]],
    11: [[4, 4, 3], [3, 4, 4], [4, 3, 4]],
    12: [[4, 4, 4], [3, 3, 3, 3], [2, 3, 3, 4]],
    13: [[3, 3, 3, 4], [4, 3, 3, 3], [3, 4, 3, 3]],
    14: [[4, 4, 3, 3], [3, 4, 4, 3], [4, 3, 3, 4]],
    15: [[3, 4, 4, 4], [4, 4, 4, 3], [4, 3, 4, 4]],
    16: [[4, 4, 4, 4], [3, 3, 3, 3, 4], [4, 3, 3, 3, 3]],
    17: [[4, 4, 3, 3, 3], [3, 4, 4, 3, 3], [3, 3, 4, 4, 3]],
    18: [[4, 4, 4, 3, 3], [3, 4, 4, 4, 3], [3, 3, 4, 4, 4]],
    19: [[4, 4, 4, 4, 3], [3, 4, 4, 4, 4], [4, 3, 4, 4, 4]],
    20: [[4, 4, 4, 4, 4], [3, 4, 3, 3, 3, 4], [4, 3, 3, 3, 4, 3]],
  };

  const candidates = patterns[safeCount] || [[Math.ceil(safeCount / 2), Math.floor(safeCount / 2)]];
  const rowCounts = candidates[((variant % candidates.length) + candidates.length) % candidates.length] || candidates[0];
  const weightFor = (items) => ({ 1: 1.65, 2: 1.35, 3: 1.08, 4: 0.86 }[items] || 0.86);
  const rowWeights = rowCounts.map(weightFor);
  const totalGapY = gapY * Math.max(0, rowCounts.length - 1);
  const usableH = 100 - totalGapY;
  const totalWeight = rowWeights.reduce((sum, value) => sum + value, 0);

  let y = 0;
  return rowCounts.flatMap((itemsInRow, rowIndex) => {
    const rowH = round((usableH * rowWeights[rowIndex]) / totalWeight);
    const rowY = rowIndex === rowCounts.length - 1 ? round(100 - rowH) : round(y);
    const cellW = (100 - gapX * (itemsInRow - 1)) / itemsInRow;
    const boxes = Array.from({ length: itemsInRow }, (_, colIndex) => {
      const x = round(colIndex * (cellW + gapX));
      const width = colIndex === itemsInRow - 1 ? round(100 - x) : round(cellW);
      const height = rowIndex === rowCounts.length - 1 ? round(100 - rowY) : round(rowH);
      return { x, y: rowY, w: width, h: height };
    });
    y += rowH + gapY;
    return boxes;
  }).slice(0, safeCount);
}

function getLayouts(count, variant = 0, format = FORMATS[3], gapMm = 1) {
  const safeCount = clamp(count, 1, 20);
  const gapX = gapPct(format, gapMm, "x");
  const gapY = gapPct(format, gapMm, "y");
  const layouts = [];
  const box = (x, y, w, h) => ({ x: round(x), y: round(y), w: round(w), h: round(h) });
  const grid = (n, cols, rows, x = 0, y = 0, w = 100, h = 100) => gridLayout(n, cols, rows, x, gapX, gapY, w, h, y);

  const leftBigW = 32;
  const topBigH = 30;
  const remW = 100 - leftBigW - gapX;
  const remH = 100 - topBigH - gapY;
  const rightX = leftBigW + gapX;
  const bottomY = topBigH + gapY;
  const twoColW = (remW - gapX) / 2;
  const twoRowH = (remH - gapY) / 2;

  if (safeCount === 1) {
    layouts.push([box(0, 0, 100, 100)]);
  }

  if (safeCount === 2) {
    layouts.push([
      box(0, 0, (100 - gapX) / 2, 100),
      box((100 - gapX) / 2 + gapX, 0, (100 - gapX) / 2, 100),
    ]);
    layouts.push([
      box(0, 0, 100, (100 - gapY) / 2),
      box(0, (100 - gapY) / 2 + gapY, 100, (100 - gapY) / 2),
    ]);
    layouts.push([
      box(0, 0, 64, 100),
      box(64 + gapX, 0, 36 - gapX, 100),
    ]);
  }

  if (safeCount === 3) {
    layouts.push([
      box(0, 0, leftBigW, 100),
      box(rightX, 0, remW, (100 - gapY) / 2),
      box(rightX, (100 - gapY) / 2 + gapY, remW, (100 - gapY) / 2),
    ]);
    layouts.push([
      box(0, 0, 100, topBigH),
      box(0, bottomY, (100 - gapX) / 2, remH),
      box((100 - gapX) / 2 + gapX, bottomY, (100 - gapX) / 2, remH),
    ]);
    layouts.push(grid(3, 3, 1));
  }

  if (safeCount === 4) {
    layouts.push(grid(4, 2, 2));
    layouts.push([
      box(0, 0, leftBigW, 100),
      box(rightX, 0, remW, topBigH),
      box(rightX, bottomY, twoColW, remH),
      box(rightX + twoColW + gapX, bottomY, twoColW, remH),
    ]);
    layouts.push([
      box(0, 0, 100, topBigH),
      box(0, bottomY, (100 - 2 * gapX) / 3, remH),
      box((100 - 2 * gapX) / 3 + gapX, bottomY, (100 - 2 * gapX) / 3, remH),
      box(((100 - 2 * gapX) / 3) * 2 + gapX * 2, bottomY, (100 - 2 * gapX) / 3, remH),
    ]);
  }

  if (safeCount === 5) {
    layouts.push([
      box(0, 0, (100 - gapX) / 2, topBigH),
      box((100 - gapX) / 2 + gapX, 0, (100 - gapX) / 2, topBigH),
      box(0, bottomY, (100 - 2 * gapX) / 3, remH),
      box((100 - 2 * gapX) / 3 + gapX, bottomY, (100 - 2 * gapX) / 3, remH),
      box(((100 - 2 * gapX) / 3) * 2 + gapX * 2, bottomY, (100 - 2 * gapX) / 3, remH),
    ]);
    layouts.push([
      box(0, 0, leftBigW, 100),
      ...grid(4, 2, 2, rightX, 0, remW, 100),
    ].slice(0, 5));
    layouts.push([
      box(0, 0, 100, 24),
      ...grid(4, 2, 2, 0, 24 + gapY, 100, 76 - gapY),
    ].slice(0, 5));
  }

  if (safeCount === 6) {
    layouts.push(grid(6, 3, 2));
    layouts.push([
      box(0, 0, leftBigW, 100),
      box(rightX, 0, remW, topBigH),
      ...grid(4, 2, 2, rightX, bottomY, remW, remH),
    ].slice(0, 6));
    layouts.push([
      box(0, 0, 100, topBigH),
      box(0, bottomY, leftBigW, remH),
      ...grid(4, 2, 2, rightX, bottomY, remW, remH),
    ].slice(0, 6));
  }

  if (safeCount >= 7) {
    layouts.push(buildFullMosaicLayout(safeCount, gapX, gapY, 0));
    layouts.push(buildFullMosaicLayout(safeCount, gapX, gapY, 1));
    layouts.push(buildFullMosaicLayout(safeCount, gapX, gapY, 2));
    return layouts[((variant % layouts.length) + layouts.length) % layouts.length] || layouts[0];
  }

  if (safeCount === 7) {
    layouts.push([
      box(0, 0, 100, 24),
      ...grid(6, 3, 2, 0, 24 + gapY, 100, 76 - gapY),
    ].slice(0, 7));
    layouts.push([
      box(0, 0, leftBigW, 100),
      ...grid(6, 2, 3, rightX, 0, remW, 100),
    ].slice(0, 7));
    layouts.push([
      box(0, 0, 100, topBigH),
      ...grid(6, 3, 2, 0, bottomY, 100, remH),
    ].slice(0, 7));
  }

  if (safeCount === 8) {
    layouts.push(grid(8, 4, 2));
    layouts.push([
      box(0, 0, leftBigW, 100),
      ...grid(7, 3, 3, rightX, 0, remW, 100),
    ].slice(0, 8));
    layouts.push([
      box(0, 0, 100, 22),
      ...grid(7, 4, 2, 0, 22 + gapY, 100, 78 - gapY),
    ].slice(0, 8));
  }

  if (!layouts.length) {
    const gridCols = safeCount <= 2 ? safeCount : Math.ceil(Math.sqrt(safeCount * 2));
    const gridRows = Math.ceil(safeCount / gridCols);
    layouts.push(grid(safeCount, gridCols, gridRows));
    if (safeCount > 1) {
      const rest = safeCount - 1;
      layouts.push([
        box(0, 0, 58, 100),
        ...grid(rest, rest <= 3 ? 1 : 2, Math.ceil(rest / (rest <= 3 ? 1 : 2)), 58 + gapX, 0, 42 - gapX, 100),
      ].slice(0, safeCount));
    }
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
  const posX = clamp(50 + (frame.cropX || 0) * 0.5, 0, 100);
  const posY = clamp(50 + (frame.cropY || 0) * 0.5, 0, 100);
  return (
    <img
      src={src}
      alt=""
      draggable="false"
      style={{
        objectPosition: `${posX}% ${posY}%`,
        transform: `scale(${frame.cropScale || 1})`,
      }}
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

  function normalizePhotoIds(ids) {
    return Array.from(new Set((ids || []).filter(Boolean))).slice(0, 20);
  }

  function rebuildSpreadFrames(spread, photoIds, variant = spread.layoutVariant || 0) {
    const ids = normalizePhotoIds(photoIds);
    return {
      ...spread,
      layoutVariant: variant,
      frames: ids.length ? createFrames(ids, variant, format, frameGapMm) : [],
    };
  }

  function addPhotosToSpread(spreadIndex, incomingPhotoIds) {
    const idsToAdd = normalizePhotoIds(incomingPhotoIds);
    if (!idsToAdd.length) return;
    setSpreads((prev) => prev.map((spread, sIndex) => {
      if (sIndex !== spreadIndex) return spread;
      const currentIds = spread.frames.map((frame) => frame.photoId).filter(Boolean);
      return rebuildSpreadFrames(spread, [...currentIds, ...idsToAdd]);
    }));
    setActive({ type: "spread", index: spreadIndex });
    setSelectedFrameId(null);
    setSelectedTextId(null);
    setSelectedObjects([]);
    clearGuides();
  }

  function removeFrameAndReflow(spreadIndex, frameId) {
    if (spreadIndex == null || !frameId) return;
    setSpreads((prev) => prev.map((spread, sIndex) => {
      if (sIndex !== spreadIndex) return spread;
      const remainingIds = spread.frames
        .filter((frame) => frame.id !== frameId)
        .map((frame) => frame.photoId)
        .filter(Boolean);
      return rebuildSpreadFrames(spread, remainingIds);
    }));
    setSelectedFrameId(null);
    setSelectedObjects((prev) => prev.filter((item) => !(item.kind === "frame" && item.id === frameId && item.spreadIndex === spreadIndex)));
    clearGuides();
  }

  function getDraggedPhotoIds(event) {
    const batch = event.dataTransfer.getData("photos/ids");
    if (batch) {
      try {
        const parsed = JSON.parse(batch);
        return normalizePhotoIds(Array.isArray(parsed) ? parsed : []);
      } catch {
        return [];
      }
    }
    const single = event.dataTransfer.getData("photo/id");
    return single ? [single] : [];
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

  function swapFramePhotos(spreadIndex, sourceFrameId, targetFrameId) {
    if (!sourceFrameId || !targetFrameId || sourceFrameId === targetFrameId) return;
    setSpreads((prev) => prev.map((spread, sIndex) => {
      if (sIndex !== spreadIndex) return spread;
      const source = spread.frames.find((frame) => frame.id === sourceFrameId);
      const target = spread.frames.find((frame) => frame.id === targetFrameId);
      if (!source || !target) return spread;
      return {
        ...spread,
        frames: spread.frames.map((frame) => {
          if (frame.id === sourceFrameId) {
            return {
              ...frame,
              photoId: target.photoId || null,
              cropScale: target.cropScale || 1,
              cropX: target.cropX || 0,
              cropY: target.cropY || 0,
            };
          }
          if (frame.id === targetFrameId) {
            return {
              ...frame,
              photoId: source.photoId || null,
              cropScale: source.cropScale || 1,
              cropX: source.cropX || 0,
              cropY: source.cropY || 0,
            };
          }
          return frame;
        }),
      };
    }));
    setSelectedFrameId(targetFrameId);
    setSelectedTextId(null);
  }

  function handleFramePhotoDrop(spreadIndex, frameId, photoIds, sourceFrameId = null) {
    if (sourceFrameId) {
      swapFramePhotos(spreadIndex, sourceFrameId, frameId);
      return;
    }
    const ids = Array.isArray(photoIds) ? photoIds : [photoIds];
    addPhotosToSpread(spreadIndex, ids);
  }

  function handleDrop(event) {
    event.preventDefault();
    const photoIds = getDraggedPhotoIds(event);
    if (!photoIds.length) return;
    if (active.type === "cover") {
      applyPhotoToCover(photoIds[0]);
    } else {
      addPhotosToSpread(active.index, photoIds);
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
    localStorage.setItem("picmimos-diagramador-v5-7", JSON.stringify(payload));
    setSavedAt(new Date());
    setModal({ type: "saved" });
  }

  function getProjectPayload() {
    return {
      version: "V5.7",
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

  function buildPreview3DPages() {
    const pages = [];
    pages.push({ id: "preview-cover", type: "cover", title: "Capa", cover, texture, format, spineCm });
    spreads.forEach((spread, index) => {
      pages.push({
        id: `preview-spread-${spread.id || index}`,
        type: "spread",
        title: spread.name || `Página ${index * 2 + 1}-${index * 2 + 2}`,
        spread,
        format,
        spineCm,
        texture,
      });
    });
    return pages;
  }

  function makePreview() {
    setModal({ type: "preview-3d", pages: buildPreview3DPages() });
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

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target;
      const isTyping = target?.closest?.("input, textarea, select, [contenteditable='true']");
      if (isTyping || modal) return;

      if (active.type === "spread" && selectedFrameId) {
        event.preventDefault();
        removeFrameAndReflow(active.index, selectedFrameId);
        return;
      }

      if (selectedTextId) {
        event.preventDefault();
        removeSelectedText();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, selectedFrameId, selectedTextId, modal, spreads, format, frameGapMm]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo">P</div>
          <div>
            <strong>Diagramador Picmimos V5.7</strong>
            <span>Meia Capa Fotográfica · enquadramento SmartAlbums + troca de fotos + layouts livres</span>
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
                onDropPhoto={handleFramePhotoDrop}
                onSwapFramePhoto={swapFramePhotos}
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
            <div className="empty-state">Clique em uma foto da lâmina para ajustar zoom/enquadramento. Para trocar fotos entre quadros, selecione o quadro e arraste o botão “Trocar foto” para outro quadro. Ao selecionar 2 elementos com Shift, aparecem os botões de alinhamento.</div>
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
              onDragStart={(event) => {
                const ids = selectedPhotoIds.includes(photo.id) ? selectedPhotoIds : [photo.id];
                event.dataTransfer.setData("photo/id", photo.id);
                event.dataTransfer.setData("photos/ids", JSON.stringify(ids));
                event.dataTransfer.effectAllowed = "copy";
              }}
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
      {modal && <Modal modal={modal} onClose={() => setModal(null)} onExport={simulatedExport} photoMap={photoMap} />}
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
  onSwapFramePhoto,
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
              const batch = event.dataTransfer.getData("photos/ids");
              const photoId = event.dataTransfer.getData("photo/id");
              const sourceFrameId = event.dataTransfer.getData("frame-photo/id");
              if (sourceFrameId) {
                onSwapFramePhoto(spreadIndex, sourceFrameId, frame.id);
                return;
              }
              if (batch) {
                try {
                  const ids = JSON.parse(batch);
                  if (Array.isArray(ids) && ids.length) onDropPhoto(spreadIndex, frame.id, ids);
                  return;
                } catch {
                  // se houver erro, cai para a foto única abaixo
                }
              }
              if (photoId) onDropPhoto(spreadIndex, frame.id, photoId);
            }}
            onDragOver={(event) => event.preventDefault()}
            onPointerDown={(event) => {
              if (event.target.closest(".frame-transform-handle") || event.target.closest(".frame-move-label") || event.target.closest(".frame-swap-handle")) return;
              onSelectFrame(frame.id, event);
            }}
            onWheel={(event) => onPhotoWheel(event, "frame", frame)}
            title="Arraste a foto para enquadrar. Use Mover para mover o quadro e as bolinhas para redimensionar."
          >
            {selected && photo && (
              <div className="frame-guide" aria-hidden="true">
                <img src={photo.src} alt="" draggable="false" />
              </div>
            )}
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
                <button
                  type="button"
                  className="frame-swap-handle"
                  draggable
                  onPointerDown={(event) => event.stopPropagation()}
                  onDragStart={(event) => {
                    event.stopPropagation();
                    event.dataTransfer.setData("frame-photo/id", frame.id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  title="Arraste este botão até outro quadro para trocar as fotos"
                >Trocar foto</button>
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

function Preview3D({ pages, photoMap }) {
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState(null);
  const total = pages.length;
  const page = pages[index] || null;
  const canPrev = index > 0 && !turn;
  const canNext = index < total - 1 && !turn;

  useEffect(() => {
    setIndex(0);
    setTurn(null);
  }, [total]);

  function go(direction) {
    if (turn) return;
    const nextIndex = clamp(index + direction, 0, total - 1);
    if (nextIndex === index) return;
    setTurn({ from: index, to: nextIndex, direction, id: Date.now() });
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, total, turn]);

  const displayedPage = turn ? (pages[turn.from] || page) : page;
  const targetPage = turn ? (pages[turn.to] || null) : null;
  const labelIndex = turn ? turn.to : index;

  return (
    <div className="preview3d-shell preview3d-v3">
      <div className="preview3d-canvas-wrap">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.45, 4.75], fov: 35 }} gl={{ alpha: true, antialias: true }}>
          <color attach="background" args={["#edf1f5"]} />
          <ambientLight intensity={0.62} />
          <hemisphereLight args={["#fff7ea", "#8aa0b8", 1.1]} />
          <directionalLight position={[3.6, 5.4, 3.4]} intensity={3.1} castShadow shadow-mapSize={[2048, 2048]} />
          <directionalLight position={[-3.2, 2.1, 2.7]} intensity={0.72} />
          <pointLight position={[0.2, 2.2, 2.8]} intensity={0.58} />
          <Preview3DEnvironment />
          <RigidAlbum3D
            page={displayedPage}
            targetPage={targetPage}
            turn={turn}
            photoMap={photoMap}
            onTurnDone={() => {
              if (!turn) return;
              setIndex(turn.to);
              setTurn(null);
            }}
          />
          <ContactShadows position={[0, -1.11, 0]} opacity={0.56} scale={6.2} blur={2.3} far={3.5} />
          <OrbitControls enablePan={false} minDistance={3.0} maxDistance={6.2} minPolarAngle={0.72} maxPolarAngle={1.55} />
        </Canvas>
        <button type="button" className="preview3d-arrow left" onClick={() => go(-1)} disabled={!canPrev} aria-label="Folhear para trás">‹</button>
        <button type="button" className="preview3d-arrow right" onClick={() => go(1)} disabled={!canNext} aria-label="Folhear para frente">›</button>
        <div className="preview3d-floating-actions">
          <span>{pages[labelIndex]?.title || "Prévia"}</span>
          <strong>{labelIndex + 1} / {Math.max(total, 1)}</strong>
        </div>
      </div>
      <div className="preview3d-dots">
        {pages.map((item, pageIndex) => (
          <button
            type="button"
            key={item.id || pageIndex}
            className={`preview3d-dot ${pageIndex === labelIndex ? "on" : ""}`}
            onClick={() => {
              if (turn || pageIndex === index) return;
              setTurn({ from: index, to: pageIndex, direction: pageIndex > index ? 1 : -1, id: Date.now() });
            }}
            aria-label={`Ir para ${item.title || `prévia ${pageIndex + 1}`}`}
          />
        ))}
      </div>
    </div>
  );
}

function Preview3DEnvironment() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.12, 0]}>
        <circleGeometry args={[4.6, 128]} />
        <meshStandardMaterial color="#f4efe7" roughness={0.34} metalness={0.04} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.115, 0]}>
        <ringGeometry args={[2.1, 4.6, 128]} />
        <meshStandardMaterial color="#ffffff" roughness={0.26} metalness={0.03} transparent opacity={0.18} />
      </mesh>
      <mesh position={[0, 0.72, -2.95]} receiveShadow>
        <planeGeometry args={[8.5, 3.45]} />
        <meshStandardMaterial color="#eef3f7" roughness={0.72} transparent opacity={0.78} />
      </mesh>
      <mesh position={[-2.8, 0.78, -2.86]} rotation={[0, 0.18, 0]}>
        <planeGeometry args={[1.55, 2.55]} />
        <meshStandardMaterial color="#fff6dd" roughness={0.82} transparent opacity={0.30} />
      </mesh>
      <mesh position={[2.75, 0.82, -2.82]} rotation={[0, -0.18, 0]}>
        <planeGeometry args={[1.75, 2.7]} />
        <meshStandardMaterial color="#dcecff" roughness={0.84} transparent opacity={0.28} />
      </mesh>
    </group>
  );
}

function getTextureColor(texture) {
  const id = texture?.id || "champagne";
  if (id === "preto") return "#171615";
  if (id === "marrom") return "#6d4328";
  if (id === "cinza") return "#777b80";
  if (id === "branco") return "#f2f0ec";
  return "#c9b99b";
}

function getPreviewBookSize(page) {
  const format = page?.format || FORMATS[3];
  const coverH = 1.62;
  const coverW = clamp(coverH * (format.closedW / format.closedH), 1.1, 2.45);
  const spreadW = clamp(coverH * (format.spreadW / format.spreadH), 2.25, 4.6);
  const spreadH = coverH;
  const spineCm = page?.spineCm || getSpineCm(MIN_PAGES);
  const spineW = clamp((spineCm / Math.max(format.closedW, 1)) * coverW, 0.08, 0.36);
  const pageThickness = clamp(spineW / Math.max(8, MIN_PAGES / 2), 0.012, 0.026);
  const coverThickness = clamp(pageThickness * 2.25, 0.04, 0.075);
  const blockThickness = clamp(spineW * 0.78, 0.07, 0.26);
  return { coverW, coverH, spreadW, spreadH, spineW, pageThickness, coverThickness, blockThickness };
}

function useImageTexture(src) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!src) {
      setTexture(null);
      return undefined;
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (cancelled) return;
      const tex = new THREE.Texture(image);
      tex.needsUpdate = true;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      setTexture(tex);
    };
    image.onerror = () => {
      if (!cancelled) setTexture(null);
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return texture;
}

function PhotoPlane({ src, x, y, w, h, z = 0.018, cropX = 0, cropY = 0, cropScale = 1 }) {
  const texture = useImageTexture(src);

  useEffect(() => {
    if (!texture?.image) return;
    const imageAspect = texture.image.width / Math.max(texture.image.height, 1);
    const planeAspect = w / Math.max(h, 0.001);
    let repeatX = 1;
    let repeatY = 1;
    if (imageAspect > planeAspect) repeatX = planeAspect / imageAspect;
    else repeatY = imageAspect / planeAspect;
    repeatX = clamp(repeatX / Math.max(cropScale, 1), 0.05, 1);
    repeatY = clamp(repeatY / Math.max(cropScale, 1), 0.05, 1);
    const maxX = Math.max(0, 1 - repeatX);
    const maxY = Math.max(0, 1 - repeatY);
    const offsetX = clamp((1 - repeatX) / 2 + (cropX || 0) / 160 * maxX, 0, maxX);
    const offsetY = clamp((1 - repeatY) / 2 - (cropY || 0) / 160 * maxY, 0, maxY);
    texture.repeat.set(repeatX, repeatY);
    texture.offset.set(offsetX, offsetY);
    texture.needsUpdate = true;
  }, [texture, w, h, cropX, cropY, cropScale]);

  return (
    <mesh position={[x, y, z]} castShadow={false} receiveShadow={false}>
      <planeGeometry args={[w, h]} />
      {texture ? (
        <meshStandardMaterial map={texture} roughness={0.48} metalness={0.0} side={THREE.FrontSide} toneMapped={false} />
      ) : (
        <meshStandardMaterial color="#d9d4ca" roughness={0.7} side={THREE.FrontSide} />
      )}
    </mesh>
  );
}

function RigidAlbum3D({ page, targetPage, turn, photoMap, onTurnDone }) {
  const groupRef = useRef(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.012;
  });

  if (!page) return null;
  const basePage = targetPage || page;

  return (
    <group ref={groupRef} position={[0, -0.08, 0]} rotation={[0.02, -0.18, 0]}>
      {page.type === "cover" && !turn ? (
        <ClosedRigidAlbum3D page={page} photoMap={photoMap} />
      ) : (
        <OpenRigidAlbum3D page={basePage?.type === "spread" ? basePage : page} photoMap={photoMap} />
      )}
      {turn && page.type === "spread" && (
        <TurningRigidSpread page={page} photoMap={photoMap} direction={turn.direction} onDone={onTurnDone} />
      )}
      {turn && page.type === "cover" && targetPage?.type === "spread" && (
        <CoverOpeningBoard page={page} photoMap={photoMap} onDone={onTurnDone} />
      )}
    </group>
  );
}

function ClosedRigidAlbum3D({ page, photoMap }) {
  const { coverW, coverH, spineW, coverThickness, blockThickness } = getPreviewBookSize(page);
  const coverColor = getTextureColor(page.texture);
  const photo = page.cover?.photoId ? photoMap.get(page.cover.photoId) : null;
  const frontW = coverW * 0.9;
  const frontH = coverH * 0.88;

  return (
    <group rotation={[0.02, 0.18, -0.01]}>
      <mesh castShadow receiveShadow position={[0, 0, -blockThickness * 0.48]}>
        <boxGeometry args={[coverW + spineW, coverH, blockThickness]} />
        <meshStandardMaterial color="#f7f2e8" roughness={0.82} />
      </mesh>
      <mesh castShadow receiveShadow position={[-coverW / 2, 0, 0.012]}>
        <boxGeometry args={[spineW, coverH * 1.03, coverThickness * 1.55]} />
        <meshStandardMaterial color={coverColor} roughness={0.88} />
      </mesh>
      <mesh castShadow receiveShadow position={[spineW / 2, 0, 0.035]}>
        <boxGeometry args={[coverW, coverH, coverThickness]} />
        <meshStandardMaterial color={coverColor} roughness={0.82} />
      </mesh>
      <mesh position={[spineW / 2, 0, 0.075]} castShadow>
        <planeGeometry args={[frontW, frontH]} />
        <meshStandardMaterial color="#f2eadb" roughness={0.62} />
      </mesh>
      {photo ? (
        <PhotoPlane src={photo.src} x={spineW / 2} y={0} w={frontW * 0.92} h={frontH * 0.92} z={0.083} cropX={page.cover?.cropX} cropY={page.cover?.cropY} cropScale={page.cover?.cropScale} />
      ) : null}
    </group>
  );
}

function OpenRigidAlbum3D({ page, photoMap }) {
  const { spreadW, spreadH, spineW, pageThickness, blockThickness } = getPreviewBookSize(page);
  return (
    <group rotation={[-0.78, 0.02, 0]} position={[0, -0.26, 0.12]}>
      <mesh castShadow receiveShadow position={[-0.08, 0, -0.11]}>
        <boxGeometry args={[spreadW * 0.98, spreadH * 1.02, blockThickness]} />
        <meshStandardMaterial color="#ece6da" roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, -0.035]}>
        <boxGeometry args={[Math.max(spineW, 0.08), spreadH * 1.04, blockThickness * 1.12]} />
        <meshStandardMaterial color="#c7bbab" roughness={0.94} />
      </mesh>
      <RigidSpreadBoard page={page} photoMap={photoMap} width={spreadW} height={spreadH} thickness={pageThickness} z={0.025} />
    </group>
  );
}

function RigidSpreadBoard({ page, photoMap, width, height, thickness, z = 0 }) {
  const spread = page?.spread;
  return (
    <group position={[0, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[width, height, thickness]} />
        <meshStandardMaterial color="#fffdf8" roughness={0.57} metalness={0.012} />
      </mesh>
      <mesh position={[-width / 4, 0, thickness / 2 + 0.003]}>
        <planeGeometry args={[width / 2 - 0.018, height - 0.018]} />
        <meshStandardMaterial color="#fffaf2" roughness={0.54} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[width / 4, 0, thickness / 2 + 0.003]}>
        <planeGeometry args={[width / 2 - 0.018, height - 0.018]} />
        <meshStandardMaterial color="#fffaf2" roughness={0.54} side={THREE.FrontSide} />
      </mesh>
      {(spread?.frames || []).map((frame) => {
        const photo = frame.photoId ? photoMap.get(frame.photoId) : null;
        const fw = (frame.w / 100) * width;
        const fh = (frame.h / 100) * height;
        const fx = -width / 2 + ((frame.x + frame.w / 2) / 100) * width;
        const fy = height / 2 - ((frame.y + frame.h / 2) / 100) * height;
        return (
          <PhotoPlane
            key={frame.id}
            src={photo?.src}
            x={fx}
            y={fy}
            w={fw}
            h={fh}
            z={thickness / 2 + 0.009}
            cropX={frame.cropX}
            cropY={frame.cropY}
            cropScale={frame.cropScale}
          />
        );
      })}
      <mesh position={[0, 0, thickness / 2 + 0.014]}>
        <boxGeometry args={[0.012, height * 1.01, 0.006]} />
        <meshStandardMaterial color="#d5cfc3" roughness={0.85} />
      </mesh>
    </group>
  );
}

function TurningRigidSpread({ page, photoMap, direction = 1, onDone }) {
  const { spreadW, spreadH, pageThickness } = getPreviewBookSize(page);
  const pivotRef = useRef(null);
  const progressRef = useRef(0);
  const doneRef = useRef(false);
  const hingeX = direction > 0 ? -spreadW / 2 : spreadW / 2;
  const innerX = direction > 0 ? spreadW / 2 : -spreadW / 2;

  useEffect(() => {
    progressRef.current = 0;
    doneRef.current = false;
  }, [page?.id, direction]);

  useFrame((_, delta) => {
    if (!pivotRef.current || doneRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta * 1.05);
    const t = progressRef.current;
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    pivotRef.current.rotation.y = direction > 0 ? -Math.PI * eased : Math.PI * eased;
    pivotRef.current.position.z = 0.09 + Math.sin(eased * Math.PI) * 0.18;
    if (progressRef.current >= 1) {
      doneRef.current = true;
      setTimeout(() => onDone?.(), 0);
    }
  });

  return (
    <group rotation={[-0.78, 0.02, 0]} position={[hingeX, -0.26, 0.19]} ref={pivotRef}>
      <group position={[innerX, 0, 0]}>
        <RigidSpreadBoard page={page} photoMap={photoMap} width={spreadW} height={spreadH} thickness={pageThickness * 1.18} z={0} />
      </group>
    </group>
  );
}

function CoverOpeningBoard({ page, photoMap, onDone }) {
  const { coverW, coverH, spineW, coverThickness } = getPreviewBookSize(page);
  const pivotRef = useRef(null);
  const progressRef = useRef(0);
  const doneRef = useRef(false);
  const coverColor = getTextureColor(page.texture);
  const photo = page.cover?.photoId ? photoMap.get(page.cover.photoId) : null;

  useFrame((_, delta) => {
    if (!pivotRef.current || doneRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta * 1.05);
    const t = progressRef.current;
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    pivotRef.current.rotation.y = -Math.PI * 0.82 * eased;
    pivotRef.current.position.z = 0.12 + Math.sin(eased * Math.PI) * 0.15;
    if (progressRef.current >= 1) {
      doneRef.current = true;
      setTimeout(() => onDone?.(), 0);
    }
  });

  return (
    <group rotation={[-0.78, 0.02, 0]} position={[-coverW / 2, -0.26, 0.23]} ref={pivotRef}>
      <group position={[coverW / 2, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[coverW + spineW * 0.25, coverH, coverThickness]} />
          <meshStandardMaterial color={coverColor} roughness={0.82} />
        </mesh>
        {photo && <PhotoPlane src={photo.src} x={spineW * 0.12} y={0} w={coverW * 0.82} h={coverH * 0.82} z={coverThickness / 2 + 0.01} cropX={page.cover?.cropX} cropY={page.cover?.cropY} cropScale={page.cover?.cropScale} />}
      </group>
    </group>
  );
}

function Modal({ modal, onClose, onExport, photoMap }) {
  return (
    <div className="modal-backdrop">
      <div className={`modal-card ${modal.type === "preview-3d" ? "preview-3d-card" : ""}`}>
        {modal.type === "saved" && (
          <>
            <h2>Projeto salvo</h2>
            <p>O projeto foi salvo no navegador para teste da V5.</p>
          </>
        )}
        {modal.type === "preview-3d" && (
          <>
            <h2>Pré-visualização 3D</h2>
            <Preview3D pages={modal.pages || []} photoMap={photoMap} />
            <p>Use as setas na tela ou as teclas ← e → para folhear. As lâminas viram como placas rígidas de álbum 800g. Use o mouse para girar, aproximar e afastar.</p>
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
