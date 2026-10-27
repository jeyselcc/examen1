import { listarEquipos, eliminarEquipo } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const POR_PAGINA = 6;

const $lista = document.querySelector("#lista-equipos");
const $plantilla = document.querySelector("#tpl-equipo");
const $resumen = document.querySelector("#resumen");
const $paginaActual = document.querySelector("#pagina-actual");
const $btnAnterior = document.querySelector("#btn-anterior");
const $btnSiguiente = document.querySelector("#btn-siguiente");

let paginaActual = 1;
let ultimaPagina = 1;

// YA IMPLEMENTADO — "2026-09-15" -> "15 set 2026"
export const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

export const cargarPagina = async (pagina = 1) => {
  $lista.setAttribute("aria-busy", "true");

  try {
    const respuesta = await listarEquipos(pagina, POR_PAGINA);

    const equipos = respuesta.data;
    const meta = respuesta.meta;

    paginaActual = meta.current_page;
    ultimaPagina = meta.last_page;

    $lista.replaceChildren();

    if (equipos.length === 0) {
      const $vacio = document.createElement("li");
      $vacio.className = "vacio";
      $vacio.textContent = "No hay equipos registrados.";
      $lista.appendChild($vacio);
    } else {
      equipos.forEach((equipo) => {
        const $clon = $plantilla.content.cloneNode(true);
        const $li = $clon.querySelector("li");

        $li.dataset.id = equipo.id;

        $clon.querySelector(".codigo").textContent = equipo.codigo;
        $clon.querySelector(".nombre").textContent = equipo.nombre;
        $clon.querySelector(".categoria").textContent = equipo.categoria.nombre;
        $clon.querySelector(".fecha").textContent = formatearFecha(equipo.fecha_adquisicion);

        const $estado = $clon.querySelector(".estado");
        $estado.textContent = equipo.estado;
        $estado.dataset.estado = equipo.estado;

        $lista.appendChild($clon);
      });
    }

    $resumen.textContent = `Mostrando ${meta.from ?? 0}–${meta.to ?? 0} de ${meta.total}`;
    $paginaActual.textContent = `Página ${meta.current_page} de ${meta.last_page}`;

    $btnAnterior.disabled = paginaActual <= 1;
    $btnSiguiente.disabled = paginaActual >= ultimaPagina;
  } catch (error) {
    mostrarMensaje("error", error.datos?.mensaje ?? error.message ?? "No fue posible cargar los equipos.");
  } finally {
    $lista.setAttribute("aria-busy", "false");
  }
};

const alHacerClicEnLista = async (evento) => {
  const $boton = evento.target.closest(".btn-eliminar");

  if (!$boton) {
    return;
  }

  const $equipo = $boton.closest("li[data-id]");

  if (!$equipo) {
    return;
  }

  const id = $equipo.dataset.id;

  if (!confirm("¿Desea eliminar este equipo?")) {
    return;
  }

  try {
    await eliminarEquipo(id);

    mostrarMensaje("exito", "Equipo eliminado.");

    if ($lista.querySelectorAll("li[data-id]").length === 1 && paginaActual > 1) {
      await cargarPagina(paginaActual - 1);
    } else {
      await cargarPagina(paginaActual);
    }
  } catch (error) {
    if (error.status === 409) {
      mostrarMensaje("error", error.datos.mensaje);
    } else {
      mostrarMensaje("error", "No fue posible eliminar el equipo.");
    }
  }
};

// Parcialmente implementado: complete el TODO de los botones de paginación.
export const iniciarListado = () => {
  $lista.addEventListener("click", alHacerClicEnLista);

  $btnAnterior.addEventListener("click", () => {
    if (paginaActual > 1) {
      cargarPagina(paginaActual - 1);
    }
  });

  $btnSiguiente.addEventListener("click", () => {
    if (paginaActual < ultimaPagina) {
      cargarPagina(paginaActual + 1);
    }
  });

  cargarPagina(1);
};