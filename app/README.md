# Diagramador Picmimos / Proalbuns V5.8

Versão focada em corrigir definitivamente o enquadramento das imagens dentro dos containers, no estilo SmartAlbums/Auryn, mas com interface simples para cliente final.

## O que mudou na V5.8

- O quadro agora é tratado como `FRAME / CONTAINER`.
- A foto dentro do quadro agora é uma `IMAGE LAYER` independente.
- O recorte final é feito pela `MASK / CROP FINAL` do container.
- Arrastar em cima da foto move somente a imagem dentro do container.
- Arrastar o botão `Mover` move somente o quadro inteiro.
- Arrastar as alças amarelas redimensiona somente o container.
- Arrastar o botão `Trocar foto` até outro container troca as imagens entre os quadros.
- As miniaturas da esquerda aparecem inteiras, usando visualização sem crop.
- A foto do frame inicia centralizada e com escala controlada.
- O usuário consegue ajustar o enquadramento pelo mouse e também pelo painel lateral.
- Ao selecionar um frame, a imagem inteira aparece como prévia translúcida por trás da máscara, mostrando a área excedente disponível para enquadramento.
- Mantidos layouts com containers horizontais, verticais e quadrados.
- Mantidos espaçamento automático de 0 mm a 5 mm e guias visuais.

## Como testar localmente

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite.

## Como subir no GitHub/EasyPanel

Subir apenas estes arquivos e pastas dentro de `/app`:

- `src`
- `Dockerfile`
- `index.html`
- `nginx.conf`
- `package.json`
- `postcss.config.js`
- `README.md`
- `VERSION.txt`

Não subir:

- `node_modules`
- `dist`
- `package-lock.json`

## Teste obrigatório da V5.8

1. Abrir o editor.
2. Confirmar topo: `Diagramador Picmimos V5.8`.
3. Clicar em `Fotos demo`.
4. Clicar em `Montar automático`.
5. Colocar uma foto horizontal em container vertical.
6. Confirmar que a foto aparece centralizada e reposicionável.
7. Arrastar a foto dentro do container e confirmar que só a imagem se move.
8. Usar o botão `Mover` e confirmar que só ele move o container.
9. Usar as bolinhas amarelas e confirmar resize do container.
10. Usar `Trocar foto` e confirmar troca entre containers.
11. Confirmar que a miniatura da esquerda não está cropada.
12. Confirmar que a linha de corte de 3 mm é apenas visual.
