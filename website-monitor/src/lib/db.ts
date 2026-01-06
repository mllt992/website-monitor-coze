import mysql from 'mysql2/promise';

const dbConfig = {
  host: '批量替换_请输入数据IP地址',
  port: 3306,
  user: 't_monitor',
  password: '批量替换_请输入数据库密码',
  database: 't_monitor',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 执行SQL查询
export async function query(sql: string, params?: any[]): Promise<any> {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 获取数据库连接（用于需要手动管理的场景）
export async function getConnection() {
  return await pool.getConnection();
}

// 初始化数据库连接
export async function initDatabase() {
  try {
    await query('SELECT 1');
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export default { query, initDatabase, getConnection };