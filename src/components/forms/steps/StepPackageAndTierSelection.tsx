import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, Package, ChevronRight, Crown, Sparkles, CheckCircle, Zap, Award } from 'lucide-react';

interface PackageType {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  base_type: string | null;
  package_image?: any;
}

interface TierType {
  id: string;
  package_id: string | null;
  name: string;
  description: string | null;
  price_override: number | null;
  short_label: string | null;
  display_order: number | null;
}

export function StepPackageAndTierSelection({ setCurrentStep, currentStep }: { setCurrentStep: (step: number) => void; currentStep: number }) {
  const { watch, setValue } = useFormContext();
  const selectedEvent = watch('selectedEvent');
  const selectedPackageId = watch('selectedPackage.id');
  const selectedTierId = watch('selectedTier.id');

  const [packages, setPackages] = useState<PackageType[]>([]);
  const [tiers, setTiers] = useState<{ [packageId: string]: TierType[] }>({});
  const [loading, setLoading] = useState(true);
  const [loadingTiers, setLoadingTiers] = useState<{ [packageId: string]: boolean }>({});

  // Fetch packages for the selected event
  useEffect(() => {
    if (!selectedEvent?.id) return;
    setLoading(true);
    supabase
      .from('packages')
      .select('*')
      .eq('event_id', selectedEvent.id)
      .order('created_at', { ascending: true })
      .limit(2)
      .then(({ data }) => {
        setPackages(data || []);
        setLoading(false);
      });
  }, [selectedEvent]);

  // Fetch tiers for each package
  useEffect(() => {
    packages.forEach(pkg => {
      if (tiers[pkg.id]) return; // already fetched
      setLoadingTiers(prev => ({ ...prev, [pkg.id]: true }));
      supabase
        .from('package_tiers')
        .select('*')
        .eq('package_id', pkg.id)
        .order('display_order', { ascending: true })
        .limit(3)
        .then(({ data }) => {
          setTiers(prev => ({ ...prev, [pkg.id]: data || [] }));
          setLoadingTiers(prev => ({ ...prev, [pkg.id]: false }));
        });
    });
  }, [packages, tiers]);

  // Handle selection
  const handleSelect = (pkg: PackageType, tier: TierType) => {
    setValue('selectedPackage', {
      id: pkg.id,
      name: pkg.name,
      baseType: pkg.base_type || undefined,
    });
    setValue('selectedTier', {
      id: tier.id,
      name: tier.name,
      description: tier.description || undefined,
      priceOverride: tier.price_override !== null ? Number(tier.price_override) : undefined,
    });
    if (typeof setCurrentStep === 'function') setCurrentStep(currentStep + 1);
  };

  const getPackageIcon = (baseType: string | null) => {
    return baseType === 'VIP' ? <Crown className="h-5 w-5" /> : <Star className="h-5 w-5" />;
  };

  const getTierColor = (tierName: string, baseType: string | null) => {
    if (baseType === 'VIP') {
      switch (tierName.toLowerCase()) {
        case 'diamond': return 'from-[var(--color-primary-600)] to-[var(--color-primary-700)]';
        case 'platinum': return 'from-[var(--color-secondary-600)] to-[var(--color-secondary-700)]';
        case 'vip': return 'from-[var(--color-primary-500)] to-[var(--color-primary-600)]';
        default: return 'from-[var(--color-primary-600)] to-[var(--color-primary-700)]';
      }
    } else {
      switch (tierName.toLowerCase()) {
        case 'gold': return 'from-[var(--color-primary-500)] to-[var(--color-primary-600)]';
        case 'silver': return 'from-[var(--color-secondary-400)] to-[var(--color-secondary-500)]';
        case 'bronze': return 'from-[var(--color-primary-700)] to-[var(--color-primary-800)]';
        default: return 'from-[var(--color-primary-500)] to-[var(--color-primary-600)]';
      }
    }
  };

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="animate-spin h-12 w-12 text-[var(--color-primary-600)] mx-auto" />
            <p className="text-[var(--color-muted-foreground)]">Loading packages...</p>
          </div>
        </div>
      ) : packages.length === 0 ? (
        <Card className="text-center py-16 border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-card)] to-[var(--color-background)]">
          <CardContent>
            <div className="mx-auto w-16 h-16 bg-[var(--color-muted)] rounded-xl flex items-center justify-center mb-6">
              <Package className="h-8 w-8 text-[var(--color-muted-foreground)]" />
            </div>
            <h3 className="text-lg font-semibold mb-3 text-[var(--color-foreground)]">No packages available</h3>
            <p className="text-[var(--color-muted-foreground)]">No packages have been configured for this event yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {packages.map((pkg, packageIndex) => (
            <div key={pkg.id} className="space-y-6">
              {/* Package Header Card */}
                  <div className=" gap-4">

                    <div className="flex-1">
                      <div className="space-y-6">
                                              <Badge 
                          variant="secondary" 
                          className={`uppercase tracking-wide text-xs font-semibold ${
                            pkg.base_type === 'VIP' 
                              ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] border-[var(--color-primary-200)]' 
                              : 'bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)] border-[var(--color-secondary-200)]'
                          }`}
                        >
                          {pkg.base_type || 'Package'}
                        </Badge>
                        <h4 className="text-xl font-bold text-[var(--color-foreground)]">{pkg.name}</h4>

                      </div>
                      <p className="text-[var(--color-muted-foreground)]">{pkg.description}</p>
                    </div>
                  </div>

              {/* Tiers Section */}
              <div className="space-y-4">
                <h5 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                  <Star className="h-5 w-5 text-[var(--color-primary-600)]" />
                  Available Tiers
                </h5>
                
                {loadingTiers[pkg.id] ? (
                  <div className="flex justify-center py-8">
                    <div className="text-center space-y-3">
                      <Loader2 className="animate-spin h-8 w-8 text-[var(--color-muted-foreground)] mx-auto" />
                      <p className="text-[var(--color-muted-foreground)]">Loading tiers...</p>
                    </div>
                  </div>
                ) : (tiers[pkg.id] || []).length === 0 ? (
                  <Card className="text-center py-8 border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-card)] to-[var(--color-background)]">
                    <CardContent>
                      <div className="mx-auto w-12 h-12 bg-[var(--color-muted)] rounded-xl flex items-center justify-center mb-4">
                        <Star className="h-6 w-6 text-[var(--color-muted-foreground)]" />
                      </div>
                      <p className="text-[var(--color-muted-foreground)]">No tiers available for this package.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {(tiers[pkg.id] || []).map((tier, tierIndex) => (
                      <Card
                        key={tier.id}
                        className={`group py-0 relative overflow-hidden border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.01] ${
                          selectedTierId === tier.id 
                            ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-md' 
                            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40'
                        }`}
                        onClick={() => handleSelect(pkg, tier)}
                      >
                        {/* Background Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${getTierColor(tier.name, pkg.base_type)} opacity-5`} />
                        
                        <CardContent className="relative z-10 p-4">
                          <div className="flex items-center justify-between">
                            {/* Left: Tier Info */}
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTierColor(tier.name, pkg.base_type)} flex items-center justify-center text-white shadow-md`}>
                                {tierIndex === 0 && <Sparkles className="h-5 w-5" />}
                                {tierIndex === 1 && <Award className="h-5 w-5" />}
                                {tierIndex === 2 && <Crown className="h-5 w-5" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h6 className="font-bold text-[var(--color-foreground)]">{tier.name}</h6>
                                </div>
                                {tier.description && (
                                  <p className="text-[var(--color-muted-foreground)] text-sm line-clamp-1">
                                    {tier.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right: Price and Selection */}
                            <div className="flex items-center gap-4">
                              {/* Price */}
                              <div className="text-right">
                                {tier.price_override !== null ? (
                                  <div className="text-2xl font-bold text-[var(--color-primary)]">
                                    £{tier.price_override.toLocaleString()}
                                  </div>
                                ) : (
                                  <div className="text-lg font-semibold text-[var(--color-muted-foreground)]">
                                    View Package
                                  </div>
                                )}
                              </div>

                              {/* Selection Indicator */}
                              {selectedTierId === tier.id ? (
                                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                              ) : (
                                <Button 
                                  size="sm"
                                  className="bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 text-[var(--color-primary)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-white"
                                >
                                  Select
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 