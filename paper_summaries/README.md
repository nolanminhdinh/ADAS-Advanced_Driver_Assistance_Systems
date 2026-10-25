# THƯ VIỆN TÓM TẮT BÀI BÁO KHOA HỌC CHUYÊN SÂU: ADAS & XE TỰ HÀNH
> **Biên soạn bởi:** Chuyên viên Biên soạn & Phân tích Tài liệu Khoa học Công nghệ ADAS / Autonomous Driving  
> **Mục tiêu:** Cung cấp tài liệu tổng hợp, phân tích chuyên sâu các công trình nghiên cứu khoa học cốt lõi (Foundational), bước ngoặt (Milestone) và hiện đại nhất (State-of-the-Art) phục vụ quá trình học tập, nghiên cứu và phát triển hệ thống ADAS/AV.

---

## 1. LỘ TRÌNH ĐỌC & DANH MỤC CÁC BÀI BÁO KHOA HỌC TIÊU BIỂU

Các bài báo được tuyển chọn bao phủ toàn diện 5 trụ cột kỹ thuật của một hệ thống ADAS/AV hiện đại: từ **Cảm biến & Thị giác 3D**, **Dung hợp Đa cảm biến**, **Dự đoán Quỹ đạo & Bản đồ Vector**, **Kiến trúc Tự hành Đầu cuối (End-to-End)** cho đến **Mô hình An toàn Toán học**.

```
                           LỘ TRÌNH NGHIÊN CỨU THEO TẦNG KIẾN TRÚC
                           
  [Tầng 1: Cảm biến & Thị giác 3D]
  ├── PointPillars (CVPR 2019)  ──> Xử lý Point Cloud LiDAR thời gian thực ở tần số 62 Hz
  └── BEVFormer (ECCV 2022)     ──> Biến đổi Multi-Camera sang Bird's-Eye-View qua Spatiotemporal Transformer
             │
             ▼
  [Tầng 2: Dung hợp Cảm biến Đa phương thức (Sensor Fusion)]
  └── CenterFusion (WACV 2021)  ──> Dung hợp Radar mmWave + Camera qua Frustum Association cho ADAS L2+
             │
             ▼
  [Tầng 3: Dự đoán Hành vi & Bản đồ HD (Prediction & Planning)]
  └── VectorNet (CVPR 2020)     ──> Biểu diễn HD Map & Trajectory dưới dạng Vector Polyline Graph
             │
             ▼
  [Tầng 4: Hệ thống Tự hành Toàn trình (End-to-End Autonomous Driving)]
  └── UniAD (CVPR 2023 - Best)  ──> Khung kiến trúc Transformer thống nhất hướng tới mục tiêu Lập quỹ đạo
             │
             ▼
  [Tầng 5: Tiêu chuẩn An toàn Toán học & Thẩm định (Safety Verification)]
  └── Mobileye RSS (2017)       ──> Mô hình toán học về an toàn lái xe (nền tảng tiêu chuẩn IEEE 2846)
```

---

## 2. BẢNG DANH MỤC & MA TRẬN PHÂN TÍCH BÀI BÁO

| STT | Tên Bài Báo & Tác Giả | Lĩnh Vực / Tầng Hệ Thống | Điểm Đột Phá Chính (Key Breakthrough) | Bản Tóm Tắt Chi Tiết | Nguồn Gốc Chính Chủ (Official Link) |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **01** | **BEVFormer: Learning Bird's-Eye-View Representation from Multi-Camera Images via Spatiotemporal Transformers**<br>*(Li et al. - ECCV 2022)* | Multi-Camera Perception & BEV Transform | Tạo đặc trưng không gian mắt chim (BEV) thống nhất bằng Spatial Cross-Attention và Temporal Self-Attention mà không cần ước lượng độ sâu tường minh. | [Đọc Tóm Tắt](./01_perception_bevformer.md) | [arXiv:2203.17270](https://arxiv.org/abs/2203.17270) \| [Springer ECCV](https://link.springer.com/chapter/10.1007/978-3-031-19784-0_1) |
| **02** | **PointPillars: Fast Encoders for Object Detection from Point Clouds**<br>*(Lang et al. - CVPR 2019)* | LiDAR 3D Object Detection | Gom cụm Point Cloud thành các cột dọc (pillars) chuyển đổi thành Pseudo-Image 2D, đạt tốc độ xử lý kỷ lục 62 Hz trên GPU nhúng. | [Đọc Tóm Tắt](./02_sensing_pointpillars.md) | [arXiv:1812.05784](https://arxiv.org/abs/1812.05784) \| [CVF Open Access](https://openaccess.thecvf.com/content_CVPR_2019/html/Lang_PointPillars_Fast_Encoders_for_Object_Detection_From_Point_Clouds_CVPR_2019_paper.html) |
| **03** | **CenterFusion: Center-based Radar and Camera Fusion for 3D Object Detection**<br>*(Nabati & Qi - WACV 2021)* | Middle-level Sensor Fusion (Radar + Camera) | Khắc phục nhược điểm góc cao (elevation) của Radar mmWave thông qua hình chóp 3D Frustum, nâng vọt độ chính xác ước tính vận tốc và khoảng cách cho ADAS L2+. | [Đọc Tóm Tắt](./03_sensor_fusion_centerfusion.md) | [arXiv:2011.04841](https://arxiv.org/abs/2011.04841) \| [CVF Open Access](https://openaccess.thecvf.com/content/WACV2021/html/Nabati_CenterFusion_Center-Based_Radar_and_Camera_Fusion_for_3D_Object_Detection_WACV_2021_paper.html) |
| **04** | **VectorNet: Encoding HD Maps and Agent Dynamics from Vectorized Representation**<br>*(Gao et al. - CVPR 2020 / Waymo)* | HD Map & Motion Prediction | Thay thế ảnh lưới raster bằng đồ thị vector hóa (polyline subgraphs + global graph), giảm 70% khối lượng tính toán và bảo toàn nguyên vẹn quan hệ topo hình học. | [Đọc Tóm Tắt](./04_prediction_planning_vectornet.md) | [arXiv:2005.04259](https://arxiv.org/abs/2005.04259) \| [CVF Open Access](https://openaccess.thecvf.com/content_CVPR_2020/html/Gao_VectorNet_Encoding_HD_Maps_and_Agent_Dynamics_From_Vectorized_CVPR_2020_paper.html) |
| **05** | **Planning-oriented Autonomous Driving (UniAD)**<br>*(Hu et al. - CVPR 2023 Best Paper)* | Full-Stack End-to-End Autonomous Driving | Tích hợp toàn bộ chuỗi: Phát hiện, Bám vết, Vẽ bản đồ, Dự đoán chuyển động và Lập quỹ đạo vào một mạng Transformer thống nhất định hướng an toàn. | [Đọc Tóm Tắt](./05_end_to_end_uniad.md) | [arXiv:2212.10156](https://arxiv.org/abs/2212.10156) \| [CVF Open Access](https://openaccess.thecvf.com/content/CVPR2023/html/Hu_Planning-Oriented_Autonomous_Driving_CVPR_2023_paper.html) |
| **06** | **On a Formal Model of Safe and Scalable Self-driving Cars (Mobileye RSS)**<br>*(Shalev-Shwartz et al. - 2017)* | Formal Safety Model & Decision Verification | Định nghĩa toán học chặt chẽ về khoảng cách an toàn dọc/ngang và phản xạ phòng ngừa tai nạn, nền tảng của chuẩn an toàn công nghiệp IEEE 2846. | [Đọc Tóm Tắt](./06_safety_model_mobileye_rss.md) | [arXiv:1708.06374](https://arxiv.org/abs/1708.06374) \| [Mobileye RSS Portal](https://www.mobileye.com/opinion/responsibility-sensitive-safety-rss/) |

---

## 3. CẤU TRÚC CHUẨN CỦA MỖI BẢN TÓM TẮT BÀI BÁO

Mỗi tài liệu tóm tắt trong thư mục này được xây dựng theo chuẩn phân tích học thuật công nghiệp khắt khe, bao gồm 8 phần mục:

1. **Thông tin Định danh Bài báo (Metadata):** Tên gốc, tác giả, viện nghiên cứu/hãng công nghệ, hội nghị xuất bản, năm, liên kết chính thống.
2. **Tóm tắt Điều hành (Executive Summary):** Cô đọng bản chất kỹ thuật, bài toán và thành tựu trong 3-4 câu.
3. **Bối cảnh & Điểm nghẽn Kỹ thuật (Motivation & Problem Formulation):** Tại sao phương pháp truyền thống thất bại? Thách thức thực tế trên xe hơi là gì?
4. **Phương pháp luận & Kiến trúc Thuật toán (Methodology & Architecture):** Phân tích từng module, sơ đồ luồng dữ liệu (Dataflow Diagram), công thức toán học và hàm mất mát (Loss Function).
5. **Kết quả Thực nghiệm & Đối chuẩn (Benchmarks & Quantitative Results):** Các chỉ số đo lường (mAP, NDS, latency FPS, lỗi quỹ đạo minADE/minFDE) trên các bộ dữ liệu lớn (nuScenes, KITTI, Waymo Open Dataset).
6. **Giá trị Ứng dụng Thực chiến trong Ngành Xe:** Cách thức triển khai trên vi điều khiển nhúng ô tô (Nvidia DRIVE Orin, Mobileye EyeQ, TI TDA4), mối liên hệ với các hệ thống ADAS của VinFast, Tesla, Mercedes-Benz.
7. **Ưu điểm & Thách thức Mở (Strengths & Open Challenges):** Góc nhìn phản biện kỹ thuật về giới hạn tính toán, rủi ro an toàn và các điểm có thể tối ưu thêm.
8. **Nguồn Tham Khảo & Đường Link Chính Chủ (Official References):** Đường dẫn trực tiếp đến bài báo gốc (arXiv, IEEE, CVF, Springer), mã nguồn chính thức (Official GitHub Repo) và Project Page.

---

## 4. HƯỚNG DẪN PHƯƠNG PHÁP ĐỌC BÀI BÁO KHOA HỌC CHO KỸ SƯ ADAS

Để tiếp thu tối đa kiến thức kỹ thuật từ các bài báo này, khuyến nghị kỹ sư áp dụng **Kỹ thuật đọc 3 bước (The Three-Pass Approach - S. Keshav)**:

- **Bước 1 (Lướt nhanh - 10 phút):** Đọc phần *Executive Summary*, *Problem Formulation*, và *Sơ đồ Kiến trúc tổng quan* để nắm được bức tranh lớn và vị trí của bài báo trong chuỗi hệ thống xe.
- **Bước 2 (Đi sâu kỹ thuật - 1 tiếng):** Đọc kỹ phần *Phương pháp luận*, các công thức biến đổi hình học / tensor, và đối chiếu với bảng kết quả thực nghiệm. Ghi chú lại các giả định (assumptions) mà tác giả đặt ra.
- **Bước 3 (Tư duy thực thi - 2 tiếng):** Đọc phần *Ứng dụng thực chiến*, truy cập vào mã nguồn chính thức của bài báo (Official GitHub) để xem cách họ hiện thực hóa các lớp mạng nơ-ron (PyTorch/CUDA C++), và suy nghĩ cách porting sang phần cứng nhúng ô tô (TensorRT, quantization INT8).
