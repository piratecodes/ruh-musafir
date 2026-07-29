import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateStoryDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  faqs?: any[];

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  coverImageAlt?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  customAuthor?: string;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  seoMetaTitle?: string;

  @IsOptional()
  @IsString()
  seoMetaDescription?: string;

  @IsOptional()
  @IsString()
  seoMetaKeywords?: string;

  @IsOptional()
  @IsString()
  seoCanonicalUrl?: string;

  @IsOptional()
  @IsBoolean()
  seoIsNoIndex?: boolean;

  @IsOptional()
  @IsString()
  seoJsonLdSchema?: string;
}

export class UpdateStoryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  faqs?: any[];

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  coverImageAlt?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  customAuthor?: string;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  seoMetaTitle?: string;

  @IsOptional()
  @IsString()
  seoMetaDescription?: string;

  @IsOptional()
  @IsString()
  seoMetaKeywords?: string;

  @IsOptional()
  @IsString()
  seoCanonicalUrl?: string;

  @IsOptional()
  @IsBoolean()
  seoIsNoIndex?: boolean;

  @IsOptional()
  @IsString()
  seoJsonLdSchema?: string;
}
