# ADAS Academy

Website học kỹ thuật ADAS bằng tiếng Việt, xây dựng từ giáo trình trong repo. Giao diện hỗ trợ máy tính và điện thoại, với lộ trình 8 chương, 39 bài học và 16 câu hỏi ôn tập có giải thích.

**Bản online riêng tư:** [Mở ADAS Academy](https://adas-academy-minh.deepseal35.chatgpt.site). Đăng nhập bằng tài khoản ChatGPT được cấp quyền. Không cần chạy máy chủ trên máy để dùng bản online.

## Chạy trên máy

Yêu cầu **Node.js 22 trở lên** và **pnpm 11.25.0**. Chạy các lệnh trong thư mục `adas-academy`:

```sh
pnpm install
pnpm dev
```

Mở địa chỉ Local mà Vite hiển thị, thông thường là `http://127.0.0.1:5173/`.

```sh
pnpm test       # Kiểm tra nội dung và bộ lưu tiến độ
pnpm build      # Tạo bản triển khai tĩnh trong dist/
pnpm preview    # Xem trước bản đã build
```

`dev` và `build` tự tạo lại dữ liệu bài học trước khi chạy. Để chỉ cập nhật dữ liệu, dùng `pnpm content`.

## Trải nghiệm học tập

- Lộ trình theo chương và nhóm nền tảng, kỹ thuật, thực hành; gợi ý tiếp tục từ bài chưa hoàn thành.
- Tìm kiếm toàn bộ bài học, hỗ trợ truy vấn tiếng Việt không dấu và phím tắt `Ctrl K`.
- Bài đọc có công thức KaTeX, bảng cuộn, mã nguồn có nút sao chép và sơ đồ Mermaid.
- Đánh dấu bài đã học, lưu bài để ôn lại, ghi chú riêng cho từng bài và xuất ghi chú thành Markdown.
- Trắc nghiệm toàn bộ giáo trình hoặc từng chương; phản hồi kèm lý do và liên kết về bài học.
- Phòng thực hành TTC cho phép thay đổi khoảng cách và vận tốc để quan sát kết quả.
- Mục tiêu phút học mỗi ngày, hoạt động 7 ngày và đồng hồ tập trung 25 phút. Đồng hồ tạm dừng khi rời trang.
- Thư viện có tài liệu ASIL, nguồn tham khảo và chuyên đề dung hợp Camera–Radar với hai sơ đồ.

Tiến độ, ghi chú, bài đã lưu và lịch sử trắc nghiệm được lưu bằng **localStorage trên trình duyệt hiện tại**. Website chưa có tài khoản hoặc đồng bộ giữa thiết bị; nên xuất ghi chú khi cần giữ bản riêng. Xóa dữ liệu trình duyệt cũng có thể xóa dữ liệu học tập.

## Cấu trúc mã nguồn

| Đường dẫn | Vai trò |
| --- | --- |
| `src/app.js` | Điều hướng, màn hình học, trắc nghiệm, TTC và đồng hồ tập trung |
| `src/styles.css` | Giao diện, bố cục responsive và trạng thái tương tác |
| `src/store.js` | Lưu tiến độ có phiên bản; xử lý lỗi lưu trữ và cập nhật từ nhiều tab |
| `src/renderer.js` | Hiển thị Markdown an toàn, KaTeX và Mermaid tải khi cần |
| `src/quiz-data.js` | Câu hỏi, đáp án, giải thích và mã bài học liên quan |
| `src/scene.js` | Minh họa SVG hệ thống cảm biến trên trang tổng quan |
| `src/content.json` | Dữ liệu giáo trình được tạo tự động |
| `scripts/generate-content.mjs` | Đọc giáo trình Markdown và tạo dữ liệu bài học |
| `public/materials/` | Bản đóng gói các tài liệu Markdown gốc |
| `tests/` | Kiểm thử tính toàn vẹn nội dung và lưu tiến độ |
| `.openai/hosting.json` | Cấu hình Site và thư mục bản build tĩnh |

Ứng dụng dùng **Vite và JavaScript thuần**, không cần máy chủ dữ liệu để đọc bài hoặc dùng các chức năng cá nhân. Markdown được xử lý bằng Marked và làm sạch bằng DOMPurify. Bản build trong `dist/` có thể phục vụ bằng một máy chủ web tĩnh.

## Cập nhật giáo trình

Khi ứng dụng nằm trong repo đầy đủ, chỉnh nội dung ở `../chapters/`, `../explanations/` hoặc `../README.md`, rồi chạy `pnpm content`, `pnpm dev` hoặc `pnpm build`. Generator ưu tiên nguồn trong repo cha, chia bài theo tiêu đề cấp `##` bên ngoài khối mã và đồng bộ tài liệu vào `public/materials/`.

Khi chỉ mang riêng thư mục ứng dụng sang máy khác, generator đọc nguồn dự phòng từ `public/materials/`. Trong trường hợp này, chỉnh các tệp Markdown đã đóng gói ở đó. Không chỉnh trực tiếp `src/content.json`, vì lần tạo dữ liệu tiếp theo sẽ ghi lại tệp này.

Tên chương ngắn, mô tả và phân nhóm nằm trong `scripts/generate-content.mjs`. Sau khi thay cấu trúc bài học, kiểm tra các `lessonId` trong `src/quiz-data.js` và chạy lại kiểm thử để tránh liên kết sai bài.

## Kiểm tra và giới hạn

Bộ kiểm thử hiện có **15 ca đã đạt**, bao gồm số chương và bài, mã bài duy nhất, liên kết trắc nghiệm, nguồn tài liệu đóng gói, tái tạo nội dung khi không có repo cha, lưu và tải lại tiến độ, dữ liệu lỗi, giới hạn dung lượng và cập nhật từ nhiều tab.

Nội dung kỹ thuật được chuyển từ giáo trình của repo. Liên kết tài liệu gốc được giữ trong bài học; cấu hình hãng xe, thông số và ví dụ cần đối chiếu tài liệu chính thức trước khi dùng trong công việc thực tế. Phòng TTC là mô hình học tập với vận tốc giữ nguyên, không mô phỏng ngưỡng AEB hay hành vi xe thực tế.

Các đoạn C++, Python, CARLA và HIL là tài liệu để đọc và thực hành trong môi trường riêng. Website không trực tiếp chạy CARLA, cung cấp dataset hay kết nối với xe. Công bố website trực tuyến là một bước riêng; bản xem trước trên máy hoạt động độc lập với việc triển khai.
