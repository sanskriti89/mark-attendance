import { GguSchool, GguDepartment, GguSelectedCourse } from './types';

export const GGU_SCHOOLS: GguSchool[] = [
  {
    schoolName: 'School of Studies in Engineering & Technology (SoS E&T)',
    departments: [
      { code: 'CSIT', name: 'Computer Science & Information Technology', school: 'Engineering & Technology', degrees: ['BCA', 'MCA', 'M.Sc (CS)', 'Ph.D'] },
      { code: 'CSE', name: 'Computer Science & Engineering', school: 'Engineering & Technology', degrees: ['B.Tech', 'M.Tech', 'Ph.D'] },
      { code: 'IT', name: 'Information Technology', school: 'Engineering & Technology', degrees: ['B.Tech', 'Ph.D'] },
      { code: 'ECE', name: 'Electronics & Communication Engineering', school: 'Engineering & Technology', degrees: ['B.Tech', 'M.Tech', 'Ph.D'] },
      { code: 'MECH', name: 'Mechanical Engineering', school: 'Engineering & Technology', degrees: ['B.Tech', 'M.Tech', 'Ph.D'] },
      { code: 'CIVIL', name: 'Civil Engineering', school: 'Engineering & Technology', degrees: ['B.Tech', 'M.Tech', 'Ph.D'] },
      { code: 'CHEM_ENG', name: 'Chemical Engineering', school: 'Engineering & Technology', degrees: ['B.Tech', 'M.Tech', 'Ph.D'] },
      { code: 'IPE', name: 'Industrial & Production Engineering', school: 'Engineering & Technology', degrees: ['B.Tech', 'Ph.D'] },
    ],
  },
  {
    schoolName: 'School of Studies in Mathematical & Computational Science',
    departments: [
      { code: 'MATH', name: 'Department of Pure & Applied Mathematics', school: 'Mathematical & Computational Science', degrees: ['B.Sc', 'M.Sc', 'Ph.D'] },
      { code: 'PHYSICS', name: 'Department of Pure & Applied Physics', school: 'Mathematical & Computational Science', degrees: ['B.Sc', 'M.Sc', 'Ph.D'] },
    ],
  },
  {
    schoolName: 'School of Studies in Commerce & Management',
    departments: [
      { code: 'MGMT', name: 'Department of Management Studies', school: 'Commerce & Management', degrees: ['B.Com', 'MBA', 'Ph.D'] },
      { code: 'COMMERCE', name: 'Department of Commerce', school: 'Commerce & Management', degrees: ['B.Com (Hons)', 'M.Com', 'Ph.D'] },
    ],
  },
  {
    schoolName: 'School of Studies in Life Sciences',
    departments: [
      { code: 'BIOTECH', name: 'Department of Biotechnology', school: 'Life Sciences', degrees: ['B.Sc', 'M.Sc', 'Ph.D'] },
      { code: 'BOTANY', name: 'Department of Botany', school: 'Life Sciences', degrees: ['B.Sc', 'M.Sc', 'Ph.D'] },
      { code: 'ZOOLOGY', name: 'Department of Zoology', school: 'Life Sciences', degrees: ['B.Sc', 'M.Sc', 'Ph.D'] },
      { code: 'FORENSIC', name: 'Department of Forensic Science', school: 'Life Sciences', degrees: ['B.Sc', 'M.Sc', 'Ph.D'] },
    ],
  },
  {
    schoolName: 'School of Studies in Arts',
    departments: [
      { code: 'ENGLISH', name: 'Department of English & Foreign Languages', school: 'Arts', degrees: ['B.A', 'M.A', 'Ph.D'] },
      { code: 'HINDI', name: 'Department of Hindi', school: 'Arts', degrees: ['B.A', 'M.A', 'Ph.D'] },
      { code: 'JOURNALISM', name: 'Department of Journalism & Mass Communication', school: 'Arts', degrees: ['B.A (JMC)', 'M.A (JMC)', 'Ph.D'] },
    ],
  },
  {
    schoolName: 'School of Studies of Interdisciplinary Education & Research',
    departments: [
      { code: 'PHARMACY', name: 'Department of Pharmacy', school: 'Pharmacy', degrees: ['D.Pharm', 'B.Pharm', 'M.Pharm', 'Ph.D'] },
    ],
  },
];

export const ALL_GGU_DEPARTMENTS: GguDepartment[] = GGU_SCHOOLS.flatMap((s) => s.departments);

export const GGU_OFFICIAL_COURSE_SELECTIONS: GguSelectedCourse[] = [
  { sNo: 1, courseCode: 'COUAMDT2', courseName: 'INTRODUCTION TO INDIAN TAX SYSTEM', credits: 3.0, term: '3 SEMESTER', type: 'MDC' },
  { sNo: 2, courseCode: 'SECC13', courseName: 'DBMS', credits: 3.0, term: '3 SEMESTER', type: 'SEC' },
  { sNo: 3, courseCode: 'CIUCMJT1', courseName: 'Relational Database Management System', credits: 3.0, term: '3 SEMESTER', type: 'Major' },
  { sNo: 4, courseCode: 'CIUCMJL1', courseName: 'Lab based on RDBMS', credits: 1.0, term: '3 SEMESTER', type: 'Major' },
  { sNo: 5, courseCode: 'CIUCMJT2', courseName: 'Operating Systems', credits: 4.0, term: '3 SEMESTER', type: 'Major' },
  { sNo: 6, courseCode: 'AECESUT1', courseName: 'Soft Skills', credits: 2.0, term: '3 SEMESTER', type: 'AEC' },
  { sNo: 7, courseCode: 'VOCCIT03', courseName: 'Python Programming', credits: 1.0, term: '3 SEMESTER', type: 'VAC' },
  { sNo: 8, courseCode: 'VOCCIL03', courseName: 'Lab Based on Python', credits: 3.0, term: '3 SEMESTER', type: 'VAC' },
];
