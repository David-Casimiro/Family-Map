# Correções aplicadas

1. Removido `integrity` do Leaflet para evitar bloqueio por hash inválido.
2. Ajustados caminhos para `./firebase-config.js`, `./app.js`, `./styles.css` e `./assets/default-avatar.svg`.
3. Recriado `firebase-config.js` com `export const firebaseConfig`.
4. Recriado `assets/default-avatar.svg`.

## Atenção

No GitHub, os arquivos precisam ficar assim na raiz do repositório:

index.html
styles.css
app.js
firebase-config.js
assets/default-avatar.svg

Se estiver tudo dentro de uma pasta como `family-tracker-site/`, o GitHub Pages pode não encontrar os arquivos.
