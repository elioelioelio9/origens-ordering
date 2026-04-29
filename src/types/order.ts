export type OrderStatus =
| "new"
| "accepted"
| "preparing"
| "ready"
| "served"
| "cancelled";

export type OrderType = "dine_in" | "takeaway";

export type CartItem = {
itemId: string;
name: string;
price: number;
quantity: number;
notes?: string;
};

export type OrderItem = {
itemId: string;
nameSnapshot: string;
priceSnapshot: number;
quantity: number;
notes?: string;
};

export type RestaurantOrder = {
id: string;
restaurantId: string;
type: OrderType;
tableId?: string;
tableLabel?: string;
status: OrderStatus;
items: OrderItem[];
total: number;
customerNote?: string;
createdAt: string;
updatedAt: string;
};
