import { PDFParse } from 'pdf-parse';
import Tesseract from 'tesseract.js';

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
  major?: string;
  programmeName?: string;
  enrolledCourses: string[]; // ["CIUCMJT1: Relational Database Management System", ...]
  extractedCoursesDetails: ExtractedCourse[]; // Structured course array
  rawTextPreview: string;
}

export const KNOWN_GGU_COURSES: Record<string, { name: string; credits: number; type: string; term?: string }> = {
  COUAMDT2: { name: 'INTRODUCTION TO INDIAN TAX SYSTEM', credits: 3.0, type: 'MDC', term: '3 SEMESTER' },
  SECC13: { name: 'DBMS (Database Management Systems)', credits: 3.0, type: 'SEC', term: '3 SEMESTER' },
  CIUCMJT1: { name: 'Relational Database Management System', credits: 3.0, type: 'Major', term: '3 SEMESTER' },
  CIUCMJL1: { name: 'Lab based on RDBMS', credits: 1.0, type: 'Major', term: '3 SEMESTER' },
  CIUCMJT2: { name: 'Operating Systems', credits: 4.0, type: 'Major', term: '3 SEMESTER' },
  AECESUT1: { name: 'Soft Skills', credits: 2.0, type: 'AEC', term: '3 SEMESTER' },
  VOCCIT03: { name: 'Python Programming', credits: 1.0, type: 'VAC', term: '3 SEMESTER' },
  VOCCIL03: { name: 'Lab Based on Python', credits: 3.0, type: 'VAC', term: '3 SEMESTER' },
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

export const parsePdfBuffer = async (buffer: Buffer, fileName: string = ''): Promise<ExtractedStudentDetails> => {
  let rawText = '';

  const isImageFile =
    fileName.toLowerCase().endsWith('.png') ||
    fileName.toLowerCase().endsWith('.jpg') ||
    fileName.toLowerCase().endsWith('.jpeg') ||
    (buffer.length > 4 &&
      ((buffer[0] === 0x89 && buffer[1] === 0x50) || (buffer[0] === 0xFF && buffer[1] === 0xD8)));

  if (isImageFile) {
    console.log(`🖼️ [OCR] Direct Image file detected (${fileName}), running Tesseract OCR...`);
    try {
      const { data } = await Tesseract.recognize(buffer, 'eng');
      rawText = data?.text || '';
    } catch (ocrErr: any) {
      console.warn('[OCR Error on Image]', ocrErr.message);
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

    // 2. Check if the PDF is an image-based / scanned PDF (e.g. text is empty or just "-- 1 of 1 --")
    const isImagePdf = !rawText || rawText.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '').trim().length < 25;

    if (isImagePdf) {
      console.log(`📸 [OCR] PDF text layer is empty or scanned image. Extracting embedded images for OCR...`);
      const embeddedJpegs = extractJpegImagesFromPdf(buffer);
      console.log(`📸 [OCR] Found ${embeddedJpegs.length} embedded images in PDF.`);

      if (embeddedJpegs.length > 0) {
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

  return extractDetailsFromText(rawText);
};

export const extractDetailsFromText = (rawText: string): ExtractedStudentDetails => {
  if (!rawText || rawText.trim().length === 0) {
    return {
      name: '',
      enrollmentNo: '',
      email: '',
      department: '',
      courseLevel: '',
      enrolledCourses: [],
      extractedCoursesDetails: [],
      rawTextPreview: '',
    };
  }

  // 1. Enrollment Number Extraction
  let enrollmentNo = '';
  const ggvDirectMatch = rawText.match(/\bGGV\/[A-Za-z0-9\/_-]+\b/i);
  if (ggvDirectMatch) {
    enrollmentNo = ggvDirectMatch[0].trim().toUpperCase();
  } else {
    const enrLabelMatch = rawText.match(
      /(?:Enrol+ment|Registration|Roll)\s*(?:Number|No)?[\s:.\-_|]+([A-Za-z0-9\/_-]+)/i
    );
    if (enrLabelMatch) {
      enrollmentNo = enrLabelMatch[1].trim().toUpperCase();
    }
  }

  // 2. Student Name Extraction
  let name = '';
  const samarthNameMatch = rawText.match(
    /\bName\b[\s:.\-_|]+([A-Z\s.]{3,40}?)(?=\s+(?:Programme|Program|Session|Reference|Category|Father))/i
  );
  if (samarthNameMatch) {
    name = samarthNameMatch[1].trim().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').toUpperCase();
  } else {
    const genericNameMatch = rawText.match(
      /(?:Student\s*Name|Name\s*of\s*(?:the\s*)?Student|Candidate(?:'s)?\s*Name)[\s:.\-_|]+([A-Za-z\s.]{3,40})/i
    );
    if (genericNameMatch) {
      name = genericNameMatch[1].trim().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').toUpperCase();
    }
  }

  if (name) {
    name = name.replace(/\b(STUDENT|DETAILS|ENROLEMENT|ENROLLMENT|NUMBER|PROGRAMME|SESSION)\b/gi, '').trim();
  }

  // 3. Department Extraction
  let department = '';
  if (/COMPUTER\s*APPLICATION|\bBCA\b|COMPUTER\s*SCIENCE|BSCS|\bCSIT\b/i.test(rawText)) {
    department = 'CSIT';
  } else if (/COMPUTER\s*SCIENCE\s*(&|and)?\s*ENGINEERING|\bCSE\b/i.test(rawText)) {
    department = 'CSE';
  } else if (/INFORMATION\s*TECHNOLOGY|\bIT\b/i.test(rawText)) {
    department = 'IT';
  } else if (/ELECTRONICS|\bECE\b/i.test(rawText)) {
    department = 'ECE';
  } else if (/MECHANICAL/i.test(rawText)) {
    department = 'MECH';
  } else if (/CIVIL/i.test(rawText)) {
    department = 'CIVIL';
  } else if (/MATHEMATICS|MATH/i.test(rawText)) {
    department = 'MATH';
  } else if (/PHYSICS/i.test(rawText)) {
    department = 'PHYSICS';
  } else if (/MANAGEMENT|MBA|BBA/i.test(rawText)) {
    department = 'MGMT';
  } else if (/COMMERCE/i.test(rawText)) {
    department = 'COMMERCE';
  } else if (/ZOOLOGY/i.test(rawText)) {
    department = 'ZOOLOGY';
  } else if (/BOTANY/i.test(rawText)) {
    department = 'BOTANY';
  } else if (/BIOTECHNOLOGY/i.test(rawText)) {
    department = 'BIOTECH';
  } else if (/PHARMACY/i.test(rawText)) {
    department = 'PHARMACY';
  }

  // 4. Course Level (UG vs PG)
  let courseLevel = '';
  if (/Bachelor|BSCS|B\.?Sc|B\.?Tech|BCA|BBA|B\.?Com|B\.?A\b|UG/i.test(rawText)) {
    courseLevel = 'UG';
  } else if (/Master|M\.?Sc|M\.?Tech|MCA|MBA|M\.?Com|M\.?A\b|PG|Doctor/i.test(rawText)) {
    courseLevel = 'PG';
  }

  // 5. Highly Accurate Email Extraction
  let email = '';
  // Check labeled email first (e.g., Email:, Email ID:, Student Email:, Candidate Email:)
  const labeledEmailMatch = rawText.match(
    /(?:Email(?:\s*ID)?|E-mail(?:\s*Address)?|Candidate(?:'s)?\s*Email|Student\s*Email)[\s:.\-_|]+([a-zA-Z0-9._%+-]+(?:\s*@\s*|\s*\[at\]\s*)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
  );
  if (labeledEmailMatch) {
    email = labeledEmailMatch[1].replace(/\s+/g, '').replace(/\[at\]/gi, '@').toLowerCase().trim();
  }

  // If labeled email not found or it points to an institutional helpdesk, inspect all detected emails
  const allEmails = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const systemEmails = /helpdesk|support|info@|admin@|noreply|office@|controller@|samarth|exam@/i;

  if (!email || systemEmails.test(email)) {
    const studentCandidate = allEmails.find((e) => !systemEmails.test(e));
    if (studentCandidate) {
      email = studentCandidate.toLowerCase().trim();
    } else if (allEmails.length > 0 && !email) {
      email = allEmails[0].toLowerCase().trim();
    }
  }

  // If still no email found in PDF/slip, derive accurately from student name or enrollment
  if (!email) {
    if (name) {
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
      email = `${cleanName}@ggu.ac.in`;
    } else if (enrollmentNo) {
      email = `${enrollmentNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@ggu.ac.in`;
    }
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
    let finalCredits = creditsVal || (known ? known.credits : 3.0);
    let finalTerm = termVal || '3 SEMESTER';
    let finalType = typeVal;

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

    if (known && (!finalTitle || finalTitle.length < 4)) {
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

  const rawLines = rawText.split(/[\r\n]+/);

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

    // Pattern 1D: Code separated by colon or dash (e.g. "CIUCMJT1 - Relational Database Management System" or "SECC13: DBMS")
    const colonDashMatch = trimmed.match(
      /^\s*([A-Za-z0-9\-_]{4,14})\s*[:\-–]\s*([A-Za-z0-9 &.,\/'"()\-]{3,60})/i
    );
    if (colonDashMatch) {
      const cCode = colonDashMatch[1];
      const cTitle = colonDashMatch[2];
      addCourse(cCode, cTitle);
      continue;
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

  // Extract Programme Name (e.g. BACHELOR OF SCIENCE (COMPUTER SCIENCE))
  let programmeName = '';
  const progMatch = rawText.match(
    /(?:Programme|Program|Course\s*Name|Degree)[\s:.\-_|]+([A-Za-z0-9\s.(),&/-]{3,70}?)(?=\s+(?:Session|Semester|Term|Roll|Enrol|Category|Department|Name|$|\n|\r))/i
  );
  if (progMatch) {
    programmeName = progMatch[1].trim().replace(/\s+/g, ' ');
  }

  // Derive Major matching Programme Name or Enrolled Courses
  let major = '';
  const searchCorpus = (programmeName + ' ' + rawText).toUpperCase();
  if (searchCorpus.includes('COMPUTER SCIENCE & ENGINEERING') || searchCorpus.includes('CSE')) {
    major = 'Computer Science & Engineering';
  } else if (searchCorpus.includes('INFORMATION TECHNOLOGY')) {
    major = 'Information Technology';
  } else if (searchCorpus.includes('COMPUTER APPLICATION') || searchCorpus.includes('BCA') || searchCorpus.includes('MCA')) {
    major = 'Computer Applications';
  } else if (searchCorpus.includes('COMPUTER SCIENCE') || searchCorpus.includes('BSCS') || searchCorpus.includes('CSIT') || extractedCoursesDetails.some(c => c.courseCode.startsWith('CI') || c.type === 'Major')) {
    major = 'Computer Science';
  } else if (searchCorpus.includes('ELECTRONICS') || searchCorpus.includes('ECE')) {
    major = 'Electronics & Communication';
  } else if (searchCorpus.includes('MECHANICAL') || searchCorpus.includes('MECH')) {
    major = 'Mechanical Engineering';
  } else if (searchCorpus.includes('CIVIL')) {
    major = 'Civil Engineering';
  } else if (searchCorpus.includes('CHEMICAL')) {
    major = 'Chemical Engineering';
  } else if (searchCorpus.includes('MATHEMATICS') || searchCorpus.includes('MATH')) {
    major = 'Mathematics';
  } else if (searchCorpus.includes('PHYSICS')) {
    major = 'Physics';
  } else if (searchCorpus.includes('BIOTECHNOLOGY') || searchCorpus.includes('BIOTECH')) {
    major = 'Biotechnology';
  } else if (searchCorpus.includes('COMMERCE') || searchCorpus.includes('B.COM')) {
    major = 'Commerce';
  } else if (searchCorpus.includes('MANAGEMENT') || searchCorpus.includes('MBA') || searchCorpus.includes('BBA')) {
    major = 'Management Studies';
  } else if (searchCorpus.includes('PHARMACY') || searchCorpus.includes('B.PHARM')) {
    major = 'Pharmacy';
  } else {
    major = department ? department : 'Computer Science';
  }

  console.log('[OCR/Parse Final Output]', {
    enrollmentNo,
    name,
    department,
    courseLevel,
    programmeName,
    major,
    coursesCount: extractedCoursesDetails.length,
    extractedCoursesDetails,
  });

  return {
    name,
    enrollmentNo,
    email,
    department,
    courseLevel,
    major,
    programmeName,
    enrolledCourses,
    extractedCoursesDetails,
    rawTextPreview: rawText.slice(0, 300),
  };
};
