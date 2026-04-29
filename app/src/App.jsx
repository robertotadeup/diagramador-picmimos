import React, { useEffect, useMemo, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, PresentationControls, RoundedBox } from "@react-three/drei";
import {
  COVER_MODELS,
  DEFAULT_COVER_MODEL_ID,
  DEFAULT_FORMAT_ID,
  DEFAULT_TEXTURE_ID,
  FORMATS,
  INTERIOR,
  PAGE_OPTIONS,
  SAFETY_MARGIN_CM,
  TEXTURES,
  findCoverModel,
  findFormat,
  findTexture,
  getCoverTemplateSpec,
  getPreview3DConfig,
  getSpineCm,
  makeCoverTemplateSvg,
  makePageCountOptions,
} from "./config/productConfigs";

const MIN_PAGES = PAGE_OPTIONS.minPages;
const MAX_PAGES = PAGE_OPTIONS.maxPages;

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

function getLayouts(count, variant = 0, format = findFormat(DEFAULT_FORMAT_ID), gapMm = 1) {
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

function createFrames(photoIds, variant = 0, format = findFormat(DEFAULT_FORMAT_ID), gapMm = 1) {
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
  const [coverModelId, setCoverModelId] = useState(DEFAULT_COVER_MODEL_ID);
  const [formatId, setFormatId] = useState(DEFAULT_FORMAT_ID);
  const [pageCount, setPageCount] = useState(PAGE_OPTIONS.minPages);
  const [textureId, setTextureId] = useState(DEFAULT_TEXTURE_ID);
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

  const coverModel = useMemo(() => findCoverModel(coverModelId), [coverModelId]);
  const format = useMemo(() => findFormat(formatId), [formatId]);
  const texture = useMemo(() => findTexture(textureId), [textureId]);
  const pageCountOptions = useMemo(() => makePageCountOptions(), []);
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
  const coverTemplateSpec = useMemo(() => getCoverTemplateSpec({ coverModelId, formatId, pageCount }), [coverModelId, formatId, pageCount]);
  const preview3DConfig = useMemo(() => getPreview3DConfig({ coverModelId, formatId, pageCount, textureId }), [coverModelId, formatId, pageCount, textureId]);
  const isFullCoverArt = coverModel.cover.type === "full_photo_cover_art";
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

  function downloadCoverTemplate() {
    if (!coverTemplateSpec?.enabled) return;
    const svg = makeCoverTemplateSvg(coverTemplateSpec);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = coverTemplateSpec.fileName || "gabarito-capa.svg";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function saveProject() {
    const payload = getProjectPayload();
    localStorage.setItem("picmimos-diagramador-v3-7-config3d-plugin", JSON.stringify(payload));
    setSavedAt(new Date());
    setModal({ type: "saved" });
  }

  function getProjectPayload() {
    return {
      version: "V4.1 Preview 3D Premium com Ambientes",
      product: coverModel.label,
      coverModelId,
      coverRule: coverModel.cover,
      coverTemplate: coverTemplateSpec,
      preview3DConfig,
      format: format.label,
      formatId: format.id,
      pages: pageCount,
      laminas: pageCount / 2,
      spineCm,
      texture: texture.label,
      textureId: texture.id,
      safetyMarginCm: SAFETY_MARGIN_CM,
      frameGapMm,
      production: {
        output: INTERIOR.productionOutput,
        dpi: 300,
        paper: `${INTERIOR.paper} com ${INTERIOR.finish}`,
        cover: coverModel.cover.description,
      },
      cover,
      spreads,
      photosCount: photos.length,
      savedAt: new Date().toISOString(),
    };
  }

  function buildPreview3DPages() {
    const pages = [];
    pages.push({ id: "preview-cover", type: "cover", title: "Capa", cover, texture, format, spineCm, coverModel, pageCount, coverTemplateSpec, preview3DConfig });
    spreads.forEach((spread, index) => {
      pages.push({
        id: `preview-spread-${spread.id || index}`,
        type: "spread",
        title: spread.name || `Página ${index * 2 + 1}-${index * 2 + 2}`,
        spread,
        format,
        spineCm,
        texture,
        coverModel,
        pageCount,
        coverTemplateSpec,
        preview3DConfig,
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
    if (!cover.photoId) problems.push(isFullCoverArt ? "A arte completa da capa ainda não foi enviada." : "A capa frontal ainda não tem foto.");
    if (emptySpreads.length) problems.push(`${emptySpreads.length} lâmina(s) do miolo estão vazias.`);
    setModal({ type: "finalize", problems, emptySpreads });
  }

  function simulatedExport() {
    const files = [
      "00-FICHA-PRODUCAO.html",
      "00-DADOS-PEDIDO.json",
      "00-PREVIEW.jpg",
      isFullCoverArt ? `01-GABARITO-${coverTemplateSpec.formatId}-${coverTemplateSpec.laminas}-LAMINAS-${coverTemplateSpec.spineMm}MM.svg` : "01-CAPA-FRENTE.jpg",
      isFullCoverArt ? "02-CAPA-COMPLETA-ARTE-CLIENTE.jpg" : null,
      ...spreads.map((_, index) => `${String(index + 2).padStart(2, "0")}-LAMINA-${String(index + 1).padStart(2, "0")}.jpg`),
    ];
    setModal({ type: "export", files: files.filter(Boolean) });
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
            <strong>Diagramador Picmimos V4.1 Preview 3D Premium com Ambientes</strong>
            <span>Configuração central + gabarito + preview 3D com ambiente, mesa/base e sombra</span>
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
          <label>Modelo de capa</label>
          <select value={coverModelId} onChange={(e) => setCoverModelId(e.target.value)}>
            {COVER_MODELS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>

          <label>Formato fechado</label>
          <select value={formatId} onChange={(e) => setFormatId(e.target.value)}>
            {FORMATS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>

          <label>Quantidade de páginas</label>
          <select value={pageCount} onChange={(e) => handlePagesChange(e.target.value)}>
            {pageCountOptions.map((p) => <option key={p} value={p}>{p} páginas ({p / 2} lâminas)</option>)}
          </select>

          <label>Textura do verso/lombada</label>
          <select value={textureId} onChange={(e) => setTextureId(e.target.value)} disabled={isFullCoverArt}>
            {TEXTURES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <p className="hint">{coverModel.cover.description}</p>
          {isFullCoverArt && (
            <div className="template-box">
              <strong>Gabarito da capa</strong>
              <p>Baixe o gabarito correto antes de fazer a arte no Photoshop. A lombada muda conforme a quantidade de lâminas.</p>
              <div className="template-specs">
                <span>{coverTemplateSpec.formatLabel}</span>
                <span>{coverTemplateSpec.laminas} lâminas</span>
                <span>Lombada {coverTemplateSpec.spineMm} mm</span>
                <span>Arte {coverTemplateSpec.fullCoverWidthCm} x {coverTemplateSpec.fullCoverHeightCm} cm</span>
              </div>
              <Button variant="warning" onClick={downloadCoverTemplate}>{coverTemplateSpec.downloadLabel}</Button>
              <small>Hoje este botão gera um SVG demonstrativo. Na versão final, o plugin WordPress/WooCommerce vai entregar o PSD/PDF cadastrado pelo administrador.</small>
            </div>
          )}

          <div className="template-box preview3d-admin-box">
            <strong>Configuração 3D</strong>
            <p>Campo preparado para o futuro plugin WordPress/WooCommerce controlar o visual 3D deste produto.</p>
            <div className="template-specs">
              <span>{preview3DConfig.label}</span>
              <span>{preview3DConfig.coverMode}</span>
              <span>{preview3DConfig.turnType}</span>
              <span>{preview3DConfig.environment}</span>
            </div>
            <small>Hoje vem do productConfigs.js. Depois virá do cadastro do laboratório no plugin.</small>
          </div>

          <div className="spec-grid">
            <div><span>Modelo</span><strong>{coverModel.shortLabel}</strong></div>
            <div><span>Miolo</span><strong>{format.spreadW} x {format.spreadH} cm</strong></div>
            <div><span>Lombada</span><strong>{(spineCm * 10).toFixed(0)} mm</strong></div>
            <div><span>Miolo</span><strong>{INTERIOR.paper}</strong></div>
            <div><span>Refilo</span><strong>3 mm total</strong></div>
            <div><span>Saída</span><strong>{INTERIOR.productionOutput}</strong></div>
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
            <span>{active.type === "cover" ? (isFullCoverArt ? `Arte completa pelo gabarito · ${coverTemplateSpec.laminas} lâminas · lombada ${coverTemplateSpec.spineMm} mm` : "Frente editável + verso/lombada texturizados") : `${format.spreadW} x ${format.spreadH} cm · Fuji UV Fosco`}</span>
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
                coverModel={coverModel}
                coverTemplateSpec={coverTemplateSpec}
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
            <CropControls label={isFullCoverArt ? "Arte completa da capa" : "Foto da capa"} photo={currentPhotoForPanel} target={cover} onChange={updateCoverCrop} emptyText={isFullCoverArt ? `Baixe o gabarito ${coverTemplateSpec.laminas} lâminas / lombada ${coverTemplateSpec.spineMm} mm, faça a arte no Photoshop e envie a capa completa aqui.` : "Clique no ícone de upload dentro da capa ou arraste uma foto para a frente."} />
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
            <li><span>{isFullCoverArt ? "Arte completa" : "Capa com foto"}</span><strong>{cover.photoId ? "Sim" : "Não"}</strong></li>
            {isFullCoverArt && <li><span>Gabarito</span><strong>{coverTemplateSpec.laminas} lâminas · {coverTemplateSpec.spineMm} mm</strong></li>}
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
  coverModel,
  coverTemplateSpec,
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
  const isFullCoverArt = coverModel?.cover?.type === "full_photo_cover_art";
  const frontWidth = (format.closedW / (format.closedW * 2 + spineCm)) * 100;
  const spineWidth = (spineCm / (format.closedW * 2 + spineCm)) * 100;
  const backWidth = 100 - frontWidth - spineWidth;

  const sharedDropProps = {
    onDrop: (event) => {
      event.preventDefault();
      const photoId = event.dataTransfer.getData("photo/id");
      if (photoId) onUseSelected(photoId);
    },
    onDragOver: (event) => event.preventDefault(),
    onPointerDown: (event) => {
      if (photo) onPhotoPan(event, "cover");
    },
    onWheel: (event) => photo && onPhotoWheel(event, "cover"),
  };

  const renderCoverTexts = () => cover.texts.map((text) => {
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
  });

  if (isFullCoverArt) {
    return (
      <div className={`cover-layout full-cover-art ${!cover.photoId ? "needs-photo" : ""}`} {...sharedDropProps}>
        {photo ? <Photo src={photo.src} frame={cover} /> : (
          <div className="cover-upload-zone">
            <button type="button" className="cover-upload-button" onClick={onPickCoverPhoto}>
              <span>＋</span>
              <strong>Inserir arte completa da capa</strong>
              <small>Use o gabarito: {coverTemplateSpec?.laminas} lâminas · lombada {coverTemplateSpec?.spineMm} mm</small>
            </button>
            {selectedPhotoId && <button type="button" className="cover-selected-button" onClick={() => onUseSelected(selectedPhotoId)}>Usar imagem selecionada</button>}
          </div>
        )}

        <div className="full-cover-template-badge">Gabarito: {coverTemplateSpec?.formatLabel} · {coverTemplateSpec?.laminas} lâminas · lombada {coverTemplateSpec?.spineMm} mm</div>
        <div className="full-cover-guide back" style={{ width: `${backWidth}%` }}>VERSO</div>
        <div className="full-cover-guide spine" style={{ left: `${backWidth}%`, width: `${spineWidth}%` }}>LOMBADA</div>
        <div className="full-cover-guide front" style={{ width: `${frontWidth}%` }}>FRENTE</div>

        {photo && <button type="button" className="cover-change-button" onClick={onPickCoverPhoto}>Trocar arte da capa</button>}
        <GuideLines guides={guides} />
        {showSafety && <div className="safety cover-safe">Margem de segurança 0,3 cm</div>}
        {renderCoverTexts()}
      </div>
    );
  }

  return (
    <div className="cover-layout">
      <div className="cover-back" style={{ width: `${backWidth}%`, background: texture.css }}>VERSO</div>
      <div className="cover-spine" style={{ width: `${spineWidth}%`, background: texture.css }}>LOMBADA</div>
      <div
        className={`cover-front ${!cover.photoId ? "needs-photo" : ""}`}
        style={{ width: `${frontWidth}%` }}
        {...sharedDropProps}
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
        {renderCoverTexts()}
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
  const [viewMode, setViewModeState] = useState("cover");
  const [zoom, setZoom] = useState(1);
  const [ambientIndex, setAmbientIndex] = useState(0);

  const ambients = useMemo(() => ([
    {
      id: "luxury_living",
      name: "Sala Premium",
      shortName: "Sala",
      tableType: "round_glass",
      background: "radial-gradient(circle at 50% 72%, rgba(255,255,255,.50) 0 13%, rgba(255,255,255,.26) 14% 25%, transparent 45%), linear-gradient(100deg, rgba(33,21,15,.76) 0 12%, transparent 12% 18%, rgba(227,185,111,.35) 19% 23%, transparent 24% 34%, rgba(14,24,31,.72) 35% 43%, rgba(232,243,255,.74) 44% 55%, rgba(24,23,22,.70) 56% 65%, rgba(188,123,51,.38) 66% 74%, rgba(44,31,22,.72) 75% 100%), linear-gradient(180deg, #2b221c 0%, #a77743 54%, #e8dcc8 55%, #c8ac7d 100%)",
      floor: "linear-gradient(90deg, rgba(255,255,255,.40), rgba(255,255,255,.08), rgba(0,0,0,.08)), radial-gradient(ellipse at center, rgba(255,255,255,.64), rgba(192,162,112,.34) 55%, rgba(98,72,43,.28) 100%)",
      ambientIntensity: 0.78,
      mainIntensity: 1.55,
      keyPosition: [3.6, 5.2, 4.8],
      tableColor: "#f1eee7",
      tableOpacity: 0.66,
      shadowOpacity: 0.35,
    },
    {
      id: "photo_studio",
      name: "Estúdio Fotográfico",
      shortName: "Estúdio",
      tableType: "matte_white",
      background: "radial-gradient(circle at 18% 45%, rgba(255,255,255,.78), transparent 17%), radial-gradient(circle at 82% 38%, rgba(255,255,255,.70), transparent 18%), linear-gradient(110deg, rgba(236,240,244,.95) 0 22%, rgba(210,216,222,.72) 23% 31%, rgba(252,252,251,.94) 32% 65%, rgba(214,220,226,.74) 66% 76%, rgba(247,248,249,.96) 77% 100%)",
      floor: "radial-gradient(ellipse at center, rgba(255,255,255,.86), rgba(235,238,240,.48) 55%, rgba(198,205,211,.35) 100%)",
      ambientIntensity: 0.98,
      mainIntensity: 1.48,
      keyPosition: [3.2, 4.6, 4.2],
      tableColor: "#ffffff",
      tableOpacity: 0.72,
      shadowOpacity: 0.28,
    },
    {
      id: "bedroom_clean",
      name: "Quarto Clean",
      shortName: "Quarto",
      tableType: "wood_light",
      background: "linear-gradient(110deg, rgba(245,238,226,.96) 0 17%, rgba(196,160,112,.35) 18% 24%, rgba(253,249,240,.90) 25% 46%, rgba(210,229,245,.74) 47% 62%, rgba(70,55,43,.45) 63% 70%, rgba(244,231,211,.95) 71% 100%), radial-gradient(circle at 22% 72%, rgba(151,105,61,.34), transparent 26%), radial-gradient(circle at 76% 68%, rgba(255,255,255,.48), transparent 30%)",
      floor: "linear-gradient(105deg, rgba(218,185,140,.60), rgba(255,244,226,.42), rgba(169,127,76,.33))",
      ambientIntensity: 0.90,
      mainIntensity: 1.35,
      keyPosition: [2.8, 4.7, 4.8],
      tableColor: "#ead7bd",
      tableOpacity: 0.62,
      shadowOpacity: 0.32,
    },
  ]), []);

  const total = pages.length;
  const coverPage = pages.find((item) => item?.type === "cover") || pages[0] || null;
  const firstSpread = pages.find((item) => item?.type === "spread") || pages[0] || null;
  const page = pages[index] || coverPage || null;
  const activeMeta = getPreview3DMeta(page || coverPage);
  const ambient = ambients[ambientIndex] || ambients[0];
  const renderMode = page?.type === "spread" ? "open" : viewMode;
  const renderPage = renderMode === "open" ? (page?.type === "spread" ? page : firstSpread) : (coverPage || page);

  useEffect(() => {
    setIndex(0);
    setViewModeState("cover");
  }, [total]);

  function updateIndex(nextIndex) {
    const safeIndex = clamp(nextIndex, 0, Math.max(total - 1, 0));
    setIndex(safeIndex);
    const nextPage = pages[safeIndex];
    setViewModeState(nextPage?.type === "spread" ? "open" : "cover");
  }

  function go(direction) {
    updateIndex(index + direction);
  }

  function setViewMode(mode) {
    setViewModeState(mode);
    if (mode === "open") {
      const openIndex = Math.max(0, pages.findIndex((item) => item?.type === "spread"));
      setIndex(openIndex >= 0 ? openIndex : 0);
      return;
    }
    setIndex(0);
  }

  function zoomBy(delta) {
    setZoom((current) => clamp(round((current || 1) + delta, 2), 0.82, 1.36));
  }

  function resetView() {
    setZoom(1);
    setViewMode("cover");
  }

  function nextAmbient() {
    setAmbientIndex((current) => (current + 1) % ambients.length);
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
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomBy(0.08);
      }
      if (event.key === "-") {
        event.preventDefault();
        zoomBy(-0.08);
      }
      if (event.key === "0") {
        event.preventDefault();
        resetView();
      }
      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        nextAmbient();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [total, index, pages, ambients.length]);

  return (
    <div
      className="preview3d-shell preview3d-real preview3d-v4 preview3d-premium"
      style={{
        "--ambient-background": ambient.background,
        "--ambient-floor": ambient.floor,
      }}
    >
      <div className="preview3d-canvas-wrap preview3d-real-wrap preview3d-premium-wrap" data-ambient={ambient.id}>
        <div className="preview3d-premium-backdrop" aria-hidden="true" />
        <div className="preview3d-premium-floor" aria-hidden="true" />

        <div className="preview3d-config-badges" aria-label="Configuração usada no preview 3D">
          <span>{activeMeta.model}</span>
          <span>{activeMeta.format}</span>
          <span>{activeMeta.lombada}</span>
          <span>{activeMeta.coverType}</span>
          <span>Ambiente: {ambient.shortName}</span>
        </div>

        <div className="preview3d-motion-controls preview3d-real-controls preview3d-premium-controls" aria-label="Controles de visualização 3D">
          <button type="button" onClick={() => setViewMode("cover")}>Capa</button>
          <button type="button" onClick={() => setViewMode("open")}>Aberto</button>
          <button type="button" onClick={() => setViewMode("spine")}>Lombada</button>
          <button type="button" onClick={() => setViewMode("back")}>Verso</button>
          <button type="button" onClick={nextAmbient}>Cenário</button>
          <button type="button" onClick={() => zoomBy(-0.08)}>-</button>
          <button type="button" onClick={() => zoomBy(0.08)}>+</button>
          <button type="button" onClick={resetView}>Reset</button>
        </div>

        <Canvas
          className="preview3d-real-canvas preview3d-v4-canvas preview3d-premium-canvas"
          shadows
          dpr={[1, 1.45]}
          orthographic
          camera={{ position: [4.4, 3.4, 5.2], zoom: 112, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: false }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Preview3DLighting ambient={ambient} />
          <Environment preset="apartment" />
          <PremiumPreviewTable ambient={ambient} />
          <PresentationControls
            global
            snap
            speed={1.1}
            zoom={1}
            rotation={[0, 0, 0]}
            polar={[-0.08, 0.18]}
            azimuth={[-0.30, 0.30]}
          >
            <group scale={[zoom * 1.16, zoom * 1.16, zoom * 1.16]} position={[0, 0.18, 0]}>
              <AlbumGLBReadyV4 page={renderPage} coverPage={coverPage} photoMap={photoMap} mode={renderMode} />
            </group>
          </PresentationControls>
          <ContactShadows position={[0, 0.018, 0]} opacity={ambient.shadowOpacity || 0.32} scale={4.4} blur={1.7} far={2.4} resolution={512} />
        </Canvas>

        <button type="button" className="preview3d-arrow left" onClick={() => go(-1)} disabled={index <= 0} aria-label="Folhear para trás">‹</button>
        <button type="button" className="preview3d-arrow right" onClick={() => go(1)} disabled={index >= total - 1} aria-label="Folhear para frente">›</button>

        <div className="preview3d-floating-actions preview3d-floating-actions-stable preview3d-real-page-label">
          <span>{page?.title || "Prévia"}</span>
          <strong>{index + 1} / {Math.max(total, 1)}</strong>
        </div>

        <div className="preview3d-ambient-switcher" aria-label="Trocar cenário do preview 3D">
          {ambients.map((item, itemIndex) => (
            <button
              type="button"
              key={item.id}
              className={`preview3d-ambient-chip ${itemIndex === ambientIndex ? "on" : ""}`}
              onClick={() => setAmbientIndex(itemIndex)}
              aria-label={`Usar cenário ${item.name}`}
            >
              <span className="preview3d-ambient-thumb" data-ambient={item.id} />
              <strong>{item.shortName}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="preview3d-dots">
        {pages.map((item, pageIndex) => (
          <button
            type="button"
            key={item.id || pageIndex}
            className={`preview3d-dot ${pageIndex === index ? "on" : ""}`}
            onClick={() => updateIndex(pageIndex)}
            aria-label={`Ir para ${item.title || `prévia ${pageIndex + 1}`}`}
          />
        ))}
      </div>
      <p className="preview3d-stable-note preview3d-real-note preview3d-premium-note">
        Preview 3D premium com ambiente, mesa/base e sombra. A estrutura já está preparada para o futuro plugin WordPress/WooCommerce cadastrar cenários, câmera, luz, materiais e gabaritos por produto.
      </p>
    </div>
  );
}

function Preview3DLighting({ ambient }) {
  return (
    <>
      <ambientLight intensity={ambient?.ambientIntensity ?? 0.9} />
      <hemisphereLight args={["#ffffff", "#bfa27a", 0.62]} />
      <directionalLight
        castShadow
        position={ambient?.keyPosition || [3.4, 5.1, 4.6]}
        intensity={ambient?.mainIntensity ?? 1.45}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={12}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[-3, 2.4, -2.5]} intensity={0.25} />
    </>
  );
}

function PremiumPreviewTable({ ambient }) {
  const tableColor = ambient?.tableColor || "#f0eee9";
  const opacity = ambient?.tableOpacity ?? 0.66;
  return (
    <group position={[0, 0, 0]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[2.2, 112]} />
        <meshPhysicalMaterial
          color={tableColor}
          roughness={0.22}
          metalness={0.02}
          clearcoat={0.7}
          clearcoatRoughness={0.08}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[1.05, 2.2, 112]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.13} side={THREE.DoubleSide} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]}>
        <circleGeometry args={[1.12, 96]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function CoverShowroomPreview({ page, photoMap, motionStyle = {} }) {
  const panel = getPreviewPanelSpec(page);
  const photo = page?.cover?.photoId ? photoMap.get(page.cover.photoId) : null;
  const isFullArt = isFullCoverArtPage(page);
  const textureColor = getTextureColor(page?.texture);
  const gridTemplateColumns = `${Math.max(panel.backRatio, 0.2)}fr ${Math.max(panel.spineRatio, 0.035)}fr ${Math.max(panel.frontRatio, 0.2)}fr`;

  return (
    <div className="preview3d-book preview3d-book-cover" style={{ "--preview-texture": textureColor, ...motionStyle }}>
      <div className="preview3d-cover-board" style={{ gridTemplateColumns }}>
        {isFullArt ? (
          <>
            {photo ? <PreviewPhotoImage photo={photo} crop={page.cover} className="preview3d-full-cover-art" /> : <div className="preview3d-empty-art">Arte completa da capa</div>}
            <div className="preview3d-cover-overlay-grid" style={{ gridTemplateColumns }}>
              <span>VERSO</span>
              <span className="spine">LOMBADA<br />{panel.spineMm} mm</span>
              <span>FRENTE</span>
            </div>
          </>
        ) : (
          <>
            <div className="preview3d-cover-part preview3d-cover-back"><span>VERSO</span></div>
            <div className="preview3d-cover-part preview3d-cover-spine"><span>LOMBADA<br />{panel.spineMm} mm</span></div>
            <div className="preview3d-cover-part preview3d-cover-front">
              {photo ? <PreviewPhotoImage photo={photo} crop={page.cover} /> : <div className="preview3d-empty-art">Foto da capa</div>}
              <span>FRENTE</span>
            </div>
          </>
        )}
      </div>
      <div className="preview3d-cover-thickness" />
      <div className="preview3d-book-shadow" />
    </div>
  );
}

function SpreadShowroomPreview({ page, photoMap, motionStyle = {} }) {
  const spread = page?.spread;
  const textureColor = getTextureColor(page?.texture);
  return (
    <div className="preview3d-book preview3d-book-open" style={{ "--preview-texture": textureColor, ...motionStyle }}>
      <div className="preview3d-open-cover-underlay" />
      <div className="preview3d-spread-board">
        <div className="preview3d-spread-page left" />
        <div className="preview3d-spread-page right" />
        <div className="preview3d-spread-fold" />
        {spread?.frames?.map((frame, frameIndex) => {
          const photo = frame.photoId ? photoMap.get(frame.photoId) : null;
          return (
            <div
              key={frame.id || frameIndex}
              className="preview3d-spread-frame"
              style={{ left: `${frame.x}%`, top: `${frame.y}%`, width: `${frame.w}%`, height: `${frame.h}%` }}
            >
              {photo ? <PreviewPhotoImage photo={photo} crop={frame} /> : <div className="preview3d-empty-art" />}
            </div>
          );
        })}
        {spread?.texts?.map((text) => (
          <div
            key={text.id}
            className="preview3d-spread-text"
            style={{
              left: `${text.x}%`,
              top: `${text.y}%`,
              width: `${text.w || 24}%`,
              fontSize: `${Math.max(9, (text.size || 24) * 0.42)}px`,
              fontFamily: text.font || "serif",
              color: text.color || "#111",
              fontWeight: text.weight || 700,
              textAlign: text.align || "center",
            }}
          >
            {text.text}
          </div>
        ))}
      </div>
      <div className="preview3d-book-shadow" />
    </div>
  );
}

function PreviewPhotoImage({ photo, crop = {}, className = "" }) {
  const cropX = Number(crop.cropX || 0);
  const cropY = Number(crop.cropY || 0);
  const scale = Number(crop.cropScale || 1);
  return (
    <img
      className={className}
      src={photo.src}
      alt=""
      style={{
        objectPosition: `${clamp(50 + cropX * 0.35, 0, 100)}% ${clamp(50 + cropY * 0.35, 0, 100)}%`,
        transform: `scale(${scale})`,
      }}
    />
  );
}

function getPreview3DMeta(page) {
  const coverModel = page?.coverModel || findCoverModel(DEFAULT_COVER_MODEL_ID);
  const format = page?.format || findFormat(DEFAULT_FORMAT_ID);
  const spec = page?.coverTemplateSpec;
  const preview3DConfig = page?.preview3DConfig;
  const pageCount = Number(page?.pageCount || spec?.pages || MIN_PAGES);
  const laminas = preview3DConfig?.laminas || spec?.laminas || Math.round(pageCount / 2);
  const spineMm = preview3DConfig?.spineMm ?? spec?.spineMm ?? Math.round((page?.spineCm || getSpineCm(pageCount)) * 10);
  return {
    model: coverModel?.shortLabel || coverModel?.label || "Modelo",
    format: format?.label ? `Formato ${format.label}` : "Formato",
    lombada: `${laminas} lâminas · lombada ${spineMm} mm`,
    coverType: preview3DConfig?.label || "3D configurável",
  };
}

function Preview3DEnvironment() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.12, 0]}>
        <circleGeometry args={[4.6, 128]} />
        <meshStandardMaterial color="#f2ede5" roughness={0.42} metalness={0.03} />
      </mesh>
      <mesh receiveShadow position={[0, 0.6, -3.0]}>
        <planeGeometry args={[8.6, 3.8]} />
        <meshStandardMaterial color="#edf2f6" roughness={0.92} />
      </mesh>
      <mesh receiveShadow position={[-2.75, 0.55, -2.4]} rotation={[0, 0.6, 0]}>
        <planeGeometry args={[3.4, 3.2]} />
        <meshStandardMaterial color="#e7ecef" roughness={0.92} />
      </mesh>
      <mesh receiveShadow position={[2.75, 0.55, -2.4]} rotation={[0, -0.6, 0]}>
        <planeGeometry args={[3.4, 3.2]} />
        <meshStandardMaterial color="#eef2f4" roughness={0.92} />
      </mesh>
      <mesh position={[-1.8, 0.65, -2.92]}>
        <planeGeometry args={[1.2, 1.7]} />
        <meshStandardMaterial color="#fff5de" roughness={0.82} transparent opacity={0.45} />
      </mesh>
      <mesh position={[1.9, 0.72, -2.92]}>
        <planeGeometry args={[1.35, 1.9]} />
        <meshStandardMaterial color="#dce9f7" roughness={0.84} transparent opacity={0.38} />
      </mesh>
    </group>
  );
}

function getTextureColor(texture) {
  return texture?.previewColor || "#c9b99b";
}

function isFullCoverArtPage(page) {
  return page?.coverModel?.cover?.type === "full_photo_cover_art";
}

function getPreviewPanelSpec(page) {
  const format = page?.format || findFormat(DEFAULT_FORMAT_ID);
  const pageCount = Number(page?.pageCount || page?.coverTemplateSpec?.pages || MIN_PAGES);
  const spineCm = Number(page?.spineCm || getSpineCm(pageCount));
  const fullW = Math.max(format.closedW * 2 + spineCm, 1);
  return {
    format,
    pageCount,
    laminas: page?.coverTemplateSpec?.laminas || Math.round(pageCount / 2),
    spineCm,
    spineMm: page?.coverTemplateSpec?.spineMm ?? Math.round(spineCm * 10),
    fullCoverW: fullW,
    coverH: format.closedH,
    backRatio: format.closedW / fullW,
    spineRatio: spineCm / fullW,
    frontRatio: format.closedW / fullW,
  };
}

function getPreviewBookSize(page) {
  const { format, pageCount, spineCm } = getPreviewPanelSpec(page);
  const coverH = 1.62;
  const coverW = clamp(coverH * (format.closedW / Math.max(format.closedH, 1)), 1.1, 2.45);
  const spreadW = clamp(coverH * (format.spreadW / Math.max(format.spreadH, 1)), 2.25, 4.6);
  const spreadH = coverH;
  const spineW = clamp((spineCm / Math.max(format.closedW, 1)) * coverW, 0.06, 0.46);
  const laminas = Math.max(1, Math.round(pageCount / 2));
  const pageThickness = clamp(spineW / Math.max(10, laminas), 0.01, 0.03);
  const coverThickness = clamp(pageThickness * 2.25, 0.04, 0.078);
  const blockThickness = clamp(spineW * 0.86, 0.07, 0.34);
  return { coverW, coverH, spreadW, spreadH, spineW, pageThickness, coverThickness, blockThickness, laminas };
}


function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawImageCover(ctx, image, x, y, w, h, cropX = 0, cropY = 0, cropScale = 1) {
  if (!image) {
    ctx.fillStyle = '#d8d2c8';
    ctx.fillRect(x, y, w, h);
    return;
  }
  const iw = image.naturalWidth || image.width || 1;
  const ih = image.naturalHeight || image.height || 1;
  const baseScale = Math.max(w / iw, h / ih);
  const extraScale = Math.max(Number(cropScale) || 1, 1);
  const scale = baseScale * extraScale;
  const drawW = iw * scale;
  const drawH = ih * scale;
  const maxMoveX = Math.max(0, drawW - w);
  const maxMoveY = Math.max(0, drawH - h);
  const nx = clamp((Number(cropX) || 0) / 100, -1, 1);
  const ny = clamp((Number(cropY) || 0) / 100, -1, 1);
  const dx = x - maxMoveX / 2 - nx * (maxMoveX / 2);
  const dy = y - maxMoveY / 2 - ny * (maxMoveY / 2);
  ctx.drawImage(image, dx, dy, drawW, drawH);
}

async function buildSpreadCanvas(page, photoMap) {
  const format = page?.format || findFormat(DEFAULT_FORMAT_ID);
  const aspect = Math.max(format.spreadW / Math.max(format.spreadH, 1), 1.2);
  const width = 1800;
  const height = Math.round(width / aspect);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fffaf3';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, width / 2, height);
  ctx.fillRect(width / 2, 0, width / 2, height);

  const frames = page?.spread?.frames || [];
  const images = await Promise.all(frames.map((frame) => {
    const photo = frame?.photoId ? photoMap.get(frame.photoId) : null;
    return loadImageElement(photo?.src).catch(() => null);
  }));

  frames.forEach((frame, index) => {
    const fx = (frame.x / 100) * width;
    const fy = (frame.y / 100) * height;
    const fw = (frame.w / 100) * width;
    const fh = (frame.h / 100) * height;
    ctx.save();
    ctx.beginPath();
    ctx.rect(fx, fy, fw, fh);
    ctx.clip();
    drawImageCover(ctx, images[index], fx, fy, fw, fh, frame.cropX, frame.cropY, frame.cropScale);
    ctx.restore();
  });

  ctx.strokeStyle = '#d7d1c8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();

  return canvas;
}

async function buildCoverCanvas(page, photoMap) {
  const panel = getPreviewPanelSpec(page);
  const isFullArt = isFullCoverArtPage(page);
  const aspect = Math.max(panel.format.closedW / Math.max(panel.format.closedH, 1), 0.8);
  const width = 1000;
  const height = Math.round(width / aspect);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const coverPhoto = page?.cover?.photoId ? photoMap.get(page.cover.photoId) : null;
  const image = await loadImageElement(coverPhoto?.src).catch(() => null);

  if (isFullArt) {
    const fullWidth = Math.max(900, Math.round(width / panel.frontRatio));
    const fullHeight = height;
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = fullWidth;
    fullCanvas.height = fullHeight;
    const fullCtx = fullCanvas.getContext('2d');
    fullCtx.fillStyle = '#f2ede4';
    fullCtx.fillRect(0, 0, fullWidth, fullHeight);
    if (image) {
      drawImageCover(fullCtx, image, 0, 0, fullWidth, fullHeight, page.cover?.cropX, page.cover?.cropY, page.cover?.cropScale);
    } else {
      fullCtx.fillStyle = '#d8d2c8';
      fullCtx.fillRect(0, 0, fullWidth, fullHeight);
      fullCtx.fillStyle = '#5a5246';
      fullCtx.font = '700 34px system-ui';
      fullCtx.textAlign = 'center';
      fullCtx.fillText('Sem arte completa da capa', fullWidth / 2, fullHeight / 2);
    }
    const sx = Math.round((panel.backRatio + panel.spineRatio) * fullWidth);
    ctx.drawImage(fullCanvas, sx, 0, Math.max(1, panel.frontRatio * fullWidth), fullHeight, 0, 0, width, height);
  } else {
    ctx.fillStyle = getTextureColor(page?.texture);
    ctx.fillRect(0, 0, width, height);
    if (image) {
      drawImageCover(ctx, image, 0, 0, width, height, page.cover?.cropX, page.cover?.cropY, page.cover?.cropScale);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(width * 0.08, height * 0.08, width * 0.84, height * 0.84);
      ctx.fillStyle = '#5a5246';
      ctx.font = '600 32px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Sem foto na capa', width / 2, height / 2);
    }
  }

  return canvas;
}

async function buildBackCanvas(page, photoMap) {
  const panel = getPreviewPanelSpec(page);
  const isFullArt = isFullCoverArtPage(page);
  const aspect = Math.max(panel.format.closedW / Math.max(panel.format.closedH, 1), 0.8);
  const width = 1000;
  const height = Math.round(width / aspect);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const coverPhoto = page?.cover?.photoId ? photoMap.get(page.cover.photoId) : null;
  const image = await loadImageElement(coverPhoto?.src).catch(() => null);

  if (isFullArt && image) {
    const fullWidth = Math.max(1200, Math.round(width / Math.max(panel.backRatio, 0.2)));
    const fullHeight = height;
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = fullWidth;
    fullCanvas.height = fullHeight;
    const fullCtx = fullCanvas.getContext('2d');
    fullCtx.fillStyle = '#f2ede4';
    fullCtx.fillRect(0, 0, fullWidth, fullHeight);
    drawImageCover(fullCtx, image, 0, 0, fullWidth, fullHeight, page.cover?.cropX, page.cover?.cropY, page.cover?.cropScale);
    ctx.drawImage(fullCanvas, 0, 0, Math.max(1, panel.backRatio * fullWidth), fullHeight, 0, 0, width, height);
  } else {
    ctx.fillStyle = getTextureColor(page?.texture);
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffffff';
    for (let x = -width; x < width * 2; x += 28) {
      ctx.fillRect(x, 0, 5, height * 1.6);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '700 42px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('VERSO', width / 2, height / 2);
  }
  return canvas;
}

async function buildSpineCanvas(page, photoMap) {
  const panel = getPreviewPanelSpec(page);
  const isFullArt = isFullCoverArtPage(page);
  const width = 220;
  const height = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const coverPhoto = page?.cover?.photoId ? photoMap.get(page.cover.photoId) : null;
  const image = await loadImageElement(coverPhoto?.src).catch(() => null);

  if (isFullArt && image) {
    const fullWidth = Math.max(1200, Math.round(width / Math.max(panel.spineRatio, 0.03)));
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = fullWidth;
    fullCanvas.height = height;
    const fullCtx = fullCanvas.getContext('2d');
    drawImageCover(fullCtx, image, 0, 0, fullWidth, height, page.cover?.cropX, page.cover?.cropY, page.cover?.cropScale);
    const sx = Math.round(panel.backRatio * fullWidth);
    const sw = Math.max(1, Math.round(panel.spineRatio * fullWidth));
    ctx.drawImage(fullCanvas, sx, 0, sw, height, 0, 0, width, height);
  } else {
    ctx.fillStyle = getTextureColor(page?.texture);
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let y = -height; y < height * 2; y += 28) {
      ctx.fillRect(0, y, width, 5);
    }
  }

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '700 72px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`LOMBADA ${panel.spineMm} MM`, 0, 24);
  ctx.restore();

  return canvas;
}

function textureFromCanvas(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  return texture;
}

function useSpreadCanvasTexture(page, photoMap) {
  const [texture, setTexture] = useState(null);
  const depKey = useMemo(() => JSON.stringify({
    id: page?.id,
    spreadId: page?.spread?.id,
    frames: (page?.spread?.frames || []).map((frame) => ({
      id: frame.id,
      photoId: frame.photoId,
      x: frame.x,
      y: frame.y,
      w: frame.w,
      h: frame.h,
      cropX: frame.cropX,
      cropY: frame.cropY,
      cropScale: frame.cropScale,
      src: frame.photoId ? photoMap.get(frame.photoId)?.src : '',
    })),
  }), [page, photoMap]);

  useEffect(() => {
    let alive = true;
    let previous = null;
    async function run() {
      const canvas = await buildSpreadCanvas(page, photoMap).catch(() => null);
      if (!alive || !canvas) return;
      const nextTexture = textureFromCanvas(canvas);
      setTexture((old) => {
        previous = old;
        return nextTexture;
      });
      if (previous) previous.dispose();
    }
    run();
    return () => {
      alive = false;
    };
  }, [depKey, page, photoMap]);

  return texture;
}

function useCoverCanvasTexture(page, photoMap) {
  const [texture, setTexture] = useState(null);
  const depKey = useMemo(() => JSON.stringify({
    id: page?.id,
    photoId: page?.cover?.photoId,
    cropX: page?.cover?.cropX,
    cropY: page?.cover?.cropY,
    cropScale: page?.cover?.cropScale,
    src: page?.cover?.photoId ? photoMap.get(page.cover.photoId)?.src : '',
    textureId: page?.texture?.id,
  }), [page, photoMap]);

  useEffect(() => {
    let alive = true;
    let previous = null;
    async function run() {
      const canvas = await buildCoverCanvas(page, photoMap).catch(() => null);
      if (!alive || !canvas) return;
      const nextTexture = textureFromCanvas(canvas);
      setTexture((old) => {
        previous = old;
        return nextTexture;
      });
      if (previous) previous.dispose();
    }
    run();
    return () => {
      alive = false;
    };
  }, [depKey, page, photoMap]);

  return texture;
}

function useBackCanvasTexture(page, photoMap) {
  const [texture, setTexture] = useState(null);
  const depKey = useMemo(() => JSON.stringify({
    id: page?.id,
    photoId: page?.cover?.photoId,
    cropX: page?.cover?.cropX,
    cropY: page?.cover?.cropY,
    cropScale: page?.cover?.cropScale,
    src: page?.cover?.photoId ? photoMap.get(page.cover.photoId)?.src : '',
    textureId: page?.texture?.id,
    coverType: page?.coverModel?.cover?.type,
  }), [page, photoMap]);

  useEffect(() => {
    let alive = true;
    let previous = null;
    async function run() {
      const canvas = await buildBackCanvas(page, photoMap).catch(() => null);
      if (!alive || !canvas) return;
      const nextTexture = textureFromCanvas(canvas);
      setTexture((old) => {
        previous = old;
        return nextTexture;
      });
      if (previous) previous.dispose();
    }
    run();
    return () => {
      alive = false;
    };
  }, [depKey, page, photoMap]);

  return texture;
}

function useSpineCanvasTexture(page, photoMap) {
  const [texture, setTexture] = useState(null);
  const depKey = useMemo(() => JSON.stringify({
    id: page?.id,
    photoId: page?.cover?.photoId,
    cropX: page?.cover?.cropX,
    cropY: page?.cover?.cropY,
    cropScale: page?.cover?.cropScale,
    src: page?.cover?.photoId ? photoMap.get(page.cover.photoId)?.src : '',
    textureId: page?.texture?.id,
    coverType: page?.coverModel?.cover?.type,
    spineCm: page?.spineCm,
    pageCount: page?.pageCount,
  }), [page, photoMap]);

  useEffect(() => {
    let alive = true;
    let previous = null;
    async function run() {
      const canvas = await buildSpineCanvas(page, photoMap).catch(() => null);
      if (!alive || !canvas) return;
      const nextTexture = textureFromCanvas(canvas);
      setTexture((old) => {
        previous = old;
        return nextTexture;
      });
      if (previous) previous.dispose();
    }
    run();
    return () => {
      alive = false;
    };
  }, [depKey, page, photoMap]);

  return texture;
}

function TexturedPlane({ texture, width, height, z = 0.01 }) {
  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={texture || null} color={texture ? '#ffffff' : '#e9e2d6'} roughness={0.58} metalness={0.0} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function TopTexturePlane({ texture, width, depth, y = 0.05, opacity = 1, roughness = 0.55 }) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial
        map={texture || null}
        color={texture ? '#ffffff' : '#f3efe7'}
        roughness={roughness}
        metalness={0.0}
        transparent={opacity < 1}
        opacity={opacity}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function AcrylicGlossPlane({ width, depth, y }) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshPhysicalMaterial
        color="#ffffff"
        transparent
        opacity={0.18}
        roughness={0.02}
        metalness={0.0}
        clearcoat={1}
        clearcoatRoughness={0.05}
        transmission={0.12}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}


function AlbumGLBReadyV4({ page, coverPage, photoMap, mode = "cover" }) {
  const groupRef = useRef(null);
  const safePage = page || coverPage;
  const closedPage = coverPage || page;
  const isOpen = mode === "open" || safePage?.type === "spread";
  const preset = getV4ViewPreset(mode, isOpen);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = preset.position[1] + Math.sin(state.clock.elapsedTime * 0.55) * 0.004;
  });

  return (
    <group ref={groupRef} rotation={preset.rotation} position={preset.position}>
      {isOpen ? (
        <OpenAlbumGLBReadyV4 page={safePage?.type === "spread" ? safePage : null} coverPage={closedPage} photoMap={photoMap} />
      ) : (
        <ClosedAlbumGLBReadyV4 page={closedPage} photoMap={photoMap} mode={mode} />
      )}
    </group>
  );
}

function getV4ViewPreset(mode, isOpen) {
  if (isOpen) return { rotation: [-0.02, -0.16, 0.0], position: [0, 0, 0] };
  if (mode === "spine") return { rotation: [-0.02, -1.22, 0.02], position: [0.05, 0, 0] };
  if (mode === "back") return { rotation: [-0.02, Math.PI - 0.34, 0.0], position: [0, 0, 0] };
  return { rotation: [-0.02, -0.34, 0.0], position: [0, 0, 0] };
}

function V4StudioBase() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.062, 0]}>
        <circleGeometry args={[2.35, 96]} />
        <meshStandardMaterial color="#f0eee9" roughness={0.82} metalness={0} transparent opacity={0.72} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.061, 0]}>
        <ringGeometry args={[1.02, 1.72, 96]} />
        <meshBasicMaterial color="#fffaf0" transparent opacity={0.16} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function V4RoundedBoard({ args, position, color = "#f6f1e8", roughness = 0.68, radius = 0.035, children }) {
  return (
    <RoundedBox castShadow receiveShadow args={args} radius={radius} smoothness={8} position={position}>
      <meshStandardMaterial color={color} roughness={roughness} metalness={0.0} />
      {children}
    </RoundedBox>
  );
}

function V4TopTexture({ texture, width, depth, y, x = 0, z = 0, roughness = 0.5, opacity = 1 }) {
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial
        map={texture || null}
        color={texture ? "#ffffff" : "#f7f2e8"}
        roughness={roughness}
        metalness={0}
        transparent={opacity < 1}
        opacity={opacity}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function V4SideTexture({ texture, width, height, x = 0, y = 0, z = 0, rotation = [0, 0, 0], roughness = 0.65 }) {
  return (
    <mesh position={[x, y, z]} rotation={rotation} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={texture || null} color={texture ? "#ffffff" : "#d4c4a7"} roughness={roughness} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function V4PageEdgeLines({ width, depth, y, count = 8 }) {
  const items = Array.from({ length: count });
  return (
    <group>
      {items.map((_, idx) => {
        const offset = -0.015 - idx * 0.007;
        return (
          <mesh key={idx} position={[0, y + offset, depth / 2 + 0.004]}>
            <boxGeometry args={[width * (0.96 - idx * 0.004), 0.002, 0.004]} />
            <meshStandardMaterial color={idx % 2 ? "#e8e1d6" : "#f8f4ec"} roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function V4AcrylicLayer({ width, depth, y, x = 0, z = 0 }) {
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshPhysicalMaterial
        color="#ffffff"
        transparent
        opacity={0.20}
        roughness={0.02}
        metalness={0}
        clearcoat={1}
        clearcoatRoughness={0.025}
        transmission={0.16}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function ClosedAlbumGLBReadyV4({ page, photoMap, mode = "cover" }) {
  if (!page) return null;
  const { coverW, coverH, spineW, coverThickness, blockThickness } = getPreviewBookSize(page);
  const frontTexture = useCoverCanvasTexture(page, photoMap);
  const backTexture = useBackCanvasTexture(page, photoMap);
  const spineTexture = useSpineCanvasTexture(page, photoMap);
  const coverColor = getTextureColor(page.texture);
  const isBack = mode === "back";
  const effect = page?.preview3DConfig?.frontEffect || "";
  const hasAcrylic = !isBack && effect.includes("acrylic");
  const boardY = blockThickness + coverThickness / 2;
  const topY = blockThickness + coverThickness + 0.006;
  const visibleTexture = isBack ? backTexture : frontTexture;

  return (
    <group>
      <V4RoundedBoard args={[coverW * 0.98, blockThickness, coverH * 0.96]} position={[0.06, blockThickness / 2 - 0.012, 0.03]} color="#eee7db" roughness={0.86} radius={0.025} />
      <V4PageEdgeLines width={coverW * 0.88} depth={coverH * 0.94} y={blockThickness + 0.005} count={9} />
      <V4RoundedBoard args={[coverW, coverThickness, coverH]} position={[0, boardY, 0]} color={isBack ? coverColor : "#fbf6ee"} roughness={0.68} radius={0.04} />
      <V4TopTexture texture={visibleTexture} width={coverW * 0.965} depth={coverH * 0.955} y={topY} roughness={hasAcrylic ? 0.22 : 0.48} />
      {hasAcrylic && <V4AcrylicLayer width={coverW * 0.965} depth={coverH * 0.955} y={topY + 0.006} />}
      <V4RoundedBoard args={[Math.max(spineW, 0.075), coverThickness * 1.12, coverH]} position={[-coverW / 2 - Math.max(spineW, 0.075) / 2 + 0.006, boardY + 0.002, 0]} color={coverColor} roughness={0.82} radius={0.024} />
      <V4SideTexture texture={spineTexture} width={coverH * 0.92} height={Math.max(spineW, 0.075)} x={-coverW / 2 - Math.max(spineW, 0.075) - 0.002} y={boardY + 0.008} z={0} rotation={[0, -Math.PI / 2, Math.PI / 2]} roughness={0.78} />
      <mesh castShadow receiveShadow position={[0.03, 0.012, coverH / 2 + 0.012]}>
        <boxGeometry args={[coverW * 0.92, 0.024, 0.024]} />
        <meshStandardMaterial color="#d7cfc2" roughness={0.9} />
      </mesh>
    </group>
  );
}

function OpenAlbumGLBReadyV4({ page, coverPage, photoMap }) {
  const activePage = page?.type === "spread" ? page : null;
  const referencePage = activePage || coverPage;
  if (!referencePage) return null;
  const { spreadW, spreadH, spineW, pageThickness, coverThickness, blockThickness } = getPreviewBookSize(referencePage);
  const coverColor = getTextureColor(coverPage?.texture || referencePage?.texture);
  const spreadTexture = useSpreadCanvasTexture(activePage || referencePage, photoMap);
  const frontTexture = useCoverCanvasTexture(coverPage || referencePage, photoMap);
  const backTexture = useBackCanvasTexture(coverPage || referencePage, photoMap);
  const topY = coverThickness + blockThickness + pageThickness + 0.008;
  const halfW = spreadW / 2;

  return (
    <group>
      <group rotation={[0, 0, 0.045]} position={[-halfW / 2 - spineW * 0.15, coverThickness / 2, 0.01]}>
        <V4RoundedBoard args={[halfW, coverThickness, spreadH * 1.02]} position={[0, 0, 0]} color={coverColor} roughness={0.84} radius={0.035} />
        <V4TopTexture texture={backTexture} width={halfW * 0.96} depth={spreadH * 0.96} y={coverThickness / 2 + 0.006} roughness={0.72} />
      </group>
      <group rotation={[0, 0, -0.035]} position={[halfW / 2 + spineW * 0.15, coverThickness / 2, 0.01]}>
        <V4RoundedBoard args={[halfW, coverThickness, spreadH * 1.02]} position={[0, 0, 0]} color="#fbf7ef" roughness={0.72} radius={0.035} />
        <V4TopTexture texture={frontTexture} width={halfW * 0.96} depth={spreadH * 0.96} y={coverThickness / 2 + 0.006} roughness={0.48} />
      </group>
      <V4RoundedBoard args={[spreadW * 0.985, blockThickness, spreadH * 0.965]} position={[0, coverThickness + blockThickness / 2, 0]} color="#eee7db" roughness={0.9} radius={0.018} />
      <V4PageEdgeLines width={spreadW * 0.92} depth={spreadH * 0.94} y={coverThickness + blockThickness + 0.002} count={10} />
      <V4RoundedBoard args={[spreadW, pageThickness, spreadH]} position={[0, coverThickness + blockThickness + pageThickness / 2, 0]} color="#fffdf8" roughness={0.5} radius={0.018} />
      <V4TopTexture texture={spreadTexture} width={spreadW * 0.988} depth={spreadH * 0.988} y={topY} roughness={0.38} />
      <mesh castShadow receiveShadow position={[0, topY + 0.006, 0]}>
        <boxGeometry args={[0.018, 0.014, spreadH * 1.01]} />
        <meshStandardMaterial color="#d4ccc0" roughness={0.72} />
      </mesh>
      <mesh position={[-halfW / 2, topY + 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[halfW, spreadH]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.045} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[halfW / 2, topY + 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[halfW, spreadH]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.025} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function RealAlbum3DMVP({ page, coverPage, photoMap, mode = "cover" }) {
  const groupRef = useRef(null);
  const safePage = page || coverPage;
  const closedPage = coverPage || page;
  const isOpen = mode === "open" || safePage?.type === "spread";
  const preset = getReal3DViewPreset(mode, isOpen);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.006;
  });

  return (
    <group ref={groupRef} rotation={preset.rotation} position={preset.position}>
      {isOpen ? (
        <OpenAlbumReal3D page={safePage?.type === "spread" ? safePage : page} coverPage={closedPage} photoMap={photoMap} />
      ) : (
        <ClosedAlbumReal3D page={closedPage} photoMap={photoMap} mode={mode} />
      )}
    </group>
  );
}

function getReal3DViewPreset(mode, isOpen) {
  if (isOpen) return { rotation: [0, -0.18, 0], position: [0, 0, 0] };
  if (mode === "spine") return { rotation: [0, -1.45, 0], position: [0.06, 0.02, 0] };
  if (mode === "back") return { rotation: [0, Math.PI - 0.36, 0], position: [0, 0.02, 0] };
  return { rotation: [0, -0.36, 0], position: [0, 0.02, 0] };
}

function ClosedAlbumReal3D({ page, photoMap, mode = "cover" }) {
  if (!page) return null;
  const { coverW, coverH, spineW, coverThickness, blockThickness } = getPreviewBookSize(page);
  const totalW = coverW + spineW;
  const spineX = -totalW / 2 + spineW / 2;
  const coverX = -totalW / 2 + spineW + coverW / 2;
  const coverColor = getTextureColor(page.texture);
  const frontTexture = useCoverCanvasTexture(page, photoMap);
  const backTexture = useBackCanvasTexture(page, photoMap);
  const spineTexture = useSpineCanvasTexture(page, photoMap);
  const isBack = mode === "back";
  const topTexture = isBack ? backTexture : frontTexture;
  const effect = page?.preview3DConfig?.frontEffect || "";
  const hasAcrylic = !isBack && effect.includes("acrylic");
  const topY = blockThickness + coverThickness;

  return (
    <group>
      <mesh castShadow receiveShadow position={[coverX, blockThickness / 2, 0]}>
        <boxGeometry args={[coverW * 0.985, blockThickness, coverH * 0.985]} />
        <meshStandardMaterial color="#f1ece3" roughness={0.86} />
      </mesh>

      <mesh castShadow receiveShadow position={[coverX, blockThickness + coverThickness / 2, 0]}>
        <boxGeometry args={[coverW, coverThickness, coverH]} />
        <meshStandardMaterial color={isBack ? coverColor : "#f8f4ec"} roughness={0.72} />
      </mesh>
      <group position={[coverX, 0, 0]}>
        <TopTexturePlane texture={topTexture} width={coverW * 0.985} depth={coverH * 0.985} y={topY + 0.006} roughness={hasAcrylic ? 0.26 : 0.56} />
        {hasAcrylic && <AcrylicGlossPlane width={coverW * 0.985} depth={coverH * 0.985} y={topY + 0.011} />}
      </group>

      <mesh castShadow receiveShadow position={[spineX, blockThickness + coverThickness / 2, 0]}>
        <boxGeometry args={[spineW, coverThickness * 1.18, coverH]} />
        <meshStandardMaterial color={coverColor} roughness={0.82} />
      </mesh>
      <group position={[spineX, 0, 0]}>
        <TopTexturePlane texture={spineTexture} width={Math.max(spineW * 0.92, 0.018)} depth={coverH * 0.985} y={topY + 0.008} roughness={0.78} />
      </group>

      <mesh castShadow receiveShadow position={[coverX, coverThickness * 0.24, coverH / 2 + 0.018]}>
        <boxGeometry args={[coverW * 0.96, coverThickness * 0.42, 0.035]} />
        <meshStandardMaterial color="#d8d0c3" roughness={0.88} />
      </mesh>
      <mesh castShadow receiveShadow position={[coverX, coverThickness * 0.24, -coverH / 2 - 0.018]}>
        <boxGeometry args={[coverW * 0.96, coverThickness * 0.42, 0.035]} />
        <meshStandardMaterial color="#d8d0c3" roughness={0.88} />
      </mesh>
    </group>
  );
}

function OpenAlbumReal3D({ page, coverPage, photoMap }) {
  const activePage = page?.type === "spread" ? page : null;
  const referencePage = activePage || coverPage;
  if (!referencePage) return null;
  const { spreadW, spreadH, spineW, pageThickness, coverThickness, blockThickness } = getPreviewBookSize(referencePage);
  const coverColor = getTextureColor(coverPage?.texture || referencePage?.texture);
  const spreadTexture = useSpreadCanvasTexture(activePage || referencePage, photoMap);
  const spreadTopY = coverThickness + blockThickness + pageThickness + 0.006;

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, coverThickness / 2, 0]} rotation={[0, 0.015, 0]}>
        <boxGeometry args={[spreadW + spineW * 0.72, coverThickness, spreadH * 1.045]} />
        <meshStandardMaterial color={coverColor} roughness={0.86} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, coverThickness + blockThickness / 2, 0]}>
        <boxGeometry args={[spreadW * 0.985, blockThickness, spreadH * 0.985]} />
        <meshStandardMaterial color="#eee8dd" roughness={0.92} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, coverThickness + blockThickness + pageThickness / 2, 0]}>
        <boxGeometry args={[spreadW, pageThickness, spreadH]} />
        <meshStandardMaterial color="#fffdf8" roughness={0.52} />
      </mesh>
      <TopTexturePlane texture={spreadTexture} width={spreadW * 0.992} depth={spreadH * 0.992} y={spreadTopY} roughness={0.42} />

      <mesh castShadow receiveShadow position={[0, spreadTopY + 0.006, 0]}>
        <boxGeometry args={[0.014, 0.012, spreadH * 1.006]} />
        <meshStandardMaterial color="#d7d0c6" roughness={0.76} />
      </mesh>
      <mesh receiveShadow position={[-spreadW / 4, spreadTopY + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[spreadW / 2, spreadH]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} transparent opacity={0.04} side={THREE.DoubleSide} />
      </mesh>
      <mesh receiveShadow position={[spreadW / 4, spreadTopY + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[spreadW / 2, spreadH]} />
        <meshStandardMaterial color="#000000" roughness={0.5} transparent opacity={0.025} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function RigidAlbum3D({ page, targetPage, turn, photoMap, onTurnDone }) {
  const groupRef = useRef(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.012;
  });

  if (!page) return null;
  const currentSpread = page?.type === 'spread' ? page : (targetPage?.type === 'spread' ? targetPage : null);

  return (
    <group ref={groupRef} position={[0, -0.06, 0]} rotation={[0.04, -0.18, 0]}>
      {page.type === 'cover' && !turn ? (
        <ClosedRigidAlbum3D page={page} photoMap={photoMap} />
      ) : (
        <OpenRigidAlbum3D page={currentSpread} photoMap={photoMap} />
      )}
      {turn && page.type === 'spread' && (
        <TurningRigidSpread page={page} photoMap={photoMap} direction={turn.direction} onDone={onTurnDone} />
      )}
      {turn && page.type === 'cover' && targetPage?.type === 'spread' && (
        <CoverOpeningBoard page={page} photoMap={photoMap} onDone={onTurnDone} />
      )}
    </group>
  );
}

function ClosedRigidAlbum3D({ page, photoMap }) {
  const { coverW, coverH, spineW, coverThickness, blockThickness } = getPreviewBookSize(page);
  const coverColor = getTextureColor(page.texture);
  const coverTexture = useCoverCanvasTexture(page, photoMap);
  const spineTexture = useSpineCanvasTexture(page, photoMap);
  const isFullArt = isFullCoverArtPage(page);

  return (
    <group rotation={[0.04, 0.2, -0.01]}>
      <mesh castShadow receiveShadow position={[0, 0, -blockThickness * 0.4]}>
        <boxGeometry args={[coverW + spineW * 1.02, coverH * 0.98, blockThickness]} />
        <meshStandardMaterial color="#f7f2e8" roughness={0.84} />
      </mesh>
      <mesh castShadow receiveShadow position={[-(coverW / 2), 0, 0.012]}>
        <boxGeometry args={[spineW, coverH * 1.02, coverThickness * 1.55]} />
        <meshStandardMaterial map={spineTexture || null} color={spineTexture ? "#ffffff" : coverColor} roughness={isFullArt ? 0.62 : 0.88} toneMapped={false} />
      </mesh>
      <mesh castShadow receiveShadow position={[spineW / 2, 0, 0.035]}>
        <boxGeometry args={[coverW, coverH, coverThickness]} />
        <meshStandardMaterial color={isFullArt ? "#f6f0e5" : coverColor} roughness={isFullArt ? 0.72 : 0.82} />
      </mesh>
      <group position={[spineW / 2, 0, coverThickness / 2 + 0.01]}>
        <TexturedPlane texture={coverTexture} width={coverW * 0.98} height={coverH * 0.98} z={0} />
      </group>
    </group>
  );
}

function OpenRigidAlbum3D({ page, photoMap }) {
  if (!page) return null;
  const { spreadW, spreadH, spineW, pageThickness, blockThickness } = getPreviewBookSize(page);
  const spineColor = getTextureColor(page.texture);
  return (
    <group rotation={[-0.92, 0.0, 0]} position={[0, -0.16, 0.08]}>
      <mesh castShadow receiveShadow position={[0, 0, -0.11]}>
        <boxGeometry args={[spreadW * 0.98, spreadH * 0.98, blockThickness]} />
        <meshStandardMaterial color="#efe7d9" roughness={0.92} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, -0.02]}>
        <boxGeometry args={[Math.max(spineW, 0.08), spreadH * 1.02, blockThickness * 1.08]} />
        <meshStandardMaterial color={spineColor} roughness={0.96} />
      </mesh>
      <RigidSpreadBoard page={page} photoMap={photoMap} width={spreadW} height={spreadH} thickness={pageThickness} z={0.038} />
    </group>
  );
}

function RigidSpreadBoard({ page, photoMap, width, height, thickness, z = 0 }) {
  const spreadTexture = useSpreadCanvasTexture(page, photoMap);
  return (
    <group position={[0, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[width, height, thickness]} />
        <meshStandardMaterial color="#fffdf8" roughness={0.56} metalness={0.01} />
      </mesh>
      <group position={[0, 0, thickness / 2 + 0.004]}>
        <TexturedPlane texture={spreadTexture} width={width - 0.015} height={height - 0.015} z={0} />
      </group>
      <mesh position={[0, 0, thickness / 2 + 0.011]}>
        <boxGeometry args={[0.012, height * 1.01, 0.006]} />
        <meshStandardMaterial color="#d5cfc3" roughness={0.85} />
      </mesh>
    </group>
  );
}

function TurningRigidSpread({ page, photoMap, direction = 1, onDone }) {
  const { spreadW, pageThickness } = getPreviewBookSize(page);
  const pivotRef = useRef(null);
  const progressRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    progressRef.current = 0;
    doneRef.current = false;
  }, [page?.id, direction]);

  useFrame((_, delta) => {
    if (!pivotRef.current || doneRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta * 1.15);
    const t = progressRef.current;
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    pivotRef.current.rotation.y = direction > 0 ? -Math.PI * 0.98 * eased : Math.PI * 0.98 * eased;
    pivotRef.current.position.z = 0.05 + Math.sin(eased * Math.PI) * 0.16;
    pivotRef.current.position.x = direction > 0 ? eased * 0.08 : -eased * 0.08;
    if (progressRef.current >= 1) {
      doneRef.current = true;
      setTimeout(() => onDone?.(), 0);
    }
  });

  return (
    <group rotation={[-0.92, 0.0, 0]} position={[0, -0.16, 0.12]}>
      <group ref={pivotRef}>
        <RigidSpreadBoard page={page} photoMap={photoMap} width={spreadW} height={getPreviewBookSize(page).spreadH} thickness={pageThickness * 1.16} z={0} />
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
  const coverTexture = useCoverCanvasTexture(page, photoMap);

  useFrame((_, delta) => {
    if (!pivotRef.current || doneRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta * 1.1);
    const t = progressRef.current;
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    pivotRef.current.rotation.y = -Math.PI * 0.88 * eased;
    pivotRef.current.position.z = 0.10 + Math.sin(eased * Math.PI) * 0.14;
    if (progressRef.current >= 1) {
      doneRef.current = true;
      setTimeout(() => onDone?.(), 0);
    }
  });

  return (
    <group rotation={[-0.92, 0.0, 0]} position={[-coverW / 2, -0.16, 0.16]} ref={pivotRef}>
      <group position={[coverW / 2, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[coverW + spineW * 0.18, coverH, coverThickness]} />
          <meshStandardMaterial color={coverColor} roughness={0.82} />
        </mesh>
        <group position={[0, 0, coverThickness / 2 + 0.008]}>
          <TexturedPlane texture={coverTexture} width={coverW * 0.98} height={coverH * 0.98} z={0} />
        </group>
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
            <p>O projeto foi salvo no navegador para teste da V3.9.</p>
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
