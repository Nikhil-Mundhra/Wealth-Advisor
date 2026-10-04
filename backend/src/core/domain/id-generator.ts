// Domain code asks for ids through this port so it never depends on the database's id type.
export interface IdGenerator {
  next(): string;
}
