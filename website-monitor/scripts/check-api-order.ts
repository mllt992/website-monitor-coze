import { query } from '../src/lib/db';

async function checkApiOrder() {
  console.log('查询 API 返回的排序（模拟 Dashboard API）...');

  // 模拟 Dashboard API 的查询
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

  console.log('\nAPI 返回的网站顺序（按 category_sort_order, w.sort_order）:');
  websites.forEach((w: any, i: number) => {
    console.log(`  ${i + 1}. ID=${w.id}, sort_order=${w.sort_order}, category=${w.category_name}(${w.category_id}), category_sort=${w.category_sort_order}, name=${w.name}`);
  });
}

checkApiOrder().catch(console.error);
