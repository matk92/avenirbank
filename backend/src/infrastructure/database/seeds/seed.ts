import { DataSource } from 'typeorm';
import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserTypeOrmEntity, UserRoleEnum } from '../entities/user.typeorm.entity';
import { ConversationTypeOrmEntity, ConversationStatusEnum } from '../entities/conversation.typeorm.entity';
import { MessageTypeOrmEntity } from '../entities/message.typeorm.entity';
import { NotificationTypeOrmEntity } from '../entities/notification.typeorm.entity';
import { ActivityTypeOrmEntity } from '../entities/activity.typeorm.entity';
import { GroupMessageTypeOrmEntity } from '../entities/group-message.typeorm.entity';
import { StockTypeOrmEntity } from '../entities/stock.typeorm.entity';
import { InvestmentWalletTypeOrmEntity } from '../entities/investment-wallet.typeorm.entity';
import { StockHoldingTypeOrmEntity } from '../entities/stock-holding.typeorm.entity';
// Import all migrations
import { CreateUsersTable1730000000000 } from '../migrations/1730000000000-create-users-table';
import { CreateMessagingTables1730000000001 } from '../migrations/1730000000001-create-messaging-tables';
import { UpdateConversationsForAllUsers1730000000002 } from '../migrations/1730000000002-update-conversations-for-all-users';
import { CreateInvestmentTables1730000000003 } from '../migrations/1730000000003-create-investment-tables';

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
    entities: [
      UserTypeOrmEntity,
      ConversationTypeOrmEntity,
      MessageTypeOrmEntity,
      NotificationTypeOrmEntity,
      ActivityTypeOrmEntity,
      GroupMessageTypeOrmEntity,
      StockTypeOrmEntity,
      InvestmentWalletTypeOrmEntity,
      StockHoldingTypeOrmEntity,
    ],
    migrations: [
      CreateUsersTable1730000000000,
      CreateMessagingTables1730000000001,
      UpdateConversationsForAllUsers1730000000002,
      CreateInvestmentTables1730000000003,
    ],
    logging: true,
  });

  await dataSource.initialize();
  await dataSource.runMigrations();

  const userRepo = dataSource.getRepository(UserTypeOrmEntity);
  const conversationRepo = dataSource.getRepository(ConversationTypeOrmEntity);
  const messageRepo = dataSource.getRepository(MessageTypeOrmEntity);
  const notificationRepo = dataSource.getRepository(NotificationTypeOrmEntity);
  const activityRepo = dataSource.getRepository(ActivityTypeOrmEntity);
  const groupMessageRepo = dataSource.getRepository(GroupMessageTypeOrmEntity);
  const stockRepo = dataSource.getRepository(StockTypeOrmEntity);
  const walletRepo = dataSource.getRepository(InvestmentWalletTypeOrmEntity);
  const holdingRepo = dataSource.getRepository(StockHoldingTypeOrmEntity);

  const directorEmail = process.env.SEED_DIRECTOR_EMAIL ?? 'director@avenir.test';
  const directorPassword = process.env.SEED_DIRECTOR_PASSWORD ?? 'Director123!';
  const advisorEmail = process.env.SEED_ADVISOR_EMAIL ?? 'advisor@avenir.test';
  const advisorPassword = process.env.SEED_ADVISOR_PASSWORD ?? 'Advisor123!';

  const ensureUser = async (input: {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRoleEnum;
  }) => {
    const existing = await userRepo.findOne({ where: { email: input.email } });
    if (existing) {
      existing.firstName = input.firstName;
      existing.lastName = input.lastName;
      existing.role = input.role;
      existing.isEmailConfirmed = true;
      // Ensure seeded users are always considered verified.
      // Explicitly clear any verification token/expiry that may exist from previous runs.
      (existing as any).emailConfirmationToken = null;
      (existing as any).emailConfirmationTokenExpiry = null;
      existing.isBanned = false;
      existing.passwordHash = await hash(input.password, 10);
      await userRepo.save(existing);
      return existing;
    }

    const entity = new UserTypeOrmEntity();
    entity.id = input.id;
    entity.email = input.email;
    entity.firstName = input.firstName;
    entity.lastName = input.lastName;
    entity.passwordHash = await hash(input.password, 10);
    entity.role = input.role;
    entity.isEmailConfirmed = true;
    // Keep the DB clean: no pending verification token for seed users.
    (entity as any).emailConfirmationToken = null;
    (entity as any).emailConfirmationTokenExpiry = null;
    entity.isBanned = false;
    await userRepo.save(entity);
    return entity;
  };

  const directorId = '00000000-0000-0000-0000-000000000001';
  const advisorId = '00000000-0000-0000-0000-000000000002';
  const client1Id = '00000000-0000-0000-0000-000000000003';
  const client2Id = '00000000-0000-0000-0000-000000000004';

  const director = await ensureUser({
    id: directorId,
    email: directorEmail,
    password: directorPassword,
    firstName: 'Directeur',
    lastName: 'Avenir',
    role: UserRoleEnum.DIRECTOR,
  });

  const advisor = await ensureUser({
    id: advisorId,
    email: advisorEmail,
    password: advisorPassword,
    firstName: 'Conseiller',
    lastName: 'Avenir',
    role: UserRoleEnum.ADVISOR,
  });

  const client1 = await ensureUser({
    id: client1Id,
    email: 'client1@avenir.test',
    password: 'Client123!',
    firstName: 'Marie',
    lastName: 'Dupont',
    role: UserRoleEnum.CLIENT,
  });

  const client2 = await ensureUser({
    id: client2Id,
    email: 'client2@avenir.test',
    password: 'Client123!',
    firstName: 'Jean',
    lastName: 'Martin',
    role: UserRoleEnum.CLIENT,
  });

  const ensureWallet = async (userId: string, cashCents: bigint) => {
    const existing = await walletRepo.findOne({ where: { userId } });
    if (existing) return existing;
    const entity = new InvestmentWalletTypeOrmEntity();
    entity.userId = userId;
    entity.cashCents = String(cashCents);
    await walletRepo.save(entity);
    return entity;
  };

  await ensureWallet(director.id, 0n);
  await ensureWallet(advisor.id, 0n);
  await ensureWallet(client1.id, 250_000n);
  await ensureWallet(client2.id, 120_000n);

  const ensureStock = async (input: { id: string; symbol: string; name: string; priceCents: number; isAvailable: boolean }) => {
    const existing = await stockRepo.findOne({ where: { id: input.id } });
    if (existing) return existing;
    const entity = new StockTypeOrmEntity();
    entity.id = input.id;
    entity.symbol = input.symbol;
    entity.name = input.name;
    entity.isAvailable = input.isAvailable;
    entity.initialPriceCents = input.priceCents;
    entity.lastPriceCents = input.priceCents;
    await stockRepo.save(entity);
    return entity;
  };

  await ensureStock({ id: '00000000-0000-0000-0100-000000000001', symbol: 'AVA', name: 'Avenir Alliance', priceCents: 4215, isAvailable: true });
  const stockNeo = await ensureStock({ id: '00000000-0000-0000-0100-000000000002', symbol: 'NEO', name: 'Neo Energie', priceCents: 1840, isAvailable: true });
  const stockSol = await ensureStock({ id: '00000000-0000-0000-0100-000000000003', symbol: 'SOL', name: 'Solidarité Tech', priceCents: 6790, isAvailable: true });

  const ensureHolding = async (userId: string, stockId: string, qty: number) => {
    const existing = await holdingRepo.findOne({ where: { userId, stockId } });
    if (existing) {
      if (existing.quantity !== qty) {
        existing.quantity = qty;
        await holdingRepo.save(existing);
      }
      return existing;
    }
    const entity = new StockHoldingTypeOrmEntity();
    entity.id = uuidv4();
    entity.userId = userId;
    entity.stockId = stockId;
    entity.quantity = qty;
    await holdingRepo.save(entity);
    return entity;
  };

  await ensureHolding(client2.id, stockNeo.id, 15);
  await ensureHolding(client1.id, stockSol.id, 5);



  const conv1Id = '00000000-0000-0000-0001-000000000001';
  const conv2Id = '00000000-0000-0000-0001-000000000002';
  const conv3Id = '00000000-0000-0000-0001-000000000003';

  const ensureConversation = async (input: {
    id: string;
    user1Id: string;
    user2Id: string;
    status: ConversationStatusEnum;
  }) => {
    const existing = await conversationRepo.findOne({ where: { id: input.id } });
    if (existing) return existing;

    const entity = new ConversationTypeOrmEntity();
    entity.id = input.id;
    entity.user1Id = input.user1Id;
    entity.user2Id = input.user2Id;
    entity.status = input.status;
    entity.unreadCountUser1 = 0;
    entity.unreadCountUser2 = 0;
    entity.clientId = input.user1Id;
    entity.advisorId = input.user2Id;
    entity.unreadCount = 0;
    await conversationRepo.save(entity);
    return entity;
  };


  await ensureConversation({
    id: conv1Id,
    user1Id: client1.id,
    user2Id: advisor.id,
    status: ConversationStatusEnum.ACTIVE,
  });

  await ensureConversation({
    id: conv2Id,
    user1Id: client2.id,
    user2Id: advisor.id,
    status: ConversationStatusEnum.ACTIVE,
  });

  await ensureConversation({
    id: conv3Id,
    user1Id: advisor.id,
    user2Id: director.id,
    status: ConversationStatusEnum.ACTIVE,
  });


  const ensureMessage = async (input: {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderRole: UserRoleEnum;
    content: string;
  }) => {
    const existing = await messageRepo.findOne({ where: { id: input.id } });
    if (existing) return existing;

    const entity = new MessageTypeOrmEntity();
    entity.id = input.id;
    entity.conversationId = input.conversationId;
    entity.senderId = input.senderId;
    entity.senderName = input.senderName;
    entity.senderRole = input.senderRole;
    entity.content = input.content;
    entity.read = false;
    await messageRepo.save(entity);
    return entity;
  };

  await ensureMessage({
    id: '00000000-0000-0000-0002-000000000001',
    conversationId: conv1Id,
    senderId: client1.id,
    senderName: `${client1.firstName} ${client1.lastName}`,
    senderRole: UserRoleEnum.CLIENT,
    content: 'Bonjour, j\'aimerais obtenir des informations sur les crédits immobiliers.',
  });

  await ensureMessage({
    id: '00000000-0000-0000-0002-000000000002',
    conversationId: conv1Id,
    senderId: advisor.id,
    senderName: `${advisor.firstName} ${advisor.lastName}`,
    senderRole: UserRoleEnum.ADVISOR,
    content: 'Bonjour Marie ! Bien sûr, je serais ravi de vous aider. Quel est votre projet immobilier ?',
  });

  await ensureMessage({
    id: '00000000-0000-0000-0002-000000000003',
    conversationId: conv1Id,
    senderId: client1.id,
    senderName: `${client1.firstName} ${client1.lastName}`,
    senderRole: UserRoleEnum.CLIENT,
    content: 'Je souhaite acheter un appartement à Paris, budget autour de 400 000€.',
  });

  await ensureMessage({
    id: '00000000-0000-0000-0002-000000000004',
    conversationId: conv2Id,
    senderId: client2.id,
    senderName: `${client2.firstName} ${client2.lastName}`,
    senderRole: UserRoleEnum.CLIENT,
    content: 'Bonjour, je suis nouveau client et j\'ai quelques questions sur mon compte.',
  });


  const ensureNotification = async (input: {
    id: string;
    recipientId: string;
    message: string;
  }) => {
    const existing = await notificationRepo.findOne({ where: { id: input.id } });
    if (existing) return existing;

    const entity = new NotificationTypeOrmEntity();
    entity.id = input.id;
    entity.recipientId = input.recipientId;
    entity.message = input.message;
    entity.read = false;
    await notificationRepo.save(entity);
    return entity;
  };

  await ensureNotification({
    id: '00000000-0000-0000-0003-000000000001',
    recipientId: client1.id,
    message: 'Bienvenue chez AVENIR Bank ! Votre conseiller vous contactera sous 24h.',
  });

  await ensureNotification({
    id: '00000000-0000-0000-0003-000000000002',
    recipientId: client1.id,
    message: 'Votre demande de crédit a été reçue et est en cours d\'analyse.',
  });

  await ensureNotification({
    id: '00000000-0000-0000-0003-000000000003',
    recipientId: client2.id,
    message: 'Bienvenue chez AVENIR Bank ! Découvrez nos offres d\'épargne.',
  });


  const ensureActivity = async (input: {
    id: string;
    title: string;
    description: string;
    authorId: string;
    authorName: string;
  }) => {
    const existing = await activityRepo.findOne({ where: { id: input.id } });
    if (existing) return existing;

    const entity = new ActivityTypeOrmEntity();
    entity.id = input.id;
    entity.title = input.title;
    entity.description = input.description;
    entity.authorId = input.authorId;
    entity.authorName = input.authorName;
    await activityRepo.save(entity);
    return entity;
  };

  await ensureActivity({
    id: '00000000-0000-0000-0004-000000000001',
    title: 'Nouveau livret climat disponible',
    description: 'Découvrez notre nouveau livret dédié au financement de projets verts avec un taux attractif.',
    authorId: director.id,
    authorName: `${director.firstName} ${director.lastName}`,
  });

  await ensureActivity({
    id: '00000000-0000-0000-0004-000000000002',
    title: 'Partenariat économie sociale',
    description: 'AVENIR Bank s\'engage avec des acteurs locaux pour financer des initiatives solidaires.',
    authorId: advisor.id,
    authorName: `${advisor.firstName} ${advisor.lastName}`,
  });

  await ensureActivity({
    id: '00000000-0000-0000-0004-000000000003',
    title: 'Webinaire investisseurs responsables',
    description: 'Inscrivez-vous à notre prochain webinaire sur les marchés responsables et l\'ESG.',
    authorId: director.id,
    authorName: `${director.firstName} ${director.lastName}`,
  });


  const ensureGroupMessage = async (input: {
    id: string;
    room: string;
    authorId: string;
    authorName: string;
    authorRole: UserRoleEnum;
    content: string;
  }) => {
    const existing = await groupMessageRepo.findOne({ where: { id: input.id } });
    if (existing) return existing;

    const entity = new GroupMessageTypeOrmEntity();
    entity.id = input.id;
    entity.room = input.room;
    entity.authorId = input.authorId;
    entity.authorName = input.authorName;
    entity.authorRole = input.authorRole;
    entity.content = input.content;
    await groupMessageRepo.save(entity);
    return entity;
  };

  await ensureGroupMessage({
    id: '00000000-0000-0000-0005-000000000001',
    room: 'all-staff',
    authorId: director.id,
    authorName: `${director.firstName} ${director.lastName}`,
    authorRole: UserRoleEnum.DIRECTOR,
    content: 'Bonjour à tous ! Rappel : réunion d\'équipe demain à 10h.',
  });

  await ensureGroupMessage({
    id: '00000000-0000-0000-0005-000000000002',
    room: 'all-staff',
    authorId: advisor.id,
    authorName: `${advisor.firstName} ${advisor.lastName}`,
    authorRole: UserRoleEnum.ADVISOR,
    content: 'Bien noté ! J\'apporterai les croissants',
  });


  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});