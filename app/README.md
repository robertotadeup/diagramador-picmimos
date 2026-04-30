# Diagramador Picmimos V5.7 Preview 3D Capa Fiel e Giro Comercial

Versão focada no problema real identificado na V5.6: a capa vista no editor precisava ser recortada e apresentada no preview 3D com mais fidelidade, e o usuário precisava conseguir girar o álbum com o mouse sem cair em ângulos ruins.

## Objetivo

Aproximar o preview do comportamento esperado em soluções como Sunpics/Auryn: produto configurável, textura real do projeto, capa/páginas legíveis, rotação interativa controlada e visual comercial.

## Escopo da V5.7

- Recorte de capa completa por painel: verso, lombada e frente.
- Capa fotográfica total usa a arte enviada como textura-base e mostra a frente no modo Capa.
- Verso e lombada passam a usar o trecho correspondente da arte quando o modelo é capa totalmente fotográfica.
- Giro por mouse no preview com limites seguros e reset por duplo clique.
- Mantém a lógica da V5.6 para modo Aberto e página/lâmina real.
- Mantém controles, badges e ambientes fora da área principal.
- Sem alteração no editor 2D, upload, layouts, crop, texto, validações, productConfigs, package.json ou package-lock.

## Arquivos alterados

- `app/src/App.jsx`
- `app/src/styles.css`
- `app/README.md`
- `app/VERSION.txt`
