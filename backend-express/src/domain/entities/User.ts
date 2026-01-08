export enum UserRole {
  CLIENT = 'CLIENT',
  ADVISOR = 'ADVISOR',
  DIRECTOR = 'DIRECTOR'
}

export interface UserProps {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  public static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
    const now = new Date();
    return new User({
      ...props,
      id: '', // Will be set by repository
      createdAt: now,
      updatedAt: now
    });
  }

  public static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getEmail(): string {
    return this.props.email;
  }

  public getPassword(): string {
    return this.props.password;
  }

  public getFirstName(): string {
    return this.props.firstName;
  }

  public getLastName(): string {
    return this.props.lastName;
  }

  public getFullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  public getRole(): UserRole {
    return this.props.role;
  }

  public isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }

  public getEmailVerificationToken(): string | undefined {
    return this.props.emailVerificationToken;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public verifyEmail(): void {
    this.props.isEmailVerified = true;
    delete this.props.emailVerificationToken;
    this.props.updatedAt = new Date();
  }

  public updatePassword(newPassword: string): void {
    this.props.password = newPassword;
    this.props.updatedAt = new Date();
  }

  public toPlainObject(): UserProps {
    return { ...this.props };
  }

  public toPublicObject(): Omit<UserProps, 'password' | 'emailVerificationToken'> {
    const { password, emailVerificationToken, ...publicProps } = this.props;
    return publicProps;
  }
}
