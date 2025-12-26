const { Order } = require('../models/BarModels');

module.exports = (io) => {
    io.on('connection', async (socket) => {
        console.log('Bar User connected:', socket.id);

        try {
            const orders = await Order.findAll({
                order: [['createdAt', 'DESC']],
                limit: 100
            });
            socket.emit('initialData', { orders });
        } catch (error) {
            console.error('Error fetching initial orders for socket:', error);
        }

        socket.on('disconnect', () => {
            console.log('Bar User disconnected:', socket.id);
        });
    });
};
