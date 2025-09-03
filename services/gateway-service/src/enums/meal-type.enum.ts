/**
 * 用餐类型枚举
 * - 键（如 BREAKFAST）：代码中使用的标识（语义化，易读）
 * - 值（如 1）：存储到数据库/接口传输的数值（比字符串更节省空间，查询更快）
 */
export enum MealTypeEnum {
  // 早餐：键=BREAKFAST，值=1
  BREAKFAST = 1,
  // 午餐：键=LUNCH，值=2
  LUNCH = 2,
  // 晚餐：键=DINNER，值=3
  DINNER = 3,
}

// 可选：定义枚举的“中文映射”（用于接口返回时显示中文，如列表渲染）
export const MealTypeLabel: Record<MealTypeEnum, string> = {
  [MealTypeEnum.BREAKFAST]: '早餐',
  [MealTypeEnum.LUNCH]: '午餐',
  [MealTypeEnum.DINNER]: '晚餐',
};

