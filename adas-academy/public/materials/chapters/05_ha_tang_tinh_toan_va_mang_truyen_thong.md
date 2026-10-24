# CHƯƠNG 5: HẠ TẦNG TÍNH TOÁN & MẠNG TRUYỀN THÔNG TRÊN XE (E/E ARCHITECTURE)

---

## 1. TIẾN HÓA CỦA KIẾN TRÚC ĐIỆN - ĐIỆN TỬ (E/E ARCHITECTURE)

Sự bùng nổ của các tính năng phần mềm và hệ thống ADAS đã thúc đẩy một cuộc cách mạng sâu sắc nhất trong lịch sử kỹ thuật ô tô: **Sự chuyển dịch kiến trúc Điện - Điện tử (Electrical/Electronic Architecture).**

```
   GIAI ĐOẠN 1: PHÂN TÁN                      GIAI ĐOẠN 2: MIỀN                  GIAI ĐOẠN 3: PHÂN VÙNG
 (DISTRIBUTED ECUS - CŨ)               (DOMAIN CONTROLLER - HIỆN NAY)         (CENTRALIZED ZONAL - TƯƠNG LAI)
 
    [ECU 1]    [ECU 2]                     +------------------------+             +-------------------------+
       \          /                        | ADAS Domain Controller |             |   SIÊU MÁY TÍNH TRUNG   |
      +------------+                       +------------------------+             |     TÂM (CENTRAL PC)    |
      |   Mạng     |                                   |                          +-------------------------+
      |  CAN Bus   |                        Mạng CAN-FD / Ethernet                /            |            \
      +------------+                                   |                         /             |             \
       /          \                        +------------------------+     [Zone Front]    [Zone Left]    [Zone Right]
    [ECU 3]    [ECU 4]                     | BCM / Chassis Domain   |          |               |               |
(70 - 100 hộp ECU rời rạc,                 +------------------------+     (Các cảm biến & bộ chấp hành cắm vào
 dây điện nặng tới 50kg)              (Gom theo nhóm chức năng logic)      Zone gần nhất, giảm 50% khối lượng dây)
```

### 1.1. So sánh Ba Thế hệ Kiến trúc
1. **Kiến trúc Phân tán (Distributed Architecture):** Mỗi chức năng dùng 1 hộp ECU riêng biệt (Ví dụ: hộp ABS, hộp túi khí, hộp gạt mưa, hộp điều khiển động cơ...). Nhược điểm: Dây điện chằng chịt, chi phí đắt đỏ, không thể cập nhật phần mềm OTA cho toàn xe.
2. **Kiến trúc Điều khiển theo Miền (Domain Controller Architecture - Nền tảng VF 8 / VF 9 hiện tại):** Toàn bộ chức năng tính toán phức tạp của ADAS được tập trung về một máy tính chuyên dụng (**ADAS Domain Controller**).
3. **Kiến trúc Phân vùng Tập trung (Centralized Zonal Architecture - Thế hệ tương lai VinFast):** Toàn bộ xe chỉ có 1 siêu máy tính trung tâm (Central Brain) và 3-4 bộ gom vùng (Zonal Gateways) phụ trách cấp nguồn và đóng gói tín hiệu.

---

## 2. PHẦN CỨNG MÁY TÍNH ADAS DOMAIN CONTROLLER: HETEROGENEOUS COMPUTING

Để đạt chuẩn an toàn **ASIL-D**, một máy tính ADAS không thể chỉ dùng các chip xử lý thông thường, mà phải áp dụng kiến trúc **Tính toán Dị thể (Heterogeneous Computing)**:

```
+---------------------------------------------------------------------------------------------------------+
|                                     ADAS DOMAIN CONTROLLER (ZF PROAI / ADAS ECU)                        |
|                                                                                                         |
|  +---------------------------------------------------+   IPC   +-------------------------------------+  |
|  | CHÍP HIỆU NĂNG CAO (COMPUTE CORE)                 |<=======>| VI ĐIỀU KHIỂN AN TOÀN (SAFETY CORE) |  |
|  | (SoC: Mobileye EyeQ / Nvidia Orin / Qualcomm)     |  (PCIe) | (Safety MCU: Infineon AURIX TC397)  |  |
|  |                                                   |         |                                     |  |
|  | - Hệ điều hành: QNX Neutrino / Linux RT           |         | - Hệ điều hành: AUTOSAR Classic RTOS|  |
|  | - NPU / GPU: Deep Learning, CNN, Nhận diện ảnh    |         | - Tiêu chuẩn an toàn: ASIL-D        |  |
|  | - CPU Đa nhân: Dung hợp cảm biến EKF, Lập kế hoạch|         | - Chức năng: Giám sát Watchdog,     |  |
|  |   quỹ đạo chuyển động (Motion Planning)           |         |   Phân định quyền lực (Arbitration),|  |
|  |                                                   |         |   Gửi lệnh khẩn cấp qua CAN-FD.     |  |
|  +---------------------------------------------------+         +-------------------------------------+  |
|                            ^                                                      |                     |
|                            | GMSL2 / FPD-Link III                                 | CAN-FD              |
|                     [ CÁC CAMERA ]                                  [ PHANH ESP / LÁI EPS / ĐỘNG CƠ ]    |
+---------------------------------------------------------------------------------------------------------+
```

### 2.1. Phân định Vai trò: Compute Core vs. Safety Core
* **Compute Core (SoC):** 
  - Đảm nhận các thuật toán nặng nề về tính toán (hàng chục đến hàng trăm nghìn tỷ phép tính mỗi giây - TOPS).
  - Vì hệ điều hành Linux RT hoặc QNX rất phức tạp, nên không thể chứng minh toán học đạt chuẩn ASIL-D tuyệt đối (thường chỉ đạt ASIL-B).
* **Safety Core (Microcontroller MCU):**
  - Chạy hệ điều hành thời gian thực **AUTOSAR Classic OS** cực kỳ tinh gọn, đạt chứng nhận cao nhất **ASIL-D**.
  - MCU liên tục "hỏi bài" SoC thông qua giao thức giám sát nhịp tim (Heartbeat/Watchdog). Nếu SoC bị đơ máy (freeze) hoặc tính toán quỹ đạo vượt quá giới hạn gia tốc an toàn, Safety MCU sẽ lập tức tước quyền điều khiển của SoC và tự động kích hoạt chế độ phanh an toàn dừng xe.

---

## 3. MẠNG TRUYỀN THÔNG TRÊN XE: CAN-FD VS. AUTOMOTIVE ETHERNET

Hệ thống ADAS đòi hỏi hai yếu tố mạng: **Độ trễ thấp xác định (Deterministic Latency)** và **Băng thông lớn (High Bandwidth)**.

```
+-------------------+----------------------------+----------------------------+---------------------------+
| Đặc tính kỹ thuật | CAN Cổ điển (CAN 2.0)      | CAN-FD (Flexible Data-rate)| Automotive Ethernet       |
+-------------------+----------------------------+----------------------------+---------------------------+
| Băng thông tối đa | 500 kbps - 1 Mbps          | 2 Mbps - 5 Mbps            | 100 Mbps - 1 Gbps (T1)    |
+-------------------+----------------------------+----------------------------+---------------------------+
| Kích thước Payload| Tối đa 8 bytes             | Tối đa 64 bytes            | Tối đa 1500 bytes         |
+-------------------+----------------------------+----------------------------+---------------------------+
| Cơ chế Truyền dẫn | Trọng tài bit (CSMA/CD)    | Trọng tài bit + Tăng tốc   | Chuyển mạch điểm - điểm   |
|                   | phi phá hủy                | pha dữ liệu                | (Full-Duplex Switch)      |
+-------------------+----------------------------+----------------------------+---------------------------+
| Ứng dụng Thực tế  | Cảm biến đơn giản, đèn xe  | Lệnh lái EPS, Lệnh phanh   | Truyền danh sách vật thể  |
| trên VinFast      |                            | ESP, Trạng thái pin BMS    | Camera/Radar, Update OTA  |
+-------------------+----------------------------+----------------------------+---------------------------+
```

### 3.1. Cấu trúc Khung Truyền CAN-FD
Điểm cải tiến mang tính cách mạng của **CAN-FD** so với CAN truyền thống là cơ chế chuyển đổi tốc độ kép:
* **Pha Trọng tài (Arbitration Phase):** Chạy ở tốc độ chuẩn $500\text{ kbps}$ để đảm bảo tất cả các ECU trên xe đều nhận biết được ID bức điện và xử lý ưu tiên không xung đột.
* **Pha Dữ liệu (Data Phase):** Khi quyền truyền đã được xác lập, bộ phát tăng tốc xung nhịp lên tới $2 - 5\text{ Mbps}$ để bơm 64 bytes dữ liệu trong thời gian siêu ngắn, sau đó hạ tốc độ trở lại để gửi bit xác nhận ACK.

---

### 3.2. Automotive Ethernet & Giao thức Hướng dịch vụ (SOME/IP)
Khác với mạng CAN gửi tín hiệu chu kỳ cố định (Signal-oriented), Automotive Ethernet trên xe VinFast hoạt động theo mô hình **Hướng dịch vụ (Service-Oriented Architecture - SOA)**:
* **Giao thức SOME/IP (Scalable service-Oriented MiddlewarE over IP):**
  - Cơ chế **Publish - Subscribe (Xuất bản - Đăng ký):**
    * *Ví dụ:* Camera trước nhận diện được danh sách 5 vật thể phía trước xe. Nó đóng gói danh sách này thành một dịch vụ và xuất bản (Publish) lên mạng Ethernet.
    * Hộp ADAS Domain Controller, Hộp Cụm đồng hồ màn hình HUD và Hộp ghi dữ liệu hộp đen (Event Data Recorder) cùng đăng ký (Subscribe) luồng tin này.
  - Cơ chế **Remote Procedure Call (RPC):** Cho phép ECU này gọi một hàm tính toán trên một ECU khác từ xa với độ trễ dưới $1\text{ ms}$.

---

## 4. TỔNG KẾT
Kiến trúc E/E hiện đại chính là "hệ thần kinh" của chiếc xe VinFast. Việc kết hợp hài hòa giữa mạng truyền thông tốc độ cao Automotive Ethernet, mạng điều khiển thời gian thực an toàn CAN-FD, và bộ tính toán dị thể Heterogeneous Computing đảm bảo cho xe khả năng phản ứng chớp nhoáng trước mọi biến cố trên đường.
