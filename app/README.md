# Diagramador Picmimos V5.8

Correção cirúrgica em cima da V5.7.

## Ajustes desta versão

- Mantida a interface da V5.7.
- Miniaturas da biblioteca lateral agora exibem a foto inteira, sem `object-fit: cover`.
- Foto dentro do container agora funciona como camada posicionável atrás da máscara.
- O corte final é feito somente pelo `frame-crop`, não pelo próprio `<img>`.
- Arrastar a foto continua ajustando o enquadramento.
- Botão `Mover` continua movendo apenas o quadro.
- Botão `Trocar foto` continua separado.

## Deploy

Projeto React + Vite usando Dockerfile com pnpm para EasyPanel.

Não subir `node_modules`, `dist` ou `package-lock.json`.
