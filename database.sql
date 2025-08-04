-- Создание расширения для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица путешествий
CREATE TABLE travels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0,
    images TEXT[], -- Массив URL изображений
    cultural_sites TEXT[], -- Массив мест культурного наследия
    places_to_visit TEXT[], -- Массив рекомендуемых мест
    ratings JSONB NOT NULL DEFAULT '{"mobility": 0, "safety": 0, "population": 0, "vegetation": 0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_travels_user_id ON travels(user_id);
CREATE INDEX idx_travels_created_at ON travels(created_at DESC);
CREATE INDEX idx_users_email ON users(email);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travels_updated_at BEFORE UPDATE ON travels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставка тестовых данных (опционально)
INSERT INTO users (email, password_hash, name) VALUES
('test@example.com', '$2b$10$rQZ8K9mN2pL3sX1vB4cE7t', 'Тестовый пользователь');

INSERT INTO travels (user_id, title, description, location, cost, images, cultural_sites, places_to_visit, ratings) VALUES
(
    (SELECT id FROM users WHERE email = 'test@example.com'),
    'Путешествие в Париж',
    'Незабываемая поездка в столицу Франции. Посетили Эйфелеву башню, Лувр, Нотр-Дам.',
    'Париж, Франция',
    50000.00,
    ARRAY['https://images.unsplash.com/photo-1502602898535-892dd25850e0?w=400'],
    ARRAY['Эйфелева башня', 'Лувр'],
    ARRAY['Монмартр', 'Сена'],
    '{"mobility": 4, "safety": 5, "population": 5, "vegetation": 3}'::jsonb
); 