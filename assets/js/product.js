/* vana shop — página de producto */
const WA_ICON = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.4L3 29l6.8-1.8C11.6 28.4 13.8 29 16 29c7.2 0 13-5.8 13-13S23.2 3 16 3zm0 23.6c-2 0-3.9-.5-5.5-1.5l-.4-.2-4 1 1.1-3.9-.3-.4A10.5 10.5 0 0 1 5.5 16C5.5 10.2 10.2 5.5 16 5.5S26.5 10.2 26.5 16 21.8 26.6 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.6h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.5 5.5 4.9.8.3 1.4.5 1.8.7.8.2 1.5.2 2 .1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.4z"/></svg>';

const id = new URLSearchParams(location.search).get("id");

fetch("data/products.json")
  .then((r) => r.json())
  .then((d) => {
    const p = d.products.find((x) => x.id === id);
    const m = p ? d.merchants.find((x) => x.slug === p.merchant_slug) : null;
    if (!p) { document.getElementById("pdp").innerHTML = '<div class="empty">Producto no encontrado.</div>'; return; }
    render(p, m);
  });

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }

function render(p, m) {
  document.title = p.title + " · vana shop";
  document.getElementById("breadcrumb").innerHTML =
    '<a href="index.html">Inicio</a> · <a href="index.html">' + p.category + "</a> · " + esc(p.title);

  const thumbs = p.images.map((src, i) =>
    '<img src="' + src + '" data-i="' + i + '" class="' + (i === 0 ? "active" : "") + '" alt="">').join("");
  const disc = p.discount_pct ? '<span class="disc">-' + p.discount_pct + "%</span>" : "";
  const was = p.compare_at_price ? '<span class="was">' + VPS.money(p.compare_at_price) + "</span>" : "";
  const mlogo = m && m.logo ? '<img src="' + m.logo + '" alt="' + esc(p.merchant) + '">' : '<span class="txt-badge">' + esc(p.merchant) + "</span>";
  const desc = p.description ? '<p class="pdp-desc">' + esc(p.description) + "</p>" : "";

  document.getElementById("pdp").innerHTML =
    '<div class="gallery">' +
      '<div class="main"><img id="main-img" src="' + p.images[0] + '" alt="' + esc(p.title) + '"></div>' +
      (p.images.length > 1 ? '<div class="thumbs">' + thumbs + "</div>" : "") +
    "</div>" +
    '<div class="pdp-info">' +
      '<a class="m" href="' + p.url + '" target="_blank" rel="noopener">' + mlogo + "<span>Vendido por " + esc(p.merchant) + "</span></a>" +
      '<div class="cat">' + p.category + "</div>" +
      "<h1>" + esc(p.title) + "</h1>" +
      (p.discount_pct ? '<div class="pdp-disc">−' + p.discount_pct + "% de descuento hoy</div>" : "") +
      VPS.pagHTML(p, "pdp") +
      desc +
      '<button class="buy" id="buy">' + WA_ICON + "<span>Comprar en paguitos</span></button>" +
      '<p class="pdp-note">Te ponemos con un personal shopper de vana shop por WhatsApp. Confirma el producto y págalo en paguitos con vana pay, sin salir del chat.</p>' +
    "</div>";

  document.getElementById("buy").addEventListener("click", () => window.open(VPS.waLink(p), "_blank"));

  // Barra fija inferior (mobile): resumen de paguitos + comprar
  var pg = VPS.paguitos(p.price);
  var bar = document.createElement("div");
  bar.className = "pdp-bar";
  bar.innerHTML =
    '<div class="pdp-bar-price"><span>' + pg.n + " paguitos de</span><b>" + VPS.money2(pg.per) + "</b></div>" +
    '<button class="buy" id="buy-bar">' + WA_ICON + "<span>Comprar</span></button>";
  document.body.appendChild(bar);
  document.getElementById("buy-bar").addEventListener("click", () => window.open(VPS.waLink(p), "_blank"));
  document.querySelectorAll(".thumbs img").forEach((t) =>
    t.addEventListener("click", () => {
      document.getElementById("main-img").src = p.images[t.dataset.i];
      document.querySelectorAll(".thumbs img").forEach((x) => x.classList.toggle("active", x === t));
    }));
}
