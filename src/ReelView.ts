import Phaser from "phaser";
import type { SlotSymbol } from "./SlotEngine";

const SYMBOL_SIZES: Record<
  SlotSymbol,
  { width: number; height: number }
> = {
  MATE: { width: 120, height: 86 },
  EMPANADA: { width: 140, height: 86 },
  CHORIPAN: { width: 140, height: 84 },
  PARRILLA: { width: 140, height: 86 },
  OBELISCO: { width: 100, height: 86 },
};

export class ReelView {
  private readonly scene: Phaser.Scene;
  private readonly symbols: SlotSymbol[];

  private readonly images: Phaser.GameObjects.Image[] = [];
  private readonly motion = { position: 0 };
  private verticalOffset = 0;

  private winningTween?: Phaser.Tweens.Tween;

  private winningImage?: Phaser.GameObjects.Image;
  private winningScale = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    symbols: SlotSymbol[],
  ) {
    this.scene = scene;
    this.symbols = symbols;

    for (let i = 0; i < 5; i++) {
      const image = scene.add
        .image(x, 310, `${symbols[0]!}_SMALL`)
        .setOrigin(0.5);

      this.images.push(image);
    }

    this.render();
  }

setVerticalOffset(offset: number): void {
  this.stopWinningPulse();
  this.verticalOffset = offset;
  this.render();
}

  spinTo(
    stop: number,
    duration: number,
    onComplete: () => void,
  ): void {
    this.stopWinningPulse();
    const length = this.symbols.length;
    const current = this.motion.position;

    const distance = (stop - current + length) % length;
    const target = current + length * 3 + distance;

    this.scene.tweens.add({
      targets: this.motion,
      position: target,
      duration,
      ease: "Cubic.Out",

      onUpdate: () => {
        this.render();
      },

      onComplete: () => {
        this.motion.position = stop;
        this.render();
        onComplete();
      },
    });
  }

pulseWinningRow(row: number): void {
  this.stopWinningPulse();

  if (row < 0 || row > 2) return;

  // Al detenerse, las imágenes visibles son las posiciones 1, 2 y 3.
  const image = this.images[row + 1];
  if (!image) return;

  this.winningImage = image;
  this.winningScale = image.scaleX;

  this.winningTween = this.scene.tweens.add({
    targets: image,
    scaleX: this.winningScale * 1.05,
    scaleY: this.winningScale * 1.05,
    duration: 550,
    ease: "Sine.InOut",
    yoyo: true,
    repeat: -1,
  });
}

stopWinningPulse(): void {
  this.winningTween?.remove();
  this.winningTween = undefined;

  if (this.winningImage?.active) {
    this.winningImage.setScale(this.winningScale);
  }

  this.winningImage = undefined;
}

  private render(): void {
    const position = this.motion.position;
    const base = Math.floor(position);
    const fraction = position - base;
    const length = this.symbols.length;

    this.images.forEach((image, index) => {
      const offset = index - 2;

      const symbolIndex = (base + offset + length) % length;
      const symbol = this.symbols[symbolIndex]!;

      const centerY = 310 + this.verticalOffset;
const y = centerY + (offset - fraction) * 100;

      image.setTexture(`${symbol}_SMALL`);

      // Conserva la proporción de la imagen.
      // El símbolo debe entrar en un espacio de 140 × 84.
      const size = SYMBOL_SIZES[symbol];

const scale = Math.min(
  size.width / image.width,
  size.height / image.height,
);

image.setScale(scale);

      // Desvanecimiento en los extremos del rodillo.
      const distanceFromCenter = Math.abs(y - centerY);
      const alpha = Phaser.Math.Clamp(
        (125 - distanceFromCenter) / 25,
        0,
        1,
      );

      image
        .setY(y)
        .setAlpha(alpha);
    });
  }
}