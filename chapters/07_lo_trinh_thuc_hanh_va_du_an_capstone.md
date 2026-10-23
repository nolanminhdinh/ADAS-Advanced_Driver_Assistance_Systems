# CHƯƠNG 7: LỘ TRÌNH THỰC HÀNH & DỰ ÁN MẪU (CAPSTONE PROJECTS)

---

## 1. BỘ CÔNG CỤ (TOOLCHAIN) CHUẨN CỦA KỸ SƯ ADAS

Để làm việc chuyên nghiệp tại các tập đoàn sản xuất ô tô như VinFast hoặc các viện nghiên cứu như VinAI, bạn cần thành thạo bộ công cụ tiêu chuẩn sau:

```
+---------------------------------------------------------------------------------------------------------+
|                                    BỘ CÔNG CỤ KỸ SƯ ADAS TIÊU CHUẨN                                     |
+-------------------+----------------------------+--------------------------------------------------------+
| Hạng mục          | Công nghệ / Thư viện       | Mục đích Sử dụng                                       |
+-------------------+----------------------------+--------------------------------------------------------+
| Ngôn ngữ Lập trình| C++ (C++14 / C++17)        | Viết thuật toán lõi thời gian thực trên ECU (ASIL-D).  |
|                   | Python (3.9+)              | Xử lý dữ liệu cảm biến, huấn luyện mô hình Deep Learning|
+-------------------+----------------------------+--------------------------------------------------------+
| Thư viện Toán học | Eigen3, Boost, SciPy       | Xử lý ma trận, đại số tuyến tính, giải tối ưu hóa.     |
+-------------------+----------------------------+--------------------------------------------------------+
| Thị giác & Đồ họa | OpenCV, PCL, Open3D        | Xử lý ảnh, điểm mây 3D (Point Cloud), trích xuất mốc.  |
+-------------------+----------------------------+--------------------------------------------------------+
| Middleware & OS   | ROS 2 (Humble / Iron), QNX | Kiến trúc Publish-Subscribe, kiểm thử trên robot/xe ảo.|
+-------------------+----------------------------+--------------------------------------------------------+
| Môi trường Giả lập| CARLA Simulator            | Chạy xe ảo trong đô thị 3D với Camera/Radar/LiDAR thật.|
+-------------------+----------------------------+--------------------------------------------------------+
| Công cụ Giao tiếp | Vector CANoe, PCAN-View    | Đọc và giải mã dữ liệu mạng CAN-FD từ xe thực tế.      |
+-------------------+----------------------------+--------------------------------------------------------+
```

---

## 2. DỰ ÁN CAPSTONE 1: ĐIỀU KHIỂN BÁM LÀN BẰNG STANLEY CONTROLLER TRÊN TRÌNH GIẢ LẬP CARLA

### 2.1. Mục tiêu Dự án
Xây dựng một node điều khiển tự động hoàn chỉnh trên xe mô phỏng trong CARLA Simulator. Xe tự động phát hiện tâm làn đường và điều khiển vô lăng để giữ xe luôn chạy giữa làn ở tốc độ $60\text{ km/h}$.

### 2.2. Mã Nguồn Mẫu (Python Implementation)

```python
import numpy as np
import math

class StanleyController:
    """
    Bộ điều khiển Stanley cho điều khiển chuyển động ngang (Lateral Control)
    Chuẩn công nghiệp ứng dụng trên các hệ thống ADAS L2.
    """
    def __init__(self, k_gain=0.5, k_soft=1.0, max_steer=np.radians(35)):
        self.k = k_gain          # Độ lợi điều khiển sai số khoảng cách
        self.k_soft = k_soft    # Hằng số chống chia cho 0 ở tốc độ thấp
        self.max_steer = max_steer  # Giới hạn góc đánh lái cơ khí tối đa (+-35 độ)

    def calculate_steering(self, ego_x, ego_y, ego_yaw, ego_v, path_points):
        """
        Tham số:
            ego_x, ego_y: Tọa độ tâm trục bánh trước của xe
            ego_yaw: Góc hướng đầu xe (radians)
            ego_v: Vận tốc hiện tại của xe (m/s)
            path_points: Danh sách các điểm tim đường [ [x0, y0], [x1, y1], ... ]
        Trả về:
            delta: Góc quay bánh trước mong muốn (radians)
        """
        # 1. Tìm điểm gần nhất trên quỹ đạo làn đường
        dx = [ego_x - p[0] for p in path_points]
        dy = [ego_y - p[1] for p in path_points]
        distances = np.hypot(dx, dy)
        min_idx = np.argmin(distances)
        target_pt = path_points[min_idx]

        # 2. Tính toán sai số vị trí ngang (Cross-track Error: e_y)
        # Vector tiếp tuyến của đường làn
        if min_idx < len(path_points) - 1:
            path_yaw = math.atan2(path_points[min_idx + 1][1] - target_pt[1],
                                  path_points[min_idx + 1][0] - target_pt[0])
        else:
            path_yaw = math.atan2(target_pt[1] - path_points[min_idx - 1][1],
                                  target_pt[0] - path_points[min_idx - 1][0])

        # Sai số ngang có dấu (Front axle cross-track error)
        # Tích có hướng giữa hướng xe và vector nối tâm trục trước đến điểm mục tiêu
        vec_to_target = np.array([target_pt[0] - ego_x, target_pt[1] - ego_y])
        cross_product = np.sin(ego_yaw) * vec_to_target[0] - np.cos(ego_yaw) * vec_to_target[1]
        e_y = np.sign(cross_product) * distances[min_idx]

        # 3. Tính toán sai số góc hướng (Heading Error: theta_e)
        theta_e = path_yaw - ego_yaw
        # Chuẩn hóa góc về khoảng [-pi, pi]
        theta_e = math.atan2(math.sin(theta_e), math.cos(theta_e))

        # 4. Áp dụng Định luật Điều khiển Stanley
        # delta = theta_e + arctan( (k * e_y) / (v + k_soft) )
        delta = theta_e + math.atan2(self.k * e_y, ego_v + self.k_soft)

        # 5. Cắt góc lái trong giới hạn cơ khí an toàn
        delta = np.clip(delta, -self.max_steer, self.max_steer)

        return delta
```

---

## 3. DỰ ÁN CAPSTONE 2: GIẢI MÃ MÃ NGUỒN MỞ COMMA.AI OPENPILOT

**Comma.ai (openpilot)** là dự án ADAS mã nguồn mở thành công nhất thế giới, hỗ trợ hơn 250 dòng xe hơi.

```
+---------------------------------------------------------------------------------------------------------+
|                                  CẤU TRÚC KIẾN TRÚC COMMA.AI OPENPILOT                                  |
|                                                                                                         |
|  [ Camera Raw Stream ] ------------> [ modeld ] (Mạng Nơ-ron Deep Learning)                             |
|                                           |                                                             |
|                                           v                                                             |
|                                   [ plannerd ] (Lập kế hoạch Quỹ đạo & Tốc độ)                          |
|                                           |                                                             |
|                                           v                                                             |
|  [ Tín hiệu Mạng CAN ] ------------> [ controlsd ] (Bộ Điều khiển Dọc/Ngang PID/MPC)                    |
|                                           |                                                             |
|                                           v                                                             |
|                                   [ pandad ] (Gửi lệnh điều khiển ngược vào Bus CAN xe)                 |
+---------------------------------------------------------------------------------------------------------+
```

### 3.1. Các Thư mục Cần Đọc Kỹ cho Kỹ sư VinFast
1. `selfdrive/controls/lib/latcontrol_pid.py` và `latcontrol_torque.py`: Cách họ xây dựng bộ điều khiển lái theo góc và theo mô-men xoắn.
2. `selfdrive/controls/lib/longcontrol.py`: Thuật toán máy trạng thái tăng tốc, dừng đèn đỏ (*Stop and Go*).
3. `selfdrive/car/safety/`: Bộ quy tắc kiểm tra an toàn (*Safety Hooks*) viết bằng ngôn ngữ C, ngăn chặn việc gửi lệnh lái vượt quá giới hạn an toàn của xe.

---

## 4. DỰ ÁN CAPSTONE 3: HỆ THỐNG GIÁM SÁT NGƯỜI LÁI DMS (VINAI IN-CABIN REPLICATION)

### 4.1. Mục tiêu Dự án
Sử dụng thư viện **MediaPipe Face Mesh** và webcam máy tính để xây dựng ứng dụng phát hiện tài xế nhắm mắt ngủ gật theo chỉ số **PERCLOS** và phát chuông báo động.

### 4.2. Mã Nguồn Mẫu (Python Implementation)

```python
import cv2
import mediapipe as mp
import numpy as np
import time

# Khởi tạo MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True)

# Các điểm mốc quanh mắt trái theo chuẩn MediaPipe
LEFT_EYE = [362, 385, 387, 263, 373, 380]

def calculate_ear(landmarks, eye_indices, width, height):
    """Tính toán chỉ số Eye Aspect Ratio (EAR)"""
    pts = np.array([[landmarks[i].x * width, landmarks[i].y * height] for i in eye_indices])
    
    # Khoảng cách thẳng đứng
    A = np.linalg.norm(pts[1] - pts[5])
    B = np.linalg.norm(pts[2] - pts[4])
    # Khoảng cách chiều ngang
    C = np.linalg.norm(pts[0] - pts[3])
    
    ear = (A + B) / (2.0 * C)
    return ear

cap = cv2.VideoCapture(0)
EAR_THRESHOLD = 0.22
DROWSY_FRAMES = 30  # Khoảng 1 giây liên tục ở tốc độ 30 FPS
frame_counter = 0

print("Bắt đầu giám sát người lái (DMS Active)...")
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    h, w, _ = frame.shape
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)
    
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            ear = calculate_ear(face_landmarks.landmark, LEFT_EYE, w, h)
            
            # Kiểm tra mắt nhắm
            if ear < EAR_THRESHOLD:
                frame_counter += 1
                if frame_counter >= DROWSY_FRAMES:
                    cv2.putText(frame, "CANH BAO: TAI XE DANG BUON NGU!", (30, 80),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 3)
            else:
                frame_counter = 0
                
            cv2.putText(frame, f"EAR: {ear:.2f}", (30, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
    cv2.imshow("VinAI DMS Prototype", frame)
    if cv2.waitKey(1) & 0xFF == 27:  # Bấm ESC để thoát
        break

cap.release()
cv2.destroyAllWindows()
```

---

## 5. HƯỚNG DẪN ÔN TẬP PHỎNG VẤN VÀ ĐỊNH HƯỚNG SỰ NGHIỆP TẠI VINFAST / VINAI

Khi ứng tuyển vào các vị trí **ADAS Algorithm Engineer**, **ADAS System Validation**, hoặc **Autonomous Vehicle Control Specialist** tại VinFast, bạn sẽ thường được phỏng vấn qua 4 trụ cột kỹ thuật:

```
+---------------------------------------------------------------------------------------------------------+
|                                    4 TRỤ CỘT PHỎNG VẤN KỸ THUẬT ADAS VINFAST                            |
+--------------------------+------------------------------------------------------------------------------+
| 1. Tư duy Toán học       | Giải thích chi tiết sự khác nhau giữa EKF và UKF; Cách thiết lập hàm mục tiêu|
| & Điều khiển Tự động     | trong MPC; Chứng minh tính ổn định của thuật toán Stanley.                   |
+--------------------------+------------------------------------------------------------------------------+
| 2. An toàn & Tiêu chuẩn  | Trình bày quy trình HARA xác định ASIL-D theo ISO 26262; Sự khác nhau cơ bản|
| Quốc tế (FuSa / SOTIF)   | giữa lỗi phần cứng ngẫu nhiên và lỗi SOTIF (ISO 21448).                      |
+--------------------------+------------------------------------------------------------------------------+
| 3. Xử lý Tình huống Biên | Đưa ra giải pháp thuật toán xử lý trường hợp xe máy tạt đầu (Cut-in) sát sườn|
| (Edge Cases Việt Nam)    | xe và cách chống phanh giật (Phantom Braking) dưới trời mưa bão nhiệt đới.   |
+--------------------------+------------------------------------------------------------------------------+
| 4. Kỹ năng Phần mềm Ô tô | Kiến trúc phân tầng AUTOSAR; Giao tiếp CAN-FD và SOME/IP qua Ethernet;      |
| (Embedded Software)      | Lập trình C++ tuân thủ quy tắc an toàn bộ nhớ MISRA-C/C++.                   |
+--------------------------+------------------------------------------------------------------------------+
```

---

## 6. LỜI KẾT TỪ GIẢNG VIÊN
Chúc mừng bạn đã hoàn thành trọn vẹn toàn bộ 7 chương của **Giáo trình Kỹ thuật Chuyên sâu ADAS & Xe Tự Hành**. Bạn đã nắm giữ trong tay bức tranh toàn cảnh từ những công thức toán học nền tảng, thiết kế vi mạch nhúng an toàn, cho đến những bí quyết công nghệ độc quyền đang định hình tương lai của dòng xe điện VinFast trên đấu trường quốc tế.

Hãy bắt tay vào viết những dòng code đầu tiên trên CARLA và hiện thực hóa giấc mơ ô tô thông minh Việt Nam vươn tầm thế giới!
