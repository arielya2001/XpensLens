declare module 'mammoth' {
  interface Result { value: string; messages: unknown[] }
  interface MammothModule {
    extractRawText(input: { buffer: Buffer } | { path: string }): Promise<Result>;
  }
  const mammoth: MammothModule;
  export = mammoth;
}
