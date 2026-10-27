import { GGU_FIRST_SEM_COURSES, GGU_THIRD_SEM_COURSES, GGU_KNOWN_COURSES } from '../data/gguUniversityData';

export interface ClientExtractedDetails {
  name: string;
  enrollmentNo: string;
  department: string;
  courseLevel: string;
  enrolledCourses: any[];
}

export const extractDetailsFromTextClient = (rawText: string): ClientExtractedDetails => {
  if (!rawText || rawText.trim().length === 0) {
    return { name: '', enrollmentNo: '', department: '', courseLevel: '', enrolledCourses: [] };
  }

  const lines = rawText.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);

  // 1. Enrollment Number Extraction
  let enrollmentNo = '';
  const ggvDirectMatch = rawText.match(
    /\bGGV\s*[\/\\]\s*[A-Za-z0-9_-]+\s*[\/\\]\s*[A-Za-z0-9_-]+(?:\s*[\/\\]\s*[A-Za-z0-9_-]+)?\b/i
  );
  if (ggvDirectMatch) {
    enrollmentNo = ggvDirectMatch[0].replace(/\s+/g, '').toUpperCase();
  } else {
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

  if (!enrollmentNo) {
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^(?:Enrol+ment\s*(?:No\.?|Number)?|Roll\s*(?:No\.?|Number)?)$/i.test(lines[i])) {
        const next = lines[i + 1].replace(/\s+/g, '').toUpperCase();
        if (/^(?:GGV\/)?\d{6,14}$/i.test(next) || /^GGV\/\d{2,3}\/\d{3,6}$/i.test(next)) {
          enrollmentNo = next;
          break;
        }
      }
    }
  }

  // 2. Student Name Extraction
  let name = '';
  const textWithoutParents = rawText
    .replace(/(?:Father|Mother|Parent|Guardian)(?:'s)?\s*(?:Name)?[\s:.\-_|=]+[^\r\n]+/gi, '')
    .replace(/F\.?\s*Name[\s:.\-_|=]+[^\r\n]+/gi, '');

  const explicitCandidateMatch = textWithoutParents.match(
    /(?:Candidate(?:'s)?\s*Name|Student(?:'s)?\s*Name|Name\s*of\s*(?:the\s*)?(?:Candidate|Student|Applicant))[\s:.\-_|=]+([A-Za-z .]{2,40})/i
  );
  if (explicitCandidateMatch) {
    name = explicitCandidateMatch[1].trim();
  }

  if (!name) {
    const plainNameMatch = textWithoutParents.match(/(?<![A-Za-z])Name[\s:.\-_|=]+([A-Za-z .]{2,40})/i);
    if (plainNameMatch) {
      const candidate = plainNameMatch[1].trim();
      const firstLine = candidate.split(/[\r\n]+/)[0].trim();
      if (!/^(?:of\s*Cardholder|of\s*University|Guru\s*Ghasidas|Examination|Registration|Details|Selection|Slip)$/i.test(firstLine)) {
        name = firstLine;
      }
    }
  }

  if (!name) {
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^(?:Name|Candidate(?:'s)?\s*Name|Student(?:'s)?\s*Name)$/i.test(lines[i])) {
        const next = lines[i + 1].trim();
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

  // 3. Department
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

  // 4. Semester & Level
  let semesterStr = '1ST SEMESTER';
  if (/\b(?:1ST|FIRST|1)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*1\b|\bI\s*SEMESTER\b/i.test(rawText)) {
    semesterStr = '1ST SEMESTER';
  } else if (/\b(?:2ND|SECOND|2)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*2\b|\bII\s*SEMESTER\b/i.test(rawText)) {
    semesterStr = '2ND SEMESTER';
  } else if (/\b(?:3RD|THIRD|3)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*3\b|\bIII\s*SEMESTER\b/i.test(rawText)) {
    semesterStr = '3RD SEMESTER';
  } else if (/\b(?:4TH|FOURTH|4)\s*(?:SEM|SEMESTER)\b|\bSEMESTER\s*[:.\-_| ]*4\b|\bIV\s*SEMESTER\b/i.test(rawText)) {
    semesterStr = '4TH SEMESTER';
  }

  let degreeTitle = 'UG';
  if (/BCA|BACHELOR\s+OF\s+COMPUTER\s+APPLICATION/i.test(rawText)) {
    degreeTitle = 'BCA';
  } else if (/B\.?SC\.?\s*(?:\(?CS\)?)?/i.test(rawText)) {
    degreeTitle = 'B.SC. (CS)';
  } else if (/B\.?TECH/i.test(rawText)) {
    degreeTitle = 'B.Tech';
  } else if (/MCA/i.test(rawText)) {
    degreeTitle = 'MCA';
  }

  const courseLevel = `${semesterStr} • ${degreeTitle} (NEP 2020)`;

  // 5. Courses Extraction
  const extractedCourses: any[] = [];
  const registeredSet = new Set<string>();

  const addCourse = (code: string, title?: string, creditsVal?: number, typeVal?: string) => {
    const cleanCode = code.replace(/[^A-Za-z0-9\-_]/g, '').toUpperCase();
    if (!cleanCode || cleanCode.length < 4 || registeredSet.has(cleanCode)) return;
    if (!/\d/.test(cleanCode) && !cleanCode.includes('-')) return;

    const known = (GGU_KNOWN_COURSES as any)[cleanCode];
    let finalTitle = title || (known ? known.name : cleanCode);
    let finalCredits = creditsVal || (known ? known.credits : (cleanCode.includes('L') ? 1.0 : 3.0));
    let finalType = typeVal || (known ? known.type : (cleanCode.includes('L') ? 'Major Lab' : 'Major'));

    registeredSet.add(cleanCode);
    extractedCourses.push({
      sNo: extractedCourses.length + 1,
      courseCode: cleanCode,
      courseName: finalTitle,
      credits: finalCredits,
      type: finalType,
      term: semesterStr,
    });
  };

  // Structured lines
  for (const line of lines) {
    const numMatch = line.match(
      /^\s*(\d+)[\s.:|\-]+([A-Za-z0-9\-_]{4,14})\s+([A-Za-z0-9 &.,\/'"()\-]+?)(?:\s+([\d.]+))?(?:\s+(Major|Minor|MDC|SEC|VAC|AEC|GE|Core|Elective)[\w\s]*)?$/i
    );
    if (numMatch) {
      addCourse(numMatch[2], numMatch[3], numMatch[4] ? parseFloat(numMatch[4]) : undefined, numMatch[5]);
      continue;
    }
    const colonMatch = line.match(/^([A-Za-z0-9\-_]{4,12})\s*[:\-–]\s*([A-Za-z0-9 &.,\/'"()\-]+?)(?:\s+([\d.]+))?$/);
    if (colonMatch) {
      addCourse(colonMatch[1], colonMatch[2], colonMatch[3] ? parseFloat(colonMatch[3]) : undefined);
      continue;
    }
  }

  // Known GGU course codes check
  for (const [code, meta] of Object.entries(GGU_KNOWN_COURSES as any)) {
    if (new RegExp(`\\b${code}\\b`, 'i').test(rawText) && !registeredSet.has(code.toUpperCase())) {
      addCourse(code, (meta as any).name, (meta as any).credits, (meta as any).type);
    }
  }

  return {
    name,
    enrollmentNo,
    department,
    courseLevel,
    enrolledCourses: extractedCourses,
  };
};

const decodeBase64ToBytes = (b64: string): Uint8Array => {
  if (typeof atob === 'function') {
    try {
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        arr[i] = bin.charCodeAt(i);
      }
      return arr;
    } catch {}
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const cleanB64 = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < cleanB64.length; i++) {
    const c = cleanB64.charAt(i);
    if (c === '=') break;
    const val = chars.indexOf(c);
    if (val === -1) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
};

export const extractDetailsFromBytes = (bytes: Uint8Array, fileName: string): ClientExtractedDetails | null => {
  try {
    const header = String.fromCharCode(...bytes.slice(0, 5));
    if (!header.startsWith('%PDF')) {
      if (fileName) {
        return extractDetailsFromTextClient(fileName);
      }
      return null;
    }

    let textChunks: string[] = [];
    let inParen = false;
    let currentChunk = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b === 0x28 && !inParen) { // '('
        inParen = true;
        currentChunk = '';
      } else if (b === 0x29 && inParen) { // ')'
        inParen = false;
        if (currentChunk.trim().length > 1) {
          textChunks.push(currentChunk.trim());
        }
      } else if (inParen) {
        if (b >= 32 && b <= 126) {
          currentChunk += String.fromCharCode(b);
        }
      }
    }

    const fullText = textChunks.join('\n');
    if (fullText.length > 20 || fileName.length > 0) {
      const details = extractDetailsFromTextClient(`${fileName}\n${fullText}`);
      if (details.name || details.enrollmentNo || details.enrolledCourses.length > 0) {
        return details;
      }
    }
    return null;
  } catch {
    return null;
  }
};

// Client-side PDF buffer parser: extracts readable ASCII / Latin strings and decodes text objects from PDF
// Supports both Web (FileReader) and Native Android APK / iOS (expo-file-system)
export const parsePdfClientSide = async (file: any): Promise<ClientExtractedDetails | null> => {
  try {
    if (!file) return null;

    const fileName = typeof file === 'string' ? file : file?.name || file?.fileName || '';

    // 1. If a raw string was passed
    if (typeof file === 'string') {
      return extractDetailsFromTextClient(file);
    }

    // 2. NATIVE (Android APK / iOS): file is a DocumentPicker asset object with uri
    if (typeof file === 'object' && file.uri) {
      try {
        let FileSystem: any;
        try {
          FileSystem = require('expo-file-system/legacy');
        } catch {
          try {
            FileSystem = require('expo-file-system');
          } catch {}
        }
        if (FileSystem && FileSystem.readAsStringAsync) {
          const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType ? FileSystem.EncodingType.Base64 : 'base64',
          });
          if (base64 && base64.length > 50) {
            const bytes = decodeBase64ToBytes(base64);
            const extracted = extractDetailsFromBytes(bytes, fileName);
            if (extracted && (extracted.name || extracted.enrollmentNo || extracted.enrolledCourses.length > 0)) {
              return extracted;
            }
          }
        }
      } catch (nativeErr) {
        console.log('[Native Client PDF Parse Skipped]', nativeErr);
      }
    }

    // 3. WEB (Browser File or Blob)
    if (typeof FileReader !== 'undefined' && (file instanceof Blob || (file.name && file.size !== undefined))) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const buffer = e.target.result;
            if (!buffer) return resolve(null);
            const bytes = new Uint8Array(buffer);
            resolve(extractDetailsFromBytes(bytes, fileName));
          } catch {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsArrayBuffer(file);
      });
    }

    // 4. Fallback: extract any info from file name if available
    if (fileName) {
      return extractDetailsFromTextClient(fileName);
    }

    return null;
  } catch {
    return null;
  }
};
