import { useEffect, useMemo, useRef, useState } from 'react';

const FORMATS = [
  { id: '15x15', label: '15x15', spread: '30 x 15,2 cm', pages: '15,2 cm' },
  { id: '15x21-v', label: '15x21 vertical', spread: '30 x 21 cm', pages: '21 cm' },
  { id: '15x21-h', label: '15x21 horizontal', spread: '42 x 15,2 cm', pages: '15,2 cm' },
  { id: '20x20', label: '20x20', spread: '40 x 20,3 cm', pages: '20,3 cm' },
  { id: '20x25-v', label: '20x25 vertical', spread: '40 x 25,4 cm', pages: '25,4 cm' },
  { id: '20x25-h', label: '20x25 horizontal', spread: '50 x 20,3 cm', pages: '20,3 cm' },
  { id: '25x25', label: '25x25', spread: '50 x 25,4 cm', pages: '25,4 cm' },
  { id: '30x30', label: '30x30', spread: '60 x 30,5 cm', pages: '30,5 cm' },
  { id: '30x40', label: '30x40', spread: '80 x 30,5 cm', pages: '30,5 cm' }
];

const TEXTURES = [
  { id: 'champagne', label: 'Dune Champagne', color: '#d8c79d', pattern: 'repeating-linear-gradient(45deg, rgba(255,255,255,.18) 0 2px, transparent 2px 8px), linear-gradient(135deg, rgba(255,255,255,.25), transparent)' },
  { id: 'preto', label: 'Courino Preto', color: '#191716', pattern: 'repeating-linear-gradient(35deg, rgba(255,255,255,.055) 0 1px, transparent 1px 5px)' },
  { id: 'marrom', label: 'Courino Marrom', color: '#3a241a', pattern: 'repeating-linear-gradient(35deg, rgba(255,255,255,.06) 0 1px, transparent 1px 5px)' },
  { id: 'cinza', label: 'Linho Cinza', color: '#7d7b72', pattern: 'repeating-linear-gradient(0deg, rgba(255,255,255,.12) 0 1px, transparent 1px 7px), repeating-linear-gradient(90deg, rgba(0,0,0,.08) 0 1px, transparent 1px 6px)' },
  { id: 'branco', label: 'Courino Branco', color: '#eeeae0', pattern: 'repeating-linear-gradient(45deg, rgba(0,0,0,.045) 0 1px, transparent 1px 5px)' }
];

const PAGE_OPTIONS = Array.from({ length: 51 }, (_, i) => 20 + i * 2);
const SNAP_TOLERANCE = 8;
const MIN_FRAME_W = 8;
const MIN_FRAME_H = 8;
const MIN_TEXT_W = 12;
const MIN_TEXT_H = 7;

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

function textureStyle(texture) {
  return { backgroundColor: texture.color, backgroundImage: texture.pattern };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function svgPhoto(label, bgA, bgB, extra = '') {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-opacity="0.22"/></filter>
    </defs>
    <rect width="900" height="620" fill="url(#g)"/>
    <circle cx="730" cy="150" r="105" fill="rgba(255,255,255,.30)"/>
    <circle cx="230" cy="420" r="150" fill="rgba(255,255,255,.23)"/>
    <rect x="95" y="105" width="710" height="410" rx="34" fill="rgba(255,255,255,.38)" filter="url(#shadow)"/>
    <text x="450" y="295" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="700" fill="#2d2926">${label}</text>
    <text x="450" y="352" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#2d2926" opacity=".72">${extra}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const DEMO_PHOTOS = [
  { id: 'demo-1', name: 'Capa demo', url: svgPhoto('CAPA', '#fafafa', '#cdbb95', 'foto frontal') },
  { id: 'demo-2', name: 'Família 01', url: svgPhoto('FAMÍLIA', '#6eb06b', '#f0d890', 'foto 01') },
  { id: 'demo-3', name: 'Casamento 02', url: svgPhoto('CASAMENTO', '#a9c7ff', '#f7d2d2', 'foto 02') },
  { id: 'demo-4', name: 'Viagem 03', url: svgPhoto('VIAGEM', '#70b8df', '#f4c47d', 'foto 03') },
  { id: 'demo-5', name: 'Batizado 04', url: svgPhoto('BATIZADO', '#ded8ff', '#f7f3dd', 'foto 04') },
  { id: 'demo-6', name: 'Detalhe 05', url: svgPhoto('DETALHE', '#d98f73', '#f5e4b8', 'foto 05') },
  { id: 'demo-7', name: 'Retrato 06', url: svgPhoto('RETRATO', '#b2d9d0', '#7a98c8', 'foto 06') },
  { id: 'demo-8', name: 'Festa 07', url: svgPhoto('FESTA', '#8c6fd6', '#ffd37a', 'foto 07') },
  { id: 'demo-9', name: 'Família 08', url: svgPhoto('MEMÓRIA', '#78b68d', '#f2e0b7', 'foto 08') }
];

function createCoverPage() {
  return {
    frames: [
      {
        id: 'cover-photo',
        x: 53.8,
        y: 3.5,
        w: 42.9,
        h: 93,
        photoId: null,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        lockedMove: true,
        lockedResize: true,
        label: 'Foto obrigatória da capa'
      }
    ],
    texts: []
  };
}

function layoutFrames(layoutName = 'magazine5') {
  if (layoutName === 'hero2') {
    return [
      { x: 4, y: 8, w: 44, h: 78 },
      { x: 52, y: 8, w: 44, h: 78 }
    ];
  }
  if (layoutName === 'grid4') {
    return [
      { x: 4, y: 8, w: 22, h: 37 },
      { x: 28, y: 8, w: 22, h: 37 },
      { x: 52, y: 8, w: 22, h: 37 },
      { x: 76, y: 8, w: 20, h: 37 },
      { x: 4, y: 49, w: 22, h: 37 },
      { x: 28, y: 49, w: 22, h: 37 },
      { x: 52, y: 49, w: 22, h: 37 },
      { x: 76, y: 49, w: 20, h: 37 }
    ];
  }
  if (layoutName === 'clean3') {
    return [
      { x: 4, y: 8, w: 31, h: 78 },
      { x: 38, y: 8, w: 27, h: 36 },
      { x: 68, y: 8, w: 28, h: 36 },
      { x: 38, y: 50, w: 58, h: 36 }
    ];
  }
  return [
    { x: 4, y: 8, w: 23, h: 37 },
    { x: 28, y: 8, w: 23, h: 37 },
    { x: 52, y: 8, w: 20, h: 37 },
    { x: 74, y: 8, w: 22, h: 37 },
    { x: 4, y: 49, w: 23, h: 37 }
  ];
}

function createSpreadPage(layoutName = 'magazine5') {
  return {
    frames: layoutFrames(layoutName).map((rect, index) => ({
      id: uid('frame'),
      ...rect,
      photoId: null,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      label: `${index + 1}`
    })),
    texts: []
  };
}

function createInitialPages() {
  return {
    cover: createCoverPage(),
    1: createSpreadPage('magazine5'),
    2: createSpreadPage('magazine5')
  };
}

function readDragPayload(event) {
  const raw = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pxToPercentRect(rect, canvasRect) {
  return {
    x: (rect.x / canvasRect.width) * 100,
    y: (rect.y / canvasRect.height) * 100,
    w: (rect.w / canvasRect.width) * 100,
    h: (rect.h / canvasRect.height) * 100
  };
}

function percentToPxRect(el, canvasRect) {
  return {
    x: (el.x / 100) * canvasRect.width,
    y: (el.y / 100) * canvasRect.height,
    w: (el.w / 100) * canvasRect.width,
    h: (el.h / 100) * canvasRect.height
  };
}

function getAllElements(page) {
  return [...(page.frames || []).map((el) => ({ ...el, kind: 'frame' })), ...(page.texts || []).map((el) => ({ ...el, kind: 'text' }))];
}

function applySnap(rectPx, canvasRect, page, activeId, mode = 'move') {
  const guidesV = [
    { pos: 0, label: 'borda esquerda' },
    { pos: canvasRect.width / 2, label: 'centro vertical' },
    { pos: canvasRect.width, label: 'borda direita' }
  ];
  const guidesH = [
    { pos: 0, label: 'topo' },
    { pos: canvasRect.height / 2, label: 'centro horizontal' },
    { pos: canvasRect.height, label: 'base' }
  ];

  getAllElements(page).forEach((el) => {
    if (el.id === activeId) return;
    const r = percentToPxRect(el, canvasRect);
    guidesV.push({ pos: r.x, label: 'objeto esquerda' }, { pos: r.x + r.w / 2, label: 'objeto centro' }, { pos: r.x + r.w, label: 'objeto direita' });
    guidesH.push({ pos: r.y, label: 'objeto topo' }, { pos: r.y + r.h / 2, label: 'objeto centro' }, { pos: r.y + r.h, label: 'objeto base' });
  });

  const subjectV = [
    { key: 'left', pos: rectPx.x },
    { key: 'center', pos: rectPx.x + rectPx.w / 2 },
    { key: 'right', pos: rectPx.x + rectPx.w }
  ];
  const subjectH = [
    { key: 'top', pos: rectPx.y },
    { key: 'middle', pos: rectPx.y + rectPx.h / 2 },
    { key: 'bottom', pos: rectPx.y + rectPx.h }
  ];

  let bestV = null;
  let bestH = null;
  subjectV.forEach((s) => {
    guidesV.forEach((g) => {
      const delta = g.pos - s.pos;
      if (Math.abs(delta) <= SNAP_TOLERANCE && (!bestV || Math.abs(delta) < Math.abs(bestV.delta))) {
        bestV = { delta, subject: s.key, pos: g.pos, label: g.label };
      }
    });
  });
  subjectH.forEach((s) => {
    guidesH.forEach((g) => {
      const delta = g.pos - s.pos;
      if (Math.abs(delta) <= SNAP_TOLERANCE && (!bestH || Math.abs(delta) < Math.abs(bestH.delta))) {
        bestH = { delta, subject: s.key, pos: g.pos, label: g.label };
      }
    });
  });

  const snapped = { ...rectPx };
  const lines = [];

  if (bestV) {
    lines.push({ type: 'v', pos: bestV.pos, label: bestV.label });
    if (mode === 'resize-right' || bestV.subject === 'right') snapped.w += bestV.delta;
    else if (mode === 'resize-left' || bestV.subject === 'left') {
      snapped.x += bestV.delta;
      snapped.w -= bestV.delta;
    } else snapped.x += bestV.delta;
  }

  if (bestH) {
    lines.push({ type: 'h', pos: bestH.pos, label: bestH.label });
    if (mode === 'resize-bottom' || bestH.subject === 'bottom') snapped.h += bestH.delta;
    else if (mode === 'resize-top' || bestH.subject === 'top') {
      snapped.y += bestH.delta;
      snapped.h -= bestH.delta;
    } else snapped.y += bestH.delta;
  }

  snapped.x = clamp(snapped.x, 0, canvasRect.width - Math.max(1, snapped.w));
  snapped.y = clamp(snapped.y, 0, canvasRect.height - Math.max(1, snapped.h));
  snapped.w = clamp(snapped.w, 20, canvasRect.width - snapped.x);
  snapped.h = clamp(snapped.h, 20, canvasRect.height - snapped.y);

  return { rect: snapped, lines };
}

function getPageTitle(selectedPage) {
  if (selectedPage === 'cover') return 'Capa';
  const n = Number(selectedPage);
  return `Página ${n * 2 - 1}-${n * 2}`;
}

export default function App() {
  const [format, setFormat] = useState(FORMATS[3]);
  const [pageCount, setPageCount] = useState(30);
  const [texture, setTexture] = useState(TEXTURES[0]);
  const [photos, setPhotos] = useState(DEMO_PHOTOS);
  const [pages, setPages] = useState(createInitialPages);
  const [selectedPage, setSelectedPage] = useState('cover');
  const [selected, setSelected] = useState({ kind: 'frame', id: 'cover-photo' });
  const [layoutName, setLayoutName] = useState('magazine5');
  const [dragHoverId, setDragHoverId] = useState(null);
  const [guides, setGuides] = useState([]);
  const [exportNotice, setExportNotice] = useState('');
  const [finishNotice, setFinishNotice] = useState('');
  const canvasRef = useRef(null);
  const interactionRef = useRef(null);
  const fileInputRef = useRef(null);

  const totalSpreads = pageCount / 2;
  const spreadNumbers = useMemo(() => Array.from({ length: totalSpreads }, (_, i) => i + 1), [totalSpreads]);
  const currentPage = pages[selectedPage] || createSpreadPage(layoutName);
  const selectedElement = useMemo(() => {
    if (!selected) return null;
    const list = selected.kind === 'frame' ? currentPage.frames : currentPage.texts;
    return list?.find((el) => el.id === selected.id) || null;
  }, [selected, currentPage]);
  const selectedPhoto = selected?.kind === 'frame' && selectedElement?.photoId ? photos.find((p) => p.id === selectedElement.photoId) : null;
  const coverOk = Boolean(pages.cover?.frames?.find((f) => f.id === 'cover-photo')?.photoId);

  useEffect(() => {
    setPages((prev) => {
      const next = { ...prev };
      spreadNumbers.forEach((n) => {
        if (!next[n]) next[n] = createSpreadPage(layoutName);
      });
      Object.keys(next).forEach((key) => {
        if (key !== 'cover' && Number(key) > totalSpreads) delete next[key];
      });
      return next;
    });
  }, [pageCount, totalSpreads, layoutName, spreadNumbers]);

  useEffect(() => {
    function onPointerMove(event) {
      const drag = interactionRef.current;
      if (!drag || !canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;

      if (drag.type === 'pan-photo') {
        const scale = Math.max(1, drag.startEl.scale || 1);
        const maxPan = Math.max(0, ((scale - 1) / scale) * 50);
        const offsetX = clamp(drag.startEl.offsetX + (dx / drag.frameRect.width) * 100, -maxPan, maxPan);
        const offsetY = clamp(drag.startEl.offsetY + (dy / drag.frameRect.height) * 100, -maxPan, maxPan);
        updateFrame(drag.id, { offsetX, offsetY });
        return;
      }

      let rectPx = { ...drag.startRectPx };
      let mode = 'move';
      const minWPercent = drag.kind === 'frame' ? MIN_FRAME_W : MIN_TEXT_W;
      const minHPercent = drag.kind === 'frame' ? MIN_FRAME_H : MIN_TEXT_H;
      const minW = (minWPercent / 100) * canvasRect.width;
      const minH = (minHPercent / 100) * canvasRect.height;

      if (drag.type === 'move') {
        rectPx.x += dx;
        rectPx.y += dy;
      }

      if (drag.type === 'resize') {
        const h = drag.handle;
        if (h.includes('e')) {
          rectPx.w = Math.max(minW, drag.startRectPx.w + dx);
          mode = 'resize-right';
        }
        if (h.includes('s')) {
          rectPx.h = Math.max(minH, drag.startRectPx.h + dy);
          mode = mode === 'resize-right' ? 'resize-bottom' : 'resize-bottom';
        }
        if (h.includes('w')) {
          const newW = Math.max(minW, drag.startRectPx.w - dx);
          rectPx.x = drag.startRectPx.x + drag.startRectPx.w - newW;
          rectPx.w = newW;
          mode = 'resize-left';
        }
        if (h.includes('n')) {
          const newH = Math.max(minH, drag.startRectPx.h - dy);
          rectPx.y = drag.startRectPx.y + drag.startRectPx.h - newH;
          rectPx.h = newH;
          mode = 'resize-top';
        }
      }

      const snapResult = applySnap(rectPx, canvasRect, drag.pageSnapshot, drag.id, mode);
      setGuides(snapResult.lines.map((line) => ({
        ...line,
        posPercent: line.type === 'v' ? (line.pos / canvasRect.width) * 100 : (line.pos / canvasRect.height) * 100
      })));
      const nextRect = pxToPercentRect(snapResult.rect, canvasRect);

      if (drag.kind === 'frame') {
        updateFrame(drag.id, {
          x: nextRect.x,
          y: nextRect.y,
          w: Math.max(minWPercent, nextRect.w),
          h: Math.max(minHPercent, nextRect.h)
        });
      } else {
        const resizedSize = drag.type === 'resize' ? clamp(Math.round(nextRect.h * 3.2), 12, 120) : undefined;
        updateText(drag.id, {
          x: nextRect.x,
          y: nextRect.y,
          w: Math.max(minWPercent, nextRect.w),
          h: Math.max(minHPercent, nextRect.h),
          ...(resizedSize ? { size: resizedSize } : {})
        });
      }
    }

    function onPointerUp() {
      interactionRef.current = null;
      setGuides([]);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [selectedPage, pages]);

  function ensurePage(pageKey) {
    setPages((prev) => {
      if (prev[pageKey]) return prev;
      return { ...prev, [pageKey]: pageKey === 'cover' ? createCoverPage() : createSpreadPage(layoutName) };
    });
  }

  function updateFrame(id, patch) {
    setPages((prev) => {
      const page = prev[selectedPage] || createSpreadPage(layoutName);
      return {
        ...prev,
        [selectedPage]: {
          ...page,
          frames: page.frames.map((frame) => (frame.id === id ? { ...frame, ...patch } : frame))
        }
      };
    });
  }

  function updateText(id, patch) {
    setPages((prev) => {
      const page = prev[selectedPage] || createSpreadPage(layoutName);
      return {
        ...prev,
        [selectedPage]: {
          ...page,
          texts: page.texts.map((text) => (text.id === id ? { ...text, ...patch } : text))
        }
      };
    });
  }

  function replaceFramePhoto(frameId, photoId) {
    updateFrame(frameId, { photoId, scale: 1, offsetX: 0, offsetY: 0 });
  }

  function swapFramePhotos(sourcePage, sourceId, targetId) {
    setPages((prev) => {
      const sourcePageData = prev[sourcePage];
      const targetPageData = prev[selectedPage];
      if (!sourcePageData || !targetPageData) return prev;
      const sourceFrame = sourcePageData.frames.find((f) => f.id === sourceId);
      const targetFrame = targetPageData.frames.find((f) => f.id === targetId);
      if (!sourceFrame || !targetFrame) return prev;
      const sourcePhoto = sourceFrame.photoId;
      const targetPhoto = targetFrame.photoId;

      if (sourcePage === selectedPage) {
        return {
          ...prev,
          [selectedPage]: {
            ...targetPageData,
            frames: targetPageData.frames.map((frame) => {
              if (frame.id === sourceId) return { ...frame, photoId: targetPhoto, scale: 1, offsetX: 0, offsetY: 0 };
              if (frame.id === targetId) return { ...frame, photoId: sourcePhoto, scale: 1, offsetX: 0, offsetY: 0 };
              return frame;
            })
          }
        };
      }

      return {
        ...prev,
        [sourcePage]: {
          ...sourcePageData,
          frames: sourcePageData.frames.map((frame) => frame.id === sourceId ? { ...frame, photoId: targetPhoto, scale: 1, offsetX: 0, offsetY: 0 } : frame)
        },
        [selectedPage]: {
          ...targetPageData,
          frames: targetPageData.frames.map((frame) => frame.id === targetId ? { ...frame, photoId: sourcePhoto, scale: 1, offsetX: 0, offsetY: 0 } : frame)
        }
      };
    });
  }

  function handleSelectFiles(event) {
    const files = Array.from(event.target.files || []);
    const newPhotos = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      url: URL.createObjectURL(file)
    }));
    if (newPhotos.length) setPhotos((prev) => [...prev, ...newPhotos]);
    event.target.value = '';
  }

  function handleLibraryClick(photo) {
    if (selected?.kind === 'frame' && selectedElement) {
      replaceFramePhoto(selected.id, photo.id);
      return;
    }
    const firstEmpty = currentPage.frames.find((frame) => !frame.photoId);
    if (firstEmpty) {
      replaceFramePhoto(firstEmpty.id, photo.id);
      setSelected({ kind: 'frame', id: firstEmpty.id });
    }
  }

  function handleDropOnFrame(event, frameId) {
    event.preventDefault();
    event.stopPropagation();
    const payload = readDragPayload(event);
    setDragHoverId(null);
    if (!payload) return;
    if (payload.type === 'photo') {
      replaceFramePhoto(frameId, payload.photoId);
      setSelected({ kind: 'frame', id: frameId });
    }
    if (payload.type === 'frame') {
      if (payload.frameId === frameId && payload.page === selectedPage) return;
      swapFramePhotos(payload.page, payload.frameId, frameId);
      setSelected({ kind: 'frame', id: frameId });
    }
  }

  function handlePhotoWheel(event, frame) {
    event.preventDefault();
    const step = event.deltaY < 0 ? 0.08 : -0.08;
    const nextScale = clamp(Number(((frame.scale || 1) + step).toFixed(2)), 1, 3);
    const maxPan = Math.max(0, ((nextScale - 1) / nextScale) * 50);
    updateFrame(frame.id, {
      scale: nextScale,
      offsetX: clamp(frame.offsetX || 0, -maxPan, maxPan),
      offsetY: clamp(frame.offsetY || 0, -maxPan, maxPan)
    });
  }

  function startMove(event, kind, el) {
    event.preventDefault();
    event.stopPropagation();
    if (!canvasRef.current) return;
    if (kind === 'frame' && el.lockedMove) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    interactionRef.current = {
      type: 'move',
      kind,
      id: el.id,
      startX: event.clientX,
      startY: event.clientY,
      startRectPx: percentToPxRect(el, canvasRect),
      pageSnapshot: currentPage
    };
    setSelected({ kind, id: el.id });
  }

  function startResize(event, kind, el, handle) {
    event.preventDefault();
    event.stopPropagation();
    if (!canvasRef.current) return;
    if (kind === 'frame' && el.lockedResize) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    interactionRef.current = {
      type: 'resize',
      kind,
      handle,
      id: el.id,
      startX: event.clientX,
      startY: event.clientY,
      startRectPx: percentToPxRect(el, canvasRect),
      pageSnapshot: currentPage
    };
    setSelected({ kind, id: el.id });
  }

  function startPanPhoto(event, frame) {
    if (!frame.photoId) return;
    event.preventDefault();
    event.stopPropagation();
    const targetRect = event.currentTarget.getBoundingClientRect();
    interactionRef.current = {
      type: 'pan-photo',
      id: frame.id,
      startX: event.clientX,
      startY: event.clientY,
      startEl: frame,
      frameRect: targetRect
    };
    setSelected({ kind: 'frame', id: frame.id });
  }

  function addText() {
    const text = {
      id: uid('text'),
      text: selectedPage === 'cover' ? 'Marta\nCanelas' : 'Digite seu texto',
      x: selectedPage === 'cover' ? 63 : 35,
      y: selectedPage === 'cover' ? 34 : 36,
      w: selectedPage === 'cover' ? 25 : 28,
      h: selectedPage === 'cover' ? 25 : 14,
      font: 'Montserrat',
      size: selectedPage === 'cover' ? 54 : 32,
      color: '#ffffff',
      bold: false,
      align: 'center'
    };
    setPages((prev) => {
      const page = prev[selectedPage] || createSpreadPage(layoutName);
      return { ...prev, [selectedPage]: { ...page, texts: [...page.texts, text] } };
    });
    setSelected({ kind: 'text', id: text.id });
  }

  function deleteSelected() {
    if (!selected) return;
    setPages((prev) => {
      const page = prev[selectedPage];
      if (!page) return prev;
      if (selected.kind === 'frame') {
        return {
          ...prev,
          [selectedPage]: {
            ...page,
            frames: page.frames.map((f) => f.id === selected.id ? { ...f, photoId: null, scale: 1, offsetX: 0, offsetY: 0 } : f)
          }
        };
      }
      return { ...prev, [selectedPage]: { ...page, texts: page.texts.filter((t) => t.id !== selected.id) } };
    });
    setSelected(null);
  }

  function applyLayout(name) {
    setLayoutName(name);
    if (selectedPage === 'cover') return;
    setPages((prev) => {
      const oldPage = prev[selectedPage] || createSpreadPage(name);
      const existingPhotos = oldPage.frames.map((f) => f.photoId).filter(Boolean);
      const newPage = createSpreadPage(name);
      newPage.frames = newPage.frames.map((frame, index) => ({ ...frame, photoId: existingPhotos[index] || null }));
      newPage.texts = oldPage.texts;
      return { ...prev, [selectedPage]: newPage };
    });
  }

  function autoMount() {
    if (!photos.length) {
      alert('Importe fotos primeiro.');
      return;
    }
    setPages((prev) => {
      const next = { ...prev };
      let cursor = 1;
      spreadNumbers.forEach((number) => {
        const page = next[number] || createSpreadPage(layoutName);
        next[number] = {
          ...page,
          frames: page.frames.map((frame) => {
            if (frame.photoId) return frame;
            const photo = photos[cursor % photos.length];
            cursor += 1;
            return { ...frame, photoId: photo.id, scale: 1, offsetX: 0, offsetY: 0 };
          })
        };
      });
      return next;
    });
  }

  function insertPageAfter() {
    const newIndex = selectedPage === 'cover' ? 1 : Number(selectedPage) + 1;
    setPageCount((prev) => prev + 2);
    setPages((prev) => {
      const next = { cover: prev.cover };
      const keys = Array.from({ length: totalSpreads + 1 }, (_, i) => i + 1);
      keys.forEach((key) => {
        if (key < newIndex) next[key] = prev[key] || createSpreadPage(layoutName);
        else if (key === newIndex) next[key] = createSpreadPage(layoutName);
        else next[key] = prev[key - 1] || createSpreadPage(layoutName);
      });
      return next;
    });
    setSelectedPage(newIndex);
  }

  function duplicatePage() {
    if (selectedPage === 'cover') return;
    const cloneIndex = Number(selectedPage) + 1;
    setPageCount((prev) => prev + 2);
    setPages((prev) => {
      const clone = JSON.parse(JSON.stringify(prev[selectedPage] || createSpreadPage(layoutName)));
      clone.frames = clone.frames.map((f) => ({ ...f, id: uid('frame') }));
      clone.texts = clone.texts.map((t) => ({ ...t, id: uid('text') }));
      const next = { cover: prev.cover };
      Array.from({ length: totalSpreads + 1 }, (_, i) => i + 1).forEach((key) => {
        if (key < cloneIndex) next[key] = prev[key] || createSpreadPage(layoutName);
        else if (key === cloneIndex) next[key] = clone;
        else next[key] = prev[key - 1] || createSpreadPage(layoutName);
      });
      return next;
    });
    setSelectedPage(cloneIndex);
  }

  function removePage() {
    if (selectedPage === 'cover' || totalSpreads <= 10) return;
    const removeIndex = Number(selectedPage);
    setPageCount((prev) => prev - 2);
    setPages((prev) => {
      const next = { cover: prev.cover };
      Array.from({ length: totalSpreads - 1 }, (_, i) => i + 1).forEach((key) => {
        if (key < removeIndex) next[key] = prev[key] || createSpreadPage(layoutName);
        else next[key] = prev[key + 1] || createSpreadPage(layoutName);
      });
      return next;
    });
    setSelectedPage(Math.max(1, removeIndex - 1));
  }

  function saveProject() {
    localStorage.setItem('diagramador_picmimos_v6', JSON.stringify({ format, pageCount, texture, pages }));
    setExportNotice('Projeto salvo no navegador. No próximo passo real, isso vai para servidor/WooCommerce.');
    setTimeout(() => setExportNotice(''), 3600);
  }

  function previewProject() {
    setExportNotice('Pré-visualização V6: a capa e as lâminas já estão montadas visualmente. Preview 3D real fica para etapa seguinte.');
    setTimeout(() => setExportNotice(''), 4200);
  }

  function finishProject() {
    if (!coverOk) {
      setFinishNotice('Bloqueado: a foto da capa frontal é obrigatória. Clique na capa e envie/arraste uma foto.');
      setSelectedPage('cover');
      setSelected({ kind: 'frame', id: 'cover-photo' });
      return;
    }
    const blankSpreads = spreadNumbers.filter((n) => !pages[n] || pages[n].frames.every((f) => !f.photoId));
    if (blankSpreads.length) {
      setFinishNotice(`Atenção: ${blankSpreads.length} lâmina(s) ainda estão em branco. Na versão real, o cliente deverá confirmar antes de enviar para produção.`);
      return;
    }
    setFinishNotice('Projeto pronto para a próxima etapa: carrinho WooCommerce/exportação JPG.');
  }

  function renderFrame(frame) {
    const photo = photos.find((p) => p.id === frame.photoId);
    const isSelected = selected?.kind === 'frame' && selected.id === frame.id;
    const canResize = !frame.lockedResize;
    const canMove = !frame.lockedMove;
    const maxPan = Math.max(0, (((frame.scale || 1) - 1) / (frame.scale || 1)) * 50);
    const offsetX = clamp(frame.offsetX || 0, -maxPan, maxPan);
    const offsetY = clamp(frame.offsetY || 0, -maxPan, maxPan);

    return (
      <div
        key={frame.id}
        className={`photo-frame ${isSelected ? 'selected' : ''} ${dragHoverId === frame.id ? 'drop-hover' : ''} ${frame.lockedResize ? 'locked' : ''}`}
        style={{ left: `${frame.x}%`, top: `${frame.y}%`, width: `${frame.w}%`, height: `${frame.h}%` }}
        onClick={(event) => { event.stopPropagation(); setSelected({ kind: 'frame', id: frame.id }); }}
        onDragOver={(event) => { event.preventDefault(); setDragHoverId(frame.id); }}
        onDragLeave={() => setDragHoverId(null)}
        onDrop={(event) => handleDropOnFrame(event, frame.id)}
        onWheel={(event) => handlePhotoWheel(event, frame)}
      >
        {photo ? (
          <img
            className="frame-photo"
            src={photo.url}
            alt={photo.name}
            draggable="false"
            onPointerDown={(event) => startPanPhoto(event, frame)}
            style={{
              transform: `translate(-50%, -50%) translate(${offsetX}%, ${offsetY}%) scale(${Math.max(1, frame.scale || 1)})`
            }}
          />
        ) : (
          <button className="empty-frame-button" onClick={(event) => { event.stopPropagation(); setSelected({ kind: 'frame', id: frame.id }); fileInputRef.current?.click(); }}>
            <span>＋</span>
            Foto
          </button>
        )}

        <div className="frame-number">{frame.label}</div>
        {photo && <div className="used-badge">usada</div>}
        {isSelected && photo && <div className="pan-hint">Arraste a foto para enquadrar • roda do mouse aproxima</div>}
        {isSelected && (
          <>
            {canMove && (
              <button className="move-handle" onPointerDown={(event) => startMove(event, 'frame', frame)} title="Mover quadro">
                mover
              </button>
            )}
            {photo && (
              <button
                className="swap-handle"
                draggable
                onDragStart={(event) => {
                  event.stopPropagation();
                  event.dataTransfer.setData('application/json', JSON.stringify({ type: 'frame', page: selectedPage, frameId: frame.id }));
                  event.dataTransfer.effectAllowed = 'move';
                }}
                title="Arraste para outro quadro para trocar as fotos"
              >
                trocar
              </button>
            )}
            {canResize && ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => (
              <span key={handle} className={`resize-handle ${handle}`} onPointerDown={(event) => startResize(event, 'frame', frame, handle)} />
            ))}
          </>
        )}
      </div>
    );
  }

  function renderText(text) {
    const isSelected = selected?.kind === 'text' && selected.id === text.id;
    return (
      <div
        key={text.id}
        className={`text-box ${isSelected ? 'selected' : ''}`}
        style={{
          left: `${text.x}%`,
          top: `${text.y}%`,
          width: `${text.w}%`,
          height: `${text.h}%`,
          fontFamily: text.font,
          fontSize: `${text.size}px`,
          color: text.color,
          fontWeight: text.bold ? 800 : 500,
          textAlign: text.align
        }}
        onClick={(event) => { event.stopPropagation(); setSelected({ kind: 'text', id: text.id }); }}
      >
        <div
          className="editable-text"
          contentEditable={isSelected}
          suppressContentEditableWarning
          onInput={(event) => updateText(text.id, { text: event.currentTarget.innerText })}
          onBlur={(event) => updateText(text.id, { text: event.currentTarget.innerText })}
        >
          {text.text}
        </div>
        {isSelected && (
          <>
            <button className="text-move-handle" onPointerDown={(event) => startMove(event, 'text', text)} title="Mover texto">mover</button>
            {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => (
              <span key={handle} className={`resize-handle ${handle}`} onPointerDown={(event) => startResize(event, 'text', text, handle)} />
            ))}
          </>
        )}
      </div>
    );
  }

  function renderCanvas() {
    const page = currentPage;
    const isCover = selectedPage === 'cover';
    return (
      <div className="canvas-wrap" onClick={() => setSelected(null)}>
        <div ref={canvasRef} className={`design-canvas ${isCover ? 'cover-canvas-v6' : 'spread-canvas-v6'}`}>
          {isCover ? (
            <>
              <div className="cover-back" style={textureStyle(texture)}><span>Verso bloqueado</span></div>
              <div className="cover-spine" style={textureStyle(texture)}><span>{pageCount / 2}mm</span></div>
              <div className="cover-front-area" />
            </>
          ) : (
            <>
              <div className="paper-grid" />
              <div className="page-label left">Página esquerda</div>
              <div className="page-label right">Página direita</div>
              <div className="center-fold" />
            </>
          )}
          <div className="safe-margin">
            <span>Margem de segurança 0,3 cm</span>
          </div>
          {page.frames.map(renderFrame)}
          {page.texts.map(renderText)}
          {guides.map((guide, index) => (
            <div key={`${guide.type}-${index}`} className={`snap-line ${guide.type}`} style={guide.type === 'v' ? { left: `${guide.posPercent}%` } : { top: `${guide.posPercent}%` }}>
              <span>{guide.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderRightPanel() {
    if (selected?.kind === 'text' && selectedElement) {
      const text = selectedElement;
      return (
        <aside className="right-panel">
          <h3>Ajustes</h3>
          <label>Texto</label>
          <textarea value={text.text} onChange={(event) => updateText(text.id, { text: event.target.value })} />
          <label>Fonte</label>
          <select value={text.font} onChange={(event) => updateText(text.id, { font: event.target.value })}>
            <option>Montserrat</option>
            <option>Georgia</option>
            <option>Arial</option>
            <option>Times New Roman</option>
            <option>Verdana</option>
          </select>
          <label>Tamanho</label>
          <input type="range" min="12" max="120" value={text.size} onChange={(event) => updateText(text.id, { size: Number(event.target.value) })} />
          <small>{text.size}px</small>
          <label>Cor</label>
          <div className="color-row">
            {['#111111', '#ffffff', '#e2ad3b', '#5f5f5b', '#285b43', '#a63234'].map((color) => (
              <button key={color} className={`color-dot ${text.color === color ? 'selected' : ''}`} style={{ background: color }} onClick={() => updateText(text.id, { color })} />
            ))}
          </div>
          <div className="panel-grid">
            <button onClick={() => updateText(text.id, { bold: !text.bold })}>{text.bold ? 'Sem negrito' : 'Negrito'}</button>
            <button onClick={() => updateText(text.id, { align: text.align === 'center' ? 'left' : text.align === 'left' ? 'right' : 'center' })}>Alinhar</button>
          </div>
          <button className="danger" onClick={deleteSelected}>Apagar texto</button>
          <p className="panel-help">V6: o texto agora também redimensiona direto no diagramador pelas alças amarelas.</p>
        </aside>
      );
    }

    if (selected?.kind === 'frame' && selectedElement) {
      const frame = selectedElement;
      const photo = selectedPhoto;
      return (
        <aside className="right-panel">
          <h3>Ajustes</h3>
          {photo ? <img className="selected-preview" src={photo.url} alt={photo.name} /> : <div className="empty-preview">Sem foto</div>}
          <h4>Foto selecionada</h4>
          <p>Arraste a foto dentro do quadro para reposicionar. Use a rolagem do mouse ou o controle abaixo para aproximar.</p>
          <label>Zoom mínimo bloqueado</label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={Math.max(1, frame.scale || 1)}
            onChange={(event) => {
              const scale = Math.max(1, Number(event.target.value));
              const maxPan = Math.max(0, ((scale - 1) / scale) * 50);
              updateFrame(frame.id, {
                scale,
                offsetX: clamp(frame.offsetX || 0, -maxPan, maxPan),
                offsetY: clamp(frame.offsetY || 0, -maxPan, maxPan)
              });
            }}
          />
          <small>{Math.round(Math.max(1, frame.scale || 1) * 100)}%</small>
          <label>Horizontal</label>
          <input type="range" min="-50" max="50" value={frame.offsetX || 0} onChange={(event) => updateFrame(frame.id, { offsetX: Number(event.target.value) })} />
          <label>Vertical</label>
          <input type="range" min="-50" max="50" value={frame.offsetY || 0} onChange={(event) => updateFrame(frame.id, { offsetY: Number(event.target.value) })} />
          <div className="panel-grid">
            <button onClick={() => updateFrame(frame.id, { scale: 1, offsetX: 0, offsetY: 0 })}>Centralizar</button>
            <button onClick={() => fileInputRef.current?.click()}>Trocar foto</button>
          </div>
          {!frame.lockedResize && <p className="panel-help">V6: arraste as alças amarelas do quadro para redimensionar. Linhas magnéticas aparecem quando alinhar com outro quadro.</p>}
          <button className="danger" onClick={deleteSelected}>Limpar foto</button>
        </aside>
      );
    }

    return (
      <aside className="right-panel">
        <h3>Ajustes</h3>
        <p>Selecione uma foto ou texto para editar.</p>
        <button onClick={addText}>Inserir texto</button>
      </aside>
    );
  }

  function renderPageStrip() {
    return (
      <div className="page-strip">
        <button className={selectedPage === 'cover' ? 'active' : ''} onClick={() => { setSelectedPage('cover'); ensurePage('cover'); setSelected({ kind: 'frame', id: 'cover-photo' }); }}>
          <span className="mini-cover" style={textureStyle(texture)}>{coverOk && <span className="ok-dot">ok</span>}</span>
          <strong>Capa</strong>
          <small>{coverOk ? 'ok' : 'sem foto'}</small>
        </button>
        {spreadNumbers.map((n) => {
          const page = pages[n];
          const used = page?.frames?.filter((f) => f.photoId).length || 0;
          return (
            <button key={n} className={selectedPage === n ? 'active' : ''} onClick={() => { ensurePage(n); setSelectedPage(n); setSelected(null); }}>
              <span className="mini-spread">{page?.frames?.slice(0, 4).map((frame) => frame.photoId ? <i key={frame.id} /> : null)}</span>
              <strong>Página {n * 2 - 1}-{n * 2}</strong>
              <small>{used ? `${used} foto(s)` : 'em branco'}</small>
            </button>
          );
        })}
      </div>
    );
  }

  function renderPhotoStrip() {
    return (
      <div className="photo-strip">
        {photos.map((photo, index) => {
          const uses = Object.values(pages).flatMap((page) => page.frames || []).filter((frame) => frame.photoId === photo.id).length;
          return (
            <button
              key={photo.id}
              className={`library-photo ${uses ? 'used' : ''}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/json', JSON.stringify({ type: 'photo', photoId: photo.id }));
                event.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => handleLibraryClick(photo)}
              title="Clique para aplicar na seleção ou arraste para trocar"
            >
              <img src={photo.url} alt={photo.name} />
              <span className="photo-index">{index + 1}</span>
              {uses > 0 && <span className="use-count">usada {uses > 1 ? uses : ''}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <main className="app-shell">
      <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleSelectFiles} />
      <header className="topbar">
        <div className="brand-mark">P</div>
        <div>
          <strong>Diagramador Picmimos V6</strong>
          <span>Meia Capa Fotográfica · resize manual + snap magnético</span>
        </div>
        <div className="top-actions">
          <button onClick={saveProject}>Salvar projeto</button>
          <button onClick={previewProject}>Pré-visualizar</button>
          <button className="finish" onClick={finishProject}>Finalizar</button>
        </div>
      </header>

      <section className="editor-layout">
        <aside className="left-panel">
          <section className="panel-card">
            <h3>Produto</h3>
            <label>Formato fechado</label>
            <select value={format.id} onChange={(event) => setFormat(FORMATS.find((item) => item.id === event.target.value) || FORMATS[3])}>
              {FORMATS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <label>Quantidade de páginas</label>
            <select value={pageCount} onChange={(event) => setPageCount(Number(event.target.value))}>
              {PAGE_OPTIONS.map((count) => <option key={count} value={count}>{count} páginas ({count / 2} lâminas)</option>)}
            </select>
            <label>Textura do verso/lombada</label>
            <select value={texture.id} onChange={(event) => setTexture(TEXTURES.find((item) => item.id === event.target.value) || TEXTURES[0])}>
              {TEXTURES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <div className="spec-grid">
              <span><small>Miolo</small><b>{format.spread}</b></span>
              <span><small>Lombada</small><b>{pageCount / 2} mm</b></span>
              <span><small>Refilo</small><b>3 mm total</b></span>
              <span><small>Saída</small><b>JPG limpo</b></span>
            </div>
          </section>

          <section className="panel-card">
            <h3>Fotos</h3>
            <div className="button-row">
              <button className="dark" onClick={() => fileInputRef.current?.click()}>Importar fotos</button>
              <button onClick={() => setPhotos(DEMO_PHOTOS)}>Fotos demo</button>
            </div>
            <button className="plain" onClick={() => setPhotos([])}>Limpar biblioteca</button>
            <p>Clique para aplicar na seleção. Arraste para cima de um quadro para substituir. Para trocar foto entre quadros, use o botão “trocar” no quadro selecionado.</p>
          </section>
        </aside>

        <section className="main-stage">
          <div className="stage-toolbar">
            <div>
              <strong>{getPageTitle(selectedPage)}</strong>
              <span>{format.spread} · Fuji UV Fosco</span>
            </div>
            <div className="toolbar-actions">
              {selectedPage !== 'cover' && <button onClick={autoMount}>Montar automático</button>}
              {selectedPage !== 'cover' && <button onClick={() => applyLayout('magazine5')}>Layout 5</button>}
              {selectedPage !== 'cover' && <button onClick={() => applyLayout('grid4')}>Layout 8</button>}
              {selectedPage !== 'cover' && <button onClick={() => applyLayout('hero2')}>Layout 2</button>}
              <button className="margin-pill">Margem 0,3 cm</button>
              <button onClick={addText}>Texto</button>
              <button className="clear" onClick={deleteSelected}>Limpar</button>
            </div>
          </div>

          {renderCanvas()}
          {finishNotice && <div className="notice warning">{finishNotice}</div>}
          {exportNotice && <div className="notice">{exportNotice}</div>}
        </section>

        {renderRightPanel()}
      </section>

      <footer className="bottom-area">
        <div className="page-actions">
          {renderPageStrip()}
          <div className="page-buttons">
            <button onClick={insertPageAfter}>Inserir</button>
            <button onClick={duplicatePage}>Duplicar</button>
            <button className="danger-soft" onClick={removePage}>Remover</button>
            <button onClick={() => setExportNotice('Exportação real ainda será conectada: JPG 300 DPI, capa separada e miolo por lâmina.')}>Exportação</button>
          </div>
        </div>
        {renderPhotoStrip()}
      </footer>
    </main>
  );
}
