import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Schedule } from '../models/Schedule.js';
import { User } from '../models/User.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const scheduleItems = [
  // Monday
  {
    targetRole: 'TEACHER' as const,
    targetId: 'EMP/2026/8042',
    courseCode: 'CIUCMJT2',
    courseName: 'Operating Systems',
    timeSlot: '10:00 AM - 11:00 AM',
    dayOfWeek: 'Monday',
    classroom: 'CSIT Room FB',
    teacherName: 'Dr. Rajesh Kumar Singh',
    department: 'CSIT',
    courseType: 'Major',
    credits: 4,
    isOngoing: false,
    isAttendanceActive: false
  },
  {
    targetRole: 'TEACHER' as const,
    targetId: 'EMP/2026/8042',
    courseCode: 'CIUCMJL1',
    courseName: 'Lab based on RDBMS',
    timeSlot: '02:00 PM - 04:00 PM',
    dayOfWeek: 'Monday',
    classroom: 'CSIT Lab 2',
    teacherName: 'Dr. Rajesh Kumar Singh',
    department: 'CSIT',
    courseType: 'Major Lab',
    credits: 2,
    isOngoing: false,
    isAttendanceActive: false
  },
  // Tuesday
  {
    targetRole: 'TEACHER' as const,
    targetId: 'EMP/2026/8042',
    courseCode: 'SECC13',
    courseName: 'DBMS (Database Management Systems)',
    timeSlot: '10:00 AM - 11:00 AM',
    dayOfWeek: 'Tuesday',
    classroom: 'CSIT Room FB',
    teacherName: 'Dr. Rajesh Kumar Singh',
    department: 'CSIT',
    courseType: 'SEC',
    credits: 3,
    isOngoing: false,
    isAttendanceActive: false
  },
  {
    targetRole: 'TEACHER' as const,
    targetId: 'EMP/2026/8042',
    courseCode: 'CIUCMJT2',
    courseName: 'Operating Systems',
    timeSlot: '11:00 AM - 12:00 PM',
    dayOfWeek: 'Tuesday',
    classroom: 'CSIT Hall 1',
    teacherName: 'Dr. Rajesh Kumar Singh',
    department: 'CSIT',
    courseType: 'Major',
    credits: 4,
    isOngoing: false,
    isAttendanceActive: false
  },
  // Wednesday
  {
    targetRole: 'TEACHER' as const,
    targetId: 'EMP/2026/8042',
    courseCode: 'CIUCMJT1',
    courseName: 'Relational Database Management System',
    timeSlot: '10:00 AM - 11:00 AM',
    dayOfWeek: 'Wednesday',
    classroom: 'CSIT Room FB',
    teacherName: 'Dr. Rajesh Kumar Singh',
    department: 'CSIT',
    courseType: 'Major',
    credits: 3,
    isOngoing: false,
    isAttendanceActive: false
  },
  {
    targetRole: 'TEACHER' as const,
    targetId: 'EMP/2026/8042',
    courseCode: 'VOCCITO3',
    courseName: 'Python Programming',
    timeSlot: '11:00 AM - 12:00 PM',
    dayOfWeek: 'Wednesday',
    classroom: 'CSIT Hall 1',
    teacherName: 'Dr. Rajesh Kumar Singh',
    department: 'CSIT',
    courseType: 'VAC',
    credits: 3,
    isOngoing: false,
    isAttendanceActive: false
  },
  // Thursday (Today)
  {
    targetRole: 'TEACHER' as const,
    targetId: 'EMP/2026/8042',
    courseCode: 'CIUCMJT2',
    courseName: 'Operating Systems',
    timeSlot: '10:00 AM - 11:00 AM',
    dayOfWeek: 'Thursday',
    classroom: 'CSIT Room FB',
    teacherName: 'Dr. Rajesh Kumar Singh',
    department: 'CSIT',
    courseType: 'Major',
    credits: 4,
    isOngoing: true,
    isAttendanceActive: false
  },
  {
    targetRole: 'TEACHER' as const,
    targetId: 'EMP/2026/8042',
    courseCode: 'SECC13',
    courseName: 'DBMS (Database Management Systems)',
    timeSlot: '11:00 AM - 12:00 PM',
    dayOfWeek: 'Thursday',
    classroom: 'CSIT Room FB',
    teacherName: 'Dr. Rajesh Kumar Singh',
    department: 'CSIT',
    courseType: 'SEC',
    credits: 3,
    isOngoing: false,
    isAttendanceActive: false
  },
  {
    targetRole: 'TEACHER' as const,
    targetId: 'EMP/2026/8042',
    courseCode: 'VOCCILO03',
    courseName: 'Lab Based on Python',
    timeSlot: '02:00 PM - 04:00 PM',
    dayOfWeek: 'Thursday',
    classroom: 'CSIT Lab 1',
    teacherName: 'Dr. Rajesh Kumar Singh',
    department: 'CSIT',
    courseType: 'VAC Lab',
    credits: 2,
    isOngoing: false,
    isAttendanceActive: false
  },
  // Friday
  {
    targetRole: 'TEACHER' as const,
    targetId: 'EMP/2026/8042',
    courseCode: 'CIUCMJT1',
    courseName: 'Relational Database Management System',
    timeSlot: '10:00 AM - 11:00 AM',
    dayOfWeek: 'Friday',
    classroom: 'CSIT Room FB',
    teacherName: 'Dr. Rajesh Kumar Singh',
    department: 'CSIT',
    courseType: 'Major',
    credits: 3,
    isOngoing: false,
    isAttendanceActive: false
  },
  {
    targetRole: 'TEACHER' as const,
    targetId: 'EMP/2026/8042',
    courseCode: 'SECC13',
    courseName: 'DBMS (Database Management Systems)',
    timeSlot: '11:00 AM - 12:00 PM',
    dayOfWeek: 'Friday',
    classroom: 'CSIT Hall 1',
    teacherName: 'Dr. Rajesh Kumar Singh',
    department: 'CSIT',
    courseType: 'SEC',
    credits: 3,
    isOngoing: false,
    isAttendanceActive: false
  },
  {
    targetRole: 'TEACHER' as const,
    targetId: 'EMP/2026/8042',
    courseCode: 'CIUCMJT2',
    courseName: 'Operating Systems',
    timeSlot: '12:00 PM - 01:00 PM',
    dayOfWeek: 'Friday',
    classroom: 'CSIT Room FB',
    teacherName: 'Dr. Rajesh Kumar Singh',
    department: 'CSIT',
    courseType: 'Major',
    credits: 4,
    isOngoing: false,
    isAttendanceActive: false
  }
];

const allItems = [
  ...scheduleItems,
  ...scheduleItems.map((s) => ({ ...s, targetId: 'GGV/EMP/2026/8042' })),
];

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendiq';
  await mongoose.connect(uri);
  console.log('Connected to DB');

  await Schedule.deleteMany({
    targetId: { $in: ['EMP/2026/8042', 'GGV/EMP/2026/8042'] },
  });

  const res = await Schedule.insertMany(allItems);
  console.log(`Inserted ${res.length} timetable schedule records.`);

  // Update teacher user coursesTaught
  await User.updateOne(
    { facultyId: 'EMP/2026/8042' },
    {
      $set: {
        coursesTaught: [
          'CIUCMJT2: Operating Systems',
          'SECC13: DBMS (Database Management Systems)',
          'CIUCMJT1: Relational Database Management System',
          'CIUCMJL1: Lab based on RDBMS',
          'VOCCITO3: Python Programming',
          'VOCCILO03: Lab Based on Python',
        ],
      },
    }
  );

  console.log('Teacher profile coursesTaught updated.');
  await mongoose.disconnect();
}

run().catch(console.error);
