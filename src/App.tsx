import { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { MapPin, User, LogOut, Plus, Loader2 } from 'lucide-react';
import { AuthForm } from './components/AuthForm';
import TravelCard from './components/TravelCard';
import TravelDetailModal from './components/TravelDetailModal';
import TravelForm from './components/TravelForm';
import TravelEditForm from './components/TravelEditForm';
import { authAPI, travelsAPI } from './services/api';
import { User as UserType, Travel } from './types';

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

// Helper functions for localStorage
const getStoredAuth = (): { user: UserType; token: string } | null => {
  const stored = localStorage.getItem('auth');
  return stored ? JSON.parse(stored) : null;
};

const setStoredAuth = (user: UserType, token: string) => {
  localStorage.setItem('auth', JSON.stringify({ user, token }));
};

const clearStoredAuth = () => {
  localStorage.removeItem('auth');
};

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [travels, setTravels] = useState<Travel[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTravelForm, setShowTravelForm] = useState(false);
  const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null);
  const [editingTravel, setEditingTravel] = useState<Travel | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [loadingTravels, setLoadingTravels] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedAuth = getStoredAuth();
      if (storedAuth) {
        try {
          // Verify token by getting user profile
          const { user } = await authAPI.getProfile();
          setUser(user);
          await loadTravels();
        } catch (error) {
          console.error('Session validation failed:', error);
          clearStoredAuth();
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const loadTravels = async () => {
    setLoadingTravels(true);
    try {
      const response = await travelsAPI.getAll();
      setTravels(response.travels);
    } catch (error) {
      console.error('Error loading travels:', error);
      showToast('Ошибка загрузки путешествий', 'error');
    } finally {
      setLoadingTravels(false);
    }
  };

  const loadMyTravels = async () => {
    setLoadingTravels(true);
    try {
      const response = await travelsAPI.getMy();
      setTravels(response.travels);
    } catch (error) {
      console.error('Error loading my travels:', error);
      showToast('Ошибка загрузки ваших путешествий', 'error');
    } finally {
      setLoadingTravels(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      const { user, token } = await authAPI.login(email, password);
      setUser(user);
      setStoredAuth(user, token);
      await loadTravels();
      showToast(`Добро пожаловать, ${user.name}!`, 'success');
    } catch (error) {
      console.error('Sign in error:', error);
      showToast('Ошибка входа. Проверьте email и пароль.', 'error');
    }
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    try {
      const { user, token } = await authAPI.register(email, password, name);
      setUser(user);
      setStoredAuth(user, token);
      await loadTravels();
      showToast(`Аккаунт создан! Добро пожаловать, ${user.name}!`, 'success');
    } catch (error) {
      console.error('Sign up error:', error);
      showToast('Ошибка регистрации. Возможно, пользователь уже существует.', 'error');
    }
  };

  const handleSignOut = async () => {
    authAPI.logout();
    setUser(null);
    setTravels([]);
    clearStoredAuth();
    showToast('Вы вышли из аккаунта', 'info');
  };

  const handleTravelSubmit = async (travelData: Omit<Travel, 'id' | 'userId' | 'userName' | 'created_at'>) => {
    try {
      await travelsAPI.create(travelData);
      setShowTravelForm(false);
      await loadTravels();
      showToast('Путешествие успешно создано!', 'success');
    } catch (error) {
      console.error('Travel creation error:', error);
      showToast('Ошибка создания путешествия', 'error');
    }
  };

  const handleTravelUpdate = async (id: string, travelData: Partial<Omit<Travel, 'id' | 'userId' | 'userName' | 'created_at'>>) => {
    try {
      await travelsAPI.update(id, travelData);
      setEditingTravel(null);
      await loadTravels();
      showToast('Путешествие успешно обновлено!', 'success');
    } catch (error) {
      console.error('Travel update error:', error);
      showToast('Ошибка обновления путешествия', 'error');
    }
  };

  const handleTravelDelete = async (id: string) => {
    try {
      await travelsAPI.delete(id);
      setEditingTravel(null);
      await loadTravels();
      showToast('Путешествие успешно удалено!', 'success');
    } catch (error) {
      console.error('Travel deletion error:', error);
      showToast('Ошибка удаления путешествия', 'error');
    }
  };

  const handleTravelClick = (travel: Travel) => {
    setSelectedTravel(travel);
  };

  const handleTabChange = (tab: 'all' | 'my') => {
    setActiveTab(tab);
    if (tab === 'all') {
      loadTravels();
    } else {
      loadMyTravels();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <AuthForm onSignIn={handleSignIn} onSignUp={handleSignUp} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <MapPin className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-semibold">Дневник путешествий</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.name}</span>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-4 border-b">
            <button
              onClick={() => handleTabChange('all')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Все путешествия
            </button>
            <button
              onClick={() => handleTabChange('my')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Мои путешествия
            </button>
          </div>
        </div>

        {/* Add Travel Button */}
        <div className="mb-6">
          <Button onClick={() => setShowTravelForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить путешествие
          </Button>
        </div>

        {/* Travels Grid */}
        {loadingTravels ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Загрузка путешествий...</p>
          </div>
        ) : travels.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'all' ? 'Пока нет путешествий' : 'У вас пока нет путешествий'}
              </h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'all' 
                  ? 'Будьте первым, кто поделится своим путешествием!'
                  : 'Создайте свое первое путешествие и поделитесь впечатлениями!'
                }
              </p>
              {activeTab === 'my' && (
                <Button onClick={() => setShowTravelForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить путешествие
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {travels.map((travel) => (
              <TravelCard
                key={travel.id}
                travel={travel}
                onClick={handleTravelClick}
                onEdit={activeTab === 'my' ? setEditingTravel : undefined}
                showEditButton={activeTab === 'my'}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showTravelForm && (
        <TravelForm
          user={user}
          onSubmit={handleTravelSubmit}
          onClose={() => setShowTravelForm(false)}
        />
      )}

      {selectedTravel && (
        <TravelDetailModal
          travel={selectedTravel}
          onClose={() => setSelectedTravel(null)}
        />
      )}

      {editingTravel && (
        <TravelEditForm
          travel={editingTravel}
          user={user}
          onSubmit={handleTravelUpdate}
          onDelete={handleTravelDelete}
          onClose={() => setEditingTravel(null)}
        />
      )}
    </div>
  );
} 