export class UserRegisteredEvent {
  constructor(
    public readonly user: { name: string; email: string; id: string },
  ) {}
}

export class EmailConfirmationRequestedEvent {
  constructor(
    public readonly user: { name: string; email: string },
    public readonly token: string,
  ) {}
}

export class PasswordResetRequestedEvent {
  constructor(
    public readonly user: { name: string; email: string },
    public readonly token: string,
  ) {}
}

export class PasswordChangedEvent {
  constructor(public readonly user: { name: string; email: string }) {}
}
