# Gestão da Ótica

Site de um arquivo só (`index.html`), sem instalação. A página inicial leva a três áreas:

- **Caixas**: conferência Stone x Ssotica, Pix, cartões, Mumbuca e contas pagas
- **Férias**: controle de férias pela CLT, avisos, calendário e aviso e recibo para imprimir
- **Escala de trabalho**: escala mensal pela carga horária semanal

## Publicar no GitHub Pages

1. Envie o `index.html` para a raiz do repositório (substituindo o antigo) e apague os outros arquivos html antigos.
2. Settings > Pages > Deploy from a branch > `main` / `(root)` > Save.
3. Em 1 a 2 minutos o site abre em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Estrutura do código

- `src/caixa.html`, `src/ferias.html`, `src/escala.html`: as três áreas. `src/shell_*.txt`: página inicial, login e nuvem.
- Depois de editar um arquivo em `src/`, rode `python3 build.py` para gerar o `index.html` que vai ao ar.
- `tabelas/index.html`: buscador de preços de lentes (quarta área). É carregado só quando alguém entra em Tabelas. Favoritos, orçamentos e recentes (`otica_fav`, `otica_orc`, `otica_rec`) são salvos na nuvem; o endereço de atualização dos dados fica só em cada aparelho.
- A Escala tem uma escala por loja. Funcionários e férias vêm da área Férias (a origem). Quem marca férias em Férias já aparece de férias na Escala.

## Dados na nuvem (Supabase)

- Os dados de Caixas, Férias e Escala são salvos no Supabase (projeto `gestao-otica`) e carregados ao entrar. É preciso fazer login com e-mail e senha.
- Só entra quem está na tabela `membros` (botão Conta > Equipe, para o administrador). Papéis: administrador, editor e leitor.
- A chave que está no `index.html` é a chave pública (publishable). Quem protege os dados é o login junto com as regras de acesso (RLS) do banco. Nunca coloque a chave secreta (service role) no site.
- Ao entrar num aparelho com dados antigos no navegador, o que está na nuvem prevalece e a cópia local fica guardada como `<chave>__bkp_local`.

## Importante

- A leitura de fotos (JPG) no Caixas só funciona dentro do Claude. PDF e Excel funcionam normalmente.
- Se dois aparelhos editarem a mesma área ao mesmo tempo, vale o último a salvar. Um aviso aparece quando há dados novos de outro aparelho.
