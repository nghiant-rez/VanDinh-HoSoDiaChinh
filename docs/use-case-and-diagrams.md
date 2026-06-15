# Use Case Diagram và Use Case Specification

Hệ thống Quản lý Hồ sơ Đất đai Vạn Đình

---

## 1. Nguyên tắc thiết kế

Tài liệu này tuân theo hai bài hướng dẫn của ThinhNotes:

- Use Case mô tả tương tác giữa actor và hệ thống
  trong một phạm vi cụ thể, nhằm đạt mục tiêu cụ thể
  của người dùng.
- Actor là người dùng hoặc hệ thống bên ngoài có
  tương tác với hệ thống. Thành phần nội bộ như
  database, local storage, module xử lý file không
  vẽ như actor.
- Tên actor dùng danh từ chỉ vai trò.
  Tên use case dùng dạng ngắn gọn: `Động từ + Danh từ`.
- Tránh biến use case diagram thành cây phân rã chức
  năng hoặc danh sách CRUD.
- Khi có CRUD theo phân quyền, mô tả ở Business Rules
  hoặc Role Matrix thay vì vẽ thành nhiều use case nhỏ.
- Diagram phải có system boundary rõ ràng, use case có
  ID, đường nối không rối.
- Đặc tả use case dùng cấu trúc:
  Summary, Flow, Additional Information.
- **Alternative Flow** là luồng khác nhưng vẫn thành công.
- **Exception Flow** là luồng làm use case thất bại.

> [!NOTE]
> Nguồn tham khảo:
> - https://thinhnotes.com/chuyen-nghe-ba/use-case-diagram-va-5-sai-lam-thuong-gap/
> - https://thinhnotes.com/chuyen-nghe-ba/viet-dac-ta-use-case-sao-don-gian-nhung-hieu-qua/

---

## 2. Phạm vi hệ thống

Hệ thống phục vụ cán bộ xã trong việc lưu trữ và tra
cứu hồ sơ đất đai. Hệ thống chạy local trên một máy,
không phát sinh chi phí dịch vụ ngoài.

Phạm vi hiện tại:

- Nhiều tài khoản, 2 nhóm quyền: `Admin` và `Staff`.
- `Admin` có toàn quyền.
- `Staff` chủ yếu tra cứu, xem, xuất/in theo quyền
  được cấp.
- Hồ sơ không có trạng thái xử lý.
- Không có phê duyệt, ký điện tử, thanh toán,
  thông báo hoặc giao việc.
- Hồ sơ giấy lưu theo vị trí vật lý:
  `Kho -> Kệ -> Tầng -> Hộp số`.
- Hệ thống hỗ trợ bản đồ số: import, đánh chỉ mục,
  tìm thửa đất, export.
- Hệ thống xuất PDF và hỗ trợ in.
- Hệ thống lưu biến động hồ sơ cũ - mới.
- Hệ thống đối chiếu phiên bản scan và bản đồ số.
- Hệ thống có dashboard và log đầy đủ.

---

## 3. Actor

| Actor | Mô tả |
| --- | --- |
| Admin | Cán bộ quản trị hệ thống. Nhập và chỉnh dữ liệu, thiết lập tài khoản, import/export dữ liệu, xem dashboard và log. |
| Staff | Cán bộ tra cứu hồ sơ. Xem bản đồ, xem vị trí lưu hồ sơ giấy, xuất PDF hoặc in kết quả được phép xem. |

> [!NOTE]
> `Local Database`, file scan, bản đồ số, module import/export
> là thành phần bên trong hệ thống nên không đưa vào actor.

---

## 4. Danh sách Use Case

| ID | Use Case Name | Actor chính | Mục tiêu |
| --- | --- | --- | --- |
| UC-01 | Đăng nhập hệ thống | Admin, Staff | Người dùng truy cập hệ thống với đúng quyền. |
| UC-02 | Thiết lập tài khoản cán bộ | Admin | Admin tạo tài khoản và gán quyền. |
| UC-03 | Lưu hồ sơ giấy | Admin | Admin lưu thông tin hồ sơ và vị trí lưu vật lý. |
| UC-04 | Nhập bản đồ số | Admin | Admin import dữ liệu bản đồ và đánh chỉ mục thửa đất. |
| UC-05 | Tra cứu hồ sơ | Admin, Staff | Người dùng tìm hồ sơ bằng thông tin hành chính, thửa đất hoặc vị trí lưu. |
| UC-06 | Tìm thửa đất trên bản đồ | Admin, Staff | Người dùng tìm và xem thửa đất trên bản đồ số. |
| UC-07 | Xuất dữ liệu hồ sơ | Admin, Staff | Người dùng xuất PDF, in hồ sơ hoặc export dữ liệu được phép. |
| UC-08 | Ghi nhận biến động hồ sơ | Admin | Admin liên kết hồ sơ cũ và hồ sơ mới để lưu lịch sử biến động. |
| UC-09 | Đối chiếu scan và bản đồ số | Admin, Staff | Người dùng so sánh dữ liệu scan với dữ liệu bản đồ số. |
| UC-10 | Theo dõi hoạt động hệ thống | Admin | Admin xem dashboard và log thao tác. |

---

## 5. Use Case Diagram - Hướng dẫn vẽ tay

Diagram được thiết kế theo tinh thần ThinhNotes:

- Giữ 10 use case, không rối nùi.
- Có system boundary và sub-boundary rõ ràng.
- Có Use Case ID trong hình oval.
- Không vẽ Include/Extend vì chưa cần thiết
  (hệ thống nhỏ, 2 actor, không có quan hệ bắt buộc
  hay mở rộng rõ ràng giữa các UC).
- Không rã CRUD thành nhiều UC nhỏ.
  Quyền thao tác mô tả trong Role Matrix (Section 7).

### Bố cục

```
Actor bên trái: Admin (hình người)
Actor bên phải: Staff (hình người)

System Boundary (hình chữ nhật lớn):
  "Hệ thống Quản lý Hồ sơ Đất đai Vạn Đình"

Bên trong system boundary, chia 4 nhóm nhỏ
(sub-boundary), mỗi nhóm là 1 hình chữ nhật
có tên nhóm.
```

### Nhóm 1: Tài khoản

```
+---------------------------+
|       Tài khoản           |
|                           |
|  (UC-01)                  |
|  Đăng nhập hệ thống      |
|                           |
|  (UC-02)                  |
|  Thiết lập tài khoản      |
|  cán bộ                   |
+---------------------------+
```

### Nhóm 2: Hồ sơ lưu trữ

```
+---------------------------+
|     Hồ sơ lưu trữ        |
|                           |
|  (UC-03)                  |
|  Lưu hồ sơ giấy          |
|                           |
|  (UC-05)                  |
|  Tra cứu hồ sơ           |
|                           |
|  (UC-07)                  |
|  Xuất dữ liệu hồ sơ     |
+---------------------------+
```

### Nhóm 3: Bản đồ số

```
+---------------------------+
|       Bản đồ số           |
|                           |
|  (UC-04)                  |
|  Nhập bản đồ số          |
|                           |
|  (UC-06)                  |
|  Tìm thửa đất trên       |
|  bản đồ                  |
|                           |
|  (UC-09)                  |
|  Đối chiếu scan và       |
|  bản đồ số               |
+---------------------------+
```

### Nhóm 4: Biến động và giám sát

```
+---------------------------+
|  Biến động và giám sát    |
|                           |
|  (UC-08)                  |
|  Ghi nhận biến động       |
|  hồ sơ                   |
|                           |
|  (UC-10)                  |
|  Theo dõi hoạt động       |
|  hệ thống                |
+---------------------------+
```

### Kết nối (Communication Link)

Mỗi đường nối là 1 đường thẳng từ actor đến use case.
Không dùng mũi tên (UML chuẩn dùng đường thẳng).

**Admin** kết nối đến:

- UC-01, UC-02, UC-03, UC-04, UC-05
- UC-06, UC-07, UC-08, UC-09, UC-10

**Staff** kết nối đến:

- UC-01, UC-05, UC-06, UC-07, UC-09

> [!TIP]
> **Mẹo vẽ theo ThinhNotes:**
> - Đặt Admin bên trái, Staff bên phải để tránh
>   đường nối bắt chéo.
> - Kích cỡ tất cả use case (hình oval) phải như nhau.
> - Nên tô màu nền cho các nhóm sub-boundary để
>   diagram sáng sủa hơn.
> - Đánh dấu Use Case ID ngay trên hình oval.

---

## 6. Use Case Specification

### UC-01 - Đăng nhập hệ thống

#### Summary

| Mục | Nội dung |
| --- | --- |
| Use Case ID | UC-01 |
| Use Case Name | Đăng nhập hệ thống |
| Description | Là người dùng nội bộ, tôi muốn đăng nhập hệ thống để sử dụng các chức năng đúng với quyền được cấp. |
| Actor(s) | Admin, Staff |
| Priority | Must Have |
| Trigger | Người dùng mở hệ thống và thực hiện lệnh đăng nhập. |
| Pre-Condition(s) | Tài khoản đã tồn tại; tài khoản đang hoạt động; hệ thống local sẵn sàng. |
| Post-Condition(s) | Người dùng đăng nhập thành công; hệ thống ghi log đăng nhập; giao diện hiển thị theo quyền. |

#### Flow

**Basic Flow:**

1. Người dùng mở màn hình đăng nhập.
2. Người dùng nhập tài khoản và mật khẩu.
3. Người dùng chọn lệnh đăng nhập.
4. Hệ thống xác thực tài khoản hợp lệ.
5. Hệ thống xác định quyền `Admin` hoặc `Staff`.
6. Hệ thống ghi log đăng nhập thành công.
7. Hệ thống chuyển người dùng vào màn hình chính.

**Alternative Flow:**

- **5a.** Người dùng có quyền `Staff`.
  - 5a1. Hệ thống chỉ hiển thị các chức năng tra cứu,
    xem, xuất/in được phép.
  - Use Case tiếp tục bước 6.

**Exception Flow:**

- **4b.** Hệ thống xác thực tài khoản không thành công.
  - 4b1. Hệ thống hiển thị thông báo sai tài khoản
    hoặc mật khẩu.
  - Use Case dừng lại.

- **4c.** Tài khoản đã bị khóa.
  - 4c1. Hệ thống thông báo tài khoản không được phép
    đăng nhập.
  - Use Case dừng lại.

#### Additional Information

**Business Rules:**

- BR-01: Hệ thống chỉ có 2 quyền chính: `Admin` và
  `Staff`.
- BR-02: `Staff` không được truy cập chức năng
  nhập/sửa/xóa dữ liệu gốc.

**Non-Functional Requirements:**

- NFR-01: Hệ thống đăng nhập được khi chạy local,
  không cần internet.
- NFR-02: Mật khẩu phải được lưu dạng hash.

---

### UC-02 - Thiết lập tài khoản cán bộ

#### Summary

| Mục | Nội dung |
| --- | --- |
| Use Case ID | UC-02 |
| Use Case Name | Thiết lập tài khoản cán bộ |
| Description | Là Admin, tôi muốn thiết lập tài khoản cán bộ để mỗi người dùng truy cập hệ thống đúng quyền. |
| Actor(s) | Admin |
| Priority | Must Have |
| Trigger | Có cán bộ cần được cấp mới, sửa hoặc khóa tài khoản. |
| Pre-Condition(s) | Admin đã đăng nhập; người dùng cần thiết lập đã được xác định. |
| Post-Condition(s) | Tài khoản cán bộ được lưu với quyền phù hợp; hệ thống ghi log thao tác. |

#### Flow

**Basic Flow:**

1. Admin mở màn hình tài khoản cán bộ.
2. Hệ thống hiển thị danh sách tài khoản hiện có.
3. Admin chọn lệnh thêm tài khoản.
4. Admin nhập thông tin cán bộ.
5. Admin chọn quyền `Admin` hoặc `Staff`.
6. Admin lưu tài khoản.
7. Hệ thống kiểm tra dữ liệu hợp lệ.
8. Hệ thống tạo tài khoản và ghi log.
9. Hệ thống hiển thị tài khoản mới trong danh sách.

**Alternative Flow:**

- **3a.** Admin chọn một tài khoản có sẵn.
  - 3a1. Hệ thống hiển thị thông tin tài khoản.
  - 4a. Admin chỉnh thông tin, đổi quyền hoặc
    khóa/mở tài khoản.
  - Use Case tiếp tục bước 6.

**Exception Flow:**

- **7b.** Tên đăng nhập bị trùng.
  - 7b1. Hệ thống hiển thị lỗi trùng tài khoản.
  - Use Case dừng lại.

- **7c.** Admin bỏ trống thông tin bắt buộc.
  - 7c1. Hệ thống hiển thị lỗi thiếu dữ liệu.
  - Use Case dừng lại.

#### Additional Information

**Business Rules:**

- BR-03: Chỉ Admin được thiết lập tài khoản cán bộ.
- BR-04: Quyền hệ thống giữ đơn giản, không phát sinh
  nhóm quyền ngoài `Admin` và `Staff` nếu chưa được
  nghiệm thu lại.

**Non-Functional Requirements:**

- NFR-03: Màn hình tài khoản phải đơn giản, dễ thao
  tác cho cán bộ xã.

---

### UC-03 - Lưu hồ sơ giấy

#### Summary

| Mục | Nội dung |
| --- | --- |
| Use Case ID | UC-03 |
| Use Case Name | Lưu hồ sơ giấy |
| Description | Là Admin, tôi muốn lưu thông tin hồ sơ và vị trí lưu vật lý để cán bộ tìm lại hồ sơ giấy nhanh chóng. |
| Actor(s) | Admin |
| Priority | Must Have |
| Trigger | Có hồ sơ giấy cần đưa vào hệ thống lưu trữ. |
| Pre-Condition(s) | Admin đã đăng nhập; hồ sơ có thông tin nhận diện tối thiểu. |
| Post-Condition(s) | Hồ sơ được lưu kèm vị trí `Kho -> Kệ -> Tầng -> Hộp số`; hệ thống ghi log. |

#### Flow

**Basic Flow:**

1. Admin mở màn hình lưu hồ sơ.
2. Admin nhập thông tin nhận diện hồ sơ.
3. Admin nhập thông tin thửa đất nếu có.
4. Admin chọn vị trí lưu: kho, kệ, tầng, hộp số.
5. Admin đính kèm bản scan nếu có.
6. Admin lưu hồ sơ.
7. Hệ thống kiểm tra dữ liệu bắt buộc.
8. Hệ thống lưu hồ sơ và vị trí vật lý.
9. Hệ thống ghi log tạo hồ sơ.

**Alternative Flow:**

- **5a.** Hồ sơ chưa có file scan.
  - 5a1. Hệ thống cho phép lưu hồ sơ và đánh dấu
    chưa có bản scan.
  - Use Case tiếp tục bước 6.

**Exception Flow:**

- **7b.** Thiếu vị trí lưu vật lý.
  - 7b1. Hệ thống hiển thị lỗi thiếu vị trí lưu.
  - Use Case dừng lại.

- **7c.** Hồ sơ trùng mã/số nhận diện.
  - 7c1. Hệ thống cảnh báo trùng hồ sơ.
  - Use Case dừng lại.

#### Additional Information

**Business Rules:**

- BR-05: Mỗi hồ sơ phải có vị trí lưu vật lý nếu đã
  đưa vào kho.
- BR-06: Cấu trúc vị trí lưu chuẩn là
  `Kho -> Kệ -> Tầng -> Hộp số`.

**Non-Functional Requirements:**

- NFR-04: Người dùng tra cứu phải nhìn thấy vị trí
  hồ sơ giấy rõ ràng.

---

### UC-04 - Nhập bản đồ số

#### Summary

| Mục | Nội dung |
| --- | --- |
| Use Case ID | UC-04 |
| Use Case Name | Nhập bản đồ số |
| Description | Là Admin, tôi muốn nhập dữ liệu bản đồ số để hệ thống có thể tìm kiếm và hiển thị thửa đất. |
| Actor(s) | Admin |
| Priority | Must Have |
| Trigger | Có file dữ liệu bản đồ số cần đưa vào hệ thống. |
| Pre-Condition(s) | Admin đã đăng nhập; file bản đồ đúng định dạng được hỗ trợ. |
| Post-Condition(s) | Dữ liệu bản đồ được import, đánh chỉ mục và sẵn sàng tra cứu. |

#### Flow

**Basic Flow:**

1. Admin mở màn hình nhập bản đồ số.
2. Admin chọn file bản đồ cần import.
3. Hệ thống kiểm tra định dạng file.
4. Admin xác nhận import.
5. Hệ thống đọc dữ liệu thửa đất.
6. Hệ thống lưu dữ liệu bản đồ vào local database.
7. Hệ thống đánh chỉ mục theo số thửa, tờ bản đồ
   và khu vực.
8. Hệ thống hiển thị kết quả import.
9. Hệ thống ghi log import.

**Alternative Flow:**

- **1a.** Admin chọn chức năng đánh chỉ mục lại dữ liệu
  hiện có.
  - 1a1. Hệ thống chạy lại chỉ mục tìm kiếm.
  - Use Case tiếp tục bước 8.

**Exception Flow:**

- **3b.** File sai định dạng.
  - 3b1. Hệ thống thông báo file không hợp lệ.
  - Use Case dừng lại.

- **5c.** Dữ liệu thiếu số thửa hoặc tờ bản đồ.
  - 5c1. Hệ thống liệt kê dòng lỗi để Admin kiểm tra.
  - Use Case dừng lại.

#### Additional Information

**Business Rules:**

- BR-07: Dữ liệu bản đồ phải có khóa tìm kiếm tối
  thiểu gồm số thửa và tờ bản đồ.
- BR-08: Import và đánh chỉ mục phải ghi log.

**Non-Functional Requirements:**

- NFR-05: Import chạy local, không phụ thuộc dịch vụ
  trả phí.

---

### UC-05 - Tra cứu hồ sơ

#### Summary

| Mục | Nội dung |
| --- | --- |
| Use Case ID | UC-05 |
| Use Case Name | Tra cứu hồ sơ |
| Description | Là Staff, tôi muốn tra cứu hồ sơ để xem thông tin lưu trữ và tìm được hồ sơ giấy khi cần. |
| Actor(s) | Admin, Staff |
| Priority | Must Have |
| Trigger | Người dùng nhập từ khóa hoặc chọn bộ lọc tra cứu. |
| Pre-Condition(s) | Người dùng đã đăng nhập; hệ thống có dữ liệu hồ sơ. |
| Post-Condition(s) | Hệ thống hiển thị danh sách hồ sơ phù hợp và thông tin chi tiết khi người dùng chọn hồ sơ. |

#### Flow

**Basic Flow:**

1. Người dùng mở màn hình tra cứu hồ sơ.
2. Người dùng nhập từ khóa hoặc chọn bộ lọc.
3. Hệ thống tìm theo thông tin hồ sơ, thửa đất
   và vị trí lưu.
4. Hệ thống hiển thị danh sách kết quả.
5. Người dùng chọn một hồ sơ.
6. Hệ thống hiển thị chi tiết hồ sơ, bản scan và
   vị trí kho/kệ/tầng/hộp nếu có.
7. Hệ thống ghi log tra cứu.

**Alternative Flow:**

- **2a.** Người dùng tra cứu theo vị trí vật lý.
  - 2a1. Người dùng nhập kho, kệ, tầng hoặc hộp số.
  - 3a. Hệ thống tìm các hồ sơ trong vị trí đó.
  - Use Case tiếp tục bước 4.

- **2b.** Người dùng tra cứu theo số thửa/tờ bản đồ.
  - 3b. Hệ thống tìm hồ sơ có liên kết dữ liệu bản đồ.
  - Use Case tiếp tục bước 4.

**Exception Flow:**

- **4c.** Hệ thống không tìm thấy kết quả.
  - 4c1. Hệ thống hiển thị thông báo không có dữ liệu
    phù hợp.
  - Use Case dừng lại.

#### Additional Information

**Business Rules:**

- BR-09: Staff chỉ được tra cứu và xem dữ liệu,
  không chỉnh sửa dữ liệu gốc.
- BR-10: Kết quả tra cứu phải hiển thị vị trí hồ sơ
  giấy nếu đã được lưu.

**Non-Functional Requirements:**

- NFR-06: Tìm kiếm phải phản hồi nhanh với dữ liệu
  lưu local của xã.

---

### UC-06 - Tìm thửa đất trên bản đồ

#### Summary

| Mục | Nội dung |
| --- | --- |
| Use Case ID | UC-06 |
| Use Case Name | Tìm thửa đất trên bản đồ |
| Description | Là Staff, tôi muốn tìm thửa đất trên bản đồ số để xem vị trí và hồ sơ liên quan. |
| Actor(s) | Admin, Staff |
| Priority | Must Have |
| Trigger | Người dùng nhập số thửa, tờ bản đồ hoặc chọn tìm trên bản đồ. |
| Pre-Condition(s) | Dữ liệu bản đồ đã được import và đánh chỉ mục. |
| Post-Condition(s) | Hệ thống hiển thị thửa đất trên bản đồ và thông tin liên quan. |

#### Flow

**Basic Flow:**

1. Người dùng mở màn hình bản đồ số.
2. Người dùng nhập số thửa, tờ bản đồ hoặc từ khóa.
3. Hệ thống tìm trong chỉ mục bản đồ.
4. Hệ thống hiển thị danh sách thửa đất phù hợp.
5. Người dùng chọn thửa đất.
6. Hệ thống zoom tới vị trí thửa đất trên bản đồ.
7. Hệ thống hiển thị thông tin thửa đất và hồ sơ
   liên quan nếu có.

**Alternative Flow:**

- **4a.** Hệ thống tìm thấy đúng một thửa đất.
  - 4a1. Hệ thống mở trực tiếp vị trí thửa đất.
  - Use Case tiếp tục bước 6.

- **7a.** Thửa đất chưa liên kết hồ sơ.
  - 7a1. Hệ thống hiển thị thông tin bản đồ và ghi
    chú chưa có hồ sơ lưu trữ.
  - Use Case kết thúc thành công.

**Exception Flow:**

- **3b.** Chưa có dữ liệu bản đồ hoặc chưa đánh chỉ mục.
  - 3b1. Hệ thống báo cần Admin import/đánh chỉ mục
    dữ liệu.
  - Use Case dừng lại.

#### Additional Information

**Business Rules:**

- BR-11: Tìm bản đồ dựa trên dữ liệu bản đồ số đã
  import.
- BR-12: Dữ liệu bản đồ và dữ liệu hồ sơ có thể
  lệch nhau, cần UC-09 để đối chiếu.

**Non-Functional Requirements:**

- NFR-07: Bản đồ phải sử dụng được trong môi trường
  local theo phạm vi đã chốt.

---

### UC-07 - Xuất dữ liệu hồ sơ

#### Summary

| Mục | Nội dung |
| --- | --- |
| Use Case ID | UC-07 |
| Use Case Name | Xuất dữ liệu hồ sơ |
| Description | Là người dùng hệ thống, tôi muốn xuất PDF hoặc in hồ sơ để phục vụ lưu trữ và đối chiếu. |
| Actor(s) | Admin, Staff |
| Priority | Must Have |
| Trigger | Người dùng chọn lệnh xuất PDF, in hoặc export dữ liệu. |
| Pre-Condition(s) | Người dùng đã mở hồ sơ, danh sách hồ sơ hoặc dữ liệu bản đồ cần xuất. |
| Post-Condition(s) | Hệ thống tạo file/xem trước in thành công và ghi log thao tác. |

#### Flow

**Basic Flow:**

1. Người dùng mở hồ sơ hoặc kết quả tra cứu.
2. Người dùng chọn lệnh xuất dữ liệu.
3. Hệ thống hiển thị lựa chọn PDF/in/export
   nếu người dùng có quyền.
4. Người dùng chọn định dạng xuất.
5. Hệ thống tạo bản xem trước.
6. Người dùng xác nhận xuất hoặc in.
7. Hệ thống tạo file hoặc mở hộp thoại in.
8. Hệ thống ghi log xuất dữ liệu.

**Alternative Flow:**

- **1a.** Người dùng xuất danh sách kết quả tra cứu.
  - 1a1. Hệ thống lấy danh sách đang lọc.
  - Use Case tiếp tục bước 3.

- **1b.** Admin export dữ liệu bản đồ số.
  - 1b1. Hệ thống lấy dữ liệu bản đồ theo phạm vi
    Admin chọn.
  - Use Case tiếp tục bước 4.

- **7a.** Máy không có máy in, người dùng đã chọn in.
  - 7a1. Hệ thống chuyển sang lưu PDF thay vì in.
  - Use Case kết thúc thành công.

**Exception Flow:**

- **3b.** Người dùng không có quyền với loại export
  đã chọn.
  - 3b1. Hệ thống ẩn hoặc từ chối chức năng export đó.
  - Use Case dừng lại.

#### Additional Information

**Business Rules:**

- BR-13: Xuất PDF/in không phải ký điện tử.
- BR-14: Không có nghiệp vụ tiền hoặc phí trong use
  case này.

**Non-Functional Requirements:**

- NFR-08: PDF phải hiển thị tiếng Việt đúng font và
  in được trên máy local.

---

### UC-08 - Ghi nhận biến động hồ sơ

#### Summary

| Mục | Nội dung |
| --- | --- |
| Use Case ID | UC-08 |
| Use Case Name | Ghi nhận biến động hồ sơ |
| Description | Là Admin, tôi muốn ghi nhận quan hệ hồ sơ cũ và hồ sơ mới để truy vết lịch sử biến động. |
| Actor(s) | Admin |
| Priority | Should Have |
| Trigger | Có thay đổi hồ sơ cần lưu vết cũ - mới. |
| Pre-Condition(s) | Hồ sơ liên quan đã tồn tại hoặc Admin có đủ dữ liệu để tạo hồ sơ mới. |
| Post-Condition(s) | Hệ thống lưu quan hệ biến động và hiển thị được lịch sử trên hồ sơ. |

#### Flow

**Basic Flow:**

1. Admin mở hồ sơ cần ghi nhận biến động.
2. Admin chọn lệnh ghi nhận biến động.
3. Admin chọn loại biến động.
4. Admin chọn hồ sơ cũ và hồ sơ mới liên quan.
5. Admin nhập mô tả biến động.
6. Hệ thống kiểm tra dữ liệu hợp lệ.
7. Hệ thống lưu quan hệ hồ sơ cũ - mới.
8. Hệ thống ghi log thao tác.
9. Hệ thống hiển thị biến động trong lịch sử hồ sơ.

**Alternative Flow:**

- **4a.** Hồ sơ mới chưa tồn tại.
  - 4a1. Admin tạo hồ sơ mới trước
    (chuyển sang UC-03).
  - Use Case quay lại bước 4.

**Exception Flow:**

- **6b.** Hồ sơ cũ hoặc mới không tồn tại.
  - 6b1. Hệ thống báo lỗi và không lưu biến động.
  - Use Case dừng lại.

#### Additional Information

**Business Rules:**

- BR-15: Hồ sơ không dùng state xử lý; tiến triển
  hồ sơ thể hiện bằng quan hệ cũ - mới.
- BR-16: Biến động phải giữ được dữ liệu cả hồ sơ cũ
  và hồ sơ mới.

**Non-Functional Requirements:**

- NFR-09: Lịch sử biến động phải xem được theo
  thời gian.

---

### UC-09 - Đối chiếu scan và bản đồ số

#### Summary

| Mục | Nội dung |
| --- | --- |
| Use Case ID | UC-09 |
| Use Case Name | Đối chiếu scan và bản đồ số |
| Description | Là cán bộ tra cứu, tôi muốn đối chiếu dữ liệu scan và bản đồ số để phát hiện sai lệch hồ sơ. |
| Actor(s) | Admin, Staff |
| Priority | Should Have |
| Trigger | Người dùng chọn lệnh đối chiếu trên một hồ sơ hoặc thửa đất. |
| Pre-Condition(s) | Hồ sơ có bản scan hoặc dữ liệu scan; bản đồ số có thửa đất tương ứng. |
| Post-Condition(s) | Hệ thống hiển thị kết quả khớp/lệch giữa scan và bản đồ số. |

#### Flow

**Basic Flow:**

1. Người dùng mở hồ sơ hoặc thửa đất cần đối chiếu.
2. Người dùng chọn lệnh đối chiếu scan và bản đồ số.
3. Hệ thống lấy dữ liệu từ phiên bản scan.
4. Hệ thống lấy dữ liệu từ phiên bản bản đồ số.
5. Hệ thống so sánh số thửa, tờ bản đồ, diện tích,
   địa chỉ và thông tin liên quan.
6. Hệ thống hiển thị các trường khớp/lệch.
7. Hệ thống ghi nhận thời điểm và phiên bản được dùng
   để đối chiếu.

**Alternative Flow:**

- **4a.** Hệ thống tìm thấy nhiều thửa đất có thể
  đối chiếu.
  - 4a1. Người dùng chọn thửa đất đúng.
  - Use Case tiếp tục bước 5.

**Exception Flow:**

- **3b.** Hồ sơ không có bản scan.
  - 3b1. Hệ thống báo thiếu dữ liệu scan.
  - Use Case dừng lại.

- **4b.** Không tìm thấy dữ liệu bản đồ tương ứng.
  - 4b1. Hệ thống báo không đủ dữ liệu để đối chiếu.
  - Use Case dừng lại.

#### Additional Information

**Business Rules:**

- BR-17: Đối chiếu không tự động sửa dữ liệu gốc.
- BR-18: Cần lưu phiên bản scan và phiên bản bản đồ số
  đã dùng để đối chiếu.

**Non-Functional Requirements:**

- NFR-10: Kết quả đối chiếu phải dễ đọc với cán bộ xã,
  ưu tiên bảng khớp/lệch rõ ràng.

---

### UC-10 - Theo dõi hoạt động hệ thống

#### Summary

| Mục | Nội dung |
| --- | --- |
| Use Case ID | UC-10 |
| Use Case Name | Theo dõi hoạt động hệ thống |
| Description | Là Admin, tôi muốn xem dashboard và log để nắm tình trạng dữ liệu và truy vết thao tác. |
| Actor(s) | Admin |
| Priority | Should Have |
| Trigger | Admin mở dashboard hoặc màn hình log. |
| Pre-Condition(s) | Admin đã đăng nhập; hệ thống có dữ liệu thống kê hoặc log. |
| Post-Condition(s) | Dashboard/log được hiển thị theo bộ lọc Admin chọn. |

#### Flow

**Basic Flow:**

1. Admin mở dashboard.
2. Hệ thống hiển thị số lượng hồ sơ, hồ sơ có scan,
   dữ liệu bản đồ, lượt tra cứu, lượt xuất/in.
3. Admin mở màn hình log.
4. Admin chọn bộ lọc người dùng, thời gian hoặc
   loại thao tác.
5. Hệ thống hiển thị danh sách log phù hợp.
6. Admin xem chi tiết một log.

**Alternative Flow:**

- **4a.** Admin không chọn bộ lọc.
  - 4a1. Hệ thống hiển thị log mới nhất theo mặc định.
  - Use Case tiếp tục bước 5.

- **5a.** Không có log phù hợp.
  - 5a1. Hệ thống hiển thị trạng thái không có
    dữ liệu.
  - Use Case kết thúc thành công.

**Exception Flow:**

Không có exception flow cho use case này.

#### Additional Information

**Business Rules:**

- BR-19: Log cần ghi các thao tác quan trọng:
  đăng nhập, thêm/sửa/xóa hồ sơ, import/export,
  in/xuất PDF, ghi biến động.
- BR-20: Dashboard/log chỉ để theo dõi, không tạo
  notification hoặc giao việc.

**Non-Functional Requirements:**

- NFR-11: Dashboard và log phải hoạt động local,
  không phụ thuộc dịch vụ analytics bên ngoài.

---

## 7. Role Matrix

Toàn bộ dữ liệu đều có chức năng Thêm/Đọc/Sửa/Xóa
và chịu tác động bởi sự phân quyền từ phía Admin.
Chi tiết quyền thao tác theo từng use case:

| Use Case | Admin | Staff |
| --- | --- | --- |
| UC-01 Đăng nhập hệ thống | Có | Có |
| UC-02 Thiết lập tài khoản cán bộ | Có | Không |
| UC-03 Lưu hồ sơ giấy | Có | Xem qua tra cứu |
| UC-04 Nhập bản đồ số | Có | Không |
| UC-05 Tra cứu hồ sơ | Có | Có |
| UC-06 Tìm thửa đất trên bản đồ | Có | Có |
| UC-07 Xuất dữ liệu hồ sơ | Có | Có |
| UC-08 Ghi nhận biến động hồ sơ | Có | Xem qua tra cứu |
| UC-09 Đối chiếu scan và bản đồ số | Có | Có |
| UC-10 Theo dõi hoạt động hệ thống | Có | Không |

---

## 8. Ghi chú loại trừ

- Không có use case phê duyệt.
- Không có use case ký điện tử.
- Không có use case thanh toán.
- Không có use case thông báo.
- Không có use case giao việc.
- Không có state xử lý hồ sơ.
- ERD và thiết kế database nên tách sang tài liệu
  riêng để tránh làm loãng Use Case Specification.
