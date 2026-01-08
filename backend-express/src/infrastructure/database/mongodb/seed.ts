import dotenv from 'dotenv';
import { MongoDBConnection } from './connection';
import { UserModel } from './schemas/UserSchema';
import { AccountModel } from './schemas/AccountSchema';
import { BcryptPasswordService } from '../../services/BcryptPasswordService';
import { UserRole } from '@domain/entities/User';
import { AccountType } from '@domain/entities/Account';
import { IBAN } from '@domain/value-objects/IBAN';

dotenv.config();

async function seed(): Promise<void> {
  try {
    console.log('Starting database seeding...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avenirbank';
    const connection = MongoDBConnection.getInstance();
    await connection.connect(mongoUri);

    // Clear existing data
    console.log('Clearing existing data...');
    await UserModel.deleteMany({});
    await AccountModel.deleteMany({});

    const passwordService = new BcryptPasswordService();

    // Create test users
    console.log('Creating test users...');

    // 1. Client user
    const clientPassword = await passwordService.hash('Client123!');
    const clientUser = await UserModel.create({
      email: 'client@avenirbank.fr',
      password: clientPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: UserRole.CLIENT,
      isEmailVerified: true,
      emailVerificationToken: undefined
    });
    console.log('Created client user: client@avenirbank.fr / Client123!');

    // 2. Advisor user
    const advisorPassword = await passwordService.hash('Advisor123!');
    await UserModel.create({
      email: 'advisor@avenirbank.fr',
      password: advisorPassword,
      firstName: 'Marie',
      lastName: 'Martin',
      role: UserRole.ADVISOR,
      isEmailVerified: true,
      emailVerificationToken: undefined
    });
    console.log('Created advisor user: advisor@avenirbank.fr / Advisor123!');

    // 3. Director user
    const directorPassword = await passwordService.hash('Director123!');
    await UserModel.create({
      email: 'director@avenirbank.fr',
      password: directorPassword,
      firstName: 'Pierre',
      lastName: 'Bernard',
      role: UserRole.DIRECTOR,
      isEmailVerified: true,
      emailVerificationToken: undefined
    });
    console.log('Created director user: director@avenirbank.fr / Director123!');

    // Create test accounts for client
    console.log('Creating test accounts...');

    const checkingIban = IBAN.generate();
    const checkingAccount = await AccountModel.create({
      userId: clientUser._id.toString(),
      name: 'Compte Courant',
      iban: checkingIban.getValue(),
      balance: 1000.00,
      type: AccountType.CHECKING
    });
    console.log(`Created checking account: ${checkingAccount.name} (${checkingIban.getFormattedValue()})`);

    const savingsIban = IBAN.generate();
    const savingsAccount = await AccountModel.create({
      userId: clientUser._id.toString(),
      name: 'Compte Épargne',
      iban: savingsIban.getValue(),
      balance: 5000.00,
      type: AccountType.SAVINGS
    });
    console.log(`Created savings account: ${savingsAccount.name} (${savingsIban.getFormattedValue()})`);

    console.log('\nDatabase seeding completed successfully!');
    console.log('\nTest Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CLIENT:');
    console.log('  Email: client@avenirbank.fr');
    console.log('  Password: Client123!');
    console.log('  Accounts: 2 (Checking: €1,000.00, Savings: €5,000.00)');
    console.log('\nADVISOR:');
    console.log('  Email: advisor@avenirbank.fr');
    console.log('  Password: Advisor123!');
    console.log('\nDIRECTOR:');
    console.log('  Email: director@avenirbank.fr');
    console.log('  Password: Director123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await connection.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
