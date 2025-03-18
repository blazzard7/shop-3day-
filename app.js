import express from 'express';
import { Sequelize, DataTypes } from 'sequelize';
import { body, validationResult } from 'express-validator';

const app = express();
const port = 3000;

// Database Configuration (SQLite for simplicity)
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false // Disable logging for cleaner console output
});


// Shop Model Definition
const Shop = sequelize.define('Shop', {
    shop_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Shop name cannot be empty'
            }
        }
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Shop location cannot be empty'
            }
        }
    }
}, {
    tableName: 'shops',
    timestamps: true // Enable timestamps (createdAt, updatedAt)
});

// Product Model Definition
const Product = sequelize.define('Product', {
    product_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { // Foreign key
            model: Shop,
            key: 'shop_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Product name cannot be empty'
            }
        }
    },
    description: {
        type: DataTypes.TEXT
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            isFloat: {
                msg: 'Price must be a valid number'
            },
            min: {
                args: [0],
                msg: 'Price must be a non-negative number'
            }
        }
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Category cannot be empty'
            }
        }
    }
}, {
    tableName: 'products',
    timestamps: true
});

// Establish relationships (important for foreign keys and associations)
Shop.hasMany(Product, { foreignKey: 'shop_id', as: 'products' }); // Shop has many Products
Product.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });  // Product belongs to a Shop



(async () => {
    try {
        await sequelize.sync({ force: false });  // Use { force: true } to drop and recreate tables
        console.log('Database synchronized');

        // Seed data
        if (await Shop.count() === 0) {
            const techStore = await Shop.create({ name: 'TechStore', location: '123 Main Street' });
            const bookHaven = await Shop.create({ name: 'BookHaven', location: '456 Oak Avenue' });

            await Product.bulkCreate([
                { shop_id: techStore.shop_id, name: 'Laptop', description: 'High-performance laptop', price: 1200, category: 'Electronics' },
                { shop_id: techStore.shop_id, name: 'Smartphone', description: 'Latest smartphone model', price: 800, category: 'Electronics' },
                { shop_id: bookHaven.shop_id, name: 'The Lord of the Rings', description: 'Fantasy novel by J.R.R. Tolkien', price: 25, category: 'Books' }
            ]);
            console.log('Database seeded with initial data');
        }

    } catch (error) {
        console.error('Unable to synchronize the database:', error);
    }
})();


// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});


// --- Routes for Shops ---
// GET /shops - Get all shops
app.get('/shops', async (req, res) => {
    try {
        const shops = await Shop.findAll();
        res.json(shops);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /shops/:shop_id - Get a shop by ID
app.get('/shops/:shop_id', async (req, res) => {
    const shop_id = req.params.shop_id;

    try {
        const shop = await Shop.findByPk(shop_id, { include: [{ model: Product, as: 'products' }] }); // Include associated products
        if (shop) {
            res.json(shop);
        } else {
            res.status(404).json({ message: 'Shop not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /shops - Create a new shop
app.post(
    '/shops',
    [
        body('name').notEmpty().withMessage('Shop name is required'),
        body('location').notEmpty().withMessage('Shop location is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, location } = req.body;

        try {
            const newShop = await Shop.create({ name, location });
            res.status(201).json(newShop);
        } catch (error) {
            console.error(error);
             if (error.name === 'SequelizeValidationError') {
                const sequelizeErrors = error.errors.map(err => ({
                    param: err.path,
                    msg: err.message
                }));
                return res.status(400).json({ errors: sequelizeErrors });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// PUT /shops/:shop_id - Update a shop by ID
app.put(
    '/shops/:shop_id',
    [
        body('name').optional().notEmpty().withMessage('Shop name cannot be empty'),
        body('location').optional().notEmpty().withMessage('Shop location cannot be empty')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const shop_id = req.params.shop_id;
        const { name, location } = req.body;

        try {
            const shop = await Shop.findByPk(shop_id);
            if (!shop) {
                return res.status(404).json({ message: 'Shop not found' });
            }

            await shop.update({ name, location });
            res.json(shop);
        } catch (error) {
            console.error(error);
              if (error.name === 'SequelizeValidationError') {
                const sequelizeErrors = error.errors.map(err => ({
                    param: err.path,
                    msg: err.message
                }));
                return res.status(400).json({ errors: sequelizeErrors });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// DELETE /shops/:shop_id - Delete a shop by ID
app.delete('/shops/:shop_id', async (req, res) => {
    const shop_id = req.params.shop_id;

    try {
        const shop = await Shop.findByPk(shop_id);
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        await shop.destroy();
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Routes for Products ---
// GET /products - Get all products
app.get('/products', async (req, res) => {
    try {
        const products = await Product.findAll();
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /products/:product_id - Get a product by ID
app.get('/products/:product_id', async (req, res) => {
    const product_id = req.params.product_id;

    try {
        const product = await Product.findByPk(product_id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /products - Create a new product
app.post(
    '/products',
    [
        body('shop_id').notEmpty().withMessage('Shop ID is required'), // Assuming shop_id exists and is valid
        body('name').notEmpty().withMessage('Product name is required'),
        body('price').notEmpty().withMessage('Price is required').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
        body('category').notEmpty().withMessage('Category is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { shop_id, name, description, price, category } = req.body;

        try {
            const newProduct = await Product.create({ shop_id, name, description, price, category });
            res.status(201).json(newProduct);
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeValidationError') {
                const sequelizeErrors = error.errors.map(err => ({
                    param: err.path,
                    msg: err.message
                }));
                return res.status(400).json({ errors: sequelizeErrors });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// PUT /products/:product_id - Update a product by ID
app.put(
    '/products/:product_id',
    [
        body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
        body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    ],
    async (req, res) => {
        const product_id = req.params.product_id;
        const { shop_id, name, description, price, category } = req.body;

        try {
            const product = await Product.findByPk(product_id);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            await product.update({ shop_id, name, description, price, category });
            res.json(product);
        } catch (error) {
            console.error(error);
             if (error.name === 'SequelizeValidationError') {
                const sequelizeErrors = error.errors.map(err => ({
                    param: err.path,
                    msg: err.message
                }));
                return res.status(400).json({ errors: sequelizeErrors });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// DELETE /products/:product_id - Delete a product by ID
app.delete('/products/:product_id', async (req, res) => {
    const product_id = req.params.product_id;

    try {
        const product = await Product.findByPk(product_id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await product.destroy();
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('Shop and Product API is running!');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});