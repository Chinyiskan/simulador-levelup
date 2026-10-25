// ============================================================
//  Misión M1 · Semana 4 — Listas que Cambian
//  La cola de pedidos del Taller de Nova: agregar, borrar y marcar
//  sin mutar el estado, y estado compartido en el padre.
//  Cada Motor.al("id-de-la-slide", ...) se ejecuta la primera vez
//  que el estudiante llega a esa slide.
// ============================================================

function $(id) { return document.getElementById(id); }

// Pedidos de partida (siempre copias nuevas, igual que haría el estado)
function pedidosBase(n) {
    var base = [
        { id: 1, pieza: "Propulsor iónico", cliente: "Nova", listo: false },
        { id: 2, pieza: "Escudo deflector", cliente: "Kuma", listo: false },
        { id: 3, pieza: "Celda de energía", cliente: "Nova", listo: false }
    ];
    return base.slice(0, n || 3).map(function (p) {
        return { id: p.id, pieza: p.pieza, cliente: p.cliente, listo: p.listo };
    });
}

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

// Pinta una lista de pedidos. opc = { marcar(id), quitar(id), guia(pedido) }
function pintarPedidos(cont, pedidos, opc) {
    opc = opc || {};
    cont.innerHTML = "";
    pedidos.forEach(function (p) {
        var fila = crear("div", "pedido-fila" + (p.listo ? " listo" : ""));
        var txt = crear("span", "pedido-txt");
        txt.appendChild(crear("b", "", p.pieza));
        txt.appendChild(document.createTextNode(" · " + p.cliente));
        fila.appendChild(txt);
        var g = opc.guia ? opc.guia(p) : null;
        if (opc.marcar) {
            var m = crear("button", "boton-tarjeta", p.listo ? "Deshacer" : "Ya está");
            if (g && g.marcar) m.dataset.guia = g.marcar;
            m.addEventListener("click", function () { opc.marcar(p.id); });
            fila.appendChild(m);
        }
        if (opc.quitar) {
            var q = crear("button", "boton-tarjeta sec", "Quitar");
            if (g && g.quitar) q.dataset.guia = g.quitar;
            q.addEventListener("click", function () { opc.quitar(p.id); });
            fila.appendChild(q);
        }
        cont.appendChild(fila);
    });
    if (!pedidos.length) cont.appendChild(crear("p", "lista-vacia", "No hay pedidos"));
    cont.scrollTop = cont.scrollHeight;
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

// ---------- Paso 1: push no repinta ----------
Motor.al("s-push", function (slide, api) {
    var reto = $("reto-pu");
    var consola = $("pu-consola");
    var btn = $("pu-btn");
    var pedidos = pedidosBase(1);   // el array que vive "en el estado"
    var pintado = pedidosBase(1);   // lo que React pintó y no vuelve a pintar
    var clics = 0;

    pintarCodigo(api, $("pu-codigo"), [
        "const [pedidos, setPedidos] = useState([",
        '    { id: 1, pieza: "Propulsor iónico", cliente: "Nova", listo: false },',
        "]);",
        "",
        "function agregarMal() {",
        '    pedidos.push({ id: 2, pieza: "Radar", cliente: "Kuma", listo: false });',
        "    setPedidos(pedidos);",
        "    console.log(pedidos.length);",
        "}"
    ], { 5: "linea-activa", 6: "linea-activa" });
    pintarPedidos($("pu-lista"), pintado);

    btn.addEventListener("click", function () {
        clics++;
        pedidos.push({ id: 2, pieza: "Radar de alcance", cliente: "Kuma", listo: false });
        logEn(consola, "pedidos.length = " + pedidos.length);
        api.sonar("clic");
        if (clics >= 2 && !reto.classList.contains("hecha")) {
            api.hecha(reto);
            reto.classList.add("compacto");
            $("quiz-pu").classList.remove("oculto");
            api.hablar("La consola dice " + pedidos.length + " y la lista sigue con un pedido. Responde la pregunta de abajo.", "oops");
        }
    });
});

// ---------- Paso 2: agregar con spread ----------
Motor.al("s-agregar", function (slide, api) {
    var huecos = slide.querySelector(".w-huecos");
    var reto = $("reto-ag");
    var lista = $("ag-lista");
    var btn = $("ag-btn");
    var pedidos = pedidosBase(1);
    var NUEVOS = [
        { pieza: "Radar de alcance", cliente: "Kuma" },
        { pieza: "Celda de energía", cliente: "Nova" },
        { pieza: "Escudo deflector", cliente: "Kuma" },
        { pieza: "Propulsor iónico", cliente: "Nova" }
    ];
    var n = 0;
    pintarPedidos(lista, pedidos);

    alResolver(huecos, function () {
        reto.classList.remove("oculto");
        $("ag-nota").classList.add("oculto");
        api.hablar("Ya está. Pulsa «Agregar pedido» hasta que la lista tenga 3 pedidos.", "tip");
    });

    btn.addEventListener("click", function () {
        var d = NUEVOS[n % NUEVOS.length];
        n++;
        // Igual que el código de la izquierda: un array nuevo con spread
        pedidos = pedidos.concat([{ id: Date.now() + n, pieza: d.pieza, cliente: d.cliente, listo: false }]);
        pintarPedidos(lista, pedidos);
        api.sonar("soltar");
        if (pedidos.length >= 3 && !reto.classList.contains("hecha")) {
            api.sonar("ok");
            api.hecha(reto);
            reto.classList.add("compacto");
            $("quiz-ag").classList.remove("oculto");
        }
    });
});

// ---------- Paso 3: borrar con filter ----------
Motor.al("s-borrar", function (slide, api) {
    var huecos = slide.querySelector(".w-huecos");
    var reto = $("reto-bo");
    var lista = $("bo-lista");
    var pedidos = pedidosBase(3);
    var hecho = false;

    function pintar() {
        pintarPedidos(lista, pedidos, {
            quitar: quitar,
            guia: function (p) { return p.id === 2 ? { quitar: "pulsa Quitar en Kuma" } : null; }
        });
    }
    function quitar(id) {
        pedidos = pedidos.filter(function (p) { return p.id !== id; });
        pintar();
        api.sonar("soltar");
        if (hecho) return;
        var kuma = pedidos.some(function (p) { return p.id === 2; });
        var otros = pedidos.length === 2 && pedidos.every(function (p) { return p.cliente === "Nova"; });
        if (!kuma && otros) {
            hecho = true;
            api.sonar("ok");
            api.hecha(reto);
            reto.classList.add("compacto");
        } else if (id !== 2) {
            api.retro(reto, "Ese no era el de Kuma. Pulsa Reiniciar lista y quita el Escudo deflector.", "tip");
        } else {
            api.retro(reto, "Quitaste más de un pedido. Pulsa Reiniciar lista y quita solo el de Kuma.", "tip");
        }
    }
    $("bo-reiniciar").addEventListener("click", function () {
        if (hecho) return;
        pedidos = pedidosBase(3);
        pintar();
        api.sonar("clic");
    });
    pintar();

    alResolver(huecos, function () {
        reto.classList.remove("oculto");
        $("bo-nota").classList.add("oculto");
        api.hablar("Ya funciona. Pulsa Quitar en el pedido de Kuma y mira que los otros dos se quedan.", "tip");
    });
});

// ---------- Paso 4: marcar con map ----------
Motor.al("s-marcar", function (slide, api) {
    var huecos = slide.querySelector(".w-huecos");
    var reto = $("reto-ma");
    var lista = $("ma-lista");
    var pedidos = pedidosBase(3);

    function pintar() {
        pintarPedidos(lista, pedidos, {
            marcar: marcar,
            guia: function (p) { return p.id === 1 ? { marcar: "pulsa Ya está" } : null; }
        });
    }
    function marcar(id) {
        // map con un objeto copiado: el pedido buscado se reemplaza, los demás pasan igual
        pedidos = pedidos.map(function (p) {
            return p.id === id ? { id: p.id, pieza: p.pieza, cliente: p.cliente, listo: !p.listo } : p;
        });
        pintar();
        api.sonar("clic");
        var listos = pedidos.filter(function (p) { return p.listo; }).length;
        if (listos >= 2 && !reto.classList.contains("hecha")) {
            api.sonar("ok");
            api.hecha(reto);
            reto.classList.add("compacto");
        }
    }
    pintar();

    alResolver(huecos, function () {
        reto.classList.remove("oculto");
        api.hablar("Ya funciona. Pulsa «Ya está» en dos pedidos y mira cómo se tachan.", "tip");
    });
});

// ---------- Paso 5: valor calculado ----------
Motor.al("s-calculado", function (slide, api) {
    var huecos = slide.querySelector(".w-huecos");
    var lista = $("ca-lista");
    var num = $("ca-num");
    var pedidos = pedidosBase(3);

    function pintar() {
        pintarPedidos(lista, pedidos, { marcar: marcar, guia: function (p) { return p.id === 1 ? { marcar: "pulsa Ya está" } : null; } });
        num.textContent = pedidos.filter(function (p) { return !p.listo; }).length;
    }
    function marcar(id) {
        pedidos = pedidos.map(function (p) {
            return p.id === id ? { id: p.id, pieza: p.pieza, cliente: p.cliente, listo: !p.listo } : p;
        });
        pintar();
        api.sonar("clic");
    }
    pintar();

    alResolver(huecos, function () {
        $("ca-panel").classList.remove("oculto");
        $("ca-nota").classList.add("oculto");
        $("quiz-ca").classList.remove("oculto");
        api.hablar("Listo. Marca pedidos en el panel y mira bajar el contador. Después responde la pregunta de abajo.", "tip");
    });
});

// ---------- Paso 6: cada componente con su estado ----------
Motor.al("s-comparte", function (slide, api) {
    var reto = $("reto-cm");
    var propios = 0;

    pintarCodigo(api, $("cm-codigo"), [
        "function PedidoPieza() {",
        "    const [pedidos, setPedidos] = useState([]);",
        "    function enviar() {",
        "        setPedidos([...pedidos, nuevo]);",
        "    }",
        "}",
        "function ListaPedidos() {",
        "    const [pedidos, setPedidos] = useState([]);",
        "}"
    ], { 1: "linea-activa", 7: "linea-activa" });

    $("cm-pedir").addEventListener("click", function () {
        propios++;
        $("cm-propios").innerHTML = "pedidos.length = <b>" + propios + "</b>";
        api.sonar("soltar");
        if (!reto.classList.contains("hecha")) {
            api.hecha(reto);
            reto.classList.add("compacto");
            $("quiz-cm").classList.remove("oculto");
            api.hablar("El formulario tiene 1 pedido y la lista sigue en 0. Responde la pregunta de abajo.", "oops");
        }
    });
});

// ---------- Paso 7: lifting state up ----------
Motor.al("s-lifting", function (slide, api) {
    var huecos = slide.querySelector(".w-huecos");
    var reto = $("reto-li");
    var lista = $("li-lista");
    var form = $("li-form");
    var pedidos = [];

    pintarPedidos(lista, pedidos);

    alResolver(huecos, function () {
        reto.classList.remove("oculto");
        $("li-nota").classList.add("oculto");
        api.hablar("Conectado. Elige «Radar de alcance», escribe un cliente y pulsa Pedir: la lista ahora sí se entera.", "tip");
    });

    // PedidoPieza avisa con onAgregar; Taller (aquí, esta función) hace el set
    function agregar(pieza, cliente) {
        pedidos = pedidos.concat([{ id: Date.now(), pieza: pieza, cliente: cliente, listo: false }]);
        pintarPedidos(lista, pedidos);
    }
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        var pieza = $("li-pieza").value;
        var cliente = $("li-cliente").value.trim() || "Cadete";
        agregar(pieza, cliente);
        $("li-cliente").value = "";
        api.sonar("soltar");
        if (pieza === "Radar de alcance" && !reto.classList.contains("hecha")) {
            api.sonar("ok");
            api.hecha(reto);
            reto.classList.add("compacto");
        } else if (!reto.classList.contains("hecha")) {
            api.retro(reto, "El pedido se agregó, pero el reto pide Radar de alcance. Elígelo en la lista y pulsa Pedir otra vez.", "tip");
        }
    });
});

// ---------- Componente completo ----------
Motor.al("s-completo", function (slide, api) {
    pintarCodigo(api, $("completo-codigo"), [
        "function Taller() {",
        "    const [pedidos, setPedidos] = useState([]);",
        "    function agregar(pieza, cliente) {",
        "        const nuevo = { id: Date.now(), pieza, cliente, listo: false };",
        "        setPedidos([...pedidos, nuevo]);",
        "    }",
        "    function borrar(id) {",
        "        setPedidos(pedidos.filter((p) => p.id !== id));",
        "    }",
        "    function marcar(id) {",
        "        setPedidos(",
        "            pedidos.map((p) => (p.id === id ? { ...p, listo: !p.listo } : p))",
        "        );",
        "    }",
        "    const pendientes = pedidos.filter((p) => !p.listo).length;",
        "    return (",
        "        <main>",
        "            <PedidoPieza onAgregar={agregar} />",
        "            <ListaPedidos pedidos={pedidos} onMarcar={marcar} onBorrar={borrar} />",
        "        </main>",
        "    );",
        "}"
    ]);

    var pedidos = [];
    var lista = $("co-lista");
    function pintar() {
        pintarPedidos(lista, pedidos, { marcar: marcar, quitar: borrar });
        $("co-num").textContent = pedidos.filter(function (p) { return !p.listo; }).length;
    }
    function borrar(id) {
        pedidos = pedidos.filter(function (p) { return p.id !== id; });
        pintar();
        api.sonar("soltar");
    }
    function marcar(id) {
        pedidos = pedidos.map(function (p) {
            return p.id === id ? { id: p.id, pieza: p.pieza, cliente: p.cliente, listo: !p.listo } : p;
        });
        pintar();
        api.sonar("clic");
    }
    $("co-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var cliente = $("co-cliente").value.trim() || "Cadete";
        pedidos = pedidos.concat([{ id: Date.now(), pieza: $("co-pieza").value, cliente: cliente, listo: false }]);
        $("co-cliente").value = "";
        pintar();
        api.sonar("soltar");
    });
    pintar();
});

Motor.iniciar({ id: "m1-s04", temporizador: { sugerido: "20–25", alertaDesde: 20 } });
