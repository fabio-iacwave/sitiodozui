# Sítio do Zui — Site estático

Resumo
- Site estático para divulgação e reserva do Sítio do Zui.
- Carrossel de fotos com modal/lightbox (Swiper), zoom (double-tap/double-click) e carregamento de imagens em alta resolução somente no modal.
- Arquitetura simples: HTML estático + CSS/JS em `src/` e partials em `src/partials`.

Estrutura principal
- `index.html` — página principal (usa placeholders para header/footer que são injetados em runtime).
- `src/css/styles.css` — estilos extraídos do HTML.
- `src/js/main.js` — lógica: construção do carrossel, modal, injeção de partials, WhatsApp links, etc.
- `src/partials/header.html` — header partial (será injetado em `#header-placeholder`).
- `src/partials/footer.html` — footer partial (será injetado em `#footer-placeholder`).
- `assets/` — imagens, favicon e outros recursos estáticos.

Requisitos
- Navegador moderno (Chrome/Firefox/Safari atual).
- Python 3 (para servidor estático de teste) ou qualquer servidor HTTP.
- (Opcional) `gh` CLI se quiser criar PRs pela linha de comando.

Rodar localmente (teste rápido)
1. No terminal, abra a pasta do projeto:

```bash
cd /home/fabio/devops/projetos/sitiodozui
```

2. Inicie servidor estático (porta 8001 está disponível no projeto; ajuste se necessário):

```bash
python3 -m http.server 8001
```

3. Abra no navegador: `http://localhost:8001`

Notas de desenvolvimento
- Ao carregar a página o `src/js/main.js` injeta `header.html` e `footer.html` nos placeholders do `index.html` antes de inicializar o carrossel/modal.
- WhatsApp: os links são montados dinamicamente em `src/js/main.js`; os botões agora abrem em nova aba (`target="_blank"` + `rel="noopener noreferrer"`).
- Para popular a galeria, coloque imagens em `assets/imagem1.jpg`, `assets/imagem2.jpg`, etc. O script procura até `data-max` (valor default 50).

- Crie o PR (pela web ou com `gh`):

```bash
gh pr create --base main --head feature/estrutura --title "feat: estrutura e galeria" --body "Resumo das mudanças e instruções de teste"
```

- Aguarde CI/revisões, então mescle (squash/merge conforme política) e rode seu pipeline de deploy.

Testes / Verificações
- Abra `http://localhost:8001` e verifique:
	- Carrossel carrega sem overflow em mobile.
	- Ao clicar em uma imagem do carrossel, o modal abre com a imagem em maior resolução.
	- Double-tap / double-click faz zoom na imagem do modal.
	- Botões de WhatsApp abrem em nova aba.
	- Header e footer aparecem corretamente (foram injetados dos partials).

Problemas conhecidos e soluções rápidas
- Porta 8000 ocupada: use outra porta (ex.: `python3 -m http.server 8001`).
- Modal com problemas de sobreposição: o modal é anexado ao `body` (stacking-context fix). Se o header continuar acima verifique `z-index` personalizados.

Contribuição
- Abra um branch curto por funcionalidade (`feature/*`) e crie PRs com descrição e instruções de teste.

Contato
- Para dúvidas sobre o projeto, me chame no repositório ou no WhatsApp do time.