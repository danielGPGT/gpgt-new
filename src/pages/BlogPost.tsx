import { useParams, Link } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Tag, ArrowLeft, Share2 } from 'lucide-react';

const posts = [
  {
    slug: 'welcome-to-the-blog',
    title: 'Welcome to the AItinerary Blog',
    date: '2024-06-10',
    author: 'AItinerary Team',
    category: 'Company',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop',
    content: `
      <p>Welcome to the AItinerary blog! We're excited to launch this platform where we'll share insights, updates, and valuable information for travel professionals.</p>
      
      <h2>What You'll Find Here</h2>
      <p>Our blog will cover a wide range of topics relevant to OTAs, tour operators, and travel agencies:</p>
      <ul>
        <li><strong>Product Updates:</strong> New features, improvements, and announcements about AItinerary</li>
        <li><strong>Industry Trends:</strong> Analysis of the latest developments in B2B travel technology</li>
        <li><strong>Best Practices:</strong> Tips and strategies for growing your travel business</li>
        <li><strong>Success Stories:</strong> Case studies and testimonials from our clients</li>
        <li><strong>Technical Guides:</strong> How-to articles and tutorials</li>
      </ul>
      
      <h2>Our Mission</h2>
      <p>At AItinerary, we believe that technology should empower travel professionals, not replace them. Our platform is designed to help you:</p>
      <ul>
        <li>Save time on routine tasks</li>
        <li>Create more compelling proposals</li>
        <li>Improve client satisfaction</li>
        <li>Increase your revenue</li>
      </ul>
      
      <p>We're committed to providing you with the tools and knowledge you need to succeed in an increasingly competitive industry.</p>
      
      <h2>Stay Connected</h2>
      <p>Make sure to subscribe to our newsletter to get the latest posts delivered to your inbox. We'll also be sharing updates on our social media channels.</p>
      
      <p>Thank you for being part of the AItinerary community. We look forward to sharing valuable insights and helping you grow your travel business!</p>
    `
  },
  {
    slug: 'ai-in-travel',
    title: 'How AI is Transforming B2B Travel',
    date: '2024-06-09',
    author: 'Sarah Johnson',
    category: 'Technology',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop',
    content: `
      <p>Artificial Intelligence is revolutionizing the travel industry in ways we couldn't have imagined just a few years ago. For B2B travel professionals, AI is becoming an essential tool for staying competitive and providing exceptional service.</p>
      
      <h2>The AI Revolution in Travel</h2>
      <p>AI is transforming every aspect of the travel business, from customer service to pricing optimization. Here are the key areas where AI is making the biggest impact:</p>
      
      <h3>1. Personalized Recommendations</h3>
      <p>AI algorithms can analyze vast amounts of data to provide highly personalized travel recommendations. This includes:</p>
      <ul>
        <li>Destination suggestions based on past preferences</li>
        <li>Activity recommendations tailored to interests</li>
        <li>Accommodation matching based on style and budget</li>
        <li>Timing optimization for the best prices and availability</li>
      </ul>
      
      <h3>2. Dynamic Pricing</h3>
      <p>AI-powered pricing systems can adjust rates in real-time based on:</p>
      <ul>
        <li>Demand fluctuations</li>
        <li>Competitor pricing</li>
        <li>Seasonal trends</li>
        <li>Customer behavior patterns</li>
      </ul>
      
      <h3>3. Automated Customer Service</h3>
      <p>Chatbots and virtual assistants are handling routine inquiries, allowing human agents to focus on complex requests and relationship building.</p>
      
      <h2>Benefits for Travel Agencies</h2>
      <p>For travel agencies and OTAs, AI offers several key advantages:</p>
      <ul>
        <li><strong>Increased Efficiency:</strong> Automate routine tasks and focus on high-value activities</li>
        <li><strong>Better Customer Experience:</strong> Provide faster, more accurate responses</li>
        <li><strong>Improved Profitability:</strong> Optimize pricing and reduce operational costs</li>
        <li><strong>Competitive Advantage:</strong> Stay ahead of competitors with cutting-edge technology</li>
      </ul>
      
      <h2>The Future of AI in Travel</h2>
      <p>As AI technology continues to evolve, we can expect to see:</p>
      <ul>
        <li>More sophisticated personalization</li>
        <li>Enhanced predictive analytics</li>
        <li>Improved voice and visual search</li>
        <li>Better integration across platforms</li>
      </ul>
      
      <p>The key to success in the AI-powered future is not to replace human expertise, but to augment it. The most successful travel professionals will be those who learn to work effectively with AI tools while maintaining the personal touch that clients value.</p>
    `
  },
  {
    slug: 'commission-tracking-best-practices',
    title: 'Commission Tracking Best Practices for Travel Agencies',
    date: '2024-06-08',
    author: 'Michael Chen',
    category: 'Business',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=600&fit=crop',
    content: `
      <p>Effective commission tracking is crucial for the financial health of any travel agency. With proper systems in place, you can maximize your earnings, identify opportunities, and ensure accurate reporting.</p>
      
      <h2>Why Commission Tracking Matters</h2>
      <p>Commission tracking goes beyond just knowing how much you've earned. It provides insights into:</p>
      <ul>
        <li>Your most profitable suppliers and destinations</li>
        <li>Seasonal trends and patterns</li>
        <li>Agent performance and productivity</li>
        <li>Cash flow management</li>
      </ul>
      
      <h2>Best Practices for Commission Tracking</h2>
      
      <h3>1. Centralize Your Data</h3>
      <p>Use a single platform to track all commissions from different suppliers. This ensures consistency and makes reporting much easier.</p>
      
      <h3>2. Automate Where Possible</h3>
      <p>Manual tracking is time-consuming and error-prone. Look for tools that can automatically import commission data from your suppliers.</p>
      
      <h3>3. Set Up Clear Categories</h3>
      <p>Organize your commissions by:</p>
      <ul>
        <li>Supplier type (hotels, airlines, car rentals, etc.)</li>
        <li>Destination or region</li>
        <li>Agent or team member</li>
        <li>Client type (corporate, leisure, group)</li>
      </ul>
      
      <h3>4. Track Commission Rates</h3>
      <p>Monitor commission rates from different suppliers and negotiate better terms when possible. Keep a database of current rates for quick reference.</p>
      
      <h3>5. Implement Real-Time Monitoring</h3>
      <p>Set up alerts for when commissions are received and when they're overdue. This helps with cash flow management and follow-up.</p>
      
      <h2>Common Challenges and Solutions</h2>
      
      <h3>Challenge: Inconsistent Commission Structures</h3>
      <p><strong>Solution:</strong> Create standardized templates for different supplier types and ensure all team members use them consistently.</p>
      
      <h3>Challenge: Delayed Commission Payments</h3>
      <p><strong>Solution:</strong> Establish clear payment terms with suppliers and set up automated follow-up systems.</p>
      
      <h3>Challenge: Tracking Commission Changes</h3>
      <p><strong>Solution:</strong> Maintain a log of rate changes and their effective dates to ensure accurate historical reporting.</p>
      
      <h2>Technology Solutions</h2>
      <p>Modern commission tracking tools offer features like:</p>
      <ul>
        <li>Automated data import from supplier portals</li>
        <li>Real-time dashboards and reporting</li>
        <li>Integration with accounting systems</li>
        <li>Mobile access for on-the-go monitoring</li>
        <li>Predictive analytics for forecasting</li>
      </ul>
      
      <p>By implementing these best practices, you can transform commission tracking from a time-consuming chore into a strategic advantage that helps grow your business.</p>
    `
  },
  {
    slug: 'luxury-travel-trends-2024',
    title: 'Luxury Travel Trends to Watch in 2024',
    date: '2024-06-07',
    author: 'Emma Rodriguez',
    category: 'Trends',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&h=600&fit=crop',
    content: `
      <p>The luxury travel market is evolving rapidly, driven by changing consumer preferences, technological advances, and global events. Understanding these trends is crucial for travel professionals serving high-end clients.</p>
      
      <h2>Key Luxury Travel Trends for 2024</h2>
      
      <h3>1. Experiential Luxury</h3>
      <p>Luxury travelers are increasingly seeking unique, immersive experiences over traditional luxury amenities. This includes:</p>
      <ul>
        <li>Private access to cultural sites and events</li>
        <li>Exclusive culinary experiences with renowned chefs</li>
        <li>Behind-the-scenes tours and workshops</li>
        <li>Personalized learning opportunities</li>
      </ul>
      
      <h3>2. Sustainable Luxury</h3>
      <p>Environmental consciousness is becoming a priority for luxury travelers. They're looking for:</p>
      <ul>
        <li>Eco-friendly accommodations and transportation</li>
        <li>Carbon-neutral travel options</li>
        <li>Support for local communities and conservation</li>
        <li>Transparent sustainability practices</li>
      </ul>
      
      <h3>3. Wellness and Well-being</h3>
      <p>Health and wellness are central to luxury travel experiences:</p>
      <ul>
        <li>Medical tourism and preventive health programs</li>
        <li>Mindfulness and spiritual retreats</li>
        <li>Fitness and nutrition-focused travel</li>
        <li>Mental health and stress relief programs</li>
      </ul>
      
      <h3>4. Technology Integration</h3>
      <p>Luxury travelers expect seamless technology integration:</p>
      <ul>
        <li>Contactless check-ins and services</li>
        <li>Personalized digital experiences</li>
        <li>Virtual reality previews of destinations</li>
        <li>AI-powered personalization</li>
      </ul>
      
      <h2>Emerging Destinations</h2>
      <p>Luxury travelers are exploring new destinations that offer unique experiences:</p>
      <ul>
        <li><strong>Rwanda:</strong> Gorilla trekking and conservation tourism</li>
        <li><strong>Bhutan:</strong> Cultural immersion and spiritual experiences</li>
        <li><strong>Patagonia:</strong> Adventure luxury and natural beauty</li>
        <li><strong>Oman:</strong> Desert luxury and cultural heritage</li>
      </ul>
      
      <h2>Changing Booking Patterns</h2>
      <p>Luxury travelers are booking differently:</p>
      <ul>
        <li>Longer lead times for complex itineraries</li>
        <li>Increased demand for flexible cancellation policies</li>
        <li>Preference for private and semi-private experiences</li>
        <li>Greater emphasis on safety and security</li>
      </ul>
      
      <h2>Opportunities for Travel Professionals</h2>
      <p>These trends present several opportunities:</p>
      <ul>
        <li>Develop expertise in emerging destinations</li>
        <li>Build relationships with sustainable luxury providers</li>
        <li>Create unique, personalized experiences</li>
        <li>Leverage technology to enhance service delivery</li>
      </ul>
      
      <p>By staying ahead of these trends, travel professionals can position themselves as trusted advisors for luxury travelers and capture a larger share of this lucrative market.</p>
    `
  },
  {
    slug: 'building-client-relationships',
    title: 'Building Lasting Client Relationships in Travel',
    date: '2024-06-06',
    author: 'David Thompson',
    category: 'Sales',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=600&fit=crop',
    content: `
      <p>In the competitive travel industry, building strong client relationships is the key to long-term success. While technology can help with efficiency, the human connection remains irreplaceable.</p>
      
      <h2>The Foundation of Strong Relationships</h2>
      
      <h3>1. Trust and Reliability</h3>
      <p>Trust is the cornerstone of any successful client relationship. Build it by:</p>
      <ul>
        <li>Always delivering on promises</li>
        <li>Being transparent about pricing and policies</li>
        <li>Providing accurate information and recommendations</li>
        <li>Responding promptly to inquiries and concerns</li>
      </ul>
      
      <h3>2. Personalization</h3>
      <p>Treat each client as an individual with unique needs and preferences:</p>
      <ul>
        <li>Remember their travel history and preferences</li>
        <li>Send personalized recommendations</li>
        <li>Celebrate their special occasions</li>
        <li>Adapt your communication style to their preferences</li>
      </ul>
      
      <h3>3. Proactive Communication</h3>
      <p>Don't wait for clients to reach out to you:</p>
      <ul>
        <li>Send regular updates about their bookings</li>
        <li>Share relevant travel news and deals</li>
        <li>Follow up after trips to gather feedback</li>
        <li>Provide helpful travel tips and advice</li>
      </ul>
      
      <h2>Communication Strategies</h2>
      
      <h3>Multi-Channel Approach</h3>
      <p>Use various communication channels to stay connected:</p>
      <ul>
        <li>Email for detailed information and confirmations</li>
        <li>Phone calls for complex discussions and urgent matters</li>
        <li>Text messages for quick updates and reminders</li>
        <li>Social media for relationship building and engagement</li>
      </ul>
      
      <h3>Timing and Frequency</h3>
      <p>Find the right balance in your communication:</p>
      <ul>
        <li>Don't overwhelm clients with too many messages</li>
        <li>Be strategic about when you reach out</li>
        <li>Respect their preferred communication times</li>
        <li>Use automation thoughtfully and personally</li>
      </ul>
      
      <h2>Value-Added Services</h2>
      <p>Go beyond basic booking services to provide real value:</p>
      <ul>
        <li>Travel insurance recommendations</li>
        <li>Visa and documentation assistance</li>
        <li>Local restaurant and activity recommendations</li>
        <li>Emergency support during trips</li>
        <li>Post-trip follow-up and feedback collection</li>
      </ul>
      
      <h2>Handling Challenges</h2>
      
      <h3>When Things Go Wrong</h3>
      <p>How you handle problems can strengthen or damage relationships:</p>
      <ul>
        <li>Take immediate responsibility and action</li>
        <li>Communicate clearly about what happened and what you're doing</li>
        <li>Offer appropriate compensation or alternatives</li>
        <li>Learn from mistakes and improve processes</li>
      </ul>
      
      <h3>Managing Expectations</h3>
      <p>Set realistic expectations from the beginning:</p>
      <ul>
        <li>Be honest about what you can and cannot deliver</li>
        <li>Explain policies and procedures clearly</li>
        <li>Provide realistic timelines and costs</li>
        <li>Update clients when circumstances change</li>
      </ul>
      
      <h2>Technology and Relationships</h2>
      <p>Use technology to enhance, not replace, personal relationships:</p>
      <ul>
        <li>CRM systems to track preferences and history</li>
        <li>Automated follow-ups for routine communications</li>
        <li>Client portals for easy access to information</li>
        <li>Social media for relationship building</li>
      </ul>
      
      <p>Remember, technology should support your relationship-building efforts, not replace the personal touch that clients value most.</p>
    `
  },
  {
    slug: 'digital-marketing-for-travel-agencies',
    title: 'Digital Marketing Strategies for Travel Agencies',
    date: '2024-06-05',
    author: 'Lisa Wang',
    category: 'Marketing',
    readTime: '9 min read',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop',
    content: `
      <p>Digital marketing has become essential for travel agencies to attract and retain clients in today's competitive market. A well-executed digital marketing strategy can significantly increase your reach and revenue.</p>
      
      <h2>Key Digital Marketing Channels</h2>
      
      <h3>1. Search Engine Optimization (SEO)</h3>
      <p>SEO helps your website rank higher in search results:</p>
      <ul>
        <li>Optimize for relevant keywords (destinations, travel types, services)</li>
        <li>Create high-quality, informative content</li>
        <li>Improve website speed and mobile responsiveness</li>
        <li>Build quality backlinks from reputable travel sites</li>
        <li>Optimize local SEO for your service area</li>
      </ul>
      
      <h3>2. Content Marketing</h3>
      <p>Create valuable content that attracts and engages your target audience:</p>
      <ul>
        <li>Destination guides and travel tips</li>
        <li>Travel industry insights and trends</li>
        <li>Client testimonials and success stories</li>
        <li>Behind-the-scenes content about your services</li>
        <li>Video content showcasing destinations and experiences</li>
      </ul>
      
      <h3>3. Social Media Marketing</h3>
      <p>Use social media to build relationships and showcase your expertise:</p>
      <ul>
        <li>Share beautiful destination photos and videos</li>
        <li>Post travel tips and industry insights</li>
        <li>Engage with followers through comments and messages</li>
        <li>Use stories and live features for real-time engagement</li>
        <li>Collaborate with influencers and travel bloggers</li>
      </ul>
      
      <h3>4. Email Marketing</h3>
      <p>Email remains one of the most effective marketing channels:</p>
      <ul>
        <li>Build an email list through your website and social media</li>
        <li>Send regular newsletters with valuable content</li>
        <li>Create targeted campaigns for specific destinations or services</li>
        <li>Use automation for welcome series and follow-ups</li>
        <li>Segment your list based on interests and behavior</li>
      </ul>
      
      <h2>Paid Advertising Strategies</h2>
      
      <h3>Google Ads</h3>
      <p>Target potential clients actively searching for travel services:</p>
      <ul>
        <li>Use destination-specific keywords</li>
        <li>Create compelling ad copy with clear value propositions</li>
        <li>Use landing pages optimized for conversions</li>
        <li>Track and optimize performance regularly</li>
      </ul>
      
      <h3>Social Media Advertising</h3>
      <p>Reach your target audience on their preferred platforms:</p>
      <ul>
        <li>Facebook and Instagram ads for visual content</li>
        <li>LinkedIn ads for corporate travel services</li>
        <li>YouTube ads for video content</li>
        <li>Use retargeting to reach people who've visited your site</li>
      </ul>
      
      <h2>Marketing Automation</h2>
      <p>Use automation to scale your marketing efforts:</p>
      <ul>
        <li>Welcome series for new subscribers</li>
        <li>Abandoned cart recovery for incomplete bookings</li>
        <li>Post-trip follow-up sequences</li>
        <li>Seasonal campaign automation</li>
        <li>Lead nurturing for prospects</li>
      </ul>
      
      <h2>Measuring Success</h2>
      <p>Track key metrics to measure your marketing effectiveness:</p>
      <ul>
        <li>Website traffic and conversion rates</li>
        <li>Email open and click-through rates</li>
        <li>Social media engagement and reach</li>
        <li>Cost per acquisition for paid campaigns</li>
        <li>Customer lifetime value</li>
      </ul>
      
      <h2>Emerging Trends</h2>
      <p>Stay ahead of the curve with these emerging trends:</p>
      <ul>
        <li>Voice search optimization</li>
        <li>Video marketing and live streaming</li>
        <li>Personalization and AI-driven marketing</li>
        <li>Sustainability-focused marketing</li>
        <li>Virtual reality and augmented reality experiences</li>
      </ul>
      
      <p>By implementing a comprehensive digital marketing strategy, travel agencies can attract more clients, build stronger relationships, and increase their revenue in the competitive travel market.</p>
    `
  }
];

export function BlogPost() {
  const { slug } = useParams();
  const post = posts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
        <Link to="/blog" className="text-[var(--primary)] hover:underline">Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="py-24 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--muted)]/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/blog" className="inline-flex items-center text-[var(--primary)] hover:underline mb-8 group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>
          
          <article>
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <Badge variant="secondary">{post.category}</Badge>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {post.author}
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {post.readTime}
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{post.title}</h1>
            </header>

            {/* Featured Image */}
            <div className="relative mb-8 rounded-2xl overflow-hidden">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Share Section */}
            <div className="mt-12 pt-8 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Share this post:</span>
                  <button className="p-2 rounded-full bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 transition-colors">
                    <Share2 className="h-4 w-4 text-[var(--primary)]" />
                  </button>
                </div>
                <Link to="/blog" className="text-[var(--primary)] hover:underline text-sm">
                  ← Back to all posts
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>
      <Footer />
    </div>
  );
} 