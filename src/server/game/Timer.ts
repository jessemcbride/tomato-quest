export type TimerPhase = 'idle' | 'work' | 'break' | 'longbreak';

export interface TimerState {
  phase: TimerPhase;
  remaining: number; // seconds
  total: number;
  pomodoroCount: number;
  running: boolean;
}

export class PomodoroTimer {
  private phase: TimerPhase = 'idle';
  private remaining: number = 0;
  private total: number = 0;
  private pomodoroCount: number = 0;
  private running: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  private onTick?: (state: TimerState) => void;
  private onPhaseEnd?: (phase: TimerPhase, pomodoroCount: number) => void;

  static readonly WORK_DURATION = 25 * 60;
  static readonly BREAK_DURATION = 5 * 60;
  static readonly LONG_BREAK_DURATION = 15 * 60;

  constructor(
    onTick?: (state: TimerState) => void,
    onPhaseEnd?: (phase: TimerPhase, pomodoroCount: number) => void
  ) {
    this.onTick = onTick;
    this.onPhaseEnd = onPhaseEnd;
  }

  start(): void {
    if (this.phase === 'idle') {
      this.phase = 'work';
      this.remaining = PomodoroTimer.WORK_DURATION;
      this.total = PomodoroTimer.WORK_DURATION;
    }
    this.running = true;
    this.scheduleInterval();
  }

  pause(): void {
    this.running = false;
    this.clearInterval();
  }

  resume(): void {
    if (this.phase !== 'idle' && !this.running) {
      this.running = true;
      this.scheduleInterval();
    }
  }

  startBreak(long: boolean = false): void {
    this.clearInterval();
    if (long) {
      this.phase = 'longbreak';
      this.remaining = PomodoroTimer.LONG_BREAK_DURATION;
      this.total = PomodoroTimer.LONG_BREAK_DURATION;
    } else {
      this.phase = 'break';
      this.remaining = PomodoroTimer.BREAK_DURATION;
      this.total = PomodoroTimer.BREAK_DURATION;
    }
    this.running = true;
    this.scheduleInterval();
  }

  startNextWork(): void {
    this.clearInterval();
    this.phase = 'work';
    this.remaining = PomodoroTimer.WORK_DURATION;
    this.total = PomodoroTimer.WORK_DURATION;
    this.running = true;
    this.scheduleInterval();
  }

  reset(): void {
    this.clearInterval();
    this.phase = 'idle';
    this.remaining = 0;
    this.total = 0;
    this.pomodoroCount = 0;
    this.running = false;
  }

  completeWork(): void {
    this.clearInterval();
    this.running = false;
    if (this.phase === 'work') {
      this.pomodoroCount++;
    }
  }

  skip(): void {
    // Skip current phase and go to next
    if (this.phase === 'break' || this.phase === 'longbreak') {
      this.clearInterval();
      this.startNextWork();
    } else if (this.phase === 'work') {
      this.clearInterval();
      this.remaining = 0;
      this.handlePhaseEnd();
    }
  }

  getState(): TimerState {
    return {
      phase: this.phase,
      remaining: this.remaining,
      total: this.total,
      pomodoroCount: this.pomodoroCount,
      running: this.running,
    };
  }

  getRemaining(): number {
    return this.remaining;
  }

  getPhase(): TimerPhase {
    return this.phase;
  }

  isRunning(): boolean {
    return this.running;
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  private scheduleInterval(): void {
    this.clearInterval();
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    if (!this.running) return;
    this.remaining = Math.max(0, this.remaining - 1);
    this.onTick?.(this.getState());

    if (this.remaining <= 0) {
      this.handlePhaseEnd();
    }
  }

  private handlePhaseEnd(): void {
    this.clearInterval();
    this.running = false;
    const endedPhase = this.phase;

    if (this.phase === 'work') {
      this.pomodoroCount++;
    }

    this.onPhaseEnd?.(endedPhase, this.pomodoroCount);
  }
}
