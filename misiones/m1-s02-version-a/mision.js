var ICONO_NAVE = '<svg class="ico-nave" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 2c3 3 4 7 4 11l3 4v2l-4-1-3 3-3-3-4 1v-2l3-4c0-4 1-8 4-11z" fill="#61dafb"/><circle cx="12" cy="9" r="1.8" fill="#0b1630"/></svg>';
// ============================================================
//  Misión M1 · Semana 2 — Divide y Vencerás
//  Lógica propia de las slides que no son quiz/huecos/ordenar.
//  Cada Motor.al("id-de-la-slide", ...) se ejecuta la primera vez
//  que el estudiante llega a esa slide.
// ============================================================

// Pone una imagen y, si todavía no existe, un marcador con el nombre del archivo
function imagenConRespaldo(contenedor, ruta, etiqueta) {
    var img = new Image();
    img.alt = etiqueta;
    img.src = ruta;
    img.onerror = function () {
        contenedor.innerHTML = '<div class="img-falta">' + etiqueta + "</div>";
    };
    contenedor.appendChild(img);
}

function escaparHtml(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Crea una tarjeta de nave como la que pintaría React
function crearTarjeta(datos) {
    var t = document.createElement("div");
    t.className = "tarjeta-nave";
    t.innerHTML =
        '<span class="icono-nave">' + ICONO_NAVE + "</span>" +
        "<h3></h3>" +
        (datos.piloto !== undefined ? '<p class="t-piloto"></p>' : "") +
        (datos.combustible !== undefined ? '<p class="t-comb"></p>' : "");
    t.querySelector("h3").textContent = datos.nombre;
    if (datos.piloto !== undefined) t.querySelector(".t-piloto").textContent = "Piloto: " + datos.piloto;
    if (datos.combustible !== undefined) t.querySelector(".t-comb").textContent = "Combustible: " + datos.combustible + "%";
    return t;
}

// ---------- Portada: Kuma flotando ----------
Motor.al("s-portada", function () {
    imagenConRespaldo(document.getElementById("kuma"), "../../assets/img/nova/kumo.webp", "KUMA<br>kumo.webp");
});

// ---------- Anatomía ----------
Motor.al("s-anatomia", function (slide, api) {
    var piezas = {
        1: ["function TarjetaNave", "Un componente es una función. Su nombre empieza con mayúscula: así React sabe que es un componente y no una etiqueta HTML como <article>."],
        2: ["(props)", "Por aquí entran los datos. props es un objeto que React arma con los atributos de la etiqueta. El componente solo lee ese objeto: las props son de solo lectura y no se modifican desde adentro."],
        3: ["return (", "Lo que la función devuelve es lo que aparece en pantalla. Los paréntesis permiten escribir el JSX en varias líneas."],
        4: ["<article className=...>", "Esto es JSX. Parece HTML, pero se escribe className en vez de class y todo va dentro de un solo elemento padre."],
        5: ["{props.nombre}", "Las llaves significan «aquí va JavaScript». Se pinta el valor de la propiedad nombre del objeto props."],
        6: ["export default", "Exporta el componente para que otro archivo lo pueda usar. App.jsx lo trae con la línea import TarjetaNave from \"./TarjetaNave\"."],
        7: ["<TarjetaNave nombre=... />", "Así se usa. App escribe la etiqueta, así que App es el padre y decide los valores; TarjetaNave es el hijo y solo los recibe. nombre=\"Kestrel-7\" llega como props.nombre, y combustible={40} llega como número."]
    };
    var vistas = {};
    var info = document.getElementById("info-anatomia");
    var contador = info.querySelector(".info-contador b");
    var titulo = info.querySelector(".info-titulo");
    var texto = info.querySelector(".info-texto");

    slide.querySelectorAll(".punto").forEach(function (p) {
        api.teclable(p);
        p.addEventListener("click", function () {
            var n = p.dataset.pieza;
            slide.querySelectorAll(".punto").forEach(function (x) { x.classList.remove("actual"); });
            p.classList.add("actual", "vista");
            titulo.textContent = piezas[n][0];
            texto.textContent = piezas[n][1];
            texto.classList.remove("cambio");
            void texto.offsetWidth;
            texto.classList.add("cambio");
            api.sonar("clic");
            if (!vistas[n]) {
                vistas[n] = true;
                var total = Object.keys(vistas).length;
                contador.textContent = total;
                if (total === 7) api.hecha(info);
            }
        });
    });
});

// ---------- Laboratorio de props ----------
Motor.al("s-lab-props", function (slide, api) {
    var inNombre = document.getElementById("lab-nombre");
    var inPiloto = document.getElementById("lab-piloto");
    var inComb = document.getElementById("lab-comb");
    var numComb = document.getElementById("lab-comb-num");
    var etiqueta = document.getElementById("lab-etiqueta");
    var objeto = document.getElementById("lab-objeto");
    var pantalla = document.getElementById("lab-pantalla");
    var reto = document.getElementById("reto-lab");

    function pintar() {
        var nombre = inNombre.value;
        var piloto = inPiloto.value;
        var comb = parseInt(inComb.value, 10);
        numComb.textContent = comb;

        etiqueta.innerHTML = api.resaltar(
            "<TarjetaNave\n" +
            '    nombre="' + nombre + '"\n' +
            '    piloto="' + piloto + '"\n' +
            "    combustible={" + comb + "}\n" +
            "/>"
        );
        objeto.innerHTML = api.resaltar(
            "props = {\n" +
            '    nombre: "' + nombre + '",\n' +
            '    piloto: "' + piloto + '",\n' +
            "    combustible: " + comb + "\n" +
            "}"
        );

        pantalla.innerHTML = "";
        pantalla.appendChild(crearTarjeta({ nombre: nombre, piloto: piloto, combustible: comb }));

        var logrado = nombre.trim().toLowerCase() === "lince rojo" &&
            piloto.trim().toLowerCase() === "kuma" && comb === 12;
        if (logrado && !reto.classList.contains("hecha")) {
            api.sonar("ok");
            api.hecha(reto);
        }
    }

    inNombre.addEventListener("input", pintar);
    inPiloto.addEventListener("input", pintar);
    inComb.addEventListener("input", pintar);
    pintar();
});

// ---------- Destructuring: alternar entre las dos versiones ----------
Motor.al("s-destructuring", function (slide, api) {
    var antes = document.getElementById("des-antes");
    var despues = document.getElementById("des-despues");
    var boton = document.getElementById("des-boton");
    var abierto = false;

    boton.addEventListener("click", function () {
        abierto = !abierto;
        antes.classList.toggle("oculto", abierto);
        despues.classList.toggle("oculto", !abierto);
        boton.textContent = abierto ? "← Volver a la versión con props" : "Abrir props con destructuring";
        api.sonar("avance");
        if (abierto) {
            api.hablar("Mismo componente. Las llaves en los paréntesis sacan `nombre` y `piloto` del objeto `props`. Ahora completa la versión de la derecha: arrastra las fichas a los huecos, o haz clic en la ficha y luego en el hueco.", "recuerda");
        }
    });
});

// ---------- Children ----------
Motor.al("s-children", function (slide, api) {
    var hueco = document.getElementById("ch-hueco");
    var codigo = document.getElementById("ch-codigo");
    var metidas = [];

    function pintarCodigo() {
        var lineas = ['<Panel titulo="Hangar 3">'];
        if (metidas.length === 0) lineas.push("    {/* aquí adentro va el children */}");
        metidas.forEach(function (n) { lineas.push('    <TarjetaNave nombre="' + n.nombre + '" piloto="' + n.piloto + '" />'); });
        lineas.push("</Panel>");
        codigo.innerHTML = api.resaltar(lineas.join("\n"));
    }

    slide.querySelectorAll("[data-nave]").forEach(function (b) {
        b.addEventListener("click", function () {
            if (metidas.length >= 4) {
                api.hablar("Con eso basta, el hangar ya está lleno.", "tip");
                return;
            }
            metidas.push({ nombre: b.dataset.nave, piloto: b.dataset.piloto });
            var vacio = hueco.querySelector(".hueco-texto");
            if (vacio) vacio.remove();
            hueco.appendChild(crearTarjeta({ nombre: b.dataset.nave, piloto: b.dataset.piloto }));
            pintarCodigo();
            api.sonar("soltar");
            if (metidas.length === 2) api.hecha(hueco);
        });
    });
    pintarCodigo();
});

// ---------- .map() ----------
Motor.al("s-map", function (slide, api) {
    var naves = [
        { id: 1, nombre: "Kestrel-7", piloto: "Nova" },
        { id: 2, nombre: "Lince Rojo", piloto: "Kuma" },
        { id: 3, nombre: "Halcón Gris", piloto: "Rin" }
    ];
    var reserva = [
        { id: 4, nombre: "Cometa Azul", piloto: "Taro" },
        { id: 5, nombre: "Gorrión-2", piloto: "Mei" }
    ];
    var arrayEl = document.getElementById("map-array");
    var codigoEl = document.getElementById("map-codigo");
    var pantalla = document.getElementById("map-pantalla");
    var reto = document.getElementById("reto-map");
    var ejecutar = document.getElementById("map-ejecutar");
    var agregar = document.getElementById("map-agregar");
    var ejecutado = false;
    var corriendo = false;

    function pintarArray(resaltada) {
        var html = api.resaltar("const naves = [") + "\n";
        naves.forEach(function (n, i) {
            var linea = "    { id: " + n.id + ', nombre: "' + n.nombre + '", piloto: "' + n.piloto + '" },';
            html += '<span class="' + (i === resaltada ? "linea-activa" : "") + '">' + api.resaltar(linea) + "</span>\n";
        });
        html += "];";
        arrayEl.innerHTML = html;
    }

    codigoEl.innerHTML = api.resaltar(
        "{naves.map((nave) => (\n" +
        "    <TarjetaNave\n" +
        "        key={nave.id}\n" +
        "        nombre={nave.nombre}\n" +
        "        piloto={nave.piloto}\n" +
        "    />\n" +
        "))}"
    );

    function correrMap() {
        if (corriendo) return;
        corriendo = true;
        ejecutar.disabled = true;
        agregar.disabled = true;     // se habilita al terminar: así nunca se mezclan los dos recorridos
        pantalla.innerHTML = "";
        var copia = naves.slice();
        var i = 0;
        function paso() {
            if (i >= copia.length) {
                pintarArray(-1);
                corriendo = false;
                ejecutar.disabled = false;
                agregar.disabled = false;
                if (!ejecutado) {
                    ejecutado = true;
                    api.hablar("Una tarjeta por cada objeto del array. Ahora agrega una nave al array: el componente no se toca.", "idea");
                }
                return;
            }
            pintarArray(i);
            pantalla.appendChild(crearTarjeta(copia[i]));
            api.sonar("soltar");
            i++;
            setTimeout(paso, api.reducido ? 0 : 420);
        }
        paso();
    }

    ejecutar.addEventListener("click", correrMap);

    agregar.addEventListener("click", function () {
        if (corriendo) return;
        if (reserva.length === 0) {
            api.hablar("No quedan naves en la reserva. Con 5 ya se entiende la idea.", "tip");
            return;
        }
        naves.push(reserva.shift());
        pintarArray(naves.length - 1);
        pantalla.appendChild(crearTarjeta(naves[naves.length - 1]));
        api.sonar("ok");
        setTimeout(function () { pintarArray(-1); }, 700);
        api.hecha(reto);
    });

    pintarArray(-1);
});

// ---------- key: por qué importa ----------
Motor.al("s-key", function (slide, api) {
    var base = [
        { id: 1, nombre: "Kestrel-7", piloto: "Nova" },
        { id: 2, nombre: "Lince Rojo", piloto: "Kuma" },
        { id: 3, nombre: "Halcón Gris", piloto: "Rin" }
    ];
    var lista = [];
    var tarjetas = [];      // las tarjetas (nodos del DOM) en el orden en que están en pantalla
    var pantalla = document.getElementById("key-pantalla");
    var codigoEl = document.getElementById("key-codigo");
    var consola = document.getElementById("key-consola");
    var sinKey = document.getElementById("key-quitar");
    var reto = document.getElementById("reto-key");
    var quitar = document.getElementById("key-quitar-primera");
    var reiniciar = document.getElementById("key-reiniciar");

    function crear(n) {
        var t = crearTarjeta({ nombre: n.nombre, piloto: n.piloto });
        t.style.width = "165px";
        var nota = document.createElement("input");
        nota.type = "text";
        nota.className = "nota-tarjeta";
        nota.placeholder = "nota…";
        nota.maxLength = 22;
        nota.setAttribute("aria-label", "Nota de la tarjeta");
        t.appendChild(nota);
        return t;
    }

    function pintarCodigo() {
        var lineas = ["{naves.map((nave) => (", "    <TarjetaNave"];
        if (!sinKey.checked) lineas.push("        key={nave.id}");
        lineas.push("        nombre={nave.nombre}", "        piloto={nave.piloto}", "    />", "))}");
        codigoEl.innerHTML = api.resaltar(lineas.join("\n"));
        if (sinKey.checked) {
            consola.className = "consola";
            consola.textContent = 'Warning: Each child in a list should have a unique "key" prop.';
        } else {
            consola.className = "consola limpia";
            consola.textContent = "Consola: sin avisos";
        }
    }

    function empezar() {
        lista = base.slice();
        pantalla.innerHTML = "";
        tarjetas = lista.map(crear);
        tarjetas.forEach(function (t) { pantalla.appendChild(t); });
    }

    quitar.addEventListener("click", function () {
        if (lista.length <= 1) {
            api.hablar("Solo queda una nave. Usa «Reiniciar lista» para probar otra vez.", "tip");
            return;
        }
        var quitada = lista[0];
        var nota = tarjetas[0].querySelector(".nota-tarjeta").value.trim();
        lista.shift();

        if (!sinKey.checked) {
            // Con key, React sabe que la tarjeta de la nave quitada es la que sale
            tarjetas.shift().remove();
            api.sonar("soltar");
            api.hablar("Con `key`, React sabe que la tarjeta de " + quitada.nombre + " es la que se va. Las demás conservan su nota. Ahora reinicia, marca «Quitar la key» y repite.", "idea");
        } else {
            // Sin key, React compara por posición: reusa las tarjetas de arriba y quita la última
            tarjetas.pop().remove();
            tarjetas.forEach(function (t, i) {
                t.querySelector("h3").textContent = lista[i].nombre;
                t.querySelector(".t-piloto").textContent = "Piloto: " + lista[i].piloto;
            });
            api.sonar("error");
            if (nota) {
                api.hablar("Mira la primera tarjeta: ahora dice " + lista[0].nombre + " pero conserva la nota «" + nota + "», que era de " + quitada.nombre + ". Sin `key`, React reusó la primera tarjeta y solo le cambió el texto.", "oops");
                api.hecha(reto);
                document.getElementById("key-quiz").classList.remove("oculto");
            } else {
                api.hablar("No escribiste nada en la nota de la primera tarjeta, así que no se nota qué se queda atrás. Reinicia la lista, escribe una nota y repite.", "tip");
            }
        }
    });

    reiniciar.addEventListener("click", function () {
        empezar();
        api.sonar("clic");
    });

    sinKey.addEventListener("change", function () {
        pintarCodigo();
        if (sinKey.checked) {
            api.sonar("error");
            api.hablar("Sin la `key` la app se ve igual y nada se rompe, pero la consola avisa. Ahora quita la primera nave y mira dónde queda la nota.", "oops");
        } else {
            api.sonar("ok");
        }
    });

    empezar();
    pintarCodigo();
});

// ---------- Condicionales ----------
Motor.al("s-condicionales", function (slide, api) {
    var rep = document.getElementById("cond-rep");
    var comb = document.getElementById("cond-comb");
    var num = document.getElementById("cond-num");
    var codigoEl = document.getElementById("cond-codigo");
    var pantalla = document.getElementById("cond-pantalla");
    var reto = document.getElementById("reto-cond");

    var lineas = [
        "function TarjetaNave({ nombre, combustible, enReparacion }) {",
        "    return (",
        '        <article className="tarjeta-nave">',
        "            <h3>{nombre}</h3>",
        '            {enReparacion && <span className="aviso">En reparación</span>}',
        "            <p>",
        '                {combustible < 20 ? "Combustible bajo" : "Lista para despegar"}',
        "            </p>",
        "        </article>",
        "    );",
        "}"
    ];

    function pintar() {
        var enRep = rep.checked;
        var c = parseInt(comb.value, 10);
        num.textContent = c;

        // La línea del && se apaga cuando la condición es false
        var html = "";
        lineas.forEach(function (l, i) {
            var clase = "";
            if (i === 4) clase = enRep ? "linea-activa" : "apagada";
            if (i === 6) clase = "linea-activa";
            html += '<span class="' + clase + '">' + api.resaltar(l) + "</span>\n";
        });
        codigoEl.innerHTML = html;

        var t = document.createElement("div");
        t.className = "tarjeta-nave";
        t.style.animation = "none";
        t.innerHTML = '<span class="icono-nave">' + ICONO_NAVE + '</span><h3>Kestrel-7</h3>' +
            (enRep ? '<span class="aviso">En reparación</span>' : "") +
            "<p>" + (c < 20 ? "Combustible bajo" : "Lista para despegar") + "</p>";
        pantalla.innerHTML = "";
        pantalla.appendChild(t);

        if (enRep && c < 20 && !reto.classList.contains("hecha")) {
            api.sonar("ok");
            api.hecha(reto);
        }
    }

    rep.addEventListener("change", function () { api.sonar("clic"); pintar(); });
    comb.addEventListener("input", pintar);
    pintar();
});

// ---------- Estilos ----------
Motor.al("s-estilos", function (slide, api) {
    var comb = document.getElementById("est-comb");
    var num = document.getElementById("est-num");
    var barra = document.getElementById("est-barra");
    var codigoEl = document.getElementById("est-codigo");

    function pintar() {
        var c = parseInt(comb.value, 10);
        var color = c < 20 ? "#ff6b8b" : "#22d3ee";
        num.textContent = c;
        barra.style.width = c + "%";
        barra.style.backgroundColor = color;
        codigoEl.innerHTML = api.resaltar(
            "<div\n" +
            '    className="barra-relleno"\n' +
            "    style={{\n" +
            "        width: `${combustible}%`,\n" +
            '        backgroundColor: combustible < 20 ? "#ff6b8b" : "#22d3ee"\n' +
            "    }}\n" +
            "></div>"
        );
    }
    comb.addEventListener("input", pintar);
    pintar();
});

Motor.iniciar({ id: "m1-s02-a" });
