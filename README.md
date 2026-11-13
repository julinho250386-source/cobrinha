# Serpente — Jogo Snake Clássico

Aplicação web moderna e responsiva do clássico jogo da cobrinha (**Snake**), desenvolvida com **React**, **TypeScript**, **Tailwind CSS** e **Vite**, pronta para versionamento no GitHub e deploy instantâneo na Vercel.

---

## Recursos Principais

- **5 Níveis de Dificuldade Progressiva**:
  1. **Nível 1 — Clássico** (`0+ pts`): Arena livre sem obstáculos internos para aquecimento.
  2. **Nível 2 — Acelerado** (`50+ pts`): Velocidade maior e 4 barreiras nos cantos.
  3. **Nível 3 — Labirinto** (`120+ pts`): Ritmo rápido com muros centrais e passagens laterais.
  4. **Nível 4 — Campo Minado** (`210+ pts`): Alta velocidade, pilares táticos e frutas douradas bônus (`+30 pts`).
  5. **Nível 5 — Mestre** (`320+ pts`): Velocidade extrema, layout complexo de obstáculos e aceleração contínua a cada 50 pontos extras.
- **Progressão Clara e Segura**: Barra de progresso para o próximo nível no painel superior, aviso visual na transição de fase e janela de proteção breve para novos obstáculos.
- **Controles Multiplataforma**:
  - **Teclado**: Setas direcionais (`↑ ↓ ← →`) ou `W A S D`, além de `Espaço`/`P` para pausar e `Enter` para reiniciar.
  - **Dispositivos Móveis**: Gestos de deslizar (*swipe*) diretamente no tabuleiro e botões direcionais táteis na tela.
- **Identificação e Ranking Persistente**:
  - Campo obrigatório para o jogador informar seu nome antes da partida.
  - Ranking **Top 10** ordenado da maior para a menor pontuação, salvo automaticamente no navegador via `localStorage`.
- **Feedback Sonoro Opcional**: Efeitos sintetizados com Web Audio API e botão para ativar ou silenciar o áudio a qualquer momento.

---

## Tecnologias Utilizadas

- **React 19** + **TypeScript**
- **Vite** (build estático rápido e otimizado)
- **Tailwind CSS v4**
- **Lucide React** (ícones de interface)
- **HTML5 Canvas** com escala HiDPI (`devicePixelRatio`) e **Web Audio API**

---

## Estrutura de Pastas

```text
├── index.html                   # Documento HTML principal (pt-BR) e fontes
├── package.json                 # Scripts e dependências do projeto
├── vercel.json                  # Configuração de build estático e SPA para a Vercel
├── vite.config.ts               # Configuração do Vite
└── src/
    ├── main.tsx                 # Ponto de entrada React
    ├── App.tsx                  # Estado do jogo, loop principal, HUD e layout
    ├── index.css                # Estilos globais e configuração do Tailwind
    ├── config/
    │   └── gameConfig.ts        # Regras dos 5 níveis e créditos do criador
    ├── types/
    │   └── game.ts              # Tipagens TypeScript do jogo e ranking
    ├── utils/
    │   ├── sound.ts             # Sintetizador de efeitos sonoros (Web Audio API)
    │   └── storage.ts           # Persistência do ranking e preferências no localStorage
    └── components/
        ├── GameBoard.tsx        # Tabuleiro Canvas, gestos touch e telas de menu/fim de jogo
        ├── TouchControls.tsx    # Direcional tátil para celular/tablet
        ├── RankingPanel.tsx     # Exibição e gerenciamento do Top 10
        └── LevelsGuide.tsx      # Resumo visual dos 5 níveis de dificuldade
```

---

## Como Executar Localmente

### Pré-requisitos

- **Node.js** (versão 18 ou superior recomendada)
- **npm** (instalado junto com o Node.js)

### Passo a passo

1. Instale as dependências do projeto:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abra o navegador no endereço exibido no terminal (por padrão `http://localhost:3000`).

4. Para gerar a versão de produção estática (pasta `dist/`):
   ```bash
   npm run build
   ```

---

## Como Enviar para o GitHub e Publicar na Vercel

### 1. Subindo o projeto para o GitHub

```bash
git init
git add .
git commit -m "feat: implementa jogo Serpente com 5 niveis e ranking local"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/serpente-snake.git
git push -u origin main
```

### 2. Publicando na Vercel (Pelo Painel Web — Recomendado)

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique em **Add New... → Project**.
3. Selecione o repositório `serpente-snake`.
4. A Vercel detectará automaticamente o arquivo `vercel.json` e o framework **Vite**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Clique em **Deploy** e aguarde alguns segundos para receber sua URL pública.

### 3. Publicando via Vercel CLI (Alternativa pelo Terminal)

```bash
npm install -g vercel
vercel
```

Para publicar diretamente em produção após os testes:

```bash
vercel --prod
```

---

## Personalizando os Créditos do Criador

Para alterar o nome exibido no rodapé da aplicação, edite a constante `CREATOR_INFO` no arquivo `src/config/gameConfig.ts`:

```ts
export const CREATOR_INFO = {
  name: 'Seu Nome', // Substitua pelo seu nome completo
  role: 'Criador & Desenvolvedor',
  year: new Date().getFullYear(),
};
```

---

## Informações do Criador

- **Criador**: Seu Nome
- **Projeto**: Serpente — Jogo Snake Clássico em 5 Níveis
- **Licença**: MIT / Uso livre para portfólio e estudos
