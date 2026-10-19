import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Schedule } from '../models/Schedule.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { Session } from '../models/Session.js';

dotenv.config();

const seed = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendiq';

  try {
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected! Clearing previous data...');

    await User.deleteMany({});
    await Schedule.deleteMany({});
    await AttendanceRecord.deleteMany({});
    await Session.deleteMany({});

    console.log('Seeding demo users...');
    // Demo Teacher
    const teacher = await User.create({
      role: 'TEACHER',
      name: 'Dr. Eleanor Vance',
      facultyId: 'FAC-CS-8924',
      email: 'e.vance@ggu.ac.in',
      password: 'password123',
      department: 'Computer Science & Information Technology',
      designation: 'Associate Professor',
      phone: '+91 94252 00000',
      officeRoom: 'Room FB-12',
    });

    // Demo Student
    const student = await User.create({
      role: 'STUDENT',
      name: 'Aarav Sharma',
      enrollmentNo: 'GGV/22/0892',
      email: 'aarav.sharma@ggu.ac.in',
      password: 'password123',
      department: 'Computer Science & Information Technology',
      courseLevel: 'UG - Bachelor of Science (Hons)',
      enrolledCourses: ['CIUCMJT2', 'CIUCMJT1', 'SECC13', 'AECESUT1', 'VOCCIT03'],
    });

    console.log('Seeding schedules...');
    await Schedule.insertMany([
      {
        targetRole: 'TEACHER',
        targetId: 'FAC-CS-8924',
        courseCode: 'CIUCMJT2',
        courseName: 'Operating Systems',
        timeSlot: '10:15 AM - 11:15 AM',
        dayOfWeek: 'Today',
        classroom: 'CSIT Lab 2 / Room FB',
        teacherName: 'Dr. Eleanor Vance',
        department: 'CSIT',
        courseType: 'Major',
        credits: 4.0,
        isOngoing: true,
        isAttendanceActive: true,
      },
      {
        targetRole: 'TEACHER',
        targetId: 'FAC-CS-8924',
        courseCode: 'CIUCMJT1',
        courseName: 'Relational Database Management System',
        timeSlot: '11:30 AM - 12:30 PM',
        dayOfWeek: 'Today',
        classroom: 'CSIT Hall 1',
        teacherName: 'Dr. Eleanor Vance',
        department: 'CSIT',
        courseType: 'Major',
        credits: 3.0,
        isOngoing: false,
        isAttendanceActive: false,
      },
      {
        targetRole: 'STUDENT',
        targetId: 'GGV/22/0892',
        courseCode: 'CIUCMJT2',
        courseName: 'Operating Systems',
        timeSlot: '10:15 AM - 11:15 AM',
        dayOfWeek: 'Today',
        classroom: 'CSIT Lab 2 / Room FB',
        teacherName: 'Dr. Eleanor Vance',
        department: 'CSIT',
        courseType: 'Major',
        credits: 4.0,
        isOngoing: true,
        isAttendanceActive: true,
      },
      {
        targetRole: 'STUDENT',
        targetId: 'GGV/22/0892',
        courseCode: 'CIUCMJT1',
        courseName: 'Relational Database Management System',
        timeSlot: '11:30 AM - 12:30 PM',
        dayOfWeek: 'Today',
        classroom: 'CSIT Hall 1',
        teacherName: 'Dr. Eleanor Vance',
        department: 'CSIT',
        courseType: 'Major',
        credits: 3.0,
        isOngoing: false,
        isAttendanceActive: false,
      },
    ]);

    console.log(`✅ Database successfully seeded!`);
    console.log(`Demo Teacher: FAC-CS-8924 / password123`);
    console.log(`Demo Student: GGV/22/0892 / password123`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
