import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  // PUBLIC: Only returns rooms that are active
  async findAllActive() {
    return this.prisma.room.findMany({
      where: { isActive: true },
      include: { beds: true }, // Include beds so the website knows how many bunks are left
      orderBy: { roomNumber: 'asc' }
    });
  }

  // ADMIN: Returns everything so you can manage deactivated inventory
  async findAllForAdmin() {
    return this.prisma.room.findMany({
      include: { beds: true },
      orderBy: { roomNumber: 'asc' }
    });
  }

  // Handles both Creation and Updating with nested Beds AND Gallery Images
  // Handles both Creation and Updating with nested Beds AND Gallery Images
  async saveRoom(data: any) {
    const formattedSlug = data.slug ? data.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined;
    // 1. CREATE NEW ROOM
    if (!data.id) {
      return this.prisma.room.create({
        data: {
          name: data.name,
          slug: formattedSlug,
          roomNumber: data.roomNumber,
          type: data.type,
          capacity: data.capacity,
          basePrice: data.basePrice,
          description: data.description, // <-- NEW
          bedSize: data.bedSize,         // <-- NEW
          images: data.images, 
          beds: data.type === 'DORM' ? {
            create: data.beds.map(b => ({ name: b.name, status: b.status }))
          } : undefined
        }
      });
    }

    // 2. UPDATE EXISTING ROOM
    return this.prisma.room.update({
      where: { id: data.id },
      data: {
        name: data.name,
        roomNumber: data.roomNumber,
        type: data.type,
        slug: data.slug,
        capacity: data.capacity,
        basePrice: data.basePrice,
        description: data.description, // <-- NEW
        bedSize: data.bedSize,         // <-- NEW
        images: data.images, 
        // Wipe old beds and recreate them to ensure the DB matches the React form exactly
        beds: data.type === 'DORM' ? {
          deleteMany: {},
          create: data.beds.map(b => ({ name: b.name, status: b.status }))
        } : { deleteMany: {} } 
      }
    });
  }

  // SOFT DELETE (Deactivate)
  async toggleActive(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');
    
    return this.prisma.room.update({
      where: { id },
      data: { isActive: !room.isActive } 
    });
  }

  // HARD DELETE
  async hardDelete(id: string) {
    try {
      await this.prisma.room.delete({ where: { id } });
      return { success: true };
    } catch (e) {
      // If a room has bookings tied to it, Prisma will block the hard delete to protect your financial records.
      throw new BadRequestException('Cannot hard delete this room because it has historical bookings. Please Deactivate it instead.');
    }
  }

  // PUBLIC: Find a single active room by its slug
  async findBySlug(slug: string) {
    return this.prisma.room.findUnique({
      where: { 
        slug: slug,
        isActive: true // Make sure they can't view deactivated rooms directly!
      },
      include: { beds: true }
    });
  }
}