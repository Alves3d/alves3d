/* =========================================================
   Alves.3D — Carrinho de pedidos (fecha no WhatsApp)
   Usado em index.html, catalogo.html e produto.html.
   Os itens ficam salvos no navegador do cliente.
   API: Carrinho.add({codigo, nome, opcao, preco, qtd, pers, img})
        Carrinho.open()  Carrinho.count()
   ========================================================= */
(function () {
  'use strict';
  var WPP = '5516992364004';
  var SITE = 'https://alves3d.com.br';
  var KEY = 'alves3d-carrinho';
  var KEY_CLIENTE = 'alves3d-cliente';

  /* ---------- armazenamento ---------- */
  function ler(k, padrao) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? padrao : v; } catch (e) { return padrao; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var itens = ler(KEY, []);
  if (!Array.isArray(itens)) itens = [];
  var cliente = ler(KEY_CLIENTE, { nome: '', cep: '' }) || { nome: '', cep: '' };

  function salvar() { gravar(KEY, itens); atualizar(); }
  function track(n, x) { try { gtag('event', n, x || {}); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(v) { return v == null || isNaN(v) ? '—' : Number(v).toFixed(2).replace('.', ',').replace(/,00$/, ''); }
  function chave(i) { return [i.codigo, i.opcao || '', (i.pers || '').trim().toLowerCase()].join('|'); }
  function count() { return itens.reduce(function (n, i) { return n + (i.qtd || 1); }, 0); }
  function total() {
    var semPreco = false;
    var t = itens.reduce(function (s, i) { if (i.preco == null) { semPreco = true; return s; } return s + i.preco * i.qtd; }, 0);
    return { valor: t, semPreco: semPreco };
  }

  /* ---------- estilos ---------- */
  var css = '' +
    '.cart-btn{position:relative;width:38px;height:38px;border-radius:50%;border:1px solid var(--border2);background:var(--surface);color:var(--text);display:grid;place-items:center;cursor:pointer;transition:border-color .2s,color .2s,transform .3s var(--ease)}' +
    '.cart-btn:hover{border-color:var(--accent);color:var(--accent)}' +
    '.cart-btn svg{width:18px;height:18px}' +
    '.cart-badge{position:absolute;top:-5px;right:-5px;min-width:19px;height:19px;padding:0 5px;border-radius:100px;background:var(--accent);color:#fff;font:600 11px/19px var(--sans);text-align:center;transform:scale(0);transition:transform .3s var(--ease)}' +
    '.cart-badge.on{transform:scale(1)}' +
    '.cart-btn.bump{animation:cartBump .5s var(--ease)}' +
    '@keyframes cartBump{30%{transform:scale(1.18)}60%{transform:scale(.95)}}' +
    '.cart-ov{position:fixed;inset:0;z-index:250;background:rgba(0,0,0,.5);opacity:0;pointer-events:none;transition:opacity .3s}' +
    '.cart-ov.open{opacity:1;pointer-events:auto}' +
    '.cart-dw{position:fixed;top:0;right:0;bottom:0;z-index:260;width:min(440px,100%);background:var(--bg);border-left:1px solid var(--border2);display:flex;flex-direction:column;transform:translateX(105%);transition:transform .4s var(--ease);box-shadow:var(--shadow)}' +
    '.cart-dw.open{transform:none}' +
    '.cart-hd{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--border)}' +
    '.cart-hd h2{font:400 32px/1 var(--serif);letter-spacing:1px;margin:0}' +
    '.cart-hd h2 em{font-style:normal;color:var(--accent)}' +
    '.cart-x{width:40px;height:40px;border-radius:50%;border:1px solid var(--border2);background:none;color:var(--text);font-size:22px;line-height:1;cursor:pointer}' +
    '.cart-body{flex:1;overflow-y:auto;padding:8px 20px}' +
    '.cart-it{display:grid;grid-template-columns:64px 1fr auto;gap:12px;padding:14px 0;border-bottom:1px solid var(--border);align-items:start}' +
    '.cart-it img,.cart-it .ph{width:64px;height:64px;border-radius:12px;object-fit:cover;background:var(--surface2);display:block}' +
    '.cart-it .nm{font-weight:600;font-size:14px;line-height:1.3;text-decoration:none;color:var(--text);display:block}' +
    '.cart-it .mt{font-size:12px;color:var(--text2);margin-top:3px;line-height:1.4;word-break:break-word}' +
    '.cart-it .mt b{color:var(--text);font-weight:500}' +
    '.cart-it .row{display:flex;align-items:center;gap:10px;margin-top:8px}' +
    '.cart-q{display:inline-flex;align-items:center;height:34px;border:1px solid var(--border2);border-radius:100px;background:var(--surface)}' +
    '.cart-q button{width:32px;height:32px;border:none;background:none;color:var(--text);font-size:17px;cursor:pointer}' +
    '.cart-q span{min-width:24px;text-align:center;font:500 13px var(--mono)}' +
    '.cart-rm{border:none;background:none;color:var(--text3);font-size:12px;text-decoration:underline;cursor:pointer;padding:4px}' +
    '.cart-rm:hover{color:#ef4444}' +
    '.cart-pr{text-align:right;font:400 22px/1 var(--serif);letter-spacing:.5px;white-space:nowrap}' +
    '.cart-pr small{display:block;font:400 11px var(--sans);color:var(--text3);margin-top:4px;letter-spacing:0}' +
    '.cart-empty{text-align:center;padding:60px 10px;color:var(--text2)}' +
    '.cart-empty svg{width:54px;height:54px;color:var(--text3);margin-bottom:12px}' +
    '.cart-empty h3{font:400 30px/1 var(--serif);letter-spacing:1px;color:var(--text);margin:0 0 8px}' +
    '.cart-ft{padding:16px 20px calc(16px + env(safe-area-inset-bottom));border-top:1px solid var(--border);background:var(--surface);display:flex;flex-direction:column;gap:12px}' +
    '.cart-tot{display:flex;justify-content:space-between;align-items:flex-end}' +
    '.cart-tot span{font-size:13px;color:var(--text2)}' +
    '.cart-tot b{font:400 34px/1 var(--serif);letter-spacing:.5px}' +
    '.cart-note{font-size:12px;color:var(--text3);line-height:1.4}' +
    '.cart-fields{display:grid;grid-template-columns:1fr 130px;gap:8px}' +
    '.cart-fields input{height:42px;border-radius:12px;border:1px solid var(--border2);background:var(--bg);color:var(--text);padding:0 12px;font:14px var(--sans);outline:none;min-width:0}' +
    '.cart-fields input:focus{border-color:var(--accent)}' +
    '.cart-send{display:flex;align-items:center;justify-content:center;gap:9px;height:54px;border-radius:100px;background:var(--wpp);color:#06260f;font:600 16px var(--sans);text-decoration:none;border:none;cursor:pointer;transition:background .2s}' +
    '.cart-send:hover{background:var(--wpp2)}' +
    '.cart-send svg{width:20px;height:20px;fill:currentColor}' +
    '.cart-links{display:flex;justify-content:space-between;gap:10px}' +
    '.cart-links button,.cart-links a{border:none;background:none;color:var(--text2);font:13px var(--sans);text-decoration:underline;cursor:pointer;padding:2px}' +
    '.cart-sent{padding:12px 14px;border-radius:12px;background:color-mix(in srgb,var(--wpp) 14%,var(--surface));font-size:13px;line-height:1.45;display:none}' +
    '.cart-sent.on{display:block}' +
    '.cart-sent button{margin-top:8px;border:1px solid var(--border2);background:var(--surface);color:var(--text);border-radius:100px;padding:7px 14px;font:600 13px var(--sans);cursor:pointer}' +
    '.cart-toast{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom));z-index:270;transform:translate(-50%,20px);opacity:0;pointer-events:none;display:flex;align-items:center;gap:12px;background:var(--text);color:var(--bg);padding:10px 10px 10px 18px;border-radius:100px;font:500 14px var(--sans);box-shadow:var(--shadow);transition:all .35s var(--ease);white-space:nowrap}' +
    '.cart-toast.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}' +
    '.cart-toast button{border:none;background:var(--accent);color:#fff;border-radius:100px;padding:7px 14px;font:600 13px var(--sans);cursor:pointer}' +
    'body.cart-lock{overflow:hidden}' +
    '@media (prefers-reduced-motion:reduce){.cart-dw,.cart-ov,.cart-toast,.cart-badge{transition:none}.cart-btn.bump{animation:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var ICON_CART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20.5" r="1.2"/><circle cx="17.5" cy="20.5" r="1.2"/></svg>';
  var ICON_WPP = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-wpp"/></svg>';

  /* ---------- botão no topo ---------- */
  var navBtn = document.createElement('button');
  navBtn.type = 'button';
  navBtn.className = 'cart-btn';
  navBtn.setAttribute('aria-label', 'Abrir carrinho');
  navBtn.innerHTML = ICON_CART + '<span class="cart-badge" aria-hidden="true">0</span>';
  navBtn.addEventListener('click', function () { open(); });
  var navRight = document.querySelector('.nav-right');
  if (navRight) {
    var theme = navRight.querySelector('#themeBtn');
    if (theme && theme.nextSibling) navRight.insertBefore(navBtn, theme.nextSibling); else navRight.appendChild(navBtn);
  }

  /* ---------- gaveta ---------- */
  var ov = document.createElement('div'); ov.className = 'cart-ov';
  var dw = document.createElement('aside');
  dw.className = 'cart-dw';
  dw.setAttribute('role', 'dialog'); dw.setAttribute('aria-modal', 'true'); dw.setAttribute('aria-label', 'Carrinho'); dw.setAttribute('aria-hidden', 'true');
  dw.innerHTML =
    '<div class="cart-hd"><h2>Seu <em>pedido</em></h2><button type="button" class="cart-x" aria-label="Fechar carrinho">×</button></div>' +
    '<div class="cart-body"></div>' +
    '<div class="cart-ft">' +
      '<div class="cart-tot"><span>Total estimado</span><b class="cart-total">R$0</b></div>' +
      '<div class="cart-note">Frete, prazo e valor final são confirmados no WhatsApp. A partir de 3 unidades tem desconto.</div>' +
      '<div class="cart-fields"><input type="text" class="cart-nome" maxlength="60" placeholder="Seu nome (opcional)" autocomplete="name"><input type="text" class="cart-cep" maxlength="9" inputmode="numeric" placeholder="CEP (frete)" autocomplete="postal-code"></div>' +
      '<a href="#" class="cart-send" target="_blank" rel="noopener">' + ICON_WPP + 'Enviar pedido no WhatsApp</a>' +
      '<div class="cart-sent">Pedido enviado? Assim que eu responder no WhatsApp, você pode limpar o carrinho.<br><button type="button" class="cart-clear2">Limpar carrinho</button></div>' +
      '<div class="cart-links"><button type="button" class="cart-continue">← Continuar escolhendo</button><button type="button" class="cart-clear">Esvaziar</button></div>' +
    '</div>';
  document.body.appendChild(ov); document.body.appendChild(dw);

  var body = dw.querySelector('.cart-body'), ft = dw.querySelector('.cart-ft');
  var inNome = dw.querySelector('.cart-nome'), inCep = dw.querySelector('.cart-cep');
  var sendBtn = dw.querySelector('.cart-send'), sentBox = dw.querySelector('.cart-sent');
  inNome.value = cliente.nome || ''; inCep.value = cliente.cep || '';

  var lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    render(); sentBox.classList.remove('on');
    ov.classList.add('open'); dw.classList.add('open'); dw.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-lock');
    setTimeout(function () { dw.querySelector('.cart-x').focus(); }, 50);
    track('carrinho_abrir', { itens: count() });
  }
  function close() {
    ov.classList.remove('open'); dw.classList.remove('open'); dw.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-lock');
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }
  ov.addEventListener('click', close);
  dw.querySelector('.cart-x').addEventListener('click', close);
  dw.querySelector('.cart-continue').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dw.classList.contains('open')) close(); });

  function limpar() { itens = []; salvar(); render(); sentBox.classList.remove('on'); }
  dw.querySelector('.cart-clear').addEventListener('click', function () { if (itens.length && confirm('Esvaziar o carrinho?')) limpar(); });
  dw.querySelector('.cart-clear2').addEventListener('click', limpar);

  inNome.addEventListener('input', function () { cliente.nome = inNome.value.trim(); gravar(KEY_CLIENTE, cliente); msgLink(); });
  inCep.addEventListener('input', function () {
    var d = inCep.value.replace(/\D/g, '').slice(0, 8);
    inCep.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
    cliente.cep = inCep.value; gravar(KEY_CLIENTE, cliente); msgLink();
  });
  sendBtn.addEventListener('click', function (e) {
    if (!itens.length) { e.preventDefault(); return; }
    track('carrinho_enviar', { itens: count(), valor: total().valor });
    setTimeout(function () { sentBox.classList.add('on'); }, 600);
  });

  /* ---------- mensagem do WhatsApp ---------- */
  function mensagem() {
    var m = cliente.nome ? 'Olá! Sou ' + cliente.nome + ' e montei este pedido no site:' : 'Olá! Montei este pedido no site:';
    m += '\n';
    itens.forEach(function (i, n) {
      m += '\n' + (n + 1) + '. ' + i.nome + ' (' + i.codigo + ')';
      if (i.opcao) m += '\n   Opção: ' + i.opcao;
      m += '\n   Quantidade: ' + i.qtd;
      if (i.pers) m += '\n   Personalização: ' + i.pers;
      m += '\n   Preço: ' + (i.preco == null ? 'a combinar' : 'R$' + fmt(i.preco) + (i.qtd > 1 ? ' cada = R$' + fmt(i.preco * i.qtd) : ''));
    });
    var t = total();
    m += '\n\nTotal estimado: R$' + fmt(t.valor) + (t.semPreco ? ' + itens a combinar' : '');
    m += '\nItens: ' + count();
    if (cliente.cep) m += '\nCEP para o frete: ' + cliente.cep;
    m += '\n\nPode confirmar valores, frete e prazo?';
    return m;
  }
  function msgLink() { sendBtn.href = 'https://wa.me/' + WPP + '?text=' + encodeURIComponent(mensagem()); }

  /* ---------- lista ---------- */
  function render() {
    if (!itens.length) {
      body.innerHTML = '<div class="cart-empty">' + ICON_CART + '<h3>Carrinho vazio</h3><p>Adicione peças do catálogo e envie tudo de uma vez pelo WhatsApp.</p><p style="margin-top:18px"><a href="catalogo.html" style="color:var(--accent);font-weight:600">Ver o catálogo →</a></p></div>';
      ft.style.display = 'none';
      return;
    }
    ft.style.display = '';
    body.innerHTML = itens.map(function (i, k) {
      var link = 'produto.html?id=' + encodeURIComponent(i.codigo);
      return '<div class="cart-it" data-k="' + k + '">' +
        (i.img ? '<img src="' + esc(i.img) + '" alt="" loading="lazy">' : '<div class="ph"></div>') +
        '<div><a class="nm" href="' + link + '">' + esc(i.nome) + '</a>' +
          '<div class="mt">' + (i.opcao ? 'Opção: <b>' + esc(i.opcao) + '</b><br>' : '') + (i.pers ? 'Personalização: <b>' + esc(i.pers) + '</b>' : '') + '</div>' +
          '<div class="row"><div class="cart-q"><button type="button" data-a="-" aria-label="Diminuir">−</button><span>' + i.qtd + '</span><button type="button" data-a="+" aria-label="Aumentar">+</button></div>' +
          '<button type="button" class="cart-rm" data-a="x">Remover</button></div></div>' +
        '<div class="cart-pr">' + (i.preco == null ? '—' : 'R$' + fmt(i.preco * i.qtd)) + (i.qtd > 1 && i.preco != null ? '<small>R$' + fmt(i.preco) + ' cada</small>' : '') + '</div>' +
      '</div>';
    }).join('');
    var t = total();
    dw.querySelector('.cart-total').textContent = 'R$' + fmt(t.valor) + (t.semPreco ? '+' : '');
    msgLink();
  }
  body.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    var k = +b.closest('.cart-it').dataset.k, it = itens[k]; if (!it) return;
    var a = b.dataset.a;
    if (a === '+') it.qtd = Math.min(999, it.qtd + 1);
    if (a === '-') { if (it.qtd > 1) it.qtd--; else itens.splice(k, 1); }
    if (a === 'x') itens.splice(k, 1);
    salvar(); render();
  });

  /* ---------- contador ---------- */
  var badge = navBtn.querySelector('.cart-badge');
  function atualizar() {
    var n = count();
    badge.textContent = n > 99 ? '99+' : n;
    badge.classList.toggle('on', n > 0);
    navBtn.setAttribute('aria-label', n ? 'Abrir carrinho (' + n + ' ite' + (n > 1 ? 'ns' : 'm') + ')' : 'Abrir carrinho');
  }
  atualizar();
  // Mantém abas abertas sincronizadas
  window.addEventListener('storage', function (e) { if (e.key === KEY) { itens = ler(KEY, []); atualizar(); if (dw.classList.contains('open')) render(); } });

  /* ---------- aviso "adicionado" ---------- */
  var toast = document.createElement('div');
  toast.className = 'cart-toast'; toast.setAttribute('role', 'status');
  toast.innerHTML = '<span class="cart-toast-t"></span><button type="button">Ver carrinho</button>';
  document.body.appendChild(toast);
  toast.querySelector('button').addEventListener('click', function () { toast.classList.remove('on'); open(); });
  var tt;
  function avisar(txt) {
    toast.querySelector('.cart-toast-t').textContent = txt;
    toast.classList.add('on'); clearTimeout(tt);
    tt = setTimeout(function () { toast.classList.remove('on'); }, 3200);
  }

  /* ---------- API ---------- */
  function add(item) {
    var novo = {
      codigo: String(item.codigo), nome: String(item.nome || item.codigo),
      opcao: item.opcao || '', pers: (item.pers || '').trim(),
      preco: item.preco == null || isNaN(item.preco) ? null : Number(item.preco),
      qtd: Math.max(1, Math.min(999, parseInt(item.qtd, 10) || 1)),
      img: item.img || ''
    };
    var ex = null;
    for (var i = 0; i < itens.length; i++) if (chave(itens[i]) === chave(novo)) { ex = itens[i]; break; }
    if (ex) { ex.qtd = Math.min(999, ex.qtd + novo.qtd); ex.preco = novo.preco; ex.img = novo.img || ex.img; }
    else itens.push(novo);
    salvar();
    navBtn.classList.remove('bump'); void navBtn.offsetWidth; navBtn.classList.add('bump');
    avisar('Adicionado ao carrinho · ' + count() + ' ite' + (count() > 1 ? 'ns' : 'm'));
    track('carrinho_adicionar', { produto: novo.codigo, qtd: novo.qtd });
  }

  window.Carrinho = { add: add, open: open, close: close, count: count };
  if (location.hash === '#carrinho') open();
})();
