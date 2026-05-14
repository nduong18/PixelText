# AI Extension Guide

## Goal

Mở rộng tính năng mới mà không làm hỏng các chức năng đang có của PixelText.

## Immutable Rules

- Không chuyển logic quay lại inline `<script>` hoặc inline `<style>`.
- Không thay đổi tên/id các element HTML đang được map trong `els` nếu chưa cập nhật toàn bộ chỗ dùng.
- Không đổi thứ tự load scripts trong `index.html` nếu chưa kiểm chứng phụ thuộc.
- Mọi thay đổi behavior phải có lý do rõ và ghi trong docs/changelog.

## Where To Add New Code

- Thêm thao tác editor mới: `src/js/features/`.
- Thêm định dạng xuất mới: `src/js/exporters/`.
- Thêm hành vi UI/event mới: `src/js/ui/`.
- Dùng chung constants/state/helper cơ bản: `src/js/core/app-context.js`.

## Safe Workflow For AI

1. Đọc `docs/PROJECT_STRUCTURE.md` trước khi sửa code.
2. Xác định module mục tiêu theo trách nhiệm file.
3. Sửa tối thiểu phạm vi cần thiết, không trộn nhiều concern vào một file.
4. Chạy kiểm tra cú pháp cho toàn bộ `src/js/**/*.js`.
5. Soát lại init flow trong `src/js/main.js` và `src/js/ui/events.js`.
6. Nếu thêm module mới, thêm script vào `index.html` đúng vị trí phụ thuộc.

## Dependency Notes

- `state`, `els`, `canvas`, `ctx` là nền tảng global cho toàn app.
- `features/text-workflow.js` phụ thuộc một số hàm trong `exporters/algodoo.js` khi undo/redo snapshot.
- `ui/events.js` chỉ nên bind events, không chứa nghiệp vụ business phức tạp.
- `main.js` là điểm gọi bootstrap cuối cùng, không đặt side effects phân tán ở nhiều file khác.

## Backward Compatibility Checklist

- Undo/Redo còn hoạt động.
- Draw/Erase/Fill/Picker hoạt động đúng.
- Pixel Text realtime + auto fit còn đúng.
- Import ảnh từ file/url/clipboard còn chạy.
- Export PNG và Algodoo `.phn` còn đúng.
- UI collapsible groups và preview zoom còn đúng.

## Recommended Pattern When Adding Features

- Tạo file `src/js/features/<feature-name>.js`.
- Giữ API hàm rõ ràng, tên theo verb (`init...`, `build...`, `apply...`, `export...`).
- Nếu feature cần export format mới, tách riêng sang `src/js/exporters/<name>.js`.
- Event listener mới đặt tại `src/js/ui/events.js` và chỉ gọi vào hàm nghiệp vụ.
