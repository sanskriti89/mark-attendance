import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

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
      });
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
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide identifier (Enrollment/Faculty ID or Email) and password.',
      });
      return;
    }

    const query: any = {
      $or: [
        { email: identifier.toLowerCase() },
        { enrollmentNo: identifier.toUpperCase() },
        { facultyId: identifier.toUpperCase() },
      ],
    };

    if (role) {
      query.role = role.toUpperCase();
    }

    const user = await User.findOne(query).select('+password');

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

// Parse PDF Course Selection Slip and auto-extract fields
export const parsePdfCourseSlip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const file = (req as any).file;
    const fileName = file?.originalname || req.body?.fileName || 'GGU_Course_Selection_Slip.pdf';

    let buffer: Buffer;
    if (file && file.buffer) {
      buffer = file.buffer;
    } else if (req.body?.base64) {
      buffer = Buffer.from(req.body.base64, 'base64');
    } else {
      buffer = Buffer.from('');
    }

    const { parsePdfBuffer } = await import('../utils/pdfParser.js');
    const extracted = await parsePdfBuffer(buffer, fileName);

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

