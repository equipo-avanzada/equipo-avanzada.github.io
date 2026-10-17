/**
 * Lee un texto copiado (por ejemplo, mensajes del grupo de WhatsApp) y encuentra
 * los datos de los vehículos: nombre, teléfono, empresa o área y patente.
 *
 * Acepta mensajes como:
 *   José Vergara            Cristian Olguín          Damián oses
 *   995321217               Técnico Vendomatica      Avx
 *   Reunión con Marisela    VKTK16                   +56945705505
 *   HP VL 22                961934651                SV1097
 *
 * y también varios mensajes copiados juntos ("[10:33, 16/10/2026] Andrés: David Larenas …").
 * Devuelve una lista: [{ nombre, telefono, empresa, patente }, …]
 */
(function (global) {
  // Patentes chilenas: BBBB12 (nueva), AB1234 (antigua), motos BBB12 / BBB123.
  var RE_PATENTE = /^(?:[A-Z]{4}\d{2}|[A-Z]{2}\d{4}|[A-Z]{3}\d{2,3})$/;
  // Dentro de una frase solo se acepta en MAYÚSCULAS (así "a las 10" no se confunde con una patente).
  var RE_PATENTE_EN_TEXTO = /(^|[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9])([A-Z]{2}[\s.\-]?[A-Z]{2}[\s.\-]?\d{2}|[A-Z]{2}[\s.\-]?\d{2}[\s.\-]?\d{2}|[A-Z]{3}[\s.\-]?\d{2,3})(?=$|[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9])/;
  var RE_TELEFONO_EN_TEXTO = /(\+?\s?56[\s.\-]?)?9[\s.\-]?\d{4}[\s.\-]?\d{4}/;
  // Encabezado que agrega WhatsApp al copiar varios mensajes: "[10:33, 16/10/2026] Nombre: "
  var RE_WSP = /^\s*\[[^\]]{4,40}\]\s*[^:]{1,60}:\s?/;
  var ETIQUETAS = [
    { campo: "nombre",   re: /^\s*(nombre(\s+completo)?|conductor|chofer)\s*[:\-]\s*/i },
    { campo: "telefono", re: /^\s*(tel[eé]fono|tel|fono|cel(ular)?|n[uú]mero|whatsapp|wsp)\s*[:\-]\s*/i },
    { campo: "empresa",  re: /^\s*(empresa|[aá]rea|motivo|productora|cargo)\s*[:\-]\s*/i },
    { campo: "patente",  re: /^\s*(patente|ppu|placa|matr[ií]cula)\s*[:\-]\s*/i }
  ];
  var MINUSCULAS = { de: 1, del: 1, la: 1, las: 1, los: 1, y: 1, e: 1 };

  function normPatente(v) { return String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function esPatente(v) {
    var n = normPatente(v);
    return RE_PATENTE.test(n) && !/[^A-Za-z0-9\s.\-]/.test(String(v).trim());
  }
  function soloTelefono(v) {
    var s = String(v || "").trim();
    if (!/^[+\d\s().\-]+$/.test(s)) return "";
    var d = s.replace(/\D/g, "");
    if (d.length === 11 && d.indexOf("56") === 0) d = d.slice(2);
    if (d.length === 12 && d.indexOf("569") === 0) d = d.slice(3); // por si viene con un 9 extra
    return d.length >= 8 && d.length <= 9 ? d : "";
  }
  function nombrePropio(v) {
    return String(v).trim().replace(/\s+/g, " ").split(" ").map(function (p, i) {
      var b = p.toLowerCase();
      if (i > 0 && MINUSCULAS[b]) return b;
      return b.charAt(0).toUpperCase() + b.slice(1);
    }).join(" ");
  }
  function limpiarLinea(v) {
    return String(v || "").replace(/[‎‏‪-‮]/g, "").replace(/^[\s*_~•\-–—>]+|[\s*_~]+$/g, "").trim();
  }
  // Texto "basura" que no es nombre ni empresa (horas, "mensaje eliminado", etc.)
  function ignorar(v) {
    return !v || /^\d{1,2}:\d{2}(\s?[ap]\.?\s?m\.?)?$/i.test(v) || /mensaje (eliminado|borrado)|<multimedia omitido>|imagen omitida/i.test(v);
  }

  // Separa el texto en mensajes: por encabezados de WhatsApp o por líneas en blanco.
  function separarBloques(texto) {
    var lineas = String(texto || "").replace(/\r/g, "").split("\n");
    var bloques = [], actual = [];
    lineas.forEach(function (l) {
      if (RE_WSP.test(l)) { if (actual.length) bloques.push(actual); actual = [l.replace(RE_WSP, "")]; return; }
      if (!l.trim()) { if (actual.length) bloques.push(actual); actual = []; return; }
      actual.push(l);
    });
    if (actual.length) bloques.push(actual);
    return bloques;
  }

  function leerBloque(lineas) {
    var r = { nombre: "", telefono: "", empresa: "", patente: "" }, textos = [];
    lineas.map(limpiarLinea).forEach(function (l) {
      if (ignorar(l)) return;
      for (var i = 0; i < ETIQUETAS.length; i++) {
        if (ETIQUETAS[i].re.test(l)) {
          var v = l.replace(ETIQUETAS[i].re, "").trim(), c = ETIQUETAS[i].campo;
          if (c === "telefono") v = soloTelefono(v) || v.replace(/\D/g, "");
          if (c === "patente") v = normPatente(v);
          if (v && !r[c]) r[c] = v;
          return;
        }
      }
      if (!r.patente && esPatente(l)) { r.patente = normPatente(l); return; }
      var t = soloTelefono(l);
      if (t && !r.telefono) { r.telefono = t; return; }
      textos.push(l);
    });

    // Si la patente o el teléfono venían dentro de una línea con más texto ("Juan Pérez 912345678 ABCD12").
    textos = textos.map(function (l) {
      if (!r.telefono) {
        var mt = l.match(RE_TELEFONO_EN_TEXTO);
        if (mt) { r.telefono = soloTelefono(mt[0]); l = l.replace(mt[0], " | "); }
      }
      if (!r.patente) {
        var mp = l.match(RE_PATENTE_EN_TEXTO);
        if (mp && RE_PATENTE.test(normPatente(mp[2])) && /\d/.test(mp[2]) && /[A-Za-z]/.test(mp[2])) {
          r.patente = normPatente(mp[2]); l = l.replace(mp[2], " | ");
        }
      }
      return l;
    });
    // Los cortes ("|") separan los pedazos: "Pedro Soto | | Bsound" → "Pedro Soto", "Bsound".
    textos = [].concat.apply([], textos.map(function (l) { return l.split(/[|,;]/); }))
      .map(function (l) { return l.replace(/\s+/g, " ").replace(/^[\s:\-–]+|[\s:\-–]+$/g, "").trim(); })
      .filter(Boolean);

    // Lo que queda: la primera línea es el nombre y el resto la empresa o área.
    if (!r.nombre && textos.length) r.nombre = textos.shift();
    if (!r.empresa && textos.length) r.empresa = textos.join(" · ");
    if (r.nombre) r.nombre = nombrePropio(r.nombre);
    return r;
  }

  function leerDatosCopiados(texto) {
    if (!texto || String(texto).length > 20000) return [];
    var res = [];
    separarBloques(texto).forEach(function (b) {
      var r = leerBloque(b);
      // Solo cuenta como vehículo si tiene patente y además nombre o teléfono.
      if (r.patente && (r.nombre || r.telefono)) res.push(r);
    });
    return res;
  }

  global.leerDatosCopiados = leerDatosCopiados;
  if (typeof module !== "undefined") module.exports = { leerDatosCopiados: leerDatosCopiados };
})(typeof window !== "undefined" ? window : this);
