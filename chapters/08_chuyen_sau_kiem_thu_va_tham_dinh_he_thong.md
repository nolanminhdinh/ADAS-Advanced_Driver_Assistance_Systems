# CHƯƠNG 8: CHUYÊN ĐỀ KỸ THUẬT KIỂM THỬ & THẨM ĐỊNH HỆ THỐNG ADAS (SYSTEM TESTING & VALIDATION)

> **Ghi chú Học thuật:**  
> Toàn bộ nội dung chương này được xây dựng hoàn toàn từ các nguồn tài liệu học thuật mở, tiêu chuẩn kỹ thuật quốc tế công khai (ISO 26262, ISO 21448 SOTIF, ASPICE, Euro NCAP Test Protocols) và các sách trắng kỹ thuật được công bố rộng rãi của các tổ chức kiểm định độc lập. Tài liệu không phản ánh quy trình nội bộ hay dữ liệu bảo mật của bất kỳ tổ chức thương mại cụ thể nào.

---

## 1. KHUNG QUY TRÌNH KIỂM THỬ HỆ THỐNG (V&V FRAMEWORK THEO ASPICE)

Trong kỹ thuật ô tô chuẩn quốc tế, quá trình kiểm định hệ thống tuân theo mô hình **V&V (Verification and Validation)** được chuẩn hóa bởi quy trình **Automotive SPICE (ASPICE)**:

```
               QUY TRÌNH ĐỐI XỨNG YÊU CẦU - KIỂM THỬ TRONG ASPICE
               
   Yêu cầu Hệ thống (System Requirements) <---------> Kiểm thử Hệ thống (SYS.5 - System Validation)
         \                                                   /
     Kiến trúc Hệ thống (System Architecture) <---------> Kiểm thử Tích hợp (SYS.4 - System Integration Test)
           \                                               /
       Thiết kế Phần mềm (SW Architecture) <----------> Kiểm thử Tích hợp Phần mềm (SWE.5 - SW Integration Test)
             \                                           /
         Thiết kế Module (Detailed Design) <---------> Kiểm thử Đơn vị (SWE.4 - Unit Test)
               \                                       /
                +--------> Lập trình Mã nguồn --------+
```

### 1.1. Phân biệt Bản chất: Verification vs. Validation
1. **Verification (Xác minh - "Are we building the product right?"):**
   - Kiểm tra xem sản phẩm có đáp ứng đúng các chỉ tiêu kỹ thuật đã đặt ra trong tài liệu thiết kế hay không.
   - Thường thực hiện ở tầng dưới: Kiểm tra mã nguồn (Code review, MISRA compliance), Unit Test, mô phỏng SIL/HIL.
2. **Validation (Thẩm định - "Are we building the right product?"):**
   - Đánh giá xem hệ thống khi lắp lên xe hoàn chỉnh có thực sự giải quyết được bài toán an toàn và mang lại trải nghiệm đúng kỳ vọng của người lái trong thế giới thực hay không.
   - Thực hiện trên đường thử (Proving Ground) và điều kiện vận hành thực tế (Field Operational Test - FOT).

### 1.2. Ma trận Truy xuất Nguồn gốc Yêu cầu (Requirements Traceability Matrix - RTM)
Mỗi một yêu cầu an toàn theo tiêu chuẩn **ISO 26262 (TSR - Technical Safety Requirement)** bắt buộc phải có ít nhất một trường hợp kiểm thử (**Test Case**) tương ứng để chứng minh tính hợp chuẩn:

```
+------------------+-----------------------------+--------------------+-----------------------------+
| ID Yêu cầu (TSR) | Nội dung Kỹ thuật           | Mức ASIL           | Test Case ID Tương ứng       |
+------------------+-----------------------------+--------------------+-----------------------------+
| TSR_AEB_0101     | Khi TTC <= 1.2s, hệ thống   | ASIL-D             | TC_HIL_AEB_MaxDecel_01      |
|                  | phải yêu cầu gia tốc phanh  |                    | TC_TRACK_AEB_CCRs_50kph_02  |
|                  | a <= -8.0 m/s² trong 100ms. |                    |                             |
+------------------+-----------------------------+--------------------+-----------------------------+
| TSR_LKA_0205     | Khi cảm biến camera mất tín | ASIL-D             | TC_HIL_FaultInj_GMSL_Loss   |
|                  | hiệu, hệ thống phải ngắt trợ|                    |                             |
|                  | lực lái mượt mà dδ/dt < 5°/s|                    |                             |
+------------------+-----------------------------+--------------------+-----------------------------+
```

---

## 2. KIỂM THỬ HIL (HARDWARE-IN-THE-LOOP TESTING) CHUYÊN SÂU

Kiểm thử HIL là phương pháp thử nghiệm hộp điều khiển điện tử thật (**Device Under Test - DUT**) trong một môi trường thế giới ảo thời gian thực.

```
+---------------------------------------------------------------------------------------------------------+
|                                    KIẾN TRÚC MỘT TRẠM KIỂM THỬ HIL ADAS                                 |
|                                                                                                         |
|  +---------------------------------------------+               +-------------------------------------+  |
|  | TRẠM MÔ PHỎNG THỜI GIAN THỰC (REAL-TIME PC) |               | HỘP ĐIỀU KHIỂN ADAS THẬT (DUT)      |  |
|  | - Mô hình Động lực học Xe (Vehicle Dynamics)|               | - Bo mạch vi xử lý SoC              |  |
|  | - Mô hình Môi trường & Giao thông 3D        |   Cáp Nối     | - Vi điều khiển an toàn (Safety MCU)|  |
|  | - Card Giao tiếp Mạng CAN-FD / Ethernet     |==============>| - Phần mềm nhúng thực tế            |  |
|  | - Card Tiêm Lỗi Phần cứng (FIU Unit)        |               |                                     |  |
|  +---------------------------------------------+               +-------------------------------------+  |
|                         ^                                                         |                     |
|                         | Phản hồi trạng thái xe ảo                               | Tín hiệu Lái / Phanh|
|                         +---------------------------------------------------------+                     |
+---------------------------------------------------------------------------------------------------------+
```

### 2.1. Kỹ thuật Tiêm Lỗi Hệ thống (Fault Injection Testing)
Mục tiêu là chứng minh hệ thống đạt khả năng tự bảo vệ an toàn (**Fail-Safe**) khi xảy ra hỏng hóc:
1. **Tiêm lỗi tầng vật lý (Hardware Fault Injection):**
   - Thiết bị chuyển mạch cơ điện tử (Fault Insertion Unit - FIU) can thiệp trực tiếp vào các chân tín hiệu (Pins):
     * *Short-to-Battery:* Nối tắt đường dây tín hiệu với nguồn cấp $12\text{V}$.
     * *Short-to-Ground:* Nối tắt đường dây tín hiệu với mass ($0\text{V}$).
     * *Pin-to-Pin Short:* Nối chập 2 chân tín hiệu liền kề nhau.
     * *Open Circuit:* Ngắt hở mạch tức thời.
2. **Tiêm lỗi tầng giao thức mạng (Network & Bus Fault Injection):**
   - *Message Dropout:* Bỏ qua ngẫu nhiên các khung truyền CAN-FD chứa thông tin tốc độ xe.
   - *Data Corruption:* Làm sai lệch mã kiểm tra dư thừa tuần hoàn (**CRC - Cyclic Redundancy Check**).
   - *Sequence Error:* Đảo lộn giá trị của bộ đếm chu kỳ (Rolling Alive Counter).

### 2.2. Kịch bản Kiểm thử Tự động HIL bằng Ngôn ngữ Kịch bản (Mô phỏng CAPL / Python)

Dưới đây là một đoạn kịch bản kiểm thử tự động mô phỏng bằng Python dựa trên chuẩn giao diện kiểm thử mở **ASAM XIL API**:

```python
"""
Kịch bản Kiểm thử Tự động: Thẩm định Tính năng Ngắt An toàn của LKA khi mất tín hiệu Camera
Tiêu chuẩn tham chiếu: ISO 26262 ASIL-D Fault Reaction Time
"""
import time

def test_lka_camera_loss_fail_safe(hil_system):
    print("=== BẮT ĐẦU TEST CASE: TC_HIL_LKA_CAM_LOSS ===")
    
    # 1. Thiết lập trạng thái xe ảo: Đang chạy 80 km/h trên cao tốc, LKA đang Active
    hil_system.set_vehicle_speed(80.0)  # km/h
    hil_system.set_lane_curvature(0.0)  # Đường thẳng
    hil_system.send_can_signal("LKA_Status_Req", 1) # Bật LKA
    time.sleep(2.0)
    
    # Kiểm tra xác nhận LKA đã hoạt động bình thường
    lka_active = hil_system.read_can_signal("LKA_State_Feedback")
    assert lka_active == 2, "LỖI: LKA không thể kích hoạt ở điều kiện chuẩn!"
    print("[PASS] LKA đang hoạt động ổn định ở 80 km/h.")

    # 2. Thực hiện Tiêm Lỗi: Ngắt tín hiệu Camera (Mô phỏng đứt cáp truyền video)
    print("--> Bơm lỗi: Ngắt đường truyền Camera...")
    fault_inject_time = time.time()
    hil_system.inject_fault("CAM_FRONT_GMSL_LINK", "OPEN_CIRCUIT")

    # 3. Giám sát thời gian phản hồi an toàn (Fault Reaction Time Window)
    # Theo tiêu chuẩn an toàn, hệ thống phải ngắt trong vòng tối đa 100ms
    timeout = 0.100  # 100 ms
    fault_detected = False
    safe_degraded = False

    while (time.time() - fault_inject_time) < timeout:
        dtc_code = hil_system.read_can_signal("DTC_Camera_Comm_Loss")
        lka_state = hil_system.read_can_signal("LKA_State_Feedback")
        torque_request = hil_system.read_can_signal("LKA_Target_Torque")

        if dtc_code == 0xE102: # Mã lỗi mất liên lạc Camera
            fault_detected = True
            
        if lka_state == 0 and abs(torque_request) < 0.05: # Hệ thống đã trả lái về 0 mượt mà
            safe_degraded = True
            reaction_time = (time.time() - fault_inject_time) * 1000
            break
        time.sleep(0.005)

    # 4. Đánh giá Kết quả Kiểm thử
    assert fault_detected, "THẤT BẠI: ECU không ghi nhận mã lỗi DTC khi mất camera!"
    assert safe_degraded, "THẤT BẠI: Hệ thống không hạ cấp an toàn trong giới hạn 100ms!"
    
    print(f"[PASS] Kiểm thử Thành công! Thời gian phản hồi an toàn: {reaction_time:.2f} ms (< 100 ms).")
```

---

## 3. THỬ NGHIỆM THỰC ĐỊA SA HÌNH (PROVING GROUND) THEO TIÊU CHUẨN EURO NCAP

Kiểm thử trên đường thử chuyên dụng là bước bắt buộc để được cấp phép lưu hành và đánh giá xếp hạng sao an toàn.

```
                  BỐ TRÍ HỆ THỐNG ĐO KIỂM CHUẨN TRÊN SA HÌNH
                  
+------------------------------------+              +------------------------------------+
| XE THỬ NGHIỆM VUT (VEHICLE UNDER TEST)            | XE MỤC TIÊU EVT (GLOBAL SOFT TARGET)
| - Hệ thống ADAS cần đánh giá       |              | - Mô hình xe mềm tiêu chuẩn        |
| - GPS-RTK thu tín hiệu vệ tinh     |              | - Khung trượt kéo siêu mỏng        |
| - Cảm biến góc quay IMU độ chính xác|              | - GPS-RTK thu tín hiệu vệ tinh     |
|   cao (OxTS / GeneSys)             |              |                                    |
+------------------------------------+              +------------------------------------+
                  \                                                   /
                   \                                                 /
                    v                                               v
              +-----------------------------------------------------------+
              | MẠNG KHÔNG DÂY TỐC ĐỘ CAO (DSRC / WLAN TIME-SYNC)          |
              | Đồng bộ thời gian thực giữa 2 xe với độ trễ < 1 miligiây  |
              +-----------------------------------------------------------+
                                            |
                                            v
              +-----------------------------------------------------------+
              | DỮ LIỆU ĐỐI CHUẨN MẶT ĐẤT (GROUND TRUTH REFERENCE)        |
              | Tính toán cự ly tương đối chính xác đến từng centimet     |
              +-----------------------------------------------------------+
```

### 3.1. Các Bài Thử Nghiệm An Toàn Chủ Động Cốt Lõi
1. **Nhóm Car-to-Car Rear (Đâm va đuôi xe phía trước):**
   - **CCRs (Car-to-Car Rear Stationary):** Xe thử nghiệm tiếp cận xe mục tiêu đứng yên với dải vận tốc từ $10 - 80\text{ km/h}$.
   - **CCRm (Car-to-Car Rear Moving):** Xe mục tiêu di chuyển đều ở tốc độ $20\text{ km/h}$, xe thử nghiệm tiếp cận từ phía sau ở tốc độ $30 - 80\text{ km/h}$.
   - **CCRb (Car-to-Car Rear Braking):** Cả hai xe ban đầu cùng chạy ở tốc độ $50\text{ km/h}$ với khoảng cách cách nhau $12\text{m}$ hoặc $40\text{m}$. Xe mục tiêu đột ngột kích hoạt phanh giảm tốc với gia tốc $-4\text{ m/s}^2$.
2. **Nhóm Bảo vệ Người Dễ bị Tổn thương (VRU - Vulnerable Road Users):**
   - **CPFA (Car-to-Pedestrian Farside Adult):** Người đi bộ hình nộm băng qua đường từ phía xa với tốc độ $8\text{ km/h}$.
   - **CPNA (Car-to-Pedestrian Nearside Adult):** Người đi bộ băng qua đường ngay trước mũi xe từ lề gần.
   - **CPNC (Car-to-Pedestrian Nearside Child):** Trẻ em chạy băng qua đường từ sau chướng ngại vật là hai chiếc xe đang đỗ bên đường che khuất tầm nhìn.

---

## 4. PHÂN TÍCH DỮ LIỆU ĐO KIỂM & ĐỐI SOÁT TÍN HIỆU

### 4.1. Định dạng Tệp Dữ liệu Đo lường Chuẩn Công nghiệp
* **ASAM MDF4 (`.mf4`):** Định dạng nhị phân tối ưu hóa cao chuyên dụng trong ô tô để ghi hàng nghìn kênh tín hiệu tốc độ cao mà không bị quá tải bộ nhớ.
* **BLF / ASC:** Định dạng ghi log toàn bộ luồng bản tin mạng CAN/CAN-FD.
* **PCAP / PCAPNG:** Định dạng bắt gói tin mạng Automotive Ethernet để phân tích các bản tin SOME/IP và luồng dữ liệu camera thô.

### 4.2. Bóc tách và Nhận diện Lỗi: False Positive vs. False Negative

```
+---------------------------------------------------------------------------------------------------------+
|                                  MA TRẬN ĐÁNH GIÁ HIỆU NĂNG NHẬN THỨC ADAS                              |
+-------------------+---------------------------------------+---------------------------------------------+
| Tình trạng Thực tế| Hệ thống Can thiệp (Phanh / Báo động) | Hệ thống KHÔNG Can thiệp                    |
+-------------------+---------------------------------------+---------------------------------------------+
| CÓ Nguy cơ        | **TRUE POSITIVE (TP)**                | **FALSE NEGATIVE (FN)**                     |
| Đâm va thật       | Hệ thống nhận biết đúng và phanh kịp  | *CỰC KỲ NGUY HIỂM:* Hệ thống bị mù, bỏ sót  |
|                   | thời cứu sống người ngồi trong xe.     | chướng ngại vật -> Dẫn tới va chạm!         |
+-------------------+---------------------------------------+---------------------------------------------+
| KHÔNG Có Nguy cơ  | **FALSE POSITIVE (FP)**               | **TRUE NEGATIVE (TN)**                      |
| Mặt đường an toàn | *RỦI RO BỊ ĐÂM DỒN TOA:* Hệ thống     | Hệ thống hoạt động chính xác, xe di chuyển  |
|                   | tự phanh giật đột ngột (Phantom Brake)| êm ái, không can thiệp sai.                 |
+-------------------+---------------------------------------+---------------------------------------------+
```

* **Quy trình Đối soát Tín hiệu khi xảy ra Sự cố (Root Cause Analysis):**
  1. Trích xuất khoảng thời gian xảy ra lỗi trên file `.mf4`.
  2. Đồng bộ hóa trục thời gian giữa 3 nguồn dữ liệu độc lập:
     - Kênh hình ảnh camera mặt đường (Ground Truth Video).
     - Tọa độ cự ly đo được từ thiết bị chuẩn GPS-RTK.
     - Tín hiệu ước lượng của cụm cảm biến xe (Object List trên bus mạng CAN-FD).
  3. Tìm điểm sai lệch: Nếu GPS-RTK báo cự ly tới vật thể phía trước là vô cùng (đường thông thoáng), nhưng bus CAN ghi nhận tín hiệu `Radar_Obj0_Range` sụt giảm đột ngột về $10\text{m} \rightarrow$ Xác định nguyên nhân do nhiễu phản xạ đa tạp của Radar, yêu cầu nhóm giải thuật Sensor Fusion tăng trọng số xác thực từ Camera trước khi kích hoạt lệnh phanh.

---

## 5. TỔNG KẾT
Kiểm thử hệ thống ADAS là sự kết hợp chuẩn mực giữa **tư duy an toàn khắt khe**, **năng lực phân tích dữ liệu tín hiệu nhúng** và **khả năng vận hành các thiết bị thử nghiệm công nghệ cao**. Nắm vững các tiêu chuẩn quốc tế và phương pháp luận kiểm thử này là nền tảng vững chắc nhất cho bất kỳ kỹ sư nào bước vào lĩnh vực nghiên cứu và kiểm định xe tự hành hiện đại.
