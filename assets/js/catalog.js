/* vana shop — catálogo (home)
 *
 * Estructura según el diseño de Figma (nodo 49:1553):
 *   hero → Explora por categoría → Top ofertas del mes → Explora todo → banda CTA
 *
 * Las fotos de producto vienen recortadas (fondo blanco a transparente) por
 * scripts/cutout_images.py y se sirven locales en WebP. Si alguna falta, el
 * <img> cae solo a la URL original del comercio.
 */
const state = { data: null, cat: "Todas", store: "Todas", q: "", page: 1 };

/* Productos por página. Es UX, no límite técnico: 87 productos de golpe son
 * lentos en mobile, que es el 95% del tráfico. */
const PER_PAGE = 24;

/* Pasteles del diseño. Se asignan por id (estable): el mismo producto siempre
 * cae en el mismo tono, así la grilla no cambia de color al paginar. */
const TINTS = ["var(--t1)", "var(--t2)", "var(--t3)", "var(--t4)", "var(--t5)"];

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ico = (id, cls) => '<svg class="ico' + (cls ? " " + cls : "") + '"><use href="#' + id + '"/></svg>';

fetch(VPS.DATA_URL).then((r) => r.json()).then((d) => {
  state.data = d;
  renderCategories();
  renderTop();
  renderChips();
  render();
  wireUp();
});

/* ---- Helpers de datos ---- */
function categories() {
  const c = {};
  state.data.products.forEach((p) => { c[p.category] = (c[p.category] || 0) + 1; });
  return Object.keys(c).sort((a, b) => c[b] - c[a]).map((name) => ({ name, n: c[name] }));
}
function conDescuento() {
  return state.data.products.filter((p) => p.discount_pct)
    .sort((a, b) => b.discount_pct - a.discount_pct);
}
/* Hash estable del id → índice de pastel. */
function tint(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}
/* Foto recortada local, con la del comercio como respaldo. La clase "raw"
 * mete la imagen en un recuadro blanco: sin recorte, el borde recto de la
 * foto se vería feo encima del pastel. */
function imgTag(p, cls) {
  const remota = (p.images || [])[0] || "";
  return '<img src="assets/img/products/' + encodeURIComponent(p.id) + '.webp"' +
    ' alt="' + esc(p.title) + '" loading="lazy"' +
    (cls ? ' class="' + cls + '"' : "") +
    ' onerror="this.onerror=null;this.classList.add(\'raw\');this.src=\'' + esc(remota) + '\'">';
}

/* ---- Card de producto ---- */
/* La card entera es el link a la página de producto. Desde ahí se va a
 * WhatsApp: es el flujo que ya estaba validado y deja ver ficha y precio
 * antes de escribir. */
function cardHTML(p) {
  const pg = VPS.paguitos(p.price);
  return '<a class="card" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
    '<div class="card-img" style="--tint:' + tint(p.id) + '">' +
      imgTag(p) +
      (p.discount_pct ? '<span class="card-badge">-' + p.discount_pct + "%</span>" : "") +
    "</div>" +
    '<div class="card-body">' +
      '<div class="card-name"><span>' + esc(p.title) + "</span></div>" +
      '<div class="card-price"><b>' + VPS.money(p.price) + "</b>" +
        (p.compare_at_price ? "<s>" + VPS.money(p.compare_at_price) + "</s>" : "") + "</div>" +
      '<div class="card-pag">' + pg.n + " paguitos de " + VPS.money2(pg.per) + "</div>" +
    "</div>" +
  "</a>";
}

/* ---- Explora por categoría ----
 * El diseño usa ilustraciones; acá va la foto de un producto real de cada
 * categoría, que además le dice al usuario qué va a encontrar adentro. */
function renderCategories() {
  const cats = categories().slice(0, 5);
  $("#cats").innerHTML = cats.map((c, i) => {
    const rep = state.data.products.find((p) => p.category === c.name && (p.images || []).length);
    return '<button class="cat" type="button" data-cat="' + esc(c.name) + '">' +
      '<span class="cat-ico" style="--tint:' + TINTS[i % TINTS.length] + '">' +
        (rep ? imgTag(rep) : "") + "</span>" +
      '<span class="cat-n">' + esc(c.name) + "</span>" +
    "</button>";
  }).join("") +
    // Lo que no está en el catálogo también se puede pedir: es la promesa del hero.
    '<a class="cat cat-ask" href="' + VPS.waAskLink("") + '" target="_blank" rel="noopener">' +
      '<span class="cat-ico">' + ico("i-chat") + "</span>" +
      '<span class="cat-n">Otras categorías</span>' +
    "</a>";

  $("#cats").querySelectorAll("[data-cat]").forEach((b) =>
    b.addEventListener("click", () => { setFilter("cat", b.dataset.cat); scrollToCatalog(); }));
}

/* ---- Top ofertas del mes ---- */
function renderTop() {
  const ofertas = conDescuento().slice(0, 5);
  if (!ofertas.length) {
    document.getElementById("secTop").hidden = true;
    return;
  }
  $("#topPill").textContent = "hasta -" + ofertas[0].discount_pct + "%";
  $("#topRow").innerHTML = ofertas.map(cardHTML).join("");
}

/* ---- Chips de filtro ---- */
function renderChips() {
  const cats = [{ name: "Todas" }].concat(categories());
  $("#catChips").innerHTML = cats.map((c) =>
    '<button class="chip' + (state.cat === c.name ? " on" : "") + '" type="button" data-fc="' + esc(c.name) + '">' +
      esc(c.name) + "</button>").join("");

  const stores = ["Todas"].concat(state.data.merchants.map((m) => m.name));
  $("#storeChips").innerHTML = stores.map((s) => {
    const m = state.data.merchants.find((x) => x.name === s);
    const logo = m && m.logo ? '<img src="' + m.logo + '" alt="">' : "";
    return '<button class="chip' + (state.store === s ? " on" : "") + '" type="button" data-fs="' + esc(s) + '">' +
      logo + esc(s) + "</button>";
  }).join("");

  $("#catChips").querySelectorAll("[data-fc]").forEach((b) =>
    b.addEventListener("click", () => setFilter("cat", b.dataset.fc)));
  $("#storeChips").querySelectorAll("[data-fs]").forEach((b) =>
    b.addEventListener("click", () => setFilter("store", b.dataset.fs)));
}

/* Marca en el botón cuántos filtros hay puestos: colapsado, si no, no se nota
 * que el catálogo está filtrado. */
function syncFilterCount() {
  const b = $("#fCount");
  if (!b) return;
  let n = 0;
  if (state.cat !== "Todas") n++;
  if (state.store !== "Todas") n++;
  if (state.q) n++;
  b.textContent = n || "";
  b.hidden = !n;
  const t = $("#filterToggle");
  if (t) t.classList.toggle("on", !!n);
}

function setFilter(kind, val) {
  state[kind] = val;
  state.page = 1; // filtrar siempre arranca desde la primera página
  renderChips();
  render();
}

/* ---- Grilla ---- */
function filtrados() {
  return state.data.products.filter((p) => {
    if (state.cat !== "Todas" && p.category !== state.cat) return false;
    if (state.store !== "Todas" && p.merchant !== state.store) return false;
    if (state.q) {
      const t = (p.title + " " + p.category + " " + p.merchant).toLowerCase();
      if (!t.includes(state.q)) return false;
    }
    return true;
  });
}

function render() {
  const base = filtrados();
  const paginas = Math.max(1, Math.ceil(base.length / PER_PAGE));
  if (state.page > paginas) state.page = paginas;
  const desde = (state.page - 1) * PER_PAGE;
  const pagina = base.slice(desde, desde + PER_PAGE);

  // Solo el total, como en el diseño. La página en curso ya la dice el pager.
  $("#count").textContent = base.length
    ? base.length + " producto" + (base.length === 1 ? "" : "s") : "";

  $("#grid").innerHTML = pagina.length
    ? pagina.map(cardHTML).join("")
    : '<div class="empty">' +
        '<div class="empty-ico">' + ico("i-search") + "</div>" +
        "<h3>No encontramos eso</h3>" +
        "<p>Pero te lo conseguimos igual. Escríbenos y lo buscamos por ti.</p>" +
        '<a class="wabtn" href="' + VPS.waAskLink(state.q) + '" target="_blank" rel="noopener">' +
          ico("i-wa") + "Pedirlo por WhatsApp</a>" +
      "</div>";

  renderPager(paginas);
  syncFilterCount();
}

function renderPager(paginas) {
  const nav = $("#pager");
  if (paginas <= 1) { nav.innerHTML = ""; return; }
  const btn = (n, txt, cls) =>
    '<button class="pg' + (cls || "") + '" type="button" data-pg="' + n + '">' + txt + "</button>";

  let html = '<button class="pg pg-nav" type="button" data-pg="' + (state.page - 1) + '"' +
    (state.page === 1 ? " disabled" : "") + ' aria-label="Anterior">' + ico("i-chev-l") + "</button>";

  const nums = [];
  for (let i = 1; i <= paginas; i++) {
    if (i === 1 || i === paginas || Math.abs(i - state.page) <= 1) nums.push(i);
  }
  let prev = 0;
  nums.forEach((n) => {
    if (prev && n - prev > 1) html += '<span class="pg-gap">…</span>';
    html += btn(n, n, n === state.page ? " on" : "");
    prev = n;
  });

  html += '<button class="pg pg-nav" type="button" data-pg="' + (state.page + 1) + '"' +
    (state.page === paginas ? " disabled" : "") + ' aria-label="Siguiente">' + ico("i-chev-r") + "</button>";
  nav.innerHTML = html;

  nav.querySelectorAll("[data-pg]").forEach((b) =>
    b.addEventListener("click", () => {
      const n = Number(b.dataset.pg);
      if (n < 1 || n > paginas || n === state.page) return;
      state.page = n;
      render();
      scrollToCatalog();
    }));
}

function scrollToCatalog() {
  const y = document.getElementById("catalogo").getBoundingClientRect().top + window.scrollY - 16;
  if (window.VanaShopEmbed && window.VanaShopEmbed.requestScroll) window.VanaShopEmbed.requestScroll(y);
  window.scrollTo({ top: y, behavior: "smooth" });
  /* Red de seguridad: hay navegadores y configuraciones de accesibilidad que
   * ignoran behavior:"smooth" y dejan el scroll sin hacer. Si medio segundo
   * después seguimos lejos del objetivo, se salta directo — vale más llegar
   * seco que no llegar. */
  setTimeout(() => {
    if (Math.abs(window.scrollY - y) > 24) window.scrollTo(0, y);
  }, 500);
}

/* ---- Eventos ---- */
function wireUp() {
  const inp = $("#search");
  const syncAsk = () => { $("#askBtn").href = VPS.waAskLink(state.q); };

  /* Filtra mientras se escribe, pero NO mueve la página: hacer scroll en cada
   * tecla desorienta, y en mobile el salto ocurre con el teclado abierto, así
   * que el usuario pierde de vista el campo donde está escribiendo. */
  inp.addEventListener("input", (e) => {
    state.q = e.target.value.trim().toLowerCase();
    state.page = 1;
    render();
    syncAsk();
  });

  /* El scroll a los resultados es explícito: Enter, o la tecla "buscar" del
   * teclado en mobile (por eso el enterkeyhint del input). blur() cierra el
   * teclado, si no tapa media pantalla justo cuando se van a ver los
   * resultados. */
  inp.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!state.q) return;
    inp.blur();
    scrollToCatalog();
  });
  syncAsk();

  // Filtros (mobile): el panel de chips vive colapsado
  const filtros = document.querySelector(".filters");
  const toggle = $("#filterToggle");
  toggle.addEventListener("click", () => {
    const abierto = filtros.classList.toggle("open");
    toggle.setAttribute("aria-expanded", abierto ? "true" : "false");
  });

  // Popup "cómo funciona"
  const modal = $("#howModal");
  const abrir = (e) => { if (e) e.preventDefault(); modal.hidden = false; document.body.style.overflow = "hidden"; };
  const cerrar = () => { modal.hidden = true; document.body.style.overflow = ""; };
  $("#howOpen").addEventListener("click", abrir);
  $("#howOpen2").addEventListener("click", abrir);
  $("#howClose").addEventListener("click", cerrar);
  modal.addEventListener("click", (e) => { if (e.target === modal) cerrar(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) cerrar(); });

  const wa = VPS.waAskLink("");
  ["#ctaChat", "#footWa", "#howWa", "#bandWa"].forEach((sel) => { $(sel).href = wa; });
}
