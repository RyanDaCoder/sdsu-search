import { config } from "dotenv";
config({ path: ".env" });

import { PrismaClient, Modality, SectionStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing in web/.env");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Helper: minutes from midnight
function t(h: number, m: number) {
  return h * 60 + m;
}

async function main() {
  // 1) Term (Spring 2025)
  const term = await prisma.term.upsert({
    where: { code: "20251" },
    update: { name: "Spring 2025" },
    create: { code: "20251", name: "Spring 2025" },
  });

  // 2) Requirements - Seed all SDSU-like GE codes
  const requirementData = [
    { code: "GE-I-ORAL", name: "Oral Communication" },
    { code: "GE-I-WRITTEN", name: "Written Communication" },
    { code: "GE-I-CRIT", name: "Critical Thinking" },
    { code: "GE-IIA-PHYS", name: "Physical Sciences" },
    { code: "GE-IIA-LIFE", name: "Life Sciences" },
    { code: "GE-IIA-LAB", name: "Laboratory Science" },
    { code: "GE-IIA-MATH", name: "Mathematics/Quantitative Reasoning" },
    { code: "GE-IIB", name: "Social and Behavioral Sciences" },
    { code: "GE-IIC-ARTS", name: "Arts" },
    { code: "GE-IIC-HUM", name: "Humanities" },
    { code: "GE-III", name: "American Institutions" },
    { code: "GE-IVA", name: "Explorations: Natural Sciences" },
    { code: "GE-IVB", name: "Explorations: Social & Behavioral Sciences" },
    { code: "GE-IVC", name: "Explorations: Humanities" },
    { code: "GE-IV-CULTDIV", name: "Cultural Diversity" },
    { code: "GE-V-ETHNIC", name: "Ethnic Studies" },
  ];

  const requirements = await Promise.all(
    requirementData.map((req) =>
      prisma.requirement.upsert({
        where: { code: req.code },
        update: { name: req.name },
        create: req,
      })
    )
  );

  const reqMap = new Map(
    requirements.map((r: { code: string; id: string }) => [r.code, r.id])
  );

  // 3) Courses - Create ~30 courses with GE tags
  const coursesData = [
    // CS courses
    {
      subject: "CS",
      number: "107",
      title: "Introduction to Programming",
      units: "3",
      geCodes: ["GE-IIB"],
    },
    {
      subject: "CS",
      number: "108",
      title: "Programming and Problem Solving",
      units: "3",
      geCodes: ["GE-IIB"],
    },
    { subject: "CS", number: "210", title: "Data Structures", units: "3", geCodes: ["GE-IIB"] },
    { subject: "CS", number: "250", title: "Intro to Algorithms", units: "3", geCodes: ["GE-IIB"] },
    {
      subject: "CS",
      number: "310",
      title: "Data Structures and Algorithms",
      units: "3",
      geCodes: ["GE-IIB"],
    },
    {
      subject: "CS",
      number: "320",
      title: "Programming Languages",
      units: "3",
      geCodes: ["GE-IIB"],
    },

    // MATH courses
    { subject: "MATH", number: "120", title: "Calculus I", units: "4", geCodes: ["GE-IIA-MATH"] },
    { subject: "MATH", number: "121", title: "Calculus II", units: "4", geCodes: ["GE-IIA-MATH"] },
    {
      subject: "MATH",
      number: "150",
      title: "Calculus for Life Sciences",
      units: "3",
      geCodes: ["GE-IIA-MATH", "GE-IIA-LIFE"],
    },
    {
      subject: "MATH",
      number: "254",
      title: "Linear Algebra",
      units: "3",
      geCodes: ["GE-IIA-MATH", "GE-IVC"],
    },
    { subject: "MATH", number: "342", title: "Statistics", units: "3", geCodes: ["GE-IIA-MATH", "GE-IIB"] },

    // English/Writing courses
    { subject: "ENGL", number: "100", title: "Composition", units: "3", geCodes: ["GE-I-WRITTEN"] },
    { subject: "ENGL", number: "200", title: "Advanced Composition", units: "3", geCodes: ["GE-I-WRITTEN"] },
    {
      subject: "ENGL",
      number: "220",
      title: "Introduction to Literature",
      units: "3",
      geCodes: ["GE-IIC-HUM", "GE-IVC"],
    },

    // Communication courses
    { subject: "COMM", number: "103", title: "Oral Communication", units: "3", geCodes: ["GE-I-ORAL"] },
    { subject: "COMM", number: "200", title: "Public Speaking", units: "3", geCodes: ["GE-I-ORAL"] },

    // Science courses
    { subject: "BIOL", number: "100", title: "General Biology", units: "4", geCodes: ["GE-IIA-LIFE", "GE-IIA-LAB"] },
    { subject: "BIOL", number: "101", title: "Human Biology", units: "3", geCodes: ["GE-IIA-LIFE"] },
    { subject: "CHEM", number: "100", title: "General Chemistry", units: "4", geCodes: ["GE-IIA-PHYS", "GE-IIA-LAB"] },
    { subject: "PHYS", number: "180", title: "Physics I", units: "4", geCodes: ["GE-IIA-PHYS", "GE-IIA-LAB"] },

    // Social Sciences
    { subject: "PSYC", number: "101", title: "General Psychology", units: "3", geCodes: ["GE-IIB"] },
    { subject: "SOC", number: "101", title: "Introduction to Sociology", units: "3", geCodes: ["GE-IIB", "GE-IV-CULTDIV"] },
    { subject: "HIST", number: "100", title: "World History", units: "3", geCodes: ["GE-IIB", "GE-IV-CULTDIV"] },
    { subject: "ECON", number: "101", title: "Principles of Economics", units: "3", geCodes: ["GE-IIB"] },

    // Arts and Humanities
    { subject: "ART", number: "100", title: "Art Appreciation", units: "3", geCodes: ["GE-IIC-ARTS", "GE-IVC"] },
    { subject: "MUS", number: "100", title: "Music Appreciation", units: "3", geCodes: ["GE-IIC-ARTS", "GE-IVC"] },
    { subject: "PHIL", number: "100", title: "Introduction to Philosophy", units: "3", geCodes: ["GE-IIC-HUM", "GE-IVC"] },
    { subject: "PHIL", number: "110", title: "Critical Thinking", units: "3", geCodes: ["GE-I-CRIT"] },

    // Ethnic Studies
    {
      subject: "AFRS",
      number: "100",
      title: "Introduction to Africana Studies",
      units: "3",
      geCodes: ["GE-V-ETHNIC", "GE-IV-CULTDIV"],
    },
    {
      subject: "AAS",
      number: "100",
      title: "Introduction to Asian American Studies",
      units: "3",
      geCodes: ["GE-V-ETHNIC", "GE-IV-CULTDIV"],
    },
    {
      subject: "CHIC",
      number: "100",
      title: "Introduction to Chicana and Chicano Studies",
      units: "3",
      geCodes: ["GE-V-ETHNIC", "GE-IV-CULTDIV"],
    },
  ];

  const courses = await Promise.all(
    coursesData.map((courseData) =>
      prisma.course.upsert({
        where: { subject_number: { subject: courseData.subject, number: courseData.number } },
        update: { title: courseData.title, units: courseData.units },
        create: {
          subject: courseData.subject,
          number: courseData.number,
          title: courseData.title,
          units: courseData.units,
        },
      })
    )
  );

  // 4) Link courses to requirements
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const courseData = coursesData[i];

    // Delete existing requirements for this course (idempotent)
    await prisma.courseRequirement.deleteMany({
      where: { courseId: course.id },
    });

    // Create new requirement links
    if (courseData.geCodes && courseData.geCodes.length > 0) {
      await prisma.courseRequirement.createMany({
        data: courseData.geCodes
          .map((code) => {
            const reqId = reqMap.get(code);
            return reqId ? { courseId: course.id, requirementId: reqId } : null;
          })
          .filter(
            (item): item is { courseId: string; requirementId: string } => item !== null
          ),
        skipDuplicates: true,
      });
    }
  }

  // 5) Instructors
  const palacios = await prisma.instructor.upsert({
    where: { name: "Palacios" },
    update: {},
    create: { name: "Palacios" },
  });

  const smith = await prisma.instructor.upsert({
    where: { name: "Smith" },
    update: {},
    create: { name: "Smith" },
  });

  const chen = await prisma.instructor.upsert({
    where: { name: "Chen" },
    update: {},
    create: { name: "Chen" },
  });

  // Extra instructors for more sections
  const taylor = await prisma.instructor.upsert({
    where: { name: "Taylor" },
    update: {},
    create: { name: "Taylor" },
  });

  const garcia = await prisma.instructor.upsert({
    where: { name: "Garcia" },
    update: {},
    create: { name: "Garcia" },
  });

  const patel = await prisma.instructor.upsert({
    where: { name: "Patel" },
    update: {},
    create: { name: "Patel" },
  });

  const instructors = [palacios, smith, chen, taylor, garcia, patel];

  // Helper to find a seeded course quickly
  function findCourse(subject: string, number: string) {
    return courses.find((c) => c.subject === subject && c.number === number);
  }

  // 6) Sections + Meetings + Instructor links
  // Find CS 210, CS 250, and MATH 254 for sections
  const cs210 = findCourse("CS", "210");
  const cs250 = findCourse("CS", "250");
  const math254 = findCourse("MATH", "254");

  if (cs210) {
    // CS 210 (in-person)
    await prisma.section.upsert({
      where: { termId_classNumber: { termId: term.id, classNumber: "12345" } },
      update: {},
      create: {
        termId: term.id,
        courseId: cs210.id,
        classNumber: "12345",
        sectionCode: "01",
        modality: Modality.IN_PERSON,
        status: SectionStatus.OPEN,
        capacity: 30,
        enrolled: 22,
        waitlist: 0,
        meetings: {
          create: [{ days: "MWF", startMin: t(9, 0), endMin: t(9, 50), building: "GMCS", room: "329" }],
        },
        instructors: { create: [{ instructorId: smith.id }] },
      },
    });

    // CS 210 (online async)
    await prisma.section.upsert({
      where: { termId_classNumber: { termId: term.id, classNumber: "12346" } },
      update: {},
      create: {
        termId: term.id,
        courseId: cs210.id,
        classNumber: "12346",
        sectionCode: "02",
        modality: Modality.ONLINE_ASYNC,
        status: SectionStatus.OPEN,
        capacity: 200,
        enrolled: 145,
        waitlist: 0,
        meetings: {
          create: [{ days: "TBA", startMin: null, endMin: null, location: "Online" }],
        },
        instructors: { create: [{ instructorId: chen.id }] },
      },
    });
  }

  if (cs250) {
    // CS 250 (hybrid)
    await prisma.section.upsert({
      where: { termId_classNumber: { termId: term.id, classNumber: "22345" } },
      update: {},
      create: {
        termId: term.id,
        courseId: cs250.id,
        classNumber: "22345",
        sectionCode: "01",
        modality: Modality.HYBRID,
        status: SectionStatus.WAITLIST,
        capacity: 40,
        enrolled: 40,
        waitlist: 8,
        meetings: {
          create: [{ days: "TR", startMin: t(11, 0), endMin: t(12, 15), building: "EIS", room: "101" }],
        },
        instructors: { create: [{ instructorId: chen.id }] },
      },
    });
  }

  if (math254) {
    // MATH 254 (in-person)
    await prisma.section.upsert({
      where: { termId_classNumber: { termId: term.id, classNumber: "32345" } },
      update: {},
      create: {
        termId: term.id,
        courseId: math254.id,
        classNumber: "32345",
        sectionCode: "01",
        modality: Modality.IN_PERSON,
        status: SectionStatus.OPEN,
        capacity: 35,
        enrolled: 33,
        waitlist: 0,
        meetings: {
          create: [{ days: "TR", startMin: t(13, 0), endMin: t(14, 15), building: "NE", room: "060" }],
        },
        instructors: { create: [{ instructorId: palacios.id }] },
      },
    });
  }

  // --- Extra sections so most courses aren't empty in search UI ---

  const engl100 = findCourse("ENGL", "100");
  if (engl100) {
    await prisma.section.upsert({
      where: { termId_classNumber: { termId: term.id, classNumber: "42345" } },
      update: {},
      create: {
        termId: term.id,
        courseId: engl100.id,
        classNumber: "42345",
        sectionCode: "01",
        modality: Modality.IN_PERSON,
        status: SectionStatus.OPEN,
        capacity: 28,
        enrolled: 24,
        waitlist: 0,
        meetings: {
          create: [{ days: "MWF", startMin: t(10, 0), endMin: t(10, 50), building: "SH", room: "201" }],
        },
        instructors: { create: [{ instructorId: taylor.id }] },
      },
    });
  }

  const comm103 = findCourse("COMM", "103");
  if (comm103) {
    await prisma.section.upsert({
      where: { termId_classNumber: { termId: term.id, classNumber: "52345" } },
      update: {},
      create: {
        termId: term.id,
        courseId: comm103.id,
        classNumber: "52345",
        sectionCode: "01",
        modality: Modality.IN_PERSON,
        status: SectionStatus.OPEN,
        capacity: 32,
        enrolled: 29,
        waitlist: 0,
        meetings: {
          create: [{ days: "TR", startMin: t(9, 30), endMin: t(10, 45), building: "AH", room: "110" }],
        },
        instructors: { create: [{ instructorId: garcia.id }] },
      },
    });
  }

  const biol100 = findCourse("BIOL", "100");
  if (biol100) {
    await prisma.section.upsert({
      where: { termId_classNumber: { termId: term.id, classNumber: "62345" } },
      update: {},
      create: {
        termId: term.id,
        courseId: biol100.id,
        classNumber: "62345",
        sectionCode: "01",
        modality: Modality.IN_PERSON,
        status: SectionStatus.OPEN,
        capacity: 40,
        enrolled: 38,
        waitlist: 0,
        meetings: {
          create: [
            { days: "TR", startMin: t(12, 30), endMin: t(13, 45), building: "LS", room: "102" },
            { days: "F", startMin: t(14, 0), endMin: t(15, 50), building: "LS", room: "210" },
          ],
        },
        instructors: { create: [{ instructorId: patel.id }] },
      },
    });
  }

  const hist100 = findCourse("HIST", "100");
  if (hist100) {
    await prisma.section.upsert({
      where: { termId_classNumber: { termId: term.id, classNumber: "72345" } },
      update: {},
      create: {
        termId: term.id,
        courseId: hist100.id,
        classNumber: "72345",
        sectionCode: "01",
        modality: Modality.IN_PERSON,
        status: SectionStatus.OPEN,
        capacity: 60,
        enrolled: 52,
        waitlist: 0,
        meetings: {
          create: [{ days: "MWF", startMin: t(11, 0), endMin: t(11, 50), building: "GMCS", room: "124" }],
        },
        instructors: { create: [{ instructorId: garcia.id }] },
      },
    });
  }

  const afrs100 = findCourse("AFRS", "100");
  if (afrs100) {
    await prisma.section.upsert({
      where: { termId_classNumber: { termId: term.id, classNumber: "82345" } },
      update: {},
      create: {
        termId: term.id,
        courseId: afrs100.id,
        classNumber: "82345",
        sectionCode: "01",
        modality: Modality.IN_PERSON,
        status: SectionStatus.OPEN,
        capacity: 45,
        enrolled: 41,
        waitlist: 0,
        meetings: {
          create: [{ days: "TR", startMin: t(14, 0), endMin: t(15, 15), building: "AL", room: "204" }],
        },
        instructors: { create: [{ instructorId: taylor.id }] },
      },
    });
  }

  // 7) Generate sections for courses that don't have any (deterministic generator)
  // Time slots: morning (9-11), midday (12-2), afternoon (3-5), evening (6-8)
  const timeSlots = [
    { start: t(9, 0), end: t(9, 50), duration: 50 }, // MWF 50min
    { start: t(10, 0), end: t(10, 50), duration: 50 },
    { start: t(11, 0), end: t(11, 50), duration: 50 },
    { start: t(12, 0), end: t(13, 15), duration: 75 }, // TR 75min
    { start: t(13, 30), end: t(14, 45), duration: 75 },
    { start: t(15, 0), end: t(16, 15), duration: 75 },
    { start: t(16, 30), end: t(17, 45), duration: 75 },
    { start: t(18, 0), end: t(19, 15), duration: 75 }, // Evening
    { start: t(19, 30), end: t(20, 45), duration: 75 },
  ];

  const dayPatterns = [
    { days: "MWF", meetings: 1 }, // 1 meeting covers all days
    { days: "TR", meetings: 1 },
    { days: "MW", meetings: 2 }, // 2 separate meetings
    { days: "TR", meetings: 2 },
    { days: "M", meetings: 1 },
    { days: "W", meetings: 1 },
    { days: "F", meetings: 1 },
  ];

  const buildings = ["GMCS", "SH", "AH", "LS", "NE", "EIS", "AL", "PSFA", "SS", "HH"];
  const rooms = ["101", "102", "201", "202", "301", "302", "329", "110", "124", "204", "210"];

  // Get all courses that already have sections in this term
  const coursesWithSections = await prisma.section.findMany({
    where: { termId: term.id },
    select: { courseId: true },
    distinct: ["courseId"],
  });
  const courseIdsWithSections = new Set(coursesWithSections.map((s) => s.courseId));

  // Generate sections for courses without any
  let sectionCounter = 90000; // Start high to avoid conflicts
  let sectionsCreated = 0;
  let meetingsCreated = 0;

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    if (courseIdsWithSections.has(course.id)) {
      continue; // Skip courses that already have sections
    }

    // Deterministic selection based on course index
    const timeSlot = timeSlots[i % timeSlots.length];
    const dayPattern = dayPatterns[i % dayPatterns.length];
    const modalityIndex = i % 4;
    const statusIndex = i % 3;
    const instructorIndex = i % instructors.length;
    const buildingIndex = i % buildings.length;
    const roomIndex = i % rooms.length;

    // Modality distribution
    const modalities = [
      Modality.IN_PERSON,
      Modality.ONLINE_SYNC,
      Modality.ONLINE_ASYNC,
      Modality.HYBRID,
    ];
    const modality = modalities[modalityIndex];

    // Status distribution
    const statuses = [SectionStatus.OPEN, SectionStatus.OPEN, SectionStatus.WAITLIST]; // Mostly open
    const status = statuses[statusIndex];

    // Capacity and enrollment
    const capacity = modality === Modality.ONLINE_ASYNC ? 200 : 30 + (i % 20);
    const enrolled = status === SectionStatus.OPEN
      ? Math.floor(capacity * (0.7 + (i % 3) * 0.1))
      : capacity;
    const waitlist = status === SectionStatus.WAITLIST ? 5 + (i % 10) : 0;

    // Create meetings based on modality and day pattern
    const meetings: Array<{
      days: string;
      startMin: number | null;
      endMin: number | null;
      building?: string;
      room?: string;
      location?: string;
    }> = [];

    if (modality === Modality.ONLINE_ASYNC) {
      // Async: minimal meeting or TBA
      meetings.push({
        days: "TBA",
        startMin: null,
        endMin: null,
        location: "Online",
      });
    } else if (modality === Modality.ONLINE_SYNC) {
      // Sync: one meeting per week
      meetings.push({
        days: dayPattern.days,
        startMin: timeSlot.start,
        endMin: timeSlot.end,
        location: "Online",
      });
    } else {
      // In-person or hybrid: use day pattern
      if (dayPattern.meetings === 1) {
        // Single meeting covering all days
        meetings.push({
          days: dayPattern.days,
          startMin: timeSlot.start,
          endMin: timeSlot.end,
          building: buildings[buildingIndex],
          room: rooms[roomIndex],
        });
      } else {
        // Multiple meetings (e.g., MW as two separate meetings)
        const days = dayPattern.days.split("");
        days.forEach((day) => {
          meetings.push({
            days: day,
            startMin: timeSlot.start,
            endMin: timeSlot.end,
            building: buildings[buildingIndex],
            room: rooms[roomIndex],
          });
        });
      }
    }

    // Create section
    await prisma.section.create({
      data: {
        termId: term.id,
        courseId: course.id,
        classNumber: String(sectionCounter++),
        sectionCode: "01",
        modality,
        status,
        capacity,
        enrolled,
        waitlist,
        meetings: {
          create: meetings,
        },
        instructors: {
          create: [{ instructorId: instructors[instructorIndex].id }],
        },
      },
    });

    sectionsCreated++;
    meetingsCreated += meetings.length;
  }

  // 8) Summary
  const totalCourses = await prisma.course.count();
  const totalSections = await prisma.section.count({ where: { termId: term.id } });
  const totalMeetings = await prisma.meeting.count({
    where: { section: { termId: term.id } },
  });
  const totalCourseRequirements = await prisma.courseRequirement.count();

  console.log("Seed complete ✅");
  console.log(`Summary:`);
  console.log(`  Courses: ${totalCourses}`);
  console.log(`  Sections (term ${term.code}): ${totalSections}`);
  console.log(`  Meetings: ${totalMeetings}`);
  console.log(`  Course-Requirement links: ${totalCourseRequirements}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
