# CHƯƠNG 9: CHUYÊN ĐỀ MẠNG TRUYỀN THÔNG BUS CAN & CAN-FD THỰC CHIẾN

> **Ghi chú Học thuật:**  
> Tài liệu này được biên soạn từ các tiêu chuẩn công nghiệp mở quốc tế (ISO 11898-1/2, Bosch CAN Specification 2.0B, CAN-FD Specification, CiA Draft Standards) và các tài liệu kỹ thuật công khai của Vector Informatik. Tài liệu phục vụ mục đích đào tạo kỹ thuật, không chứa thông tin bảo mật của bất kỳ tổ chức nào.

---

## 1. TỔNG QUAN TẦNG VẬT LÝ (PHYSICAL LAYER) CỦA MẠNG CAN

Mạng **CAN (Controller Area Network)** phát minh bởi tập đoàn Robert Bosch là tiêu chuẩn truyền thông xương sống trong công nghiệp ô tô suốt hơn 30 năm qua nhờ khả năng chống nhiễu điện từ cực cao và chi phí tối ưu.

```
                         TÍN HIỆU VI SAI TRÊN ĐƯỜNG BUS CAN
                         
   Điện áp (V)
      ^
 3.5V |           +-----------------------------+          CAN_H (Đường dây cao)
      |          /                               \
 2.5V |---------+---------------------------------+------- Mức chung (Common Mode)
      |          \                               /
 1.5V |           +-----------------------------+          CAN_L (Đường dây thấp)
      +----------------------------------------------------> Thời gian (t)
               |                                 |
           RECESSIVE                          DOMINANT                  RECESSIVE
          (Logic '1')                       (Logic '0')                (Logic '1')
      V_diff = 0V (2.5 - 2.5)          V_diff = 2.0V (3.5 - 1.5)      V_diff = 0V
```

### 1.1. Nguyên lý Tín hiệu Vi sai (Differential Signaling)
Mạng CAN sử dụng hai dây xoắn đôi (Twisted Pair) gồm **CAN_High (CAN_H)** và **CAN_Low (CAN_L)**:
* **Mức Lặn (Recessive - Logic '1'):**
  - Cả CAN_H và CAN_L đều ở mức điện áp danh định $2.5\text{V}$.
  - Hiệu điện thế vi sai: $V_{diff} = V_{CAN\_H} - V_{CAN\_L} \approx 0\text{V}$.
* **Mức Trội (Dominant - Logic '0'):**
  - Transceiver kéo CAN_H lên $3.5\text{V}$ và kéo CAN_L xuống $1.5\text{V}$.
  - Hiệu điện thế vi sai: $V_{diff} = 3.5\text{V} - 1.5\text{V} = 2.0\text{V}$.
* **Điện trở đầu cuối (Termination Resistors):** Bắt buộc phải có hai điện trở $120\ \Omega$ mắc song song ở hai đầu mút xa nhất của đường bus (tổng trở tương đương bằng $60\ \Omega$) nhằm triệt tiêu sóng phản xạ cao tần gây méo xung.

---

## 2. CƠ CHẾ TRỌNG TÀI BIT (BITWISE ARBITRATION) & ĐỘ ƯU TIÊN

Đặc tính thiên tài của mạng CAN là **không bao giờ bị xung đột làm mất dữ liệu (Non-destructive Bitwise Arbitration)** khi hai hoặc nhiều ECU cùng phát đồng thời.

```
                      CƠ CHẾ PHÂN XỬ TRỌNG TÀI TRÊN BUS CAN
                      
   Thời gian bit --->   Bit 1    Bit 2    Bit 3    Bit 4 (Phân định)
   +-------------------------------------------------------------------+
   | ECU A (ID 0x0A):   0        0        0        0 (Dominant)        |
   | ECU B (ID 0x0E):   0        0        0        1 (Recessive)  X    |
   +-------------------------------------------------------------------+
   | Trạng thái Bus:    0        0        0        0                   |
   +-------------------------------------------------------------------+
   ===> Tại Bit 4: ECU B phát Recessive '1' nhưng đọc về Dominant '0'
        -> ECU B lập tức thua trọng tài, rút lui chuyển sang chế độ nhận.
        -> ECU A tiếp tục truyền trọn vẹn bức điện mà không bị trễ micro-giây nào!
```

> **Quy tắc vàng cho Kỹ sư ADAS:**  
> **ID có giá trị số nguyên càng nhỏ thì mức độ ưu tiên càng cao!**  
> Vì vậy, các bản tin phanh khẩn cấp (AEB) hoặc trợ lực lái (EPS) luôn được gán ID rất nhỏ (ví dụ `0x050`, `0x100`), trong khi bản tin điều hòa hoặc giải trí được gán ID lớn (ví dụ `0x520`, `0x6F0`).

---

## 3. SO SÁNH CHUYÊN SÂU: CAN 2.0B VS. CAN-FD (FLEXIBLE DATA-RATE)

Hệ thống ADAS Level 2+ yêu cầu truyền danh sách vật thể (Object Lists) với khối lượng lớn, khiến mạng CAN 2.0 truyền thống nhanh chóng bị quá tải (Bus Load $> 80\%$). **CAN-FD** được sinh ra để giải quyết bài toán này.

```
+---------------------------------------------------------------------------------------------------------+
|                                  CẤU TRÚC KHUNG TRUYỀN CAN-FD                                          |
|                                                                                                         |
|  [ SOF | 11/29-bit ID | RRS | IDE | FDF | BRS | ESI | DLC ] ===> [ DỮ LIỆU TỐI ĐA 64 BYTES ] ===> [ CRC ]  |
|  |<-------- PHA TRỌNG TÀI (ARBITRATION) ------------->| |<----- PHA DỮ LIỆU TỐC ĐỘ CAO ------>| |< PHA >| |
|  |             Tốc độ: 500 kbps                       | |       Tốc độ: 2 - 5 Mbps            | | Trọng | |
|                                                         ^                                       | tài   | |
|                                                 Bit Chuyển Tốc Độ                               v         |
+---------------------------------------------------------------------------------------------------------+
```

| Tiêu chí So sánh | CAN Cổ điển (CAN 2.0B) | CAN-FD (ISO 11898-1:2015) | Ý nghĩa đối với Hệ thống ADAS |
| :--- | :--- | :--- | :--- |
| **Băng thông dữ liệu** | Cố định $500\text{ kbps} - 1\text{ Mbps}$ | Hai dải: $500\text{ kbps}$ (Trọng tài) + $2 - 5\text{ Mbps}$ (Dữ liệu) | Giảm thời gian chiếm dụng đường bus, cho phép gửi dữ liệu cảm biến tần số cao. |
| **Độ dài dữ liệu (Payload)** | Tối đa **8 bytes** | Tối đa **64 bytes** (0, 8, 12, 16, 20, 24, 32, 48, 64) | 1 bản tin CAN-FD có thể chứa tọa độ 3D và vận tốc của 4-5 vật thể từ Radar cùng lúc. |
| **Mã kiểm tra CRC** | 15 bits | 17 bits (Payload $\le 16\text{B}$) hoặc 21 bits (Payload $> 16\text{B}$) | Tăng độ an toàn dữ liệu, đáp ứng tiêu chuẩn an toàn **ASIL-D**. |
| **Bit BRS (Bit Rate Switch)**| Không có | Có (1 bit xác định chuyển sang tốc độ cao) | Chuyển mạch đồng hồ tức thì trong chip thu phát. |

---

## 4. TỆP CƠ SỞ DỮ LIỆU MẠNG: GIẢI MÃ FILE DBC (CAN DATABASE)

Tệp `.dbc` (phát triển bởi Vector Informatik) là "từ điển" dịch các chuỗi bit nhị phân thô trên bus thành các giá trị vật lý có nghĩa (km/h, radian, bar...).

### 4.1. Cấu trúc Cú pháp của một Tệp DBC Chuẩn

```
BO_ 304 ADAS_FrontRadar_Status: 8 ADAS_ECU
 SG_ Radar_Status : 0|2@1+ (1,0) [0|3] "" Vector__XXX
 SG_ LeadVeh_Distance : 8|12@1+ (0.1,0) [0|409.5] "m" BCM,ESP
 SG_ LeadVeh_RelativeSpeed : 20|12@1- (0.05,-100) [-100|104.75] "m/s" ESP
 SG_ AEB_TargetDecelReq : 32|8@1+ (0.1,0) [0|25.5] "m/s^2" ESP
 SG_ Rolling_Counter : 56|4@1+ (1,0) [0|15] "" ESP
 SG_ Checksum_CRC : 60|4@1+ (1,0) [0|15] "" ESP
```

### 4.2. Giải mã Từng Thành phần trong Định nghĩa Signal (`SG_`)

$$SG\_ \text{ [Tên\_Signal] : [StartBit] | [Length] @ [Endianness][Signedness] (Factor, Offset) [Min|Max] "[Unit]" [Receiver]}$$

1. **StartBit & Length (`8|12`):** Bắt đầu từ bit thứ 8, kéo dài 12 bits.
2. **Endianness (`@1` hoặc `@0`):**
   * `@1` = **Intel (Little Endian):** Bit trọng số thấp nằm ở byte có địa chỉ thấp (LSB first). Phổ biến nhất trong ô tô hiện đại.
   * `@0` = **Motorola (Big Endian):** Bit trọng số cao nằm ở byte có địa chỉ thấp (MSB first). Rất dễ bị nhầm lẫn khi đếm bit!
3. **Signedness (`+` hoặc `-`):**
   * `+`: Số nguyên không dấu (Unsigned).
   * `-`: Số nguyên có dấu (Signed - bù 2).
4. **Công thức Ánh xạ Vật lý (Scaling Equation):**
   $$\text{Giá trị Vật lý (Physical Value)} = (\text{Giá trị Nhị phân Thô} \times \text{Factor}) + \text{Offset}$$

* **Ví dụ Tính toán Thực tế:**
  Bản tin nhận được chuỗi raw: `LeadVeh_RelativeSpeed` có giá trị nhị phân thô là $1600$ (hệ thập phân).
  DBC quy định: $\text{Factor} = 0.05$, $\text{Offset} = -100$.
  $$\text{Vận tốc tương đối} = (1600 \times 0.05) + (-100) = 80 - 100 = \mathbf{-20\text{ m/s}}$$
  *(Ý nghĩa vật lý: Xe phía trước đang di chuyển chậm hơn xe mình $20\text{ m/s}$, khoảng cách đang bị thu hẹp nhanh chóng!).*

---

## 5. CƠ CHẾ QUẢN LÝ LỖI (FAULT CONFINEMENT) & MÁY TRẠNG THÁI BUS-OFF

Mỗi node CAN trên xe đều có cơ chế tự giám sát sức khỏe giao tiếp để tránh trường hợp một ECU bị "điên" làm nghẽn toàn bộ đường bus của cả xe.

```
                         MÁY TRẠNG THÁI QUẢN LÝ LỖI CAN (FAULT CONFINEMENT)
                         
    +-------------------------------------------------------------------------------+
    |                          ERROR ACTIVE (BÌNH THƯỜNG)                           |
    |  - Node được quyền truyền/nhận bình thường.                                  |
    |  - Khi phát hiện lỗi: Gửi cờ lỗi chủ động (Active Error Flag: 6 bit Dominant).|
    |  - Điều kiện: TEC < 128 VÀ REC < 128                                          |
    +-------------------------------------------------------------------------------+
                             |                   ^
      TEC > 127 hoặc         |                   | TEC <= 127 VÀ
      REC > 127              v                   | REC <= 127
    +-------------------------------------------------------------------------------+
    |                           ERROR PASSIVE (CẢNH BÁO)                            |
    |  - Node vẫn truyền/nhận được nhưng bị hạn chế.                                |
    |  - Khi phát hiện lỗi: Chỉ được gửi cờ lỗi bị động (Passive Error Flag: 6 bit 1)|
    |  - Phải đợi thêm 8 bit rảnh (Suspend Transmission) mới được truyền tiếp.      |
    |  - Điều kiện: 128 <= TEC <= 255 HOẶC 128 <= REC <= 255                        |
    +-------------------------------------------------------------------------------+
                             |
         TEC > 255           |
                             v
    +-------------------------------------------------------------------------------+
    |                              BUS OFF (CÁCH LY)                                |
    |  - Node bị ngắt kết nối hoàn toàn khỏi đường bus (Output Driver tắt).         |
    |  - Không thể gửi hay nhận bất kỳ bản tin nào.                                 |
    |  - Phục hồi (Bus-Off Recovery): Phải đợi đủ 128 lần xuất hiện 11 bit lặn liên|
    |    tiếp mới được reset TEC/REC về 0 và quay lại Error Active.                 |
    +-------------------------------------------------------------------------------+
```

*Trong đó:*
* **TEC (Transmit Error Counter):** Bộ đếm lỗi khi truyền (Mỗi lần truyền lỗi tăng 8, truyền thành công giảm 1).
* **REC (Receive Error Counter):** Bộ đếm lỗi khi nhận.

---

## 6. LẬP TRÌNH CAPL TRONG VECTOR CANOE: KIỂM THỬ MẠNG ADAS

Trong phòng kiểm thử, kỹ sư sử dụng ngôn ngữ **CAPL (CAN Access Programming Language)** để viết các kịch bản kiểm tra tự động thời gian thực:

```c
/* 
   Kịch bản CAPL: Giám sát Chu kỳ Bản tin Phanh Khẩn Cấp (Cycle Time Supervision)
   Quy chuẩn: Bản tin 0x304 phải xuất hiện mỗi 20ms (+- 2ms). Nếu trễ > 25ms -> Cảnh báo lỗi!
*/
variables {
  msTimer timerCycleCheck;
  const long kExpectedCycleTime = 20; // 20 ms
  const long kMaxCycleTime = 25;      // Ngưỡng tối đa cho phép
  long gLastTimestamp = 0;
}

on start {
  write("=== BẮT ĐẦU GIÁM SÁT MẠNG CAN CHO TÍNH NĂNG ADAS ===");
}

on message ADAS_FrontRadar_Status {
  long currentTimestamp;
  long timeDelta;

  currentTimestamp = timeNow() / 100; // Đổi về đơn vị mili-giây

  if (gLastTimestamp != 0) {
    timeDelta = currentTimestamp - gLastTimestamp;

    // Kiểm tra vi phạm chu kỳ
    if (timeDelta > kMaxCycleTime) {
      writeEx(1, 3, "LỖI NGUY HIỂM: Bản tin ADAS_FrontRadar_Status bị trễ! Delta = %d ms (Chuẩn: 20 ms)", timeDelta);
      outputTestFailure("Timing_Violation", "Radar message delayed over safety threshold!");
    } else {
      // Chu kỳ hợp chuẩn
      // write("Chu kỳ ổn định: %d ms", timeDelta);
    }
  }

  // Cập nhật timestamp cho lần tiếp theo
  gLastTimestamp = currentTimestamp;
}

on errorFrame {
  // Bắt các khung lỗi trên đường bus CAN
  writeEx(1, 3, "CẢNH BÁO: Phát hiện Error Frame trên Bus! Mã lỗi phần cứng = %d", this.errorCode);
}
```

---

## 7. TỔNG KẾT
Làm chủ tầng vật lý, cơ chế phân xử trọng tài, cấu trúc file DBC và máy trạng thái lỗi của mạng CAN/CAN-FD là kỹ năng nền tảng sống còn của một kỹ sư kiểm thử ô tô. Đó là chiếc chìa khóa để giải mã mọi dòng dữ liệu chuyển động của xe từ mức nhị phân thô thành các sự kiện an toàn thực tế.
