import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import TableOfContents from '@/components/our-stories/TableOfContents';
import StoryFaq from '@/components/our-stories/StoryFaq';

import GlareHover from '@/components/Glarehover'

export const revalidate = 300;
// 1. DYNAMIC METADATA ENGINE
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/our-stories/${slug}`, { cache: 'no-store' });
    const data = await res.json();
    if (!data.success || !data.data?.blog) return {};

    const blog = data.data.blog;
    return {
      title: blog.seoMetaTitle || `${blog.title} | Ruh Musafir`,
      description: blog.seoMetaDescription || blog.excerpt || "Read our latest insights.",
      keywords: blog.seoMetaKeywords || "",
      alternates: {
        canonical: blog.seoCanonicalUrl || `https://ruhmusafir.com/our-stories/${blog.slug}`,
      },
      robots: blog.seoIsNoIndex ? "noindex, nofollow" : "index, follow",
      openGraph: {
        title: blog.seoMetaTitle || blog.title,
        description: blog.seoMetaDescription || blog.excerpt,
        url: `https://ruhmusafir.com/our-stories/${blog.slug}`,
        type: 'article',
        images: blog.coverImage ? [{ url: blog.coverImage }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: blog.seoMetaTitle || blog.title,
        description: blog.seoMetaDescription || blog.excerpt,
        images: blog.coverImage ? [blog.coverImage] : [],
      }
    };
  } catch (error) {
    return {};
  }
}

// 2. SERVER COMPONENT PAGE
export default async function SingleStoryPage({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  let blog = null;
  let similarBlogs = [];
  let allCategories = [];

  try {
    // Fetch Single Blog
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/our-stories/${slug}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.data?.blog) {
      blog = data.data.blog;

      // Fetch All Blogs (to filter for similar blogs and categories)
      const resAll = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/our-stories`, { cache: 'no-store' });
      const dataAll = await resAll.json();
      if (dataAll.success && dataAll.data?.blogs) {
        const publishedBlogs = dataAll.data.blogs.filter(b => b.isPublished);
        allCategories = [...new Set(publishedBlogs.map(b => b.category))].filter(Boolean);
        similarBlogs = publishedBlogs.filter(b => b.category === blog.category && b.id !== blog.id).slice(0, 3);

        // Recommendation Engine Fallback: If no blogs in this exact category, show the latest published blogs
        if (similarBlogs.length === 0) {
          similarBlogs = publishedBlogs.filter(b => b.id !== blog.id).slice(0, 3);
        }
      }
    }
  } catch (err) {
    console.error("Fetch error", err);
  }

  if (!blog) return notFound();

  // Inject JSON-LD Schema
  const jsonLd = blog.seoJsonLdSchema ? (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: blog.seoJsonLdSchema }}
    />
  ) : null;

  return (
    <main className="min-h-screen pt-32 pb-12">
      {jsonLd}

      <div className="container px-4 sm:px-6 lg:px-8">

        {/* HEADER SECTION */}
        <div className="max-w-6xl mx-auto text-center pt-8 pb-2.5">
          {blog.category && (
            <Link href={`/our-stories?category=${encodeURIComponent(blog.category)}`} className="inline-block bg-primary text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6 shadow-sm hover:bg-secondary transition-colors z-10">
              {blog.category}
            </Link>
          )}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary leading-tight mb-6 tracking-tight z-10">
            {blog.title}
          </h1>
          <div className="pr-2.5 flex items-center justify-end gap-4 text-foreground/70 font-medium z-10">

            <span className="text-primary">{blog.customAuthor || blog.author?.name || 'Admin'}</span>
            <span>•</span>
            <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* FEATURED IMAGE */}
        {blog.coverImage && (
          <div className="max-w-6xl mx-auto relative mb-16 z-0">
            {/* The rotated background square */}
            <div className="absolute -inset-4 md:-inset-6 bg-secondary/10 rounded-[3rem] transform -rotate-1 scale-105 -z-10"></div>

            <GlareHover glareColor="#e9eaffff" glareOpacity={0.3} glareAngle={-30} glareSize={300} transitionDuration={800} playOnce={false} className="w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl border-0" >
              <Image
                src={blog.coverImage.startsWith('http') ? blog.coverImage : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${blog.coverImage}`}
                alt={blog.title}
                fill
                sizes="100vw"
                priority
                className="object-cover object-top hover:scale-105 transition transform duration-500"
              />
            </GlareHover>
          </div>
        )}

        {/* CONTENT GRID (TOC + ARTICLE + SIDEBAR) */}
        <div className="flex flex-col lg:flex-row gap-12 mt-16">

          {/* Main Article Content */}
          <article className="flex-1 min-w-0 z-10">
            {/* The blog-content class is used by TableOfContents to find headings */}
            <div
              className="blog-content prose prose-lg prose-blue max-w-none prose-headings:font-bold prose-headings:text-primary prose-headings:scroll-mt-28 prose-a:text-secondary hover:prose-a:opacity-80 prose-img:rounded-2xl prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Dynamic FAQs */}
            <StoryFaq faqs={blog.faqs} />
          </article>

          {/* Right Sidebar (TOC & Categories) */}
          <aside className="lg:w-80 shrink-0 sticky top-24 h-fit flex flex-col gap-8">
            <TableOfContents />

            <div className="bg-white/5 backdrop-blur-md border border-primary/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-primary mb-4 tracking-tight uppercase">Categories</h3>
              <ul className="space-y-2">
                {allCategories.map(cat => (
                  <li key={cat}>
                    <Link href={`/our-stories?category=${encodeURIComponent(cat)}`} className="text-foreground/70 hover:text-secondary font-medium transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* SIMILAR BLOGS SECTION */}
        {similarBlogs.length > 0 && (
          <div className="mt-24 pt-16 border-t border-gray-200">
            <h3 className="text-3xl font-extrabold text-primary mb-8">Recommended for You</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {similarBlogs.map(similar => (
                <Link href={`/our-stories/${similar.slug}`} key={similar.id} className="group block bg-white/5 backdrop-blur-md border border-primary/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={similar.coverImage ? (similar.coverImage.startsWith('http') ? similar.coverImage : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${similar.coverImage}`) : '/default-placeholder.png'}
                      alt={similar.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    />
                  </div>
                  <div className="p-6">
                    <h4 className="text-lg font-bold text-primary mb-2 group-hover:text-primary transition-colors line-clamp-2">{similar.title}</h4>
                    <p className="text-foreground/70 text-sm line-clamp-2">{similar.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
