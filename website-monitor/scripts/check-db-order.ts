import { query } from '../src/lib/db';

async function checkDbOrder() {
  console.log('查询数据库中的网站排序...');

  // 查询所有网站及其排序
  const websites = await query(`
    SELECT 
      w.id,
      w.name,
      w.sort_order,
      w.category_id,
      c.name as category_name,
      c.sort_order as category_sort_order
    FROM websites w
    LEFT JOIN categories c ON w.category_id = c.id
    ORDER BY c.sort_order ASC, w.sort_order ASC, w.created_at DESC
  `);

  console.log('\n数据库中的网站排序（按 sort_order）:');
  console.table(websites);
}

checkDbOrder().catch(console.error);
