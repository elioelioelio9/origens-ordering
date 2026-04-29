import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { categories, menuItems } from "@/lib/data/mock-menu";

export const runtime = "nodejs";

const RESTAURANT_DOC_ID = "origens-bbq";

const updateMenuItemSchema = z.object({
itemId: z.string().min(1),
name: z.string().min(1).optional(),
description: z.string().optional(),
imageUrl: z.string().optional(),
active: z.boolean().optional(),
available: z.boolean().optional(),
price: z.number().positive().optional(),
});

export async function GET() {
try {
const categoriesSnapshot = await adminDb
.collection("restaurants")
.doc(RESTAURANT_DOC_ID)
.collection("categories")
.get();

const itemsSnapshot = await adminDb
.collection("restaurants")
.doc(RESTAURANT_DOC_ID)
.collection("items")
.get();

const firestoreCategories = categoriesSnapshot.docs.map((document) => ({
id: document.id,
...document.data(),
}));

const firestoreItems = itemsSnapshot.docs.map((document) => ({
id: document.id,
...document.data(),
}));

return NextResponse.json({
ok: true,
categories:
firestoreCategories.length > 0 ? firestoreCategories : categories,
items: firestoreItems.length > 0 ? firestoreItems : menuItems,
});
} catch (error) {
console.error("Menu GET error:", error);

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

export async function POST() {
try {
const batch = adminDb.batch();
const restaurantRef = adminDb.collection("restaurants").doc(RESTAURANT_DOC_ID);

categories.forEach((category) => {
const categoryRef = restaurantRef.collection("categories").doc(category.id);

batch.set(categoryRef, {
...category,
updatedAt: FieldValue.serverTimestamp(),
});
});

menuItems.forEach((item) => {
const itemRef = restaurantRef.collection("items").doc(item.id);

batch.set(itemRef, {
...item,
updatedAt: FieldValue.serverTimestamp(),
});
});

await batch.commit();

return NextResponse.json({
ok: true,
seededCategories: categories.length,
seededItems: menuItems.length,
});
} catch (error) {
console.error("Menu POST seed error:", error);

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
const parsed = updateMenuItemSchema.safeParse(body);

if (!parsed.success) {
return NextResponse.json(
{
ok: false,
error: "Invalid menu item update payload",
},
{
status: 400,
}
);
}

const { itemId, ...updates } = parsed.data;

await adminDb
.collection("restaurants")
.doc(RESTAURANT_DOC_ID)
.collection("items")
.doc(itemId)
.update({
...updates,
updatedAt: FieldValue.serverTimestamp(),
});

return NextResponse.json({
ok: true,
});
} catch (error) {
console.error("Menu PATCH error:", error);

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