# Project Structure

## Current Layout

```
PixelText/
  index.html
  src/
    styles/
      main.css
    js/
      core/
        app-context.js
      features/
        image-import.js
        brush-tools.js
        text-workflow.js
      exporters/
        algodoo.js
        png.js
      ui/
        groups.js
        events.js
      main.js
  docs/
    PROJECT_STRUCTURE.md
    AI_EXTENSION_GUIDE.md
```

## Responsibility By Layer

- `core/`: Nền tảng dùng chung của app (DOM refs, `state`, constants, pixel helpers, font data).
- `features/`: Logic thao tác chính của editor.
- `exporters/`: Logic xuất dữ liệu (không xử lý UI layout).
- `ui/`: Hành vi giao diện (collapsible groups, event listeners).
- `main.js`: Bootstrap duy nhất để khởi tạo app theo thứ tự chuẩn.

## File Responsibilities

- `index.html`: Giữ markup và thứ tự script `defer`, không chứa inline JS/CSS.
- `src/styles/main.css`: Toàn bộ styles.
- `src/js/core/app-context.js`: `canvas`, `ctx`, `els`, `state`, constants và helper nền tảng.
- `src/js/features/image-import.js`: Import ảnh từ file/url/clipboard + chuyển ảnh sang pixel layer.
- `src/js/features/brush-tools.js`: Brush size/options và logic vẽ brush.
- `src/js/features/text-workflow.js`: Text engine, history, render, zoom/preview, paint tools, cursor workspace.
- `src/js/exporters/algodoo.js`: Build/export `.phn`, material preset, advanced props.
- `src/js/exporters/png.js`: Export PNG từ layer hiện tại.
- `src/js/ui/groups.js`: Sắp xếp/collapse các UI group.
- `src/js/ui/events.js`: Bind toàn bộ event listeners.
- `src/js/main.js`: Gọi init theo thứ tự đúng và chạy app.

## Load Order Rule (Critical)

Script phải được load đúng thứ tự trong `index.html`:

1. `core/app-context.js`
2. `features/image-import.js`
3. `features/brush-tools.js`
4. `features/text-workflow.js`
5. `exporters/algodoo.js`
6. `exporters/png.js`
7. `ui/groups.js`
8. `ui/events.js`
9. `main.js`

Đổi thứ tự có thể làm hỏng runtime do phụ thuộc hàm toàn cục.

## Migration Notes

- Refactor chỉ thay đổi cấu trúc file, giữ nguyên hành vi hiện tại.
- Các script chạy bằng `defer` và chia module theo trách nhiệm để mở rộng dài hạn.
