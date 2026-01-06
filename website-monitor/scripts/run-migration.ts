import { query } from '../src/lib/db';

async function runMigration() {
  console.log('开始数据库迁移...');

  const results = [];

  // 添加 sort_order 字段
  try {
    await query(`
      ALTER TABLE websites ADD COLUMN sort_order INT DEFAULT 0 AFTER category_id
    `);
    results.push({ field: 'sort_order', status: 'success', message: '已添加 sort_order 字段' });
    console.log('✓ 已添加 sort_order 字段');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      results.push({ field: 'sort_order', status: 'skipped', message: 'sort_order 字段已存在' });
      console.log('○ sort_order 字段已存在，跳过');
    } else {
      results.push({ field: 'sort_order', status: 'error', message: error.message });
      console.error('✗ 添加 sort_order 字段失败:', error.message);
    }
  }

  // 添加 status_code 字段
  try {
    await query(`
      ALTER TABLE websites ADD COLUMN status_code INT NULL AFTER response_time
    `);
    results.push({ field: 'status_code', status: 'success', message: '已添加 status_code 字段' });
    console.log('✓ 已添加 status_code 字段');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      results.push({ field: 'status_code', status: 'skipped', message: 'status_code 字段已存在' });
      console.log('○ status_code 字段已存在，跳过');
    } else {
      results.push({ field: 'status_code', status: 'error', message: error.message });
      console.error('✗ 添加 status_code 字段失败:', error.message);
    }
  }

  // 添加 response_content 字段
  try {
    await query(`
      ALTER TABLE websites ADD COLUMN response_content TEXT NULL AFTER status_code
    `);
    results.push({ field: 'response_content', status: 'success', message: '已添加 response_content 字段' });
    console.log('✓ 已添加 response_content 字段');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      results.push({ field: 'response_content', status: 'skipped', message: 'response_content 字段已存在' });
      console.log('○ response_content 字段已存在，跳过');
    } else {
      results.push({ field: 'response_content', status: 'error', message: error.message });
      console.error('✗ 添加 response_content 字段失败:', error.message);
    }
  }

  // 添加 tags 字段
  try {
    await query(`
      ALTER TABLE websites ADD COLUMN tags VARCHAR(500) NULL AFTER response_content
    `);
    results.push({ field: 'tags', status: 'success', message: '已添加 tags 字段' });
    console.log('✓ 已添加 tags 字段');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      results.push({ field: 'tags', status: 'skipped', message: 'tags 字段已存在' });
      console.log('○ tags 字段已存在，跳过');
    } else {
      results.push({ field: 'tags', status: 'error', message: error.message });
      console.error('✗ 添加 tags 字段失败:', error.message);
    }
  }

  // 创建索引
  try {
    await query(`
      CREATE INDEX idx_sort_order ON websites(sort_order)
    `);
    results.push({ index: 'idx_sort_order', status: 'success', message: '已创建 idx_sort_order 索引' });
    console.log('✓ 已创建 idx_sort_order 索引');
  } catch (error: any) {
    if (error.code === 'ER_DUP_KEYNAME') {
      results.push({ index: 'idx_sort_order', status: 'skipped', message: 'idx_sort_order 索引已存在' });
      console.log('○ idx_sort_order 索引已存在，跳过');
    } else {
      results.push({ index: 'idx_sort_order', status: 'error', message: error.message });
      console.error('✗ 创建 idx_sort_order 索引失败:', error.message);
    }
  }

  try {
    await query(`
      CREATE INDEX idx_category_sort ON websites(category_id, sort_order)
    `);
    results.push({ index: 'idx_category_sort', status: 'success', message: '已创建 idx_category_sort 索引' });
    console.log('✓ 已创建 idx_category_sort 索引');
  } catch (error: any) {
    if (error.code === 'ER_DUP_KEYNAME') {
      results.push({ index: 'idx_category_sort', status: 'skipped', message: 'idx_category_sort 索引已存在' });
      console.log('○ idx_category_sort 索引已存在，跳过');
    } else {
      results.push({ index: 'idx_category_sort', status: 'error', message: error.message });
      console.error('✗ 创建 idx_category_sort 索引失败:', error.message);
    }
  }

  // 初始化现有网站的 sort_order
  try {
    await query(`
      UPDATE websites w
      SET sort_order = (
        SELECT COUNT(*) - 1
        FROM websites w2
        WHERE (
          (w2.category_id = w.category_id OR (w2.category_id IS NULL AND w.category_id IS NULL))
          AND w2.user_id = w.user_id
          AND w2.id <= w.id
        )
      )
    `);
    results.push({ action: 'init_sort_order', status: 'success', message: '已初始化现有网站的 sort_order' });
    console.log('✓ 已初始化现有网站的 sort_order');
  } catch (error: any) {
    results.push({ action: 'init_sort_order', status: 'error', message: error.message });
    console.error('✗ 初始化 sort_order 失败:', error.message);
  }

  console.log('\n数据库迁移完成！');
  console.log('结果:', JSON.stringify(results, null, 2));

  process.exit(0);
}

runMigration().catch(error => {
  console.error('迁移失败:', error);
  process.exit(1);
});
