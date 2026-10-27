# CHƯƠNG 2: TẦNG CẢM BIẾN (SENSING) & DUNG HỢP DỮ LIỆU (SENSOR FUSION)

---

## 1. CẢM BIẾN CAMERA & THỊ GIÁC MÁY TÍNH TRONG XE HƠI

Camera là cảm biến duy nhất cung cấp dữ liệu hình ảnh với mật độ thông tin phong phú (màu sắc, cấu trúc hình khối, ngữ nghĩa ngữ cảnh).

### 1.1. Mô hình Toán học Pin-hole & Khử Biến dạng Ống kính
Mỗi điểm trong không gian thực 3D $\mathbf{P}_w = [X_w, Y_w, Z_w]^T$ được ánh xạ lên mặt phẳng cảm biến 2D $[u, v]^T$ qua ma trận tham số nội (Intrinsic Matrix $\mathbf{K}$) và ma trận ngoại (Extrinsic Matrix $[\mathbf{R} | \mathbf{t}]$):

$$
s \begin{bmatrix} u \\ v \\ 1 \end{bmatrix} = \mathbf{K} \begin{bmatrix} \mathbf{R} & \mathbf{t} \end{bmatrix} \begin{bmatrix} X_w \\ Y_w \\ Z_w \\ 1 \end{bmatrix} = \begin{bmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} r_{11} & r_{12} & r_{13} & t_x \\ r_{21} & r_{22} & r_{23} & t_y \\ r_{31} & r_{32} & r_{33} & t_z \end{bmatrix} \begin{bmatrix} X_w \\ Y_w \\ Z_w \\ 1 \end{bmatrix}
$$

##### Bảng Giải thích Chi tiết Các Đại lượng trong Mô hình Camera Pinhole:

| Ký hiệu | Tên gọi Kỹ thuật | Đơn vị | Ý nghĩa & Vai trò trong Nhận thức Camera |
| :--- | :--- | :--- | :--- |
| $[u, v]^T$ | Tọa độ điểm ảnh (Pixel coordinates) | $\text{pixel}$ | Tọa độ vị trí của điểm chiếu trên ảnh 2D (gốc tại góc trên bên trái ảnh). |
| $s$ | Hệ số tỷ lệ tỉ xích (Scale factor) | - | Hệ số tỉ lệ độ sâu của điểm trong hệ quy chiếu camera ($s = Z_c$). |
| $\mathbf{K}$ | Ma trận tham số nội (Intrinsic Matrix) | - | Ma trận $3 \times 3$ chứa đặc tính quang học vật lý bên trong cụm thấu kính camera. |
| $f_x, f_y$ | Tiêu cự theo trục x và y (Focal lengths) | $\text{pixel}$ | Độ dài tiêu cự quy đổi ra kích thước pixel: $f_x = f \cdot m_x, f_y = f \cdot m_y$. |
| $c_x, c_y$ | Điểm chính quang học (Principal point) | $\text{pixel}$ | Tọa độ giao điểm giữa trục quang học của thấu kính và mặt phẳng cảm biến CMOS. |
| $\mathbf{R}$ | Ma trận xoay ngoại (Rotation Matrix) | - | Ma trận $3 \times 3$ xác định góc định hướng của camera so với hệ tọa độ thế giới/thân xe. |
| $\mathbf{t} = [t_x, t_y, t_z]^T$ | Vector tịnh tiến ngoại (Translation Vector) | $\text{m}$ (mét) | Vị trí đặt camera trong không gian 3D thế giới thực. |
| $[X_w, Y_w, Z_w]^T$ | Tọa độ 3D thế giới (World coordinates) | $\text{m}$ (mét) | Tọa độ thực tế của chướng ngại vật/vạch kẻ đường trong không gian 3D. |

---

* **Hiện tượng biến dạng quang học (Distortion):** 
  Do ống kính góc rộng (đặc biệt là 4 camera mắt cá 360 của VinFast), ảnh bị méo xuyên tâm (Radial distortion) và méo tiếp tuyến (Tangential distortion):

$$
x_{corrected} = x(1 + k_1 r^2 + k_2 r^4 + k_3 r^6) + [2p_1 xy + p_2(r^2 + 2x^2)]
$$

$$
y_{corrected} = y(1 + k_1 r^2 + k_2 r^4 + k_3 r^6) + [p_1(r^2 + 2y^2) + 2p_2 xy]
$$

##### Bảng Giải thích Chi tiết Các Tham số Khử Méo Ống Kính:

| Ký hiệu | Tên gọi Kỹ thuật | Đơn vị | Ý nghĩa Hình học Khử Méo Ống Kính |
| :--- | :--- | :--- | :--- |
| $x, y$ | Tọa độ chuẩn hóa trước khử méo | - | Tọa độ điểm trên mặt phẳng ảnh chuẩn hóa: $x = X_c / Z_c, y = Y_c / Z_c$. |
| $r$ | Bán kính quang học | - | Khoảng cách từ điểm đang xét tới tâm quang học: $r = \sqrt{x^2 + y^2}$. |
| $k_1, k_2, k_3$ | Hệ số méo xuyên tâm (Radial distortion) | - | Bù trừ hiện tượng cong hình cánh cung do thấu kính cong (méo thùng - barrel distortion). |
| $p_1, p_2$ | Hệ số méo tiếp tuyến (Tangential distortion) | - | Bù trừ sai số khi thấu kính không được lắp song song tuyệt đối với bề mặt cảm biến CMOS. |
| $x_{corrected}, y_{corrected}$ | Tọa độ chuẩn hóa sau khử méo | - | Tọa độ lý tưởng dùng để tái tạo không gian 3D chính xác không còn bị cong vênh vạch kẻ. |

---

### 1.2. Công nghệ Cảm biến Hình ảnh Ô tô (Automotive Grade CMOS)
1. **Dải tương phản động cao (HDR - High Dynamic Range $> 120\text{ dB}$):**
   - Xe hơi phải xử lý tình huống đi từ hầm tối ra ánh nắng chói chang trong tích tắc mà không bị cháy sáng hay tối đen ảnh.
2. **Global Shutter vs. Rolling Shutter:**
   - Hầu hết camera ADAS dùng **Global Shutter** hoặc cảm biến Rolling Shutter tốc độ cao có mạch bù lệch chuyển động để chống hiện tượng méo ảnh khi xe chạy tốc độ cao ($> 120\text{ km/h}$).
3. **Bộ lọc LED Flicker Mitigation (LFM):**
   - Đèn pha LED và biển báo giao thông LED nhấp nháy ở tần số $100\text{ Hz} - 1\text{ kHz}$. Camera chuẩn automotive phải có cơ chế bù tần số để không nhận diện sai biển báo nhấp nháy thành biển báo tắt.

---

### 1.3. Đột phá Công nghệ VinAI trên VinFast: JellyView (Transparent Hood)
* **Nguyên lý hoạt động:**
  1. Bốn camera Fisheye lắp tại đầu xe, đuôi xe và 2 gương chiếu hậu thu thập hình ảnh liên tục ở tốc độ 30 FPS.
  2. Dữ liệu Odometry từ cảm biến tốc độ bánh xe (Wheel Speed Sensor) và góc lái ghi nhận quãng đường xe vừa lăn qua.
  3. Thuật toán tái tạo bề mặt 3D kết hợp phép chiếu Texture Mapping động: Khi xe tiến lên, vùng mặt đất vừa bị nắp ca-pô che khuất sẽ được tái hiện lại từ khung hình thu được trước đó vài phần mười giây.
  4. Kết quả là trên màn hình 15.6 inch của VF 8/VF 9, người lái nhìn thấy một mô hình xe trong suốt (nhìn thấy rõ đá hộc, rãnh sâu, vỉa hè ngay dưới 4 bánh xe).

---

## 2. RADAR SÓNG MILIMET (MMWAVE RADAR - 77GHZ ĐẾN 79GHZ)

Radar (Radio Detection and Ranging) phát các xung sóng điện từ tần số cực cao và đo tín hiệu phản xạ trở lại.

```
       NGUYÊN LÝ PHÁT TÍN HIỆU FMCW (FREQUENCY MODULATED CONTINUOUS WAVE)
       
   Tần số (f)
       ^
f_max  |       /|      /|      /|          B: Băng thông quét (Bandwidth)
       |      / |     / |     / |          T_c: Thời gian quét xung (Chirp time)
       |     /  |    /  |    /  |
f_min  |    /   |   /   |   /   |
       +---+----+--+----+--+----+---> Thời gian (t)
           |<--T_c->|
```

### 2.1. Đo Khoảng cách (Range) & Phân giải Khoảng cách ($\Delta R$)

Khoảng cách đến mục tiêu tỉ lệ thuận với tần số phách (Beat Frequency $f_b$) thu được sau khi trộn tín hiệu phát và thu:

$$
d = \frac{c \cdot T_c \cdot f_b}{2 B}
$$

Độ phân giải cự ly tối thiểu (khoảng cách cự ly gần nhất để Radar tách bạch 2 mục tiêu cạnh nhau):

$$
\Delta R = \frac{c}{2B}
$$

*Ví dụ:* Với Radar băng thông rộng $B = 4\text{ GHz}$ (dải tần ô tô $77 - 81\text{ GHz}$):

$$
\Delta R = \frac{3 \times 10^8}{2 \times 4 \times 10^9} = 0.0375\text{ m} = 3.75\text{ cm}
$$

##### Bảng Giải thích Chi tiết Các Đại lượng trong Đo Khoảng cách FMCW Radar:

| Ký hiệu | Tên gọi Kỹ thuật | Đơn vị | Ý nghĩa & Giá trị Tiêu chuẩn trên Xe |
| :--- | :--- | :--- | :--- |
| $d$ | Khoảng cách tới mục tiêu (Range) | $\text{m}$ (mét) | Cự ly đo dọc trục từ cản trước xe tới chướng ngại vật phía trước. |
| $c$ | Vận tốc sóng điện từ (Speed of light) | $\text{m/s}$ | Tốc độ ánh sáng trong không khí ($c \approx 3 \times 10^8\text{ m/s}$). |
| $T_c$ | Chu kỳ quét xung Chirp (Chirp duration) | $\text{s}$ (hoặc $\mu\text{s}$) | Khoảng thời gian để tần số quét từ $f_{min}$ lên $f_{max}$ (thường $20 - 60\mu\text{s}$). |
| $f_b$ | Tần số phách (Beat Frequency) | $\text{Hz}$ (hoặc $\text{kHz}$) | Tần số chênh lệch giữa sóng phát đi và sóng dội về tại cùng một thời điểm. |
| $B$ | Băng thông quét tần số (Chirp Bandwidth) | $\text{Hz}$ | Dải tần số biến thiên: $B = f_{max} - f_{min}$ (dải mmWave ô tô từ $1\text{ GHz} - 4\text{ GHz}$). |
| $\Delta R$ | Độ phân giải khoảng cách (Range resolution) | $\text{m}$ (mét) | Khả năng phân biệt hai chướng ngại vật nằm cùng một góc phương vị. |

---

### 2.2. Đo Vận tốc Tương đối qua Hiệu ứng Doppler

Vận tốc tương đối $v_{rel}$ làm thay đổi pha của sóng phản xạ giữa các xung chirp liên tiếp:

$$
v_{rel} = \frac{\lambda \cdot \Delta \phi}{4\pi \cdot T_c}
$$

##### Bảng Giải thích Chi tiết Các Đại lượng trong Phép đo Vận tốc Doppler:

| Ký hiệu | Tên gọi Kỹ thuật | Đơn vị | Ý nghĩa & Vai trò Kỹ thuật |
| :--- | :--- | :--- | :--- |
| $v_{rel}$ | Vận tốc tương đối (Relative velocity) | $\text{m/s}$ | Vận tốc tiếp cận tức thời giữa xe chủ và xe phía trước ($v_{rel} < 0$ khi xe tiến lại gần). |
| $\lambda$ | Bước sóng mang (Wavelength) | $\text{m}$ (hoặc $\text{mm}$) | Bước sóng của tần số trung tâm $77\text{ GHz}$ ($\lambda = c / f_0 \approx 3.9\text{ mm}$). |
| $\Delta \phi$ | Độ lệch pha giữa 2 chirp (Phase shift) | $\text{rad}$ | Chênh lệch góc pha tín hiệu phản xạ giữa 2 chu kỳ chirp liên tiếp. |
| $T_c$ | Chu kỳ xung chirp | $\text{s}$ | Thời gian giãn cách giữa các xung phát sóng liên tiếp. |

---

### 2.3. Bố trí Radar trên Xe VinFast VF 8 / VF 9
Xe trang bị **5 Cảm biến Radar thế hệ mới của ZF Friedrichshafen**:
1. **Radar trung tâm phía trước (Long Range Radar - LRR):** Băng thông tập trung, cự ly phát hiện tối đa $200\text{m}$, quét liên tục để phát hiện chướng ngại vật trên làn đường phục vụ tính năng ACC và AEB.
2. **4 Radar góc (Corner Radars - MRR):** Góc quét cực rộng ($\pm 75^\circ$), cự ly $80\text{m}$, phát hiện các phương tiện tiếp cận từ góc mù (phục vụ BSD, DOW, RCTA, FCTA).

---

## 3. CẢM BIẾN SIÊU ÂM (USS) & LIDAR

### 3.1. Cảm biến Siêu âm (Ultrasonic Sensors - USS)

Đo khoảng cách dựa trên nguyên lý Thời gian bay (Time-of-Flight - ToF) của chùm sóng âm phản xạ trong không khí:

$$
d = \frac{c_{âm} \cdot \Delta t}{2}
$$

##### Bảng Giải thích Chi tiết Các Đại lượng Cảm biến Siêu âm:

| Ký hiệu | Tên gọi Kỹ thuật | Đơn vị | Ý nghĩa Kỹ thuật |
| :--- | :--- | :--- | :--- |
| $d$ | Khoảng cách tới chướng ngại vật | $\text{m}$ (mét) | Cự ly gần (tối ưu trong dải $0.15\text{m} - 5.0\text{m}$). |
| $c_{âm}$ | Vận tốc truyền sóng âm | $\text{m/s}$ | Tốc độ âm thanh trong không khí ($c_{âm} \approx 343\text{ m/s}$ tại $20^\circ\text{C}$). |
| $\Delta t$ | Thời gian bay (Time-of-Flight) | $\text{s}$ (hoặc $\text{ms}$) | Thời gian đo từ lúc màng loa siêu âm phát xung gõ đến khi nhận lại sóng phản hồi. |
| Số $2$ ở mẫu | Hệ số quãng đường khứ hồi | - | Sóng âm truyền đi từ cảm biến tới vật thể rồi dội ngược lại quãng đường gấp đôi. |

* **12 cảm biến USS trên VinFast VF 8:** Bố trí 6 cảm biến phía trước và 6 cảm biến phía sau. Các cảm biến góc (Side USS) có góc mở chùm tia rộng hơn để đo chiều dài khe đỗ khi xe chạy ngang qua trong tính năng Hỗ trợ đỗ xe tự động (APA).

### 3.2. Cảm biến LiDAR (Light Detection and Ranging)
* **Phân loại:**
  - *LiDAR Cơ học (Mechanical):* Quay 360 độ (dùng trên xe thử nghiệm Waymo, Cruise).
  - *LiDAR Thể rắn / Bán thể rắn (Solid-State / MEMS Mirror):* Bền bỉ, kích thước nhỏ (như Valeo SCALA trên Mercedes S-Class hoặc Luminar Iris trên Volvo EX90).
* **Tại sao VinFast hiện nay chưa trang bị LiDAR thương mại trên VF 8/VF 9?**
  - Chi phí 1 cụm LiDAR automotive chuẩn ASIL-B có giá từ $1,000 - $3,000 USD, làm đội giá thành xe.
  - Cụm 5 Radar mmWave ZF + Camera Mobileye đã đủ điều kiện đạt chứng nhận an toàn cao nhất (5 sao Euro NCAP) cho các tính năng Level 2+.
  - VinFast và ZF đang nghiên cứu tích hợp LiDAR cho các thế hệ xe tự hành Level 3 trong tương lai.

---

## 4. THUẬT TOÁN DUNG HỢP DỮ LIỆU (SENSOR FUSION & EKF)

```
                            MÔ HÌNH DUNG HỢP TRẠNG THÁI (LATE FUSION)
                            
   [CAMERA]                                                [RADAR]
   Nhận diện 2D Bounding Box                               Đo trực tiếp Range, Doppler Vel
   Đo góc ngang chính xác,                                 Đo khoảng cách cực chuẩn,
   Nhưng ước lượng cự ly sâu kém                           Nhưng góc ngang phân giải thấp
           \                                              /
            \                                            /
             v                                          v
      +--------------------------------------------------------+
      | GÁN VẬT THỂ (OBJECT DATA ASSOCIATION)                  |
      | - Khoảng cách Mahalanobis: d_M(z, \hat{z})             |
      | - Thuật toán Hungarian (Hungarian Algorithm)           |
      +--------------------------------------------------------+
                                   |
                                   v
      +--------------------------------------------------------+
      | BỘ LỌC KALMAN MỞ RỘNG (EXTENDED KALMAN FILTER - EKF)   |
      | Dự đoán trạng thái -> Cập nhật ma trận hiệp phương sai |
      +--------------------------------------------------------+
                                   |
                                   v
             [Danh sách vật thể duy nhất: x, y, v_x, v_y, a_x]
```

### 4.1. Công thức Toán học Chi tiết của Bộ lọc Kalman Mở rộng (EKF)

#### 1. Phương trình Trạng thái Hệ thống
Vector trạng thái 2D của xe phía trước:

$$
\mathbf{x} = \begin{bmatrix} p_x \\ p_y \\ v_x \\ v_y \end{bmatrix}
$$

Mô hình chuyển động vận tốc không đổi (Constant Velocity - CV):

$$
\mathbf{x}_k = \mathbf{F} \mathbf{x}_{k-1} + \mathbf{w}_k, \quad \mathbf{F} = \begin{bmatrix} 1 & 0 & \Delta t & 0 \\ 0 & 1 & 0 & \Delta t \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}, \quad \mathbf{w}_k \sim \mathcal{N}(0, \mathbf{Q})
$$

#### 2. Bước Dự đoán (Prediction)

$$
\mathbf{\hat{x}}_{k|k-1} = \mathbf{F} \mathbf{\hat{x}}_{k-1|k-1}
$$

$$
\mathbf{P}_{k|k-1} = \mathbf{F} \mathbf{P}_{k-1|k-1} \mathbf{F}^T + \mathbf{Q}
$$

#### 3. Bước Đo lường với Radar (Phi tuyến tính)
Dữ liệu Radar trả về trong hệ tọa độ cực:

$$
\mathbf{z}_{radar} = \begin{bmatrix} \rho \\ \phi \\ \dot{\rho} \end{bmatrix} = h(\mathbf{x}) = \begin{bmatrix} \sqrt{p_x^2 + p_y^2} \\ \arctan(p_y / p_x) \\ \frac{p_x v_x + p_y v_y}{\sqrt{p_x^2 + p_y^2}} \end{bmatrix}
$$

Tuyến tính hóa hàm đo lường bằng ma trận Jacobian $\mathbf{H}_j$:

$$
\mathbf{H}_j = \frac{\partial h}{\partial \mathbf{x}} = \begin{bmatrix} 
\frac{p_x}{\rho} & \frac{p_y}{\rho} & 0 & 0 \\
-\frac{p_y}{\rho^2} & \frac{p_x}{\rho^2} & 0 & 0 \\
\frac{p_y(v_x p_y - v_y p_x)}{\rho^3} & \frac{p_x(v_y p_x - v_x p_y)}{\rho^3} & \frac{p_x}{\rho} & \frac{p_y}{\rho}
\end{bmatrix}
$$

#### 4. Cập nhật Trạng thái (Measurement Update)

$$
\mathbf{y} = \mathbf{z} - h(\mathbf{\hat{x}}_{k|k-1})
$$

$$
\mathbf{S} = \mathbf{H}_j \mathbf{P}_{k|k-1} \mathbf{H}_j^T + \mathbf{R}
$$

$$
\mathbf{K} = \mathbf{P}_{k|k-1} \mathbf{H}_j^T \mathbf{S}^{-1}
$$

$$
\mathbf{\hat{x}}_{k|k} = \mathbf{\hat{x}}_{k|k-1} + \mathbf{K} \mathbf{y}
$$

$$
\mathbf{P}_{k|k} = (\mathbf{I} - \mathbf{K} \mathbf{H}_j) \mathbf{P}_{k|k-1}
$$

##### Bảng Giải thích Chi tiết Các Đại lượng và Ma trận trong Bộ lọc EKF:

| Ký hiệu | Tên gọi Kỹ thuật | Kích thước | Ý nghĩa & Vai trò trong Dung hợp Cảm biến |
| :--- | :--- | :--- | :--- |
| $\mathbf{x} = [p_x, p_y, v_x, v_y]^T$ | Vector trạng thái vật thể 2D | $4 \times 1$ | Chứa tọa độ vị trí 2D $[p_x, p_y]$ và vận tốc 2D $[v_x, v_y]$ của xe mục tiêu. |
| $\mathbf{F}$ | Ma trận chuyển trạng thái (State Transition) | $4 \times 4$ | Mô hình động học chuyển động thẳng đều (Constant Velocity) với chu kỳ lấy mẫu $\Delta t$. |
| $\mathbf{w}_k$ | Nhiễu quá trình (Process noise) | $4 \times 1$ | Sai số mô hình động học do xe mục tiêu tăng/giảm tốc hoặc chuyển làn, tuân theo phân phối Gauss $\mathcal{N}(0, \mathbf{Q})$. |
| $\mathbf{Q}$ | Hiệp phương sai nhiễu quá trình | $4 \times 4$ | Độ bất định của mô hình vật lý chuyển động của xe đi trước. |
| $\mathbf{P}$ | Ma trận hiệp phương sai sai số | $4 \times 4$ | Thể hiện mức độ tin cậy/độ bất định của hệ thống về ước lượng trạng thái hiện tại. |
| $\mathbf{z}_{radar} = [\rho, \phi, \dot{\rho}]^T$ | Vector đo lường từ Radar | $3 \times 1$ | Tín hiệu trả về từ Radar gồm cự ly $\rho$, góc phương vị $\phi$, và vận tốc Doppler xuyên tâm $\dot{\rho}$. |
| $h(\mathbf{x})$ | Hàm đo lường phi tuyến tính | $3 \times 1$ | Chuyển đổi trạng thái từ hệ tọa độ Đề-các sang hệ tọa độ cực của Radar. |
| $\mathbf{H}_j$ | Ma trận Jacobian đo lường | $3 \times 4$ | Ma trận đạo hàm riêng của $h(\mathbf{x})$ theo $\mathbf{x}$, dùng để tuyến tính hóa hệ thống quanh điểm ước lượng. |
| $\mathbf{y}$ | Sai số đo lường (Measurement Residual) | $3 \times 1$ | Độ lệch giữa kết quả cảm biến thực tế đo được và kết quả ước lượng từ mô hình dự đoán. |
| $\mathbf{S}$ | Hiệp phương sai sai số đo lường | $3 \times 3$ | Độ bất định tổng hợp của sai số dự đoán và nhiễu cảm biến. |
| $\mathbf{R}$ | Hiệp phương sai nhiễu cảm biến | $3 \times 3$ | Đặc tính nhiễu vật lý của cảm biến Radar/Camera (được đo kiểm trước từ nhà cung cấp Tier-1). |
| $\mathbf{K}$ | Độ lợi Kalman (Kalman Gain) | $4 \times 3$ | Trọng số tối ưu hóa: Quyết định hệ thống nên tin tưởng mô hình dự đoán hay tin tưởng tín hiệu cảm biến hơn. |
| $\mathbf{I}$ | Ma trận đơn vị (Identity Matrix) | $4 \times 4$ | Ma trận đường chéo chính có các phần tử bằng 1. |

---

### 4.2. Code Mẫu C++: Triển khai Bước Tính Jacobian của EKF
Dưới đây là đoạn code chuẩn công nghiệp mà kỹ sư thường triển khai trong ECU ADAS:

```cpp
#include <iostream>
#include <cmath>
#include <Eigen/Dense>

using Eigen::MatrixXd;
using Eigen::VectorXd;

MatrixXd CalculateJacobian(const VectorXd& x_state) {
    MatrixXd Hj(3, 4);
    Hj.setZero();

    // Lấy các biến trạng thái
    double px = x_state(0);
    double py = x_state(1);
    double vx = x_state(2);
    double vy = x_state(3);

    // Tính các thành phần phụ trợ
    double c1 = px * px + py * py;
    double c2 = std::sqrt(c1);
    double c3 = c1 * c2;

    // Kiểm tra chống chia cho 0
    if (std::fabs(c1) < 0.0001) {
        std::cerr << "Lỗi: Chia cho 0 trong phép tính Jacobian!" << std::endl;
        return Hj;
    }

    // Điền các giá trị vào ma trận Jacobian
    Hj << (px / c2),                (py / c2),                0,       0,
         -(py / c1),                (px / c1),                0,       0,
          py * (vx * py - vy * px) / c3, px * (vy * px - vx * py) / c3, px / c2, py / c2;

    return Hj;
}
```

---

## 5. TỔNG KẾT
Tầng cảm biến là "đôi mắt" và "đôi tai" của chiếc xe VinFast. Bằng cách kết hợp Radar và Camera thông qua thuật toán EKF, hệ thống khắc phục được hoàn toàn điểm yếu của từng cảm biến đơn lẻ, đảm bảo hệ thống có một bức tranh môi trường 360 độ chính xác, tin cậy dưới mọi điều kiện thời tiết khắc nghiệt.
