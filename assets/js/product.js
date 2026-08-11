/* vana shop — página de producto */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ico = (id) => '<svg class="ico"><use href="#' + id + '"/></svg>';

const id = new URLSearchParams(location.search).get("id");
let DATA = null, P = null, QTY = 1;

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
  const pg = VPS.paguitos(P.price);

  $("#pdp").innerHTML =
    '<div class="pdp-gal">' +
      '<div class="pdp-main">' +
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
        '<div class="pdp-cuota"><b id="cuota">' + VPS.money2(pg.per) + "</b><span>/paguito</span></div>" +
        '<div class="pdp-tot" id="tot">' +
          (P.compare_at_price ? "<s>" + VPS.money(P.compare_at_price) + "</s>" : "") +
          pg.n + " paguitos quincenales · " + VPS.money(P.price) + " en total</div>" +
      "</div>" +
      '<div class="paybox">' + ico("i-pay") +
        "<p>Pagas <b>" + pg.n + " paguitos de " + VPS.money2(pg.per) + "</b> con vana pay. Te confirmamos todo en el chat antes de cobrar.</p>" +
      "</div>" +
      '<div class="qty">' +
        '<span class="qty-l">Cantidad</span>' +
        '<div class="qty-box">' +
          '<button class="qty-b" id="dec" type="button" aria-label="Quitar uno">' + ico("i-rem") + "</button>" +
          '<span class="qty-v" id="qtyV">1</span>' +
          '<button class="qty-b" id="inc" type="button" aria-label="Agregar uno">' + ico("i-add") + "</button>" +
        "</div>" +
      "</div>" +
      '<a class="buy" id="buy" href="' + esc(VPS.waLink(P, 1)) + '" target="_blank" rel="noopener">' +
        ico("i-wa") + "Comprar en paguitos</a>" +
      '<a class="link-btn" id="askQ" href="' + esc(VPS.waRaw(askMsg())) + '" target="_blank" rel="noopener" style="text-align:center">¿Preguntas por este producto?</a>' +
      '<div class="fineprint">' + ico("i-lock") + "Confirmas y pagas dentro del chat de WhatsApp.</div>" +
      (P.description ? '<p style="margin:6px 0 0;font-size:14px;line-height:1.5;color:var(--n70)">' + esc(P.description) + "</p>" : "") +
      '<a href="' + esc(P.url) + '" target="_blank" rel="noopener" style="font-size:13px;color:var(--n60)">Ver en el sitio de ' + esc(P.merchant) + " →</a>" +
    "</div>";

  // galería
  document.querySelectorAll(".thumbs img").forEach((t) =>
    t.addEventListener("click", () => {
      $("#mainImg").src = imgs[t.dataset.i];
      document.querySelectorAll(".thumbs img").forEach((x) => x.classList.toggle("on", x === t));
      if (window.VanaShopEmbed) window.VanaShopEmbed.report();
    }));

  // cantidad
  const setQty = (n) => {
    QTY = Math.max(1, n);
    $("#qtyV").textContent = QTY;
    const tot = P.price * QTY;
    const g = VPS.paguitos(tot);
    $("#cuota").textContent = VPS.money2(g.per);
    $("#tot").innerHTML = (P.compare_at_price && QTY === 1 ? "<s>" + VPS.money(P.compare_at_price) + "</s>" : "") +
      g.n + " paguitos quincenales · " + VPS.money(tot) + " en total";
    $("#buy").href = VPS.waLink(P, QTY); // el mensaje lleva la cantidad elegida
  };
  $("#inc").addEventListener("click", () => setQty(QTY + 1));
  $("#dec").addEventListener("click", () => setQty(QTY - 1));
}

function renderRelated() {
  const rel = DATA.products.filter((x) => x.merchant_slug === P.merchant_slug && x.id !== P.id).slice(0, 4);
  if (!rel.length) return;
  $("#related").innerHTML =
    '<div class="related"><h2>Más de ' + esc(P.merchant) + "</h2>" +
      '<div class="grid">' + rel.map((p) => {
        const pg = VPS.paguitos(p.price);
        return '<a class="card" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
          '<div class="card-img"><img src="' + esc((p.images || [])[0] || "") + '" alt="' + esc(p.title) + '" loading="lazy"></div>' +
          '<div class="card-body">' +
            '<div class="card-name"><span>' + esc(p.title) + "</span></div>" +
            '<div class="cuota"><b>' + VPS.money2(pg.per) + "</b><span>/paguito</span></div>" +
          "</div></a>";
      }).join("") + "</div></div>";
}

function wireCommon() {
  $("#ctaChat").href = VPS.waAskLink("");
  $("#footWa").href = VPS.waAskLink("");
  $("#helpWa").href = VPS.waAskLink("");
}
