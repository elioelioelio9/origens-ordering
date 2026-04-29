"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { MenuCategory, MenuItem } from "@/types/menu";

type MenuDraft = {
name: string;
description: string;
price: string;
imageUrl: string;
categoryId: string;
order: string;
isDailySpecial: boolean;
};

type NewItemDraft = {
categoryId: string;
name: string;
description: string;
price: string;
imageUrl: string;
isDailySpecial: boolean;
};

const emptyNewItem: NewItemDraft = {
categoryId: "",
name: "",
description: "",
price: "",
imageUrl: "",
isDailySpecial: false,
};

export default function AdminMenuPage() {
const [categories, setCategories] = useState<MenuCategory[]>([]);
const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
const [drafts, setDrafts] = useState<Record<string, MenuDraft>>({});
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
const [newCategoryName, setNewCategoryName] = useState("");
const [newItem, setNewItem] = useState<NewItemDraft>(emptyNewItem);
const [showInactive, setShowInactive] = useState(false);
const [showUnavailable, setShowUnavailable] = useState(true);

async function loadMenu() {
try {
const response = await fetch("/api/menu", {
method: "GET",
cache: "no-store",
});

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(data.error || "Impossible de charger le menu.");
}

const nextCategories = [...data.categories].sort(
(a: MenuCategory, b: MenuCategory) => a.order - b.order
);

const nextItems = [...data.items].sort((a: MenuItem, b: MenuItem) => {
const orderA = a.order ?? 9999;
const orderB = b.order ?? 9999;
return orderA - orderB;
});

setCategories(nextCategories);
setMenuItems(nextItems);

const nextDrafts: Record<string, MenuDraft> = {};

nextItems.forEach((item: MenuItem) => {
nextDrafts[item.id] = {
name: item.name,
description: item.description,
price: String(item.price),
imageUrl: item.imageUrl ?? "",
categoryId: item.categoryId,
order: String(item.order ?? 999),
isDailySpecial: item.isDailySpecial ?? false,
};
});

setDrafts(nextDrafts);

if (!newItem.categoryId && nextCategories[0]) {
setNewItem((current) => ({
...current,
categoryId: nextCategories[0].id,
}));
}

setError("");
} catch (error) {
console.error("Load menu error:", error);
setError(error instanceof Error ? error.message : String(error));
} finally {
setLoading(false);
}
}

async function seedMenu() {
const confirmed = window.confirm(
"Envoyer le menu actuel dans Firestore ? Cela peut écraser certaines valeurs existantes."
);

if (!confirmed) return;

try {
const response = await fetch("/api/menu", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
action: "seed",
}),
});

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(data.error || "Impossible d’envoyer le menu.");
}

alert(
`Menu envoyé dans Firestore : ${data.seededCategories} catégories, ${data.seededItems} plats.`
);

await loadMenu();
} catch (error) {
alert(error instanceof Error ? error.message : String(error));
}
}

async function updateMenuItem(
itemId: string,
updates: {
categoryId?: string;
name?: string;
description?: string;
imageUrl?: string;
active?: boolean;
available?: boolean;
price?: number;
order?: number;
isDailySpecial?: boolean;
}
) {
try {
const response = await fetch("/api/menu", {
method: "PATCH",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
type: "item",
itemId,
...updates,
}),
});

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(data.error || "Impossible de modifier le plat.");
}

await loadMenu();
} catch (error) {
alert(error instanceof Error ? error.message : String(error));
}
}

async function updateCategory(
categoryId: string,
updates: {
name?: string;
order?: number;
active?: boolean;
}
) {
try {
const response = await fetch("/api/menu", {
method: "PATCH",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
type: "category",
categoryId,
...updates,
}),
});

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(data.error || "Impossible de modifier la catégorie.");
}

await loadMenu();
} catch (error) {
alert(error instanceof Error ? error.message : String(error));
}
}

async function createCategory() {
const name = newCategoryName.trim();

if (!name) {
alert("Nom de catégorie obligatoire.");
return;
}

try {
const response = await fetch("/api/menu", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
action: "create_category",
name,
order: categories.length + 1,
}),
});

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(data.error || "Impossible de créer la catégorie.");
}

setNewCategoryName("");
await loadMenu();
} catch (error) {
alert(error instanceof Error ? error.message : String(error));
}
}

async function createItem() {
const price = Number(newItem.price.replace(",", "."));

if (!newItem.categoryId) {
alert("Choisis une catégorie.");
return;
}

if (!newItem.name.trim()) {
alert("Nom du plat obligatoire.");
return;
}

if (!Number.isFinite(price) || price <= 0) {
alert("Prix invalide.");
return;
}

try {
const response = await fetch("/api/menu", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
action: "create_item",
categoryId: newItem.categoryId,
name: newItem.name.trim(),
description: newItem.description.trim(),
price,
imageUrl: newItem.imageUrl.trim(),
isDailySpecial: newItem.isDailySpecial,
order:
menuItems.filter((item) => item.categoryId === newItem.categoryId)
.length + 1,
}),
});

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(data.error || "Impossible de créer le plat.");
}

setNewItem({
...emptyNewItem,
categoryId: newItem.categoryId,
});

await loadMenu();
} catch (error) {
alert(error instanceof Error ? error.message : String(error));
}
}
async function moveItem(item: MenuItem, direction: "up" | "down") {
const categoryItems = menuItems
.filter((currentItem) => currentItem.categoryId === item.categoryId)
.filter((currentItem) => showInactive || currentItem.active)
.filter((currentItem) => showUnavailable || currentItem.available)
.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

const currentIndex = categoryItems.findIndex(
(currentItem) => currentItem.id === item.id
);

if (currentIndex === -1) return;

const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
const targetItem = categoryItems[targetIndex];

if (!targetItem) return;

const currentOrder = item.order ?? currentIndex + 1;
const targetOrder = targetItem.order ?? targetIndex + 1;

await Promise.all([
updateMenuItem(item.id, {
order: targetOrder,
}),
updateMenuItem(targetItem.id, {
order: currentOrder,
}),
]);

await loadMenu();
}

async function saveItem(item: MenuItem) {
const draft = drafts[item.id];

if (!draft) return;

const price = Number(draft.price.replace(",", "."));
const order = Number(draft.order);

if (!draft.name.trim()) {
alert("Le nom du plat est obligatoire.");
return;
}

if (!Number.isFinite(price) || price <= 0) {
alert("Prix invalide.");
return;
}

if (!Number.isFinite(order)) {
alert("Ordre invalide.");
return;
}

await updateMenuItem(item.id, {
name: draft.name.trim(),
description: draft.description.trim(),
imageUrl: draft.imageUrl.trim(),
categoryId: draft.categoryId,
price,
order,
isDailySpecial: draft.isDailySpecial,
});

setSelectedItemId(null);
}

function updateDraft(itemId: string, updates: Partial<MenuDraft>) {
setDrafts((current) => ({
...current,
[itemId]: {
...current[itemId],
...updates,
},
}));
}

useEffect(() => {
loadMenu();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const visibleCategories = useMemo(() => {
return categories
.filter((category) => showInactive || category.active)
.sort((a, b) => a.order - b.order);
}, [categories, showInactive]);

const activeItems = menuItems.filter((item) => item.active).length;
const unavailableItems = menuItems.filter((item) => !item.available).length;
const dailySpecials = menuItems.filter(
(item) => item.isDailySpecial && item.active
);

return (
<main className="min-h-screen bg-neutral-950 p-6 text-white">
<div className="mx-auto max-w-7xl">
<header className="border-b border-neutral-800 pb-6">
<p className="text-sm uppercase tracking-[0.3em] text-orange-400">
Origens BBQ
</p>

<h1 className="mt-2 text-3xl font-bold">Gestion du menu</h1>

<p className="mt-2 text-sm text-neutral-400">
Gérez les catégories, les plats, les prix, les photos, les disponibilités et les plats du jour.
</p>

<div className="mt-5 flex flex-wrap gap-2">
<Link
href="/admin"
className="rounded-full bg-neutral-800 px-4 py-2 text-sm font-semibold text-white"
>
Accueil admin
</Link>

<Link
href="/admin/orders"
className="rounded-full bg-neutral-800 px-4 py-2 text-sm font-semibold text-white"
>
Commandes cuisine
</Link>

<Link
href="/admin/tables"
className="rounded-full bg-neutral-800 px-4 py-2 text-sm font-semibold text-white"
>
Tables & additions
</Link>

<button
onClick={seedMenu}
className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
>
Envoyer le menu dans Firestore
</button>
</div>
</header>

{error ? (
<div className="mt-6 rounded-xl border border-red-500 bg-red-950 p-4 text-sm text-red-200">
Erreur : {error}
</div>
) : null}

{loading ? (
<p className="mt-8 text-neutral-400">Chargement du menu...</p>
) : (
<>
<section className="mt-8 grid gap-4 md:grid-cols-4">
<div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
<p className="text-sm text-neutral-500">Catégories</p>
<p className="mt-2 text-3xl font-bold text-orange-400">
{categories.length}
</p>
</div>

<div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
<p className="text-sm text-neutral-500">Plats</p>
<p className="mt-2 text-3xl font-bold text-orange-400">
{menuItems.length}
</p>
</div>

<div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
<p className="text-sm text-neutral-500">Plats actifs</p>
<p className="mt-2 text-3xl font-bold text-orange-400">
{activeItems}
</p>
</div>

<div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
<p className="text-sm text-neutral-500">Indisponibles</p>
<p className="mt-2 text-3xl font-bold text-orange-400">
{unavailableItems}
</p>
</div>
</section>

<section className="mt-8 rounded-3xl border border-orange-500/30 bg-orange-500/10 p-5">
<div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
<div>
<h2 className="text-2xl font-bold">Plats du jour</h2>
<p className="mt-1 text-sm text-neutral-300">
Les plats marqués “plat du jour” seront mis en avant côté client.
</p>
</div>

<p className="text-sm text-orange-300">
{dailySpecials.length} plat(s)
</p>
</div>

{dailySpecials.length === 0 ? (
<p className="mt-4 rounded-2xl bg-neutral-950 p-4 text-sm text-neutral-400">
Aucun plat du jour sélectionné.
</p>
) : (
<div className="mt-4 grid gap-3 md:grid-cols-2">
{dailySpecials.map((item) => (
<div
key={item.id}
className="rounded-2xl bg-neutral-950 p-4"
>
<p className="font-semibold">{item.name}</p>
<p className="mt-1 text-sm text-orange-300">
CHF {Number(item.price).toFixed(2)}
</p>
</div>
))}
</div>
)}
</section>

<section className="mt-8 grid gap-4 lg:grid-cols-2">
<div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
<h2 className="text-xl font-bold">Nouvelle catégorie</h2>

<div className="mt-4 flex gap-2">
<input
value={newCategoryName}
onChange={(event) => setNewCategoryName(event.target.value)}
placeholder="Ex : Desserts, Boissons..."
className="min-w-0 flex-1 rounded-full border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
/>

<button
onClick={createCategory}
className="rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
>
Ajouter
</button>
</div>
</div>

<div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
<h2 className="text-xl font-bold">Nouveau plat</h2>

<div className="mt-4 grid gap-3 md:grid-cols-2">
<select
value={newItem.categoryId}
onChange={(event) =>
setNewItem((current) => ({
...current,
categoryId: event.target.value,
}))
}
className="rounded-full border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
>
{categories.map((category) => (
<option key={category.id} value={category.id}>
{category.name}
</option>
))}
</select>

<input
value={newItem.name}
onChange={(event) =>
setNewItem((current) => ({
...current,
name: event.target.value,
}))
}
placeholder="Nom du plat"
className="rounded-full border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
/>

<input
value={newItem.price}
onChange={(event) =>
setNewItem((current) => ({
...current,
price: event.target.value,
}))
}
placeholder="Prix"
className="rounded-full border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
/>

<input
value={newItem.imageUrl}
onChange={(event) =>
setNewItem((current) => ({
...current,
imageUrl: event.target.value,
}))
}
placeholder="URL image"
className="rounded-full border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
/>

<textarea
value={newItem.description}
onChange={(event) =>
setNewItem((current) => ({
...current,
description: event.target.value,
}))
}
placeholder="Description"
rows={2}
className="rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 md:col-span-2"
/>

<label className="flex items-center gap-2 text-sm text-neutral-300">
<input
type="checkbox"
checked={newItem.isDailySpecial}
onChange={(event) =>
setNewItem((current) => ({
...current,
isDailySpecial: event.target.checked,
}))
}
/>
Plat du jour
</label>

<button
onClick={createItem}
className="rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
>
Ajouter le plat
</button>
</div>
</div>
</section>

<section className="mt-8 flex flex-wrap gap-2">
<button
onClick={() => setShowInactive((current) => !current)}
className={`rounded-full px-4 py-2 text-sm font-semibold ${
showInactive
? "bg-orange-500 text-white"
: "bg-neutral-800 text-neutral-300"
}`}
>
{showInactive ? "Masquer inactifs" : "Afficher inactifs"}
</button>

<button
onClick={() => setShowUnavailable((current) => !current)}
className={`rounded-full px-4 py-2 text-sm font-semibold ${
showUnavailable
? "bg-orange-500 text-white"
: "bg-neutral-800 text-neutral-300"
}`}
>
{showUnavailable
? "Masquer indisponibles"
: "Afficher indisponibles"}
</button>
</section>

<section className="mt-8 space-y-8">
{visibleCategories.map((category) => {
const items = menuItems
.filter((item) => item.categoryId === category.id)
.filter((item) => showInactive || item.active)
.filter((item) => showUnavailable || item.available)
.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

return (
<section
key={category.id}
className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5"
>
<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
<div>
<h2 className="text-2xl font-bold">{category.name}</h2>
<p className="mt-1 text-sm text-neutral-500">
{items.length} plat(s) affiché(s)
</p>
</div>

<div className="flex flex-wrap gap-2">
<button
onClick={() =>
updateCategory(category.id, {
order: category.order - 1,
})
}
className="rounded-full bg-neutral-800 px-3 py-2 text-sm text-white"
>
Monter
</button>

<button
onClick={() =>
updateCategory(category.id, {
order: category.order + 1,
})
}
className="rounded-full bg-neutral-800 px-3 py-2 text-sm text-white"
>
Descendre
</button>

<button
onClick={() =>
updateCategory(category.id, {
active: !category.active,
})
}
className="rounded-full bg-neutral-800 px-3 py-2 text-sm text-white"
>
{category.active ? "Désactiver" : "Activer"}
</button>
</div>
</div>

<div className="mt-5 space-y-3">
{items.length === 0 ? (
<p className="rounded-2xl bg-neutral-950 p-4 text-sm text-neutral-500">
Aucun plat dans cette catégorie.
</p>
) : (
items.map((item) => {
const draft = drafts[item.id];
const isSelected = selectedItemId === item.id;

return (
<article
key={item.id}
className="rounded-2xl bg-neutral-950 p-4"
>
<div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
<div className="flex gap-4">
{item.imageUrl ? (
<img
src={item.imageUrl}
alt={item.name}
className="h-20 w-20 rounded-2xl object-cover"
/>
) : (
<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-900 text-xs text-neutral-500">
Photo
</div>
)}

<div>
<div className="flex flex-wrap items-center gap-2">
<h3 className="text-lg font-bold">
{item.name}
</h3>

{item.isDailySpecial ? (
<span className="rounded-full bg-orange-500/20 px-2 py-1 text-xs font-semibold text-orange-300">
Plat du jour
</span>
) : null}

{!item.active ? (
<span className="rounded-full bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300">
Inactif
</span>
) : null}

{!item.available ? (
<span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-semibold text-yellow-300">
Indisponible
</span>
) : null}
</div>

<p className="mt-1 line-clamp-2 text-sm text-neutral-400">
{item.description}
</p>

<p className="mt-2 font-bold text-orange-400">
CHF {Number(item.price).toFixed(2)}
</p>
</div>
</div>

<div className="flex flex-wrap gap-2">
<button
onClick={() => moveItem(item, "up")}
className="rounded-full bg-neutral-800 px-3 py-2 text-sm text-white"
>
Monter
</button>

<button
onClick={() => moveItem(item, "down")}
className="rounded-full bg-neutral-800 px-3 py-2 text-sm text-white"
>
Descendre
</button>

<button
onClick={() =>
updateMenuItem(item.id, {
available: !item.available,
})
}
className="rounded-full bg-neutral-800 px-3 py-2 text-sm text-white"
>
{item.available
? "Indisponible"
: "Disponible"}
</button>

<button
onClick={() =>
updateMenuItem(item.id, {
active: !item.active,
})
}
className="rounded-full bg-neutral-800 px-3 py-2 text-sm text-white"
>
{item.active ? "Désactiver" : "Activer"}
</button>

<button
onClick={() =>
updateMenuItem(item.id, {
isDailySpecial:
!(item.isDailySpecial ?? false),
})
}
className="rounded-full bg-neutral-800 px-3 py-2 text-sm text-white"
>
{item.isDailySpecial
? "Retirer plat du jour"
: "Plat du jour"}
</button>

<button
onClick={() =>
setSelectedItemId(
isSelected ? null : item.id
)
}
className="rounded-full bg-orange-500 px-3 py-2 text-sm font-semibold text-white"
>
{isSelected ? "Fermer" : "Modifier"}
</button>
</div>
</div>

{isSelected ? (
<div className="mt-5 grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 md:grid-cols-2">
<div>
<label className="text-sm text-neutral-400">
Nom du plat
</label>
<input
value={draft?.name ?? ""}
onChange={(event) =>
updateDraft(item.id, {
name: event.target.value,
})
}
className="mt-2 w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
/>
</div>

<div>
<label className="text-sm text-neutral-400">
Catégorie
</label>
<select
value={draft?.categoryId ?? ""}
onChange={(event) =>
updateDraft(item.id, {
categoryId: event.target.value,
})
}
className="mt-2 w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
>
{categories.map((categoryOption) => (
<option
key={categoryOption.id}
value={categoryOption.id}
>
{categoryOption.name}
</option>
))}
</select>
</div>

<div>
<label className="text-sm text-neutral-400">
Prix
</label>
<input
value={draft?.price ?? ""}
onChange={(event) =>
updateDraft(item.id, {
price: event.target.value,
})
}
className="mt-2 w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
/>
</div>

<div>
<label className="text-sm text-neutral-400">
Ordre d’affichage
</label>
<input
value={draft?.order ?? ""}
onChange={(event) =>
updateDraft(item.id, {
order: event.target.value,
})
}
className="mt-2 w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
/>
</div>

<div className="md:col-span-2">
<label className="text-sm text-neutral-400">
Description
</label>
<textarea
value={draft?.description ?? ""}
onChange={(event) =>
updateDraft(item.id, {
description: event.target.value,
})
}
rows={3}
className="mt-2 w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
/>
</div>

<div className="md:col-span-2">
<label className="text-sm text-neutral-400">
URL de la photo
</label>
<input
value={draft?.imageUrl ?? ""}
onChange={(event) =>
updateDraft(item.id, {
imageUrl: event.target.value,
})
}
placeholder="https://..."
className="mt-2 w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
/>
</div>

<label className="flex items-center gap-2 text-sm text-neutral-300">
<input
type="checkbox"
checked={draft?.isDailySpecial ?? false}
onChange={(event) =>
updateDraft(item.id, {
isDailySpecial: event.target.checked,
})
}
/>
Plat du jour
</label>

<div className="flex justify-end gap-2 md:col-span-2">
<button
onClick={() => setSelectedItemId(null)}
className="rounded-full bg-neutral-800 px-4 py-3 text-sm font-semibold text-white"
>
Annuler
</button>

<button
onClick={() => saveItem(item)}
className="rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
>
Enregistrer les modifications
</button>
</div>
</div>
) : null}
</article>
);
})
)}
</div>
</section>
);
})}
</section>
</>
)}
</div>
</main>
);
}