# Diagramador Picmimos V5.9 Preview Engine Comercial com Snapshots + Viewer Interativo

Esta versão transforma o preview com snapshots reais em uma experiência comercial interativa, mantendo o editor como fonte da verdade.

## Escopo da V5.9

- Mantém captura fiel da capa e das lâminas com `html-to-image`.
- Cria um manifesto de preview com capa completa, painéis de frente/lombada/verso e snapshots das lâminas.
- Gera crops reais em canvas para frente, lombada e verso.
- Aplica os snapshots em um viewer 3D próprio com Three.js/R3F já presente no projeto.
- Integra a lombada ao álbum físico, evitando painel isolado.
- Mantém o modo Aberto usando o snapshot real da lâmina.
- Adiciona rotação comercial controlada, auto-rotação opcional, zoom e reset.
- Usa ambiente procedural próprio, sem GLB externo e sem assets proprietários.

## Arquivos alterados

- `app/src/App.jsx`
- `app/src/styles.css`
- `app/README.md`
- `app/VERSION.txt`

## Observações

Não foram alterados `package.json`, `package-lock.json`, `productConfigs.js`, upload, crop/enquadramento, layouts do miolo, ferramenta de texto, validações, Dockerfile, nginx, deploy, `dist` ou `node_modules`.
