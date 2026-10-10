const API_URL = "http://localhost:8080/animales";

// Obtener elementos del HTML
const formulario = document.getElementById("formularioAnimal");
const tabla = document.getElementById("tablaAnimales");
const botonGuardar = document.getElementById("botonGuardar");
const botonCancelar = document.getElementById("botonCancelar");
const botonActualizar = document.getElementById("botonActualizar");
const tituloFormulario = document.getElementById("tituloFormulario");
const totalAnimales = document.getElementById("totalAnimales");

// Guardar el ID del registro que se va a editar
let idEdicion = null;

// Consultar y mostrar los registros
async function cargarAnimales() {
  try {
    const respuesta = await fetch(API_URL);

    if (!respuesta.ok) {
      throw new Error("No se pudo consultar los registros");
    }

    const animales = await respuesta.json();

    // Limpiar la tabla para mostrar los registros
    tabla.innerHTML = "";

    // Mostrar un mensaje si no hay registros
    if (animales.length === 0) {
      tabla.innerHTML =
        '<tr><td colspan="6" class="text-center">No hay animales registrados</td></tr>';
    }

    // Crear una fila para cada registro
    animales.forEach((animal) => {
      const fila = document.createElement("tr");

      // Agregar los datos del registro a la fila
      const datos = [
        animal.id,
        animal.nombre,
        animal.nombreCientifico,
        animal.region,
        animal.tipo,
      ];

      // Datos centrados
      datos.forEach((dato) => {
        const celda = document.createElement("td");
        celda.textContent = dato;
        celda.className = "text-center";
        fila.appendChild(celda);
      });

      // Crear los botones de editar y eliminar
      const celdaAcciones = document.createElement("td");
      celdaAcciones.className = "text-center";

      // Botón editar
      const botonEditar = document.createElement("button");
      botonEditar.textContent = "Editar";
      botonEditar.className = "btn btn-warning btn-sm me-2";
      botonEditar.type = "button";
      botonEditar.onclick = () => prepararEdicion(animal);

      // Botón eliminar
      const botonEliminar = document.createElement("button");
      botonEliminar.textContent = "Eliminar";
      botonEliminar.className = "btn btn-danger btn-sm";
      botonEliminar.type = "button";
      botonEliminar.onclick = () => eliminarAnimal(animal.id, animal.nombre);

      // Añadir botones a la fila
      celdaAcciones.append(botonEditar, botonEliminar);
      fila.appendChild(celdaAcciones);
      tabla.appendChild(fila);
    });

    // Mostrar la cantidad de registros
    totalAnimales.textContent = `Total de animales: ${animales.length}`;
  } catch {
    Swal.fire("Error", "No se pudieron cargar los animales", "error");
    tabla.innerHTML =
      '<tr><td colspan="6" class="text-center">No se pudieron cargar los registros</td></tr>';
    totalAnimales.textContent = "Total de animales: 0";
  }
}

// Preparar el formulario para editar un registro
function prepararEdicion(animal) {
  idEdicion = animal.id;

  // Mostrar los datos del registro en el formulario
  formulario.nombre.value = animal.nombre;
  formulario.nombreCientifico.value = animal.nombreCientifico;
  formulario.region.value = animal.region;
  formulario.tipo.value = animal.tipo;

  // Cambiar el título y el texto del botón
  tituloFormulario.textContent = "Editar animal";
  botonGuardar.textContent = "Guardar cambios";
  botonCancelar.classList.remove("d-none");
}

// Limpiar el formulario y cancelar edición
function limpiarFormulario() {
  formulario.reset();
  idEdicion = null;

  tituloFormulario.textContent = "Registrar animal";
  botonGuardar.textContent = "Guardar animal";
  botonCancelar.classList.add("d-none");
}

// Agregar un animal al registro o actualizar uno del registro
formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  // Obtener los datos del formulario
  const animal = {
    nombre: formulario.nombre.value.trim(),
    nombreCientifico: formulario.nombreCientifico.value.trim(),
    region: formulario.region.value.trim(),
    tipo: formulario.tipo.value,
  };

  // Verificar que los campos contengan información
  if (
    !animal.nombre ||
    !animal.nombreCientifico ||
    !animal.region ||
    !animal.tipo
  ) {
    Swal.fire("Falta información", "Rellena todos los campos", "warning");
    return;
  }

  // Definir si se agregará o actualizará un registro
  const editando = idEdicion !== null;
  const url = editando ? `${API_URL}/${idEdicion}` : API_URL;
  const metodo = editando ? "PUT" : "POST";

  try {
    const respuesta = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(animal),
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo guardar el animal");
    }

    // Limpiar el formulario y actualizar tabla
    limpiarFormulario();
    await cargarAnimales();

    // Mostrar mensaje de éxito
    if (editando) {
      Swal.fire("Correcto", "Animal actualizado", "success");
    } else {
      Swal.fire("Correcto", "Animal registrado", "success");
    }
  } catch (error) {
    Swal.fire("Error", "No se pudo guardar el animal", "error");
  }
});

// Eliminar un animal despúes de la confirmación
async function eliminarAnimal(id, nombre) {
  const confirmacion = await Swal.fire({
    title: "Confirma",
    text: `¿Deseas eliminar ${nombre}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
  });

  // Regresar si el usuario cancela
  if (!confirmacion.isConfirmed) {
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",    });

    if (!respuesta.ok) {
      throw new Error("No se pudo eliminar el registro");
    }

    // Limpiar el formulario si se estaba editando el registro
    if (idEdicion === id) {
      limpiarFormulario();
    }

    // Actualizar la tabla y mostrar mensaje
    await cargarAnimales();

    Swal.fire("Eliminado", "El registro se eliminó", "success");
  } catch {
    Swal.fire("Error", "No se pudo eliminar el registro", "error");
  }
}

// Botones de la página
botonCancelar.addEventListener("click", limpiarFormulario);
botonActualizar.addEventListener("click", cargarAnimales);

// Cargar los registros al abrir la página
cargarAnimales();
