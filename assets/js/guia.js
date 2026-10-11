// ============================================================
//  Guía visual de los retos
//  - El reto que toca ahora brilla en amarillo y dice "RETO 1 DE 2"; los demás se atenúan.
//  - Un globito amarillo señala el siguiente clic (ficha, hueco, caja, botón Comprobar
//    o cualquier elemento con data-guia="texto" dentro de un reto).
//  - Si el estudiante hace muchos clics seguidos, Nova lo frena y la guía se ve más fuerte.
//  No necesita configuración: lee las clases que ya usa el motor (.tarea, .hecha, .elegida).
// ============================================================
var Guia = (function () {
    var UMBRAL_CLICS = 7;        // clics seguidos...
    var VENTANA_MS = 3000;       // ...dentro de esta ventana disparan el aviso
    var ENFRIAMIENTO_MS = 25000; // mínimo entre avisos
    var ERRORES_AVISO = 3;       // errores en un mismo reto antes de reforzar la guía

    var clics = [];
    var ultimoAviso = 0;
    var avisadosPorErrores = {};
    var flecha = null;
    var objetivo = null;
    var pendiente = null;

    function slideActiva() { return document.querySelector(".slide.activa"); }
    function visible(n) { return !!(n && n.offsetParent !== null); }

    // Todos los retos de la slide, y cuál es el que toca ahora
    function retosDe(slide) {
        return Array.prototype.slice.call(slide.querySelectorAll(".tarea"));
    }
    function retoActivo(slide) {
        var lista = retosDe(slide);
        for (var i = 0; i < lista.length; i++) {
            if (!lista[i].classList.contains("hecha") && visible(lista[i])) return lista[i];
        }
        return null;
    }

    // Qué elemento hay que tocar ahora dentro del reto activo, y qué texto lleva el globito
    function elegirObjetivo(reto) {
        var marcados = reto.querySelectorAll("[data-guia]:not([data-usado])");
        for (var i = 0; i < marcados.length; i++) {
            if (visible(marcados[i]) && !marcados[i].disabled) return { el: marcados[i], texto: marcados[i].dataset.guia };
        }
        var comprobar = reto.querySelector(".w-comprobar");
        var elegida = reto.querySelector(".ficha.elegida, .item.elegida");

        if (reto.classList.contains("w-huecos")) {
            if (elegida) {
                var hueco = Array.prototype.filter.call(reto.querySelectorAll(".hueco"), function (h) { return !h.firstElementChild; })[0];
                if (hueco) return { el: hueco, texto: "2 · clic en el hueco" };
            }
            var banco = reto.querySelector(".fichas .ficha");
            var hayHuecoLibre = Array.prototype.some.call(reto.querySelectorAll(".hueco"), function (h) { return !h.firstElementChild; });
            if (banco && hayHuecoLibre) return { el: banco, texto: "1 · clic en una ficha" };
            if (comprobar && !comprobar.disabled) return { el: comprobar, texto: "3 · comprueba" };
        }
        if (reto.classList.contains("w-clasificar")) {
            if (elegida) {
                var zona = reto.querySelector(".cubo-zona");
                if (zona) return { el: zona, texto: "2 · clic en una caja" };
            }
            var item = reto.querySelector(".clasif-pool .item");
            if (item) return { el: item, texto: "1 · clic en una ficha" };
            if (comprobar && !comprobar.disabled) return { el: comprobar, texto: "3 · comprueba" };
        }
        if (reto.classList.contains("w-ordenar") && comprobar && !comprobar.disabled) {
            return { el: comprobar, texto: "cuando termines, comprueba" };
        }
        return null;
    }

    function ponerFlecha(info) {
        if (!flecha) {
            flecha = document.createElement("div");
            flecha.className = "guia-flecha";
            flecha.setAttribute("aria-hidden", "true");
            document.body.appendChild(flecha);
        }
        if (objetivo && (!info || info.el !== objetivo)) objetivo.classList.remove("guia-pulso");
        if (!info) { objetivo = null; flecha.style.display = "none"; return; }
        objetivo = info.el;
        objetivo.classList.add("guia-pulso");
        if (flecha.textContent !== info.texto) flecha.textContent = info.texto;
        flecha.style.display = "block";
        colocarFlecha();
    }

    function colocarFlecha() {
        if (!objetivo || !flecha || flecha.style.display === "none") return;
        var r = objetivo.getBoundingClientRect();
        var hud = 62;
        var fueraArriba = r.bottom < hud, fueraAbajo = r.top > window.innerHeight - 70;
        if (!visible(objetivo) || fueraArriba || fueraAbajo) { flecha.style.visibility = "hidden"; return; }
        flecha.style.visibility = "visible";
        var h = flecha.offsetHeight, w = flecha.offsetWidth;
        // Botones, campos y controles: el globito va a su derecha para no tapar los pasos del reto
        var alLado = objetivo.matches("button, label, input, .control") && r.right + w + 24 < window.innerWidth;
        flecha.classList.toggle("derecha", alLado);
        if (alLado) {
            flecha.classList.remove("abajo");
            flecha.style.top = Math.max(hud + 4, r.top + r.height / 2 - h / 2) + "px";
            flecha.style.left = r.right + 16 + "px";
            return;
        }
        var arriba = r.top - h - 14 >= hud;
        flecha.classList.toggle("abajo", !arriba);
        var top = arriba ? r.top - h - 14 : r.bottom + 14;
        var left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
        flecha.style.top = top + "px";
        flecha.style.left = left + "px";
        flecha.style.setProperty("--punta", Math.min(Math.max(14, r.left + r.width / 2 - left), w - 14) + "px");
    }

    function actualizar() {
        pendiente = null;
        var slide = slideActiva();
        document.querySelectorAll(".reto-activo, .reto-espera").forEach(function (n) {
            if (!slide || !slide.contains(n)) { n.classList.remove("reto-activo", "reto-espera"); n.removeAttribute("data-orden"); }
        });
        if (!slide) { ponerFlecha(null); return; }

        var todos = retosDe(slide);
        var activo = retoActivo(slide);
        todos.forEach(function (t, i) {
            var esActivo = t === activo;
            var espera = !esActivo && !t.classList.contains("hecha") && visible(t);
            var orden = todos.length > 1 ? "RETO " + (i + 1) + " DE " + todos.length : "RETO";
            if (t.classList.contains("reto-activo") !== esActivo) t.classList.toggle("reto-activo", esActivo);
            if (t.classList.contains("reto-espera") !== espera) t.classList.toggle("reto-espera", espera);
            if (esActivo || espera) { if (t.dataset.orden !== orden) t.dataset.orden = orden; }
            else if (t.hasAttribute("data-orden")) t.removeAttribute("data-orden");
        });
        ponerFlecha(activo ? elegirObjetivo(activo) : null);

        // Reto con varios errores: refuerza la guía una sola vez
        if (activo && !avisadosPorErrores[activo.id || activo.dataset.orden + slide.id]) {
            var errores = parseInt(activo.dataset.errores || "0", 10);
            if (errores >= ERRORES_AVISO) {
                avisadosPorErrores[activo.id || activo.dataset.orden + slide.id] = true;
                reforzar("Llevas varios intentos. Lee la pista en amarillo del reto y sigue el brillo: ahí va el siguiente clic.");
            }
        }
    }

    function programar() {
        if (pendiente) return;
        pendiente = setTimeout(actualizar, 50);
    }

    function reforzar(texto) {
        if (window.Motor && Motor.api) Motor.api.hablar(texto, "advertencia");
        document.body.classList.add("guia-fuerte");
        if (objetivo && objetivo.scrollIntoView) objetivo.scrollIntoView({ block: "center", behavior: "smooth" });
        setTimeout(function () { document.body.classList.remove("guia-fuerte"); }, 6000);
    }

    function alClic(e) {
        var marcado = e.target.closest && e.target.closest("[data-guia]");
        if (marcado) marcado.setAttribute("data-usado", "1");

        var slide = slideActiva();
        if (!slide || !retoActivo(slide)) { clics = []; return; }
        // Los botones de navegación y de sonido no cuentan
        if (e.target.closest && e.target.closest(".nav, .hud, .nova-globo")) return;
        var ahora = Date.now();
        clics.push(ahora);
        clics = clics.filter(function (t) { return ahora - t <= VENTANA_MS; });
        if (clics.length >= UMBRAL_CLICS && ahora - ultimoAviso > ENFRIAMIENTO_MS) {
            ultimoAviso = ahora;
            clics = [];
            reforzar("Con calma, cadete. Un paso a la vez: sigue el brillo amarillo, ahí va el siguiente clic. Los pasos del reto están numerados.");
        }
    }

    function iniciar() {
        var escenario = document.querySelector(".escenario");
        if (!escenario) return;
        new MutationObserver(programar).observe(escenario, {
            subtree: true, childList: true, attributes: true,
            attributeFilter: ["class", "data-errores", "data-usado", "disabled"]
        });
        document.addEventListener("click", alClic, true);
        document.addEventListener("input", function (e) {
            var m = e.target.closest && e.target.closest("[data-guia]");
            if (m) { m.setAttribute("data-usado", "1"); programar(); }
        }, true);
        escenario.addEventListener("scroll", colocarFlecha);
        window.addEventListener("resize", colocarFlecha);
        setInterval(colocarFlecha, 150);
        programar();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
    else iniciar();

    return { actualizar: actualizar };
})();
