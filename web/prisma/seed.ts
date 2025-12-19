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

  // 2) Courses
  const cs210 = await prisma.course.upsert({
    where: { subject_number: { subject: "CS", number: "210" } },
    update: { title: "Data Structures" },
    create: { subject: "CS", number: "210", title: "Data Structures", units: "3" },
  });

  const cs250 = await prisma.course.upsert({
    where: { subject_number: { subject: "CS", number: "250" } },
    update: { title: "Intro to Algorithms" },
    create: { subject: "CS", number: "250", title: "Intro to Algorithms", units: "3" },
  });

  const math254 = await prisma.course.upsert({
    where: { subject_number: { subject: "MATH", number: "254" } },
    update: { title: "Linear Algebra" },
    create: { subject: "MATH", number: "254", title: "Linear Algebra", units: "3" },
  });

  // 3) Instructors
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

  // 4) Sections + Meetings + Instructor links
  // CS 210 (in-person)
  const s1 = await prisma.section.create({
    data: {
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
  await prisma.section.create({
    data: {
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

  // CS 250 (hybrid)
  await prisma.section.create({
    data: {
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

  // MATH 254 (in-person)
  await prisma.section.create({
    data: {
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

  console.log("Seed complete ✅");
  console.log("Example created section id:", s1.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
