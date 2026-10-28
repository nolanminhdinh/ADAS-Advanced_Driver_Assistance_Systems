"""
SCRIPT TẠO BỘ DỮ LIỆU ĐO KIỂM ADAS MẪU CHO BÀI TẬP THỰC HÀNH EXCEL
Mục tiêu: Tạo tệp CSV 'sample_adas_telemetry.csv' mô phỏng kịch bản xe chạy 80 km/h
và gặp sự cố Phanh Giật Oan tại giây thứ 15 để thực hành phân tích trên Excel.
"""

import numpy as np
import pandas as pd

def generate_sample_csv(filename="sample_adas_telemetry.csv", duration_sec=30, sample_rate_hz=50):
    n_samples = duration_sec * sample_rate_hz
    time = np.linspace(0, duration_sec, n_samples)
    
    # Tốc độ xe EGO: Ban đầu chạy 80 km/h
    speed = np.full(n_samples, 80.0)
    
    # Gia tốc dọc: Dao động nhỏ quanh 0 m/s^2
    accel = np.random.normal(0.0, 0.08, n_samples)
    
    # Kênh Camera: Khẳng định đường hoàn toàn vắng xe (0 vật thể)
    cam_detected = np.zeros(n_samples, dtype=int)
    
    # Kênh Radar: Ban đầu quét xa 150m, vận tốc tương đối 0
    radar_distance = np.full(n_samples, 150.0)
    rel_speed = np.zeros(n_samples)
    
    # Tạo sự kiện Phanh Giật Oan từ giây 15.0 đến 16.5
    event_start = int(15.0 * sample_rate_hz)
    event_end = int(16.5 * sample_rate_hz)
    
    # Sóng radar bị nhiễu nhảy về 8m, báo vận tốc tương đối âm mạnh (-20 m/s)
    radar_distance[event_start:event_end] = np.linspace(12.0, 6.0, event_end - event_start)
    rel_speed[event_start:event_end] = -20.0
    
    # Hệ thống tự động phanh gấp
    accel[event_start:event_end] = -7.2 # Phanh giật -7.2 m/s^2
    
    # Vận tốc sụt giảm theo gia tốc phanh
    for i in range(event_start, n_samples):
        speed[i] = max(35.0, speed[i-1] + accel[i-1] * (1.0 / sample_rate_hz) * 3.6)
        
    df = pd.DataFrame({
        'Timestamp_s': np.round(time, 3),
        'Ego_Speed_kmh': np.round(speed, 2),
        'Target_Distance_m': np.round(radar_distance, 2),
        'Target_RelSpeed_mps': np.round(rel_speed, 2),
        'Long_Accel_mps2': np.round(accel, 2),
        'Camera_Obj_Detected': cam_detected
    })
    
    df.to_csv(filename, index=False)
    print(f"--> Đã tạo thành công tệp dữ liệu mẫu: {filename} ({len(df)} dòng)")

if __name__ == "__main__":
    generate_sample_csv()
