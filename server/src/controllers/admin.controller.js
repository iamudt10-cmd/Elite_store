const prisma = require('../config/db');

const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProducts, totalOrders] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.product.count(),
      prisma.order.count(),
    ]);

    // Sum total revenue of DELIVERED / SHIPPED / ACCEPTED / PROCESSING orders
    const revenueAggregation = await prisma.order.aggregate({
      where: {
        status: {
          in: ['ACCEPTED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
      },
      _sum: {
        total: true,
      },
    });

    const totalRevenue = revenueAggregation._sum.total || 0;

    // Status breakdown
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const ordersByStatus = {
      PENDING: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    statusCounts.forEach((s) => {
      ordersByStatus[s.status] = s._count.id;
    });

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        ordersByStatus,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    // 1. Daily sales and order volume for past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: {
          in: ['ACCEPTED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group sales by day
    const salesByDay = {};
    const ordersByDay = {};
    
    // Initialize past 30 days with 0s
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      salesByDay[dateStr] = 0;
      ordersByDay[dateStr] = 0;
    }

    orders.forEach((o) => {
      const dateStr = o.createdAt.toISOString().split('T')[0];
      if (salesByDay[dateStr] !== undefined) {
        salesByDay[dateStr] += o.total;
        ordersByDay[dateStr] += 1;
      }
    });

    const dailyMetrics = Object.keys(salesByDay)
      .sort()
      .map((date) => ({
        date,
        sales: salesByDay[date],
        orders: ordersByDay[date],
      }));

    // 2. Top-selling products
    const orderItems = await prisma.orderItem.findMany({
      select: {
        productId: true,
        name: true,
        quantity: true,
        price: true,
        image: true,
      },
    });

    const productSales = {};
    orderItems.forEach((item) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          id: item.productId,
          name: item.name,
          image: item.image,
          unitsSold: 0,
          revenue: 0,
        };
      }
      productSales[item.productId].unitsSold += item.quantity;
      productSales[item.productId].revenue += item.price * item.quantity;
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    // 3. Category distribution (sales by category)
    const categoryMetrics = await prisma.product.findMany({
      select: {
        category: {
          select: {
            name: true,
          },
        },
        orderItems: {
          select: {
            quantity: true,
            price: true,
          },
        },
      },
    });

    const categorySales = {};
    categoryMetrics.forEach((p) => {
      const catName = p.category.name;
      if (!categorySales[catName]) {
        categorySales[catName] = 0;
      }
      p.orderItems.forEach((item) => {
        categorySales[catName] += item.price * item.quantity;
      });
    });

    const salesByCategory = Object.keys(categorySales).map((name) => ({
      name,
      value: categorySales[name],
    }));

    res.json({
      success: true,
      analytics: {
        dailyMetrics,
        topProducts,
        salesByCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getAnalytics,
};
