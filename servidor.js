// Importar Express
const express = require("express");

// Importar Cors
const cors = require("cors");

// Importar SQLite
const sqlite3 = require("sqlite3");

// Crear la aplicación de Express
const app = express();

// Activar CORS para la aplicación
app.use(cors());

// Permitir que el servidor reciba información en JSON
app.use(express.json());

// CREAR BASE DE DATOS
// Función para crear o abrir la base de datos
function crearBaseDatos(iniciarServidor) {
  console.log("Creando base de datos");

  // Crear o abrir la base de datos
  const db = new sqlite3.Database("./animales.db", (error) => {
    if (error) {
      console.log("Error: " + error);
      return;
    }

    console.log("Base de datos iniciada");

    // Crear la tabla de animal si todavía no existe
    db.run(
      `
        CREATE TABLE IF NOT EXISTS animal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        nombreCientifico TEXT NOT NULL,
        region TEXT NOT NULL,
        tipo TEXT NOT NULL
        )
        `,
      (error) => {
        if (error) {
          console.log("Error al crear la tabla: " + error);

          return;
        }

        console.log("Tabla animal creada correctamente");

        // Insertar registros de ejemplo
        // Comprbar si la tabla está vacía
        db.get(
          "SELECT COUNT(*) AS cantidad FROM animal",
          (error, resultado) => {
            if (error) {
              console.log("Error de comprobación: " + error);
              return;
            }
            // Si no existen registros, se agregan los datos
            if (resultado.cantidad === 0) {
              db.run(
                `
          INSERT INTO animal (nombre, nombreCientifico, region, tipo)
          VALUES
          ('Mapache', 'Procyon lotor', 'América', 'Mamífero'),
          ('Nutria marina', 'Enhydra lutris', 'Océano Pacífico', 'Mamífero'),
          ('Mono capuchino', 'Cebus capucinus', 'América', 'Mamífero')
          `,
                (error) => {
                  if (error) {
                    console.log("Error al agregar registros: " + error);
                    return;
                  }

                  // Mostrar mensaje de confirmación
                  console.log("Registros agregados");

                  // Cerrar la base de datos
                  cerrarBaseDatos();
                },
              );
            } else {
              // Si ya están los registros, no se vuelven a insertar
              cerrarBaseDatos();
            }

            // Cerrar la conexión inicial y continuar el servidor
            function cerrarBaseDatos() {
              db.close((error) => {
                if (error) {
                  console.error("Error al cerrar la base de datos", error);
                  return;
                }

                console.log("Iniciación finalizada");

                // Iniciar el servidor después de preparar la base de datos
                iniciarServidor();
              });
            }
          },
        );
      },
    );
  });
}

// Validar datos
function validarAnimal(datos) {
  const { nombre, nombreCientifico, region, tipo } = datos;

  return (
    typeof nombre === "string" &&
    typeof nombreCientifico === "string" &&
    typeof region === "string" &&
    typeof tipo === "string" &&
    nombre.trim() !== "" &&
    nombreCientifico.trim() !== "" &&
    region.trim() !== "" &&
    tipo.trim() !== ""
  );
}

// SERVICIO READ
app.get("/animales", (solicitud, respuesta) => {
  // Abrir la base de datos
  const db = new sqlite3.Database("./animales.db", (error) => {
    if (error) {
      return respuesta
        .status(500)
        .json({ mensaje: "No se pudo abrir la base de datos" });
    }

    // Obtener todos los registros de la tabla
    db.all("SELECT * FROM animal", (error, filas) => {
      if (error) {
        db.close();
        return respuesta
          .status(500)
          .json({ mensaje: "No se obtuvieron los animales" });
      }

      // Devolver los registros en formato JSON
      respuesta.json(filas);

      // Cerrar la conexión al completar la consulta
      db.close();
    });
  });
});

// SERVICIO CREATE
app.post("/animales", (solicitud, respuesta) => {
  // Obtener los datos enviados
  const { nombre, nombreCientifico, region, tipo } = solicitud.body || {};

  // Verificar si los daatos son válidos
  if (!validarAnimal({ nombre, nombreCientifico, region, tipo })) {
    return respuesta
      .status(400)
      .json({ mensaje: "Todos los campos son obligatorios" });
  }

  // Abrir la base de datos
  const db = new sqlite3.Database("./animales.db", (error) => {
    if (error) {
      return respuesta
        .status(500)
        .json({ mensaje: "No se pudo abrir la base de datos" });
    }

    // Insertar nuevo registro
    db.run(
      `
            INSERT INTO animal
            (nombre, nombreCientifico, region, tipo)
            VALUES (?, ?, ?, ?)
            `,
      [nombre.trim(), nombreCientifico.trim(), region.trim(), tipo.trim()],
      function (error) {
        if (error) {
          db.close();
          return respuesta
            .status(500)
            .json({ mensaje: "No se pudo agregar el animal" });
        }

        // Enviar respuesta de confirmación - Agregado
        respuesta
          .status(201)
          .json({ mensaje: "Animal agregado correctamente", id: this.lastID });

        // Cerrar conexión
        db.close();
      },
    );
  });
});

// SERVICIO UPDATE
// Actualizar registro usando su ID
app.put("/animales/:id", (solicitud, respuesta) => {
  // Obtener el ID de la URL
  const id = solicitud.params.id;

  // Comprobar que e ID sea positivo
  if (!/^[1-9]\d*$/.test(id)) {
    return respuesta.status(400).json({ mensaje: "El ID debe ser positivo" });
  }

  // Obtener los nuevos datos enviados
  const { nombre, nombreCientifico, region, tipo } = solicitud.body || {};

  // Verificar que los campos son válidos
  if (!validarAnimal({ nombre, nombreCientifico, region, tipo })) {
    return respuesta
      .status(400)
      .json({ mensaje: "Todos los campos son obligatorios" });
  }

  // Abrir la base de datos
  const db = new sqlite3.Database("./animales.db", (error) => {
    if (error) {
      return respuesta
        .status(500)
        .json({ mensaje: "No se pudo abrir la base de datos" });
    }
    // Actualizar el registro con el ID indicado
    db.run(
      `
        UPDATE animal
        SET nombre = ?,
        nombreCientifico = ?,
        region = ?,
        tipo = ?
        WHERE id = ?
        `,
      [
        nombre.trim(),
        nombreCientifico.trim(),
        region.trim(),
        tipo.trim(),
        Number(id),
      ],
      function (error) {
        if (error) {
          db.close();
          return respuesta
            .status(500)
            .json({ mensaje: "No se pudo actualizar el animal" });
        }

        // Comprobar si se encontró y modificó el registro
        if (this.changes === 0) {
          db.close();
          return respuesta
            .status(404)
            .json({ mensaje: "No se encontró el animal" });
        }

        // Enviar respuesta de confirmación - Actualizado
        respuesta.json({
          mensaje: "Animal actualizado correctamente",
        });

        // Cerrar la conexión
        db.close();
      },
    );
  });
});

// SERVICIO DELETE
// Eliminar un registro utilizando su ID
app.delete("/animales/:id", (solicitud, respuesta) => {
  // Obtener el ID de la URL
  const id = solicitud.params.id;

  // Comprobar que el ID sea positivo
  if (!/^[1-9]\d*$/.test(id)) {
    return respuesta.status(400).json({ mensaje: "El ID debe ser positivo" });
  }

  // Abrir la base de datos
  const db = new sqlite3.Database("./animales.db", (error) => {
    if (error) {
      return respuesta
        .status(500)
        .json({ mensaje: "No se pudo abrir la base de datos" });
    }

    // Eliminar el registro con el ID indicado
    db.run("DELETE FROM animal WHERE id = ?", [Number(id)], function (error) {
      if (error) {
        db.close();
        return respuesta
          .status(500)
          .json({ mensaje: "No se pudo eliminar el animal" });
      }

      // Comprobar si se eliminó el registro
      if (this.changes === 0) {
        db.close();
        return respuesta
          .status(404)
          .json({ mensaje: "No se encontró el animal" });
      }

      // Enviar respuesta de confirmación - Eliminado
      respuesta.json({
        mensaje: "Animal eliminado correctamente",
      });

      db.close();
    });
  });
});

// INICIAR SERVIDOR
function iniciarServidor() {
  app.listen(8080, () => {
    console.log("Servidor funcionando en http://localhost:8080");
  });
}

// Preparar la base de datos y comenzar el servidor al estar lista
crearBaseDatos(iniciarServidor);
