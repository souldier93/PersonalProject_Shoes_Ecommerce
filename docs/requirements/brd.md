# Business Requirements Document (BRD)

Version: 1.0  
Date: 2026-05-19

## Business Context

Shoes Ecommerce là hệ thống bán hàng trực tuyến cho giày, quần áo và thời trang. Mục tiêu là hoàn thiện trải nghiệm từ duyệt sản phẩm, mua hàng, thanh toán, theo dõi đơn, hỗ trợ sau bán đến vận hành admin.

## Stakeholders

| Stakeholder | Need | Success signal |
| --- | --- | --- |
| Guest customer | Mua hàng nhanh không cần tài khoản | Checkout thành công và tra cứu đơn được |
| Registered user | Quản lý hồ sơ, wishlist, lịch sử mua | Quay lại mua và theo dõi đơn dễ dàng |
| Admin | Quản lý catalog, order, inventory, return, coupon, user | Ít thao tác thủ công, dữ liệu rõ ràng |
| Manager | Theo dõi doanh thu, đơn hàng và tồn kho | Có dashboard và báo cáo theo ngày |

## Business Requirements

| ID | Area | Requirement | Priority |
| --- | --- | --- | --- |
| BR-01 | Catalog | Khách hàng xem, tìm kiếm, lọc và đọc chi tiết sản phẩm giày/thời trang. | High |
| BR-02 | Shopping cart | Khách có thể thêm, chỉnh số lượng, áp coupon và giữ bag ổn định khi lỗi thanh toán. | High |
| BR-03 | Guest checkout | Khách không cần tài khoản vẫn mua được và tra cứu lịch sử bằng email + mã đơn. | High |
| BR-04 | Dual payment | Hỗ trợ PayOS cho ngân hàng Việt Nam và Stripe cho thẻ Visa/Mastercard. | High |
| BR-05 | Secure notification | Email chỉ gửi thông tin cần thiết, không lộ dữ liệu nhạy cảm thẻ/ngân hàng. | High |
| BR-06 | Order lifecycle | Đơn hàng có trạng thái rõ ràng từ paid, packing, shipping, delivered, cancelled/refunded. | High |
| BR-07 | Refund policy | Chỉ cho hủy/hoàn tiền khi đơn đã thanh toán và còn đang chuẩn bị hàng. | High |
| BR-08 | Admin operations | Admin quản lý product, order, inventory, returns, coupon, user, chat và analytics. | High |
| BR-09 | Wishlist/reviews/returns | Tăng trải nghiệm mua sắm bằng yêu thích, review sau mua, đổi trả. | Medium |
| BR-10 | Support chat | Khách có kênh liên hệ nhanh và admin quản lý hội thoại. | Medium |
| BR-11 | Media storage | Ảnh sản phẩm/review dùng Cloudflare R2 để lưu trữ và phục vụ nhanh. | Medium |
| BR-12 | Auditability | Các thao tác tồn kho, trạng thái đơn, hoàn tiền cần có lịch sử để truy vết. | High |

## Business Rules

- Chỉ cho khách hủy/hoàn tiền khi order PAID và fulfillment CONFIRMED hoặc PACKING.
- Order SHIPPING hoặc DELIVERED không được hủy/hoàn tiền tự động.
- Stock chỉ giảm sau khi payment được xác nhận PAID qua webhook/confirmation tin cậy.
- Không lưu dữ liệu thẻ; không gửi thông tin nhạy cảm trong email.

## Diagrams

![System context](diagrams/system_context_diagram.png)

![Traceability](diagrams/requirements_traceability_map.png)
