# CHƯƠNG 2: TẦNG CẢM BIẾN (SENSING) & DUNG HỢP DỮ LIỆU (SENSOR FUSION)

---

## 1. CẢM BIẾN CAMERA & THỊ GIÁC MÁY TÍNH TRONG XE HƠI

Camera là cảm biến duy nhất cung cấp dữ liệu hình ảnh với mật độ thông tin phong phú (màu sắc, cấu trúc hình khối, ngữ nghĩa ngữ cảnh).

### 1.1. Mô hình Toán học Pin-hole & Khử Biến dạng Ống kính
Mỗi điểm trong không gian thực 3D $\mathbf{P}_w = [X_w, Y_w, Z_w]^T$ được ánh xạ lên mặt phẳng cảm biến 2D $[u, v]^T$ qua ma trận tham số nội (Intrinsic Matrix $\mathbf{K}$) và ma trận ngoại (Extrinsic Matrix $[\mathbf{R} | \mathbf{t}]$):

$$s \begin{bmatrix} u \\ v \\ 1 \end{bmatrix} = \mathbf{K} \begin{bmatrix} \mathbf{R} & \mathbf{t} \end{bmatrix} \begin{bmatrix} X_w \\ Y_w \\ Z_w \\ 1 \end{bmatrix} = \begin{bmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} r_{11} & r_{12} & r_{13} & t_x \\ r_{21} & r_{22} & r_{23} & t_y \\ r_{31} & r_{32} & r_{33} & t_z \end{bmatrix} \begin{bmatrix} X_w \\ Y_w \\ Z_w \\ 1 \end{bmatrix}$$

* **Hiện tượng biến dạng quang học (Distortion):** 
  Do ống kính góc rộng (đặc biệt là 4 camera mắt cá 360 của VinFast), ảnh bị méo xuyên tâm (Radial distortion) và méo tiếp tuyến (Tangential distortion):
  $$x_{corrected} = x(1 + k_1 r^2 + k_2 r^4 + k_3 r^6) + [2p_1 xy + p_2(r^2 + 2x^2)]$$
  $$y_{corrected} = y(1 + k_1 r^2 + k_2 r^4 + k_3 r^6) + [p_1(r^2 + 2y^2) + 2p_2 xy]$$

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
* Khoảng cách đến mục tiêu tỉ lệ thuận với tần số phách (Beat Frequency $f_b$):
  $$d = \frac{c \cdot T_c \cdot f_b}{2 B}$$
  *(Trong đó $c$ là tốc độ ánh sáng $3 \times 10^8\text{ m/s}$, $B$ là băng thông chirp, $T_c$ là chu kỳ chirp).*
* **Độ phân giải cự ly tối thiểu:**
  $$\Delta R = \frac{c}{2B}$$
  *Ví dụ:* Với Radar băng thông rộng $B = 4\text{ GHz}$ (dải tần $77 - 81\text{ GHz}$), độ phân giải đạt tới:
  $$\Delta R = \frac{3 \times 10^8}{2 \times 4 \times 10^9} = 0.0375\text{ m} = 3.75\text{ cm}$$

### 2.2. Đo Vận tốc Tương đối qua Hiệu ứng Doppler
Vận tốc tương đối $v_{rel}$ làm thay đổi pha của sóng phản xạ giữa các chirp liên tiếp:
$$v_{rel} = \frac{\lambda \cdot \Delta \phi}{4\pi \cdot T_c}$$

### 2.3. Bố trí Radar trên Xe VinFast VF 8 / VF 9
Xe trang bị **5 Cảm biến Radar thế hệ mới của ZF Friedrichshafen**:
1. **Radar trung tâm phía trước (Long Range Radar - LRR):** Băng thông tập trung, cự ly phát hiện tối đa $200\text{m}$, quét liên tục để phát hiện chướng ngại vật trên làn đường phục vụ tính năng ACC và AEB.
2. **4 Radar góc (Corner Radars - MRR):** Góc quét cực rộng ($\pm 75^\circ$), cự ly $80\text{m}$, phát hiện các phương tiện tiếp cận từ góc mù (phục vụ BSD, DOW, RCTA, FCTA).

---

## 3. CẢM BIẾN SIÊU ÂM (USS) & LIDAR

### 3.1. Cảm biến Siêu âm (Ultrasonic Sensors - USS)
* Đo thời gian bay (Time-of-Flight) của sóng âm trong không khí:
  $$d = \frac{c_{âm} \cdot \Delta t}{2} \quad (c_{âm} \approx 343\text{ m/s tại } 20^\circ\text{C})$$
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
