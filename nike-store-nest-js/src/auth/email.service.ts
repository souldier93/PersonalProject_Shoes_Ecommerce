// email.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    // ✅ Cấu hình transporter (Gmail example)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    // ✅ Link đến file HTML được serve bởi backend
    const backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
    const verificationUrl = `${backendUrl}/verify-email.html?token=${token}`;
    
    console.log('🔗 Verification URL:', verificationUrl); // Debug log

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: '✅ Xác nhận tài khoản của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Chào mừng bạn đến với hệ thống!</h2>
          <p>Vui lòng click vào link bên dưới để xác nhận email của bạn:</p>
          <a href="${verificationUrl}" 
             style="background-color: #4CAF50; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Xác nhận Email
          </a>
          <p style="margin-top: 20px; color: #666;">
            Hoặc copy link sau vào trình duyệt:<br/>
            <code>${verificationUrl}</code>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Link này sẽ hết hạn sau 24 giờ.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent to:', email);
      return { success: true };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error('Failed to send verification email');
    }
  }
}