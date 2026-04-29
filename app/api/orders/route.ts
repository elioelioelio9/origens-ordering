import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { getTableLabelFromToken } from "@/lib/data/tables";

export const runtime = "nodejs";

const RESTAURANT_DOC_ID = "origens-bbq";

const orderStatusSchema = z.enum([
"new",
"accepted",
"preparing",
"ready",
"served",
"cancelled",
]);

const createOrderSchema = z.object({
tableToken: z.string().min(6),
items: z
.array(
z.object({
itemId: z.string(),
name: z.string(),
price: z.number().positive(),
quantity: z.number().int().positive(),
notes: z.string().optional(),
})
)
.min(1),
});

const updateOrderSchema = z.object({
orderPath: z.string().min(1),
status: orderStatusSchema,
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

export async function GET(request: Request) {
try {
const url = new URL(request.url);
const tableToken = url.searchParams.get("tableToken");

const snapshot = await adminDb
.collection("restaurants")
.doc(RESTAURANT_DOC_ID)
.collection("orders")
.get();

let orders = snapshot.docs
.map((document) => {
const data = document.data();

return {
id: document.id,
path: document.ref.path,
restaurantId: data.restaurantId ?? RESTAURANT_DOC_ID,
type: data.type ?? "dine_in",
tableId: data.tableId ?? "",
tableLabel: data.tableLabel ?? "",
tableToken: data.tableToken ?? "",
status: data.status ?? "new",
items: data.items ?? [],
total: data.total ?? 0,
customerNote: data.customerNote ?? "",
createdAt: serializeFirestoreDate(data.createdAt),
updatedAt: serializeFirestoreDate(data.updatedAt),
cleared: data.cleared ?? false,
};
})

.filter((order) => !order.cleared)
.sort((a, b) => {
const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

return dateB - dateA;
});

if (tableToken) {
orders = orders.filter((order) => order.tableToken === tableToken);
}

return NextResponse.json({
ok: true,
orders,
});
} catch (error) {
console.error("Orders GET error:", error);

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
const parsed = createOrderSchema.safeParse(body);

if (!parsed.success) {
return NextResponse.json(
{
ok: false,
error: "Invalid order payload",
},
{
status: 400,
}
);
}

const { tableToken, items } = parsed.data;
const tableLabel = getTableLabelFromToken(tableToken);

const total = items.reduce((sum, item) => {
return sum + item.price * item.quantity;
}, 0);

const orderRef = adminDb
.collection("restaurants")
.doc(RESTAURANT_DOC_ID)
.collection("orders")
.doc();

const now = FieldValue.serverTimestamp();

const order = {
id: orderRef.id,
restaurantId: RESTAURANT_DOC_ID,
type: "dine_in",
tableToken,
tableLabel,
status: "new",
items: items.map((item) => ({
itemId: item.itemId,
nameSnapshot: item.name,
priceSnapshot: item.price,
quantity: item.quantity,
notes: item.notes ?? "",
})),
total,
createdAt: now,
updatedAt: now,
};

await orderRef.set(order);

console.log("Order saved in Firestore:", orderRef.path);

return NextResponse.json({
ok: true,
orderId: orderRef.id,
orderPath: orderRef.path,
});
} catch (error) {
console.error("Orders POST error:", error);

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
const parsed = updateOrderSchema.safeParse(body);

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

const { orderPath, status } = parsed.data;

await adminDb.doc(orderPath).update({
status,
updatedAt: FieldValue.serverTimestamp(),
});

return NextResponse.json({
ok: true,
});
} catch (error) {
console.error("Orders PATCH error:", error);

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