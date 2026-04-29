import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const RESTAURANT_DOC_ID = "origens-bbq";

const requestTypeSchema = z.enum(["call_server", "request_bill"]);
const requestStatusSchema = z.enum(["new", "done", "cancelled"]);

const createRequestSchema = z.object({
tableToken: z.string().min(3),
type: requestTypeSchema,
});

const updateRequestSchema = z.object({
requestPath: z.string().min(1),
status: requestStatusSchema,
});

function serializeFirestoreDate(value: unknown) {
if (
value &&
typeof value === "object" &&
"toDate" in value &&
typeof value.toDate === "function"
) {
return value.toDate().toISOString();
}

if (typeof value === "string") {
return value;
}

return "";
}

export async function GET() {
try {
const snapshot = await adminDb
.collection("restaurants")
.doc(RESTAURANT_DOC_ID)
.collection("requests")
.get();

const requests = snapshot.docs
.map((document) => {
const data = document.data();

return {
id: document.id,
path: document.ref.path,
tableToken: data.tableToken ?? "",
type: data.type ?? "call_server",
status: data.status ?? "new",
createdAt: serializeFirestoreDate(data.createdAt),
updatedAt: serializeFirestoreDate(data.updatedAt),
};
})
.sort((a, b) => {
const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

return dateB - dateA;
});

return NextResponse.json({
ok: true,
requests,
});
} catch (error) {
console.error("Requests GET error:", error);

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

export async function POST(request: Request) {
try {
const body = await request.json();
const parsed = createRequestSchema.safeParse(body);

if (!parsed.success) {
return NextResponse.json(
{
ok: false,
error: "Invalid request payload",
},
{
status: 400,
}
);
}

const requestRef = adminDb
.collection("restaurants")
.doc(RESTAURANT_DOC_ID)
.collection("requests")
.doc();

const now = FieldValue.serverTimestamp();

await requestRef.set({
id: requestRef.id,
restaurantId: RESTAURANT_DOC_ID,
tableToken: parsed.data.tableToken,
type: parsed.data.type,
status: "new",
createdAt: now,
updatedAt: now,
});

return NextResponse.json({
ok: true,
requestId: requestRef.id,
requestPath: requestRef.path,
});
} catch (error) {
console.error("Requests POST error:", error);

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

export async function PATCH(request: Request) {
try {
const body = await request.json();
const parsed = updateRequestSchema.safeParse(body);

if (!parsed.success) {
return NextResponse.json(
{
ok: false,
error: "Invalid update payload",
},
{
status: 400,
}
);
}

await adminDb.doc(parsed.data.requestPath).update({
status: parsed.data.status,
updatedAt: FieldValue.serverTimestamp(),
});

return NextResponse.json({
ok: true,
});
} catch (error) {
console.error("Requests PATCH error:", error);

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