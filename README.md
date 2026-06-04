# Mori Pilates - Hệ Thống Quản Lý Pilates Studio Chạy Local

Hệ thống quản lý studio Pilates chuyên nghiệp chạy **LOCAL** trên máy tính, tối ưu hóa cho tốc độ, sự đơn giản và không cần phụ thuộc vào cloud ở giai đoạn đầu. Toàn bộ dữ liệu được lưu trữ trực tiếp trên máy tính dưới dạng file SQLite và được tự động sao lưu hàng ngày.

---

## 🚀 Hướng Dẫn Cài Đặt Nhanh

Hãy làm theo các bước sau để chạy ứng dụng trực tiếp trên máy tính của bạn:

### 1. Cài đặt các thư viện (Dependencies)
Mở cửa sổ dòng lệnh (Terminal / Command Prompt) tại thư mục dự án và chạy:
```bash
npm install
```

### 2. Thiết lập Cơ sở dữ liệu SQLite & Tạo dữ liệu mẫu
Chạy lệnh di cư database và khởi tạo dữ liệu ban đầu:
```bash
npx prisma migrate dev --name init
```
*(Lệnh này sẽ tự động chạy tập tin seed dữ liệu demo bao gồm: tài khoản hệ thống, khách hàng mẫu, lịch sử tập và hóa đơn doanh thu).*

### 3. Chạy ứng dụng trên máy local
Khởi động máy chủ phát triển cục bộ:
```bash
npm run dev
```

Sau đó, truy cập đường dẫn sau trên trình duyệt Web:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Tài Khoản Đăng Nhập Mặc Định

Dự án đi kèm 2 tài khoản mẫu phân quyền khác nhau trong cơ sở dữ liệu:

1. **Tài khoản Quản trị (Admin)**:
   * **Tên đăng nhập**: `admin`
   * **Mật khẩu**: `admin123`
   * *Quyền hạn*: Toàn quyền truy cập, thêm mới/xóa tài khoản nhân viên, cấu hình cài đặt hệ thống.

2. **Tài khoản Nhân viên (Staff)**:
   * **Tên đăng nhập**: `staff`
   * **Mật khẩu**: `staff123`
   * *Quyền hạn*: Thao tác check-in, quản lý khách hàng, ghi nhận doanh thu, xem báo cáo (không được thêm/xóa tài khoản nhân viên).

---

## 🌟 Các Tính Năng Cốt Lõi Cho Studio Pilates

### 1. Quản Lý Khách Hàng (Học Viên)
* **CRUD hoàn chỉnh**: Thêm, sửa, xóa học viên trực quan thông qua modal.
* **Tự động hóa**:
  * Tự động tính số buổi còn lại: `Còn lại = Tổng buổi - Đã dùng`.
  * Tự động tạo mã khách hàng tăng dần (`KH0001`, `KH0002`...) nếu để trống.
  * Tự động cập nhật trạng thái gói tập thành `OUT_OF_SESSIONS` (Hết buổi) khi số buổi còn lại chạm 0, hoặc thành `EXPIRED` (Hết hạn) nếu vượt quá hạn dùng.
* **Tìm kiếm & Bộ lọc**:
  * Tìm kiếm nhanh theo Họ tên hoặc SĐT.
  * Bộ lọc trạng thái (Active, Inactive, Expired, Out of Sessions).
  * Bộ lọc cảnh báo đặc biệt: **Sắp hết buổi** (còn ≤ 3 buổi) và **Sắp hết hạn** (hạn dùng còn ≤ 7 ngày) được highlight màu sắc nổi bật.
* **Xuất báo cáo**: Nút xuất toàn bộ danh sách học viên hiện tại ra file Excel/CSV tiếng Việt đầy đủ dấu.

### 2. Ghi Nhận Doanh Thu (Mua/Tái Ký Gói Tập)
* **Quy trình tối giản**: Ghi nhận hóa đơn mua gói tập mới liên kết trực tiếp với dữ liệu khách hàng.
* **Tự động đồng bộ**: Khi ghi nhận doanh thu, gói tập của khách hàng được chọn sẽ tự động đồng bộ hóa: cập nhật tên gói mới, đặt lại số buổi đã dùng = 0, cập nhật ngày mua/kích hoạt và chuyển trạng thái về `ACTIVE`.
* **Tiền ích thông minh**: Tự động tính toán đơn giá/buổi tập từ số tiền và tổng số buổi.
* **Xuất báo cáo**: Bộ lọc theo hình thức thanh toán (Chuyển khoản, Tiền mặt, Thẻ) kèm tổng doanh thu và nút xuất CSV.

### 3. Check-in Điểm Danh Học Viên Đến Tập
* **Giao diện phân làn tiện lợi**:
  * Bên trái: Tìm kiếm nhanh học viên đang kích hoạt gói để check-in.
  * Bên phải: Hiển thị chi tiết số ca còn lại, hạn sử dụng và form check-in nhanh.
* **Tự động tính chi phí**: Lấy giá trị đơn giá thực tế của buổi tập từ lịch sử mua gói của khách hàng để điền vào lịch sử dạy của HLV.
* **Đồng bộ hóa**: Khi nhấn Check-in, số buổi đã dùng tăng 1, số buổi còn lại giảm 1. Nếu số buổi còn lại về 0, trạng thái học viên tự động chuyển thành `OUT_OF_SESSIONS`. Cập nhật ngày kích hoạt nếu là buổi đầu tiên.
* **Phân bổ HLV**: Chọn nhanh HLV phụ trách ca dạy (HLV Hana, Ryan, Chloe hoặc tự nhập tên HLV khác).

### 4. Lịch Sử & Thống Kê (Nhật ký Điểm danh)
* Hiển thị chi tiết thời gian ra vào, tên học viên, gói tập sử dụng, HLV phụ trách và ghi chú sức khỏe của buổi tập.
* **Hủy ca check-in**: Nếu nhân viên check-in nhầm, có thể nhấn nút Hủy để thu hồi. Hệ thống sẽ xóa lịch sử đồng thời **hoàn lại +1 buổi tập** vào gói của học viên và tự động khôi phục trạng thái hoạt động (`ACTIVE`) nếu học viên đang bị khóa do hết buổi.
* Xuất CSV lịch sử điểm danh của học viên.

### 5. Dashboard Trực Quan
* Biểu đồ **Xu hướng doanh thu phát sinh hàng ngày** trong tháng (Area Chart Recharts).
* Biểu đồ **Hiệu suất giảng dạy của HLV** (Bar Chart Recharts) thống kê số ca đã dạy.
* Thống kê KPI: Tổng doanh thu tháng, tổng khách hàng đang hoạt động, tổng số ca đã tập, số cảnh báo cần gia hạn gấp.
* Bảng xếp hạng: Top 5 học viên tập nhiều nhất và Danh sách học viên cần gia hạn gấp.

---

## 💾 Cơ Chế Sao Lưu Tránh Mất Dữ Liệu (Backup)

Vì ứng dụng chạy offline cục bộ trên máy tính của bạn, Mori Pilates được tích hợp cơ chế bảo vệ dữ liệu tối đa:

1. **Auto-Backup hàng ngày**: Khi truy cập vào Dashboard, hệ thống tự động kiểm tra xem ngày hôm nay đã có bản sao lưu chưa. Nếu chưa, ứng dụng tự động copy file database nguồn (`dev.db`) và lưu vào thư mục `/backups` dưới dạng `dev_backup_YYYY_MM_DD.db`.
2. **Chính sách dọn dẹp**: Thư mục `/backups` sẽ tự động giữ lại **7 bản sao lưu mới nhất** để tránh làm đầy bộ nhớ máy tính.
3. **Tải Database trực tiếp**: Trong mục **Cài đặt**, có nút bấm để tải file database (`dev.db`) hiện tại về máy thông qua trình duyệt. Admin có thể tải về để lưu trữ lên Google Drive hoặc cất vào USB hàng tuần.
4. **Quản lý file backup**: Xem danh sách các file backup cục bộ cùng dung lượng và thời gian tạo ngay trong trang Cài đặt.
