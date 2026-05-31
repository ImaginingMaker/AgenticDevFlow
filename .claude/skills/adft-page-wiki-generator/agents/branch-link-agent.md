# 分支跳转链路分析 SubAgent

## 任务目标
分析路由跳转和弹窗/抽屉链路，生成标准化文档。

## 输入信息

### 项目上下文（从文档提取）
- 项目名称：{projectName}
- 路由结构：{routerStructure}
- 页面关系：{pageRelations}
- 权限体系：{permissionSystem}

### 页面信息
- 页面文件路径：{filePath}
- 路由跳转代码：{routerCode}
- 弹窗组件：{modalComponents}

## 分析步骤

### 1. 识别路由跳转
查找以下代码模式：
- Vue Router: `router.push()`, `router.replace()`
- React Router: `navigate()`, `history.push()`
- 链接跳转: `<router-link>`, `<Link>`

### 2. 识别弹窗/抽屉
查找以下代码模式：
- 弹窗状态: `visible`, `open`, `showModal`
- 抽屉状态: `drawerVisible`, `drawerOpen`
- 打开函数: `setOpen(true)`, `visible.value = true`

### 3. 分析跳转条件
识别跳转的前置条件：
- 权限检查
- 数据校验
- 状态判断

### 4. 分析参数传递
识别跳转时传递的参数：
- 路由参数
- 查询参数
- 状态传递

## 输出格式

```markdown
### 3.3 分支跳转链路

#### 3.3.1 路由跳转

**跳转名称**：编辑用户

**触发条件**：点击表格行的编辑按钮

**跳转逻辑**：
```javascript
router.push({
  name: 'UserEdit',
  params: { id: row.id }
})
```

**跳转条件**：
- 有编辑权限：user:edit
- 数据状态：row.status !== 'locked'

**参数传递**：
| 参数 | 类型 | 来源 | 说明 |
|------|------|------|------|
| id | number | row.id | 用户ID |

**目标页面**：用户编辑页 (UserEdit)

#### 3.3.2 弹窗打开

**弹窗名称**：新增用户弹窗

**触发条件**：点击新增按钮

**打开逻辑**：
```javascript
const visible = ref(false)
const handleAdd = () => {
  visible.value = true
}
```

**弹窗配置**：
| 属性 | 值 | 说明 |
|------|-----|------|
| title | 新增用户 | 弹窗标题 |
| width | 600px | 弹窗宽度 |
| destroyOnClose | true | 关闭时销毁 |

**关闭条件**：
- 点击取消按钮
- 点击遮罩层
- 提交成功后自动关闭

#### 3.3.3 抽屉打开

**抽屉名称**：用户详情抽屉

**触发条件**：点击查看详情按钮

**打开逻辑**：
```javascript
const drawerVisible = ref(false)
const currentUser = ref(null)
const handleDetail = (row) => {
  currentUser.value = row
  drawerVisible.value = true
}
```
```

## 注意事项
- 区分路由跳转和弹窗/抽屉
- 标注跳转条件和权限要求
- 记录参数传递方式
