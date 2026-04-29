"use client";

import { use, useEffect, useMemo, useState } from "react";
import type { OrderStatus, RestaurantOrder } from "@/types/order";

type AdminOrder = RestaurantOrder & {
path: string;
tableToken?: string;
};
type TableRequest = {
id: string;
path: string;
tableToken: string;
tableLabel?: string;
type: "call_server" | "request_bill";
status: "new" | "done" | "cancelled";
createdAt: string;
updatedAt: string;
};





type OrderFilter = "active" | "served" | "cancelled" | "all";

const statusLabels: Record<OrderStatus, string> = {
new: "Nouvelle",
accepted: "Acceptée",
preparing: "En préparation",
ready: "Prête",
served: "Servie",
cancelled: "Annulée",
};

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
new: "accepted",
accepted: "preparing",
preparing: "ready",
ready: "served",
};

const filterLabels: Record<OrderFilter, string> = {
active: "À traiter",
served: "Terminées",
cancelled: "Annulées",
all: "Toutes",
};

const requestLabels: Record<TableRequest["type"], string> = {
call_server: "Appel serveur",
request_bill: "Demande d'addition",
};






function getStatusClass(status: OrderStatus) {
if (status === "new") return "bg-blue-500/15 text-blue-300";
if (status === "accepted") return "bg-yellow-500/15 text-yellow-300";
if (status === "preparing") return "bg-orange-500/15 text-orange-300";
if (status === "ready") return "bg-green-500/15 text-green-300";
if (status === "served") return "bg-neutral-500/15 text-neutral-300";
return "bg-red-500/15 text-red-300";
}

export default function AdminOrdersPage() {
const [orders, setOrders] = useState<AdminOrder[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [filter, setFilter] = useState<OrderFilter>("active");
const [requests, setRequests] = useState<TableRequest[]>([]);

async function loadOrders() {
try {
const response = await fetch("/api/orders", {
method: "GET",
cache: "no-store",
});

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(data.error || "Impossible de charger les commandes.");
}

setOrders(data.orders);
setError("");
} catch (error) {
console.error("Load orders error:", error);
setError(error instanceof Error ? error.message : String(error));
} finally {
setLoading(false);
}
}


async function loadRequests() {
try {
const response = await fetch("/api/requests", {
method: "GET",
cache: "no-store",
});

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(data.error || "Impossible de charger les demandes.");
}

setRequests(data.requests);
} catch (error) {
console.error("Load requests error:", error);
}
}



useEffect(() => {
loadOrders();
loadRequests();

const interval = window.setInterval(() => {
loadOrders();
loadRequests();
}, 2000);

return () => {
window.clearInterval(interval);
};
}, []);


const filteredOrders = useMemo(() => {
if (filter === "all") return orders;

if (filter === "active") {
return orders.filter(
(order) => order.status !== "served" && order.status !== "cancelled"
);
}

return orders.filter((order) => order.status === filter);
}, [orders, filter]);

const counts = useMemo(() => {
const active = orders.filter(
(order) => order.status !== "served" && order.status !== "cancelled"
).length;

const served = orders.filter((order) => order.status === "served").length;
const cancelled = orders.filter(
(order) => order.status === "cancelled"
).length;

return {
active,
served,
cancelled,
all: orders.length,
};
}, [orders]);
const activeRequests = useMemo(() => {
return requests.filter((request) => request.status === "new");
}, [requests]);
async function updateOrderStatus(order: AdminOrder, status: OrderStatus) {
try {
const response = await fetch("/api/orders", {
method: "PATCH",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
orderPath: order.path,
status,
}),
});

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(data.error || "Impossible de modifier la commande.");
}

await loadOrders();
} catch (error) {
console.error("Update order error:", error);
alert(error instanceof Error ? error.message : String(error));
}
}

async function updateRequestStatus(
request: TableRequest,
status: TableRequest["status"]
) {
try {
const response = await fetch("/api/requests", {
method: "PATCH",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
requestPath: request.path,
status,
}),
});

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(data.error || "Impossible de modifier la demande.");
}

await loadRequests();
} catch (error) {
console.error("Update request error:", error);
alert(error instanceof Error ? error.message : String(error));
}
}








return (
<main className="min-h-screen bg-neutral-950 p-6 text-white">
<div className="mx-auto max-w-6xl">
<header className="border-b border-neutral-800 pb-6">
<p className="text-sm uppercase tracking-[0.3em] text-orange-400">
Origens BBQ
</p>

<h1 className="mt-2 text-3xl font-bold">Commandes cuisine</h1>

<p className="mt-2 text-sm text-neutral-400">
Les commandes envoyées depuis les QR codes apparaissent ici.
</p>
</header>
<section className="mt-6">
<div className="flex items-center justify-between gap-4">
<h2 className="text-xl font-bold">Demandes de table</h2>

<p className="text-sm text-neutral-400">
{activeRequests.length} demande(s) active(s)
</p>
</div>

{activeRequests.length === 0 ? (
<p className="mt-3 rounded-2xl bg-neutral-900 p-4 text-sm text-neutral-400">
Aucune demande active.
</p>
) : (
<div className="mt-4 grid gap-3 md:grid-cols-2">
{activeRequests.map((request) => (
<article
key={request.id}
className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4"
>
<p className="text-sm text-orange-300">
{requestLabels[request.type]}
</p>

<h3 className="mt-1 text-xl font-bold">
Table : {request.tableLabel || request.tableToken}
</h3>

<p className="mt-2 text-sm text-neutral-400">
{request.createdAt
? new Date(request.createdAt).toLocaleString("fr-CH")
: ""}
</p>

<div className="mt-4 flex gap-2">
<button
onClick={() => updateRequestStatus(request, "done")}
className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
>
Marquer comme traitée
</button>

<button
onClick={() => updateRequestStatus(request, "cancelled")}
className="rounded-full bg-neutral-800 px-4 py-2 text-sm font-semibold text-white"
>
Annuler
</button>
</div>
</article>
))}
</div>
)}
</section>
<section className="mt-6 flex flex-wrap gap-2">
{(["active", "served", "cancelled", "all"] as OrderFilter[]).map(
(item) => (
<button
key={item}
onClick={() => setFilter(item)}
className={`rounded-full px-4 py-2 text-sm font-semibold ${
filter === item
? "bg-orange-500 text-white"
: "bg-neutral-900 text-neutral-300"
}`}
>
{filterLabels[item]} ({counts[item]})
</button>
)
)}
</section>

{error ? (
<div className="mt-6 rounded-xl border border-red-500 bg-red-950 p-4 text-sm text-red-200">
Erreur : {error}
</div>
) : null}

{loading ? (
<p className="mt-8 text-neutral-400">Chargement des commandes...</p>
) : filteredOrders.length === 0 ? (
<p className="mt-8 text-neutral-400">
Aucune commande dans cette catégorie.
</p>
) : (
<section className="mt-8 grid gap-4">
{filteredOrders.map((order) => {
const followingStatus = nextStatus[order.status];

return (
<article
key={order.id}
className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
>
<div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
<div>
<p className="text-sm text-neutral-500">
Commande #{order.id.slice(0, 6)}
</p>

<h2 className="mt-1 text-2xl font-bold">
Table :{" "}
{order.tableLabel ||
order.tableId ||
order.tableToken ||
"QR code"}
</h2>

<p
className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm ${getStatusClass(
order.status
)}`}
>
{statusLabels[order.status]}
</p>
</div>

<div className="text-left md:text-right">
<p className="text-2xl font-bold text-orange-400">
CHF {Number(order.total).toFixed(2)}
</p>

<p className="mt-1 text-sm text-neutral-500">
{order.createdAt
? new Date(order.createdAt).toLocaleString("fr-CH")
: ""}
</p>
</div>
</div>

<div className="mt-5 space-y-3">
{order.items.map((item, index) => (
<div
key={`${item.itemId}-${index}`}
className="rounded-xl bg-neutral-950 p-4"
>
<div className="flex justify-between gap-4">
<div>
<p className="font-semibold">
{item.quantity} × {item.nameSnapshot}
</p>

{item.notes ? (
<p className="mt-1 text-sm text-neutral-400">
Note : {item.notes}
</p>
) : null}
</div>

<p className="text-sm text-neutral-400">
CHF{" "}
{(
Number(item.priceSnapshot) * Number(item.quantity)
).toFixed(2)}
</p>
</div>
</div>
))}
</div>

<div className="mt-5 flex flex-wrap gap-2">
{followingStatus ? (
<button
onClick={() =>
updateOrderStatus(order, followingStatus)
}
className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
>
Passer à : {statusLabels[followingStatus]}
</button>
) : null}

{order.status !== "cancelled" &&
order.status !== "served" ? (
<button
onClick={() => updateOrderStatus(order, "cancelled")}
className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white"
>
Annuler
</button>
) : null}

{order.status === "cancelled" ? (
<button
onClick={() => updateOrderStatus(order, "new")}
className="rounded-full bg-neutral-700 px-4 py-2 text-sm font-semibold text-white"
>
Réactiver
</button>
) : null}
</div>
</article>
);
})}
</section>
)}
</div>
</main>
);
}