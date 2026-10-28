# CHƯƠNG 10: CHUYÊN ĐỀ PHÂN TÍCH DỮ LIỆU ĐO KIỂM & ĐIỀU TRA LỖI ADAS (LOG DATA ANALYSIS & RCA)

> **Ghi chú Học thuật:**  
> Tài liệu này được biên soạn từ các tiêu chuẩn công nghiệp mở (ASAM MDF4, ISO 17387, IEEE 802.1AS Time-Sync) và các kỹ thuật xử lý dữ liệu mở với Python (`asammdf`, `cantools`, `pandas`). Phục vụ mục đích đào tạo kỹ thuật phân tích sự cố ô tô chuẩn quốc tế.

---

## 1. HỆ SINH THÁI ĐỊNH DẠNG TỆP TIN DỮ LIỆU LOG Ô TÔ

Trong quá trình chạy thử nghiệm xe trên đường (Vehicle Fleet Testing), các bộ ghi dữ liệu chuyên dụng (**Automotive Data Loggers**) thu thập gigabyte dữ liệu mỗi giờ với nhiều định dạng khác nhau:

```
+---------------------------------------------------------------------------------------------------------+
|                                    CÁC ĐỊNH DẠNG LOG XE HƠI TIÊU CHUẨN                                  |
+-------------------+----------------------------+--------------------------------------------------------+
| Định dạng Tệp     | Chuẩn Công nghiệp          | Bản chất & Ứng dụng Thực tế                            |
+-------------------+----------------------------+--------------------------------------------------------+
| **.mf4 / .mdf**   | ASAM MDF4                  | Định dạng nhị phân tối ưu cho việc ghi hàng ngàn kênh  |
|                   | (Measurement Data Format)  | tín hiệu thời gian thực (Sampled Data) với tốc độ cao. |
+-------------------+----------------------------+--------------------------------------------------------+
| **.blf**          | Vector BLF                 | Binary Logging Format: Chuẩn độc quyền mở của Vector,  |
|                   | (Binary Logging Format)    | nén siêu nhỏ, ghi toàn bộ gói tin bus CAN, CAN-FD, LIN.|
+-------------------+----------------------------+--------------------------------------------------------+
| **.asc**          | Vector ASCII               | Định dạng văn bản thô (Plain Text) chứa từng frame CAN.|
|                   | (ASCII Log Format)         | Dễ dàng mở đọc bằng Text Editor, phù hợp debug ngắn.  |
+-------------------+----------------------------+--------------------------------------------------------+
| **.pcap / .pcapng**| Wireshark Packet Capture  | Bắt trọn vẹn các gói tin mạng Automotive Ethernet      |
|                   |                            | (SOME/IP, DoIP, Video Streams từ Camera thô GMSL2).    |
+-------------------+----------------------------+--------------------------------------------------------+
```

---

## 2. KỸ THUẬT ĐỒNG BỘ THỜI GIAN ĐA NGUỒN DỮ LIỆU (TIME SYNCHRONIZATION)

Thách thức lớn nhất trong phân tích lỗi ADAS là: **Mỗi cảm biến thu thập dữ liệu ở một tần số và đồng hồ (Clock Domain) khác nhau!**

```
   CÁC LUỒNG DỮ LIỆU BỊ LỆCH TẦN SỐ VÀ TIMESTAMP
   
   Ground Truth (GPS-RTK) : [100 Hz]  t0 -------- t10ms -------- t20ms -------- t30ms -------- t40ms
   Forward mmWave Radar   : [50 Hz]   t0 ----------------------- t20ms ----------------------- t40ms
   Camera Object Bounding : [30 FPS]  t0 ----------------------------- t33.3ms ----------------------
   CAN-FD Vehicle Speed   : [100 Hz]  t0 -------- t10ms -------- t20ms -------- t30ms -------- t40ms
```

### Phương pháp Giải quyết: Nội suy Tuyến tính trên Trục Thời gian Chung
1. Chọn một trục thời gian chuẩn (**Master Reference Timeline**), thường là trục thời gian vệ tinh **GPS-RTK UTC time** hoặc Master Clock của bộ Datalogger (giao thức IEEE 802.1AS / PTP - Precision Time Protocol).
2. Áp dụng thuật toán **Nội suy Tuyến tính (Linear Interpolation)** hoặc **Nội suy Giữ giá trị gần nhất (Zero-Order Hold)** để căn chỉnh các kênh tín hiệu về cùng một mốc thời gian lấy mẫu trước khi đưa vào ma trận phân tích so sánh.

---

## 3. ĐIỀU TRA NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS - RCA) CỦA CÁC SỰ CỐ ĐIỂN HÌNH

### Case Study 1: Hiện tượng Phanh Giật Oan (Phantom Braking) do Nhiễu Phản xạ Đa đường
* **Triệu chứng ngoài xe:** Xe đang kích hoạt Adaptive Cruise Control (ACC) chạy ổn định $80\text{ km/h}$ trên cao tốc, đường hoàn toàn thông thoáng nhưng xe đột ngột giật phanh mạnh với gia tốc $-6\text{ m/s}^2$.
* **Quy trình Đối soát Tín hiệu Log:**

```
   ĐỒNG BỘ TÍN HIỆU PHÂN TÍCH HIỆN TƯỢNG PHANH GIẬT OAN
   
   Trục Thời Gian (t) --->    t = 12.0s           t = 12.5s (Phanh giật)       t = 13.0s
   +------------------------------------------------------------------------------------+
   | Kênh Ground Truth RTK | Cự ly xe trước = VÔ CÙNG (Đường hoàn toàn vắng bóng xe)    |
   +-----------------------+------------------------------------------------------------+
   | Kênh Camera Vision    | Không phát hiện Bounding Box nào (Số lượng xe = 0)         |
   +-----------------------+------------------------------------------------------------+
   | Kênh Radar Target 0   | Range: 150m ------> Range nhảy đột ngột: 12.5m (Ảo)        |
   |                       | Doppler Speed: -80 km/h (Báo xe trước sắp đâm!)            |
   +-----------------------+------------------------------------------------------------+
   | Lệnh Phanh CAN-FD     | AEB_Trigger = 0 --> AEB_Trigger = 1 (Lệnh phanh khẩn cấp)  |
   +------------------------------------------------------------------------------------+
```

* **Kết luận Nguyên nhân Gốc rễ (Root Cause):**
  1. Mặt đường phía trước có một nắp cống hoặc biển báo kim loại gắn trên dải phân cách.
  2. Sóng Radar $77\text{GHz}$ bị phản xạ đa đường (Multipath Reflection) từ mặt đường đập vào gầm kim loại rồi dội ngược về anten.
  3. Thuật toán dung hợp cảm biến (Sensor Fusion) có lỗ hổng: **Tin tưởng dữ liệu khoảng cách của Radar tuyệt đối mà bỏ qua xác nhận từ Camera trước.**
* **Biện pháp Khắc phục:** Tinh chỉnh ma trận trọng số trong thuật toán EKF: Chỉ cho phép kích hoạt phanh AEB toàn phần khi cả Radar VÀ Camera cùng đồng thuận có vật thể chuyển động trong dải cự ly $TTC < 1.4\text{s}$.

---

### Case Study 2: Mất Dấu vết Chướng Ngại Vật khi Xe Vào Cua Gắt (Target Drop)
* **Triệu chứng:** Xe bám theo một xe tải phía trước trong chế độ ACC. Khi đường bắt đầu cong với bán kính cua nhỏ ($R < 150\text{m}$), xe đột ngột tăng tốc lao thẳng về phía trước thay vì giảm tốc theo khúc cua.
* **Quy trình Phân tích Log:**
  1. Đọc tín hiệu góc lái `Steering_Angle` từ mạng CAN: Góc lái tăng từ $0^\circ \rightarrow 25^\circ$.
  2. Đọc tín hiệu `Radar_Obj0_Azimuth`: Góc lệch ngang của xe tải vượt quá $\pm 10^\circ$ (Vượt ra ngoài chùm sóng quét hẹp chính giữa của Radar tầm xa).
  3. Hộp điều khiển hiểu nhầm là làn đường phía trước đã thông thoáng $\rightarrow$ Lập tức ra lệnh cho động cơ tăng tốc để đạt vận tốc cài đặt $v_{set}$.
* **Biện pháp Khắc phục:** Tích hợp mô hình dự báo làn đường cong (Curvature-based Target Tracking): Sử dụng dữ liệu vạch kẻ làn từ Camera để mở rộng vùng tìm kiếm vật thể theo đường cong thực tế của làn đường (Predicted Path).

---

## 4. XÂY DỰNG PIPELINE PYTHON TỰ ĐỘNG PHÂN TÍCH LOG KIỂM THỬ

Trong thực tế, một đợt chạy thử nghiệm có thể sinh ra hàng trăm tệp `.mf4` và `.blf` với dung lượng hàng trăm gigabyte. Kỹ sư không thể mở từng file bằng tay, mà bắt buộc phải xây dựng **Script tự động hóa bóc tách dữ liệu**.

### Script Python Mẫu: Quét File Log Bắt Sự Kiện Vi Phạm Gia Tốc Âm (Phantom Braking Detector)

```python
"""
PIPELINE PHÂN TÍCH DỮ LIỆU LOG ADAS TỰ ĐỘNG
Thư viện yêu cầu: asammdf, cantools, pandas, numpy
Mục tiêu: Quét tệp đo kiểm .mf4, phát hiện các cú phanh giật đột ngột bất thường.
"""

import os
from asammdf import MDF
import numpy as np
import pandas as pd

def analyze_adas_log_for_anomalies(mf4_filepath):
    print(f"--> Đang nạp tệp dữ liệu: {os.path.basename(mf4_filepath)}...")
    
    # 1. Đọc tệp MDF4
    mdf_data = MDF(mf4_filepath)

    # 2. Trích xuất các kênh tín hiệu cốt lõi
    target_channels = [
        'Veh_Speed_kmh',           # Vận tốc xe (km/h)
        'Longitudinal_Accel_mps2',  # Gia tốc dọc thân xe (m/s^2)
        'AEB_Braking_Request',     # Cờ kích hoạt phanh AEB (0 hoặc 1)
        'Radar_Target_Distance_m', # Khoảng cách vật thể radar báo (mét)
        'Camera_Object_Count'      # Số lượng vật thể camera nhận diện
    ]

    # Lấy dữ liệu và đồng bộ hóa thời gian (Resample về chu kỳ 10ms = 100Hz)
    extracted_signals = mdf_data.filter(target_channels)
    resampled_data = extracted_signals.to_dataframe(raster=0.01) # 100 Hz

    # 3. Định nghĩa Tiêu chí Phát hiện Bất thường (Anomaly Criteria)
    # Tiêu chí: Gia tốc âm cực mạnh (phanh gấp < -5 m/s^2) 
    # TRONG KHI Camera không thấy vật thể nào (Camera_Object_Count == 0)
    anomalies = resampled_data[
        (resampled_data['Longitudinal_Accel_mps2'] < -5.0) &
        (resampled_data['Camera_Object_Count'] == 0) &
        (resampled_data['Veh_Speed_kmh'] > 40.0)
    ]

    # 4. Xuất Báo cáo Kết quả
    total_events = len(anomalies)
    if total_events > 0:
        print(f"[CẢNH BÁO NGUY HIỂM] Phát hiện {total_events} mẫu nghi vấn PHANH GIẬT OAN!")
        
        # Nhóm các mẫu liên tiếp thành từng Sự kiện (Incident Events)
        incident_timestamps = anomalies.index.tolist()
        print(f"   Thời điểm xảy ra: Từ giây thứ {incident_timestamps[0]:.2f}s đến {incident_timestamps[-1]:.2f}s")
        print(f"   Gia tốc phanh cực đại: {anomalies['Longitudinal_Accel_mps2'].min():.2f} m/s^2")
        print(f"   Cự ly Radar báo ảo: {anomalies['Radar_Target_Distance_m'].mean():.2f} m")

        # Lưu trích xuất sự cố ra file CSV để đính kèm vào báo cáo lỗi (Bug Report)
        output_csv = mf4_filepath.replace('.mf4', '_anomalies_report.csv')
        anomalies.to_csv(output_csv)
        print(f"   -> Đã xuất báo cáo trích xuất chi tiết ra: {output_csv}")
    else:
        print("[PASS] Không phát hiện bất thường phanh giật trong tệp đo này.")

    mdf_data.close()

# Ví dụ chạy thực thi
if __name__ == "__main__":
    # Đường dẫn tệp log giả định trong bài thực hành
    sample_log = "test_run_20261028_highway_80kph.mf4"
    if os.path.exists(sample_log):
        analyze_adas_log_for_anomalies(sample_log)
    else:
        print(f"Mẫu script sẵn sàng. Đặt tệp .mf4 vào thư mục để phân tích.")
```

---

## 5. TỔNG KẾT
Phân tích dữ liệu log là "nghệ thuật khám nghiệm pháp y" trong kỹ thuật ô tô. Bằng cách kết hợp kiến thức về cấu trúc mạng bus CAN-FD, định dạng tệp chuẩn công nghiệp ASAM MDF4, và khả năng lập trình tự động hóa với Python, kỹ sư kiểm thử có thể bóc tách chính xác từng mili-giây sai lệch để bảo vệ tính an toàn tuyệt đối cho người ngồi trên xe.
