import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(
    userId: string | null,
    action: string,
    details?: Prisma.InputJsonValue,
    metadata?: { ip?: string; userAgent?: string },
  ) {
    return this.prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        details: details ?? {},
        ipAddress: metadata?.ip,
        userAgent: metadata?.userAgent,
      },
    });
  }

  async findAll(limit = 50) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, role: true },
        },
      },
    });
  }
}