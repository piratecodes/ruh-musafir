"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import GlareHover from '@/components/Glarehover'

export default function StoryClientGrid({ initialBlogs, categories }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = searchParams.get('category') || '';
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchQuery(searchTerm);
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Sync state with URL
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    if (cat !== selectedCategory) {
      setSelectedCategory(cat);
    }
  }, [searchParams, selectedCategory]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    router.push(cat ? `/our-stories?category=${encodeURIComponent(cat)}` : '/our-stories', { scroll: false });
  };

  const filteredBlogs = initialBlogs.filter(blog => {
    const matchesSearch = blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? blog.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const recent5Blogs = initialBlogs.slice(0, 5);
  const isDefaultView = !searchQuery && !selectedCategory;

  // Category Counts
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = initialBlogs.filter(b => b.category === cat).length;
    return acc;
  }, {});


  // Main Card Component to avoid duplication
  const BlogCard = ({ blog }) => (
    <Link href={`/our-stories/${blog.slug}`} key={blog.id} className="group bg-white/5 backdrop-blur-md border border-primary/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full z-10">
      <div className="relative h-48 w-full overflow-hidden shrink-0">
        <Image
          src={blog.coverImage ? (blog.coverImage.startsWith('http') ? blog.coverImage : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${blog.coverImage}`) : '/default-placeholder.png'}
          alt={blog.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
        />
      </div>
      <div className="p-6 flex-1 flex flex-col">
        {blog.category && <span className="text-[#c5a059] text-xs font-bold uppercase tracking-wider mb-2">{blog.category}</span>}
        <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-[#372fa0] transition-colors line-clamp-2">{blog.title}</h3>
        <p className="text-foreground/70 text-sm mb-4 line-clamp-3 flex-1">{blog.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-foreground/70 font-medium pt-4 border-t border-gray-100 mt-auto">
          <span className="text-primary">{blog.customAuthor || blog.author?.name || 'Admin'}</span>
          <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-12">

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 min-w-0">

          {/* Default View: Hero + Category Rows */}
          {isDefaultView ? (
            <div className="space-y-16">

              {/* HERO FEATURE */}
              {initialBlogs.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-3xl font-extrabold text-primary mb-8 tracking-tight">Latest Insight</h2>
                  <Link href={`/our-stories/${initialBlogs[0].slug}`} className="group relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 block bg-white h-[400px] md:h-[500px]">
                    <GlareHover glareColor="#e9eaffff" glareOpacity={0.3} glareAngle={-30} glareSize={300} transitionDuration={800} playOnce={false} className="w-full h-full">
                      {/* <figure className='w-full h-80 relative'>
                        <Image src={initialBlogs[0].coverImage || '/default-placeholder.png'} alt={initialBlogs[0].title} width={0} height={0} sizes='100vw'className="object-contain group-hover:scale-105 transition-transform duration-700 ease-in-out" />
                      </figure> */}
                      <figure className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl border-0" >
                        <Image
                          src={initialBlogs[0].coverImage ? (initialBlogs[0].coverImage.startsWith('http') ? initialBlogs[0].coverImage : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${initialBlogs[0].coverImage}`) : '/default-placeholder.png'} alt={initialBlogs[0].title}
                          fill sizes="100vw" priority className="object-cover object-top hover:scale-110 transition transform duration-500"
                        />
                      </figure>
                      <div className="absolute inset-0 bg-linear-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-3/4">
                        {initialBlogs[0].category && (
                          <span className="inline-block bg-[#c5a059] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 shadow-md">
                            {initialBlogs[0].category}
                          </span>
                        )}
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-[#d4b472] transition-colors drop-shadow-md">{initialBlogs[0].title}</h3>
                        <p className="text-gray-200 text-base md:text-lg mb-4 line-clamp-2 drop-shadow-sm">{initialBlogs[0].excerpt}</p>
                        <div className="flex items-center text-gray-300 text-sm font-medium">
                          <span>{initialBlogs[0].customAuthor || initialBlogs[0].author?.name || 'Admin'}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(initialBlogs[0].createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </GlareHover>
                  </Link>
                </div>
              )}

              {/* CATEGORY ROWS */}
              {categories.map(cat => {
                const catBlogs = initialBlogs.filter(b => b.category === cat && b.id !== initialBlogs[0]?.id).slice(0, 4);
                if (catBlogs.length === 0) return null;

                return (
                  <div key={cat} className="pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold text-primary">{cat}</h3>
                      <button onClick={() => handleCategorySelect(cat)} className="text-sm font-bold text-secondary hover:animate-pulse hover:cursor-pointer flex items-center gap-1 transition-colors z-10">
                        Show More <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 z-10">
                      {catBlogs.map(blog => <BlogCard key={blog.id} blog={blog} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (

            /* FILTERED / SEARCH VIEW */
            <div>
              <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-primary">
                  {searchQuery ? `Search Results for "${searchQuery}"` : selectedCategory ? `${selectedCategory} Articles` : 'All Articles'}
                </h2>
                <span className="text-sm font-medium text-foreground/70 bg-gray-100 px-3 py-1 rounded-full">{filteredBlogs.length} posts</span>
              </div>

              {filteredBlogs.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xl font-bold text-primary">No articles found.</p>
                  <p className="text-foreground/70 mt-2">Try adjusting your search or category filter.</p>
                  <button onClick={() => { setSearchQuery(''); handleCategorySelect(''); }} className="mt-6 bg-[#112440] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#372fa0] transition-colors">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {filteredBlogs.map(blog => <BlogCard key={blog.id} blog={blog} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:w-80 shrink-0 sticky top-24 h-fit flex-col gap-8 hidden lg:flex">

          {/* SEARCH BOX */}
          <div className="bg-white/5 backdrop-blur-md border border-primary/10 shadow-sm rounded-3xl p-6">
            <h3 className="text-lg font-bold text-primary mb-4 tracking-tight">Search Articles</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059] focus:border-transparent transition-all shadow-inner text-primary"
              />
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button onClick={() => { setSearchTerm(''); setSearchQuery(''); }} className="mt-3 text-xs text-foreground/70 hover:text-primary font-medium w-full text-right">
                Clear Search
              </button>
            )}
          </div>

          {/* CATEGORIES AUTO */}
          <div className="bg-white/5 backdrop-blur-md border border-primary/10 shadow-sm rounded-3xl p-6">
            <h3 className="text-lg font-bold text-primary mb-4 tracking-tight">Categories</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`w-full flex items-center justify-between text-sm font-medium p-3 rounded-xl transition-colors ${!selectedCategory ? 'bg-[#112440] text-white shadow-md' : 'text-gray-700 bg-gray-50 hover:bg-gray-100'}`}
                >
                  <span>All Articles</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${!selectedCategory ? 'bg-white/20 text-white' : 'bg-gray-200 text-foreground/70'}`}>
                    {initialBlogs.length}
                  </span>
                </button>
              </li>
              {categories.map(cat => (
                <li key={cat}>
                  <button
                    onClick={() => handleCategorySelect(cat)}
                    className={`w-full flex items-center justify-between text-sm font-medium p-3 rounded-xl transition-colors ${selectedCategory === cat ? 'bg-[#112440] text-white shadow-md' : 'text-gray-700 bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <span>{cat}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-gray-200 text-foreground/70'}`}>
                      {categoryCounts[cat] || 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* RECENT 5 POSTS */}
          <div className="bg-white/5 backdrop-blur-md border border-primary/10 shadow-sm rounded-3xl p-6">
            <h3 className="text-lg font-bold text-primary mb-4 tracking-tight">Recent Posts</h3>
            <div className="space-y-4">
              {recent5Blogs.map(blog => (
                <Link href={`/our-stories/${blog.slug}`} key={blog.id} className="group flex items-start gap-4 hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors">
                  <figure className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                    <Image src={blog.coverImage ? (blog.coverImage.startsWith('http') ? blog.coverImage : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${blog.coverImage}`) : '/default-placeholder.png'} alt={blog.title} fill sizes="64px" className="object-cover" />
                  </figure>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-primary line-clamp-2 group-hover:text-[#c5a059] transition-colors">{blog.title}</h4>
                    <span className="text-xs text-foreground/70 mt-1 block">{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </aside>

        {/* MOBILE SIDEBAR (Visible only on smaller screens, no sticky) */}
        <aside className="w-full shrink-0 space-y-8 lg:hidden flex flex-col gap-8">
          {/* SEARCH BOX */}
          <div className="bg-white/5 backdrop-blur-md border border-primary/10 shadow-sm rounded-3xl p-6">
            <h3 className="text-lg font-bold text-primary mb-4 tracking-tight">Search Articles</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059] focus:border-transparent transition-all shadow-inner text-primary"
              />
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button onClick={() => { setSearchTerm(''); setSearchQuery(''); }} className="mt-3 text-xs text-foreground/70 hover:text-primary font-medium w-full text-right">
                Clear Search
              </button>
            )}
          </div>

          {/* CATEGORIES AUTO */}
          <div className="bg-white/5 backdrop-blur-md border border-primary/10 shadow-sm rounded-3xl p-6">
            <h3 className="text-lg font-bold text-primary mb-4 tracking-tight">Categories</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`w-full flex items-center justify-between text-sm font-medium p-3 rounded-xl transition-colors ${!selectedCategory ? 'bg-[#112440] text-white shadow-md' : 'text-gray-700 bg-gray-50 hover:bg-gray-100'}`}
                >
                  <span>All Articles</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${!selectedCategory ? 'bg-white/20 text-white' : 'bg-gray-200 text-foreground/70'}`}>
                    {initialBlogs.length}
                  </span>
                </button>
              </li>
              {categories.map(cat => (
                <li key={cat}>
                  <button
                    onClick={() => handleCategorySelect(cat)}
                    className={`w-full flex items-center justify-between text-sm font-medium p-3 rounded-xl transition-colors ${selectedCategory === cat ? 'bg-[#112440] text-white shadow-md' : 'text-gray-700 bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <span>{cat}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-gray-200 text-foreground/70'}`}>
                      {categoryCounts[cat] || 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

      </div>
    </div>
  );
}
