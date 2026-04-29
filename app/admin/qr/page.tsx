"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG} from "qrcode.react";
import { restaurantTables } from "@/lib/data/tables";

export default function AdminQrPage() {
const [baseUrl, setBaseUrl] = useState("");

useEffect(() => {
setBaseUrl(window.location.origin);
}, []);
async function copyToClipboard(url: string) {
try {
await navigator.clipboard.writeText(url);
alert("Lien copié.");
} catch {
alert("Impossible de copier le lien.");
}
}

return (
<main className="min-h-screen bg-neutral-950 p-6 text-white">
<div className="mx-auto max-w-6xl">
<header className="border-b border-neutral-800 pb-6">
<p className="text-sm uppercase tracking-[0.3em] text-orange-400">
Origens BBQ
</p>

<h1 className="mt-2 text-3xl font-bold">QR codes & liens tables</h1>

<p className="mt-2 text-sm text-neutral-400">
Liens clients à associer aux QR codes ou aux tablettes de chaque table.
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
</div>
</header>

<section className="mt-8 grid gap-4 md:grid-cols-2">
{restaurantTables.map((table) => {
const url = `${baseUrl}/table/${table.token}`;

return (
<article
key={table.token}
className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5"
>
<p className="text-sm text-neutral-500">Table</p>

<h2 className="mt-1 text-2xl font-bold">{table.label}</h2>

{baseUrl ? (
<div className="mt-5 inline-flex rounded-3xl bg-white p-4">
<QRCodeSVG value={url} size={180} level="H" />
</div>
) : null}

<p className="mt-4 break-all rounded-2xl bg-neutral-950 p-4 text-sm text-neutral-300">
{baseUrl ? url : "Chargement du lien..."}
</p>
<div className="mt-5 flex flex-wrap gap-2">
<button
onClick={() => copyToClipboard(url)}
className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
>
Copier le lien
</button>

<Link
href={`/table/${table.token}`}
className="rounded-full bg-neutral-800 px-4 py-2 text-sm font-semibold text-white"
>
Ouvrir
</Link>
</div>
</article>
);
})}
</section>
</div>
</main>
);
}