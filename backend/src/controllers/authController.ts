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

export const deriveAccurateMajor = (
  programmeName?: string,
  enrolledCourses?: any[],
  department?: string,
  courseLevel?: string
): string => {
  // 1. Try matching with Programme Name / Course Level
  const prog = (programmeName || courseLevel || '').toUpperCase();
  if (prog.includes('COMPUTER SCIENCE & ENGINEERING') || prog.includes('CSE')) {
    return 'Computer Science & Engineering';
  }
  if (prog.includes('INFORMATION TECHNOLOGY')) {
    return 'Information Technology';
  }
  if (prog.includes('COMPUTER APPLICATION') || prog.includes('BCA') || prog.includes('MCA')) {
    return 'Computer Applications';
  }
  if (prog.includes('COMPUTER SCIENCE') || prog.includes('BSCS') || prog.includes('B.SC (CS)')) {
    return 'Computer Science';
  }
  if (prog.includes('ELECTRONICS') || prog.includes('ECE')) {
    return 'Electronics & Communication';
  }
  if (prog.includes('MECHANICAL') || prog.includes('MECH')) {
    return 'Mechanical Engineering';
  }
  if (prog.includes('CIVIL')) {
    return 'Civil Engineering';
  }
  if (prog.includes('CHEMICAL')) {
    return 'Chemical Engineering';
  }
  if (prog.includes('MATHEMATICS') || prog.includes('MATH')) {
    return 'Mathematics';
  }
  if (prog.includes('PHYSICS')) {
    return 'Physics';
  }
  if (prog.includes('BIOTECHNOLOGY') || prog.includes('BIOTECH')) {
    return 'Biotechnology';
  }
  if (prog.includes('COMMERCE') || prog.includes('B.COM')) {
    return 'Commerce';
  }
  if (prog.includes('MANAGEMENT') || prog.includes('MBA') || prog.includes('BBA')) {
    return 'Management Studies';
  }
  if (prog.includes('PHARMACY') || prog.includes('B.PHARM')) {
    return 'Pharmacy';
  }

  // 2. Try matching with Courses Enrolled In (checking Major courses)
  if (Array.isArray(enrolledCourses) && enrolledCourses.length > 0) {
    for (const c of enrolledCourses) {
      const code = (typeof c === 'string' ? c : c?.courseCode || '').toUpperCase();
      const name = (typeof c === 'object' && c !== null ? c?.courseName || '' : '').toUpperCase();

      // Check Major subject indicators
      if (code.startsWith('CI') || code.includes('MJT') || code.includes('MJL')) {
        return 'Computer Science';
      }
      if (code.startsWith('CS') || code.startsWith('CSE')) {
        return 'Computer Science & Engineering';
      }
      if (code.startsWith('IT')) {
        return 'Information Technology';
      }
      if (code.startsWith('BCA') || code.startsWith('MCA')) {
        return 'Computer Applications';
      }
      if (code.startsWith('EC')) {
        return 'Electronics & Communication';
      }
      if (code.startsWith('ME')) {
        return 'Mechanical Engineering';
      }
      if (code.startsWith('CE')) {
        return 'Civil Engineering';
      }
      if (code.startsWith('MA')) {
        return 'Mathematics';
      }
      if (code.startsWith('PH')) {
        return 'Physics';
      }

      if (/OPERATING SYSTEM|DATABASE|RDBMS|DATA STRUCTURE|ALGORITHM|PYTHON|JAVA|COMPILER/i.test(name)) {
        return 'Computer Science';
      }
    }
  }

  // 3. Fallback to Department matching
  const dept = (department || '').toUpperCase();
  if (dept.includes('CSIT') || dept.includes('COMPUTER SCIENCE & INFORMATION TECHNOLOGY')) {
    return 'Computer Science';
  }
  if (dept.includes('CSE')) return 'Computer Science & Engineering';
  if (dept.includes('IT')) return 'Information Technology';
  if (dept.includes('ECE')) return 'Electronics & Communication';
  if (dept.includes('MECH')) return 'Mechanical Engineering';
  if (dept.includes('CIVIL')) return 'Civil Engineering';
  if (dept.includes('MATH')) return 'Mathematics';
  if (dept.includes('PHYSICS')) return 'Physics';
  if (dept.includes('COMMERCE')) return 'Commerce';
  if (dept.includes('MANAGEMENT')) return 'Management Studies';
  if (dept.includes('PHARMACY')) return 'Pharmacy';

  return department || 'Computer Science';
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
      major,
      programmeName,
      enrolledCourses,
    } = req.body;

    if (!name || !enrollmentNo || !email || !password || !department) {
      res.status(400).json({
        success: false,
        message: 'Name, Enrollment No, Email, Password, and Department are required.',
      });
      return;
    }

    const resolvedMajor = major || deriveAccurateMajor(programmeName, enrolledCourses, department, courseLevel);
    const resolvedProgramme = programmeName || courseLevel || 'Bachelor of Science (Hons) Computer Science';

    let student = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { enrollmentNo: enrollmentNo.toUpperCase() }],
    });

    if (student) {
      student.name = name;
      student.password = password;
      student.department = department;
      if (courseLevel) student.courseLevel = courseLevel;
      student.major = resolvedMajor;
      student.programmeName = resolvedProgramme;
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
        major: resolvedMajor,
        programmeName: resolvedProgramme,
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
        major: student.major,
        programmeName: student.programmeName,
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
        message: 'Wrong password',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Wrong password',
      });
      return;
    }

    const token = generateToken(user);

    const resolvedMajor =
      user.major ||
      deriveAccurateMajor(user.programmeName, user.enrolledCourses, user.department, user.courseLevel);
    const resolvedProgramme =
      user.programmeName || user.courseLevel || 'Bachelor of Science (Hons) Computer Science';
    const resolvedEmail =
      user.email ||
      (user.enrollmentNo
        ? `${user.enrollmentNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@ggu.ac.in`
        : `${user.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@ggu.ac.in`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: resolvedEmail,
        enrollmentNo: user.enrollmentNo,
        facultyId: user.facultyId,
        department: user.department,
        designation: user.designation,
        courseLevel: user.courseLevel,
        major: resolvedMajor,
        programmeName: resolvedProgramme,
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

    const resolvedMajor =
      user.major ||
      deriveAccurateMajor(user.programmeName, user.enrolledCourses, user.department, user.courseLevel);
    const resolvedProgramme =
      user.programmeName || user.courseLevel || 'Bachelor of Science (Hons) Computer Science';
    const resolvedEmail =
      user.email ||
      (user.enrollmentNo
        ? `${user.enrollmentNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@ggu.ac.in`
        : `${user.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@ggu.ac.in`);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: resolvedEmail,
        enrollmentNo: user.enrollmentNo,
        facultyId: user.facultyId,
        department: user.department,
        designation: user.designation,
        courseLevel: user.courseLevel,
        major: resolvedMajor,
        programmeName: resolvedProgramme,
        enrolledCourses: user.enrolledCourses || [],
        coursesTaught: user.coursesTaught || [],
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

