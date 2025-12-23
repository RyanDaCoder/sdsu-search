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
  // 1) Term
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
    { code: "GE-III", name: "Explorations" },
    { code: "GE-IVA", name: "Social Sciences" },
    { code: "GE-IVB", name: "Natural Sciences" },
    { code: "GE-IVC", name: "Arts and Humanities" },
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

  const reqMap = new Map(requirements.map((r: { code: string; id: string }) => [r.code, r.id]));

  // 3) Courses - Create ~30 courses with GE tags
  const coursesData = [
    // CS courses
    { subject: "CS", number: "107", title: "Introduction to Programming", units: "3", geCodes: ["GE-IIB"] },
    { subject: "CS", number: "108", title: "Programming and Problem Solving", units: "3", geCodes: ["GE-IIB"] },
    { subject: "CS", number: "210", title: "Data Structures", units: "3", geCodes: ["GE-IIB"] },
    { subject: "CS", number: "250", title: "Intro to Algorithms", units: "3", geCodes: ["GE-IIB"] },
    { subject: "CS", number: "310", title: "Data Structures and Algorithms", units: "3", geCodes: ["GE-IIB"] },
    { subject: "CS", number: "320", title: "Programming Languages", units: "3", geCodes: ["GE-IIB"] },
    
    // MATH courses
    { subject: "MATH", number: "120", title: "Calculus I", units: "4", geCodes: ["GE-IIA-MATH"] },
    { subject: "MATH", number: "121", title: "Calculus II", units: "4", geCodes: ["GE-IIA-MATH"] },
    { subject: "MATH", number: "150", title: "Calculus for Life Sciences", units: "3", geCodes: ["GE-IIA-MATH", "GE-IIA-LIFE"] },
    { subject: "MATH", number: "254", title: "Linear Algebra", units: "3", geCodes: ["GE-IIA-MATH", "GE-IVC"] },
    { subject: "MATH", number: "342", title: "Statistics", units: "3", geCodes: ["GE-IIA-MATH", "GE-IIB"] },
    
    // English/Writing courses
    { subject: "ENGL", number: "100", title: "Composition", units: "3", geCodes: ["GE-I-WRITTEN"] },
    { subject: "ENGL", number: "200", title: "Advanced Composition", units: "3", geCodes: ["GE-I-WRITTEN"] },
    { subject: "ENGL", number: "220", title: "Introduction to Literature", units: "3", geCodes: ["GE-IIC-HUM", "GE-IVC"] },
    
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
    { subject: "AFRS", number: "100", title: "Introduction to Africana Studies", units: "3", geCodes: ["GE-V-ETHNIC", "GE-IV-CULTDIV"] },
    { subject: "AAS", number: "100", title: "Introduction to Asian American Studies", units: "3", geCodes: ["GE-V-ETHNIC", "GE-IV-CULTDIV"] },
    { subject: "CHIC", number: "100", title: "Introduction to Chicana and Chicano Studies", units: "3", geCodes: ["GE-V-ETHNIC", "GE-IV-CULTDIV"] },
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
    
    // Delete existing requirements for this course (for idempotency)
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
          .filter((item): item is { courseId: string; requirementId: string } => item !== null),
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

  // 6) Sections + Meetings + Instructor links
  // Find CS 210, CS 250, and MATH 254 for sections
  const cs210 = courses.find((c) => c.subject === "CS" && c.number === "210");
  const cs250 = courses.find((c) => c.subject === "CS" && c.number === "250");
  const math254 = courses.find((c) => c.subject === "MATH" && c.number === "254");

  if (cs210) {
    // CS 210 (in-person)
    const s1 = await prisma.section.upsert({
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
          create: [
            { days: "MWF", startMin: t(9, 0), endMin: t(9, 50), building: "GMCS", room: "329" },
          ],
        },
        instructors: {
          create: [{ instructorId: smith.id }],
        },
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
        instructors: {
          create: [{ instructorId: chen.id }],
        },
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
          create: [
            { days: "TR", startMin: t(11, 0), endMin: t(12, 15), building: "EIS", room: "101" },
          ],
        },
        instructors: {
          create: [{ instructorId: chen.id }],
        },
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
          create: [
            { days: "TR", startMin: t(13, 0), endMin: t(14, 15), building: "NE", room: "060" },
          ],
        },
        instructors: {
          create: [{ instructorId: palacios.id }],
        },
      },
    });
  }

  console.log("Seed complete ✅");
  console.log(`Seeded ${requirements.length} requirements and ${courses.length} courses`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
