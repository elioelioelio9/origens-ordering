import type { MenuCategory, MenuItem } from "@/types/menu";

export const categories: MenuCategory[] = [
{
id: "hamburgerie",
name: "Hamburgerie",
order: 1,
active: true,
},
{
id: "grillades",
name: "Grillades",
order: 2,
active: true,
},
{
id: "accompagnements",
name: "Accompagnements",
order: 3,
active: true,
},
{
id: "sauces",
name: "Sauces Origens",
order: 4,
active: true,
},
];

export const menuItems: MenuItem[] = [
{
id: "x-costela",
categoryId: "hamburgerie",
name: "X-Costela",
description:
"Pain, mayonnaise verte, côtes de bœuf fumées et émincées, american cheese et vinaigrette Origens.",
price: 25.9,
active: true,
available: true,
},
{
id: "x-barbecue",
categoryId: "hamburgerie",
name: "X-Barbecue",
description:
"Pain, mayonnaise blanche, ancho grillé, american cheese et vinaigrette Origens.",
price: 26.9,
active: true,
available: true,
},
{
id: "double-smash",
categoryId: "hamburgerie",
name: "Double Smash",
description:
"Pain, mayonnaise blanche, double viande, cheddar, american cheese, oignon caramélisé et bacon.",
price: 24.9,
active: true,
available: true,
},
{
id: "combo-2",
categoryId: "grillades",
name: "Combo pour 2 personnes",
description:
"Sélection de coupes de bœuf et de porc fumés, mini burgers, toscanes, ailes de poulet, frites et riz aux côtes.",
price: 97.9,
active: true,
available: true,
},
{
id: "frites",
categoryId: "accompagnements",
name: "Frites traditionnelles",
description: "Frites traditionnelles.",
price: 5.9,
active: true,
available: true,
},
{
id: "chimichurri",
categoryId: "sauces",
name: "Chimichurri",
description:
"Sauce maison avec herbes aromatiques, huile, sel, vinaigre et huile d’olive.",
price: 2.9,
active: true,
available: true,
},
];
