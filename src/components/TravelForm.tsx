import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X, MapPin, DollarSign, Upload, Loader2, Plus, Star } from 'lucide-react';
import { Travel } from '../types';

interface TravelFormProps {
  user: { id: string; name: string; email: string };
  onSubmit: (travelData: Omit<Travel, 'id' | 'userId' | 'userName' | 'created_at'>) => void;
  onClose: () => void;
}

const StarRating = ({ rating, onRatingChange, label }: { 
  rating: number; 
  onRatingChange: (rating: number) => void;
  label: string 
}) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium min-w-[120px]">{label}:</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="p-0.5 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-5 w-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} hover:text-yellow-300`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-600">({rating}/5)</span>
    </div>
  );
};

// Simple toast implementation
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white max-w-sm shadow-lg ${
    type === 'success' ? 'bg-green-600' : 
    type === 'error' ? 'bg-red-600' : 'bg-blue-600'
  }`;
  toast.style.wordBreak = 'break-word';
  toast.style.lineHeight = '1.4';
  toast.textContent = message;
  toast.style.animation = 'fadeIn 0.3s ease-in-out';
  
  document.body.appendChild(toast);
  
  const displayTime = type === 'error' && message.length > 50 ? 5000 : 3000;
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-in-out';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, displayTime);
};

export default function TravelForm({ onSubmit, onClose }: TravelFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    cost: ''
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [culturalSites, setCulturalSites] = useState<string[]>([]);
  const [placesToVisit, setPlacesToVisit] = useState<string[]>([]);
  const [ratings, setRatings] = useState({
    mobility: 0,
    safety: 0,
    population: 0,
    vegetation: 0
  });
  
  const [newCulturalSite, setNewCulturalSite] = useState('');
  const [newPlaceToVisit, setNewPlaceToVisit] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRatingChange = (category: keyof typeof ratings, rating: number) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  };

  const addCulturalSite = () => {
    if (newCulturalSite.trim()) {
      setCulturalSites(prev => [...prev, newCulturalSite.trim()]);
      setNewCulturalSite('');
    }
  };

  const addPlaceToVisit = () => {
    if (newPlaceToVisit.trim()) {
      setPlacesToVisit(prev => [...prev, newPlaceToVisit.trim()]);
      setNewPlaceToVisit('');
    }
  };

  const removeCulturalSite = (index: number) => {
    setCulturalSites(prev => prev.filter((_, i) => i !== index));
  };

  const removePlaceToVisit = (index: number) => {
    setPlacesToVisit(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]);
        
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          uploadedUrls.push(result.imageUrl);
        } else {
          throw new Error('Upload failed');
        }
      }

      setImages(prev => [...prev, ...uploadedUrls]);
      showToast(`Загружено ${uploadedUrls.length} изображений`, 'success');
    } catch (error) {
      console.error('Image upload error:', error);
      showToast('Ошибка загрузки изображения', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Геолокация не поддерживается в вашем браузере', 'error');
      return;
    }

    setGettingLocation(true);
    showToast('Получаем ваше местоположение...', 'info');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Получаем название города по координатам
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=ru`
          );
          
          if (response.ok) {
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state;
            const country = data.address?.country;
            
            if (city && country) {
              const locationName = `${city}, ${country}`;
              setFormData(prev => ({ ...prev, location: locationName }));
              showToast('Местоположение определено!', 'success');
            } else {
              const locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
              setFormData(prev => ({ ...prev, location: locationName }));
              showToast('Местоположение определено!', 'success');
            }
          } else {
            const locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setFormData(prev => ({ ...prev, location: locationName }));
            showToast('Местоположение определено!', 'success');
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          const locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setFormData(prev => ({ ...prev, location: locationName }));
          showToast('Местоположение определено!', 'success');
        }
        
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Не удалось получить местоположение';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Доступ к геолокации запрещен';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Информация о местоположении недоступна';
            break;
          case error.TIMEOUT:
            errorMessage = 'Превышено время ожидания';
            break;
        }
        
        showToast(errorMessage, 'error');
        setGettingLocation(false);
      },
      { 
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 300000
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.location) {
      showToast('Пожалуйста, заполните все обязательные поля', 'error');
      return;
    }

    setSubmitting(true);
    
    try {
             const travelData = {
         ...formData,
         cost: parseFloat(formData.cost) || 0,
         images,
         culturalSites: culturalSites,
         placesToVisit: placesToVisit,
         ratings
       };
      
      onSubmit(travelData);
    } catch (error) {
      console.error('Travel creation error:', error);
      showToast('Ошибка создания путешествия', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', location: '', cost: '' });
    setImages([]);
    setCulturalSites([]);
    setPlacesToVisit([]);
    setRatings({ mobility: 0, safety: 0, population: 0, vegetation: 0 });
    setNewCulturalSite('');
    setNewPlaceToVisit('');
    setGettingLocation(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Добавить новое путешествие</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onClose();
              resetForm();
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title">Название путешествия *</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Незабываемая поездка в Париж"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="location">Местоположение *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      type="text"
                      placeholder="Париж, Франция"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      required
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                    >
                      {gettingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cost">Стоимость путешествия (₽)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="cost"
                      type="number"
                      placeholder="50000"
                      value={formData.cost}
                      onChange={(e) => handleInputChange('cost', e.target.value)}
                      min="0"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Описание *</Label>
                <textarea
                  id="description"
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Расскажите о своем путешествии, впечатлениях, интересных местах..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Images */}
            <div>
              <Label>Фотографии</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Загрузите фотографии из вашего путешествия
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Выбрать файлы
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Изображение ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Cultural Sites */}
              <div>
                <Label>Места культурного наследия</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Лувр, Эйфелева башня..."
                      value={newCulturalSite}
                      onChange={(e) => setNewCulturalSite(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCulturalSite())}
                    />
                    <Button
                      type="button"
                      onClick={addCulturalSite}
                      size="icon"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {culturalSites.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {culturalSites.map((site, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                          {site}
                          <button
                            type="button"
                            onClick={() => removeCulturalSite(index)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Places to Visit */}
              <div>
                <Label>Рекомендуемые места</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Монмартр, Сена..."
                      value={newPlaceToVisit}
                      onChange={(e) => setNewPlaceToVisit(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPlaceToVisit())}
                    />
                    <Button
                      type="button"
                      onClick={addPlaceToVisit}
                      size="icon"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {placesToVisit.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {placesToVisit.map((place, index) => (
                        <span key={index} className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                          {place}
                          <button
                            type="button"
                            onClick={() => removePlaceToVisit(index)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ratings */}
            <div>
              <Label>Оценка места</Label>
              <div className="space-y-4">
                <StarRating 
                  rating={ratings.mobility} 
                  onRatingChange={(rating) => handleRatingChange('mobility', rating)}
                  label="Передвижение" 
                />
                <StarRating 
                  rating={ratings.safety} 
                  onRatingChange={(rating) => handleRatingChange('safety', rating)}
                  label="Безопасность" 
                />
                <StarRating 
                  rating={ratings.population} 
                  onRatingChange={(rating) => handleRatingChange('population', rating)}
                  label="Населенность" 
                />
                <StarRating 
                  rating={ratings.vegetation} 
                  onRatingChange={(rating) => handleRatingChange('vegetation', rating)}
                  label="Растительность" 
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Создание...
                </span>
              ) : (
                'Создать путешествие'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 