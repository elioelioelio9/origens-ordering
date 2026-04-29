export type Restaurant = {
id: string;
name: string;
slug: string;
currency: "CHF";
isOpen: boolean;
};

export type RestaurantTable = {
id: string;
label: string;
token: string;
active: boolean;
};
