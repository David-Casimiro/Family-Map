# Family Tracker

Site estático para monitoramento familiar de localização em tempo real.

## Recursos

- Cadastro e login por e-mail e senha.
- Perfil com nome e foto.
- Código da família para agrupar usuários.
- Mapa em tempo real.
- Compartilhamento de localização com permissão do navegador.
- Botão para pausar compartilhamento.
- Cadastro, edição e exclusão de lugares frequentes.
- Preparado para GitHub Pages.

## Tecnologias

- HTML
- CSS
- JavaScript
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Leaflet
- OpenStreetMap

## Como configurar o Firebase

1. Acesse o Firebase Console.
2. Crie um projeto.
3. Adicione um app Web.
4. Copie as credenciais do Firebase.
5. Abra o arquivo `firebase-config.js`.
6. Substitua os valores de exemplo pelos valores reais do seu projeto.

## Ativar login por e-mail e senha

No Firebase Console:

1. Vá em Authentication.
2. Clique em Sign-in method.
3. Ative Email/Password.

## Criar banco Firestore

1. Vá em Firestore Database.
2. Crie o banco.
3. Comece em modo de produção.
4. Cole as regras do arquivo `firestore.rules`.

## Ativar Storage

1. Vá em Storage.
2. Crie o bucket.
3. Cole as regras do arquivo `storage.rules`.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todos os arquivos deste projeto.
3. Vá em Settings > Pages.
4. Em Source, selecione a branch principal.
5. Salve.
6. Acesse o link gerado pelo GitHub Pages.

## Observação de privacidade

Este projeto deve ser usado apenas com consentimento claro dos participantes.
Cada pessoa precisa criar conta, aceitar a permissão de localização no navegador e pode pausar o compartilhamento quando quiser.
