/* =========================================================
   Alves.3D — funções e modelos compartilhados
   Usado pelas páginas (index, catálogo, produto) E pelo build
   (build/gerar.mjs), para que o HTML gerado e o HTML montado
   no navegador sejam exatamente iguais.
   ========================================================= */
(function (root, factory) {
  var L = factory();
  if (typeof module === 'object' && module.exports) module.exports = L;
  else root.Loja = L;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SITE = 'https://alves3d.com.br';
  const WPP = '5516992364004';
  const DIAS_NOVO = 21;            // peça cadastrada há menos de X dias ganha o selo "Novo"

  /* ---------- utilitários ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = v => v == null || isNaN(v) ? '—' : Number(v).toFixed(2).replace('.', ',').replace(/,00$/, '');
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const slugify = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const wppLink = m => `https://wa.me/${WPP}?text=${encodeURIComponent(m)}`;
  const abs = u => !u ? '' : /^https?:\/\//.test(u) ? u : SITE + (u[0] === '/' ? '' : '/') + u;
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  /* ---------- dados do produto ---------- */
  const varsDe = p => (p.tem_variacoes && Array.isArray(p.variacoes)) ? p.variacoes.filter(v => v && v.nome) : [];
  const temOpcoes = p => varsDe(p).length > 0 || !!p._v;
  const precoMin = p => {
    const ps = varsDe(p).map(v => v.preco != null ? +v.preco : (p.preco != null ? +p.preco : null)).filter(x => x != null);
    return ps.length ? Math.min(...ps) : (p.preco != null ? +p.preco : null);
  };
  const capa = p => {
    if (p.imagens && p.imagens[0]) return p.imagens[0];
    for (const v of varsDe(p)) if (v.imagens && v.imagens[0]) return v.imagens[0];
    return '';
  };
  const segundaFoto = p => (p.imagens && p.imagens[1]) || '';
  const fotosIniciais = p => {
    if (p.imagens && p.imagens.length) return p.imagens;
    const v = varsDe(p).find(v => v.imagens && v.imagens.length);
    return v ? v.imagens : [];
  };
  const ehNovo = (p, agora) => {
    const t = Date.parse(p.created_at || '');
    return !isNaN(t) && ((agora || Date.now()) - t) < DIAS_NOVO * 864e5;
  };

  /* ---------- endereços ---------- */
  // paginas: código -> slug das páginas estáticas que existem (preenchido pelo build)
  // cats:    categoria -> slug da página de categoria
  const mapa = { paginas: {}, cats: {} };
  function registrar(d) {
    if (!d) return;
    if (d.paginas) Object.assign(mapa.paginas, d.paginas);
    if (d.cats) Object.assign(mapa.cats, d.cats);
  }
  const slugProduto = p => [slugify(p.nome), slugify(p.codigo)].filter(Boolean).join('-') || 'peca';
  const urlProdutoAntiga = p => `/produto.html?id=${encodeURIComponent(p.codigo)}`;
  const urlProduto = p => mapa.paginas[p.codigo] ? `/produto/${mapa.paginas[p.codigo]}.html` : urlProdutoAntiga(p);
  const urlCategoria = c => !c || c === 'Todos' ? '/catalogo.html'
    : mapa.cats[c] ? `/catalogo/${mapa.cats[c]}.html` : `/catalogo.html?cat=${encodeURIComponent(c)}`;
  // "Caixa/Embalagem" pode quebrar de linha depois da barra, sem cortar a palavra no meio
  const nomeCat = c => esc(c).replace(/\//g, '/<wbr>');

  const ICO_CART = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20.5" r="1.2"/><circle cx="17.5" cy="20.5" r="1.2"/><path d="M14 9.5v4M12 11.5h4"/></svg>';

  /* =======================================================
     CATÁLOGO
     ======================================================= */
  function contarCategorias(lista) {
    const m = new Map();
    lista.forEach(p => m.set(p.categoria, (m.get(p.categoria) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }

  function pillsHTML(lista, ativa) {
    return [['Todos', lista.length], ...contarCategorias(lista)].map(([c, n]) =>
      `<a class="pill" href="${esc(urlCategoria(c))}" data-cat="${esc(c)}"${c === ativa ? ' aria-current="true"' : ''}>${esc(c)} <b>${n}</b></a>`).join('');
  }

  function selo(p, agora) {
    if (p.destaque) return '<span class="badge">Destaque</span>';
    if (ehNovo(p, agora)) return '<span class="badge badge-new">Novo</span>';
    return '';
  }

  function cardHTML(p, i, agora) {
    const vs = varsDe(p), img = capa(p), mp = precoMin(p), img2 = segundaFoto(p);
    const optsHTML = vs.length ? `<div class="opts" aria-label="${vs.length} opções">${vs.slice(0, 4).map(v =>
      v.imagens && v.imagens[0]
        ? `<i class="opt" style="background-image:url('${esc(v.imagens[0])}')"></i>`
        : `<i class="opt">${esc(v.nome.trim().charAt(0).toUpperCase())}</i>`).join('')}<span>${vs.length} opç${vs.length > 1 ? 'ões' : 'ão'}</span></div>` : '';
    return `
  <a class="card" href="${esc(urlProduto(p))}" style="--i:${Math.min(i, 12)}" data-cod="${esc(p.codigo)}"${img2 ? ` data-alt="${esc(img2)}"` : ''}>
    <div class="card-img" style="--img:url('${esc(img)}')">
      ${img ? `<img src="${esc(img)}" alt="${esc(p.nome)}" width="600" height="600" loading="${i < 6 ? 'eager' : 'lazy'}" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` : ''}
      <div class="card-ph"${img ? '' : ' style="display:grid"'}>🖨️</div>
      ${selo(p, agora)}
      ${optsHTML}
    </div>
    <div class="card-body">
      <div class="card-cat">${esc(p.categoria)}</div>
      <div class="card-name">${esc(p.nome)}</div>
      <div class="card-foot">
        <div class="price"><small>a partir de</small><b>R$${fmt(mp)}</b></div>
        <button type="button" class="card-wpp" aria-label="${vs.length ? 'Escolher opção de' : 'Adicionar ao carrinho:'} ${esc(p.nome)}" title="${vs.length ? 'Escolher opção' : 'Adicionar ao carrinho'}">${ICO_CART}</button>
      </div>
    </div>
  </a>`;
  }

  const ideaCard = () => `
  <a class="card card-idea" href="/#sua-ideia" data-track="catalogo_card_ideia" style="--i:6">
    <div>
      <div class="k">Peça personalizada</div>
      <h3>Não achou o que procura?</h3>
      <p>Mande uma foto ou descreva a ideia — eu modelo e imprimo do seu jeito.</p>
    </div>
    <span class="go">Mandar minha ideia <svg class="ic"><use href="#i-arrow"/></svg></span>
    <svg class="layers" viewBox="0 0 100 100" fill="#fff"><rect x="10" y="80" width="80" height="8" rx="2"/><rect x="18" y="68" width="64" height="8" rx="2"/><rect x="26" y="56" width="48" height="8" rx="2"/><rect x="34" y="44" width="32" height="8" rx="2"/></svg>
  </a>`;

  // Grade pronta: cards na ordem recebida + o card "Não achou?" depois da 7ª peça
  function gradeHTML(lista, agora) {
    const html = lista.map((p, i) => cardHTML(p, i, agora));
    html.splice(Math.min(7, html.length), 0, ideaCard());
    return html.join('');
  }

  const tituloCatalogo = cat => cat === 'Todos' ? 'Catálogo <em>completo</em>' : `<em>${esc(cat)}</em>`;
  const tituloAba = cat => (cat === 'Todos' ? 'Catálogo' : cat) + ' — Alves.3D | Peças em impressão 3D';

  /* =======================================================
     PÁGINA DO PRODUTO
     ======================================================= */
  function slidesHTML(p, imgs) {
    const list = imgs.length ? imgs : [''];
    return list.map((src, i) => `
    <div class="g-slide" data-i="${i}" style="--img:url('${esc(src)}')">
      ${src ? `<img src="${esc(src)}" alt="${esc(p.nome)} — foto ${i + 1}" width="900" height="900" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async" draggable="false">` : '<div class="g-ph">🖨️</div>'}
    </div>`).join('');
  }
  function thumbsHTML(imgs) {
    return imgs.length > 1 ? imgs.map((src, i) => `<button class="g-thumb${i ? '' : ' on'}" data-i="${i}" aria-label="Foto ${i + 1}"><img src="${esc(src)}" alt="" width="80" height="80" loading="lazy"></button>`).join('') : '';
  }

  const descProduto = p => `${p.nome} em impressão 3D. A partir de R$${fmt(precoMin(p))}. Peça pelo WhatsApp e receba em todo o Brasil.`;

  function produtoHTML(p) {
    const vs = varsDe(p);
    const catURL = esc(urlCategoria(p.categoria));
    const specs = [['Material', p.material], ['Tamanho', p.tamanho]].filter(([, v]) => v && String(v).trim());
    const imgs = fotosIniciais(p);
    const many = imgs.length > 1;
    return `
  <div class="page">
    <div class="gallery fade">
      <div class="g-main">
        <div class="g-track" id="gTrack">${slidesHTML(p, imgs)}</div>
        <button class="g-btn g-prev" id="gPrev" aria-label="Foto anterior"${many ? '' : ' style="visibility:hidden"'}><svg class="ic"><use href="#i-arrow"/></svg></button>
        <button class="g-btn g-next" id="gNext" aria-label="Próxima foto"${many ? '' : ' style="visibility:hidden"'}><svg class="ic"><use href="#i-arrow"/></svg></button>
        <span class="g-zoom"${imgs.length ? '' : ' style="display:none"'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/></svg>Toque para ampliar</span>
        <span class="g-count" id="gCount"${many ? '' : ' style="display:none"'}>1 / ${Math.max(1, imgs.length)}</span>
      </div>
      <div class="g-thumbs" id="gThumbs">${thumbsHTML(imgs)}</div>
    </div>

    <div class="info fade" style="animation-delay:.08s">
      <div class="crumb"><a href="/catalogo.html">Catálogo</a>/<a href="${catURL}">${esc(p.categoria)}</a></div>
      <a class="p-cat" href="${catURL}">${esc(p.categoria)}</a>
      <h1 class="p-name">${esc(p.nome)}</h1>
      <div class="p-code">Cód. ${esc(p.codigo)}</div>

      <div class="price-box">
        <div><div class="price-lbl" id="priceLbl">a partir de</div><div class="price-val" id="priceVal">R$${fmt(precoMin(p))}</div></div>
        <div class="price-note">Valor final confirmado no WhatsApp conforme tamanho, cores e detalhes.</div>
      </div>

      ${vs.length ? `
      <div class="block">
        <div class="lbl" id="varLbl">Escolha a opção <b id="varName"></b></div>
        <div class="vars" id="vars">${vs.map((v, i) => `
          <button class="var${v.imagens && v.imagens[0] ? '' : ' no-img'}" data-i="${i}" aria-pressed="false">
            ${v.imagens && v.imagens[0] ? `<img src="${esc(v.imagens[0])}" alt="" width="40" height="40" loading="lazy">` : ''}
            ${esc(v.nome)}${v.preco != null ? ` <span class="var-price">R$${fmt(v.preco)}</span>` : ''}
          </button>`).join('')}</div>
        <div class="var-desc" id="varDesc"></div>
      </div>` : ''}

      <div class="block">
        <div class="lbl">Personalização <span style="text-transform:none;letter-spacing:0">(opcional)</span></div>
        <input class="inp" id="pers" maxlength="80" placeholder="Ex.: nome para gravar, cor preferida, frase…" aria-label="Personalização (opcional)">
      </div>

      <div class="block">
        <div class="row2">
          <div><div class="lbl">Quantidade</div>
            <div class="qty"><button type="button" id="qMinus" aria-label="Diminuir">−</button><output id="qVal">1</output><button type="button" id="qPlus" aria-label="Aumentar">+</button></div>
          </div>
          <div class="total" id="total"></div>
        </div>
      </div>

      <div class="cta" id="mainCta">
        <button type="button" class="btn btn-primary" id="addCart"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20.5" r="1.2"/><circle cx="17.5" cy="20.5" r="1.2"/></svg>Adicionar ao carrinho</button>
        <button class="btn btn-ghost share" id="shareBtn" aria-label="Compartilhar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg></button>
      </div>
      <a href="${esc(wppLink(`Olá! Vi no site e quero pedir:\n\nProduto: ${p.nome} (${p.codigo})`))}" class="btn btn-ghost wpp-alt" id="wppBtn" target="_blank" rel="noopener"><svg class="ic" style="color:var(--wpp)"><use href="#i-wpp"/></svg>Pedir só esta peça no WhatsApp</a>

      <div class="eta" id="eta" hidden></div>

      <div class="perks">
        <div class="perk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><div><b>3 a 7 dias úteis</b>de produção</div></div>
        <div class="perk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg><div><b>Envio para todo o Brasil</b>com código de rastreio</div></div>
        <div class="perk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg><div><b>Desconto a partir de 3 un.</b>ideal para presentes e brindes</div></div>
        <div class="perk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-1.4 1-2.4 2.4-2.4H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="7.5" r="1"/></svg><div><b>Várias cores</b>escolha no pedido</div></div>
      </div>

      <div class="pay"><span class="pay-lbl">Pagamento</span><span class="pay-chip">Pix</span><span class="pay-chip">Crédito</span><span class="pay-chip">Débito</span><span class="pay-chip">Dinheiro</span><span class="pay-frete">· Frete pelo CEP</span></div>

      ${p.descricao ? `<div class="block"><div class="lbl">Sobre a peça</div><div class="desc">${esc(p.descricao)}</div></div>` : ''}
      ${specs.length ? `<div class="specs">${specs.map(([k, v]) => `<div class="spec"><span>${k}</span>${esc(v)}</div>`).join('')}</div>` : ''}
      ${(p.tags || []).length ? `<div class="tags">${p.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>` : ''}
      <a class="back" href="${catURL}"><svg class="ic"><use href="#i-arrow"/></svg>Mais peças de ${esc(p.categoria)}</a>
    </div>
  </div>`;
  }

  // Sugestões: primeiro a mesma categoria, depois as outras (só peças com foto)
  function escolherRelacionados(p, lista, n) {
    const outros = lista.filter(r => r.codigo !== p.codigo && capa(r));
    return [...outros.filter(r => r.categoria === p.categoria), ...outros.filter(r => r.categoria !== p.categoria)].slice(0, n || 4);
  }
  const rcardHTML = r => `
        <a class="rcard" href="${esc(urlProduto(r))}" data-cod="${esc(r.codigo)}">
          <div class="im" style="--img:url('${esc(capa(r))}')"><img src="${esc(capa(r))}" alt="${esc(r.nome)}" width="400" height="400" loading="lazy" decoding="async"></div>
          <div class="bd"><div class="nm">${esc(r.nome)}</div><div class="pr"><small>a partir de</small>R$${fmt(precoMin(r))}</div></div>
        </a>`;
  const relacionadosHTML = (pick, titulo) => `<h2 class="rel-title">${titulo || 'Você também <em>pode gostar</em>'}</h2>
      <div class="rel-grid">${pick.map(rcardHTML).join('')}</div>`;

  function jsonLdProduto(p, url) {
    const imgs = [...(p.imagens || []), ...varsDe(p).flatMap(v => v.imagens || [])].slice(0, 6).map(abs);
    const precos = varsDe(p).map(v => v.preco != null ? +v.preco : (p.preco != null ? +p.preco : null)).filter(x => x != null);
    const min = precoMin(p), max = precos.length ? Math.max(...precos) : min;
    const offer = precos.length && max !== min
      ? { '@type': 'AggregateOffer', priceCurrency: 'BRL', lowPrice: min, highPrice: max, offerCount: precos.length, availability: 'https://schema.org/InStock', url }
      : { '@type': 'Offer', priceCurrency: 'BRL', price: min ?? undefined, availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition', url };
    return {
      '@context': 'https://schema.org', '@type': 'Product',
      name: p.nome, sku: p.codigo, category: p.categoria,
      description: (p.descricao || descProduto(p)).slice(0, 500),
      image: imgs.length ? imgs : undefined,
      material: p.material || undefined,
      brand: { '@type': 'Brand', name: 'Alves.3D' },
      offers: offer
    };
  }

  /* Prazo estimado: produção de 3 a 7 dias úteis a partir de hoje */
  function somarDiasUteis(data, n) {
    const d = new Date(data);
    while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) n--; }
    return d;
  }
  function prazoTexto(hoje) {
    const f = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const h = hoje || new Date();
    return `Pedindo hoje, sua peça fica pronta entre <b>${f(somarDiasUteis(h, 3))}</b> e <b>${f(somarDiasUteis(h, 7))}</b>`;
  }

  /* =======================================================
     PÁGINA INICIAL
     ======================================================= */
  function homeCatsHTML(lista) {
    const map = new Map();
    lista.forEach(p => {
      const c = p.categoria || 'Outros';
      if (!map.has(c)) map.set(c, { n: 0, min: null, img: '' });
      const m = map.get(c); m.n++;
      const mp = precoMin(p); if (mp != null && (m.min == null || mp < m.min)) m.min = mp;
      if (!m.img) m.img = capa(p);
    });
    const cats = [...map.entries()].sort((a, b) => b[1].n - a[1].n);
    return cats.slice(0, 7).map(([c, m]) => `
    <a class="cat" href="${esc(urlCategoria(c))}" data-track="home_categoria">
      ${m.img ? `<img src="${esc(m.img)}" alt="" width="400" height="500" loading="lazy" decoding="async">` : ''}
      <span class="cat-go"><svg class="ic"><use href="#i-arrow"/></svg></span>
      <div class="cat-body"><div class="cat-name">${nomeCat(c)}</div><div class="cat-meta">${m.n} peça${m.n > 1 ? 's' : ''}${m.min != null ? ' · a partir de R$' + fmt(m.min) : ''}</div></div>
    </a>`).join('') + `
    <a class="cat cat-all" href="/catalogo.html" data-track="home_categoria_todas">
      <span class="cat-go" style="background:rgba(255,255,255,.2)"><svg class="ic"><use href="#i-arrow"/></svg></span>
      <div><div class="cat-name">Ver tudo</div></div>
      <p>${lista.length} peças em ${cats.length} categorias</p>
    </a>`;
  }

  const destaquesDe = lista => [...lista.filter(p => p.destaque), ...lista.filter(p => !p.destaque)].filter(p => capa(p)).slice(0, 8);
  // Novidades: as mais recentes que ainda não apareceram nos destaques
  function novidadesDe(lista, fora) {
    const ja = new Set((fora || []).map(p => p.codigo));
    return lista.filter(p => capa(p) && !ja.has(p.codigo))
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 8);
  }

  function homeProdHTML(p, track, agora) {
    const mp = precoMin(p), op = temOpcoes(p);
    return `
    <a class="prod" href="${esc(urlProduto(p))}" data-track="${track || 'home_produto'}">
      <div class="prod-img"><img src="${esc(capa(p))}" alt="${esc(p.nome)}" width="500" height="500" loading="lazy" decoding="async">${p.destaque ? '<span class="prod-badge">Destaque</span>' : ehNovo(p, agora) ? '<span class="prod-badge prod-badge-new">Novo</span>' : ''}</div>
      <div class="prod-body">
        <div class="prod-cat">${esc(p.categoria)}</div>
        <div class="prod-name">${esc(p.nome)}</div>
        <div class="prod-foot">
          <div class="prod-price"><small>a partir de</small><b>R$${fmt(mp)}</b></div>
          <span class="prod-wpp" role="button" tabindex="0" data-cod="${esc(p.codigo)}" aria-label="${op ? 'Escolher opção de' : 'Adicionar ao carrinho:'} ${esc(p.nome)}" title="${op ? 'Escolher opção' : 'Adicionar ao carrinho'}">${ICO_CART}</span>
        </div>
      </div>
    </a>`;
  }
  const homeProdsHTML = (lista, track, agora) => lista.map(p => homeProdHTML(p, track, agora)).join('');

  /* =======================================================
     VISTOS RECENTEMENTE (só no navegador)
     ======================================================= */
  const KEY_VISTOS = 'alves3d-vistos';
  const vistos = {
    ler() { try { const v = JSON.parse(localStorage.getItem(KEY_VISTOS)); return Array.isArray(v) ? v.filter(x => x && x.codigo) : []; } catch (e) { return []; } },
    add(p) {
      try {
        const s = { codigo: p.codigo, nome: p.nome, categoria: p.categoria, preco: precoMin(p), imagens: capa(p) ? [capa(p)] : [], _v: varsDe(p).length > 0 };
        localStorage.setItem(KEY_VISTOS, JSON.stringify([s, ...this.ler().filter(x => x.codigo !== s.codigo)].slice(0, 9)));
      } catch (e) {}
    }
  };

  return {
    SITE, WPP, esc, fmt, norm, slugify, wppLink, abs, plural,
    varsDe, temOpcoes, precoMin, capa, fotosIniciais, ehNovo,
    registrar, mapa, slugProduto, urlProduto, urlProdutoAntiga, urlCategoria, nomeCat,
    contarCategorias, pillsHTML, cardHTML, ideaCard, gradeHTML, tituloCatalogo, tituloAba,
    slidesHTML, thumbsHTML, descProduto, produtoHTML, escolherRelacionados, rcardHTML, relacionadosHTML, jsonLdProduto,
    somarDiasUteis, prazoTexto,
    homeCatsHTML, destaquesDe, novidadesDe, homeProdHTML, homeProdsHTML,
    vistos
  };
});
