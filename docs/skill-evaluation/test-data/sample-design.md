---
phase: DESIGN
---

# 购物车组件设计

---

## 1. 组件树

```
ShoppingCartPage
├── CartHeader
│   └── CartTitle
│   └── CartCountBadge
├── CartItemList
│   ├── CartItem (×N)
│   │   ├── ProductImage
│   │   ├── ProductInfo
│   │   ├── QuantitySelector
│   │   └── RemoveButton
│   └── EmptyCart (条件渲染)
├── CartSummary
│   ├── TotalPrice
│   ├── DiscountInfo
│   └── CheckoutButton
```

---

## 2. Props 接口

```typescript
// ShoppingCartPage
interface ShoppingCartPageProps {
  className?: string;
}

// CartItem
interface CartItemProps {
  item: CartItem;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

// QuantitySelector
interface QuantitySelectorProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

// CartSummary
interface CartSummaryProps {
  totalPrice: number;
  discount: number;
  onCheckout: () => void;
}
```

---

## 3. 状态方案

| 状态 | 位置 | 类型 | 说明 |
|------|------|------|------|
| items | Zustand Store | global | 购物车商品列表 |
| totalPrice | Zustand Store | derived | 计算属性 |
| itemCount | Zustand Store | derived | 计算属性 |
| localQuantity | QuantitySelector | local | 输入框临时值 |

---

## 4. 数据依赖

- 商品数据：Zustand Store → CartItem
- 总价计算：Store.items → CartSummary.totalPrice
- 数量交互：QuantitySelector → 父组件 onQuantityChange → Store.updateQuantity

---

## 5. 视觉设计方向

- **配色**：电商橙色系（温暖、促购买）
- **字体**：系统字体（清晰易读）
- **空间**：卡片间距 16px，内边距 12px
- **交互**：数量按钮点击有 scale 动效，删除有渐隐动效