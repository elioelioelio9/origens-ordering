import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";

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

export async function POST(request: Request) {
const body = await request.json();
const parsed = createOrderSchema.safeParse(body);

if (!parsed.success) {
return NextResponse.json(
{
error: "Invalid order payload",
},
{
status: 400,
}
);
}

const { tableToken, items } = parsed.data;

const total = items.reduce((sum, item) => {
return sum + item.price * item.quantity;
}, 0);

const orderRef = adminDb
.collection("restaurants")
.doc("origens-bbq")
.collection("orders")
.doc();

const now = FieldValue.serverTimestamp();

const order = {
id: orderRef.id,
restaurantId: "origens-bbq",
type: "dine_in",
tableToken,
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

return NextResponse.json({
ok: true,
orderId: orderRef.id,
});
}