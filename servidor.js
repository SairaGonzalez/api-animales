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
function crearBaseDatos() {
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
                },
              );
            }

            // Cerrar la conexión con la base de datos
            db.close();
          },
        );
      },
    );
  });
}

// Ejecutar la función
crearBaseDatos();

// SERVICIO READ
app.get("/animales", (solicitud, respuesta) => {
  // Abrir la base de datos
  const db = new sqlite3.Database("./animales.db");

  // Obtener todos los registros de la tabla
  db.all("SELECT * FROM animal", (error, filas) => {
    if (error) {
      respuesta.status(500).json({
        mensaje: "No se obtuvieron los animales",
      });

      db.close();
      return;
    }

    // Enviar los datos en formato JSON
    respuesta.json(filas);

    // Cerrar la conexión con la base de datos
    db.close();
  });
});

// SERVICIO CREATE
app.post("/animales", (solicitud, respuesta) => {
  // Obtener los datos enviados
  const { nombre, nombreCientifico, region, tipo } = solicitud.body;

  // Abrir la base de datos
  const db = new sqlite3.Database("./animales.db");

  // Insertar nuevo registro
  db.run(
    `
            INSERT INTO animal
            (nombre, nombreCientifico, region, tipo)
            VALUES (?, ?, ?, ?)
            `,
    [nombre, nombreCientifico, region, tipo],
    function (error) {
      if (error) {
        respuesta.status(500).json({
          mensaje: "No se pudo agregar el animal",
        });

        db.close();
        return;
      }

      // Enviar respuesta de confirmación - Agregado
      respuesta.json({
        mensaje: "Animal agregado correctamente",
        id: this.lastID,
      });

      // Cerrar conexión
      db.close();
    },
  );
});

// SERVICIO UPDATE
// Actualizar registro usando su ID
app.put("/animales/:id", (solicitud, respuesta) => {
  // Obtener el ID de la URL
  const id = solicitud.params.id;

  // Obtener los nuevos datos enviados
  const { nombre, nombreCientifico, region, tipo } = solicitud.body;

  // Abrir la base de datos
  const db = new sqlite3.Database("./animales.db");

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
    [nombre, nombreCientifico, region, tipo, id],
    function (error) {
      if (error) {
        respuesta.status(500).json({
          mensaje: "No se pudo actualizar el animal",
        });

        db.close();
        return;
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

// SERVICIO DELETE
// Eliminar un registro utilizando su ID
app.delete("/animales/:id", (solicitud, respuesta) => {
  // Obtener el ID de la URL
  const id = solicitud.params.id;

  // Abrir la base de datos
  const db = new sqlite3.Database("./animales.db");

  // Eliminar el registro con el ID indicado
  db.run(
    "DELETE FROM animal WHERE id = ?",

    [id],
    function (error) {
      if (error) {
        respuesta.status(500).json({
          mensaje: "No se pudo eliminar el animal",
        });

        db.close();
        return;
      }

      // Enviar respuesta de confirmación - Eliminado
      respuesta.json({
        mensaje: "Animal eliminado correctamente",
      });

      db.close();
    },
  );
});

// INICIAR SERVIDOR
// Iniciar el servidor en puerto 8080
app.listen(8080, () => {
  console.log("Servidor funcionando en http://localhost:8080");
});
