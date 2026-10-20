export class GameAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private enabled = false;

  private music?: HTMLAudioElement;
private musicGain?: GainNode;

private readonly handleVisibility = (): void => {
  if (document.hidden) {
    this.music?.pause();

    if (this.context && this.master) {
      this.master.gain.setValueAtTime(
        0,
        this.context.currentTime,
      );
    }
  } else {
    void this.unlock();
  }
};

  constructor() {
    try {
      this.enabled =
        localStorage.getItem("giro-porteno-sound") === "on";
    } catch {
      // el juego va a funcionar aunque el almacenamiento no este disponible
    }

document.addEventListener(
  "visibilitychange",
  this.handleVisibility,
);

  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async unlock(): Promise<void> {
  if (!this.enabled || document.hidden) return;

  try {
    if (!this.context) {
      this.context = new AudioContext();

      this.master = this.context.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.context.destination);

      // creamos la pista una sola vez
      this.music = new Audio(
        new URL(
          `${import.meta.env.BASE_URL}assets/audio/ambiente.mp3`,
          document.baseURI,
        ).href,
      );

      this.music.loop = true;
      this.music.preload = "none";

      // control de volumen mediante audio web
      const musicSource =
        this.context.createMediaElementSource(this.music);

      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = 0.35;

      musicSource.connect(this.musicGain);
      this.musicGain.connect(this.master);
    }

    this.master!.gain.setValueAtTime(
      0.18,
      this.context.currentTime,
    );

    // iniciamos ambas solicitudes dentro de la interaccion
    const resume =
      this.context.state !== "running"
        ? this.context.resume()
        : Promise.resolve();

    const playback = this.music?.paused
      ? this.music.play()
      : Promise.resolve();

    await Promise.allSettled([resume, playback]);

    // puede haberse desactivado mientras cargaba la pista
    if (!this.enabled || document.hidden) {
      this.music?.pause();

      this.master?.gain.setValueAtTime(
        0,
        this.context.currentTime,
      );
    }
  } catch {
    //si la musica falla el juego debe seguir funcionando
  }
}
  async toggle(): Promise<void> {
    this.enabled = !this.enabled;

    try {
      localStorage.setItem(
        "giro-porteno-sound",
        this.enabled ? "on" : "off",
      );
    } catch {
      // se conserva preferencia durante esta sesion
    }

    if (this.context && this.master) {
      this.master.gain.setValueAtTime(
        this.enabled ? 0.18 : 0,
        this.context.currentTime,
      );
    }

    if (!this.enabled) {
      this.music?.pause();
    }

    await this.unlock();

    if (this.enabled) this.click();
  }

  click(): void {
    this.tone(420, 0.055, 0.22);
  }

  reelStop(index: number): void {
    this.tone(260 + index * 45, 0.1, 0.3);
  }

  prize(): void {
    this.tone(523.25, 0.22, 0.22, 0);
    this.tone(659.25, 0.22, 0.18, 0.08);
    this.tone(783.99, 0.32, 0.16, 0.16);
  }

  private tone(
    frequency: number,
    duration: number,
    volume: number,
    delay = 0,
  ): void {
    const context = this.context;
    const master = this.master;

    if (
      !this.enabled ||
      !context ||
      !master ||
      context.state !== "running" ||
      document.hidden
    ) {
      return;
    }

    const oscillator = context.createOscillator();
    const envelope = context.createGain();

    const start = context.currentTime + delay;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);

    // Entrada y salida suaves para evitar chasquidos.
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(
      0.001,
      start + duration,
    );

    oscillator.connect(envelope);
    envelope.connect(master);

    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };

    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  destroy(): void {
  this.enabled = false;

  document.removeEventListener(
    "visibilitychange",
    this.handleVisibility,
  );

  if (this.music) {
    this.music.pause();
    this.music.removeAttribute("src");
    this.music.load();
    this.music = undefined;
  }

  if (this.context) {
    void this.context.close().catch(() => {});
  }
}
}