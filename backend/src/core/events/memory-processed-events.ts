import type { MarkResult, ProcessedEvents } from './processed-events.ts';

// Check and add run with no await in between, so the mark is atomic on the single JS thread.
export class MemoryProcessedEvents implements ProcessedEvents {
  private readonly marks = new Set<string>();

  async markProcessed(handlerName: string, eventId: string): Promise<MarkResult> {
    const key = JSON.stringify([handlerName, eventId]);
    if (this.marks.has(key)) return 'duplicate';
    this.marks.add(key);
    return 'first';
  }
}
