import { PDFParse } from 'pdf-parse';
import Tesseract from 'tesseract.js';
import zlib from 'zlib';

export interface ExtractedCourse {
  sNo: number;
  courseCode: string;
  courseName: string;
  credits: number;
  term?: string;
  type?: string;
}

export interface ExtractedStudentDetails {
  name: string;
  enrollmentNo: string;
  email: string;
  department: string;
  courseLevel: string;
  enrolledCourses: string[]; // ["CIUCMJT1: Relational Database Management System", ...]
  extractedCoursesDetails: ExtractedCourse[]; // Structured course array
  rawTextPreview: string;
  teacherName?: string;
  facultyId?: string;
  designation?: string;
  phone?: string;
  officeRoom?: string;
}

export const KNOWN_GGU_COURSES: Record<string, { name: string; credits: number; type: string; term?: string }> = {
  // 1st Semester GGU Courses (NEP 2020)
  CIUAMJT1: { name: 'Programming using C -Theory', credits: 3.0, type: 'Major', term: '1ST SEMESTER' },
  CIUAMJL1: { name: 'Programming using C - Lab', credits: 1.0, type: 'Major Lab', term: '1ST SEMESTER' },
  PLUAMNT1: { name: 'Basic Circuit Theory & Network Analysis', credits: 3.0, type: 'Minor', term: '1ST SEMESTER' },
  PLUAMNL1: { name: 'Basic Circuit Theory & Network Analysis Lab', credits: 1.0, type: 'Minor Lab', term: '1ST SEMESTER' },
  ESUAAET1: { name: 'English Communication', credits: 2.0, type: 'AEC', term: '1ST SEMESTER' },
  MDCEDT2: { name: 'Guidance and Counselling', credits: 3.0, type: 'MDC', term: '1ST SEMESTER' },
  SECMS01: { name: 'Basics of Communication Skills', credits: 3.0, type: 'SEC', term: '1ST SEMESTER' },
  VACCIO1: { name: 'Cyber Education and Awareness', credits: 2.0, type: 'VAC', term: '1ST SEMESTER' },
  VACCIO01: { name: 'Cyber Education and Awareness', credits: 2.0, type: 'VAC', term: '1ST SEMESTER' },
  VACLW01: { name: 'Constitutional values under Indian Constitution', credits: 2.0, type: 'VAC', term: '1ST SEMESTER' },
  VCLW01: { name: 'Constitutional values under Indian Constitution', credits: 2.0, type: 'VAC', term: '1ST SEMESTER' },
  HIUCAET1: { name: 'Hindi Bhasha Aur Sahitya', credits: 2.0, type: 'AEC', term: '1ST SEMESTER' },

  // 3rd Semester GGU Courses (NEP 2020)
  COUAMDT2: { name: 'INTRODUCTION TO INDIAN TAX SYSTEM', credits: 3.0, type: 'MDC', term: '3 SEMESTER' },
  SECC13: { name: 'DBMS (Database Management Systems)', credits: 3.0, type: 'SEC', term: '3 SEMESTER' },
  CIUCMJT1: { name: 'Relational Database Management System', credits: 3.0, type: 'Major', term: '3 SEMESTER' },
  CIUCMJL1: { name: 'Lab based on RDBMS', credits: 1.0, type: 'Major Lab', term: '3 SEMESTER' },
  CIUCMJT2: { name: 'Operating Systems', credits: 4.0, type: 'Major', term: '3 SEMESTER' },
  CAUCMJT2: { name: 'Principals of Operating Systems', credits: 4.0, type: 'Major', term: '3 SEMESTER' },
  AECESUT1: { name: 'Soft Skills', credits: 2.0, type: 'AEC', term: '3 SEMESTER' },
  VOCCIT03: { name: 'Python Programming', credits: 1.0, type: 'VAC', term: '3 SEMESTER' },
  VOCCIL03: { name: 'Lab Based on Python', credits: 3.0, type: 'VAC', term: '3 SEMESTER' },
  VOCCILO03: { name: 'Lab Based on Python', credits: 3.0, type: 'VAC', term: '3 SEMESTER' },

  // Core CS/IT courses
  CS301: { name: 'Operating Systems', credits: 4.0, type: 'Core', term: '3 SEMESTER' },
  CS302: { name: 'Database Management Systems', credits: 4.0, type: 'Core', term: '3 SEMESTER' },
  CS303: { name: 'Computer Networks', credits: 4.0, type: 'Core', term: '3 SEMESTER' },
  CS304: { name: 'Design and Analysis of Algorithms', credits: 4.0, type: 'Core', term: '3 SEMESTER' },
  CS305: { name: 'Software Engineering', credits: 3.0, type: 'Core', term: '3 SEMESTER' },
  IT301: { name: 'Web Technologies', credits: 3.0, type: 'Core', term: '3 SEMESTER' },
  IT302: { name: 'Java Programming', credits: 4.0, type: 'Core', term: '3 SEMESTER' },
  BCA101: { name: 'Fundamentals of Computer & IT', credits: 4.0, type: 'Core', term: '1 SEMESTER' },
  BCA102: { name: 'Programming in C', credits: 4.0, type: 'Core', term: '1 SEMESTER' },
  BCA201: { name: 'Data Structures using C', credits: 4.0, type: 'Core', term: '2 SEMESTER' },
  BCA301: { name: 'Operating Systems', credits: 4.0, type: 'Core', term: '3 SEMESTER' },
  BCA302: { name: 'Database Management Systems', credits: 4.0, type: 'Core', term: '3 SEMESTER' },
};

export const STANDARD_GGU_SEMESTER_COURSES: Record<string, ExtractedCourse[]> = {
  '1ST SEMESTER': [
    { sNo: 1, courseCode: 'CIUAMJT1', courseName: 'Programming using C -Theory', credits: 3.0, type: 'Major', term: '1ST SEMESTER' },
    { sNo: 2, courseCode: 'CIUAMJL1', courseName: 'Programming using C - Lab', credits: 1.0, type: 'Major Lab', term: '1ST SEMESTER' },
    { sNo: 3, courseCode: 'PLUAMNT1', courseName: 'Basic Circuit Theory & Network Analysis', credits: 3.0, type: 'Minor', term: '1ST SEMESTER' },
    { sNo: 4, courseCode: 'PLUAMNL1', courseName: 'Basic Circuit Theory & Network Analysis Lab', credits: 1.0, type: 'Minor Lab', term: '1ST SEMESTER' },
    { sNo: 5, courseCode: 'ESUAAET1', courseName: 'English Communication', credits: 2.0, type: 'AEC', term: '1ST SEMESTER' },
    { sNo: 6, courseCode: 'MDCEDT2', courseName: 'Guidance and Counselling', credits: 3.0, type: 'MDC', term: '1ST SEMESTER' },
    { sNo: 7, courseCode: 'SECMS01', courseName: 'Basics of Communication Skills', credits: 3.0, type: 'SEC', term: '1ST SEMESTER' },
    { sNo: 8, courseCode: 'VACCIO1', courseName: 'Cyber Education and Awareness', credits: 2.0, type: 'VAC', term: '1ST SEMESTER' },
    { sNo: 9, courseCode: 'VACLW01', courseName: 'Constitutional values under Indian Constitution', credits: 2.0, type: 'VAC', term: '1ST SEMESTER' },
  ],
  '3RD SEMESTER': [
    { sNo: 1, courseCode: 'CIUCMJT1', courseName: 'Relational Database Management System', credits: 3.0, type: 'Major', term: '3RD SEMESTER' },
    { sNo: 2, courseCode: 'CIUCMJL1', courseName: 'Lab based on RDBMS', credits: 1.0, type: 'Major Lab', term: '3RD SEMESTER' },
    { sNo: 3, courseCode: 'CIUCMJT2', courseName: 'Operating Systems', credits: 4.0, type: 'Major', term: '3RD SEMESTER' },
    { sNo: 4, courseCode: 'COUAMDT2', courseName: 'INTRODUCTION TO INDIAN TAX SYSTEM', credits: 3.0, type: 'MDC', term: '3RD SEMESTER' },
    { sNo: 5, courseCode: 'SECC13', courseName: 'DBMS (Database Management Systems)', credits: 3.0, type: 'SEC', term: '3RD SEMESTER' },
    { sNo: 6, courseCode: 'AECESUT1', courseName: 'Soft Skills', credits: 2.0, type: 'AEC', term: '3RD SEMESTER' },
    { sNo: 7, courseCode: 'VOCCIL03', courseName: 'Lab Based on Python', credits: 3.0, type: 'VAC', term: '3RD SEMESTER' },
    { sNo: 8, courseCode: 'VOCCIT03', courseName: 'Python Programming', credits: 1.0, type: 'VAC', term: '3RD SEMESTER' },
    { sNo: 9, courseCode: 'HIUCAET1', courseName: 'Hindi Bhasha Aur Sahitya', credits: 2.0, type: 'AEC', term: '3RD SEMESTER' },
    { sNo: 10, courseCode: 'CAUCMJT2', courseName: 'Principals of Operating Systems', credits: 4.0, type: 'Major', term: '3RD SEMESTER' },
  ],
};

// Helper to extract embedded JPEG images from a scanned PDF buffer
function extractJpegImagesFromPdf(buffer: Buffer): Buffer[] {
  const images: Buffer[] = [];
  const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF]);
  const jpegFooter = Buffer.from([0xFF, 0xD9]);
  let startIdx = 0;

  while ((startIdx = buffer.indexOf(jpegHeader, startIdx)) !== -1) {
    const endIdx = buffer.indexOf(jpegFooter, startIdx + 3);
    if (endIdx !== -1) {
      const jpegBuf = buffer.subarray(startIdx, endIdx + 2);
      // Filter out tiny thumbnail icons, keep full page images (> 10KB)
      if (jpegBuf.length > 10240) {
        images.push(jpegBuf);
      }
      startIdx = endIdx + 2;
    } else {
      break;
    }
  }

  // Sort by size descending (largest image first)
  images.sort((a, b) => b.length - a.length);
  return images;
}

export const extractTextFromPdfStreams = (buffer: Buffer): string => {
  if (!buffer || buffer.length < 50) return '';
  const textPieces: string[] = [];
  let startIdx = 0;
  while ((startIdx = buffer.indexOf('stream', startIdx)) !== -1) {
    let streamStart = startIdx + 6;
    if (buffer[streamStart] === 0x0d && buffer[streamStart + 1] === 0x0a) {
      streamStart += 2;
    } else if (buffer[streamStart] === 0x0a || buffer[streamStart] === 0x0d) {
      streamStart += 1;
    }
    const endIdx = buffer.indexOf('endstream', streamStart);
    if (endIdx === -1) break;

    const streamBuf = buffer.slice(streamStart, endIdx);
    startIdx = endIdx + 9;

    let decompressed: Buffer | null = null;
    try {
      decompressed = zlib.inflateSync(streamBuf);
    } catch {
      try {
        decompressed = zlib.inflateRawSync(streamBuf);
      } catch {
        continue;
      }
    }

    if (decompressed) {
      const str = decompressed.toString('latin1');
      const tjMatches = str.match(/\[(.*?)\]\s*TJ/gi) || [];
      for (const m of tjMatches) {
        const parts = m.match(/\(([^()]*)\)/g) || [];
        const combined = parts.map((p) => p.slice(1, -1)).join('').trim();
        if (combined.length > 0) textPieces.push(combined);
      }
      const parenMatches = str.match(/\(([^()]*)\)\s*Tj/gi) || [];
      for (const m of parenMatches) {
        const inner = m.replace(/^\(/, '').replace(/\)\s*Tj$/i, '').trim();
        if (inner.length > 0) textPieces.push(inner);
      }
    }
  }
  return textPieces.join('\n');
};

export const parsePdfBuffer = async (
  buffer: Buffer,
  fileName: string = '',
  isTeacherHint?: boolean
): Promise<ExtractedStudentDetails> => {
  let rawText = '';

  const isTeacherDoc = isTeacherHint ?? /teacher|faculty|id_card|idcard|emp/i.test(fileName);

  // Safe guard: If buffer is empty or too small
  if (!buffer || buffer.length < 50) {
    if (isTeacherDoc) {
      return {
        name: '',
        enrollmentNo: '',
        email: '',
        department: 'CSIT',
        courseLevel: 'Faculty / Staff',
        enrolledCourses: [],
        extractedCoursesDetails: [],
        rawTextPreview: 'GGU Faculty ID Card',
        teacherName: '',
        facultyId: 'EMP/2026/' + Math.floor(1000 + Math.random() * 9000),
        designation: 'Assistant Professor',
        phone: '',
        officeRoom: 'Room FB-12, CSIT Dept',
      };
    }
    return extractDetailsFromText('', false, fileName);
  }

  const isImageFile =
    fileName.toLowerCase().endsWith('.png') ||
    fileName.toLowerCase().endsWith('.jpg') ||
    fileName.toLowerCase().endsWith('.jpeg') ||
    (buffer.length > 4 &&
      ((buffer[0] === 0x89 && buffer[1] === 0x50) || (buffer[0] === 0xFF && buffer[1] === 0xD8)));

  if (isImageFile) {
    if (buffer.length >= 100) {
      console.log(`🖼️ [OCR] Direct Image file detected (${fileName}, ${buffer.length} bytes), running Tesseract OCR...`);
      try {
        const { data } = await Tesseract.recognize(buffer, 'eng');
        rawText = data?.text || '';
      } catch (ocrErr: any) {
        console.warn('[OCR Error on Image]', ocrErr.message);
      }
    }
  } else {
    // 1. First attempt: standard PDF text layer extraction
    try {
      if (buffer && buffer.length > 0) {
        const parser = new (PDFParse as any)({ data: buffer });
        const textResult = await parser.getText();
        rawText = textResult?.text || (typeof textResult === 'string' ? textResult : '');
      }
    } catch (err: any) {
      console.warn('[PDF-Parse Warning]', err.message);
    }

    // 1B. Second attempt: Direct stream decompression if text is empty or too short
    if (!rawText || rawText.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '').trim().length < 30) {
      try {
        const streamText = extractTextFromPdfStreams(buffer);
        if (streamText && streamText.trim().length > (rawText?.trim().length || 0)) {
          console.log(`📑 [PDF Streams] Extracted ${streamText.length} characters from compressed streams.`);
          rawText = streamText;
        }
      } catch (streamErr: any) {
        console.warn('[PDF Stream Parse Warning]', streamErr.message);
      }
    }

    // 2. Check if the PDF is an image-based / scanned PDF (e.g. text is empty or just "-- 1 of 1 --")
    const isImagePdf = !rawText || rawText.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '').trim().length < 25;

    if (isImagePdf && buffer.length >= 500) {
      console.log(`📸 [OCR] PDF text layer is empty or scanned image. Extracting embedded images for OCR...`);
      const embeddedJpegs = extractJpegImagesFromPdf(buffer);
      console.log(`📸 [OCR] Found ${embeddedJpegs.length} embedded images in PDF.`);

      if (embeddedJpegs.length > 0 && embeddedJpegs[0].length >= 500) {
        try {
          console.log(`📸 [OCR] Running Tesseract OCR on primary page image (${embeddedJpegs[0].length} bytes)...`);
          const { data } = await Tesseract.recognize(embeddedJpegs[0], 'eng');
          rawText = data?.text || '';
          console.log(`✅ [OCR] Tesseract OCR completed. Characters recognized: ${rawText.length}`);
        } catch (ocrErr: any) {
          console.warn('[OCR Error on PDF Image]', ocrErr.message);
        }
      }
    }
  }

  console.log('--- [PDF/OCR Raw Text Start] ---');
  console.log(rawText.slice(0, 1000));
  console.log('--- [PDF/OCR Raw Text End] ---');

  return extractDetailsFromText(rawText, isTeacherDoc, fileName);
};

export const extractDetailsFromText = (
  rawText: string,
  isTeacherHint?: boolean,
  fileNameHint?: string
): ExtractedStudentDetails => {
  const isTeacherDoc = isTeacherHint ?? false;
  const fileName = fileNameHint || '';
  if (!rawText || rawText.trim().length === 0) {
    if (isTeacherDoc) {
      return {
        name: '',
        enrollmentNo: '',
        email: '',
        department: 'CSIT',
        courseLevel: 'Faculty / Staff',
        enrolledCourses: [],
        extractedCoursesDetails: [],
        rawTextPreview: 'GGU Faculty ID Card',
        teacherName: '',
        facultyId: 'EMP/2026/' + Math.floor(1000 + Math.random() * 9000),
        designation: 'Assistant Professor',
        phone: '',
        officeRoom: 'Room FB-12, CSIT Dept',
      };
    }
    const combinedName = fileName.toLowerCase();
    const isThird = /\b(?:3rd|third|3)\s*(?:sem|semester)\b|\bsem[-_ ]*3\b/i.test(combinedName);
    const semesterStr = isThird ? '3RD SEMESTER' : '1ST SEMESTER';
    return {
      name: '',
      enrollmentNo: '',
      email: '',
      department: 'CSIT',
      courseLevel: `${semesterStr} (NEP 2020)`,
      enrolledCourses: [],
      extractedCoursesDetails: [],
      rawTextPreview: '',
    };
  }

  // 1. Enrollment Number Extraction
  let enrollmentNo = '';
  // Check GGV pattern with optional spaces around slashes e.g. "GGV / 24 / 09452", "GGV/25/08123", or "GGV/251/20045"
  const ggvDirectMatch = rawText.match(/\bGGV\s*[\/\\]\s*[A-Za-z0-9_-]+\s*[\/\\]\s*[A-Za-z0-9_-]+(?:\s*[\/\\]\s*[A-Za-z0-9_-]+)?\b/i);
  if (ggvDirectMatch) {
    enrollmentNo = ggvDirectMatch[0].replace(/\s+/g, '').toUpperCase();
  } else {
    // Check labeled enrollment or roll number (explicitly filter out false positive words like SLIP, FORM, CARD, SYSTEM)
    const enrLabelMatch = rawText.match(
      /(?:Enrol+ment|Registration|Roll)\s*(?:Number|No\.?)?[\s:.\-_|=]+([A-Za-z0-9\/_\- ]{4,30})/i
    );
    if (enrLabelMatch) {
      const candidate = enrLabelMatch[1].trim();
      if (!/^(SLIP|FORM|CARD|SYSTEM|PORTAL|DETAILS|NUMBER|NO|DATE|OF|THE|NAME)$/i.test(candidate)) {
        const cleaned = candidate.split(/\s+/)[0].replace(/[^\w\/-]/g, '').toUpperCase();
        if (cleaned.length >= 4) {
          enrollmentNo = cleaned;
        }
      }
    }
  }

  // Also check for separate line roll number if label was on previous line
  const rawLines = rawText.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  if (!enrollmentNo) {
    for (let i = 0; i < rawLines.length - 1; i++) {
      if (/^(?:Enrol+ment\s*(?:No\.?|Number)?|Roll\s*(?:No\.?|Number)?)$/i.test(rawLines[i])) {
        const next = rawLines[i + 1].replace(/\s+/g, '').toUpperCase();
        if (/^(?:GGV\/)?\d{6,14}$/i.test(next) || /^GGV\/\d{2,3}\/\d{3,6}$/i.test(next)) {
          enrollmentNo = next;
          break;
        }
      }
    }
  }

  // 2. Name Extraction (Student slip + Faculty ID Card)
  let name = '';

  // Mask out Father's and Mother's name lines so they NEVER get picked up as the student's name
  const textWithoutParents = rawText
    .replace(/(?:Father|Mother|Parent|Guardian)(?:'s)?\s*(?:Name)?[\s:.\-_|=]+[^\r\n]+/gi, '')
    .replace(/F\.?\s*Name[\s:.\-_|=]+[^\r\n]+/gi, '');

  if (isTeacherDoc) {
    const idCardNameMatch = textWithoutParents.match(
      /(?:Faculty\s*Name|Teacher\s*Name|Employee\s*Name|Name\s*of\s*Cardholder|(?<![FfHhMm]\.\s*)(?<!Father'?s?\s*)(?<!Mother'?s?\s*)\bName\b)[\s:.\-_|=]+([A-Za-z .]{3,35})(?=\r|\n|$|\s+(?:Faculty|ID|Designation|Department|Email|Phone|Mobile|Office|Session|Cabin|Valid|Blood))/i
    );
    if (idCardNameMatch) {
      name = idCardNameMatch[1].trim();
    }
  }

  // A. Explicit Student/Candidate Name label
  if (!name) {
    const explicitCandidateMatch = textWithoutParents.match(
      /(?:Candidate(?:'s)?\s*Name|Student(?:'s)?\s*Name|Name\s*of\s*(?:the\s*)?(?:Candidate|Student|Applicant))[\s:.\-_|=]+([A-Za-z .]{2,40})/i
    );
    if (explicitCandidateMatch) {
      name = explicitCandidateMatch[1].trim();
    }
  }

  // B. Standard "Name:" on single line
  if (!name) {
    const plainNameMatch = textWithoutParents.match(
      /(?<![A-Za-z])Name[\s:.\-_|=]+([A-Za-z .]{2,40})/i
    );
    if (plainNameMatch) {
      const candidate = plainNameMatch[1].trim();
      const firstLine = candidate.split(/[\r\n]+/)[0].trim();
      if (!/^(?:of\s*Cardholder|of\s*University|Guru\s*Ghasidas|Examination|Registration|Details|Selection|Slip)$/i.test(firstLine)) {
        name = firstLine;
      }
    }
  }

  // C. Multiline format: "Name" or "Candidate's Name" on one line, actual name on the next line
  if (!name) {
    for (let i = 0; i < rawLines.length - 1; i++) {
      if (/^(?:Name|Candidate(?:'s)?\s*Name|Student(?:'s)?\s*Name)$/i.test(rawLines[i])) {
        const next = rawLines[i + 1].trim();
        if (/^[A-Za-z\s.]{3,40}$/.test(next) && !/^(?:Roll|Enrol|Father|Mother|Department|Programme|Program|Session|Term|Date|Slip|Examination|Registration)$/i.test(next)) {
          name = next;
          break;
        }
      }
    }
  }

  if (name) {
    name = name
      .replace(/\b(STUDENT|DETAILS|ENROLEMENT|ENROLLMENT|NUMBER|NO|ROLL|PROGRAMME|PROGRAM|SESSION|SLIP)\b/gi, '')
      .replace(/[.:\-–|=]+$/, '')
      .replace(/^[.:\-–|=]+/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  // 3. Department Extraction
  let department = '';
  if (/COMPUTER\s*APPLICATION|\bBCA\b|COMPUTER\s*SCIENCE|COMP\.?\s*SC|INFO\.?\s*TECH|BSCS|\bCSIT\b/i.test(rawText)) {
    department = 'CSIT';
  } else if (/COMPUTER\s*SCIENCE\s*(&|and)?\s*ENGINEERING|\bCSE\b/i.test(rawText)) {
    department = 'CSE';
  } else if (/INFORMATION\s*TECHNOLOGY|\bIT\b/i.test(rawText)) {
    department = 'IT';
  } else if (/CIVIL/i.test(rawText)) {
    department = 'CIVIL';
  } else if (/MECHANICAL/i.test(rawText)) {
    department = 'MECH';
  } else if (/ELECTRONICS|\bECE\b/i.test(rawText)) {
    department = 'ECE';
  } else if (/MATHEMATICS|MATH/i.test(rawText)) {
    department = 'MATH';
  } else if (/PHYSICS/i.test(rawText)) {
    department = 'PHYSICS';
  } else if (/MANAGEMENT|MBA|BBA/i.test(rawText)) {
    department = 'MGMT';
  } else if (/COMMERCE|B\.?COM/i.test(rawText)) {
    department = 'COMMERCE';
  } else if (/ZOOLOGY/i.test(rawText)) {
    department = 'ZOOLOGY';
  } else if (/BOTANY/i.test(rawText)) {
    department = 'BOTANY';
  } else if (/BIOTECHNOLOGY/i.test(rawText)) {
    department = 'BIOTECH';
  } else if (/PHARMACY/i.test(rawText)) {
    department = 'PHARMACY';
  } else if (/LAW/i.test(rawText)) {
    department = 'LAW';
  }

  // 4. Course Level & Dynamic Semester Detection
  let semesterStr = '1ST SEMESTER';
  const combinedContext = `${fileName || ''} ${rawText}`;
  if (/\b(?:3RD|THIRD|3)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*3\b|\bIII\s*SEMESTER\b|\bSEM[-_ ]*3\b/i.test(combinedContext) || (enrollmentNo && enrollmentNo.includes('/23/'))) {
    semesterStr = '3RD SEMESTER';
  } else if (/\b(?:2ND|SECOND|2)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*2\b|\bII\s*SEMESTER\b|\bSEM[-_ ]*2\b/i.test(combinedContext)) {
    semesterStr = '2ND SEMESTER';
  } else if (/\b(?:4TH|FOURTH|4)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*4\b|\bIV\s*SEMESTER\b|\bSEM[-_ ]*4\b/i.test(combinedContext) || (enrollmentNo && enrollmentNo.includes('/22/'))) {
    semesterStr = '4TH SEMESTER';
  } else if (/\b(?:1ST|FIRST|1)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*1\b|\bI\s*SEMESTER\b|\bSEM[-_ ]*1\b/i.test(combinedContext)) {
    semesterStr = '1ST SEMESTER';
  }

  // If enrollment number has 25 (GGV/25/...) -> admitted in 2025 -> 1ST SEMESTER
  if (enrollmentNo && (/GGV\/25\//i.test(enrollmentNo) || enrollmentNo.includes('/25/'))) {
    semesterStr = '1ST SEMESTER';
  }

  const isBcaSlip =
    /BCA|BACHELOR\s+OF\s+COMPUTER\s+APPLICATION/i.test(rawText) ||
    (enrollmentNo && enrollmentNo.includes('/251/')) ||
    (department === 'CSIT' && /BCA/i.test(rawText));

  const degreeTitle = isBcaSlip ? 'BCA' : 'B.SC. (CS)';
  let courseLevel = `${semesterStr} • ${degreeTitle} (NEP 2020)`;

  // 5. Email Extraction (Never generate fake or random emails - students fill their real email manually)
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  let email = '';
  if (emailMatch) {
    email = emailMatch[0].toLowerCase().trim();
  }


  // 6. Comprehensive Course & Registered Subject Extraction
  const extractedCoursesDetails: ExtractedCourse[] = [];
  const registeredCourseCodesSet = new Set<string>();

  const excludedTokens = new Set([
    'HTTP', 'HTTPS', 'HTML', 'GGU', 'SAMARTH', 'EGOV', 'INDIA', 'PAGE', 'TOTAL',
    'DATE', 'TIME', 'NAME', 'STUDENT', 'ENROLEMENT', 'ENROLLMENT', 'NUMBER',
    'COURSE', 'SUBJECT', 'TERM', 'SEMESTER', 'MARKS', 'CREDIT', 'CREDITS',
    'GRADE', 'STATUS', 'SIGNATURE', 'DECLARATION', 'BSCS', 'JULY', 'DETAILS',
    'FATHER', 'MOTHER', 'GENDER', 'CATEGORY', 'SESSION', 'CENTRAL', 'UNIVERSITY',
    'BILASPUR', 'VISHWAVIDYALAYA', 'CHHATTISGARH', 'CAMPUS', 'DEPARTMENT',
    'PROGRAMME', 'PROGRAM', 'EXAMINATION', 'ONLINE', 'FORM', 'SLIP', 'REGISTRATION'
  ]);

  const cleanCourseTitle = (rawTitle: string): string => {
    return rawTitle
      .replace(/\b(UG|PG|MDC|SEC|VAC|AEC|Major|Minor|Core|Elective|\d+\s*SEMESTER|Credits?)\b/gi, '')
      .replace(/[\d.]+\s*$/, '')
      .replace(/^[.:\-–| ]+/, '')
      .replace(/[.:\-–| ]+$/, '')
      .trim();
  };

  const addCourse = (
    code: string,
    title?: string,
    creditsVal?: number,
    typeVal?: string,
    termVal?: string
  ) => {
    const cleanCode = code.replace(/[^A-Za-z0-9\-_]/g, '').toUpperCase();
    if (!cleanCode || cleanCode.length < 4 || excludedTokens.has(cleanCode) || registeredCourseCodesSet.has(cleanCode)) {
      return;
    }
    // Filter out date/session tokens like JULY-2026, 2026-07-14, etc.
    if (/(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|JULY|AUG|SEP|SEPT|OCT|NOV|DEC)[-_]?\d{2,4}/i.test(cleanCode) || /^\d{4}/.test(cleanCode)) {
      return;
    }
    // Must contain either at least one digit or hyphen
    if (!/\d/.test(cleanCode) && !cleanCode.includes('-')) {
      return;
    }

    const known = KNOWN_GGU_COURSES[cleanCode] || KNOWN_GGU_COURSES[cleanCode.replace(/[-_]/g, '')];
    let finalTitle = cleanCourseTitle(title || '');
    let finalCredits = creditsVal || (known ? known.credits : (cleanCode.includes('L') ? 1.0 : 3.0));
    let finalTerm = termVal || (known ? known.term : semesterStr);
    let finalType = typeVal || (known ? known.type : undefined);

    // Separate term from type if "SEMESTER" is in typeVal
    if (!finalType || /SEMESTER/i.test(finalType)) {
      if (finalType && /SEMESTER/i.test(finalType)) {
        finalTerm = finalType;
      }
      if (/MDT|MDC/i.test(cleanCode)) finalType = 'MDC';
      else if (/SEC/i.test(cleanCode)) finalType = 'SEC';
      else if (/MJL/i.test(cleanCode)) finalType = 'Major Lab';
      else if (/MJT/i.test(cleanCode)) finalType = 'Major';
      else if (/MNL/i.test(cleanCode)) finalType = 'Minor Lab';
      else if (/MNT/i.test(cleanCode)) finalType = 'Minor';
      else if (/AET|AEC/i.test(cleanCode)) finalType = 'AEC';
      else if (/VIL|VOC.*L/i.test(cleanCode)) finalType = 'VAC Lab';
      else if (/VIT|VOC|VAC/i.test(cleanCode)) finalType = 'VAC';
      else if (known) finalType = known.type;
      else finalType = 'Core Subject';
    }

    if (known && (!finalTitle || finalTitle.length < 4 || finalTitle.toUpperCase() === cleanCode.toUpperCase())) {
      finalTitle = known.name;
    } else if (!finalTitle) {
      finalTitle = cleanCode;
    }

    // Capitalize title properly
    if (finalTitle === finalTitle.toUpperCase() && finalTitle.length > 5) {
      finalTitle = finalTitle
        .split(' ')
        .map((w) => (w.length > 2 ? w.charAt(0) + w.slice(1).toLowerCase() : w))
        .join(' ');
    }

    registeredCourseCodesSet.add(cleanCode);
    extractedCoursesDetails.push({
      sNo: extractedCoursesDetails.length + 1,
      courseCode: cleanCode,
      courseName: finalTitle,
      credits: finalCredits,
      type: finalType,
      term: finalTerm,
    });
  };

  // PASS 1: Detect Structured Table Rows (e.g. "1 COUAMDT2 INTRODUCTION TO INDIAN TAX SYSTEM 3.0 3 SEMESTER")
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 6) continue;

    // Pattern 1A: Numbered table row (e.g., "1 COUAMDT2 Introduction to Tax 3.0" or "1. CIUCMJT1 RDBMS 3")
    const numberedRowMatch = trimmed.match(
      /^\s*(\d+)[\s.:|\-]+([A-Za-z0-9\-_]{4,14})\s+([A-Za-z0-9 &.,\/'"()\-]+?)(?:\s+([\d.]+))?(?:\s+(Major|Minor|MDC|SEC|VAC|AEC|GE|DSE|Core|Elective|Audit|[1-8]\s*SEMESTER|UG|PG)[\w\s]*)?$/i
    );
    if (numberedRowMatch) {
      const rowCode = numberedRowMatch[2];
      const rowTitle = numberedRowMatch[3];
      const rowCredits = numberedRowMatch[4] ? parseFloat(numberedRowMatch[4]) : undefined;
      const rowType = numberedRowMatch[5];
      addCourse(rowCode, rowTitle, rowCredits, rowType);
      continue;
    }

    // Pattern 1B: Pipe/Tab separated cells (e.g., "1 | CIUCMJT1 | Relational Database Management System | 3.0 | Major")
    if (trimmed.includes('|') || trimmed.includes('\t')) {
      const cells = trimmed.split(/[|\t]+/).map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 2) {
        let codeIdx = -1;
        for (let i = 0; i < Math.min(cells.length, 3); i++) {
          const testCode = cells[i].toUpperCase();
          if (/^[A-Za-z0-9\-_]{4,14}$/.test(testCode) && /\d/.test(testCode) && !excludedTokens.has(testCode)) {
            codeIdx = i;
            break;
          }
        }
        if (codeIdx !== -1 && codeIdx + 1 < cells.length) {
          const cCode = cells[codeIdx];
          const cTitle = cells[codeIdx + 1];
          const cCredits = cells[codeIdx + 2] ? parseFloat(cells[codeIdx + 2]) : undefined;
          const cType = cells[codeIdx + 3] || 'Major';
          addCourse(cCode, cTitle, isNaN(cCredits as any) ? undefined : cCredits, cType);
          continue;
        }
      }
    }

    // Pattern 1C: Labeled lines (e.g. "Course Code: CIUCMJT1 Title: Operating Systems")
    const labeledMatch = trimmed.match(
      /(?:Course\s*Code|Subject\s*Code|Paper\s*Code)[\s:.\-_|]+([A-Za-z0-9\-_]{4,14})/i
    );
    if (labeledMatch) {
      const cCode = labeledMatch[1];
      const titleMatch = trimmed.match(
        /(?:Course\s*Title|Subject\s*Name|Course\s*Name|Paper\s*Title)[\s:.\-_|]+([A-Za-z0-9 &.,\/'"()\-]+)/i
      );
      addCourse(cCode, titleMatch ? titleMatch[1] : undefined);
      continue;
    }

    // Pattern 1D: Code separated by colon or dash (e.g. "CIUCMJT1 - Relational Database Management System" or "CE101: Engineering Mechanics 4.0")
    const colonDashMatch = trimmed.match(
      /^\s*([A-Za-z0-9\-_]{4,14})\s*[:\-–]\s*([A-Za-z0-9 &.,\/'"()\-]+?)(?:\s+([\d.]+))?$/i
    );
    if (colonDashMatch) {
      const cCode = colonDashMatch[1];
      const cTitle = colonDashMatch[2];
      const cCr = colonDashMatch[3] ? parseFloat(colonDashMatch[3]) : undefined;
      addCourse(cCode, cTitle, isNaN(cCr as any) ? undefined : cCr);
      continue;
    }

    // Pattern 1E: Universal Timetable / Course Row (e.g. "Major ~~ CIUAMJT1 Programming using C -Theory 3")
    const rowTokens = trimmed.split(/[|\t\s~–—]+/).filter(Boolean);
    const codeTokenIdx = rowTokens.findIndex((t) => /^[A-Za-z]{2,8}\w*\d\w*$/i.test(t) && t.length >= 4 && t.length <= 14);
    if (codeTokenIdx !== -1) {
      const cCode = rowTokens[codeTokenIdx].toUpperCase();
      if (!excludedTokens.has(cCode)) {
        const beforeTokens = rowTokens.slice(0, codeTokenIdx);
        let titleTokens = rowTokens.slice(codeTokenIdx + 1);
        if (titleTokens.length > 0) {
          let cCredits: number | undefined = undefined;
          let cType = beforeTokens.find((t) => /^(Major|Minor|MDC|SEC|VAC|AEC|Core|Elective)$/i.test(t));
          for (let i = 0; i < 4 && titleTokens.length > 0; i++) {
            const last = titleTokens[titleTokens.length - 1];
            if (/^[1-8]\s*SEMESTER$/i.test(last) || /^(?:UG|PG|NEP|CBCS)$/i.test(last)) {
              titleTokens.pop();
            } else if (titleTokens.length >= 2 && /SEMESTER/i.test(last) && /^[1-8]$/.test(titleTokens[titleTokens.length - 2])) {
              titleTokens.pop();
              titleTokens.pop();
            } else if (!cType && /^(Major|Minor|MDC|SEC|VAC|AEC|Core|Elective|Audit)$/i.test(last)) {
              cType = titleTokens.pop();
            } else if (cCredits === undefined && /^\d+(?:\.\d+)?$/.test(last) && parseFloat(last) <= 10) {
              cCredits = parseFloat(titleTokens.pop() || '0');
            } else {
              break;
            }
          }
          const cTitle = titleTokens.join(' ').replace(/^[.:\-–~| ]+/, '').replace(/[.:\-–~| ]+$/, '').trim();
          if (cTitle.length >= 3 && !/^(?:Course\s*Title|Credits|Course\s*Code|Course)$/i.test(cTitle)) {
            addCourse(cCode, cTitle, cCredits, cType);
            continue;
          }
        }
        addCourse(cCode);
        continue;
      }
    }
  }

  // PASS 2: Known GGU Course Dictionary Scan across rawText
  // If any known GGU course code is anywhere in the text layer/OCR output, guarantee extraction!
  for (const [codeKey, meta] of Object.entries(KNOWN_GGU_COURSES)) {
    const codeRegex = new RegExp(`\\b${codeKey}\\b`, 'i');
    if (codeRegex.test(rawText) && !registeredCourseCodesSet.has(codeKey.toUpperCase())) {
      addCourse(codeKey, meta.name, meta.credits, meta.type, meta.term);
    }
  }

  // PASS 3: Fallback Regex for generic university course codes in rawText
  // Matches GGU / Central University course patterns e.g. CIUCMJT1, COUAMDT2, SECC13, CS-301, BCA-101, etc.
  const generalCodeMatches = rawText.match(/\b[A-Za-z]{2,8}[-_]?[A-Za-z0-9\-_]{2,10}\b/g) || [];
  for (const token of generalCodeMatches) {
    const cleanToken = token.toUpperCase();
    if (!excludedTokens.has(cleanToken) && cleanToken.length >= 5 && /\d/.test(cleanToken)) {
      if (!registeredCourseCodesSet.has(cleanToken)) {
        addCourse(cleanToken);
      }
    }
  }

  // Format enrolledCourses as rich strings e.g. "CIUCMJT1: Relational Database Management System"
  const enrolledCourses: string[] = extractedCoursesDetails.map(
    (c) => `${c.courseCode}: ${c.courseName}`
  );

  // --- Teacher-Specific Profile Extraction ---
  // 1. Designation
  let designation = '';
  const desigMatch = rawText.match(
    /\b(Assistant\s*Professor(?:\s*\(Grade\s*[I|V|X\d]+\))?|Associate\s*Professor|Professor|Head\s*of\s*(?:the\s*)?Department|HOD|Dean|Senior\s*Professor|Lecturer|Guest\s*Faculty)\b/i
  );
  if (desigMatch) {
    designation = desigMatch[1].trim();
  }

  // 2. Faculty / Employee ID
  let facultyId = '';
  const facIdDirectMatch = rawText.match(/\b(?:GGV\/|GGU\/)?(?:FAC|EMP|GGU[-_]?FAC)[-_/][A-Za-z0-9\-_/]+\b/i);
  if (facIdDirectMatch) {
    facultyId = facIdDirectMatch[0].trim().toUpperCase();
  } else {
    const empIdMatch = rawText.match(
      /(?:Emp\.?\s*(?:ID|Code|No)?|Faculty\s*(?:ID|Code|No)|Employee\s*(?:ID|Code|No)|ID\s*No\.?|Card\s*No)[\s:.\-_|=]+([A-Za-z0-9\-_/]{4,20})/i
    );
    if (empIdMatch && !/^(FACULTY|CARD|SMART|UNIVERSITY)$/i.test(empIdMatch[1])) {
      facultyId = empIdMatch[1].trim().toUpperCase();
    }
  }

  // 3. Teacher Name (Exclude Father Name / F. Name)
  let teacherName = '';
  const titleMatch = rawText.match(
    /\b(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Doctor|Professor|Shri|Smt\.)\s+([A-Za-z][A-Za-z\s.]{2,30}?)(?=\r|\n|$|\s+(?:Assistant|Associate|Professor|Faculty|ID|Emp|Designation|Department|Dept|Email|Phone|Mobile|Office|Room|Cabin|Valid|Blood|[0-9]))/i
  );
  if (titleMatch) {
    teacherName = `${titleMatch[1]} ${titleMatch[2]}`.trim();
  } else if (designation) {
    // Check line immediately before designation on ID cards
    const beforeDesigRegex = new RegExp(`(?:\\r|\\n|^)[|\\s]*([A-Za-z\\s.]{3,35})(?=[|\\s]*(?:\\r|\\n)+[|\\s]*${designation.replace(/\s+/g, '\\s+')})`, 'i');
    const beforeMatch = rawText.match(beforeDesigRegex);
    if (beforeMatch && !/(?:GURU|GHASIDAS|VISHWAVIDYALAYA|UNIVERSITY|BILASPUR)/i.test(beforeMatch[1])) {
      teacherName = beforeMatch[1].trim();
    }
  }

  if (!teacherName) {
    // Explicitly exclude Father Name (F. Name)
    const teacherNameLabel = rawText.match(
      /(?:Faculty\s*Name|Teacher\s*Name|Employee\s*Name|Name\s*of\s*Cardholder|(?<![FfHhMm]\.\s*)(?<!Father'?s?\s*)Name)[\s:.\-_|=]+([A-Za-z\s.]{3,35})(?=\r|\n|$|\s+(?:Faculty|ID|Designation|Department|Email|Phone|Mobile|Office|Session|Cabin|Valid|Blood))/i
    );
    if (teacherNameLabel) {
      teacherName = teacherNameLabel[1].trim().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
    } else if (isTeacherDoc && name && !/\b(?:Father|F\.\s*Name)\b/i.test(name)) {
      teacherName = name;
    }
  }

  if (teacherName) {
    teacherName = teacherName
      .replace(/^[|:._\-~=\s]+/, '')
      .replace(/[\s0-9|:._\-~=]+$/, '')
      .replace(/^[^A-Za-z]*(?:[A-Za-z]{1,2}\s+)*(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Doctor|Professor)\b/i, '$1')
      .replace(/\b(Assistant\s*Professor|Associate\s*Professor|Professor|HOD|Dean|Lecturer|Guest\s*Faculty)\b/gi, '')
      .replace(/\b(FACULTY|ID|CARD|GGU|UNIVERSITY|DEPARTMENT|DESIGNATION|DETAILS)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  let phone = '';
  const phoneMatch = rawText.match(/(?:Phone|Mobile|Contact|Cell|Tel)[\s:.\-_|]+(\+?[0-9\s\-]{10,14})/i);
  if (phoneMatch) {
    phone = phoneMatch[1].trim();
  } else {
    const directPhoneMatch = rawText.match(/(?:\+91[\s\-]?)?[6-9]\d{9}\b/);
    if (directPhoneMatch) {
      phone = directPhoneMatch[0].trim();
    }
  }

  let officeRoom = '';
  const roomMatch = rawText.match(/(?:Office|Room|Cabin|Cabin\s*No|Room\s*No)[\s:.\-_|]+([A-Za-z0-9\s\-,\/]{2,30})/i);
  if (roomMatch) {
    officeRoom = roomMatch[1].trim();
  }

  // Check if rawText contains an actual timetable or course selection table
  const hasCourseTable = /(?:Course\s*Code|Course\s*Title|Credits|Timetable|Workload|Schedule|Theory|Lab|Major|Minor|MDC|SEC|VAC)/i.test(rawText) &&
    extractedCoursesDetails.length > 0;

  // A document with a student enrollment number is NEVER a teacher ID card
  const isTeacherIdCard = !enrollmentNo && (isTeacherDoc || (!hasCourseTable && !!(designation || (facultyId && !enrollmentNo))));
  if (isTeacherIdCard) {
    enrolledCourses.length = 0;
    extractedCoursesDetails.length = 0;
    email = '';
    if (!department) department = 'CSIT';
    if (!designation) designation = 'Assistant Professor';
    if (!facultyId) facultyId = 'EMP/2026/' + Math.floor(1000 + Math.random() * 9000);
  }

  console.log('[OCR/Parse Final Output]', {
    enrollmentNo,
    name,
    department,
    courseLevel,
    facultyId,
    teacherName,
    designation,
    coursesCount: extractedCoursesDetails.length,
    extractedCoursesDetails,
  });

  return {
    name: name || teacherName || '',
    enrollmentNo,
    email,
    department,
    courseLevel,
    enrolledCourses,
    extractedCoursesDetails,
    rawTextPreview: rawText.slice(0, 300),
    teacherName: teacherName || name || '',
    facultyId: facultyId || enrollmentNo || '',
    designation: designation || '',
    phone,
    officeRoom,
  };
};
