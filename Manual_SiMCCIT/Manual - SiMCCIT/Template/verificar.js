/* ============================================================================
   VERIFICADOR DE PROJETOS — SiMCCIT

   Confere um arquivo de avaliação derivado do template, exercitando o
   aplicativo de verdade (DOM real via jsdom) em vez de só ler o código.

   USO
     npm install jsdom                     (uma vez, em qualquer pasta)
     node Template/verificar.js Eixo2_Temas/avaliacao.html

   O QUE ELE GARANTE
     - o arquivo abre sem erro de configuração;
     - todo gabarito corresponde exatamente a uma categoria;
     - o guia foi gerado com uma entrada por categoria;
     - percorrer todos os ensaios funciona do início ao fim;
     - nenhum feedback de acerto/erro aparece em momento algum;
     - o CSV sai íntegro, com todas as colunas e sem quebrar em vírgulas;
     - a retomada após queda da aba não duplica nem perde respostas.

   Sai com código 0 se tudo passou, 1 se algo falhou.
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

/* Lê um CSV respeitando aspas — rótulos de categoria contêm vírgulas
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
console.log(`\nVerificando: ${alvo}\n${"=".repeat(60)}`);

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
  ok(true, "título já foi personalizado (não é mais o do exemplo)");
}
ok(CATS.every((c) => c.definicao && c.definicao.trim().length > 0), "toda categoria tem definição para o guia");

console.log("\n2. Coerência entre gabaritos e categorias");
const rotulos = CATS.map((c) => c.rotulo);
const semGabarito = ENS.filter((e) => e.gabarito === undefined);
const forasteiros = ENS.filter((e) => e.gabarito !== undefined && !(e.opcoes || rotulos).includes(e.gabarito));
ok(forasteiros.length === 0,
   forasteiros.length ? `gabaritos sem categoria correspondente: ${forasteiros.map((e) => e.id + ' → "' + e.gabarito + '"').join("; ")}`
                      : "todo gabarito corresponde exatamente a uma categoria");
if (semGabarito.length) ok(true, `aviso: ${semGabarito.length} ensaio(s) sem gabarito (não serão corrigidos)`);
const usadas = new Set(ENS.map((e) => e.gabarito).filter(Boolean));
const naoUsadas = rotulos.filter((r) => !usadas.has(r));
ok(true, `${usadas.size} de ${rotulos.length} categorias aparecem como resposta correta` +
   (naoUsadas.length ? ` (nunca correta: ${naoUsadas.join(", ")})` : ""));
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
const escolhidas = [];
let vazamentos = 0;
for (let i = 0; i < ENS.length; i++) {
  const e = ENS[i];
  const bs = a.qsa("#opcoes .opcao");
  if (bs.length < 2) { ok(false, `[${e.id}] menos de 2 alternativas`); break; }
  if (CFG.exigirResposta && !a.el("btn-proxima").disabled) {
    ok(false, `[${e.id}] "Próxima" não estava bloqueada antes da escolha`);
  }
  const alvoBotao = bs.find((b) => b.innerHTML === e.gabarito) || bs[0];
  a.clique(alvoBotao);
  escolhidas.push(alvoBotao.textContent);
  if (a.qsa("#opcoes .opcao.selecionada").length !== 1) ok(false, `[${e.id}] seleção não é exclusiva`);
  if (/Correto|Incorreto|Parabéns|acertou|errou/i.test(a.el("tela-ensaio").textContent)) vazamentos++;
  a.clique(a.el("btn-proxima"));
}
ok(true, `${ENS.length} ensaios percorridos sem travar`);
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
const iRes = cab.indexOf("Resultado"), iEsc = cab.indexOf("Escolha"), iGab = cab.indexOf("Gabarito");
ok(corpo.every((l) => ["Certo", "Errado", "sem gabarito", "sem resposta"].includes(l[iRes])),
   "coluna Resultado só contém valores previstos");
ok(corpo.every((l, i) => ENS[i].gabarito === undefined || (l[iEsc] === ENS[i].gabarito ? l[iRes] === "Certo" : true)),
   "correção coerente com as escolhas feitas");

console.log("\n6. Retomada após queda da aba");
if (ENS.length >= 2) {
  const b = await abrir(HTML);
  b.clique(b.el("btn-iniciar"));
  b.clique(b.qs("#opcoes .opcao"));
  b.clique(b.el("btn-proxima"));
  const rascunho = b.w.localStorage.getItem("simccit_avaliacao_v1");
  ok(rascunho !== null && JSON.parse(rascunho).respostas.length === 1, "rascunho gravado a cada ensaio");
  const c = await abrir(HTML, { confirmar: true, armazenamento: rascunho });
  ok(c.el("indicador-progresso").textContent === `Ensaio 2 de ${ENS.length}`,
     `retoma no ensaio 2, sem repetir o primeiro (${c.el("indicador-progresso").textContent})`);
  for (let i = 1; i < ENS.length; i++) {
    c.clique(c.qs("#opcoes .opcao"));
    c.clique(c.el("btn-proxima"));
  }
  c.el("campo-codigo").value = "TESTE_02";
  c.clique(c.el("btn-baixar"));
  const linhas = parseCsv(c.csv()).slice(1);
  ok(linhas.length === ENS.length, "CSV retomado tem todos os ensaios");
  ok(linhas.map((l) => l[2]).join() === ids.join(), "sem duplicatas nem buracos após a retomada");
  ok(c.w.localStorage.getItem("simccit_avaliacao_v1") === null, "rascunho apagado após a entrega");
} else {
  ok(true, "pulado (projeto com um só ensaio)");
}

console.log("\n" + "=".repeat(60));
console.log(falhas ? `>>> ${falhas} FALHA(S) em ${alvo}\n` : `Tudo certo: ${alvo} está pronto para aplicação.\n`);
process.exit(falhas ? 1 : 0);
})();
