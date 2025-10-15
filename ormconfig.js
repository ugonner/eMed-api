
const dotenv = require("dotenv");
const path = require("path");
const { DataSource } = require("typeorm");
dotenv.config();

const typeOrmConfig = {
    type: process.env.DATABASE_TYPE,
    
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    autoLoadEntities: true,
    entities: ["dist/**/*.entity.js"],
    migrations: ["dist/migrations/**/*.js"],
    //migrationsDir: "src/migrations",
    //"subscribers": ["dist/subscribesr/**/*.js"],
    cli: {
      entitiesDir: path.join(__dirname, "dist/entities"),
      migrationsDir: path.join(__dirname, "dist/migrations"),
      //"subscribersDir": "src/subscriber"
    },
    ssl: process.env.NODE_ENV === 'production' 
  ? { rejectUnauthorized: false } 
  : false,
};
//export {typeOrmConfig};
module.exports = new DataSource(typeOrmConfig);