export interface SequenceRepository {
  /** Atomically allocate the next sequence number. Never reuses retired values. */
  allocateNext(): Promise<number>;
  getCurrent(): Promise<number>;
  ensureInitialized(startAt: number): Promise<void>;
}
