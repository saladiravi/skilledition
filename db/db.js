// const {Pool}=require('pg');
// require('dotenv').config();


// const pool=new Pool({
//     user:process.env.USER,
//     host:process.env.HOST,
//     database:process.env.DATABASE,
//     password:process.env.PASSWORD,
//     port:process.env.PORT
// })
// module.exports=pool


require('dotenv').config();
const Pool = require("pg").Pool;


const pool = new Pool({  
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false, 
  },  
  
  });
  console.log("Database URL:", process.env.DATABASE_URL);
 
  module.exports = pool;