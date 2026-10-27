# Redux Toolkit - Hướng dẫn Chi Tiết & Dự Án Giỏ Hàng

## 📚 MỤC LỤC
1. [Khái Niệm Redux Toolkit](#1-khái-niệm-redux-toolkit)
2. [Các Thành Phần Chính](#2-các-thành-phần-chính)
3. [Giỏ Hàng Cơ Bản (Level 1)](#3-giỏ-hàng-cơ-bản-level-1)
4. [Giỏ Hàng Nâng Cao (Level 2)](#4-giỏ-hàng-nâng-cao-level-2)
5. [Giỏ Hàng Chuyên Nghiệp (Level 3)](#5-giỏ-hàng-chuyên-nghiệp-level-3)

---

## 1. Khái Niệm Redux Toolkit

### Redux Là Gì?
Redux là **thư viện quản lý trạng thái (State Management)** giúp bạn:
- Lưu trữ dữ liệu ứng dụng tập trung trong một **Store**
- Dự đoán được các thay đổi trạng thái
- Debug dễ dàng với Redux DevTools

### Redux Toolkit Là Gì?
Redux Toolkit (RTK) là phiên bản **hiện đại & đơn giản hóa** của Redux:
- ✅ Giảm 90% code boilerplate
- ✅ Tích hợp Immer (thay đổi state không biến state ban đầu)
- ✅ Tích hợp Redux Thunk cho async actions
- ✅ Thực hành tốt nhất được sẵn sàng

---

## 2. Các Thành Phần Chính

### 2.1 Store (Kho Lưu Trữ)

// store.ts
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: {
    // các reducers sẽ thêm vào đây
  }
});

export default store;

**Store là gì?**
- Là nơi lưu trữ **toàn bộ state** của ứng dụng
- Là object lớn chứa dữ liệu của cả ứng dụng

### 2.2 Slice (Lát Cắt State)

// slices/cartSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',              // tên slice
  initialState: [],          // state ban đầu
  reducers: {
    // các actions sẽ viết ở đây
  }
});

export default cartSlice.reducer;
export const { /* actions */ } = cartSlice.actions;

**Slice là gì?**
- Một **phần của state** (slice = lát cắt)
- Chứa state, actions, và reducer của một tính năng
- Ví dụ: slice 'cart' quản lý giỏ hàng

### 2.3 Actions (Hành Động)
// Redux Toolkit tự sinh action creators
export const { addToCart, removeFromCart } = cartSlice.actions;

// Sử dụng:
dispatch(addToCart(product));

**Actions là gì?**
- Là những **sự kiện** (events) mô tả điều gì đó đã xảy ra
- Ví dụ: `addToCart`, `removeFromCart`, `clearCart`

### 2.4 Reducers (Hàm Xử Lý)

reducers: {
  addToCart: (state, action) => {
    // Immer cho phép thay đổi state trực tiếp
    state.push(action.payload);
  }
}

**Reducers là gì?**
- Là **hàm xử lý** nhận vào state hiện tại + action
- Trả về state mới (hoặc Immer tự xử lý)
- Phải **pure function** (không side effects)

### 2.5 Dispatch (Gửi Hành Động)
dispatch(addToCart(productData));

**Dispatch là gì?**
- **Gửi action** đến reducer để thay đổi state
- Giống như nhấn nút để kích hoạt điều gì đó

### 2.6 Selectors (Chọn Dữ Liệu)
const cartItems = useSelector(state => state.cart);

**Selectors là gì?**
- Hàm để **lấy dữ liệu từ state**
- Giống như "trích xuất" phần dữ liệu mình cần

---

## 3. Giỏ Hàng Cơ Bản (Level 1)

### Mục Tiêu
✅ Thêm sản phẩm vào giỏ
✅ Xóa sản phẩm khỏi giỏ
✅ Xem danh sách giỏ hàng

### Bước 1: Tạo Slice

// slices/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  id: number;
  name: string;
  price: number;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: []
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Thêm sản phẩm vào giỏ
    addToCart: (state, action: PayloadAction<CartItem>) => {
      state.items.push(action.payload);
    },
    
    // Xóa sản phẩm khỏi giỏ
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    
    // Xóa tất cả giỏ hàng
    clearCart: (state) => {
      state.items = [];
    }
  }
});

export default cartSlice.reducer;
export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;

### Bước 2: Tạo Store

// store.ts
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';

const store = configureStore({
  reducer: {
    cart: cartReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

### Bước 3: Sử Dụng Trong Component

// App.tsx
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart, clearCart } from './slices/cartSlice';
import { RootState } from './store';

function App() {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  const handleAddProduct = () => {
    dispatch(addToCart({
      id: 1,
      name: 'Laptop',
      price: 1000
    }));
  };

  const handleRemoveProduct = (id: number) => {
    dispatch(removeFromCart(id));
  };

  return (
    <div>
      <h1>Giỏ Hàng Cơ Bản</h1>
      
      <button onClick={handleAddProduct}>
        Thêm Laptop
      </button>

      <h2>Sản phẩm trong giỏ ({cartItems.length})</h2>
      {cartItems.map(item => (
        <div key={item.id}>
          <span>{item.name} - ${item.price}</span>
          <button onClick={() => handleRemoveProduct(item.id)}>
            Xóa
          </button>
        </div>
      ))}

      <button onClick={() => dispatch(clearCart())}>
        Xóa Tất Cả
      </button>
    </div>
  );
}

export default App;

---

## 4. Giỏ Hàng Nâng Cao (Level 2)

### Mục Tiêu
✅ Xử lý **số lượng** sản phẩm
✅ Tính **tổng giá** giỏ hàng
✅ Nếu sản phẩm đã có → tăng số lượng (không thêm lại)
✅ Tính **tổng tiền**

### Bước 1: Cập Nhật Slice

// slices/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;  // ← Thêm số lượng
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: []
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Thêm sản phẩm (kiểm tra nếu đã có)
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'quantity'>>) => {
      const existingItem = state.items.find(
        item => item.id === action.payload.id
      );
      
      if (existingItem) {
        // Nếu sản phẩm đã có → tăng số lượng
        existingItem.quantity += 1;
      } else {
        // Nếu chưa có → thêm mới với quantity = 1
        state.items.push({
          ...action.payload,
          quantity: 1
        });
      }
    },
    
    // Tăng số lượng
    increaseQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.quantity += 1;
      }
    },
    
    // Giảm số lượng
    decreaseQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
      }
    },
    
    // Xóa sản phẩm
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    
    // Xóa tất cả
    clearCart: (state) => {
      state.items = [];
    }
  }
});

export default cartSlice.reducer;
export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart
} = cartSlice.actions;
```

### Bước 2: Tạo Selectors

// slices/cartSlice.ts - Thêm vào cuối file

// Selector: Tính tổng số lượng
export const selectCartItemCount = (state: RootState) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);

// Selector: Tính tổng tiền
export const selectCartTotal = (state: RootState) =>
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

// Selector: Lấy danh sách items
export const selectCartItems = (state: RootState) => state.cart.items;

### Bước 3: Component Nâng Cao

// App.tsx
import { useDispatch, useSelector } from 'react-redux';
import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemCount
} from './slices/cartSlice';
import { RootState } from './store';

function App() {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectCartTotal);
  const itemCount = useSelector(selectCartItemCount);

  const products = [
    { id: 1, name: 'Laptop', price: 1000 },
    { id: 2, name: 'Mouse', price: 25 },
    { id: 3, name: 'Keyboard', price: 80 }
  ];

  return (
    <div>
      <h1>🛒 Giỏ Hàng Nâng Cao</h1>

      <h2>Danh Sách Sản Phẩm</h2>
      {products.map(product => (
        <button
          key={product.id}
          onClick={() => dispatch(addToCart(product))}
        >
          {product.name} (${product.price})
        </button>
      ))}

      <h2>Giỏ Hàng ({itemCount} sản phẩm)</h2>
      
      {cartItems.length === 0 ? (
        <p>Giỏ hàng trống</p>
      ) : (
        <>
          {cartItems.map(item => (
            <div key={item.id}>
              <span>{item.name} x {item.quantity}</span>
              <span>${item.price * item.quantity}</span>
              
              <button onClick={() => dispatch(increaseQuantity(item.id))}>
                +
              </button>
              <button onClick={() => dispatch(decreaseQuantity(item.id))}>
                -
              </button>
              <button onClick={() => dispatch(removeFromCart(item.id))}>
                Xóa
              </button>
            </div>
          ))}
          
          <hr />
          <h3>Tổng Cộng: ${totalPrice.toFixed(2)}</h3>
          
          <button onClick={() => dispatch(clearCart())}>
            Xóa Tất Cả
          </button>
        </>
      )}
    </div>
  );
}

export default App;

---

## 5. Giỏ Hàng Chuyên Nghiệp (Level 3)

### Mục Tiêu
✅ Lưu trữ vào LocalStorage
✅ Dùng **Async Thunk** để lấy dữ liệu sản phẩm từ API
✅ Xử lý **trạng thái** (loading, success, error)
✅ Tính **thuế**, **phí vận chuyển**, **giảm giá**

### Bước 1: Tạo Async Thunk

// slices/productsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface ProductsState {
  items: Product[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Async Thunk: Lấy dữ liệu từ API
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => {
    const response = await fetch('https://api.example.com/products');
    if (!response.ok) throw new Error('Failed to fetch products');
    return (await response.json()) as Product[];
  }
);

const initialState: ProductsState = {
  items: [],
  status: 'idle',
  error: null
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Unknown error';
      });
  }
});

export default productsSlice.reducer;
```

### Bước 2: Cập Nhật Cart Slice với Persistent

// slices/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  discountCode: string | null;
  taxRate: number; // 10% = 0.1
  shippingCost: number;
}

const initialState: CartState = {
  items: JSON.parse(localStorage.getItem('cartItems') || '[]'),
  discountCode: null,
  taxRate: 0.1,
  shippingCost: 10
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'quantity'>>) => {
      const existingItem = state.items.find(
        item => item.id === action.payload.id
      );
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
      
      // Lưu vào localStorage
      localStorage.setItem('cartItems', JSON.stringify(state.items));
    },
    
    increaseQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) item.quantity += 1;
      localStorage.setItem('cartItems', JSON.stringify(state.items));
    },
    
    decreaseQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item && item.quantity > 1) item.quantity -= 1;
      localStorage.setItem('cartItems', JSON.stringify(state.items));
    },
    
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      localStorage.setItem('cartItems', JSON.stringify(state.items));
    },
    
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('cartItems');
    },
    
    // Áp dụng mã giảm giá
    applyDiscount: (state, action: PayloadAction<string>) => {
      state.discountCode = action.payload;
    },
    
    // Đặt phí vận chuyển
    setShippingCost: (state, action: PayloadAction<number>) => {
      state.shippingCost = action.payload;
    }
  }
});

export default cartSlice.reducer;
export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  applyDiscount,
  setShippingCost
} = cartSlice.actions;

### Bước 3: Selectors Nâng Cao

// slices/cartSelectors.ts
import { RootState } from '../store';

// Subtotal (tổng trước thuế)
export const selectSubtotal = (state: RootState) =>
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

// Tính giảm giá
export const selectDiscount = (state: RootState) => {
  const subtotal = selectSubtotal(state);
  const discountRates: Record<string, number> = {
    'SUMMER10': 0.1,
    'SPECIAL20': 0.2
  };
  const rate = discountRates[state.cart.discountCode || ''] || 0;
  return subtotal * rate;
};

// Tính thuế
export const selectTax = (state: RootState) => {
  const subtotal = selectSubtotal(state);
  return subtotal * state.cart.taxRate;
};

// Tổng tiền cuối cùng
export const selectCartTotal = (state: RootState) => {
  const subtotal = selectSubtotal(state);
  const discount = selectDiscount(state);
  const tax = selectTax(state);
  return subtotal - discount + tax + state.cart.shippingCost;
};

// Chi tiết hóa đơn
export const selectCartSummary = (state: RootState) => ({
  subtotal: selectSubtotal(state),
  discount: selectDiscount(state),
  tax: selectTax(state),
  shipping: state.cart.shippingCost,
  total: selectCartTotal(state),
  itemCount: state.cart.items.reduce((count, item) => count + item.quantity, 0)
});

### Bước 4: Component Chuyên Nghiệp

// components/ShoppingCart.tsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../slices/productsSlice';
import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  applyDiscount,
  setShippingCost
} from '../slices/cartSlice';
import { selectCartSummary } from '../slices/cartSelectors';
import { RootState } from '../store';

function ShoppingCart() {
  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.products.items);
  const productsStatus = useSelector((state: RootState) => state.products.status);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const summary = useSelector(selectCartSummary);

  useEffect(() => {
    if (productsStatus === 'idle') {
      dispatch(fetchProducts() as any);
    }
  }, [dispatch, productsStatus]);

  const handleApplyDiscount = (code: string) => {
    dispatch(applyDiscount(code));
  };

  const handleShippingChange = (cost: number) => {
    dispatch(setShippingCost(cost));
  };

  if (productsStatus === 'loading') return <p>Đang tải...</p>;
  if (productsStatus === 'failed') return <p>Lỗi tải dữ liệu</p>;

  return (
    <div className="shopping-cart">
      <h1>🛍️ Cửa Hàng Trực Tuyến</h1>

      {/* Danh sách sản phẩm */}
      <section className="products">
        <h2>Sản Phẩm Có Sẵn</h2>
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p>${product.price.toFixed(2)}</p>
              <button onClick={() => dispatch(addToCart(product))}>
                Thêm Vào Giỏ
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Giỏ hàng */}
      <section className="cart">
        <h2>Giỏ Hàng ({summary.itemCount} sản phẩm)</h2>

        {cartItems.length === 0 ? (
          <p>Giỏ hàng trống</p>
        ) : (
          <>
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <span>{item.name}</span>
                <span>${item.price.toFixed(2)}</span>

                <button onClick={() => dispatch(decreaseQuantity(item.id))}>
                  -
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => dispatch(increaseQuantity(item.id))}>
                  +
                </button>

                <span>${(item.price * item.quantity).toFixed(2)}</span>
                <button onClick={() => dispatch(removeFromCart(item.id))}>
                  Xóa
                </button>
              </div>
            ))}
          </>
        )}
      </section>

      {/* Áp dụng mã giảm giá */}
      <section className="discount">
        <h3>Mã Giảm Giá</h3>
        <button onClick={() => handleApplyDiscount('SUMMER10')}>
          SUMMER10 (-10%)
        </button>
        <button onClick={() => handleApplyDiscount('SPECIAL20')}>
          SPECIAL20 (-20%)
        </button>
      </section>

      {/* Lựa chọn vận chuyển */}
      <section className="shipping">
        <h3>Phí Vận Chuyển</h3>
        <label>
          <input
            type="radio"
            name="shipping"
            onChange={() => handleShippingChange(0)}
          />
          Miễn phí
        </label>
        <label>
          <input
            type="radio"
            name="shipping"
            onChange={() => handleShippingChange(10)}
            defaultChecked
          />
          Tiêu chuẩn ($10)
        </label>
        <label>
          <input
            type="radio"
            name="shipping"
            onChange={() => handleShippingChange(25)}
          />
          Nhanh ($25)
        </label>
      </section>

      {/* Tóm tắt hóa đơn */}
      <section className="summary">
        <h2>Tóm Tắt Đơn Hàng</h2>
        <div className="summary-row">
          <span>Tổng cộng:</span>
          <span>${summary.subtotal.toFixed(2)}</span>
        </div>
        {summary.discount > 0 && (
          <div className="summary-row discount">
            <span>Giảm giá:</span>
            <span>-${summary.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="summary-row">
          <span>Thuế (10%):</span>
          <span>${summary.tax.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Vận chuyển:</span>
          <span>${summary.shipping.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Thành Tiền:</span>
          <span>${summary.total.toFixed(2)}</span>
        </div>

        <button className="checkout-btn">Thanh Toán</button>
      </section>
    </div>
  );
}

export default ShoppingCart;

### Bước 5: Cấu Trúc Store Hoàn Chỉnh

// store.ts
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';
import productsReducer from './slices/productsSlice';

const store = configureStore({
  reducer: {
    cart: cartReducer,
    products: productsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

---

## 📊 So Sánh 3 Mức Độ

| Tính Năng | Level 1 | Level 2 | Level 3 |
|-----------|---------|---------|---------|
| Thêm/Xóa sản phẩm | ✅ | ✅ | ✅ |
| Quản lý số lượng | ❌ | ✅ | ✅ |
| Tính tổng tiền | ❌ | ✅ | ✅ |
| API async | ❌ | ❌ | ✅ |
| LocalStorage | ❌ | ❌ | ✅ |
| Mã giảm giá | ❌ | ❌ | ✅ |
| Phí vận chuyển | ❌ | ❌ | ✅ |
| Tính thuế | ❌ | ❌ | ✅ |
| Selectors nâng cao | ❌ | ✅ | ✅ |

---

## 🎯 Những Điểm Quan Trọng

### 1. Immer trong RTK
// Redux Toolkit sử dụng Immer
// Bạn có thể "thay đổi" state trực tiếp
reducers: {
  addToCart: (state, action) => {
    state.items.push(action.payload); // ✅ OK
  }
}

### 2. Async Thunk Pattern
// pending → loading
// fulfilled → success
// rejected → error

### 3. Selectors Tốt
// Dùng reselect hoặc plain selectors
// Tránh tính toán trong component
const selectTotal = (state) => /* tính toán */;

### 4. LocalStorage Persistence
// Lưu khi state thay đổi
// Khôi phục khi tải lại

---

## 🚀 Bài Tập Tiếp Theo

1. **Thêm Tính Năng**: Yêu thích sản phẩm (Favorites)
2. **Tích Hợp Auth**: Lưu giỏ hàng cho từng user
3. **Lịch Sử Mua**: Danh sách các đơn hàng cũ
4. **Đánh Giá Sản Phẩm**: Review & rating
5. **Tìm Kiếm & Lọc**: Search, filter sản phẩm

---

## 📖 Tài Liệu Tham Khảo

- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools)
- [Immer.js](https://immerjs.github.io/immer/)

---

**Tác Giả**: Tiến  
**Ngày Cập Nhật**: 2026-10-18  
**Phiên Bản**: 1.0
