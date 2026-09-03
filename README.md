# GranaXP

Apresentação interativa e demo jogável de um MVP de controle financeiro gamificado. Toda a experiência está em português do Brasil, funciona sem backend e usa apenas HTML, CSS, JavaScript, SVG e APIs do navegador.

## Como executar

Opção 1: abra `slides.html` diretamente no navegador.

Opção 2: na pasta do projeto, inicie um servidor estático:

```bash
python -m http.server 8080
```

Depois, acesse `http://localhost:8080/slides.html`.

## Controles dos slides

- `→`, `↓`, `Espaço` ou `PageDown`: próximo slide
- `←`, `↑` ou `PageUp`: slide anterior
- `Home` / `End`: primeiro / último slide
- `Esc`: visão geral
- `F`: tela cheia
- `M`: ativar ou silenciar sons
- `D`: abrir a demo
- `E`: menu de exportação
- `H` ou `?`: ajuda

## Exportação

O menu de exportação gera PDF e PowerPoint no próprio navegador. As bibliotecas necessárias estão em `vendor`, portanto não é preciso acesso à internet. A opção de impressão usa uma folha 16:9 por slide e oculta os controles.

## Demo

Use **Continuar** para carregar o estado preparado para a apresentação. Registre um gasto de R$ 35 em Alimentação para concluir a missão diária, receber XP e moedas e subir ao nível 5. Depois, visite **Melhorias** para comprar um item.

Em **Configurações**, o botão **Reiniciar demo** restaura esse momento. Também é possível abrir `demo.html?reset=1`.

O estado é salvo localmente na chave `granaxp_save_v1` do `localStorage`.

## Estrutura

- `slides.html`: apresentação interativa com 13 slides
- `demo.html`: MVP jogável
- `css/`: sistema visual pixel art e layouts
- `js/`: navegação, transições, áudio, exportação, persistência e lógica do jogo
- `assets/`: SVGs originais
- `vendor/`: bibliotecas locais para exportar PDF e PowerPoint
