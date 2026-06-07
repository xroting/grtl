export class GenRTLError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenRTLError";
  }
}
