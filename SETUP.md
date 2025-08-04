# Инструкция по настройке и запуску

## Шаг 1: Настройка базы данных PostgreSQL

1. Установите PostgreSQL, если еще не установлен
2. Откройте командную строку и выполните:
```bash
psql -U postgres
```

3. Создайте базу данных:
```sql
CREATE DATABASE travel_diary;
\q
```

4. Импортируйте схему базы данных:
```bash
psql -U postgres -d travel_diary -f database.sql
```

## Шаг 2: Настройка подключения к базе данных

Отредактируйте файл `db.js` и укажите ваши данные для подключения:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',           // Ваш пользователь PostgreSQL
  host: 'localhost',
  database: 'travel_diary',   // Имя базы данных
  password: 'your_password',  // Ваш пароль от PostgreSQL
  port: 5432,
});

module.exports = pool;
```

## Шаг 3: Создание файла .env

Создайте файл `.env` в корне проекта:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
```

## Шаг 4: Установка зависимостей

```bash
npm install
```

## Шаг 5: Запуск приложения

### Запуск сервера (в первом терминале):
```bash
npm run dev:server
```

### Запуск клиента (во втором терминале):
```bash
npm run dev
```

## Шаг 6: Проверка работы

1. Откройте браузер и перейдите по адресу: http://localhost:3000
2. Зарегистрируйтесь или войдите в систему
3. Создайте свое первое путешествие!

## Возможные проблемы и решения

### Ошибка подключения к базе данных
- Проверьте, что PostgreSQL запущен
- Убедитесь, что данные в `db.js` корректны
- Проверьте, что база данных `travel_diary` создана

### Ошибка "Cannot find module"
- Убедитесь, что все зависимости установлены: `npm install`
- Проверьте, что файл `package-lock.json` существует

### Ошибка порта занят
- Измените порт в файле `.env` или `vite.config.ts`
- Убедитесь, что порты 3000 и 5000 свободны

## Тестовые данные

После импорта `database.sql` в базе данных будет создан тестовый пользователь:
- Email: test@example.com
- Пароль: любой (так как это тестовые данные)

## Структура проекта

```
├── src/                    # Клиентская часть (React)
│   ├── components/         # React компоненты
│   ├── services/          # API сервисы
│   ├── types/             # TypeScript типы
│   └── lib/               # Утилиты
├── server/                # Серверная часть (Express)
├── database.sql           # Схема базы данных
├── db.js                  # Конфигурация БД
└── package.json           # Зависимости
```

## Команды для разработки

- `npm run dev` - Запуск клиента
- `npm run dev:server` - Запуск сервера
- `npm run build` - Сборка для продакшена
- `npm run lint` - Проверка кода 