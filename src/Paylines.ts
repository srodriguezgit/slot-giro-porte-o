export type RowIndex = 0 | 1 | 2;

export interface Payline {
  id: string;
  name: string;
  rows: readonly [RowIndex, RowIndex, RowIndex];
}

export const PAYLINES: readonly Payline[] = [
  {
    id: "top",
    name: "Superior",
    rows: [0, 0, 0],
  },
  {
    id: "middle",
    name: "Central",
    rows: [1, 1, 1],
  },
  {
    id: "bottom",
    name: "Inferior",
    rows: [2, 2, 2],
  },
  {
    id: "descending",
    name: "Diagonal descendente",
    rows: [0, 1, 2],
  },
  {
    id: "ascending",
    name: "Diagonal ascendente",
    rows: [2, 1, 0],
  },
  {
    id: "v",
    name: "V",
    rows: [0, 1, 0],
  },
  {
    id: "inverted-v",
    name: "V invertida",
    rows: [2, 1, 2],
  },
];