import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Calendar, User, Tag } from 'lucide-react';
import { useState } from 'react';
import { posts } from '@/data/blogPosts';

export function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Get all unique categories
  const categories = ['All', ...new Set(posts.map(post => post.category))];
  
  // Filter posts by selected category
  const filteredPosts = selectedCategory && selectedCategory !== 'All' 
    ? posts.filter(post => post.category === selectedCategory)
    : posts;

  return (
    <div className="min-h-screen bg-background">
      <section className="py-24 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--muted)]/30">
        <div className="container mx-auto px-4 text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">AItinerary Blog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Insights, updates, and inspiration for travel professionals
          </p>
          
          {/* Category Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === 'All' ? null : category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (selectedCategory === category) || (!selectedCategory && category === 'All')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-white/80 text-[var(--foreground)] hover:bg-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Category Links for Programmatic SEO */}
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Or browse by category:</span>
            {categories.slice(1).map(category => (
              <Link
                key={category}
                to={`/blog/category/${category.toLowerCase()}`}
                className="text-[var(--primary)] hover:underline text-sm"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map(post => (
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
      </section>
      <Footer />
    </div>
  );
} 