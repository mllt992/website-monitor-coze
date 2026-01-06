import { query } from '../src/lib/db';

async function reinitSortOrder() {
  console.log('重新初始化网站的 sort_order...');

  // 查询所有分类
  const categories = await query('SELECT id, name FROM categories ORDER BY id');
  console.log(`找到 ${categories.length} 个分类`);

  for (const category of categories as any[]) {
    const categoryId = category.id;
    const categoryName = category.name;

    // 查询该分类下的所有网站
    const websites = await query(
      'SELECT id, name FROM websites WHERE category_id = ? ORDER BY id',
      [categoryId]
    ) as any[];

    if (websites.length === 0) {
      console.log(`  分类 ${categoryName}(${categoryId}): 无网站`);
      continue;
    }

    console.log(`  分类 ${categoryName}(${categoryId}): ${websites.length} 个网站`);

    // 为每个网站分配连续的 sort_order
    for (let i = 0; i < websites.length; i++) {
      await query(
        'UPDATE websites SET sort_order = ? WHERE id = ?',
        [i, websites[i].id]
      );
      console.log(`    ${i + 1}. ID=${websites[i].id}, name=${websites[i].name}, sort_order=${i}`);
    }
  }

  // 查询未分类的网站
  const uncategorized = await query(
    'SELECT id, name FROM websites WHERE category_id IS NULL ORDER BY id'
  ) as any[];

  if (uncategorized.length > 0) {
    console.log(`  未分类: ${uncategorized.length} 个网站`);
    for (let i = 0; i < uncategorized.length; i++) {
      await query(
        'UPDATE websites SET sort_order = ? WHERE id = ?',
        [i, uncategorized[i].id]
      );
      console.log(`    ${i + 1}. ID=${uncategorized[i].id}, name=${uncategorized[i].name}, sort_order=${i}`);
    }
  }

  console.log('\n✓ 重新初始化完成！');

  // 验证结果
  const result = await query(`
    SELECT
      w.id,
      w.name,
      w.sort_order,
      w.category_id,
      c.name as category_name,
      c.sort_order as category_sort_order
    FROM websites w
    LEFT JOIN categories c ON w.category_id = c.id
    ORDER BY c.sort_order ASC, w.sort_order ASC
  `);

  console.log('\n验证结果（按 API 排序规则）:');
  (result as any[]).forEach((w, i) => {
    console.log(`  ${i + 1}. ID=${w.id}, sort_order=${w.sort_order}, category=${w.category_name}(${w.category_id}), name=${w.name}`);
  });

  process.exit(0);
}

reinitSortOrder().catch(error => {
  console.error('初始化失败:', error);
  process.exit(1);
});
