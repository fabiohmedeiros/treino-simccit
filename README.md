# Categorizador MTS — SiMCCIT

Plataforma de **avaliação** de observadores no SiMCCIT (Sistema Multidimensional
para a Categorização de Comportamentos na Interação Terapêutica, Zamignani, 2007).

> **Este README é dirigido à próxima IA que trabalhar no repositório.**
> Leia-o inteiro antes de mexer em qualquer coisa. Ele registra decisões de
> desenho que **não** são recuperáveis lendo o código, e cuja violação
> invalidaria a coleta de dados.

---

## 1. O que este projeto é

Um **template de avaliação por ensaios** (*match-to-sample*) e um conjunto de
**projetos derivados** dele, um por eixo ou recorte do SiMCCIT.

Em cada ensaio, o participante vê um enunciado (tipicamente um trecho de diálogo
terapêutico) e um conjunto de botões com nomes de categorias. Ele escolhe uma,
ela fica destacada, e ele clica em "Próxima". No fim, o pesquisador salva um CSV
com todas as respostas.

**Não é uma plataforma de treino.** Houve uma antes, no mesmo repositório
(ver §7), com feedback imediato e revisão de erros. Ela foi substituída, e as
diferenças são deliberadas.

---

## 2. Decisões de desenho — e por quê

Estas são as regras do desenho experimental. **Não as altere sem instrução
explícita do pesquisador.** Cada uma existe por um motivo:

| Regra | Por quê |
|---|---|
| **Nenhum feedback, nunca** | É uma medida, não um treino. Informar acerto/erro alteraria o comportamento nos ensaios seguintes. A seleção usa azul-índigo neutro, jamais verde/vermelho. |
| **Não dá para voltar** | Cada ensaio é uma medida independente. Rever respostas anteriores contaminaria as posteriores. Não há botão de voltar, o botão *voltar do navegador* é interceptado, e fechar a aba dispara aviso. |
| **Nenhum escore na tela final** | Mostrar o desempenho ali seria feedback — e o pesquisador está ao lado do participante nesse momento. O gabarito sai no CSV, não na tela. |
| **Autopaced, sem limite de tempo** | A latência é registrada como dado, não como restrição. |
| **Arquivo único, offline** | O pesquisador leva o arquivo num pendrive/notebook e aplica presencialmente. Sem servidor, sem internet, sem instalação. |
| **Gabarito embutido no arquivo** | Decisão consciente do pesquisador: o CSV já sai corrigido. O participante *poderia* ver as respostas no código-fonte, mas nunca fica sozinho com o arquivo. |
| **Validação antes de iniciar** | Erro de digitação no bloco editável trava o app com mensagem explícita, em vez de corromper uma coleta silenciosamente. |

### O que NÃO fazer

- Não reintroduza feedback, revisão de erros, "tente novamente" ou exigência de 100% de acerto.
- Não adicione botão de voltar nem navegação livre entre ensaios.
- Não exiba escore, porcentagem ou contagem de acertos em nenhuma tela.
- Não use módulos ES (`import`/`export`): o navegador os bloqueia por CORS em `file://`. Use apenas scripts clássicos.
- Não adicione dependências externas (CDN, fontes remotas, imagens externas). O arquivo tem de funcionar sem rede.
- Não divida o arquivo de avaliação em vários: ele precisa ser autocontido.

---

## 3. Estrutura do repositório

```
Categorizador_MTS_SiMCCIT/
├── README.md                    ← este arquivo
├── Template/
│   ├── avaliacao.html           ← TEMPLATE GERAL (a base de todo projeto)
│   └── verificar.js             ← verificador automatizado (jsdom)
├── Lara/                        ← primeiro projeto derivado — Eixo II, tema da sessão
│   ├── avaliacao.html           ← PRONTO PARA APLICAÇÃO (30 ensaios, 15 temas)
│   ├── Ensaios_Lara_Temas.xlsx  ← FONTE DE VERDADE: diálogos + os 3 gabaritos
│   ├── categorias.csv           ← 25 verbetes: Eixos II-1, II-2 e II-3 do manual
│   └── ordem_dos_ensaios.csv    ← mapa posição → id → linha da planilha → tema
└── Manual_SiMCCIT/              ← manual oficial em PDF/DOCX (fonte das definições)
```

O app de **treino** antigo foi removido nesta limpeza (§7). Continua recuperável
no histórico do git.

Cada projeto derivado é **uma pasta** contendo, ao final, um `avaliacao.html`
autocontido, mais os arquivos-fonte que o originaram.

---

## 4. Como derivar um projeto novo

O fluxo é **conversacional**: o pesquisador coloca os dados numa pasta e pede à
IA que monte o projeto. Não há script de build, e isso é intencional — cada
projeto tem particularidades que merecem conversa.

### Formato padrão da planilha de entrada

Adotado a partir do projeto Lara, e o esperado em todo projeto novo. Uma linha
por ensaio, em `.xlsx` ou `.csv`:

| Coluna | Obrigatória | Conteúdo |
|---|---|---|
| `Diálogo` | sim | O trecho apresentado. Falas separadas por quebra de linha, no formato `TERAPEUTA: ...` / `CLIENTE: ...` |
| `Tema` | sim | Gabarito da dimensão principal |
| `Tempo` | quando o eixo tiver esse qualificador | Gabarito do Eixo II-2 |
| `Condução do tema` | quando o eixo tiver esse qualificador | Gabarito do Eixo II-3 |
| `Quem inicia` | opcional | Anotação auxiliar; a condução do tema a subsume |

**Convenção dos rótulos:** na planilha, toda categoria é escrita como
`Nome (SIGLA)` — por exemplo `Religião (RLG)`, `Tempo passado (PAS)`,
`Cliente inicia/muda (CIN)`. O aplicativo remove a sigla e mostra só o nome; a
sigla fica para a análise.

> **Regra do projeto: nenhuma sigla ou abreviação no HTML.** Nem nos botões, nem
> nas abas do guia, nem **dentro das definições**. O manual costuma escrever
> "…dê preferência ao tema Relação com cônjuge/parceiro (Rel cônjuge)"; ao
> trazer esse texto para o `categorias.csv`, apague o parêntese — o nome
> completo já está ali antes. As siglas vivem só nos arquivos de apoio
> (`categorias.csv`, `ordem_dos_ensaios.csv`, planilha). Essa é a regra que liga os dois lados, então
mantenha-a exata: a sigla entre parênteses, no fim, com três letras maiúsculas.

### O arquivo de categorias

Ao lado da planilha, cada projeto tem um `categorias.csv` com **todas** as
categorias que o projeto usa — inclusive as dos qualificadores, não só as da
dimensão principal. Colunas:

`eixo, grupo, sigla, nome, nome_resumido, caracterizacao, criterio`

A **ordem das linhas** deste arquivo é a ordem em que os botões aparecem na
tela (com `embaralharOpcoes: false`) e a ordem dos verbetes no guia — mantenha-a
igual à do manual. O `grupo` é o que liga a categoria a uma dimensão (via
`opcoes: { grupo: ... }`) e o que vira aba no guia. No projeto Lara são três grupos: `Temas da sessão`
(15, Eixo II-1), `Condução do tema` (5, Eixo II-3) e `Tempo` (5, Eixo II-2).

**A planilha é a fonte de verdade.** Os gabaritos vivem nela, não no HTML. Para
mudar um gabarito, edite a planilha e regenere o arquivo — nunca edite o
`gabarito` dentro do `avaliacao.html`, ou os dois saem de sincronia.

### Receita### Receita

1. **Leia a planilha** e confira: quantos ensaios, quantas categorias únicas
   em cada coluna de gabarito, se há diálogos vazios, se alguma sigla está
   grafada de forma divergente. Vale também olhar a **distribuição** de cada
   gabarito: uma categoria que nunca aparece, ou que aparece na maioria dos
   ensaios, compromete a medida daquela dimensão (aconteceu com os
   qualificadores no piloto da Lara — ver §8).

2. **Monte `CATEGORIAS`.** A regra combinada com o pesquisador é:
   > O conjunto de alternativas é formado pelas **ocorrências únicas de
   > categoria presentes na própria planilha** — nada de distratores sorteados
   > de fora.

   Para cada categoria única, pegue definição e critérios do manual
   (`Manual_SiMCCIT/`) ou de um `categorias.csv` já preparado na pasta.
   O campo `rotulo` é o texto do botão **e** o título no guia — escreva-o uma
   vez e use exatamente igual em `gabarito`.

3. **Monte `DIMENSOES`.** Uma entrada por pergunta que o participante
   responde em cada ensaio. A maioria dos projetos tem uma só (a categoria);
   eixos com qualificadores têm mais. Ex.: no projeto Lara são duas — o tema e
   quem iniciou o tema.

4. **Monte `ENSAIOS`.** Um objeto por linha da planilha: `id`, `enunciado`,
   `gabarito`. As alternativas **não** se repetem em cada ensaio — saem de
   `CATEGORIAS` (ou da própria dimensão) automaticamente. Com mais de uma
   dimensão, `gabarito` é um objeto com uma chave por dimensão:
   `gabarito: { tema: "Religião", iniciou: "Cliente" }`.

   Converta o diálogo para HTML: quebras de linha viram `<br>` e o segmento a
   categorizar (se houver) vira `<strong>`. **Escape `&`, `<` e `>`** do texto
   original antes de inserir. No projeto Lara os nomes de falante ficaram por
   extenso e em negrito (`<strong>TERAPEUTA:</strong>`), fiéis à planilha;
   abreviar para `T:` / `C:` é alternativa a combinar com o pesquisador.

5. **Copie `Template/avaliacao.html`** para a pasta do projeto e substitua o
   bloco editável (`CONFIG`, `CATEGORIAS`, `DIMENSOES`, `ENSAIOS`).

6. **Verifique** (ver §5). Nunca entregue um projeto sem rodar o verificador.

7. **Confirme com o pesquisador** antes de considerar o projeto pronto:
   ordem dos ensaios, texto das instruções, formato dos rótulos.

---

## 5. Verificação

```bash
npm install jsdom                              # uma vez
node Template/verificar.js Lara/avaliacao.html
```

O verificador abre o arquivo num DOM real e percorre a avaliação inteira.
Ele confere que o arquivo abre sem erro, que todo gabarito casa com uma
categoria, que o guia tem uma entrada por categoria, que **nenhum feedback
vaza**, que o CSV sai íntegro e que a retomada após queda da aba não duplica
nem perde respostas.

Sai com código 0 (tudo certo) ou 1 (falhas listadas).

> O verificador roda em jsdom, que exercita o JavaScript e o DOM, mas **não**
> valida aparência. Cores, espaçamento e comportamento em telas pequenas
> precisam de conferência visual abrindo o arquivo no navegador.

---

## 6. O template por dentro

`Template/avaliacao.html` — arquivo único, ~870 linhas. As primeiras ~200 são o
**bloco editável**, cercado por uma faixa `██ BLOCO EDITÁVEL ██`. O resto é a
mecânica, e não deve mudar de projeto para projeto.

### Quatro seções editáveis

- **`CONFIG`** — título, textos de instrução e encerramento, o `exemplo`
  ilustrado, e chaves de comportamento (`embaralharOpcoes`, `exigirResposta`,
  `mostrarProgresso`).

  **A tela de instruções é montada sozinha** a partir de `DIMENSOES`:
  `CONFIG.instrucoes` é só a abertura, e o app gera abaixo dela um cartão por
  pergunta (com o número de alternativas e a `ajuda`), o exemplo ilustrado e a
  lista de regras. Assim a explicação nunca fica fora de sincronia com a tarefa
  real — acrescentar uma dimensão atualiza as instruções automaticamente.

  `CONFIG.exemplo` é uma miniatura estática de um ensaio, com um diálogo
  **fictício** e as respostas certas já marcadas:
  `{ enunciado, respostas: { <idDaDimensao>: "resposta", ... }, nota }`.
  Omitir o campo apenas deixa as instruções sem ilustração.

- **`CATEGORIAS`** — serve a **duas funções ao mesmo tempo**: é o conjunto de
  alternativas de todo ensaio *e* o conteúdo do guia de consulta. Campos:
  `rotulo` (obrigatório), `definicao` (obrigatório), `criterio`, `exemplos`,
  `grupo`.

  O campo `grupo` cria abas no guia. Com um grupo só (ou nenhum), o guia não usa
  abas. Isso é o que permite ao mesmo template servir o Eixo I (abas Terapeuta /
  Cliente) e o Eixo II (tema único, sem abas).

- **`DIMENSOES`** — o que o participante responde em cada ensaio. Uma entrada
  por pergunta. Com mais de uma, elas viram **abas que dividem o mesmo espaço**
  abaixo do enunciado, na ordem declarada nesta lista; o enunciado fica visível
  o tempo todo. Ao responder, o app **pula sozinho para a próxima aba
  pendente**; respondidas todas, fica parado para o participante revisar. Cada
  aba respondida ganha uma marca de concluída, e **"Próxima" só libera com
  todas respondidas**. Circular entre abas e trocar respostas é permitido até
  confirmar o ensaio — o que não é permitido é voltar a um ensaio já
  confirmado. Campos: `id` (vira nome de coluna no CSV), `pergunta`, `opcoes`
  (ver abaixo), e os opcionais `rotuloAba` (nome curto da aba), `ajuda` (frase
  exibida no cartão das instruções), `larguraMinima`, `altura` e `embaralhar`.

  Na `pergunta`, envolva o termo técnico em `<span class="termo">` para ele sair
  grifado — é o que orienta o participante sobre o que exatamente está sendo
  perguntado.

  O campo `opcoes` aceita três formas: uma **lista literal** (`["Sim","Não"]`),
  a palavra **`"CATEGORIAS"`** (todos os rótulos da seção 2), ou
  **`{ grupo: "Tempo" }`** (só as categorias daquele `grupo`). A terceira é o
  que permite a um projeto ter várias dimensões, cada uma com seu conjunto de
  alternativas, todas documentadas no mesmo guia — que então ganha uma aba por
  grupo. É assim que o projeto Lara serve os três eixos do II numa tela só.

  **Tamanho dos botões:** dentro de uma dimensão todos os botões têm
  exatamente a mesma largura e altura (`altura`, padrão `4.75rem`). O tamanho
  da letra é calculado em tempo de execução e encolhe, igual para todos, até o
  rótulo mais longo caber — nenhum texto é cortado e nenhum botão fica maior
  que os vizinhos. Recalculado quando a janela muda de tamanho.

- **`ENSAIOS`** — `id`, `enunciado`, `gabarito`, mais o opcional `opcoes`.
  Com uma dimensão, `gabarito` é o texto da resposta certa; com várias, um
  objeto com uma chave por dimensão. Use `opcoes` apenas em ensaios de formato
  atípico, em que as alternativas não sejam as do eixo.

### Detalhes que já causaram bug

- **`gabarito` precisa bater caractere por caractere** com um `rotulo`. Um
  espaço a mais ou um acento diferente e a validação barra o arquivo. Isso é
  proposital: é melhor travar do que registrar todos os ensaios como erro.
- **O rascunho é gravado *depois* de avançar o índice.** Gravar antes fazia a
  retomada voltar ao ensaio recém-respondido, duplicando uma resposta e
  perdendo a última. A retomada deriva a posição de `respostas.length`, não do
  índice gravado, para se auto-corrigir diante de rascunho antigo.
- **Rótulos com vírgula** (ex.: `Trabalho, estudo e/ou carreira (TRB)`) **têm**
  de sair entre aspas no CSV, senão quebram as colunas.
- **BOM no início do CSV** (`﻿`) é o que faz o Excel brasileiro reconhecer
  os acentos.

---

## 7. O app de treino antigo (legado, removido)

`index.html`, `script.js`, `style.css` e `GUIA_DE_USO.md` eram a **plataforma de
treino** anterior: 5 etapas, feedback imediato, revisão obrigatória de erros e
proteção por senha (`simccit`, em texto claro no JS). Foram **apagados** a pedido
do pesquisador, junto com `GIT_UPLOAD_INSTRUCTIONS.txt` e
`SiMCCIT_Manual_Eixo-I.txt`.

Tudo isso continua no histórico do git — o último commit em que existiam é
`80d7d5b`. Para consultar:

```bash
git show 80d7d5b:script.js
git checkout 80d7d5b -- index.html script.js style.css   # se precisar restaurar
```

Se algum dia migrar o banco de questões de lá (122 itens: 66 terapeuta,
56 cliente), saiba dos defeitos conhecidos:

- `CLIENTE_E4_Q3` e `CLIENTE_E4_Q7` listavam a alternativa correta **duas vezes**
  entre as quatro opções, dobrando a chance de acerto ao acaso.
- Inconsistência de nomenclatura: `Meta (MET)` (22×) vs `Metas (MET)`; e
  `Solicitação de relato (SRE)` com "r" minúsculo em 3 distratores.

---

## 8. Estado atual e próximos passos

**Pronto e verificado:**
- `Template/avaliacao.html` — template geral.
- `Template/verificar.js` — verificador automatizado.
- `Lara/avaliacao.html` — **primeiro projeto derivado, pronto para aplicação.**

### Sobre o projeto Lara

30 ensaios do Eixo II, gerados a partir de `Ensaios_Lara_Temas.xlsx`.
**Três perguntas por ensaio**, todas obrigatórias para avançar:

| # | Dimensão | Eixo | Alternativas |
|---|---|---|---|
| 1 | `tema` | II-1, tema da sessão | 15 |
| 2 | `conducao` | II-3, condução do tema | 5 |
| 3 | `tempo` | II-2, tempo em que o assunto é tratado | 5 |

Elas aparecem como **abas no mesmo espaço da tela**, nessa ordem, com o trecho
visível o tempo todo, e o ensaio só é confirmado com as três respondidas. O guia tem uma aba para cada conjunto, com as
definições do manual. No CSV cada dimensão vira seu próprio bloco de colunas —
inclusive a latência —, então as três habilidades podem ser analisadas
separadamente.

> ### Gabarito dos qualificadores — revisado pela Lara
>
> A planilha original trazia só o tema e "quem inicia". Os gabaritos de `tempo`
> e `conducao` foram propostos por julgamento automatizado e gravados nas
> colunas `Tempo` e `Condução do tema` da planilha, **que a Lara revisou**. A
> versão atual de `Ensaios_Lara_Temas.xlsx` é a fonte de verdade. Mudou algo?
> Edite a planilha e regenere o `avaliacao.html`.
> `Lara/ordem_dos_ensaios.csv` traz a mesma classificação em formato plano, na
> ordem de aplicação.
>
> **Duas ressalvas metodológicas sobre os qualificadores:**
>
> 1. **A condução do tema não é plenamente observável num trecho isolado.** As
>    categorias `Terapeuta deriva`, `Cliente deriva` e `Continuidade do tema`
>    dependem do que veio antes na sessão, e os trechos não mostram isso. Foram
>    atribuídas apenas onde a derivação é explícita dentro do próprio trecho
>    (L12 e L24, em que o terapeuta parte de algo dito momentos antes). Nos
>    demais, seguiu-se a coluna "Quem inicia" da planilha, mapeada para
>    `Terapeuta inicia/muda` ou `Cliente inicia/muda`.
>
> 2. **A distribuição dos qualificadores é muito desequilibrada,** porque o
>    conjunto foi construído para amostrar temas, não qualificadores:
>    - `tempo`: 22 Presente, 6 Aqui e agora, 1 Passado, 1 Futuro, 0 Outros
>    - `conducao`: 15 Cliente inicia, 13 Terapeuta inicia, 2 Terapeuta deriva,
>      0 Cliente deriva, 0 Continuidade
>
>    Um participante que respondesse sempre "Tempo atual fora da sessão"
>    acertaria 73% da dimensão `tempo` sem discriminar nada. Se os
>    qualificadores forem virar medida de verdade, o conjunto precisa de
>    ensaios que amostrem as categorias raras.

**Rótulos sem sigla.** Botões e guia mostram o nome por extenso (`Religião`,
não `Religião (RLG)`) — decisão do pesquisador. As siglas seguem em
`categorias.csv` e em `ordem_dos_ensaios.csv` para a análise. Verificou-se na
montagem que os 25 rótulos são distintos entre si sem sigla.

**Ordem dos botões: fixa, na sequência do manual.** Nas três perguntas e em
todos os ensaios, as alternativas aparecem sempre na mesma ordem — a do manual
(`embaralharOpcoes: false`). O participante aprende a varrer a lista sempre do
mesmo jeito, e a tela espelha o material de consulta.

> Consequência para a análise: como a posição de cada alternativa é constante,
> `Posicao_<id>` deixa de servir para estimar viés de posição — passa a apenas
> repetir a escolha. Se em algum projeto o viés de posição importar, basta pôr
> `embaralharOpcoes: true`.

**Ordem dos ensaios:** sorteada uma única vez com a semente `20261295` e fixada
no arquivo — todos os participantes respondem na mesma sequência. A semente foi
escolhida por produzir uma ordem **sem dois ensaios do mesmo tema em sequência**
e com **pelo menos 5 ensaios entre as duas ocorrências de cada tema**.

**Outras decisões da montagem** (revisáveis a pedido do pesquisador):
- Falas mantidas como `TERAPEUTA:` / `CLIENTE:` por extenso, em negrito.
- Sem realce de segmento: no Eixo II o tema vale para o trecho inteiro.

**Pendente:**
- Conferência visual do `Lara/avaliacao.html` aberto no navegador.
- Decidir se `Manual_SiMCCIT/` (2,8 MB de PDFs) entra no controle de versão.

**Definições do manual:** `Lara/categorias.csv` foi extraído do PDF e depois
conferido, categoria por categoria, contra o texto do manual. Na conferência
corrigiram-se um trecho de cabeçalho que vazara para `Outros temas`, uma frase
de `Terapeuta deriva` e a Tabela 8 (palavras emocionais) de `Sentimentos em
geral`, que saíra com as colunas embaralhadas e agora aparece por emoção. As
siglas entre parênteses foram removidas de propósito (regra do §4).

---

## 9. Formato do CSV de saída

Nome do arquivo: `<codigo>_<AAAA-MM-DD>.csv`, onde `<codigo>` é digitado pelo
pesquisador na tela final. Uma linha por ensaio.

**Colunas fixas:**

| Coluna | Conteúdo |
|---|---|
| `Participante` | Código digitado pelo pesquisador |
| `Ordem` | Posição do ensaio na sessão (1, 2, 3...) |
| `EnsaioID` | `id` do ensaio |
| `Latencia_total_s` | Segundos do ensaio inteiro, somando as perguntas |
| `DataHora` | Momento da resposta |

**Mais cinco colunas por dimensão**, com o `id` dela no sufixo:

| Coluna | Conteúdo |
|---|---|
| `Escolha_<id>` | Alternativa escolhida |
| `Gabarito_<id>` | Alternativa correta (vazio se não houver gabarito) |
| `Resultado_<id>` | `Certo`, `Errado`, `sem gabarito` ou `sem resposta` |
| `Posicao_<id>` | Posição do botão escolhido **na tela** (1-based) |
| `Latencia_<id>` | Segundos acumulados com a aba daquela pergunta aberta |

`Posicao_<id>` permite checar viés de posição **quando as alternativas são
embaralhadas**; com `embaralharOpcoes: false` a posição é constante e a coluna
perde essa função. `Latencia_<id>` conta o tempo em que a aba daquela pergunta esteve aberta —
com abas, o participante vai e volta, então é tempo acumulado, não um intervalo
único. `Latencia_total_s` é o ensaio inteiro.

No projeto Lara, com três dimensões, são 20 colunas.

---

## Referência

Zamignani, D. R. (2007). *O desenvolvimento de um sistema multidimensional para
a categorização de comportamentos na interação terapêutica* [Tese de doutorado,
Universidade de São Paulo]. Repositório da Produção USP.

**Equipe:** Dr. Fabio Hernandez de Medeiros · Ana Beatriz Maurmann Ximenes ·
Pedro Canônico Müller Maestrelli
