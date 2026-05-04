# Diagramador Picmimos V5.8 Preview Comercial Fiel com Snapshots Reais

Esta versão corrige o preview para usar snapshots reais do DOM do editor, preservando fotos, crop, zoom, textos e layouts exatamente como o cliente montou.

## Escopo da V5.8

- Modal “Pré-visualização V5.8”.
- Captura limpa da capa e das lâminas com `html-to-image`.
- Ocultação temporária de elementos auxiliares de edição na fonte de snapshot.
- Modos Capa, Aberto, Lombada e Verso alimentados pelos snapshots reais.
- Folheio por capa, lâminas e verso.
- Zoom visual no modal sem alterar o projeto.
- Sem alteração em upload, crop, layouts do miolo, texto, validações, `productConfigs.js`, `package.json` ou `package-lock.json`.

## Arquivos alterados

- `app/src/App.jsx`
- `app/src/styles.css`
- `app/README.md`
- `app/VERSION.txt`
