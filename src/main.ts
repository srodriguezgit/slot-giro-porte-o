import Phaser from "phaser";
import "./style.css";

import { SlotEngine } from "./SlotEngine";
import type { SlotSymbol } from "./SlotEngine";
import { WinEvaluator } from "./WinEvaluator";
import { GameSession } from "./GameSession";
import { ReelView } from "./ReelView";
import type { LineWin } from "./WinEvaluator";
import { PAYLINES } from "./Paylines";
import { GameAudio } from "./GameAudio";

const backgroundUrl = new URL(
  `${import.meta.env.BASE_URL}buenos-aires.png`,
  document.baseURI,
).href;

document.body.style.backgroundImage = `
  linear-gradient(
    rgba(4, 15, 24, 0.12),
    rgba(4, 15, 24, 0.32)
  ),
  url("${backgroundUrl}")
`;

const symbolLabels: Record<SlotSymbol, string> = {
  EMPANADA: "EMPANADA",
  MATE: "MATE",
  CHORIPAN: "CHORIPAN",
  PARRILLA: "PARRILLA",
  OBELISCO: "OBELISCO",
};

class SlotScene extends Phaser.Scene {
  private readonly session = new GameSession();
  private readonly engine = new SlotEngine();
  private readonly evaluator = new WinEvaluator();

  private reelViews: ReelView[] = [];
  private cellBackgrounds: Phaser.GameObjects.Rectangle[][] = [];
  private spinning = false;
  private winLineGraphics?: Phaser.GameObjects.Graphics;
  private winLineTween?: Phaser.Tweens.Tween;
  private winLineTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super("SlotScene");
  }

  preload(): void {
  const base = `${import.meta.env.BASE_URL}assets/symbols/`;

  this.load.image("MATE", `${base}mate.png`);
  this.load.image("EMPANADA", `${base}empanada.png`);
  this.load.image("CHORIPAN", `${base}choripan.png`);
  this.load.image("PARRILLA", `${base}parrilla.png`);
  this.load.image("OBELISCO", `${base}obelisco.png`);

    this.load.image(
  "giro-porteno-logo",
  `${import.meta.env.BASE_URL}assets/ui/giro-porteno.png`,
);

this.load.image(
  "marco-porteno",
  `${import.meta.env.BASE_URL}assets/ui/marco-porteno.png`,
);

}

  create(): void {

    const gameAudio = new GameAudio();

document.getElementById("sound-toggle")?.remove();

const soundToggle = document.createElement("button");
soundToggle.id = "sound-toggle";
soundToggle.className = "sound-toggle";
soundToggle.type = "button";

const refreshSoundButton = (): void => {
  const enabled = gameAudio.isEnabled();

  soundToggle.textContent = enabled
    ? "SONIDO · ON"
    : "SONIDO · OFF";

  soundToggle.setAttribute(
    "aria-label",
    enabled ? "Desactivar sonido" : "Activar sonido",
  );

  soundToggle.setAttribute("aria-pressed", String(enabled));
};

refreshSoundButton();
document.body.appendChild(soundToggle);

soundToggle.addEventListener("click", async () => {
  soundToggle.disabled = true;

  try {
    await gameAudio.toggle();
    refreshSoundButton();
  } finally {
    soundToggle.disabled = false;
  }
});

// Si la preferencia estaba activada, habilitamos el audio
// con la primera interacción y después de interrupciones.
const unlockAudio = (): void => {
  void gameAudio.unlock();
};

document.addEventListener("pointerdown", unlockAudio, true);

this.events.once("shutdown", () => {
  document.removeEventListener("pointerdown", unlockAudio, true);
  soundToggle.remove();
  gameAudio.destroy();
});

  this.prepareSymbolTextures();
  this.prepareLogoTexture();

    this.reelViews = [];
    this.cellBackgrounds = [];
    this.spinning = false;

    const logo = this.add
  .image(480, 38, "giro-porteno-logo-smooth")
  .setOrigin(0.5);

logo.setScale(450 / logo.width);

    const status = this.add
  .text(480, 100, "", {
    fontFamily: "Arial",
    fontSize: "17px",
    fontStyle: "bold",
    color: "#f6dfac",
  })
  .setOrigin(0.5);

      const winDetails = this.add
  .text(480, 113, "", {
    fontFamily: "Arial",
    fontSize: "11px",
    color: "#b7d9d8",
    align: "center",
  })
  .setOrigin(0.5);

  // Placa de créditos, separada del tablero.
const creditPlate = this.add.graphics();

creditPlate.fillStyle(0x09232d, 0.96);
creditPlate.fillRoundedRect(355, 488, 250, 38, 12);

creditPlate.lineStyle(2, 0xd5aa61, 1);
creditPlate.strokeRoundedRect(355, 488, 250, 38, 12);

// Un segundo filete más discreto.
creditPlate.lineStyle(1, 0xd5aa61, 0.35);
creditPlate.strokeRoundedRect(360, 493, 240, 28, 8);
      
const balanceText = this.add
  .text(
    480,
    507,
    `CRÉDITOS · ${this.session.getBalance()}`,
    {
      fontFamily: "Georgia",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#f6dfac",
    },
  )
  .setOrigin(0.5);

const refreshBalance = (): void => {
  balanceText.setText(
    `CRÉDITOS · ${this.session.getBalance()}`,
  );
};

    // Fondo oscuro detrás de los rodillos
this.add.rectangle(
  480,
  310,
  590,
  340,
  0x09232d,
  0.97,
);

    for (let column = 0; column < 3; column++) {
  const x = 290 + column * 190;
  const backgrounds: Phaser.GameObjects.Rectangle[] = [];

  // Una ventana continua para cada rodillo.
  this.add
    .rectangle(x, 310, 180, 310, 0x071c26)
    .setStrokeStyle(1, 0x284b56);

  for (let row = 0; row < 3; row++) {
    const y = 210 + row * 100;

    // Conservamos estos objetos para ubicar y resaltar premios,
    // pero normalmente son transparentes.
    const highlight = this.add
      .rectangle(x, y, 170, 94, 0x14532d, 0);

    backgrounds.push(highlight);
  }

  this.cellBackgrounds.push(backgrounds);

  const reelView = new ReelView(
    this,
    x,
    this.engine.getReel(column),
  );

  this.reelViews.push(reelView);
}

// Marco decorativo por encima de los bordes del tablero.
this.add
  .image(480, 310, "marco-porteno")
  .setDisplaySize(650, 380);

    const resetButton = this.add
  .text(480, 670, "Reiniciar demo", {
    fontFamily: "Arial",
    fontSize: "18px",
    color: "#94a3b8",
  })
  .setOrigin(0.5)
  .setInteractive({ useHandCursor: true });

  const demoNote = this.add
  .text(480, 703, "DEMO · CRÉDITOS FICTICIOS", {
    fontFamily: "Arial",
    fontSize: "11px",
    color: "#b7c5ce",
  })
  .setOrigin(0.5);

resetButton.on("pointerdown", () => {
  if (this.spinning) return;

  this.session.reset();
  refreshBalance();

  refreshBetControls();

  this.stopWinningAnimation();
this.clearWinningHighlight();
winDetails.setText("");
  status.setColor("#94a3b8");

  status
  .setText("Demo reiniciada")
  .setColor("#94a3b8");
});

this.winLineGraphics = this.add.graphics();
this.winLineGraphics.setDepth(20);

this.events.once("shutdown", () => {
  this.stopWinningAnimation();
});

// Evita dejar un menú anterior si se vuelve a crear la escena
document.getElementById("prizes-dialog")?.remove();

const prizesDialog = document.createElement("dialog");
prizesDialog.id = "prizes-dialog";
prizesDialog.className = "prizes-dialog";
prizesDialog.setAttribute("aria-labelledby", "prizes-title");

const paytable = this.evaluator.getPaytable();

const prizeRows = (Object.keys(paytable) as SlotSymbol[])
  .map((symbol) => {
    return `
      <div class="prize-row">
        <span>${symbolLabels[symbol]}</span>
        <strong>×${paytable[symbol]}</strong>
      </div>
    `;
  })
  .join("");

const lineCards = PAYLINES.map((line) => {
  let cells = "";

  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) {
      const active = line.rows[column] === row;

      cells += `
        <span class="line-cell ${active ? "is-active" : ""}"></span>
      `;
    }
  }

  return `
    <div class="line-card">
      <div class="line-grid" aria-hidden="true">${cells}</div>
      <span>${line.name}</span>
    </div>
  `;
}).join("");

prizesDialog.innerHTML = `
  <div class="prizes-header">
    <div>
      <span class="prizes-eyebrow">GIRO PORTEÑO</span>
      <h2 id="prizes-title">Tabla de premios</h2>
    </div>

    <button
      class="prizes-close"
      type="button"
      aria-label="Cerrar tabla de premios"
      autofocus
    >×</button>
  </div>

  <p>
    Tres símbolos iguales sobre cualquiera de las siete líneas.
    Todas las líneas están incluidas en el costo del giro.
  </p>

  <div class="prize-list">${prizeRows}</div>

  <p class="prizes-current-bet"></p>

  <h3>Líneas válidas</h3>
  <div class="lines-list">${lineCards}</div>

  <p class="prizes-note">
    Premio por línea = costo del giro × multiplicador.
    Si ganan varias líneas, sus premios se suman.
    El costo del giro se descuenta una sola vez.
  </p>

  <p class="prizes-note">Demo con créditos ficticios.</p>
`;

document.body.appendChild(prizesDialog);

const closePrizes = (): void => {
  prizesDialog.close();
};

prizesDialog
  .querySelector<HTMLButtonElement>(".prizes-close")!
  .addEventListener("click", closePrizes);

// Permite cerrar tocando el fondo exterior del menú.
prizesDialog.addEventListener("click", (event) => {
  const bounds = prizesDialog.getBoundingClientRect();

  const outside =
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom;

  if (event.target === prizesDialog && outside) {
    closePrizes();
  }
});

this.events.once("shutdown", () => {
  prizesDialog.remove();
});

const prizesButton = this.add
  .circle(700, 590, 36, 0x103b46)
  .setStrokeStyle(2, 0xd5aa61)
  .setInteractive({ useHandCursor: true });

const prizesIcon = this.add
  .text(700, 590, "i", {
    fontFamily: "Georgia, serif",
    fontSize: "32px",
    fontStyle: "bold",
    color: "#f6dfac",
  })
  .setOrigin(0.5);

const prizesCaption = this.add
  .text(700, 640, "PREMIOS", {
    fontFamily: "Arial",
    fontSize: "12px",
    color: "#f6dfac",
  })
  .setOrigin(0.5);

prizesButton.on("pointerover", () => {
  if (!this.spinning) prizesButton.setFillStyle(0x195362);
});

prizesButton.on("pointerout", () => {
  prizesButton.setFillStyle(0x103b46);
});

prizesButton.on("pointerdown", () => {
  if (this.spinning || prizesDialog.open) return;

  prizesDialog.querySelector(".prizes-current-bet")!.textContent =
    `Costo seleccionado: ${this.session.bet} créditos.`;

  prizesDialog.showModal();
});

const spinShadow = this.add
  .circle(480, 594, 50, 0x04151d, 0.65);

    const button = this.add
  .circle(480, 590, 48, 0x103b46)
  .setStrokeStyle(3, 0xd5aa61)
  .setInteractive({ useHandCursor: true });

  const spinInnerRing = this.add
  .circle(480, 590, 42)
  .setStrokeStyle(1, 0xf6dfac, 0.35);

const spinArrow = this.add.graphics({
  x: 480,
  y: 575,
});

// Arco circular con una abertura.
spinArrow.lineStyle(3, 0xd5aa61, 1);
spinArrow.beginPath();
spinArrow.arc(
  0,
  0,
  12,
  Phaser.Math.DegToRad(-45),
  Phaser.Math.DegToRad(225),
  false,
);
spinArrow.strokePath();

// Punta de la flecha al final del arco.
spinArrow.fillStyle(0xd5aa61, 1);
spinArrow.fillTriangle(
  -3.5, -13.5,
  -13.5, -10.5,
  -6.5, -3.5,
);

const buttonLabel = this.add
  .text(480, 606, "GIRAR", {
    fontFamily: "Arial",
    fontSize: "18px",
    fontStyle: "bold",
    color: "#f6dfac",
  })
  .setOrigin(0.5);

let spinArrowTween: Phaser.Tweens.Tween | undefined;

const startSpinArrow = (): void => {
  spinArrowTween?.remove();

  spinArrow.setAngle(0).setAlpha(0.8);

  spinArrowTween = this.tweens.add({
    targets: spinArrow,
    angle: 360,
    duration: 850,
    ease: "Linear",
    repeat: -1,
  });
};

const stopSpinArrow = (): void => {
  spinArrowTween?.remove();
  spinArrowTween = undefined;

  spinArrow.setAngle(0).setAlpha(1);
};

this.events.once("shutdown", () => {
  spinArrowTween?.remove();
  spinArrowTween = undefined;
});

      const decreaseButton = this.add
  .circle(230, 590, 24, 0x103b46)
  .setStrokeStyle(2, 0xd5aa61)
  .setInteractive({ useHandCursor: true });

const decreaseLabel = this.add
  .text(230, 590, "−", {
    fontFamily: "Arial",
    fontSize: "28px",
    color: "#f6dfac",
  })
  .setOrigin(0.5);

const increaseButton = this.add
  .circle(330, 590, 24, 0x103b46)
  .setStrokeStyle(2, 0xd5aa61)
  .setInteractive({ useHandCursor: true });

const increaseLabel = this.add
  .text(330, 590, "+", {
    fontFamily: "Arial",
    fontSize: "26px",
    color: "#f6dfac",
  })
  .setOrigin(0.5);

const betValueText = this.add
  .text(280, 590, `${this.session.bet}`, {
    fontFamily: "Arial",
    fontSize: "22px",
    fontStyle: "bold",
    color: "#f6dfac",
  })
  .setOrigin(0.5);

const betCaption = this.add
  .text(280, 640, "VALOR DEL GIRO", {
    fontFamily: "Arial",
    fontSize: "12px",
    color: "#f6dfac",
  })
  .setOrigin(0.5);

const refreshBetControls = (): void => {
  betValueText.setText(`${this.session.bet}`);

  const canDecrease =
    !this.spinning && this.session.canDecreaseBet();

  const canIncrease =
    !this.spinning && this.session.canIncreaseBet();

  decreaseButton
    .setAlpha(canDecrease ? 1 : 0.35)
    .setFillStyle(0x103b46);

  decreaseLabel.setAlpha(canDecrease ? 1 : 0.35);

  increaseButton
    .setAlpha(canIncrease ? 1 : 0.35)
    .setFillStyle(0x103b46);

  increaseLabel.setAlpha(canIncrease ? 1 : 0.35);
};

const showSelectedBet = (): void => {
  refreshBalance();
  refreshBetControls();

  this.stopWinningAnimation();
  this.clearWinningHighlight();
  winDetails.setText("");

  status
    .setText(`Costo del giro: ${this.session.bet} créditos`)
    .setColor("#94a3b8");
};

decreaseButton.on("pointerdown", () => {
  if (this.spinning || !this.session.canDecreaseBet()) return;

  gameAudio.click();
  this.session.decreaseBet();
  showSelectedBet();
});

increaseButton.on("pointerdown", () => {
  if (this.spinning || !this.session.canIncreaseBet()) return;

  gameAudio.click();
  this.session.increaseBet();
  showSelectedBet();
});

decreaseButton.on("pointerover", () => {
  if (!this.spinning && this.session.canDecreaseBet()) {
    decreaseButton.setFillStyle(0x195362);
  }
});

decreaseButton.on("pointerout", () => {
  decreaseButton.setFillStyle(0x103b46);
});

increaseButton.on("pointerover", () => {
  if (!this.spinning && this.session.canIncreaseBet()) {
    increaseButton.setFillStyle(0x195362);
  }
});

increaseButton.on("pointerout", () => {
  increaseButton.setFillStyle(0x103b46);
});

refreshBetControls();

    button.on("pointerover", () => {
      if (!this.spinning) button.setFillStyle(0x195362);
    });

    button.on("pointerout", () => {
      if (!this.spinning) button.setFillStyle(0x103b46);
    });

    button.on("pointerdown", () => {
  if (this.spinning) return;

 if (!this.session.payForSpin()) {
  this.stopWinningAnimation();
  this.clearWinningHighlight();
  winDetails.setText("");

  status
    .setText("Créditos insuficientes")
    .setColor("#f6dfac");

  return;
}

  gameAudio.click();

  this.spinning = true;
  refreshBalance();
  refreshBetControls();

  this.stopWinningAnimation();
  this.clearWinningHighlight();
  winDetails.setText("");
  status.setColor("#94a3b8");

  button.setFillStyle(0x30444c);
  buttonLabel.setText("GIRAR");
  startSpinArrow();
  status.setText("");

  const betForThisSpin = this.session.bet;
  const result = this.engine.spin();
  const win = this.evaluator.evaluate(result, betForThisSpin);

  let finishedReels = 0;

  this.reelViews.forEach((reelView, index) => {
    reelView.spinTo(
      result.stops[index]!,
      1200 + index * 350,
      () => {
        gameAudio.reelStop(index);
        finishedReels++;

        // Esperamos a que terminen los tres rodillos
        if (finishedReels < this.reelViews.length) return;

        this.session.creditPrize(win.payout);
        refreshBalance();

        this.spinning = false;
        refreshBetControls();
        button.setFillStyle(0x103b46);
        buttonLabel.setText("GIRAR");
        stopSpinArrow();

        if (win.payout > betForThisSpin) {
          gameAudio.prize();
        }

       this.playWinningLines(win.winningLines, winDetails);

if (win.payout > 0) {
  status
    .setText(`Premio total: ${win.payout} créditos`)
    .setColor("#4ade80");
} else {
  status
    .setText("Sin premio")
    .setColor("#94a3b8");
}
        },
    );
  });
}); // Cierra el evento pointerdown

// Panel exclusivo de la distribución móvil.
const mobileControlsPanel = this.add.graphics()
  .setDepth(-1);

const resetCircle = this.add
  .circle(280, 820, 38, 0x103b46)
  .setStrokeStyle(2, 0xd5aa61)
  .setDepth(-0.5)
  .setVisible(false);

const resetCaption = this.add
  .text(280, 877, "REINICIAR", {
    fontFamily: "Arial",
    fontSize: "16px",
    color: "#f6dfac",
  })
  .setOrigin(0.5)
  .setVisible(false);

const originalPositions = this.children.list
  .filter(
    (
      object,
    ): object is Phaser.GameObjects.Image |
      Phaser.GameObjects.Text |
      Phaser.GameObjects.Arc |
      Phaser.GameObjects.Rectangle |
      Phaser.GameObjects.Graphics =>
      object instanceof Phaser.GameObjects.Image ||
      object instanceof Phaser.GameObjects.Text ||
      object instanceof Phaser.GameObjects.Arc ||
      object instanceof Phaser.GameObjects.Rectangle ||
      object instanceof Phaser.GameObjects.Graphics,
  )
  .map((object) => ({
    object,
    x: object.x,
    y: object.y,
  }));

const applyLayout = (): void => {
  const parent = document.getElementById("app");
  if (!parent) return;

  const portrait = parent.clientHeight > parent.clientWidth;
  const mobile = portrait && parent.clientWidth < 760;

  const gameWidth = mobile ? 700 : 960;
  const gameHeight = mobile ? 980 : 735;
  const boardOffset = mobile ? 90 : 0;

  if (
    this.scale.width !== gameWidth ||
    this.scale.height !== gameHeight
  ) {
    this.scale.setGameSize(gameWidth, gameHeight);
  }

  this.cameras.main
    .setSize(gameWidth, gameHeight)
    .setScroll((960 - gameWidth) / 2, 0);

  // Recuperamos posiciones originales antes de distribuir.
  originalPositions.forEach(({ object, x, y }) => {
    if (
      object instanceof Phaser.GameObjects.Image &&
      object.texture.key.endsWith("_SMALL")
    ) {
      return;
    }

    if (object === this.winLineGraphics) return;

    object.setPosition(x, y + boardOffset);
  });

  // Encabezado.
  logo
    .setPosition(480, mobile ? 78 : 46)
    .setScale((mobile ? 500 : 450) / logo.width);

  status
    .setPosition(480, mobile ? 150 : 100)
    .setFontSize(mobile ? 26 : 17);

  winDetails
    .setPosition(480, mobile ? 179 : 113)
    .setFontSize(mobile ? 19 : 11);

  balanceText.setFontSize(mobile ? 24 : 18);

  // Panel que reúne todos los controles del teléfono.
  mobileControlsPanel.clear();
  mobileControlsPanel.setPosition(0, 0);

  if (mobile) {
    mobileControlsPanel.fillStyle(0x071c26, 0.9);
    mobileControlsPanel.fillRoundedRect(
      210, 635, 540, 272, 24,
    );

    mobileControlsPanel.lineStyle(1, 0xd5aa61, 0.35);
    mobileControlsPanel.strokeRoundedRect(
      210, 635, 540, 272, 24,
    );

    // Separación sutil entre apuesta y acciones.
    mobileControlsPanel.lineStyle(1, 0xd5aa61, 0.18);
    mobileControlsPanel.beginPath();
    mobileControlsPanel.moveTo(245, 748);
    mobileControlsPanel.lineTo(715, 748);
    mobileControlsPanel.strokePath();
  }

  // Primera fila: apuesta.
  const betY = mobile ? 701 : 590;
  const minusX = mobile ? 370 : 230;
  const plusX = mobile ? 590 : 330;

  decreaseButton
    .setPosition(minusX, betY)
    .setScale(mobile ? 1.65 : 1);

  increaseButton
    .setPosition(plusX, betY)
    .setScale(mobile ? 1.65 : 1);

  decreaseLabel
    .setPosition(minusX, betY)
    .setScale(mobile ? 1.15 : 1);

  increaseLabel
    .setPosition(plusX, betY)
    .setScale(mobile ? 1.15 : 1);

  betValueText
    .setPosition(mobile ? 480 : 280, betY)
    .setFontSize(mobile ? 32 : 22)
    .setScale(1);

  betCaption
    .setPosition(mobile ? 480 : 280, mobile ? 657 : 640)
    .setFontSize(mobile ? 17 : 12);

  // Segunda fila: acción principal centrada.
  const spinY = mobile ? 820 : 590;
  const spinScale = mobile ? 1.3 : 1;

  button
    .setPosition(480, spinY)
    .setScale(spinScale);

  spinShadow
    .setPosition(480, spinY + 4)
    .setScale(spinScale);

  spinInnerRing
    .setPosition(480, spinY)
    .setScale(spinScale);

  spinArrow
    .setPosition(480, spinY - (mobile ? 19 : 15))
    .setScale(mobile ? 1.25 : 1);

  buttonLabel
    .setPosition(480, spinY + (mobile ? 23 : 16))
    .setFontSize(mobile ? 23 : 18);

  // Premios: secundario derecho.
  const prizesX = mobile ? 680 : 700;
  const prizesY = mobile ? 820 : 590;

  prizesButton
    .setPosition(prizesX, prizesY)
    .setScale(mobile ? 38 / 36 : 1);

  prizesIcon.setPosition(prizesX, prizesY);

  prizesCaption
    .setPosition(prizesX, mobile ? 877 : 640)
    .setFontSize(mobile ? 16 : 12);

  // Reinicio: secundario izquierdo.
  resetCircle
    .setPosition(280, 820)
    .setVisible(mobile);

  resetCaption
    .setPosition(280, 877)
    .setVisible(mobile);

  resetButton
    .setText(mobile ? "↺" : "Reiniciar demo")
    .setPosition(mobile ? 280 : 480, mobile ? 820 : 670)
    .setFontSize(mobile ? 34 : 18)
    .setColor(mobile ? "#f6dfac" : "#94a3b8")
    .setPadding(mobile ? 18 : 0);

  demoNote
    .setPosition(480, mobile ? 945 : 703)
    .setFontSize(mobile ? 16 : 11);

  // Rodillos y resaltados.
  this.reelViews.forEach((reelView) => {
    reelView.setVerticalOffset(boardOffset);
  });

  this.stopWinningAnimation();
  this.clearWinningHighlight();
  winDetails.setText("");
};

applyLayout();

window.addEventListener("resize", applyLayout);

this.events.once("shutdown", () => {
  window.removeEventListener("resize", applyLayout);
});

} // Cierra create()

private stopWinningAnimation(): void {

  this.reelViews.forEach((reelView) => {
  reelView.stopWinningPulse();
});

  this.winLineTimer?.remove(false);
  this.winLineTimer = undefined;

  this.winLineTween?.stop();
  this.winLineTween = undefined;

  this.winLineGraphics?.clear();
}

private drawWinningPath(
  points: { x: number; y: number }[],
  progress: number,
): void {
  const graphics = this.winLineGraphics;

  if (!graphics) return;

  graphics.clear();

  const first = points[0]!;
  const middle = points[1]!;
  const last = points[2]!;

  // El recorrido tiene dos segmentos.
  const firstProgress = Math.min(progress * 2, 1);
  const secondProgress = Math.max(progress * 2 - 1, 0);

  const firstEnd = {
    x: first.x + (middle.x - first.x) * firstProgress,
    y: first.y + (middle.y - first.y) * firstProgress,
  };

  const secondEnd = {
    x: middle.x + (last.x - middle.x) * secondProgress,
    y: middle.y + (last.y - middle.y) * secondProgress,
  };

  const drawStroke = (width: number, alpha: number): void => {
    graphics.lineStyle(width, 0x84e5e5, alpha);
    graphics.beginPath();
    graphics.moveTo(first.x, first.y);
    graphics.lineTo(firstEnd.x, firstEnd.y);

    if (progress > 0.5) {
      graphics.lineTo(secondEnd.x, secondEnd.y);
    }

    graphics.strokePath();
  };

  // Trazo ancho tenue y trazo fino nítido.
  drawStroke(6, 0.12);
drawStroke(2, 0.85);

  graphics.fillStyle(0xc8ffff, 1);
  graphics.fillCircle(first.x, first.y, 4);

  if (progress >= 0.5) {
    graphics.fillCircle(middle.x, middle.y, 4);
  }

  if (progress >= 1) {
    graphics.fillCircle(last.x, last.y, 4);
  }
}

private showWinningLine(
  win: LineWin,
  index: number,
  total: number,
  details: Phaser.GameObjects.Text,
): void {
  this.winLineTween?.stop();
  this.winLineTween = undefined;

  // Mostramos únicamente los casilleros de esta línea.
  this.highlightWinningLines([win]);

  this.reelViews.forEach((reelView, column) => {
  const row = win.line.rows[column];

  if (row !== undefined) {
    reelView.pulseWinningRow(row);
  }
});

  const points = win.line.rows.map((row, column) => {
    const cell = this.cellBackgrounds[column]![row]!;

    return {
      x: cell.x,
      y: cell.y,
    };
  });

  const counter = total > 1 ? `${index + 1}/${total} · ` : "";

details.setText(
  `${counter}${win.line.name} · 3 × ${symbolLabels[win.symbol]} · ${win.payout} créditos`,
);

  const animation = { progress: 0 };

  this.drawWinningPath(points, 0);

  this.winLineTween = this.tweens.add({
    targets: animation,
    progress: 1,
    duration: 450,
    ease: "Sine.InOut",

    onUpdate: () => {
      this.drawWinningPath(points, animation.progress);
    },

    onComplete: () => {
      this.drawWinningPath(points, 1);
    },
  });
}

private playWinningLines(
  winningLines: LineWin[],
  details: Phaser.GameObjects.Text,
): void {
  this.stopWinningAnimation();
  this.clearWinningHighlight();

  if (winningLines.length === 0) {
    details.setText("");
    return;
  }

  let index = 0;

  const showCurrentLine = (): void => {
    this.showWinningLine(
      winningLines[index]!,
      index,
      winningLines.length,
      details,
    );

    index = (index + 1) % winningLines.length;
  };

  showCurrentLine();

  // Si hay una sola, la dejamos marcada sin repetir la animación.
  if (winningLines.length > 1) {
    this.winLineTimer = this.time.addEvent({
      delay: 1600,
      loop: true,
      callback: showCurrentLine,
    });
  }
}

private prepareLogoTexture(): void {
  const key = "giro-porteno-logo-smooth";

  if (this.textures.exists(key)) return;

  const source = this.textures
    .get("giro-porteno-logo")
    .getSourceImage();

  if (
    !(source instanceof HTMLImageElement) &&
    !(source instanceof HTMLCanvasElement)
  ) {
    return;
  }

  const sourceWidth =
    source instanceof HTMLImageElement
      ? source.naturalWidth
      : source.width;

  const sourceHeight =
    source instanceof HTMLImageElement
      ? source.naturalHeight
      : source.height;

  // Conservamos resolución extra para pantallas grandes.
  const width = Math.min(sourceWidth, 940);
  const height = Math.round(
    sourceHeight * (width / sourceWidth),
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);

  this.textures.addCanvas(key, canvas);
}

private clearWinningHighlight(): void {
  this.cellBackgrounds.forEach((column) => {
    column.forEach((cell) => {
      cell
        .setFillStyle(0x14532d, 0)
        .setStrokeStyle(0);
    });
  });
}

private prepareSymbolTextures(): void {
  const symbols = Object.keys(symbolLabels) as SlotSymbol[];

  for (const symbol of symbols) {
    const key = `${symbol}_SMALL`;

    if (this.textures.exists(key)) continue;

    const source = this.textures
      .get(symbol)
      .getSourceImage();

    if (
      !(source instanceof HTMLImageElement) &&
      !(source instanceof HTMLCanvasElement)
    ) {
      throw new Error(`No se puede preparar la imagen de ${symbol}`);
    }

    const width =
      source instanceof HTMLImageElement
        ? source.naturalWidth
        : source.width;

    const height =
      source instanceof HTMLImageElement
        ? source.naturalHeight
        : source.height;

    // Copia del original para examinar su transparencia.
    const originalCanvas = document.createElement("canvas");
    originalCanvas.width = width;
    originalCanvas.height = height;

    const originalContext = originalCanvas.getContext("2d");

    if (!originalContext) {
      throw new Error("No se pudo analizar el símbolo");
    }

    originalContext.drawImage(source, 0, 0);

    const pixels = originalContext.getImageData(
      0,
      0,
      width,
      height,
    ).data;

    let left = width;
    let right = -1;
    let top = height;
    let bottom = -1;

    // Busca el rectángulo que contiene los píxeles visibles.
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = pixels[(y * width + x) * 4 + 3]!;

        if (alpha > 8) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }

    if (right < left || bottom < top) {
      throw new Error(`La imagen ${symbol} está completamente vacía`);
    }

    // Pequeño margen para conservar los bordes suavizados.
    const padding = 3;

    left = Math.max(0, left - padding);
    top = Math.max(0, top - padding);
    right = Math.min(width - 1, right + padding);
    bottom = Math.min(height - 1, bottom + padding);

    const cropWidth = right - left + 1;
    const cropHeight = bottom - top + 1;

    const ratio = Math.min(
      1,
      256 / Math.max(cropWidth, cropHeight),
    );

    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(cropWidth * ratio));
    canvas.height = Math.max(1, Math.round(cropHeight * ratio));

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("No se pudo preparar la textura");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    context.drawImage(
      originalCanvas,
      left,
      top,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    this.textures.addCanvas(key, canvas);
  }
}


private highlightWinningLines(winningLines: LineWin[]): void {
  this.clearWinningHighlight();

  winningLines.forEach((win) => {
    win.line.rows.forEach((row, column) => {
      this.cellBackgrounds[column]![row]!
        .setFillStyle(0x17716b, 0.18)
        .setStrokeStyle(0);
    });
  });
}

} // Cierra SlotScene

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  width: 960,
  height: 735,
  transparent: true,

  pixelArt: false,
  antialias: true,
  roundPixels: false,

  scene: [SlotScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});