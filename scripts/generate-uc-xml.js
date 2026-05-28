const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, '..', 'docs', 'requirements', 'usecases');

const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const ucs = [];
function uc(id,name,actors,priority,pre,post,mainFlow,altFlow,cat) {
  ucs.push({id,name,actors,priority,pre,post,mainFlow,altFlow,cat});
}

// UC-01 - UC-12
uc('UC-01','Browse Products',['Guest','User','Manager','Admin'],'High',
'Không có','Danh sách sản phẩm hiển thị',
['User truy cập trang chủ (/) hoặc trang /all-shoes','System gọi API GET /shoes','System trả về danh sách sản phẩm (name, price, thumbnail, colorName, rating, reviewCount)','Frontend render product cards với lazy loading'],
['API lỗi -> hiển thị error state'],'Browsing & Discovery');
uc('UC-02','Search/Filter Products',['Guest','User','Manager','Admin'],'High',
'Đang ở trang product listing','Danh sách sản phẩm được lọc',
['User chọn filter: category, color, price range, size','System gọi API GET /shoes?category=men&color=Black&minPrice=50&maxPrice=150','System trả về filtered results','User có thể nhập text search vào thanh tìm kiếm','System gọi API GET /shoes?search=Air+Max'],
['Không có kết quả -> hiển thị empty state'],'Browsing & Discovery');
uc('UC-03','View Product Detail',['Guest','User','Manager','Admin'],'High',
'Có productId hợp lệ','Trang chi tiết sản phẩm hiển thị',
['User click vào 1 sản phẩm','System gọi API GET /shoes/detail/:productId','System trả về: name, category, price, colors[], images[], sizes[], description, materialNote, origin, rating, reviewCount','Frontend hiển thị image gallery, color picker, size picker, stock indicator','System đồng thời gọi GET /reviews/product/:productId'],
['productId không tồn tại -> 404 page'],'Browsing & Discovery');
uc('UC-04','Check Stock Real-time',['Guest','User','Manager','Admin'],'High',
'Đang ở trang product detail','Hiển thị số lượng tồn kho của size đã chọn',
['User chọn color + size','System gọi API GET /shoes/:productId/stock/:colorName/:size','System trả về { stock: 5 }','UI hiển thị "Còn hàng" (xanh) hoặc "Hết hàng" (đỏ)'],
['Size hết hàng -> disable nút Add to Cart'],'Browsing & Discovery');
uc('UC-05','View Reviews',['Guest','User','Manager','Admin'],'Medium',
'Đang ở trang product detail','Danh sách reviews hiển thị',
['User scroll xuống phần reviews của product detail','System gọi API GET /reviews/product/:productId','System trả về danh sách reviews (rating, comment, images, user, createdAt)','UI hiển thị star rating trung bình và danh sách reviews'],
['Chưa có review -> hiển thị "Be the first to review"'],'Browsing & Discovery');
uc('UC-06','Add Product to Cart',['Guest','User'],'High',
'Đang ở trang product detail, đã chọn color + size, còn hàng','Sản phẩm được thêm vào giỏ hàng',
['User chọn quantity (mặc định: 1)','User bấm "Add to Bag"','System kiểm tra stock lần nữa','System thêm item vào cart state (Pinia store)','System lưu cart vào localStorage (cho guest)','Toast notification: "Added to bag"'],
['Stock không đủ -> hiển thị lỗi','Sản phẩm đã có trong cart -> tăng quantity (nếu còn stock)'],'Shopping Cart');
uc('UC-07','Manage Shopping Cart',['Guest','User'],'High',
'Cart có ít nhất 1 item','Cart được cập nhật',
['User vào trang /bag','System hiển thị danh sách items: ảnh, tên, color, size, quantity, unit price, subtotal','User có thể: tăng/giảm quantity, xóa item','System tính lại tổng tiền (subtotal, discount, total)','System lưu cart vào localStorage'],
['Giảm quantity xuống 0 -> xóa item khỏi cart','Tăng quantity vượt stock -> giới hạn ở stock tối đa'],'Shopping Cart');
uc('UC-08','Apply Coupon Code',['Guest','User'],'High',
'Đang ở trang cart hoặc checkout','Discount được áp dụng (nếu coupon hợp lệ)',
['User nhập coupon code vào ô Promo Code','User bấm Apply','System gọi API GET /coupons/validate?code=X&amount=Y','System trả về { discountPercent, discountAmount, maxDiscount, finalDiscount }','UI hiển thị số tiền giảm giá, tổng mới'],
['Coupon không tồn tại -> Invalid code','Coupon hết hạn -> Expired','Amount < minOrderAmount -> Min order not met'],'Shopping Cart');
uc('UC-09','Guest Checkout',['Guest'],'High',
'Cart có ít nhất 1 item','Redirect đến trang thanh toán',
['User bấm Checkout từ cart','System chuyển đến trang /checkout','User nhập: firstName, lastName, email, phone, address','System validate form','User chọn payment method: PayOS hoặc Stripe','User bấm Place Order','System gọi API POST /payment/checkout/payos hoặc /stripe','System kiểm tra stock batch, tạo bill, tạo payment liên kết','System redirect đến payment URL (PayOS) hoặc hiển thị Stripe form'],
['Stock batch fail -> hiển thị sản phẩm hết hàng','Coupon đã hết lượt dùng -> thông báo lỗi','API lỗi -> thông báo lỗi server'],'Checkout & Payment');
uc('UC-10','PayOS Payment Processing',['Guest','User','PayOS Gateway'],'High',
'Bill đã tạo, payment link pending','Payment hoàn tất hoặc hủy',
['System tạo PayOS payment link với orderCode, amount, items, returnUrl, cancelUrl','PayOS trả về { checkoutUrl, qrCode }','System redirect user đến checkoutUrl','User thanh toán trên trang PayOS (QR code / bank transfer)','PayOS gửi webhook POST /payment/webhook/payos','System verify HMAC signature','System cập nhật bill status = PAID','System giảm stock trong shoesDetail','System gửi email xác nhận'],
['User hủy -> redirect về cancelUrl','Webhook timeout -> user query GET /payment/status?orderCode=X','Signature không hợp lệ -> 401'],'Checkout & Payment');
uc('UC-11','Stripe Payment Processing',['Guest','User','Stripe Gateway'],'High',
'Bill đã tạo','Payment hoàn tất',
['System tạo Stripe PaymentIntent với amount, currency, metadata','Stripe trả về { clientSecret }','Frontend hiển thị Stripe Elements form (thẻ tín dụng)','User nhập thông tin thẻ và xác nhận','Frontend gọi stripe.confirmCardPayment(clientSecret)','Stripe xử lý thanh toán','Stripe gửi webhook POST /payment/webhook/stripe','System verify với stripe.webhooks.constructEvent()','System cập nhật bill status = PAID, giảm stock, gửi email'],
['Thanh toán bị từ chối -> hiển thị lỗi thẻ'],'Checkout & Payment');
uc('UC-12','Receive Payment Webhook',['PayOS Gateway','Stripe Gateway'],'High',
'Payment đã được khởi tạo bởi PayOS/Stripe','Order status được cập nhật',
['PayOS/Stripe gửi HTTP POST đến webhook endpoint','System verify signature (HMAC cho PayOS, Stripe SDK cho Stripe)','System kiểm tra idempotency (tránh xử lý trùng)','System cập nhật bill.paymentStatus = PAID','System gọi processStockAfterPayment để giảm stock','System gửi email confirmation','System trả về HTTP 200'],
['Signature không hợp lệ -> 401 Unauthorized','Bill đã PAID -> bỏ qua (idempotent)'],'Checkout & Payment');
uc('UC-13','Track Order by Email + Order Code',['Guest'],'High',
'Đã đặt hàng (có orderCode và email)','Hiển thị trạng thái đơn hàng',
['User vào trang /order-tracking','User nhập email + orderCode','System gọi API GET /payments/status?orderCode=X&email=Y','System trả về: orderCode, items, paymentStatus, fulfillmentStatus, carrier, trackingCode, createdAt'],
['Không tìm thấy -> Order not found'],'Order Tracking');
uc('UC-14','Register New Account',['Guest'],'High',
'Chưa có tài khoản','Tài khoản được tạo',
['User vào trang /register','User nhập: username, email, password, fullName','System validate: username unique, email unique, password strength','System hash password (bcrypt) và lưu user vào DB','System gửi email xác thực (nếu EMAIL_VERIFICATION_REQUIRED=true)','System redirect đến login hoặc auto-login'],
['Username đã tồn tại -> Username already exists','Email đã tồn tại -> Email already registered'],'Account Management');
uc('UC-15','User Login',['Guest'],'High',
'Đã có tài khoản','Đăng nhập thành công, nhận JWT token',
['User vào trang /login','User nhập email/username + password','System tìm user trong DB','System verify password với bcrypt','System tạo accessToken (15min) + refreshToken (7d)','System trả về { accessToken, refreshToken, user }','Frontend lưu token vào localStorage'],
['User không tồn tại -> Invalid credentials','Password sai -> Invalid credentials'],'Account Management');
uc('UC-16','Manage User Profile',['User'],'Medium',
'Đã đăng nhập','Profile được cập nhật',
['User vào trang /profile','System hiển thị thông tin: username, email, fullName, phone, avatar','User chỉnh sửa fullName, phone','System gọi API PUT /auth/profile','System cập nhật DB'],
['Phone không hợp lệ -> validation error'],'Account Management');
uc('UC-17','Manage Addresses',['User'],'High',
'Đã đăng nhập','Địa chỉ được lưu/cập nhật/xóa',
['User vào trang /profile/addresses','System gọi API GET /auth/addresses','System hiển thị danh sách địa chỉ','User có thể: thêm, sửa, xóa, đặt làm mặc định','System gọi API POST/PUT/DELETE /auth/addresses'],
['Địa chỉ không hợp lệ -> validation error'],'Account Management');
uc('UC-18','User (Logged-in) Checkout',['User'],'High',
'Đã đăng nhập, cart có items','Redirect đến thanh toán',
['User vào checkout','System pre-fill thông tin từ profile (name, email, phone)','User chọn từ saved addresses hoặc nhập address mới','Các bước còn lại giống UC-09 Guest Checkout'],
['Chọn address mặc định -> tự động fill'],'Checkout & Payment');
uc('UC-19','View Order History',['User'],'High',
'Đã đăng nhập','Danh sách đơn hàng hiển thị',
['User vào trang /my-orders','System gọi API GET /payments/orders/user/:userId','System trả về danh sách bills (orderCode, items, paymentStatus, fulfillmentStatus, total, createdAt)','User click vào 1 đơn để xem chi tiết'],
['Chưa có đơn hàng -> empty state'],'Order Tracking');
uc('UC-20','Write Product Review',['User'],'High',
'Đã đăng nhập, đã mua sản phẩm','Review được lưu, rating sản phẩm được cập nhật',
['User vào trang product detail','User bấm Write Review','User chọn rating (1-5 sao)','User nhập comment','User upload ảnh (optional, tối đa 5 ảnh)','System gọi API POST /reviews','System lưu review, cập nhật avg rating của sản phẩm'],
['Ảnh quá lớn (>5MB) -> lỗi','User đã review sản phẩm này -> 409 Conflict'],'Reviews & Returns');
uc('UC-21','Create Return Request',['User'],'High',
'Đã đăng nhập, có đơn hàng PAID','Return request PENDING',
['User vào My Orders','User chọn đơn hàng, bấm Return/Exchange','User chọn type: RETURN / EXCHANGE / REFUND','User chọn sản phẩm, color, size cần trả','User nhập lý do','User thêm ghi chú (optional)','User bấm Submit','System gọi API POST /returns','System lưu return request (status: PENDING)'],
['Đã có return request cho sản phẩm này -> 409'],'Reviews & Returns');
uc('UC-22','Track Return Status',['User'],'Medium',
'Đã tạo return request','Hiển thị trạng thái yêu cầu đổi trả',
['User vào trang /my-returns','System gọi API GET /returns/user/:userId','System trả về danh sách return requests (type, reason, status, adminNote, createdAt)','User click vào để xem chi tiết'],
['Chưa có return request -> empty state'],'Reviews & Returns');
uc('UC-23','Manage Wishlist',['User'],'Medium',
'Đã đăng nhập','Wishlist được cập nhật',
['User vào trang /wishlist','System gọi API GET /wishlist','System trả về danh sách sản phẩm yêu thích','User có thể xóa khỏi wishlist hoặc thêm vào cart','User có thể thêm sản phẩm từ product detail (bấm icon tim)','System gọi API POST /wishlist'],
['Sản phẩm đã trong wishlist -> xóa khỏi wishlist (toggle)'],'Wishlist');
uc('UC-24','Start Chat with Support',['User'],'Medium',
'Đã đăng nhập','Chat conversation được tạo, tin nhắn được gửi',
['User bấm vào chat widget (góc phải màn hình)','System tạo conversation (nếu chưa có) hoặc mở conversation hiện tại','User nhập tin nhắn và gửi','System gọi API POST /chat/conversations + POST /chat/convs/:id/messages','System tăng unreadForManager counter','Tin nhắn hiển thị real-time trên widget'],
['User không đăng nhập -> yêu cầu tên + email'],'Live Chat');
uc('UC-25','Create New Product',['Admin'],'High',
'Đã đăng nhập với role admin','Sản phẩm xuất hiện trên store',
['Admin vào /admin/products','Admin bấm Add Product','Admin nhập: name, category, productType, collection, base price','Admin thêm color variants: colorName, hex code, thumbnail, images, sizes + stock, styleCode, description, materialNote, origin','Admin bấm Create','System gọi API POST /shoes/product','System lưu shoes + shoesDetail vào DB'],
['Stock = 0 cho tất cả sizes -> sản phẩm hidden'],'Admin - Product Management');
uc('UC-26','Update Product',['Admin'],'High',
'Sản phẩm tồn tại','Thông tin sản phẩm được cập nhật',
['Admin vào /admin/products','Admin chọn sản phẩm cần sửa','Admin chỉnh sửa: giá, mô tả, hình ảnh, stock, colors','Admin bấm Save','System gọi API PUT/PATCH /shoes/product/:id','System cập nhật DB'],
['Dữ liệu không hợp lệ -> 400 Bad Request'],'Admin - Product Management');
uc('UC-27','Soft Delete Product',['Admin'],'Medium',
'Sản phẩm tồn tại','Sản phẩm bị ẩn khỏi store (stock = 0)',
['Admin vào /admin/products','Admin chọn sản phẩm','Admin bấm Delete (soft delete)','System gọi API DELETE /shoes/product/:id','System set stock = 0 cho tất cả variants (giữ data)'],
[],'Admin - Product Management');
uc('UC-28','Manage Colors & Sizes',['Admin'],'High',
'Đang tạo/sửa sản phẩm','Color/size variants được cập nhật',
['Admin chọn color variant, nhập colorName, hex code','Admin thêm sizes: size name + stock quantity cho mỗi size','Admin có thể thêm/bớt colors và sizes','System validate: không trùng colorName trong cùng product','System lưu vào shoesDetail.colors[]'],
['Trùng colorName -> lỗi validation'],'Admin - Product Management');
uc('UC-29','Upload Product Images',['Admin'],'Medium',
'Đang tạo/sửa sản phẩm','Ảnh được upload lên R2',
['Admin chọn ảnh từ máy tính','System validate: type (jpeg/png/webp), size (max 5MB)','System gọi API POST /r2/upload','System upload ảnh lên Cloudflare R2','System trả về public URL','System cập nhật shoesDetail với URLs mới'],
['File không hợp lệ -> validation error','R2 lỗi -> retry hoặc thông báo lỗi'],'Admin - Product Management');
uc('UC-30','Browse R2 Media',['Admin'],'Medium',
'Đang tạo/sửa sản phẩm','Hiển thị danh sách ảnh từ R2',
['Admin mở media browser trong form sản phẩm','System gọi API GET /r2/media-folders hoặc list objects','System hiển thị danh sách ảnh đã upload','Admin chọn ảnh có sẵn thay vì upload mới','System thêm URL vào sản phẩm'],
[],'Admin - Product Management');
uc('UC-31','Set Discount Price',['Admin'],'Medium',
'Sản phẩm tồn tại','Giá giảm được áp dụng',
['Admin chọn sản phẩm','Admin nhập discountPrice (nhỏ hơn base price)','Admin nhập ngày hết hạn discount (optional)','System gọi API PATCH /shoes/product/:id','Frontend hiển thị giá gốc gạch ngang + giá giảm'],
['discountPrice > base price -> lỗi'],'Admin - Product Management');
uc('UC-32','View All Orders',['Admin','Manager'],'High',
'Đã đăng nhập với role admin/manager','Danh sách tất cả orders hiển thị',
['Admin vào /admin/purchases','System gọi API GET /payments/orders','System trả về tất cả bills (paginated)','Admin có thể filter/sort theo status, date, amount'],
['Không có đơn hàng -> empty table'],'Admin - Order & Inventory');
uc('UC-33','Filter/Search Orders',['Admin','Manager'],'Medium',
'Đang ở trang orders','Kết quả lọc orders hiển thị',
['Admin nhập từ khóa hoặc chọn filter (status, date range)','System gọi API GET /payments/orders?status=CONFIRMED&from=...&to=...','System trả về kết quả đã lọc'],
['Không có kết quả -> empty state'],'Admin - Order & Inventory');
uc('UC-34','View Order Detail',['Admin','Manager'],'High',
'Đơn hàng tồn tại','Chi tiết đơn hàng hiển thị',
['Admin click vào 1 order','System gọi API GET /payments/orders/:orderCode','System trả về: orderCode, items[], paymentDetails, fulfillmentStatus, statusHistory[], customer info, tracking info'],
['Order không tồn tại -> 404'],'Admin - Order & Inventory');
uc('UC-35','Update Fulfillment Status',['Admin','Manager'],'High',
'Đơn hàng tồn tại','Fulfillment status được cập nhật',
['Admin mở chi tiết đơn hàng','Admin chọn status mới: CONFIRMED -> PACKING -> SHIPPING -> DELIVERED','Nếu chọn SHIPPING: nhập carrier + trackingCode','Admin thêm note (optional)','System gọi API PATCH /payments/orders/:id/fulfillment','System cập nhật fulfillmentStatus, thêm vào statusHistory[]','System gửi email thông báo cho khách hàng'],
['Status transition không hợp lệ -> 400'],'Admin - Order & Inventory');
uc('UC-36','Add Carrier + Tracking',['Admin','Manager'],'Medium',
'Đơn hàng đang ở status PACKING hoặc SHIPPING','Carrier và tracking code được thêm',
['Admin nhập tên carrier (VD: Giao Hàng Nhanh, Viettel Post)','Admin nhập tracking code','System gọi API PATCH /payments/orders/:id/carrier','System lưu thông tin, gửi email cho khách'],
[],'Admin - Order & Inventory');
uc('UC-37','Add Order Note',['Admin','Manager'],'Low',
'Đang xem chi tiết đơn hàng','Ghi chú được thêm vào order',
['Admin nhập note vào ô text','Admin bấm Add Note','System gọi API POST /payments/orders/:id/notes','Note được thêm vào bill.notes[]'],
[],'Admin - Order & Inventory');
uc('UC-38','Send Order Status Email',['System'],'High',
'Order status thay đổi','Email được gửi cho khách hàng',
['Hệ thống phát hiện status thay đổi','System xác định template email phù hợp (confirmed, shipped, delivered)','System gọi Nodemailer transporter.sendMail()','Email được gửi đến email khách hàng','System log kết quả'],
['Gửi thất bại -> log lỗi, không block luồng chính'],'Admin - Order & Inventory');
uc('UC-39','Cancel Order',['Admin','Manager'],'Low',
'Đơn hàng ở status CONFIRMED hoặc PENDING','Đơn hàng bị hủy',
['Admin chọn đơn hàng','Admin bấm Cancel Order','Admin nhập lý do hủy','System gọi API POST /payments/orders/:id/cancel','System cập nhật status = CANCELLED','System hoàn stock (nếu đã trừ)','System gửi email thông báo'],
['Đơn hàng đã SHIPPING -> không thể hủy'],'Admin - Order & Inventory');
uc('UC-40','View Inventory Overview',['Admin','Manager'],'High',
'Đã đăng nhập với role admin/manager','Hiển thị bảng tồn kho',
['Admin vào /admin/inventory','System gọi API GET /inventory','System trả về danh sách products với stock tổng','Highlight: low stock (;=5), out of stock (=0)'],
['Lọc theo low-stock only'],'Admin - Inventory');
uc('UC-41','View Low Stock Alert',['Admin','Manager'],'High',
'Đang xem inventory','Danh sách sản phẩm low stock hiển thị',
['System tự động highlight sản phẩm có stock ;= 5 (vàng) hoặc = 0 (đỏ)','Admin vào tab Low Stock','System gọi API GET /inventory?filter=lowStock','Hiển thị danh sách cần nhập hàng'],
[],'Admin - Inventory');
uc('UC-42','View Stock by Product',['Admin','Manager'],'Medium',
'Đã chọn 1 sản phẩm','Hiển thị chi tiết stock theo color + size',
['Admin click vào sản phẩm','System gọi API GET /inventory/:productId','System trả về colors[] với sizes[] và stock cho mỗi size','Hiển thị bảng chi tiết'],
[],'Admin - Inventory');
uc('UC-43','Adjust Stock (IN/OUT/ADJUST)',['Admin','Manager'],'High',
'Đang xem inventory','Stock được cập nhật, stock movement được ghi',
['Admin chọn sản phẩm, color, size','Admin chọn type: IN (nhập hàng) / OUT (xuất hàng) / ADJUST (điều chỉnh)','Admin nhập quantity và reason','System gọi API POST /inventory/adjust','System cập nhật stock trong shoesDetail','System tạo stockMovements record'],
['Stock sau điều chỉnh ; 0 -> lỗi'],'Admin - Inventory');
uc('UC-44','View Stock Movements',['Admin','Manager'],'Medium',
'Đã có stock adjustments','Lịch sử stock movements hiển thị',
['Admin vào tab Stock Movements','System gọi API GET /inventory/movements/:productId','System trả về: timestamp, type (IN/OUT/ADJUST), quantity, reason, userId','Hiển thị audit trail'],
[],'Admin - Inventory');
uc('UC-45','Export Inventory Report',['Admin','Manager'],'Low',
'Đang xem inventory','File báo cáo được tải xuống',
['Admin bấm Export','System generate CSV/Excel từ dữ liệu inventory','System trả về file download'],
[],'Admin - Inventory');
uc('UC-46','View Return Requests',['Admin','Manager'],'High',
'Đã đăng nhập với role admin/manager','Danh sách return requests hiển thị',
['Admin vào /admin/returns','System gọi API GET /returns','System trả về: type, orderCode, productId, colorName, size, reason, status, createdAt','Admin có thể lọc theo status (PENDING, APPROVED, REJECTED, PROCESSING, COMPLETED)'],
[],'Admin - Returns');
uc('UC-47','View Return Request Detail',['Admin','Manager'],'High',
'Return request tồn tại','Chi tiết return request hiển thị',
['Admin click vào 1 return request','System gọi API GET /returns/:id','System trả về: orderCode, user info, product info, type, reason, note, images, status, adminNote'],
[],'Admin - Returns');
uc('UC-48','Approve Return Request',['Admin','Manager'],'High',
'Return request đang ở status PENDING','Return status = APPROVED',
['Admin xem chi tiết return request','Admin bấm Approve','Admin nhập adminNote (optional)','System gọi API PATCH /returns/:id/status { status: APPROVED, adminNote }','System cập nhật status + adminNote','System gửi email thông báo cho user'],
['Status hiện tại không phải PENDING -> lỗi'],'Admin - Returns');
uc('UC-49','Reject Return Request',['Admin','Manager'],'High',
'Return request đang ở status PENDING','Return status = REJECTED',
['Admin xem chi tiết','Admin bấm Reject','Admin nhập lý do reject (adminNote required)','System gọi API PATCH /returns/:id/status { status: REJECTED, adminNote }','System gửi email thông báo'],
[],'Admin - Returns');
uc('UC-50','Process Return Request',['Admin','Manager'],'Medium',
'Return status = APPROVED','Return status = PROCESSING',
['Admin chọn return status APPROVED','Admin bấm Process','System gọi API PATCH /returns/:id/status { status: PROCESSING }','System cập nhật status','Có thể hoàn stock nếu là RETURN/EXCHANGE'],
[],'Admin - Returns');
uc('UC-51','Complete Return Request',['Admin','Manager'],'Medium',
'Return status = PROCESSING','Return status = COMPLETED',
['Sau khi xử lý xong (hoàn tiền/đổi hàng)','Admin bấm Complete','System gọi API PATCH /returns/:id/status { status: COMPLETED }','System gửi email cho user','Return được đóng'],
[],'Admin - Returns');
uc('UC-52','Notify User Return Status',['System'],'High',
'Return status thay đổi','Email được gửi cho user',
['Khi return status thay đổi','System xác định template (approved, rejected, processing, completed)','System gửi email qua Nodemailer'],
[],'Admin - Returns');
uc('UC-53','Create Coupon',['Admin','Manager'],'High',
'Đã đăng nhập với role admin/manager','Coupon khả dụng cho checkout',
['Admin vào /admin/coupons','Admin bấm Create Coupon','Admin nhập: code, description, discountType (PERCENT/FIXED), discountValue, minOrderAmount, maxDiscount, validFrom, validTo, usageLimit','System gọi API POST /coupons','System lưu coupon'],
['Code đã tồn tại -> 409'],'Admin - Coupons & Users');
uc('UC-54','Update Coupon',['Admin','Manager'],'Medium',
'Coupon tồn tại','Coupon được cập nhật',
['Admin chọn coupon từ danh sách','Admin chỉnh sửa thông tin','System gọi API PUT /coupons/:id','System validate và cập nhật'],
[],'Admin - Coupons & Users');
uc('UC-55','Delete Coupon',['Admin','Manager'],'Medium',
'Coupon tồn tại','Coupon bị xóa hoặc vô hiệu',
['Admin chọn coupon','Admin bấm Delete','System gọi API DELETE /coupons/:id','Coupon bị xóa hoặc set isActive = false'],
[],'Admin - Coupons & Users');
uc('UC-56','View Coupons List',['Admin','Manager'],'Medium',
'Đã đăng nhập với role admin/manager','Danh sách coupons hiển thị',
['Admin vào /admin/coupons','System gọi API GET /coupons','System trả về: code, discount, validFrom, validTo, isActive, usageCount'],
[],'Admin - Coupons & Users');
uc('UC-57','View Users List',['Admin'],'High',
'Đã đăng nhập với role admin','Danh sách users hiển thị',
['Admin vào /admin/users','System gọi API GET /auth/users','System trả về: username, email, fullName, role, createdAt, isActive'],
[],'Admin - Coupons & Users');
uc('UC-58','View User Detail',['Admin'],'Medium',
'User tồn tại','Chi tiết user hiển thị',
['Admin click vào user','System gọi API GET /auth/users/:userId','System trả về: username, email, fullName, phone, role, addresses, createdAt, orderCount'],
[],'Admin - Coupons & Users');
uc('UC-59','Change User Role',['Admin'],'High',
'Target user không phải chính mình','Role của user được thay đổi',
['Admin chọn user','Admin chọn role mới từ dropdown','System gọi API PATCH /auth/users/:userId/role','System cập nhật role trong DB'],
['Admin cố gắng đổi role chính mình -> lỗi'],'Admin - Coupons & Users');
uc('UC-60','Disable User',['Admin'],'Medium',
'User tồn tại','User bị vô hiệu hóa, không thể login',
['Admin chọn user','Admin bấm Disable','System gọi API PATCH /auth/users/:userId/disable','User bị set isActive = false'],
[],'Admin - Coupons & Users');
uc('UC-61','View Dashboard Overview',['Admin','Manager'],'High',
'Đã đăng nhập với role admin/manager','Dashboard hiển thị metrics tổng quan',
['Admin vào /admin/dashboard','System gọi API GET /analytics/dashboard','System trả về: totalRevenue, totalOrders, totalProducts, totalUsers, recentOrders[], topProducts[]','Frontend hiển thị summary cards + charts'],
[],'Admin - Analytics');
uc('UC-62','View Revenue Stats',['Admin','Manager'],'High',
'Đang ở dashboard','Biểu đồ doanh thu hiển thị',
['Admin xem revenue section trên dashboard','System gọi API GET /analytics/revenue?from=...&to=...','System trả về: revenue by day/week/month','Hiển thị line chart / bar chart'],
[],'Admin - Analytics');
uc('UC-63','View Order Stats',['Admin','Manager'],'High',
'Đang ở dashboard','Thống kê đơn hàng hiển thị',
['Admin xem order stats section','System gọi API GET /analytics/orders?from=...&to=...','System trả về: totalOrders, ordersByStatus, ordersByDay','Hiển thị pie chart + line chart'],
[],'Admin - Analytics');
uc('UC-64','View Product Stats',['Admin','Manager'],'Medium',
'Đang ở dashboard','Thống kê sản phẩm hiển thị',
['System trả về top selling products, products by category','Hiển thị bar chart top 10 sản phẩm bán chạy'],
[],'Admin - Analytics');
uc('UC-65','View User Stats',['Admin'],'Medium',
'Đang ở dashboard','Thống kê user hiển thị',
['System trả về: totalUsers, newUsers by day/week, user roles breakdown','Hiển thị line chart + pie chart'],
[],'Admin - Analytics');
uc('UC-66','Filter by Date Range',['Admin','Manager'],'Medium',
'Đang ở dashboard','Dữ liệu được lọc theo khoảng thời gian',
['Admin chọn date range (today, 7 days, 30 days, custom)','System gọi API với query params from/to','Tất cả charts cập nhật theo range đã chọn'],
[],'Admin - Analytics');
uc('UC-67','Export Analytics Report',['Admin'],'Low',
'Đang ở dashboard','File báo cáo được tải xuống',
['Admin bấm Export','System generate PDF/CSV report','System trả về file download'],
[],'Admin - Analytics');
uc('UC-68','Open Chat Widget (Guest)',['Guest'],'Medium',
'Chưa đăng nhập, mở chat widget','Chat widget mở, sẵn sàng gửi tin nhắn',
['Guest bấm vào chat icon góc phải','System hiển thị form: nhập name + email','Guest nhập thông tin','System tạo conversation','Guest có thể gửi tin nhắn đầu tiên'],
[],'Live Chat');
uc('UC-69','Send Chat Message',['Guest','User'],'Medium',
'Chat conversation đang mở','Tin nhắn được gửi',
['User/guest nhập tin nhắn vào chat widget','User bấm Send','System gọi API POST /chat/convs/:id/messages','System push message vào messages[]','System tăng unreadForManager','Tin nhắn hiển thị trong chat widget'],
[],'Live Chat');
uc('UC-70','Receive Chat Reply',['Guest','User'],'Medium',
'Đã gửi tin nhắn','User nhận được reply từ admin',
['User refresh hoặc poll','System gọi API GET /chat/convs/:id','System trả về messages[] mới nhất','User thấy admin reply trong widget'],
[],'Live Chat');
uc('UC-71','View Open Conversations',['Admin','Manager'],'High',
'Đã đăng nhập với role admin/manager','Danh sách conversations hiển thị',
['Admin vào /admin/chat','System gọi API GET /chat/conversations?status=open','System trả về danh sách: convId, userName, lastMessage, unreadForManager, updatedAt','Highlight conversations có unread > 0'],
[],'Admin - Chat');
uc('UC-72','Open Conversation (Admin)',['Admin','Manager'],'High',
'Conversation tồn tại','Lịch sử chat hiển thị',
['Admin click vào conversation','System gọi API GET /chat/convs/:id','System trả về messages[]','Admin đọc tin nhắn','System đánh dấu đã đọc (PATCH /chat/convs/:id/read)'],
[],'Admin - Chat');
uc('UC-73','Reply to Customer Chat',['Admin','Manager'],'High',
'Conversation đang mở','Tin nhắn reply được gửi',
['Admin nhập reply','Admin bấm Send','System gọi API POST /chat/convs/:id/messages { senderType: manager, text }','System push message, tăng unread cho user','Customer thấy reply trong widget'],
[],'Admin - Chat');
uc('UC-74','Mark Conversation Read',['Admin','Manager'],'Low',
'Conversation có unreadForManager > 0','unreadForManager = 0',
['Admin mở conversation','System tự động gọi PATCH /chat/convs/:id/read { target: manager }','unreadForManager reset về 0'],
[],'Admin - Chat');
uc('UC-75','Close Conversation',['Admin','Manager'],'Low',
'Conversation đang mở','Conversation status = CLOSED',
['Admin bấm Close Chat','System gọi API PATCH /chat/convs/:id/close','System set status = CLOSED','Conversation không còn xuất hiện trong danh sách mở'],
[],'Admin - Chat');

// ===== GENERATE XML FILES =====
ucs.forEach(uc => {
  const actors = uc.actors.map(a =>     <Actor></Actor>).join('\n');
  const mainFlow = uc.mainFlow.map((s,i) =>     <Step number=""></Step>).join('\n');
  const altFlow = uc.altFlow.map((s,i) =>     <Alternative id=""></Alternative>).join('\n');
  const xml = <?xml version="1.0" encoding="UTF-8"?>
<UseCase id="" name="" category="">
  <Actors>

  </Actors>
  <Priority></Priority>
  <Precondition></Precondition>
  <Postcondition></Postcondition>
  <MainFlow>

  </MainFlow>
  <AlternativeFlows>

  </AlternativeFlows>
</UseCase>;

  const safeName = uc.id + '-' + uc.name.replace(/[\\/:*?"<>|]/g, '-') + '.xml';
  const filePath = path.join(BASE, safeName);
  fs.writeFileSync(filePath, xml, 'utf8');
});

console.log(Generated  use case XML files in );
