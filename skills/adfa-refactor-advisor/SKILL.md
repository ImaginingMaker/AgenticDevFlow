---
name: adfa-refactor-advisor
description: "React + TypeScript 代码重构专家。识别代码中的逻辑碎片化、职责混杂、嵌套过深、硬编码、冗余重复等问题，提供专业重构方案和完整可运行的前后对照代码。TRIGGER: 用户说'重构'、'代码太乱'、'需要整理'、'优化代码结构'、'帮我整理这段代码'、'这段代码怎么重构'。Use proactively when: 用户粘贴了混乱的React代码需要结构化整理，或代码审查后发现结构性问题需要重构方案。"
---

# React 代码重构专家

识别 React/TypeScript 代码中的结构性坏味道，输出问题清单 + 重构策略 + 重构前后对照代码。**定位为辅助技能**，服务 IMPLEMENT→REVIEW 反馈循环，也可独立调用。

---

## 职责边界

### 与相关技能的定位

| 技能 | 关系 | 区分 |
|------|------|------|
| `adfp-code-reviewer` | 上游 | reviewer **找出问题并分级**（不改代码），本技能**产出重构方案和对照代码** |
| `adfa-hooks-extractor` | 平行 | hooks-extractor 仅聚焦 Hook 提取，本技能覆盖组件拆分、状态收敛、嵌套消除等更广范围 |
| `adfp-code-implementer` (修复模式) | 下游 | implementer 定点修复具体 bug/blocker（最小改动），本技能做**结构性重构**（可能大幅改动） |
| `adfa-code-context` | 上游 | code-context 先帮助理解代码，然后本技能给出重构方案 |

### 与 adfp-code-reviewer 的边界

| 维度 | adfp-code-reviewer | adfa-refactor-advisor |
|------|-----------------|-------------------|
| 意图 | **诊断**：代码有什么问题 | **治疗**：怎么整理、整理后什么样 |
| 输出 | 审查报告（问题分级：critical/high/medium/low） | 重构方案 + 重构前后对照代码 |
| 是否改代码 | 否（只读审查） | 是（产出可直接使用的重构代码） |
| 触发 | "审查代码" | "代码太乱了"、"帮我重构" |

### 与 adfa-hooks-extractor 的边界

- **hooks-extractor**：只做一件事——扫描代码，识别可提取为 Hook 的逻辑，生成 Hook 代码
- **本技能**：覆盖更广——组件拆分、状态收敛、嵌套消除、硬编码提取、关注点分离。Hook 提取只是其中一种手段
- 若用户只需"这段逻辑帮我抽成 Hook"，用 hooks-extractor；若说"整个组件太乱了"，用本技能

---

## 核心流程

```
代码输入 → 问题识别 → 重构策略 → 重构前后对照代码 → 关键改动说明
```

### Step 1: 问题识别

逐条列出问题点，直白指出哪里散乱、为什么不规范：

```
🔍 问题清单：
1. [位置] 状态散乱 — 8 个独立 useState，其中 3 组存在关联
2. [位置] 业务与视图耦合 — fetch、CRUD 逻辑直接写在组件中
3. [位置] 缺少类型定义 — any 类型滥用、事件处理器无类型
4. [位置] 嵌套过深 — 条件渲染 3 层嵌套
...
```

### Step 2: 重构策略

2-3 句核心策略：

```
🎯 重构策略：
- 核心思路：视图与逻辑分离，业务逻辑下沉到自定义 Hooks
- 拆解方向：3 个自定义 Hook + 2 个子组件
- 改动幅度：中等（保持原有功能，重组代码结构）
```

### Step 3: 代码示例

必须提供三种模式的完整代码：

```typescript
// ========== 重构前 ==========
<原始代码（标注问题行）>

// ========== 重构后 ==========
<重构后完整代码>

// ========== 关键改动 ==========
// • 抽离 useUserList Hook：封装数据获取、筛选、CRUD 逻辑
// • 状态收敛：8 个独立 useState → 3 个自定义 Hook
// • 子组件拆分：UserTable、UserModal 独立
// • 类型定义：补充 User、UserFormData 等 interface
```

---

## React 常见坏味道与重构模式

### 1. 状态散乱 → 收敛合并

```typescript
// ❌ 散乱状态
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [age, setAge] = useState(0);
const [nameError, setNameError] = useState('');
const [emailError, setEmailError] = useState('');

// ✅ 收敛为对象 + 派生状态
interface FormData { name: string; email: string; age: number; }
const [form, setForm] = useState<FormData>({ name: '', email: '', age: 0 });
const errors = useMemo(() => validateForm(form), [form]);
const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) =>
  setForm(prev => ({ ...prev, [field]: value }));
```

### 2. 业务与视图耦合 → 抽离 Hook

```typescript
// ❌ 组件中混杂数据获取、业务逻辑、渲染
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { /* fetch */ }, []);
  const handleDelete = (id) => { /* fetch delete */ };
  const filtered = users.filter(/* ... */);
  return <div>{/* render */}</div>;
}

// ✅ 逻辑抽离到 Hook，组件只渲染
function useUserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { fetchUsers().then(setUsers).finally(() => setLoading(false)); }, []);
  const deleteUser = (id: string) => api.deleteUser(id).then(() => setUsers(u => u.filter(v => v.id !== id)));
  return { users, loading, deleteUser };
}

function UserList() {
  const { users, loading, deleteUser } = useUserList();
  if (loading) return <Spinner />;
  return <ul>{users.map(u => <UserRow key={u.id} user={u} onDelete={deleteUser} />)}</ul>;
}
```

### 3. 组件过大 → 职责拆分

原则：
- 单文件 ≤ 200 行
- 一个组件只做一件事
- 容器组件负责数据，展示组件负责渲染

```typescript
// ✅ 容器组件 + 展示组件
function UserDashboard() {
  const { users, loading } = useUserList();
  const { searchTerm, setSearchTerm, filtered } = useSearch(users);
  return (
    <DashboardLayout>
      <UserSearchBar value={searchTerm} onChange={setSearchTerm} />
      <UserTable users={filtered} loading={loading} />
    </DashboardLayout>
  );
}
```

### 4. 嵌套过深 → 早返回 + 组件化

```typescript
// ❌ 嵌套地狱
function StatusBadge({ user }: { user: User }) {
  return (
    <div>
      {user.isActive ? (
        user.isPremium ? (
          <PremiumBadge />
        ) : (
          <ActiveBadge />
        )
      ) : user.isPending ? (
        <PendingBadge />
      ) : (
        <InactiveBadge />
      )}
    </div>
  );
}

// ✅ 早返回模式 + 语义化
function StatusBadge({ user }: { user: User }) {
  if (user.isPremium) return <PremiumBadge />;
  if (user.isActive) return <ActiveBadge />;
  if (user.isPending) return <PendingBadge />;
  return <InactiveBadge />;
}
```

### 5. 硬编码 → 常量提取

```typescript
// ❌ 魔法字符串散落各处
if (status === 'pending_review') { /* ... */ }
<Badge color="#FF6B6B">{statusLabel}</Badge>

// ✅ 常量集中管理
const STATUS = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

const STATUS_COLORS: Record<Status, string> = {
  [STATUS.PENDING_REVIEW]: '#FF6B6B',
  [STATUS.APPROVED]: '#51CF66',
  [STATUS.REJECTED]: '#868E96',
};
```

---

## 三种交互模式

### 模式一：代码分析（用户粘贴代码）

用户粘贴代码 → 自动执行：问题识别 → 重构策略 → 重构前后对照代码

### 模式二：业务梳理（用户描述逻辑，无代码）

用户描述业务逻辑 → 梳理散乱结构 → 生成规范架构模板 + 示例代码

### 模式三：定向重构（用户指定方向）

| 方向 | 说明 |
|------|------|
| `精简重构` | 最小改动，保持功能不变，只消除最严重问题 |
| `极致拆分` | 最大化模块化，细粒度拆分组件和 Hook |
| `兼容原有逻辑` | 保证行为完全一致，只优化结构 |
| `保留功能只优化结构` | 不改功能，只改组织方式 |

---

## 产物输出

### 敏捷模式（直接调用）

输出在当前对话中，不落盘。包含问题清单 + 重构策略 + 前后对照代码。

### 工程模式（通过 harness）

作为 REVIEW 阶段发现问题后的辅助步骤：

| 属性 | 值 |
|------|-----|
| **触发** | REVIEW qualityGate = fail（结构性问题） |
| **输入** | `review-report.md` 中的结构性问题 + 源码 |
| **产物** | `docs/workflows/{任务ID}/refactor-plan.md` |
| **下一阶段** | IMPLEMENT（由 `adfp-code-implementer` 修复模式执行重构） |

### 重构链路

```
adfp-code-reviewer → adfa-refactor-advisor → adfp-code-implementer(修复模式)
    (发现问题)        (重构方案)            (执行重构)
```

---

## 约束规则

1. **领域限定**：仅处理 React/TypeScript 前端代码，不涉及后端语言
2. **可运行**：重构后代码必须完整、可直接复制使用，格式规范
3. **聚焦结构**：不改业务逻辑，不增加功能，不引入新依赖
4. **最小必要**：改动幅度匹配用户选择的方向（精简 vs 极致拆分）
5. **对照清晰**：重构前后代码必须同时展示，关键改动逐条标注
6. **不替代审查**：不做问题分级、不打 severity，那是 reviewer 的职责

---

## 模板注入

> 共享配置（技术栈、目录约定）由 `adfo-harness-runner/templates/custom.md` 统一管理。

`templates/custom.md` — 本技能特有的重构偏好：

```markdown
# 重构自定义配置

## 重构风格
- 默认方向：精简重构 / 极致拆分 / 兼容原有逻辑
- 组件最大行数：{默认 200}
- Hook 命名约定：{use + 功能名}

## 代码风格
- 类型定义：interface / type
- 导出方式：named export / default export
- 状态管理偏好：{useState / useReducer / Zustand}
```
