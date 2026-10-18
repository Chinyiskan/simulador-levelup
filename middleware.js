// Candado de lecciones nuevas. Corre en el servidor de Vercel (Routing Middleware),
// asi que el estudiante no lo salta cambiando la hora de su PC ni con las dev tools.
//
// Para bloquear una semana nueva: agrega su carpeta de /misiones con la hora de apertura.
// Hora de Colombia = UTC-5 todo el anio (sin horario de verano).
// Las misiones que no estan en esta lista quedan abiertas siempre.
const ABRE = {
  "m1-s03-interfaces-que-cobran-vida": "2026-10-18T17:00:00-05:00",
};

// La clave del profe vive solo en la variable de entorno PROFE_PASSWORD de Vercel.
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function firmar(clave, texto) {
  const k = await crypto.subtle.importKey("raw", enc.encode(clave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, enc.encode(texto)));
}

async function esProfe(req) {
  const clave = process.env.PROFE_PASSWORD;
  const m = /(?:^|;\s*)profe=(\d+)\.([0-9a-f]+)/.exec(req.headers.get("cookie") || "");
  if (!clave || !m || Number(m[1]) < Date.now()) return false;
  return m[2] === (await firmar(clave, m[1]));
}

const bloqueada = (carpeta) => !!ABRE[carpeta] && Date.now() < Date.parse(ABRE[carpeta]);
const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...extra } });

export default async function middleware(req) {
  const ruta = new URL(req.url).pathname;
  const clave = process.env.PROFE_PASSWORD;

  if (ruta === "/api/estado") {
    const profe = await esProfe(req);
    return json({ profe, bloqueadas: profe ? [] : Object.keys(ABRE).filter(bloqueada) });
  }

  if (ruta === "/api/profe" && req.method === "POST") {
    let intento = "";
    try { intento = String((await req.json()).clave || ""); } catch (e) {}
    // Mismo HMAC a ambos lados: la comparacion no depende de cuantos caracteres acierte el intento.
    const ok = !!clave && (await firmar(clave, intento)) === (await firmar(clave, clave));
    if (!ok) {
      await new Promise((r) => setTimeout(r, 1000)); // frena la fuerza bruta
      return json({ ok: false }, 401);
    }
    const exp = String(Date.now() + 12 * 3600 * 1000);
    const cookie = `profe=${exp}.${await firmar(clave, exp)}; Path=/; Max-Age=43200; HttpOnly; Secure; SameSite=Lax`;
    return json({ ok: true }, 200, { "set-cookie": cookie });
  }

  if (ruta.startsWith("/misiones/")) {
    const carpeta = ruta.split("/")[2];
    if (bloqueada(carpeta) && !(await esProfe(req))) {
      return new Response(null, { status: 302, headers: { location: "/bloqueada.html", "cache-control": "no-store" } });
    }
  }

  return new Response(null, { headers: { "x-middleware-next": "1" } });
}

export const config = { matcher: ["/misiones/:path*", "/api/estado", "/api/profe"] };
