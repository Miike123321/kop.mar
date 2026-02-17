const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const dbPath = path.join(__dirname, 'data', 'db.json');
const usersPath = path.join(__dirname, 'data', 'users.json');
const actionsPath = path.join(__dirname, 'data', 'actions.json');

app.use(cors());
app.use(express.json());

app.post('/api/login', (req, res) => {
    const { login, password } = req.body;
    
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = users.find(u => u.login === login && u.password === password);

    if (user) {
        console.log(`👤 Користувач ${login} увійшов у систему`);
        res.json({ id: user.id, login: user.login, name: user.name });
    } else {
        res.status(401).json({ error: 'Невірний логін або пароль' });
    }
});

app.post('/api/register', (req, res) => {
    const { name, login, password } = req.body;
    
    if (!name || !login || !password) {
        return res.status(400).json({ error: 'Всі поля обов\'язкові' });
    }

    if (password.length < 3) {
        return res.status(400).json({ error: 'Пароль повинен містити мінімум 3 символи' });
    }

    let users = [];
    try {
        users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    } catch (e) {
        users = [];
    }

    if (users.find(u => u.login === login)) {
        return res.status(409).json({ error: 'Цей логін вже зареєстрований' });
    }

    const newUser = {
        id: Math.max(0, ...users.map(u => u.id)) + 1,
        login,
        password,
        name
    };

    users.push(newUser);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    console.log(`✅ Новий користувач зареєстрований: ${login}`);
    res.status(201).json({ id: newUser.id, login: newUser.login, name: newUser.name });
});

app.get('/api/actions', (req, res) => {
    try {
        const actions = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
        res.json(actions);
    } catch (e) {
        console.error('Помилка завантаження акцій:', e);
        res.status(500).json({ error: 'Помилка завантаження акцій' });
    }
});

app.get('/api/actions/available', (req, res) => {
    console.log('📥 Получен запрос к /api/actions/available');
    try {
        console.log('📂 Проверяем файл, путь:', actionsPath);
        if (!fs.existsSync(actionsPath)) {
            console.log('❌ Файл не найден');
            return res.status(404).json({ error: 'Файл акцій не знайдено' });
        }

        const rawData = fs.readFileSync(actionsPath, 'utf8');
        console.log('📄 Содержимое файла:', rawData);
        const actions = JSON.parse(rawData);
        console.log('✅ Распарсено:', actions);

        const filteredActions = actions.filter(action => 
            ['active', 'upcoming'].includes(action.status)
        );
        console.log('🔍 Отфильтровано:', filteredActions);

        res.json(filteredActions);
    } catch (error) {
        console.error('❌ Ошибка в /api/actions/available:', error);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
});

app.get('/api/actions/:id', (req, res) => {
    try {
        const actions = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
        const action = actions.find(a => a.id === req.params.id);
        
        if (action) {
            res.json(action);
        } else {
            res.status(404).json({ error: 'Акцію не знайдено' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Помилка завантаження акції' });
    }
});

app.get('/api/applications/:supplierId', (req, res) => {
    try {
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const supplierApplications = dbData.filter(app => app.supplier_id === parseInt(req.params.supplierId));
        res.json(supplierApplications);
    } catch (e) {
        res.status(500).json({ error: 'Помилка завантаження заявок' });
    }
});

app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));


