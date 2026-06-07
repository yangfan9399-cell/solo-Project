import { getOrders, getCustomerById, getCleanerById } from '../db/mockData';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const status = query.status as string;
  const city = query.city as string;
  const serviceType = query.serviceType as string;

  let orders = getOrders();

  if (status) {
    orders = orders.filter(o => o.status === status);
  }
  if (city) {
    orders = orders.filter(o => o.city === city);
  }
  if (serviceType) {
    orders = orders.filter(o => o.serviceType === serviceType);
  }

  const ordersWithDetails = orders.map(order => ({
    ...order,
    customer: getCustomerById(order.customerId),
    cleaner: order.cleanerId ? getCleanerById(order.cleanerId) : null,
  }));

  return {
    success: true,
    data: ordersWithDetails,
  };
});
