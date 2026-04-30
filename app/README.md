# Diagramador Picmimos V5.6 Preview 3D Textura Real e Câmera Comercial

Versão focada em corrigir o preview/modal 3D com prioridade em leitura real do projeto: capa, lombada, verso e páginas precisam aparecer com textura/imagem clara, sem depender de um render 3D lavado.

## Objetivo

Trocar o foco de “efeito 3D genérico” para um mockup comercial confiável: câmera travada por modo, arte/página legível, fundo premium com contraste e controles visíveis.

## Escopo da V5.6

- Preview 3D comercial em DOM/CSS 2.5D para maior fidelidade visual.
- Capa com foto/arte real ou placeholder claro quando faltar imagem.
- Páginas abertas com fotos e textos visíveis a partir do projeto.
- Lombada e verso mais limpos, sem peças estranhas/tubos/trilhos.
- Ambiente menos lavado e com mais contraste.
- Controles e badges fora da área visual principal.
- Sem alteração no editor 2D, upload, layouts, crop, textos, validações, productConfigs, package.json ou package-lock.

## Arquivos alterados

- `app/src/App.jsx`
- `app/src/styles.css`
- `app/README.md`
- `app/VERSION.txt`
