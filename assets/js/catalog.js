/* vana shop — catálogo (home marketplace) */
const WA = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.4L3 29l6.8-1.8C11.6 28.4 13.8 29 16 29c7.2 0 13-5.8 13-13S23.2 3 16 3zm0 23.6c-2 0-3.9-.5-5.5-1.5l-.4-.2-4 1 1.1-3.9-.3-.4A10.5 10.5 0 0 1 5.5 16C5.5 10.2 10.2 5.5 16 5.5S26.5 10.2 26.5 16 21.8 26.6 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.6h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.5 5.5 4.9.8.3 1.4.5 1.8.7.8.2 1.5.2 2 .1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.4z"/></svg>';

const state = { data: null, merchant: "all", category: "all", q: "", page: 1 };

/* Productos por página.
 * No es un límite técnico: el shop es sitio propio, no va embebido. Es UX —
 * 61 productos con imágenes de CDNs externos son lentos de cargar de golpe en
 * mobile (95% del tráfico). Con 24 quedan 3 páginas parejas (24/24/13); con 20
 * quedaban 4 y la última traía un solo producto, que se veía roto. */
const PER_PAGE = 24;
let searching = false;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

fetch("data/products.json").then((r) => r.json()).then((d) => {
  state.data = d;
  renderHero();
  renderCategories();
  renderMerchants();
  initFilters();
  render();
  setHdrVar();
  window.addEventListener("resize", setHdrVar);
});

function merchant(slug) { return state.data.merchants.find((m) => m.slug === slug); }
function merchantMark(slug, cls) {
  const m = merchant(slug);
  if (m && m.logo) return '<img class="' + cls + '" src="' + m.logo + '" alt="' + esc(m.name) + '">';
  return '<span class="txt-badge ' + cls + '">' + esc(m ? m.name : slug) + "</span>";
}

/* ---- Hero destacado: mejor oferta ---- */
function renderHero() {
  const withDisc = state.data.products.filter((p) => p.discount_pct);
  const feat = (withDisc.sort((a, b) => b.discount_pct - a.discount_pct)[0]) || state.data.products[0];
  const tag = feat.discount_pct ? '<span class="ftag">-' + feat.discount_pct + "% hoy</span>" : '<span class="ftag" style="background:var(--teal-600)">Destacado</span>';
  $("#hero-feat").innerHTML =
    '<div class="fimg"><img src="' + feat.images[0] + '" alt=""></div>' +
    '<div class="fmeta">' + tag +
      '<div class="fname">' + esc(feat.title) + "</div>" +
      VPS.pagHTML(feat, "hero") +
    "</div>";
  $("#hero-feat").onclick = () => (location.href = "product.html?id=" + encodeURIComponent(feat.id));
}

/* ---- Tiles por categoría (íconos + color) ---- */
const CAT_STYLE = {
  "Calzado":     { ic: "👟", g: "linear-gradient(135deg,#0FB3CE,#0a86a3)" },
  "Ropa":        { ic: "👕", g: "linear-gradient(135deg,#7C5CFC,#5a3fd0)" },
  "Accesorios":  { ic: "🎒", g: "linear-gradient(135deg,#FF9F1C,#ef6d34)" },
  "Hogar":       { ic: "🏠", g: "linear-gradient(135deg,#2BB673,#1c9c60)" },
  "Tecnología":  { ic: "🎧", g: "linear-gradient(135deg,#334a7a,#1d2b4d)" },
  "Belleza":     { ic: "💄", g: "linear-gradient(135deg,#FF6FA5,#e84c8a)" },
  "Juguetes":    { ic: "🧸", g: "linear-gradient(135deg,#FFC24D,#f0a208)" },
};
function renderCategories() {
  const cats = {};
  state.data.products.forEach((p) => { (cats[p.category] = cats[p.category] || []).push(p); });
  $("#cats").innerHTML = Object.keys(cats).sort((a, b) => cats[b].length - cats[a].length).map((c) => {
    const st = CAT_STYLE[c] || { ic: "🛍️", g: "linear-gradient(135deg,#0FB3CE,#0a86a3)" };
    return '<button class="cat-tile" style="background:' + st.g + '" data-cat="' + esc(c) + '">' +
      '<span class="ct-ico">' + st.ic + "</span>" +
      '<div class="ct-txt"><div class="ct-name">' + c + '</div><div class="ct-count">' + cats[c].length + (cats[c].length === 1 ? " producto" : " productos") + "</div></div>" +
    "</button>";
  }).join("");
  $("#cats").addEventListener("click", (e) => {
    const t = e.target.closest(".cat-tile"); if (!t) return;
    setFilter("category", t.dataset.cat); scrollToCatalog();
  });
}

/* ---- Tiendas ---- */
function renderMerchants() {
  const counts = {};
  state.data.products.forEach((p) => (counts[p.merchant_slug] = (counts[p.merchant_slug] || 0) + 1));
  $("#merchants").innerHTML = state.data.merchants.map((m) =>
    '<button class="m-card" data-m="' + m.slug + '">' +
      '<div class="m-logo-box">' + merchantMark(m.slug, "") + "</div>" +
      '<div class="m-name">' + esc(m.name) + "</div>" +
      '<div class="m-count">' + (counts[m.slug] || 0) + ((counts[m.slug] || 0) === 1 ? " producto" : " productos") + "</div>" +
    "</button>").join("");
  $("#merchants").addEventListener("click", (e) => {
    const t = e.target.closest(".m-card"); if (!t) return;
    setFilter("merchant", t.dataset.m); scrollToCatalog();
  });
}

/* ---- Filtros ---- */
function initFilters() {
  const mrow = $("#merchant-chips");
  mrow.innerHTML = chip("all", "Todas", null, true, "m");
  state.data.merchants.forEach((m) => (mrow.innerHTML += chip(m.slug, m.name, m.logo, false, "m")));
  const cats = [...new Set(state.data.products.map((p) => p.category))].sort();
  const crow = $("#category-chips");
  crow.innerHTML = chip("all", "Todas", null, true, "c");
  cats.forEach((c) => (crow.innerHTML += chip(c, c, null, false, "c")));

  $("#filters").addEventListener("click", (e) => {
    const ch = e.target.closest(".chip"); if (!ch) return;
    setFilter(ch.dataset.grp === "m" ? "merchant" : "category", ch.dataset.val);
  });
  $("#search").addEventListener("input", (e) => {
    state.q = e.target.value.trim().toLowerCase();
    state.page = 1; // buscar siempre arranca desde la primera página
    render();
    if (state.q && !searching) { searching = true; scrollToCatalog(); }
    if (!state.q) searching = false;
  });

  // Bottom sheet de filtros (mobile)
  const panel = $("#filters"), scrim = $("#scrim");
  function openS() { panel.classList.add("open"); if (scrim) scrim.classList.add("open"); document.body.style.overflow = "hidden"; }
  function closeS() { panel.classList.remove("open"); if (scrim) scrim.classList.remove("open"); document.body.style.overflow = ""; }
  const fo = $("#filterOpen"); if (fo) fo.addEventListener("click", openS);
  ["#filterClose", "#filterApply"].forEach((s) => { const el = $(s); if (el) el.addEventListener("click", closeS); });
  if (scrim) scrim.addEventListener("click", closeS);
  const sa = $("#seeAllStores"); if (sa) sa.addEventListener("click", (e) => { e.preventDefault(); setFilter("merchant", "all"); scrollToCatalog(); });
}
function chip(val, label, logo, active, grp) {
  return '<button class="chip' + (active ? " active" : "") + '" data-grp="' + grp + '" data-val="' + esc(val) + '">' +
    (logo ? '<img src="' + logo + '" alt="">' : "") + esc(label) + "</button>";
}
function setFilter(kind, val) {
  state[kind] = val;
  state.page = 1; // filtrar siempre arranca desde la primera página
  const grp = kind === "merchant" ? "m" : "c";
  document.querySelectorAll('.chip[data-grp="' + grp + '"]').forEach((c) => c.classList.toggle("active", c.dataset.val === val));
  render();
}
function scrollToCatalog() {
  const c = $("#catalog"), h = document.querySelector(".hdr");
  const off = (h ? h.offsetHeight : 90) + 6;
  const top = c.getBoundingClientRect().top + window.scrollY - off;
  // Embebido en Framer el iframe no tiene scroll propio (el padre lo estiró al
  // alto completo), así que se le pide a él. Se hacen las dos cosas: si el
  // iframe sí tiene scroll interno, funciona scrollTo; si no, funciona el mensaje.
  if (window.VanaShopEmbed) window.VanaShopEmbed.requestScroll(top);
  window.scrollTo({ top: top, behavior: "smooth" });
}
function setHdrVar() {
  const h = document.querySelector(".hdr");
  if (h) document.documentElement.style.setProperty("--hdr-h", h.offsetHeight + "px");
}

/* ---- Grid ---- */
function filtered() {
  return state.data.products.filter((p) => {
    if (state.merchant !== "all" && p.merchant_slug !== state.merchant) return false;
    if (state.category !== "all" && p.category !== state.category) return false;
    if (state.q && !(p.title.toLowerCase().includes(state.q) || p.merchant.toLowerCase().includes(state.q) || p.category.toLowerCase().includes(state.q))) return false;
    return true;
  });
}
function render() {
  const list = filtered();
  $("#count").innerHTML = "<b>" + list.length + "</b> producto" + (list.length === 1 ? "" : "s");
  var ac = $("#applyCount"); if (ac) ac.textContent = list.length;
  var fs = $("#filterSummary");
  if (fs) {
    var pr = [];
    if (state.merchant !== "all") { var mm = merchant(state.merchant); pr.push(mm ? mm.name : state.merchant); }
    if (state.category !== "all") pr.push(state.category);
    fs.textContent = pr.length ? pr.join(" · ") : "Todo";
  }
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  if (state.page > pages) state.page = pages;
  if (state.page < 1) state.page = 1;
  const from = (state.page - 1) * PER_PAGE;
  const pageItems = list.slice(from, from + PER_PAGE);

  if (list.length) {
    $("#grid").innerHTML = pageItems.map(card).join("");
    // "21–40 de 61" para que se entienda qué se está viendo
    $("#count").innerHTML = pages > 1
      ? "<b>" + (from + 1) + "–" + (from + pageItems.length) + "</b> de " + list.length + " productos"
      : "<b>" + list.length + "</b> producto" + (list.length === 1 ? "" : "s");
  } else if (state.q) {
    $("#grid").innerHTML =
      '<div class="empty search-empty">' +
        '<div class="se-emoji">🔎</div>' +
        "<h3>No lo tenemos en la lista… todavía.</h3>" +
        "<p>Pero seguro te lo podemos conseguir. Escríbenos por WhatsApp y lo buscamos por ti.</p>" +
        '<a class="buy se-btn" href="' + VPS.waSearchLink(state.q) + '" target="_blank" rel="noopener">' + WA +
          '<span>Búscame “' + esc(state.q) + '”</span></a>' +
      "</div>";
  } else {
    $("#grid").innerHTML = '<div class="empty">No encontramos productos con esos filtros. Prueba con otra categoría.</div>';
  }

  renderPager(pages);

  // el grid cambió de alto: avisarle al embed de Framer
  if (window.VanaShopEmbed) window.VanaShopEmbed.report();
}

/* ---- Paginación ---- */
function pageWindow(current, total) {
  // Con pocas páginas se muestran todas; con muchas, una ventana con elipsis.
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  let lo = Math.max(2, current - 1), hi = Math.min(total - 1, current + 1);
  if (current <= 3) { lo = 2; hi = 4; }
  if (current >= total - 2) { lo = total - 3; hi = total - 1; }
  if (lo > 2) out.push("…");
  for (let i = lo; i <= hi; i++) out.push(i);
  if (hi < total - 1) out.push("…");
  out.push(total);
  return out;
}
function renderPager(pages) {
  const el = $("#pager");
  if (!el) return;
  if (pages <= 1) { el.innerHTML = ""; el.hidden = true; return; }
  el.hidden = false;

  const btn = (label, page, opts) => {
    opts = opts || {};
    if (opts.gap) return '<span class="pg-gap">…</span>';
    return '<button type="button" class="pg' + (opts.active ? " active" : "") + (opts.nav ? " pg-nav" : "") + '"' +
      (opts.disabled ? " disabled" : "") +
      ' data-page="' + page + '"' +
      (opts.active ? ' aria-current="page"' : "") +
      (opts.label ? ' aria-label="' + opts.label + '"' : "") +
      ">" + label + "</button>";
  };

  let html = btn("‹", state.page - 1, { nav: true, disabled: state.page === 1, label: "Página anterior" });
  pageWindow(state.page, pages).forEach((p) => {
    html += p === "…" ? btn("", 0, { gap: true }) : btn(p, p, { active: p === state.page });
  });
  html += btn("›", state.page + 1, { nav: true, disabled: state.page === pages, label: "Página siguiente" });
  el.innerHTML = html;

  el.querySelectorAll("button[data-page]").forEach((b) =>
    b.addEventListener("click", () => goToPage(parseInt(b.dataset.page, 10)))
  );
}
function goToPage(n) {
  if (!n || n === state.page) return;
  state.page = n;
  render();
  scrollToCatalog();
}
function card(p) {
  const disc = p.discount_pct ? '<span class="disc-badge">-' + p.discount_pct + "%</span>" : "";
  const m = merchant(p.merchant_slug);
  const mrow = '<div class="card-merch">' +
    (m && m.logo ? '<img class="cm-logo" src="' + m.logo + '" alt="">' : "") +
    '<span class="cm-name">' + esc(p.merchant) + "</span></div>";
  return (
    '<article class="card" data-id="' + p.id + '">' +
      '<div class="card-img">' + disc +
        '<img class="p" src="' + p.images[0] + '" alt="' + esc(p.title) + '" loading="lazy"></div>' +
      '<div class="card-body">' + mrow +
        '<div class="cat">' + p.category + "</div>" +
        '<div class="title">' + esc(p.title) + "</div>" +
        VPS.pagHTML(p, "card") +
        '<button class="buy" data-buy="' + p.id + '">' + WA + '<span class="buy-full">Comprar en paguitos</span><span class="buy-short">Comprar</span></button>' +
      "</div>" +
    "</article>"
  );
}
$("#grid").addEventListener("click", (e) => {
  const buy = e.target.closest("[data-buy]");
  if (buy) { e.preventDefault(); window.open(VPS.waLink(state.data.products.find((x) => x.id === buy.dataset.buy)), "_blank"); return; }
  const c = e.target.closest(".card");
  if (c) location.href = "product.html?id=" + encodeURIComponent(c.dataset.id);
});
