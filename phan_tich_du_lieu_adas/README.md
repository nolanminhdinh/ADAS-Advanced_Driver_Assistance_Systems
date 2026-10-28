# THƯ MỤC CHUYÊN ĐỀ: PHÂN TÍCH DỮ LIỆU ĐO KIỂM ADAS (ADAS DATA ANALYSIS)

> **Mục tiêu Thư mục:**  
> Cung cấp các cẩm nang, tài liệu phương pháp luận, công thức kỹ thuật và kịch bản thực hành chuyên sâu dành cho việc xử lý, làm sạch, phân tích và trực quan hóa dữ liệu đo kiểm (Telemetry / Log Data) từ các hệ thống ADAS và xe tự hành.

---

## MỤC LỤC TÀI LIỆU TRONG THƯ MỤC

### 1. Phân Tích & Lưu Trữ Trên Microsoft Excel
* [Chuyên đề: Phân Tích và Lưu Trữ Dữ Liệu Log ADAS Trên Microsoft Excel](./01_phan_tich_va_luu_tru_log_adas_tren_excel.md)
  - **Chiến lược xử lý dữ liệu lớn:** Giới hạn 1 triệu dòng của Excel vs. tần số lấy mẫu ADAS 50Hz - 100Hz; Kỹ thuật trích xuất Cửa sổ sự kiện (Event Window) và nạp qua Power Query / Data Model.
  - **Quy trình phân tích từng bước:** Công thức tính thời gian tới va chạm TTC (`=IFERROR(IF(V_rel < 0, Dist / -V_rel, 999), 999)`), logic tự động bắt lỗi Phanh Giật Oan (Phantom Braking).
  - **Trực quan hóa:** Định dạng có điều kiện (Conditional Formatting), vẽ biểu đồ kết hợp (Combo Chart) 2 trục tung cho Vận tốc (km/h) và Gia tốc ($m/s^2$).
  - **Xử lý 6 lỗi dữ liệu điển hình:** Lỗi tràn dòng, lỗi dấu chấm/phẩy thập phân, mất mili-giây Timestamp (`hh:mm:ss.000`), CAN ID bị biến thành số mũ khoa học, lỗi chia cho 0 (`#DIV/0!`), và lệch pha thời gian đa cảm biến (`XLOOKUP` nội suy).

---

## LIÊN KẾT TỚI CÁC CHUYÊN ĐỀ LIÊN QUAN

* [Chương 9: Chuyên Đề Mạng Truyền Thông Bus CAN & CAN-FD Thực Chiến](../chapters/09_chuyen_sau_mang_bus_can_va_can_fd.md)
* [Chương 10: Chuyên Đề Phân Tích Dữ Liệu Đo Kiểm & Điều Tra Lỗi ADAS (RCA)](../chapters/10_chuyen_sau_phan_tich_du_lieu_log_adas.md)
* [Hướng dẫn Thực hành: Đọc và Giải mã Tệp DBC bằng Python](../explanations/kiem_thu_va_log/01_huong_dan_doc_va_giai_ma_dbc_can.md)
* [Hướng dẫn Thực hành: Kịch bản Python Tự động Bắt Lỗi Phanh Giật Oan](../explanations/kiem_thu_va_log/02_kich_ban_python_tu_dong_bat_loi_phantom_braking.md)
