/**
 * 格式化时间显示
 * @param {string|Date} dateStr - 日期字符串或Date对象
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const absDiff = Math.abs(diff);

  // 1分钟内的时间显示"刚刚"
  if (absDiff < 60 * 1000) {
    return diff > 0 ? '刚刚' : '刚刚';
  }

  // 1小时内的时间显示"X分钟前"
  if (absDiff < 60 * 60 * 1000) {
    const minutes = Math.floor(absDiff / (60 * 1000));
    return diff > 0 ? `${minutes}分钟前` : `${minutes}分钟后`;
  }

  // 今天的日期显示"HH:mm"
  if (now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate()) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // 昨天的日期显示"昨天 HH:mm"
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.getFullYear() === date.getFullYear() &&
      yesterday.getMonth() === date.getMonth() &&
      yesterday.getDate() === date.getDate()) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `昨天 ${hours}:${minutes}`;
  }

  // 同年的日期显示"MM-DD HH:mm"
  if (now.getFullYear() === date.getFullYear()) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  }

  // 不同年的日期显示"YYYY-MM-DD"
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化聊天消息时间
 * @param {string|Date} dateStr - 日期字符串或Date对象
 * @returns {string} 格式化后的时间字符串
 */
export function formatMessageTime(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const sameYear = now.getFullYear() === date.getFullYear();
  const sameDay = sameYear &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  if (sameDay) {
    return `${hours}:${minutes}`;
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (sameYear) {
    return `${month}-${day} ${hours}:${minutes}`;
  }

  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * 获取当前时间的"HH:mm"格式
 * @returns {string} 当前时间字符串
 */
export function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
