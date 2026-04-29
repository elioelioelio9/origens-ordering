"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { OrderStatus, RestaurantOrder } from "@/types/order";

type AdminOrder = RestaurantOrder & {
path: string;
tableToken?: string;
};

type TableRequest = {
id: string;
path: string;
tableToken: string;
type: "call_server" | "request_bill";
status: "new" | "done" | "cancelled";
createdAt: string;
updatedAt: string;
};

type TableSummary = {
tableToken: string;
orders: AdminOrder[];
requests: TableRequest[];
total: number;
activeOrdersCount: number;
};

const statusLabels: Record<OrderStatus, string> = {
new: "Nouvelle",
accepted: "Acceptée",
preparing: "En préparation",
ready: "Prête",
served: "Servie",
cancelled: "Annulée",
};

const requestLabels: Record<TableRequest["type"], string> = {
call_server: "Appel serveur",
request_bill: "Demande d’addition",
};

export default function AdminTablesPage() {
const [orders, setOrders] = useState<AdminOrder[]>([]);
const [requests, setRequests] = useState<TableRequest[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

async function loadData() {
try {
const [ordersResponse, requestsResponse] = await Promise.all([
fetch("/api/orders", {
method: "GET",
cache: "no-store",
}),
fetch("/api/requests", {
method: "GET",
cache: "no-store",
}),
]);

const ordersData = await ordersResponse.json();
const requestsData = await requestsResponse.json();

if (!ordersResponse.ok || !ordersData.ok) {
throw new Error(ordersData.error || "Impossible de charger les commandes.");
}

if (!requestsResponse.ok || !requestsData.ok) {
throw new Error(requestsData.error || "Impossible de charger les demandes.");
}

setOrders(ordersData.orders);
setRequests(requestsData.requests);
setError("");
} catch (error) {
console.error("Load tables error:", error);
setError(error instanceof Error ? error.message : String(error));
} finally {
setLoading(false);
}
}

useEffect(() => {
loadData();

const interval = window.setInterval(() => {
loadData();
}, 2000);

return () => {
window.clearInterval(interval);
};
}, []);

const tableSummaries = useMemo(() => {
const map = new Map<string, TableSummary>();

for (const order of orders) {
const tableToken =
order.tableLabel || order.tableId || order.tableToken || "Table inconnue";

if (!map.has(tableToken)) {
map.set(tableToken, {
tableToken,
orders: [],
requests: [],
total: 0,
activeOrdersCount: 0,
});
}

const summary = map.get(tableToken);
if (!summary) continue;

summary.orders.push(order);

if (order.status !== "cancelled") {
summary.total += Number(order.total);
}

if (order.status !== "served" && order.status !== "cancelled") {
summary.activeOrdersCount += 1;
}
}

for (const request of requests) {
const tableToken = request.tableToken || "Table inconnue";

if (!map.has(tableToken)) {
map.set(tableToken, {
tableToken,
orders: [],
requests: [],
total: 0,
activeOrdersCount: 0,
});
}

const summary = map.get(tableToken);
if (!summary) continue;

if (request.status === "new") {
summary.requests.push(request);
}
}

return Array.from(map.values()).sort((a, b) =>
a.tableToken.localeCompare(b.tableToken)
);
}, [orders, requests]);

return (
<main className="min-h-screen bg-neutral-950 p-6 text-white">
<div className="mx-auto max-w-6xl">
<header className="border-b border-neutral-800 pb-6">
<p className="text-sm uppercase tracking-[0.3em] text-orange-400">
Origens BBQ
</p>

<h1 className="mt-2 text-3xl font-bold">Tables & additions</h1>

<p className="mt-2 text-sm text-neutral-400">
Vue par table des commandes, totaux et demandes actives.
</p>

<div className="mt-5 flex flex-wrap gap-2">
<Link
href="/admin/orders"
className="rounded-full bg-neutral-800 px-4 py-2 text-sm font-semibold text-white"
>
Commandes cuisine
</Link>

<Link
href="/admin"
className="rounded-full bg-neutral-800 px-4 py-2 text-sm font-semibold text-white"
>
Accueil admin
</Link>
</div>
</header>

{error ? (
<div className="mt-6 rounded-xl border border-red-500 bg-red-950 p-4 text-sm text-red-200">
Erreur : {error}
</div>
) : null}

{loading ? (
<p className="mt-8 text-neutral-400">Chargement des tables...</p>
) : tableSummaries.length === 0 ? (
<p className="mt-8 rounded-2xl bg-neutral-900 p-4 text-sm text-neutral-400">
Aucune table active pour le moment.
</p>
) : (
<section className="mt-8 grid gap-4 md:grid-cols-2">
{tableSummaries.map((table) => (
<article
key={table.tableToken}
className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5"
>
<div className="flex items-start justify-between gap-4">
<div>
<p className="text-sm text-neutral-500">Table</p>
<h2 className="mt-1 text-2xl font-bold">
{table.tableToken}
</h2>
</div>

<div className="text-right">
<p className="text-sm text-neutral-500">Total</p>
<p className="text-2xl font-bold text-orange-400">
CHF {table.total.toFixed(2)}
</p>
</div>
</div>

<div className="mt-5 grid gap-3 sm:grid-cols-2">
<div className="rounded-2xl bg-neutral-950 p-4">
<p className="text-sm text-neutral-500">
Commandes actives
</p>
<p className="mt-1 text-xl font-bold">
{table.activeOrdersCount}
</p>
</div>

<div className="rounded-2xl bg-neutral-950 p-4">
<p className="text-sm text-neutral-500">
Demandes actives
</p>
<p className="mt-1 text-xl font-bold">
{table.requests.length}
</p>
</div>
</div>

{table.requests.length > 0 ? (
<div className="mt-5 space-y-2">
<p className="text-sm font-semibold text-orange-300">
Demandes
</p>

{table.requests.map((request) => (
<div
key={request.id}
className="rounded-xl bg-orange-500/10 p-3 text-sm text-orange-200"
>
{requestLabels[request.type]}
</div>
))}
</div>
) : null}

<div className="mt-5 space-y-3">
<p className="text-sm font-semibold text-neutral-300">
Commandes
</p>

{table.orders.length === 0 ? (
<p className="rounded-xl bg-neutral-950 p-3 text-sm text-neutral-500">
Aucune commande.
</p>
) : (
table.orders.map((order) => (
<div
key={order.id}
className="rounded-xl bg-neutral-950 p-3"
>
<div className="flex justify-between gap-4 text-sm">
<p className="font-semibold">
#{order.id.slice(0, 6)} · {statusLabels[order.status]}
</p>

<p className="text-orange-400">
CHF {Number(order.total).toFixed(2)}
</p>
</div>

<div className="mt-2 space-y-1">
{order.items.map((item, index) => (
<p
key={`${item.itemId}-${index}`}
className="text-sm text-neutral-400"
>
{item.quantity} × {item.nameSnapshot}
</p>
))}
</div>
</div>
))
)}
</div>
</article>
))}
</section>
)}
</div>
</main>
);
}