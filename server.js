const express = require('express');
const app = express();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory');

//assign variable PORT to 3000
const port = process.env.PORT || 3000

app.use(express.json())
app.use(require('morgan')('dev'))

app.get('/api/department', async (req, res, next) => { 
    try{ 
        const SQL = `
        SELECT * from department
      `
        const response = await client.query(SQL)
        res.send(response.rows) 
    }      
      catch (ex) 
        {next(ex)}
    })


app.get('/api/employee', async (req, res, next) => { 
    try {
        const SQL = `
        SELECT * from employee ORDER BY created_at DESC
        `;
        const response = await client.query(SQL)
        res.send(response.rows)
    } catch (ex) {
        next(ex)}
    })


app.post('/api/employee', async (req, res, next) => { 
    try {
        const SQL = `
      INSERT INTO employee(name, department_id)
      VALUES($1, $2)
      RETURNING *
    `
         const response = await client.query(SQL, [req.body.name, req.body.department_id])
         res.send(response.rows[0])
    } catch (ex) {
        next(ex)}
    })


app.put('/api/employee/:id', async (req, res, next) => { 
    try {
        const SQL = `
      UPDATE employee
      SET name=$1, department_id=$2, updated_at= now()
      WHERE id=$3 RETURNING *
    `
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id
    ])
        res.send(response.rows[0])
    } catch (ex) {
        next(ex)}
    })


app.delete('/api/employee/:id', async (req, res, next) => { 
    try {
        const SQL = `
      DELETE from employee
      WHERE id = $1
    `
    const response = await client.query(SQL, [req.params.id])
        res.sendStatus(204)
    } catch (ex) {
        next(ex)}
    })

//create init function
const init = async () => {
    await client.connect();
    console.log('connected to database');

    //sql that creates the tables (employee and department)
    let SQL = `
    DROP TABLE IF EXISTS employee;
    DROP TABLE IF EXISTS department;
          CREATE TABLE department(
               id SERIAL PRIMARY KEY,
               name VARCHAR(100) NOT NULL
               
               );
          CREATE TABLE employee(
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now(),
                name VARCHAR(255) NOT NULL,
                department_id INTEGER REFERENCES department(id) NOT NULL
               );
    
    `
    await client.query(SQL);


    //display tables in consolelog
    console.log('tables created');

// add data into database
    SQL = `
           INSERT INTO department(name) VALUES('Tom');
           INSERT INTO department(name) VALUES('Fred');
           INSERT INTO department(name) VALUES('Steve');
           INSERT INTO employee(name, department_id) VALUES('Tom', (SELECT id FROM department WHERE name='Tom'));
           INSERT INTO employee(name, department_id) VALUES('Fred', (SELECT id FROM department WHERE name='Fred'));
           INSERT INTO employee(name, department_id) VALUES('Steve', (SELECT id FROM department WHERE name='Steve'));
    `
    await client.query(SQL);
    console.log('data seeded');
   
    //listen to port 3000
    app.listen(port, () => console.log(`listening on port ${port}`))

  }
  
  init();