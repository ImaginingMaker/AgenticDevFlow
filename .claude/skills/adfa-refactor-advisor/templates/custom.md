# 重构自定义配置

## 重构风格
- 默认方向：精简重构 / 极致拆分 / 兼容原有逻辑
- 组件最大行数：{默认 200}
- Hook 命名约定：{use + 功能名}

## 代码风格
- 类型定义：interface / type
- 导出方式：named export / default export
- 状态管理偏好：{useState / useReducer / Zustand}

## 重构阈值
- 单文件超过 {默认 200} 行 → 建议拆分
- useState 超过 {默认 5} 个 → 建议收敛
- 嵌套层级超过 {默认 3} 层 → 建议早返回或组件化
