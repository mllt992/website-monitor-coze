-- 为 websites 表添加 sort_order 字段
ALTER TABLE websites ADD COLUMN sort_order INT DEFAULT 0 AFTER category_id;

-- 为 websites 表添加 status_code 字段（如果不存在）
ALTER TABLE websites ADD COLUMN status_code INT NULL AFTER response_time;

-- 为 websites 表添加 response_content 字段（如果不存在）
ALTER TABLE websites ADD COLUMN response_content TEXT NULL AFTER status_code;

-- 为 websites 表添加 tags 字段（如果不存在）
ALTER TABLE websites ADD COLUMN tags VARCHAR(500) NULL AFTER response_content;

-- 创建索引以优化排序查询
CREATE INDEX idx_sort_order ON websites(sort_order);
CREATE INDEX idx_category_sort ON websites(category_id, sort_order);
