/* =========================================================
   Alves.3D — Faixa de campanha (datas comemorativas)
   Usado em index.html, catalogo.html e produto.html.

   PARA TROCAR A CAMPANHA: edite só o bloco CAMPANHA abaixo.
   A faixa aparece entre "inicio" e "fim" e some sozinha depois.
   Para desligar antes da hora: ativo: false
   ========================================================= */
(function () {
  'use strict';

  var CAMPANHA = {
    ativo: true,
    id: 'natal-2026',                          // mude o id a cada campanha (zera o "fechar" dos visitantes)
    inicio: '2026-11-01T00:00:00-03:00',
    fim: '2026-12-15T23:59:59-03:00',          // último dia para pedir
    emoji: '🎄',
    titulo: 'Natal',
    texto: 'peça até <b>15/12</b> para receber a tempo',
    categoria: 'Natal',                        // categoria do catálogo para onde o botão leva
    botao: 'Ver peças de Natal'
  };

  if (!CAMPANHA.ativo) return;
  var agora = Date.now();
  var ini = Date.parse(CAMPANHA.inicio), fim = Date.parse(CAMPANHA.fim);
  if (!(agora >= ini && agora <= fim)) return;

  var KEY = 'alves3d-aviso-fechado';
  try { if (sessionStorage.getItem(KEY) === CAMPANHA.id) return; } catch (e) {}

  function track(n, x) { try { gtag('event', n, x || {}); } catch (e) {} }

  function dias() {
    var d = Math.ceil((fim - Date.now()) / 86400000);
    if (d <= 0) return 'último dia!';
    if (d === 1) return 'falta 1 dia';
    return 'faltam ' + d + ' dias';
  }

  var css =
    '.aviso{position:relative;z-index:120;display:flex;align-items:center;justify-content:center;gap:10px 14px;flex-wrap:wrap;' +
      'min-height:var(--aviso-h);padding:7px 48px;background:linear-gradient(90deg,#0f5132,#1a7a4c 50%,#b3261e);color:#fff;' +
      'font:500 13.5px/1.3 "DM Sans",system-ui,sans-serif;text-align:center}' +
    '.aviso b{font-weight:700}' +
    '.aviso .av-t{font-family:"Bebas Neue",sans-serif;font-size:19px;letter-spacing:1.5px;font-weight:400;margin-right:2px}' +
    '.aviso .av-d{display:inline-block;padding:2px 9px;border-radius:100px;background:rgba(255,255,255,.18);font-size:12px;font-weight:600;white-space:nowrap}' +
    '.aviso a.av-go{color:#fff;font-weight:700;text-decoration:underline;text-underline-offset:3px;white-space:nowrap}' +
    '.aviso .av-x{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;border:0;border-radius:50%;' +
      'background:transparent;color:#fff;font-size:20px;line-height:1;cursor:pointer;opacity:.8}' +
    '.aviso .av-x:hover{opacity:1;background:rgba(255,255,255,.15)}' +
    /* home: o menu é fixo, então a faixa também fica fixa no topo */
    'body.aviso-fixo .aviso{position:fixed;inset:0 0 auto 0}' +
    'body.aviso-fixo{padding-top:var(--aviso-h)}' +
    'body.aviso-fixo .nav{top:var(--aviso-h)}' +
    'body.aviso-fixo [id]{scroll-margin-top:var(--aviso-h)}' +
    '@media (max-width:600px){.aviso{font-size:12.5px;padding:6px 42px 6px 12px;gap:4px 10px}.aviso .av-t{font-size:17px}}';

  function montar() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    var link = window.Loja && Loja.urlCategoria ? Loja.urlCategoria(CAMPANHA.categoria)
      : '/catalogo.html?cat=' + encodeURIComponent(CAMPANHA.categoria);

    var bar = document.createElement('div');
    bar.className = 'aviso'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Aviso de campanha');
    bar.innerHTML =
      '<span><span class="av-t">' + CAMPANHA.emoji + ' ' + CAMPANHA.titulo + ':</span> ' + CAMPANHA.texto + '</span>' +
      '<span class="av-d">' + dias() + '</span>' +
      '<a class="av-go" href="' + link + '">' + CAMPANHA.botao + ' →</a>' +
      '<button type="button" class="av-x" aria-label="Fechar aviso">×</button>';

    document.body.insertBefore(bar, document.body.firstChild);

    var nav = document.querySelector('.nav');
    if (nav && getComputedStyle(nav).position === 'fixed') document.body.classList.add('aviso-fixo');

    function medir() { document.documentElement.style.setProperty('--aviso-h', bar.offsetHeight + 'px'); }
    document.documentElement.style.setProperty('--aviso-h', '38px');
    medir(); window.addEventListener('resize', medir);

    bar.querySelector('.av-go').addEventListener('click', function () { track('campanha_click', { campanha: CAMPANHA.id }); });
    bar.querySelector('.av-x').addEventListener('click', function () {
      try { sessionStorage.setItem(KEY, CAMPANHA.id); } catch (e) {}
      bar.remove(); document.body.classList.remove('aviso-fixo');
      document.documentElement.style.removeProperty('--aviso-h');
      track('campanha_fechar', { campanha: CAMPANHA.id });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
