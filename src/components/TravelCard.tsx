
import { Card, CardContent } from './ui/card';
import { MapPin, DollarSign, User, Calendar, Image, Star, Edit } from 'lucide-react';
import { Travel } from '../types';

interface TravelCardProps {
  travel: Travel;
  onClick: (travel: Travel) => void;
  onEdit?: (travel: Travel) => void;
  showEditButton?: boolean;
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

const StarRating = ({ rating, size = "h-3 w-3" }: { rating: number; size?: string }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

export default function TravelCard({ travel, onClick, onEdit, showEditButton }: TravelCardProps) {
  const averageRating = travel.ratings ? Math.round(
    (travel.ratings.mobility + travel.ratings.safety + travel.ratings.population + travel.ratings.vegetation) / 4
  ) : 0;

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow relative"
    >
      {showEditButton && onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(travel);
          }}
          className="absolute top-2 right-2 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-md hover:shadow-lg transition-all"
        >
          <Edit className="h-4 w-4 text-gray-600" />
        </button>
      )}
      <div onClick={() => onClick(travel)} className="cursor-pointer">
      {travel.images && travel.images.length > 0 && (
        <div className="relative">
          <img
            src={travel.images[0]}
            alt={travel.title}
            className="w-full h-48 object-cover"
          />
          {travel.images && travel.images.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <Image className="h-3 w-3" />
                +{travel.images.length - 1}
              </div>
          )}
        </div>
      )}
      
      <CardContent className="p-4">
        <h3 className="font-medium mb-2 line-clamp-2">{travel.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{travel.description}</p>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{travel.location}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>{formatCost(travel.cost)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="truncate">{travel.userName}</span>
          </div>

          {averageRating > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} />
              <span className="text-xs">({averageRating}/5)</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(travel.created_at)}
            </div>
          </div>
        </div>

        {travel.cultural_sites && travel.cultural_sites.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Культурное наследие:</div>
            <div className="flex flex-wrap gap-1">
              {travel.cultural_sites.slice(0, 2).map((site, index) => (
                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {site}
                </span>
              ))}
              {travel.cultural_sites.length > 2 && (
                <span className="text-xs text-gray-500">+{travel.cultural_sites.length - 2}</span>
              )}
            </div>
          </div>
        )}

        {travel.images && travel.images.length > 1 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {travel.images.slice(1, 4).map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Дополнительное изображение ${index + 1}`}
                className="w-full h-16 object-cover rounded"
              />
            ))}
          </div>
        )}
      </CardContent>
      </div>
    </Card>
  );
} 