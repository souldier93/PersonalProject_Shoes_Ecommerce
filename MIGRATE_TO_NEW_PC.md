# Chuyển NikeStore sang máy Windows mới

Mã nguồn chính thức nằm tại:

`https://github.com/souldier93/PersonalProject_Shoes_Ecommerce`

File `.env`, thông tin tài khoản cục bộ và bản sao dữ liệu không được đưa lên GitHub. Chúng nằm trong gói `nikeStore-private-*.7z` đã mã hóa ở thư mục chuyển máy.

## Cách nhanh nhất trên máy mới

1. Đăng nhập OneDrive và chờ thư mục `nikeStore-transfer-*` tải xong hoàn toàn.
2. Mở PowerShell trong thư mục chuyển máy.
3. Chạy lệnh sau:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\setup-new-windows-pc.ps1 -InstallPrerequisites -StartServices -RestoreData
```

4. Nhập mật khẩu của gói riêng tư khi script yêu cầu. Mật khẩu này phải được lưu riêng, không nằm trong thư mục OneDrive và không nằm trong Git.
5. Nếu Windows hoặc Docker yêu cầu khởi động lại, hãy khởi động lại máy rồi chạy lại đúng lệnh trên. Script có thể chạy lặp an toàn: nó không ghi đè database đã có dữ liệu.

Script sẽ tự thực hiện:

- cài Git, Node.js LTS, VS Code, GitHub CLI, 7-Zip và Docker Desktop nếu máy chưa có;
- clone project vào `%USERPROFILE%\source\nikeStore`;
- khôi phục các file `.env` từ gói mã hóa;
- cài package bằng `npm ci` cho backend và frontend;
- build backend, chạy unit test backend và build frontend;
- chạy MongoDB/Redis, khôi phục dữ liệu có trong gói, tạo lại role/tài khoản admin ban đầu khi database mới còn trống và mở project bằng VS Code.

## Đăng nhập GitHub để tiếp tục sửa và push code

Repository hiện là public nên có thể clone mà chưa cần đăng nhập. Trước lần `git push` đầu tiên trên máy mới, chạy:

```powershell
gh auth login
```

Chọn `GitHub.com` và đăng nhập bằng tài khoản có quyền với repository `souldier93/PersonalProject_Shoes_Ecommerce`.

## Mở và chạy project hằng ngày

Trong VS Code, mở `Terminal > Run Task` rồi chạy ba task:

1. `Nike: Start MongoDB and Redis`
2. `Nike: Backend`
3. `Nike: Frontend`

Địa chỉ phát triển:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- MongoDB: `mongodb://localhost:27017`
- Redis: `redis://localhost:6379/0`

## Bản sao dự phòng không cần GitHub

Thư mục chuyển máy còn có `nikeStore-repository.bundle`. Nếu GitHub tạm thời không truy cập được, clone từ bundle:

```powershell
git clone .\nikeStore-repository.bundle "$HOME\source\nikeStore"
cd "$HOME\source\nikeStore"
git remote set-url origin https://github.com/souldier93/PersonalProject_Shoes_Ecommerce.git
```

Sau đó chạy lại `setup-new-windows-pc.ps1` và truyền `-ProjectPath "$HOME\source\nikeStore"`.

## Kiểm tra file có tải đúng không

Trong thư mục chuyển máy, chạy:

```powershell
Get-Content .\CHECKSUMS-SHA256.txt | ForEach-Object {
    $hash, $name = $_ -split '  ', 2
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath ".\$name").Hash.ToLowerInvariant() -ne $hash) {
        throw "File bị thiếu hoặc hỏng: $name"
    }
}
```

Không xóa project trên máy cũ cho đến khi máy mới đã build, test và mở được giao diện thành công.
