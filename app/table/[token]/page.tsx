"use client";

import { use, useEffect, useMemo, useState } from "react";
import { categories, menuItems } from "@/lib/data/mock-menu";
import type { CartItem, OrderStatus } from "@/types/order";

type Props = {
params: Promise<{
token: string;
}>;
};

type TableOrderItem = {
itemId: string;
nameSnapshot: string;
priceSnapshot: number;
quantity: number;
notes?: string;
};

type TableOrder = {
id: string;
path: string;
status: OrderStatus;
createdAt: string;
total: number;
items: TableOrderItem[];
};

const statusLabels: Record<OrderStatus, string> = {
new: "Envoyée",
accepted: "Acceptée",
preparing: "En préparation",
ready: "Prête",
served: "Servie",
cancelled: "Annulée",
};

function getStatusClass(status: OrderStatus) {
if (status === "new") return "bg-blue-500/15 text-blue-300";
if (status === "accepted") return "bg-yellow-500/15 text-yellow-300";
if (status === "preparing") return "bg-orange-500/15 text-orange-300";
if (status === "ready") return "bg-green-500/15 text-green-300";
if (status === "served") return "bg-neutral-500/15 text-neutral-300";
return "bg-red-500/15 text-red-300";
}

export default function TableOrderPage({ params }: Props) {
const { token } = use(params);

const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id);
const [cart, setCart] = useState<CartItem[]>([]);
const [tableOrders, setTableOrders] = useState<TableOrder[]>([]);
const [isSubmitting, setIsSubmitting] = useState(false);
const [lastOrderId, setLastOrderId] = useState<string | null>(null);

const visibleItems = useMemo(() => {
return menuItems.filter(
(item) =>
item.active &&
item.available &&
item.categoryId === activeCategoryId
);
}, [activeCategoryId]);

const cartTotal = cart.reduce((sum, item) => {
return sum + item.price * item.quantity;
}, 0);

const sessionTotal = tableOrders
.filter((order) => order.status !== "cancelled")
.reduce((sum, order) => {
return sum + order.total;
}, 0);

const totalItemsInCart = cart.reduce((sum, item) => {
return sum + item.quantity;
}, 0);

async function loadTableOrders() {
try {
const response = await fetch(
`/api/orders?tableToken=${encodeURIComponent(token)}`,
{
method: "GET",
cache: "no-store",
}
);

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(data.error || "Impossible de charger vos commandes.");
}

setTableOrders(data.orders);
} catch (error) {
console.error("Load table orders error:", error);
}
}

useEffect(() => {
loadTableOrders();

const interval = window.setInterval(() => {
loadTableOrders();
}, 2000);

return () => {
window.clearInterval(interval);
};
}, [token]);

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

function clearCart() {
setCart([]);
}

async function submitOrder() {
if (cart.length === 0 || isSubmitting) return;

setIsSubmitting(true);

try {
const orderItems = [...cart];

const response = await fetch("/api/orders", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
tableToken: token,
items: orderItems,
}),
});

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(data.error || "Erreur lors de l’envoi de la commande.");
}

setLastOrderId(data.orderId);
setCart([]);
await loadTableOrders();
} catch (error) {
alert(error instanceof Error ? error.message : String(error));
} finally {
setIsSubmitting(false);
}
}

async function cancelOrder(order: TableOrder) {
if (order.status !== "new") return;

const confirmed = window.confirm(
"Annuler cette commande ? Vous pouvez l’annuler uniquement tant qu’elle n’a pas été acceptée."
);

if (!confirmed) return;

try {
const response = await fetch("/api/orders", {
method: "PATCH",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
orderPath: order.path,
status: "cancelled",
}),
});

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(data.error || "Impossible d’annuler la commande.");
}

await loadTableOrders();
} catch (error) {
alert(error instanceof Error ? error.message : String(error));
}
}

function callServer() {
alert("Votre demande a été envoyée au serveur.");
}

function requestBill() {
alert("Votre demande d’addition a été envoyée.");
}

return (
<main className="min-h-screen bg-neutral-950 pb-40 text-white">
<section className="mx-auto max-w-5xl px-4 py-6">
<div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
<p className="text-sm uppercase tracking-[0.3em] text-orange-400">
Origens BBQ
</p>

<h1 className="mt-2 text-3xl font-bold">Commander à table</h1>

<p className="mt-2 text-sm text-neutral-400">
Table : <span className="text-neutral-200">{token}</span>
</p>

<div className="mt-5 grid gap-3 sm:grid-cols-3">
<button
onClick={callServer}
className="rounded-2xl bg-neutral-800 px-4 py-3 text-sm font-semibold text-neutral-100"
>
Appeler le serveur
</button>

<button
onClick={requestBill}
className="rounded-2xl bg-neutral-800 px-4 py-3 text-sm font-semibold text-neutral-100"
>
Demander l’addition
</button>

<div className="rounded-2xl bg-orange-500/10 px-4 py-3">
<p className="text-xs text-orange-300">Total commandé</p>
<p className="text-lg font-bold text-orange-300">
CHF {sessionTotal.toFixed(2)}
</p>
</div>
</div>
</div>

{lastOrderId ? (
<div className="mt-5 rounded-3xl border border-green-500/30 bg-green-500/10 p-5">
<p className="text-sm font-semibold text-green-300">
Commande envoyée en cuisine
</p>

<p className="mt-1 text-sm text-neutral-300">
Numéro de commande : #{lastOrderId.slice(0, 6)}
</p>

<button
onClick={() => setLastOrderId(null)}
className="mt-4 rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white"
>
Nouvelle commande
</button>
</div>
) : null}

<div className="mt-6 flex gap-2 overflow-x-auto pb-2">
{categories
.filter((category) => category.active)
.sort((a, b) => a.order - b.order)
.map((category) => (
<button
key={category.id}
onClick={() => setActiveCategoryId(category.id)}
className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
activeCategoryId === category.id
? "bg-orange-500 text-white"
: "bg-neutral-800 text-neutral-300"
}`}
>
{category.name}
</button>
))}
</div>

<div className="mt-6 grid gap-4 md:grid-cols-2">
{visibleItems.map((item) => (
<article
key={item.id}
className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5"
>
<div className="flex min-h-40 flex-col justify-between">
<div>
<h2 className="text-xl font-semibold">{item.name}</h2>

<p className="mt-2 text-sm leading-6 text-neutral-400">
{item.description}
</p>
</div>

<div className="mt-5 flex items-center justify-between">
<p className="text-lg font-bold text-orange-400">
CHF {item.price.toFixed(2)}
</p>

<button
onClick={() => addToCart(item.id)}
className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
>
Ajouter
</button>
</div>
</div>
</article>
))}
</div>

<section className="mt-8">
<h2 className="text-2xl font-bold">Vos commandes</h2>

{tableOrders.length === 0 ? (
<p className="mt-3 rounded-2xl bg-neutral-900 p-4 text-sm text-neutral-400">
Aucune commande envoyée pour le moment.
</p>
) : (
<div className="mt-4 space-y-4">
{tableOrders.map((order) => (
<article
key={order.id}
className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5"
>
<div className="flex items-start justify-between gap-4">
<div>
<p className="text-sm text-neutral-500">
Commande #{order.id.slice(0, 6)}
</p>

<p
className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm ${getStatusClass(
order.status
)}`}
>
{statusLabels[order.status]}
</p>

<p className="mt-2 text-sm text-neutral-400">
{order.createdAt
? new Date(order.createdAt).toLocaleString("fr-CH")
: ""}
</p>
</div>

<p className="font-bold text-orange-400">
CHF {Number(order.total).toFixed(2)}
</p>
</div>

<div className="mt-4 space-y-2">
{order.items.map((item) => (
<div
key={item.itemId}
className="flex justify-between gap-4 text-sm"
>
<p>
{item.quantity} × {item.nameSnapshot}
</p>

<p className="text-neutral-400">
CHF{" "}
{(
Number(item.priceSnapshot) * Number(item.quantity)
).toFixed(2)}
</p>
</div>
))}
</div>

{order.status === "new" ? (
<button
onClick={() => cancelOrder(order)}
className="mt-4 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white"
>
Annuler cette commande
</button>
) : (
<p className="mt-4 text-xs text-neutral-500">
Cette commande ne peut plus être annulée.
</p>
)}
</article>
))}
</div>
)}
</section>
</section>

<section className="fixed bottom-0 left-0 right-0 border-t border-neutral-800 bg-neutral-950/95 p-4 backdrop-blur">
<div className="mx-auto max-w-5xl">
<div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4">
<div className="flex items-center justify-between gap-4">
<div>
<h2 className="font-semibold">Panier</h2>
<p className="text-sm text-neutral-400">
{totalItemsInCart} article(s)
</p>
</div>

<p className="text-lg font-bold text-orange-400">
CHF {cartTotal.toFixed(2)}
</p>
</div>

{cart.length === 0 ? (
<p className="mt-3 text-sm text-neutral-500">
Aucun article ajouté.
</p>
) : (
<div className="mt-4 max-h-48 space-y-3 overflow-y-auto pr-1">
{cart.map((item) => (
<div
key={item.itemId}
className="flex items-center justify-between gap-4 text-sm"
>
<div>
<p className="font-medium">{item.name}</p>
<p className="text-neutral-500">
{item.quantity} × CHF {item.price.toFixed(2)}
</p>
</div>

<div className="flex items-center gap-2">
<button
onClick={() => removeFromCart(item.itemId)}
className="rounded-full bg-neutral-800 px-3 py-1"
>
-
</button>

<button
onClick={() => addToCart(item.itemId)}
className="rounded-full bg-neutral-800 px-3 py-1"
>
+
</button>
</div>
</div>
))}
</div>
)}

<div className="mt-4 flex gap-2">
<button
onClick={clearCart}
disabled={cart.length === 0 || isSubmitting}
className="rounded-full bg-neutral-800 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
>
Vider
</button>

<button
onClick={submitOrder}
disabled={cart.length === 0 || isSubmitting}
className="flex-1 rounded-full bg-orange-500 px-5 py-3 font-semibold text-white disabled:opacity-40"
>
{isSubmitting ? "Envoi..." : "Envoyer en cuisine"}
</button>
</div>
</div>
</div>
</section>
</main>
);
}