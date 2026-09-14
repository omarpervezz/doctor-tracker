import { getDb } from "@/lib/mongodb";
import { successResult } from "@/lib/service-result";
export async function getDashboardAnalytics() {
  const db = await getDb();
  const doctors = db.collection("doctors"),
    patients = db.collection("patients");
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);
  const [
    totalDoctors,
    totalPatients,
    statusBreakdown,
    patientsPerDoctor,
    monthlyPatients,
    recentPatients,
  ] = await Promise.all([
    doctors.countDocuments(),
    patients.countDocuments(),
    patients
      .aggregate([
        { $group: { _id: "$status", value: { $sum: 1 } } },
        { $sort: { value: -1 } },
      ])
      .toArray(),
    patients
      .aggregate([
        { $group: { _id: "$doctorId", patients: { $sum: 1 } } },
        { $sort: { patients: -1 } },
        { $limit: 6 },
        {
          $lookup: {
            from: "doctors",
            localField: "_id",
            foreignField: "_id",
            as: "doctor",
          },
        },
        { $unwind: "$doctor" },
        { $project: { _id: 0, name: "$doctor.name", patients: 1 } },
      ])
      .toArray(),
    patients
      .aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            patients: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
      .toArray(),
    patients.find({}).sort({ createdAt: -1 }).limit(5).toArray(),
  ]);
  const doctorIds = recentPatients.map((p) => p.doctorId);
  const recentDoctors = doctorIds.length
    ? await doctors
        .find({ _id: { $in: doctorIds } }, { projection: { name: 1 } })
        .toArray()
    : [];
  const map = new Map(recentDoctors.map((d) => [d._id.toString(), d.name]));
  return successResult({
    totals: {
      doctors: totalDoctors,
      patients: totalPatients,
      averagePatientsPerDoctor: totalDoctors
        ? Number((totalPatients / totalDoctors).toFixed(1))
        : 0,
    },
    statusBreakdown: statusBreakdown.map((x) => ({
      name: x._id,
      value: x.value,
    })),
    patientsPerDoctor,
    monthlyPatients: monthlyPatients.map((x) => ({
      month: new Date(x._id.year, x._id.month - 1).toLocaleString("en-US", {
        month: "short",
      }),
      patients: x.patients,
    })),
    recentPatients: recentPatients.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      condition: p.condition,
      status: p.status,
      doctorName: map.get(p.doctorId.toString()) || "Unknown",
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
