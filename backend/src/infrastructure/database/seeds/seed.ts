import { DataSource } from 'typeorm';
import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserTypeOrmEntity, UserRoleEnum } from '../entities/user.typeorm.entity';

function parseDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: Number(url.port || '5432'),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  };
}

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  const configFromUrl = databaseUrl ? parseDatabaseUrl(databaseUrl) : null;

  const dataSource = new DataSource({
    type: 'postgres',
    host: configFromUrl?.host ?? process.env.DATABASE_HOST ?? 'postgres',
    port: configFromUrl?.port ?? Number(process.env.DATABASE_PORT ?? '5432'),
    username: configFromUrl?.username ?? process.env.DATABASE_USER ?? 'avenir',
    password: configFromUrl?.password ?? process.env.DATABASE_PASSWORD ?? 'password',
    database: configFromUrl?.database ?? process.env.DATABASE_NAME ?? 'avenirbank',
    entities: [UserTypeOrmEntity],
  });

  await dataSource.initialize();
  const repo = dataSource.getRepository(UserTypeOrmEntity);

  const directorEmail = process.env.SEED_DIRECTOR_EMAIL ?? 'director@avenir.test';
  const directorPassword = process.env.SEED_DIRECTOR_PASSWORD ?? 'Director123!';
  const advisorEmail = process.env.SEED_ADVISOR_EMAIL ?? 'advisor@avenir.test';
  const advisorPassword = process.env.SEED_ADVISOR_PASSWORD ?? 'Advisor123!';

  const ensureUser = async (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRoleEnum;
  }) => {
    const existing = await repo.findOne({ where: { email: input.email } });
    if (existing) {
      return;
    }

    const entity = new UserTypeOrmEntity();
    entity.id = uuidv4();
    entity.email = input.email;
    entity.firstName = input.firstName;
    entity.lastName = input.lastName;
    entity.passwordHash = await hash(input.password, 10);
    entity.role = input.role;
    entity.isEmailConfirmed = true;
    entity.isBanned = false;
    await repo.save(entity);
  };

  await ensureUser({
    email: directorEmail,
    password: directorPassword,
    firstName: 'Directeur',
    lastName: 'Avenir',
    role: UserRoleEnum.DIRECTOR,
  });

  await ensureUser({
    email: advisorEmail,
    password: advisorPassword,
    firstName: 'Conseiller',
    lastName: 'Avenir',
    role: UserRoleEnum.ADVISOR,
  });

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});


