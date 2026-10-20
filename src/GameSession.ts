export class GameSession {
  private balance = 1000;

  private readonly betOptions = [10, 20, 50, 100];
  private betIndex = 0;

  get bet(): number {
    return this.betOptions[this.betIndex]!;
  }

  getBalance(): number {
    return this.balance;
  }

  canIncreaseBet(): boolean {
    return this.betIndex < this.betOptions.length - 1;
  }

  canDecreaseBet(): boolean {
    return this.betIndex > 0;
  }

  increaseBet(): void {
    if (this.canIncreaseBet()) {
      this.betIndex++;
    }
  }

  decreaseBet(): void {
    if (this.canDecreaseBet()) {
      this.betIndex--;
    }
  }

  canSpin(): boolean {
    return this.balance >= this.bet;
  }

  payForSpin(): boolean {
    if (!this.canSpin()) {
      return false;
    }

    this.balance -= this.bet;
    return true;
  }

  creditPrize(payout: number): void {
    if (!Number.isFinite(payout) || payout < 0) {
      throw new Error("El premio debe ser un número válido no negativo");
    }

    this.balance += payout;
  }

  reset(): void {
    this.balance = 1000;
    this.betIndex = 0;
  }
}