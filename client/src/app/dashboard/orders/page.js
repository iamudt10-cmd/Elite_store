'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useUiStore } from '../../../store/uiStore';
import { FiChevronDown, FiChevronUp, FiCalendar, FiBox } from 'react-icons/fi';
import GlassCard from '../../../components/ui/GlassCard';
import GlassBadge from '../../../components/ui/GlassBadge';
import api from '../../../lib/api';

export default function UserOrders() {
  const { token } = useAuthStore();
  const { siteSettings } = useUiStore();
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState('');

  const symbol = siteSettings.currency_symbol || '₹';

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders');
        if (data.success) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error('Fetch orders error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? '' : id);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACCEPTED':
      case 'DELIVERED':
        return 'success';
      case 'REFUNDED':
      case 'REJECTED':
      case 'CANCELLED':
        return 'danger';
      case 'PROCESSING':
      case 'SHIPPED':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <GlassCard className="text-center py-16" hover={false}>
        <div className="w-12 h-12 rounded-full bg-white/40 flex items-center justify-center mx-auto text-gray-400 mb-4">
          <FiBox size={20} />
        </div>
        <h3 className="text-base font-bold text-gray-700">No Orders Yet</h3>
        <p className="text-sm text-gray-400 mt-1">Place your first order to see history records here.</p>
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="border-b border-white/20 pb-3 mb-1">
        <h2 className="text-lg font-bold text-gray-800">Your Order History</h2>
        <p className="text-xs text-gray-400 mt-0.5">Track your package delivery states</p>
      </div>

      <div className="flex flex-col gap-4">
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

          return (
            <GlassCard key={order.id} className="p-0 overflow-hidden" hover={false}>
              {/* Summary Bar Header Clickable trigger */}
              <div
                onClick={() => toggleExpand(order.id)}
                className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-white/15 transition-colors select-none"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Order Number</p>
                    <p className="font-bold text-sm text-gray-800">{order.orderNumber}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-gray-400">Date Placed</p>
                    <p className="font-semibold text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                      <FiCalendar size={13} /> {formattedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total Price</p>
                    <p className="font-bold text-sm text-lavender-600">{symbol}{order.total.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <GlassBadge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </GlassBadge>
                    <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-white/40">
                      {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsed Detailed summary */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-3 border-t border-white/20 bg-white/5 flex flex-col gap-4 text-xs md:text-sm text-gray-600">
                  {/* Delivery details row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1.5">Shipping Destination</h4>
                      <p className="font-semibold text-gray-800">{order.shippingName}</p>
                      <p className="mt-0.5">{order.shippingStreet}</p>
                      <p>{order.shippingCity}, {order.shippingState} - {order.shippingZip}</p>
                      <p>{order.shippingCountry}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div>
                        <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">Status Timestamps</h4>
                        <p>Placed At: {new Date(order.createdAt).toLocaleString('en-IN')}</p>
                        {order.acceptedAt && <p className="text-mint-500">Accepted At: {new Date(order.acceptedAt).toLocaleString('en-IN')}</p>}
                        {order.rejectedAt && <p className="text-red-500">Rejected At: {new Date(order.rejectedAt).toLocaleString('en-IN')}</p>}
                      </div>
                      
                      {order.rejectedReason && (
                        <div className="bg-red-50/50 border border-red-100/50 p-2.5 rounded-xl text-red-500 font-semibold text-xs mt-1">
                          Rejection Reason: {order.rejectedReason}
                        </div>
                      )}
                      
                      {order.adminNote && (
                        <div className="bg-white/40 border border-white/40 p-2.5 rounded-xl text-gray-500 text-xs">
                          Admin Note: {order.adminNote}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div>
                    <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-3">Order Items</h4>
                    <div className="flex flex-col gap-3">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image || 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=100'}
                              alt={item.name}
                              className="w-10 aspect-[3/4] object-cover rounded-lg border border-white/20"
                            />
                            <div>
                              <p className="font-semibold text-gray-800">{item.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Qty: {item.quantity} {item.size ? `| Size: ${item.size}` : ''} {item.color ? `| Color: ${item.color}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-gray-700">
                            {symbol}{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipment Tracking Timeline */}
                  <div className="border-t border-white/10 pt-4 mt-2">
                    <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-3">Shipment Tracking</h4>
                    {order.trackingNumber ? (
                      <div className="flex flex-col gap-4">
                        <div className="bg-white/30 border border-white/40 p-3 rounded-2xl flex flex-wrap justify-between items-center text-xs">
                          <div>
                            <span className="text-gray-400 font-semibold uppercase text-[9px] block">Carrier Partner</span>
                            <span className="font-bold text-gray-800">{order.shippingCarrier}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold uppercase text-[9px] block">AWB Tracking Code</span>
                            <span className="font-mono font-extrabold text-gray-800">{order.trackingNumber}</span>
                          </div>
                          {order.shippingLabelUrl && (
                            <a
                              href={`${api.defaults.baseURL.replace('/api', '')}${order.shippingLabelUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-lavender-500/10 border border-lavender-200 text-lavender-600 px-3 py-1.5 rounded-xl font-bold hover:bg-lavender-500/20 transition-all mt-2 sm:mt-0"
                            >
                              Print Label
                            </a>
                          )}
                        </div>

                        {/* Render RTO / Cancelled alert status if applicable */}
                        {order.deliveryStatus === 'RTO' ? (
                          <div className="bg-red-50 border border-red-100 p-3 rounded-2xl text-red-500 text-xs font-semibold">
                            Return to Origin (RTO) Initiated: The parcel could not be delivered and is returning back to our warehouse.
                          </div>
                        ) : order.deliveryStatus === 'CANCELLED' ? (
                          <div className="bg-red-50 border border-red-100 p-3 rounded-2xl text-red-500 text-xs font-semibold">
                            Shipment Cancelled: Delivery dispatch has been recalled or cancelled.
                          </div>
                        ) : (
                          /* Happy Path Timeline */
                          <div className="grid grid-cols-5 gap-1.5 text-center mt-2 relative select-none">
                            {/* Connector Lines */}
                            <div className="absolute top-[13px] left-[10%] right-[10%] h-[2px] bg-white/30 z-0">
                              <div
                                className="h-full bg-mint-400 transition-all duration-500"
                                style={{
                                  width:
                                    order.status === 'DELIVERED' || order.deliveryStatus === 'DELIVERED'
                                      ? '100%'
                                      : order.deliveryStatus === 'OUT_FOR_DELIVERY'
                                      ? '75%'
                                      : order.deliveryStatus === 'IN_TRANSIT'
                                      ? '50%'
                                      : order.deliveryStatus === 'PICKUP_GENERATED'
                                      ? '25%'
                                      : '0%',
                                }}
                              />
                            </div>

                            {/* Timeline Nodes */}
                            {[
                              { label: 'Confirmed', check: true },
                              { label: 'Dispatched', check: ['PICKUP_GENERATED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.deliveryStatus) },
                              { label: 'In Transit', check: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.deliveryStatus) },
                              { label: 'Out for Delivery', check: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.deliveryStatus) },
                              { label: 'Delivered', check: order.status === 'DELIVERED' || order.deliveryStatus === 'DELIVERED' },
                            ].map((node, i) => (
                              <div key={i} className="flex flex-col items-center z-10">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                                    node.check
                                      ? 'bg-mint-400 text-white border-transparent'
                                      : 'glass bg-white/40 text-gray-400 border-white/30'
                                  }`}
                                >
                                  {node.check ? '✓' : i + 1}
                                </div>
                                <span className={`text-[9px] md:text-[10px] font-bold mt-1.5 leading-tight ${node.check ? 'text-mint-600' : 'text-gray-400'}`}>
                                  {node.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Preparing Order sensible fallback */
                      <div className="bg-lavender-50/50 border border-lavender-100/50 p-4 rounded-2xl flex flex-col gap-1.5 text-xs text-left">
                        <div className="flex items-center gap-2 text-lavender-600 font-bold">
                          <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                          <span>Preparing Your Package</span>
                        </div>
                        <p className="text-gray-400">
                          We are carefully inspecting, packing, and preparing your order items at our central hub. Tracking waybill will update here as soon as the courier pick-up is scheduled.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Calculations row */}
                  <div className="flex flex-col items-end gap-1.5 border-t border-white/10 pt-4 text-xs">
                    <div className="flex justify-between w-48">
                      <span>Subtotal</span>
                      <span className="font-semibold">{symbol}{order.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between w-48 text-mint-500">
                        <span>Promo Discount</span>
                        <span>-{symbol}{order.discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between w-48">
                      <span>Shipping Fee</span>
                      <span>{order.shippingCost === 0 ? 'FREE' : `${symbol}${order.shippingCost.toLocaleString('en-IN')}`}</span>
                    </div>
                    <div className="flex justify-between w-48 border-t border-white/10 pt-1.5 mt-1 text-sm font-bold text-gray-800">
                      <span>Total Paid</span>
                      <span className="text-lavender-600">{symbol}{order.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
