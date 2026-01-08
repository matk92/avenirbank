export class Email {
  private constructor(private readonly value: string) {}

  public static create(value: string): Email {
    if (!Email.isValid(value)) {
      throw new Error('Invalid email format');
    }
    return new Email(value.toLowerCase().trim());
  }

  public static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  public getValue(): string {
    return this.value;
  }

  public getDomain(): string {
    return this.value.split('@')[1]!;
  }

  public getLocalPart(): string {
    return this.value.split('@')[0]!;
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
