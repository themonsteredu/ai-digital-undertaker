export type SaveTask = { key: string; action: 'save_answer' | 'progress'; body: Record<string, any> };
export type SaveState = { pending: boolean; error: string };

export function answerTask(caseNo: number, answer: any): SaveTask {
  return { key: `answer:${caseNo}`, action: 'save_answer', body: {
    case_no: caseNo, found_items: answer.found_items || [], choices: answer.choices || {},
    reason: answer.reason || '', completed: answer.completed === true,
  } };
}

export function readOutbox(key: string): SaveTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || '[]');
    if (!Array.isArray(value) || value.length > 5) return [];
    return value.filter((task: SaveTask) => task?.body && (
      (task.action === 'save_answer' && [1, 2, 3, 4].includes(task.body.case_no) && task.key === `answer:${task.body.case_no}`) ||
      (task.action === 'progress' && task.key === 'progress' && [1, 2, 3, 4, 5].includes(task.body.current_case))
    ));
  } catch { return []; }
}

// One request at a time; superseded snapshots never accumulate behind a slow request.
export class AutosaveQueue {
  private tasks = new Map<string, SaveTask>();
  private acknowledged = new Map<string, string>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running: Promise<void> | null = null;
  private error = '';
  private send: (task: SaveTask) => Promise<unknown>;
  private report: (state: SaveState) => void;
  private checkpoint: (tasks: SaveTask[]) => void;
  private delay: number;

  constructor(options: {
    send: (task: SaveTask) => Promise<unknown>;
    report: (state: SaveState) => void;
    checkpoint?: (tasks: SaveTask[]) => void;
    initial?: SaveTask[];
    baseline?: SaveTask[];
    delay?: number;
  }) {
    this.send = options.send; this.report = options.report;
    this.checkpoint = options.checkpoint || (() => {}); this.delay = options.delay ?? 300;
    options.baseline?.forEach(task => this.acknowledged.set(task.key, JSON.stringify(task.body)));
    options.initial?.forEach(task => this.tasks.set(task.key, task));
  }
  hasPending() { return this.tasks.size > 0; }
  private publish() {
    this.checkpoint([...this.tasks.values()]);
    this.report({ pending: this.hasPending(), error: this.error });
  }
  enqueue(task: SaveTask) {
    const current = this.tasks.get(task.key);
    const serialized = JSON.stringify(task.body);
    if (current && JSON.stringify(current.body) === serialized) return;
    if (!current && this.acknowledged.get(task.key) === serialized) return;
    this.tasks.set(task.key, task); this.publish(); this.start();
  }
  start() {
    if (this.running || this.error || !this.hasPending()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = undefined; void this.drain(); }, this.delay);
  }
  private drain(): Promise<void> {
    if (this.running) return this.running;
    const work = async () => {
      while (this.hasPending() && !this.error) {
        // Save answers before the resume position that points past them.
        const task = [...this.tasks.values()].find(item => item.action === 'save_answer') || this.tasks.values().next().value!;
        try {
          await this.send(task);
          this.acknowledged.set(task.key, JSON.stringify(task.body));
          if (this.tasks.get(task.key) === task) this.tasks.delete(task.key);
        } catch (error) {
          this.error = error instanceof Error ? error.message : '저장을 완료하지 못했어요. 다시 시도해 주세요.';
        }
        this.publish();
      }
    };
    this.running = work().finally(() => { this.running = null; this.start(); });
    return this.running;
  }
  async flush() {
    clearTimeout(this.timer); this.timer = undefined;
    await this.drain();
    if (this.error) throw new Error(this.error);
  }
  async retry() { this.error = ''; this.publish(); await this.flush(); }
  pauseTimer() { clearTimeout(this.timer); this.timer = undefined; }
}
