import 'reflect-metadata';
import { NestFactory, APP_GUARD } from '@nestjs/core';
import {
  Module,
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
  RawBodyRequest,
} from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { SwaggerModule, DocumentBuilder, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { compare } from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import Stripe from 'stripe';
import type { Request, Response, NextFunction } from 'express';
import {
  calculatePrice,
  cartTotal,
  products,
  priceBook,
  availableSlots,
  leadsCsv,
  type Lead,
  type PriceBook,
  type Configuration,
} from '@nordhaus/domain';
import { Database } from './database.js';
import { LoginDto, LeadDto, BookingDto, StageDto, CheckoutDto, PriceDto } from './dto.js';
import { AccessGuard, Roles, type AuthRequest } from './auth.js';
import { Events } from './events.js';
import { Mail } from './mail.js';
import { quotePdf } from './pdf.js';
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  path: '/auth',
  maxAge: 7 * 86400000,
};
@Controller('auth')
@ApiTags('Autoryzacja')
class AuthController {
  constructor(
    private db: Database,
    private jwt: JwtService,
  ) {}
  private async issue(user: { id: string; role: string }, res: Response) {
    const token = randomBytes(48).toString('hex');
    await this.db.refreshToken.create({
      data: {
        hash: digest(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
    res.cookie('refresh', token, cookieOptions);
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, role: user.role }),
      role: user.role,
    };
  }
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() input: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.db.user.findUnique({ where: { email: input.email } });
    if (!user || !(await compare(input.password, user.password)))
      throw new UnauthorizedException('Nieprawidłowe dane logowania');
    return this.issue(user, res);
  }
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.refresh;
    if (typeof raw !== 'string') throw new UnauthorizedException();
    const token = await this.db.refreshToken.findUnique({
      where: { hash: digest(raw) },
      include: { user: true },
    });
    if (!token || token.expiresAt < new Date()) throw new UnauthorizedException();
    const consumed = await this.db.refreshToken.deleteMany({ where: { id: token.id } });
    if (!consumed.count) throw new UnauthorizedException();
    return this.issue(token.user, res);
  }
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.refresh;
    if (typeof raw === 'string')
      await this.db.refreshToken.deleteMany({ where: { hash: digest(raw) } });
    res.clearCookie('refresh', cookieOptions);
    return { ok: true };
  }
}
@Controller()
@ApiTags('Nordhaus')
class AppController {
  constructor(
    private db: Database,
    private events: Events,
  ) {}
  private async prices() {
    const setting = await this.db.setting.findUnique({ where: { key: 'priceBook' } });
    return (setting?.value as unknown as PriceBook) || priceBook;
  }
  @Get('health') async health() {
    await this.db.$queryRaw`SELECT 1`;
    return { status: 'ok', mode: 'test-payments-only' };
  }
  @Get('catalog') catalog() {
    return products;
  }
  @Get('pricing') pricing() {
    return this.prices();
  }
  @Patch('pricing')
  @UseGuards(AccessGuard)
  @Roles('admin')
  @ApiBearerAuth()
  async updatePricing(@Body() input: PriceDto) {
    await this.db.setting.upsert({
      where: { key: 'priceBook' },
      update: { value: input as unknown as Prisma.InputJsonValue },
      create: { key: 'priceBook', value: input as unknown as Prisma.InputJsonValue },
    });
    return input;
  }
  @Get('bookings/slots') async slots(
    @Query('day') day: string,
    @Query('employee') employee: string,
  ) {
    const rows = await this.db.booking.findMany({ where: { employee } });
    return availableSlots(
      day,
      employee,
      rows.map((b) => ({ ...b, start: b.start.toISOString() })),
    );
  }
  @Post('bookings')
  async booking(@Body() input: BookingDto) {
    const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(
      new Date(input.start),
    );
    const start = new Date(input.start).toISOString();
    if (!(await this.slots(day, input.employee)).includes(start))
      throw new ConflictException('Termin jest niedostępny');
    try {
      const result = await this.db.$transaction(async (tx) => {
        const b = await tx.booking.create({ data: { ...input, start: new Date(start) } });
        await tx.outbox.create({
          data: {
            to: input.email,
            subject: 'Nordhaus — potwierdzenie konsultacji DEMO',
            text: `Termin: ${new Date(start).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}. Projekt koncepcyjny: spotkanie nie odbędzie się.`,
          },
        });
        return b;
      });
      this.events.emit('Nowa rezerwacja');
      return result;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
        throw new ConflictException('Termin jest już zajęty');
      throw err;
    }
  }
  @Get('bookings')
  @UseGuards(AccessGuard)
  @Roles('admin', 'employee', 'client')
  @ApiBearerAuth()
  async bookings(@Req() req: AuthRequest) {
    if (req.user.role === 'client') {
      const user = await this.db.user.findUnique({ where: { id: req.user.sub } });
      return this.db.booking.findMany({
        where: { email: user?.email || 'invalid' },
        orderBy: { start: 'asc' },
      });
    }
    return this.db.booking.findMany({ orderBy: { start: 'asc' } });
  }
  @Post('leads')
  async createLead(@Body() input: LeadDto) {
    const config = input.configuration;
    const gross = config ? calculatePrice(config, await this.prices()).gross : 0;
    const lead = await this.db.$transaction(async (tx) => {
      const result = await tx.lead.create({
        data: {
          ...input,
          configuration: config as unknown as Prisma.InputJsonValue,
          value: gross,
          source: config ? 'Konfigurator 3D' : 'Formularz',
        },
      });
      await tx.outbox.createMany({
        data: [input.email, process.env.COMPANY_EMAIL || 'studio@example.com'].map((to) => ({
          to,
          subject: 'Nordhaus — zapytanie DEMO',
          text: `Zapytanie ${result.id} zostało zapisane. Projekt koncepcyjny, brak sprzedaży.`,
          configuration: config as unknown as Prisma.InputJsonValue,
        })),
      });
      return result;
    });
    this.events.emit('Nowe zapytanie');
    return { id: lead.id };
  }
  @Get('leads')
  @UseGuards(AccessGuard)
  @Roles('admin', 'employee')
  @ApiBearerAuth()
  leads() {
    return this.db.lead.findMany({ orderBy: { createdAt: 'desc' } });
  }
  @Patch('leads/:id')
  @UseGuards(AccessGuard)
  @Roles('admin', 'employee')
  @ApiBearerAuth()
  async stage(@Param('id') id: string, @Body() input: StageDto) {
    const found = await this.db.lead.findUnique({ where: { id } });
    if (!found) throw new NotFoundException();
    const lead = await this.db.lead.update({ where: { id }, data: { stage: input.stage } });
    this.events.emit('Zmieniono etap zapytania');
    return lead;
  }
  @Get('customers')
  @UseGuards(AccessGuard)
  @Roles('admin', 'employee')
  @ApiBearerAuth()
  async customers() {
    const leads = await this.db.lead.findMany();
    const bookings = await this.db.booking.findMany();
    const emails = [...new Set([...leads.map((l) => l.email), ...bookings.map((b) => b.email)])];
    return emails.map((email) => ({
      email,
      leads: leads.filter((l) => l.email === email),
      bookings: bookings.filter((b) => b.email === email),
    }));
  }
  @Get('leads-export')
  @UseGuards(AccessGuard)
  @Roles('admin', 'employee')
  @ApiBearerAuth()
  async csv(@Res() res: Response) {
    const rows = await this.db.lead.findMany();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.send(
      leadsCsv(
        rows.map((l) => ({
          ...l,
          stage: l.stage as Lead['stage'],
          createdAt: l.createdAt.toISOString(),
        })),
      ),
    );
  }
  @Get('leads/:id/pdf')
  @UseGuards(AccessGuard)
  @Roles('admin', 'employee')
  @ApiBearerAuth()
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const lead = await this.db.lead.findUnique({ where: { id } });
    if (!lead || !lead.configuration) throw new NotFoundException('Brak konfiguracji');
    const pdf = await quotePdf(
      id,
      lead.configuration as unknown as Configuration,
      await this.prices(),
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="nordhaus-oferta.pdf"');
    res.send(pdf);
  }
  @Get('reports')
  @UseGuards(AccessGuard)
  @Roles('admin', 'employee')
  @ApiBearerAuth()
  async reports() {
    const rows = await this.db.lead.findMany();
    if (!process.env.INSIGHTS_URL)
      throw new ServiceUnavailableException('Usługa Python nie jest skonfigurowana');
    try {
      const response = await fetch(`${process.env.INSIGHTS_URL}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Key': process.env.INSIGHTS_KEY || '',
        },
        body: JSON.stringify({ leads: rows }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error();
      return await response.json();
    } catch {
      throw new ServiceUnavailableException('Raporty są chwilowo niedostępne');
    }
  }
  @Post('checkout')
  async checkout(@Body() input: CheckoutDto) {
    let total: number;
    try {
      total = cartTotal(input.items);
    } catch {
      throw new BadRequestException('Nieprawidłowy koszyk');
    }
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key?.startsWith('sk_test_'))
      throw new ServiceUnavailableException('Skonfiguruj Stripe wyłącznie w trybie testowym');
    const stripe = new Stripe(key);
    const order = await this.db.order.create({
      data: { email: input.email, items: input.items as unknown as Prisma.InputJsonValue, total },
    });
    try {
      const session = await stripe.checkout.sessions.create(
        {
          mode: 'payment',
          customer_email: input.email,
          client_reference_id: order.id,
          metadata: { orderId: order.id },
          line_items: input.items.map((item) => {
            const p = products.find((p) => p.id === item.productId)!;
            return {
              quantity: item.quantity,
              price_data: {
                currency: 'pln',
                unit_amount: p.price,
                product_data: { name: `${p.name} / ${item.color} / ${item.size}` },
              },
            };
          }),
          success_url: `${process.env.FRONTEND_URL}/cart/?payment=success`,
          cancel_url: `${process.env.FRONTEND_URL}/cart/?payment=cancelled`,
        },
        { idempotencyKey: order.id },
      );
      await this.db.order.update({ where: { id: order.id }, data: { stripeId: session.id } });
      return { url: session.url };
    } catch {
      await this.db.order.update({ where: { id: order.id }, data: { status: 'failed' } });
      throw new ServiceUnavailableException('Nie udało się utworzyć płatności testowej');
    }
  }
  @Post('stripe/webhook')
  async webhook(@Req() req: RawBodyRequest<Request>) {
    const key = process.env.STRIPE_SECRET_KEY;
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!key?.startsWith('sk_test_') || !secret) throw new ServiceUnavailableException();
    const stripe = new Stripe(key);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody!,
        req.headers['stripe-signature'] as string,
        secret,
      );
    } catch {
      throw new BadRequestException('Nieprawidłowy podpis');
    }
    if (event.livemode) throw new BadRequestException('Tryb live niedozwolony');
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await this.db.order.updateMany({
        where: { stripeId: session.id, status: 'pending', total: session.amount_total || 0 },
        data: { status: 'paid-test' },
      });
    }
    return { received: true };
  }
}
@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '15m' } }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
  ],
  controllers: [AppController, AuthController],
  providers: [
    Database,
    Events,
    Mail,
    AccessGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
class AppModule {}
async function bootstrap() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error('JWT_SECRET musi mieć min. 32 znaki');
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableShutdownHooks();
  app.use(helmet());
  app.use(cookieParser());
  const origins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:4200').split(
    ',',
  );
  app.enableCors({ origin: origins, credentials: true });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      req.headers.origin &&
      !origins.includes(req.headers.origin)
    ) {
      res.status(403).json({ message: 'Niedozwolone pochodzenie' });
      return;
    }
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Nordhaus Studio API')
        .setDescription('Projekt koncepcyjny — fikcyjna marka')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build(),
    ),
  );
  await app.listen(Number(process.env.PORT || 4000), '0.0.0.0');
}
void bootstrap();
