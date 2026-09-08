export const dynamic = 'force-dynamic';
export default async function sitemap() {
  const baseUrl = 'https://ruhmusafir.in';

  // 1. Static Routes (Excluding auth pages like login, profile)
  const staticRoutes = [
    '',
    '/our-legacy',
    '/our-stories',
    '/rooms',
    '/experiences',
    '/cafe',
    '/contact',
    '/privacy-policy',
    '/terms-and-conditions',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Dynamic Blog Routes
  let blogRoutes = [];
  try {
    const blogsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ruhmusafir.com'}/our-stories`, { 
      // Cache the fetch to prevent hitting the backend too frequently during sitemap generation
      next: { revalidate: 3600 } 
    });
    if (blogsRes.ok) {
      const data = await blogsRes.json();
      const blogs = data.data?.blogs || [];
      blogRoutes = blogs
        .filter(b => b.isPublished !== false && b.seoIsNoIndex !== true) // Only index published, non-noindex blogs
        .map((blog) => ({
          url: `${baseUrl}/our-stories/${blog.slug}`,
          lastModified: new Date(blog.updatedAt || blog.createdAt),
          changeFrequency: 'weekly',
          priority: 0.7,
        }));
    }
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error);
  }

  // 3. Dynamic Room Routes
  let roomRoutes = [];
  try {
    const roomsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms`, { 
      next: { revalidate: 3600 } 
    });
    if (roomsRes.ok) {
      const data = await roomsRes.json();
      // The API response format depends on the controller, usually data or data.rooms
      const rooms = data.data?.rooms || data.data || [];
      roomRoutes = (Array.isArray(rooms) ? rooms : [])
        .filter(r => r.isActive !== false) // Only index active rooms
        .map((room) => ({
          url: `${baseUrl}/rooms/${room.slug || room.id}`,
          lastModified: new Date(room.updatedAt || room.createdAt || new Date()),
          changeFrequency: 'weekly',
          priority: 0.9,
        }));
    }
  } catch (error) {
    console.error('Error fetching rooms for sitemap:', error);
  }

  return [...staticRoutes, ...roomRoutes, ...blogRoutes];
}
