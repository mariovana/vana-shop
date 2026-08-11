/* vana shop — catálogo (home) */
const state = { data: null, cat: "Todas", store: "Todas", q: "", page: 1 };

/* Productos por página. No es límite técnico (el shop es sitio propio, no va
 * embebido): es UX — 61 productos con imágenes de CDNs externos son lentos de
 * cargar de golpe en mobile, que es el 95% del tráfico. */
const PER_PAGE = 24;

/* Tintes del vana Design System (par: fondo, contenido). */
const TINTS = [
  ["#DAF3F9", "#1F7E9E"], ["#E7ECFE", "#4863D8"], ["#FCE7C2", "#B5751A"],
  ["#D7F0E0", "#2E8B57"], ["#FFE3CC", "#E0671C"], ["#E7E1FD", "#5B3FD0"],
];
const CAT_EMOJI = {
  "Microondas": "🍲", "Licuadoras": "🥤", "Freidoras": "🍟", "Cafeteras": "☕",
  "Batidoras": "🧁", "Planchas": "👔", "Refrigeración": "🧊", "Cocina": "🍳",
  "Otros": "🔌",
};

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ico = (id, cls) => '<svg class="ico' + (cls ? " " + cls : "") + '"><use href="#' + id + '"/></svg>';

fetch(VPS.DATA_URL).then((r) => r.json()).then((d) => {
  state.data = d;
  renderChatMock();
  renderCategories();
  renderMerchants();
  renderChips();
  render();
  wireUp();
  setHdrVar();
  window.addEventListener("resize", setHdrVar);
});

function merchant(slug) { return state.data.merchants.find((m) => m.slug === slug); }
function categories() {
  const c = {};
  state.data.products.forEach((p) => { c[p.category] = (c[p.category] || 0) + 1; });
  return Object.keys(c).sort((a, b) => c[b] - c[a]).map((name, i) => ({
    name, n: c[name], emoji: CAT_EMOJI[name] || "🛍️", tint: TINTS[i % TINTS.length],
  }));
}
function bestOffer() {
  const withDisc = state.data.products.filter((p) => p.discount_pct);
  return withDisc.sort((a, b) => b.discount_pct - a.discount_pct)[0] || state.data.products[0];
}
function img0(p) { return (p.images && p.images[0]) || ""; }
/* Corta en límite de palabra para que el mockup no quede a media palabra. */
function shorten(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.5 ? cut.slice(0, sp) : cut) + "…";
}
function setHdrVar() {
  const h = document.querySelector(".hdr");
  if (h) document.documentElement.style.setProperty("--hdr-h", h.offsetHeight + "px");
}

/* ---- Mockup de chat del hero ----
 * Usa data real, pero prefiere calzado para que la conversación de ejemplo
 * cuadre con el placeholder del buscador ("unos tenis para correr, talla 41").
 * La card destacada del catálogo sigue siendo la mejor oferta real. */
function mockProduct() {
  const star = state.data.products.filter(
    (p) => /Microondas|Licuadoras/.test(p.category) && p.discount_pct);
  return star.sort((a, b) => b.discount_pct - a.discount_pct)[0] || bestOffer();
}
function renderChatMock() {
  const p = mockProduct();
  const pg = VPS.paguitos(p.price);
  $("#chatMock").innerHTML =
    '<div class="chat-head">' +
      '<span class="chat-av"><img src="assets/img/logo-vana-inverse.svg" alt=""></span>' +
      '<div><div class="chat-name">vana shop</div><div class="chat-on">en línea</div></div>' +
    "</div>" +
    '<div class="b-out">Hola 👋 quiero ' + esc(shorten(p.title.toLowerCase(), 38)) + "</div>" +
    '<div class="b-in">¡Listo! Te lo conseguimos en <b>' + esc(p.merchant) + "</b> desde " +
      pg.n + " paguitos de " + VPS.money2(pg.per) + " 🙌</div>" +
    '<div class="b-plan">' +
      '<div class="b-plan-t">Tu plan de pago</div>' +
      '<div class="b-plan-r"><span>' + pg.n + " paguitos de</span><b>" + VPS.money2(pg.per) + "</b></div>" +
      '<div class="b-bar"><i style="width:' + Math.round(100 / pg.n) + '%"></i></div>' +
      '<div class="b-plan-n">Quincenales, sin salir del chat</div>' +
    "</div>" +
    '<div class="b-out">Sí, quiero 🙌</div>';
}

/* ---- Categorías ---- */
function renderCategories() {
  $("#cats").innerHTML = categories().map((c) =>
    '<button class="cat" type="button" data-cat="' + esc(c.name) + '">' +
      '<span class="cat-ico" style="background:' + c.tint[0] + '"><span class="ico" style="font-size:26px;line-height:1">' + c.emoji + "</span></span>" +
      '<span class="cat-n">' + esc(c.name) + "</span>" +
      '<span class="cat-c">' + c.n + " producto" + (c.n === 1 ? "" : "s") + "</span>" +
    "</button>").join("");
  // Cierre de la sección: lo que NO está en el catálogo también se puede pedir.
  $("#cats").insertAdjacentHTML("beforeend",
    '<a class="cat cat-ask" href="' + VPS.waAskLink("") + '" target="_blank" rel="noopener">' +
      '<span class="cat-ico" style="background:var(--green-25)">' +
        '<span class="ico" style="font-size:26px;line-height:1">💬</span></span>' +
      '<span class="cat-n">Otras categorías</span>' +
      '<span class="cat-c">Pídelo por el chat</span>' +
    "</a>");
  $("#cats").querySelectorAll("[data-cat]").forEach((b) =>
    b.addEventListener("click", () => { setFilter("cat", b.dataset.cat); scrollToCatalog(); }));
}

/* ---- Tiendas ---- */
function renderMerchants() {
  const counts = {};
  state.data.products.forEach((p) => { counts[p.merchant_slug] = (counts[p.merchant_slug] || 0) + 1; });
  $("#merchants").innerHTML = state.data.merchants.map((m) => {
    const mark = m.logo
      ? '<img src="' + m.logo + '" alt="' + esc(m.name) + '">'
      : '<span class="merch-mono">' + esc(m.name.slice(0, 3).toUpperCase()) + "</span>";
    return '<button class="merch" type="button" data-store="' + esc(m.name) + '">' +
      '<span class="merch-logo">' + mark + "</span>" +
      '<span class="merch-n">' + esc(m.name) + "</span>" +
      '<span class="merch-c">' + (counts[m.slug] || 0) + " productos</span>" +
    "</button>";
  }).join("");
  $("#merchants").querySelectorAll("[data-store]").forEach((b) =>
    b.addEventListener("click", () => { setFilter("store", b.dataset.store); scrollToCatalog(); }));
}

/* ---- Chips de filtro (sticky) ---- */
function renderChips() {
  const cats = ["Todas"].concat(categories().map((c) => c.name));
  $("#catChips").innerHTML = cats.map((c) =>
    '<button class="chip' + (state.cat === c ? " on" : "") + '" type="button" data-fc="' + esc(c) + '">' + esc(c) + "</button>").join("");

  const stores = ["Todas"].concat(state.data.merchants.map((m) => m.name));
  $("#storeChips").innerHTML = '<span class="chiprow-l">Tienda</span>' + stores.map((s) => {
    const m = state.data.merchants.find((x) => x.name === s);
    const logo = m && m.logo ? '<img src="' + m.logo + '" alt="">' : "";
    return '<button class="chip' + (state.store === s ? " on" : "") + '" type="button" data-fs="' + esc(s) + '">' + logo + esc(s) + "</button>";
  }).join("");

  $("#catChips").querySelectorAll("[data-fc]").forEach((b) =>
    b.addEventListener("click", () => setFilter("cat", b.dataset.fc)));
  $("#storeChips").querySelectorAll("[data-fs]").forEach((b) =>
    b.addEventListener("click", () => setFilter("store", b.dataset.fs)));
}

function setFilter(kind, val) {
  state[kind] = val;
  state.page = 1; // filtrar siempre arranca desde la primera página
  renderChips();
  render();
}

function scrollToCatalog() {
  const c = $("#catalogo"), h = document.querySelector(".hdr");
  const off = (h ? h.offsetHeight : 72) + 8;
  const top = c.getBoundingClientRect().top + window.scrollY - off;
  // Embebido, el iframe no tiene scroll propio: se le pide al padre. Se hacen
  // las dos cosas — si hay scroll interno funciona scrollTo, si no el mensaje.
  if (window.VanaShopEmbed) window.VanaShopEmbed.requestScroll(top);
  window.scrollTo({ top: top, behavior: "smooth" });
}

/* ---- Grid ---- */
function filtered() {
  const q = state.q;
  return state.data.products.filter((p) => {
    if (state.cat !== "Todas" && p.category !== state.cat) return false;
    if (state.store !== "Todas" && p.merchant !== state.store) return false;
    if (q && !(p.title + " " + p.merchant + " " + p.category).toLowerCase().includes(q)) return false;
    return true;
  });
}

function render() {
  const list = filtered();
  const noFilter = state.cat === "Todas" && state.store === "Todas" && !state.q;

  // El destacado se saca de la lista paginada para que no salga dos veces
  // (una como card grande y otra como card normal en alguna página).
  const feat = noFilter ? bestOffer() : null;
  const base = feat ? list.filter((p) => p.id !== feat.id) : list;

  const pages = Math.max(1, Math.ceil(base.length / PER_PAGE));
  if (state.page > pages) state.page = pages;
  if (state.page < 1) state.page = 1;
  const from = (state.page - 1) * PER_PAGE;
  const pageItems = base.slice(from, from + PER_PAGE);

  $("#count").textContent = list.length === 0 ? ""
    : list.length + (list.length === 1 ? " producto" : " productos") +
      (pages > 1 ? " · página " + state.page + " de " + pages : "");

  if (!list.length) {
    $("#grid").innerHTML =
      '<div class="empty">' +
        '<div class="empty-ico">' + ico("i-search") + "</div>" +
        "<h3>No encontramos eso todavía</h3>" +
        "<p>Escríbenos y te lo conseguimos igual.</p>" +
        '<a class="wabtn" href="' + VPS.waAskLink(state.q) + '" target="_blank" rel="noopener">' +
          ico("i-wa") + "Pedirlo por WhatsApp</a>" +
      "</div>";
  } else {
    const featHTML = feat && state.page === 1 ? featCard(feat) : "";
    $("#grid").innerHTML = featHTML + pageItems.map(card).join("");
  }

  renderPager(pages);
  if (window.VanaShopEmbed) window.VanaShopEmbed.report();
}

function featCard(p) {
  const pg = VPS.paguitos(p.price);
  return '<a class="feat" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
    '<div class="feat-top">' +
      (p.discount_pct ? '<span class="feat-pill">Destacado · -' + p.discount_pct + "%</span>" : '<span class="feat-pill">Destacado</span>') +
      '<div class="feat-store">' + esc(p.merchant) + "</div>" +
      '<div class="feat-name">' + esc(p.title) + "</div>" +
    "</div>" +
    '<div class="feat-img"><img src="' + esc(img0(p)) + '" alt="" loading="lazy"></div>' +
    '<div class="feat-bot">' +
      '<div class="feat-cuota"><b>' + VPS.money2(pg.per) + "</b><span>/paguito</span></div>" +
      '<div class="feat-tot">' + pg.n + " paguitos quincenales · " + VPS.money(p.price) + " en total</div>" +
    "</div></a>";
}

function card(p) {
  const pg = VPS.paguitos(p.price);
  const m = merchant(p.merchant_slug);
  const logo = m && m.logo ? '<img src="' + m.logo + '" alt="">' : "";
  const was = p.compare_at_price ? "<s>" + VPS.money(p.compare_at_price) + "</s>" : "";
  return '<a class="card" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
    '<div class="card-img">' +
      '<img src="' + esc(img0(p)) + '" alt="' + esc(p.title) + '" loading="lazy">' +
      (p.discount_pct ? '<span class="card-badge">-' + p.discount_pct + "%</span>" : "") +
    "</div>" +
    '<div class="card-body">' +
      '<div class="card-store">' + logo + esc(p.merchant) + "</div>" +
      '<div class="card-name">' + esc(p.title) + "</div>" +
      '<div class="cuota"><b>' + VPS.money2(pg.per) + "</b><span>/paguito</span></div>" +
      '<div class="card-tot">' + was + pg.n + " paguitos · " + VPS.money(p.price) + " total</div>" +
    "</div></a>";
}


/* ---- Paginación ---- */
function pageWindow(current, total) {
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
  let html = '<button class="pg pg-nav" type="button" data-page="' + (state.page - 1) + '"' +
    (state.page === 1 ? " disabled" : "") + ' aria-label="Página anterior">' + ico("i-chev-l") + "</button>";
  pageWindow(state.page, pages).forEach((p) => {
    html += p === "…" ? '<span class="pg-gap">…</span>'
      : '<button class="pg' + (p === state.page ? " on" : "") + '" type="button" data-page="' + p + '"' +
        (p === state.page ? ' aria-current="page"' : "") + ">" + p + "</button>";
  });
  html += '<button class="pg pg-nav" type="button" data-page="' + (state.page + 1) + '"' +
    (state.page === pages ? " disabled" : "") + ' aria-label="Página siguiente">' + ico("i-chev-r") + "</button>";
  el.innerHTML = html;
  el.querySelectorAll("button[data-page]").forEach((b) =>
    b.addEventListener("click", () => goToPage(parseInt(b.dataset.page, 10))));
}
function goToPage(n) {
  if (!n || n === state.page) return;
  state.page = n;
  render();
  scrollToCatalog();
}

/* ---- Eventos ---- */
function wireUp() {
  const inp = $("#search");
  const syncAsk = () => { $("#askBtn").href = VPS.waAskLink(state.q); };
  let searched = false;
  inp.addEventListener("input", (e) => {
    state.q = e.target.value.trim().toLowerCase();
    state.page = 1; // buscar siempre arranca desde la primera página
    render();
    syncAsk();
    if (state.q && !searched) { searched = true; scrollToCatalog(); }
    if (!state.q) searched = false;
  });
  syncAsk();

  ["Microondas", "Licuadora", "Freidora de aire", "Cafetera"].forEach((label) => {
    const b = document.createElement("button");
    b.className = "pop"; b.type = "button"; b.textContent = label;
    b.addEventListener("click", () => {
      inp.value = label;
      inp.dispatchEvent(new Event("input", { bubbles: true }));
    });
    $("#pops").appendChild(b);
  });

  $("#ctaChat").href = VPS.waAskLink("");

  $("#footWa").href = VPS.waAskLink("");
  $("#helpWa").href = VPS.waAskLink("");
  $("#seeAllStores").addEventListener("click", (e) => {
    e.preventDefault(); setFilter("store", "Todas"); scrollToCatalog();
  });
}
