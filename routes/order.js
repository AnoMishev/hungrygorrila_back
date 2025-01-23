const express = require('express');
const db = require('../db'); // Adjust path if needed
const router = express.Router();
const verifyAdmin = require('../middlewares/verifyadmin')
const verifyToken = require('../middlewares/verifytoken')
router.use(verifyToken);

// Add an order
router.post('/', async (req, res) => {
    const { userId, items, status = 'pending' } = req.body;

    // Ensure the request contains valid order data
    if (!userId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Invalid order data' });
    }

    // Get the current timestamp (milliseconds since Unix epoch)
    const dateCreated = Date.now();

    // Insert the order into the 'orders' table
    db.run(
        `INSERT INTO orders (userId, dateCreated, status) VALUES (?, ?, ?)`,
        [userId, dateCreated, status],
        function (err) {
            if (err) {
                console.error('Error inserting order:', err.message);
                return res.status(500).json({ error: 'Failed to create order' });
            }

            const orderId = this.lastID;  // The ID of the newly created order

            // Prepare the 'orderItems' insert statement
            const itemInsertStmt = db.prepare(
                `INSERT INTO orderItems (orderId, itemId, quantity) VALUES (?, ?, ?)`
            );

            let itemInsertPromises = items.map((item) => {
                return new Promise((resolve, reject) => {
                    itemInsertStmt.run(orderId, item.itemId, item.quantity, (err) => {
                        if (err) {
                            console.error('Error inserting order item:', err.message);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            });

            // After all items have been inserted, finalize the statement and send the response
            Promise.all(itemInsertPromises)
                .then(() => {
                    itemInsertStmt.finalize((finalizeErr) => {
                        if (finalizeErr) {
                            console.error('Error finalizing statement:', finalizeErr.message);
                            return res.status(500).json({ error: 'Failed to finalize order items' });
                        }

                        // Fetch the newly created order details
                        db.all(
                            `SELECT o.id as orderId, o.userId, o.dateCreated, o.status,
                             oi.itemId, oi.quantity 
                             FROM orders o 
                             JOIN orderItems oi ON o.id = oi.orderId 
                             WHERE o.id = ?`,
                            [orderId],
                            (fetchErr, rows) => {
                                if (fetchErr) {
                                    console.error('Error fetching order details:', fetchErr.message);
                                    return res.status(500).json({ error: 'Failed to fetch order details' });
                                }

                                const orderDetails = {
                                    orderId,
                                    userId,
                                    dateCreated,
                                    status,
                                    items: rows.map(row => ({
                                        itemId: row.itemId,
                                        quantity: row.quantity,
                                    })),
                                };

                                // Send the order details as a response
                                res.status(201).json(orderDetails);
                            }
                        );
                    });
                })
                .catch((err) => {
                    console.error('Error processing order items:', err.message);
                    res.status(500).json({ error: 'Failed to add order items' });
                });
        }
    );
});

// Fetch user orders with status
router.get('/user-orders/:userId', (req, res) => {
    const userId = req.params.userId;
    // Fetch orders with related order items and status
    db.all(
        `SELECT o.id as orderId, o.dateCreated, o.status, oi.itemId, oi.quantity, f.name, f.price 
         FROM orders o
         JOIN orderItems oi ON o.id = oi.orderId
         JOIN food f ON oi.itemId = f.id
         WHERE o.userId = ?`,
        [userId],
        (err, rows) => {
            if (err) {
                console.error('Error fetching orders:', err.message);
                return res.status(500).json({ error: 'Failed to fetch orders' });
            }

            // Organize the data into orders with their items and status
            const orders = [];
            rows.forEach(row => {
                let order = orders.find(o => o.orderId === row.orderId);
                if (!order) {
                    order = { orderId: row.orderId, dateCreated: row.dateCreated, status: row.status, items: [] };
                    orders.push(order);
                }

                order.items.push({
                    itemId: row.itemId,
                    name: row.name,
                    quantity: row.quantity,
                    price: row.price,
                });
            });
            
            res.json(orders);
        }
    );
});

// Fetch all orders with status
router.get('/all-orders', (req, res) => {
    // Fetch all orders with related order items and status
    db.all(
        `SELECT 
            o.id as orderId, 
            o.userId, 
            o.dateCreated, 
            o.status,
            oi.itemId, 
            oi.quantity, 
            f.name as itemName, 
            f.price 
         FROM orders o
         JOIN orderItems oi ON o.id = oi.orderId
         JOIN food f ON oi.itemId = f.id`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Error fetching all orders:', err.message);
                return res.status(500).json({ error: 'Failed to fetch orders' });
            }

            // Organize the data into orders grouped by orderId
            const orders = [];
            rows.forEach(row => {
                let order = orders.find(o => o.orderId === row.orderId);
                if (!order) {
                    order = { 
                        orderId: row.orderId, 
                        userId: row.userId, 
                        dateCreated: row.dateCreated, 
                        status: row.status, 
                        items: [] 
                    };
                    orders.push(order);
                }

                order.items.push({
                    itemId: row.itemId,
                    name: row.itemName,
                    quantity: row.quantity,
                    price: row.price,
                });
            });

            res.json(orders);
        }
    );
});

// Approve an order (change status to 'in progress')
router.put('/approve-order/:orderId', verifyAdmin, (req, res) => {
    const orderId = req.params.orderId;

    // Update the order status to 'in progress'
    db.run(
        `UPDATE orders SET status = ? WHERE id = ?`,
        ['in progress', orderId],
        function (err) {
            if (err) {
                console.error('Error updating order status:', err.message);
                return res.status(500).json({ error: 'Failed to approve order' });
            }

            if (this.changes === 0) {
                // If no rows were affected (order not found)
                return res.status(404).json({ error: 'Order not found' });
            }

            res.status(200).json({ message: 'Order approved' });
        }
    );
});

// Delete order (only accessible to admins)
router.delete('/delete-order/:orderId', verifyAdmin, (req, res) => {
    const orderId = req.params.orderId;

    db.get(
        `SELECT status FROM orders WHERE id = ?`,
        [orderId],
        (err, row) => {
            if (err) {
                console.error('Error fetching order status:', err.message);
                return res.status(500).json({ error: 'Failed to check order status' });
            }
            if (!row || row.status !== 'in progress') {
                return res.status(400).json({ error: 'Order must be in progress to delete' });
            }

            db.run(
                `DELETE FROM orders WHERE id = ?`,
                [orderId],
                function (err) {
                    if (err) {
                        console.error('Error deleting order:', err.message);
                        return res.status(500).json({ error: 'Failed to delete order' });
                    }

                    res.status(200).json({ message: 'Order deleted successfully' });
                }
            );
        }
    );
});
module.exports = router;
