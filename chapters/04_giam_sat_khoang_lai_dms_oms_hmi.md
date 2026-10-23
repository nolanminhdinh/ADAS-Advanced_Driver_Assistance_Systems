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
Chỉ số **PERCLOS (Percentage of Eye Closure)** là tiêu chuẩn vàng được Cục Quản lý An toàn Giao thông Đường cao tốc Quốc gia Mỹ (NHTSA) công nhận:

$$\text{PERCLOS} = \frac{\sum_{i=1}^{N} \mathbb{I}(\text{EAR}_i < \text{EAR}_{threshold})}{N} \times 100\%$$

* **Chỉ số tỷ lệ khung mắt (Eye Aspect Ratio - EAR):**
  Dựa trên 6 điểm mốc quanh mí mắt:
  $$\text{EAR} = \frac{|p_2 - p_6| + |p_3 - p_5|}{2 |p_1 - p_4|}$$
  *(Khi mắt mở to, $\text{EAR} \approx 0.35 - 0.40$. Khi nhắm mắt hoàn toàn, $\text{EAR} < 0.15$).*
* **Ngưỡng kích hoạt cảnh báo:**
  Nếu $\text{PERCLOS} > 80\%$ trong khung thời gian 1 phút, hệ thống xác nhận tài xế đang trong trạng thái buồn ngủ cực độ (*Microsleep*) $\rightarrow$ Lập tức phát còi báo động và siết nhẹ dây đai an toàn.

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
3. Véc-tơ tia nhìn từ mắt đến gương:
   $$\vec{v}_i = \frac{\mathbf{M} - \mathbf{E}}{\|\mathbf{M} - \mathbf{E}\|}$$
4. Véc-tơ quan sát mong muốn để loại bỏ điểm mù phía sau xe: $\vec{v}_r$.
5. Theo định luật phản xạ quang học, véc-tơ pháp tuyến mong muốn của mặt gương phải là:
   $$\vec{n}_{des} = \frac{\vec{v}_r - \vec{v}_i}{\|\vec{v}_r - \vec{v}_i\|}$$
6. Hộp điều khiển thân xe (BCM) gửi lệnh qua mạng LIN tới 2 mô-tơ bước nằm trong củ gương để nghiêng mặt gương theo đúng góc pháp tuyến $\vec{n}_{des}$.

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
