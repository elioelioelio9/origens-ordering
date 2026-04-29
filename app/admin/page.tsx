import Link from "next/link";

export default function AdminHomePage() {
return (
<main className="min-h-screen bg-neutral-950 p-6 text-white">
<div className="mx-auto max-w-5xl">
<p className="text-sm uppercase tracking-[0.3em] text-orange-400">
Origens BBQ
</p>

<h1 className="mt-2 text-3xl font-bold">Interface restaurant</h1>

<p className="mt-4 text-neutral-400">
Gérez les commandes, les tables et le menu du restaurant.
</p>

<div className="mt-8 grid gap-4 md:grid-cols-2">
<Link
href="/admin/orders"
className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-orange-500"
>
<h2 className="text-xl font-bold">Commandes cuisine</h2>
<p className="mt-2 text-sm text-neutral-400">
Voir les commandes QR code et gérer leur statut.
</p>
</Link>
<Link
href="/admin/tables"
className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-orange-500"
>
<h2 className="text-xl font-bold">Tables & additions</h2>
<p className="mt-2 text-sm text-neutral-400">
Voir les totaux par table, les commandes et les demandes actives.
</p>
</Link>
<Link
href="/admin/menu"
className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-orange-500"
>
<h2 className="text-xl font-bold">Gestion du menu</h2>
<p className="mt-2 text-sm text-neutral-400">
Modifier les plats, prix, descriptions et disponibilités.
</p>
</Link>
</div>
</div>
</main>
);
}