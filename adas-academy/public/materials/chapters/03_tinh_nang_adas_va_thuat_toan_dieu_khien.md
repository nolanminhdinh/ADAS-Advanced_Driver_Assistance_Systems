# CHƯƠNG 3: CÁC TÍNH NĂNG ADAS CỐT LÕI & THUẬT TOÁN ĐIỀU KHIỂN

---

## 1. ĐIỀU KHIỂN DỌC: PHANH KHẨN CẤP (AEB) & GA THÍCH ỨNG (ACC)

Điều khiển dọc (Longitudinal Control) quản lý gia tốc dương (tăng tốc) và gia tốc âm (phanh giảm tốc) của xe.

```
                           SƠ ĐỒ KHỐI ĐIỀU KHIỂN DỌC
                           
[ Vận tốc mong muốn v_set ] 
[ Khoảng cách xe trước d  ] ---> [ Bộ Điều khiển Dọc ] ---> [ Gia tốc yêu cầu a_req ]
[ Vận tốc xe trước v_lead ]         (MPC / PID)                    |
                                                                   v
                                                  +----------------------------------+
                                                  | BỘ PHÂN CHIA QUYỀN LỰC (ARBITER) |
                                                  +----------------------------------+
                                                     /                           \
                                      Nếu a_req > 0 /                             \ Nếu a_req < 0
                                                   v                               v
                                    [ Mô-men Động cơ VCU ]             [ Áp suất Dầu Phanh ESP ]
```

---

### 1.1. Phanh Khẩn Cấp Tự Động (AEB - Autonomous Emergency Braking)

#### 1. Công thức Toán học Tính toán Thời gian tới Va chạm (TTC)
* **Trường hợp Vận tốc Tương đối Ổn định:**
  $$\text{TTC} = \frac{d_{rel}}{-v_{rel}} = \frac{x_{lead} - x_{ego}}{v_{ego} - v_{lead}} \quad (v_{ego} > v_{lead})$$
* **Trường hợp Xe phía trước đang Phanh Gấp (Có Gia tốc Tương đối $a_{rel}$):**
  Phương trình chuyển động tương đối:
  $$d_{rel} + v_{rel} \cdot t + \frac{1}{2} a_{rel} \cdot t^2 = 0$$
  Nghiệm dương nhỏ nhất của phương trình bậc hai chính là thời gian va chạm chính xác:
  $$\text{TTC}_{accel} = \frac{-v_{rel} - \sqrt{v_{rel}^2 - 2 a_{rel} d_{rel}}}{a_{rel}}$$

#### 2. Máy Trạng thái Phanh Khẩn cấp (AEB State Machine)
Hệ thống AEB trên VinFast VF 8 phân chia quy trình can thiệp theo 4 giai đoạn nghiêm ngặt để đảm bảo an toàn tối đa nhưng không gây hoảng loạn cho người lái:

```
+---------------------------------------------------------------------------------------------------------+
|                                      MÁY TRẠNG THÁI AEB TRÊN VINFAST                                    |
+-------------------+---------------------+-------------------------------+-------------------------------+
| Giai đoạn         | Điều kiện TTC       | Hành vi Hệ thống              | Bộ Chấp hành (Actuator)       |
+-------------------+---------------------+-------------------------------+-------------------------------+
| 1. Safe (Bình thường)| TTC > 2.8s       | Giám sát thụ động             | Không can thiệp               |
+-------------------+---------------------+-------------------------------+-------------------------------+
| 2. FCW (Cảnh báo) | 1.8s < TTC <= 2.8s  | Âm thanh tít tít dồn dập,     | Cụm màn hình trung tâm HUD,   |
|                   |                     | chớp đỏ cảnh báo trên kính lái| Loa xe cảnh báo               |
+-------------------+---------------------+-------------------------------+-------------------------------+
| 3. Brake Prefill  | 1.2s < TTC <= 1.8s  | Nhấp phanh nhẹ (Brake Jerk),  | Bơm thủy lực ESP tạo áp suất  |
|    & HBA Sẵn sàng |                     | loại bỏ khe hở má phanh       | mồi 2-5 bar trong cùm phanh   |
+-------------------+---------------------+-------------------------------+-------------------------------+
| 4. Full AEB       | TTC <= 1.2s         | Phanh khẩn cấp với gia tốc    | Bộ trợ lực phanh điện tử      |
|                   |                     | cực đại a = -9.8 m/s² (-1g)   | iBooster / ESP kích hoạt 100% |
+-------------------+---------------------+-------------------------------+-------------------------------+
```

---

### 1.2. Kiểm Soát Hành Trình Thích Ứng (ACC - Adaptive Cruise Control)
ACC duy trì một khoảng cách an toàn phụ thuộc vào vận tốc xe (*Constant Time Gap Spacing Policy*):
$$d_{des}(t) = d_0 + \tau \cdot v(t)$$
*(Trong đó: $d_0$ là khoảng cách an toàn khi dừng hẳn $2\text{m} - 3\text{m}$; $\tau$ là khoảng thời gian an toàn $1.0\text{s} - 2.2\text{s}$ do người lái chọn qua nút bấm vô lăng).*

#### Ứng dụng Bộ Điều khiển Dự báo Mô hình (MPC - Model Predictive Control)
Trong khi xe giá rẻ dùng bộ điều khiển PID (dễ bị overshoot và phanh giật), các dòng xe cao cấp và **VinFast VF 8 / VF 9 ứng dụng bộ điều khiển MPC**:
* **Hàm mục tiêu tối ưu hóa (Cost Function) trong chân trời dự báo $N_p$:**

$$J = \sum_{k=1}^{N_p} \left[ w_d \cdot (d(t+k) - d_{des}(t+k))^2 + w_v \cdot (v(t+k) - v_{set})^2 + w_a \cdot a(t+k)^2 + w_j \cdot \left(\frac{a(t+k) - a(t+k-1)}{\Delta t}\right)^2 \right]$$

* **Các ràng buộc vật lý (Physical Constraints):**
  - Giới hạn gia tốc an toàn: $-3.5\text{ m/s}^2 \le a(t) \le 2.0\text{ m/s}^2$
  - Giới hạn độ giật (Jerk limit): $|\text{Jerk}| \le 2.5\text{ m/s}^3$ (Chống say xe cho hành khách)
  - Giới hạn khoảng cách: $d(t) \ge d_{min} > 0$

---

## 2. ĐIỀU KHIỂN NGANG: GIỮ LÀN (LKA), ĐỊNH TÂM LÀN (LCA) & CHUYỂN LÀN

Điều khiển ngang (Lateral Control) kiểm soát góc quay vô lăng $\delta$ thông qua mô-tơ trợ lực lái điện (EPS).

### 2.1. Mô hình Động học Xe Đạp (Kinematic Bicycle Model)
Để thiết kế thuật toán điều khiển góc lái, xe ô tô được đơn giản hóa thành mô hình 2 bánh trên mặt phẳng:

```
                                      Bánh trước (Front Wheel)
                                           /
                                          /  Góc lái \delta
                                         /
                                       +---+
                                       |   |
                                       +---+
                                         |
                                         |  Chiều dài cơ sở L
                                         |
                                         |
                                       +---+
                                       |   |
                                       +---+
                                      Bánh sau (Rear Wheel)
```

Phương trình trạng thái động học:
$$\dot{x} = v \cos(\psi + \beta)$$
$$\dot{y} = v \sin(\psi + \beta)$$
$$\dot{\psi} = \frac{v}{L} \cos(\beta) \tan(\delta)$$
$$\beta = \arctan\left(\frac{l_r}{L} \tan(\delta)\right)$$
*(Trong đó: $\psi$ là góc hướng đầu xe, $\beta$ là góc trượt thân xe, $L$ là chiều dài cơ sở).*

---

### 2.2. Thuật toán Stanley Controller (Chuẩn Công nghiệp Ô tô)
Thuật toán Stanley tính toán góc lái bánh trước $\delta(t)$ bằng cách kết hợp hai thành phần bù lỗi độc lập:
1. **Bù góc lệch hướng ($\theta_e$):** Giúp xe quay đầu song song với làn đường.
2. **Bù sai số vị trí ngang ($e_y$):** Kéo xe dịch chuyển dần về tâm làn đường.

$$\delta(t) = \theta_e(t) + \arctan\left(\frac{k \cdot e_y(t)}{v(t) + \epsilon}\right)$$

```
                                 Đường tâm làn (Target Lane Center)
          -----------------------------------------------------------------
                                      / |
                                     /  | e_y (Khoảng cách lệch tâm ngang)
                        \theta_e    /   |
                       (Góc lệch)  /    v
                                  /____ [Trục trước Xe EGO] ===> Vận tốc v
                                 /
```

* **Phân tích Tính ổn định (Stability Analysis):**
  Khi $e_y$ nhỏ, ta có $\arctan(x) \approx x$, phương trình vi phân sai số trở thành:
  $$\dot{e}_y(t) = -v(t) \sin(\delta - \theta_e) \approx -v(t) \left(\frac{k e_y(t)}{v(t)}\right) = -k \cdot e_y(t)$$
  Nghiệm của phương trình là:
  $$e_y(t) = e_y(0) e^{-kt}$$
  Điều này chứng minh sai số lệch tâm ngang $e_y$ luôn hội tụ về 0 theo hàm mũ suy giảm với tốc độ hội tụ phụ thuộc vào hệ số độ lợi $k$.

---

### 2.3. Hỗ Trợ Chuyển Làn Tự Động (ALC - Auto Lane Change)
Khi xe đang chạy chế độ Highway Assist (HWA) trên VinFast VF 8:
1. Người lái bật cần gạt xi-nhan sang trái.
2. Radar góc sau bên trái quét khu vực điểm mù cự ly $70\text{m}$. Nếu phát hiện có xe đang lao tới với vận tốc cao ($TTC < 3.5\text{s}$), hệ thống từ chối chuyển làn và phát âm thanh cảnh báo.
3. Nếu an toàn, hệ thống lập kế hoạch sinh quỹ đạo đường cong bậc 5 (**Quintic Polynomial Trajectory**):
   $$y(t) = a_0 + a_1 t + a_2 t^2 + a_3 t^3 + a_4 t^4 + a_5 t^5$$
   Đảm bảo tại thời điểm bắt đầu $t=0$ và kết thúc $t=T$, vận tốc ngang và gia tốc ngang đều bằng 0, giúp xe chuyển làn êm ái mà không làm người lái bị hẫng.

---

## 3. THỰC TẾ XỬ LÝ TÌNH HUỐNG BIÊN (EDGE CASES) TẠI VIỆT NAM TRÊN XE VINFAST

Là kỹ sư làm việc với hệ thống ADAS của VinFast, bạn sẽ đối mặt với những bài toán mà các kỹ sư tại Silicon Valley hay Stuttgart chưa từng gặp:

```
+---------------------------------------------------------------------------------------------------------+
|                               CÁC EDGE CASES ĐẶC THÙ TẠI GIAO THÔNG VIỆT NAM                            |
+---------------------------+---------------------------------------+-------------------------------------+
| Hiện tượng Giao thông     | Nguy cơ đối với Thuật toán Quốc tế    | Giải pháp Kỹ thuật của VinFast      |
+---------------------------+---------------------------------------+-------------------------------------+
| Xe máy tạt đầu lách khe   | Hệ thống hiểu nhầm là xe ô tô phanh   | Tích hợp mô hình Phân loại Quỹ đạo  |
| (Cut-in cự ly cực ngắn)   | khẩn cấp -> Phanh giật (False Positive)| (Trajectory Classifier) lọc vật thể 2 |
|                           | gây tai nạn cho xe phía sau.          | bánh chỉ lách ngang qua luồng di chuyển.|
+---------------------------+---------------------------------------+-------------------------------------+
| Vạch kẻ đường bị xóa mờ,  | Mất vạch kẻ -> Hệ thống ngắt đột ngột | Ứng dụng "Ảo hóa Làn đường" (Virtual|
| hoặc bị xe máy che khuất  | (LKA Disengagement) gây mất lái.      | Lane Boundary): Theo dõi đuôi xe đi |
|                           |                                       | trước (Lead Vehicle Following).     |
+---------------------------+---------------------------------------+-------------------------------------+
| Mặt đường ngập nước mùa   | Nước phản xạ sóng Radar làm mù radar, | Tự động hạ cấp ODD (Graceful         |
| mưa bão ngập lụt          | Camera bị nước mưa bám nhòe hình ảnh. | Degradation), yêu cầu tài xế lái tay|
|                           |                                       | trước khi cảm biến mất tín hiệu.    |
+---------------------------+---------------------------------------+-------------------------------------+
```

---

## 4. TỔNG KẾT
Tầng điều khiển là bước chuyển hóa cuối cùng từ nhận thức thành hành động cơ khí. Việc làm chủ toán học điều khiển (MPC, Stanley) kết hợp thấu hiểu đặc thù giao thông bản địa giúp kỹ sư VinFast tạo ra những chiếc xe vừa an toàn tuyệt đối theo chuẩn quốc tế, vừa thông minh, thích ứng mượt mà với đường sá Việt Nam.
