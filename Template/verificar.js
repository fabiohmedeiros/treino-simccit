/* ============================================================================
   VERIFICADOR DE PROJETOS — SiMCCIT

   Confere um arquivo de avaliação derivado do template, exercitando o
   aplicativo de verdade (DOM real via jsdom) em vez de só ler o código.

   USO
     npm install jsdom                     (uma vez, na raiz do projeto)
     node Template/verificar.js Eixo2_Temas/avaliacao.html

   O QUE ELE GARANTE
     - o arquivo abre sem erro de configuração;
     - todo gabarito corresponde exatamente a uma categoria;
     - o guia foi gerado com uma entrada por categoria;
     - percorrer todos os ensaios funciona do início ao fim;
     - nenhum feedback de acerto/erro aparece em momento algum;
     - o CSV sai íntegro, com todas as colunas e sem quebrar em vírgulas;
     - a retomada após queda da aba não duplica nem perde respostas.

   Sai com código 0 se tudo passou, 1 se algo falhou, 2 se não pôde rodar.
   ========================================================================= */

const fs = require("fs");
const path = require("path");

let JSDOM;
try {
  ({ JSDOM } = require("jsdom"));
} catch (e) {
  try {
    ({ JSDOM } = require(path.join(process.cwd(), "node_modules", "jsdom")));
  } catch (e2) {
    console.error("\njsdom não encontrado. Instale com:  npm install jsdom\n");
    process.exit(2);
  }
}

const alvo = process.argv[2];
if (!alvo) {
  console.error("\nUso: node Template/verificar.js <caminho do arquivo .html>\n");
  process.exit(2);
}
if (!fs.existsSync(alvo)) {
  console.error(`\nArquivo não encontrado: ${alvo}\n`);
  process.exit(2);
}
const HTML = fs.readFileSync(alvo, "utf8");

let falhas = 0;
const ok = (cond, msg) => {
  console.log((cond ? "  ok    " : "  FALHA ") + msg);
  if (!cond) falhas++;
};
const espera = (ms = 60) => new Promise((r) => setTimeout(r, ms));

/* Lê CSV respeitando aspas — rótulos de categoria contêm vírgulas
   ("Trabalho, estudo e/ou carreira"), então split(",") daria falso alarme. */
function parseCsv(txt) {
  const t = txt.replace(/^﻿/, "");
  const out = []; let campo = "", lin = [], aspas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") { lin.push(campo); campo = ""; }
    else if (c === "\r") { /* ignora */ }
    else if (c === "\n") { lin.push(campo); out.push(lin); lin = []; campo = ""; }
    else campo += c;
  }
  if (campo || lin.length) { lin.push(campo); out.push(lin); }
  return out.filter((l) => l.length > 1);
}

async function abrir(html, { confirmar = false, armazenamento = null } = {}) {
  let csv = null;
  const dom = new JSDOM(html, {
    runScripts: "dangerously", url: "http://localhost/",
    beforeParse(w) {
      w.URL.createObjectURL = () => "blob:x";
      w.URL.revokeObjectURL = () => {};
      const B = w.Blob;
      w.Blob = function (p, o) { csv = p.join(""); return new B(p, o); };
      w.confirm = () => confirmar;
      w.scrollTo = () => {};
      if (armazenamento) w.localStorage.setItem("simccit_avaliacao_v1", armazenamento);
    }
  });
  const w = dom.window, d = w.document;
  w.HTMLAnchorElement.prototype.click = function () {};
  await espera();
  return {
    w, d,
    CATS: () => w.eval("CATEGORIAS"),
    ENS: () => w.eval("ENSAIOS"),
    DIMS: () => w.eval("DIMENSOES"),
    CFG: () => w.eval("CONFIG"),
    el: (i) => d.getElementById(i),
    qs: (s) => d.querySelector(s),
    qsa: (s) => [...d.querySelectorAll(s)],
    clique: (n) => n.dispatchEvent(new w.MouseEvent("click", { bubbles: true })),
    visivel: (i) => !d.getElementById(i).classList.contains("oculto"),
    csv: () => csv
  };
}

/* body.textContent inclui o texto do <script>, onde a frase "Erro na
   configuração" existe como código-fonte. O sinal confiável é o botão sumir. */
const temErro = (a) => a.el("btn-iniciar") === null;

(async () => {
console.log(`\nVerificando: ${alvo}\n${"=".repeat(64)}`);

console.log("\n1. Abertura e configuração");
const a = await abrir(HTML);
if (temErro(a)) {
  console.log("  FALHA  o arquivo abriu com ERRO DE CONFIGURAÇÃO:");
  a.qsa("#tela-instrucoes li").forEach((li) => console.log("         - " + li.textContent.trim()));
  console.log("\n>>> Corrija o bloco editável e rode de novo.\n");
  process.exit(1);
}
ok(true, "abre sem erro de configuração");

const CATS = a.CATS(), ENS = a.ENS(), CFG = a.CFG();
ok(CATS.length >= 2, `${CATS.length} categorias declaradas`);
ok(ENS.length >= 1, `${ENS.length} ensaios declarados`);
ok(a.el("titulo-instrucoes").textContent === CFG.titulo, `título: "${CFG.titulo}"`);
if (/EXEMPLO/i.test(CFG.titulo)) {
  console.log("  nota    este é o template de exemplo, não um projeto derivado");
} else {
  ok(true, "título já foi personalizado");
}
ok(CATS.every((c) => c.definicao && c.definicao.trim().length > 0),
   "toda categoria tem definição para o guia");
ok(a.qsa("#instr-perguntas .cartao-pergunta").length === a.DIMS().length,
   "instruções mostram um cartão por pergunta");
ok(a.qsa("#instr-regras .instr-regra").length >= 3, "instruções listam as regras");
const temEx = a.qs("#instr-exemplo .exemplo-dialogo") !== null;
if (temEx) {
  const linhas = a.qsa("#instr-exemplo .exemplo-linha").length;
  ok(linhas === a.DIMS().length,
     `exemplo ilustrado com as ${linhas} perguntas respondidas`);
} else {
  console.log("  nota    sem CONFIG.exemplo — as instruções ficam sem ilustração");
}

console.log("\n2. Dimensões de resposta e gabaritos");
const DIMS = a.DIMS();
ok(Array.isArray(DIMS) && DIMS.length >= 1, `${DIMS.length} dimensão(ões): ${DIMS.map((d) => d.id).join(", ")}`);
const rotulos = CATS.map((c) => c.rotulo);
const opcoesDaDim = (d) => {
  if (d.opcoes === "CATEGORIAS") return rotulos;
  if (d.opcoes && typeof d.opcoes === "object" && !Array.isArray(d.opcoes) && d.opcoes.grupo) {
    return CATS.filter((c) => (c.grupo || "") === d.opcoes.grupo).map((c) => c.rotulo);
  }
  return d.opcoes;
};
const gabDe = (e, id) => {
  const g = e.gabarito;
  if (g === undefined || g === null) return undefined;
  return typeof g === "string" ? (DIMS[0].id === id ? g : undefined) : g[id];
};
DIMS.forEach((d) => {
  const ops = opcoesDaDim(d);
  const deOnde = d.opcoes && d.opcoes.grupo ? ` (grupo "${d.opcoes.grupo}")` : "";
  ok(Array.isArray(ops) && ops.length >= 2, `  "${d.id}": ${Array.isArray(ops) ? ops.length : 0} alternativas${deOnde}`);
  if (!Array.isArray(ops)) return;
  const fora = ENS.filter((e) => {
    const g = gabDe(e, d.id);
    return g !== undefined && !ops.includes(g);
  });
  ok(fora.length === 0,
     fora.length ? `  "${d.id}": gabaritos sem correspondência — ${fora.slice(0, 3).map((e) => e.id + ' → "' + gabDe(e, d.id) + '"').join("; ")}`
                 : `  "${d.id}": todo gabarito corresponde a uma alternativa`);
  const semGab = ENS.filter((e) => gabDe(e, d.id) === undefined).length;
  if (semGab) console.log(`  nota    "${d.id}": ${semGab} ensaio(s) sem gabarito — não serão corrigidos`);
  const usadas = new Set(ENS.map((e) => gabDe(e, d.id)).filter(Boolean));
  console.log(`  info    "${d.id}": ${usadas.size} de ${ops.length} alternativas aparecem como resposta correta`);
});
const ids = ENS.map((e) => e.id);
ok(new Set(ids).size === ids.length, "ids de ensaio únicos");

console.log("\n3. Guia de consulta");
a.clique(a.el("btn-guia"));
ok(a.visivel("modal-guia"), "guia abre pelo botão flutuante");
ok(a.qsa("#guia-conteudo .guide-category").length === CATS.length,
   `guia tem ${a.qsa("#guia-conteudo .guide-category").length} entradas, uma por categoria`);
const grupos = [...new Set(CATS.map((c) => c.grupo || ""))];
const temAbas = !a.el("guia-abas").classList.contains("oculto");
ok(temAbas === (grupos.length > 1),
   grupos.length > 1 ? `abas presentes: ${grupos.join(" / ")}` : "sem abas (grupo único), como esperado");
a.clique(a.el("fechar-guia"));
ok(!a.visivel("modal-guia"), "guia fecha");

console.log("\n4. Percurso completo pelos ensaios");
a.clique(a.el("btn-iniciar"));
ok(a.visivel("tela-ensaio"), "Iniciar leva ao primeiro ensaio");
ok(a.qsa("#dimensoes .dimensao").length === 1,
   "uma pergunta por vez no mesmo espaço, não todas empilhadas");

const abaBtns = () => a.qsa("#abas-dimensao .aba-btn");
if (DIMS.length > 1) {
  const abas = abaBtns();
  ok(abas.length === DIMS.length, `${abas.length} abas, uma por pergunta`);
  const rot = abas.map((b) => b.textContent.replace(/^[0-9\u2713]/, "").trim());
  ok(rot.length === DIMS.length, `rótulos das abas: ${rot.join(" | ")}`);
  ok(abas[0].classList.contains("ativa"), "a primeira aba começa ativa");
}

// --- auto-avanço: responder uma pergunta leva à próxima pendente ---
if (DIMS.length > 1) {
  const antes = a.qs("#dimensoes .dimensao").dataset.dim;
  const bs = a.qsa("#dimensoes .opcao");
  a.clique(bs[0]);
  await espera(300);
  const depois = a.qs("#dimensoes .dimensao").dataset.dim;
  ok(depois !== antes && depois === DIMS[1].id,
     `ao responder, o app vai sozinho para a próxima pergunta (${antes} \u2192 ${depois})`);
  // volta para a primeira e confere que a escolha continua marcada
  a.clique(abaBtns()[0]);
  ok(a.qsa("#dimensoes .opcao.selecionada").length === 1,
     "voltar a uma aba já respondida preserva a escolha");
  const ordem1 = a.qsa("#dimensoes .opcao").map((b) => b.textContent).join("|");
  a.clique(abaBtns()[1]); a.clique(abaBtns()[0]);
  ok(a.qsa("#dimensoes .opcao").map((b) => b.textContent).join("|") === ordem1,
     "trocar de aba não reembaralha os botões");
}

let vazamentos = 0, travou = false, bloqueioOk = true, marcaOk = true;
let ordemAbas = [], liberouNoFim = true;

for (let i = 0; i < ENS.length; i++) {
  const e = ENS[i];
  for (let k = 0; k < DIMS.length; k++) {
    if (DIMS.length > 1) a.clique(abaBtns()[k]);      // navegação explícita
    const bloco = a.qs("#dimensoes .dimensao");
    if (!bloco) { ok(false, `[${e.id}] nenhuma pergunta na tela`); travou = true; break; }
    if (i === 0) ordemAbas.push(bloco.dataset.dim);
    const dim = DIMS.find((d) => d.id === bloco.dataset.dim);

    if (CFG.exigirResposta && k < DIMS.length - 1 && !a.el("btn-proxima").disabled) bloqueioOk = false;

    const bs = [...bloco.querySelectorAll(".opcao")];
    const g = gabDe(e, dim.id);
    a.clique(bs.find((b) => b.textContent === g) || bs[0]);
    if (bloco.querySelectorAll(".opcao.selecionada").length !== 1) {
      ok(false, `[${e.id}/${dim.id}] seleção não é exclusiva`);
    }
    if (/Correto|Incorreto|Parabéns|acertou|errou/i.test(a.el("tela-ensaio").textContent)) vazamentos++;
    if (DIMS.length > 1 && !/\u2713/.test(abaBtns()[DIMS.indexOf(dim)].textContent)) marcaOk = false;
  }
  if (travou) break;
  if (CFG.exigirResposta && a.el("btn-proxima").disabled) liberouNoFim = false;
  a.clique(a.el("btn-proxima"));
}
if (!travou) ok(true, `${ENS.length} ensaios × ${DIMS.length} pergunta(s) percorridos sem travar`);
ok(ordemAbas.join() === DIMS.map((d) => d.id).join(),
   `abas na ordem declarada: ${ordemAbas.join(" \u2192 ")}`);
if (DIMS.length > 1) {
  ok(bloqueioOk, '"Próxima" fica bloqueada enquanto faltar alguma pergunta');
  ok(marcaOk, "cada aba respondida recebe a marca de concluída");
  ok(liberouNoFim, '"Próxima" libera quando todas as perguntas são respondidas');
}
ok(vazamentos === 0, "nenhum feedback de acerto/erro apareceu durante os ensaios");
ok(a.visivel("tela-final"), "chega à tela final");
ok(!/escore|pontuaç|\bacertos\b|100%/i.test(a.el("tela-final").textContent),
   "nenhum escore exibido na tela final");

console.log("\n5. Relatório CSV");
a.clique(a.el("btn-baixar"));
ok(a.csv() === null, "recusa salvar sem o código do participante");
a.el("campo-codigo").value = "TESTE_01";
a.clique(a.el("btn-baixar"));
ok(a.csv() !== null, "gera o arquivo após informar o código");
const tab = parseCsv(a.csv()), cab = tab[0], corpo = tab.slice(1);
ok(a.csv().charCodeAt(0) === 0xFEFF, "começa com BOM (acentos corretos no Excel)");
ok(corpo.length === ENS.length, `${corpo.length} linhas de dados para ${ENS.length} ensaios`);
ok(corpo.every((l) => l.length === cab.length), "toda linha tem o mesmo número de colunas do cabeçalho");
ok(corpo.every((l) => l[0] === "TESTE_01"), "código do participante em todas as linhas");
ok(corpo.map((l) => l[2]).join() === ids.join(), "ids e ordem preservados");
ok(cab.includes("Latencia_total_s"), "coluna Latencia_total_s presente");
DIMS.forEach((d) => {
  ["Escolha_", "Gabarito_", "Resultado_", "Posicao_", "Latencia_"].forEach((pre) => {
    ok(cab.includes(pre + d.id), `  coluna ${pre}${d.id} presente`);
  });
  const iRes = cab.indexOf("Resultado_" + d.id);
  ok(corpo.every((l) => ["Certo", "Errado", "sem gabarito", "sem resposta"].includes(l[iRes])),
     `  Resultado_${d.id} só contém valores previstos`);
});

console.log("\n6. Retomada após queda da aba");
if (ENS.length >= 2) {
  const b = await abrir(HTML);
  // um ensaio inteiro = uma escolha + um clique no botão, por dimensão
  const responder = (ctx) => {
    DIMS.forEach((d, k) => {
      const abas = ctx.qsa("#abas-dimensao .aba-btn");
      if (abas.length > 1) ctx.clique(abas[k]);
      const bl = ctx.qs("#dimensoes .dimensao");
      if (bl) ctx.clique(bl.querySelector(".opcao"));
    });
    ctx.clique(ctx.el("btn-proxima"));
  };
  b.clique(b.el("btn-iniciar"));
  responder(b);
  const rascunho = b.w.localStorage.getItem("simccit_avaliacao_v1");
  ok(rascunho !== null && JSON.parse(rascunho).respostas.length === 1, "rascunho gravado a cada ensaio");
  const c = await abrir(HTML, { confirmar: true, armazenamento: rascunho });
  ok(c.el("indicador-progresso").textContent === `Ensaio 2 de ${ENS.length}`,
     `retoma no ensaio 2, sem repetir o primeiro (${c.el("indicador-progresso").textContent})`);
  for (let i = 1; i < ENS.length; i++) responder(c);
  c.el("campo-codigo").value = "TESTE_02";
  c.clique(c.el("btn-baixar"));
  const linhas = parseCsv(c.csv()).slice(1);
  ok(linhas.length === ENS.length, "CSV retomado tem todos os ensaios");
  ok(linhas.map((l) => l[2]).join() === ids.join(), "sem duplicatas nem buracos após a retomada");
  ok(c.w.localStorage.getItem("simccit_avaliacao_v1") === null, "rascunho apagado após a entrega");
} else {
  console.log("  nota    pulado (projeto com um só ensaio)");
}

console.log("\n" + "=".repeat(64));
console.log(falhas ? `>>> ${falhas} FALHA(S) em ${alvo}\n` : `Tudo certo: ${alvo} está pronto para aplicação.\n`);
process.exit(falhas ? 1 : 0);
})();
