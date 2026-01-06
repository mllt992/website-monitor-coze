import { query } from '../src/lib/db';

async function checkDbOrder() {
  console.log('查询数据库中的网站排序...');

  // 查询所有网站及其排序
  const websites = await query(`
    SELECT 
      w.id,
      w.name,
      w.sort_order,
      w.category_id
    FROM websites w
    ORDER BY w.id
  `);

  console.log('\n数据库中的网站（按 ID）:');
  websites.forEach((w: any, i: number) => {
    console.log(`  ${i + 1}. ID=${w.id}, sort_order=${w.sort_order}, category_id=${w.category_id}, name=${w.name}`);
  });
}

checkDbOrder().catch(console.error);
