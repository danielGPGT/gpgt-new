import { useState, useMemo } from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import all Undraw illustrations
import * as UndrawIllustrations from 'react-undraw-illustrations';

// Group illustrations by category
const illustrationCategories = {
  'Travel & Adventure': [
    'UndrawTrip', 'UndrawDestination', 'UndrawAirport', 'UndrawDeparting', 'UndrawOnTheWay',
    'UndrawRomanticGetaway', 'UndrawCamping', 'UndrawCampfire', 'UndrawSurfer', 'UndrawYacht',
    'UndrawMapDark', 'UndrawMapLight', 'UndrawNavigation', 'UndrawExploring', 'UndrawThroughTheDesert',
    'UndrawOffRoad', 'UndrawRideABicycle', 'UndrawRunningWild', 'UndrawWalkInTheCity', 'UndrawCityDriver',
    'UndrawBusStop', 'UndrawByMyCar', 'UndrawElectricCar', 'UndrawDroneDelivery', 'UndrawDroneRace',
    'UndrawFollowMeDrone', 'UndrawContainerShip', 'UndrawLighthouse', 'UndrawGoldenGateBridge',
    'UndrawCountrySide', 'UndrawHouses', 'UndrawHouseSearching', 'UndrawStreetFood', 'UndrawFishing',
    'UndrawGardening', 'UndrawOuterSpace', 'UndrawAstronaut', 'UndrawStarman', 'UndrawToTheStars',
    'UndrawVirtualReality', 'UndrawVrChat', 'UndrawWeather', 'UndrawSunnyDay', 'UndrawSnowman',
    'UndrawAutumn', 'UndrawFallIsComing', 'UndrawWinterOlympics', 'UndrawSpring', 'UndrawSummer'
  ],
  'Business & Professional': [
    'UndrawBusiness', 'UndrawBusinessDeal', 'UndrawBusinessman', 'UndrawBusinesswoman', 'UndrawBusinessPlan',
    'UndrawMeeting', 'UndrawTeam', 'UndrawTeamSpirit', 'UndrawCoworkers', 'UndrawCoWorking',
    'UndrawCollaboration', 'UndrawLiveCollaboration', 'UndrawConnectingTeams', 'UndrawWorkChat',
    'UndrawWorking', 'UndrawWorkingLate', 'UndrawAtWork', 'UndrawInTheOffice', 'UndrawOnTheOffice',
    'UndrawFreelancer', 'UndrawStartupLife', 'UndrawHiring', 'UndrawJobHunt', 'UndrawResume',
    'UndrawResumeFolder', 'UndrawOrganizeResume', 'UndrawPortfolio', 'UndrawPresentation',
    'UndrawProductTour', 'UndrawProductTeardown', 'UndrawProductHunt', 'UndrawCustomerSurvey',
    'UndrawExperts', 'UndrawQaEngineers', 'UndrawDesigner', 'UndrawDesignerGirl', 'UndrawDesignerLife',
    'UndrawDesignCommunity', 'UndrawDesignProcess', 'UndrawDesignTools', 'UndrawPenTool',
    'UndrawWireframing', 'UndrawCreationProcess', 'UndrawCreativity', 'UndrawBrainstorming',
    'UndrawOrganizingProjects', 'UndrawTimeManagement', 'UndrawToDoList', 'UndrawChecklist',
    'UndrawTarget', 'UndrawGoal', 'UndrawRising', 'UndrawGrowing', 'UndrawSuccessfulPurchase',
    'UndrawOrderConfirmed', 'UndrawConfirmed', 'UndrawConfirmation'
  ],
  'Technology & Development': [
    'UndrawCoding', 'UndrawProgramming', 'UndrawDevelopment', 'UndrawServer', 'UndrawSecureServer',
    'UndrawServerStatus', 'UndrawCloudHosting', 'UndrawCloudSync', 'UndrawData', 'UndrawDataReport',
    'UndrawAnalytics', 'UndrawDashboard', 'UndrawStatistics', 'UndrawCharts', 'UndrawPieChart',
    'UndrawBrowser', 'UndrawBrowserStats', 'UndrawMobile', 'UndrawMobileApps', 'UndrawMobileBrowsers',
    'UndrawMobilePayments', 'UndrawDevices', 'UndrawWebDevices', 'UndrawAndroid', 'UndrawWindows',
    'UndrawAppInstallation', 'UndrawWebsiteSetup', 'UndrawSetup', 'UndrawMaintenance', 'UndrawFirmware',
    'UndrawSecurityOn', 'UndrawSecureData', 'UndrawVault', 'UndrawSafe', 'UndrawGdpr',
    'UndrawSearch', 'UndrawSearchEngines', 'UndrawFileSearching', 'UndrawFilingSystem', 'UndrawFilter',
    'UndrawSegment', 'UndrawSegmentation', 'UndrawSelect', 'UndrawChoose', 'UndrawProcessing',
    'UndrawLoading', 'UndrawFastLoading', 'UndrawRefreshing', 'UndrawSync', 'UndrawRealTimeSync',
    'UndrawInSync', 'UndrawTransferFiles', 'UndrawAddFiles', 'UndrawStaticAssets', 'UndrawImageUpload',
    'UndrawUpload', 'UndrawImages', 'UndrawImageFolder', 'UndrawPhoto', 'UndrawPhotos',
    'UndrawPhotoSharing', 'UndrawPhotocopy', 'UndrawOrganizePhotos', 'UndrawTabs', 'UndrawResponsive',
    'UndrawSpecs', 'UndrawSpreadsheets', 'UndrawReport', 'UndrawSiteStats', 'UndrawControlPanel',
    'UndrawJavascriptFrameworks', 'UndrawArtificialIntelligence', 'UndrawScience', 'UndrawAlienScience',
    'UndrawAnalysis', 'UndrawInternetOnTheGo', 'UndrawOnline', 'UndrawOnlineWorld', 'UndrawOnlineShopping',
    'UndrawDigitalNomad', 'UndrawConnected', 'UndrawBroadcast', 'UndrawInstantSupport', 'UndrawActiveSupport'
  ],
  'Communication & Social': [
    'UndrawChat', 'UndrawChatting', 'UndrawMessages', 'UndrawMessaging', 'UndrawMessenger',
    'UndrawMail', 'UndrawMailbox', 'UndrawMailSent', 'UndrawEnvelope', 'UndrawEmails',
    'UndrawEmailCapture', 'UndrawInboxCleanup', 'UndrawNewMessage', 'UndrawConversation',
    'UndrawSocialMedia', 'UndrawSocialNetworking', 'UndrawSocialGrowth', 'UndrawSocialIdeas',
    'UndrawSocialStrategy', 'UndrawSocialTree', 'UndrawWallPost', 'UndrawPost', 'UndrawPosts',
    'UndrawBlogging', 'UndrawBlogPost', 'UndrawNews', 'UndrawNewsletter', 'UndrawTweetstorm',
    'UndrawWordOfMouth', 'UndrawInfluencer', 'UndrawFans', 'UndrawCommunity', 'UndrawFriendship',
    'UndrawCouple', 'UndrawTogether', 'UndrawGroupSelfie', 'UndrawSelfie', 'UndrawSelfieTime',
    'UndrawSwipeProfiles', 'UndrawPeopleSearch', 'UndrawPersonalization', 'UndrawInvite',
    'UndrawOpened', 'UndrawTaken', 'UndrawTyping', 'UndrawThoughts', 'UndrawNotes',
    'UndrawTakingNotes', 'UndrawNotebook', 'UndrawReadingList', 'UndrawBookLover', 'UndrawStudying',
    'UndrawGraduation', 'UndrawGrades', 'UndrawPodcast', 'UndrawMusic', 'UndrawMoreMusic',
    'UndrawPressPlay', 'UndrawMovieNight', 'UndrawGaming', 'UndrawPlayfulCat', 'UndrawGoodDoggy',
    'UndrawCautiousDog'
  ],
  'Finance & Payments': [
    'UndrawFinance', 'UndrawMakeItRain', 'UndrawCreditCard', 'UndrawCreditCardPayment',
    'UndrawCreditCardPayments', 'UndrawPlainCreditCard', 'UndrawBitcoin', 'UndrawBitcoinP2P',
    'UndrawEther', 'UndrawEthereum', 'UndrawCryptoFlowers', 'UndrawForSale', 'UndrawWindowShopping',
    'UndrawAddToCart', 'UndrawCalculator', 'UndrawUpvote', 'UndrawQueue', 'UndrawCollection',
    'UndrawCollecting'
  ],
  'User & Profile': [
    'UndrawUser', 'UndrawProfilePic', 'UndrawLogin', 'UndrawOnboarding', 'UndrawForgotPassword',
    'UndrawAccount', 'UndrawAddress', 'UndrawAddUser', 'UndrawPreferences', 'UndrawSettings',
    'UndrawWelcome', 'UndrawHello', 'UndrawWoman', 'UndrawModernWoman', 'UndrawWomenDay',
    'UndrawMarilyn', 'UndrawNerd', 'UndrawSuperhero', 'UndrawFatherhood', 'UndrawMotherhood',
    'UndrawBaby', 'UndrawGrandSlam', 'UndrawHomeRun', 'UndrawTrackAndField', 'UndrawWorkout',
    'UndrawPilates', 'UndrawJogging', 'UndrawWorkTime', 'UndrawStayingIn', 'UndrawRelaxingAtHome',
    'UndrawRelaxation', 'UndrawMeditation', 'UndrawMindfulness', 'UndrawSleeping', 'UndrawSleepAnalysis',
    'UndrawHealthyHabit', 'UndrawGettingCoffee', 'UndrawMorningEssentials', 'UndrawEatingTogether',
    'UndrawTasting', 'UndrawChef', 'UndrawBirthdayCake', 'UndrawHappyBirthday', 'UndrawCelebration',
    'UndrawHighFive', 'UndrawSmileyFace', 'UndrawInLove', 'UndrawLoveIsInTheAir', 'UndrawFeelingBlue',
    'UndrawChilling', 'UndrawHangOut', 'UndrawGirlsJustWannaHaveFun', 'UndrawOrdinaryDay',
    'UndrawOldDay', 'UndrawMomentToRemember', 'UndrawForever', 'UndrawPassingBy', 'UndrawPedestrianCrossing',
    'UndrawDarkAlley', 'UndrawStartled', 'UndrawLost', 'UndrawMissionImpossible', 'UndrawMayTheForce',
    'UndrawFloating', 'UndrawFocus', 'UndrawContrast', 'UndrawBlankCanvas', 'UndrawArtLover',
    'UndrawEasterEggHunt', 'UndrawGift', 'UndrawWishes', 'UndrawAgreement', 'UndrawAcceptTerms',
    'UndrawAlert', 'UndrawNoData', 'UndrawEmpty', 'UndrawDocuments', 'UndrawAppreciation',
    'UndrawPowerful', 'UndrawYoungAndHappy'
  ]
};

export default function UndrawGallery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIllustration, setSelectedIllustration] = useState<string | null>(null);

  // Flatten all illustrations
  const allIllustrations = useMemo(() => {
    const flat: Array<{ name: string; category: string; component: any }> = [];
    
    Object.entries(illustrationCategories).forEach(([category, illustrations]) => {
      illustrations.forEach(name => {
        if (UndrawIllustrations[name as keyof typeof UndrawIllustrations]) {
          flat.push({
            name,
            category,
            component: UndrawIllustrations[name as keyof typeof UndrawIllustrations]
          });
        }
      });
    });
    
    return flat;
  }, []);

  // Filter illustrations based on search and category
  const filteredIllustrations = useMemo(() => {
    return allIllustrations.filter(illustration => {
      const matchesSearch = illustration.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || illustration.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allIllustrations, searchTerm, selectedCategory]);

  const handleIllustrationClick = (name: string) => {
    setSelectedIllustration(name);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--primary)] text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-4">Undraw Illustration Gallery</h1>
          <p className="text-xl text-center opacity-90 max-w-2xl mx-auto">
            Browse through all available Undraw illustrations. Click on any illustration to view it in detail.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-8">
          {/* Search */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] h-4 w-4" />
            <Input
              placeholder="Search illustrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(illustrationCategories).map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-[var(--muted-foreground)]">
            Showing {filteredIllustrations.length} of {allIllustrations.length} illustrations
          </p>
        </div>

        {/* Gallery */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredIllustrations.map(({ name, category, component: IllustrationComponent }) => (
              <Card 
                key={name} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => handleIllustrationClick(name)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <IllustrationComponent 
                      height="120" 
                      width="120" 
                      primaryColor="var(--primary)"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-sm mb-2">{name.replace('Undraw', '')}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIllustrations.map(({ name, category, component: IllustrationComponent }) => (
              <Card 
                key={name} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleIllustrationClick(name)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0">
                      <IllustrationComponent 
                        height="80" 
                        width="80" 
                        primaryColor="var(--primary)"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{name.replace('Undraw', '')}</h3>
                      <Badge variant="secondary">{category}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredIllustrations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--muted-foreground)] text-lg">
              No illustrations found matching your search criteria.
            </p>
          </div>
        )}
      </div>

      {/* Modal for selected illustration */}
      {selectedIllustration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">
                {selectedIllustration.replace('Undraw', '')}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIllustration(null)}
              >
                ✕
              </Button>
            </div>
            
            <div className="flex justify-center mb-6">
              {(() => {
                const illustration = allIllustrations.find(i => i.name === selectedIllustration);
                if (illustration) {
                  const IllustrationComponent = illustration.component;
                  return (
                    <IllustrationComponent 
                      height="300" 
                      width="300" 
                      primaryColor="var(--primary)"
                    />
                  );
                }
                return null;
              })()}
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Usage Example:</h3>
                <pre className="bg-[var(--muted)] p-4 rounded text-sm overflow-x-auto">
{`import { ${selectedIllustration} } from 'react-undraw-illustrations';

<${selectedIllustration} 
  height="200" 
  width="200" 
  primaryColor="#your-color"
/>`}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Available Props:</h3>
                <ul className="text-sm space-y-1 text-[var(--muted-foreground)]">
                  <li>• primaryColor: string</li>
                  <li>• secondaryColor: string</li>
                  <li>• skinColor: string</li>
                  <li>• hairColor: string</li>
                  <li>• accentColor: string</li>
                  <li>• height: string</li>
                  <li>• width: string</li>
                  <li>• className: string</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 