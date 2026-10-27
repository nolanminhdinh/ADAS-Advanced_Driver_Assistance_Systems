# CHƯƠNG 4: HỆ THỐNG GIÁM SÁT KHOANG LÁI (DMS / OMS) & TRẢI NGHIỆM HMI

---

## 1. TẠI SAO HỆ THỐNG THEO DÕI TRONG KHOANG LÁI LÀ BẮT BUỘC?

Trong các hệ thống tự hành Cấp độ 2 và 2+ (Level 2/2+), trách nhiệm pháp lý cao nhất vẫn thuộc về người lái xe. Nếu người lái quá ỷ lại vào hệ thống (Automation Complacency), lơ là nhìn điện thoại hoặc ngủ gật, thảm họa va chạm giao thông sẽ xảy ra.

```
                           NGUYÊN LÝ VÒNG GIÁM SÁT AN TOÀN
                           
             +----------------------------------------------------+
             |            HỆ THỐNG TỰ LÁI NGOÀI XE (ADAS)         |
             |       (Duy trì làn đường, giữ tốc độ, phanh)       |
             +----------------------------------------------------+
                                       ^
                                       | Đồng bộ trạng thái
                                       v
             +----------------------------------------------------+
             |      HỆ THỐNG THEO DÕI TRONG KHOANG LÁI (DMS)      |
             |  (Mắt có nhìn đường không? Có buồn ngủ không?)     |
             +----------------------------------------------------+
```

### 1.1. Lỗ hổng của Cảm biến Đo Mô-men Xoắn Vô lăng (Torque Sensor)
* **Phương thức truyền thống (Tesla Autopilot thế hệ cũ):** Đo lực ghì tay người lái lên vành vô lăng. Nếu sau 15 giây không có lực cản mô-men xoắn, hệ thống sẽ cảnh báo.
* **Lỗ hổng chết người:** Người lái xe có thể dễ dàng "đánh lừa" hệ thống bằng cách cài một quả tạ nhỏ, một chiếc vòng silicon, hoặc một chai nước kẹp vào vành vô lăng. Khi đó, tài xế có thể thản nhiên ngủ gật hoặc bấm điện thoại trong khi chiếc xe vẫn chạy với tốc độ $100\text{ km/h}$.
* **Giải pháp hiện đại trên VinFast:** 
  1. Trang bị **Vô lăng cảm ứng điện dung (Capacitive Steering Wheel):** Cảm biến nhận diện tĩnh điện sinh học từ bàn tay người lái chạm vào da vô lăng, không thể bị gian lận bằng các vật nặng cơ học.
  2. Kết hợp với **Camera hồng ngoại DMS của VinAI:** Giám sát trực tiếp hướng nhìn và cử chỉ khuôn mặt người lái.

---

## 2. HỆ THỐNG GIÁM SÁT NGƯỜI LÁI (DMS - DRIVER MONITORING SYSTEM)

Hệ thống DMS sử dụng camera cảm biến hồng ngoại bước sóng ngắn (**NIR - Near Infrared 850nm / 940nm**) kết hợp hệ thống đèn LED hồng ngoại ẩn, cho phép nhìn rõ từng chi tiết của mắt và mặt người lái trong đêm tối hoàn toàn mà không làm chói mắt tài xế.

```
               LUỒNG XỬ LÝ DỮ LIỆU DMS BẰNG DEEP LEARNING (VINAI)
               
[ IR Camera 60 FPS ] ---> [ Face Detection & Tracking ]
                                     |
                                     v
                        [ 3D Facial Landmarks (68 điểm) ]
                                     |
         +---------------------------+---------------------------+
         |                                                       |
         v                                                       v
[ Ước lượng Hướng Đầu (Head Pose) ]            [ Phân tích Trạng thái Mắt (Eye Gaze) ]
  - Góc Yaw (Quay trái/phải)                     - Trục đồng tử (Pupil Center)
  - Góc Pitch (Gục đầu/ngửa cổ)                  - Độ mở mi mắt (Eye Aspect Ratio - EAR)
  - Góc Roll (Nghiêng đầu)                       - Tỷ lệ chớp mắt / nhắm mắt (PERCLOS)
         \                                                       /
          \                                                     /
           v                                                   v
   [ Nhận diện Mất tập trung ]                   [ Nhận diện Buồn ngủ Nguy hiểm ]
   (Nhìn điện thoại > 3 giây)                    (PERCLOS > 0.8 trong cửa sổ 1 phút)
                                     |
                                     v
                  +--------------------------------------+
                  | HMI CẢNH BÁO: Âm thanh, Rung Vô lăng |
                  +--------------------------------------+
```

### 2.1. Công thức Toán học Đo lường Mức độ Buồn ngủ (PERCLOS)
Chỉ số **PERCLOS (Percentage of Eye Closure)** là tiêu chuẩn vàng được Cục Quản lý An toàn Giao thông Đường cao tốc Quốc gia Mỹ (NHTSA) công nhận để định lượng mức độ buồn ngủ của tài xế:

$$
\text{PERCLOS} = \frac{\sum_{i=1}^{N} \mathbb{I}(\text{EAR}_i < \text{EAR}_{threshold})}{N} \times 100\%
$$

##### Bảng Giải thích Chi tiết Các Đại lượng trong Công thức PERCLOS:

| Ký hiệu | Tên gọi Kỹ thuật | Đơn vị | Ý nghĩa & Vai trò trong Thuật toán DMS |
| :--- | :--- | :--- | :--- |
| $\text{PERCLOS}$ | Percentage of Eye Closure | $\%$ | Tỷ lệ phần trăm thời gian mí mắt nhắm $\ge 80\%$ trong một cửa sổ thời gian quan sát (tiêu chuẩn P80). |
| $N$ | Tổng số khung hình (Total Frames) | Khung hình | Tổng số frame video được camera DMS ghi nhận và xử lý trong cửa sổ trượt (ở $60\text{ FPS}$ trong 1 phút thì $N = 3600\text{ frames}$). |
| $i$ | Chỉ số khung hình (Frame Index) | - | Thứ tự của khung hình đang được tính toán ($i = 1, 2, \dots, N$). |
| $\text{EAR}_i$ | Eye Aspect Ratio tại frame $i$ | - | Tỷ lệ khung mắt tức thời được tính toán tại khung hình thứ $i$. |
| $\text{EAR}_{threshold}$ | Ngưỡng nhắm mắt (Threshold) | - | Ngưỡng xác định trạng thái nhắm mắt (thường cài đặt trong khoảng $0.20 - 0.25$, tương ứng mắt đã khép $\ge 80\%$). |
| $\mathbb{I}(\cdot)$ | Hàm chỉ thị (Indicator Function) | - | Hàm logic toán học: $\mathbb{I} = 1$ nếu điều kiện $(\text{EAR}_i < \text{EAR}_{threshold})$ đúng (mắt đang nhắm), và $\mathbb{I} = 0$ nếu mắt đang mở. |
| $\sum_{i=1}^{N} \mathbb{I}(\dots)$ | Số frame nhắm mắt tích lũy | Khung hình | Tổng số lượng khung hình mà người lái đang nhắm mắt trong suốt khoảng thời gian $N$ frames. |

---

#### Chỉ số Tỷ lệ Khung Mắt (Eye Aspect Ratio - EAR):
Dựa trên 6 điểm mốc mí mắt 2D ($\mathbf{p}_1 \dots \mathbf{p}_6$) trích xuất từ mô hình Facial Landmarks (chuẩn 68 điểm mốc):

$$
\text{EAR} = \frac{\|\mathbf{p}_2 - \mathbf{p}_6\| + \|\mathbf{p}_3 - \mathbf{p}_5\|}{2 \|\mathbf{p}_1 - \mathbf{p}_4\|}
$$

*(Khi mắt mở to bình thường, $\text{EAR} \approx 0.35 - 0.40$. Khi nhắm mắt hoàn toàn, $\text{EAR} < 0.15$).*

##### Bảng Giải thích Chi tiết Các Điểm mốc & Đại lượng trong Công thức EAR:

| Ký hiệu | Tên gọi / Vị trí Điểm mốc | Ý nghĩa Hình học & Sinh trắc học |
| :--- | :--- | :--- |
| $\mathbf{p}_1 = (x_1, y_1)$ | Khóe mắt ngoài (Outer corner) | Điểm mốc mí mắt ngoài cùng về phía thái dương. |
| $\mathbf{p}_4 = (x_4, y_4)$ | Khóe mắt trong (Inner corner) | Điểm mốc mí mắt trong cùng về phía sống mũi. |
| $\|\mathbf{p}_1 - \mathbf{p}_4\|$ | Chiều rộng ngang mắt (Eye width) | Khoảng cách Euclidean giữa 2 khóe mắt, đóng vai trò mẫu số chuẩn hóa tỉ lệ (bất biến theo khoảng cách xa gần từ mặt tới camera). |
| $\mathbf{p}_2, \mathbf{p}_6$ | Cặp điểm mốc mi trên/dưới ngoài | Cặp điểm đo độ mở theo phương thẳng đứng ở vị trí 1/3 ngoài của mắt. |
| $\mathbf{p}_3, \mathbf{p}_5$ | Cặp điểm mốc mi trên/dưới trong | Cặp điểm đo độ mở theo phương thẳng đứng ở vị trí 1/3 trong của mắt. |
| $\|\mathbf{p}_2 - \mathbf{p}_6\|, \|\mathbf{p}_3 - \mathbf{p}_5\|$ | Chiều cao mở mi mắt (Eye heights) | Hai khoảng cách Euclidean đo độ hở khe mắt theo phương đứng. |
| Hệ số $2$ ở mẫu | Hệ số chuẩn hóa trung bình | Mẫu số nhân 2 để cân bằng tỉ lệ trung bình cộng của 2 khoảng cách đo chiều dọc ở tử số. |

* **Ngưỡng kích hoạt cảnh báo:**
  Nếu $\text{PERCLOS} > 80\%$ trong khung thời gian 1 phút (hoặc mắt nhắm liên tục quá $1.5\text{s} - 2.0\text{s}$), hệ thống xác nhận tài xế đang trong trạng thái buồn ngủ cực độ (*Microsleep*) $\rightarrow$ Lập tức phát còi báo động và siết nhẹ dây đai an toàn.

---

### 2.2. Điểm Vượt Trội của Công nghệ VinAI DMS
Khác với các giải pháp thị trường dễ bị lỗi khi điều kiện môi trường thay đổi, thuật toán VinAI DMS được tối ưu hóa đặc biệt:
1. **Xuyên thấu kính râm:** Sử dụng ánh sáng hồng ngoại NIR chiếu xuyên qua lớp phủ chống tia cực tím (UV) của kính râm đen, theo dõi trực tiếp con ngươi bên trong mắt.
2. **Khẩu trang y tế:** Tại thị trường Việt Nam sau đại dịch COVID-19, nhiều người lái vẫn giữ thói quen đeo khẩu trang. Thuật toán của VinAI tái định vị mốc dựa trên vùng mắt và sống mũi trên, đảm bảo độ chính xác trên 98%.

---

## 3. CÔNG NGHỆ ĐỘT PHÁ TỪ VINAI: MIRRORSENSE (CHỈNH GƯƠNG TỰ ĐỘNG)

Tính năng **VinAI MirrorSense** đã đoạt giải thưởng Đổi mới Sáng tạo tại triển lãm công nghệ lớn nhất thế giới **CES (Consumer Electronics Show)**.

```
                      MÔ HÌNH TOÁN HỌC QUANG HỌC CỦA MIRRORSENSE
                      
                          Vị trí Mắt Người Lái E (X_e, Y_e, Z_e)
                                      *
                                       \
                                        \ Tia nhìn tới (Incident Ray \vec{v}_i)
                                         \
                                          v
                                    +------------+
                                    | Mặt Gương  | ===> Pháp tuyến mặt gương \vec{n}_{des}
                                    | Chiếu Hậu  |
                                    +------------+
                                          /
                                         / Tia phản xạ mong muốn (\vec{v}_r)
                                        /  (Bao phủ điểm mù phía sau xe)
                                       v
                             Vùng Điểm Mù Ngoài Xe
```

### 3.1. Thuật toán Tính toán Góc Pháp tuyến Gương Mong muốn

1. Camera DMS trích xuất tọa độ mắt trái và mắt phải trong hệ quy chiếu xe: $\mathbf{E} = [X_e, Y_e, Z_e]^T$.
2. Điểm tâm gương chiếu hậu trái có tọa độ cố định: $\mathbf{M} = [X_m, Y_m, Z_m]^T$.
3. Véc-tơ đơn vị của tia nhìn tới từ mắt người lái đến tâm mặt gương:

$$
\vec{v}_i = \frac{\mathbf{M} - \mathbf{E}}{\|\mathbf{M} - \mathbf{E}\|}
$$

4. Véc-tơ đơn vị của tia phản xạ mong muốn hướng ra sau để bao phủ vùng điểm mù ngoài xe: $\vec{v}_r$.
5. Theo định luật phản xạ quang học, véc-tơ pháp tuyến đơn vị mong muốn của mặt gương được tính bằng:

$$
\vec{n}_{des} = \frac{\vec{v}_r - \vec{v}_i}{\|\vec{v}_r - \vec{v}_i\|}
$$

6. Hộp điều khiển thân xe (BCM) gửi lệnh qua mạng LIN tới 2 mô-tơ bước nằm trong củ gương để nghiêng mặt gương theo đúng góc pháp tuyến $\vec{n}_{des}$.

##### Bảng Giải thích Chi tiết Các Đại lượng trong Thuật toán VinAI MirrorSense:

| Đại lượng | Ký hiệu | Đơn vị | Ý nghĩa Hình học & Vật lý Quang học |
| :--- | :--- | :--- | :--- |
| $\mathbf{E} = [X_e, Y_e, Z_e]^T$ | Tọa độ 3D mắt người lái (Eye position) | $\text{m}$ (mét) | Tọa độ vị trí trung tâm mắt người lái do AI trích xuất thời gian thực trong hệ tọa độ thân xe. |
| $\mathbf{M} = [X_m, Y_m, Z_m]^T$ | Tọa độ 3D tâm gương (Mirror center) | $\text{m}$ (mét) | Tọa độ vật lý cố định của khớp cầu xoay tâm gương chiếu hậu ngoài xe. |
| $\mathbf{M} - \mathbf{E}$ | Vector tia tới chưa chuẩn hóa | $\text{m}$ | Vector chỉ phương hướng từ mắt người lái tới điểm tâm của gương chiếu hậu. |
| $\|\mathbf{M} - \mathbf{E}\|$ | Khoảng cách mắt - gương | $\text{m}$ | Độ dài khoảng cách Euclidean từ mắt người lái tới tâm mặt gương. |
| $\vec{v}_i$ | Incident Ray Vector (Tia tới) | - | Vector đơn vị ($\|\vec{v}_i\| = 1$) biểu diễn hướng đường nhìn từ mắt đập vào bề mặt gương. |
| $\vec{v}_r$ | Reflected Ray Vector (Tia phản xạ) | - | Vector đơn vị ($\|\vec{v}_r\| = 1$) mong muốn của tia phản xạ hướng ra vùng không gian điểm mù phía sau sườn xe. |
| $\vec{n}_{des}$ | Desired Normal Vector (Pháp tuyến gương) | - | Vector đơn vị vuông góc với bề mặt gương tại điểm phản xạ, là mục tiêu góc nghiêng mà 2 mô-tơ trong củ gương cần điều chỉnh đạt tới. |
| $\|\vec{v}_r - \vec{v}_i\|$ | Độ dài vector hiệu | - | Chuẩn hóa để vector pháp tuyến $\vec{n}_{des}$ đạt độ dài đơn vị chuẩn ($\|\vec{n}_{des}\| = 1$). |

---

## 4. HỆ THỐNG GIÁM SÁT HÀNH KHÁCH (OMS) & BẢO VỆ TRẺ EM

Hệ thống **Occupant Monitoring System (OMS)** kiểm soát toàn bộ không gian khoang sau:
1. **Nhận diện Trẻ em bị Bỏ quên trong Xe (Child Presence Detection - CPD):**
   - Hàng năm trên thế giới có hàng chục vụ tai nạn thương tâm do trẻ em bị quên trong xe hơi dưới trời nắng nóng gây sốc nhiệt (*Heatstroke*).
   - Chuẩn Euro NCAP từ năm 2023 cộng điểm rất cao cho xe có tính năng CPD.
   - Giải pháp của VinFast: Kết hợp camera trong xe và cảm biến chuyển động siêu âm để nhận diện cử động lồng ngực thở của em bé ngay cả khi em bé đang trùm chăn ngủ. Khi phát hiện trẻ bị bỏ quên sau khi khóa xe, xe sẽ tự động hạ kính $2\text{ cm}$, bật điều hòa thông gió, nhấp nháy đèn khẩn cấp và gửi thông báo khẩn tới ứng dụng VinFast trên điện thoại của cha mẹ.

---

## 5. THIẾT KẾ TRẢI NGHIỆM TƯƠNG TÁC HMI (HUMAN-MACHINE INTERFACE)

Hệ thống ADAS tốt phải giao tiếp rõ ràng với người lái để họ luôn biết: **Xe đang thấy gì? Xe chuẩn bị làm gì? Khi nào xe cần người lái can thiệp?**

```
+----------------------------------------------------------------------------------------------------+
|                                    CÁC TẦNG GIAO TIẾP HMI TRÊN VINFAST                             |
+--------------------+---------------------------------------+---------------------------------------+
| Phương thức        | Vị trí / Kênh Truyền                  | Chức năng Phục vụ                     |
+--------------------+---------------------------------------+---------------------------------------+
| Màn hình HUD       | Chiếu trực tiếp lên kính lái trước    | Hiển thị tốc độ, giới hạn tốc độ biển |
| (Head-Up Display)  | tầm mắt người lái                     | báo, vạch làn ảo bám theo xe trước.   |
+--------------------+---------------------------------------+---------------------------------------+
| Màn hình Trung tâm | Màn hình cảm ứng 15.6 inch            | Hiển thị không gian 3D JellyView,     |
| 15.6 inch          |                                       | đồ họa mô phỏng xe xung quanh.        |
+--------------------+---------------------------------------+---------------------------------------+
| Phản hồi Xúc giác  | Vô lăng rung haptic theo tần số       | Rung nhẹ khi chệch làn (LDW);         |
| (Haptic Feedback)  |                                       | Rung giật khi có nguy cơ va chạm.     |
+--------------------+---------------------------------------+---------------------------------------+
| Phản hồi Âm thanh  | Loa vòm chia theo từng góc khoang lái | Phát tiếng chuông cảnh báo đúng hướng |
| (Spatial Audio)    |                                       | chướng ngại vật đang tiến đến.        |
+--------------------+---------------------------------------+---------------------------------------+
```

---

## 6. TỔNG KẾT
Hệ thống buồng lái thông minh (DMS/OMS/HMI) đóng vai trò là "chiếc cầu nối" giữa trí tuệ nhân tạo của xe và ý thức của con người. Nhờ những phát minh độc đáo của VinAI (MirrorSense, JellyView, DMS), các dòng xe VinFast không chỉ đáp ứng trọn vẹn các tiêu chuẩn an toàn ngặt nghèo của Euro NCAP mà còn đem đến trải nghiệm cá nhân hóa đỉnh cao cho khách hàng.
