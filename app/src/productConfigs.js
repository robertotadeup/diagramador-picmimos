// V4.1 Preview 3D Premium com ambientes — Picmimos / Proalbuns
// Este arquivo centraliza as configurações comerciais e técnicas do álbum.
// Futuramente o plugin WordPress/WooCommerce deve alimentar estes mesmos dados.

export const SAFETY_MARGIN_CM = 0.3;

export const DEFAULT_COVER_MODEL_ID = "capa_meia_capa";
export const DEFAULT_FORMAT_ID = "20x20";
export const DEFAULT_TEXTURE_ID = "dune_champagne";

export const PAGE_OPTIONS = {
  minPages: 20,
  maxPages: 120,
  // Mantido em 2 para não quebrar o editor atual, que adiciona/remove uma lâmina por vez.
  // Comercialmente, é possível exibir opções de 10 em 10 páginas no WooCommerce depois.
  editorStep: 2,
  commercialStep: 10,
};

export const SPINE_RULE = {
  type: "mm_per_lamina",
  valueMm: 1,
};

export const INTERIOR = {
  type: "layflat",
  opening: "180 graus",
  paper: "Papel Fuji fotográfico",
  finish: "UV Fosco",
  productionOutput: "JPG limpo",
};

export const PREVIEW_3D = {
  pageType: "rigid_800g",
  turnType: "rigid_board",
  opening: "layflat_180",
};

export const PREVIEW_3D_ADMIN_SCHEMA = {
  source: "wordpress_plugin_admin",
  description: "Campos que o plugin deverá oferecer para cada produto/modelo de capa.",
  fields: [
    "tipo_visual_3d",
    "modo_de_capa",
    "material_frente",
    "material_lombada",
    "material_verso",
    "espessura_capa_mm",
    "espessura_lamina_mm",
    "tipo_de_virada",
    "abertura",
    "ambientes_disponiveis",
    "thumbnail_do_ambiente",
    "imagem_do_ambiente",
    "tipo_de_mesa_base",
    "ambiente",
    "camera_inicial",
    "intensidade_luz",
    "sombra",
    "arquivo_gabarito_por_lamina",
    "arquivo_glb_base",
    "limite_peso_glb_kb",
    "resolucao_textura_preview",
  ],
};

export const PREVIEW_3D_BASE_CONFIG = {
  source: "wordpress_plugin_admin",
  pluginControlled: true,
  pageType: "rigid_800g",
  turnType: "rigid_board",
  opening: "layflat_180",
  coverThicknessMm: 3,
  boardThicknessMm: 0.8,
  environment: "premium_ambients",
  ambientStrategy: "configurable_room_background_plus_table_base",
  modelStrategy: "single_lightweight_glb_base_with_parametric_fallback",
  defaultModelAsset: "/models/album-layflat-lite.glb",
  maxModelSizeKb: 900,
  texturePreviewMaxPx: 1400,
  loadOnlyOnPreview: true,
  cameraPreset: "front_angled",
  lightPreset: "softbox_studio",
  shadowPreset: "soft_contact_shadow",
  allowMouseOrbit: true,
  allowPageNavigation: true,
};

export const PREVIEW_3D_BY_COVER_MODEL = {
  capa_fotografica_personalizada: {
    label: "3D: arte inteira",
    coverMode: "full_cover_art",
    frontMaterial: "printed_photo_art",
    spineMaterial: "printed_photo_art",
    backMaterial: "printed_photo_art",
    frontEffect: "photo_lamination",
    requiresTemplate: true,
    usesTexture: false,
    description: "O 3D usa uma arte única da capa inteira: verso + lombada + frente. O gabarito muda pela quantidade de lâminas.",
    modelAsset: "/models/album-layflat-lite.glb",
  },
  capa_acrilico: {
    label: "3D: acrílico + textura",
    coverMode: "front_photo_back_texture",
    frontMaterial: "acrylic_gloss_front_photo",
    spineMaterial: "selected_texture",
    backMaterial: "selected_texture",
    frontEffect: "acrylic_gloss",
    requiresTemplate: false,
    usesTexture: true,
    description: "Frente com foto e efeito acrílico; lombada e verso usam a textura escolhida.",
    modelAsset: "/models/album-layflat-lite.glb",
  },
  capa_suede: {
    label: "3D: suede + foto frontal",
    coverMode: "front_photo_back_texture",
    frontMaterial: "matte_front_photo",
    spineMaterial: "selected_texture",
    backMaterial: "selected_texture",
    frontEffect: "soft_matte",
    requiresTemplate: false,
    usesTexture: true,
    description: "Frente com foto; lombada e verso em textura com aparência de suede.",
    modelAsset: "/models/album-layflat-lite.glb",
  },
  capa_madeira: {
    label: "3D: madeira + foto frontal",
    coverMode: "front_photo_back_texture",
    frontMaterial: "matte_front_photo",
    spineMaterial: "wood_texture",
    backMaterial: "wood_texture",
    frontEffect: "natural_matte",
    requiresTemplate: false,
    usesTexture: true,
    description: "Frente com foto; lombada e verso com material madeira/textura cadastrada.",
    modelAsset: "/models/album-layflat-lite.glb",
  },
  capa_tecido: {
    label: "3D: tecido + foto frontal",
    coverMode: "front_photo_back_texture",
    frontMaterial: "matte_front_photo",
    spineMaterial: "fabric_texture",
    backMaterial: "fabric_texture",
    frontEffect: "soft_matte",
    requiresTemplate: false,
    usesTexture: true,
    description: "Frente com foto; lombada e verso em tecido/textura cadastrada.",
    modelAsset: "/models/album-layflat-lite.glb",
  },
  capa_magnetica: {
    label: "3D: magnética + foto frontal",
    coverMode: "front_photo_back_texture",
    frontMaterial: "matte_front_photo",
    spineMaterial: "selected_texture",
    backMaterial: "selected_texture",
    frontEffect: "premium_matte",
    requiresTemplate: false,
    usesTexture: true,
    description: "Frente com foto; lombada e verso em textura, com regra de capa magnética no plugin.",
    modelAsset: "/models/album-layflat-lite.glb",
  },
  capa_meia_capa: {
    label: "3D: meia capa + textura",
    coverMode: "front_photo_back_texture",
    frontMaterial: "matte_front_photo",
    spineMaterial: "selected_texture",
    backMaterial: "selected_texture",
    frontEffect: "matte_photo",
    requiresTemplate: false,
    usesTexture: true,
    description: "Frente com foto obrigatória; lombada e verso usam a textura escolhida.",
    modelAsset: "/models/album-layflat-lite.glb",
  },
};

export const COVER_TEMPLATE_SETTINGS = {
  source: "wordpress_plugin_admin",
  adminWillRegisterFiles: true,
  defaultGeneratedFileType: "SVG_DEMO",
  futureAllowedFileTypes: ["PSD", "PDF", "PNG", "JPG"],
  safetyMarginMm: 3,
  description: "Na versão final, o plugin WordPress/WooCommerce deverá fornecer o gabarito correto para cada modelo, formato e quantidade de lâminas.",
};

export const COVER_MODELS = [
  {
    id: "capa_fotografica_personalizada",
    label: "Fotolivro Capa Fotográfica Personalizado",
    shortLabel: "Capa Fotográfica",
    cover: {
      type: "full_photo_cover_art",
      front: "art",
      spine: "art",
      back: "art",
      uploadMode: "single_full_cover_file",
      adminSizeMode: "custom_by_laboratory",
      requiresFullCoverArt: true,
      coverArt: {
        editableArea: "full_cover",
        sizeSource: "wordpress_plugin_admin",
        includes: ["back", "spine", "front"],
      },
      description: "Capa inteira personalizada. O cliente envia uma única arte pronta, feita no Photoshop, pegando verso + lombada + frente.",
    },
  },
  {
    id: "capa_suede",
    label: "Fotolivro Capa Suede",
    shortLabel: "Capa Suede",
    cover: {
      type: "front_photo_back_texture",
      front: "photo_full",
      spine: "texture",
      back: "texture",
      description: "Frente com foto; lombada e verso em revestimento/textura.",
    },
  },
  {
    id: "capa_acrilico",
    label: "Fotolivro Capa Acrílico",
    shortLabel: "Capa Acrílico",
    cover: {
      type: "front_photo_back_texture",
      front: "photo_full",
      spine: "texture",
      back: "texture",
      description: "Frente com foto; lombada e verso em revestimento/textura.",
    },
  },
  {
    id: "capa_madeira",
    label: "Fotolivro Capa Madeira",
    shortLabel: "Capa Madeira",
    cover: {
      type: "front_photo_back_texture",
      front: "photo_full",
      spine: "texture",
      back: "texture",
      description: "Frente com foto; lombada e verso em revestimento/textura.",
    },
  },
  {
    id: "capa_tecido",
    label: "Fotolivro Capa Tecido",
    shortLabel: "Capa Tecido",
    cover: {
      type: "front_photo_back_texture",
      front: "photo_full",
      spine: "texture",
      back: "texture",
      description: "Frente com foto; lombada e verso em revestimento/textura.",
    },
  },
  {
    id: "capa_magnetica",
    label: "Fotolivro Capa Magnética",
    shortLabel: "Capa Magnética",
    cover: {
      type: "front_photo_back_texture",
      front: "photo_full",
      spine: "texture",
      back: "texture",
      description: "Frente com foto; lombada e verso em revestimento/textura.",
    },
  },
  {
    id: "capa_meia_capa",
    label: "Fotolivro Capa Meia Capa",
    shortLabel: "Meia Capa",
    cover: {
      type: "front_photo_back_texture",
      front: "photo_full",
      spine: "texture",
      back: "texture",
      description: "Frente com foto obrigatória; lombada e verso em revestimento/textura.",
    },
  },
];

export const FORMATS = [
  {
    id: "15x15",
    label: "15x15",
    closedW: 15,
    closedH: 15,
    spreadW: 30,
    spreadH: 15.2,
    orientation: "quadrado",
    customerSize: "15 x 15 cm fechado",
  },
  {
    id: "15x21-v",
    label: "15x21 vertical",
    closedW: 15,
    closedH: 21,
    spreadW: 30,
    spreadH: 20.3,
    orientation: "vertical",
    customerSize: "15 x 21 cm fechado",
  },
  {
    id: "15x21-h",
    label: "15x21 horizontal",
    closedW: 21,
    closedH: 15,
    spreadW: 40,
    spreadH: 20.3,
    orientation: "horizontal",
    customerSize: "21 x 15 cm fechado",
  },
  {
    id: "20x20",
    label: "20x20",
    closedW: 20,
    closedH: 20,
    spreadW: 40,
    spreadH: 20.3,
    orientation: "quadrado",
    customerSize: "20 x 20 cm fechado",
  },
  {
    id: "20x25-v",
    label: "20x25 vertical",
    closedW: 20,
    closedH: 25,
    spreadW: 40,
    spreadH: 25.4,
    orientation: "vertical",
    customerSize: "20 x 25 cm fechado",
  },
  {
    id: "20x25-h",
    label: "20x25 horizontal",
    closedW: 25,
    closedH: 20,
    spreadW: 50,
    spreadH: 20.3,
    orientation: "horizontal",
    customerSize: "25 x 20 cm fechado",
  },
  {
    id: "25x25",
    label: "25x25",
    closedW: 25,
    closedH: 25,
    spreadW: 50,
    spreadH: 25.4,
    orientation: "quadrado",
    customerSize: "25 x 25 cm fechado",
  },
  {
    id: "25x30-v",
    label: "25x30 vertical",
    closedW: 25,
    closedH: 30,
    spreadW: 50,
    spreadH: 30.5,
    orientation: "vertical",
    customerSize: "25 x 30 cm fechado",
  },
  {
    id: "25x30-h",
    label: "25x30 horizontal",
    closedW: 30,
    closedH: 25,
    spreadW: 60,
    spreadH: 25.4,
    orientation: "horizontal",
    customerSize: "30 x 25 cm fechado",
  },
  {
    id: "30x30",
    label: "30x30",
    closedW: 30,
    closedH: 30,
    spreadW: 60,
    spreadH: 30.5,
    orientation: "quadrado",
    customerSize: "30 x 30 cm fechado",
  },
  {
    id: "30x35-h",
    label: "30x35 horizontal",
    closedW: 35,
    closedH: 30,
    spreadW: 70,
    spreadH: 30.5,
    orientation: "horizontal",
    customerSize: "35 x 30 cm fechado",
  },
  {
    id: "30x40-h",
    label: "30x40 horizontal",
    closedW: 40,
    closedH: 30,
    spreadW: 80,
    spreadH: 30.5,
    orientation: "horizontal",
    customerSize: "40 x 30 cm fechado",
  },
];

export const TEXTURES = [
  { id: "casco_azul", label: "Courino Casco Azul", group: "Courinos", previewColor: "#243b5a", css: "linear-gradient(135deg, #17263d 0%, #365b86 52%, #101a2a 100%)" },
  { id: "casco_branco", label: "Courino Casco Branco", group: "Courinos", previewColor: "#f2f0ec", css: "linear-gradient(135deg, #eeeeee 0%, #ffffff 45%, #d7d7d7 100%)" },
  { id: "casco_marrom", label: "Courino Casco Marrom", group: "Courinos", previewColor: "#6d4328", css: "linear-gradient(135deg, #5a351f 0%, #7d5132 48%, #3b2114 100%)" },
  { id: "casco_preto", label: "Courino Casco Preto", group: "Courinos", previewColor: "#171615", css: "linear-gradient(135deg, #111 0%, #333 50%, #080808 100%)" },
  { id: "divas_azul", label: "Divas Azul", group: "Courinos", previewColor: "#2c5d86", css: "linear-gradient(135deg, #244b70 0%, #4c7da6 52%, #18334e 100%)" },
  { id: "divas_linhaca", label: "Divas Linhaça", group: "Courinos", previewColor: "#c8b58d", css: "linear-gradient(135deg, #bba77f 0%, #efe0bd 52%, #9f8b65 100%)" },
  { id: "divas_pera", label: "Divas Pera", group: "Courinos", previewColor: "#b8bd73", css: "linear-gradient(135deg, #9ca35a 0%, #d9dc9a 52%, #777f3c 100%)" },
  { id: "divas_preto", label: "Divas Preto", group: "Courinos", previewColor: "#171717", css: "linear-gradient(135deg, #101010 0%, #333333 52%, #070707 100%)" },
  { id: "dune_azul_marinho", label: "Dune Azul Marinho", group: "Courinos", previewColor: "#17243f", css: "linear-gradient(135deg, #0f1930 0%, #2e4068 52%, #071022 100%)" },
  { id: "dune_champagne", label: "Dune Champagne", group: "Courinos", previewColor: "#c9b99b", css: "linear-gradient(135deg, #d7c5a0 0%, #efe3c7 52%, #bca878 100%)" },
  { id: "dune_rosa", label: "Dune Rosa", group: "Courinos", previewColor: "#d7a8ad", css: "linear-gradient(135deg, #c68f96 0%, #f1c8cc 52%, #a96d75 100%)" },
  { id: "dune_verde_musgo", label: "Dune Verde Musgo", group: "Courinos", previewColor: "#526046", css: "linear-gradient(135deg, #3d4a34 0%, #748061 52%, #2b3425 100%)" },
  { id: "dune_vermelho", label: "Dune Vermelho", group: "Courinos", previewColor: "#8a262b", css: "linear-gradient(135deg, #68181d 0%, #b03a42 52%, #470e13 100%)" },
  { id: "divas_marsalla", label: "Divas Marsalla", group: "Courinos", previewColor: "#6c2934", css: "linear-gradient(135deg, #551d28 0%, #8a3a48 52%, #38111a 100%)" },
  { id: "verde_mate", label: "Verde Mate", group: "Courinos", previewColor: "#60735c", css: "linear-gradient(135deg, #465a43 0%, #819276 52%, #303f2e 100%)" },
  { id: "hotstamping_nude", label: "Hotstampimp Nude", group: "Hotstamping", previewColor: "#caa58e", css: "linear-gradient(135deg, #b98f78 0%, #efcab2 52%, #9f7560 100%)" },
  { id: "hotstamping_preto", label: "Hotstampimp Preto", group: "Hotstamping", previewColor: "#121212", css: "linear-gradient(135deg, #0b0b0b 0%, #2d2d2d 52%, #050505 100%)" },
  { id: "couro_natural_marrom", label: "Couro Natural Marrom", group: "Couro Natural", previewColor: "#6d4328", css: "linear-gradient(135deg, #54321f 0%, #845637 52%, #342015 100%)" },
  { id: "couro_natural_preto", label: "Couro Natural Preto", group: "Couro Natural", previewColor: "#141414", css: "linear-gradient(135deg, #090909 0%, #2b2b2b 52%, #050505 100%)" },
  { id: "couro_natural_tabaco", label: "Couro Natural Tabaco", group: "Couro Natural", previewColor: "#8b4c23", css: "linear-gradient(135deg, #6c3615 0%, #a86735 52%, #4b230c 100%)" },
  { id: "suede_petala", label: "Suede Pétala", group: "Suede", previewColor: "#d9b7ae", css: "linear-gradient(135deg, #c99f95 0%, #f2d1c8 52%, #af8076 100%)" },
  { id: "suede_bege", label: "Suede Bege", group: "Suede", previewColor: "#c7b396", css: "linear-gradient(135deg, #b5a083 0%, #ead8bd 52%, #9f8768 100%)" },
  { id: "linho_azul_anil", label: "Linho Azul Anil", group: "Linho", previewColor: "#24466f", css: "linear-gradient(135deg, #183456 0%, #456b99 52%, #10233d 100%)" },
  { id: "linho_areia", label: "Linho Areia", group: "Linho", previewColor: "#cbb994", css: "linear-gradient(135deg, #b9a57f 0%, #efdfbd 52%, #9f8b65 100%)" },
  { id: "linho_marrom", label: "Linho Marrom", group: "Linho", previewColor: "#6d4d39", css: "linear-gradient(135deg, #553827 0%, #87634d 52%, #392315 100%)" },
  { id: "linho_rosa", label: "Linho Rosa", group: "Linho", previewColor: "#d5a5b6", css: "linear-gradient(135deg, #c08ea1 0%, #efc3d0 52%, #a57487 100%)" },
  { id: "linho_cinza_claro", label: "Linho Cinza Claro", group: "Linho", previewColor: "#c9c9c7", css: "linear-gradient(135deg, #b8b8b6 0%, #eeeeec 52%, #9c9c99 100%)" },
  { id: "linho_verde", label: "Linho Verde", group: "Linho", previewColor: "#77856c", css: "linear-gradient(135deg, #5e6b55 0%, #9ca98e 52%, #44503e 100%)" },
];

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function getLaminasFromPages(pageCount) {
  return Number(pageCount) / 2;
}

export function getSpineMm(pageCount) {
  return getLaminasFromPages(pageCount) * SPINE_RULE.valueMm;
}

export function getCoverTemplateSpec({ coverModelId, formatId, pageCount }) {
  const model = findCoverModel(coverModelId);
  const format = findFormat(formatId);
  const laminas = getLaminasFromPages(pageCount);
  const spineMm = getSpineMm(pageCount);
  const spineCm = spineMm / 10;
  const fullCoverWidthCm = Number((format.closedW * 2 + spineCm).toFixed(2));
  const fullCoverHeightCm = format.closedH;
  const fullCoverWidthMm = Number((fullCoverWidthCm * 10).toFixed(1));
  const fullCoverHeightMm = Number((fullCoverHeightCm * 10).toFixed(1));
  const frontWidthMm = Number((format.closedW * 10).toFixed(1));
  const backWidthMm = Number((format.closedW * 10).toFixed(1));
  const enabled = model?.cover?.type === "full_photo_cover_art";
  const fileSlug = `gabarito-capa-${format.id}-${laminas}-laminas-lombada-${spineMm}mm`;

  return {
    enabled,
    source: COVER_TEMPLATE_SETTINGS.source,
    adminWillRegisterFiles: COVER_TEMPLATE_SETTINGS.adminWillRegisterFiles,
    generatedDemo: true,
    modelId: model.id,
    modelLabel: model.label,
    formatId: format.id,
    formatLabel: format.label,
    customerSize: format.customerSize,
    pages: Number(pageCount),
    laminas,
    spineMm,
    spineCm,
    backWidthCm: format.closedW,
    spineWidthCm: spineCm,
    frontWidthCm: format.closedW,
    heightCm: fullCoverHeightCm,
    fullCoverWidthCm,
    fullCoverHeightCm,
    backWidthMm,
    spineWidthMm: spineMm,
    frontWidthMm,
    fullCoverWidthMm,
    fullCoverHeightMm,
    safetyMarginMm: COVER_TEMPLATE_SETTINGS.safetyMarginMm,
    fileName: `${fileSlug}.svg`,
    futurePluginKey: `${model.id}/${format.id}/${laminas}-laminas`,
    downloadLabel: `Baixar gabarito ${format.label} · ${laminas} lâminas · lombada ${spineMm} mm`,
  };
}

export function makeCoverTemplateSvg(spec) {
  const s = spec || {};
  const width = Number(s.fullCoverWidthMm || 420);
  const height = Number(s.fullCoverHeightMm || 210);
  const backW = Number(s.backWidthMm || 200);
  const spineW = Number(s.spineWidthMm || 20);
  const frontW = Number(s.frontWidthMm || 200);
  const safe = Number(s.safetyMarginMm || 3);
  const xBackEnd = backW;
  const xSpineEnd = backW + spineW;
  const title = `Gabarito capa ${s.formatLabel || ""} - ${s.laminas || ""} lâminas - lombada ${s.spineMm || ""} mm`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
  <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#111111" stroke-width="0.6"/>
  <rect x="${safe}" y="${safe}" width="${Math.max(1, width - safe * 2)}" height="${Math.max(1, height - safe * 2)}" fill="none" stroke="#e63946" stroke-width="0.45" stroke-dasharray="2 2"/>
  <line x1="${xBackEnd}" y1="0" x2="${xBackEnd}" y2="${height}" stroke="#111111" stroke-width="0.45"/>
  <line x1="${xSpineEnd}" y1="0" x2="${xSpineEnd}" y2="${height}" stroke="#111111" stroke-width="0.45"/>
  <rect x="${xBackEnd}" y="0" width="${spineW}" height="${height}" fill="#f4f4f4" stroke="none"/>
  <text x="${backW / 2}" y="${height / 2}" font-family="Arial, Helvetica, sans-serif" font-size="8" text-anchor="middle" font-weight="700" fill="#555555">VERSO</text>
  <text x="${xBackEnd + spineW / 2}" y="${height / 2}" font-family="Arial, Helvetica, sans-serif" font-size="5.2" text-anchor="middle" font-weight="700" fill="#555555" transform="rotate(90 ${xBackEnd + spineW / 2} ${height / 2})">LOMBADA ${escapeXml(s.spineMm)} mm</text>
  <text x="${xSpineEnd + frontW / 2}" y="${height / 2}" font-family="Arial, Helvetica, sans-serif" font-size="8" text-anchor="middle" font-weight="700" fill="#555555">FRENTE</text>
  <text x="${width / 2}" y="10" font-family="Arial, Helvetica, sans-serif" font-size="4.2" text-anchor="middle" fill="#111111">${escapeXml(title)}</text>
  <text x="${width / 2}" y="${height - 7}" font-family="Arial, Helvetica, sans-serif" font-size="3.6" text-anchor="middle" fill="#e63946">linha vermelha = margem de segurança ${safe} mm | gabarito demonstrativo</text>
</svg>`;
}

export function makePageCountOptions() {
  const pages = [];
  for (let p = PAGE_OPTIONS.minPages; p <= PAGE_OPTIONS.maxPages; p += PAGE_OPTIONS.editorStep) {
    pages.push(p);
  }
  return pages;
}

export function getSpineCm(pageCount) {
  return getSpineMm(pageCount) / 10;
}

export function findCoverModel(id) {
  return COVER_MODELS.find((item) => item.id === id) || COVER_MODELS.find((item) => item.id === DEFAULT_COVER_MODEL_ID) || COVER_MODELS[0];
}

export function findFormat(id) {
  return FORMATS.find((item) => item.id === id) || FORMATS.find((item) => item.id === DEFAULT_FORMAT_ID) || FORMATS[0];
}

export function findTexture(id) {
  return TEXTURES.find((item) => item.id === id) || TEXTURES.find((item) => item.id === DEFAULT_TEXTURE_ID) || TEXTURES[0];
}

export function getPreview3DConfig({ coverModelId, formatId, pageCount, textureId }) {
  const model = findCoverModel(coverModelId);
  const format = findFormat(formatId);
  const texture = findTexture(textureId);
  const model3D = PREVIEW_3D_BY_COVER_MODEL[model.id] || PREVIEW_3D_BY_COVER_MODEL[DEFAULT_COVER_MODEL_ID];
  const laminas = getLaminasFromPages(pageCount);
  const spineMm = getSpineMm(pageCount);
  const spineCm = spineMm / 10;

  return {
    ...PREVIEW_3D_BASE_CONFIG,
    ...model3D,
    adminSchema: PREVIEW_3D_ADMIN_SCHEMA,
    modelId: model.id,
    modelLabel: model.label,
    modelShortLabel: model.shortLabel,
    formatId: format.id,
    formatLabel: format.label,
    textureId: texture.id,
    textureLabel: texture.label,
    textureColor: texture.previewColor,
    pageCount: Number(pageCount),
    laminas,
    spineMm,
    spineCm,
    dimensions: {
      closedWidthCm: format.closedW,
      closedHeightCm: format.closedH,
      spreadWidthCm: format.spreadW,
      spreadHeightCm: format.spreadH,
      fullCoverWidthCm: Number((format.closedW * 2 + spineCm).toFixed(2)),
      fullCoverHeightCm: format.closedH,
    },
    productionRules: {
      spineRule: SPINE_RULE,
      interior: INTERIOR,
      safetyMarginCm: SAFETY_MARGIN_CM,
    },
    pluginFutureKey: `preview3d/${model.id}/${format.id}/${laminas}-laminas`,
  };
}
