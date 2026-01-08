import { User, UserProps } from '@domain/entities/User';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { UserModel, IUserDocument } from '../schemas/UserSchema';

export class MongoUserRepository implements IUserRepository {
  public async create(user: User): Promise<User> {
    const userProps = user.toPlainObject();
    const userDoc = new UserModel({
      ...userProps,
      _id: undefined // Let MongoDB generate the ID
    });
    
    const savedDoc = await userDoc.save();
    return this.mapToEntity(savedDoc);
  }

  public async findById(id: string): Promise<User | null> {
    const userDoc = await UserModel.findById(id);
    return userDoc ? this.mapToEntity(userDoc) : null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const userDoc = await UserModel.findOne({ email: email.toLowerCase() });
    return userDoc ? this.mapToEntity(userDoc) : null;
  }

  public async findByEmailVerificationToken(token: string): Promise<User | null> {
    const userDoc = await UserModel.findOne({ emailVerificationToken: token });
    return userDoc ? this.mapToEntity(userDoc) : null;
  }

  public async update(user: User): Promise<User> {
    const userProps = user.toPlainObject();
    const updatedDoc = await UserModel.findByIdAndUpdate(
      userProps.id,
      {
        email: userProps.email,
        password: userProps.password,
        firstName: userProps.firstName,
        lastName: userProps.lastName,
        role: userProps.role,
        isEmailVerified: userProps.isEmailVerified,
        emailVerificationToken: userProps.emailVerificationToken,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      throw new Error('User not found');
    }

    return this.mapToEntity(updatedDoc);
  }

  public async delete(id: string): Promise<void> {
    const result = await UserModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('User not found');
    }
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  private mapToEntity(doc: IUserDocument): User {
    const props: UserProps = {
      id: (doc as any)._id.toString(),
      email: doc.email,
      password: doc.password,
      firstName: doc.firstName,
      lastName: doc.lastName,
      role: doc.role,
      isEmailVerified: doc.isEmailVerified,
      ...(doc.emailVerificationToken && { emailVerificationToken: doc.emailVerificationToken }),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };

    return User.fromPersistence(props);
  }
}
