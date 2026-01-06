import mysql from 'mysql2/promise';

const dbConfig = {
  host: '批量替换_请输入数据IP地址',
  port: 3306,
  user: 't_monitor',
  password: '批量替换_请输入数据库密码',
  database: 't_monitor'
};

async function checkTableStructure() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 检查表结构
    const [columns] = await connection.execute('DESCRIBE categories');
    console.log('Categories table structure:', columns);
    
    // 检查sort_order字段是否存在
    const [sortOrderCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 't_monitor' 
      AND TABLE_NAME = 'categories' 
      AND COLUMN_NAME = 'sort_order'
    `);
    
    console.log('Sort order column exists:', (sortOrderCheck as any[]).length > 0);
    
    // 如果不存在，添加该字段
    if ((sortOrderCheck as any[]).length === 0) {
      console.log('Adding sort_order column...');
      await connection.execute('ALTER TABLE categories ADD COLUMN sort_order INT DEFAULT 0');
      console.log('Sort order column added successfully');
    }
    
    // 显示当前数据
    const [categories] = await connection.execute('SELECT * FROM categories ORDER BY id');
    console.log('Current categories:', categories);
    
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTableStructure();