import { query } from '../src/lib/db';

async function initSortOrder() {
  console.log('开始初始化网站的 sort_order...');

  // 方法1：使用 SET 变量来初始化 sort_order
  try {
    // 按分类和用户分组初始化
    await query(`
      SET @row_number = 0;
      SET @current_category = NULL;
      SET @current_user = NULL;

      UPDATE websites w
      JOIN (
        SELECT 
          id,
          @row_number := IF(
            @current_category = category_id AND @current_user = user_id,
            @row_number + 1,
            1
          ) as row_num,
          @current_category := category_id,
          @current_user := user_id
        FROM websites
        ORDER BY category_id, user_id, id
      ) as ordered ON w.id = ordered.id
      SET w.sort_order = ordered.row_num - 1;
    `);
    console.log('✓ 方法1成功：使用 SET 变量初始化 sort_order');
  } catch (error: any) {
    console.log('○ 方法1失败，尝试方法2:', error.message);

    // 方法2：直接为每个网站分配基于 ID 的 sort_order
    try {
      const websites = await query('SELECT id FROM websites ORDER BY id');
      console.log(`找到 ${websites.length} 个网站`);

      for (let i = 0; i < websites.length; i++) {
        await query(
          'UPDATE websites SET sort_order = ? WHERE id = ?',
          [i, websites[i].id]
        );
      }

      console.log('✓ 方法2成功：基于 ID 顺序初始化 sort_order');
    } catch (error2: any) {
      console.error('✗ 所有方法都失败了:', error2.message);
      throw error2;
    }
  }

  // 验证结果
  const result = await query('SELECT id, name, sort_order FROM websites ORDER BY sort_order, id LIMIT 10');
  console.log('\n验证结果（前10个网站）:');
  console.table(result);

  console.log('\n✓ 初始化完成！');
  process.exit(0);
}

initSortOrder().catch(error => {
  console.error('初始化失败:', error);
  process.exit(1);
});
