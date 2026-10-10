var ICO_SONIDO_ON = '<svg class="ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.8a9 9 0 0 1 0 12.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
var ICO_SONIDO_OFF = '<svg class="ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
// ============================================================
//  Motor de misiones — Simulador del Hangar
//  Maneja navegación, XP, sonidos, diálogos de Nova y los
//  mini-retos genéricos (quiz, huecos, clasificar, ordenar, bug).
//
//  Cada misión semanal solo escribe su HTML con slides y,
//  si necesita algo especial, registra su lógica con Motor.al().
// ============================================================

var Motor = (function () {

    // Quien tiene "reducir movimiento" activado en su sistema no ve máquina de escribir, confeti ni saltos
    var REDUCIDO = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    // ?profe=1 en la dirección desbloquea el botón Siguiente (para proyectar la misión en clase)
    var MODO_PROFE = /[?&]profe=1/.test(window.location.search);

    // ----------------------------------------------------------
    //  Sonido: efectos reales (assets/sfx, vía audio.js). Si un archivo
    //  no carga, se usan estos tonos sintetizados con Web Audio.
    // ----------------------------------------------------------
    var audio = null;

    function tono(frecuencia, duracion, tipo, volumen, retraso) {
        if (Sonido.silenciado()) return;
        try {
            if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
            var t = audio.currentTime + (retraso || 0);
            var osc = audio.createOscillator();
            var gan = audio.createGain();
            osc.type = tipo || "square";
            osc.frequency.setValueAtTime(frecuencia, t);
            gan.gain.setValueAtTime(volumen || 0.05, t);
            gan.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
            osc.connect(gan);
            gan.connect(audio.destination);
            osc.start(t);
            osc.stop(t + duracion);
        } catch (e) { /* sin audio, sin drama */ }
    }

    var sonidos = {
        clic: function () { tono(660, 0.05, "square", 0.03); },
        ok: function () { tono(523, 0.09, "square", 0.05); tono(784, 0.14, "square", 0.05, 0.08); },
        error: function () { tono(196, 0.18, "sawtooth", 0.04); tono(147, 0.22, "sawtooth", 0.04, 0.1); },
        avance: function () { tono(392, 0.06, "triangle", 0.05); tono(587, 0.08, "triangle", 0.05, 0.05); },
        logro: function () {
            var notas = [523, 659, 784, 1047];
            for (var i = 0; i < notas.length; i++) tono(notas[i], 0.16, "square", 0.05, i * 0.1);
        },
        soltar: function () { tono(440, 0.05, "triangle", 0.04); },
        coger: function () { tono(520, 0.04, "triangle", 0.03); },
        comprobar: function () { tono(600, 0.05, "square", 0.03); },
        parcial: function () { tono(330, 0.15, "triangle", 0.04); tono(392, 0.15, "triangle", 0.04, 0.1); }
    };
    sonidos.final = sonidos.logro;

    function sonar(nombre) {
        if (Sonido.silenciado()) return;
        var respaldo = function () { if (sonidos[nombre]) sonidos[nombre](); };
        if (Sonido.efecto(nombre, respaldo)) return;
        respaldo();
    }

    // localStorage puede fallar (modo privado, bloqueado): siempre con try/catch
    function leerLocal(clave) {
        try { return window.localStorage.getItem(clave); } catch (e) { return null; }
    }
    function guardarLocal(clave, valor) {
        try { window.localStorage.setItem(clave, valor); } catch (e) { }
    }

    function barajar(lista) {
        for (var i = lista.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = lista[i]; lista[i] = lista[j]; lista[j] = t;
        }
        return lista;
    }

    // Hace que un elemento clicable también responda a Enter y Espacio (teclado)
    function teclable(nodo, rol) {
        nodo.setAttribute("tabindex", "0");
        nodo.setAttribute("role", rol || "button");
        nodo.addEventListener("keydown", function (e) {
            if ((e.key === "Enter" || e.key === " ") && e.target === nodo) {
                e.preventDefault();
                nodo.click();
            }
        });
    }

    // ----------------------------------------------------------
    //  Resaltado de código JSX (sencillo, solo para nuestros ejemplos)
    // ----------------------------------------------------------
    function escapar(t) {
        return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    var patron = /(\/\/.*$)|("(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.]*|\/?>)|\b(function|return|export|default|import|from|const|let|true|false|undefined)\b|\b(\d+)\b|([{}])|\b([a-zA-Z_]\w*)(?==)/gm;

    function resaltar(texto) {
        var html = "";
        var ultimo = 0;
        texto.replace(patron, function (m, com, str, tag, key, num, llave, attr, pos) {
            html += escapar(texto.slice(ultimo, pos));
            var clase = com ? "tk-com" : str ? "tk-str" : tag ? "tk-tag" : key ? "tk-key" : num ? "tk-num" : llave ? "tk-llave" : "tk-attr";
            html += '<span class="' + clase + '">' + escapar(m) + "</span>";
            ultimo = pos + m.length;
            return m;
        });
        html += escapar(texto.slice(ultimo));
        return html;
    }

    // Quita la sangría común para poder escribir el código indentado en el HTML
    function limpiarSangria(texto) {
        var lineas = texto.replace(/^\n+|\s+$/g, "").split("\n");
        var minimo = Infinity;
        lineas.forEach(function (l) {
            if (l.trim() === "") return;
            var espacios = l.match(/^ */)[0].length;
            if (espacios < minimo) minimo = espacios;
        });
        return lineas.map(function (l) { return l.slice(minimo); }).join("\n");
    }

    function prepararCodigo(raiz) {
        // El código JSX se escribe dentro de <script type="text/x-jsx"> para no tener
        // que escapar cada < y >. Aquí se convierte en un <pre class="codigo">.
        raiz.querySelectorAll('script[type="text/x-jsx"]').forEach(function (s) {
            var pre = document.createElement("pre");
            pre.className = "codigo " + (s.className || "");
            if (s.id) pre.id = s.id;
            if (s.getAttribute("style")) pre.setAttribute("style", s.getAttribute("style"));
            pre.textContent = s.textContent;
            s.parentNode.replaceChild(pre, s);
        });
        raiz.querySelectorAll("pre.codigo").forEach(function (pre) {
            if (pre.dataset.listo) return;
            var crudo = limpiarSangria(pre.textContent);
            // [[respuesta]] marca un hueco para arrastrar una ficha
            var partes = crudo.split(/\[\[(.+?)\]\]/);
            var html = "";
            for (var i = 0; i < partes.length; i++) {
                if (i % 2 === 0) html += resaltar(partes[i]);
                else html += '<span class="hueco" data-respuesta="' + escapar(partes[i]).replace(/"/g, "&quot;") + '"></span>';
            }
            pre.innerHTML = html;
            pre.dataset.listo = "1";
        });
    }

    // ----------------------------------------------------------
    //  Estado de la misión
    // ----------------------------------------------------------
    var slides = [];
    var actual = 0;
    var xp = 0;
    var xpMaximo = 0;
    var misionId = "";
    var finalMostrado = false;

    // ----------------------------------------------------------
    //  Temporizador discreto (opcional): Motor.iniciar({ id, temporizador: { sugerido: "15–20", alertaDesde: 15 } })
    //  Cuenta desde que el estudiante sale de la portada. Sin sonido. Blanco mientras hay tiempo y rojo desde "alertaDesde" (minutos).
    // ----------------------------------------------------------
    var reloj = null;
    function formatoTiempo(seg) {
        var m = Math.floor(seg / 60), r = seg % 60;
        return m + ":" + (r < 10 ? "0" : "") + r;
    }
    function prepararReloj(cfg) {
        var caja = document.createElement("div");
        caja.className = "hud-tiempo";
        caja.setAttribute("role", "timer");
        caja.setAttribute("aria-label", "Tiempo transcurrido en la misión");
        caja.title = "Tiempo sugerido: " + cfg.sugerido + " minutos";
        caja.innerHTML = '<b>0:00</b><small> / ' + cfg.sugerido + " min</small>";
        var xpCaja = document.querySelector(".hud-xp");
        xpCaja.parentNode.insertBefore(caja, xpCaja);
        reloj = { cfg: cfg, caja: caja, num: caja.querySelector("b"), inicio: 0, id: null, total: 0 };
    }
    function pintarReloj() {
        var seg = Math.floor((Date.now() - reloj.inicio) / 1000);
        reloj.total = seg;
        reloj.num.textContent = formatoTiempo(seg);
        reloj.caja.classList.toggle("alerta", seg >= reloj.cfg.alertaDesde * 60);
    }
    function arrancarReloj() {
        if (!reloj || reloj.id || reloj.inicio) return;
        reloj.inicio = Date.now();
        reloj.id = setInterval(pintarReloj, 1000);
    }
    function detenerReloj() {
        if (!reloj || !reloj.id) return;
        pintarReloj();
        clearInterval(reloj.id);
        reloj.id = null;
    }
    var saliendo = false;
    var ganchos = {};       // lógica especial de cada slide: Motor.al("id", fn)
    var iniciados = {};

    var el = {};

    // ----------------------------------------------------------
    //  Diálogo de Nova con efecto de máquina de escribir
    // ----------------------------------------------------------
    var temporizadorTexto = null;

    // Emote -> nombre del archivo en assets/img/nova/ (todos .webp)
    var ARCHIVO_EMOTE = {
        hola: "hola",
        celebra: "celebra",
        recuerda: "recuerda",
        tip: "nova_tip",
        idea: "nova_idea",
        advertencia: "nova_advertencia",
        oops: "nova_oops"
    };

    function archivoEmote(emote) {
        return (ARCHIVO_EMOTE[emote] || emote) + ".webp";
    }

    function rutaImagen(emote) {
        return document.body.dataset.raiz + "assets/img/nova/" + archivoEmote(emote);
    }

    function ponerRetrato(emote) {
        var cont = el.retrato;
        if (cont.dataset.emote === emote) return;
        cont.dataset.emote = emote;
        cont.innerHTML = "";
        var img = new Image();
        img.alt = "";   // decorativa: lo que dice Nova se anuncia aparte
        img.src = rutaImagen(emote);
        img.onerror = function () {
            // La imagen aún no existe: dejamos un marcador con el nombre del archivo
            cont.innerHTML = '<div class="img-falta">NOVA<br>' + archivoEmote(emote) + "</div>";
        };
        cont.appendChild(img);
        cont.classList.remove("rebote");
        void cont.offsetWidth;
        cont.classList.add("rebote");
    }

    // Parte un texto con `código` en trozos normales y trozos de código
    function trozosDeTexto(texto) {
        return texto.split(/(`[^`]+`)/).filter(function (t) { return !!t; });
    }

    // Escribe un texto (con `código` inline) dentro de un contenedor, de una sola vez
    function rellenarInline(destino, texto) {
        destino.innerHTML = "";
        trozosDeTexto(texto).forEach(function (t) {
            var esCodigo = t.charAt(0) === "`";
            var nodo = document.createElement(esCodigo ? "code" : "span");
            if (esCodigo) nodo.className = "inline";
            nodo.textContent = esCodigo ? t.slice(1, -1) : t;
            destino.appendChild(nodo);
        });
    }

    function hablar(texto, emote) {
        if (emote) ponerRetrato(emote);
        clearTimeout(temporizadorTexto);
        el.vivo.textContent = texto.replace(/`/g, "");   // lo que leen los lectores de pantalla
        var destino = el.texto;
        destino.innerHTML = "";

        var cola = [];
        trozosDeTexto(texto).forEach(function (t) {
            var esCodigo = t.charAt(0) === "`";
            var span = document.createElement(esCodigo ? "code" : "span");
            if (esCodigo) span.className = "inline";
            // El span se agrega cuando llega su primera letra (evita cajitas de código vacías)
            var limpio = esCodigo ? t.slice(1, -1) : t;
            for (var i = 0; i < limpio.length; i++) cola.push({ nodo: span, letra: limpio.charAt(i) });
        });

        function poner(c) {
            if (!c.nodo.parentNode) destino.appendChild(c.nodo);
            c.nodo.textContent += c.letra;
        }
        var i = 0;
        function escribir() {
            // Varias letras por tic para que no se sienta lento
            for (var n = 0; n < 2 && i < cola.length; n++, i++) poner(cola[i]);
            if (i < cola.length) temporizadorTexto = setTimeout(escribir, 16);
        }
        if (REDUCIDO) { for (; i < cola.length; i++) poner(cola[i]); }
        else escribir();

        // Clic en el globo = mostrar todo de una
        el.globo.onclick = function () {
            clearTimeout(temporizadorTexto);
            for (; i < cola.length; i++) poner(cola[i]);
        };
    }

    // Nova habla Y el mismo mensaje queda escrito dentro del reto, junto a lo que se está resolviendo
    function retro(tarea, texto, emote) {
        hablar(texto, emote || "oops");
        var f = tarea.querySelector(".w-feedback");
        if (!f) {
            f = document.createElement("p");
            f.className = "w-feedback";
            f.setAttribute("aria-hidden", "true");   // ya lo anuncia Nova
            var acciones = tarea.querySelector(".w-acciones");
            if (acciones) tarea.insertBefore(f, acciones); else tarea.appendChild(f);
        }
        rellenarInline(f, texto);
        f.classList.remove("visible");
        void f.offsetWidth;
        f.classList.add("visible");
    }

    // ----------------------------------------------------------
    //  XP
    // ----------------------------------------------------------
    function sumarXp(cantidad, origen) {
        if (cantidad <= 0) return;
        xp += cantidad;
        el.xp.textContent = xp;
        el.hudXp.classList.remove("pop");
        void el.hudXp.offsetWidth;
        el.hudXp.classList.add("pop");

        // Numerito flotante "+10" sobre el elemento que dio el XP
        if (origen) {
            var r = origen.getBoundingClientRect();
            var f = document.createElement("div");
            f.className = "xp-flotante";
            f.textContent = "+" + cantidad + " XP";
            f.style.left = r.left + r.width / 2 + "px";
            f.style.top = Math.max(60, r.top) + "px";
            document.body.appendChild(f);
            setTimeout(function () { f.remove(); }, 1100);
        }
    }

    // ----------------------------------------------------------
    //  Tareas: cada reto de una slide es una "tarea"
    // ----------------------------------------------------------
    function marcarHecha(tarea, conAyuda) {
        if (tarea.classList.contains("hecha")) return;
        tarea.classList.add("hecha");
        var valor = parseInt(tarea.dataset.xp || "10", 10);
        var errores = parseInt(tarea.dataset.errores || "0", 10);
        // Primer intento = XP completo. Con errores o con solución vista, menos.
        var gana = conAyuda ? 2 : errores === 0 ? valor : Math.ceil(valor / 2);
        sumarXp(gana, tarea);

        // Ya no hay nada que comprobar ni pista que mostrar
        tarea.querySelectorAll(".w-comprobar").forEach(function (c) { c.disabled = true; });
        var fb = tarea.querySelector(".w-feedback");
        if (fb) fb.remove();
        var sol = tarea.querySelector(".w-solucion");
        if (sol) sol.remove();

        // Si resolver este reto revela algo (otro bloque), lo traemos a la vista
        var revelado = tarea.nextElementSibling;
        if (revelado && revelado.classList.contains("oculta-hasta-resolver")) {
            setTimeout(function () {
                revelado.scrollIntoView({ block: "nearest", behavior: REDUCIDO ? "auto" : "smooth" });
            }, 150);
        }
        revisarSlide();
    }

    function sumarError(tarea, parcial) {
        tarea.dataset.errores = parseInt(tarea.dataset.errores || "0", 10) + 1;
        tarea.classList.remove("temblar");
        void tarea.offsetWidth;
        tarea.classList.add("temblar");
        sonar(parcial ? "parcial" : "error");
        return parseInt(tarea.dataset.errores, 10);
    }

    function revisarSlide() {
        var s = slides[actual];
        var pendientes = s.querySelectorAll(".tarea:not(.hecha)").length;
        if (pendientes === 0 && !s.dataset.completa) {
            s.dataset.completa = "1";
            if (s.dataset.reto !== undefined) {
                setTimeout(function () { sonar("logro"); }, 450);
                if (s.dataset.novaFin) hablar(s.dataset.novaFin, s.dataset.emoteFin || "celebra");
            }
        }
        actualizarNav();
    }

    // ----------------------------------------------------------
    //  Widgets genéricos
    // ----------------------------------------------------------

    // QUIZ: botones .w-opcion, el correcto lleva data-ok. Las opciones se barajan solas.
    function prepararQuiz(q) {
        q.classList.add("tarea");
        var cont = q.querySelector(".w-opciones");
        if (cont && cont.dataset.fijo === undefined) {
            barajar(Array.prototype.slice.call(cont.children)).forEach(function (op) { cont.appendChild(op); });
        }
        q.querySelectorAll(".w-opcion").forEach(function (op) {
            op.addEventListener("click", function () {
                if (q.classList.contains("hecha") || op.getAttribute("aria-disabled") === "true") return;
                if (op.dataset.ok !== undefined) {
                    op.classList.add("correcta");
                    sonar("ok");
                    var exp = q.querySelector(".w-explica");
                    if (exp) exp.classList.add("visible");
                    marcarHecha(q);
                } else {
                    op.classList.add("incorrecta");
                    op.setAttribute("aria-disabled", "true");   // no usamos disabled: así el foco no se pierde
                    sumarError(q);
                    if (op.dataset.pista) retro(q, op.dataset.pista);
                }
            });
        });
    }

    // Lógica compartida de "toma una ficha y suéltala en un lugar".
    // Funciona arrastrando con el mouse o con dos clics (ficha y destino); también con teclado.
    var fichaElegida = null;

    function limpiarSeleccion() {
        document.querySelectorAll(".elegida").forEach(function (x) { x.classList.remove("elegida"); });
        fichaElegida = null;
    }

    function hacerArrastrable(ficha) {
        ficha.setAttribute("draggable", "true");
        teclable(ficha);
        ficha.addEventListener("dragstart", function (e) {
            limpiarSeleccion();
            fichaElegida = ficha;
            ficha.classList.add("arrastrando");
            sonar("coger");
            try { e.dataTransfer.setData("text/plain", "ficha"); } catch (err) { }
        });
        ficha.addEventListener("dragend", function () {
            ficha.classList.remove("arrastrando");
            // Si se soltó en cualquier lugar que no es un destino, no queda ninguna ficha "agarrada"
            if (fichaElegida === ficha && !ficha.classList.contains("elegida")) fichaElegida = null;
        });
        ficha.addEventListener("click", function (e) {
            if (ficha.closest(".hecha")) { e.stopPropagation(); return; }
            var hayOtra = fichaElegida && fichaElegida !== ficha && fichaElegida.classList.contains("elegida");
            // Hay otra ficha elegida y esta ya ocupa un destino: el clic es para el destino (reemplazar)
            if (hayOtra && ficha.parentElement.closest(".hueco, .cubo-zona")) return;
            e.stopPropagation();
            var yaEra = ficha.classList.contains("elegida");
            limpiarSeleccion();
            if (!yaEra) { fichaElegida = ficha; ficha.classList.add("elegida"); sonar("coger"); }
        });
    }

    function hacerDestino(zona, alSoltar) {
        function valido() {
            if (!fichaElegida) return false;
            var t = zona.closest(".tarea");
            return !t || t === fichaElegida.closest(".tarea");
        }
        zona.addEventListener("dragover", function (e) { e.preventDefault(); zona.classList.add("encima"); });
        zona.addEventListener("dragleave", function () { zona.classList.remove("encima"); });
        zona.addEventListener("drop", function (e) {
            e.preventDefault();
            zona.classList.remove("encima");
            if (!valido()) return;
            var f = fichaElegida;
            f.classList.remove("elegida");
            fichaElegida = null;
            alSoltar(f);
            sonar("soltar");
        });
        zona.addEventListener("click", function () {
            if (!valido() || !fichaElegida.classList.contains("elegida")) return;
            var f = fichaElegida;
            f.classList.remove("elegida");
            fichaElegida = null;
            alSoltar(f);
            sonar("soltar");
            // Con teclado, el foco se queda en la ficha que se movió (si no, se pierde al cambiar de lugar)
            try { f.focus({ preventScroll: true }); } catch (err) { }
        });
    }

    function botonSolucion(widget, resolver) {
        if (widget.querySelector(".w-solucion")) return;
        var b = document.createElement("button");
        b.className = "btn btn-sec w-solucion";
        b.textContent = "Ver solución";
        b.addEventListener("click", function () {
            sonar("comprobar");
            resolver();
            b.remove();
            marcarHecha(widget, true);
        });
        widget.querySelector(".w-acciones").appendChild(b);
    }

    // HUECOS: código con [[respuesta]] + fichas para completar
    function prepararHuecos(w) {
        w.classList.add("tarea");
        var banco = w.querySelector(".fichas");
        w.querySelectorAll(".ficha").forEach(hacerArrastrable);

        function limpiarEstados() {
            w.querySelectorAll(".hueco").forEach(function (h) { h.classList.remove("mal", "bien"); });
        }

        w.querySelectorAll(".hueco").forEach(function (h) {
            teclable(h);
            h.setAttribute("aria-label", "Hueco para completar");
            hacerDestino(h, function (ficha) {
                if (w.classList.contains("hecha")) return;
                // Si el hueco ya tenía ficha, esa vuelve al banco
                var previa = h.firstElementChild;
                if (previa && previa !== ficha) banco.appendChild(previa);
                h.appendChild(ficha);
                limpiarEstados();
            });
        });
        // El banco también recibe fichas: así se pueden devolver arrastrando
        hacerDestino(banco, function (ficha) {
            if (w.classList.contains("hecha")) return;
            banco.appendChild(ficha);
            limpiarEstados();
        });
        // Clic en una ficha ya puesta: devolverla al banco
        w.addEventListener("click", function (e) {
            var f = e.target.closest(".hueco .ficha");
            if (f && !w.classList.contains("hecha") && !fichaElegida) {
                banco.appendChild(f);
                limpiarEstados();
                e.stopPropagation();
                sonar("clic");
            }
        }, true);

        w.querySelector(".w-comprobar").addEventListener("click", function () {
            if (!w.querySelector(".hueco .ficha")) {
                retro(w, "Primero pon fichas en los huecos: arrástralas, o haz clic en la ficha y luego en el hueco.", "tip");
                return;
            }
            var huecos = w.querySelectorAll(".hueco");
            var bien = true;
            var aciertos = 0;
            huecos.forEach(function (h) {
                var puesta = h.firstElementChild ? h.firstElementChild.textContent.trim() : "";
                var ok = puesta === h.dataset.respuesta;
                h.classList.toggle("mal", !ok);
                h.classList.toggle("bien", ok);
                if (ok) aciertos++; else bien = false;
            });
            if (bien) {
                sonar("ok");
                marcarHecha(w);
            } else {
                var n = sumarError(w, aciertos > 0);
                if (w.dataset.pista) retro(w, w.dataset.pista);
                if (n >= 2) botonSolucion(w, function () {
                    w.querySelectorAll(".hueco").forEach(function (h) {
                        var correcta = null;
                        w.querySelectorAll(".ficha").forEach(function (f) {
                            if (!correcta && f.textContent.trim() === h.dataset.respuesta && !f.closest(".hueco.bien")) correcta = f;
                        });
                        if (h.firstElementChild && h.firstElementChild !== correcta) banco.appendChild(h.firstElementChild);
                        if (correcta) h.appendChild(correcta);
                        h.classList.remove("mal");
                        h.classList.add("bien");
                    });
                });
            }
        });
    }

    // CLASIFICAR: items con data-cat que se sueltan en .cubo[data-cat]
    function prepararClasificar(w) {
        w.classList.add("tarea");
        w.querySelectorAll(".item").forEach(hacerArrastrable);
        var zonas = w.querySelectorAll(".cubo-zona, .clasif-pool");
        zonas.forEach(function (z) {
            var caja = z.closest(".cubo");
            teclable(z);
            z.setAttribute("aria-label", caja ? "Caja " + caja.querySelector("h4").textContent : "Fichas sin clasificar");
            hacerDestino(z, function (item) {
                if (w.classList.contains("hecha")) return;
                item.classList.remove("mal", "bien");
                z.appendChild(item);
            });
        });
        w.querySelector(".w-comprobar").addEventListener("click", function () {
            var pool = w.querySelector(".clasif-pool");
            if (pool.querySelector(".item")) {
                retro(w, "Todavía quedan fichas sin clasificar. Suéltalas todas en una caja antes de comprobar.", "tip");
                sonar("error");
                return;
            }
            var bien = true;
            var aciertos = 0;
            w.querySelectorAll(".item").forEach(function (it) {
                var cubo = it.closest(".cubo");
                var ok = cubo && cubo.dataset.cat === it.dataset.cat;
                it.classList.toggle("mal", !ok);
                it.classList.toggle("bien", ok);
                if (ok) aciertos++; else bien = false;
            });
            if (bien) { sonar("ok"); marcarHecha(w); }
            else {
                var n = sumarError(w, aciertos > 0);
                if (w.dataset.pista) retro(w, w.dataset.pista);
                if (n >= 2) botonSolucion(w, function () {
                    w.querySelectorAll(".item").forEach(function (it) {
                        w.querySelector('.cubo[data-cat="' + it.dataset.cat + '"] .cubo-zona').appendChild(it);
                        it.classList.remove("mal");
                        it.classList.add("bien");
                    });
                });
            }
        });
    }

    // ORDENAR: líneas .linea con data-pos (posición correcta, desde 1).
    // Las líneas con el mismo data-grupo se pueden intercambiar entre sí (por ejemplo, los atributos de una etiqueta).
    function prepararOrdenar(w) {
        w.classList.add("tarea");
        var lista = w.querySelector(".lineas");

        // Barajamos al iniciar para que no salgan ya ordenadas
        var items = Array.prototype.slice.call(lista.children);
        do {
            barajar(items);
        } while (items.every(function (it, i) { return parseInt(it.dataset.pos, 10) === i + 1; }));
        items.forEach(function (it) {
            it.innerHTML = '<span class="agarre" aria-hidden="true">⋮⋮</span><code>' + resaltar(it.textContent.replace(/\s+$/g, "")) + "</code>";
            lista.appendChild(it);
            teclable(it);
        });

        function ordenActual() {
            return Array.prototype.map.call(lista.children, function (x) { return x.dataset.pos; }).join(",");
        }
        function limpiarEstados() {
            items.forEach(function (x) { x.classList.remove("bien", "mal"); });
        }

        var arrastrada = null;
        var ordenAntes = "";
        var elegida = null;
        items.forEach(function (it) {
            it.setAttribute("draggable", "true");
            it.addEventListener("dragstart", function (e) {
                arrastrada = it;
                ordenAntes = ordenActual();
                it.classList.add("arrastrando");
                sonar("coger");
                try { e.dataTransfer.setData("text/plain", "linea"); } catch (err) { }
            });
            it.addEventListener("dragend", function () {
                it.classList.remove("arrastrando");
                arrastrada = null;
                if (elegida) { elegida.classList.remove("elegida"); elegida = null; }
                if (ordenActual() !== ordenAntes) { limpiarEstados(); sonar("soltar"); }
            });
            it.addEventListener("dragover", function (e) {
                e.preventDefault();
                if (!arrastrada || arrastrada === it || w.classList.contains("hecha")) return;
                var r = it.getBoundingClientRect();
                var abajo = e.clientY > r.top + r.height / 2;
                lista.insertBefore(arrastrada, abajo ? it.nextSibling : it);
            });
            // Alternativa con clics: elige una línea y luego otra para intercambiarlas
            it.addEventListener("click", function () {
                if (w.classList.contains("hecha")) return;
                if (!elegida) { elegida = it; it.classList.add("elegida"); sonar("coger"); return; }
                if (elegida !== it) {
                    var marca = document.createElement("li");
                    lista.insertBefore(marca, it);
                    lista.insertBefore(it, elegida);
                    lista.insertBefore(elegida, marca);
                    marca.remove();
                    limpiarEstados();
                    sonar("soltar");
                }
                elegida.classList.remove("elegida");
                elegida = null;
            });
        });

        w.querySelector(".w-comprobar").addEventListener("click", function () {
            var esperado = items.slice().sort(function (a, b) { return a.dataset.pos - b.dataset.pos; });
            var bien = true;
            var aciertos = 0;
            Array.prototype.forEach.call(lista.children, function (it, i) {
                var ok = parseInt(it.dataset.pos, 10) === i + 1 ||
                    (it.dataset.grupo !== undefined && it.dataset.grupo === esperado[i].dataset.grupo);
                it.classList.toggle("mal", !ok);
                it.classList.toggle("bien", ok);
                if (ok) aciertos++; else bien = false;
            });
            if (bien) { sonar("ok"); marcarHecha(w); }
            else {
                var n = sumarError(w, aciertos > 0);
                if (w.dataset.pista) retro(w, w.dataset.pista);
                if (n >= 2) botonSolucion(w, function () {
                    esperado.forEach(function (it) { it.classList.remove("mal"); it.classList.add("bien"); lista.appendChild(it); });
                });
            }
        });
    }

    // BUG: un fragmento de código con una línea mal. Se hace clic en la línea con el error.
    // Cada línea es un .bug-linea; la(s) errónea(s) llevan data-bug. data-pista en una línea buena explica por qué está bien.
    function prepararBug(w) {
        w.classList.add("tarea");
        w.querySelectorAll(".bug-linea").forEach(function (l) {
            l.innerHTML = resaltar(l.textContent);
            teclable(l);
            l.addEventListener("click", function () {
                if (w.classList.contains("hecha") || l.getAttribute("aria-disabled") === "true") return;
                if (l.dataset.bug !== undefined) {
                    l.classList.add("correcta");
                    sonar("ok");
                    var exp = w.querySelector(".w-explica");
                    if (exp) exp.classList.add("visible");
                    marcarHecha(w);
                } else {
                    l.classList.add("incorrecta");
                    l.setAttribute("aria-disabled", "true");
                    sumarError(w);
                    retro(w, l.dataset.pista || w.dataset.pista || "Esa línea está bien. Sigue buscando.");
                }
            });
        });
    }

    // ----------------------------------------------------------
    //  Navegación
    // ----------------------------------------------------------
    function actualizarNav() {
        var s = slides[actual];
        var bloqueada = s.dataset.reto !== undefined && !s.dataset.completa && !MODO_PROFE;
        el.anterior.disabled = actual === 0;
        var esUltima = actual === slides.length - 1;
        el.siguiente.style.visibility = esUltima ? "hidden" : "visible";
        el.siguiente.disabled = bloqueada;
        el.siguiente.classList.toggle("bloqueado", bloqueada);
        el.siguiente.textContent = bloqueada ? "Completa el reto" : "Siguiente →";
        el.pista.hidden = !(bloqueada && s.dataset.ayuda);
        el.paso.textContent = (actual + 1) + " / " + slides.length;
        el.barra.style.width = ((actual + 1) / slides.length * 100) + "%";
        actualizarMas();
    }

    // Flechita "hay más abajo" cuando el contenido de la slide no cabe en pantalla
    function actualizarMas() {
        if (!el.mas) return;
        var e = el.escenario;
        el.mas.classList.toggle("visible", e.scrollHeight - e.scrollTop - e.clientHeight > 14);
    }

    function ir(indice) {
        if (indice < 0 || indice >= slides.length) return;
        var antes = slides[actual];
        antes.classList.remove("activa");
        actual = indice;
        var s = slides[actual];
        s.classList.add("activa");
        el.escenario.scrollTop = 0;
        if (reloj && actual > 0) arrancarReloj();
        try { el.escenario.focus({ preventScroll: true }); } catch (err) { }   // el foco del teclado sigue al contenido nuevo
        limpiarSeleccion();   // una ficha elegida en otra slide no debe seguir "en la mano"

        if (!iniciados[actual]) {
            iniciados[actual] = true;
            if (s.id && ganchos[s.id]) ganchos[s.id](s, api);
            if (s.dataset.final !== undefined) mostrarFinal(s);
        }

        if (s.dataset.nova) hablar(s.dataset.nova, s.dataset.emote || "hola");
        Sonido.pista(s.dataset.musica === "reto" ? "reto" : "lofi");
        if (window.FondoEspacio) FondoEspacio.saltar();
        actualizarNav();
    }

    function siguiente() {
        if (el.siguiente.disabled || actual >= slides.length - 1) return;
        sonar("avance");
        ir(actual + 1);
    }
    function anterior() {
        if (actual === 0) return;
        sonar("clic");
        ir(actual - 1);
    }

    // ----------------------------------------------------------
    //  Pantalla final
    // ----------------------------------------------------------
    function mostrarFinal(s) {
        finalMostrado = true;
        detenerReloj();
        if (reloj) s.querySelectorAll("[data-tiempo-final]").forEach(function (n) { n.textContent = formatoTiempo(reloj.total); });
        var pct = xpMaximo ? xp / xpMaximo : 1;
        var estrellas = pct >= 0.85 ? 3 : pct >= 0.55 ? 2 : 1;
        var cont = s.querySelector(".final-estrellas");
        if (cont) {
            cont.innerHTML = "";
            cont.setAttribute("role", "img");
            cont.setAttribute("aria-label", estrellas + " de 3 estrellas");
            for (var i = 0; i < 3; i++) {
                var e = document.createElement("span");
                e.className = "estrella" + (i < estrellas ? " llena" : "");
                e.textContent = "★";
                e.setAttribute("aria-hidden", "true");
                e.style.animationDelay = (0.3 + i * 0.25) + "s";
                cont.appendChild(e);
            }
        }
        var t = s.querySelector(".final-xp");
        if (t) t.textContent = xp + " / " + xpMaximo + " XP";
        sonar("final");
        setTimeout(function () { sonar("confeti"); }, 250);
        lanzarConfeti();

        var completadas = {};
        try { completadas = JSON.parse(leerLocal("simulador-completadas") || "{}") || {}; } catch (e) { }
        var previo = completadas[misionId] || 0;
        if (estrellas > previo) completadas[misionId] = estrellas;
        guardarLocal("simulador-completadas", JSON.stringify(completadas));
    }

    function lanzarConfeti() {
        if (REDUCIDO) return;
        var colores = ["#61dafb", "#ffd166", "#b794ff", "#4ade80", "#ff6b8b"];
        for (var i = 0; i < 70; i++) {
            var c = document.createElement("div");
            c.className = "confeti";
            c.style.left = Math.random() * 100 + "vw";
            c.style.background = colores[i % colores.length];
            c.style.animationDelay = Math.random() * 0.6 + "s";
            c.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
            document.body.appendChild(c);
            (function (nodo) { setTimeout(function () { nodo.remove(); }, 3600); })(c);
        }
    }

    // ----------------------------------------------------------
    //  API para la lógica propia de cada misión
    // ----------------------------------------------------------
    var api = {
        hablar: hablar,
        retro: retro,                // api.retro(elementoTarea, texto, emote): Nova habla y el texto queda en el reto
        sonar: sonar,
        sumarXp: sumarXp,
        hecha: marcarHecha,          // api.hecha(elementoTarea)
        error: sumarError,           // api.error(elementoTarea)
        resaltar: resaltar,
        prepararCodigo: prepararCodigo,
        teclable: teclable,          // api.teclable(elemento): lo hace usable con Tab, Enter y Espacio
        reducido: REDUCIDO,
        siguiente: siguiente
    };

    function al(idSlide, funcion) {
        ganchos[idSlide] = funcion;
    }

    // ----------------------------------------------------------
    //  Arranque
    // ----------------------------------------------------------
    function iniciar(opciones) {
        misionId = opciones.id;
        el.escenario = document.querySelector(".escenario");
        el.retrato = document.querySelector(".nova-retrato");
        el.texto = document.querySelector(".nova-texto");
        el.globo = document.querySelector(".nova-globo");
        el.anterior = document.querySelector(".nav-anterior");
        el.siguiente = document.querySelector(".nav-siguiente");
        el.pista = document.querySelector(".nav-pista");
        el.paso = document.querySelector(".hud-paso");
        el.barra = document.querySelector(".hud-barra span");
        el.xp = document.querySelector(".hud-xp b");
        el.hudXp = document.querySelector(".hud-xp");
        var botonSonido = document.querySelector(".hud-sonido");

        // Lo que dice Nova se anuncia a los lectores de pantalla de una sola vez (no letra por letra)
        el.texto.setAttribute("aria-hidden", "true");
        el.vivo = document.createElement("div");
        el.vivo.className = "sr-only";
        el.vivo.setAttribute("role", "status");
        el.vivo.setAttribute("aria-live", "polite");
        document.body.appendChild(el.vivo);

        slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
        prepararCodigo(document);

        document.querySelectorAll(".w-quiz").forEach(prepararQuiz);
        document.querySelectorAll(".w-huecos").forEach(prepararHuecos);
        document.querySelectorAll(".w-clasificar").forEach(prepararClasificar);
        document.querySelectorAll(".w-ordenar").forEach(prepararOrdenar);
        document.querySelectorAll(".w-bug").forEach(prepararBug);
        // Las tareas propias de cada misión llevan la clase .tarea en el HTML
        var totalTareas = document.querySelectorAll(".tarea").length;
        document.querySelectorAll(".tarea").forEach(function (t) {
            xpMaximo += parseInt(t.dataset.xp || "10", 10);
        });
        document.querySelectorAll("[data-total-retos]").forEach(function (n) { n.textContent = totalTareas; });

        // Flecha "hay más abajo"
        el.mas = document.createElement("div");
        el.mas.className = "mas-abajo";
        el.mas.innerHTML = '<span role="button">↓ hay más abajo</span>';
        el.mas.firstChild.addEventListener("click", function () {
            el.escenario.scrollBy({ top: el.escenario.clientHeight * 0.7, behavior: REDUCIDO ? "auto" : "smooth" });
        });
        el.escenario.appendChild(el.mas);
        el.escenario.addEventListener("scroll", actualizarMas);
        window.addEventListener("resize", actualizarMas);
        if (window.ResizeObserver) {
            var observador = new ResizeObserver(actualizarMas);
            slides.forEach(function (s) { observador.observe(s); });
        }

        if (opciones.temporizador) prepararReloj(opciones.temporizador);

        // Modo profe
        if (MODO_PROFE) {
            var insignia = document.createElement("span");
            insignia.className = "hud-profe";
            insignia.textContent = "MODO PROFE";
            insignia.title = "Los retos no bloquean el botón Siguiente";
            document.querySelector(".hud-xp").insertAdjacentElement("beforebegin", insignia);
        }

        el.siguiente.addEventListener("click", siguiente);
        el.anterior.addEventListener("click", anterior);
        el.pista.addEventListener("click", function () {
            var s = slides[actual];
            if (s.dataset.ayuda) hablar(s.dataset.ayuda, "tip");
            sonar("clic");
        });

        document.addEventListener("keydown", function (e) {
            if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.repeat) return;
            var a = document.activeElement;
            var tag = a ? a.tagName : "";
            if (tag === "TEXTAREA" || tag === "SELECT" || (a && a.isContentEditable)) return;
            // En campos de texto y en deslizadores las flechas son del campo
            if (tag === "INPUT" && a.type !== "checkbox") return;
            if (e.key === "ArrowRight") siguiente();
            if (e.key === "ArrowLeft") anterior();
        });
        // Después de usar un deslizador con el mouse se le quita el foco, para que las flechas vuelvan a navegar
        document.addEventListener("pointerup", function (e) {
            var t = e.target;
            if (t && t.tagName === "INPUT" && t.type === "range") setTimeout(function () { t.blur(); }, 0);
        });

        Sonido.iniciar(document.body.dataset.raiz);
        var botonMusica = document.querySelector(".hud-musica");
        var deslizador = document.querySelector(".hud-vol");

        function pintarSonido() {
            var sil = Sonido.silenciado();
            var mus = Sonido.musicaActiva();
            botonSonido.innerHTML = sil ? ICO_SONIDO_OFF : ICO_SONIDO_ON;
            botonSonido.setAttribute("aria-pressed", sil ? "true" : "false");
            botonSonido.setAttribute("aria-label", sil ? "Activar sonido" : "Silenciar todo el sonido");
            if (botonMusica) {
                botonMusica.classList.toggle("apagado", !mus);
                botonMusica.setAttribute("aria-pressed", mus ? "true" : "false");
                botonMusica.setAttribute("aria-label", mus ? "Apagar la música" : "Encender la música");
            }
            document.querySelectorAll("[data-musica-toggle]").forEach(function (b) {
                var on = mus && !sil;
                b.textContent = on ? b.dataset.textoOn : b.dataset.textoOff;
                b.setAttribute("aria-pressed", on ? "true" : "false");
            });
        }
        pintarSonido();
        botonSonido.addEventListener("click", function () {
            Sonido.silenciar(!Sonido.silenciado());
            pintarSonido();
            sonar("clic");
        });
        if (botonMusica) botonMusica.addEventListener("click", function () {
            Sonido.activarMusica(!Sonido.musicaActiva());
            pintarSonido();
            sonar("clic");
        });
        // Botones dentro de las slides que activan o apagan la música (data-musica-toggle)
        document.querySelectorAll("[data-musica-toggle]").forEach(function (b) {
            b.addEventListener("click", function () {
                if (Sonido.silenciado()) { Sonido.silenciar(false); Sonido.activarMusica(true); }
                else Sonido.activarMusica(!Sonido.musicaActiva());
                pintarSonido();
                sonar("clic");
            });
        });
        if (deslizador) {
            deslizador.max = Math.round(Sonido.volumenMaximo * 100);
            deslizador.value = Math.round(Sonido.volumenMusica() * 100);
            deslizador.addEventListener("input", function () {
                Sonido.volumenMusica(parseInt(deslizador.value, 10) / 100);
            });
        }

        // Los botones [data-siguiente] dentro de las slides también avanzan
        document.querySelectorAll("[data-siguiente]").forEach(function (b) {
            b.addEventListener("click", siguiente);
        });

        // Elementos [data-ir="id-de-slide"]: llevan de vuelta a esa slide (repasar un tema)
        document.querySelectorAll("[data-ir]").forEach(function (b) {
            teclable(b, "link");
            b.addEventListener("click", function () {
                for (var i = 0; i < slides.length; i++) {
                    if (slides[i].id === b.dataset.ir) { sonar("clic"); ir(i); return; }
                }
            });
        });

        // Salir a mitad de misión pierde el avance: avisamos
        function hayAvance() { return xp > 0 && !finalMostrado && !MODO_PROFE; }
        window.addEventListener("beforeunload", function (e) {
            if (saliendo || !hayAvance()) return;
            e.preventDefault();
            e.returnValue = "";
        });
        var volver = document.querySelector(".hud-volver");
        if (volver) volver.addEventListener("click", function (e) {
            if (hayAvance()) {
                if (!window.confirm("Si sales ahora pierdes el avance de esta misión. ¿Salir al hangar?")) { e.preventDefault(); return; }
                saliendo = true;
            }
        });

        slides[0].classList.add("activa");
        iniciados[0] = true;
        if (slides[0].id && ganchos[slides[0].id]) ganchos[slides[0].id](slides[0], api);
        if (slides[0].dataset.nova) hablar(slides[0].dataset.nova, slides[0].dataset.emote || "hola");
        Sonido.pista(slides[0].dataset.musica === "reto" ? "reto" : "lofi");
        actualizarNav();
    }

    return { iniciar: iniciar, al: al, resaltar: resaltar };
})();
