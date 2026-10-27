# Tổng hợp bài giảng Redux Toolkit

## Mục lục

| Bài | Nội dung                                |  
|---  |-----------------------------------------| 
| 1   | Selector trong Redux Toolkit            |          
| 2   | `createAsyncThunk` trong Redux Toolkit  |          
| 3   | CRUD với `createAsyncThunk`             |          
| 4   | RTK Query                               |          
| 5   | TanStack Query (React Query) kết hợp RTK|           

---

# Bài 1: Selector trong Redux Toolkit

## Phân bổ thời gian

| Phần | Nội dung                         | Thời gian |
|------|----------------------------------|-----------|
| 1    | Selector là gì, vì sao cần       |           |
| 2    | `useSelector` và selector cơ bản |           |
| 3    | Selector trong `createSlice`     |           |
| 4    | `createSelector` (memoization)   |           |
| 5    | Lỗi thường gặp và tổng kết       |           |

## 1. Selector là gì?

Selector là một hàm nhận `state` và trả về đúng phần dữ liệu component cần.

const selectUser = (state) => state.user.info;
 

 Lý do dùng selector:

-   Tái sử dụng: viết một lần, dùng ở nhiều component.
-   Đóng gói cấu trúc state: nếu đổi cấu trúc state, chỉ sửa selector, không sửa từng component.
-   Tính toán dữ liệu dẫn xuất (lọc, tổng, đếm) mà không lưu thừa vào store.
-   Tối ưu hiệu năng khi kết hợp memoization.

  Ví dụ: ứng dụng Todo.

 
// state
{
  todos: {
    items: [
      { id: 1, title: "Học Redux", done: true },
      { id: 2, title: "Học Selector", done: false },
    ],
    filter: "all", // "all" | "done" | "active"
  }
}
 

## 2. `useSelector` và selector cơ bản  
 
import { useSelector } from "react-redux";

// Selector viết riêng, dễ tái sử dụng
export const selectTodos = (state) => state.todos.items;
export const selectFilter = (state) => state.todos.filter;

function TodoList() {
  const todos = useSelector(selectTodos);
  return (
    <ul>
      {todos.map((t) => <li key={t.id}>{t.title}</li>)}
    </ul>
  );
}
 

 Cách `useSelector` hoạt động:  

1. Chạy selector mỗi khi store thay đổi.
2. So sánh kết quả mới với kết quả cũ bằng `===` (so sánh tham chiếu).
3. Nếu khác, component re-render. Nếu giống, bỏ qua.

Nguyên tắc: chọn dữ liệu nhỏ nhất component cần.

// ❌ Lấy cả state, đổi bất cứ gì cũng re-render
const state = useSelector((state) => state);

// ✅ Chỉ lấy phần cần
const filter = useSelector(selectFilter);
 

## 3. Selector trong `createSlice`

Từ RTK 2.0, `createSlice` hỗ trợ trường `selectors`. Các selector này nhận state của slice, không phải root state.
 
import { createSlice } from "@reduxjs/toolkit";

const todosSlice = createSlice({
  name: "todos",
  initialState: { items: [], filter: "all" },
  reducers: {
    addTodo: (state, action) => {
      state.items.push(action.payload);
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
  },
  selectors: {
    selectItems: (sliceState) => sliceState.items,
    selectFilter: (sliceState) => sliceState.filter,
    selectDoneCount: (sliceState) =>
    sliceState.items.filter((t) => t.done).length,
  },
});

export const { addTodo, setFilter } = todosSlice.actions;
export const { selectItems, selectFilter, selectDoneCount } = todosSlice.selectors; 


Khi export qua `todosSlice.selectors`, selector tự động được "gắn" vào đúng vị trí slice trong root state, nên dùng bình thường:
 
const doneCount = useSelector(todosSlice.selectors.selectDoneCount);
 

> Nếu dùng phiên bản RTK cũ hơn, hãy viết selector thủ công: `(state) => state.todos.items`.

## 4. `createSelector`: Memoization 

### Vấn đề

Selector tạo ra tham chiếu mới mỗi lần chạy sẽ khiến component re-render dù dữ liệu không đổi:

// ❌ filter() luôn trả về mảng MỚI → re-render mỗi lần store đổi
const selectVisibleTodos = (state) => {
  const { items, filter } = state.todos;
  if (filter === "done") return items.filter((t) => t.done);
  if (filter === "active") return items.filter((t) => !t.done);
  return items;
};


### Giải pháp: `createSelector`

RTK tích hợp sẵn `createSelector` (từ thư viện Reselect). Nó ghi nhớ kết quả và chỉ tính lại khi input selector thay đổi.


import { createSelector } from "@reduxjs/toolkit";

const selectItems = (state) => state.todos.items;
const selectFilter = (state) => state.todos.filter;

export const selectVisibleTodos = createSelector(
  [selectItems, selectFilter],      // input selectors
  (items, filter) => {              // output selector (chỉ chạy khi input đổi)
    console.log("Tính lại danh sách...");
    if (filter === "done") return items.filter((t) => t.done);
    if (filter === "active") return items.filter((t) => !t.done);
    return items;
  }
);
 
 
function TodoList() {
  const todos = useSelector(selectVisibleTodos);
  // ...
}
 

Kết quả: nếu `items` và `filter` không đổi (ví dụ một slice khác cập nhật), hàm tính toán không chạy lại và trả về đúng mảng cũ, nên không re-render thừa.

### Selector có tham số

export const selectTodoById = createSelector(
  [selectItems, (state, id) => id],
  (items, id) => items.find((t) => t.id === id)
);

// Dùng
const todo = useSelector((state) => selectTodoById(state, 2));
 

### Khi nào nên dùng `createSelector`?

| Trường hợp                                               | Dùng?       |
|----------------------------------------------------------|-------------|
| Chỉ lấy một field: `state.user.name`                     | ❌ Không cần|
| Có `filter`, `map`, `sort`, `reduce` tạo mảng/object mới | ✅ Nên dùng |
| Tính toán nặng từ nhiều phần của state                   | ✅ Nên dùng |

## 5. Lỗi thường gặp và tổng kết

  Lỗi 1: Trả về object/mảng mới trong `useSelector`  

 
// ❌ Mỗi lần chạy là một object mới → re-render liên tục
const data = useSelector((state) => ({
  a: state.a,
  b: state.b,
}));

// ✅ Tách thành nhiều useSelector, hoặc dùng createSelector
const a = useSelector((state) => state.a);
const b = useSelector((state) => state.b);
 

Lỗi 2: Đặt `createSelector` bên trong component (bị tạo lại mỗi lần render, mất memoization). Hãy khai báo selector bên ngoài component.

Lỗi 3: Lưu dữ liệu dẫn xuất vào store (ví dụ lưu `doneCount` trong state). Hãy tính bằng selector.

Lỗi 4: Mutate state trong selector. Selector chỉ được đọc, không sửa state.

### Tóm tắt

1. Selector là hàm `(state) => dữ liệu`.
2. Dùng `useSelector` và chọn dữ liệu nhỏ nhất cần thiết.
3. Có thể khai báo selector ngay trong `createSlice` (RTK 2.0+).
4. Dùng `createSelector` khi selector tạo dữ liệu dẫn xuất mới.
5. Khai báo selector bên ngoài component.

## Bài tập nhanh

Viết selector `selectProgress` trả về phần trăm todo đã hoàn thành (`done / tổng * 100`), dùng `createSelector`. Gợi ý:

 
export const selectProgress = createSelector([selectItems], (items) =>
  items.length === 0 ? 0: Math.round((items.filter((t) => t.done).length / items.length) * 100)
);
 
# Bài 2: `createAsyncThunk` trong Redux Toolkit

## Phân bổ thời gian

| Phần |             Nội dung                           |  
|---|---------------------------------------------------| 
| 1 | Vấn đề bất đồng bộ và `createAsyncThunk` là gì    |   
| 2 | Cú pháp và vòng đời 3 trạng thái                  |  
| 3 | Xử lý trong `extraReducers`                       |   
| 4 | Dùng trong component, `unwrap`, `rejectWithValue` |   
| 5 | Lỗi thường gặp và tổng kết                        |   

## 1. Vấn đề và khái niệm  

Reducer trong Redux phải là hàm thuần, đồng bộ. Nó không được gọi API. Vậy gọi API ở đâu?

 Thunk là một hàm được dispatch thay cho action thường. Nó có thể chạy code bất đồng bộ rồi dispatch các action khác.

  `createAsyncThunk` tự động hóa mẫu quen thuộc khi gọi API:

1. Dispatch action "đang tải" (`pending`)
2. Chạy hàm async của bạn
3. Dispatch `fulfilled` (thành công) hoặc `rejected` (thất bại)

Không cần tự viết 3 action type và khối `try/catch` lặp đi lặp lại.

Ví dụ: tải danh sách user từ API.

// state mong muốn
{
  users: {
    list: [],
    status: "idle", // "idle" | "loading" | "succeeded" | "failed"
    error: null,
  }
}
 

## 2. Cú pháp và vòng đời  

 
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",          // 1. type prefix
  async () => {                // 2. payload creator (hàm async)
    const res = await fetch("https://jsonplaceholder.typicode.com/users");
    return await res.json();   // giá trị return trở thành action.payload
  }
);
 
Hai tham số chính:  

-   Type prefix   (`"users/fetchUsers"`): chuỗi dùng để sinh ra 3 action type.
-   Payload creator : hàm async trả về dữ liệu (hoặc ném lỗi).

  Ba action được sinh ra tự động:  

| Action                | Type                       |Khi nào            | `action.payload`   |
|-----------------------|----------------------------|-------------------|------------------  |
| `fetchUsers.pending`  |`users/fetchUsers/pending`  |Bắt đầu gọi        | không có           |
| `fetchUsers.fulfilled`|`users/fetchUsers/fulfilled`|Promise thành công | giá trị được return|
| `fetchUsers.rejected` |`users/fetchUsers/rejected` |Promise bị lỗi     | undefined (lỗi ở `action.error`) |

  Truyền tham số:  đối số đầu tiên của payload creator là tham số khi dispatch.

export const fetchUserById = createAsyncThunk(
  "users/fetchById",
  async (userId) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
    return await res.json();
  }
);

// dispatch(fetchUserById(5))
 

> Nếu cần nhiều tham số, hãy gộp thành một object: `fetchUsers({ page: 1, limit: 10 })`.

## 3. Xử lý trong `extraReducers` 

Các action của thunk không thuộc `reducers` của slice, nên ta xử lý trong `extraReducers` với cú pháp builder.

 
import { createSlice } from "@reduxjs/toolkit";

const usersSlice = createSlice({
  name: "users",
  initialState: { list: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default usersSlice.reducer;
 

Nhờ Immer, ta được phép viết kiểu "mutate" (`state.status = ...`) ngay trong case reducer.

  Selector đi kèm:  

 
export const selectUsers = (state) => state.users.list;
export const selectUsersStatus = (state) => state.users.status;
export const selectUsersError = (state) => state.users.error;
 

## 4. Dùng trong component 

### 4.1. Dispatch thunk

 
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

function UserList() {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const status = useSelector(selectUsersStatus);
  const error = useSelector(selectUsersError);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchUsers());
    }
  }, [status, dispatch]);

  if (status === "loading") return <p>Đang tải...</p>;
  if (status === "failed") return <p>Lỗi: {error}</p>;

  return (
    <ul>
      {users.map((u) => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}
 

Điều kiện `status === "idle"` giúp tránh gọi API lặp lại.

### 4.2. `rejectWithValue`: trả lỗi có cấu trúc

Mặc định `action.error` chỉ chứa `message` đã bị serialize. Muốn gửi lỗi tùy chỉnh (ví dụ thông báo từ server), dùng `rejectWithValue`:

 
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        const err = await res.json();
        return rejectWithValue(err.message); // trở thành action.payload
      }
      return await res.json();
    } catch (e) {
      return rejectWithValue("Không thể kết nối server");
    }
  }
);

// trong extraReducers
.addCase(login.rejected, (state, action) => {
  state.error = action.payload ?? action.error.message;
});
 

> Lưu ý: `fetch`   không tự ném lỗi   với mã 4xx/5xx, bạn phải tự kiểm tra `res.ok`. Với `axios` thì có ném lỗi.

### 4.3. `unwrap()`: xử lý kết quả ngay tại nơi dispatch

`dispatch(thunk)` luôn trả về một promise   không bao giờ reject  . Dùng `.unwrap()` để lấy payload hoặc ném lỗi:

 
const handleLogin = async () => {
  try {
    const user = await dispatch(login({ email, password })).unwrap();
    navigation.navigate("Home"); // chỉ chạy khi thành công
  } catch (err) {
    Alert.alert("Đăng nhập thất bại", err);
  }
};
 

### 4.4. Tham số thứ hai: `thunkAPI`

 
async (arg, { dispatch, getState, rejectWithValue, signal }) => { ... }
 

| Thuộc tính | Công dụng                            |
|------------|--------------------------------------|
| `getState` | Đọc state hiện tại (ví dụ lấy token) |
| `dispatch` | Dispatch thêm action khác            |
| `rejectWithValue` | Trả lỗi tùy chỉnh             |
| `signal` | Hủy request bằng `AbortController`     |

Ví dụ thêm điều kiện, chặn gọi trùng:

 
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async () => { /* ... */ },
  {
    condition: (_, { getState }) => {
      return getState().users.status !== "loading"; // false → bỏ qua
    },
  }
);
 

## 5. Lỗi thường gặp và tổng kết 

  Lỗi 1: Gọi API trong reducer.   Reducer phải thuần, hãy dùng thunk.

  Lỗi 2: Quên kiểm tra `res.ok` khi dùng `fetch`.   Lỗi 404/500 sẽ vào `fulfilled` thay vì `rejected`.

  Lỗi 3: Đặt thunk vào `reducers` thay vì `extraReducers`.   Sẽ không xử lý được `pending/fulfilled/rejected`.

  Lỗi 4: Dispatch trong `useEffect` không có điều kiện.   Gây gọi API lặp. Dùng kiểm tra `status` hoặc `condition`.

  Lỗi 5: Dùng `try/catch` quanh `dispatch(thunk())` mà không `unwrap()`.   Lỗi sẽ không bị bắt vì promise không reject.

  Lỗi 6: Trả về giá trị không serializable   (như `Date`, `Error`, class instance). Redux sẽ cảnh báo.

### Tóm tắt

1. `createAsyncThunk(prefix, asyncFn)` sinh ra 3 action: `pending`, `fulfilled`, `rejected`.
2. Xử lý chúng trong `extraReducers` bằng `builder.addCase`.
3. Dùng `status` (`idle/loading/succeeded/failed`) để điều khiển UI.
4. Dùng `rejectWithValue` để trả lỗi có cấu trúc.
5. Dùng `.unwrap()` khi cần `try/catch` tại nơi dispatch.

## Bài tập nhanh

Viết thunk `addPost` gửi `POST` tới `https://jsonplaceholder.typicode.com/posts`, thêm bài viết mới vào đầu mảng `posts` khi thành công, và hiển thị lỗi khi thất bại. Gợi ý:

 
export const addPost = createAsyncThunk(
  "posts/addPost",
  async (newPost, { rejectWithValue }) => {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost),
    });
    if (!res.ok) return rejectWithValue("Không thể thêm bài viết");
    return await res.json();
  }
);

// trong extraReducers
.addCase(addPost.fulfilled, (state, action) => {
  state.posts.unshift(action.payload);
});
 


# Bài 3: CRUD với `createAsyncThunk` 

## Phân bổ thời gian

| Phần | Nội dung  
|---   |---------------------------------------------- 
| 1    | Tổng quan CRUD và thiết kế state  
| 2    | Khai báo 4 thunk: Read, Create, Update, Delete  
| 3    | Xử lý trong `extraReducers`  
| 4    | Giao diện component hoàn chỉnh  
| 5    | Lỗi thường gặp và tổng kết  

## 1. Tổng quan và thiết kế state (4')

  CRUD   gồm 4 thao tác ứng với 4 phương thức HTTP:

| Thao tác         | HTTP                | Thunk        | Kết quả cập nhật vào state |
|------------------|------------------   |--------------|------------------|
|   R  ead (đọc)   | `GET /posts`        | `fetchPosts` | Gán cả danh sách |
|   C  reate (tạo) | `POST /posts`       | `addPost`    | Thêm phần tử mới |
|   U  pdate (sửa) | `PUT /posts/:id`    | `updatePost` | Thay phần tử cũ |
|   D  elete (xóa) | `DELETE /posts/:id` | `deletePost` | Loại phần tử khỏi mảng |

  Ví dụ xuyên suốt:   quản lý bài viết (posts) với API giả `https://jsonplaceholder.typicode.com`.

 
// state
{
  posts: {
    items: [],
    status: "idle",   // trạng thái tải danh sách
    error: null,
  }
}
 

> Lưu ý: JSONPlaceholder chỉ   giả lập   ghi dữ liệu. POST/PUT/DELETE trả về kết quả thành công nhưng không thực sự lưu, nên bài `addPost` sẽ luôn nhận `id: 101`. Đủ để học luồng Redux.

## 2. Khai báo 4 thunk 

Tạo file `postsSlice.js`. Đặt hằng số URL để dùng lại:

 
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API = "https://jsonplaceholder.typicode.com/posts";
 

Viết một hàm tiện ích để tránh lặp lại việc kiểm tra `res.ok`:
 
const request = async (url, options) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Lỗi ${res.status}`);
  return res.json();
};
 

### Read: lấy danh sách

 
export const fetchPosts = createAsyncThunk("posts/fetchPosts", async () => {
  return await request(`${API}?_limit=10`);
});
 

### Create: thêm mới
 
export const addPost = createAsyncThunk("posts/addPost", async (newPost) => {
  return await request(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newPost),
  });
});
 

Dispatch: `dispatch(addPost({ title: "Tiêu đề", body: "Nội dung", userId: 1 }))`

### Update: cập nhật
 
export const updatePost = createAsyncThunk("posts/updatePost", async (post) => {
  return await request(`${API}/${post.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });
});
 

### Delete: xóa

API xóa không trả về dữ liệu hữu ích, nên ta   return `id`   để reducer biết phần tử nào cần loại bỏ.

 
export const deletePost = createAsyncThunk("posts/deletePost", async (id) => {
  await request(`${API}/${id}`, { method: "DELETE" });
  return id; // trở thành action.payload
});
 

  Điểm mấu chốt:   giá trị mà thunk `return` chính là `action.payload` của `fulfilled`. Hãy return đúng thứ reducer cần.

## 3. Xử lý trong `extraReducers` (7')
 
const postsSlice = createSlice({
  name: "posts",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // READ
      .addCase(fetchPosts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })

      // CREATE: thêm vào đầu mảng
      .addCase(addPost.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })

      // UPDATE: thay phần tử có cùng id
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })

      // DELETE: lọc bỏ phần tử theo id
      .addCase(deletePost.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export default postsSlice.reducer;

// Selectors
export const selectPosts = (state) => state.posts.items;
export const selectPostsStatus = (state) => state.posts.status;
export const selectPostsError = (state) => state.posts.error;
 

  Ghi nhớ nhanh:  

| Thao tác  | Cách cập nhật mảng |
|---        |---                 |
| Create    | `unshift` / `push` |
| Update    | `findIndex` rồi gán `state.items[index] = ...` |
| Delete    | `filter` loại id   |

Nhờ Immer, ta được viết `unshift`, gán trực tiếp... mà không phá vỡ tính bất biến.

## 4. Giao diện component hoàn chỉnh  

 
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPosts, addPost, updatePost, deletePost,
  selectPosts, selectPostsStatus, selectPostsError,
} from "./postsSlice";

export default function PostManager() {
  const dispatch = useDispatch();
  const posts = useSelector(selectPosts);
  const status = useSelector(selectPostsStatus);
  const error = useSelector(selectPostsError);

  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState(null);

  // READ khi component mount
  useEffect(() => {
    if (status === "idle") dispatch(fetchPosts());
  }, [status, dispatch]);

  // CREATE hoặc UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      if (editingId) {
        await dispatch(
          updatePost({ id: editingId, title, body: "...", userId: 1 })
        ).unwrap();
      } else {
        await dispatch(addPost({ title, body: "...", userId: 1 })).unwrap();
      }
      setTitle("");
      setEditingId(null);
    } catch (err) {
      alert("Thao tác thất bại: " + err.message);
    }
  };

  const startEdit = (post) => {
    setEditingId(post.id);
    setTitle(post.title);
  };

  if (status === "loading") return <p>Đang tải...</p>;
  if (status === "failed") return <p>Lỗi: {error}</p>;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề bài viết"
        />
        <button type="submit">{editingId ? "Cập nhật" : "Thêm"}</button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setTitle(""); }}>
            Hủy
          </button>
        )}
      </form>

      <ul>
        {posts.map((p) => (
          <li key={p.id}>
            {p.title}
            <button onClick={() => startEdit(p)}>Sửa</button>
            <button onClick={() => dispatch(deletePost(p.id))}>Xóa</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

  Luồng dữ liệu cần nhấn mạnh:  

1. Người dùng bấm nút → `dispatch(thunk)`
2. Thunk gọi API → `fulfilled`
3. `extraReducers` cập nhật `state.items`
4. `useSelector` nhận dữ liệu mới → UI tự render lại

Component không tự sửa danh sách, mọi thay đổi đi qua store.

## 5. Lỗi thường gặp và tổng kết  

  Lỗi 1: Quên return `id` ở thunk xóa.   Reducer không biết xóa phần tử nào (`action.payload` là `undefined`).

  Lỗi 2: Quên kiểm tra `res.ok` khi dùng `fetch`.   Lỗi 404/500 vẫn vào `fulfilled`, state bị cập nhật sai.

  Lỗi 3: Dùng chung `status` cho cả 4 thao tác.   Khi thêm/xóa, `status = "loading"` sẽ làm cả danh sách biến mất. Ở ví dụ trên, chỉ `fetchPosts` thay đổi `status`. Nếu cần hiển thị loading cho từng thao tác, hãy thêm state riêng (ví dụ `deletingId`).

  Lỗi 4: Không `unwrap()` khi cần `try/catch`.   Lỗi sẽ không bị bắt.

  Lỗi 5: So sánh `id` sai kiểu   (chuỗi `"5"` với số `5`) khiến `findIndex`/`filter` không khớp.

### Tóm tắt

1. Mỗi thao tác CRUD là một thunk, mỗi thunk sinh ra `pending/fulfilled/rejected`.
2. Thunk   return đúng dữ liệu reducer cần   (đối tượng mới, hoặc `id` khi xóa).
3. Reducer cập nhật mảng: `unshift` (tạo), gán theo index (sửa), `filter` (xóa).
4. Dùng `.unwrap()` để xử lý thành công/thất bại tại component.
5. Tách trạng thái tải danh sách khỏi trạng thái các thao tác ghi.

## Bài tập nhanh

Thêm trạng thái `deletingId` để khi bấm Xóa, nút của đúng bài viết đó hiện "Đang xóa..." và bị vô hiệu hóa. Gợi ý:
 
// initialState: thêm deletingId: null
.addCase(deletePost.pending, (state, action) => {
  state.deletingId = action.meta.arg; // arg chính là id truyền vào thunk
})
.addCase(deletePost.fulfilled, (state, action) => {
  state.deletingId = null;
  state.items = state.items.filter((p) => p.id !== action.payload);
})
.addCase(deletePost.rejected, (state) => {
  state.deletingId = null;
});
 
 
<button
  disabled={deletingId === p.id}
  onClick={() => dispatch(deletePost(p.id))}
>
  {deletingId === p.id ? "Đang xóa..." : "Xóa"}
</button>
 
---

# Bài 4: RTK Query 


## Phân bổ thời gian

| Phần| Nội dung 				 
|---  |------------------------------------------------- 
| 1   | RTK Query là gì, so sánh với `createAsyncThunk`  |
| 2   | Cài đặt: `createApi` và store  
| 3   | Query hook: lấy dữ liệu 
| 4   | Mutation và tag: tạo, sửa, xóa, tự cập nhật cache  
| 5   | Tùy chọn nâng cao và optimistic update  
| 6   | Lỗi thường gặp và tổng kết  

## 1. RTK Query là gì? 

Với `createAsyncThunk`, bạn phải tự viết: thunk, `pending/fulfilled/rejected`, state `status/error`, `useEffect` để gọi.
RTK Query gộp tất cả vào một nơi:

- Tự gọi API, cache, theo dõi loading/error  .
- Tự sinh hook (`useGetPostsQuery`...).
- Tự loại bỏ request trùng và refetch khi dữ liệu cũ.
- Không cần viết slice, thunk hay `extraReducers` cho dữ liệu từ server.

|                          | `createAsyncThunk`         | RTK Query|
|--------------------------|-------------------------   |----------|
| Viết state loading/error | Tự viết                    | Có sẵn   |
| Cache                    | Tự quản lý                 | Tự động  |
| Gọi API trong component  | `useEffect` + `dispatch`   | Gọi hook |
| Cập nhật sau khi ghi     | Sửa thủ công trong reducer | Khai báo tag, tự refetch |

Khi nào dùng cái nào? Dữ liệu từ server (danh sách, chi tiết, CRUD) thì dùng RTK Query. 
Logic bất đồng bộ phức tạp không phải kiểu "lấy và cache dữ liệu" thì dùng `createAsyncThunk`.

Ví dụ: quản lý bài viết (posts) với `https://jsonplaceholder.typicode.com`.

## 2. Cài đặt 

RTK Query đã có sẵn trong `@reduxjs/toolkit`, không cần cài thêm.

### 2.1. Tạo API slice

// features/api/apiSlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",                       // khóa trong store
  baseQuery: fetchBaseQuery({
    baseUrl: "https://jsonplaceholder.typicode.com",
  }),
  tagTypes: ["Post"],                       // khai báo loại tag (dùng ở phần 4)
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: () => "/posts?_limit=10",
    }),
  }),
});

// Hook được sinh tự động: use + TênEndpoint + Query
export const { useGetPostsQuery } = apiSlice;
 

  Ba thành phần chính:  

- `baseQuery`: cấu hình chung (URL gốc, header). `fetchBaseQuery` là bọc mỏng của `fetch`.
- `endpoints`: danh sách các thao tác. `builder.query` để   đọc  , `builder.mutation` để   ghi  .
- Hook tự sinh theo quy tắc đặt tên.

### 2.2. Gắn vào store

 
// app/store.js
import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../features/api/apiSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,   // reducer của API
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware), // BẮT BUỘC
});
 

Hai dòng bắt buộc : thêm `reducer` và thêm `middleware`. Thiếu middleware thì cache, polling, refetch không hoạt động.

`Provider` bọc ngoài `App` như bình thường:

 
<Provider store={store}><App /></Provider>
 

## 3. Query hook: lấy dữ liệu 

### 3.1. Dùng trong component
 
import { useGetPostsQuery } from "./features/api/apiSlice";

function PostList() {

  const { data: posts, isLoading, isError, error } = useGetPostsQuery();

  if (isLoading) return <p>Đang tải...</p>;
  if (isError) return <p>Lỗi: {error.status}</p>;

  return (
    <ul>
      {posts.map((p) => <li key={p.id}>{p.title}</li>)}
    </ul>
  );
}
 

Không cần `useEffect`, `dispatch` hay `useSelector`.

### 3.2. Các trạng thái hook trả về

| Thuộc tính              | Ý nghĩa |
|-------------------------|-------------------------------------------------------|
| `data`                  | Dữ liệu (có thể là dữ liệu cache cũ khi đang refetch) |
| `isLoading`             | Lần tải đầu tiên  , chưa có dữ liệu                 |
| `isFetching`            | Bất kỳ lần gọi nào  , kể cả refetch nền             |
| `isSuccess` / `isError` | Thành công / thất bại                                 |
| `error`                 | Thông tin lỗi (`error.status`, `error.data`)          |
| `refetch`               | Hàm gọi lại thủ công                                  |

Dùng `isLoading` để hiện spinner toàn trang, `isFetching` để hiện chỉ báo nhỏ khi cập nhật nền.

### 3.3. Query có tham số
 
// trong endpoints
getPostById: builder.query({
  query: (id) => `/posts/${id}`,
}),

export const { useGetPostsQuery, useGetPostByIdQuery } = apiSlice;
 
 
function PostDetail({ id }) {
  const { data: post, isLoading } = useGetPostByIdQuery(id);
  if (isLoading) return <p>Đang tải...</p>;
  return <h2>{post.title}</h2>;
}
 

Cache hoạt động thế nào? Mỗi cặp (endpoint + tham số) có một mục cache riêng. Hai component cùng gọi `useGetPostByIdQuery(5)` chỉ phát   một   request và dùng chung kết quả. Khi không còn component nào dùng, dữ liệu được giữ thêm khoảng 60 giây (`keepUnusedDataFor`) rồi bị xóa.

## 4. Mutation và tag  

### 4.1. Mutation: tạo, sửa, xóa
 
addPost: builder.mutation({
  query: (newPost) => ({
    url: "/posts",
    method: "POST",
    body: newPost,
  }),
}),

updatePost: builder.mutation({
  query: ({ id, ...patch }) => ({
    url: `/posts/${id}`,
    method: "PUT",
    body: patch,
  }),
}),

deletePost: builder.mutation({
  query: (id) => ({
    url: `/posts/${id}`,
    method: "DELETE",
  }),
}),

export const {
  useGetPostsQuery,
  useAddPostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = apiSlice;
 

Hook mutation trả về mảng : `[hàmGọi, trạngThái]`.

 
function AddPostForm() {
  const [title, setTitle] = useState("");
  const [addPost, { isLoading }] = useAddPostMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addPost({ title, body: "...", userId: 1 }).unwrap();
      setTitle("");
    } catch (err) {
      alert("Thêm thất bại");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <button disabled={isLoading}>{isLoading ? "Đang thêm..." : "Thêm"}</button>
    </form>
  );
}
 

`.unwrap()` hoạt động giống `createAsyncThunk`: trả về dữ liệu hoặc ném lỗi.

### 4.2. Tag: tự làm mới danh sách sau khi ghi

Đây là phần quan trọng nhất. Thay vì sửa mảng thủ công trong reducer, ta khai báo:

- Query cung cấp tag (`providesTags`): "dữ liệu này thuộc loại X".
- Mutation  vô hiệu hóa tag (`invalidatesTags`): "ghi xong, dữ liệu loại X đã cũ".

RTK Query sẽ tự refetch mọi query đang dùng tag bị vô hiệu hóa.
 
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "https://jsonplaceholder.typicode.com" }),
  tagTypes: ["Post"],
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: () => "/posts?_limit=10",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Post", id })),
              { type: "Post", id: "LIST" },
            ]
          : [{ type: "Post", id: "LIST" }],
    }),

    addPost: builder.mutation({
      query: (newPost) => ({ url: "/posts", method: "POST", body: newPost }),
      invalidatesTags: [{ type: "Post", id: "LIST" }],      // làm mới cả danh sách
    }),

    updatePost: builder.mutation({
      query: ({ id, ...patch }) => ({ url: `/posts/${id}`, method: "PUT", body: patch }),
      invalidatesTags: (result, error, { id }) => [{ type: "Post", id }], // chỉ bài này
    }),

    deletePost: builder.mutation({
      query: (id) => ({ url: `/posts/${id}`, method: "DELETE" }),
      invalidatesTags: (result, error, id) => [{ type: "Post", id }],
    }),
  }),
});
```

  Cách đọc:  

- Mỗi bài có tag `{ type: "Post", id: 3 }`, cả danh sách có tag `{ type: "Post", id: "LIST" }`.
- `addPost` làm mất hiệu lực tag `LIST`, nên danh sách tự tải lại.
- `updatePost` / `deletePost` làm mất hiệu lực tag của đúng bài đó, nên query nào chứa bài đó sẽ tải lại.

### 4.3. Component hoàn chỉnh
 
function PostManager() {
  const { data: posts = [], isLoading, isError } = useGetPostsQuery();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();

  if (isLoading) return <p>Đang tải...</p>;
  if (isError) return <p>Có lỗi xảy ra</p>;

  return (
    <>
      <AddPostForm />
      <ul>
        {posts.map((p) => (
          <li key={p.id}>
            {p.title}
            <button disabled={isDeleting} onClick={() => deletePost(p.id)}>
              Xóa
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
 

>   Cảnh báo khi thực hành: JSONPlaceholder chỉ giả lập ghi dữ liệu, nên sau khi refetch, bài mới thêm sẽ   không xuất hiện   (server không lưu). Luồng Redux vẫn đúng, nhưng để thấy kết quả thật, hãy dùng `json-server` chạy local hoặc dùng optimistic update ở phần 5.

## 5. Tùy chọn nâng cao 

### 5.1. Tùy chọn của query hook

 
useGetPostByIdQuery(id, {
  skip: !id,                    // không gọi khi chưa có id
  pollingInterval: 30000,       // tự gọi lại mỗi 30 giây
  refetchOnMountOrArgChange: true, // luôn lấy mới khi mount
});
 

Muốn tự refetch khi quay lại tab hoặc có mạng trở lại , bật ở `createApi` và gọi `setupListeners` trong store:

 
import { setupListeners } from "@reduxjs/toolkit/query";

// trong apiSlice
createApi({ /* ... */ refetchOnFocus: true, refetchOnReconnect: true });

// sau khi tạo store
setupListeners(store.dispatch);
 

### 5.2. `transformResponse`: biến đổi dữ liệu trước khi cache
 
getPosts: builder.query({
  query: () => "/posts?_limit=10",
  transformResponse: (response) =>
    response.map((p) => ({ ...p, title: p.title.toUpperCase() })),
}),
 

### 5.3. `selectFromResult`: chỉ re-render khi phần cần thiết đổi

 
const { post } = useGetPostsQuery(undefined, {
  selectFromResult: ({ data }) => ({
    post: data?.find((p) => p.id === id),
  }),
});
 

### 5.4. Optimistic update: cập nhật UI trước, gọi server sau

 
deletePost: builder.mutation({
  query: (id) => ({ url: `/posts/${id}`, method: "DELETE" }),
  async onQueryStarted(id, { dispatch, queryFulfilled }) {
    // 1. Sửa cache ngay lập tức
    const patch = dispatch(
      apiSlice.util.updateQueryData("getPosts", undefined, (draft) => {
        const index = draft.findIndex((p) => p.id === id);
        if (index !== -1) draft.splice(index, 1);
      })
    );
    try {
      await queryFulfilled;      // 2. chờ server
    } catch {
      patch.undo();              // 3. lỗi thì hoàn tác
    }
  },
}),
 

Cách này cho UI phản hồi tức thì, và nhờ cập nhật trực tiếp cache nên hoạt động cả với JSONPlaceholder. Không đặt `invalidatesTags` cho endpoint này nếu dùng API giả, để khỏi bị refetch ghi đè.

## 6. Lỗi thường gặp và tổng kết 

  Lỗi 1: Quên thêm `apiSlice.middleware` vào store. Cache và refetch không chạy, thường có cảnh báo trong console.

  Lỗi 2: Quên `tagTypes` hoặc gõ sai tên tag. Mutation xong mà danh sách không tự làm mới.

  Lỗi 3: Nhầm `isLoading` và `isFetching`. Dùng `isLoading` để hiện spinner thì chỉ xuất hiện lần đầu, refetch nền sẽ không có.

  Lỗi 4: Mutation không `unwrap()` mà dùng `try/catch`. Lỗi không bị bắt.

  Lỗi 5: Tạo nhiều `createApi` cho cùng một server. Mỗi `createApi` có cache và middleware riêng. Nên dùng một `apiSlice` rồi mở rộng bằng `injectEndpoints` khi file quá lớn.

  Lỗi 6: Sao chép dữ liệu từ query vào state slice khác. Mất lợi thế cache, dễ lệch dữ liệu. Hãy đọc trực tiếp từ hook.

### Tóm tắt

1. `createApi` khai báo endpoint, hook được sinh tự động  .
2. Store cần cả `reducer`   và   `middleware` của API.
3. `builder.query` để đọc, `builder.mutation` để ghi.
4. `providesTags` + `invalidatesTags` giúp tự refetch sau khi ghi, thay cho việc sửa mảng thủ công.
5. Dùng `isLoading` (lần đầu), `isFetching` (mọi lần), `.unwrap()` cho mutation.
6. Cần phản hồi tức thì thì dùng optimistic update với `updateQueryData`.

## Bài tập nhanh

Thêm endpoint `updatePost` cho nút "Sửa", dùng `invalidatesTags` theo `id`, và hiển thị "Đang lưu..." bằng `isLoading` của mutation. Gợi ý:

 
function EditPost({ post }) {
  const [title, setTitle] = useState(post.title);
  const [updatePost, { isLoading }] = useUpdatePostMutation();

  return (
    <>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <button
        disabled={isLoading}
        onClick={() => updatePost({ id: post.id, title, body: post.body, userId: post.userId })}
      >
        {isLoading ? "Đang lưu..." : "Lưu"}
      </button>
    </>
  );
}

---

# Bài 5: TanStack Query (React Query) kết hợp Redux Toolkit 

>   Lưu ý: TanStack Query là thư viện độc lập, không nằm trong Redux Toolkit (phần có sẵn trong RTK là RTK Query). Hai thứ này thường được dùng cùng nhau : TanStack Query quản lý dữ liệu từ server, Redux Toolkit quản lý state phía client. Bài này dùng TanStack Query v5.

## Phân bổ thời gian

| Phần | Nội dung  
|---   |--------------------------------------------------------------| 
| 1    | TanStack Query là gì, phân biệt server state và client state |  
| 2    | Cài đặt và `useQuery`  
| 3    | `useMutation` và `invalidateQueries` (CRUD)  
| 4    | Kết hợp với Redux Toolkit  
| 5    | Optimistic update  
| 6    | Lỗi thường gặp và tổng kết 

---

## 1. Khái niệm  

  Server state (danh sách bài viết, thông tin user từ API) khác client state (tab đang chọn, bộ lọc, giỏ hàng chưa gửi):

|           | Server state                    | Client state       |
|-----------|---------------------------------|--------------------|
| Nằm ở đâu | Trên server, ta chỉ giữ bản sao | Hoàn toàn ở client |
| Có thể cũ | Có (người khác sửa được)        | Không              |
| Cần       | Cache, refetch, dedupe, retry   | Lưu, đọc, cập nhật |
| Công cụ   | TanStack Query                  | Redux Toolkit      |
 
TanStack Query tự lo: gọi API, cache, theo dõi loading/error, loại request trùng, retry, refetch khi dữ liệu cũ.

 Ví dụ : quản lý bài viết với `https://jsonplaceholder.typicode.com`.

---

## 2. Cài đặt và `useQuery`

 
npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools
 

### 2.1. Bọc `QueryClientProvider`
 
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools />
  </QueryClientProvider>
);
 

### 2.2. `useQuery`

 
import { useQuery } from "@tanstack/react-query";

const fetchPosts = async () => {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=10");
  if (!res.ok) throw new Error(`Lỗi ${res.status}`);   // phải tự ném lỗi
  return res.json();
};

function PostList() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  if (isPending) return <p>Đang tải...</p>;
  if (isError) return <p>Lỗi: {error.message}</p>;

  return <ul>{data.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}
 

  Hai thứ bắt buộc:  

-   `queryKey`  : mảng định danh cache. Cùng key thì dùng chung dữ liệu.
-   `queryFn`  : hàm trả về Promise.   Phải ném lỗi   khi thất bại (`fetch` không tự ném với 4xx/5xx).

### 2.3. Query có tham số

Mọi biến ảnh hưởng kết quả phải nằm trong `queryKey`:

 
function PostDetail({ id }) {
  const { data, isPending } = useQuery({
    queryKey: ["posts", id],
    queryFn: () =>
      fetch(`https://jsonplaceholder.typicode.com/posts/${id}`).then((r) => r.json()),
    enabled: !!id,   // chưa có id thì không gọi
  });
  if (isPending) return <p>Đang tải...</p>;
  return <h2>{data.title}</h2>;
}


### 2.4. Trạng thái quan trọng

| Thuộc tính   | Ý nghĩa                              |
|------------- |--------------------------------------|
| `isPending`  | Chưa có dữ liệu (lần tải đầu)        |
| `isFetching` | Đang gọi API (kể cả refetch nền)     |
| `isError` / `error` | Thất bại / thông tin lỗi      |
| `data`       | Dữ liệu (có thể là cache cũ khi đang refetch) |

### 2.5. `staleTime` và `gcTime`

 
useQuery({ queryKey: ["posts"], queryFn: fetchPosts, staleTime: 60_000 });
 

-   `staleTime` (mặc định `0`): thời gian dữ liệu được coi là "mới". Hết thời gian này, dữ liệu thành "cũ" và sẽ refetch nền khi mount lại, focus lại cửa sổ, hoặc có mạng trở lại.
-   `gcTime` (mặc định 5 phút): thời gian giữ cache sau khi không còn component nào dùng.

Hiểu nhầm phổ biến: `staleTime: 0` nghĩa là mỗi lần dùng lại đều refetch nền. Muốn bớt request, hãy tăng `staleTime`.

---

## 3. `useMutation` và CRUD  

Query để đọc, mutation để ghi (POST, PUT, DELETE).

 
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API = "https://jsonplaceholder.typicode.com/posts";

const request = async (url, options) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Lỗi ${res.status}`);
  return res.json();
};

function useAddPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newPost) =>
      request(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });  // làm mới danh sách
    },
  });
}

function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => request(`${API}/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
}
```

  `invalidateQueries` đánh dấu cache là "cũ" và tự refetch các query đang hiển thị. Đây là cơ chế tương đương `invalidatesTags` của RTK Query.

### Dùng trong component

 
function PostManager() {
  const { data: posts = [], isPending } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });
  const addPost = useAddPost();
  const deletePost = useDeletePost();
  const [title, setTitle] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    addPost.mutate(
      { title, body: "...", userId: 1 },
      { onSuccess: () => setTitle("") }
    );
  };

  if (isPending) return <p>Đang tải...</p>;

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <button disabled={addPost.isPending}>
          {addPost.isPending ? "Đang thêm..." : "Thêm"}
        </button>
        {addPost.isError && <p>{addPost.error.message}</p>}
      </form>

      <ul>
        {posts.map((p) => (
          <li key={p.id}>
            {p.title}
            <button
              disabled={deletePost.isPending && deletePost.variables === p.id}
              onClick={() => deletePost.mutate(p.id)}
            >
              Xóa
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
 

  `mutate` và `mutateAsync`: `mutate` không trả Promise, xử lý qua callback. `mutateAsync` trả Promise nên dùng được `await` với `try/catch`.

>   Cảnh báo khi thực hành: JSONPlaceholder chỉ giả lập ghi dữ liệu, nên sau khi refetch, bài mới thêm sẽ không xuất hiện. Luồng code vẫn đúng. Muốn thấy kết quả thật, dùng `json-server` chạy local hoặc optimistic update ở phần 5.

---

## 4. Kết hợp với Redux Toolkit  

  Nguyên tắc phân chia:  

- Dữ liệu từ server → TanStack Query. Không   chép vào Redux store.
- Trạng thái giao diện, bộ lọc, người dùng đăng nhập, giỏ hàng →   Redux Toolkit  .

### 4.1. Dùng state Redux làm tham số của query

 
// uiSlice.js
import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: { search: "" },
  reducers: {
    setSearch: (state, action) => { state.search = action.payload; },
  },
});
export const { setSearch } = uiSlice.actions;
export default uiSlice.reducer;
export const selectSearch = (state) => state.ui.search;
```

```jsx
function PostSearch() {
  const dispatch = useDispatch();
  const search = useSelector(selectSearch);

  const { data = [], isFetching } = useQuery({
    queryKey: ["posts", { search }],       // search đổi → key đổi → tự gọi lại
    queryFn: () => request(`${API}?q=${encodeURIComponent(search)}`),
    placeholderData: (prev) => prev,       // giữ dữ liệu cũ khi đang tải key mới
  });

  return (
    <>
      <input value={search} onChange={(e) => dispatch(setSearch(e.target.value))} />
      {isFetching && <small>Đang tìm...</small>}
      <ul>{data.map((p) => <li key={p.id}>{p.title}</li>)}</ul>
    </>
  );
}
```

Bộ lọc (client state) nằm ở Redux, kết quả (server state) nằm ở cache của TanStack Query. Mỗi bên làm đúng việc của mình.

### 4.2. Lấy token từ Redux trong `queryFn`

`queryFn` không phải hook nên không dùng được `useSelector`. Có hai cách:

```jsx
// Cách 1: đọc token trong component rồi truyền vào
const token = useSelector((s) => s.auth.token);
useQuery({
  queryKey: ["me"],
  queryFn: () => request("/api/me", { headers: { Authorization: `Bearer ${token}` } }),
  enabled: !!token,
});

// Cách 2: đọc trực tiếp từ store (nên đặt trong một hàm API chung)
import { store } from "./app/store";
const getToken = () => store.getState().auth.token;
```

### 4.3. Đồng bộ khi đăng xuất

Khi người dùng đăng xuất, cần xóa cache để không lộ dữ liệu của tài khoản cũ:

```js
const queryClient = useQueryClient();
const handleLogout = () => {
  dispatch(logout());      // Redux: xóa token
  queryClient.clear();     // TanStack Query: xóa toàn bộ cache
};
 

### 4.4. So sánh để chọn công cụ

| Tiêu chí         | TanStack Query   | RTK Query |
|---               |---  --- --- ---  |---        |
| Có sẵn trong RTK | Không, cài riêng | Có        |
| Phụ thuộc Redux  | Không            | Có (dữ liệu nằm trong store) |
| Làm mới sau khi ghi | `invalidateQueries` | `invalidatesTags` |
| Dùng được ngoài React/không có Redux| Có   | Khó |

Không có bên nào "đúng hơn". Dự án đã dùng Redux nhiều thì RTK Query gọn hơn. Muốn tách biệt server state hoặc cần hệ sinh thái rộng thì chọn TanStack Query. Không nên dùng cả hai cho cùng một loại dữ liệu.  

---

## 5. Optimistic update 

Cập nhật giao diện trước , gọi server sau, lỗi thì hoàn tác:
 
function useDeletePostOptimistic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => request(`${API}/${id}`, { method: "DELETE" }),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });   // 1. hủy refetch đang chạy
      const previous = queryClient.getQueryData(["posts"]);       // 2. lưu bản cũ
      queryClient.setQueryData(["posts"], (old = []) =>           // 3. sửa cache ngay
        old.filter((p) => p.id !== id)
      );
      return { previous };                                        // trả về làm context
    },

    onError: (err, id, context) => {
      queryClient.setQueryData(["posts"], context.previous);      // 4. lỗi thì hoàn tác
    },

    // Với API thật, nên refetch để đồng bộ. Với JSONPlaceholder, bỏ dòng này.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
}
 

Bốn bước cần nhớ: hủy, lưu, sửa, hoàn tác khi lỗi. Bước `cancelQueries` tránh việc một refetch đang chạy ghi đè lên thay đổi lạc quan.

---

## 6. Lỗi thường gặp và tổng kết 

  Lỗi 1: `queryFn` không ném lỗi khi dùng `fetch`. Lỗi 404/500 bị coi là thành công.

  Lỗi 2: `queryKey` thiếu biến. Ví dụ key là `["posts"]` nhưng hàm lại phụ thuộc `search`, dẫn tới hiển thị dữ liệu sai.

  Lỗi 3: Nhầm `isPending` và `isFetching`. `isPending` chỉ đúng khi chưa có dữ liệu, `isFetching` đúng ở mọi lần gọi.

  Lỗi 4: Chép dữ liệu query vào Redux   (`useEffect` rồi `dispatch(setPosts(data))`). Mất lợi thế cache, dễ lệch dữ liệu.

  Lỗi 5: Để `staleTime` mặc định `0` cho dữ liệu ít đổi,   gây refetch thừa mỗi lần focus cửa sổ.

  Lỗi 6: Tạo `new QueryClient()` bên trong component.   Mỗi lần render tạo một cache mới. Hãy tạo bên ngoài component.

  Lỗi 7: Quên `queryClient.clear()` khi đăng xuất.  

  Lưu ý chuyển từ v4 lên v5: `isLoading` đổi nghĩa (nay là `isFetching && isPending`), mutation dùng `isPending` thay cho `isLoading`, `cacheTime` đổi tên thành `gcTime`, và `useQuery` chỉ nhận   một object   tham số.

### Tóm tắt

1. TanStack Query quản lý   server state  , Redux Toolkit quản lý   client state  .
2. `useQuery` cần `queryKey` (mọi biến phụ thuộc) và `queryFn` (phải ném lỗi).
3. `staleTime` điều khiển khi nào refetch, `gcTime` điều khiển thời gian giữ cache.
4. `useMutation` + `invalidateQueries` để ghi dữ liệu và làm mới danh sách.
5. State Redux có thể làm tham số của `queryKey`, nhưng không chép dữ liệu server vào Redux.
6. Optimistic update: `onMutate` (sửa cache) và `onError` (hoàn tác).

---

## Bài tập nhanh (nếu còn thời gian)

Viết hook `useUpdatePost` cho nút "Sửa". Sau khi thành công, chỉ làm mới đúng bài viết đó và danh sách. Gợi ý:

 
function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post) =>
      request(`${API}/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["posts", updated.id], updated);            // cập nhật bài chi tiết
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: true }); // làm mới danh sách
    },
  });
}
 
