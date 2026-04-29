"use client";

import { use, useMemo, useState } from "react";
import { categories, menuItems } from "@/lib/data/mock-menu";
import type { CartItem } from "@/types/order";

type Props = {
params: Promise<{
token: string;
}>;
};

export default function TableOrderPage({ params }: Props) {
const { token } = use(params);
const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id);
const [cart, setCart] = useState<CartItem[]>([]);

const visibleItems = useMemo(() => {
return menuItems.filter(
(item) =>
item.active &&
item.available &&
item.categoryId === activeCategoryId
);
}, [activeCategoryId]);

const total = cart.reduce((sum, item) => {
return sum + item.price * item.quantity;
}, 0);

function addToCart(itemId: string) {
const item = menuItems.find((menuItem) => menuItem.id === itemId);
if (!item) return;

setCart((current) => {
const existing = current.find((cartItem) => cartItem.itemId === item.id);

if (existing) {
return current.map((cartItem) =>
cartItem.itemId === item.id
? { ...cartItem, quantity: cartItem.quantity + 1 }
: cartItem
);
}

return [
...current,
{
itemId: item.id,
name: item.name,
price: item.price,
quantity: 1,
},
];
});
}

function removeFromCart(itemId: string) {
setCart((current) =>
current
.map((item) =>
item.itemId === itemId
? { ...item, quantity: item.quantity - 1 }
: item
)
.filter((item) => item.quantity > 0)
);
}

async function submitOrder() {
if (cart.length === 0) return;

const response = await fetch("/api/orders", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
tableToken: token,
items: cart,
}),
});

if (!response.ok) {
alert("Erreur lors de l’envoi de la commande.");
return;
}

setCart([]);
alert("Commande envoyée en cuisine.");
}

return (
<main className="min-h-screen bg-neutral-950 text-white">
<section className="mx-auto max-w-5xl px-4 py-6">
<p className="text-sm uppercase tracking-[0.3em] text-orange-400">
Origens BBQ
</p>

<h1 className="mt-2 text-3xl font-bold">Commander à table</h1>

<p className="mt-2 text-sm text-neutral-400">
Table sécurisée : {token}
</p>

<div className="mt-6 flex gap-2 overflow-x-auto">
{categories
.filter((category) => category.active)
.sort((a, b) => a.order - b.order)
.map((category) => (
<button
key={category.id}
onClick={() => setActiveCategoryId(category.id)}
className={`rounded-full px-4 py-2 text-sm ${
activeCategoryId === category.id
? "bg-orange-500 text-white"
: "bg-neutral-800 text-neutral-300"
}`}
>
{category.name}
</button>
))}
</div>

<div className="mt-8 grid gap-4 md:grid-cols-2">
{visibleItems.map((item) => (
<article
key={item.id}
className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4"
>
<h2 className="text-xl font-semibold">{item.name}</h2>

<p className="mt-2 text-sm text-neutral-400">
{item.description}
</p>

<div className="mt-4 flex items-center justify-between">
<p className="font-bold text-orange-400">
CHF {item.price.toFixed(2)}
</p>

<button
onClick={() => addToCart(item.id)}
className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
>
Ajouter
</button>
</div>
</article>
))}
</div>
</section>

<section className="sticky bottom-0 border-t border-neutral-800 bg-neutral-950 p-4">
<div className="mx-auto max-w-5xl">
<h2 className="font-semibold">Panier</h2>

{cart.length === 0 ? (
<p className="mt-2 text-sm text-neutral-400">
Aucun article ajouté.
</p>
) : (
<div className="mt-3 space-y-2">
{cart.map((item) => (
<div
key={item.itemId}
className="flex items-center justify-between text-sm"
>
<div>
<p>{item.name}</p>
<p className="text-neutral-500">
{item.quantity} × CHF {item.price.toFixed(2)}
</p>
</div>

<div className="flex items-center gap-2">
<button
onClick={() => removeFromCart(item.itemId)}
className="rounded bg-neutral-800 px-3 py-1"
>
-
</button>

<button
onClick={() => addToCart(item.itemId)}
className="rounded bg-neutral-800 px-3 py-1"
>
+
</button>
</div>
</div>
))}
</div>
)}

<div className="mt-4 flex items-center justify-between">
<p className="text-lg font-bold">Total : CHF {total.toFixed(2)}</p>

<button
onClick={submitOrder}
disabled={cart.length === 0}
className="rounded-full bg-orange-500 px-5 py-3 font-semibold disabled:opacity-40"
>
Envoyer en cuisine
</button>
</div>
</div>
</section>
</main>
);
}