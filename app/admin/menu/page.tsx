export default function AdminMenuPage() {
return (
<main className="min-h-screen bg-neutral-950 p-6 text-white">
<div className="mx-auto max-w-5xl">
<p className="text-sm uppercase tracking-[0.3em] text-orange-400">
Origens BBQ
</p>

<h1 className="mt-2 text-3xl font-bold">Gestion du menu</h1>

<p className="mt-4 text-neutral-400">
Cette page permettra bientôt de modifier les plats, les prix, les
photos et les disponibilités.
</p>

<div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
<p className="font-semibold">À venir</p>

<ul className="mt-3 list-inside list-disc space-y-2 text-sm text-neutral-400">
<li>Activer ou désactiver un plat</li>
<li>Modifier les prix</li>
<li>Modifier les descriptions</li>
<li>Ajouter les photos des plats</li>
<li>Créer le menu du jour</li>
</ul>
</div>
</div>
</main>
);
}