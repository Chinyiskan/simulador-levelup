// ============================================================
//  Misión M1 · Semana 2 — Divide y Vencerás
//  Un solo componente, `Pieza`, que crece paso a paso.
//  Cada Motor.al("id-de-la-slide", ...) se ejecuta la primera vez
//  que el estudiante llega a esa slide.
// ============================================================

var PIEZAS = [
    { id: 1, modelo: "PX-200", nombre: "Propulsor iónico", precio: 450, nota: "Para saltos cortos", agotada: false, popularidad: 90 },
    { id: 2, modelo: "ED-15", nombre: "Escudo deflector", precio: 300, nota: "Absorbe 3 impactos", agotada: true, popularidad: 60 },
    { id: 3, modelo: "CE-8", nombre: "Celda de energía", precio: 80, nota: "Carga rápida", agotada: false, popularidad: 25 }
];
var EXTRA = { id: 4, modelo: "RL-9", nombre: "Radar de alcance", precio: 220, nota: "Alcance de 40 mil km", agotada: false, popularidad: 75 };

// Qué ve la tarjeta según la versión del componente (v1 = solo datos fijos ... v6 = con barra de estilos)
var VERSIONES = {
    1: {},
    2: { modelo: true },
    3: { modelo: true },
    4: { modelo: true, nota: true },
    5: { modelo: true, nota: true, cond: true },
    6: { modelo: true, nota: true, cond: true, barra: true }
};

// Cuando un reto (widget) se resuelve, ejecuta fn (también si ya estaba resuelto)
function alResolver(widget, fn) {
    if (widget.classList.contains("hecha")) { fn(); return; }
    var o = new MutationObserver(function () {
        if (widget.classList.contains("hecha")) { o.disconnect(); fn(); }
    });
    o.observe(widget, { attributes: true, attributeFilter: ["class"] });
}

// Crea una tarjeta como la que pintaría React. f = qué partes tiene (ver VERSIONES)
function crearPieza(d, f) {
    f = f || {};
    var t = document.createElement("article");
    t.className = "pieza-card";
    var h = "";
    if (f.cond && d.agotada) h += '<span class="sello">AGOTADA</span>';
    if (f.modelo) h += '<span class="modelo"></span>';
    h += "<h3></h3>";
    h += '<p class="precio"></p>';
    if (f.nota) h += '<p class="nota-pieza"></p>';
    if (f.cond) h += '<p class="fav"></p>';
    if (f.barra) h += '<div class="barra"><div class="barra-relleno"></div></div>';
    t.innerHTML = h;
    if (f.modelo) t.querySelector(".modelo").textContent = d.modelo;
    t.querySelector("h3").textContent = d.nombre;
    t.querySelector(".precio").textContent = d.precio + " cr";
    if (f.nota) t.querySelector(".nota-pieza").textContent = d.nota || "";
    if (f.cond) {
        var fav = d.popularidad >= 70;
        var p = t.querySelector(".fav");
        p.textContent = fav ? "Más vendida" : "En catálogo";
        p.classList.toggle("normal", !fav);
    }
    if (f.barra) {
        var b = t.querySelector(".barra-relleno");
        b.style.width = d.popularidad + "%";
        b.style.backgroundColor = d.popularidad < 30 ? "#ff6b8b" : "#22d3ee";
    }
    return t;
}

function pintarMenu(cont, lista, f) {
    cont.innerHTML = "";
    lista.forEach(function (d) { cont.appendChild(crearPieza(d, f)); });
}

// ---------- El archivo Pieza.jsx en cada versión ----------
function lineasPieza(v) {
    var L = [];
    var firma = v === 1 ? "function Pieza() {"
        : v === 2 ? "function Pieza(props) {"
        : v === 3 ? "function Pieza({ modelo, nombre, precio }) {"
        : v === 4 ? "function Pieza({ modelo, nombre, precio, children }) {"
        : "function Pieza({ modelo, nombre, precio, agotada, popularidad, children }) {";
    var x = function (campo) { return v === 2 ? "props." + campo : campo; };
    L.push(firma, "    return (", '        <article className="pieza">');
    if (v >= 5) L.push('            {agotada && <span className="sello">AGOTADA</span>}');
    if (v >= 2) L.push('            <span className="modelo">{' + x("modelo") + "}</span>");
    L.push(v === 1 ? "            <h3>Propulsor iónico</h3>" : "            <h3>{" + x("nombre") + "}</h3>");
    L.push(v === 1 ? "            <p>450 cr</p>" : "            <p>{" + x("precio") + "} cr</p>");
    if (v >= 4) L.push('            <p className="nota">{children}</p>');
    if (v >= 5) L.push('            <p>{popularidad >= 70 ? "Más vendida" : "En catálogo"}</p>');
    if (v >= 6) L.push('            <div className="barra">', '                <div', '                    className="barra-relleno"', '                    style={{ width: popularidad + "%" }}', "                />", "            </div>");
    L.push("        </article>", "    );", "}", "", "export default Pieza;");
    return L;
}

// Pinta líneas de código; las que no estaban en la versión anterior se marcan como nuevas
function pintarLineas(api, pre, lineas, previas, opciones) {
    opciones = opciones || {};
    var prev = (previas || []).slice();
    pre.innerHTML = lineas.map(function (l, i) {
        var k = prev.indexOf(l);
        var nueva = k < 0 && l.trim() !== "";
        if (k >= 0) prev.splice(k, 1);
        var clase = (nueva && !opciones.sinNuevas ? "linea-nueva " : "") + (opciones.apagada ? "apagada" : "");
        return '<span class="' + clase.trim() + '">' + api.resaltar(l) + "</span>";
    }).join("\n");
}

function pintarPiezaJsx(api, pre, v, conNuevas) {
    pintarLineas(api, pre, lineasPieza(v), v > 1 ? lineasPieza(v - 1) : [], { sinNuevas: !conNuevas });
}

var APP_LINEAS = [
    "function App() {",
    "    return (",
    "        <main>",
    '            <Pieza modelo="PX-200" nombre="Propulsor iónico" precio={450} />',
    '            <Pieza modelo="ED-15" nombre="Escudo deflector" precio={300} />',
    '            <Pieza modelo="CE-8" nombre="Celda de energía" precio={80} />',
    "        </main>",
    "    );",
    "}"
];

// ---------- Paso 1: armar el componente ----------
Motor.al("s-base", function (slide, api) {
    var w = slide.querySelector(".w-ordenar");
    var cont = document.getElementById("base-pantalla");
    alResolver(w, function () {
        cont.innerHTML = "";
        cont.appendChild(crearPieza({ nombre: "Propulsor iónico", precio: 450 }, VERSIONES[1]));
    });
});

// ---------- Paso 2: la idea de props ----------
Motor.al("s-props-idea", function (slide, api) {
    var btn = document.getElementById("repetir-btn");
    var pantalla = document.getElementById("repetir-pantalla");
    var app = document.getElementById("repetir-app");
    var reto = document.getElementById("reto-repetir");

    var antes = ["// App.jsx (dentro del return)", "<Pieza />", "<Pieza />", "<Pieza />"];
    pintarLineas(api, app, antes, antes, { apagada: true });

    btn.addEventListener("click", function () {
        pantalla.innerHTML = "";
        for (var i = 0; i < 3; i++) pantalla.appendChild(crearPieza({ nombre: "Propulsor iónico", precio: 450 }, VERSIONES[1]));
        pintarLineas(api, app, antes, ["// App.jsx (dentro del return)"]);
        api.sonar("soltar");
        document.getElementById("explica-etiqueta").innerHTML = api.resaltar('<Pieza nombre="Escudo deflector" precio={300} />');
        document.getElementById("explica-objeto").innerHTML = api.resaltar('props = { nombre: "Escudo deflector", precio: 300 }');
        document.getElementById("props-explica").classList.remove("oculto");
        document.getElementById("quiz-props").classList.remove("oculto");
        api.hecha(reto);
    });
});

// ---------- Paso 3: el hijo lee las props ----------
Motor.al("s-props-hijo", function (slide, api) {
    var w = slide.querySelector(".w-huecos");
    var pantalla = document.getElementById("hijo-pantalla");
    alResolver(w, function () {
        pantalla.innerHTML = "";
        for (var i = 0; i < 3; i++) {
            var c = crearPieza({ modelo: "", nombre: "", precio: "" }, VERSIONES[2]);
            c.classList.add("vacia");
            pantalla.appendChild(c);
        }
    });
});

// ---------- Paso 4: el padre manda las props ----------
Motor.al("s-props-padre", function (slide, api) {
    var w = slide.querySelector(".w-clasificar");
    var app = document.getElementById("padre-app");
    var pantalla = document.getElementById("padre-pantalla");
    pintarLineas(api, app, APP_LINEAS, APP_LINEAS, { apagada: true });
    alResolver(w, function () {
        pintarLineas(api, app, APP_LINEAS, ["function App() {", "    return (", "        <main>", "        </main>", "    );", "}"]);
        pintarMenu(pantalla, PIEZAS, VERSIONES[3]);
    });
});

// ---------- Paso 5: destructuring ----------
Motor.al("s-destructuring", function (slide, api) {
    document.getElementById("des-antes").innerHTML = api.resaltar("function Pieza(props) {\n    ...{props.nombre}...\n    ...{props.precio}...");
    document.getElementById("des-despues").innerHTML = api.resaltar("function Pieza({ modelo, nombre, precio }) {\n    ...{nombre}...\n    ...{precio}...");
});

// ---------- Paso 6: children ----------
Motor.al("s-children", function (slide, api) {
    var input = document.getElementById("ch-nota");
    var pantalla = document.getElementById("ch-pantalla");
    var appPre = document.getElementById("ch-app");
    var reto = document.getElementById("reto-ch");
    pintarPiezaJsx(api, document.getElementById("ch-pieza"), 4, true);

    function pintar() {
        var t = input.value;
        pintarLineas(api, appPre, [
            "// App.jsx",
            '<Pieza modelo="PX-200" nombre="Propulsor iónico" precio={450}>',
            "    " + (t || "(escribe tu nota)"),
            "</Pieza>"
        ], ["// App.jsx", '<Pieza modelo="PX-200" nombre="Propulsor iónico" precio={450}>', "</Pieza>"]);
        pantalla.innerHTML = "";
        pantalla.appendChild(crearPieza({ modelo: "PX-200", nombre: "Propulsor iónico", precio: 450, nota: t }, VERSIONES[4]));
        if (t.trim().length >= 3 && !reto.classList.contains("hecha")) {
            api.sonar("ok");
            api.hecha(reto);
            document.getElementById("quiz-children").classList.remove("oculto");
        }
    }
    input.addEventListener("input", pintar);
    pintar();
});

// ---------- Paso 7: .map() ----------
Motor.al("s-map", function (slide, api) {
    var w = slide.querySelector(".w-huecos");
    var arrayEl = document.getElementById("map-array");
    var pantalla = document.getElementById("map-pantalla");
    var agregar = document.getElementById("map-agregar");
    var reto = document.getElementById("reto-map");
    var lista = PIEZAS.slice();
    var usado = false;

    function pintarArray(nuevaId) {
        var lineas = ["// cada pieza también trae modelo, nota, agotada y popularidad", "const piezas = ["];
        lista.forEach(function (n, i) {
            lineas.push('    { id: ' + n.id + ', nombre: "' + n.nombre + '", precio: ' + n.precio + " }" + (i < lista.length - 1 ? "," : ""));
        });
        lineas.push("];");
        arrayEl.innerHTML = lineas.map(function (l) {
            var nueva = nuevaId && l.indexOf("id: " + nuevaId + ",") >= 0;
            return '<span class="' + (nueva ? "linea-nueva" : "") + '">' + api.resaltar(l) + "</span>";
        }).join("\n");
    }
    pintarArray(0);

    alResolver(w, function () {
        pantalla.innerHTML = "";
        var i = 0;
        (function paso() {
            if (i >= lista.length) { agregar.disabled = false; return; }
            pantalla.appendChild(crearPieza(lista[i], VERSIONES[4]));
            api.sonar("soltar");
            i++;
            setTimeout(paso, api.reducido ? 0 : 380);
        })();
    });

    agregar.addEventListener("click", function () {
        if (usado) { api.hablar("Ya agregaste una. Con eso se entiende la idea: el array crece y el componente no se toca.", "tip"); return; }
        usado = true;
        lista.push(EXTRA);
        pintarArray(EXTRA.id);
        pantalla.appendChild(crearPieza(EXTRA, VERSIONES[4]));
        api.sonar("ok");
        api.hecha(reto);
        agregar.disabled = true;
    });
});

// ---------- key: por qué importa ----------
Motor.al("s-key", function (slide, api) {
    var NOTAS = { 1: "Nota: propulsor", 2: "Nota: escudo", 3: "Nota: celda" };
    var CODIGO = ["{piezas.map((pieza) => ("];
    var cont = { con: document.getElementById("key-con"), sin: document.getElementById("key-sin") };
    var veredicto = { con: document.getElementById("key-ver-con"), sin: document.getElementById("key-ver-sin") };
    var vender = document.getElementById("key-vender");
    var reiniciar = document.getElementById("key-reiniciar");
    var reto = document.getElementById("reto-key");
    var quiz = document.getElementById("quiz-key");
    var lista = { con: [], sin: [] };
    var tarjetas = { con: [], sin: [] };

    document.getElementById("key-codigo-con").innerHTML = api.resaltar(CODIGO.concat(["    <Pieza key={pieza.id} nombre={pieza.nombre} />", "))}"]).join("\n"));
    document.getElementById("key-codigo-sin").innerHTML = api.resaltar(CODIGO.concat(["    <Pieza nombre={pieza.nombre} />", "))}"]).join("\n"));

    function crear(n) {
        var t = crearPieza(n, { modelo: true });
        t.style.width = "172px";
        var nota = document.createElement("input");
        nota.type = "text";
        nota.className = "nota-tarjeta";
        nota.value = NOTAS[n.id];
        nota.dataset.dueno = n.id;
        nota.maxLength = 24;
        nota.setAttribute("aria-label", "Nota de la tarjeta");
        t.appendChild(nota);
        return t;
    }

    function empezar() {
        ["con", "sin"].forEach(function (k) {
            lista[k] = PIEZAS.slice();
            cont[k].innerHTML = "";
            tarjetas[k] = lista[k].map(crear);
            tarjetas[k].forEach(function (t) { cont[k].appendChild(t); });
            veredicto[k].textContent = "";
            veredicto[k].className = "key-veredicto";
        });
        vender.disabled = false;
    }

    vender.addEventListener("click", function () {
        // Con key: React sabe cuál tarjeta se va y las demás conservan su nota
        lista.con.shift();
        tarjetas.con.shift().remove();
        veredicto.con.innerHTML = lista.con.map(function (n, i) {
            return "«" + n.nombre + "» conserva «" + tarjetas.con[i].querySelector(".nota-tarjeta").value + "».";
        }).join("<br>");
        veredicto.con.className = "key-veredicto bien";

        // Sin key: React compara por posición, reusa las tarjetas de arriba y quita la última
        lista.sin.shift();
        tarjetas.sin.pop().remove();
        var fallos = [];
        tarjetas.sin.forEach(function (t, i) {
            t.querySelector("h3").textContent = lista.sin[i].nombre;
            t.querySelector(".modelo").textContent = lista.sin[i].modelo;
            t.querySelector(".precio").textContent = lista.sin[i].precio + " cr";
            var nota = t.querySelector(".nota-tarjeta");
            var mala = String(nota.dataset.dueno) !== String(lista.sin[i].id);
            t.classList.toggle("mala", mala);
            if (mala) fallos.push("«" + lista.sin[i].nombre + "» ahora muestra «" + nota.value + "».");
        });
        veredicto.sin.innerHTML = fallos.join("<br>");
        veredicto.sin.className = "key-veredicto mal";

        vender.disabled = true;
        api.sonar("error");
        quiz.classList.remove("oculto");
        reto.classList.add("compacto");
        api.hecha(reto);
    });

    reiniciar.addEventListener("click", function () { empezar(); api.sonar("clic"); });
    empezar();
});

// ---------- Condicionales ----------
Motor.al("s-condicionales", function (slide, api) {
    var agotada = document.getElementById("cond-agotada");
    var pop = document.getElementById("cond-pop");
    var num = document.getElementById("cond-num");
    var codigoEl = document.getElementById("cond-codigo");
    var pantalla = document.getElementById("cond-pantalla");
    var reto = document.getElementById("reto-cond");

    var lineas = [
        '<article className="pieza">',
        '    {agotada && <span className="sello">AGOTADA</span>}',
        '    <span className="modelo">{modelo}</span>',
        "    <h3>{nombre}</h3>",
        "    <p>{precio} cr</p>",
        '    <p>{popularidad >= 70 ? "Más vendida" : "En catálogo"}</p>',
        "</article>"
    ];

    function pintar() {
        var ag = agotada.checked;
        var p = parseInt(pop.value, 10);
        num.textContent = p;

        var html = "";
        lineas.forEach(function (l, i) {
            var clase = "";
            if (i === 1) clase = ag ? "linea-activa" : "apagada";
            if (i === 5) clase = "linea-activa";
            html += '<span class="' + clase + '">' + api.resaltar(l) + "</span>\n";
        });
        codigoEl.innerHTML = html;

        pantalla.innerHTML = "";
        var c = crearPieza({ modelo: "PX-200", nombre: "Propulsor iónico", precio: 450, nota: "", agotada: ag, popularidad: p }, { modelo: true, cond: true });
        c.style.animation = "none";
        pantalla.appendChild(c);

        if (ag && p >= 70 && !reto.classList.contains("hecha")) {
            api.sonar("ok");
            api.hecha(reto);
        }
    }

    agotada.addEventListener("change", function () { api.sonar("clic"); pintar(); });
    pop.addEventListener("input", pintar);
    pintar();
});

// ---------- Estilos ----------
Motor.al("s-estilos", function (slide, api) {
    var pop = document.getElementById("est-pop");
    var num = document.getElementById("est-num");
    var card = document.getElementById("est-card");
    var codigoEl = document.getElementById("est-codigo");

    function pintar() {
        var p = parseInt(pop.value, 10);
        num.textContent = p;
        var nueva = crearPieza({ modelo: "PX-200", nombre: "Propulsor iónico", precio: 450, popularidad: p }, { modelo: true, barra: true });
        card.innerHTML = nueva.innerHTML;
        card.querySelector(".modelo").style.display = "none";
        codigoEl.innerHTML = api.resaltar(
            "<div\n" +
            '    className="barra-relleno"\n' +
            "    style={{\n" +
            '        width: popularidad + "%",\n' +
            '        backgroundColor: popularidad < 30 ? "#ff6b8b" : "#22d3ee"\n' +
            "    }}\n" +
            "/>"
        );
    }
    pop.addEventListener("input", pintar);
    pintar();
});

// ---------- Componente completo ----------
Motor.al("s-completo", function (slide, api) {
    pintarPiezaJsx(api, document.getElementById("completo-codigo"), 6, false);
    pintarMenu(document.getElementById("completo-pantalla"), PIEZAS, VERSIONES[6]);
});

Motor.iniciar({ id: "m1-s02", temporizador: { sugerido: "20–25", alertaDesde: 20 } });
