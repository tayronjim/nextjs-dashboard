import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'nextjs-dashboard',
  port: 8889,
  socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock', // Requerido para MAMP
};

export async function query(sql, params) {
  const connection = await mysql.createConnection(dbConfig);
  const [results] = await connection.execute(sql, params);
  await connection.end();
  return results;
}
