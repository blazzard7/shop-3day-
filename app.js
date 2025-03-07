import express from 'express';

const app = express();
const port = 3000;

// Entity 1: Shop (Parent Class)
class Shop {
    constructor(shop_id, name, location) {
        this.shop_id = shop_id;
        this.name = name;
        this.location = location;
    }

    describe() {
        return `Shop: ${this.name} located at ${this.location}`;
    }
}

// Entity 2: Product (Child Class inheriting from Shop)
class Product extends Shop {
    constructor(product_id, shop_id, name, description, price, category) {
        super(shop_id, null, null); 
        this.product_id = product_id;
        this.shop_id = shop_id; 
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
    }

    displayProduct() {
        return `Product: ${this.name}, Price: $${this.price}, Category: ${this.category}`;
    }
}

// Storage
let shops = [
    new Shop("SHOP001", "TechStore", "123 Main Street"),
    new Shop("SHOP002", "BookHaven", "456 Oak Avenue")
];

let products = [
    new Product("PROD001", "SHOP001", "Laptop", "High-performance laptop", 1200, "Electronics"),
    new Product("PROD002", "SHOP001", "Smartphone", "Latest smartphone model", 800, "Electronics"),
    new Product("PROD003", "SHOP002", "The Lord of the Rings", "Fantasy novel by J.R.R. Tolkien", 25, "Books")
];

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes for Shops
// GET /shops - Get all shops
app.get('/shops', (req, res) => {
    res.json(shops);
});

// GET /shops/:shop_id - Get a shop by ID
app.get('/shops/:shop_id', (req, res) => {
    const shop_id = req.params.shop_id;
    const shop = shops.find(shop => shop.shop_id === shop_id);

    if (shop) {
        res.json(shop);
    } else {
        res.status(404).json({ message: 'Shop not found' });
    }
});

// POST /shops - Create a new shop
app.post('/shops', (req, res) => {
    const {name, location} = req.body;

    if (!name || !location) {
        return res.status(400).json({message: 'Missing required fields (name, location)'});
    }

    const new_shop_id = String(Date.now());
    const newShop = new Shop(new_shop_id, name, location);
    shops.push(newShop);
    res.status(201).json(newShop);
});

// PUT /shops/:shop_id - Update a shop by ID
app.put('/shops/:shop_id', (req, res) => {
    const shop_id = req.params.shop_id;
    const {name, location} = req.body;

    const shopIndex = shops.findIndex(shop => shop.shop_id === shop_id);

    if (shopIndex !== -1) {
        shops[shopIndex] = {...shops[shopIndex], name, location};
        res.json(shops[shopIndex]);
    } else {
        res.status(404).json({message: 'Shop not found'});
    }
});

// DELETE /shops/:shop_id - Delete a shop by ID
app.delete('/shops/:shop_id', (req, res) => {
    const shop_id = req.params.shop_id;
    shops = shops.filter(shop => shop.shop_id !== shop_id);

    
    products = products.filter(product => product.shop_id !== shop_id);

    res.status(204).send();
});

// Routes for Products
// GET /products - Get all products
app.get('/products', (req, res) => {
    res.json(products);
});

// GET /products/:product_id - Get a product by ID
app.get('/products/:product_id', (req, res) => {
    const product_id = req.params.product_id;
    const product = products.find(product => product.product_id === product_id);

    if (product) {
        res.json(product);
    } else {
        res.status(404).json({message: 'Product not found'});
    }
});

// POST /products - Create a new product
app.post('/products', (req, res) => {
    const {shop_id, name, description, price, category} = req.body;

    if (!shop_id || !name || !price || !category) {
        return res.status(400).json({message: 'Missing required fields (shop_id, name, price, category)'});
    }

    const new_product_id = String(Date.now());
    const newProduct = new Product(new_product_id, shop_id, name, description, price, category);
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// PUT /products/:product_id - Update a product by ID
app.put('/products/:product_id', (req, res) => {
    const product_id = req.params.product_id;
    const {shop_id, name, description, price, category} = req.body;

    const productIndex = products.findIndex(product => product.product_id === product_id);

    if (productIndex !== -1) {
        products[productIndex] = {...products[productIndex], shop_id, name, description, price, category};
        res.json(products[productIndex]);
    } else {
        res.status(404).json({message: 'Product not found'});
    }
});

// DELETE /products/:product_id - Delete a product by ID
app.delete('/products/:product_id', (req, res) => {
    const product_id = req.params.product_id;
    products = products.filter(product => product.product_id !== product_id);
    res.status(204).send();
});

// Root route
app.get('/', (req, res) => {
    res.send('Shop and Product API is running!');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});