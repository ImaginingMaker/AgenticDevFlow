# 提取模板

> 按框架路由的提取产物模板。由 `adfa-hooks-extractor` 按平台感知检测结果动态加载。

---

## React 路径（自定义 Hook）

```typescript
// use{Name}.ts — {职责描述}
// 提取自：{源文件}
// 理由：复用性(高)/内聚性(高)/可测试性(中)

import { useState, useEffect, useCallback } from 'react';

interface Use{Name}Options {
  // 可配置参数
}

interface Use{Name}Return {
  // 暴露的状态和方法
}

export function use{Name}(options: Use{Name}Options): Use{Name}Return {
  // Hook 实现
}
```

---

## Vue 路径（Composable）

```typescript
// use{Name}.ts — {职责描述}
// 提取自：{源文件}
// 理由：复用性(高)/内聚性(高)/可测试性(中)

import { ref, computed, readonly } from 'vue';

export function use{Name}(options?: { ... }) {
  const data = ref(null);
  const loading = ref(false);

  // ... Composable 实现

  return {
    data: readonly(data),
    loading: readonly(loading),
  };
}
```

---

## 小程序路径（Behavior）

```typescript
// {name}.behavior.ts — {职责描述}
// 提取自：{源文件}
// 理由：复用性(高)/内聚性(高)/可测试性(中)

const {name}Behavior = Behavior({
  properties: {
    // 对外属性
  },
  data: {
    // 内部状态
  },
  methods: {
    // 复用方法
  },
  lifetimes: {
    attached() { },
    detached() { },
  },
});

export default {name}Behavior;
```
