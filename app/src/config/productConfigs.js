// V3.2 Config Base — Picmimos / Proalbuns
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

export const COVER_MODELS = [
  {
    id: "capa_fotografica_personalizada",
    label: "Fotolivro Capa Fotográfica Personalizado",
    shortLabel: "Capa Fotográfica",
    cover: {
      type: "full_photo_cover",
      front: "photo_full",
      spine: "photo_or_art",
      back: "photo_or_art",
      description: "Capa inteira fotográfica. Frente, lombada e verso podem ser arte/foto.",
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

export function makePageCountOptions() {
  const pages = [];
  for (let p = PAGE_OPTIONS.minPages; p <= PAGE_OPTIONS.maxPages; p += PAGE_OPTIONS.editorStep) {
    pages.push(p);
  }
  return pages;
}

export function getSpineCm(pageCount) {
  const laminas = Number(pageCount) / 2;
  return (laminas * SPINE_RULE.valueMm) / 10;
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
