# CHƯƠNG 6: QUY TRÌNH KIỂM THỬ (V-MODEL), HIỆU CHUẨN CẢM BIẾN & TIÊU CHUẨN NCAP

---

## 1. MÔ HÌNH CHỮ V (V-MODEL) & QUY TRÌNH ASPICE TRONG PHÁT TRIỂN ADAS

Ngành công nghiệp ô tô không chấp nhận phương pháp thử-sai (trial-and-error) trực tiếp trên đường phố. Mọi dòng mã nguồn và thiết kế phần cứng của VinFast đều phải tuân thủ nghiêm ngặt **Mô hình Chữ V (V-Model)** theo khung năng lực quy trình phần mềm ô tô **Automotive SPICE (ASPICE)**:

```
+---------------------------------------------------------------------------------------------------------+
|                                    CHU TRÌNH PHÁT TRIỂN V-MODEL CHO ADAS                                |
|                                                                                                         |
| Yêu cầu Hệ thống (System Req) ------------------------------------> Thử nghiệm Xe Thật (Vehicle Testing)|
|       \                                                                         /                       |
|    Kiến trúc Hệ thống (System Architecture) -------------------> Thử nghiệm HIL (Hardware-in-the-Loop)  |
|          \                                                                   /                          |
|       Thiết kế Chi tiết Module (Detailed Design) ------------> Thử nghiệm SIL (Software-in-the-Loop)   |
|             \                                                             /                             |
|          Lập trình Mã nguồn (Coding C++/MISRA) ---> Thử nghiệm MIL (Model-in-the-Loop)                  |
+---------------------------------------------------------------------------------------------------------+
```

### 1.1. Bốn Cấp độ Kiểm thử Giả lập (X-in-the-Loop)
1. **MIL (Model-in-the-Loop):**
   - Kiểm tra logic toán học của thuật toán (PID, MPC, Bộ lọc Kalman) trong môi trường mô phỏng toán học như MATLAB/Simulink.
   - Mục tiêu: Đảm bảo thuật toán hội tụ và ổn định lý thuyết trước khi viết code.
2. **SIL (Software-in-the-Loop):**
   - Biên dịch thuật toán thành mã nguồn C/C++ chuẩn Automotive (tuân thủ bộ quy tắc **MISRA-C:2012**).
   - Chạy kiểm thử trên các môi trường giả lập thế giới ảo 3D như **CARLA Simulator, IPG CarMaker, hoặc VIRES VTD**.
   - Có thể chạy song song hàng triệu kilomet đường ảo với hàng chục nghìn kịch bản thời tiết, ánh sáng khác nhau trên các máy chủ đám mây.
3. **HIL (Hardware-in-the-Loop):**
   - Hộp ECU ADAS thật (sản xuất bởi ZF, Bosch hoặc VinFast) được kết nối vật lý với giàn máy test HIL chuyên dụng (**dSPACE SCALEXIO hoặc Vector CANoe**).
   - Giàn máy HIL đóng vai trò là "chiếc xe ảo": Nó phát ra tín hiệu điện áp chân ga giả, xung cảm biến tốc độ bánh xe giả, và các bức điện CAN-FD giả lập.
   - Thử nghiệm tính năng tiêm lỗi (**Fault Injection**): Cố tình ngắt nguồn một radar, làm ngắn mạch dây bus CAN xem ECU có phát hiện lỗi trong vòng $10\text{ ms}$ và chuyển về trạng thái an toàn hay không.
4. **VIL (Vehicle-in-the-Loop) & Thử nghiệm Sa hình (Proving Ground):**
   - Lắp đặt toàn bộ hệ thống lên xe mẫu nguyên mẫu (Prototype vehicle).
   - Tiến hành chạy thử trên các đường thử chuyên dụng (như đường thử tại Nhà máy VinFast Hải Phòng hoặc các trung tâm thử nghiệm độc lập tại IDIADA - Tây Ban Nha, DEKRA - Đức).

---

## 2. KỸ THUẬT HIỆU CHUẨN CẢM BIẾN (SENSOR CALIBRATION)

Một chiếc xe có thuật toán AI hoàn hảo vẫn sẽ đâm va nếu cảm biến bị lắp lệch dù chỉ $1^\circ$.

```
               ẢNH HƯỞNG CỦA SAI SỐ HIỆU CHUẨN GÓC XOAY (EXTRINSIC ERROR)
               
   Góc lệch \Delta \theta = 1.0^\circ
   Tại cự ly L = 100 mét:
   Sai số vị trí ngang: \Delta y = L \cdot \tan(\Delta \theta) = 100 \cdot \tan(1^\circ) \approx 1.75 \text{ mét}!
   ===> Xe sẽ hiểu nhầm xe đang đi ở làn bên cạnh thành xe đang đi ngay trước mũi xe mình!
```

### 2.1. Ma trận Hiệu chuẩn Tham số Ngoài (Extrinsic Calibration)
Chuyển đổi tọa độ từ hệ quy chiếu cảm biến (Sensor Frame $\{S\}$) về hệ quy chiếu thân xe (Vehicle Frame $\{V\}$):

$$\mathbf{P}_v = \mathbf{R}_{v\_s} \mathbf{P}_s + \mathbf{t}_{v\_s}$$

Trong đó ma trận xoay $\mathbf{R}_{v\_s}$ được xác định bởi 3 góc Euler: **Roll ($\phi$), Pitch ($\theta$), Yaw ($\psi$)**:
$$\mathbf{R}_{v\_s} = \mathbf{R}_z(\psi) \mathbf{R}_y(\theta) \mathbf{R}_x(\phi)$$

---

### 2.2. Hai Quy trình Hiệu chuẩn Bắt buộc trên Xe VinFast
1. **Hiệu chuẩn Tĩnh Cuối Dây chuyền (End-of-Line Static Calibration):**
   - Thực hiện tại phân xưởng kiểm định xe cuối cùng ở nhà máy VinFast Hải Phòng.
   - Xe được cố định trên sàn phẳng tuyệt đối, hướng vào một tấm bảng tiêu chuẩn (Target Board) vẽ hoa văn hình học chính xác đặt cách đầu xe $2.0\text{m}$.
   - Thiết bị định vị laser đo đạc vị trí tâm xe. Kỹ thuật viên cắm thiết bị chẩn đoán qua cổng OBD-II kích hoạt chu trình tự tính toán tham số nội/ngoại và ghi đè vào bộ nhớ flash của camera/radar.
2. **Hiệu chuẩn Động Trong Quá trình Lăn bánh (Dynamic In-Drive Calibration):**
   - Trong quá trình khách hàng sử dụng xe, do dao động rung lắc cơ khí hoặc va chạm nhẹ vào ba-đờ-sốc, góc đặt cảm biến có thể bị xê dịch.
   - Thuật toán Service-Oriented liên tục phân tích các đặc trưng tĩnh trên đường (đường chân trời để cân góc Pitch; vạch sơn kẻ làn dài thẳng tắp để cân góc Yaw). Nếu phát hiện góc lệch vượt ngưỡng cho phép, xe tự động cập nhật lại ma trận ngoại mà người lái không hề hay biết.

---

## 3. TIÊU CHUẨN ĐÁNH GIÁ VA CHẠM EURO NCAP & ASEAN NCAP

Để đạt chứng nhận an toàn **5 sao Euro NCAP và ASEAN NCAP**, các dòng xe VinFast (VF 8, VF 9, VF 7) phải vượt qua hàng loạt kịch bản thử nghiệm va chạm thực tế khắc nghiệt:

```
+---------------------------------------------------------------------------------------------------------+
|                                    CÁC BÀI THỬ NGHIỆM AN TOÀN CHỦ ĐỘNG ADAS                             |
+---------------------+-------------------+---------------------------------------------------------------+
| Kịch bản Thử nghiệm | Tên gọi Kỹ thuật  | Mô tả Tình huống Thử nghiệm                                   |
+---------------------+-------------------+---------------------------------------------------------------+
| Car-to-Car          | CCRs              | Xe chạy tới với tốc độ 20-80 km/h đâm vào đuôi một xe mục tiêu|
| Đuôi xe Đứng yên    | (Stationary)      | đang đỗ bất động giữa làn. Hệ thống bắt buộc phải phanh dừng hẳn.|
+---------------------+-------------------+---------------------------------------------------------------+
| Car-to-Car          | CCRm              | Xe chạy 50-80 km/h tiếp cận đuôi một xe mục tiêu đang chạy    |
| Đuôi xe Chậm hơn    | (Moving)          | chậm phía trước với tốc độ 20 km/h.                           |
+---------------------+-------------------+---------------------------------------------------------------+
| Car-to-Car          | CCRb              | Cả 2 xe đang chạy cùng tốc độ 50 km/h ở cự ly gần, xe phía   |
| Xe trước Phanh Gấp  | (Braking)         | trước đột ngột phanh gấp với gia tốc -4 m/s².                 |
+---------------------+-------------------+---------------------------------------------------------------+
| Người Đi bộ         | CPNA              | Người đi bộ là trẻ em chạy nhanh băng qua đường từ sau chướng |
| Băng qua bị Che khuất| (Pedestrian)     | ngại vật (hai chiếc xe đang đỗ bên đường che khuất tầm nhìn). |
+---------------------+-------------------+---------------------------------------------------------------+
| Người Đi Xe đạp     | CBNA              | Xe đạp cắt ngang luồng di chuyển từ ngõ khuất đi ra.          |
| Cắt ngang           | (Bicyclist)       |                                                               |
+---------------------+-------------------+---------------------------------------------------------------+
```

* **Thành tựu Thực tế của VinFast VF 8:**
  - Trong các bài đánh giá của **ASEAN NCAP**, VinFast VF 8 xuất sắc đạt điểm số tối đa ở hạng mục **Hỗ trợ An toàn (Safety Assist)** với điểm số vượt trội trong tính năng Phanh khẩn cấp tự động (AEB) và Cảnh báo điểm mù (BSD).
  - Kết quả này khẳng định hệ thống tích hợp giữa phần cứng Tier-1 (ZF, Mobileye) và phần mềm điều khiển của VinFast đã đạt chuẩn mực an toàn cao nhất của ngành công nghiệp ô tô toàn cầu.

---

## 4. TỔNG KẾT
Kiểm thử và hiệu chuẩn là "chốt chặn cuối cùng" bảo vệ sinh mạng của khách hàng. Một kỹ sư ADAS đẳng cấp không chỉ biết xây dựng giải thuật, mà phải là người thấu hiểu từng quy chuẩn khắt khe của Euro NCAP và các phương pháp kiểm thử X-in-the-Loop để biến một dòng code trở thành một cơ chế bảo vệ vững chắc ngoài đời thực.
