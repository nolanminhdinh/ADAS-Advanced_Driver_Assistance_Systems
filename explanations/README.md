# THƯ MỤC TÀI LIỆU GIẢI THÍCH CHI TIẾT & HỎI ĐÁP CHUYÊN SÂU (Q&A DEEP-DIVES)

> Thư mục này được thiết kế để lưu trữ các bài giải thích chi tiết, đào sâu các khái niệm kỹ thuật phức tạp theo từng chương của giáo trình. Khi có bất kỳ thắc mắc hoặc nội dung nào cần làm rõ, tài liệu giải đáp sẽ được ghi lại chi tiết tại đây và liên kết trực tiếp vào bài giảng chính.

---

## MỤC LỤC CÁC BÀI GIẢI THÍCH THEO CHƯƠNG

### Chương 1: Tổng Quan Kiến Trúc Hệ Thống & Tiêu Chuẩn Công Nghiệp
* [Chuyên đề Giải thích: Ma trận Xác định Cấp độ An toàn ASIL theo Chuẩn ISO 26262](./chuong_01/ma_tran_asil_iso26262.md)
  - Giải mã 3 tham số $S$ (Severity), $E$ (Exposure), $C$ (Controllability).
  - Bảng ma trận đầy đủ cho cả $S1, S2, S3$.
  - 4 tình huống phân tích thực tế trên các tính năng ADAS (LKA, AEB, ACC, Gạt mưa).
  - Yêu cầu kiểm thử ngặt nghèo bắt buộc đối với mức ASIL-D (100% MC/DC Coverage, HIL Fault Injection).

### Chuyên Đề Thực Chiến: Mạng Bus CAN & Phân Tích Dữ Liệu Log ADAS
* [Hướng dẫn Thực chiến: Đọc, Hiểu & Giải mã Tệp DBC (CAN Database) bằng Python](./kiem_thu_va_log/01_huong_dan_doc_va_giai_ma_dbc_can.md)
  - Phân tích cú pháp `BO_`, `SG_`, các từ khóa DBC.
  - Phân biệt chi tiết ma trận bit Little Endian (Intel `@1`) vs Big Endian (Motorola `@0`).
  - Code Python hoàn chỉnh giải mã tín hiệu nhị phân thành giá trị vật lý sử dụng thư viện `cantools`.
* [Hướng dẫn Thực chiến: Kịch bản Python Tự động Phát hiện Lỗi Phanh Giật Oan (Phantom Braking)](./kiem_thu_va_log/02_kich_ban_python_tu_dong_bat_loi_phantom_braking.md)
  - Quy trình tự động quét tệp log đo kiểm `.mf4` / `.blf`.
  - Code Python trích xuất chuỗi thời gian và vẽ đồ thị 3 tầng đối soát đa cảm biến (Speed, Accel, Radar vs Camera).
  - Cách trình bày bằng chứng lỗi trong báo cáo kỹ thuật (Defect Report).

---

*(Các bài giải thích cho các Chương 2, 3, 4, 5, 6, 7, 8 sẽ tiếp tục được bổ sung tự động theo tiến độ học tập và nghiên cứu của học viên).*
