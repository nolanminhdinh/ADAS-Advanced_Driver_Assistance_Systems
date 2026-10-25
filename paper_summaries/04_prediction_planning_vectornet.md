# BÁO CÁO PHÂN TÍCH HỌC THUẬT: VectorNet
> **Chuyên đề:** Dự đoán Quỹ đạo Chuyển động (Motion Prediction) & Biểu diễn Bản đồ HD Vector  
> **Người biên soạn:** Chuyên viên Biên soạn & Phân tích Tài liệu Khoa học Công nghệ ADAS

---

## 1. THÔNG TIN ĐỊNH DANH BÀI BÁO (METADATA)

- **Tên bài báo gốc:** *VectorNet: Encoding HD Maps and Agent Dynamics from Vectorized Representation*
- **Tác giả:** Jiyang Gao, Chen Sun, Hang Zhao, Yi Shen, Dragomir Anguelov, Congcong Li, Cordelia Schmid
- **Đơn vị nghiên cứu:** Waymo LLC & Google Research
- **Hội nghị xuất bản:** IEEE/CVF Conference on Computer Vision and Pattern Recognition (**CVPR 2020**)
- **Mã nguồn cộng đồng & Triển khai mở:** [Argoverse Forecast Framework / VectorNet PyTorch](https://github.com/xk-huang/yet-another-vectornet)

---

## 2. TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)

**VectorNet** là công trình tiên phong của Waymo làm thay đổi hoàn toàn cách thức biểu diễn bản đồ độ nét cao (HD Map) và hành vi của các phương tiện xung quanh trong bài toán dự đoán quỹ đạo (Motion Prediction). Trước VectorNet, các kỹ sư buộc phải vẽ (rasterize) bản đồ đường sá và lịch sử di chuyển của xe cộ thành các bức ảnh màu mắt chim (Rasterized BEV Images) rồi dùng mạng tích chập 2D CNN (như ResNet-50) để xử lý. Cách làm cũ này gây lãng phí bộ nhớ khủng khiếp và làm mất tính chất hình học không gian. VectorNet đề xuất biểu diễn toàn bộ thực thể (vạch kẻ đường, làn xe, lối sang đường, vết quỹ đạo xe) thành **tập hợp các vector đường gấp khúc (polylines)** và xây dựng một **mạng đồ thị nơ-ron hai tầng (Hierarchical Graph Neural Network)**. Phương pháp này giảm **hơn 70% khối lượng tính toán FLOPs**, giảm dung lượng mô hình hàng chục lần mà vẫn tăng đáng kể độ chính xác dự đoán quỹ đạo.

---

## 3. BỐI CẢNH & ĐIỂM NGHẼN KỸ THUẬT (PROBLEM FORMULATION)

### 3.1. Hạn chế chí mạng của phương pháp Rasterization truyền thống
1. **Tiêu tốn bộ nhớ và tính toán vô ích (Computational Inefficiency):**
   - Để mô tả khu vực ngã tư rộng $100\text{ m} \times 100\text{ m}$ với độ phân giải $0.1\text{ m/pixel}$, hệ thống phải render ra một bức ảnh lưới $1000 \times 1000$ pixels với hàng chục kênh màu (RGB channels cho vạch kẻ, làn rẽ, đèn giao thông, lịch sử vị trí).
   - Phần lớn diện tích trên bức ảnh này là **khoảng trống vô nghĩa** (bãi cỏ, mặt đường trống), nhưng mạng 2D CNN vẫn phải thực hiện phép nhân chập tốn kém trên từng pixel rỗng đó.
2. **Hạn chế về tầm nhìn tiếp nhận (Limited Receptive Field):**
   - Trên cao tốc, phương tiện chạy với vận tốc 100 km/h cần quan sát và dự đoán trước hàng trăm mét. Các mạng CNN tiêu chuẩn có trường tiếp nhận (receptive field) giới hạn bằng kích thước kernel, rất khó bắt được tương tác giữa hai xe cách xa nhau nếu không tăng độ sâu của mạng lên mức không thể chạy thời gian thực.
3. **Mất mát thông tin cấu trúc liên tục (Loss of Topological Invariance):**
   - Khi chuyển một đường cong vector mượt mà thành các pixel rời rạc, các thuộc tính topo (như hướng xe chạy, quyền ưu tiên, thứ tự điểm nối tiếp) bị vỡ nét và méo mó.

---

## 4. PHƯƠNG PHÁP LUẬN & KIẾN TRÚC THUẬT TOÁN (METHODOLOGY)

### 4.1. Sơ đồ Kiến trúc Đồ thị Hai tầng (Hierarchical GNN)

```
+-----------------------------------------------------------------------------------------+
|                                KIẾN TRÚC VECTORNET (WAYMO)                              |
+-----------------------------------------------------------------------------------------+

  [Dữ liệu Đầu vào Đã Vector hóa]
  ├── HD Map: Vạch kẻ làn, tim đường, vạch đi bộ ──> Chia thành chuỗi Polyline P_i
  └── Agents: Lịch sử tọa độ các xe xung quanh ────> Chuỗi Polyline quỹ đạo P_j
                                   |
                                   v
  +---------------------------------------------------------------------------------------+
  | TẦNG 1: SUBGRAPH MÃ HÓA CỤC BỘ (LOCAL POLYLINE SUBGRAPHS)                             |
  |  - Mỗi polyline P = {v_1, v_2, ..., v_k} gồm các vector con nối tiếp nhau             |
  |  - Vector thuộc tính: v = [d_start, d_end, a, j] (tọa độ, loại thực thể, chỉ số)      |
  |  - Sử dụng mạng PointNet/MLP + Max-Pooling để mã hóa đặc trưng cục bộ:                |
  |    p_i = Subgraph(P_i)  (Gom thành 1 vector duy nhất đại diện cho cả đoạn polyline)    |
  +---------------------------------------------------------------------------------------+
                                   |
                                   v
  +---------------------------------------------------------------------------------------+
  | TẦNG 2: ĐỒ THỊ TƯƠNG TÁC TOÀN CỤC (GLOBAL FULLY-CONNECTED GRAPH)                      |
  |  - Các nút đồ thị chính là các vector polyline {p_1, p_2, ..., p_M}                   |
  |  - Sử dụng cơ chế Self-Attention (Transformer Layer) cho toàn bộ các nút tương tác:   |
  |    Node tương tác không phụ thuộc khoảng cách không gian (khoảng cách O(1))           |
  |  - Nhúng thông tin quan hệ giữa Xe - Xe, Xe - Làn đường, Xe - Đèn tín hiệu             |
  +---------------------------------------------------------------------------------------+
                                   |
                                   v
  [Khối Đầu ra: Giải mã Dự đoán Quỹ đạo (Trajectory Decoder)]
  - Dự đoán tọa độ tương lai của xe chủ và các xe xung quanh trong 3-5 giây tới:
    Y = {(x_t, y_t)}_{t=1}^T kèm độ bất định (Gaussian Mixture / Multi-modal Trajectories)
```

### 4.2. Vector hóa Thực thể (Entity Vectorization)
Mỗi phân đoạn vector (vector segment) $v_i$ trong một polyline được tham số hóa thành:
$$v_i = \left[ d_i^s, d_i^e, a_i, j_i \right]$$
Trong đó:
- $d_i^s, d_i^e \in \mathbb{R}^2$: Tọa độ điểm bắt đầu và điểm kết thúc của vector trong hệ quy chiếu xe chủ (Ego-centric coordinate).
- $a_i \in \mathbb{R}^k$: Thuộc tính ngữ nghĩa (ví dụ: cấm vượt, nét đứt, màu vàng, giới hạn tốc độ, loại xe sedan hay xe tải).
- $j_i$: Chỉ số thứ tự của đoạn vector trong chuỗi polyline.

### 4.3. Đồ thị Toàn cục với Cơ chế Tự chú ý (Global Self-Attention)
Sau khi mỗi polyline được nén thành một vector đặc trưng $p_i \in \mathbb{R}^C$, tầng toàn cục xem mỗi polyline như một nút trong đồ thị liên thông đầy đủ:
$$p_i^{(l+1)} = \text{Softmax}\left(\frac{(p_i^{(l)} W_Q)(P^{(l)} W_K)^T}{\sqrt{d_k}}\right) (P^{(l)} W_V)$$
Nhờ cơ chế này, một chiếc xe tải ở cách xa 80m đang chuẩn bị chuyển làn có thể trực tiếp truyền tín hiệu chú ý (attention weight) đến xe tự hành trong một phép tính duy nhất mà không bị giới hạn bởi kích thước kernel CNN.

---

## 5. KẾT QUẢ THỰC NGHIỆM & ĐỐI CHUẨN (BENCHMARKS)

Thử nghiệm trên hai tập dữ liệu dự đoán chuyển động lớn nhất thế giới: **Argoverse Motion Forecasting** và **Waymo Motion Benchmark**:

| Phương pháp | Dạng biểu diễn | Khối lượng tính toán (FLOPs) | Dung lượng tham số (Params) | Lỗi lệch điểm cuối (minFDE 3s - m) |
| :--- | :--- | :---: | :---: | :---: |
| ChauffeurNet | Rasterized BEV Image (CNN) | 100% (Baseline) | ~50 MB | 1.82 m |
| IntentNet | Rasterized BEV Image (CNN) | ~85% | ~40 MB | 1.75 m |
| **VectorNet** | **Vector Polyline (GNN)** | **29% (Giảm 71%)** | **3.6 MB (Giảm 90%)** | **1.66 m (Tốt nhất)** |

> **Nhận định chuyên viên:** VectorNet không những vượt trội về độ chính xác dự đoán (giảm sai số lệch vị trí minFDE), mà kỳ tích thực sự nằm ở việc **giảm 71% phép tính FLOPs** và **giảm kích thước bộ nhớ tới 12 lần**.

---

## 6. Ý NGHĨA & ỨNG DỤNG THỰC CHIẾN TRONG NGÀNH XE ADAS

1. **Khả năng dự đoán ý định chuyển làn & cắt đầu (Cut-in / Lane Change):**
   - Trong giao thông hỗn hợp (như tại Việt Nam với lượng xe máy đông đúc thường xuyên len lỏi giữa các làn ô tô), việc biểu diễn quỹ đạo dưới dạng vector giúp máy tính nhận biết ngay lập tức xu hướng góc lái đánh võng của xe máy chỉ sau 200 ms quan sát, từ đó ra lệnh cho hệ thống điều khiển ga/phanh chuẩn bị trước.
2. **Tích hợp bản đồ số điều hướng (Navigation SD & HD Map):**
   - Các định dạng bản đồ chuẩn công nghiệp như OpenDRIVE, Lanelet2 hay Apollo HD Map vốn dĩ được lưu trữ dưới dạng vector tọa độ (WGS84 hoặc UTM). VectorNet cho phép nạp trực tiếp dữ liệu này vào mạng nơ-ron mà không cần qua bước trung gian dựng hình (rendering), giúp tiết kiệm tài nguyên CPU của máy tính điều khiển xe.

---

## 7. ƯU ĐIỂM & ĐIỂM CẦN CẢI TIẾN

- **Ưu điểm:**
  - Tiết kiệm bộ nhớ vượt trội, tính toán nhẹ, dễ dàng nhúng lên các chip ADAS thế hệ mới.
  - Xử lý mượt mà quan hệ hình học xa bất tận mà không làm vỡ cấu trúc không gian.
- **Hạn chế:**
  - Toàn bộ cơ chế dựa trên giả định dữ liệu bản đồ HD hoặc dữ liệu bám vết (tracking) đầu vào đã được lọc sạch. Nếu tầng nhận thức phía trước xuất hiện nhiễu (ví dụ: nhận dạng nhầm một chướng ngại vật ma), đồ thị vector có thể bị sai lệch cấu trúc tương tác.

---

## 8. NGUỒN THAM KHẢO & ĐƯỜNG LINK CHÍNH CHỦ (OFFICIAL REFERENCES)

- **Bài báo chính thức (arXiv):** [VectorNet: Encoding HD Maps and Agent Dynamics from Vectorized Representation (arXiv:2005.04259)](https://arxiv.org/abs/2005.04259)
- **Xuất bản hội nghị chính thức (IEEE/CVF CVPR 2020):** [CVF Open Access - CVPR 2020 Proceedings](https://openaccess.thecvf.com/content_CVPR_2020/html/Gao_VectorNet_Encoding_HD_Maps_and_Agent_Dynamics_From_Vectorized_CVPR_2020_paper.html)
- **Tập dữ liệu chuẩn đối chuẩn:** [Argoverse Motion Forecasting Dataset](https://www.argoverse.org/) & [Waymo Open Dataset](https://waymo.com/open/)
