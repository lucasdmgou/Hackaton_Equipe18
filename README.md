# 📋 Ficha de Acompanhamento e Diagnóstico do Projeto

> **Orientações para a Equipe:** Este documento deve ser preenchido pela equipe para alinhar as expectativas do projeto com os mentores e organizadores. Sejam diretos, honestos e realistas nas respostas.

---

## 🏛️ 1. Identificação da Equipe

- Equipe 18
- Lucas Matos, Samuel Leocadio, Dalton Menezes, Israel Bueno, Tiago Braga
- https://github.com/lucasdmgou/Hackaton_Equipe18.git
- https://excalidraw.com/#room=20feed9aca65c2ab0a28,4u-jXE65hMif_kZ4-HhuIg

---

## 💡 2. O Problema e a Proposta de Valor (O Coração da Ideia)

### 2.1. Qual problema real e específico vocês estão resolvendo?

> Estudantes que tem dificuldade de aprendizado ou sofrem com falta de atenção, podem aprender por meio de métodos mais engajantes.

### 2.2. O diferencial da solução está claro? O que torna a ideia de vocês única?

> é benéfico para professores que querem engajar a turma em sua matéria, podendo utilizar o jogo como um método de avaliação.

---

## ⚙️ 3. A Solução na Prática (Como Funciona)

### 3.1. Como a solução funciona para o usuário final?

> Ao abrir o site, o usuário informa um apelido para entrar no jogo. Depois, ele pode criar uma sala ou entrar em uma sala existente usando o código da sala.

Antes da partida começar, o professor cadastra as perguntas que serão usadas no jogo. Cada pergunta pode ter até 4 alternativas, identificadas como A, B, C e D. Após o cadastro, os jogadores entram na sala de espera e aguardam o início da partida.

Durante o jogo, cada jogador controla um personagem em um mapa. A pergunta aparece na parte superior da tela, junto com o tempo restante para responder. No mapa existem quatro áreas de resposta, correspondentes às alternativas A, B, C e D. O jogador anda usando WASD ou as setas, pisa na área da alternativa escolhida e pressiona Espaço para confirmar.

Se acertar, o jogador ganha pontos e recebe o aviso “+100 pontos!”. Se errar ou não responder a tempo, perde uma vida. A resposta correta pisca em verde antes da próxima pergunta. Ao final de todas as perguntas, o jogo mostra o ranking final com a pontuação dos jogadores.

O jogo também possui música de fundo, efeitos sonoros e uma mecânica de empurrão/soco com a tecla F, permitindo que um jogador empurre outro se estiver perto o suficiente.

### 3.2. Quais são as principais tecnologias, linguagens ou ferramentas que decidiram usar?

> HTML, CSS e JavaScript para a interface do usuário e a lógica visual do jogo.
  Canvas HTML5 para desenhar o mapa, os personagens, as áreas de resposta, animações e efeitos visuais.
  Node.js para executar o servidor da aplicação.
  Express.js para organizar as rotas do site, como login, lobby, sala, cadastro de perguntas e jogo.
  Socket.IO para comunicação em tempo real entre os jogadores, permitindo movimentação, respostas, pontuação, empurrões e atualizações sincronizadas na partida.
  Bulma CSS como apoio para componentes visuais e estilização da interface.
  Armazenamento em memória/sessão para guardar salas, jogadores e perguntas durante a execução do projeto, sem uso de banco de dados externo nesta versão.

---

## 👥 4. Gestão e Divisão de Trabalho

### 4.1. Quem está fazendo o quê na equipe?

 Não tivemos divisão exata de tarefas.

---
---

## 🚧 6. Obstáculos e Pedidos de Ajuda

### 6.1. Qual maior dificuldade da equipe?

> Ao fazer funcionar os sprites de animação dos bonecos

---

## 🎤 7. Preparação para o Show (O Pitch)

### 7.1. Como será a estratégia de apresentação de vocês na segunda-feira?

> Vamos mostrar os Slides e se, se der der, mostraremos o vídeo do jogo funcionando