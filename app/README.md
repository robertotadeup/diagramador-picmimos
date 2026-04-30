# Diagramador Picmimos V5.4 Preview 3D Premium Organizado

Versão focada em organizar somente o preview/modal 3D, mantendo o editor 2D intacto.

## Objetivo

Corrigir a bagunça visual da V5.3 no modal 3D: separar informações, controles, Canvas e navegação; deixar o álbum físico mais centralizado; reduzir o destaque do palco/floor; e atualizar todos os textos internos para V5.4.

## Escopo da V5.4

- Preview 3D com Canvas/Three.js mantido.
- Faixa de informações do produto fora da área principal do álbum.
- Controles Capa, Aberto, Lombada, Verso, Zoom +, Zoom - e Reset fora do Canvas.
- Palco mais limpo e menos chamativo.
- Álbum mais centralizado, com sombra e luz mais suaves.
- Navegação de ambiente e páginas mais discreta.
- Sem alteração no editor 2D, upload, layouts, crop, textos, validações, productConfigs, package.json ou package-lock.

## Arquivos alterados

- `app/src/App.jsx`
- `app/src/styles.css`
- `app/README.md`
- `app/VERSION.txt`

---

# Histórico anterior

A V5.3 restaurou o preview 3D real depois da V5.2, mas ainda deixou textos visíveis como V5.2 e manteve controles sobre a cena. A V5.4 organiza essa camada sem mexer na base do editor.
