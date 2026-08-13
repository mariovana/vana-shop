/* vana shop — configuración central */
window.VPS = {
  // Número oficial de WhatsApp de vana shop: +502 3140 0058.
  // Formato wa.me: código de país + número, sin "+" ni espacios.
  // Cambiar aquí en un solo lugar: header, hero, cards, PDP y footer lo derivan.
  WA_NUMBER: "50231400058",

  // URL del catálogo con la misma versión que traen los assets. Sin esto, un
  // visitante con products.json en caché seguiría viendo el catálogo viejo
  // después de publicar.
  DATA_URL: (function () {
    var src = document.currentScript && document.currentScript.src;
    var m = src && src.match(/\?v=[\w.]+/);
    return "data/products.json" + (m ? m[0] : "");
  })(),

  // Q con separador de miles, sin decimales.
  money: function (v) {
    return "Q" + Math.round(Number(v)).toLocaleString("es-GT");
  },

  // Q con hasta 2 decimales (para el monto por paguito).
  money2: function (v) {
    var r = Math.round(Number(v) * 100) / 100;
    var opts = Number.isInteger(r) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return "Q" + r.toLocaleString("es-GT", opts);
  },

  // Lógica de paguitos: cuántos y de cuánto, según el precio.
  paguitos: function (price) {
    price = Number(price);
    var n = price < 300 ? 3 : 5; // vana pay: 3 o 5 paguitos quincenales
    return { n: n, per: price / n };
  },

  // Mensaje para WhatsApp. Incluye el link a la fuente porque el personal
  // shopper lo necesita para conseguir el producto.
  waMessage: function (p, qty) {
    qty = Math.max(1, Number(qty) || 1);
    var total = p.price * qty;
    var pg = window.VPS.paguitos(total);
    var lines = [
      "Hola 👋 Quiero comprar en *vana shop*:",
      "",
      "🛍️ " + p.title + (qty > 1 ? "  ×" + qty : ""),
      p.merchant + " · " + window.VPS.money(total) +
        " — o " + pg.n + " paguitos quincenales de " + window.VPS.money2(pg.per) + " con vana pay",
    ];
    if (p.url) lines.push(p.url);
    lines.push("", "¿Me ayudas a llevármelo?");
    return lines.join("\n");
  },

  waLink: function (p, qty) {
    return "https://wa.me/" + window.VPS.WA_NUMBER + "?text=" + encodeURIComponent(window.VPS.waMessage(p, qty));
  },

  // Mensaje libre (búsqueda sin resultados, CTA general, dudas).
  waAskMessage: function (q) {
    return q
      ? "Hola 👋 Estoy buscando *" + q + "* en vana shop. ¿Me ayudas a conseguirlo?"
      : "Hola 👋 Quiero comprar con vana shop. ¿Me ayudas?";
  },

  waAskLink: function (q) {
    return "https://wa.me/" + window.VPS.WA_NUMBER + "?text=" + encodeURIComponent(window.VPS.waAskMessage(q));
  },

  waRaw: function (msg) {
    return "https://wa.me/" + window.VPS.WA_NUMBER + "?text=" + encodeURIComponent(msg);
  },
};
