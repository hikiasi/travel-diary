import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X, ChevronLeft, ChevronRight, MapPin, DollarSign, User, Calendar, Star } from 'lucide-react';
import { Travel } from '../types';

interface TravelDetailModalProps {
  travel: Travel | null;
  onClose: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatCost = (cost: number) => {
  if (cost === 0) return 'Не указана';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(cost);
};

const StarRating = ({ rating, label, className = "" }: { rating: number; label: string; className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium min-w-[120px]">{label}:</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">({rating}/5)</span>
    </div>
  );
};

export default function TravelDetailModal({ travel, onClose }: TravelDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!travel) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === travel.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? travel.images.length - 1 : prev - 1
    );
  };

  const averageRating = Math.round(
    (travel.ratings.mobility + travel.ratings.safety + travel.ratings.population + travel.ratings.vegetation) / 4
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <CardHeader className="flex items-center justify-between border-b">
          <CardTitle className="truncate pr-4">{travel.title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {/* Image Gallery */}
          {travel.images.length > 0 && (
            <div className="mb-6">
              <div className="relative mb-4">
                <img
                  src={travel.images[currentImageIndex]}
                  alt={`Изображение ${currentImageIndex + 1}`}
                  className="w-full h-80 object-cover rounded-lg"
                />
                
                {travel.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white hover:bg-opacity-90"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white hover:bg-opacity-90"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                      {currentImageIndex + 1} / {travel.images.length}
                    </div>
                  </>
                )}
              </div>

              {travel.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {travel.images.map((image, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                        index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Миниатюра ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column - Main info */}
            <div className="space-y-6">
              {/* Basic info */}
              <div>
                <h3 className="text-lg font-medium mb-3">Информация о путешествии</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{travel.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 flex-shrink-0" />
                    <span>{formatCost(travel.cost)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span>{travel.userName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{formatDate(travel.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-medium mb-3">Описание</h3>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {travel.description}
                </p>
              </div>
            </div>

            {/* Right column - Additional info */}
            <div className="space-y-6">
              {/* Ratings */}
              <div>
                <h3 className="text-lg font-medium mb-3">Оценки</h3>
                <div className="space-y-3">
                  <StarRating 
                    rating={travel.ratings.mobility} 
                    label="Передвижение" 
                  />
                  <StarRating 
                    rating={travel.ratings.safety} 
                    label="Безопасность" 
                  />
                  <StarRating 
                    rating={travel.ratings.population} 
                    label="Населенность" 
                  />
                  <StarRating 
                    rating={travel.ratings.vegetation} 
                    label="Растительность" 
                  />
                  <div className="pt-2 mt-4 border-t">
                    <StarRating 
                      rating={averageRating} 
                      label="Общая оценка" 
                      className="font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Cultural sites */}
              {travel.cultural_sites && travel.cultural_sites.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Места культурного наследия</h3>
                  <div className="flex flex-wrap gap-2">
                    {travel.cultural_sites.map((site, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                        {site}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Places to visit */}
              {travel.places_to_visit && travel.places_to_visit.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Рекомендуемые места</h3>
                  <div className="flex flex-wrap gap-2">
                    {travel.places_to_visit.map((place, index) => (
                      <span key={index} className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                        {place}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 