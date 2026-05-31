---
phase: SPEC
status: completed
---

# 购物车功能 - 技术规格文档

---

## 1. 页面架构

| 页面 | 区块 | 功能 |
|------|------|------|
| ShoppingCartPage | CartHeader | 购物车标题、商品数量统计 |
| | CartItemList | 商品列表展示 |
| | CartItem | 单个商品卡片（图片、名称、数量选择器、删除按钮） |
| | CartSummary | 总价、优惠、结算按钮 |
| | EmptyCart | 空购物车提示 |

---

## 2. 数据模型

### CartItem 类型

```typescript
interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  selected: boolean;
}
```

### Cart 状态

```typescript
interface CartState {
  items: CartItem[];
  totalPrice: number;
  discount: number;
  itemCount: number;
}
```

---

## 3. API 契约

| 接口 | 方法 | 请求 | 响应 |
|------|------|------|------|
| /api/cart | GET | - | CartItem[] |
| /api/cart/add | POST | { productId, quantity } | CartItem |
| /api/cart/update | PUT | { id, quantity } | CartItem |
| /api/cart/remove | DELETE | { id } | { success: boolean } |

---

## 4. 状态管理策略

使用 Zustand 管理购物车全局状态：

```typescript
const useCartStore = create<CartState>((set) => ({
  items: [],
  totalPrice: 0,
  discount: 0,
  itemCount: 0,
  addItem: (item) => set(/* ... */),
  updateQuantity: (id, quantity) => set(/* ... */),
  removeItem: (id) => set(/* ... */),
  clearCart: () => set(/* ... */),
}));
```

---

## 5. 路由设计

| 路径 | 页面 | 说明 |
|------|------|------|
| /cart | ShoppingCartPage | 购物车主页面 |