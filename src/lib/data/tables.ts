export type RestaurantTableConfig = {
token: string;
label: string;
};

export const restaurantTables: RestaurantTableConfig[] = [
{
token: "table-1",
label: "Table 1",
},
{
token: "table-2",
label: "Table 2",
},
{
token: "table-3",
label: "Table 3",
},
{
token: "table-4",
label: "Table 4",
},
{
token: "table-5",
label: "Table 5",
},
{
token: "table-6",
label: "Table 6",
},
];

export function getTableLabelFromToken(token: string) {
const table = restaurantTables.find((item) => item.token === token);

return table?.label ?? token;
}
