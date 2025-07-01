import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        scrollNext()
      }
    },
    [scrollPrev, scrollNext]
  )

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)

    return () => {
      api?.off("select", onSelect)
    }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation:
          orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div
      ref={carouselRef}
      className="overflow-hidden"
      data-slot="carousel-content"
    >
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel()

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full bg-background/80 backdrop-blur-sm border-border hover:bg-background/90",
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full bg-background/80 backdrop-blur-sm border-border hover:bg-background/90",
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}

// Hotel Image Carousel with Lightbox
interface HotelImageCarouselProps {
  images: string[]
  alt: string
  className?: string
  showLightbox?: boolean
  maxHeight?: string
}

export function HotelImageCarousel({ 
  images, 
  alt, 
  className, 
  showLightbox = true,
  maxHeight = "h-40"
}: HotelImageCarouselProps) {
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false)
  const [lightboxIndex, setLightboxIndex] = React.useState(0)

  if (!images || images.length === 0) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl bg-muted flex items-center justify-center", maxHeight, className)}>
        <div className="text-muted-foreground text-sm">No images available</div>
      </div>
    )
  }

  const openLightbox = (index: number) => {
    if (showLightbox) {
      setLightboxIndex(index)
      setIsLightboxOpen(true)
    }
  }

  const nextLightbox = () => {
    setLightboxIndex((current) => (current + 1) % images.length)
  }

  const prevLightbox = () => {
    setLightboxIndex((current) => (current - 1 + images.length) % images.length)
  }

  // Keyboard navigation for lightbox
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isLightboxOpen) {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          prevLightbox()
          break
        case 'ArrowRight':
          e.preventDefault()
          nextLightbox()
          break
        case 'Escape':
          e.preventDefault()
          setIsLightboxOpen(false)
          break
      }
    }
  }

  React.useEffect(() => {
    if (isLightboxOpen) {
      document.addEventListener('keydown', handleKeyDown as any)
      return () => {
        document.removeEventListener('keydown', handleKeyDown as any)
      }
    }
  }, [isLightboxOpen, lightboxIndex])

  return (
    <>
      <div className={cn("relative group", className)}>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index} className="basis-full">
                <div className={cn("relative overflow-hidden rounded-xl shadow-lg", maxHeight)}>
                  <img
                    src={image}
                    alt={`${alt} - Image ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      const currentIndex = images.indexOf(e.currentTarget.src)
                      if (currentIndex < images.length - 1) {
                        e.currentTarget.src = images[currentIndex + 1]
                      } else {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
                      }
                    }}
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  
                  {/* Lightbox button */}
                  {showLightbox && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-3 right-3 bg-background/80 text-foreground hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
                      onClick={() => openLightbox(index)}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Image count badge */}
                  {images.length > 1 && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-background/80 text-foreground text-xs backdrop-blur-sm border-border">
                        {index + 1} / {images.length}
                      </Badge>
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {images.length > 1 && (
            <>
              <CarouselPrevious className="left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <CarouselNext className="right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </>
          )}
        </Carousel>
      </div>

      {/* Lightbox Modal */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-background/95 border-border backdrop-blur-sm">
          <div className="relative h-full">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-background/80 text-foreground hover:bg-background/90 backdrop-blur-sm"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Lightbox image */}
            <div className="flex items-center justify-center h-full p-8">
              <img
                src={images[lightboxIndex]}
                alt={`${alt} - Image ${lightboxIndex + 1}`}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  const currentIndex = images.indexOf(e.currentTarget.src)
                  if (currentIndex < images.length - 1) {
                    e.currentTarget.src = images[currentIndex + 1]
                  } else {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
                  }
                }}
              />
            </div>

            {/* Lightbox navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 text-foreground hover:bg-background/90 backdrop-blur-sm"
                  onClick={prevLightbox}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 text-foreground hover:bg-background/90 backdrop-blur-sm"
                  onClick={nextLightbox}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>

                {/* Lightbox image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 text-foreground px-4 py-2 rounded-md backdrop-blur-sm border border-border">
                  {lightboxIndex + 1} / {images.length}
                </div>

                {/* Lightbox thumbnails */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto p-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      className={cn(
                        "flex-shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all duration-200",
                        index === lightboxIndex 
                          ? "border-primary" 
                          : "border-border hover:border-primary/60"
                      )}
                      onClick={() => setLightboxIndex(index)}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Keyboard navigation hint */}
            <div className="absolute top-4 left-4 text-muted-foreground text-xs">
              Use arrow keys to navigate • ESC to close
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
