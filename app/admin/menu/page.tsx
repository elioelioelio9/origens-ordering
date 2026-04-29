"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MenuCategory, MenuItem } from "@/types/menu";

export default function AdminMenuPage() {
const [categories, setCategories] = useState<MenuCategory[]>([]);
const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

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

setCategories(data.categories);
setMenuItems(data.items);
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
"Envoyer le menu actuel dans Firestore ?"
);

if (!confirmed) return;

try {
const response = await fetch("/api/menu", {
method: "POST",
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
active?: boolean;
available?: boolean;
price?: number;
}
) {
try {
const response = await fetch("/api/menu", {
method: "PATCH",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
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

useEffect(() => {
loadMenu();
}, []);

const activeItems = menuItems.filter((item) => item.active).length;
const unavailableItems = menuItems.filter((item) => !item.available).length;

return (
<main className="min-h-screen bg-neutral-950 p-6 text-white">
<div className="mx-auto max-w-6xl">
<header className="border-b border-neutral-800 pb-6">
<p className="text-sm uppercase tracking-[0.3em] text-orange-400">
Origens BBQ
</p>

<h1 className="mt-2 text-3xl font-bold">Gestion du menu</h1>

<p className="mt-2 text-sm text-neutral-400">
Gérez les plats, les prix et les disponibilités du menu.
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
<section className="mt-8 grid gap-4 md:grid-cols-3">
<div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
<p className="text-sm text-neutral-500">Catégories</p>
<p className="mt-2 text-3xl font-bold text-orange-400">
{categories.length}
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

<section className="mt-8 space-y-8">
{categories
.filter((category) => category.active)
.sort((a, b) => a.order - b.order)
.map((category) => {
const items = menuItems.filter(
(item) => item.categoryId === category.id
);

return (
<section key={category.id}>
<div className="mb-4 flex items-center justify-between gap-4">
<h2 className="text-2xl font-bold">{category.name}</h2>

<p className="text-sm text-neutral-500">
{items.length} plat(s)
</p>
</div>

<div className="grid gap-4 md:grid-cols-2">
{items.map((item) => (
<article
key={item.id}
className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5"
>
<div className="flex items-start justify-between gap-4">
<div>
<h3 className="text-xl font-bold">
{item.name}
</h3>

<p className="mt-2 text-sm leading-6 text-neutral-400">
{item.description}
</p>
</div>

<p className="shrink-0 font-bold text-orange-400">
CHF {Number(item.price).toFixed(2)}
</p>
</div>

<div className="mt-4 flex flex-wrap gap-2">
<span
className={`rounded-full px-3 py-1 text-xs font-semibold ${
item.active
? "bg-green-500/15 text-green-300"
: "bg-red-500/15 text-red-300"
}`}
>
{item.active ? "Actif" : "Inactif"}
</span>

<span
className={`rounded-full px-3 py-1 text-xs font-semibold ${
item.available
? "bg-green-500/15 text-green-300"
: "bg-yellow-500/15 text-yellow-300"
}`}
>
{item.available
? "Disponible"
: "Indisponible"}
</span>
</div>
<div className="mt-4 flex flex-wrap gap-2">
<button
onClick={() =>
updateMenuItem(item.id, {
available: !item.available,
})
}
className="rounded-full bg-neutral-800 px-4 py-2 text-sm font-semibold text-white"
>
{item.available ? "Marquer indisponible" : "Marquer disponible"}
</button>

<button
onClick={() =>
updateMenuItem(item.id, {
active: !item.active,
})
}
className="rounded-full bg-neutral-800 px-4 py-2 text-sm font-semibold text-white"
>
{item.active ? "Désactiver" : "Activer"}
</button>
</div>








</article>
))}
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