const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const moment = require('moment');

const app = express();
app.use(cors());
app.use(express.json()); // Maneja JSON
app.use(express.urlencoded({ extended: true })); // Maneja datos codificados en URL

const db = new Pool({
    user: 'hulp', // usuario de tu base de datos
    host: 'localhost',
    database: 'HULPAPP', // nombre de tu base de datos
    password: 'pw_4_hulp', // tu contraseña
    port: 5432 // puerto por defecto de PostgreSQL
});

// db.connect((err) => {
//     if (err) {
//         console.error('Error connecting to database: ' + err.stack);
//         return;
//     }
//     console.log('Connected to database as id ' + db.threadId);
// });

// Ruta para registrar un nuevo usuario
app.post('/registro', (req, res) => {
    const { email, password, age, ano_diagnostico, ano_sintomas } = req.body;

    db.query('SELECT * FROM usuarios WHERE email = $1', [email], (err, results) => {
        if (err) {
            console.error('Error al consultar el usuario:', err);
            return res.status(500).json({ message: 'Error en el servidor.' });
        }

        if (results.length > 0) {
            return res.status(409).json({ message: 'El usuario o correo electrónico ya están registrados.' });
        } else {
            db.query('INSERT INTO usuarios (email, password, age, ano_diagnostico, ano_sintomas) VALUES ($1, $2, $3, $4, $5)', [email, password, age, ano_diagnostico,ano_sintomas], (err, result) => {
                if (err) {
                    console.error('Error al insertar el usuario:', err);
                    return res.status(500).json({ message: 'Error en el servidor.' });
                }
                return res.status(201).json({ message: 'Usuario registrado exitosamente.' });
            });
        }
    });
});



// Ruta para guardar la duración del ciclo
app.post('/api/ciclo-duracion', (req, res) => {
    const { email, ciclo_duracion } = req.body;

    if (!email || ciclo_duracion === undefined) {
        return res.status(400).json({ message: 'Faltan datos.' });
    }

    const duration = parseInt(ciclo_duracion, 10);
    if (isNaN(duration) || duration <= 0) {
        return res.status(400).json({ message: 'La duración debe ser un número positivo.' });
    }

    const query = 'UPDATE usuarios SET cicle_days = $1 WHERE email = $2';
    db.query(query, [duration, email], (err, results) => {
        if (err) {
            console.error('Error al actualizar la duración del ciclo:', err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({ message: 'Duración del ciclo guardada con éxito.' });
    });
});
// Ruta para guadar talla, tratamiento y peso del usuario 
app.post ('/information', (req, res) => {
    const { email, talla, tratamiento, peso } = req.body;
    if (!email || !talla || !tratamiento || !peso) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }
    const query = 'UPDATE usuarios SET talla = $1, tratamiento = $2, peso = $3 WHERE email = $4';
    db.query(query, [talla, tratamiento, peso, email], (err, results) => {
        if (err) {
            console.error('Error al guardar la información:', err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }
        res.status(201).json({ message: 'Información guardada con éxito' });
    });
});


// Ruta para autenticar a un usuario
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM usuarios WHERE email = $1 AND password = $2', [email, password], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }
        console.log('Resultados de la consulta:', results); // Log para depuración
        if (results.rowCount > 0) {
            // Asegúrate de que la respuesta incluya todos los campos necesarios
            return res.status(200).json(results.rows[0]);
        } else {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }
    });
});


// Ruta para obtener datos de un usuario por email
app.get('/usuario/:email', (req, res) => {
    const { email } = req.params;

    db.query('SELECT * FROM usuarios WHERE email = $1', [email], (err, results) => {
        if (err) {
            console.error('Error al obtener datos del usuario:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (results.rowCount > 0) {
            const userData = results.rows[0];
            res.status(200).json(userData);
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    });
});

//Ruta para obtener los días estandar de ciclo de un usuario
app.get('/ciclo/:email', (req, res) => {
    const email = req.params.email;
  
    const query = 'SELECT cicle_days FROM usuarios WHERE email = $1';
    db.query(query, [email], (err, results) => {
      if (err) {
        console.error('Error al obtener los detalles del usuario:', err);
        res.status(500).json({ error: 'Database error' });
      } else if (results.rowCount === 0) {
        res.status(404).json({ error: 'Usuario no encontrado' });
      } else {
        res.status(200).json(results.rows[0]);
      }
    });
  });
// Ruta para obtener las fechas de menstruación por correo electrónico
app.get('/registros/fechas/:email', (req, res) => {
    const { email } = req.params;

    if (!email) {
        return res.status(400).json({ message: 'El correo electrónico es requerido.' });
    }

    const query = 'SELECT fecha_inicio, fecha_fin, fase FROM menstruacion WHERE email = $1';
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error al obtener las fechas:', err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }
        console.log('Resultados de la consulta:', results);
        res.status(200).json(results.rows);
    });
});


// Ruta para guardar los registros de un ciclo menstrual
app.post('/menstruacion', (req, res) => {
    const { email, fecha_inicio, fecha_fin, fase } = req.body;

    if (!email || !fecha_inicio || !fecha_fin || !fase) {
        return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    const query = 'INSERT INTO menstruacion (email, fecha_inicio, fecha_fin, fase) VALUES ($1, $2, $3, $4)';
    const values = [email, fecha_inicio, fecha_fin, fase ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al guardar las fechas de menstruación:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.status(201).json({ message: 'Fechas de menstruación guardadas con éxito' });
    });
});

//Ruta para guardar los registros de una fase lútea
app.post('/fases', (req, res) => {
    const { email, fecha_inicio, fecha_fin, fase } = req.body;
  
    console.log('Datos recibidos para fase lútea:', { email, fecha_inicio, fecha_fin, fase });
    const query = `
      INSERT INTO menstruacion (email, fecha_inicio, fecha_fin, fase)
      VALUES ($1, $2, $3, $4)
    `;
    db.query(query, [email, fecha_inicio, fecha_fin, fase], (err, results) => {
      if (err) {
        console.error('Error insertando la fase lútea:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.status(200).json({ message: 'Fase lútea insertada correctamente' });
      }
    });
  });
  


// Ruta para obtener la fase menstrual de una fecha
app.get('/fase-menstrual/:email/:date', (req, res) => {
    const { email, date } = req.params;

    if (!email || !date) {
        return res.status(400).json({ message: 'El correo electrónico y la fecha son requeridos.' });
    }

    const query = 'SELECT fase FROM menstruacion WHERE email = $1 AND fecha_inicio <= $2 AND fecha_fin >= $3';
    db.query(query, [email, date, date], (err, results) => {
        if (err) {
            console.error('Error al obtener la fase menstrual:', err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }

        if (results.rowCount === 0) {
            return res.status(404).json({ message: 'No se encontró fase menstrual para esta fecha.' });
        }

        res.status(200).json({ fase: results.rows[0].fase });
    });
});

// Ruta para guardar un nuevo registro de Narcoplepsia
app.post('/registros', (req, res) => {
    const { fecha, tipoEvento, cataplejiaExtremidades, cataplejiaFacial, cataplejiaSuelo, suenoFragmentado, paralisisSuenio, somnolencia, email } = req.body;

    if (!email || !fecha || !tipoEvento) {
        return res.status(400).json({ message: 'Datos incompletos. Se requiere fecha, tipoEvento y email.' });
    }

    // Primero obtenemos la fase menstrual
    const getFaseQuery = 'SELECT fase FROM menstruacion WHERE email = $1 AND fecha_inicio <= $2 AND fecha_fin >= $3';
    db.query(getFaseQuery, [email, fecha, fecha], (err, results) => {
        if (err) {
            console.error('Error al obtener la fase menstrual:', err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }

        const faseMenstrual = results.rowCount > 0 ? results.rows[0].fase : null;

        // Ahora guardamos el registro con la fase menstrual
        const insertQuery = 'INSERT INTO registros (date, faseMenstrual, cataplejiaExtremidades, cataplejiaFacial, cataplejiaSuelo, suenoFragmentado, paralisisSuenio, somnolencia, email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
        db.query(insertQuery, [fecha, faseMenstrual, cataplejiaExtremidades, cataplejiaFacial, cataplejiaSuelo, suenoFragmentado, paralisisSuenio, somnolencia, email], (err, results) => {
            if (err) {
                console.error('Error al guardar el registro:', err);
                return res.status(500).json({ message: 'Error interno del servidor.' });
            }

            res.status(201).json({ message: 'Registro guardado con éxito', data: results });
        });
    });
});

// Ruta para obtener los síntomas diarios no relacionados con la narcolepsia de un usuario
app.post('/sintomas', (req, res) => {
    const { email, fecha, symptoms } = req.body;
  
    // Log de los datos recibidos
    console.log('Datos recibidos:', { email, fecha, symptoms });
  
    // Mapear los síntomas a un formato compatible con la consulta SQL
    const values = symptoms.map(sintoma => [email, fecha, sintoma]);
  
    // Log de los valores que se van a insertar
    console.log('Valores para insertar:', values);
  
    const query = `
      INSERT INTO sintomas (email, fecha, sintoma)
      VALUES ?
    `;
  
    // Ejecutar la consulta SQL
    db.query(query, [values], (err, results) => {
      if (err) {
        // Log del error si ocurre
        console.error('Error al insertar síntomas:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        // Log del resultado exitoso
        console.log('Síntomas insertados con éxito:', results);
        res.status(200).json({ message: 'Symptoms inserted successfully' });
      }
    });
  });
  

const port = 3000;

app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
});
