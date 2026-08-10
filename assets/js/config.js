/* vana shop — configuración central */
window.VPS = {
  // Número de WhatsApp de vana shop (cambiar aquí en un solo lugar).
  WA_NUMBER: "50254166752",

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

  // Mensaje prellenado para WhatsApp, con paguitos.
  waMessage: function (p) {
    var pg = window.VPS.paguitos(p.price);
    return [
      "Hola 👋 Vi este producto en *vana shop* y me interesa:",
      "",
      "🛍️ " + p.title,
      p.merchant + " · " + pg.n + " paguitos quincenales de " + window.VPS.money2(pg.per) + " (" + window.VPS.money(p.price) + ")",
      p.url,
      "",
      "¿Me ayudas a llevármelo con vana pay?",
    ].join("\n");
  },

  waLink: function (p) {
    return "https://wa.me/" + window.VPS.WA_NUMBER + "?text=" + encodeURIComponent(window.VPS.waMessage(p));
  },

  waSearchLink: function (q) {
    var msg = "Hola 👋 Estoy buscando *" + q + "* en vana shop. ¿Me ayudas a conseguirlo?";
    return "https://wa.me/" + window.VPS.WA_NUMBER + "?text=" + encodeURIComponent(msg);
  },

  // Bloque de precio en paguitos (reutilizable). variant: "card" | "hero" | "pdp"
  pagHTML: function (p, variant) {
    var pg = window.VPS.paguitos(p.price);
    var per = window.VPS.money2(pg.per);
    var total = window.VPS.money(p.price);
    var was = p.compare_at_price ? '<s>' + window.VPS.money(p.compare_at_price) + "</s> " : "";
    if (variant === "hero") {
      return '<div class="pag pag-hero"><span class="pag-n">' + pg.n + ' paguitos quincenales de</span>' +
        '<span class="pag-per">' + per + '</span>' +
        '<span class="pag-total">' + was + total + ' en total</span></div>';
    }
    if (variant === "pdp") {
      return '<div class="pag pag-pdp"><span class="pag-lead">Llévatelo con</span>' +
        '<div class="pag-line"><span class="pag-n">' + pg.n + ' paguitos quincenales de</span><span class="pag-per">' + per + "</span></div>" +
        '<span class="pag-total">' + was + "Precio total " + total + "</span></div>";
    }
    return '<div class="pag"><span class="pag-n">' + pg.n + ' paguitos quincenales de</span>' +
      '<span class="pag-per">' + per + '</span>' +
      '<span class="pag-total">' + was + total + ' en total</span></div>';
  },
};
