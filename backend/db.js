const sql = require("mssql/msnodesqlv8");
require("dotenv").config();

const config = {
  connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_DATABASE};Trusted_Connection=Yes;TrustServerCertificate=Yes;`,
};

const connectDB = async () => {
  try {
    await sql.connect(config);
    console.log("MSSQL Database Connected Successfully");
  } catch (err) {
    console.log("MSSQL Database Connection Failed:", err.message);
  }
};

connectDB();

module.exports = sql;