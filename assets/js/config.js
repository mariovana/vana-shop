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

  // Peor fee posible si el comercio no trae los suyos en products.json
  // (3: máximo entre comercios; 5: peor segmento de riesgo E1).
  FEES_MAX: { 3: 0.13, 5: 0.36 },

  // PAGUITO SEGURO. El paguito real es dinámico por usuario (segmento de
  // riesgo E1→A, tier, comercio) y el sitio no sabe quién es el visitante:
  // se muestra el PEOR caso —fee máximo, enganche 0— para que al autenticarse
  // la sorpresa sea positiva: su paguito baja o queda igual, nunca sube.
  // fees viene de merchant.fees en products.json (data/pricing.json, que se
  // regenera con scripts/export_pricing.py desde la base). Redondeo hacia
  // ARRIBA a quetzal entero: también es parte de la cota.
  paguitos: function (price, fees) {
    price = Number(price);
    var n = price < 300 ? 3 : 5; // vana pay: 3 o 5 paguitos quincenales
    var fee = fees && fees[n] != null ? Number(fees[n]) : window.VPS.FEES_MAX[n];
    return { n: n, per: Math.ceil(price * (1 + fee) / n) };
  },

  // Mensaje para WhatsApp. Incluye el link a la fuente porque el personal
  // shopper lo necesita para conseguir el producto. OJO: sin monto de
  // paguito — los agentes no cotizan paguitos (son dinámicos por usuario);
  // el cliente ve el suyo al entrar a su cuenta de vana pay.
  waMessage: function (p, qty) {
    qty = Math.max(1, Number(qty) || 1);
    var total = p.price * qty;
    var lines = [
      // Sin emojis: según el dispositivo llegan como caracteres rotos por
      // el encoding del link wa.me — texto plano llega bien siempre.
      "Hola, quiero comprar en *vana shop*:",
      "",
      p.title + (qty > 1 ? "  ×" + qty : ""),
      p.merchant + " · " + window.VPS.money(total) + " — en paguitos con vana pay",
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
      ? "Hola, estoy buscando *" + q + "* en vana shop. ¿Me ayudas a conseguirlo?"
      : "Hola, quiero comprar con vana shop. ¿Me ayudas?";
  },

  waAskLink: function (q) {
    return "https://wa.me/" + window.VPS.WA_NUMBER + "?text=" + encodeURIComponent(window.VPS.waAskMessage(q));
  },

  waRaw: function (msg) {
    return "https://wa.me/" + window.VPS.WA_NUMBER + "?text=" + encodeURIComponent(msg);
  },
};
