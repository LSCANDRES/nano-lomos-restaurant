import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

export interface CreateTableDto {
  number: string;
  name?: string;
  capacity?: number;
  position_x?: number;
  position_y?: number;
}

export interface UpdateTableDto {
  number?: string;
  name?: string;
  capacity?: number;
  position_x?: number;
  position_y?: number;
  is_active?: boolean;
}

export class TablesService {
  static async getAllTables(includeInactive: boolean = false) {
    try {
      const tablesList = await prisma.tables.findMany({
        where: includeInactive ? {} : { is_active: true },
        orderBy: [{ number: 'asc' }],
        include: {
          orders: {
            where: {
              status: {
                in: ['pending', 'assigned', 'in_progress', 'ready_to_deliver'],
              },
            },
            select: {
              id: true,
              status: true,
              total_amount: true,
              created_at: true,
              started_at: true,
              completed_at: true,
            },
            take: 1,
            orderBy: { created_at: 'desc' },
          },
        },
      });

      // Calcular estado dinámico de la mesa
      return tablesList.map((t) => {
        const activeOrder = t.orders[0];
        let status: 'libre' | 'pendiente' | 'cocinando' | 'para_entregar' = 'libre';

        if (activeOrder) {
          if (activeOrder.status === 'ready_to_deliver') {
            status = 'para_entregar';
          } else if (activeOrder.status === 'in_progress' || activeOrder.status === 'assigned') {
            status = 'cocinando';
          } else {
            status = 'pendiente';
          }
        }

        return {
          id: t.id,
          number: t.number,
          name: t.name || `Mesa ${t.number}`,
          capacity: t.capacity || 4,
          position_x: t.position_x,
          position_y: t.position_y,
          is_active: t.is_active,
          status,
          currentOrder: activeOrder || null,
        };
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error al listar mesas');
      throw error;
    }
  }

  static async getTableById(id: number) {
    const table = await prisma.tables.findUnique({
      where: { id },
      include: {
        orders: {
          take: 5,
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!table) {
      throw new Error('Mesa no encontrada');
    }

    return table;
  }

  static async createTable(data: CreateTableDto) {
    if (!data.number || data.number.trim() === '') {
      throw new Error('El número o identificador de la mesa es requerido');
    }

    const existing = await prisma.tables.findUnique({
      where: { number: data.number.trim() },
    });

    if (existing) {
      throw new Error(`Ya existe una mesa con el número ${data.number}`);
    }

    const created = await prisma.tables.create({
      data: {
        number: data.number.trim(),
        name: data.name?.trim() || `Mesa ${data.number}`,
        capacity: data.capacity || 4,
        position_x: data.position_x,
        position_y: data.position_y,
        is_active: true,
      },
    });

    logger.info({ tableId: created.id, number: created.number }, 'Mesa creada');
    return created;
  }

  static async updateTable(id: number, data: UpdateTableDto) {
    const table = await prisma.tables.findUnique({ where: { id } });
    if (!table) {
      throw new Error('Mesa no encontrada');
    }

    if (data.number && data.number.trim() !== table.number) {
      const existing = await prisma.tables.findUnique({
        where: { number: data.number.trim() },
      });
      if (existing) {
        throw new Error(`El número de mesa ${data.number} ya está en uso`);
      }
    }

    const updated = await prisma.tables.update({
      where: { id },
      data: {
        ...(data.number !== undefined && { number: data.number.trim() }),
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.position_x !== undefined && { position_x: data.position_x }),
        ...(data.position_y !== undefined && { position_y: data.position_y }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    });

    logger.info({ tableId: id }, 'Mesa actualizada');
    return updated;
  }

  static async deleteTable(id: number) {
    const table = await prisma.tables.findUnique({ where: { id } });
    if (!table) {
      throw new Error('Mesa no encontrada');
    }

    // Soft delete para preservar el historial de comandas
    const updated = await prisma.tables.update({
      where: { id },
      data: { is_active: false },
    });

    logger.info({ tableId: id }, 'Mesa desactivada (soft-delete)');
    return updated;
  }
}
