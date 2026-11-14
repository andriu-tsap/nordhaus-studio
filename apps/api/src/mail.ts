import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { Database } from './database.js';
import { quotePdf } from './pdf.js';
import type { Configuration } from '@nordhaus/domain';
@Injectable()
export class Mail implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private working = false;
  private logger = new Logger(Mail.name);
  constructor(private db: Database) {}
  onModuleInit() {
    this.timer = setInterval(() => void this.flush(), 10000);
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  /** A single API instance owns this outbox. Multiple replicas require row leasing. */
  async flush() {
    if (this.working || !process.env.SMTP_HOST) return;
    this.working = true;
    try {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 1025),
        secure: process.env.SMTP_SECURE === 'true',
        ...(process.env.SMTP_USER
          ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } }
          : {}),
      });
      const jobs = await this.db.outbox.findMany({
        where: { sentAt: null, attempts: { lt: 3 } },
        take: 10,
        orderBy: { createdAt: 'asc' },
      });
      for (const job of jobs) {
        await this.db.outbox.update({
          where: { id: job.id },
          data: { attempts: { increment: 1 } },
        });
        try {
          const attachment = job.configuration
            ? await quotePdf(job.id, job.configuration as unknown as Configuration)
            : null;
          await transport.sendMail({
            from: process.env.MAIL_FROM || 'Nordhaus Demo <demo@example.com>',
            to: job.to,
            subject: job.subject,
            text: job.text,
            attachments: attachment
              ? [{ filename: 'nordhaus-oferta.pdf', content: attachment }]
              : [],
          });
          await this.db.outbox.update({ where: { id: job.id }, data: { sentAt: new Date() } });
        } catch {
          this.logger.warn(`Nie wysłano wiadomości ${job.id}; próba ${job.attempts + 1}`);
        }
      }
    } catch {
      this.logger.error('Błąd kolejki e-mail');
    } finally {
      this.working = false;
    }
  }
}
