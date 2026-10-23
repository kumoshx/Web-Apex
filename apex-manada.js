/* APEX · Conexión de formulario, contador y lista con Supabase
 *
 * 1) En tu index.html, antes de </body>, añade:
 *
 *    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
 *    <script src="apex-manada.js"></script>
 *
 * 2) Asegúrate de que tu HTML tenga estos elementos (o cambia los IDs de abajo):
 *
 *    <form id="form-manada">
 *      <input id="nombre-manada" type="text" maxlength="24" placeholder="Tu nombre de lobo" required>
 *      <button type="submit">Unirme</button>
 *      <p id="mensaje-manada" role="status"></p>
 *    </form>
 *    <span id="contador-manada">0</span> lobos en la manada
 *    <ol id="lista-manada"><li>Cargando la manada…</li></ol>
 */

// ⬇️ Pega aquí los datos de Supabase (Project Settings > API).
// La clave "anon" es pública por diseño; la protege la seguridad (RLS) del SQL.
const SUPABASE_URL = "https://qnuqsuowsuiwweabwygc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6b7h4lWSHHKWm8TDvCSQPQ_itpfne3m";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("form-manada");
const inputNombre = document.getElementById("nombre-manada");
const mensaje = document.getElementById("mensaje-manada");
const contador = document.getElementById("contador-manada");
const lista = document.getElementById("lista-manada");

const NOMBRE_VALIDO = /^[A-Za-z0-9_]{3,24}$/;

function mostrarMensaje(texto, ok) {
  mensaje.textContent = texto;
  mensaje.style.color = ok ? "#7ddc8a" : "#ff8a8a";
}

async function cargarContador() {
  const { data, error } = await db.rpc("contar_manada");
  if (error) return console.error(error);
  contador.textContent = Number(data).toLocaleString("es-ES");
}

async function cargarLista() {
  const { data, error } = await db.rpc("ultimos_lobos", { limite: 10 });
  if (error) return console.error(error);
  lista.replaceChildren();
  if (!data.length) {
    const li = document.createElement("li");
    li.textContent = "Sé el primer lobo de la manada";
    lista.appendChild(li);
    return;
  }
  for (const fila of data) {
    const li = document.createElement("li");
    li.textContent = fila.nombre; // textContent evita inyección de HTML
    lista.appendChild(li);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = inputNombre.value.trim();

  if (!NOMBRE_VALIDO.test(nombre)) {
    return mostrarMensaje("Usa 3-24 caracteres: letras, números o _", false);
  }

  const boton = form.querySelector("button[type=submit]");
  boton.disabled = true;

  const { error } = await db.from("manada").insert({ nombre });

  boton.disabled = false;

  if (error) {
    // 23505 = nombre duplicado
    return mostrarMensaje(
      error.code === "23505"
        ? "Ese nombre ya está en la manada. Elige otro."
        : "No se pudo completar. Inténtalo de nuevo.",
      false
    );
  }

  mostrarMensaje(`¡Bienvenido a la manada, ${nombre}! 🐺`, true);
  form.reset();
  cargarContador();
  cargarLista();
});

cargarContador();
cargarLista();
