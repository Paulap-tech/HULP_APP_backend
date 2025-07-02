-- =======================================
-- Crear base de datos solo si no existe
-- =======================================
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'HULPAPP') THEN
      PERFORM dblink_exec('dbname=' || current_database(), 'CREATE DATABASE "HULPAPP";');
   END IF;
END
$$ LANGUAGE plpgsql;

-- Si no tienes la extensión dblink, puedes simplemente hacerlo así:
-- (ejecuta el CREATE DATABASE manualmente o desde un script separado)
-- CREATE DATABASE "HULPAPP";

-- =======================================
-- Conectarse a la base de datos HULPAPP
-- =======================================
\c "HULPAPP";

-- =======================================
-- Crear tablas solo si no existen
-- =======================================

CREATE TABLE IF NOT EXISTS usuarios (
  email VARCHAR(90) NOT NULL PRIMARY KEY,
  password VARCHAR(200) NOT NULL,
  cicle_days INT,
  age INT,
  peso DECIMAL(5,2),
  talla DECIMAL(5,2),
  tratamiento VARCHAR(255),
  ano_diagnostico INT,
  ano_sintomas INT
);

CREATE TABLE IF NOT EXISTS sintomas (
  id SERIAL PRIMARY KEY,
  email VARCHAR(90) NOT NULL,
  fecha DATE NOT NULL,
  sintoma VARCHAR(255) NOT NULL,
  FOREIGN KEY (email) REFERENCES usuarios(email)
);

CREATE TABLE IF NOT EXISTS registros (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  faseMenstrual VARCHAR(20),
  cataplejiaExtremidades VARCHAR(2) NOT NULL,
  cataplejiaFacial VARCHAR(2) NOT NULL,
  cataplejiaSuelo VARCHAR(2) NOT NULL,
  suenoFragmentado VARCHAR(2) NOT NULL,
  paralisisSuenio VARCHAR(2) NOT NULL,
  somnolencia INT NOT NULL,
  email VARCHAR(90) NOT NULL,
  FOREIGN KEY (email) REFERENCES usuarios(email),
  CHECK (faseMenstrual IN ('menstruacion', 'lútea')),
  CHECK (cataplejiaExtremidades IN ('si', 'no')),
  CHECK (cataplejiaFacial IN ('si', 'no')),
  CHECK (cataplejiaSuelo IN ('si', 'no')),
  CHECK (suenoFragmentado IN ('si', 'no')),
  CHECK (paralisisSuenio IN ('si', 'no'))
);

CREATE TABLE IF NOT EXISTS menstruacion (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  fase VARCHAR(20) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  FOREIGN KEY (email) REFERENCES usuarios(email)
);

-- =======================================
-- Mensaje de confirmación
-- =======================================
SELECT 'Base de datos HULPAPP y tablas aseguradas (creadas si no existían)' AS mensaje;
