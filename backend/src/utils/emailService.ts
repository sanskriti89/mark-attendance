import nodemailer, { Transporter } from 'nodemailer';

let transporterPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter> {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });
  }

  // Fallback: ethereal test account for offline development
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

export async function sendOtpEmail(toEmail: string, userName: string, otp: string): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #0f172a; margin: 0 0 6px 0; font-size: 20px;">GURU GHASIDAS VISHWAVIDYALAYA</h2>
        <p style="color: #0d9488; font-weight: 700; margin: 0; font-size: 13px; letter-spacing: 1px;">ATTENDIQ • SMART ATTENDANCE SYSTEM</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #f1f5f9;">
        <p style="margin: 0 0 12px 0; font-size: 15px; color: #334155;">Hello <strong>${userName}</strong>,</p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.5;">
          We received a request to reset the password for your GGU AttendIQ account. Use the verification code below to complete your password reset:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background-color: #0f766e; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            ${otp}
          </div>
        </div>

        <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center;">
          This verification code is valid for <strong>10 minutes</strong>. Do NOT share this code with anyone.
        </p>
      </div>

      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0; text-align: center;">
        If you did not request this password reset, please ignore this email or notify university administration immediately.
      </p>
    </div>
  `;

  // 1. Try Resend API (Free 100/day, easiest modern API)
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
      const { data, error } = await resend.emails.send({
        from,
        to: toEmail,
        subject: `Your GGU AttendIQ Verification Code: ${otp}`,
        html: htmlContent,
      });

      if (error) {
        console.error('[RESEND DISPATCH ERROR]', error);
      } else {
        console.log(`[RESEND SUCCESS] Real email dispatched to ${toEmail}. ID: ${data?.id}`);
        return true;
      }
    } catch (err: any) {
      console.error('[RESEND ERROR]', err?.message || err);
    }
  }

  // 2. Try Brevo API (Free 300/day to any email address)
  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail = process.env.BREVO_SENDER || 'noreply@ggu.ac.in';
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'GGU AttendIQ Support', email: senderEmail },
          to: [{ email: toEmail, name: userName }],
          subject: `Your GGU AttendIQ Verification Code: ${otp}`,
          htmlContent,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        console.log(`[BREVO SUCCESS] Real email dispatched to ${toEmail}. Response:`, resData);
        return true;
      } else {
        console.error('[BREVO DISPATCH ERROR]', resData);
      }
    } catch (err: any) {
      console.error('[BREVO ERROR]', err?.message || err);
    }
  }

  // 3. Try Nodemailer SMTP (Gmail App Password, Brevo SMTP, or custom host)
  try {
    if (!transporterPromise) {
      transporterPromise = getTransporter();
    }
    const transporter = await transporterPromise;

    const fromAddress = process.env.EMAIL_FROM || '"GGU AttendIQ Support" <no-reply@ggu.ac.in>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Your GGU AttendIQ Verification Code: ${otp}`,
      text: `Hello ${userName},\n\nYour GGU AttendIQ password reset verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nGuru Ghasidas Vishwavidyalaya`,
      html: htmlContent,
    });

    console.log(`[SMTP DISPATCH] Email dispatched to ${toEmail}. Message ID: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[TEST EMAIL PREVIEW (Ethereal)]: ${previewUrl}`);
    }

    return true;
  } catch (err: any) {
    console.error(`[SMTP ERROR] Failed to send email to ${toEmail}:`, err?.message || err);
    return false;
  }
}

export interface AttendanceReportEmailParams {
  toEmail: string;
  teacherName: string;
  courseCode: string;
  courseName: string;
  classroom: string;
  sessionDate: Date | string;
  totalPresent: number;
  totalAbsent: number;
  totalEnrolled: number;
  records: Array<{
    sNo: string;
    studentName: string;
    studentEnrollment: string;
    department: string;
    courseType: string;
    isPresent: boolean;
    checkInTime: string;
    verificationMethod: string;
  }>;
}

export async function sendAttendanceReportEmail(params: AttendanceReportEmailParams): Promise<boolean> {
  const {
    toEmail,
    teacherName,
    courseCode,
    courseName,
    classroom,
    sessionDate,
    totalPresent,
    totalAbsent,
    totalEnrolled,
    records = [],
  } = params;

  if (!toEmail) {
    console.warn('[EMAIL WARNING] No recipient email provided for attendance report.');
    return false;
  }

  const dateObj = new Date(sessionDate);
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const percentage = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

  const tableRows = records
    .map(
      (r, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 10px 12px; font-size: 13px; color: #64748b; font-weight: 600; text-align: center;">${r.sNo || idx + 1}</td>
        <td style="padding: 10px 12px; font-size: 13px; color: #1e293b; font-weight: 600;">${r.studentName}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #475569; font-family: monospace;">${r.studentEnrollment}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #64748b;">${r.department || 'CSIT'}</td>
        <td style="padding: 10px 12px; text-align: center;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; background-color: ${
            r.isPresent ? '#dcfce7' : '#fee2e2'
          }; color: ${r.isPresent ? '#166534' : '#991b1b'};">
            ${r.isPresent ? 'PRESENT ✓' : 'ABSENT ✗'}
          </span>
        </td>
        <td style="padding: 10px 12px; font-size: 12px; color: #64748b; text-align: center;">${r.checkInTime || '-'}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Attendance Report - ${courseCode}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
      <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 28px 24px; color: #ffffff; text-align: center;">
          <h3 style="margin: 0 0 6px 0; font-size: 14px; letter-spacing: 1.5px; text-transform: uppercase; color: #ffedd5; font-weight: 700;">
            Guru Ghasidas Vishwavidyalaya, Bilaspur
          </h3>
          <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #ffffff;">
            Official Daily Attendance Report
          </h1>
          <p style="margin: 0; font-size: 13px; color: #fed7aa;">
            AttendIQ Smart Campus Automated Session Summary
          </p>
        </div>

        <!-- Session Overview Details -->
        <div style="padding: 24px; background-color: #fafaf9; border-bottom: 1px solid #e7e5e4;">
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px;">
            <div>
              <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; color: #78716c; font-weight: 700; letter-spacing: 0.5px;">Course / Class</p>
              <h2 style="margin: 0; font-size: 18px; color: #1c1917; font-weight: 800;">${courseCode} • ${courseName}</h2>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; color: #78716c; font-weight: 700; letter-spacing: 0.5px;">Session Date</p>
              <p style="margin: 0; font-size: 14px; color: #292524; font-weight: 700;">${formattedDate}</p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #78716c;">Recorded at ${formattedTime}</p>
            </div>
          </div>

          <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed #d6d3d1; display: flex; flex-wrap: wrap; gap: 24px; font-size: 13px; color: #44403c;">
            <div><strong>Faculty:</strong> ${teacherName}</div>
            <div><strong>Room:</strong> ${classroom}</div>
          </div>
        </div>

        <!-- Metric KPI Summary Cards -->
        <div style="padding: 24px;">
          <div style="display: table; width: 100%; margin-bottom: 24px;">
            <div style="display: table-row;">
              <div style="display: table-cell; width: 25%; padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center;">
                <div style="font-size: 22px; font-weight: 800; color: #0f172a;">${totalEnrolled}</div>
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-top: 4px;">Total Enrolled</div>
              </div>
              <div style="display: table-cell; width: 5%;"></div>
              <div style="display: table-cell; width: 25%; padding: 12px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; text-align: center;">
                <div style="font-size: 22px; font-weight: 800; color: #059669;">${totalPresent}</div>
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #047857; margin-top: 4px;">Verified Present</div>
              </div>
              <div style="display: table-cell; width: 5%;"></div>
              <div style="display: table-cell; width: 25%; padding: 12px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; text-align: center;">
                <div style="font-size: 22px; font-weight: 800; color: #dc2626;">${totalAbsent}</div>
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #b91c1c; margin-top: 4px;">Absent</div>
              </div>
              <div style="display: table-cell; width: 5%;"></div>
              <div style="display: table-cell; width: 25%; padding: 12px; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; text-align: center;">
                <div style="font-size: 22px; font-weight: 800; color: #c2410c;">${percentage}%</div>
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9a3412; margin-top: 4px;">Attendance Rate</div>
              </div>
            </div>
          </div>

          <!-- Student Roster Table -->
          <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #1e293b; font-weight: 700;">
            Student Attendance Roster (${records.length} Students)
          </h3>
          <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 10px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #475569; text-align: center;">#</th>
                  <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #475569;">Student Name</th>
                  <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #475569;">Enrollment No</th>
                  <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #475569;">Dept</th>
                  <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #475569; text-align: center;">Status</th>
                  <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #475569; text-align: center;">Time</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows || '<tr><td colspan="6" style="padding: 16px; text-align: center; color: #94a3b8;">No records logged.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
          <p style="margin: 0 0 4px 0;">This is an officially recorded attendance report generated automatically by <strong>GGU AttendIQ</strong>.</p>
          <p style="margin: 0; color: #94a3b8;">Guru Ghasidas Vishwavidyalaya (A Central University) • Bilaspur, Chhattisgarh</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = `[Attendance Report] ${courseCode} (${formattedDate}) - ${totalPresent}/${totalEnrolled} Present (${percentage}%)`;

  // 1. Try Brevo API
  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail = process.env.BREVO_SENDER || 'chaurasiyaji2642007@gmail.com';
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'GGU AttendIQ Smart Campus', email: senderEmail },
          to: [{ email: toEmail, name: teacherName }],
          subject,
          htmlContent,
        }),
      });

      const resData: any = await res.json();
      if (res.ok) {
        console.log(`✅ [BREVO ATTENDANCE EMAIL] Dispatched to teacher (${toEmail}). Message ID:`, resData?.messageId || resData);
        return true;
      } else {
        console.error('⚠️ [BREVO ATTENDANCE EMAIL ERROR]', resData);
      }
    } catch (err: any) {
      console.error('⚠️ [BREVO ATTENDANCE ERROR]', err?.message || err);
    }
  }

  // 2. Try Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
      const { data, error } = await resend.emails.send({
        from,
        to: toEmail,
        subject,
        html: htmlContent,
      });

      if (error) {
        console.error('⚠️ [RESEND ATTENDANCE ERROR]', error);
      } else {
        console.log(`✅ [RESEND ATTENDANCE EMAIL] Dispatched to ${toEmail}. ID: ${data?.id}`);
        return true;
      }
    } catch (err: any) {
      console.error('⚠️ [RESEND ERROR]', err?.message || err);
    }
  }

  // 3. Fallback Nodemailer SMTP
  try {
    if (!transporterPromise) {
      transporterPromise = getTransporter();
    }
    const transporter = await transporterPromise;
    const fromAddress = process.env.EMAIL_FROM || '"GGU AttendIQ" <no-reply@ggu.ac.in>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html: htmlContent,
    });

    console.log(`✅ [SMTP ATTENDANCE EMAIL] Dispatched to ${toEmail}. Message ID: ${info.messageId}`);
    return true;
  } catch (err: any) {
    console.error(`⚠️ [SMTP ATTENDANCE ERROR] Failed to send report email to ${toEmail}:`, err?.message || err);
    return false;
  }
}

