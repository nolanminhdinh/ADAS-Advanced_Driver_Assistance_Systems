# CHUYÊN ĐỀ: PHÂN TÍCH VÀ LƯU TRỮ DỮ LIỆU LOG ADAS TRÊN MICROSOFT EXCEL

> **Tài liệu Kỹ thuật Chuyên sâu:** Dành cho Kỹ sư Phân tích Dữ liệu Đo kiểm & Thẩm định Hệ thống ADAS.  
> **Phạm vi Ứng dụng:** Xử lý chuỗi thời gian telemetry (Time-series Data), phát hiện dị thường an toàn, vẽ biểu đồ đối soát và khắc phục các lỗi định dạng dữ liệu trên Microsoft Excel.

---

## 1. TỔNG QUAN & CHIẾN LƯỢC XỬ LÝ DỮ LIỆU ĐỂ KHÔNG BỊ "TREO" EXCEL

Trong kỹ thuật ô tô, dữ liệu đo kiểm ADAS từ bus CAN-FD và cụm cảm biến được lấy mẫu ở tần số rất cao (**50Hz – 100Hz**, tức $50 - 100$ bản ghi mỗi giây). 

```
               SƠ ĐỒ CHIẾN LƯỢC XỬ LÝ DỮ LIỆU LOG TRÊN EXCEL
               
[ File Log Thô (MDF4 / BLF) ] (Hàng Gigabyte, 100 Hz, hàng triệu dòng)
               |
               v (Tiền xử lý: Python / CANape / Power Query)
   +-----------+-----------+
   |                       |
   v                       v
[ KỊCH BẢN 1: CỬA SỔ SỰ KIỆN ]   [ KỊCH BẢN 2: BẢNG TỔNG HỢP KPI ]
  Trích xuất đoạn lỗi +- 5 giây     Thống kê kết quả từng bài test
  (Khoảng 1.000 - 5.000 dòng)       (Pass/Fail, cự ly dừng, tốc độ)
               |                                   |
               +-----------------+-----------------+
                                 |
                                 v
               +-----------------------------------+
               | PHÂN TÍCH & TRỰC QUAN HÓA EXCEL  |
               | - Công thức TTC, Gia tốc phanh    |
               | - Conditional Formatting (Tô đỏ)  |
               | - Biểu đồ Combo Chart 2 trục tung |
               | - PivotTable & Slicer Dashboard   |
               +-----------------------------------+
```

### 1.1. Giới hạn Vật lý của Excel vs. Tần số ADAS
* **Giới hạn tối đa của một Sheet:** **1.048.576 dòng** và **16.384 cột**.
* **Phép tính thực tế:** Với một tín hiệu lấy mẫu ở $100\text{ Hz}$:
  - $1\text{ giây} = 100\text{ dòng}$
  - $1\text{ phút} = 6.000\text{ dòng}$
  - $1\text{ giờ} = 360.000\text{ dòng}$
  - $\Rightarrow$ **Chưa đầy 3 tiếng chạy xe là tràn sạch 1 sheet Excel!** Nếu xe có 100 tín hiệu CAN cùng ghi, Excel sẽ sập ngay trong vài phút đầu tiên.

### 1.2. Hai Chiến lược Tiếp cận Chuẩn Kỹ sư
1. **Chiến lược 1: Phân tích theo Cửa sổ Sự kiện (Event-Window Snippet - Khuyên dùng khi debug lỗi sâu):**
   - Không nạp toàn bộ hành trình dài vào Excel.
   - Khi phát hiện xe gặp sự cố (ví dụ xe phanh giật lúc 10h15p20s), sử dụng script Python hoặc phần mềm CANape trích xuất đúng **cửa sổ thời gian $\pm 5\text{ giây}$ quanh sự cố** (tổng cộng khoảng $1.000 - 2.000\text{ dòng}$).
   - Nạp đoạn này vào Excel $\rightarrow$ File siêu nhẹ ($< 1\text{ MB}$), biểu đồ mượt mà, tính toán phản hồi tức thì.
2. **Chiến lược 2: Nạp vào Data Model qua Power Query (Dành cho phân tích thống kê hạm đội xe):**
   - Không nạp dữ liệu trực tiếp vào các ô bảng tính (Worksheet Grid).
   - Sử dụng **Power Query $\rightarrow$ Only Create Connection $\rightarrow$ Add this data to the Data Model**.
   - Công nghệ nén VertiPaq của Power Pivot cho phép nén và phân tích hàng triệu dòng dữ liệu thông qua PivotTable mà không bị giới hạn 1 triệu dòng.

---

## 2. QUY TRÌNH THỰC HIỆN PHÂN TÍCH DỮ LIỆU ADAS TRÊN EXCEL

Giả sử bạn trích xuất được bảng dữ liệu cửa sổ sự kiện kiểm thử tính năng Phanh khẩn cấp (AEB) có cấu trúc các cột như sau:

```
Cột A: Timestamp_s          (Thời gian tính bằng giây: 12.00, 12.01, 12.02...)
Cột B: Ego_Speed_kmh        (Vận tốc xe mình: 60.0 km/h)
Cột C: Target_Distance_m    (Khoảng cách tới vật thể từ Radar: 25.0 m)
Cột D: Target_RelSpeed_mps  (Vận tốc tương đối: -15.0 m/s)
Cột E: Long_Accel_mps2      (Gia tốc dọc thân xe: -0.2 m/s²)
Cột F: Camera_Obj_Detected  (Camera có thấy xe không: 1 = Có, 0 = Không)
```

### 2.1. Thiết lập các Công thức Tính toán An toàn

#### Công thức 1: Tính toán Thời gian tới Va chạm (TTC - Time-to-Collision)
Tại ô `G2`, nhập công thức:
```excel
=IFERROR(IF(D2 < 0, C2 / (-D2), 999), 999)
```
* **Bản chất toán học:** Khi khoảng cách đang bị thu hẹp ($V_{rel} = D2 < 0$), tính $\text{TTC} = \frac{\text{Distance}}{-V_{rel}}$. Nếu xe phía trước chạy nhanh hơn hoặc cùng tốc độ ($D2 \ge 0$), gán giá trị $999$ (An toàn tuyệt đối). Hàm `IFERROR` bọc ngoài ngăn lỗi `#DIV/0!` khi $V_{rel} = 0$.

#### Công thức 2: Tự động Gắn Cờ Mức độ Cảnh báo (Safety Warning State)
Tại ô `H2`:
```excel
=IF(G2 <= 1.4, "CRITICAL_AEB", IF(G2 <= 2.4, "WARNING_FCW", "SAFE"))
```
* Phân loại trạng thái vận hành thành: An toàn (`SAFE`), Cảnh báo va chạm (`WARNING_FCW`) hoặc Kích hoạt phanh khẩn cấp (`CRITICAL_AEB`).

#### Công thức 3: Tự động Bắt Lỗi Phanh Giật Oan (Phantom Braking Detector)
Tại ô `I2`:
```excel
=IF(AND(E2 < -5.0, F2 = 0), "PHANH_GIAT_OAN", "BINH_THUONG")
```
* **Logic chẩn đoán:** Nếu gia tốc phanh dọc vượt ngưỡng âm nguy hiểm ($E2 < -5.0\text{ m/s}^2$) trong khi Camera khẳng định không có vật thể nào phía trước ($F2 = 0$) $\rightarrow$ Gắn cờ lỗi ngay lập tức!

---

### 2.2. Trực quan hóa Bằng Định dạng có Điều kiện (Conditional Formatting)
* Bôi đen toàn bộ cột `G` (TTC) $\rightarrow$ Vào **Conditional Formatting** $\rightarrow$ **Highlight Cells Rules** $\rightarrow$ **Less Than...** $\rightarrow$ Nhập `1.4` $\rightarrow$ Chọn **Light Red Fill with Dark Red Text** (Tô đỏ cảnh báo).
* Bôi đen cột `I` (Lỗi Phanh Giật Oan) $\rightarrow$ **Highlight Cells Rules** $\rightarrow$ **Equal To...** $\rightarrow$ Nhập `"PHANH_GIAT_OAN"` $\rightarrow$ Chọn tô màu vàng cảnh báo.
* **Tác dụng:** Giúp mắt kỹ sư lập tức nhận diện vị trí xảy ra sự cố bất thường giữa hàng nghìn dòng dữ liệu.

---

### 2.3. Vẽ Biểu đồ Đối soát Đa kênh 2 Trục Tung (Combo Chart)

Do Vận tốc ($0 - 100\text{ km/h}$) và Gia tốc ($-10 \text{ đến } +3\text{ m/s}^2$) có thang đo lệch nhau quá lớn, bắt buộc phải dùng **Combo Chart 2 trục tung**:

```
                    BIỂU ĐỒ KẾT HỢP 2 TRỤC TUNG (COMBO CHART)
                    
   Tốc độ (km/h)                                      Gia tốc (m/s²)
     ^                                                      ^
 100 |               --- Vận tốc xe (Trục trái)             | +2
  80 |---------+                                            |  0
  60 |          \                                           | -2
  40 |           \___                                       | -4
  20 |               \_______                               | -6
   0 +----------------\-------------------------------------+ -8 (Phanh gấp!)
     0.0s            12.5s (Sự cố)                         15.0s
                      |                                       ^
                      |                                       |
                      +========> Gia tốc phanh (Trục phải) ---+
```

* **Các bước tạo biểu đồ trong Excel:**
  1. Bôi đen 3 cột: `Timestamp_s`, `Ego_Speed_kmh`, `Long_Accel_mps2`.
  2. Vào **Insert** $\rightarrow$ **Charts** $\rightarrow$ Chọn **Combo Chart**.
  3. Đặt `Ego_Speed_kmh`: Kiểu đường (Line) trên **Primary Axis (Trục chính)**.
  4. Đặt `Long_Accel_mps2`: Kiểu đường (Line) và tích chọn ô **Secondary Axis (Trục phụ bên phải)**.
  5. Đổi màu đường Gia tốc thành màu đỏ đậm, đường Tốc độ màu xanh dương để làm bằng chứng trực quan trong báo cáo sự cố (Defect Report).

---

## 3. SÁU (6) LỖI DỮ LIỆU PHỔ BIẾN NHẤT TRÊN EXCEL & CÁCH KHẮC PHỤC

```
+---------------------------------------------------------------------------------------------------------+
|                                    6 LỖI DỮ LIỆU ADAS ĐIỂN HÌNH TRÊN EXCEL                              |
+---+----------------------------+-----------------------------------+------------------------------------+
| STT| Tên Lỗi Kỹ thuật           | Hiện tượng Xuất hiện              | Cách Khắc phục Triệt để            |
+---+----------------------------+-----------------------------------+------------------------------------+
| 1 | Tràn giới hạn dòng         | Bị cắt cụt dữ liệu sau dòng số    | Downsample về 10-20Hz hoặc nạp qua |
|   | (> 1.048.576 rows)         | 1.048.576 khi mở file CSV dài.    | Data Model (Power Pivot).          |
+---+----------------------------+-----------------------------------+------------------------------------+
| 2 | Lỗi dấu chấm/phẩy thập phân| Số biến thành Text, lệch lề trái, | Đổi cài đặt Excel sang US Locale   |
|   | (Decimal Separator)        | công thức ra lỗi #VALUE!.         | (Dấu chấm '.' làm số thập phân).   |
+---+----------------------------+-----------------------------------+------------------------------------+
| 3 | Mất mili-giây Timestamp    | Cột giờ chỉ hiện hh:mm:ss, làm    | Dùng Custom Format Cells:          |
|   |                            | tròn mất phần lẻ mili-giây.       | hh:mm:ss.000                       |
+---+----------------------------+-----------------------------------+------------------------------------+
| 4 | Mã Hex biến thành số mũ    | CAN ID 1E4 biến thành 10000,      | Ép kiểu dữ liệu sang Text (@)      |
|   | (Scientific Notation)      | mã lỗi 0123 bị mất số 0 đầu.      | ngay từ bước Import Data.          |
+---+----------------------------+-----------------------------------+------------------------------------+
| 5 | Lỗi chia cho 0 hoặc rỗng   | Hiện mã lỗi #DIV/0! hoặc #VALUE!  | Bọc toàn bộ phép tính toán trong   |
|   | (Null / Packet Loss)       | làm sập các hàm tính tổng.        | hàm an toàn =IFERROR(..., 999).    |
+---+----------------------------+-----------------------------------+------------------------------------+
| 6 | Lệch tần số cảm biến       | Dòng Radar (50Hz) không khớp      | Dùng hàm =XLOOKUP(..., 0, 1) để    |
|   | (Misaligned Timestamps)    | mốc thời gian với Camera (30Hz).  | nội suy căn chỉnh về trục chuẩn.   |
+---+----------------------------+-----------------------------------+------------------------------------+
```

### Chi tiết Cách Xử lý Từng Lỗi:

#### Lỗi 1: Khắc phục Tràn Dòng Bằng Power Query
* Mở một file Excel mới hoàn toàn.
* Vào tab **Data** $\rightarrow$ **From Text/CSV** $\rightarrow$ Chọn tệp log `.csv`.
* Tại góc dưới cửa sổ xem trước, bấm vào mũi tên cạnh nút **Load** $\rightarrow$ Chọn **Load To...**
* Tích chọn hai ô:
  1. ☑ **Only Create Connection** (Không đổ dữ liệu ra bảng tính).
  2. ☑ **Add this data to the Data Model** (Nạp thẳng vào bộ nhớ nén RAM của Power Pivot).
* Từ đây, bạn có thể tạo các bảng **PivotTable** và biểu đồ tổng hợp trên hàng triệu dòng dữ liệu mà Excel vẫn chạy nhẹ nhàng.

#### Lỗi 2: Khắc phục Lỗi Dấu Chấm Thập phân
* Vào **File** $\rightarrow$ **Options** $\rightarrow$ **Advanced**.
* Tìm mục **Editing options**:
  - Bỏ tích ô: *"Use system separators"*.
  - Tại ô **Decimal separator**: Nhập dấu chấm (`.`).
  - Tại ô **Thousands separator**: Nhập dấu phẩy (`,`).
* Bấm **OK**. Toàn bộ các cột dữ liệu sẽ tự động chuyển thành số thực (căn lề phải) và các công thức toán học hoạt động bình thường trở lại.

#### Lỗi 3: Khôi phục Mili-giây cho Cột Timestamp
* Bôi đen toàn bộ cột Timestamp.
* Bấm tổ hợp phím tắt `Ctrl + 1` để mở cửa sổ **Format Cells**.
* Chọn thẻ **Number** $\rightarrow$ Mục **Custom**.
* Trong ô *Type*, gõ chính xác:
  ```
  hh:mm:ss.000
  ```
* Bấm **OK**. Dữ liệu sẽ hiển thị chi tiết: `10:15:20.120`, `10:15:20.130`... bảo đảm độ chính xác đến từng mili-giây.

#### Lỗi 4: Ngăn Chặn CAN ID Biến Thành Số Mũ
* Tuyệt đối không mở file CSV bằng cách nhấp đúp chuột trực tiếp trong Windows Explorer.
* Mở Excel trống $\rightarrow$ Tab **Data** $\rightarrow$ **From Text/CSV** $\rightarrow$ Chọn **Transform Data** (để vào Power Query Editor).
* Click chuột vào biểu tượng kiểu dữ liệu ở tiêu đề cột CAN ID $\rightarrow$ Chọn chuyển thành **Text**.
* Bấm **Close & Load**. Mã `1E4` hoặc `0123` sẽ được giữ nguyên dạng văn bản chính xác.

#### Lỗi 5: Xử lý Mất Gói Tin Bằng Hàm `IFERROR`
Luôn viết công thức phòng vệ:
```excel
=IFERROR(IF(D2 < 0, C2 / (-D2), 999), 999)
```
Nếu cảm biến bị mất gói, giá trị bị trống hoặc chia cho 0, hàm sẽ tự động trả về giá trị an toàn mặc định là $999$ thay vì sinh lỗi `#DIV/0!`.

#### Lỗi 6: Căn chỉnh Lệch Tần số Bằng Hàm `XLOOKUP`
Khi Radar chạy $50\text{ Hz}$ còn Camera chạy $30\text{ Hz}$:
* Lấy cột thời gian của Radar làm chuẩn tại Sheet chính (`A2`).
* Tại cột Camera trên Sheet chính, dùng công thức:
```excel
=XLOOKUP(A2, Camera_Sheet!A:A, Camera_Sheet!B:B, 0, 1)
```
* Tham số `1` ở cuối quy định: Nếu không tìm thấy timestamp trùng khớp chính xác 100%, Excel sẽ tự động lấy giá trị của timestamp lớn hơn kế tiếp gần nhất $\rightarrow$ Hoàn thành việc nội suy đồng bộ thời gian hai cảm biến!

---

## 4. TỔNG KẾT
Excel là công cụ cực kỳ đắc lực trong tay kỹ sư kiểm thử ADAS để trích xuất báo cáo sự cố (Incident Reporting) và xây dựng Dashboard trực quan:
* **Nguyên tắc cốt lõi:** Luôn dùng Python/CANape để cắt lọc cửa sổ sự kiện trước khi đưa vào Excel.
* **Quy chuẩn kỹ thuật:** Luôn thiết lập dấu chấm thập phân chuẩn quốc tế, định dạng thời gian `hh:mm:ss.000`, vẽ biểu đồ 2 trục tung và bọc công thức bằng `IFERROR`.
