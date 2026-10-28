# HƯỚNG DẪN THỰC CHIẾN: ĐỌC, HIỂU & GIẢI MÃ TỆP TIN DBC (CAN DATABASE) BẰNG PYTHON

> **Liên kết Bài giảng Gốc:** [Chương 9: Tệp Cơ sở Dữ liệu Mạng DBC](../../chapters/09_chuyen_sau_mang_bus_can_va_can_fd.md#4-tệp-cơ-sở-dữ-liệu-mạng-giải-mã-file-dbc-can-database)  
> **Chuyên mục:** Kỹ năng Kiểm thử & Phân tích Mạng CAN  
> **Mục tiêu:** Giúp kỹ sư làm chủ cấu trúc cú pháp tệp DBC, phân biệt chính xác thứ tự Byte (Intel vs Motorola) và tự động hóa giải mã bản tin CAN bằng thư viện `cantools`.

---

## 1. CẤU TRÚC CHI TIẾT CỦA MỘT TỆP TIN DBC

Tệp tin `.dbc` là văn bản thuần túy định nghĩa cách các byte nhị phân được ghép thành tín hiệu (Signals) và các bản tin (Messages).

```
VERSION ""

NS_ :
    NS_DESC_
    CM_
    BA_DEF_
    BA_

BS_:

BU_: ADAS_ECU ESP_ECU BCM_ECU

BO_ 256 ADAS_Control_Cmd: 8 ADAS_ECU
 SG_ Accel_Request : 0|12@1+ (0.01,-10) [-10|10] "m/s^2" ESP_ECU
 SG_ Brake_Prefill : 12|1@1+ (1,0) [0|1] "" ESP_ECU
 SG_ Steer_Torque_Req : 16|16@1- (0.1,0) [-30|30] "Nm" EPS_ECU
 SG_ Alive_Counter : 56|4@1+ (1,0) [0|15] "" ESP_ECU
 SG_ Checksum : 60|4@1+ (1,0) [0|15] "" ESP_ECU
```

### Giải nghĩa các Từ khóa Cốt lõi:
1. **`BU_` (Bus Units - Danh sách các nút ECU tham gia mạng):**
   - Ở ví dụ trên: `ADAS_ECU`, `ESP_ECU`, `BCM_ECU`.
2. **`BO_` (Message - Bản tin CAN):**
   - `256`: Mã định danh bản tin ở hệ thập phân ($256_{10} = \mathbf{0x100}_{16}$).
   - `ADAS_Control_Cmd`: Tên định danh của bản tin.
   - `8`: Độ dài dữ liệu DLC (Data Length Code = 8 bytes).
   - `ADAS_ECU`: Nút phát bản tin này (Transmitter).
3. **`SG_` (Signal - Tín hiệu trong bản tin):**
   - Từng trường dữ liệu nhỏ được đóng gói bên trong 8 bytes của bản tin.

---

## 2. "CÁI BẪY" LỚN NHẤT: INTEL (LITTLE ENDIAN) VS. MOTOROLA (BIG ENDIAN)

Đây là nguyên nhân số 1 khiến các kỹ sư mới vào nghề tính toán sai giá trị vật lý khi đọc file log!

```
                                 MA TRẬN 64 BITS CỦA MỘT KHUNG CAN 8 BYTES
                                 
           Bit 7   Bit 6   Bit 5   Bit 4   Bit 3   Bit 2   Bit 1   Bit 0
  Byte 0: [  7   |   6   |   5   |   4   |   3   |   2   |   1   |   0   ]
  Byte 1: [ 15   |  14   |  13   |  12   |  11   |  10   |   9   |   8   ]
  Byte 2: [ 23   |  22   |  21   |  20   |  19   |  18   |  17   |  16   ]
  Byte 3: [ 31   |  30   |  29   |  28   |  27   |  26   |  25   |  24   ]
  Byte 4: [ 39   |  38   |  37   |  36   |  35   |  34   |  33   |  32   ]
  Byte 5: [ 47   |  46   |  45   |  44   |  43   |  42   |  41   |  40   ]
  Byte 6: [ 55   |  54   |  53   |  52   |  51   |  50   |  49   |  48   ]
  Byte 7: [ 63   |  62   |  61   |  60   |  59   |  58   |  57   |  56   ]
```

### 1. Chuẩn Intel (`@1` - Little Endian / LSB First):
* **Start Bit quy ước:** Là bit **trọng số thấp nhất (LSB)** của tín hiệu.
* **Cách đếm bit:** Tín hiệu phát triển **TIẾN LÊN** theo chiều tăng của chỉ số bit.
* *Ví dụ:* Tín hiệu dài 12 bits bắt đầu từ `Bit 8`: Nó sẽ chiếm trọn `Bit 8 -> Bit 15` của Byte 1, và `Bit 16 -> Bit 19` của Byte 2.

### 2. Chuẩn Motorola (`@0` - Big Endian / MSB First):
* **Start Bit quy ước:** Là bit **trọng số cao nhất (MSB)** của tín hiệu.
* **Cách đếm bit:** Tín hiệu phát triển **LÙI LẠI** trong cùng 1 byte, sau đó nhảy xuống byte tiếp theo.
* *Quy tắc ghi nhớ:* Nếu thấy ký hiệu `@0`, hãy cẩn trọng gấp đôi vì cách sắp xếp thứ tự bit ngược hoàn toàn với trực giác đọc từ trái sang phải thông thường!

---

## 3. THỰC HÀNH PYTHON: GIẢI MÃ BẢN TIN CAN TỰ ĐỘNG BẰNG `cantools`

Thay vì phải tự viết hàm bóc tách bit thủ công phức tạp, kỹ sư sử dụng thư viện chuẩn công nghiệp **`cantools`**:

```python
"""
Chương trình Giải mã Tín hiệu CAN tự động bằng Python
Cài đặt thư viện: pip install cantools
"""
import cantools
from pprint import pprint

# 1. Nạp file DBC
dbc_content = """
VERSION ""
BO_ 256 ADAS_Control_Cmd: 8 ADAS_ECU
 SG_ Accel_Request : 0|12@1+ (0.01,-10) [-10|10] "m/s^2" ESP_ECU
 SG_ Brake_Prefill : 12|1@1+ (1,0) [0|1] "" ESP_ECU
 SG_ Steer_Torque_Req : 16|16@1- (0.1,0) [-30|30] "Nm" EPS_ECU
"""

# Lưu tạm thành file dbc
with open("adas_network.dbc", "w") as f:
    f.write(dbc_content)

# Nạp cơ sở dữ liệu
db = cantools.database.load_file("adas_network.dbc")

# 2. Giả lập một chuỗi Byte thô nhận được từ bus CAN (Hex: 0x100)
# Giả sử nhận được 8 bytes dữ liệu:
raw_can_bytes = bytes([0xE8, 0x03, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00])

# 3. Giải mã bản tin tự động
decoded_signals = db.decode_message(0x100, raw_can_bytes)

print("=== KẾT QUẢ GIẢI MÃ TÍN HIỆU CAN VẬT LÝ ===")
pprint(decoded_signals)

# Phân tích kết quả:
# 12 bits đầu tiên (Byte 0 và nửa Byte 1) có giá trị raw = 0x03E8 = 1000 (thập phân)
# Công thức: Physical = (1000 * 0.01) + (-10) = 10.0 - 10.0 = 0.0 m/s^2 (Gia tốc duy trì 0)
# Bit 12 có giá trị 1 -> Brake_Prefill = 1 (Trợ lực phanh đang sẵn sàng)
```

---

## 4. BÀI TẬP TỰ RÈN LUYỆN
1. Dựa vào ma trận 64 bit ở trên, hãy tự xác định các bit bị chiếm giữ bởi tín hiệu: `SG_ Engine_RPM : 24|16@1+ (0.25,0) [0|8000] "rpm"`.
2. Nếu raw hex nhận được tại vị trí của `Engine_RPM` là `0x1F40` ($8000_{10}$), hãy tính vận tốc vòng tua thực tế của động cơ.
   - *Đáp án:* $\text{RPM} = 8000 \times 0.25 + 0 = \mathbf{2000\text{ vòng/phút}}$.
