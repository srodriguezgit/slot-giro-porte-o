import type { SlotSymbol, SpinResult } from "./SlotEngine";
import { PAYLINES } from "./Paylines";
import type { Payline } from "./Paylines";

export interface LineWin {
  line: Payline;
  symbol: SlotSymbol;
  multiplier: number;
  payout: number;
}

export interface WinResult {
  multiplier: number;
  payout: number;
  winningLines: LineWin[];
}

export class WinEvaluator {
  private readonly paytable: Record<SlotSymbol, number> = {
    EMPANADA: 2,
    MATE: 1,
    CHORIPAN: 4,
    PARRILLA: 8,
    OBELISCO: 12,
  };

  evaluate(result: SpinResult, bet: number): WinResult {
    const winningLines: LineWin[] = [];

    for (const line of PAYLINES) {
      const first = result.columns[0]![line.rows[0]]!;
      const second = result.columns[1]![line.rows[1]]!;
      const third = result.columns[2]![line.rows[2]]!;

      if (first === second && second === third) {
        const multiplier = this.paytable[first];

        winningLines.push({
          line,
          symbol: first,
          multiplier,
          payout: bet * multiplier,
        });
      }
    }

    const totalMultiplier = winningLines.reduce(
      (total, win) => total + win.multiplier,
      0,
    );

    const totalPayout = winningLines.reduce(
      (total, win) => total + win.payout,
      0,
    );

    return {
      multiplier: totalMultiplier,
      payout: totalPayout,
      winningLines,
    };
  }

  getPaytable(): Readonly<Record<SlotSymbol, number>> {
    return { ...this.paytable };
  }
}