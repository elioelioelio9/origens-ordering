import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { categories, menuItems } from "@/lib/data/mock-menu";

export const runtime = "nodejs";

const RESTAURANT_DOC_ID = "origens-bbq";

const seedMenuSchema = z.object({
action: z.literal("seed").optional(),
});

const createCategorySchema = z.object({
action: z.literal("create_category"),
name: z.string().min(1),
order: z.number().optional(),
});

const createItemSchema = z.object({
action: z.literal("create_item"),
categoryId: z.string().min(1),
name: z.string().min(1),
description: z.string().optional(),
price: z.number().positive(),
imageUrl: z.string().optional(),
order: z.number().optional(),
isDailySpecial: z.boolean().optional(),
});

const updateMenuItemSchema = z.object({
type: z.literal("item"),
itemId: z.string().min(1),
categoryId: z.string().min(1).optional(),
name: z.string().min(1).optional(),
description: z.string().optional(),
imageUrl: z.string().optional(),
active: z.boolean().optional(),
available: z.boolean().optional(),
price: z.number().positive().optional(),
order: z.number().optional(),
isDailySpecial: z.boolean().optional(),
});

const updateCategorySchema = z.object({
type: z.literal("category"),
categoryId: z.string().min(1),
name: z.string().min(1).optional(),
order: z.number().optional(),
active: z.boolean().optional(),
});

function slugify(value: string) {
return value
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/[^a-z0-9]+/g, "-")
.replace(/(^-|-$)/g, "");
}

function serializeDocument(document: FirebaseFirestore.QueryDocumentSnapshot) {
return {
id: document.id,
...document.data(),
};
}

export async function GET() {
try {
const restaurantRef = adminDb.collection("restaurants").doc(RESTAURANT_DOC_ID);

const categoriesSnapshot = await restaurantRef.collection("categories").get();
const itemsSnapshot = await restaurantRef.collection("items").get();

const firestoreCategories = categoriesSnapshot.docs.map(serializeDocument);
const firestoreItems = itemsSnapshot.docs.map(serializeDocument);

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

export async function POST(request: Request) {
try {
let body: unknown = null;

try {
body = await request.json();
} catch {
body = { action: "seed" };
}

const restaurantRef = adminDb.collection("restaurants").doc(RESTAURANT_DOC_ID);

const createCategoryParsed = createCategorySchema.safeParse(body);

if (createCategoryParsed.success) {
const { name, order } = createCategoryParsed.data;
const categoryId = slugify(name) || crypto.randomUUID();

await restaurantRef.collection("categories").doc(categoryId).set({
id: categoryId,
name,
order: order ?? Date.now(),
active: true,
createdAt: FieldValue.serverTimestamp(),
updatedAt: FieldValue.serverTimestamp(),
});

return NextResponse.json({
ok: true,
categoryId,
});
}

const createItemParsed = createItemSchema.safeParse(body);

if (createItemParsed.success) {
const item = createItemParsed.data;
const itemId = slugify(item.name) || crypto.randomUUID();

await restaurantRef.collection("items").doc(itemId).set({
id: itemId,
categoryId: item.categoryId,
name: item.name,
description: item.description ?? "",
price: item.price,
imageUrl: item.imageUrl ?? "",
active: true,
available: true,
order: item.order ?? Date.now(),
isDailySpecial: item.isDailySpecial ?? false,
createdAt: FieldValue.serverTimestamp(),
updatedAt: FieldValue.serverTimestamp(),
});

return NextResponse.json({
ok: true,
itemId,
});
}

const seedParsed = seedMenuSchema.safeParse(body);

if (!seedParsed.success) {
return NextResponse.json(
{
ok: false,
error: "Invalid menu POST payload",
},
{
status: 400,
}
);
}

const batch = adminDb.batch();

categories.forEach((category) => {
const categoryRef = restaurantRef.collection("categories").doc(category.id);

batch.set(
categoryRef,
{
...category,
updatedAt: FieldValue.serverTimestamp(),
},
{
merge: true,
}
);
});

menuItems.forEach((item, index) => {
const itemRef = restaurantRef.collection("items").doc(item.id);

batch.set(
itemRef,
{
...item,
order: item.order ?? index + 1,
isDailySpecial: item.isDailySpecial ?? false,
imageUrl: item.imageUrl ?? "",
updatedAt: FieldValue.serverTimestamp(),
},
{
merge: true,
}
);
});

await batch.commit();

return NextResponse.json({
ok: true,
seededCategories: categories.length,
seededItems: menuItems.length,
});
} catch (error) {
console.error("Menu POST error:", error);

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

const itemParsed = updateMenuItemSchema.safeParse(body);

if (itemParsed.success) {
const { itemId, type, ...updates } = itemParsed.data;

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
}

const categoryParsed = updateCategorySchema.safeParse(body);

if (categoryParsed.success) {
const { categoryId, type, ...updates } = categoryParsed.data;

await adminDb
.collection("restaurants")
.doc(RESTAURANT_DOC_ID)
.collection("categories")
.doc(categoryId)
.update({
...updates,
updatedAt: FieldValue.serverTimestamp(),
});

return NextResponse.json({
ok: true,
});
}

return NextResponse.json(
{
ok: false,
error: "Invalid menu update payload",
},
{
status: 400,
}
);
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