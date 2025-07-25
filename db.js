const sql = require('mssql')
require("dotenv").config();

// configuration for sql server
const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true, // use true for azure sql
        enableArithAbort: true
    },
    port: parseInt(process.env.DB_PORT)
};

//create a connection pool and export it as a promise

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to database');
        console.log("Connected to DB:", pool.config.database); // log DB name
        return pool;
    })
    .catch(err => {
        console.error('Database connection failed: ', err);
        throw err;
    });

module.exports = {
    sql,
    poolPromise
};
