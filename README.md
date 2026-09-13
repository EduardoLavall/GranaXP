# GranaXP

GranaXP é um MVP de gestão financeira pessoal gamificada com apresentação interativa e demo jogável em estilo pixel-art.

O repositório agora está organizado como **frontend + backend serverless para Vercel**:

- frontend: HTML + CSS + JavaScript puro;
- backend: Vercel Functions em `/api`;
- persistência MVP: Google Sheets API;
- fallback offline/local: `localStorage`;
- especificações para colaboração humano + IA em `docs/specs/`.

## Entradas principais
- `slides.html` — apresentação interativa com 13 slides;
- `demo.html` — aplicação/demo jogável;
- `/api/health` — diagnóstico do backend;
- `/api/state` — leitura/gravação do estado persistido.

## Como a persistência funciona
Quando hospedado no Vercel, a demo tenta carregar o estado do Google Sheets antes de iniciar. Mudanças continuam salvas localmente e são sincronizadas para o backend em segundo plano.

Se o backend estiver indisponível — ou se os arquivos forem abertos diretamente via `file://` — o aplicativo continua usando `localStorage`.

As despesas também são sincronizadas para uma aba `Transactions` da planilha para facilitar inspeção e evolução futura.

## Configuração
Veja **[`docs/SETUP.md`](docs/SETUP.md)** para o passo a passo completo de:
- Google Cloud / Google Sheets API;
- service account;
- compartilhamento da planilha;
- variáveis de ambiente no Vercel;
- deploy e diagnóstico.

Template de variáveis: `.env.example`.

## Spec-driven development
Antes de mudanças relevantes, IAs e colaboradores devem ler **[`AGENTS.md`](AGENTS.md)** e as specs:

- [`docs/specs/PRODUCT.md`](docs/specs/PRODUCT.md)
- [`docs/specs/ARCHITECTURE.md`](docs/specs/ARCHITECTURE.md)
- [`docs/specs/API.md`](docs/specs/API.md)
- [`docs/specs/DATA_MODEL.md`](docs/specs/DATA_MODEL.md)
- [`docs/specs/MOBILE_ROADMAP.md`](docs/specs/MOBILE_ROADMAP.md)
- [`docs/specs/STATEMENT_IMPORT.md`](docs/specs/STATEMENT_IMPORT.md)
- [`docs/specs/DECISIONS.md`](docs/specs/DECISIONS.md)

Mudanças de comportamento/arquitetura devem atualizar a spec correspondente no mesmo PR.

## Controles dos slides
- `→`, `↓`, `Espaço` ou `PageDown`: próximo slide
- `←`, `↑` ou `PageUp`: anterior
- `Home` / `End`: primeiro / último
- `Esc`: visão geral
- `F`: tela cheia
- `M`: som
- `D`: demo
- `E`: exportação
- `H` ou `?`: ajuda

## Exportação
A apresentação exporta PDF e PowerPoint no navegador usando bibliotecas locais em `vendor/`.

## Demo roteirizada
O estado inicial continua preparado para apresentação: registrar um gasto de R$ 35 conclui a missão, concede XP/moedas e leva o jogador ao nível 5. Depois é possível comprar uma melhoria.

## Próximas frentes planejadas
1. autenticação real antes de multiusuário;
2. mobile-first com navegação inferior e HUD compacto;
3. importação de extratos via CSV/OFX primeiro;
4. PDF/OCR/IA atrás de adapters de backend;
5. revisão obrigatória de transações importadas antes de gravá-las;
6. migração futura do Google Sheets para banco relacional se o MVP ultrapassar os limites da planilha.

## Segurança
Credenciais Google ficam **somente** nas variáveis de ambiente do Vercel. O frontend nunca deve acessar diretamente a API do Google nem conter chaves privadas.
