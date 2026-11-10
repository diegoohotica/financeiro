# Gestão da Ótica

Site estático (HTML puro, sem instalação) com duas áreas:

- `financeiro/` — conferência Stone × Ssotica, Pix, cartões, Mumbuca e contas pagas
- `ferias/` — controle de férias com prazos pela CLT

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (pode ser privado se o seu plano permitir Pages privado; senão, público).
2. Envie estes arquivos mantendo as pastas: `index.html`, `financeiro/index.html`, `ferias/index.html`.
3. No repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, escolha a branch `main` e a pasta `/ (root)`, e salve.
4. Em 1 a 2 minutos o site abre em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Importante

- Os lançamentos ficam salvos no navegador de cada aparelho (localStorage). Não vão para o GitHub.
- Para levar os dados de um aparelho a outro, use "Exportar backup" em um e "Importar" no outro.
- A leitura de **fotos** (JPG) só funciona dentro do Claude. PDF e Excel funcionam normalmente no site.
- Site público: qualquer pessoa com o link abre as telas, mas só vê os dados que estiverem no próprio navegador dela.
