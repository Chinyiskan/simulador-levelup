// ============================================================
//  Misión M1 · Semana 3 — Interfaces que Cobran Vida
//  El catálogo del Taller de Nova (la tarjeta `Pieza` de la semana 2)
//  aprende a reaccionar: eventos, estado, inputs y formularios.
//  Cada Motor.al("id-de-la-slide", ...) se ejecuta la primera vez
//  que el estudiante llega a esa slide.
// ============================================================

var PIEZAS = [
    { id: 1, nombre: "Propulsor iónico", precio: 450 },
    { id: 2, nombre: "Escudo deflector", precio: 300 },
    { id: 3, nombre: "Celda de energía", precio: 80 },
    { id: 4, nombre: "Radar de alcance", precio: 220 }
];

function $(id) { return document.getElementById(id); }

// Cuando un reto (widget) se resuelve, ejecuta fn (también si ya estaba resuelto)
function alResolver(widget, fn) {
    if (widget.classList.contains("hecha")) { fn(); return; }
    var o = new MutationObserver(function () {
        if (widget.classList.contains("hecha")) { o.disconnect(); fn(); }
    });
    o.observe(widget, { attributes: true, attributeFilter: ["class"] });
}

// Crea un elemento con clase y texto
function crear(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto !== undefined) n.textContent = texto;
    return n;
}

// Escribe una línea en una consola falsa
function logEn(consola, texto) {
    var d = crear("div", "log nuevo", texto);
    consola.appendChild(d);
    consola.scrollTop = consola.scrollHeight;
    setTimeout(function () { d.classList.remove("nuevo"); }, 500);
}

// Pinta código línea por línea. marcas = { índice: "clase" }
function pintarCodigo(api, pre, lineas, marcas) {
    marcas = marcas || {};
    pre.innerHTML = lineas.map(function (l, i) {
        return '<span class="' + (marcas[i] || "") + '">' + api.resaltar(l) + "</span>";
    }).join("\n");
}

function sacudir(nodo) {
    nodo.classList.remove("temblar");
    void nodo.offsetWidth;
    nodo.classList.add("temblar");
}

// Vuelve a encender el globito amarillo sobre un control ya usado, con otro texto
function reguiar(nodo, texto) {
    nodo.dataset.guia = texto;
    nodo.removeAttribute("data-usado");
}

// Tarjeta básica: nombre y precio
function tarjetaBase(d) {
    var t = crear("article", "pieza-card");
    t.appendChild(crear("h3", "", d.nombre));
    t.appendChild(crear("p", "", d.precio + " cr"));
    return t;
}

// ---------- Tutorial ----------
Motor.al("s-tutorial", function (slide, api) {
    var btn = $("tut-btn");
    var reto = $("reto-tut-1");
    btn.addEventListener("click", function () {
        api.sonar("ok");
        api.hecha(reto);
        btn.disabled = true;
    });
});

// ---------- Paso 1: eventos ----------
Motor.al("s-eventos", function (slide, api) {
    var pantalla = $("ev-pantalla");
    var consola = $("ev-consola");
    var reto = $("reto-ev-1");
    var huecos = $("huecos-eventos");
    var conectado = false;

    var t = tarjetaBase(PIEZAS[0]);
    t.classList.add("fila");
    var btn = crear("button", "boton-tarjeta", "Agregar");
    btn.dataset.guia = "pulsa Agregar";
    t.appendChild(btn);
    pantalla.appendChild(t);

    btn.addEventListener("click", function () {
        if (conectado) {
            logEn(consola, "Agregado: Propulsor iónico");
            api.sonar("soltar");
            return;
        }
        api.sonar("clic");
        sacudir(t);
        if (reto.classList.contains("hecha")) return;
        api.hecha(reto);
        setTimeout(function () {
            $("codigo-sin-evento").classList.add("oculto");
            huecos.classList.remove("oculto");
            api.hablar("No pasó nada: la consola sigue vacía porque el botón no tiene ningún evento. Completa los dos huecos de la izquierda para conectarlo.", "idea");
        }, 650);
    });

    alResolver(huecos, function () {
        conectado = true;
        api.sonar("ok");
        reguiar(btn, "pulsa Agregar");
    });
});

// ---------- Paso 1b: sin paréntesis ----------
Motor.al("s-parentesis", function (slide, api) {
    var reto = $("reto-par");
    var cargar = $("par-cargar");
    var usados = { a: false, b: false };
    var cargada = false;
    var avisado = false;

    var base = ["function agregar() {", '    console.log("Agregado");', "}"];
    pintarCodigo(api, $("par-codigo-a"), base.concat(["<button onClick={agregar}>Agregar</button>"]), { 3: "linea-activa" });
    pintarCodigo(api, $("par-codigo-b"), base.concat(["<button onClick={agregar()}>Agregar</button>"]), { 3: "linea-activa" });

    function revisar() {
        if (cargada && usados.a && usados.b && !reto.classList.contains("hecha")) {
            api.sonar("ok");
            api.hecha(reto);
        }
    }

    function montar(lado) {
        var cuerpo = $("par-" + lado);
        var consola = $("par-consola-" + lado);
        cuerpo.innerHTML = "";
        consola.innerHTML = "";
        var b = crear("button", "boton-tarjeta", "Agregar");
        b.dataset.guia = lado === "a" ? "2 · pulsa Agregar" : "3 · pulsa Agregar";
        var t = crear("article", "pieza-card");
        t.appendChild(crear("h3", "", "Propulsor iónico"));
        t.appendChild(b);
        cuerpo.appendChild(t);
        // Con paréntesis, agregar() se ejecuta mientras React pinta el botón
        if (lado === "b") setTimeout(function () { logEn(consola, "Agregado"); api.sonar("error"); }, 250);
        b.addEventListener("click", function () {
            usados[lado] = true;
            if (lado === "a") { logEn(consola, "Agregado"); api.sonar("soltar"); }
            else { sacudir(t); api.sonar("clic"); }   // onClick recibió undefined: el clic no hace nada
            revisar();
        });
    }

    cargar.addEventListener("click", function () {
        cargada = true;
        usados = { a: false, b: false };
        montar("a");
        montar("b");
        cargar.textContent = "Recargar la página";
        if (!avisado) {
            avisado = true;
            api.hablar("Mira la consola de la derecha: dice «Agregado» y nadie ha hecho clic. Ahora pulsa Agregar en las dos versiones y compara.", "advertencia");
        }
    });
});

// ---------- Paso 2: una variable normal ----------
Motor.al("s-variable", function (slide, api) {
    var reto = $("reto-var");
    var consola = $("var-consola");
    var clics = 0;
    var lineas = [
        "function Pieza({ nombre }) {",
        "    let cantidad = 0;",
        "    function agregar() {",
        "        cantidad = cantidad + 1;",
        "        console.log(cantidad);",
        "    }",
        "    return (",
        '        <article className="pieza">',
        "            <h3>{nombre}</h3>",
        "            <p>En el carrito: {cantidad}</p>",
        "            <button onClick={agregar}>+1</button>",
        "        </article>",
        "    );",
        "}"
    ];
    pintarCodigo(api, $("var-codigo"), lineas, { 1: "linea-activa" });

    var t = crear("article", "pieza-card fila");
    t.appendChild(crear("h3", "", "Propulsor iónico"));
    var p = crear("p", "carrito");
    p.innerHTML = "En el carrito: <b>0</b>";
    t.appendChild(p);
    var btn = crear("button", "boton-tarjeta", "+1");
    btn.dataset.guia = "pulsa +1 tres veces";
    t.appendChild(btn);
    $("var-pantalla").appendChild(t);

    btn.addEventListener("click", function () {
        clics++;
        logEn(consola, String(clics));
        pintarCodigo(api, $("var-codigo"), lineas, { 3: "ejecutada", 4: "ejecutada" });
        api.sonar("clic");
        if (clics >= 3 && !reto.classList.contains("hecha")) {
            api.hecha(reto);
            reto.classList.add("compacto");
            $("quiz-var").classList.remove("oculto");
            api.hablar("La consola cuenta 1, 2, 3, pero la tarjeta sigue en 0. Responde la pregunta de abajo.", "oops");
        }
    });
});

// ---------- Paso 3: useState ----------
Motor.al("s-usestate", function (slide, api) {
    var huecos = slide.querySelector(".w-huecos");
    var reto = $("reto-us");
    var pantalla = $("us-pantalla");
    var cantidad = 0;
    var pintados = 1;

    alResolver(huecos, function () {
        reto.classList.remove("oculto");
        var t = crear("article", "pieza-card fila");
        var badge = crear("span", "pintados", "pintado n.º 1");
        t.appendChild(badge);
        t.appendChild(crear("h3", "", "Propulsor iónico"));
        var p = crear("p", "carrito");
        p.innerHTML = "En el carrito: <b>0</b>";
        t.appendChild(p);
        var btn = crear("button", "boton-tarjeta", "+1");
        btn.dataset.guia = "pulsa +1";
        t.appendChild(btn);
        pantalla.appendChild(t);
        api.hablar("Ya está. Ahora pulsa +1 en la tarjeta hasta 3. Fíjate en la etiqueta morada: cuenta cuántas veces React volvió a pintar `Pieza`.", "tip");

        btn.addEventListener("click", function () {
            cantidad++;
            pintados++;
            p.querySelector("b").textContent = cantidad;
            badge.textContent = "pintado n.º " + pintados;
            badge.classList.remove("flash"); void badge.offsetWidth; badge.classList.add("flash");
            t.classList.remove("repinta"); void t.offsetWidth; t.classList.add("repinta");
            api.sonar("soltar");
            if (cantidad >= 3 && !reto.classList.contains("hecha")) { api.sonar("ok"); api.hecha(reto); reto.classList.add("compacto"); }
        });
    });
});

// ---------- Paso 4: booleano ----------
Motor.al("s-toggle", function (slide, api) {
    var reto = $("reto-tg");
    var estado = $("tg-estado");
    var reservada = false;
    var fueTrue = false;
    var lineas = [
        "const [reservada, setReservada] = useState(false);",
        "",
        "return (",
        '    <article className="pieza">',
        '        {reservada && <span className="sello">RESERVADA</span>}',
        "        <h3>{nombre}</h3>",
        "        <button onClick={() => setReservada(!reservada)}>",
        '            {reservada ? "Cancelar reserva" : "Reservar"}',
        "        </button>",
        "    </article>",
        ");"
    ];

    var t = crear("article", "pieza-card fila");
    var sello = crear("span", "sello oculto", "RESERVADA");
    t.appendChild(sello);
    t.appendChild(crear("h3", "", "Escudo deflector"));
    t.appendChild(crear("p", "", "300 cr"));
    var btn = crear("button", "boton-tarjeta", "Reservar");
    btn.dataset.guia = "1 · pulsa Reservar";
    t.appendChild(btn);
    $("tg-pantalla").appendChild(t);

    function pintar(cambio) {
        pintarCodigo(api, $("tg-codigo"), lineas, { 4: reservada ? "linea-activa" : "apagada", 6: cambio ? "ejecutada" : "", 7: "linea-activa" });
        estado.innerHTML = "reservada = <b class=\"" + (reservada ? "true" : "") + (cambio ? " cambio" : "") + "\">" + reservada + "</b>";
        sello.classList.toggle("oculto", !reservada);
        btn.textContent = reservada ? "Cancelar reserva" : "Reservar";
        btn.classList.toggle("sec", reservada);
    }
    pintar(false);

    btn.addEventListener("click", function () {
        reservada = !reservada;
        pintar(true);
        api.sonar("clic");
        if (reservada) { fueTrue = true; reguiar(btn, "2 · pulsa Cancelar reserva"); }
        if (fueTrue && !reservada && !reto.classList.contains("hecha")) {
            api.sonar("ok");
            api.hecha(reto);
            reto.classList.add("compacto");
            $("quiz-tg").classList.remove("oculto");
        }
    });
});

// ---------- Paso 5: un estado por copia ----------
Motor.al("s-copias", function (slide, api) {
    var reto = $("reto-cp");
    var pantalla = $("cp-pantalla");
    var META = [2, 1, 0];
    var cuentas = [0, 0, 0];
    var avisoPasado = false;
    pintarCodigo(api, $("cp-codigo"), [
        "function App() {",
        "    return (",
        "        <main>",
        '            <Pieza nombre="Propulsor iónico" />',
        '            <Pieza nombre="Escudo deflector" />',
        '            <Pieza nombre="Celda de energía" />',
        "        </main>",
        "    );",
        "}"
    ]);

    var numeros = [];
    PIEZAS.slice(0, 3).forEach(function (d, i) {
        var t = crear("article", "pieza-card");
        t.style.width = "150px";
        t.appendChild(crear("h3", "", d.nombre));
        var p = crear("p", "carrito");
        p.innerHTML = "En el carrito: <b>0</b>";
        t.appendChild(p);
        var btn = crear("button", "boton-tarjeta", "+1");
        if (i === 0) btn.dataset.guia = "pulsa +1 aquí";
        t.appendChild(btn);
        pantalla.appendChild(t);
        numeros.push(p.querySelector("b"));
        btn.addEventListener("click", function () {
            if (reto.classList.contains("hecha")) { cuentas[i]++; numeros[i].textContent = cuentas[i]; return; }
            cuentas[i]++;
            numeros[i].textContent = cuentas[i];
            api.sonar("soltar");
            t.classList.remove("repinta"); void t.offsetWidth; t.classList.add("repinta");
            revisar();
        });
    });

    function revisar() {
        if (cuentas.every(function (c, i) { return c === META[i]; })) {
            api.sonar("ok");
            api.hecha(reto);
            reto.classList.add("compacto");
            var pe = slide.querySelector(".props-estado"); if (pe) pe.classList.add("oculto");
            $("quiz-cp").classList.remove("oculto");
            return;
        }
        var pasado = cuentas.some(function (c, i) { return c > META[i]; });
        if (pasado && !avisoPasado) {
            avisoPasado = true;
            api.retro(reto, "Te pasaste en una tarjeta. Pulsa Reiniciar y vuelve a contar: 2 en el propulsor, 1 en el escudo y 0 en la celda.", "oops");
        }
    }

    $("cp-reiniciar").addEventListener("click", function () {
        cuentas = [0, 0, 0];
        numeros.forEach(function (n) { n.textContent = "0"; });
        avisoPasado = false;
        api.sonar("clic");
    });
});

// ---------- Paso 6: input controlado ----------
Motor.al("s-input", function (slide, api) {
    var huecos = slide.querySelector(".w-huecos");
    var reto = $("reto-in");
    var input = $("in-buscador");
    var lista = $("in-lista");
    var pasos = Array.prototype.slice.call(document.querySelectorAll("#in-ciclo li"));
    var timers = [];

    function pintarLista() {
        var b = input.value.toLowerCase();
        var visibles = PIEZAS.filter(function (p) { return p.nombre.toLowerCase().includes(b); });
        lista.innerHTML = "";
        visibles.forEach(function (p) {
            var f = crear("div", "fila-pieza", p.nombre);
            f.appendChild(crear("span", "", p.precio + " cr"));
            lista.appendChild(f);
        });
        if (!visibles.length) lista.appendChild(crear("p", "lista-vacia", "Ninguna pieza coincide"));
        return visibles;
    }

    function animarCiclo() {
        timers.forEach(clearTimeout);
        timers = [];
        pasos.forEach(function (li) { li.classList.remove("encendido"); });
        if (api.reducido) { pasos.forEach(function (li) { li.classList.add("encendido"); }); return; }
        pasos.forEach(function (li, i) {
            timers.push(setTimeout(function () { li.classList.add("encendido"); }, i * 90));
            timers.push(setTimeout(function () { li.classList.remove("encendido"); }, 900 + i * 60));
        });
    }

    alResolver(huecos, function () {
        reto.classList.remove("oculto");
        pintarLista();
        api.hablar("El input ya está conectado al estado. Escribe «celda» en el buscador de la derecha y mira la fila de pasos: se repite con cada tecla.", "tip");
    });

    input.addEventListener("input", function () {
        var visibles = pintarLista();
        animarCiclo();
        if (input.value.trim().toLowerCase() === "celda" && visibles.length === 1 && !reto.classList.contains("hecha")) {
            api.sonar("ok");
            api.hecha(reto);
        }
    });
});

// ---------- Paso 6b: input congelado ----------
Motor.al("s-congelado", function (slide, api) {
    var reto = $("reto-cg");
    var b = $("cg-b");
    var intentos = 0;
    pintarCodigo(api, $("cg-codigo-a"), [
        'const [texto, setTexto] = useState("");',
        "",
        "<input",
        "    value={texto}",
        "    onChange={(e) => setTexto(e.target.value)}",
        "/>"
    ], { 4: "linea-activa" });
    pintarCodigo(api, $("cg-codigo-b"), [
        'const [texto, setTexto] = useState("");',
        "",
        "<input value={texto} />"
    ], { 2: "linea-activa" });

    // Igual que en React: el input muestra el estado, y el estado nunca cambia
    $("cg-consola").classList.remove("oculto");
    b.addEventListener("input", function () {
        b.value = "";
        intentos++;
        sacudir(b);
        api.sonar("error");
        if (intentos >= 2 && !reto.classList.contains("hecha")) api.hecha(reto);
    });
});

// ---------- Paso 7: formulario ----------
Motor.al("s-form", function (slide, api) {
    var reto = $("reto-fm");
    var form = $("fm-form");
    var input = $("fm-nombre");
    var boton = $("fm-boton");
    var error = $("fm-error");
    var ok = $("fm-ok");
    var vioError = false;
    var enviado = false;
    var lineas = [
        'const [cliente, setCliente] = useState("");',
        'const [error, setError] = useState("");',
        "const [enviado, setEnviado] = useState(false);",
        "",
        "function enviar(e) {",
        "    e.preventDefault();",
        "    if (cliente.trim().length < 3) {",
        '        setError("El nombre necesita 3 letras o más.");',
        "        return;",
        "    }",
        '    setError("");',
        "    setEnviado(true);",
        "}",
        "",
        "<form onSubmit={enviar}>",
        "    <input",
        "        value={cliente}",
        "        onChange={(e) => setCliente(e.target.value)}",
        "    />",
        '    <button disabled={cliente === ""}>Pedir</button>',
        '    {error !== "" && <p>{error}</p>}',
        "    {enviado && <p>Pedido de {cliente} recibido</p>}",
        "</form>"
    ];
    var pre = $("fm-codigo");
    pintarCodigo(api, pre, lineas);

    function marcar(indices) {
        var m = {};
        indices.forEach(function (i) { m[i] = "ejecutada"; });
        pintarCodigo(api, pre, lineas, m);
    }

    input.addEventListener("input", function () {
        boton.disabled = input.value === "";
        if (enviado) ok.textContent = "Pedido de " + input.value + " recibido";
        marcar([16, 17, 19]);
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (boton.disabled) return;
        if (input.value.trim().length < 3) {
            error.textContent = "El nombre necesita 3 letras o más.";
            error.classList.remove("oculto");
            marcar([5, 6, 7, 8, 20]);
            api.sonar("error");
            if (!vioError) {
                vioError = true;
                reguiar(input, "3 · escribe 3 letras o más");
                reguiar(boton, "4 · pulsa Pedir");
                api.hablar("Ahí está el error: el `if` encontró menos de 3 letras, guardó el mensaje en `error` y cortó con `return`. Ahora escribe un nombre de 3 letras o más.", "oops");
            }
            return;
        }
        error.textContent = "";
        error.classList.add("oculto");
        enviado = true;
        ok.textContent = "Pedido de " + input.value + " recibido";
        ok.classList.remove("oculto");
        marcar([5, 6, 10, 11, 21]);
        api.sonar("ok");
        if (vioError) {
            if (!reto.classList.contains("hecha")) api.hecha(reto);
        } else {
            reguiar(input, "1 · escribe una sola letra");
            reguiar(boton, "2 · pulsa Pedir");
            api.hablar("Pasó la validación. Ahora mira el otro camino: borra el nombre, escribe una sola letra y pulsa Pedir.", "tip");
        }
    });
});

// ---------- Paso 8: el set no es instantáneo ----------
Motor.al("s-set", function (slide, api) {
    var reto = $("reto-st");
    var nombre = $("st-nombre");
    var consola = $("st-consola");
    var cliente = "Nova";
    var lineas = [
        'const [cliente, setCliente] = useState("Nova");',
        "",
        "function cambiar() {",
        '    setCliente("Kuma");',
        "    console.log(cliente);",
        "}",
        "",
        "<p>Cliente: {cliente}</p>",
        "<button onClick={cambiar}>Cambiar a Kuma</button>"
    ];
    pintarCodigo(api, $("st-codigo"), lineas);

    $("st-boton").addEventListener("click", function () {
        pintarCodigo(api, $("st-codigo"), lineas, { 3: "ejecutada", 4: "ejecutada" });
        // La función usa el valor con el que empezó; el nuevo llega en el siguiente pintado
        logEn(consola, cliente);
        cliente = "Kuma";
        setTimeout(function () {
            nombre.textContent = cliente;
            nombre.classList.remove("cambio"); void nombre.offsetWidth; nombre.classList.add("cambio");
            api.sonar("soltar");
        }, 300);
        if (!reto.classList.contains("hecha")) {
            api.hecha(reto);
            $("st-tiempo").classList.remove("oculto");
            reto.classList.add("compacto");
            $("quiz-st").classList.remove("oculto");
        }
    });
});

// ---------- Paso 9: índice ----------
Motor.al("s-indice", function (slide, api) {
    var reto = $("reto-ix");
    var huecos = $("huecos-ix");
    var vitrina = $("ix-vitrina");
    var texto = $("ix-indice");
    var sig = $("ix-siguiente");
    var ant = $("ix-anterior");
    var indice = 0;
    var arreglado = false;
    var pre = $("ix-codigo");
    var lineasRoto = [
        "const [indice, setIndice] = useState(0);",
        "const pieza = piezas[indice];   // 4 piezas: posiciones 0 a 3",
        "",
        "function siguiente() {",
        "    setIndice(indice + 1);",
        "}",
        "",
        "<h3>{pieza.nombre}</h3>"
    ];
    pintarCodigo(api, pre, lineasRoto, { 4: "linea-activa" });
    ant.disabled = true;
    ant.title = "Primero arregla siguiente";

    function pintar() {
        texto.textContent = "indice = " + indice;
        vitrina.innerHTML = "";
        var d = PIEZAS[indice];
        if (!d) {
            vitrina.appendChild(crear("div", "vitrina-rota", "La app se rompió: pantalla en blanco"));
            $("ix-consola").classList.remove("oculto");
            return;
        }
        var t = tarjetaBase(d);
        t.appendChild(crear("p", "", "Pieza " + (indice + 1) + " de " + PIEZAS.length));
        vitrina.appendChild(t);
    }
    pintar();

    sig.addEventListener("click", function () {
        if (!arreglado) {
            if (!PIEZAS[indice]) return;
            indice = indice + 1;
            pintar();
            api.sonar(PIEZAS[indice] ? "clic" : "error");
            if (!PIEZAS[indice] && !reto.classList.contains("hecha")) {
                sig.disabled = true;
                api.hecha(reto);
                setTimeout(function () {
                    pintarCodigo(api, pre, lineasRoto.slice(0, 2));
                    huecos.classList.remove("oculto");
                    api.hablar("Se rompió: `piezas[4]` no existe, porque el array va de 0 a 3. Arregla `siguiente` para que desde la última pieza vuelva a la primera.", "oops");
                }, 600);
            }
            return;
        }
        indice = indice === PIEZAS.length - 1 ? 0 : indice + 1;
        pintar();
        api.sonar("clic");
    });
    ant.addEventListener("click", function () {
        indice = indice === 0 ? PIEZAS.length - 1 : indice - 1;
        pintar();
        api.sonar("clic");
    });

    alResolver(huecos, function () {
        arreglado = true;
        indice = 0;
        $("ix-consola").classList.add("oculto");
        sig.disabled = false;
        ant.disabled = false;
        ant.title = "";
        pintar();
    });
});

// ---------- Componente completo ----------
Motor.al("s-completo", function (slide, api) {
    pintarCodigo(api, $("completo-codigo"), [
        'import { useState } from "react";',
        "",
        "function Pieza({ nombre, precio }) {",
        "    const [cantidad, setCantidad] = useState(0);",
        "    const [reservada, setReservada] = useState(false);",
        "",
        "    return (",
        '        <article className="pieza">',
        '            {reservada && <span className="sello">RESERVADA</span>}',
        "            <h3>{nombre}</h3>",
        "            <p>{precio} cr · En el carrito: {cantidad}</p>",
        "            <button onClick={() => setCantidad(cantidad + 1)}>+1</button>",
        "            <button onClick={() => setReservada(!reservada)}>",
        '                {reservada ? "Cancelar reserva" : "Reservar"}',
        "            </button>",
        "        </article>",
        "    );",
        "}",
        "",
        "export default Pieza;"
    ]);

    var cont = $("completo-pantalla");
    var buscador = $("completo-buscador");
    var estados = {};   // estado de cada Pieza montada, por id

    function tarjeta(d) {
        var e = estados[d.id] || (estados[d.id] = { cantidad: 0, reservada: false });
        var t = crear("article", "pieza-card");
        var sello = crear("span", "sello" + (e.reservada ? "" : " oculto"), "RESERVADA");
        t.appendChild(sello);
        t.appendChild(crear("h3", "", d.nombre));
        var p = crear("p", "carrito");
        p.innerHTML = d.precio + " cr · En el carrito: <b>" + e.cantidad + "</b>";
        t.appendChild(p);
        var fila = crear("div", "botones-tarjeta");
        var mas = crear("button", "boton-tarjeta", "+1");
        var res = crear("button", "boton-tarjeta" + (e.reservada ? " sec" : ""), e.reservada ? "Cancelar reserva" : "Reservar");
        fila.appendChild(mas);
        fila.appendChild(res);
        t.appendChild(fila);
        mas.addEventListener("click", function () { e.cantidad++; p.querySelector("b").textContent = e.cantidad; api.sonar("soltar"); });
        res.addEventListener("click", function () {
            e.reservada = !e.reservada;
            sello.classList.toggle("oculto", !e.reservada);
            res.textContent = e.reservada ? "Cancelar reserva" : "Reservar";
            res.classList.toggle("sec", e.reservada);
            api.sonar("clic");
        });
        return t;
    }

    function pintar() {
        var b = buscador.value.toLowerCase();
        var visibles = PIEZAS.filter(function (p) { return p.nombre.toLowerCase().includes(b); });
        // Igual que en React: una Pieza que sale de la lista se desmonta y pierde su estado
        Object.keys(estados).forEach(function (id) {
            if (!visibles.some(function (v) { return String(v.id) === id; })) delete estados[id];
        });
        cont.innerHTML = "";
        visibles.forEach(function (d) { cont.appendChild(tarjeta(d)); });
        if (!visibles.length) cont.appendChild(crear("p", "lista-vacia", "Ninguna pieza coincide"));
    }
    buscador.addEventListener("input", pintar);
    pintar();
});

Motor.iniciar({ id: "m1-s03", temporizador: { sugerido: "20–25", alertaDesde: 20 } });
