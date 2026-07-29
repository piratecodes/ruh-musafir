import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateStoryDto, UpdateStoryDto } from './dto/our-stories.dto';
import * as sanitizeHtml from 'sanitize-html';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OurStoriesService {
  constructor(private prisma: PrismaService) {}

  private generateAutomatedSchema(story: any, authorName: string): string {
    const schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": story.seoMetaTitle || story.title,
      "description": story.seoMetaDescription || story.excerpt || "",
      "image": story.coverImage ? [story.coverImage] : [],
      "author": {
        "@type": "Person",
        "name": authorName || "Ruh Musafir"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Ruh Musafir",
        "logo": {
          "@type": "ImageObject",
          "url": "https://ruhmusafir.com/logo.png"
        }
      },
      "datePublished": story.createdAt || new Date().toISOString(),
      "dateModified": story.updatedAt || new Date().toISOString()
    };
    return JSON.stringify(schema);
  }

  async create(createStoryDto: CreateStoryDto, authorId: string) {
    const existing = await this.prisma.story.findUnique({
      where: { slug: createStoryDto.slug },
    });
    if (existing) throw new BadRequestException('A story with this slug already exists.');

    const author = await this.prisma.user.findUnique({ where: { id: authorId } });
    const authorName = author ? `${author.firstName} ${author.lastName}` : 'Admin';

    let finalSchema = createStoryDto.seoJsonLdSchema;
    if (!finalSchema || finalSchema.trim() === '') {
      finalSchema = this.generateAutomatedSchema(createStoryDto, authorName);
    }

    const cleanContent = createStoryDto.content ? sanitizeHtml(createStoryDto.content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span']),
      allowedAttributes: false,
      allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'data'],
    }) : undefined;

    return this.prisma.story.create({
      data: {
        ...createStoryDto,
        content: cleanContent || createStoryDto.content,
        faqs: createStoryDto.faqs as any,
        authorId: createStoryDto.authorId ? createStoryDto.authorId : authorId,
        seoJsonLdSchema: finalSchema,
      },
      include: { author: { select: { firstName: true, lastName: true, profilePic: true } } }
    });
  }

  async findAll() {
    return this.prisma.story.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { firstName: true, lastName: true, profilePic: true } } }
    });
  }

  async findOne(slug: string) {
    const story = await this.prisma.story.findUnique({
      where: { slug },
      include: { author: { select: { firstName: true, lastName: true, profilePic: true, bio: true } } }
    });
    if (!story) throw new NotFoundException('Story not found');
    return story;
  }

  async update(id: string, updateStoryDto: UpdateStoryDto) {
    const existing = await this.prisma.story.findUnique({ where: { id }, include: { author: true } });
    if (!existing) throw new NotFoundException('Story not found');

    if (updateStoryDto.slug && updateStoryDto.slug !== existing.slug) {
      const slugCheck = await this.prisma.story.findUnique({
        where: { slug: updateStoryDto.slug },
      });
      if (slugCheck) throw new BadRequestException('A story with this slug already exists.');
    }

    const authorName = existing.author ? `${existing.author.firstName} ${existing.author.lastName}` : 'Admin';

    let finalSchema = updateStoryDto.seoJsonLdSchema;
    if (!finalSchema || finalSchema.trim() === '') {
      const mergedForSchema = { ...existing, ...updateStoryDto };
      finalSchema = this.generateAutomatedSchema(mergedForSchema, authorName);
    }

    const cleanContent = updateStoryDto.content ? sanitizeHtml(updateStoryDto.content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span']),
      allowedAttributes: false,
      allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'data'],
    }) : undefined;

    // Delete old image if it was replaced or removed
    if (existing.coverImage && existing.coverImage.startsWith('/uploads/our-stories/') && (updateStoryDto.coverImage !== existing.coverImage)) {
      const fileName = existing.coverImage.replace('/uploads/our-stories/', '');
      const filePath = path.join(process.cwd(), 'uploads', 'our-stories', fileName);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error('Failed to delete old image', e); }
      }
    }

    return this.prisma.story.update({
      where: { id },
      data: {
        ...updateStoryDto,
        content: cleanContent || updateStoryDto.content,
        faqs: updateStoryDto.faqs ? (updateStoryDto.faqs as any) : undefined,
        seoJsonLdSchema: finalSchema,
      },
      include: { author: { select: { firstName: true, lastName: true, profilePic: true } } }
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.story.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Story not found');
    
    // Delete associated image
    if (existing.coverImage && existing.coverImage.startsWith('/uploads/our-stories/')) {
      const fileName = existing.coverImage.replace('/uploads/our-stories/', '');
      const filePath = path.join(process.cwd(), 'uploads', 'our-stories', fileName);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error('Failed to delete image', e); }
      }
    }

    return this.prisma.story.delete({ where: { id } });
  }

  async getCategories() {
    const stories = await this.prisma.story.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
    return stories.map(s => s.category).filter(c => c && c.trim() !== '');
  }
}
