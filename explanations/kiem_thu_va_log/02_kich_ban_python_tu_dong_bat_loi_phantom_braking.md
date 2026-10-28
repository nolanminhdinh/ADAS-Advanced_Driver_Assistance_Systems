# HƯỚNG DẪN THỰC CHIẾN: KỊCH BẢN PYTHON TỰ ĐỘNG PHÁT HIỆN LỖI PHANH GIẬT (PHANTOM BRAKING)

> **Liên kết Bài giảng Gốc:** [Chương 10: Phân Tích Dữ Liệu Đo Kiểm & Điều Tra Lỗi ADAS](../../chapters/10_chuyen_sau_phan_tich_du_lieu_log_adas.md#3-điều-tra-nguyên-nhân-gốc-rễ-root-cause-analysis---rca-của-các-sự-cố-điển-hình)  
> **Chuyên mục:** Kỹ năng Phân tích Dữ liệu Log (Data Analytics)  
> **Mục tiêu:** Xây dựng script Python hoàn chỉnh trích xuất dữ liệu chuỗi thời gian (Time-series) và vẽ đồ thị đối soát 3 kênh phát hiện hiện tượng phanh oan.

---

## 1. BỐI CẢNH VẤN ĐỀ TRONG KIỂM THỬ THỰC ĐỊA

Khi một đội xe chạy thử nghiệm thu về $50$ chuyến đi ($50$ tệp log `.mf4` hoặc `.blf`), người lái xe thử nghiệm báo cáo: *"Khoảng lúc 10h sáng trên cầu cạn xe có hiện tượng giật phanh một lần nhưng không nhớ chính xác ở giây thứ mấy"*.

Nhiệm vụ của kỹ sư dữ liệu kiểm thử là: **Viết một script tự động quét qua toàn bộ các tệp đo, xác định chính xác thời điểm xảy ra cú giật, trích xuất dữ liệu $\pm 5\text{ giây}$ quanh sự kiện và vẽ đồ thị trực quan hóa bằng chứng lỗi.**

---

## 2. ĐOẠN MÃ NGUỒN PYTHON HOÀN CHỈNH (CÓ ĐỒ HỌA TRỰC QUAN)

```python
"""
KỊCH BẢN PHÁT HIỆN & TRỰC QUAN HÓA SỰ CỐ PHANH GIẬT OAN (PHANTOM BRAKING DETECTOR)
Thư viện yêu cầu: numpy, pandas, matplotlib
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

def generate_mock_adas_telemetry(duration_sec=60, sample_rate_hz=100):
    """Tạo bộ dữ liệu mô phỏng chính xác hành vi xe gặp lỗi phanh giật tại giây thứ 25"""
    n_samples = duration_sec * sample_rate_hz
    time = np.linspace(0, duration_sec, n_samples)
    
    # 1. Tốc độ xe: Duy trì 80 km/h, tại giây 25 phanh tụt xuống 45 km/h
    speed = np.full(n_samples, 80.0)
    
    # 2. Gia tốc dọc: Bình thường dao động quanh 0 +- 0.2 m/s^2
    accel = np.random.normal(0.0, 0.1, n_samples)
    
    # 3. Kênh Camera: Luôn báo 0 vật thể (Đường thông thoáng)
    cam_objects = np.zeros(n_samples)
    
    # 4. Kênh Radar: Bình thường báo vô cùng (200m), tại giây 25 bị nhiễu nhảy về 8m
    radar_range = np.full(n_samples, 200.0)
    
    # Tạo sự kiện Phanh Giật Oan tại t = 25s kéo dài 1.2s
    event_start = int(25.0 * sample_rate_hz)
    event_end = int(26.2 * sample_rate_hz)
    
    # Radar bị lóa sóng đa tạp
    radar_range[event_start:event_end] = np.linspace(15.0, 5.0, event_end - event_start)
    
    # Hệ thống ra lệnh phanh cực đại
    accel[event_start:event_end] = -7.5 # Phanh giật -7.5 m/s^2 (-0.76g)
    
    # Tốc độ xe sụt giảm
    for i in range(event_start, n_samples):
        speed[i] = max(40.0, speed[i-1] + accel[i-1] * 0.01 * 3.6)

    df = pd.DataFrame({
        'Time_s': time,
        'Speed_kmh': speed,
        'Accel_mps2': accel,
        'Cam_Obj_Count': cam_objects,
        'Radar_Range_m': radar_range
    })
    return df

def detect_and_plot_phantom_braking(df, threshold_accel=-5.0):
    """Quét dữ liệu tìm sự cố và vẽ biểu đồ 3 tầng đối soát"""
    # Tìm các điểm vi phạm
    violation_mask = (df['Accel_mps2'] < threshold_accel) & (df['Cam_Obj_Count'] == 0)
    violation_indices = df[violation_mask].index

    if len(violation_indices) == 0:
        print("[PASS] Không phát hiện hiện tượng phanh giật.")
        return

    # Lấy thời điểm bắt đầu sự kiện
    event_time = df.loc[violation_indices[0], 'Time_s']
    print(f"[CẢNH BÁO LỖI] Đã phát hiện Phanh Giật Oan tại thời điểm: t = {event_time:.2f} giây!")

    # Cắt cửa sổ dữ liệu +- 5 giây quanh sự kiện để vẽ biểu đồ
    window_df = df[(df['Time_s'] >= event_time - 5.0) & (df['Time_s'] <= event_time + 5.0)]

    # Vẽ biểu đồ đối soát 3 tầng
    fig, axes = plt.subplots(3, 1, figsize=(12, 8), sharex=True)
    plt.suptitle(f"BẰNG CHỨNG ĐIỀU TRA LỖI PHANH GIẬT OAN TẠI t = {event_time:.2f}s", fontsize=14, fontweight='bold', color='darkred')

    # Tầng 1: Vận tốc xe
    axes[0].plot(window_df['Time_s'], window_df['Speed_kmh'], color='blue', linewidth=2, label='Vận tốc xe EGO (km/h)')
    axes[0].set_ylabel("Tốc độ (km/h)")
    axes[0].grid(True, linestyle='--', alpha=0.6)
    axes[0].legend(loc='upper right')

    # Tầng 2: Gia tốc phanh dọc & Đường ngưỡng nguy hiểm
    axes[1].plot(window_df['Time_s'], window_df['Accel_mps2'], color='red', linewidth=2, label='Gia tốc dọc (m/s²)')
    axes[1].axhline(threshold_accel, color='black', linestyle=':', linewidth=1.5, label=f'Ngưỡng vi phạm ({threshold_accel} m/s²)')
    axes[1].set_ylabel("Gia tốc (m/s²)")
    axes[1].grid(True, linestyle='--', alpha=0.6)
    axes[1].legend(loc='lower right')

    # Tầng 3: Đối soát Radar vs Camera
    axes[2].plot(window_df['Time_s'], window_df['Radar_Range_m'], color='purple', linewidth=2, label='Radar Target Range (m)')
    axes[2].plot(window_df['Time_s'], window_df['Cam_Obj_Count'] * 50, color='green', linestyle='--', label='Camera Object Exists (0=No)')
    axes[2].set_ylabel("Cự ly Mục tiêu (m)")
    axes[2].set_xlabel("Thời gian ghi đo (Giây)")
    axes[2].grid(True, linestyle='--', alpha=0.6)
    axes[2].legend(loc='upper right')

    # Đánh dấu vùng xảy ra lỗi
    for ax in axes:
        ax.axvspan(event_time, event_time + 1.2, color='orange', alpha=0.25)

    plt.tight_layout()
    plt.savefig("phantom_braking_evidence.png", dpi=300)
    print("--> Đã tạo và xuất biểu đồ bằng chứng kỹ thuật: phantom_braking_evidence.png")

if __name__ == "__main__":
    df_telemetry = generate_mock_adas_telemetry()
    detect_and_plot_phantom_braking(df_telemetry)
```

---

## 3. CÁCH DIỄN GIẢI ĐỒ THỊ BẰNG CHỨNG TRONG BÁO CÁO LỖI (BUG REPORT)

Khi đính kèm hình ảnh này vào báo cáo sự cố (Defect Report):
1. **Tại tầng 1:** Tốc độ xe sụt giảm đột ngột từ $80\text{ km/h} \rightarrow 55\text{ km/h}$.
2. **Tại tầng 2:** Gia tốc dọc vượt qua ngưỡng nguy hiểm (rơi xuống $-7.5\text{ m/s}^2$).
3. **Tại tầng 3 (Bằng chứng mấu chốt):** 
   - Đường màu tím (Radar) đột ngột sụt từ $200\text{m} \rightarrow 8\text{m}$ do phản xạ ảo.
   - Đường màu xanh lá (Camera) vẫn ở mức $0$ (khẳng định không có xe nào phía trước).
   - $\Rightarrow$ **Kết luận:** Lỗi xảy ra do thuật toán dung hợp cảm biến (Sensor Fusion) không có bộ lọc xác thực chéo (Cross-validation gating), dẫn đến quyết định phanh đơn phương từ cảm biến radar.
