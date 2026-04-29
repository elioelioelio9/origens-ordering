export type MenuCategory = {
id: string;
name: string;
order: number;
active: boolean;
};

export type MenuItem = {
id: string;
categoryId: string;
name: string;
description: string;
price: number;
imageUrl?: string;
active: boolean;
available: boolean;
tags?: string[];
allergens?: string[];
};