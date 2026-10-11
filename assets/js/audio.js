// ============================================================
//  Sonido — efectos y música de fondo del Simulador
//
//  Efectos:  assets/sfx/*.mp3. Si un archivo falta, el motor usa
//            los tonos sintetizados de motor.js.
//  Música:   assets/audio/*.mp3. Dos pistas que cambian según la
//            slide. Como las dos terminan con fade-out, cada pista
//            se repite mezclando su final con su inicio (cruce).
//
//  Los navegadores no dejan sonar nada hasta que la persona hace
//  clic o pulsa una tecla, así que la música arranca en la primera
//  interacción.
// ============================================================

var Sonido = (function () {

    var EFECTOS = {
        clic:      { archivo: "ui-click.mp3",      vol: 1.0 },
        coger:     { archivo: "drag-pick.mp3",     vol: 0.7 },
        soltar:    { archivo: "drag-drop.mp3",     vol: 0.7 },
        avance:    { archivo: "join.mp3",          vol: 0.7 },
        comprobar: { archivo: "submit.mp3",        vol: 0.8 },
        ok:        { archivo: "correct.mp3",       vol: 0.9 },
        error:     { archivo: "wrong.mp3",         vol: 1.0 },
        parcial:   { archivo: "partial.mp3",       vol: 1.0 },
        logro:     { archivo: "streak.mp3",        vol: 0.7 },
        final:     { archivo: "podium-reveal.mp3", vol: 0.6 },
        confeti:   { archivo: "confetti.mp3",      vol: 0.55 }
    };

    // Cada categoría puede tener varias pistas: al terminar una pasa a la siguiente (mezclándolas).
    // Para agregar música: copia el .mp3 a assets/audio/ y suma su nombre a la lista.
    var PISTAS = {
        lofi: { archivos: ["hangar-lofi.mp3"] },
        reto: { archivos: ["hangar-reto.mp3"] }
    };

    // La música arranca apagada: en una llamada de Meet, sin audífonos, se cuela por el micrófono.
    // Cada estudiante la enciende con el botón de música (o el de la portada). Cambia a true para que arranque sola.
    var MUSICA_POR_DEFECTO = false;

    var CRUCE = 4;        // segundos que se mezclan el final y el inicio de una pista
    var FADE = 1.5;       // segundos que tarda en cambiar de una pista a otra
    var PASO = 50;        // milisegundos entre ajustes de volumen
    var VOL_MAX = 0.5;    // el deslizador llega hasta aquí (las pistas ya vienen fuertes)

    var raiz = "";
    var silencio = leerLocal("simulador-silencio") === "1";
    var musicaOn = leerLocal("simulador-musica") === null ? MUSICA_POR_DEFECTO : leerLocal("simulador-musica") === "1";
    var volumen = leerNumero("simulador-vol-musica", 0.14);
    var desbloqueado = false;
    var oculta = false;
    var deseada = null;
    var pistas = {};
    var reloj = null;
    var iniciado = false;

    // localStorage puede fallar (modo privado, bloqueado): siempre con try/catch
    function leerLocal(clave) {
        try { return window.localStorage.getItem(clave); } catch (e) { return null; }
    }
    function guardarLocal(clave, valor) {
        try { window.localStorage.setItem(clave, valor); } catch (e) { }
    }
    function leerNumero(clave, defecto) {
        var n = parseFloat(leerLocal(clave));
        return isFinite(n) ? Math.max(0, Math.min(VOL_MAX, n)) : defecto;
    }
    function entre01(x) { return Math.max(0, Math.min(1, x)); }

    function reproducir(a, alFallar) {
        try {
            var p = a.play();
            if (p && p.catch) p.catch(function (err) {
                // Si el navegador solo bloqueó el autoplay no pasa nada; si el archivo no sirve, avisamos
                if (alFallar && err && err.name !== "NotAllowedError" && err.name !== "AbortError") alFallar();
            });
        } catch (e) { if (alFallar) alFallar(); }
    }

    // ---------------- Efectos ----------------
    function precargar() {
        Object.keys(EFECTOS).forEach(function (nombre) {
            var e = EFECTOS[nombre];
            var a = new Audio(raiz + "assets/sfx/" + e.archivo);
            a.preload = "auto";
            a.addEventListener("error", function () { e.roto = true; });
            e.audio = a;
        });
    }

    // Devuelve true si se intentó reproducir el archivo; false para que el motor use el tono sintetizado.
    // "respaldo" se llama si el navegador rechaza el archivo al reproducirlo.
    function efecto(nombre, respaldo) {
        var e = EFECTOS[nombre];
        if (!e || !e.audio || e.roto) return false;
        try {
            var copia = e.audio.cloneNode();
            copia.volume = e.vol;
            reproducir(copia, respaldo);
            return true;
        } catch (err) { return false; }
    }

    // ---------------- Música ----------------
    // Cada pista usa dos <audio>: uno suena y, cuando le quedan CRUCE segundos,
    // el otro arranca desde cero y se mezclan.
    function Pista(cfg) {
        var self = this;
        this.nivel = 0;       // 0..1: sube o baja al cambiar de pista
        this.meta = 0;
        this.act = 0;         // elemento que suena "de frente"
        this.f = [1, 0];      // volumen interno de cada elemento
        this.roto = false;
        this.precargado = false;
        this.archivos = (cfg.archivos || [cfg.archivo]).slice();
        this.i = Math.floor(Math.random() * this.archivos.length);   // cada sesión arranca por una distinta
        this.el = [0, 1].map(function () {
            var a = new Audio();
            a.preload = "none";
            a.addEventListener("error", function () {
                // Un archivo que no carga se saca de la lista; solo si no queda ninguno la pista se da por rota
                var nombre = a.dataset.archivo;
                var k = self.archivos.indexOf(nombre);
                if (self.archivos.length > 1 && k >= 0) {
                    self.archivos.splice(k, 1);
                    self.i = self.i % self.archivos.length;
                    a.dataset.archivo = "";
                    a.removeAttribute("src");
                } else self.roto = true;
            });
            return a;
        });
        this.poner(this.el[0], this.archivos[this.i]);
    }

    Pista.prototype.poner = function (a, nombre) {
        if (a.dataset.archivo === nombre) return;
        a.dataset.archivo = nombre;
        a.src = raiz + "assets/audio/" + nombre;
    };

    Pista.prototype.pausar = function () {
        this.el.forEach(function (a) { if (!a.paused) a.pause(); });
    };

    Pista.prototype.cambiar = function () {
        this.act = 1 - this.act;
        var nuevo = this.el[this.act];
        if (this.archivos.length > 1) {
            this.i = (this.i + 1) % this.archivos.length;
            this.poner(nuevo, this.archivos[this.i]);
        }
        try { nuevo.currentTime = 0; } catch (e) { }
        this.f[this.act] = 0;
        reproducir(nuevo);
    };

    Pista.prototype.tick = function (dt) {
        var paso = dt / FADE;
        if (this.nivel < this.meta) this.nivel = Math.min(this.meta, this.nivel + paso);
        else if (this.nivel > this.meta) this.nivel = Math.max(this.meta, this.nivel - paso);

        if (this.nivel === 0 && this.meta === 0) { this.pausar(); return; }
        if (this.roto) return;

        var a = this.el[this.act];
        var cerca = isFinite(a.duration) && a.duration > 0 && (a.duration - a.currentTime) <= CRUCE;
        if (a.ended || (cerca && !a.paused)) {
            this.cambiar();
            a = this.el[this.act];
        } else if (a.paused) {
            reproducir(a);
        }

        // Con la pista ya sonando, dejamos lista la copia que se mezclará al final
        if (!this.precargado && a.currentTime > 5) {
            var otro = this.el[1 - this.act];
            if (this.archivos.length > 1) this.poner(otro, this.archivos[(this.i + 1) % this.archivos.length]);
            else this.poner(otro, this.archivos[this.i]);
            otro.preload = "auto";
            otro.load();
            this.precargado = true;
        }

        for (var i = 0; i < 2; i++) {
            var meta = (i === this.act) ? 1 : 0;
            var df = dt / CRUCE;
            if (this.f[i] < meta) this.f[i] = Math.min(meta, this.f[i] + df);
            else if (this.f[i] > meta) this.f[i] = Math.max(meta, this.f[i] - df);
            if (i !== this.act && this.f[i] === 0 && !this.el[i].paused) this.el[i].pause();
            // raíz cuadrada = cruce de potencia constante (no se nota el bajón a la mitad)
            this.el[i].volume = entre01(volumen * this.nivel * Math.sqrt(this.f[i]));
        }
    };

    function tick() {
        if (oculta) return;   // pestaña en segundo plano: ya está pausada, no la reanudamos
        var suena = desbloqueado && !silencio && musicaOn;
        var activo = false;
        Object.keys(pistas).forEach(function (nombre) {
            var p = pistas[nombre];
            p.meta = (suena && nombre === deseada) ? 1 : 0;
            p.tick(PASO / 1000);
            if (p.nivel > 0 || p.meta > 0) activo = true;
        });
        // Sin música sonando ni por sonar, el reloj se duerme (se despierta al encenderla)
        if (!activo && reloj) { clearInterval(reloj); reloj = null; }
    }

    function despertar() {
        if (!reloj && Object.keys(pistas).length) reloj = setInterval(tick, PASO);
    }

    function desbloquear() {
        if (desbloqueado) return;
        desbloqueado = true;
        document.removeEventListener("pointerdown", desbloquear, true);
        document.removeEventListener("keydown", desbloquear, true);
        despertar();
        tick(); // dentro del gesto del usuario, para que el navegador permita el audio
    }

    function iniciar(rutaRaiz) {
        if (iniciado) return;
        iniciado = true;
        raiz = rutaRaiz || "";
        precargar();
        Object.keys(PISTAS).forEach(function (n) { pistas[n] = new Pista(PISTAS[n]); });
        despertar();
        document.addEventListener("pointerdown", desbloquear, true);
        document.addEventListener("keydown", desbloquear, true);
        // Pestaña en segundo plano: la música se pausa
        document.addEventListener("visibilitychange", function () {
            oculta = document.hidden;
            if (oculta) Object.keys(pistas).forEach(function (n) { pistas[n].pausar(); });
            else despertar();
        });
    }

    return {
        iniciar: iniciar,
        efecto: efecto,
        pista: function (nombre) { deseada = nombre; despertar(); },
        silenciado: function () { return silencio; },
        silenciar: function (v) {
            silencio = !!v;
            guardarLocal("simulador-silencio", silencio ? "1" : "0");
            despertar();
        },
        musicaActiva: function () { return musicaOn; },
        activarMusica: function (v) {
            musicaOn = !!v;
            guardarLocal("simulador-musica", musicaOn ? "1" : "0");
            despertar();
        },
        volumenMusica: function (v) {
            if (v === undefined) return volumen;
            volumen = Math.max(0, Math.min(VOL_MAX, v));
            guardarLocal("simulador-vol-musica", String(volumen));
            return volumen;
        },
        volumenMaximo: VOL_MAX
    };
})();
