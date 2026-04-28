import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as htmlToImage from "html-to-image";
import "./styles.css";

const VERSION = "5.8";
const SHEET = { w: 1040, h: 520 };
const PAGE_W = SHEET.w / 2;
const MIN_FRAME = 64;
const HANDLE = 14;
const SNAP = 8;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function svgPhoto({ id, w, h, title, bg1, bg2, accent, shape }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>
        <linearGradient id="g-${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${bg1}"/>
          <stop offset="1" stop-color="${bg2}"/>
        </linearGradient>
        <filter id="shadow-${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity=".24"/>
        </filter>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#g-${id})"/>
      <circle cx="${w * 0.12}" cy="${h * 0.16}" r="${Math.min(w, h) * 0.13}" fill="#ffffff" opacity=".18"/>
      <circle cx="${w * 0.84}" cy="${h * 0.22}" r="${Math.min(w, h) * 0.18}" fill="#ffffff" opacity=".10"/>
      ${shape === "mountain" ? `
        <path d="M0 ${h * 0.72} L${w * 0.26} ${h * 0.42} L${w * 0.45} ${h * 0.68} L${w * 0.62} ${h * 0.46} L${w} ${h * 0.78} L${w} ${h} L0 ${h} Z" fill="#ffffff" opacity=".42"/>
        <path d="M0 ${h * 0.84} C${w * 0.2} ${h * 0.72}, ${w * 0.36} ${h * 0.94}, ${w * 0.54} ${h * 0.8} S${w * 0.82} ${h * 0.72}, ${w} ${h * 0.86} L${w} ${h} L0 ${h} Z" fill="#ffffff" opacity=".24"/>
      ` : shape === "portrait" ? `
        <rect x="${w * 0.22}" y="${h * 0.15}" width="${w * 0.56}" height="${h * 0.7}" rx="${Math.min(w, h) * 0.08}" fill="#ffffff" opacity=".24" filter="url(#shadow-${id})"/>
        <circle cx="${w * 0.5}" cy="${h * 0.36}" r="${Math.min(w, h) * 0.11}" fill="#ffffff" opacity=".56"/>
        <path d="M${w * 0.27} ${h * 0.78} C${w * 0.34} ${h * 0.58}, ${w * 0.66} ${h * 0.58}, ${w * 0.73} ${h * 0.78}" fill="#ffffff" opacity=".46"/>
      ` : `
        <rect x="${w * 0.1}" y="${h * 0.18}" width="${w * 0.8}" height="${h * 0.58}" rx="${Math.min(w, h) * 0.04}" fill="#ffffff" opacity=".22" filter="url(#shadow-${id})"/>
        <circle cx="${w * 0.28}" cy="${h * 0.38}" r="${Math.min(w, h) * 0.08}" fill="#ffffff" opacity=".54"/>
        <path d="M${w * 0.1} ${h * 0.72} L${w * 0.34} ${h * 0.48} L${w * 0.48} ${h * 0.62} L${w * 0.64} ${h * 0.42} L${w * 0.9} ${h * 0.72} Z" fill="#ffffff" opacity=".44"/>
      `}
      <rect x="${w * 0.06}" y="${h * 0.06}" width="${w * 0.88}" height="${h * 0.88}" rx="${Math.min(w, h) * 0.04}" fill="none" stroke="${accent}" stroke-width="${Math.max(8, Math.min(w,h) * 0.025)}" opacity=".55"/>
      <text x="${w * 0.08}" y="${h * 0.92}" font-family="Arial, sans-serif" font-size="${Math.max(28, Math.min(w, h) * 0.09)}" font-weight="700" fill="#ffffff" opacity=".92">${title}</text>
      <text x="${w * 0.08}" y="${h * 0.92 + Math.max(24, Math.min(w, h) * 0.065)}" font-family="Arial, sans-serif" font-size="${Math.max(18, Math.min(w, h) * 0.05)}" fill="#ffffff" opacity=".76">${w}×${h} • miniatura inteira</text>
    </svg>`;

  return {
    id,
    name: title,
    w,
    h,
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  };
}

const DEMO_PHOTOS = [
  svgPhoto({ id: "demo-1", w: 1600, h: 900, title: "Horizontal 1", bg1: "#f97316", bg2: "#7c2d12", accent: "#fed7aa", shape: "landscape" }),
  svgPhoto({ id: "demo-2", w: 900, h: 1600, title: "Vertical 2", bg1: "#0ea5e9", bg2: "#075985", accent: "#bae6fd", shape: "portrait" }),
  svgPhoto({ id: "demo-3", w: 1200, h: 1200, title: "Quadrada 3", bg1: "#14b8a6", bg2: "#134e4a", accent: "#ccfbf1", shape: "mountain" }),
  svgPhoto({ id: "demo-4", w: 1800, h: 1050, title: "Horizontal 4", bg1: "#a855f7", bg2: "#3b0764", accent: "#f3e8ff", shape: "mountain" }),
  svgPhoto({ id: "demo-5", w: 850, h: 1500, title: "Vertical 5", bg1: "#ec4899", bg2: "#831843", accent: "#fce7f3", shape: "portrait" }),
  svgPhoto({ id: "demo-6", w: 1400, h: 920, title: "Horizontal 6", bg1: "#84cc16", bg2: "#365314", accent: "#ecfccb", shape: "landscape" }),
  svgPhoto({ id: "demo-7", w: 1000, h: 1000, title: "Quadrada 7", bg1: "#facc15", bg2: "#854d0e", accent: "#fef9c3", shape: "landscape" }),
  svgPhoto({ id: "demo-8", w: 920, h: 1600, title: "Vertical 8", bg1: "#64748b", bg2: "#0f172a", accent: "#e2e8f0", shape: "portrait" }),
];

function baseCoverScale(frame, photo) {
  if (!photo) return 1;
  return Math.max(frame.w / photo.w, frame.h / photo.h);
}

function layerMetrics(frame, photo, layer = { zoom: 1, offsetX: 0, offsetY: 0 }) {
  if (!photo) return { w: 0, h: 0, left: 0, top: 0, scale: 1 };
  const zoom = Math.max(1, layer.zoom || 1);
  const scale = baseCoverScale(frame, photo) * zoom;
  const w = photo.w * scale;
  const h = photo.h * scale;
  const maxX = Math.max(0, (w - frame.w) / 2);
  const maxY = Math.max(0, (h - frame.h) / 2);
  const offsetX = clamp(layer.offsetX || 0, -maxX, maxX);
  const offsetY = clamp(layer.offsetY || 0, -maxY, maxY);
  return {
    w,
    h,
    left: (frame.w - w) / 2 + offsetX,
    top: (frame.h - h) / 2 + offsetY,
    scale,
    maxX,
    maxY,
    offsetX,
    offsetY,
  };
}

function clampImageLayer(frame, photo, layer) {
  if (!photo) return { zoom: 1, offsetX: 0, offsetY: 0 };
  const zoom = Math.max(1, layer.zoom || 1);
  const tmp = layerMetrics(frame, photo, { ...layer, zoom });
  return {
    zoom,
    offsetX: clamp(layer.offsetX || 0, -tmp.maxX, tmp.maxX),
    offsetY: clamp(layer.offsetY || 0, -tmp.maxY, tmp.maxY),
  };
}

function newLayer() {
  return { zoom: 1, offsetX: 0, offsetY: 0 };
}

function createLayout(gapMm, photoIds = []) {
  const gap = 8 + gapMm * 6;
  const pad = 32;
  const leftW = PAGE_W - pad * 2;
  const rightX = PAGE_W + pad;
  const top = pad;
  const frames = [
    // Página esquerda: quadrado + vertical + horizontal
    { id: uid("frame"), x: pad, y: top, w: 210, h: 210, imageId: photoIds[0] || null, layer: newLayer() },
    { id: uid("frame"), x: pad + 210 + gap, y: top, w: leftW - 210 - gap, h: 330, imageId: photoIds[1] || null, layer: newLayer() },
    { id: uid("frame"), x: pad, y: top + 210 + gap, w: 210, h: 330 - 210 - gap, imageId: photoIds[2] || null, layer: newLayer() },
    { id: uid("frame"), x: pad, y: top + 330 + gap, w: leftW, h: SHEET.h - pad - (top + 330 + gap), imageId: photoIds[3] || null, layer: newLayer() },
    // Página direita: horizontal + quadrado + vertical + horizontal menor
    { id: uid("frame"), x: rightX, y: top, w: PAGE_W - pad * 2, h: 160, imageId: photoIds[4] || null, layer: newLayer() },
    { id: uid("frame"), x: rightX, y: top + 160 + gap, w: 190, h: 190, imageId: photoIds[5] || null, layer: newLayer() },
    { id: uid("frame"), x: rightX + 190 + gap, y: top + 160 + gap, w: PAGE_W - pad * 2 - 190 - gap, h: 300, imageId: photoIds[6] || null, layer: newLayer() },
    { id: uid("frame"), x: rightX, y: top + 160 + gap + 190 + gap, w: 190, h: 300 - 190 - gap, imageId: photoIds[7] || null, layer: newLayer() },
  ];
  return frames.map((f) => ({ ...f, w: Math.max(MIN_FRAME, f.w), h: Math.max(MIN_FRAME, f.h) }));
}

function normalizeFrame(frame) {
  return {
    ...frame,
    x: clamp(frame.x, 0, SHEET.w - frame.w),
    y: clamp(frame.y, 0, SHEET.h - frame.h),
    w: clamp(frame.w, MIN_FRAME, SHEET.w),
    h: clamp(frame.h, MIN_FRAME, SHEET.h),
  };
}

function App() {
  const sheetRef = useRef(null);
  const fileRef = useRef(null);
  const [photos, setPhotos] = useState(DEMO_PHOTOS);
  const [frames, setFrames] = useState(() => createLayout(2, DEMO_PHOTOS.map((p) => p.id)));
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [gapMm, setGapMm] = useState(2);
  const [showBleed, setShowBleed] = useState(true);
  const [guides, setGuides] = useState([]);
  const [interaction, setInteraction] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [texts, setTexts] = useState([
    { id: uid("text"), x: 610, y: 410, text: "Minha viagem inesquecível", size: 28, font: "Georgia", color: "#111827" },
  ]);

  const photoById = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);
  const selectedFrame = frames.find((f) => f.id === selectedId) || null;
  const selectedPhoto = selectedFrame ? photoById.get(selectedFrame.imageId) : null;
  const selectedText = texts.find((t) => t.id === selectedTextId) || null;

  function setFrameLayer(frameId, patch) {
    setFrames((old) =>
      old.map((frame) => {
        if (frame.id !== frameId) return frame;
        const photo = photoById.get(frame.imageId);
        const nextLayer = clampImageLayer(frame, photo, { ...frame.layer, ...patch });
        return { ...frame, layer: nextLayer };
      })
    );
  }

  function addDemoPhotos() {
    setPhotos(DEMO_PHOTOS);
    setFrames((old) =>
      old.map((frame, index) => ({
        ...frame,
        imageId: DEMO_PHOTOS[index % DEMO_PHOTOS.length].id,
        layer: newLayer(),
      }))
    );
  }

  function autoLayout() {
    const ids = photos.map((p) => p.id);
    setFrames(createLayout(gapMm, ids));
    setSelectedId(null);
    setSelectedTextId(null);
  }

  function handleFiles(files) {
    const list = [...files].filter((file) => file.type.startsWith("image/"));
    list.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setPhotos((old) => [
          ...old,
          { id: uid("photo"), name: file.name, src: url, w: img.naturalWidth || 1200, h: img.naturalHeight || 900 },
        ]);
      };
      img.src = url;
    });
  }

  function snapFrameMoving(draft, movingId) {
    const targetGuides = [];
    let next = { ...draft };
    const centers = [
      { type: "v", x: PAGE_W / 2, label: "Centro página esquerda" },
      { type: "v", x: PAGE_W, label: "Dobra central" },
      { type: "v", x: PAGE_W + PAGE_W / 2, label: "Centro página direita" },
      { type: "h", y: SHEET.h / 2, label: "Centro horizontal" },
    ];

    centers.forEach((guide) => {
      if (guide.type === "v") {
        const cx = next.x + next.w / 2;
        if (Math.abs(cx - guide.x) <= SNAP) {
          next.x = guide.x - next.w / 2;
          targetGuides.push({ type: "v", value: guide.x, label: guide.label });
        }
      } else {
        const cy = next.y + next.h / 2;
        if (Math.abs(cy - guide.y) <= SNAP) {
          next.y = guide.y - next.h / 2;
          targetGuides.push({ type: "h", value: guide.y, label: guide.label });
        }
      }
    });

    frames.forEach((other) => {
      if (other.id === movingId) return;
      const checks = [
        { type: "v", a: next.x, b: other.x, value: other.x },
        { type: "v", a: next.x + next.w, b: other.x + other.w, value: other.x + other.w },
        { type: "v", a: next.x + next.w / 2, b: other.x + other.w / 2, value: other.x + other.w / 2 },
        { type: "h", a: next.y, b: other.y, value: other.y },
        { type: "h", a: next.y + next.h, b: other.y + other.h, value: other.y + other.h },
        { type: "h", a: next.y + next.h / 2, b: other.y + other.h / 2, value: other.y + other.h / 2 },
      ];
      checks.forEach((c) => {
        if (Math.abs(c.a - c.b) <= SNAP) {
          if (c.type === "v") {
            const delta = c.b - c.a;
            next.x += delta;
            targetGuides.push({ type: "v", value: c.value, label: "Alinhado" });
          } else {
            const delta = c.b - c.a;
            next.y += delta;
            targetGuides.push({ type: "h", value: c.value, label: "Alinhado" });
          }
        }
      });
    });

    setGuides(targetGuides);
    return normalizeFrame(next);
  }

  function sheetPoint(event) {
    const rect = sheetRef.current.getBoundingClientRect();
    const scaleX = SHEET.w / rect.width;
    const scaleY = SHEET.h / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function startImageDrag(event, frame) {
    if (!frame.imageId) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(frame.id);
    setSelectedTextId(null);
    const point = sheetPoint(event);
    setInteraction({
      kind: "image",
      id: frame.id,
      startX: point.x,
      startY: point.y,
      originLayer: { ...frame.layer },
    });
  }

  function startFrameMove(event, frame) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(frame.id);
    setSelectedTextId(null);
    const point = sheetPoint(event);
    setInteraction({
      kind: "frame",
      id: frame.id,
      startX: point.x,
      startY: point.y,
      origin: { ...frame },
    });
  }

  function startResize(event, frame, handle) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(frame.id);
    setSelectedTextId(null);
    const point = sheetPoint(event);
    setInteraction({
      kind: "resize",
      id: frame.id,
      handle,
      startX: point.x,
      startY: point.y,
      origin: { ...frame },
    });
  }

  function startTextMove(event, text) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedTextId(text.id);
    setSelectedId(null);
    const point = sheetPoint(event);
    setInteraction({ kind: "text", id: text.id, startX: point.x, startY: point.y, origin: { ...text } });
  }

  useEffect(() => {
    function onMove(event) {
      if (!interaction) return;
      const point = sheetPoint(event);
      const dx = point.x - interaction.startX;
      const dy = point.y - interaction.startY;

      if (interaction.kind === "image") {
        setFrames((old) =>
          old.map((frame) => {
            if (frame.id !== interaction.id) return frame;
            const photo = photoById.get(frame.imageId);
            const layer = clampImageLayer(frame, photo, {
              ...frame.layer,
              offsetX: interaction.originLayer.offsetX + dx,
              offsetY: interaction.originLayer.offsetY + dy,
            });
            return { ...frame, layer };
          })
        );
      }

      if (interaction.kind === "frame") {
        setFrames((old) =>
          old.map((frame) => {
            if (frame.id !== interaction.id) return frame;
            const moved = snapFrameMoving({ ...interaction.origin, x: interaction.origin.x + dx, y: interaction.origin.y + dy }, frame.id);
            const photo = photoById.get(frame.imageId);
            return { ...moved, layer: clampImageLayer(moved, photo, frame.layer) };
          })
        );
      }

      if (interaction.kind === "resize") {
        setFrames((old) =>
          old.map((frame) => {
            if (frame.id !== interaction.id) return frame;
            let next = { ...interaction.origin };
            if (interaction.handle.includes("e")) next.w = interaction.origin.w + dx;
            if (interaction.handle.includes("s")) next.h = interaction.origin.h + dy;
            if (interaction.handle.includes("w")) {
              next.x = interaction.origin.x + dx;
              next.w = interaction.origin.w - dx;
            }
            if (interaction.handle.includes("n")) {
              next.y = interaction.origin.y + dy;
              next.h = interaction.origin.h - dy;
            }
            if (next.w < MIN_FRAME) {
              if (interaction.handle.includes("w")) next.x -= MIN_FRAME - next.w;
              next.w = MIN_FRAME;
            }
            if (next.h < MIN_FRAME) {
              if (interaction.handle.includes("n")) next.y -= MIN_FRAME - next.h;
              next.h = MIN_FRAME;
            }
            next = normalizeFrame(next);
            const photo = photoById.get(frame.imageId);
            return { ...next, layer: clampImageLayer(next, photo, frame.layer) };
          })
        );
      }

      if (interaction.kind === "text") {
        setTexts((old) =>
          old.map((text) =>
            text.id === interaction.id
              ? {
                  ...text,
                  x: clamp(interaction.origin.x + dx, 0, SHEET.w - 40),
                  y: clamp(interaction.origin.y + dy, 0, SHEET.h - 20),
                }
              : text
          )
        );
      }
    }

    function onUp() {
      if (interaction) {
        setInteraction(null);
        setGuides([]);
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [interaction, frames, photoById]);

  function handleDropOnFrame(event, targetId) {
    event.preventDefault();
    event.stopPropagation();
    const photoId = event.dataTransfer.getData("photo-id");
    const sourceFrameId = event.dataTransfer.getData("frame-id");

    if (photoId) {
      setFrames((old) =>
        old.map((frame) =>
          frame.id === targetId ? { ...frame, imageId: photoId, layer: newLayer() } : frame
        )
      );
      setSelectedId(targetId);
      setSelectedTextId(null);
      return;
    }

    if (sourceFrameId && sourceFrameId !== targetId) {
      setFrames((old) => {
        const source = old.find((f) => f.id === sourceFrameId);
        const target = old.find((f) => f.id === targetId);
        if (!source || !target) return old;
        return old.map((frame) => {
          if (frame.id === sourceFrameId) return { ...frame, imageId: target.imageId, layer: newLayer() };
          if (frame.id === targetId) return { ...frame, imageId: source.imageId, layer: newLayer() };
          return frame;
        });
      });
      setSelectedId(targetId);
      setSelectedTextId(null);
    }
  }

  function addFrame() {
    const frame = { id: uid("frame"), x: 560, y: 80, w: 210, h: 150, imageId: photos[0]?.id || null, layer: newLayer() };
    setFrames((old) => [...old, frame]);
    setSelectedId(frame.id);
    setSelectedTextId(null);
  }

  function deleteSelected() {
    if (selectedFrame) {
      setFrames((old) => old.filter((f) => f.id !== selectedFrame.id));
      setSelectedId(null);
    }
    if (selectedText) {
      setTexts((old) => old.filter((t) => t.id !== selectedText.id));
      setSelectedTextId(null);
    }
  }

  function addText() {
    const text = { id: uid("text"), x: 110, y: 420, text: "Digite seu texto", size: 28, font: "Arial", color: "#111827" };
    setTexts((old) => [...old, text]);
    setSelectedTextId(text.id);
    setSelectedId(null);
  }

  async function exportJpg() {
    if (!sheetRef.current) return;
    const node = sheetRef.current;
    const oldPreview = previewMode;
    setPreviewMode(true);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const dataUrl = await htmlToImage.toJpeg(node, { quality: 0.95, pixelRatio: 2, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = "diagramador-picmimos-v5-8-preview.jpg";
    link.href = dataUrl;
    link.click();
    setPreviewMode(oldPreview);
  }

  function updateSelectedText(patch) {
    if (!selectedText) return;
    setTexts((old) => old.map((t) => (t.id === selectedText.id ? { ...t, ...patch } : t)));
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <strong>Diagramador Picmimos V{VERSION}</strong>
          <span>Meia Capa Fotográfica • lâmina dupla 20×20 exemplo visual</span>
        </div>
        <div className="top-actions">
          <button onClick={() => setShowBleed((v) => !v)} className={showBleed ? "active" : ""}>Corte 3 mm (visual)</button>
          <button onClick={() => setPreviewMode((v) => !v)}>{previewMode ? "Voltar edição" : "Pré-visualizar"}</button>
          <button onClick={exportJpg}>Exportar JPG teste</button>
          <button className="primary">Salvar projeto</button>
        </div>
      </header>

      <main className="workspace">
        <aside className="panel photo-panel">
          <div className="panel-title">
            <h2>Fotos</h2>
            <button onClick={addDemoPhotos}>Fotos demo</button>
          </div>
          <button className="wide" onClick={() => fileRef.current.click()}>Enviar fotos</button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
          <p className="hint">Miniaturas da esquerda aparecem inteiras. Arraste uma foto para qualquer quadro, mesmo horizontal em quadro vertical.</p>
          <div className="photo-grid">
            {photos.map((photo) => (
              <div
                className="photo-thumb"
                key={photo.id}
                draggable
                onDragStart={(event) => event.dataTransfer.setData("photo-id", photo.id)}
                title={`${photo.name} • ${photo.w}×${photo.h}`}
              >
                <img src={photo.src} alt={photo.name} />
                <small>{photo.name}</small>
              </div>
            ))}
          </div>
        </aside>

        <section className="canvas-column">
          <div className="toolbar">
            <button onClick={autoLayout}>Montar automático</button>
            <label>
              Espaço entre fotos
              <select value={gapMm} onChange={(e) => setGapMm(Number(e.target.value))}>
                {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} mm</option>)}
              </select>
            </label>
            <button onClick={addFrame}>+ Quadro</button>
            <button onClick={addText}>+ Texto</button>
            <button onClick={deleteSelected} disabled={!selectedFrame && !selectedText}>Excluir selecionado</button>
          </div>

          <div className="sheet-wrap">
            <div
              ref={sheetRef}
              className={`sheet ${previewMode ? "preview-mode" : ""}`}
              style={{ width: SHEET.w, height: SHEET.h }}
              onPointerDown={() => {
                setSelectedId(null);
                setSelectedTextId(null);
              }}
            >
              <div className="page left-page" />
              <div className="page right-page" />
              <div className="static-guide fold" />
              <div className="static-guide left-center" />
              <div className="static-guide right-center" />
              <div className="static-guide horizontal-center" />
              {showBleed && <div className="bleed-line" />}
              {guides.map((guide, index) => (
                <div key={`${guide.type}-${guide.value}-${index}`} className={`snap-guide ${guide.type}`} style={guide.type === "v" ? { left: guide.value } : { top: guide.value }} />
              ))}

              {frames.map((frame) => {
                const photo = photoById.get(frame.imageId);
                const metrics = layerMetrics(frame, photo, frame.layer);
                const selected = selectedFrame?.id === frame.id;
                return (
                  <div
                    key={frame.id}
                    className={`frame-shell ${selected ? "selected" : ""}`}
                    style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setSelectedId(frame.id);
                      setSelectedTextId(null);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDropOnFrame(event, frame.id)}
                  >
                    {selected && photo && !previewMode && (
                      <img
                        className="overflow-preview"
                        src={photo.src}
                        alt="Prévia da imagem inteira"
                        style={{ left: metrics.left, top: metrics.top, width: metrics.w, height: metrics.h }}
                      />
                    )}
                    <div className="frame-mask" onPointerDown={(event) => startImageDrag(event, frame)}>
                      {photo ? (
                        <img
                          className="frame-image"
                          src={photo.src}
                          alt={photo.name}
                          draggable={false}
                          style={{ left: metrics.left, top: metrics.top, width: metrics.w, height: metrics.h }}
                        />
                      ) : (
                        <div className="empty-frame">Arraste uma foto aqui</div>
                      )}
                    </div>

                    {!previewMode && (
                      <>
                        <button className="move-chip" onPointerDown={(event) => startFrameMove(event, frame)}>Mover</button>
                        {photo && (
                          <button
                            className="swap-chip"
                            draggable
                            onDragStart={(event) => {
                              event.stopPropagation();
                              event.dataTransfer.setData("frame-id", frame.id);
                            }}
                            title="Arraste este botão até outro quadro para trocar as fotos"
                          >
                            Trocar foto
                          </button>
                        )}
                        {selected && ["nw", "ne", "sw", "se"].map((handle) => (
                          <span
                            key={handle}
                            className={`resize-handle ${handle}`}
                            onPointerDown={(event) => startResize(event, frame, handle)}
                          />
                        ))}
                      </>
                    )}
                  </div>
                );
              })}

              {texts.map((text) => (
                <div
                  key={text.id}
                  className={`text-box ${selectedTextId === text.id ? "selected" : ""}`}
                  style={{ left: text.x, top: text.y, fontSize: text.size, fontFamily: text.font, color: text.color }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    setSelectedTextId(text.id);
                    setSelectedId(null);
                  }}
                >
                  {!previewMode && <button className="text-move" onPointerDown={(event) => startTextMove(event, text)}>Mover texto</button>}
                  <div
                    className="editable-text"
                    contentEditable={!previewMode}
                    suppressContentEditableWarning
                    onInput={(event) => updateSelectedText({ text: event.currentTarget.textContent || "" })}
                  >
                    {text.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="panel controls-panel">
          <h2>Ajustes</h2>
          {selectedFrame ? (
            <div className="control-stack">
              <div className="selected-card">
                <strong>Quadro selecionado</strong>
                <span>{Math.round(selectedFrame.w)}×{Math.round(selectedFrame.h)} px</span>
              </div>
              {selectedPhoto ? (
                <>
                  <label>
                    Zoom
                    <input
                      type="range"
                      min="100"
                      max="300"
                      value={Math.round((selectedFrame.layer.zoom || 1) * 100)}
                      onChange={(event) => setFrameLayer(selectedFrame.id, { zoom: Number(event.target.value) / 100 })}
                    />
                    <small>{Math.round((selectedFrame.layer.zoom || 1) * 100)}%</small>
                  </label>
                  <label>
                    Horizontal
                    <input
                      type="range"
                      min={-Math.round(layerMetrics(selectedFrame, selectedPhoto, selectedFrame.layer).maxX)}
                      max={Math.round(layerMetrics(selectedFrame, selectedPhoto, selectedFrame.layer).maxX)}
                      value={Math.round(selectedFrame.layer.offsetX || 0)}
                      onChange={(event) => setFrameLayer(selectedFrame.id, { offsetX: Number(event.target.value) })}
                    />
                    <small>{Math.round(selectedFrame.layer.offsetX || 0)} px</small>
                  </label>
                  <label>
                    Vertical
                    <input
                      type="range"
                      min={-Math.round(layerMetrics(selectedFrame, selectedPhoto, selectedFrame.layer).maxY)}
                      max={Math.round(layerMetrics(selectedFrame, selectedPhoto, selectedFrame.layer).maxY)}
                      value={Math.round(selectedFrame.layer.offsetY || 0)}
                      onChange={(event) => setFrameLayer(selectedFrame.id, { offsetY: Number(event.target.value) })}
                    />
                    <small>{Math.round(selectedFrame.layer.offsetY || 0)} px</small>
                  </label>
                  <button className="wide" onClick={() => setFrameLayer(selectedFrame.id, { zoom: 1, offsetX: 0, offsetY: 0 })}>Centralizar imagem</button>
                  <p className="hint strong">Arraste a foto dentro do quadro para enquadrar. Use “Mover” apenas para deslocar o container.</p>
                </>
              ) : (
                <p className="hint">Arraste uma foto da lateral esquerda para este quadro.</p>
              )}
            </div>
          ) : selectedText ? (
            <div className="control-stack">
              <div className="selected-card">
                <strong>Texto selecionado</strong>
                <span>Edite abaixo ou direto no canvas</span>
              </div>
              <label>
                Texto
                <textarea value={selectedText.text} onChange={(e) => updateSelectedText({ text: e.target.value })} rows="4" />
              </label>
              <label>
                Tamanho
                <input type="range" min="12" max="72" value={selectedText.size} onChange={(e) => updateSelectedText({ size: Number(e.target.value) })} />
                <small>{selectedText.size}px</small>
              </label>
              <label>
                Fonte
                <select value={selectedText.font} onChange={(e) => updateSelectedText({ font: e.target.value })}>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times</option>
                  <option value="Trebuchet MS">Trebuchet</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </label>
              <label>
                Cor
                <input type="color" value={selectedText.color} onChange={(e) => updateSelectedText({ color: e.target.value })} />
              </label>
            </div>
          ) : (
            <div className="empty-controls">
              <strong>Nada selecionado</strong>
              <p>Selecione um quadro para ajustar enquadramento, zoom, horizontal e vertical. Selecione um texto para editar fonte, tamanho e cor.</p>
            </div>
          )}

          <div className="legend">
            <h3>Como usar</h3>
            <p><b>Foto:</b> arraste dentro do quadro.</p>
            <p><b>Quadro:</b> arraste pelo botão Mover.</p>
            <p><b>Resize:</b> use as bolinhas amarelas.</p>
            <p><b>Troca:</b> arraste “Trocar foto” para outro quadro.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
