// 临时简化版本，避免依赖问题
// 实际部署时需要安装所有依赖包

export async function hashPassword(password: string): Promise<string> {
  // 简单哈希，生产环境需要使用 bcrypt
  return btoa(password + 'salt');
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const hashed = btoa(password + 'salt');
  return hashed === hash;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 格式化时间为本地时间字符串
 * 自动处理时区转换，从UTC转换为浏览器本地时区
 */
export function formatLocalTime(dateString: string | null | undefined): string {
  if (!dateString) return '未检查';

  try {
    const date = new Date(dateString);

    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      return '时间格式错误';
    }

    // 使用toLocaleString自动转换为本地时区
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  } catch (error) {
    console.error('Time format error:', error);
    return '时间格式错误';
  }
}