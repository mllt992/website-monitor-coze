const mysql = require('mysql2/promise');

async function addSortOrderFields() {
  const connection = await mysql.createConnection({
    host: '批量替换_请输入数据IP地址',
    port: 3306,
    user: 't_monitor',
    password: '批量替换_请输入数据库密码',
    database: 't_monitor'
  });

  try {
    console.log('开始添加缺失的字段...');

    // 检查websites表是否已有sort_order字段
    const [websitesColumns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 't_monitor' AND TABLE_NAME = 'websites' AND COLUMN_NAME = 'sort_order'
    `);

    if (websitesColumns.length === 0) {
      console.log('为websites表添加sort_order字段...');
      await connection.query('ALTER TABLE websites ADD COLUMN sort_order INT DEFAULT 0 AFTER user_id');
      console.log('✓ websites表添加sort_order字段成功');

      // 更新现有网站的sort_order（基于ID）
      console.log('更新现有网站的sort_order...');
      await connection.query('SET @row_number = 0');
      await connection.query('UPDATE websites SET sort_order = (@row_number:=@row_number + 1) ORDER BY id');
      console.log('✓ 更新网站sort_order成功');
    } else {
      console.log('websites表已有sort_order字段');
    }

    // 检查categories表是否已有sort_order字段
    const [categoriesColumns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 't_monitor' AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'sort_order'
    `);

    if (categoriesColumns.length === 0) {
      console.log('为categories表添加sort_order字段...');
      await connection.query('ALTER TABLE categories ADD COLUMN sort_order INT DEFAULT 0 AFTER user_id');
      console.log('✓ categories表添加sort_order字段成功');

      // 更新现有分类的sort_order（基于ID）
      console.log('更新现有分类的sort_order...');
      await connection.query('SET @row_number = 0');
      await connection.query('UPDATE categories SET sort_order = (@row_number:=@row_number + 1) ORDER BY id');
      console.log('✓ 更新分类sort_order成功');
    } else {
      console.log('categories表已有sort_order字段');
    }

    console.log('\n✅ 所有字段添加完成！');

  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

addSortOrderFields()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
