# Guia de Uso e Documentação Técnica - SiMCCIT

Este documento detalha o funcionamento do sistema de Treino de Observadores SiMCCIT para pesquisadores, participantes e desenvolvedores/técnicos.

---

## 👨‍🔬 1. Visão do Pesquisador (Estudantes/Monitores)

**Objetivo:** Gerenciar a aplicação do treino e coletar os resultados para análise posterior.

### **A. Preparação**
1.  **Acesso:** Compartilhe o link oficial ([https://fabiohmedeiros.github.io/treino-simccit/](https://fabiohmedeiros.github.io/treino-simccit/)).
2.  **Credenciais:** Informe a senha de acesso: **`simccit`**.
3.  **Instruções Iniciais:** Oriente o participante sobre qual **Foco** ele deve realizar (Terapeuta ou Cliente).

### **B. Coleta de Dados**
Ao final de cada treino completo (as 4 etapas), o sistema gerará um botão **"Baixar Relatório (.csv)"**.
- Instrua o participante a **não fechar a aba** antes de clicar nesse botão.
- O arquivo baixado conterá o log detalhado de cada resposta (ensaio) do participante.

### **C. Entendendo o Relatório (CSV)**
O arquivo CSV fornece as seguintes métricas para cada questão:
- **TrialNumber:** Ordem sequencial das tentativas.
- **QuestionID:** Código único da questão.
- **Stage:** Etapa do treino (1 a 4).
- **Focus:** Foco do treino (Terapeuta ou Cliente).
- **CorrectAnswer / UserChoice:** Valor esperado vs. escolha do participante.
- **Result:** "Certo" ou "Errado".
- **IsReview:** Indica se foi uma tentativa original ou revisão de erro.
- **Duration_s:** Tempo de latência da resposta em segundos.

---

## 🙋‍♂️ 2. Visão do Participante (Quem realiza o treino)

**Objetivo:** Desenvolver a habilidade de identificar e categorizar comportamentos verbais.

### **A. O Fluxo do Treino**
O aprendizado é dividido em **4 etapas progressivas**:
1.  **Definição para Nome:** Escolha o nome da categoria que corresponde à definição técnica.
2.  **Nome para Exemplo:** Escolha o trecho de diálogo que melhor representa a categoria.
3.  **Categorização de Trecho:** Identifique a categoria da fala em negrito no diálogo.
4.  **Múltiplas Categorias:** Identifique as duas categorias presentes em uma mesma fala.

### **B. Recursos e Feedback**
- **Feedback Imediato:** O sistema avisa na hora se você acertou ou errou.
- **Revisão de Erros:** Questões erradas reaparecem até que você as acerte. É necessário 100% de acerto para concluir a etapa.
- **Guia de Consulta:** Use o **ícone de livro** no canto inferior direito para ver definições e exemplos a qualquer momento.

---

## ⚙️ 3. Documentação Técnica

### **Stack Tecnológico**
- **Core:** HTML5, CSS3, JavaScript Vanilla (ES6+).
- **Dependências:** Nenhuma (sistema puramente estático).
- **Fontes:** Google Fonts (Poppins).

### **Arquitetura do App**
- **SPA (Single Page Application):** Todas as telas e transições são gerenciadas via manipuladores de DOM no JavaScript (`script.js`).
- **Persistência:** Os dados são mantidos em memória durante a sessão atual. Não há banco de dados persistente no servidor (Cloudless).
- **Segurança:** Proteção básica via JavaScript (`password-overlay`) para evitar acesso público indexado por buscadores.
- **Exportação de Dados:** Implementada via `Blob` e `URL.createObjectURL` em formato CSV com suporte a BOM (Byte Order Mark) para compatibilidade nativa com o Microsoft Excel.

### **Hospedagem e Deploy**
- **Plataforma:** GitHub Pages.
- **Workflow:** Sincronização automática via Git Push para a branch `main`.
- **Estratégia de Cache:** O sistema é otimizado para funcionamento offline após o carregamento inicial da página.

---
© 2026 SiMCCIT Team
