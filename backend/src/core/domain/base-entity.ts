export interface EntityProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Entities are built only through finalize(), which runs postInit() after every constructor and field
// initializer has finished. Calling postInit() from this constructor would run before subclass fields exist.
export abstract class BaseEntity<P extends EntityProps> {
  protected readonly props: P;

  protected constructor(props: P) {
    this.props = props;
  }

  protected static finalize<E extends BaseEntity<EntityProps>>(entity: E): E {
    entity.postInit();
    return entity;
  }

  // Override to enforce invariants; throw to reject the instance.
  protected postInit(): void {}

  // Mutators call this after changing state, so an invariant can never be broken after construction.
  protected assertInvariants(): void {
    this.postInit();
  }

  get id(): string {
    return this.props.id;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  equals(other: BaseEntity<EntityProps>): boolean {
    return other.constructor === this.constructor && other.id === this.id;
  }
}
