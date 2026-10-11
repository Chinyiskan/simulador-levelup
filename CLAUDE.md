# Simulador del Hangar — guía para agentes

Este archivo explica qué es el proyecto y cómo pensar al trabajar en él. Léelo antes de tocar nada.

## Qué es

Páginas web interactivas, una por semana, que los estudiantes de la fase React de LevelUp Code recorren a su ritmo para estudiar la teoría de la clase. Es HTML, CSS y JavaScript puro: sin build, sin base de datos, sin CDNs. Se publica en Vercel desde GitHub.

Detalles técnicos (estructura de carpetas, atributos de las slides, retos disponibles, sonido, temporizador): ver `README.md`. Ese archivo está en `.gitignore` a propósito; existe solo en la carpeta local.

## Dónde encaja en la clase

Clase de 90 minutos por Google Meet. Todos los estudiantes están en computador.

1. Revisión de la tarea.
2. Simulador: cada estudiante lo recorre solo, entre 20 y 25 minutos.
3. Preguntas para verificar que quedó claro.
4. Ejercicio en clase (el proyecto Mixtape del módulo).

El simulador reemplaza la demo en vivo. En una clase va una o la otra, nunca las dos. El profe explica menos y atiende dudas mientras los estudiantes avanzan.

El simulador es el puente entre dos piezas que ya existen: la teoría en Notion (que resume la lección) y el ejercicio en clase (tickets sobre el Mixtape). Todo lo que se enseña aquí tiene que aparecer en alguna de las dos, y en el mismo orden que la teoría de Notion.

Es una herramienta aparte de QuizArena (la app de quizzes de repaso). No la reutilices, no la imites y no la toques: el repaso con quiz tiene que seguir sintiéndose distinto.

## Filosofía

1. **Hacer antes que leer.** Cada slide enseña una cosa y trae un reto. El estudiante aprende resolviendo, con texto mínimo alrededor.
2. **Un concepto nuevo por slide.** Ejemplos mínimos y progresión clara. Si una slide necesita dos ideas, se parte en dos.
3. **Un hilo conductor.** La misión construye un solo componente paso a paso (en la semana 2: `Pieza`, en el Taller de Nova). Cada paso suma una línea al mismo código y el estudiante ve el resultado en la pantalla de la nave. Este método ("Nova guía a construir algo paso a paso") es el oficial. La versión A de la semana 2 se conserva sin enlace; no se borra.
4. **Autocontenido.** La misión debe servir igual si el profe explicó antes o no. No asumas nada de la semana anterior sin recordarlo con el emote `recuerda`.
5. **Sin ambigüedad.** Cada instrucción dice qué se enseña y qué hay que hacer. No se pide filosofar, opinar ni adivinar la intención del texto.
6. **Los retos evalúan comprensión.** No solo reconocimiento. Los distractores son errores que los estudiantes cometen de verdad. Cada error muestra una pista concreta, y tras dos fallos aparece "Ver solución". Se evita el acierto por descarte.
7. **Exactitud técnica.** Lo que se muestra tiene que ser lo que pasa en React real. Los snippets deben ser JSX válido. Si una demo simula el navegador (por ejemplo, el aviso de `key`), el comportamiento debe coincidir con el real.
8. **Puede dejar pistas del ejercicio.** Si una slide anticipa algo del ejercicio o la tarea, está bien. El estudiante no conecta solo la teoría con el ejercicio; ayudarle a verlo es parte del trabajo. Lo que no se hace es resolver el ticket entero.
9. **Cierra mirando al ejercicio.** La pantalla final lista lo visto con enlace a cada paso, y el mensaje de Nova dice qué van a aplicar en el ejercicio de esa semana (por ejemplo: "En el ejercicio aplicas esto a tu Mixtape: la tarjeta recibe props y pasas de una canción a una playlist").
10. **Gamificado, sin ruido.** XP, estrellas, confeti y Nova que reacciona. La música arranca apagada porque en Meet se cuela por el micrófono. El temporizador es discreto y no suena. La música admite varias pistas por categoría: en `assets/js/audio.js`, la lista `archivos` de `lofi` y de `reto` rota al terminar cada pista, y un archivo que no cargue se descarta solo. Para sumar música, copia el .mp3 a `assets/audio/` y agrega su nombre a la lista.

## Guías visuales de los retos

Los estudiantes se perdían en las slides con dos retos y no sabían qué controles tocar. Reglas que salen de ahí:

- Todo reto lleva sus pasos numerados (`<ol class="pasos">`) y, si hace falta, una línea `<p class="listo-cuando">` con el resultado esperado.
- Los controles del reto (casillas, barras, botones, campos) van dentro de la caja del reto, nunca sueltos por encima.
- Una instrucción nombra el control exacto y el valor que se busca ("mueve la barra de popularidad hasta 70 o más"). Un enunciado como "haz que aparezca X y Y a la vez" sin decir cómo no se usa.
- Si una slide tiene más de un reto, el segundo (una pregunta, por ejemplo) arranca con la clase `oculto` y se muestra cuando el primero se resuelve.
- `assets/js/guia.js` y `assets/css/guia.css` ya hacen el resto: marcan "RETO 1 DE 2", apagan los retos que esperan, dibujan el globito amarillo con el siguiente clic (fichas, huecos, cajas, Comprobar) y, si el estudiante hace 7 clics seguidos en 3 segundos o falla 3 veces un reto, Nova lo frena y el brillo se intensifica. Para señalar un botón, campo o control propio, ponle `data-guia="texto del globito"`.
- Cada misión abre con una slide de tutorial (`s-tutorial`, copiable) con dos retos de práctica que enseñan el brillo, el orden de los retos, Pista y "Ver solución".
- Texto de instrucciones a 1 rem o más; en `.pasos` el tamaño base es 1.02 rem.

## Tiempo y pantalla

- Duración objetivo: 20 a 25 minutos. El reloj pasa a rojo desde el minuto 20.
- Medición real (semana 2, primera prueba con estudiantes): con 19 retos y unas 1.850 palabras entre slides y diálogos de Nova, todos terminaron en 17 minutos. Regla práctica: cada reto cuesta alrededor de 1 minuto y la lectura de cada slide otro medio minuto.
- La versión actual de la semana 2 suma un tutorial y dos slides (Seccion con children y lista vacía) para llegar a 20-25 minutos. Si agregas contenido, ajusta el reloj y quita otra cosa si el total pasa de 25.
- Diseño para una ventana de 1366×650. Lo que el estudiante necesita para avanzar tiene que verse sin scroll.
- Solo computador. No inviertas esfuerzo en móvil.

## Personajes y lore

- Saga "BIT WARS". La fase React es el Episodio III. Los cadetes ya están de servicio en una estación espacial (Estación Umbral, Hangar 3).
- **Nova** es la única guía en los módulos 1 y 2: mecánica japonesa, alegre y algo tímida, lentes de piloto, mono de mecánico, llave inglesa. **Kuma** es su robot araña. En el simulador aparece como emotes pixel art: `hola`, `tip`, `idea`, `advertencia`, `oops`, `recuerda`, `celebra`.
- **Verek** es el único personaje de los módulos 3 y 4. Nunca lo nombres en material de los módulos 1 y 2, ni a Nova en los módulos 3 y 4.
- Los personajes de otras fases (Hexa, Kara, Nexus) no aparecen en React.
- Estilo visual: pixel art de videojuego, familiar para jóvenes de 12 a 18 años. Color dominante de la fase: azul/cian React.
- El dominio de ejemplo debe servir para toda LATAM: el Taller de Nova vende repuestos y piezas de naves. Evita comida, regionalismos y referencias locales.

## Cómo se escribe

- Español directo, coloquial y aterrizado, como explicarle algo a un colega con un café.
- Los textos de Nova son cortos: máximo unos 280 caracteres (caben 3 líneas).
- Prohibido: antítesis tipo "no es X, es Y", aperturas épicas, cierres con moraleja, listas de beneficios de entender algo, palabras de cliché (fascinante, poderoso, viaje, invaluable, resiliencia, recordatorio, no subestimes) y metáforas de autoayuda aplicadas al código.
- Cada sección termina en el hecho o en el código, no en una reflexión.
- Las analogías técnicas están permitidas.
- Prohibidos los emojis en cualquier parte: textos, botones, retos, imágenes. Usa iconos SVG o texto.
- Si un comando aparece en pantalla, usa `pnpm`, nunca `npm`.

## Cómo trabajar con Camilo

- Pregunta o pide permiso antes de crear o cambiar archivos, imágenes o assets que él no pidió. Si te pide solo un prompt, devuelve solo el prompt.
- Si encuentras algo que mejorar, díselo y espera. No lo apliques por tu cuenta.
- Cuando él apruebe un cambio ("arréglalo", "hazlo", "aplícalo"), haz el commit y el push a `main` en el mismo paso, sin dejarlo solo en local, y confirma con el hash del commit y con `git ls-remote origin main` que GitHub ya lo tiene. Vercel publica desde GitHub: un cambio que no llegó a `main` no existe para los estudiantes.
- Responde en español. Sé específico y breve; no rellenes.

## Antes de dar una misión por buena

1. Corre con `?profe=1&fondo=off` y recorre todas las slides a 1366×650: ninguna debe necesitar scroll.
2. Juega como estudiante, sin `?profe=1`: ningún reto debe quedar bloqueado y "Ver solución" debe aparecer tras dos fallos.
3. La consola no debe mostrar errores.
4. Cada afirmación de React/JS es técnicamente correcta y cada snippet es JSX válido.
5. Los conceptos y su orden coinciden con la teoría de Notion, y el cierre apunta al ejercicio de la semana.
6. El tiempo estimado cae entre 20 y 25 minutos (cuenta las palabras en pantalla y los retos).
7. El `id` de la misión en `index.html` de la raíz coincide con el de `Motor.iniciar`.
8. Cada reto tiene pasos numerados y el globito amarillo apunta al control correcto en cada momento.

## Agentes de apoyo

En `.claude/agents/` hay dos revisores: `docente-didactico` (didáctica y exactitud técnica) y `experto-ux-ui` (interfaz). Úsalos para auditar, no para editar.
