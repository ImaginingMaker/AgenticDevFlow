# 边界用例示例库

> 供 `adfa-edge-case-master` 使用。提供各维度测试用例的具体示例，辅助 LLM 生成高质量的边界测试。

## 示例说明

以下示例按 5 个边界维度组织。每个示例包含：输入描述、预期行为和生成要点。

---

## 一、输入边界示例

### 示例 1：字符串类型

```typescript
// 被测函数
function validateUsername(name: string): boolean {
  return name.length >= 3 && name.length <= 20;
}
```

**测试用例：**

| 场景 | 输入 | 预期 | 说明 |
|------|------|------|------|
| 最小值边界 | "ab" | false | 长度=2，小于最小值 |
| 最小值-1 | "a" | false | |
| 最小值 | "abc" | true | 刚好达到下限 |
| 最大值 | "a".repeat(20) | true | |
| 最大值+1 | "a".repeat(21) | false | |
| 空字符串 | "" | false | 空值边界 |
| null | null | false | 类型不匹配 |
| undefined | undefined | false | 未定义 |

### 示例 2：数值类型

```typescript
// 被测函数
function calculateDiscount(amount: number): number {
  if (amount < 0) throw new Error('金额不能为负数');
  if (amount === 0) return 0;
  if (amount < 100) return amount * 0.05;
  if (amount < 500) return amount * 0.1;
  return amount * 0.15;
}
```

**测试用例：**

| 场景 | 输入 | 预期 | 说明 |
|------|------|------|------|
| 负值 | -1 | 抛异常 | 非法边界 |
| 零值 | 0 | 0 | 零值边界 |
| 区间下限 | 1 | 0.05 | 折扣区间下限 |
| 区间上限-1 | 99 | 4.95 | |
| 区间上限 | 100 | 10 | 进入下一区间 |
| 巨大值 | 100000 | 15000 | 性能边界 |
| 浮点数 | 99.99 | 4.9995 | 精度边界 |

### 示例 3：数组类型

```typescript
// 被测函数
function getFirstItem<T>(items: T[]): T | undefined {
  return items[0];
}
```

| 场景 | 输入 | 预期 | 说明 |
|------|------|------|------|
| 空数组 | [] | undefined | |
| 单元素 | [1] | 1 | |
| 多元素 | [1, 2, 3] | 1 | |
| null | null | 抛异常 | |
| 超大数组 | Array(10000).fill(1) | 1 | 性能边界 |

---

## 二、业务边界示例

### 场景：用户状态转换

```typescript
type UserState = 'active' | 'inactive' | 'suspended' | 'deleted';

function transitionUser(from: UserState, to: UserState): boolean {
  const allowed: Record<UserState, UserState[]> = {
    active: ['inactive', 'suspended', 'deleted'],
    inactive: ['active', 'deleted'],
    suspended: ['active', 'deleted'],
    deleted: [], // 终止状态
  };
  return allowed[from]?.includes(to) ?? false;
}
```

| 场景 | 输入 | 预期 | 说明 |
|------|------|------|------|
| 合法转换 | active → inactive | true | |
| 非法转换 | deleted → active | false | 终止状态不可逆 |
| 自身到自身 | active → active | false | 无状态变更 |
| 不存在的状态 | active → 'unknown' | false | 类型越界 |

---

## 三、异常场景示例

### 场景：网络请求

```typescript
async function fetchUserData(userId: string): Promise<UserData> {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}
```

| 场景 | 模拟条件 | 预期处理 |
|------|---------|---------|
| 网络超时 | 请求 > 5000ms | 显示"网络超时，请重试" |
| 网络断开 | navigator.onLine = false | 显示"网络连接已断开" |
| 404 | 返回 404 | 显示"用户不存在" |
| 500 | 返回 500 | 显示"服务器异常，请稍后重试" |
| 限流 | 返回 429 | 显示"请求过于频繁" |
| 空数据 | 返回 200, data = null | 显示空状态 |

### 错误处理覆盖检查清单

- [ ] 所有 API 调用是否有 try-catch？
- [ ] 错误提示是否对用户友好？
- [ ] 是否需要重试机制？
- [ ] 是否区分了网络错误和业务错误？

---

## 四、性能边界示例

### 场景：大数据量列表

```typescript
// 渲染长列表
function UserList({ users }: { users: User[] }) {
  return (
    <VirtualList
      items={users}
      renderItem={(user) => <UserCard key={user.id} user={user} />}
    />
  );
}
```

| 场景 | 数据量 | 预期行为 |
|------|--------|---------|
| 空列表 | 0 | 显示"暂无用户" |
| 单条 | 1 | 正常渲染 |
| 常规量 | 100 | 正常渲染 |
| 边界量 | 1000 | 虚拟滚动正常工作 |
| 超大量 | 10000 | 检查是否使用虚拟滚动，无性能问题 |
| 频繁更新 | 每秒更新 100 条 | 检查节流/防抖 |

### 高并发场景

```typescript
// 同时发起多个请求
async function fetchMultipleUsers(userIds: string[]): Promise<UserData[]> {
  const promises = userIds.map(id => api.get(`/users/${id}`));
  return Promise.all(promises); // 注意：大量并发可能触发限流
}
```

| 场景 | 并发数 | 预期 |
|------|--------|------|
| 低并发 | 5 | 正常完成 |
| 中并发 | 50 | 正常完成或触发限流 |
| 高并发 | 200 | 建议改用 Promise.allSettled + 分批次 |
| 极限 | 1000 | 必须分批处理 |

---

## 五、安全边界示例

### XSS 注入

```typescript
function displayUserInput(input: string): string {
  // ❌ 危险做法
  // return `<div>${input}</div>`;

  // ✅ 安全做法
  return `<div>${escapeHtml(input)}</div>`;
}
```

| 输入 | 预期 | 说明 |
|------|------|------|
| `<script>alert('xss')</script>` | 转义为文本 | 脚本注入 |
| `<img src=x onerror=alert(1)>` | 转义为文本 | 事件注入 |
| `javascript:alert(1)` | 转义为文本 | URL 注入 |
| `{{constructor.constructor('alert(1)')()}}` | 转义为文本 | 模板注入 |

### 注入攻击通用检查清单

- [ ] 用户输入是否经过转义？
- [ ] 是否有 SQL/NoSQL 注入风险？
- [ ] 是否有命令注入风险？
- [ ] 权限检查是否在每个接口都执行？
- [ ] 敏感数据是否在前端暴露？
- [ ] Token/密钥是否硬编码？
