require('dotenv').config(); 

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const moment = require('moment');

const app = express();
app.use(cors());
app.use(express.json()); // Maneja JSON
app.use(express.urlencoded({ extended: true })); // Maneja datos codificados en URL

//así las credenciales no aparecen en el código
const db = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

//const db = new Pool({
    //user: 'hulp', // usuario de tu base de datos
    //host: 'localhost',
    //database: 'HULPAPP', // nombre de tu base de datos
    //password: 'pw_4_hulp', // tu contraseña
    //port: 5432 // puerto por defecto de PostgreSQL
//});

// db.connect((err) => {
//     if (err) {
//         console.error('Error connecting to database: ' + err.stack);
//         return;
//     }
//     console.log('Connected to database as id ' + db.threadId);
// });

app.post('/registro', (req, res) => {
    const { email, password, role, age, ano_diagnostico, ano_sintomas, especialidad, anios_experiencia } = req.body;

    console.log('➡️ Datos recibidos en /registro:', req.body);
    if (!email || !password || !role || !age){
        return res.status(400).json({message: 'Faltan datos obligatorios'});
    }

    db.query('SELECT * FROM usuarios WHERE email = $1', [email], (err, results) => {
        if (err) {
            console.error('❌ Error en SELECT:', err);
            return res.status(500).json({ message: 'Error en el servidor (SELECT).' });
        }

        if (results.rows.length > 0) {
            return res.status(409).json({ message: 'El usuario o correo electrónico ya están registrados.' });
        } else {
            let query = '';
            let values = [];

            if (role === 'paciente') {
                if (!ano_diagnostico || !ano_sintomas){
                    return res.status(400).jason({message: 'Faltan datos del paciente'});
                }

                query = `
                    INSERT INTO usuarios (email, password, role, age, ano_diagnostico, ano_sintomas)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    `;
                values = [email,password,role,age,ano_diagnostico,ano_sintomas];

            } else if (role === 'medico') {
                if (!especialidad || !anios_experiencia ==null) {
                    return res.status(400).json({ massage: 'Faltan datos del médico'});
                }

                query = `
                    INSERT INTO usuarios (email, password, role, age, especialidad, anios_experiencia )
                    VALUES ($1, $2, $3, $4, $5, $6)
                    `;
                values = [email, password, role, age, especialidad,anios_experiencia];
            } else {
                return res.status(400).json ({ message: 'Rol no válido'});
            }

            console.log('Ejecutando INSERT con:'.values);

             db.query(query, values, (err, result) => {
                if (err) {
                    console.error('❌ Error en INSERT:', err);
                    return res.status(500).json({ message: 'Error en el servidor (INSERT).' });
                }

                console.log('✅ Usuario registrado con éxito.');
                return res.status(201).json({ message: 'Usuario registrado exitosamente.' });
            });
        }
    });
});


// Ruta para guardar la duración del ciclo
app.post('/ciclo-duracion', (req, res) => {  //he quitado /api de delante de /ciclo-duracion
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

        if (results.rowCount === 0) {
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

        let faseMenstrual = results.rowCount > 0 ? results.rows[0].fase : null;
        //añadimos la tilde
        if ((faseMenstrual || '').toLowerCase() === 'lutea') {
            faseMenstrual = 'lútea';
        }
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

/*app.get('/registros/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const query = `
      SELECT 
        fecha,
        cataplejiaExtremidades,
        cataplejiaFacial,
        cataplejiaSuelo,
        suenoFragmentado,
        paralisisSuenio,
        somnolencia
      FROM registros
      WHERE email = $1
      ORDER BY fecha DESC
    `;
    const result = await db.query(query, [email]);

    const agrupados = {};
    result.rows.forEach((registro) => {
      const dia = new Date(registro.fecha).toISOString().slice(0, 10);
      if (!agrupados[dia]) agrupados[dia] = [];
      agrupados[dia].push(registro);
    });

    const datosFormateados = Object.entries(agrupados).map(([fecha, episodios]) => ({
      fecha,
      episodios
    }));

    res.status(200).json(datosFormateados);
  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).json({ error: 'Error de servidor' });
  }
});*/
/*app.get('/registros/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const registros = await db.query('SELECT * FROM registros WHERE email = $1', [email]);
    res.json(registros.rows);
  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});*/



app.post('/sintomas', async (req, res) => {
  const { email, fecha, symptoms } = req.body;

  console.log('Datos recibidos:', { email, fecha, symptoms });

  if (!email || !fecha || !Array.isArray(symptoms)) {
    return res.status(400).json({ error: 'Datos incompletos o mal formateados' });
  }

  try {
    // Insertar cada síntoma individualmente
    for (const sintoma of symptoms) {
      const query = `
        INSERT INTO sintomas (email, fecha, sintoma)
        VALUES ($1, $2, $3)
      `;
      await db.query(query, [email, fecha, sintoma]);
    }

    res.status(200).json({ message: 'Síntomas insertados correctamente' });
  } catch (err) {
    console.error('Error al insertar síntomas:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// Ruta para obtener los síntomas de un usuario 
app.get('/sintomas/:email', async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  try {
    console.log('Consultando síntomas del usuario:', email);
    const query = 'SELECT fecha, sintoma FROM sintomas WHERE email = $1 ORDER BY fecha DESC';
    const result = await db.query(query, [email]);

    const agrupados = {};
    result.rows.forEach(({fecha ,sintoma}) => {
        const dia = new Date(fecha).toISOString().slice(0, 10);
        //const dia = fecha.toISOString().slice(0,10);
        if (!agrupados[dia]){
            agrupados[dia] = new Set();
        }
        agrupados[dia].add(sintoma);
    });

    const datosFormateados = Object.entries(agrupados).map(([fecha ,sintomasSet]) => ({
        fecha,
        sintomas:[...sintomasSet],
    }));

    //res.status(200).json(result.rows);
    res.status(200).json(datosFormateados);
  } catch (err) {
    console.error('Error al obtener síntomas:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


//ruta para asociar pacientes a médicos
/*app.post('/asociar', (req, res) => {
    console.log('Body recibido:' , req.body);

    const { doctor_id, patient_id } = req.body;

    if (!doctor_id || !patient_id) {
        return res.status(400).json({ message: 'Faltan datos.' });
    }

    const query = `
      INSERT INTO doctor_patient (doctor_id, patient_id) 
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `;
    
    db.query(query, [doctor_id, patient_id], (err, result) => {
        if (err) {
            console.error('Error al asociar paciente a médico:', err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }

        res.status(201).json({ message: 'Paciente asociado correctamente.' });
    });
});*/
//enviar solicitud  al médico
app.post('/solicitudes', (req, res) => {
  const { pacienteEmail, medicoEmail } = req.body;

  if (!pacienteEmail || !medicoEmail) {
    return res.status(400).json({ message: 'Faltan datos.' });
  }

  const query = `
    INSERT INTO solicitudes_medico (paciente_email, medico_email, estado, fecha_solicitud)
    VALUES ($1, $2, 'pendiente', NOW())
    ON CONFLICT DO NOTHING
  `;

  db.query(query, [pacienteEmail, medicoEmail], (err, result) => {
    if (err) {
      console.error('Error al enviar solicitud:', err);
      return res.status(500).json({ message: 'Error interno del servidor.' });
    }

    res.status(201).json({ success: true, message: 'Solicitud enviada.' });
  });
});

//Ver solicitudes pendientes del médico
app.get('/solicitudes/:medicoEmail', (req, res) => {
  const medicoEmail = req.params.medicoEmail;

  const query = `
    SELECT id, paciente_email, estado , fecha_solicitud
    FROM solicitudes_medico 
    WHERE medico_email = $1 AND estado = 'pendiente'
  `;

  db.query(query, [medicoEmail], (err, result) => {
    if (err) {
      console.error('Error al obtener solicitudes:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    res.status(200).json(result.rows);
  });
});

//aceptar o rechazar solicitud del médico
app.post('/solicitudes/responder', (req, res) => {
  const { solicitudId, aceptar } = req.body;
  const nuevoEstado = aceptar ? 'aceptada' : 'rechazada';

  const updateQuery = `UPDATE solicitudes_medico SET estado = $1 WHERE id = $2 RETURNING *`;

  db.query(updateQuery, [nuevoEstado, solicitudId], (err, result) => {
    if (err) {
      console.error('Error actualizando solicitud:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (aceptar) {
      const { paciente_email, medico_email } = result.rows[0];

      const asociarQuery = `
        INSERT INTO doctor_patient (doctor_id, patient_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `;

      db.query(asociarQuery, [medico_email, paciente_email], (err2) => {
        if (err2) {
          console.error('Error al asociar paciente tras aceptación:', err2);
          return res.status(500).json({ error: 'Error al asociar después de aceptar.' });
        }

        return res.status(200).json({ success: true, message: 'Solicitud aceptada y paciente asociado.' });
      });
    } else {
      return res.status(200).json({ success: true, message: 'Solicitud rechazada.' });
    }
  });
});

//obtener médico asignado
app.get('/medico-asignado/:email', (req, res) => {
  const pacienteEmail = req.params.email;

  const query = `
    SELECT doctor_id AS medicoEmail
    FROM doctor_patient
    WHERE patient_id = $1
    LIMIT 1
  `;

  db.query(query, [pacienteEmail], (err, result) => {
    if (err) {
      console.error('Error al obtener médico asignado:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (result.rows.length > 0) {
      res.json({ medicoEmail: result.rows[0].medicoemail });
    } else {
      res.json({ medicoEmail: null });
    }
  });
});




//ruta para obtener los pacientes asociados a los médicos
app.get('/medico/:email/pacientes', (req, res) => {
    const doctorEmail = req.params.email;

    const query = `
        SELECT u.*
        FROM doctor_patient dp
        JOIN usuarios u ON dp.patient_id = u.email
        WHERE dp.doctor_id = $1 AND u.role = 'paciente'
    `;

    db.query(query, [doctorEmail], (err, results) => {
        if (err) {
            console.error('Error al obtener pacientes del médico:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        // Eliminar contraseñas antes de enviar los datos! mirar bien
        const pacientes = results.rows.map(p => {
            const { password, ...safeData } = p;
            return safeData;
        });

        res.status(200).json(results.rows);
    });
});

// Obtener todos los médicos
app.get('/medicos', (req, res) => {
    const query = `
    SELECT email AS id
    FROM usuarios
    WHERE role = 'medico'
  `;
  /*const query = `SELECT * FROM usuarios WHERE role = 'medico'`;*/
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener médicos:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    console.log('Médicos encontrados:', results.rows); 
    res.status(200).json(results.rows); // No contiene contraseñas ni datos innecesarios

    /*// Eliminar contraseñas antes de enviar
    const medicos = results.rows.map(m => {
      const { password, ...safeData } = m;
      return safeData;
    });

    res.status(200).json(medicos);*/
  });
});



  
app.get('/test', (req, res) => {
  res.json({ mensaje: 'Servidor OK' });
});


const port = 3000;


app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
});

