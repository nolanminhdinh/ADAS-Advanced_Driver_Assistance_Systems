# CHƯƠNG 1: TỔNG QUAN KIẾN TRÚC HỆ THỐNG ADAS & TIÊU CHUẨN CÔNG NGHIỆP

---

## 1. PHÂN CẤP TỰ HÀNH THEO TIÊU CHUẨN SAE J3016

Tiêu chuẩn quốc tế **SAE J3016 (Taxonomy and Definitions for Terms Related to Driving Automation Systems for On-Road Motor Vehicles)** là kim chỉ nam pháp lý và kỹ thuật định hình toàn bộ ngành công nghiệp ô tô toàn cầu.

### 1.1. Các Khái niệm Nền tảng
1. **DDT (Dynamic Driving Task - Nhiệm vụ Lái xe Động lực học):** Bao gồm tất cả các chức năng vận hành thời gian thực (Real-time operational functions) và chiến thuật (Tactical functions) cần thiết để vận hành phương tiện:
   - *Điều khiển phương tiện:* Đánh lái (Lateral control), tăng/giảm tốc độ (Longitudinal control).
   - *Giám sát môi trường (OEDR - Object and Event Detection and Response):* Nhận biết chướng ngại vật, làn đường, biển báo, người đi bộ và phản ứng lại.
   - *Lập kế hoạch cơ động:* Chuyển làn, rẽ, vượt xe, tránh va chạm.
2. **ODD (Operational Design Domain - Miền thiết kế Vận hành):** Các điều kiện môi trường, địa lý, thời tiết, hạ tầng và dải tốc độ mà một hệ thống tự hành cụ thể được thiết kế để hoạt động an toàn.
   - *Ví dụ:* Cao tốc có dải phân cách cứng, thời tiết khô ráo, tốc độ từ $0 - 120\text{ km/h}$, vạch kẻ đường rõ nét.
3. **DDT Fallback (Dự phòng Nhiệm vụ Lái xe):** Hành động chuyển đổi phương tiện về trạng thái rủi ro tối thiểu (**MRC - Minimal Risk Condition**) khi xảy ra sự cố kỹ thuật hoặc khi phương tiện đi ra khỏi ODD.

---

### 1.2. Chi tiết 6 Cấp độ Tự hành SAE J3016

```
+-------+-------------------------+----------------------+----------------------+----------------------+
| Level | Tên gọi                 | Thực thi Lái (DDT)   | Giám sát OEDR        | Dự phòng Fallback    |
+-------+-------------------------+----------------------+----------------------+----------------------+
| L0    | No Driving Automation   | Người lái            | Người lái            | Người lái            |
| L1    | Driver Assistance       | Người + Xe (Dọc/Ngang)| Người lái           | Người lái            |
| L2    | Partial Automation      | Xe (Cả Dọc & Ngang)  | Người lái (Hands-on) | Người lái            |
+-------+-------------------------+----------------------+----------------------+----------------------+
| L3    | Conditional Automation  | Xe                   | Xe                   | Người lái (theo TOR) |
| L4    | High Automation         | Xe                   | Xe                   | Xe (Tự về MRC)       |
| L5    | Full Automation         | Xe (Mọi ODD)         | Xe                   | Xe                   |
+-------+-------------------------+----------------------+----------------------+----------------------+
```

* **Level 0 (Không tự hành):** Hệ thống chỉ đưa ra cảnh báo tức thời hoặc can thiệp khẩn cấp thời gian ngắn (Ví dụ: Cảnh báo điểm mù BSD, Cảnh báo lệch làn LDW, Phanh khẩn cấp tự động AEB).
* **Level 1 (Hỗ trợ người lái):** Hệ thống điều khiển **hoặc** trục dọc (Adaptive Cruise Control - ACC) **hoặc** trục ngang (Lane Keeping Assist - LKA).
* **Level 2 (Tự hành một phần - Trọng tâm hiện nay của VinFast VF 8, VF 9, VF 7):**
  - Hệ thống kiểm soát **đồng thời cả trục dọc và trục ngang** (ACC kết hợp Lane Centering Assist - LCA).
  - Trách nhiệm giám sát an toàn thuộc về người lái (*Hands-on, Eyes-on*). Người lái phải sẵn sàng can thiệp bất kỳ lúc nào nếu hệ thống gặp lỗi hoặc gặp tình huống ngoài khả năng.
* **Level 2+ (Enhanced L2 / L2 Plus):**
  - Khái niệm công nghiệp do các hãng xe và Tier-1 (Mobileye, Nvidia, ZF) đưa ra.
  - Cho phép xe tự chuyển làn khi bật xi-nhan (Auto Lane Change), định hướng theo bản đồ dẫn đường (Navigate on Autopilot), hoặc lái xe rảnh tay trên cao tốc (*Hands-off, Eyes-on*) dưới sự giám sát liên tục của camera buồng lái (DMS).
* **Level 3 (Tự hành có điều kiện):**
  - Trong ODD quy định (ví dụ tắc đường trên cao tốc dưới $60\text{ km/h}$), xe chịu trách nhiệm pháp lý hoàn toàn. Lái xe được phép rảnh tay và rảnh mắt (*Hands-off, Eyes-off* - được phép đọc báo, xem màn hình trung tâm).
  - Khi phát hiện sắp vượt quá ODD, xe sẽ phát yêu cầu tiếp quản lái (**TOR - Takeover Request**) trước $5 - 10$ giây. Nếu tài xế không phản hồi, xe sẽ tự động bật xi-nhan khẩn cấp và tấp vào lề dừng an toàn (MRC).

---

## 2. KIẾN TRÚC TỔNG THỂ HỆ THỐNG ADAS (END-TO-END STACK)

Một hệ thống ADAS tiêu chuẩn hoạt động theo chu trình khép kín: **Sense $\rightarrow$ Plan $\rightarrow$ Act**.

```
                           HỆ THỐNG ADAS ĐIỂN HÌNH
                           
[ 1. CẢM NHẬN - SENSING ]
  + Camera trước (Mono/Stereo)     ---> Phân loại làn đường, nhận diện biển báo, xe, người
  + 5x mmWave Radar (Trước & Góc)  ---> Đo cự ly, vận tốc Doppler tương đối, xuyên sương mù
  + 12x Ultrasonic Sensors (USS)   ---> Đo cự ly gần (< 5m), phục vụ đỗ xe tự động
  + GNSS / IMU                     ---> Đo tọa độ tuyệt đối, gia tốc góc và vận tốc thân xe
                |
                v
[ 2. DUNG HỢP & ĐỊNH VỊ - FUSION & LOCALIZATION ]
  + Extended Kalman Filter (EKF)   ---> Kết hợp Camera + Radar tạo ra Danh sách Vật thể (Object List)
  + Dead Reckoning & Map Matching  ---> Xác định vị trí xe trên bản đồ độ nét cao (HD Map)
                |
                v
[ 3. LẬP KẾ HOẠCH & RA QUYẾT ĐỊNH - PLANNING & DECISION ]
  + State Machine (FSM)            ---> Quản lý trạng thái: Cruise, Following, Overtaking, Stop&Go
  + Trajectory Generator           ---> Sinh quỹ đạo mượt mà không vượt ngưỡng gia tốc ly tâm
                |
                v
[ 4. ĐIỀU KHIỂN CHUYỂN ĐỘNG - VEHICLE MOTION CONTROL ]
  + Longitudinal Control (PID/MPC) ---> Ra lệnh Mô-men phanh (ESP) / Gia tốc động cơ (VCU)
  + Lateral Control (Stanley/MPC)  ---> Ra lệnh Góc lái mong muốn (EPS)
```

---

## 3. ĐỐI CHUẨN CÔNG NGHỆ: TESLA VS. MERCEDES-BENZ VS. VINFAST

| Hạng mục Phân tích | Tesla (FSD Beta / HW4) | Mercedes-Benz (Drive Pilot) | VinFast (VF 8 / VF 9 ADAS L2+) |
| :--- | :--- | :--- | :--- |
| **Phân loại SAE** | Level 2 (Bản quyền lái xe chịu) | **Level 3 (Thương mại đầu tiên được cấp phép)** | **Level 2 / Level 2+** |
| **Cấu hình Cảm biến** | **Pure Vision:** Loại bỏ Radar và USS. Dùng 8 Camera độ phân giải 5MP (HW4). | **Multi-Sensor Redundancy:** 1 LiDAR (Valeo SCALA), 5 Radar, Camera Stereo, Mic âm thanh xe cứu thương, cảm biến độ ẩm hốc bánh xe. | **Hybrid Tier-1 Standard:** 1 Camera trước góc rộng + 5 Radar mmWave ZF + 12 USS + 4 Camera 360 Surround View (VinAI). |
| **Hệ thống Xử lý** | FSD Chip kép do Tesla tự thiết kế (Dual NPU, 144 TOPS mỗi chip, chạy song song đối chiếu). | Dual Nvidia Drive Orin + Vi điều khiển Infineon AURIX ASIL-D. | **ZF ProAI Central Computer** / Nền tảng Mobileye EyeQ tích hợp vi xử lý an toàn AUTOSAR. |
| **Phần mềm Nhận thức** | End-to-End Deep Learning, Occupancy Network (dựng không gian 3D voxel từ hình ảnh 2D). | Thuật toán cổ điển kết hợp Deep Learning; bản đồ HD Map centimet từ HERE. | Tích hợp thuật toán đối tác Tier-1 (ZF, Mobileye) kết hợp các mô hình Computer Vision chuyên biệt từ **VinAI**. |
| **Đánh giá Thực tế** | Khả năng xử lý linh hoạt ở nhiều loại đường nhưng hay bị giật (Phantom Braking) và khó kiểm chứng an toàn hình thức. | Cực kỳ an toàn, có bảo hiểm của hãng khi kích hoạt L3, nhưng ODD vô cùng hạn hẹp. | Đạt chuẩn an toàn 5 sao ASEAN NCAP & Euro NCAP, chi phí sản xuất tối ưu, vận hành ổn định trong dải tốc độ rộng. |

---

## 4. AN TOÀN CHỨC NĂNG ISO 26262 & TIÊU CHUẨN SOTIF (ISO 21448)

Trong kỹ thuật ô tô, một tính năng chỉ được phép đưa ra thị trường khi chứng minh được nó an toàn theo phương pháp toán học và quy trình kiểm thử chuẩn hóa.

### 4.1. Tiêu chuẩn An toàn Chức năng ISO 26262
ISO 26262 tập trung xử lý các mối nguy hiểm bắt nguồn từ **hỏng hóc hệ thống điện/điện tử**:
1. **Quy trình HARA (Hazard Analysis and Risk Assessment):**
   Mỗi rủi ro được định lượng bằng 3 chỉ số:
   - **Độ nghiêm trọng (Severity - S):** Từ $S0$ (không thương tích) đến $S3$ (tử vong hoặc thương tật vĩnh viễn).
   - **Tần suất phơi nhiễm (Exposure - E):** Từ $E0$ (vô cùng hiếm) đến $E4$ (rất phổ biến trong điều kiện lái xe hàng ngày).
   - **Khả năng kiểm soát (Controllability - C):** Từ $C0$ (dễ dàng kiểm soát) đến $C3$ (hầu như không thể kiểm soát bởi người lái trung bình).

$$\text{ASIL} = f(S, E, C) \in \{\text{QM}, \text{ASIL-A}, \text{ASIL-B}, \text{ASIL-C}, \text{ASIL-D}\}$$

```
+-----------+------------+-------------------------------------------+
| Severity  | Exposure   | Controllability                           |
|           |            | C1 (Dễ)       C2 (Vừa)       C3 (Khó)     |
+-----------+------------+-------------------------------------------+
| S3        | E4 (Cao)   | ASIL-B        ASIL-C         ASIL-D       |
| (Tử vong) | E3         | ASIL-A        ASIL-B         ASIL-C       |
|           | E2         | QM            ASIL-A         ASIL-B       |
+-----------+------------+-------------------------------------------+
```
*(QM: Quality Management - Quy trình quản lý chất lượng thông thường, không cần tiêu chuẩn an toàn đặc biệt).*

* **Ứng dụng trên xe VinFast:**
  - Chức năng Phanh khẩn cấp tự động (AEB) và Trợ lực lái điện (EPS) được phân loại là **ASIL-D**.
  - Nếu hệ thống tự ý đánh lái ngoặt ở tốc độ $120\text{ km/h}$ trên cao tốc Hà Nội - Hải Phòng ($S3, E4, C3$), nguy cơ tử vong là tối đa. Do đó, phần mềm điều khiển lái trên VinFast bắt buộc phải triển khai cơ chế kiểm tra chéo (Cross-check) độc lập giữa vi xử lý chính và chip vi điều khiển an toàn (Safety Watchdog).

---

### 4.2. Tiêu chuẩn SOTIF (ISO 21448 - Safety of the Intended Functionality)
Khác với ISO 26262 (nơi phần cứng hoặc code bị lỗi), **SOTIF xử lý tình huống hệ thống hoạt động hoàn toàn bình thường theo đúng thiết kế nhưng vẫn dẫn đến tai nạn do hạn chế của cảm biến hoặc thuật toán AI**.

```
                   MÔ HÌNH 4 VÙNG KHÔNG GIAN CỦA SOTIF
                   
            +-----------------------------------+-----------------------------------+
            |           ĐÃ BIẾT (KNOWN)         |        CHƯA BIẾT (UNKNOWN)        |
+-----------+-----------------------------------+-----------------------------------+
| AN TOÀN   |              VÙNG 1               |              VÙNG 4               |
| (SAFE)    | Các kịch bản lái xe bình thường   | Các tình huống an toàn chưa gặp   |
|           | hệ thống đã hiểu và xử lý tốt     | nhưng không gây rủi ro            |
+-----------+-----------------------------------+-----------------------------------+
| NGUY HIỂM |              VÙNG 2               |              VÙNG 3               |
| (UNSAFE)  | Kịch bản nguy hiểm đã biết        | **ĐÂY LÀ VÙNG NGUY HIỂM NHẤT**   |
|           | (Ví dụ: Chói lóa ngược nắng,      | Các tình huống cực đoan (Edge)    |
|           | vạch kẻ đường bị xóa mờ)          | chưa từng lường trước trong R&D   |
+-----------+-----------------------------------+-----------------------------------+
```

* **Mục tiêu của Kỹ sư SOTIF:** Thu hẹp tối đa **Vùng 3** bằng cách chuyển nó sang Vùng 2 (thông qua thu thập dữ liệu xe chạy thực tế), và thiết kế giải thuật giảm thiểu Vùng 2 chuyển thành Vùng 1.
* **Tình huống SOTIF thực tế tại Việt Nam đối với VinFast:**
  1. *Xe chở hàng cồng kềnh:* Xe máy chở thùng xốp cao 2 mét di chuyển phía trước. Mạng nơ-ron được huấn luyện tại Châu Âu chỉ biết phân loại ô tô, xe máy, người đi bộ $\rightarrow$ Phân loại sai thành vật tĩnh lơ lửng $\rightarrow$ Gây lỗi nhận thức.
  2. *Đường đọng nước phản chiếu ánh đèn cao áp:* Radar bị phản xạ đa đường (Multipath reflection), Camera bị lóa sáng $\rightarrow$ Hệ thống phải nhận diện mức độ suy giảm tự tin (Confidence score) để chủ động cảnh báo người lái tiếp quản an toàn.

---

## 5. TỔNG KẾT BÀI HỌC
Hiểu rõ kiến trúc ADAS và các tiêu chuẩn ISO 26262 / ISO 21448 giúp kỹ sư VinFast không chỉ tập trung vào việc mô hình AI đạt bao nhiêu % mAP trên tập dữ liệu kiểm thử, mà quan trọng hơn là: **Làm thế nào để hệ thống luôn có phương án dự phòng an toàn (Fail-safe / Fail-operational) khi bước ra thế giới thực.**
