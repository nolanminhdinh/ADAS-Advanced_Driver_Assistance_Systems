# GIÁO TRÌNH CHUYÊN SÂU: KỸ THUẬT HỆ THỐNG ADAS & XE TỰ HÀNH
> **Tài liệu Kỹ thuật Toàn diện từ Lý thuyết đến Thực chiến**  
> *Định hướng nghiên cứu, phát triển & thẩm định hệ thống ADAS trên các dòng xe điện thông minh (VinFast VF 8, VF 9, VF 7, VF e34) và đối chuẩn quốc tế (Tesla, Mercedes-Benz, Waymo)*

---

## MỤC LỤC & TÀI LIỆU CHI TIẾT TỪNG CHƯƠNG

| Chương | Tên Chuyên Đề Kỹ Thuật | Bản Chi Tiết Chuyên Sâu (Markdown) |
| :--- | :--- | :--- |
| **Chương 1** | Tổng Quan Kiến Trúc Hệ Thống & Tiêu Chuẩn Công Nghiệp | [Xem Chi Tiết Chương 1](./chapters/01_tong_quan_kien_truc_va_tieu_chuan.md) |
| **Chương 2** | Tầng Cảm Biến (Sensing) & Dung Hợp Dữ Liệu (Sensor Fusion) | [Xem Chi Tiết Chương 2](./chapters/02_tang_cam_bien_va_dung_hop_du_lieu.md) |
| **Chương 3** | Các Tính Năng ADAS Cốt Lõi & Thuật Toán Điều Khiển | [Xem Chi Tiết Chương 3](./chapters/03_tinh_nang_adas_va_thuat_toan_dieu_khien.md) |
| **Chương 4** | Hệ Thống Giám Sát Khoang Lái (DMS/OMS) & Trải Nghiệm HMI | [Xem Chi Tiết Chương 4](./chapters/04_giam_sat_khoang_lai_dms_oms_hmi.md) |
| **Chương 5** | Hạ Tầng Tính Toán & Mạng Truyền Thông Trên Xe (E/E Architecture) | [Xem Chi Tiết Chương 5](./chapters/05_ha_tang_tinh_toan_va_mang_truyen_thong.md) |
| **Chương 6** | Quy Trình Kiểm Thử (V-Model), Hiệu Chuẩn & Tiêu Chuẩn NCAP | [Xem Chi Tiết Chương 6](./chapters/06_kiem_thu_hieu_chuan_va_tieu_chuan_ncap.md) |
| **Chương 7** | Lộ Trình Thực Hành & Dự Án Mẫu (Capstone Projects) | [Xem Chi Tiết Chương 7](./chapters/07_lo_trinh_thuc_hanh_va_du_an_capstone.md) |
| **Chương 8** | Chuyên Đề Kỹ Thuật Kiểm Thử & Thẩm Định Hệ Thống (System V&V) | [Xem Chi Tiết Chương 8](./chapters/08_chuyen_sau_kiem_thu_va_tham_dinh_he_thong.md) |
| **Phụ lục** | Trích Dẫn Nguồn Học Thuật & Bản Quyền Sở Hữu Trí Tuệ | [Xem Chi Tiết Phụ Lục](#trích-dẫn-tài-liệu-tham-khảo--tuyên-bố-bản-quyền-sở-hữu-trí-tuệ) |

---

## CHƯƠNG 1: TỔNG QUAN KIẾN TRÚC HỆ THỐNG & TIÊU CHUẨN CÔNG NGHIỆP

### 1.1. Phân cấp Cấp độ Tự hành SAE J3016 & Miền thiết kế Vận hành (ODD)
Tiêu chuẩn quốc tế **SAE J3016** phân chia tự hành ô tô từ Cấp độ 0 (L0) đến Cấp độ 5 (L5). Điểm phân định kỹ thuật và pháp lý quan trọng nhất nằm ở: **Ai chịu trách nhiệm an toàn khi xảy ra sự cố?** và **ODD (Operational Design Domain - Miền thiết kế vận hành)**:

```
+-----------------------------------------------------------------------------------------+
|                                  SAE J3016 LEVELS                                       |
+-----------------------+----------------------------------+------------------------------+
| Level 0 - Level 2     | Lái xe chịu trách nhiệm 100%     | Driver in the loop           |
| (Hands-on / Eyes-on)  | Xe chỉ hỗ trợ cảnh báo/lái phụ   | ODD giới hạn                 |
+-----------------------+----------------------------------+------------------------------+
| Level 3               | Xe chịu trách nhiệm khi ODD bật  | Người lái sẵn sàng tiếp quản |
| (Hands-off / Eyes-off)| Có cảnh báo TOR (5-10s)          | ODD quy định chặt chẽ        |
+-----------------------+----------------------------------+------------------------------+
| Level 4 - Level 5     | Hệ thống tự hành chịu 100%       | Không cần người lái dự phòng |
| (Driverless / Robot)  | Fallback an toàn chủ động        | L4: ODD cố định; L5: Mọi nơi |
+-----------------------+----------------------------------+------------------------------+
```

```
               SƠ ĐỒ LUỒNG DỮ LIỆU KIẾN TRÚC ADAS TIÊU CHUẨN

   [Sensing / Perception]        --->       [Perception Fusion & Tracking]
(Camera, Radar, USS, LiDAR)                  (EKF, Hungarian, Occupancy Grid)
            |                                               |
            v                                               v
   [Localization & Map]         --->       [Planning & Decision Making]
(GNSS/IMU, HD Map, Odometry)                 (State Machine, Path/Speed Planner)
                                                            |
                                                            v
                                            [Vehicle Motion Control]
                                            (Longitudinal: PID/MPC)
                                            (Lateral: Stanley/LQR/MPC)
                                                            |
                                                            v
                                            [Actuation / Drive-by-Wire]
                                            (EPS, ESP/iBooster, VCU/Inverter)
```

---

### 1.2. So sánh Kiến trúc Thực tế: Tesla vs. Mercedes-Benz vs. VinFast

| Tiêu chí | Tesla (FSD Beta / HW4) | Mercedes-Benz (Drive Pilot) | VinFast (VF 8 / VF 9 ADAS L2+) |
| :--- | :--- | :--- | :--- |
| **Cấp độ SAE công bố** | **Level 2** (Dù tên thương mại là Full Self-Driving, trách nhiệm pháp lý vẫn là lái xe) | **Level 3 thương mại đầu tiên** được cấp phép tại Đức & Mỹ (California, Nevada) | **Level 2 / Level 2+** (Đạt chứng nhận an toàn NHTSA, Euro NCAP, ASEAN NCAP) |
| **Triết lý Cảm biến** | **Pure Vision:** Bỏ hoàn toàn Radar và Cảm biến siêu âm (USS). 100% dựa vào 8 Camera xung quanh xe. | **Đa cảm biến dư thừa (Redundant):** LiDAR (Valeo SCALA), Radar 4D, Camera Stereo, Micro âm thanh xe ưu tiên, Cảm biến độ ẩm mặt đường. | **Hybrid Đa cảm biến (Tier-1 Standard):** 1 Cụm Camera trước góc rộng + 5 Radar mmWave (1 trước, 4 góc) + 12 Cảm biến Siêu âm + 4 Camera 360 SVM. |
| **Đối tác / Nền tảng** | Tự thiết kế toàn bộ (In-house SoC FSD, In-house NN, Siêu máy tính Dojo). | Hợp tác cùng Valeo, Nvidia (Drive Orin), Here HD Maps. | Hợp tác chiến lược cùng **ZF Friedrichshafen** (ZF ProAI / ZF Co-Pilot Platform), **Mobileye** (EyeQ series), tích hợp module AI thông minh từ **VinAI**. |
| **ODD cho phép** | Mọi cung đường (End-to-End Neural Network) nhưng lỗi thì người lái gánh. | Rất ngặt: Chỉ trên cao tốc được phê duyệt, tốc độ $\le 60$ km/h (sắp nâng lên 95 km/h), ban ngày, không mưa bão tuyết. | Cao tốc, đô thị có vạch kẻ rõ ràng, bãi đỗ xe; hỗ trợ tắc đường (Traffic Jam Assist) và đường trường (Highway Assist). |

> **Góc nhìn kỹ sư VinFast:** VinFast chọn giải pháp kết hợp giữa các Tier-1 hàng đầu thế giới (ZF, Mobileye) để rút ngắn chu kỳ R&D và đảm bảo tiêu chuẩn an toàn khắt khe của thị trường Bắc Mỹ & Châu Âu, đồng thời tích hợp các module Computer Vision tối ưu cho giao thông Việt Nam do VinAI nghiên cứu.

---

### 1.3. An toàn Chức năng ISO 26262 & Tiêu chuẩn SOTIF (ISO 21448)
*   **ISO 26262 (Functional Safety - FuSa):** Tập trung vào việc ngăn chặn và giảm thiểu rủi ro bắt nguồn từ **lỗi hỏng hóc ngẫu nhiên của phần cứng (Hardware Faults)** hoặc **lỗi thiết kế phần mềm (Systematic Software Faults)**.
    *   Mức an toàn tích hợp xe hơi (ASIL) được xếp hạng từ **ASIL-A** (thấp nhất) đến **ASIL-D** (cao nhất).
    *   *Ứng dụng trên VinFast:* Bộ điều khiển Phanh khẩn cấp tự động (AEB) và Trợ lực lái (EPS) trên VF 8/9 bắt buộc phải đạt tiêu chuẩn **ASIL-D**, có mạch giám sát độc lập (Watchdog) và vi điều khiển dự phòng an toàn (Safety MCU như Infineon AURIX TriCore).
*   **ISO 21448 (SOTIF - Safety of the Intended Functionality):** Tập trung vào kịch bản: *Phần cứng không hỏng, phần mềm không bị crash, nhưng hệ thống vẫn đưa ra quyết định sai do giới hạn vật lý của cảm biến hoặc độ nhiễu môi trường.*
    *   *Ví dụ SOTIF thực tế:* Xe VinFast di chuyển dưới cơn mưa rào lớn ở miền Trung, camera bị nước làm mờ thấu kính, radar bị tán xạ bởi vũng nước phản chiếu kim loại. SOTIF quy định hệ thống phải nhận diện được suy giảm hiệu năng này để cảnh báo người lái và tắt tính năng ADAS một cách an toàn (*Graceful Degradation*), thay vì tự đánh lái hoặc phanh giật đột ngột (*Phantom Braking*).

---

## CHƯƠNG 2: TẦNG CẢM BIẾN (SENSING) & DUNG HỢP DỮ LIỆU (SENSOR FUSION)

```
+-----------------------------------------------------------------------+
| SENSING SUITE TRÊN XE VINFAST VF 8 / VF 9                             |
|                                                                       |
|             [1x Forward Camera (Mobileye / ZF)]                       |
|             [1x Long-Range mmWave Radar (Front Grille)]               |
|                                                                       |
|   [2x Front Corner Radars]                   [2x Rear Corner Radars]  |
|                                                                       |
|         [4x Surround View Cameras 360 - Powered by VinAI]             |
|                                                                       |
|                 [12x Ultrasonic Sensors (USS)]                        |
|                                                                       |
|           [1x Cabin DMS Infrared Camera - Powered by VinAI]           |
+-----------------------------------------------------------------------+
```

### 2.1. Cảm biến Camera & Công nghệ Thị giác Máy tính
*   **Đặc tính vật lý:** Cung cấp thông tin giàu ngữ nghĩa nhất (màu sắc, hình dạng, biển báo, phân loại làn đường). Thường sử dụng cảm biến CMOS dải tương phản cao (HDR $> 120\text{ dB}$).
*   **Đặc thù VinAI trên VinFast - JellyView (Transparent Hood):**
    *   Sử dụng 4 camera góc rộng Fisheye xung quanh xe.
    *   Mạng nơ-ron tổng hợp các frame ảnh liên tục theo thời gian, tái tạo không gian 3D dưới gầm và xung quanh thân xe.
    *   Người lái có thể nhìn xuyên thấu mặt đường bên dưới gầm xe trên màn hình cảm ứng trung tâm, loại bỏ hoàn toàn các điểm mù khi đỗ xe hoặc đi qua gờ cao, hố sụt.

### 2.2. Radar Sóng Milimet (mmWave Radar 77GHz - 79GHz)
*   **Đặc tính vật lý:** Hoạt động dựa trên sóng điện từ dải tần 77GHz, đo trực tiếp khoảng cách $d$ và vận tốc tương đối $v_{rel}$ nhờ hiệu ứng Doppler:
    $$f_D = \frac{2 \cdot v_{rel}}{\lambda} = \frac{2 \cdot v_{rel} \cdot f_0}{c}$$
*   **Ưu điểm:** Khả năng xuyên thấu tuyệt đối qua sương mù, mưa giông, cát bụi; hoạt động tốt cả ngày lẫn đêm.
*   **Cấu hình trên VinFast VF 8 / VF 9:**
    *   *1 Radar tầm xa phía trước (Forward Radar):* Quét góc hẹp $\pm 10^\circ$ tới cự ly $200\text{m}$, góc rộng $\pm 45^\circ$ tới $80\text{m}$.
    *   *4 Radar góc (Corner Radars):* Bố trí tại 4 góc ba-đờ-sốc, quét vùng mù phía sau (phục vụ BSD, DOW) và cắt ngang đầu/đuôi xe (phục vụ FCTA, RCTA).

### 2.3. Cảm biến Siêu âm (Ultrasonic Sensors - USS)
*   Tần số hoạt động $40\text{ kHz} - 58\text{ kHz}$. Đo khoảng cách dựa trên thời gian truyền âm ToF (*Time-of-Flight*):
    $$d = \frac{c_{âm} \cdot \Delta t}{2}$$
*   12 cảm biến siêu âm trên VF 8 / VF 9 được tối ưu hóa cho bài toán đỗ xe tự động (Automated Parking Assist - APA), quét chính xác mép bó vỉa, cột mốc, và khe hở giữa 2 phương tiện song song hoặc vuông góc.

### 2.4. Thuật toán Dung hợp Dữ liệu (Sensor Fusion & EKF)
Hệ thống kết hợp dữ liệu giữa Camera (nhận diện vật thể, đo khoảng cách góc ngang tốt) và Radar (đo cự ly sâu và vận tốc tương đối chính xác).

```
Early Fusion (Raw Level):
[Raw Camera Pixels] + [Radar Point Cloud] ===(Deep Neural Net)===> [3D Bounding Boxes]

Late Fusion (Object Level - Standard trên VF 8/9):
[Camera] ---> Detection Model  ---> [BBox + Object Class] --\
                                                             +==>[EKF Tracker]==>[Unified Object]
[Radar]  ---> Cluster / Filter ---> [Range + Doppler Vel] --/
```

#### Mô hình Bộ lọc Kalman Mở rộng (Extended Kalman Filter - EKF)
*   **Vector trạng thái vật thể mục tiêu:** $\mathbf{x} = [x, y, v_x, v_y, a_x, a_y]^T$
*   **Mô hình chuyển động (State Transition):**
    $$\mathbf{\hat{x}}_{k|k-1} = \mathbf{F}\mathbf{\hat{x}}_{k-1|k-1}$$
    $$\mathbf{P}_{k|k-1} = \mathbf{F}\mathbf{P}_{k-1|k-1}\mathbf{F}^T + \mathbf{Q}$$
*   **Cập nhật đo lường (Measurement Update):**
    $$\mathbf{y}_k = \mathbf{z}_k - h(\mathbf{\hat{x}}_{k|k-1})$$
    $$\mathbf{S}_k = \mathbf{H}_k \mathbf{P}_{k|k-1} \mathbf{H}_k^T + \mathbf{R}$$
    $$\mathbf{K}_k = \mathbf{P}_{k|k-1} \mathbf{H}_k^T \mathbf{S}_k^{-1}$$
    $$\mathbf{\hat{x}}_{k|k} = \mathbf{\hat{x}}_{k|k-1} + \mathbf{K}_k \mathbf{y}_k$$
    $$\mathbf{P}_{k|k} = (\mathbf{I} - \mathbf{K}_k \mathbf{H}_k)\mathbf{P}_{k|k-1}$$

---

## CHƯƠNG 3: CÁC TÍNH NĂNG ADAS CỐT LÕI & THUẬT TOÁN ĐIỀU KHIỂN

### 3.1. Phanh Khẩn Cấp Tự Động (AEB) & Logic Tính toán TTC
*   **Chỉ số Thời gian tới Va chạm (Time-to-Collision - TTC):**
    $$\text{TTC} = \frac{d_{relative}}{-v_{relative}} = \frac{x_{lead} - x_{ego}}{v_{ego} - v_{lead}} \quad (\text{với } v_{ego} > v_{lead})$$
*   **Phân tầng Cảnh báo & Can thiệp:**
    1.  $\text{TTC} > 3.0\text{s}$: Trạng thái bình thường.
    2.  $2.0\text{s} < \text{TTC} \le 3.0\text{s}$: Kích hoạt Cảnh báo va chạm phía trước (FCW) qua âm thanh và hình ảnh HUD.
    3.  $1.5\text{s} < \text{TTC} \le 2.0\text{s}$: Tiền phanh (*Brake Jerk*), ép nhẹ áp suất dầu phanh.
    4.  $\text{TTC} \le 1.2\text{s}$: Can thiệp phanh khẩn cấp cấp độ tối đa ($a \approx -1.0g$).

*Kỹ thuật trên xe VinFast:* Do môi trường giao thông Việt Nam có mật độ xe máy tạt đầu (Cut-in) rất cao, thuật toán AEB trên xe VinFast được tinh chỉnh bổ sung các ngưỡng gia tốc ngang (Lateral velocity threshold) để phân biệt giữa tình huống xe máy chỉ cắt ngang thoáng qua và tình huống thực sự có nguy cơ đâm va trực diện.

---

### 3.2. Kiểm Soát Hành Trình Thích Ứng (ACC) & Bộ Điều khiển MPC
*   Khoảng cách mục tiêu biến thiên theo vận tốc:
    $$d_{target} = d_0 + \tau_{gap} \cdot v_{ego}$$
*   **Bộ điều khiển Dự báo Mô hình (MPC - Model Predictive Control):**
    Khác với bộ điều khiển PID thuần túy dễ gây giật, MPC giải bài toán tối ưu hóa đa mục tiêu trong dải dự báo $N_p$:
    $$\min_{\Delta u} \sum_{k=1}^{N_p} \left[ w_d \cdot (d(t+k) - d_{target})^2 + w_v \cdot (v(t+k) - v_{target})^2 + w_j \cdot (\text{Jerk}(t+k))^2 \right]$$
    Giúp chiếc xe VinFast tăng/giảm tốc êm ái, mang lại trải nghiệm tiện nghi chuẩn xe hạng sang.

---

### 3.3. Hỗ Trợ Giữ Làn (LKA) / Định Tâm Làn (LCA) & Stanley Controller
*   **Thuật toán Stanley (Stanley Controller):**
    Điều khiển góc lái bánh trước $\delta(t)$ dựa trên sai số khoảng cách ngang $e_y$ và sai số góc hướng $\theta_e$:
    $$\delta(t) = \theta_e(t) + \arctan\left(\frac{k \cdot e_y(t)}{v(t) + \epsilon}\right)$$

```
                           Làn đường mong muốn (Path)
         --------------------------------------------------
                             / | 
                            /  | e_y (Sai số dịch chuyển ngang)
                           /   |
               \theta_e   /    v
               (Góc lệch)/___ [Xe EGO] ===> Vận tốc v(t)
                        /
```

*Ứng dụng trên xe VinFast:* Tín hiệu góc lái $\delta$ được gửi qua mạng CAN-FD tốc độ cao tới hộp trợ lực lái điện (EPS). Hệ thống kiểm soát mượt mà cả trên cung đường thẳng lẫn khúc cua có bán kính cong lớn trên đường cao tốc.

---

## CHƯƠNG 4: HỆ THỐNG GIÁM SÁT KHOANG LÁI (DMS / OMS) & TRẢI NGHIỆM NGƯỜI DÙNG HMI

### 4.1. Hệ thống Giám sát Người lái (DMS) & Nhận diện Buồn ngủ / Mất tập trung
*   **Cơ chế truyền thống (Tesla, Toyota):** Sử dụng cảm biến đo mô-men xoắn trên vô lăng (Torque Sensor). Lái xe có thể "đánh lừa" bằng cách gắn vật nặng vào vành vô lăng.
*   **Giải pháp Hiện đại của VinAI trên xe VinFast:**
    *   Tích hợp Camera hồng ngoại (IR Camera) chuyên dụng đặt sau vô lăng.
    *   Nhận diện 68 điểm mốc khuôn mặt (Facial Landmarks) 3D theo thời gian thực.
    *   Chỉ số **PERCLOS (Percentage of Eye Closure):** Phát hiện chớp mắt chậm, nhắm mắt $> 1.5\text{s}$ để kích hoạt chuông cảnh báo buồn ngủ ngay lập tức.
    *   **Gaze Tracking & Head Pose:** Cảnh báo khi người lái cúi nhìn điện thoại quá 3 giây. Hoạt động chính xác ngay cả khi lái xe đeo kính râm chống tia UV hoặc khẩu trang.

### 4.2. Dấu ấn Đột phá từ VinAI: MirrorSense & JellyView
*   **VinAI MirrorSense:** Đột phá công nghệ tự động chỉnh gương chiếu hậu bằng AI. Hệ thống tính toán véc-tơ không gian từ mắt người lái đến 2 gương ngoài, tự động ra lệnh mô-tơ điện căn chỉnh góc nhìn hoàn hảo chỉ sau vài giây người lái bước vào xe.
*   **VinAI Cabin Monitoring (OMS):** Cảnh báo hành khách không thắt dây an toàn, nhận diện phát hiện trẻ em bị bỏ quên trong xe (Child Presence Detection - CPD) – tính năng bắt buộc theo thang điểm đánh giá mới của Euro NCAP.

---

## CHƯƠNG 5: HẠ TẦNG TÍNH TOÁN & MẠNG TRUYỀN THÔNG TRÊN XE (E/E ARCHITECTURE)

```
[Các Cảm biến: Camera, Radar, LiDAR]
                 |
                 v (GMSL2 / FPD-Link III / Automotive Ethernet)
+-------------------------------------------------------------+
| ADAS DOMAIN CONTROLLER                                      |
|                                                             |
|  +--------------------+         +------------------------+  |
|  | Microcontroller    |  IPC    | System-on-Chip (SoC)   |  |
|  | (Safety Core)      |<=======>| (Compute Core)         |  |
|  | Infineon Aurix TC3xx|         | Mobileye EyeQ / Orin   |  |
|  | - AUTOSAR Classic  |         | - Linux RT / QNX       |  |
|  | - ASIL-D Logic     |         | - Deep Learning Engine |  |
|  +--------------------+         +------------------------+  |
+-------------------------------------------------------------+
                 |
                 v (CAN-FD / SOME/IP Ethernet)
[Bộ chấp hành: Hệ thống Phanh (ESP/iBooster), Động cơ (VCU), Trợ lực lái (EPS)]
```

### 5.1. Chuyển dịch Kiến trúc sang Domain Controller
*   Các dòng xe điện VinFast thế hệ mới (VF 8, VF 9) ứng dụng kiến trúc **Tập trung hóa theo Miền (Domain Controller)** kết hợp máy tính trung tâm.
*   Bộ điều khiển ADAS phân tách rõ ràng:
    *   *Chip SoC hiệu năng cao (Mobileye EyeQ / Nvidia):* Chạy hệ điều hành Linux RT hoặc QNX, xử lý các mô hình học sâu (Deep Learning) nhận diện hình ảnh và dung hợp cảm biến.
    *   *Chip Safety Microcontroller (Infineon AURIX / Renesas):* Chạy hệ điều hành AUTOSAR Classic chuẩn ASIL-D, thực thi logic an toàn và gửi lệnh điều khiển xuống cơ cấu chấp hành.

### 5.2. Mạng Truyền thông: CAN-FD vs. Automotive Ethernet
*   **CAN-FD (Flexible Data-Rate):** Băng thông $2 - 5\text{ Mbps}$, tải trọng dữ liệu tối đa 64 bytes, đảm bảo tính thời gian thực xác định (Deterministic) cho các lệnh phanh và đánh lái.
*   **Automotive Ethernet (100BASE-T1 / 1000BASE-T1):** Băng thông $100\text{ Mbps} - 1\text{ Gbps}$, ứng dụng giao thức **SOME/IP** và **DDS** để luân chuyển dữ liệu cụm đối tượng (Object List) và hình ảnh độ phân giải cao giữa các ECU.

---

## CHƯƠNG 6: QUY TRÌNH KIỂM THỬ (V-MODEL), HIỆU CHUẨN (CALIBRATION) & TIÊU CHUẨN NCAP

### 6.1. Chu trình Kiểm thử X-in-the-Loop (MIL, SIL, HIL, VIL)
Mọi chức năng ADAS của VinFast đều trải qua chu trình kiểm thử nghiêm ngặt theo **Mô hình Chữ V (V-Model)**:

```
Yêu cầu Kỹ thuật (Requirements)                  Kiểm thử Xe Thật (Vehicle Testing / Proving Ground)
      \                                                             /
   Kiến trúc Hệ thống (System Architecture)              Kiểm thử HIL (Hardware-in-the-Loop)
         \                                                   /
      Thiết kế Module (Module Design)             Kiểm thử SIL (Software-in-the-Loop)
            \                                       /
         Lập trình (Implementation) ====== Kiểm thử MIL (Model-in-the-Loop)
```

*   **MIL (Model-in-the-Loop):** Kiểm tra thuật toán trên MATLAB/Simulink.
*   **SIL (Software-in-the-Loop):** Chạy mã nguồn C++ trên môi trường giả lập mô phỏng đô thị ảo (**CARLA Simulator, IPG CarMaker**).
*   **HIL (Hardware-in-the-Loop):** Đấu nối trực tiếp hộp ECU ADAS thật vào tủ giả lập tín hiệu điện tử (dSPACE / Vector HIL) để kiểm tra phản hồi thời gian thực.
*   **VIL & Proving Ground:** Thử nghiệm va chạm thực tế trên sa hình chuyên dụng bằng robot lái và hình nộm xe mềm (Euro NCAP Soft Crash Target).

### 6.2. Quy trình Cân chỉnh Cảm biến (Sensor Calibration) tại Nhà máy
*   **Hiệu chuẩn Tĩnh (End-of-Line Static Calibration):** Thực hiện tại cuối dây chuyền sản xuất ở Hải Phòng, sử dụng bảng định chuẩn quang học (Checkerboard Targets) kết hợp cân chỉnh tia laser để thiết lập ma trận tham số ngoại (Extrinsic Matrix: Roll, Pitch, Yaw, X, Y, Z).
*   **Hiệu chuẩn Động (Dynamic Calibration):** Xe tự động học và bù trừ góc lệch của cảm biến trong quá trình lăn bánh thực tế trên đường thông qua các mốc định vị tĩnh (vạch sơn, cột mốc, biển báo).

---

## CHƯƠNG 7: LỘ TRÌNH THỰC HÀNH & DỰ ÁN MẪU (CAPSTONE PROJECTS)

Dành cho kỹ sư phát triển ADAS:
1.  **Project 1 - 2D/3D Lane Detection & Tracking:** Sử dụng OpenCV kết hợp mạng nơ-ron (SCNN / Ultra-Fast-Lane-Detection) để trích xuất làn đường và fit đa thức bậc 3.
2.  **Project 2 - Extended Kalman Filter Sensor Fusion:** Viết chương trình C++ dung hợp dữ liệu vị trí và vận tốc từ Camera và Radar mmWave theo thời gian thực.
3.  **Project 3 - CARLA Autonomous Vehicle Controller:** Xây dựng module điều khiển bám làn và giữ khoảng cách kết hợp thuật toán **Stanley Controller + MPC** trên trình giả lập CARLA.
4.  **Project 4 - Phân tích Mã nguồn Mở Comma.ai Openpilot:** Khảo sát kiến trúc điều khiển dọc/ngang và máy trạng thái an toàn trong kho lưu trữ mã nguồn mở openpilot.

---

## TRÍCH DẪN TÀI LIỆU THAM KHẢO & TUYÊN BỐ BẢN QUYỀN SỞ HỮU TRÍ TUỆ
*(References, Citations & Intellectual Property Attribution)*

Tài liệu giáo trình này được tổng hợp, biên soạn và chuẩn hóa dựa trên các nguồn tài liệu học thuật kinh điển, tiêu chuẩn kỹ thuật quốc tế và tài liệu công nghệ công khai từ các tập đoàn công nghiệp hàng đầu thế giới:

### 1. Sách & Giáo trình Học thuật Kinh điển (Academic Textbooks)
*   **Hermann Winner, Stephan Hakuli, Felix Lotz, Christina Singer (Eds.):** *"Handbook of Driver Assistance Systems"*, Springer Reference, ISBN: 978-3-319-12351-6. (Bộ giáo trình tiêu chuẩn thế giới về kiến trúc, cảm biến và thuật toán ADAS).
*   **A. Galip Ulsoy, Huei Peng, Melih Çakmakcı:** *"Automotive Control Systems"*, Cambridge University Press, ISBN: 978-1-107-01014-7. (Chuyên sâu về lý thuyết điều khiển tự động dọc và ngang trên ô tô).
*   **Rajamani, Rajesh:** *"Vehicle Dynamics and Control"*, Mechanical Engineering Series, Springer US, ISBN: 978-1-4614-1432-2. (Cơ sở toán học cho mô hình động học xe đạp và bộ điều khiển Stanley/LQR).

### 2. Các Khóa đào tạo Chuyên ngành Quốc tế (Specialized Programs)
*   **University of Toronto (Coursera):** *"Self-Driving Cars Specialization"* - Giáo trình hướng dẫn bởi GS. Steven Waslander và GS. Jonathan Kelly.
*   **Udacity:** *"Self-Driving Car Engineer Nanodegree Program"* - Học liệu chuyên sâu về Computer Vision, Sensor Fusion (EKF/UKF) và Motion Planning.

### 3. Tiêu chuẩn Quốc tế & Quy chuẩn Đánh giá An toàn (Global Standards)
*   **SAE International - SAE J3016_202104:** *"Taxonomy and Definitions for Terms Related to Driving Automation Systems for On-Road Motor Vehicles"*.
*   **International Organization for Standardization (ISO):**
    *   *ISO 26262:2018:* Road vehicles — Functional safety (Parts 1 - 12, ASIL A/B/C/D).
    *   *ISO 21448:2022:* Road vehicles — Safety of the intended functionality (SOTIF).
    *   *ISO 14229 / ISO 11898:* Road vehicles — Unified diagnostic services (UDS) & Controller area network (CAN).
*   **Chương trình Đánh giá Xe Mới (NCAP):**
    *   *Euro NCAP Assessment Protocol:* Adult Occupant Protection, Vulnerable Road User (VRU) Protection, Safety Assist (AEB Car-to-Car, Lane Support Systems).
    *   *ASEAN NCAP Assessment Protocol:* Quy chuẩn an toàn và thử nghiệm va chạm khu vực Đông Nam Á.

### 4. Tài liệu Kỹ thuật từ Nhà Cung cấp Cấp 1 & Đối tác Công nghệ (Tier-1 Suppliers)
*   **ZF Friedrichshafen AG:** Tài liệu công nghệ giải pháp *ZF ProAI Central Computer*, *ZF Co-Pilot L2+ Suite*, và hệ thống Radar mmWave thế giới.
*   **Mobileye (Intel Company):** Kiến trúc chip xử lý thị giác máy tính *Mobileye EyeQ4 / EyeQ5 / EyeQ6 System-on-Chip* và công nghệ bản đồ số REM (Road Experience Management).
*   **Bosch Mobility Solutions & Continental Automotive Group:** Sách trắng kỹ thuật về hệ thống phanh tích hợp iBooster/ESP và 4D Imaging Radar.

### 5. Mã nguồn Mở & Nền tảng Giả lập Nghiên cứu (Open Source & Simulators)
*   **Comma.ai (openpilot):** Hệ thống trợ lái mã nguồn mở theo giấy phép MIT License (GitHub: [commaai/openpilot](https://github.com/commaai/openpilot)).
*   **CARLA Simulator:** Trình mô phỏng xe tự hành mã nguồn mở phát triển bởi Intel Labs, Toyota Research Institute và Computer Vision Center (CVC) Barcelona.

---

### Tuyên Bố Quyền Sở Hữu Trí Tuệ & Bản Quyền Thương Mại (Copyright & Trademark Notice)
*   **VinFast Auto Ltd. & Tập đoàn Vingroup:** Các thông tin phân tích liên quan đến các dòng xe điện VinFast (VF e34, VF 5, VF 6, VF 7, VF 8, VF 9) cùng các gói tính năng ADAS trên xe thuộc quyền sở hữu nhãn hiệu và tài sản trí tuệ của VinFast Auto Ltd.
*   **Công ty Cổ phần Nghiên cứu và Ứng dụng Trí tuệ Nhân tạo VinAI (VinAI):** Các công nghệ AI buồng lái và thị giác máy tính bao gồm: *VinAI MirrorSense* (chỉnh gương tự động), *JellyView / Transparent Hood* (quan sát xuyên gầm xe 360 độ), *Driver Monitoring System (DMS)* và *Occupant Monitoring System (OMS)* là các tài sản trí tuệ độc quyền và sáng chế thuộc sở hữu của VinAI.
*   **Các thương hiệu quốc tế:** *Tesla, Autopilot, FSD* là nhãn hiệu đã đăng ký của Tesla, Inc. *Drive Pilot, Distronic* là nhãn hiệu thuộc sở hữu của Mercedes-Benz Group AG. *Mobileye* là nhãn hiệu của Mobileye Global Inc. *ZF* là nhãn hiệu của ZF Friedrichshafen AG. Mọi sự so sánh trong giáo trình này đều nhằm mục đích phân tích học thuật, nghiên cứu khoa học và đối chuẩn kỹ thuật (Benchmarking).
*   **Tuyên bố Miễn trừ Trách nhiệm Kỹ thuật (Disclaimer):** Giáo trình này được biên soạn cho mục đích đào tạo kiến thức, nghiên cứu phát triển và trao đổi học thuật. Nội dung không tiết lộ bất kỳ mã nguồn đóng (proprietary source code) hoặc tài liệu bí mật thương mại được bảo vệ theo thỏa thuận bảo mật (NDA) của các tổ chức liên quan.
