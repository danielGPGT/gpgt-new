import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/layout/Footer';
import { Calendar, User, Tag, ArrowLeft, Mail, Linkedin } from 'lucide-react';

// Enhanced posts data with author details
const posts = [
  {
    slug: 'welcome-to-the-blog',
    title: 'Welcome to the AItinerary Blog',
    date: '2024-06-10',
    author: 'AItinerary Team',
    authorSlug: 'aitinerary-team',
    authorBio: 'The official team behind AItinerary, sharing insights and updates about our platform.',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
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
    authorSlug: 'sarah-johnson',
    authorBio: 'Technology expert with 10+ years in travel tech. Passionate about AI and its impact on the industry.',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop',
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
    authorSlug: 'michael-chen',
    authorBio: 'Business consultant specializing in travel agency operations and revenue optimization.',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
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
    authorSlug: 'emma-rodriguez',
    authorBio: 'Luxury travel specialist with expertise in high-end client experiences and market trends.',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
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
    authorSlug: 'david-thompson',
    authorBio: 'Sales trainer and relationship expert helping travel professionals build lasting client connections.',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
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
    authorSlug: 'lisa-wang',
    authorBio: 'Digital marketing strategist focused on helping travel businesses grow their online presence.',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    category: 'Marketing',
    excerpt: 'Discover effective digital marketing strategies tailored for travel agencies. From social media to email campaigns, learn how to attract and convert more clients.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    readTime: '9 min read'
  }
];

export function BlogAuthor() {
  const { authorSlug } = useParams();
  
  // Find author and their posts
  const authorPosts = posts.filter(post => post.authorSlug === authorSlug);
  const author = authorPosts[0]; // Get author info from first post

  if (!author || authorPosts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <section className="py-24 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--muted)]/30">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-4">Author Not Found</h1>
            <p className="text-muted-foreground mb-8">The author "{authorSlug}" doesn't exist.</p>
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
        <div className="container mx-auto px-4 max-w-6xl">
          <Link to="/blog" className="inline-flex items-center text-[var(--primary)] hover:underline mb-8 group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>
          
          {/* Author Profile */}
          <div className="text-center mb-16">
            <div className="flex flex-col items-center">
              <img 
                src={author.authorAvatar} 
                alt={author.author}
                className="w-24 h-24 rounded-full mb-6 object-cover"
              />
              <h1 className="text-4xl font-bold mb-4">{author.author}</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mb-6">{author.authorBio}</p>
              <div className="flex items-center gap-4">
                <a href={`mailto:${author.authorSlug}@aitinerary.com`} className="flex items-center gap-2 text-[var(--primary)] hover:underline">
                  <Mail className="h-4 w-4" />
                  Contact
                </a>
                <a href="#" className="flex items-center gap-2 text-[var(--primary)] hover:underline">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
          
          {/* Author's Posts */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Articles by {author.author}</h2>
            <p className="text-muted-foreground mb-8">
              {authorPosts.length} article{authorPosts.length !== 1 ? 's' : ''} published
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {authorPosts.map(post => (
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      {post.readTime}
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2 group-hover:text-[var(--primary)] transition-colors">
                    {post.title}
                  </CardTitle>
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