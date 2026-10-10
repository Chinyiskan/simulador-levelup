// ============================================================
//  Fondo de estrellas con Three.js
//  Se usa en todas las páginas. Si Three.js no carga (sin internet,
//  CDN caído), la página sigue funcionando con el degradado del CSS.
// ============================================================

var FondoEspacio = (function () {
    var velocidadBase = 0.6;
    var velocidad = velocidadBase;
    var impulso = 0;
    // Quien pide "reducir movimiento" (o entra con ?fondo=off) ve las estrellas quietas
    var QUIETO = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var APAGADO = /[?&]fondo=off/.test(window.location.search);

    function iniciar() {
        var contenedor = document.getElementById("fondo-espacio");
        if (!contenedor || typeof THREE === "undefined" || APAGADO) return;

        var escena = new THREE.Scene();
        var camara = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);
        camara.position.z = 0;

        var render;
        try {
            render = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        } catch (e) {
            return; // equipo sin WebGL: nos quedamos con el degradado
        }
        render.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        render.setSize(window.innerWidth, window.innerHeight);
        contenedor.appendChild(render.domElement);

        // Estrellas repartidas en un tubo alrededor de la cámara.
        // Avanzan hacia nosotros y cuando nos pasan vuelven al fondo.
        var total = 1400;
        var posiciones = new Float32Array(total * 3);
        var colores = new Float32Array(total * 3);
        var paleta = [
            new THREE.Color("#61dafb"),
            new THREE.Color("#ffffff"),
            new THREE.Color("#b794ff"),
            new THREE.Color("#ffd166")
        ];
        for (var i = 0; i < total; i++) {
            posiciones[i * 3] = (Math.random() - 0.5) * 1600;
            posiciones[i * 3 + 1] = (Math.random() - 0.5) * 1000;
            posiciones[i * 3 + 2] = -Math.random() * 2000;
            var c = paleta[Math.random() < 0.7 ? 1 : Math.floor(Math.random() * paleta.length)];
            colores[i * 3] = c.r;
            colores[i * 3 + 1] = c.g;
            colores[i * 3 + 2] = c.b;
        }
        var geometria = new THREE.BufferGeometry();
        geometria.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
        geometria.setAttribute("color", new THREE.BufferAttribute(colores, 3));

        // sizeAttenuation hace que las cercanas se vean más grandes
        var material = new THREE.PointsMaterial({
            size: 2.4,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            sizeAttenuation: true
        });
        var estrellas = new THREE.Points(geometria, material);
        escena.add(estrellas);

        // Un anillo de la estación espacial girando muy despacio al fondo
        var anillo = new THREE.Mesh(
            new THREE.TorusGeometry(260, 6, 6, 48),
            new THREE.MeshBasicMaterial({ color: 0x1b8fb0, wireframe: true, transparent: true, opacity: 0.25 })
        );
        anillo.position.set(420, -180, -900);
        anillo.rotation.x = 1.1;
        escena.add(anillo);

        var mouseX = 0, mouseY = 0;
        window.addEventListener("mousemove", function (e) {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        window.addEventListener("resize", function () {
            camara.aspect = window.innerWidth / window.innerHeight;
            camara.updateProjectionMatrix();
            render.setSize(window.innerWidth, window.innerHeight);
            if (QUIETO) render.render(escena, camara);
        });

        function animar() {
            if (!QUIETO) requestAnimationFrame(animar);
            // El impulso decae solo: así el "salto" al cambiar de slide dura un instante
            impulso = impulso * 0.93;
            velocidad = velocidadBase + impulso;

            var pos = geometria.attributes.position.array;
            for (var i = 0; i < total; i++) {
                pos[i * 3 + 2] += velocidad;
                if (pos[i * 3 + 2] > 0) pos[i * 3 + 2] = -2000;
            }
            geometria.attributes.position.needsUpdate = true;

            anillo.rotation.z += 0.0015;
            camara.position.x += (mouseX * 20 - camara.position.x) * 0.03;
            camara.position.y += (-mouseY * 12 - camara.position.y) * 0.03;
            render.render(escena, camara);
        }
        animar();
    }

    // Lo llama el motor al cambiar de slide para dar sensación de avance
    function saltar() {
        if (QUIETO) return;
        impulso = 28;
    }

    return { iniciar: iniciar, saltar: saltar };
})();

window.addEventListener("DOMContentLoaded", FondoEspacio.iniciar);
