import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const RESTAURANT_DOC_ID = "origens-bbq";

const resetTableSchema = z.object({
tableToken: z.string().min(3),
});

export async function POST(request: Request) {
try {
const body = await request.json();
const parsed = resetTableSchema.safeParse(body);

if (!parsed.success) {
return NextResponse.json(
{
ok: false,
error: "Invalid table reset payload",
},
{
status: 400,
}
);
}

const { tableToken } = parsed.data;
const now = FieldValue.serverTimestamp();

const ordersSnapshot = await adminDb
.collection("restaurants")
.doc(RESTAURANT_DOC_ID)
.collection("orders")
.where("tableToken", "==", tableToken)
.get();

const requestsSnapshot = await adminDb
.collection("restaurants")
.doc(RESTAURANT_DOC_ID)
.collection("requests")
.where("tableToken", "==", tableToken)
.get();

const batch = adminDb.batch();

ordersSnapshot.docs.forEach((document) => {
batch.update(document.ref, {
cleared: true,
clearedAt: now,
updatedAt: now,
});
});

requestsSnapshot.docs.forEach((document) => {
batch.update(document.ref, {
cleared: true,
clearedAt: now,
updatedAt: now,
});
});

await batch.commit();

return NextResponse.json({
ok: true,
clearedOrders: ordersSnapshot.size,
clearedRequests: requestsSnapshot.size,
});
} catch (error) {
console.error("Reset table error:", error);

return NextResponse.json(
{
ok: false,
error: error instanceof Error ? error.message : String(error),
},
{
status: 500,
}
);
}
}