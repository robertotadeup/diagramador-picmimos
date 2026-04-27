import React, { useEffect, useMemo, useRef, useState } from "react";

const MAX_PHOTOS_PER_SPREAD = 20;
const MIN_FRAME_SIZE = 6;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function pct(value) {
  return Math.round(value * 100) / 100;
}

function unique(ids) {
  return Array.from(new Set(ids)).slice(0, MAX_PHOTOS_PER_SPREAD);
}

function buildGrid(count, cols, rows, margin = 3.2, gap = 1.4) {
  const cellW = (100 - margin * 2 - gap * (cols - 1)) / cols;
  const cellH = (100 - margin * 2 - gap * (rows - 1)) / rows;
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      x: pct(margin + col * (cellW + gap)),
      y: pct(margin + row * (cellH + gap)),
      w: pct(cellW),
      h: pct(cellH),
    };
  });
}

function bestGrid(count) {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 2, rows: 1 };
  const cols = Math.ceil(Math.sqrt(count * 2));
  const rows = Math.ceil(count / cols);
  return { cols, rows };
}

function autoGrid(count) {
  const { cols, rows } = bestGrid(count);
  return buildGrid(count, cols, rows);
}

function heroLeft(count) {
  if (count <= 1) return [{ x: 9, y: 8, w: 82, h: 84 }];
  if (count === 2) return [{ x: 3, y: 8, w: 46, h: 84 }, { x: 51, y: 8, w: 46, h: 84 }];
  const heroW = count <= 6 ? 54 : 43;
  const rest = count - 1;
  const cols = rest <= 3 ? 1 : rest <= 8 ? 2 : 3;
  const rows = Math.ceil(rest / cols);
  const margin = 3.2;
  const gap = 1.4;
  const rightX = margin * 2 + heroW;
  const rightW = 100 - rightX - margin;
  const cellW = (rightW - gap * (cols - 1)) / cols;
  const cellH = (88 - gap * (rows - 1)) / rows;
  const slots = [{ x: margin, y: 6, w: heroW, h: 88 }];
  for (let i = 0; i < rest; i += 1) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    slots.push({ x: pct(rightX + col * (cellW + gap)), y: pct(6 + row * (cellH + gap)), w: pct(cellW), h: pct(cellH) });
  }
  return slots;
}

function heroRight(count) {
  return heroLeft(count).map((slot) => ({ ...slot, x: pct(100 - slot.x - slot.w) })).reverse();
}

function editorialStrip(count) {
  if (count <= 3) return autoGrid(count);
  const topCount = Math.min(3, Math.ceil(count / 3));
  const bottomCount = count - topCount;
  const top = buildGrid(topCount, topCount, 1, 3.2, 1.4).map((slot) => ({ ...slot, y: 5, h: 34 }));
  const { cols, rows } = bestGrid(bottomCount);
  const bottom = buildGrid(bottomCount, cols, rows, 3.2, 1.4).map((slot) => ({ ...slot, y: pct(45 + (slot.y - 3.2) * 0.55), h: pct(slot.h * 0.55) }));
  return [...top, ...bottom].slice(0, count);
}

function mosaic(count) {
  if (count <= 4) return autoGrid(count);
  const slots = autoGrid(count);
  if (count >= 7) {
    const hero = Math.floor(count / 2);
    slots[hero] = {
      ...slots[hero],
      w: pct(Math.min(slots[hero].w * 1.55, 29)),
      h: pct(Math.min(slots[hero].h * 1.35, 42)),
    };
  }
  return slots;
}

function layoutsForCount(count) {
  const base = [
    { id: `grid-${count}`, name: "Grade limpa", slots: autoGrid(count) },
    { id: `hero-left-${count}`, name: "Destaque esquerda", slots: heroLeft(count) },
    { id: `hero-right-${count}`, name: "Destaque direita", slots: heroRight(count) },
    { id: `strip-${count}`, name: "Faixa editorial", slots: editorialStrip(count) },
    { id: `mosaic-${count}`, name: "Mosaico dinâmico", slots: mosaic(count) },
  ];

  if (count === 1) base.push({ id: "luxo-1", name: "Respiro luxo", slots: [{ x: 14, y: 10, w: 72, h: 80 }] });
  if (count === 2) base.push({ id: "editorial-2", name: "Assimétrico", slots: [{ x: 4, y: 9, w: 58, h: 82 }, { x: 66, y: 19, w: 30, h: 62 }] });
  if (count === 3) base.push({ id: "trip-3", name: "Tríptico", slots: [{ x: 3, y: 8, w: 30, h: 84 }, { x: 35, y: 8, w: 30, h: 84 }, { x: 67, y: 8, w: 30, h: 84 }] });
  if (count === 4) base.push({ id: "classic-4", name: "Clássico 2x2", slots: [{ x: 3, y: 6, w: 45, h: 42 }, { x: 52, y: 6, w: 45, h: 42 }, { x: 3, y: 52, w: 45, h: 42 }, { x: 52, y: 52, w: 45, h: 42 }] });

  return base;
}

const layoutsByCount = Object.fromEntries(Array.from({ length: MAX_PHOTOS_PER_SPREAD }, (_, i) => [i + 1, layoutsForCount(i + 1)]));

const demoImages = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504151932400-72d4384f04b3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1496843916299-590492c751f4?auto=format&fit=crop&w=900&q=80"
];

function makePhotos(urls, prefix = "foto") {
  return urls.map((src, index) => ({ id: uid(prefix), src, name: `${prefix}-${index + 1}` }));
}

function createBlankSpread(index = 0) {
  return {
    id: uid("spread"),
    title: `Lâmina ${index + 1}`,
    targetPhotoCount: 0,
    layoutVariantIndex: 0,
    spreadPhotoIds: [],
    frames: [],
  };
}

function framesFromLayout(layout, photoIds, previousFrames = []) {
  const previousByPhoto = new Map(previousFrames.filter((f) => f.photoId).map((f) => [f.photoId, f]));
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
      z: index + 1,
      cropX: previous?.cropX || 0,
      cropY: previous?.cropY || 0,
      cropScale: previous?.cropScale || 1,
    };
  });
}

function cloneSpread(spread, index) {
  return {
    ...spread,
    id: uid("spread"),
    title: `Lâmina ${index + 1}`,
    frames: spread.frames.map((frame) => ({ ...frame, id: uid("frame") })),
  };
}

function syncPhotoIds(frames) {
  return frames.map((frame) => frame.photoId).filter(Boolean);
}

function getPointerPct(event, element) {
  const rect = element.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  };
}

function pointInFrame(point, frame) {
  return point.x >= frame.x && point.x <= frame.x + frame.w && point.y >= frame.y && point.y <= frame.y + frame.h;
}

function resizeFrame(frame, handle, dx, dy) {
  let next = { ...frame };
  if (handle.includes("e")) next.w = frame.w + dx;
  if (handle.includes("s")) next.h = frame.h + dy;
  if (handle.includes("w")) {
    next.x = frame.x + dx;
    next.w = frame.w - dx;
  }
  if (handle.includes("n")) {
    next.y = frame.y + dy;
    next.h = frame.h - dy;
  }
  if (next.w < MIN_FRAME_SIZE) {
    if (handle.includes("w")) next.x = frame.x + frame.w - MIN_FRAME_SIZE;
    next.w = MIN_FRAME_SIZE;
  }
  if (next.h < MIN_FRAME_SIZE) {
    if (handle.includes("n")) next.y = frame.y + frame.h - MIN_FRAME_SIZE;
    next.h = MIN_FRAME_SIZE;
  }
  return {
    ...next,
    x: clamp(next.x, -50, 150),
    y: clamp(next.y, -50, 150),
    w: clamp(next.w, MIN_FRAME_SIZE, 150),
    h: clamp(next.h, MIN_FRAME_SIZE, 150),
  };
}

function swapFramePhotos(frames, aId, bId) {
  const a = frames.find((f) => f.id === aId);
  const b = frames.find((f) => f.id === bId);
  if (!a || !b) return frames;
  return frames.map((frame) => {
    if (frame.id === aId) return { ...frame, photoId: b.photoId, cropX: b.cropX || 0, cropY: b.cropY || 0, cropScale: b.cropScale || 1 };
    if (frame.id === bId) return { ...frame, photoId: a.photoId, cropX: a.cropX || 0, cropY: a.cropY || 0, cropScale: a.cropScale || 1 };
    return frame;
  });
}

function Button({ children, onClick, className = "", disabled = false, type = "button" }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`btn ${className}`}>{children}</button>;
}

function Icon({ children }) {
  return <span className="icon">{children}</span>;
}

function PhotoImage({ photo, frame, className = "" }) {
  if (!photo) return <div className={`photo-empty ${className}`}>▧</div>;
  const scale = frame.cropScale || 1;
  const x = frame.cropX || 0;
  const y = frame.cropY || 0;
  return (
    <img
      src={photo.src}
      alt={photo.name || "Foto"}
      draggable="false"
      className={`photo-img ${className}`}
      style={{
        width: `${100 * scale}%`,
        height: `${100 * scale}%`,
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) translate(${x}%, ${y}%)`,
      }}
    />
  );
}

function Frame({ frame, photo, selected, dropTarget, onSelect, onStartResize, onStartMove, onStartSwap }) {
  const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
  return (
    <div
      className={`frame ${selected ? "selected" : ""} ${dropTarget ? "drop-target" : ""}`}
      style={{ left: `${frame.x}%`, top: `${frame.y}%`, width: `${frame.w}%`, height: `${frame.h}%`, zIndex: selected ? 20 : frame.z }}
    >
      <button className="frame-photo" onClick={onSelect} onPointerDown={onStartMove} title="Clique para selecionar. Arraste para mover o quadro.">
        <PhotoImage photo={photo} frame={frame} />
      </button>
      <button className="swap-btn" onPointerDown={onStartSwap} title="Arraste para outra foto para trocar">↔</button>
      {selected && handles.map((handle) => (
        <button
          key={handle}
          className={`resize-handle handle-${handle}`}
          onPointerDown={(event) => onStartResize(handle, event)}
          title="Arraste para redimensionar"
        />
      ))}
    </div>
  );
}

function CropPanel({ frame, photo, onChange, onCenter, onRemove, onUploadNew }) {
  const stageRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const onMove = (event) => {
      const drag = dragRef.current;
      const rect = stageRef.current?.getBoundingClientRect();
      if (!drag || !rect) return;
      const dx = ((event.clientX - drag.startX) / rect.width) * 100;
      const dy = ((event.clientY - drag.startY) / rect.height) * 100;
      onChange({ cropX: clamp(drag.cropX + dx, -80, 80), cropY: clamp(drag.cropY + dy, -80, 80) });
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onChange]);

  if (!frame) {
    return (
      <div className="empty-panel">
        Clique em uma foto da lâmina para ajustar enquadramento, zoom e posição.
      </div>
    );
  }

  const aspect = Math.max(frame.w / Math.max(frame.h, 1), 0.25);

  return (
    <div className="crop-panel">
      <div className="panel-title">Enquadramento</div>
      <div className="panel-subtitle">A imagem aparece inteira. Arraste dentro da caixa para reposicionar sem quebrar o layout.</div>
      <div
        ref={stageRef}
        className="crop-stage"
        onPointerDown={(event) => {
          event.preventDefault();
          dragRef.current = { startX: event.clientX, startY: event.clientY, cropX: frame.cropX || 0, cropY: frame.cropY || 0 };
        }}
      >
        {photo ? (
          <img
            src={photo.src}
            alt="Prévia da foto inteira"
            draggable="false"
            className="crop-full-img"
            style={{ transform: `translate(-50%, -50%) translate(${frame.cropX || 0}%, ${frame.cropY || 0}%) scale(${frame.cropScale || 1})` }}
          />
        ) : <div className="photo-empty">▧</div>}
        <div className="crop-mask" style={aspect >= 1 ? { width: "82%", aspectRatio: `${aspect}` } : { height: "82%", aspectRatio: `${aspect}` }}>
          <span>área visível</span>
        </div>
      </div>
      <label className="range-label">Zoom: {(frame.cropScale || 1).toFixed(2)}x</label>
      <input
        className="range"
        type="range"
        min="0.6"
        max="3"
        step="0.01"
        value={frame.cropScale || 1}
        onChange={(event) => onChange({ cropScale: Number(event.target.value) })}
      />
      <div className="panel-actions two">
        <Button onClick={onCenter}>Centralizar</Button>
        <Button onClick={onUploadNew}>Trocar foto</Button>
        <Button onClick={onRemove} className="danger">Remover quadro</Button>
      </div>
    </div>
  );
}

function LayoutPreview({ layout, active, onClick }) {
  return (
    <button className={`layout-card ${active ? "active" : ""}`} onClick={onClick}>
      <div className="layout-thumb">
        <div className="center-line" />
        {layout.slots.map((slot, index) => (
          <span key={index} style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%` }} />
        ))}
      </div>
      <strong>{layout.name}</strong>
    </button>
  );
}

function SpreadMini({ spread, index, active, photoMap, onClick }) {
  return (
    <button className={`spread-mini ${active ? "active" : ""}`} onClick={onClick}>
      <div className="spread-mini-canvas">
        <div className="center-line" />
        {spread.frames.map((frame) => {
          const photo = photoMap.get(frame.photoId);
          return <div key={frame.id} className="mini-frame" style={{ left: `${frame.x}%`, top: `${frame.y}%`, width: `${frame.w}%`, height: `${frame.h}%` }}>{photo ? <img src={photo.src} alt="" /> : null}</div>;
        })}
        {!spread.frames.length && <div className="mini-empty" />}
      </div>
      <div className="mini-label"><span>Lâmina {index + 1}</span><b>{spread.frames.length}</b></div>
    </button>
  );
}

export default function App() {
  const [albumName, setAlbumName] = useState("Álbum Picmimos 20x20");
  const [photoLibrary, setPhotoLibrary] = useState([]);
  const [spreads, setSpreads] = useState([createBlankSpread(0)]);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const [lastClickedPhotoIndex, setLastClickedPhotoIndex] = useState(null);
  const [dragPhotoIds, setDragPhotoIds] = useState([]);
  const [interaction, setInteraction] = useState(null);
  const [swap, setSwap] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [rightTab, setRightTab] = useState("album");
  const [bottomFilter, setBottomFilter] = useState("all");

  const spreadRef = useRef(null);
  const uploadRef = useRef(null);
  const addRef = useRef(null);
  const replaceSelectedRef = useRef(null);

  const currentSpread = spreads[currentSpreadIndex] || spreads[0];
  const frames = currentSpread.frames;
  const photoMap = useMemo(() => new Map(photoLibrary.map((photo) => [photo.id, photo])), [photoLibrary]);
  const usedPhotoIds = useMemo(() => new Set(spreads.flatMap((spread) => spread.frames.map((frame) => frame.photoId).filter(Boolean))), [spreads]);
  const selectedFrame = frames.find((frame) => frame.id === selectedFrameId) || null;
  const selectedFramePhoto = selectedFrame?.photoId ? photoMap.get(selectedFrame.photoId) : null;
  const layoutOptions = currentSpread.targetPhotoCount ? layoutsByCount[currentSpread.targetPhotoCount] || [] : [];

  const updateCurrentSpread = (updater) => {
    setSpreads((current) => current.map((spread, index) => {
      if (index !== currentSpreadIndex) return spread;
      return typeof updater === "function" ? updater(spread) : { ...spread, ...updater };
    }));
  };

  const renameSpreads = (list) => list.map((spread, index) => ({ ...spread, title: `Lâmina ${index + 1}` }));

  const buildSpread = (photoIds, variantIndex = 0, preserveFrames = frames) => {
    const cleanIds = unique(photoIds);
    if (!cleanIds.length) return;
    const layouts = layoutsByCount[cleanIds.length] || layoutsByCount[1];
    const safeIndex = ((variantIndex % layouts.length) + layouts.length) % layouts.length;
    const nextFrames = framesFromLayout(layouts[safeIndex], cleanIds, preserveFrames);
    updateCurrentSpread({
      targetPhotoCount: cleanIds.length,
      layoutVariantIndex: safeIndex,
      spreadPhotoIds: cleanIds,
      frames: nextFrames,
    });
    setSelectedFrameId(nextFrames[0]?.id || null);
    setRightTab("photo");
  };

  const changeLayout = (delta) => {
    if (!currentSpread.spreadPhotoIds.length) return;
    buildSpread(currentSpread.spreadPhotoIds, currentSpread.layoutVariantIndex + delta, frames);
  };

  useEffect(() => {
    const onKey = (event) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)) return;
      if (event.key === "ArrowRight") changeLayout(1);
      if (event.key === "ArrowLeft") changeLayout(-1);
      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedFrameId) removeSelectedFrame();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!interaction) return;
    const onMove = (event) => {
      const rect = spreadRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = ((event.clientX - interaction.startX) / rect.width) * 100;
      const dy = ((event.clientY - interaction.startY) / rect.height) * 100;
      if (interaction.type === "resize") {
        const next = resizeFrame(interaction.frame, interaction.handle, dx, dy);
        updateCurrentSpread((spread) => ({
          ...spread,
          frames: spread.frames.map((frame) => frame.id === interaction.frame.id ? next : frame),
        }));
      }
      if (interaction.type === "move") {
        const next = {
          ...interaction.frame,
          x: pct(clamp(interaction.frame.x + dx, -50, 150)),
          y: pct(clamp(interaction.frame.y + dy, -50, 150)),
        };
        updateCurrentSpread((spread) => ({
          ...spread,
          frames: spread.frames.map((frame) => frame.id === interaction.frame.id ? next : frame),
        }));
      }
    };
    const onUp = () => setInteraction(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [interaction]);

  useEffect(() => {
    if (!swap) return;
    const onMove = (event) => {
      const element = spreadRef.current;
      if (!element) return;
      const point = getPointerPct(event, element);
      const target = frames.filter((frame) => frame.id !== swap.sourceId && pointInFrame(point, frame)).sort((a, b) => (b.z || 0) - (a.z || 0))[0];
      setDropTargetId(target?.id || null);
      setSwap((current) => current ? { ...current, x: event.clientX, y: event.clientY } : null);
    };
    const onUp = (event) => {
      const element = spreadRef.current;
      if (element) {
        const point = getPointerPct(event, element);
        const target = frames.filter((frame) => frame.id !== swap.sourceId && pointInFrame(point, frame)).sort((a, b) => (b.z || 0) - (a.z || 0))[0];
        if (target) {
          const swapped = swapFramePhotos(frames, swap.sourceId, target.id);
          updateCurrentSpread({ frames: swapped, spreadPhotoIds: syncPhotoIds(swapped) });
          setSelectedFrameId(target.id);
        }
      }
      setSwap(null);
      setDropTargetId(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [swap, frames]);

  const readFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((file) => file.type?.startsWith("image/"));
    if (!files.length) return [];
    return Promise.all(files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ id: uid("user"), src: reader.result, name: file.name });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));
  };

  const addPhotos = async (files) => {
    const photos = await readFiles(files);
    if (!photos.length) return;
    setPhotoLibrary((current) => [...current, ...photos]);
    if (!selectedPhotoIds.length) setSelectedPhotoIds(photos.slice(0, Math.min(photos.length, 4)).map((photo) => photo.id));
  };

  const replaceSelectedFramePhoto = async (files) => {
    const photos = await readFiles(files);
    if (!photos.length || !selectedFrameId) return;
    setPhotoLibrary((current) => [...current, ...photos]);
    updateCurrentSpread((spread) => {
      const nextFrames = spread.frames.map((frame) => frame.id === selectedFrameId ? { ...frame, photoId: photos[0].id, cropX: 0, cropY: 0, cropScale: 1 } : frame);
      return { ...spread, frames: nextFrames, spreadPhotoIds: syncPhotoIds(nextFrames) };
    });
  };

  const loadDemo = () => {
    const demos = makePhotos(demoImages, "demo");
    setPhotoLibrary(demos);
    setSelectedPhotoIds(demos.slice(0, 4).map((photo) => photo.id));
  };

  const photoClick = (photoId, index, event) => {
    if (event.shiftKey && lastClickedPhotoIndex !== null) {
      const start = Math.min(lastClickedPhotoIndex, index);
      const end = Math.max(lastClickedPhotoIndex, index);
      setSelectedPhotoIds((current) => unique([...current, ...photoLibrary.slice(start, end + 1).map((photo) => photo.id)]));
    } else if (event.altKey || event.ctrlKey || event.metaKey) {
      setSelectedPhotoIds((current) => current.includes(photoId) ? current.filter((id) => id !== photoId) : unique([...current, photoId]));
    } else {
      setSelectedPhotoIds([photoId]);
    }
    setLastClickedPhotoIndex(index);
  };

  const addBlankSpread = () => {
    setSpreads((current) => renameSpreads([...current.slice(0, currentSpreadIndex + 1), createBlankSpread(currentSpreadIndex + 1), ...current.slice(currentSpreadIndex + 1)]));
    setCurrentSpreadIndex((index) => index + 1);
    setSelectedFrameId(null);
    setRightTab("album");
  };

  const duplicateCurrentSpread = () => {
    setSpreads((current) => renameSpreads([...current.slice(0, currentSpreadIndex + 1), cloneSpread(currentSpread, currentSpreadIndex + 1), ...current.slice(currentSpreadIndex + 1)]));
    setCurrentSpreadIndex((index) => index + 1);
  };

  const deleteCurrentSpread = () => {
    if (spreads.length === 1) {
      setSpreads([createBlankSpread(0)]);
      setSelectedFrameId(null);
      return;
    }
    setSpreads((current) => renameSpreads(current.filter((_, index) => index !== currentSpreadIndex)));
    setCurrentSpreadIndex((index) => Math.max(0, index - 1));
    setSelectedFrameId(null);
  };

  const removeSelectedFrame = () => {
    if (!selectedFrameId) return;
    updateCurrentSpread((spread) => {
      const nextFrames = spread.frames.filter((frame) => frame.id !== selectedFrameId);
      return {
        ...spread,
        frames: nextFrames,
        spreadPhotoIds: syncPhotoIds(nextFrames),
        targetPhotoCount: nextFrames.length,
        layoutVariantIndex: 0,
      };
    });
    setSelectedFrameId(null);
  };

  const updateSelectedFrame = (patch) => {
    if (!selectedFrameId) return;
    updateCurrentSpread((spread) => ({
      ...spread,
      frames: spread.frames.map((frame) => frame.id === selectedFrameId ? { ...frame, ...patch } : frame),
    }));
  };

  const filteredPhotos = photoLibrary.filter((photo) => {
    if (bottomFilter === "selected") return selectedPhotoIds.includes(photo.id);
    if (bottomFilter === "unused") return !usedPhotoIds.has(photo.id);
    return true;
  });

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="mark">P</div>
          <div>
            <strong>Diagramador Picmimos</strong>
            <span>Álbum aberto 40×20 · páginas 20×20</span>
          </div>
        </div>
        <input className="album-input" value={albumName} onChange={(event) => setAlbumName(event.target.value)} />
        <div className="top-actions">
          <Button onClick={addBlankSpread}>+ Inserir lâmina</Button>
          <Button onClick={duplicateCurrentSpread}>Duplicar</Button>
          <Button onClick={() => alert("Exportação será a próxima etapa do projeto.")}>Exportar</Button>
        </div>
      </header>

      <div className="workspace">
        <aside className="tools">
          <button className="tool active">↖</button>
          <button className="tool">✋</button>
          <button className="tool">T</button>
          <button className="tool">□</button>
          <button className="tool">⌕</button>
        </aside>

        <main className="stage-wrap">
          <div className="ruler">0&nbsp;&nbsp;&nbsp;10&nbsp;&nbsp;&nbsp;20&nbsp;&nbsp;&nbsp;30&nbsp;&nbsp;&nbsp;40&nbsp;&nbsp;&nbsp;50&nbsp;&nbsp;&nbsp;60&nbsp;&nbsp;&nbsp;70&nbsp;&nbsp;&nbsp;80&nbsp;&nbsp;&nbsp;90&nbsp;&nbsp;&nbsp;100</div>
          <div className="stage-center">
            <div className="stage-head">
              <span>Página esquerda 20×20</span>
              <div className="layout-actions">
                <button onClick={() => changeLayout(-1)} disabled={!currentSpread.spreadPhotoIds.length}>‹ Layout</button>
                <button onClick={() => buildSpread(selectedPhotoIds, 0)} disabled={!selectedPhotoIds.length}>⚡ Auto Build {selectedPhotoIds.length ? `(${selectedPhotoIds.length})` : ""}</button>
                <button onClick={() => changeLayout(1)} disabled={!currentSpread.spreadPhotoIds.length}>Layout ›</button>
              </div>
              <span>Página direita 20×20</span>
            </div>

            <div
              ref={spreadRef}
              className={`spread-canvas ${dragPhotoIds.length ? "drop-ready" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const ids = dragPhotoIds.length ? dragPhotoIds : selectedPhotoIds;
                if (ids.length) buildSpread(ids, 0);
                setDragPhotoIds([]);
              }}
              onClick={() => setSelectedFrameId(null)}
            >
              <div className="safe-area" />
              <div className="gutter" />
              {!frames.length && (
                <div className="blank-message">
                  <strong>Lâmina em branco</strong>
                  <span>Importe fotos no rodapé, selecione e clique em Auto Build ou arraste para cá.</span>
                </div>
              )}
              {frames.map((frame) => (
                <Frame
                  key={frame.id}
                  frame={frame}
                  photo={frame.photoId ? photoMap.get(frame.photoId) : null}
                  selected={selectedFrameId === frame.id}
                  dropTarget={dropTargetId === frame.id}
                  onSelect={(event) => {
                    event.stopPropagation();
                    setSelectedFrameId(frame.id);
                    setRightTab("photo");
                  }}
                  onStartMove={(event) => {
                    event.stopPropagation();
                    if (event.target.classList.contains("resize-handle")) return;
                    setSelectedFrameId(frame.id);
                    setRightTab("photo");
                    setInteraction({ type: "move", frame, startX: event.clientX, startY: event.clientY });
                  }}
                  onStartResize={(handle, event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setSelectedFrameId(frame.id);
                    setRightTab("photo");
                    setInteraction({ type: "resize", handle, frame, startX: event.clientX, startY: event.clientY });
                  }}
                  onStartSwap={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setSelectedFrameId(frame.id);
                    setRightTab("photo");
                    setSwap({ sourceId: frame.id, x: event.clientX, y: event.clientY });
                  }}
                />
              ))}
              {dragPhotoIds.length > 0 && <div className="drop-overlay">Solte para montar {dragPhotoIds.length} foto{dragPhotoIds.length > 1 ? "s" : ""}</div>}
              {swap && <div className="swap-float" style={{ left: swap.x + 14, top: swap.y + 14 }}>↔ solte em outra foto</div>}
            </div>
          </div>
        </main>

        <aside className="right-panel">
          <div className="tabs">
            <button className={rightTab === "album" ? "active" : ""} onClick={() => setRightTab("album")}>Álbum</button>
            <button className={rightTab === "photo" ? "active" : ""} onClick={() => setRightTab("photo")}>Foto</button>
          </div>

          {rightTab === "photo" ? (
            <CropPanel
              frame={selectedFrame}
              photo={selectedFramePhoto}
              onChange={updateSelectedFrame}
              onCenter={() => updateSelectedFrame({ cropX: 0, cropY: 0, cropScale: 1 })}
              onRemove={removeSelectedFrame}
              onUploadNew={() => replaceSelectedRef.current?.click()}
            />
          ) : (
            <div className="album-panel">
              <section className="panel-block">
                <h3>Informações</h3>
                <div className="stat"><span>Lâminas</span><b>{spreads.length}</b></div>
                <div className="stat"><span>Páginas</span><b>{spreads.length * 2}</b></div>
                <div className="stat"><span>Fotos carregadas</span><b>{photoLibrary.length}</b></div>
                <div className="stat"><span>Fotos usadas</span><b>{usedPhotoIds.size}</b></div>
              </section>

              <section className="panel-block">
                <h3>Lâminas</h3>
                <div className="spread-list">
                  {spreads.map((spread, index) => (
                    <SpreadMini key={spread.id} spread={spread} index={index} active={index === currentSpreadIndex} photoMap={photoMap} onClick={() => { setCurrentSpreadIndex(index); setSelectedFrameId(null); }} />
                  ))}
                </div>
                <div className="panel-actions two">
                  <Button onClick={addBlankSpread}>Inserir</Button>
                  <Button onClick={deleteCurrentSpread} className="danger">Remover</Button>
                </div>
              </section>

              <section className="panel-block">
                <h3>Layouts da lâmina</h3>
                {!layoutOptions.length ? <p className="muted">Monte a lâmina com fotos para ver variações.</p> : layoutOptions.map((layout, index) => (
                  <LayoutPreview key={layout.id} layout={layout} active={index === currentSpread.layoutVariantIndex} onClick={() => buildSpread(currentSpread.spreadPhotoIds, index, frames)} />
                ))}
              </section>
            </div>
          )}
        </aside>
      </div>

      <footer className="filmstrip">
        <div className="filmstrip-top">
          <div className="selection-info">
            <strong>{selectedPhotoIds.length} selecionada{selectedPhotoIds.length === 1 ? "" : "s"}</strong>
            <span>Shift seleciona intervalo · Ctrl/Alt adiciona · arraste para a lâmina</span>
          </div>
          <div className="film-actions">
            <button className={bottomFilter === "all" ? "active" : ""} onClick={() => setBottomFilter("all")}>Todas</button>
            <button className={bottomFilter === "selected" ? "active" : ""} onClick={() => setBottomFilter("selected")}>Selecionadas</button>
            <button className={bottomFilter === "unused" ? "active" : ""} onClick={() => setBottomFilter("unused")}>Não usadas</button>
            <button onClick={() => uploadRef.current?.click()}>Importar fotos</button>
            <button onClick={loadDemo}>Fotos demo</button>
            <button onClick={() => buildSpread(selectedPhotoIds, 0)} disabled={!selectedPhotoIds.length}>Auto Build</button>
          </div>
        </div>
        <div className="photos-row">
          {!photoLibrary.length && (
            <div className="empty-film">
              <strong>Nenhuma foto carregada.</strong>
              <span>Clique em “Importar fotos” ou “Fotos demo” para testar o diagramador.</span>
            </div>
          )}
          {filteredPhotos.map((photo) => {
            const index = photoLibrary.findIndex((item) => item.id === photo.id);
            const order = selectedPhotoIds.indexOf(photo.id) + 1;
            return (
              <button
                key={photo.id}
                className={`photo-tile ${order ? "selected" : ""} ${usedPhotoIds.has(photo.id) ? "used" : ""}`}
                draggable
                onDragStart={() => setDragPhotoIds(selectedPhotoIds.includes(photo.id) ? selectedPhotoIds : [photo.id])}
                onDragEnd={() => setDragPhotoIds([])}
                onClick={(event) => photoClick(photo.id, index, event)}
                title="Clique para selecionar. Arraste para montar a lâmina."
              >
                <img src={photo.src} alt={photo.name} draggable="false" />
                <span className="photo-number">{index + 1}</span>
                {order ? <span className="photo-order">{order}</span> : null}
                {usedPhotoIds.has(photo.id) && !order ? <span className="used-badge">usada</span> : null}
              </button>
            );
          })}
        </div>
      </footer>

      <input ref={uploadRef} type="file" accept="image/*" multiple hidden onChange={async (event) => { await addPhotos(event.target.files); event.target.value = ""; }} />
      <input ref={addRef} type="file" accept="image/*" multiple hidden onChange={async (event) => { await addPhotos(event.target.files); event.target.value = ""; }} />
      <input ref={replaceSelectedRef} type="file" accept="image/*" hidden onChange={async (event) => { await replaceSelectedFramePhoto(event.target.files); event.target.value = ""; }} />
    </div>
  );
}
