//declaramos los tipos de simbolos posibles
export type SlotSymbol = "EMPANADA" | "MATE" | "CHORIPAN" | "PARRILLA" | "OBELISCO";

export interface SpinResult {
  // Cada elemento contiene un rodillo: arriba, centro y abajo.
  columns: SlotSymbol[][];
  stops: number[];
}

export class SlotEngine {
  private readonly reels: SlotSymbol[][] = [
    ["EMPANADA", "MATE", "CHORIPAN", "EMPANADA", "PARRILLA", "MATE", "OBELISCO"],
    ["MATE", "EMPANADA", "PARRILLA", "CHORIPAN", "MATE", "OBELISCO", "EMPANADA"],
    ["CHORIPAN", "MATE", "EMPANADA", "OBELISCO", "EMPANADA", "MATE", "PARRILLA"],
  ];

  spin(): SpinResult {
    const stops = this.reels.map((reel) =>
      Math.floor(Math.random() * reel.length),
    );

    const columns = this.reels.map((reel, index) => {
      const stop = stops[index]!;

      return [
        reel[(stop - 1 + reel.length) % reel.length]!,
        reel[stop]!,
        reel[(stop + 1) % reel.length]!,
      ];
    });

    return { columns, stops };
  }

  getReel(index: number): SlotSymbol[] {
  const reel = this.reels[index];

  if (!reel) {
    throw new Error("El rodillo solicitado no existe");
  }

  return [...reel];
}

}