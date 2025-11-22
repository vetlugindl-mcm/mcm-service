## Типы Базы Данных

* Создать `types/database.ts` с интерфейсами:

  * `Client`: `id`, `full_name`, `status`, `extracted_data: any`, `created_at`.

  * `Document`: `id`, `client_id`, `filename`, `path`, `mime_type?`, `size?`, `created_at`.

* Названия и типы полей соответствуют ожидаемой схеме Supabase; при необходимости скорректируем под фактические колонки.

## Supabase Клиенты

* Добавить `src/lib/supabase/server.ts` для серверного клиента: `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)`.

* Добавить `src/lib/supabase/client.ts` для фронтенда (браузер), используем те же публичные env.

## Server Actions (`app/actions/`)

* `getClients.ts` ("use server"): вернуть `Client[]` — `select * from clients order by created_at desc`.

* `createClient.ts` ("use server"): принять `full_name: string`, вставить запись с `status: 'new'`, вернуть созданного клиента, вызвать `revalidatePath('/')`.

* `uploadFile.ts` ("use server"): принять метаданные уже загруженного файла (`client_id`, `filename`, `path`, `mime_type?`, `size?`), создать запись в `documents`, `revalidatePath('/client/[id]')`.

## Главная Страница (`app/page.tsx`)

* Серверный компонент: загрузить список клиентов через `getClients`.

* Верхняя панель: заголовок `МСМ Сервис / НОПРИЗ`.

* Кнопка `Новая заявка` (Shadcn `Button`) открывает `Dialog` с формой ввода ФИО (`Input`).

* По клику `Создать` вызвать `createClient` и обновить список (revalidate). Успех — закрыть диалог.

* Список клиентов: `Card`/простая таблица с колонками `ФИО`, `Статус`, `Дата`; строки кликабельны, ведут на `/client/[id]`.

## Страница Клиента (`app/client/[id]/page.tsx`)

* Серверный компонент: получить клиента и его документы (`select * from documents where client_id = :id order by created_at desc`).

* Макет:

  * Слева: информация о клиенте (`Card`): ФИО, статус, дата.

  * Справа: зона загрузки (`Card`) с `input type="file"` (базовая реализация).

    * На фронте использовать `supabase.storage.from('documents').upload('client/<id>/<filename>', file)`.

    * После успешной загрузки — вызвать серверный `uploadFile` для записи в БД и обновить страницу (`router.refresh()`).

* Снизу: список загруженных файлов (название, дата; при желании — ссылка на публичный путь, если настроен public).

## UI/Компоненты

* Использовать уже добавленные компоненты Shadcn: `button`, `input`, `card`, `label`, `textarea`, `dialog`.

* Tailwind для компоновки: двухколоночный layout на странице клиента; адаптивные классы.

## Валидация

* Проверить: создание клиента через диалог, отображение списка на главной, переход на страницу клиента, загрузка файла в бакет и запись в `documents`.

* Локально протестировать на `http://localhost:3000/`.

## Примечания

* Пока не подключаем Gemini; сконцентрируемся на CRUD клиента и загрузках.

* При несовпадении схемы — оперативно скорректируем интерфейсы и запросы под фактические поля.

