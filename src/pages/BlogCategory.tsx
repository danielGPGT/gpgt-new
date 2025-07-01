import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/layout/Footer';
import { Calendar, User, Tag, ArrowLeft } from 'lucide-react';

// Same posts data as Blog.tsx
const posts = [
  {
    slug: 'welcome-to-the-blog',
    title: 'Welcome to the AItinerary Blog',
    date: '2024-06-10',
    author: 'AItinerary Team',
    category: 'Company',
    excerpt: 'Discover product updates, travel tech trends, and tips for OTAs and tour operators. We\'re excited to share insights that will help you grow your travel business.',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop',
    readTime: '3 min read'
  },
  {
    slug: 'ai-in-travel',
    title: 'How AI is Transforming B2B Travel',
    date: '2024-06-09',
    author: 'Sarah Johnson',
    category: 'Technology',
    excerpt: 'Explore how artificial intelligence is revolutionizing itinerary building and client service. From automated recommendations to predictive pricing, AI is changing everything.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
    readTime: '5 min read'
  },
  {
    slug: 'commission-tracking-best-practices',
    title: 'Commission Tracking Best Practices for Travel Agencies',
    date: '2024-06-08',
    author: 'Michael Chen',
    category: 'Business',
    excerpt: 'Learn the essential strategies for tracking commissions effectively. Discover tools and techniques that will help you maximize your earnings and streamline your operations.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
    readTime: '7 min read'
  },
  {
    slug: 'luxury-travel-trends-2024',
    title: 'Luxury Travel Trends to Watch in 2024',
    date: '2024-06-07',
    author: 'Emma Rodriguez',
    category: 'Trends',
    excerpt: 'Stay ahead of the curve with our analysis of the latest luxury travel trends. From experiential travel to sustainable luxury, discover what your clients are looking for.',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=400&fit=crop',
    readTime: '6 min read'
  },
  {
    slug: 'building-client-relationships',
    title: 'Building Lasting Client Relationships in Travel',
    date: '2024-06-06',
    author: 'David Thompson',
    category: 'Sales',
    excerpt: 'Master the art of building and maintaining strong client relationships. Learn proven strategies for client retention and referrals in the competitive travel industry.',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
    readTime: '8 min read'
  },
  {
    slug: 'digital-marketing-for-travel-agencies',
    title: 'Digital Marketing Strategies for Travel Agencies',
    date: '2024-06-05',
    author: 'Lisa Wang',
    category: 'Marketing',
    excerpt: 'Discover effective digital marketing strategies tailored for travel agencies. From social media to email campaigns, learn how to attract and convert more clients.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    readTime: '9 min read'
  }
];

export function BlogCategory() {
  const { category } = useParams();
  
  // Filter posts by category
  const categoryPosts = posts.filter(post => 
    post.category.toLowerCase() === category?.toLowerCase()
  );

  // Get all unique categories for navigation
  const categories = [...new Set(posts.map(post => post.category))];

  if (categoryPosts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <section className="py-24 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--muted)]/30">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
            <p className="text-muted-foreground mb-8">The category "{category}" doesn't exist.</p>
            <Link to="/blog" className="text-[var(--primary)] hover:underline">Back to Blog</Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="py-24 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--muted)]/30">
        <div className="container mx-auto px-4">
          <Link to="/blog" className="inline-flex items-center text-[var(--primary)] hover:underline mb-8 group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>
          
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">{category} Posts</h1>
            <p className="text-xl text-muted-foreground mb-8">
              {categoryPosts.length} article{categoryPosts.length !== 1 ? 's' : ''} in {category}
            </p>
            
            {/* Category Navigation */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map(cat => (
                <Link 
                  key={cat}
                  to={`/blog/category/${cat.toLowerCase()}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    cat.toLowerCase() === category?.toLowerCase()
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-white/80 text-[var(--foreground)] hover:bg-white'
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categoryPosts.map(post => (
              <Card key={post.slug} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-white/90 text-[var(--foreground)]">
                      {post.category}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author}
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2 group-hover:text-[var(--primary)] transition-colors">
                    {post.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    {post.readTime}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground leading-relaxed">{post.excerpt}</p>
                  <Link 
                    to={`/blog/${post.slug}`} 
                    className="inline-flex items-center text-[var(--primary)] font-semibold hover:underline group/link"
                  >
                    Read More 
                    <span className="ml-1 group-hover/link:translate-x-1 transition-transform">→</span>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
} 