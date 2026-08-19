/* vana shop — página de producto */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ico = (id) => '<svg class="ico"><use href="#' + id + '"/></svg>';

/* Mismos pasteles que la home; las fotos son las originales del comercio. */
const TINTS = ["var(--t1)", "var(--t2)", "var(--t3)", "var(--t4)", "var(--t5)"];
function tint(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

const id = new URLSearchParams(location.search).get("id");
let DATA = null, P = null;

fetch(VPS.DATA_URL).then((r) => r.json()).then((d) => {
  DATA = d;
  P = d.products.find((x) => x.id === id);
  if (!P) {
    $("#pdp").innerHTML =
      '<div class="empty" style="grid-column:auto">' +
        "<h3>Producto no encontrado</h3>" +
        "<p>Puede que ya no esté disponible. Escríbenos y te lo conseguimos.</p>" +
        '<a class="wabtn" href="' + VPS.waAskLink("") + '" target="_blank" rel="noopener">' + ico("i-wa") + "Escribir por WhatsApp</a>" +
      "</div>";
    wireCommon();
    return;
  }
  render();
  renderRelated();
  wireCommon();
  if (window.VanaShopEmbed) window.VanaShopEmbed.report();
});

function askMsg() {
  return "Hola 👋 Tengo una duda sobre *" + P.title + "* de " + P.merchant + ".\n" + (P.url || "");
}
function merchant(slug) { return DATA.merchants.find((m) => m.slug === slug); }

function render() {
  document.title = P.title + " · vana shop";
  const m = merchant(P.merchant_slug);
  const logo = m && m.logo ? '<img src="' + m.logo + '" alt="">' : "";
  const imgs = P.images || [];
  // Paguito SEGURO: peor caso (fee máximo del comercio/segmento, enganche 0);
  // el paguito real del usuario autenticado solo puede ser igual o menor.
  const pg = VPS.paguitos(P.price, m && m.fees);

  $("#pdp").innerHTML =
    '<div class="pdp-gal">' +
      '<div class="pdp-main" style="--tint:' + tint(P.id) + '">' +
        '<img id="mainImg" src="' + esc(imgs[0] || "") + '" alt="' + esc(P.title) + '">' +
        (P.discount_pct ? '<span class="pdp-badge">-' + P.discount_pct + "% hoy</span>" : "") +
      "</div>" +
      (imgs.length > 1
        ? '<div class="thumbs">' + imgs.map((src, i) =>
            '<img src="' + esc(src) + '" data-i="' + i + '" class="' + (i === 0 ? "on" : "") + '" alt="">').join("") + "</div>"
        : "") +
    "</div>" +
    '<div class="pdp-info">' +
      '<div class="pdp-eyebrow">' + logo + esc(P.merchant) + " · " + esc(P.category) + "</div>" +
      "<h1>" + esc(P.title) + "</h1>" +
      (P.discount_pct ? '<div class="pdp-disc">−' + P.discount_pct + "% de descuento hoy</div>" : "") +
      '<div>' +
        '<div class="pdp-cuota"><b id="cuota">' + VPS.money2(pg.per) + "</b><span>/paguito o menos</span></div>" +
        '<div class="pdp-tot" id="tot">' +
          (P.compare_at_price ? "<s>" + VPS.money(P.compare_at_price) + "</s>" : "") +
          pg.n + " paguitos quincenales · precio " + VPS.money(P.price) + "</div>" +
      "</div>" +
      '<div class="paybox">' + ico("i-pay") +
        "<p>Pagas hasta <b>" + pg.n + " paguitos de " + VPS.money2(pg.per) + "</b> con vana pay. " +
        "Es el máximo: al entrar a tu cuenta, tu paguito puede bajar según tu perfil — nunca subir. Te confirmamos todo en el chat antes de cobrar.</p>" +
      "</div>" +
      '<a class="buy" id="buy" href="' + esc(VPS.waLink(P, 1)) + '" target="_blank" rel="noopener">' +
        ico("i-wa") + "Comprar en paguitos</a>" +
      '<a class="link-btn" id="askQ" href="' + esc(VPS.waRaw(askMsg())) + '" target="_blank" rel="noopener" style="text-align:center">¿Preguntas por este producto?</a>' +
      '<div class="fineprint">' + ico("i-lock") + "Confirmas y pagas dentro del chat de WhatsApp.</div>" +
      // white-space:pre-line: la descripción viene con párrafos y viñetas
      // del comercio y aplanarla la volvería un ladrillo ilegible.
      (P.description ? '<p style="margin:6px 0 0;font-size:14px;line-height:1.55;color:var(--n70);white-space:pre-line">' + esc(P.description) + "</p>" : "") +
    "</div>";

  // galería
  document.querySelectorAll(".thumbs img").forEach((t) =>
    t.addEventListener("click", () => {
      $("#mainImg").src = imgs[t.dataset.i];
      document.querySelectorAll(".thumbs img").forEach((x) => x.classList.toggle("on", x === t));
      if (window.VanaShopEmbed) window.VanaShopEmbed.report();
    }));

}

function renderRelated() {
  // El título dice "Más de {comercio}": solo productos de ese comercio,
  // con la misma categoría primero.
  const otros = DATA.products.filter((x) => x.merchant_slug === P.merchant_slug && x.id !== P.id);
  const rel = otros.filter((x) => x.category === P.category)
    .concat(otros.filter((x) => x.category !== P.category)).slice(0, 4);
  if (!rel.length) return;
  $("#related").innerHTML =
    '<div class="related"><h2>Más de ' + esc(P.merchant) + "</h2>" +
      '<div class="grid">' + rel.map((p) => {
        const pg = VPS.paguitos(p.price, (merchant(p.merchant_slug) || {}).fees);
        return '<a class="card" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
          '<div class="card-img" style="--tint:' + tint(p.id) + '">' +
            '<img src="' + esc((p.images || [])[0] || "") + '" alt="' + esc(p.title) + '" loading="lazy">' +
            (p.discount_pct ? '<span class="card-badge">-' + p.discount_pct + '%</span>' : '') +
          '</div>' +
          '<div class="card-body">' +
            '<div class="card-name"><span>' + esc(p.title) + '</span></div>' +
            '<div class="card-price"><b>' + VPS.money2(pg.per) + '</b><span class="per">/paguito o menos</span></div>' +
            '<div class="card-pag">' + pg.n + ' paguitos quincenales · precio ' +
              (p.compare_at_price ? '<s>' + VPS.money(p.compare_at_price) + '</s> ' : '') +
              VPS.money(p.price) + '</div>' +
          '</div>' +
        '</a>';
      }).join("") + "</div></div>";
}

function wireCommon() {
  $("#ctaChat").href = VPS.waAskLink("");
  $("#footWa").href = VPS.waAskLink("");
}
