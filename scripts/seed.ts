import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb, mongoClientPromise } from "../lib/mongodb";
import { ensureUserIndexes } from "../features/auth/repositories/user.repository";
import { ensureDoctorIndexes } from "../features/doctors/repositories/doctor.repository";
import { ensurePatientIndexes } from "../features/patients/repositories/patient.repository";

async function main() {
  const db = await getDb();

  await Promise.all([
    ensureUserIndexes(),
    ensureDoctorIndexes(),
    ensurePatientIndexes(),
  ]);

  const email = (
    process.env.SEED_ADMIN_EMAIL || "admin@doctortracker.dev"
  ).toLowerCase();

  const password = process.env.SEED_ADMIN_PASSWORD || "Admin123!";

  await db.collection("users").updateOne(
    { email },
    {
      $set: {
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "admin",
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  if ((await db.collection("doctors").countDocuments()) === 0) {
    const now = new Date();

    const doctors = [
      {
        name: "Dr. Farhan Ahmed",
        specialization: "Cardiology",
        hospital: "Square Hospital",
        phone: "+8801712345671",
        email: "farhan.ahmed@example.com",
      },
      {
        name: "Dr. Nusrat Jahan",
        specialization: "Neurology",
        hospital: "United Hospital",
        phone: "+8801812345672",
        email: "nusrat.jahan@example.com",
      },
      {
        name: "Dr. Tahmid Hasan",
        specialization: "Pediatrics",
        hospital: "Evercare Hospital Dhaka",
        phone: "+8801912345673",
        email: "tahmid.hasan@example.com",
      },
      {
        name: "Dr. Sadia Rahman",
        specialization: "Dermatology",
        hospital: "Labaid Specialized Hospital",
        phone: "+8801612345674",
        email: "sadia.rahman@example.com",
      },
    ].map((doctor, index) => ({
      ...doctor,
      createdAt: new Date(now.getTime() - index * 86400000 * 18),
      updatedAt: now,
    }));

    const result = await db.collection("doctors").insertMany(doctors);

    const doctorIds = Object.values(result.insertedIds);

    const statuses = ["active", "monitoring", "recovered", "critical"] as const;

    const conditions = [
      "Hypertension",
      "Migraine",
      "Asthma",
      "Dermatitis",
      "Diabetes",
      "Post-operative Review",
    ];

    const patientNames = [
      "Arif Hossain",
      "Nusrat Akter",
      "Sabbir Rahman",
      "Tanjina Islam",
      "Mehedi Hasan",
      "Farzana Yasmin",
      "Rakib Ahmed",
      "Sumaiya Sultana",
      "Tanvir Chowdhury",
      "Jannatul Ferdous",
      "Imran Hossain",
      "Mim Akter",
      "Shakib Khan",
      "Sharmin Jahan",
      "Fahim Ahmed",
      "Tasnia Rahman",
      "Rafiul Islam",
      "Nabila Sultana",
      "Mahmud Hasan",
      "Sadia Akter",
      "Towhid Ullah",
      "Ishrat Jahan",
      "Abdullah Al Mamun",
      "Raisa Ahmed",
    ];

    const patients = patientNames.map((name, index) => ({
      doctorId: doctorIds[index % doctorIds.length] as ObjectId,
      name,
      age: 18 + ((index * 7) % 63),
      gender: index % 3 === 0 ? "male" : index % 3 === 1 ? "female" : "other",
      condition: conditions[index % conditions.length],
      status: statuses[index % statuses.length],
      phone: `+88017${String(10000000 + index).slice(-8)}`,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      lastVisit: new Date(now.getTime() - index * 86400000 * 3),
      createdAt: new Date(now.getTime() - index * 86400000 * 8),
      updatedAt: now,
    }));

    await db.collection("patients").insertMany(patients);
  }

  console.log(`Seed complete. Login: ${email} / ${password}`);

  await (await mongoClientPromise).close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
