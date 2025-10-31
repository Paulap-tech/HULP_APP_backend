# HULP_APP - Phase 2

## Project Overview

In the second phase of the HULP_APP project, the focus was on developing a MySQL database to store and manage the data collected by the mobile application. This phase also includes setting up a Node.js server with Express to handle API requests and connect to the database.

## Database Schema

### Tables

1. **usuarios**
   - **Description**: Stores user information.
   - **Fields**:
     - `email`: varchar(90), Primary Key
     - `password`: varchar(200)
     - `role`: text check (role in 'paciente', 'medico')
     - `cicle_days`: int
     - `age`: int
     - `peso`: decimal(5,2)
     - `talla`: decimal(5,2)
     - `tratamiento`: varchar(255)
     - `ano_diagnostico`: int
     - `ano_sintomas`: int
     - `especialidad`: text
     

2. **sintomas**
   - **Description**: Records symptoms experienced by users.
   - **Fields**:
     - `id`: int, Primary Key, Auto Increment
     - `email`: varchar(90), Foreign Key
     - `fecha`: date
     - `sintoma`: varchar(255)

3. **registros**
   - **Description**: Logs daily records of menstrual and narcolepsy symptoms.
   - **Fields**:
     - `id`: int, Primary Key, Auto Increment
     - `date`: date
     - `faseMenstrual`: enum('menstruacion', 'lútea')
     - `cataplejiaExtremidades`: enum('si', 'no')
     - `cataplejiaFacial`: enum('si', 'no')
     - `cataplejiaSuelo`: enum('si', 'no')
     - `suenoFragmentado`: enum('si', 'no')
     - `paralisisSuenio`: enum('si', 'no')
     - `somnolencia`: int
     - `email`: varchar(90), Foreign Key

4. **menstruacion**
   - **Description**: Keeps track of menstrual cycle phases and dates.
   - **Fields**:
     - `id`: int, Primary Key, Auto Increment
     - `email`: varchar(100), Foreign Key
     - `fase`: varchar(20)
     - `fecha_inicio`: date
     - `fecha_fin`: date

5. **doctor_patient**
   - **Description**: Patient-Doctor asociation
   - **Fields**:
     - `doctor_id`: varchar(90) references usuarios(email)
     - `patient_id`: varchar(90) references usuarios(email)

6. **solicitudes_medico**
   - **Description**: keeps track of the request of the patients
   - **Fields**: 
    -`id`: Primary Key
    -`paciente_email`: varchar(90) references usuarios(email)
    -`medico_email`: varchar(90) references usuarios(email)
    -`estado`: text
    -`fecha_solicitud`: timesatamp

## Setting Up the Database

To set up the MySQL database on your local machine, follow these steps:

1. **Access MySQL**:
   - Open your terminal and log in to MySQL as the root user:

     ```sh
     mysql -u root -p
     ```

2. **Create and Use the Database**:
   - Create the database for HULP_APP and switch to it:

     ```sql
     CREATE DATABASE HULPAPP;
     USE HULPAPP;
     ```

3. **Create Tables**:
   - Execute the following SQL commands to create the necessary tables:

     ```sql

     CREATE TABLE usuarios (
       email VARCHAR(90) NOT NULL PRIMARY KEY,
       password VARCHAR(200) NOT NULL,
       cicle_days INT,
       age INT,
       peso DECIMAL(5,2),
       talla DECIMAL(5,2),
       tratamiento VARCHAR(255),
       ano_diagnostico INT,
       ano_sintomas INT,
       especialidad TEXT,
       anios_experiencia INT,
       CONSTRAINT chk_paciente_datos CHECK (
         role = 'paciente' OR (
           cicle_days IS NULL AND
           age IS NULL AND
           peso IS NULL AND
           talla IS NULL AND
           tratamiento IS NULL AND
           ano_diagnostico IS NULL AND
           ano_sintomas IS NULL
         )
       )
     );

     CREATE TABLE sintomas (
       id INT AUTO_INCREMENT PRIMARY KEY,
       email VARCHAR(90) NOT NULL,
       fecha DATE NOT NULL,
       sintoma VARCHAR(255) NOT NULL,
       FOREIGN KEY (email) REFERENCES usuarios(email)
     );

     CREATE TABLE doctor_patient (
       doctor_id VARCHAR(90) REFERENCES usuarios(email),
       patient_id VARCHAR(90) REFERENCES usuarios(email),
       PRIMARY KEY (email) REFERENCES usuarios(email)
     );

     CREATE TABLE registros (
       id INT AUTO_INCREMENT PRIMARY KEY,
       date DATE NOT NULL,
       faseMenstrual ENUM('menstruacion', 'lútea'),
       cataplejiaExtremidades ENUM('si', 'no') NOT NULL,
       cataplejiaFacial ENUM('si', 'no') NOT NULL,
       cataplejiaSuelo ENUM('si', 'no') NOT NULL,
       suenoFragmentado ENUM('si', 'no') NOT NULL,
       paralisisSuenio ENUM('si', 'no') NOT NULL,
       somnolencia INT NOT NULL,
       email VARCHAR(90) NOT NULL,
       FOREIGN KEY (email) REFERENCES usuarios(email),
       CHECK (faseMestrual IN ('menstruacion', 'lútea')),
       CHECK (cataplejiaExtremidades IN ('si', 'no')),
       CHECK (cataplejiaFacial IN ('si', 'no')),
       CHECK (cataplejiaSuelo IN ('si', 'no')),
       CHECK (suenoFragmentado IN ('si', 'no')),
       CHECK (paralisisSuenio IN ('si', 'no'))
     );

     CREATE TABLE menstruacion (
       id INT AUTO_INCREMENT PRIMARY KEY,
       email VARCHAR(100) NOT NULL,
       fase VARCHAR(20) NOT NULL,
       fecha_inicio DATE NOT NULL,
       fecha_fin DATE NOT NULL,
       FOREIGN KEY (email) REFERENCES usuarios(email)
     );

     CREATE TABLE solicitudes_medico (
       id SERIAL PRIMARY KEY,
       paciente_email VARCHAR(90) REFERENCES usuarios(email),
       medico_email VARCHAR(90) REFERENCES usuarios(email),
       estado TEXT DEFAULT 'pendiente', --puede ser 'pendiente','aceptada' o 'rechazada'
     );



     ```

## Server Setup

1. **API Endpoints**:
   - The API endpoints for interacting with the database are defined in the `server.js` file. This file contains the routes and logic necessary to handle requests and interact with the MySQL database.

2. **Start the Server**:
   - To start the application, navigate to the project directory and run:

     ```sh
     node server.js
     ```

   - This command will start the server using Node.js and Express. Ensure you have installed the required Node.js packages by running `npm install` or `yarn install` before starting the server.

3. **View Changes**:
   - You can observe changes to the database by accessing MySQL and querying the tables. Use commands like `SELECT * FROM table_name;` to review the data.

## Technologies Used

- **Backend**: Node.js, Express
- **Database**: MySQL

## Next Steps

The third phase of the project will involve developing a web application to allow healthcare professionals to visualize the collected data or exporting the data to an Excel table for further analysis.

For more details or adjustments, please refer to the specific documentation for each phase.

--- 
## Disclaimer

This project was developed in collaboration with **Hospital Universitario La Paz** and **Universidad Politécnica de Madrid**. The code and documentation provided are a result of this collaborative effort and aim to support the ongoing research and clinical work related to menstrual cycle tracking and Narcolepsy Type I.

**Author**: Celia Taboada Martín and Paula García Alonso

**Academic tutor**: Ignacio Oropesa

**Profesional tutor**: Milagros Merino

