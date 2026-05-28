const fs = require("fs");
const path = require("path");
const BASE = path.join(__dirname, "..", "docs", "requirements", "usecases");
if (!fs.existsSync(BASE)) fs.mkdirSync(BASE, { recursive: true });

function esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

var ucs = [];
function uc(id,name,actors,pri,pre,post,mf,af,cat) {
  ucs.push({id:id,name:name,actors:actors,pri:pri,pre:pre,post:post,mf:mf,af:af,cat:cat});
}

uc("UC-01","Browse Products",["Guest","User","Manager","Admin"],"High",
"Không có","Danh sách sản phẩm hiển thị",
["User truy cập trang chủ (/) hoặc trang /all-shoes","System gọi API GET /shoes","System trả về danh sách sản phẩm (name, price, thumbnail, colorName, rating, reviewCount)","Frontend render product cards với lazy loading"],
["API lỗi -> hiển thị error state"],"Browsing & Discovery");

uc("UC-02","Search/Filter Products",["Guest","User","Manager","Admin"],"High",
"Đang ở trang product listing","Danh sách sản phẩm được lọc",
["User chọn filter: category, color, price range, size","System gọi API GET /shoes?category=men&color=Black&minPrice=50&maxPrice=150","System trả về filtered results","User có thể nhập text search vào thanh tìm kiếm","System gọi API GET /shoes?search=Air+Max"],
["Không có kết quả -> hiển thị empty state"],"Browsing & Discovery");

uc("UC-03","View Product Detail",["Guest","User","Manager","Admin"],"High",
"Có productId hợp lệ","Trang chi tiết sản phẩm hiển thị",
["User click vào 1 sản phẩm","System gọi API GET /shoes/detail/:productId","System trả về: name, category, price, colors[], images[], sizes[], description, materialNote, origin, rating, reviewCount","Frontend hiển thị image gallery, color picker, size picker, stock indicator","System đồng thời gọi GET /reviews/product/:productId"],
["productId không tồn tại -> 404 page"],"Browsing & Discovery");

uc("UC-04","Check Stock Real-time",["Guest","User","Manager","Admin"],"High",
"Đang ở trang product detail","Hiển thị số lượng tồn kho của size đã chọn",
["User chọn color + size","System gọi API GET /shoes/:productId/stock/:colorName/:size","System trả về { stock: 5 }","UI hiển thị \"Còn hàng\" (xanh) hoặc \"Hết hàng\" (đỏ)"],
["Size hết hàng -> disable nút Add to Cart"],"Browsing & Discovery");

uc("UC-05","View Reviews",["Guest","User","Manager","Admin"],"Medium",
"Đang ở trang product detail","Danh sách reviews hiển thị",
["User scroll xuống phần reviews của product detail","System gọi API GET /reviews/product/:productId","System trả về danh sách reviews (rating, comment, images, user, createdAt)","UI hiển thị star rating trung bình và danh sách reviews"],
["Chưa có review -> hiển thị \"Be the first to review\""],"Browsing & Discovery");

uc("UC-06","Add Product to Cart",["Guest","User"],"High",
"Đang ở trang product detail, đã chọn color + size, còn hàng","Sản phẩm được thêm vào giỏ hàng",
["User chọn quantity (mặc định: 1)","User bấm \"Add to Bag\"","System kiểm tra stock lần nữa","System thêm item vào cart state (Pinia store)","System lưu cart vào localStorage (cho guest)","Toast notification: \"Added to bag\""],
["Stock không đủ -> hiển thị lỗi","Sản phẩm đã có trong cart -> tăng quantity (nếu còn stock)"],"Shopping Cart");

uc("UC-07","Manage Shopping Cart",["Guest","User"],"High",
"Cart có ít nhất 1 item","Cart được cập nhật",
["User vào trang /bag","System hiển thị danh sách items: ảnh, tên, color, size, quantity, unit price, subtotal","User có thể: tăng/giảm quantity, xóa item","System tính lại tổng tiền (subtotal, discount, total)","System lưu cart vào localStorage"],
["Giảm quantity xuống 0 -> xóa item khỏi cart","Tăng quantity vượt stock -> giới hạn ở stock tối đa"],"Shopping Cart");

uc("UC-08","Apply Coupon Code",["Guest","User"],"High",
"Đang ở trang cart hoặc checkout","Discount được áp dụng (nếu coupon hợp lệ)",
["User nhập coupon code vào ô Promo Code","User bấm Apply","System gọi API GET /coupons/validate?code=X&amount=Y","System trả về { discountPercent, discountAmount, maxDiscount, finalDiscount }","UI hiển thị số tiền giảm giá, tổng mới"],
["Coupon không tồn tại -> Invalid code","Coupon hết hạn -> Expired","Amount < minOrderAmount -> Min order not met"],"Shopping Cart");

uc("UC-09","Guest Checkout",["Guest"],"High",
"Cart có ít nhất 1 item","Redirect đến trang thanh toán",
["User bấm Checkout từ cart","System chuyển đến trang /checkout","User nhập: firstName, lastName, email, phone, address","System validate form","User chọn payment method: PayOS hoặc Stripe","User bấm Place Order","System gọi API POST /payment/checkout/payos hoặc /stripe","System kiểm tra stock batch, tạo bill, tạo payment liên kết","System redirect đến payment URL (PayOS) hoặc hiển thị Stripe form"],
["Stock batch fail -> hiển thị sản phẩm hết hàng","Coupon đã hết lượt dùng -> thông báo lỗi","API lỗi -> thông báo lỗi server"],"Checkout & Payment");

uc("UC-10","PayOS Payment Processing",["Guest","User","PayOS Gateway"],"High",
"Bill đã tạo, payment link pending","Payment hoàn tất hoặc hủy",
["System tạo PayOS payment link với orderCode, amount, items, returnUrl, cancelUrl","PayOS trả về { checkoutUrl, qrCode }","System redirect user đến checkoutUrl","User thanh toán trên trang PayOS (QR code / bank transfer)","PayOS gửi webhook POST /payment/webhook/payos","System verify HMAC signature","System cập nhật bill status = PAID","System giảm stock trong shoesDetail","System gửi email xác nhận"],
["User hủy -> redirect về cancelUrl","Webhook timeout -> user query GET /payment/status?orderCode=X","Signature không hợp lệ -> 401"],"Checkout & Payment");

uc("UC-11","Stripe Payment Processing",["Guest","User","Stripe Gateway"],"High",
"Bill đã tạo","Payment hoàn tất",
["System tạo Stripe PaymentIntent với amount, currency, metadata","Stripe trả về { clientSecret }","Frontend hiển thị Stripe Elements form (thẻ tín dụng)","User nhập thông tin thẻ và xác nhận","Frontend gọi stripe.confirmCardPayment(clientSecret)","Stripe xử lý thanh toán","Stripe gửi webhook POST /payment/webhook/stripe","System verify với stripe.webhooks.constructEvent()","System cập nhật bill status = PAID, giảm stock, gửi email"],
["Thanh toán bị từ chối -> hiển thị lỗi thẻ"],"Checkout & Payment");

uc("UC-12","Receive Payment Webhook",["PayOS Gateway","Stripe Gateway"],"High",
"Payment đã được khởi tạo bởi PayOS/Stripe","Order status được cập nhật",
["PayOS/Stripe gửi HTTP POST đến webhook endpoint","System verify signature (HMAC cho PayOS, Stripe SDK cho Stripe)","System kiểm tra idempotency (tránh xử lý trùng)","System cập nhật bill.paymentStatus = PAID","System gọi processStockAfterPayment để giảm stock","System gửi email confirmation","System trả về HTTP 200"],
["Signature không hợp lệ -> 401 Unauthorized","Bill đã PAID -> bỏ qua (idempotent)"],"Checkout & Payment");

module.exports = { ucs, esc, BASE, fs, path };
