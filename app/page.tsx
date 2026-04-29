import Link from "next/link";

export default function HomePage() {
return (
<main className="min-h-screen bg-neutral-950 p-6 text-white">
<div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center">
<p className="text-sm uppercase tracking-[0.3em] text-orange-400">
Origens BBQ
</p>

<h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
Commande QR code pour restaurant
</h1>

<p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
Les clients commandent depuis leur table, la cuisine reçoit les
commandes en temps réel, et l’équipe peut gérer les tables, additions
et demandes serveur.
</p>

<div className="mt-10 grid gap-4 md:grid-cols-2">
<Link
href="/table/table-1"
className="rounded-3xl border border-orange-500 bg-orange-500 p-6 text-white transition hover:bg-orange-600"
>
<p className="text-sm uppercase tracking-[0.2em] opacity-80">
Démo client
</p>
<h2 className="mt-2 text-2xl font-bold">Commander — Table 1</h2>
<p className="mt-3 text-sm opacity-90">
Tester le parcours client sur téléphone ou ordinateur.
</p>
</Link>

<Link
href="/admin"
className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-orange-500"
>
<p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
Restaurant
</p>
<h2 className="mt-2 text-2xl font-bold">Interface admin</h2>
<p className="mt-3 text-sm text-neutral-400">
Voir les commandes, demandes, tables et QR codes.
</p>
</Link>
</div>

<div className="mt-10 rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
<p className="text-sm font-semibold text-neutral-300">
Fonctions déjà disponibles
</p>

<div className="mt-4 grid gap-3 text-sm text-neutral-400 md:grid-cols-2">
<p>• Commande depuis QR code ou tablette</p>
<p>• Panier et historique de table</p>
<p>• Annulation client avant acceptation</p>
<p>• Interface cuisine avec statuts</p>
<p>• Appel serveur et demande d’addition</p>
<p>• Vue tables, additions et reset de table</p>
</div>
</div>
</div>
</main>
);
}