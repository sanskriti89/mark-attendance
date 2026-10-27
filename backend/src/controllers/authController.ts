import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { Schedule } from '../models/Schedule.js';
import { Otp } from '../models/Otp.js';
import { DeviceBinding } from '../models/DeviceBinding.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { sendOtpEmail } from '../utils/emailService.js';

const generateToken = (user: IUser): string => {
  const secret = process.env.JWT_SECRET || 'ggu_attendiq_jwt_secret_token_secure_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
      department: user.department,
      enrollmentNo: user.enrollmentNo,
      facultyId: user.facultyId,
    },
    secret,
    { expiresIn: expiresIn as any }
  );
};

const getTodayISTString = (): { dateStr: string; midnightExpiry: Date } => {
  const now = new Date();
  const istDateString = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const midnightIST = new Date(`${istDateString}T23:59:59.999+05:30`);
  return { dateStr: istDateString, midnightExpiry: midnightIST };
};

// Register Student
export const registerStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      enrollmentNo,
      email,
      password,
      department,
      courseLevel,
      enrolledCourses,
    } = req.body;

    if (!name || !enrollmentNo || !email || !password || !department) {
      res.status(400).json({
        success: false,
        message: 'Name, Enrollment No, Email, Password, and Department are required.',
      });
      return;
    }

    let student = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { enrollmentNo: enrollmentNo.toUpperCase() }],
    });

    if (student) {
      student.name = name;
      student.password = password;
      student.department = department;
      if (courseLevel) student.courseLevel = courseLevel;
      if (enrolledCourses) student.enrolledCourses = enrolledCourses;
      await student.save();
    } else {
      student = await User.create({
        role: 'STUDENT',
        name,
        enrollmentNo: enrollmentNo.toUpperCase(),
        email: email.toLowerCase(),
        password,
        department,
        courseLevel: courseLevel || 'UG - Bachelor of Science (Hons)',
        enrolledCourses: enrolledCourses || [],
      });
    }

    const token = generateToken(student);

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      token,
      user: {
        id: student._id,
        role: student.role,
        name: student.name,
        email: student.email,
        enrollmentNo: student.enrollmentNo,
        department: student.department,
        courseLevel: student.courseLevel,
        enrolledCourses: student.enrolledCourses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Register Teacher
export const registerTeacher = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      facultyId,
      email,
      password,
      department,
      designation,
      phone,
      officeRoom,
      coursesTaught,
      schedules,
    } = req.body;

    if (!name || !facultyId || !email || !password || !department) {
      res.status(400).json({
        success: false,
        message: 'Name, Faculty ID, Email, Password, and Department are required.',
      });
      return;
    }

    let teacher = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { facultyId: facultyId.toUpperCase() }],
    });

    if (teacher) {
      teacher.name = name;
      teacher.password = password;
      teacher.department = department;
      if (designation) teacher.designation = designation;
      if (phone) teacher.phone = phone;
      if (officeRoom) teacher.officeRoom = officeRoom;
      if (coursesTaught) teacher.coursesTaught = coursesTaught;
      await teacher.save();
    } else {
      teacher = await User.create({
        role: 'TEACHER',
        name,
        facultyId: facultyId.toUpperCase(),
        email: email.toLowerCase(),
        password,
        department,
        designation: designation || 'Assistant Professor',
        phone: phone || '',
        officeRoom: officeRoom || '',
        coursesTaught: coursesTaught || [],
      });
    }

    if (Array.isArray(schedules) && schedules.length > 0) {
      const cleanFacId = facultyId.toUpperCase();
      await Schedule.deleteMany({
        targetRole: 'TEACHER',
        targetId: { $in: [cleanFacId, facultyId, `GGV/${cleanFacId}`] },
      });
      const formatted = schedules.map((s: any) => ({
        targetRole: 'TEACHER',
        targetId: cleanFacId,
        courseCode: s.courseCode,
        courseName: s.courseName,
        timeSlot: s.timeSlot || '10:00 AM - 11:00 AM',
        dayOfWeek: s.dayOfWeek || 'Today',
        classroom: s.classroom || 'CSIT Room FB',
        teacherName: name,
        department: department,
        courseType: s.courseType || 'Major',
        credits: s.credits || 3,
        isOngoing: !!s.isOngoing,
        isAttendanceActive: !!s.isAttendanceActive,
      }));
      await Schedule.insertMany(formatted);
    }

    const token = generateToken(teacher);

    res.status(201).json({
      success: true,
      message: 'Teacher registered successfully',
      token,
      user: {
        id: teacher._id,
        role: teacher.role,
        name: teacher.name,
        email: teacher.email,
        facultyId: teacher.facultyId,
        department: teacher.department,
        designation: teacher.designation,
        phone: teacher.phone,
        officeRoom: teacher.officeRoom,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Unified Login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier, password, role, deviceId } = req.body;

    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide identifier (Enrollment/Faculty ID or Email) and password.',
      });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database is connecting. Please try again in a few moments.',
      });
      return;
    }

    const trimmedId = String(identifier).trim();

    const query: any = {
      $or: [
        { email: trimmedId.toLowerCase() },
        { enrollmentNo: trimmedId.toUpperCase() },
        { facultyId: trimmedId.toUpperCase() },
        { enrollmentNo: trimmedId },
        { facultyId: trimmedId },
      ],
    };

    if (role) {
      query.role = String(role).toUpperCase();
    }

    const user = await User.findOne(query).select('+password').maxTimeMS(12000);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
      return;
    }

    // Single Device Binding for Students (Prevents 2 students logging in from same device today)
    if (user.role === 'STUDENT' && deviceId) {
      const cleanDeviceId = String(deviceId).trim();
      if (cleanDeviceId) {
        const { dateStr, midnightExpiry } = getTodayISTString();
        const existingBinding = await DeviceBinding.findOne({
          deviceId: cleanDeviceId,
          loginDate: dateStr,
        });

        if (existingBinding) {
          const isSameStudent =
            existingBinding.boundUserId.toString() === user._id.toString() ||
            existingBinding.boundEnrollmentNo.toUpperCase() === (user.enrollmentNo || '').toUpperCase();

          if (!isSameStudent) {
            res.status(403).json({
              success: false,
              isDeviceLocked: true,
              boundEnrollmentNo: existingBinding.boundEnrollmentNo,
              boundUserName: existingBinding.boundUserName,
              message: `New ID cannot be logged in from this device today! Proxy attendance prevent karne ke liye ek device se 1 din me sirf ek student login ho sakta hai. Yeh device aaj pehle se ${existingBinding.boundUserName} (${existingBinding.boundEnrollmentNo}) ke account se registered hai. Midnight (12:00 AM) ke baad reset hoga.`,
            });
            return;
          }
        } else {
          try {
            await DeviceBinding.create({
              deviceId: cleanDeviceId,
              boundUserId: user._id,
              boundEnrollmentNo: user.enrollmentNo || trimmedId,
              boundUserName: user.name,
              loginDate: dateStr,
              expiresAt: midnightExpiry,
            });
          } catch (bindErr: any) {
            if (bindErr.code === 11000) {
              const raceBinding = await DeviceBinding.findOne({
                deviceId: cleanDeviceId,
                loginDate: dateStr,
              });
              if (
                raceBinding &&
                raceBinding.boundUserId.toString() !== user._id.toString() &&
                raceBinding.boundEnrollmentNo.toUpperCase() !== (user.enrollmentNo || '').toUpperCase()
              ) {
                res.status(403).json({
                  success: false,
                  isDeviceLocked: true,
                  boundEnrollmentNo: raceBinding.boundEnrollmentNo,
                  boundUserName: raceBinding.boundUserName,
                  message: `New ID cannot be logged in from this device today! Proxy attendance prevent karne ke liye ek device se 1 din me sirf ek student login ho sakta hai. Yeh device aaj pehle se ${raceBinding.boundUserName} (${raceBinding.boundEnrollmentNo}) ke account se registered hai. Midnight (12:00 AM) ke baad reset hoga.`,
                });
                return;
              }
            }
          }
        }
      }
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        enrollmentNo: user.enrollmentNo,
        facultyId: user.facultyId,
        department: user.department,
        designation: user.designation,
        courseLevel: user.courseLevel,
        enrolledCourses: user.enrolledCourses || [],
        coursesTaught: user.coursesTaught || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper to mask emails for secure display (e.g., ku***@gmail.com)
const maskEmail = (email: string) => {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  const visible = name.slice(0, 2);
  return `${visible}***@${domain}`;
};

// Send OTP for Password Reset
export const sendResetOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier, email, role } = req.body;

    if (!identifier || !email) {
      res.status(400).json({
        success: false,
        message: 'Both your ID (Enrollment No / Faculty ID) and registered GGU Email are required.',
      });
      return;
    }

    const trimmedId = String(identifier).trim();
    const trimmedEmail = String(email).trim().toLowerCase();

    const query: any = {
      $or: [
        { email: trimmedId.toLowerCase() },
        { enrollmentNo: trimmedId.toUpperCase() },
        { facultyId: trimmedId.toUpperCase() },
        { enrollmentNo: trimmedId },
        { facultyId: trimmedId },
      ],
    };

    if (role) {
      query.role = String(role).toUpperCase();
    }

    const user = await User.findOne(query);

    if (!user) {
      res.status(404).json({
        success: false,
        message: `Account not found with identifier "${trimmedId}". Please verify your ID.`,
      });
      return;
    }

    // CRITICAL SECURITY CHECK: Authenticate that provided email matches registered account email
    if (user.email.toLowerCase().trim() !== trimmedEmail) {
      res.status(400).json({
        success: false,
        message: 'Security Verification Failed: The provided email does not match registered university records for this ID.',
      });
      return;
    }

    // Generate 6-digit random verification OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Clear any previous OTPs for this user
    await Otp.deleteMany({
      $or: [
        { identifier: trimmedId },
        { email: trimmedEmail },
      ],
    });

    await Otp.create({
      identifier: trimmedId,
      email: trimmedEmail,
      otp: otpCode,
      expiresAt,
    });

    console.log(`[AUTH SECURITY] 6-Digit Password Reset OTP for ${user.email} (${trimmedId}): ${otpCode}`);

    // Send actual OTP email to the registered email address
    await sendOtpEmail(user.email, user.name, otpCode);

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been dispatched to your registered email (${maskEmail(user.email)}). Please check your inbox.`,
      maskedEmail: maskEmail(user.email),
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password with OTP Authentication
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier, email, otp, newPassword, role } = req.body;

    if (!identifier || !email || !otp || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'ID, registered email, 6-digit OTP code, and new password are all required.',
      });
      return;
    }

    const trimmedPassword = String(newPassword).trim();
    if (trimmedPassword.length < 4) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 4 characters long.',
      });
      return;
    }

    const trimmedId = String(identifier).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedOtp = String(otp).trim();

    const query: any = {
      $or: [
        { email: trimmedId.toLowerCase() },
        { enrollmentNo: trimmedId.toUpperCase() },
        { facultyId: trimmedId.toUpperCase() },
        { enrollmentNo: trimmedId },
        { facultyId: trimmedId },
      ],
    };

    if (role) {
      query.role = String(role).toUpperCase();
    }

    const user = await User.findOne(query).select('+password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: `Account not found with identifier "${trimmedId}".`,
      });
      return;
    }

    // Security check: email matches registered record
    if (user.email.toLowerCase().trim() !== trimmedEmail) {
      res.status(400).json({
        success: false,
        message: 'Security Verification Failed: The provided email does not match registered university records.',
      });
      return;
    }

    // Security check: Verify OTP
    const validOtp = await Otp.findOne({
      $or: [
        { identifier: trimmedId },
        { email: trimmedEmail },
      ],
      otp: trimmedOtp,
      expiresAt: { $gt: new Date() },
    });

    if (!validOtp) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired 6-digit verification code. Please request a new code.',
      });
      return;
    }

    // Assigning new password triggers User pre('save') bcrypt hashing
    user.password = trimmedPassword;
    await user.save();

    // Consume the OTP so it cannot be reused
    await Otp.deleteMany({
      $or: [
        { identifier: trimmedId },
        { email: trimmedEmail },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Password has been authenticated and successfully updated! You can now log in.',
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        enrollmentNo: user.enrollmentNo,
        facultyId: user.facultyId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Current Logged In User
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Lookup user by Enrollment No / Faculty ID / Email (public profile info)
export const lookupUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const identifier = String(req.query.identifier || '').trim();
    if (!identifier) {
      res.status(400).json({ success: false, message: 'Identifier query parameter is required.' });
      return;
    }

    const user = await User.findOne({
      $or: [
        { enrollmentNo: identifier.toUpperCase() },
        { enrollmentNo: identifier },
        { facultyId: identifier.toUpperCase() },
        { facultyId: identifier },
        { email: identifier.toLowerCase() },
      ],
    }).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        enrollmentNo: user.enrollmentNo,
        facultyId: user.facultyId,
        department: user.department,
        designation: user.designation,
        courseLevel: user.courseLevel,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Parse PDF Course Selection Slip and auto-extract fields
export const parsePdfCourseSlip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const file = (req as any).file;
    const fileName = file?.originalname || req.body?.fileName || 'GGU_Course_Selection_Slip.pdf';
    const docType = req.body?.docType || (req as any).body?.docType || '';
    const isTeacher = docType === 'TEACHER_ID' || /teacher|faculty|id_card|idcard|emp/i.test(fileName);

    let buffer: Buffer;
    if (file && file.buffer) {
      buffer = file.buffer;
    } else if (req.body?.base64) {
      buffer = Buffer.from(req.body.base64, 'base64');
    } else {
      buffer = Buffer.from('');
    }

    const { parsePdfBuffer } = await import('../utils/pdfParser.js');
    const extracted = await parsePdfBuffer(buffer, fileName, isTeacher);

    res.status(200).json({
      success: true,
      fileName,
      extracted,
      message: `Successfully parsed ${fileName}`,
    });
  } catch (error) {
    next(error);
  }
};

