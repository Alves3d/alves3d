#!/usr/bin/env node
/* =========================================================
   Alves.3D — build estático (sem dependências, Node 18+)

   Lê os produtos da MESMA fonte do site (Supabase) e escreve o
   conteúdo direto no HTML, para que Google, prévias de link
   (WhatsApp/Instagram) e IAs enxerguem as peças sem executar JS.

   Uso:   npm run build
   Opções (para testes):
     --dados arquivo.json   lê os produtos de um arquivo em vez do Supabase
     --raiz pasta           pasta do site (padrão: a pasta acima de /build)
   ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const arg = n => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const RAIZ = path.resolve(arg('raiz') || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const Loja = require(path.join(RAIZ, 'loja.js'));
const { SITE, esc, fmt, abs, precoMin, capa } = Loja;

const SUPABASE_URL = 'https://bhqcdzthiatoonbkjioe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SmwxRZ8gZSxp6V8rciCudQ_s5QpLK79';   // chave pública, a mesma do site

// Campos que cada página usa (iguais aos pedidos pelo JS de cada uma, na mesma ordem)
const SEL_CATALOGO = ['codigo', 'nome', 'categoria', 'preco', 'descricao', 'tags', 'imagens', 'destaque', 'tem_variacoes', 'variacoes', 'ordem', 'created_at'];
const SEL_HOME = ['codigo', 'nome', 'categoria', 'preco', 'imagens', 'destaque', 'brinde', 'tem_variacoes', 'variacoes', 'ordem', 'created_at'];
const SEL_EMPRESAS = ['codigo', 'nome', 'categoria', 'preco', 'imagens', 'tem_variacoes', 'variacoes', 'brinde', 'ordem', 'created_at'];
const SEL_PRODUTO = ['codigo', 'nome', 'categoria', 'preco', 'descricao', 'material', 'tamanho', 'tags', 'imagens', 'destaque', 'tem_variacoes', 'variacoes'];

const ler = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const gravar = (f, s) => { const p = path.join(RAIZ, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const so = (p, campos) => Object.fromEntries(campos.map(k => [k, p[k] ?? null]));
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const dadosTag = o => `\n<script id="dados" type="application/json">${json(o)}</script>\n`;
const ldTag = o => `<script type="application/ld+json">${json(o)}</script>`;
const cortar = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };

/* Troca o conteúdo entre <!--b:nome--> e <!--/b:nome--> (pode rodar quantas vezes quiser) */
function bloco(html, nome, conteudo) {
  const re = new RegExp(`(<!--b:${nome}-->)[\\s\\S]*?(<!--/b:${nome}-->)`);
  if (!re.test(html)) throw new Error(`Marcador <!--b:${nome}--> não encontrado no HTML`);
  return html.replace(re, (m, a, b) => a + conteudo + b);
}

/* ---------- 1. produtos ---------- */
async function carregarProdutos() {
  const arquivo = arg('dados');
  if (arquivo) return JSON.parse(fs.readFileSync(arquivo, 'utf8')).filter(p => p.publicado !== false);
  const url = `${SUPABASE_URL}/rest/v1/produtos?select=*&publicado=eq.true&order=ordem.asc.nullslast,created_at.desc`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY } });
  if (!res.ok) throw new Error(`Supabase respondeu ${res.status} ${res.statusText}`);
  return res.json();
}

function slugsUnicos(itens, base) {
  const usados = new Set(), out = {};
  for (const it of itens) {
    let s = base(it) || 'item', n = 2;
    const raiz = s;
    while (usados.has(s)) s = `${raiz}-${n++}`;
    usados.add(s); out[it.chave] = s;
  }
  return out;
}

const hoje = new Date().toISOString().slice(0, 10);

async function main() {
  const produtos = await carregarProdutos();
  if (!Array.isArray(produtos) || !produtos.length) throw new Error('Nenhum produto publicado foi encontrado — nada foi alterado.');
  const agora = Date.now();

  const categorias = Loja.contarCategorias(produtos);                    // [[nome, quantidade], …] da maior para a menor
  const paginas = slugsUnicos(produtos.map(p => ({ chave: p.codigo, p })), it => Loja.slugProduto(it.p));
  const cats = slugsUnicos(categorias.map(([c]) => ({ chave: c })), it => Loja.slugify(it.chave));
  Loja.registrar({ paginas, cats });

  /* ---------- 2. catálogo (catalogo.html + uma página por categoria) ---------- */
  const listaCat = produtos.map(p => so(p, SEL_CATALOGO));
  const itemList = (lista, nome) => ({
    '@context': 'https://schema.org', '@type': 'ItemList', name: nome, numberOfItems: lista.length,
    itemListElement: lista.slice(0, 100).map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.nome, url: SITE + Loja.urlProduto(p) }))
  });
  const headCatalogo = ({ titulo, desc, url, ogTitulo, img, ld }) => `
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Alves.3D">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(ogTitulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
${ld.map(ldTag).join('\n')}
`;
  const paginaCatalogo = (base, cat, lista, head, crumb) => {
    let h = base;
    h = bloco(h, 'head', head);
    h = bloco(h, 'titulo', Loja.tituloCatalogo(cat));
    h = bloco(h, 'count', `${lista.length} peça${lista.length !== 1 ? 's' : ''}`);
    h = bloco(h, 'crumb', crumb);
    h = bloco(h, 'pills', Loja.pillsHTML(listaCat, cat));
    h = bloco(h, 'grid', Loja.gradeHTML(lista, agora) + '\n    ');
    h = bloco(h, 'dados', dadosTag({ cat, paginas, cats, produtos: listaCat }));
    return h;
  };

  const modeloCatalogo = ler('catalogo.html');
  const nomesCats = categorias.slice(0, 8).map(([c]) => c.toLowerCase()).join(', ');
  gravar('catalogo.html', paginaCatalogo(modeloCatalogo, 'Todos', listaCat, headCatalogo({
    titulo: Loja.tituloAba('Todos'),
    desc: `Catálogo de peças em impressão 3D da Alves.3D: ${nomesCats} e muito mais. ${produtos.length} peças com fotos e preços. Peça pelo WhatsApp e receba em todo o Brasil.`,
    url: `${SITE}/catalogo.html`, ogTitulo: 'Catálogo — Alves.3D', img: `${SITE}/imgs/hero-bg.jpg`,
    ld: [itemList(listaCat, 'Catálogo Alves.3D')]
  }), '<a href="/">Início</a> / Catálogo'));

  fs.rmSync(path.join(RAIZ, 'catalogo'), { recursive: true, force: true });
  for (const [cat, n] of categorias) {
    const lista = listaCat.filter(p => p.categoria === cat);
    const min = Math.min(...lista.map(p => precoMin(p)).filter(v => v != null));
    const url = `${SITE}/catalogo/${cats[cat]}.html`;
    const comFoto = lista.find(p => capa(p));
    gravar(`catalogo/${cats[cat]}.html`, paginaCatalogo(modeloCatalogo, cat, lista, headCatalogo({
      titulo: Loja.tituloAba(cat),
      desc: `${cat} em impressão 3D: ${n} peça${n > 1 ? 's' : ''}${isFinite(min) ? ` a partir de R$${fmt(min)}` : ''}. Veja fotos e preços e peça pelo WhatsApp. Envio para todo o Brasil.`,
      url, ogTitulo: `${cat} — Alves.3D`, img: comFoto ? abs(capa(comFoto)) : `${SITE}/imgs/hero-bg.jpg`,
      ld: [itemList(lista, `${cat} — Alves.3D`), {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: 'Catálogo', item: SITE + '/catalogo.html' },
          { '@type': 'ListItem', position: 3, name: cat, item: url }]
      }]
    }), `<a href="/">Início</a> / <a href="/catalogo.html">Catálogo</a> / ${esc(cat)}`));
  }

  /* ---------- 3. uma página por produto ---------- */
  const modeloProduto = ler('produto.html');
  fs.rmSync(path.join(RAIZ, 'produto'), { recursive: true, force: true });
  for (const p of produtos) {
    const url = SITE + Loja.urlProduto(p);
    const img = capa(p) ? abs(capa(p)) : `${SITE}/imgs/hero-bg.jpg`;
    const min = precoMin(p);
    const desc = Loja.descProduto(p);
    const ogDesc = p.descricao ? cortar(p.descricao, 180) : desc;
    const ogTitulo = `${p.nome}${min != null ? ` — a partir de R$${fmt(min)}` : ''}`;
    const head = `
<title>${esc(p.nome)} — Alves.3D</title>
<meta name="description" id="metaDesc" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Alves.3D">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(ogTitulo)}">
<meta property="og:description" content="${esc(ogDesc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:alt" content="${esc(p.nome)}">
${min != null ? `<meta property="product:price:amount" content="${Number(min).toFixed(2)}">\n<meta property="product:price:currency" content="BRL">\n` : ''}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitulo)}">
<meta name="twitter:description" content="${esc(ogDesc)}">
<meta name="twitter:image" content="${esc(img)}">
${ldTag(Loja.jsonLdProduto(p, url))}
${ldTag({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Catálogo', item: SITE + '/catalogo.html' },
        { '@type': 'ListItem', position: 2, name: p.categoria, item: SITE + Loja.urlCategoria(p.categoria) },
        { '@type': 'ListItem', position: 3, name: p.nome, item: url }]
    })}
`;
    // sugestões: mesma ordem usada pelo site (destaques primeiro)
    const ordenados = [...produtos].sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0));
    const rel = Loja.escolherRelacionados(p, ordenados, 4);
    let h = modeloProduto;
    h = bloco(h, 'head', head);
    h = bloco(h, 'conteudo', Loja.produtoHTML(p) + '\n');
    h = bloco(h, 'relacionados', rel.length
      ? `<section class="related" id="related">${Loja.relacionadosHTML(rel)}</section>`
      : '<section class="related" id="related" hidden></section>');
    h = bloco(h, 'dados', dadosTag({ paginas, cats, produto: so(p, SEL_PRODUTO) }));
    gravar(`produto/${paginas[p.codigo]}.html`, h);
  }

  /* ---------- 4. página inicial ---------- */
  const listaHome = [...produtos].sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0)).map(p => so(p, SEL_HOME));
  const dest = Loja.destaquesDe(listaHome), novos = Loja.novidadesDe(listaHome, dest);
  let home = ler('index.html');
  home = bloco(home, 'cats', Loja.homeCatsHTML(listaHome) + '\n  ');
  home = bloco(home, 'prods', Loja.homeProdsHTML(dest, 'home_produto', agora) + '\n  ');
  home = bloco(home, 'novos', novos.length >= 4 ? Loja.homeProdsHTML(novos, 'home_novidade', agora) + '\n  ' : '');
  home = home.replace(/(<section class="section" id="novidades" style="padding-top:0")( hidden)?>/, (m, a) => a + (novos.length >= 4 ? '' : ' hidden') + '>');
  home = home.replace(/(<span id="statProdutos" data-count=")\d+(">)\d+/, (m, a, b) => a + produtos.length + b + produtos.length);
  const brindesHome = Loja.brindesDe(listaHome).slice(0, 4);
  home = bloco(home, 'brindes', brindesHome.length ? Loja.homeProdsHTML(brindesHome, 'home_brinde', agora) : '');
  home = bloco(home, 'dados', dadosTag({ paginas, cats, produtos: listaHome }));
  gravar('index.html', home);

  /* ---------- 4b. brindes para empresas (empresas.html) ---------- */
  const listaBrindes = produtos.filter(p => p.brinde).map(p => so(p, SEL_EMPRESAS));
  let emp = ler('empresas.html');
  emp = bloco(emp, 'brindes', Loja.brindesGradeHTML(listaBrindes) ||
    '<div class="b-empty">Os modelos estão sendo atualizados. Descreva o que precisa no orçamento abaixo que eu te mando opções.</div>');
  emp = bloco(emp, 'dados', dadosTag({ paginas, cats, produtos: listaBrindes }));
  gravar('empresas.html', emp);

  /* ---------- 5. sitemap.xml e robots.txt ---------- */
  const dataDe = p => String(p.updated_at || p.created_at || '').slice(0, 10) || hoje;
  const ultima = lista => lista.map(dataDe).sort().pop() || hoje;
  const urls = [
    [`${SITE}/`, ultima(produtos), '1.0'],
    [`${SITE}/catalogo.html`, ultima(produtos), '0.9'],
    [`${SITE}/empresas.html`, ultima(produtos.filter(p => p.brinde).concat([{ created_at: '2026-11-22' }])), '0.9'],
    ...categorias.map(([c]) => [`${SITE}/catalogo/${cats[c]}.html`, ultima(produtos.filter(p => p.categoria === c)), '0.8']),
    ...produtos.map(p => [SITE + Loja.urlProduto(p), dataDe(p), '0.7'])
  ];
  gravar('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, d, pr]) => `  <url><loc>${esc(u)}</loc><lastmod>${d}</lastmod><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`);
  gravar('robots.txt', `User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /pesquisa.html

Sitemap: ${SITE}/sitemap.xml
`);

  console.log(`✔ ${produtos.length} produtos · ${categorias.length} categorias`);
  console.log(`✔ catalogo.html, index.html, empresas.html (${listaBrindes.length} brindes), ${categorias.length} páginas em /catalogo, ${produtos.length} páginas em /produto, sitemap.xml (${urls.length} endereços), robots.txt`);
}

main().catch(e => { console.error('✖ Build falhou:', e.message); process.exit(1); });
