import React, { Suspense } from 'react';
import BlogClientGrid from '@/components/our-stories/StoryClientGrid';

export const metadata = {
  title: "Blogs & Insights",
  description: "Read our latest articles, moving tips, and company news to help you plan your next relocation smoothly.",
};
export const revalidate = 300;
export default async function OurStoriesPage() {
  let blogs = [];
  let categories = [];

  try {
    console.log("Fetching fresh blogs...");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/our-stories`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.data?.blogs) {
      blogs = data.data.blogs.filter(b => b.isPublished);
    }

    // Extract unique categories from published blogs
    categories = [...new Set(blogs.map(b => b.category))].filter(Boolean);
  } catch (err) {
    console.error("Failed to fetch blogs", err);
  }

  return (
    <main className="min-h-screen pt-32 pb-12">
      <div className="py-8 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 tracking-tight">Our Stories</h1>
          <p className="text-lg text-foreground/70">Expert insights, experiences, and the latest news from Ruh Musafir.</p>
        </div>
      </div>

      <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
        <BlogClientGrid initialBlogs={blogs} categories={categories} />
      </Suspense>
    </main>
  );
}
