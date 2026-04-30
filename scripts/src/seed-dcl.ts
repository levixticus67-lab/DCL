import {
  db,
  branchesTable,
  peopleTable,
  departmentsTable,
  announcementsTable,
  financeTransactionsTable,
  attendanceServicesTable,
  socialLinksTable,
  siteSettingsTable,
  storageItemsTable,
} from "@workspace/db";

async function main() {
  console.log("Seeding DCL data...");

  // Settings
  const [existingSettings] = await db.select().from(siteSettingsTable).limit(1);
  if (!existingSettings) {
    await db.insert(siteSettingsTable).values({
      churchName: "Deliverance Church Lugazi",
      abbreviation: "DCL",
      tagline: "Lifting the name of Jesus over Lugazi",
      missionStatement:
        "To know Christ and to make Him known across Lugazi and the surrounding region through worship, the Word, witness and works of compassion.",
      visionStatement:
        "A Christ-centered, Spirit-led community of believers transforming Lugazi and beyond with the power of the Gospel.",
      coreValues: [
        "Worship as a way of life",
        "The Word as our compass",
        "Witness in every season",
        "Community over isolation",
        "Compassion in action",
      ],
      address: "Industrial Area, Lugazi, Buikwe District, Uganda",
      primaryPhone: "+256 700 000 000",
      primaryEmail: "info@dclugazi.org",
    });
    console.log("  ✓ Site settings");
  }

  // Branches
  const existingBranches = await db.select().from(branchesTable);
  let branches = existingBranches;
  if (existingBranches.length === 0) {
    branches = await db
      .insert(branchesTable)
      .values([
        {
          name: "DCL Lugazi (Main)",
          isMain: true,
          location: "Industrial Area, Lugazi",
          pastorInChargeName: "Ps. Samuel Mukasa",
          contactPhone: "+256 700 000 001",
          contactEmail: "main@dclugazi.org",
        },
        {
          name: "DCL Najjembe",
          isMain: false,
          location: "Najjembe, Buikwe",
          pastorInChargeName: "Ps. Daniel Kato",
          contactPhone: "+256 700 000 002",
          contactEmail: "najjembe@dclugazi.org",
        },
        {
          name: "DCL Kawolo",
          isMain: false,
          location: "Kawolo Trading Centre",
          pastorInChargeName: "Ps. Esther Namatovu",
          contactPhone: "+256 700 000 003",
          contactEmail: "kawolo@dclugazi.org",
        },
      ])
      .returning();
    console.log(`  ✓ ${branches.length} branches`);
  }
  const main = branches.find((b) => b.isMain) ?? branches[0];

  // People
  const existingPeople = await db.select().from(peopleTable);
  if (existingPeople.length === 0) {
    await db.insert(peopleTable).values([
      {
        fullName: "Ps. Samuel Mukasa",
        role: "pastor",
        isLeader: true,
        branchId: main.id,
        email: "samuel@dclugazi.org",
        phone: "+256 700 100 001",
        bio: "Senior Pastor of Deliverance Church Lugazi. Husband, father, and shepherd of the DCL family for over 18 years.",
      },
      {
        fullName: "Ps. Daniel Kato",
        role: "pastor",
        isLeader: true,
        branchId: branches[1]?.id ?? main.id,
        email: "daniel@dclugazi.org",
        bio: "Pastor in charge of DCL Najjembe.",
      },
      {
        fullName: "Ps. Esther Namatovu",
        role: "pastor",
        isLeader: true,
        branchId: branches[2]?.id ?? main.id,
        email: "esther@dclugazi.org",
        bio: "Pastor in charge of DCL Kawolo, leading our women's discipleship initiatives.",
      },
      {
        fullName: "Min. Joshua Ssempala",
        role: "minister",
        isLeader: true,
        branchId: main.id,
        email: "joshua@dclugazi.org",
        bio: "Worship and music minister.",
      },
      {
        fullName: "Min. Rebecca Akello",
        role: "minister",
        isLeader: false,
        branchId: main.id,
      },
      {
        fullName: "Mary Nakato",
        role: "member",
        isLeader: false,
        branchId: main.id,
      },
      {
        fullName: "John Lubega",
        role: "member",
        isLeader: false,
        branchId: branches[1]?.id ?? main.id,
      },
      {
        fullName: "Grace Birungi",
        role: "member",
        isLeader: false,
        branchId: branches[2]?.id ?? main.id,
      },
    ]);
    console.log("  ✓ People");
  }

  const allPeople = await db.select().from(peopleTable);
  const worshipLeader = allPeople.find((p) => p.fullName.includes("Joshua"));

  // Departments
  const existingDepts = await db.select().from(departmentsTable);
  if (existingDepts.length === 0) {
    await db.insert(departmentsTable).values([
      {
        name: "Worship & Music",
        description: "Leading the congregation into the presence of God.",
        branchId: main.id,
        leaderId: worshipLeader?.id ?? null,
      },
      {
        name: "Children's Ministry",
        description: "Teaching the next generation to love Jesus.",
        branchId: main.id,
      },
      {
        name: "Youth",
        description: "Discipling teens and young adults.",
        branchId: main.id,
      },
      {
        name: "Ushering & Hospitality",
        description: "Welcoming everyone who walks through our doors.",
        branchId: main.id,
      },
      {
        name: "Intercession",
        description: "A standing watch in prayer for the church and city.",
        branchId: main.id,
      },
    ]);
    console.log("  ✓ Departments");
  }

  // Announcements
  const existingAnn = await db.select().from(announcementsTable);
  if (existingAnn.length === 0) {
    await db.insert(announcementsTable).values([
      {
        title: "Easter Sunrise Service",
        body: "Join us for an early sunrise gathering at the main campus this Sunday at 6:00 AM, followed by a celebration breakfast.",
        isPublic: true,
        isPinned: true,
        branchId: main.id,
      },
      {
        title: "Mid-week Bible study resumes",
        body: "Our mid-week Bible study returns on Wednesday evenings at 6:30 PM. We are walking through the book of Romans this season.",
        isPublic: true,
        isPinned: false,
        branchId: main.id,
      },
      {
        title: "Worship night at DCL Najjembe",
        body: "An evening of worship, the Word and prayer this Friday from 6 PM. All branches and visitors are warmly invited.",
        isPublic: true,
        isPinned: false,
        branchId: branches[1]?.id ?? main.id,
      },
      {
        title: "Volunteer training",
        body: "Internal note: department leaders please confirm your team's attendance for the upcoming volunteer training.",
        isPublic: false,
        isPinned: false,
        branchId: main.id,
      },
    ]);
    console.log("  ✓ Announcements");
  }

  // Finance
  const existingFin = await db.select().from(financeTransactionsTable);
  if (existingFin.length === 0) {
    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const last = (n: number) => {
      const x = new Date(today);
      x.setDate(x.getDate() - n);
      return iso(x);
    };
    await db.insert(financeTransactionsTable).values([
      {
        kind: "tithe",
        amount: "2400000",
        currency: "UGX",
        branchId: main.id,
        occurredOn: last(7),
        description: "Sunday tithes",
      },
      {
        kind: "offering",
        amount: "850000",
        currency: "UGX",
        branchId: main.id,
        occurredOn: last(7),
        description: "Sunday offering",
      },
      {
        kind: "tithe",
        amount: "1100000",
        currency: "UGX",
        branchId: branches[1]?.id ?? main.id,
        occurredOn: last(7),
      },
      {
        kind: "offering",
        amount: "320000",
        currency: "UGX",
        branchId: branches[2]?.id ?? main.id,
        occurredOn: last(7),
      },
      {
        kind: "expense",
        amount: "450000",
        currency: "UGX",
        branchId: main.id,
        occurredOn: last(5),
        description: "Sound system maintenance",
      },
      {
        kind: "expense",
        amount: "180000",
        currency: "UGX",
        branchId: main.id,
        occurredOn: last(3),
        description: "Children's ministry supplies",
      },
      {
        kind: "donation",
        amount: "2000000",
        currency: "UGX",
        branchId: main.id,
        occurredOn: last(14),
        description: "Building project donation",
      },
      {
        kind: "tithe",
        amount: "2300000",
        currency: "UGX",
        branchId: main.id,
        occurredOn: last(14),
      },
      {
        kind: "offering",
        amount: "780000",
        currency: "UGX",
        branchId: main.id,
        occurredOn: last(14),
      },
      {
        kind: "tithe",
        amount: "2550000",
        currency: "UGX",
        branchId: main.id,
        occurredOn: last(21),
      },
    ]);
    console.log("  ✓ Finance");
  }

  // Attendance
  const existingAtt = await db.select().from(attendanceServicesTable);
  if (existingAtt.length === 0) {
    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const last = (n: number) => {
      const x = new Date(today);
      x.setDate(x.getDate() - n);
      return iso(x);
    };
    await db.insert(attendanceServicesTable).values([
      {
        title: "Sunday First Service",
        branchId: main.id,
        serviceDate: last(7),
        adultCount: 280,
        youthCount: 95,
        childrenCount: 110,
      },
      {
        title: "Sunday Second Service",
        branchId: main.id,
        serviceDate: last(7),
        adultCount: 410,
        youthCount: 120,
        childrenCount: 140,
      },
      {
        title: "Sunday Service",
        branchId: branches[1]?.id ?? main.id,
        serviceDate: last(7),
        adultCount: 180,
        youthCount: 60,
        childrenCount: 70,
      },
      {
        title: "Sunday Service",
        branchId: branches[2]?.id ?? main.id,
        serviceDate: last(7),
        adultCount: 95,
        youthCount: 35,
        childrenCount: 45,
      },
      {
        title: "Sunday Service",
        branchId: main.id,
        serviceDate: last(14),
        adultCount: 660,
        youthCount: 200,
        childrenCount: 245,
      },
      {
        title: "Sunday Service",
        branchId: main.id,
        serviceDate: last(21),
        adultCount: 700,
        youthCount: 215,
        childrenCount: 240,
      },
    ]);
    console.log("  ✓ Attendance");
  }

  // Social
  const existingSoc = await db.select().from(socialLinksTable);
  if (existingSoc.length === 0) {
    await db.insert(socialLinksTable).values([
      {
        platform: "Facebook",
        url: "https://facebook.com/dclugazi",
        handle: "@dclugazi",
        sortOrder: 1,
      },
      {
        platform: "YouTube",
        url: "https://youtube.com/@dclugazi",
        handle: "@dclugazi",
        sortOrder: 2,
      },
      {
        platform: "Instagram",
        url: "https://instagram.com/dclugazi",
        handle: "@dclugazi",
        sortOrder: 3,
      },
      {
        platform: "WhatsApp",
        url: "https://wa.me/256700000000",
        handle: "+256 700 000 000",
        sortOrder: 4,
      },
    ]);
    console.log("  ✓ Social links");
  }

  // Storage
  const existingStorage = await db.select().from(storageItemsTable);
  if (existingStorage.length === 0) {
    await db.insert(storageItemsTable).values([
      {
        title: "Sermon Notes — Romans Series Week 1",
        category: "Sermon Notes",
        fileUrl: "https://example.com/files/romans-w1.pdf",
        fileType: "application/pdf",
        description: "Detailed study notes for the opening week.",
      },
      {
        title: "Constitution & Bylaws",
        category: "Documents",
        fileUrl: "https://example.com/files/constitution.pdf",
        fileType: "application/pdf",
      },
      {
        title: "2025 Annual Report",
        category: "Reports",
        fileUrl: "https://example.com/files/annual-2025.pdf",
        fileType: "application/pdf",
      },
    ]);
    console.log("  ✓ Storage items");
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
