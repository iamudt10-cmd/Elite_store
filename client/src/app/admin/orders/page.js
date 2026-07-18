'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useUiStore } from '../../../store/uiStore';
import { FiCheck, FiX, FiEye } from 'react-icons/fi';
import GlassCard from '../../../components/ui/GlassCard';
import GlassBadge from '../../../components/ui/GlassBadge';
import GlassButton from '../../../components/ui/GlassButton';
import GlassModal from '../../../components/ui/GlassModal';
import GlassSelect from '../../../components/ui/GlassSelect';
import GlassInput from '../../../components/ui/GlassInput';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const { token } = useAuthStore();
  const { siteSettings } = useUiStore();
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Accept / Reject modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const symbol = siteSettings.currency_symbol || '₹';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/orders/admin/all?limit=100');
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error('Fetch admin orders error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (id, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to ACCEPT this order?')) return;

    setActionLoading(true);
    try {
      const { data } = await api.put(`/orders/${id}/accept`, {
        adminNote: 'Order verified and accepted by administrator.',
      });
      if (data.success) {
        toast.success('Order accepted successfully!');
        fetchOrders();
        if (selectedOrder?.id === id) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      toast.error('Failed to accept order');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (id, e) => {
    if (e) e.stopPropagation();
    setRejectOrderId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    setActionLoading(true);
    try {
      const { data } = await api.put(`/orders/${rejectOrderId}/reject`, {
        rejectedReason: rejectReason,
        adminNote: `Order rejected by administrator. Reason: ${rejectReason}`,
      });
      if (data.success) {
        toast.success('Order rejected. Stock inventory restored.');
        setRejectModalOpen(false);
        fetchOrders();
        if (selectedOrder?.id === rejectOrderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      toast.error('Failed to reject order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { data } = await api.put(`/orders/${id}/status`, {
        status: newStatus,
        adminNote: `Order status updated to ${newStatus} by administrator.`,
      });
      if (data.success) {
        toast.success('Order status updated successfully');
        fetchOrders();
        if (selectedOrder?.id === id) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACCEPTED':
      case 'DELIVERED':
        return 'success';
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

  const orderStatuses = [
    { label: 'ACCEPTED', value: 'ACCEPTED' },
    { label: 'PROCESSING', value: 'PROCESSING' },
    { label: 'SHIPPED', value: 'SHIPPED' },
    { label: 'DELIVERED', value: 'DELIVERED' },
    { label: 'CANCELLED', value: 'CANCELLED' },
  ];

  return (
    <div className="flex flex-col gap-5 text-left w-full">
      <div className="border-b border-white/20 pb-3 mb-1">
        <h2 className="text-lg font-bold text-gray-800">Order Management Desk</h2>
        <p className="text-xs text-gray-400 mt-0.5">Verify pending transactions and dispatch status trackers</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="h-32 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
        </div>
      ) : (
        <GlassCard className="p-0 overflow-x-auto" hover={false}>
          <table className="w-full text-sm text-left text-gray-600 border-collapse min-w-[800px]">
            <thead className="bg-white/10 border-b border-white/20 text-xs font-bold text-gray-400 uppercase tracking-wider select-none">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-center">Actions / Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.map((order) => {
                const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <tr key={order.id} className="hover:bg-white/10 transition-colors">
                    <td className="px-6 py-3 font-bold text-gray-800">{order.orderNumber}</td>
                    <td className="px-6 py-3 font-semibold text-gray-800">
                      <p>{order.user?.name || 'Guest User'}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">{order.user?.email}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-500 font-semibold">{formattedDate}</td>
                    <td className="px-6 py-3">
                      <GlassBadge variant={getStatusVariant(order.status)}>{order.status}</GlassBadge>
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-800">
                      {symbol}{order.total.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex gap-2 justify-center items-center">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="text-gray-400 hover:text-lavender-500 p-2 rounded-full hover:bg-white/40 transition-colors"
                          title="View Details"
                        >
                          <FiEye size={14} />
                        </button>

                        {/* Accept / Reject Verification controls for PENDING order status */}
                        {order.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={(e) => handleAccept(order.id, e)}
                              disabled={actionLoading}
                              className="text-mint-500 hover:bg-mint-50/50 p-2 rounded-full hover:text-mint-600 transition-colors focus:outline-none"
                              title="Accept Order"
                            >
                              <FiCheck size={16} />
                            </button>
                            <button
                              onClick={(e) => openRejectModal(order.id, e)}
                              disabled={actionLoading}
                              className="text-red-500 hover:bg-red-50/50 p-2 rounded-full hover:text-red-600 transition-colors focus:outline-none"
                              title="Reject Order"
                            >
                              <FiX size={16} />
                            </button>
                          </>
                        ) : (
                          /* Status updates for Accepted Orders */
                          order.status !== 'REJECTED' && order.status !== 'CANCELLED' && (
                            <div className="w-36">
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                className="glass w-full bg-white/20 border-white/20 rounded-xl px-2.5 py-1 text-xs text-gray-700 font-semibold focus:outline-none focus:bg-white/40 cursor-pointer"
                              >
                                {orderStatuses.map((opt) => (
                                  <option key={opt.value} value={opt.value} className="bg-white text-gray-700">
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* Order Details Modal drawer */}
      <GlassModal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Purchase Order Details" maxWidth="max-w-2xl">
        {selectedOrder && (
          <div className="flex flex-col gap-6 text-left text-xs md:text-sm text-gray-600">
            {/* Header info */}
            <div className="flex justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-gray-800">Order Number: {selectedOrder.orderNumber}</h4>
                <p className="text-xs text-gray-400 mt-1">Placed At: {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <GlassBadge variant={getStatusVariant(selectedOrder.status)}>
                {selectedOrder.status}
              </GlassBadge>
            </div>

            {/* Recipient details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-white/10 pb-4">
              <div>
                <h5 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1.5">Shipping Destination</h5>
                <p className="font-semibold text-gray-800">{selectedOrder.shippingName}</p>
                <p className="mt-0.5">{selectedOrder.shippingStreet}</p>
                <p>{selectedOrder.shippingCity}, {selectedOrder.shippingState} - {selectedOrder.shippingZip}</p>
                <p>{selectedOrder.shippingCountry}</p>
              </div>

              <div>
                <h5 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1.5">Customer & Transaction</h5>
                <p className="font-semibold text-gray-800">{selectedOrder.user?.name || 'Guest User'}</p>
                <p className="text-xs text-gray-400">{selectedOrder.user?.email}</p>
                <p className="mt-2 text-xs">Order ID: {selectedOrder.razorpayOrderId}</p>
                <p className="text-xs">Payment ID: {selectedOrder.razorpayPaymentId}</p>
              </div>
            </div>

            {/* Items summary details */}
            <div>
              <h5 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-3">Purchased Items</h5>
              <div className="flex flex-col gap-3">
                {selectedOrder.items?.map((item) => (
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

            {/* Verification log notes */}
            {selectedOrder.status === 'PENDING' && (
              <div className="bg-amber-100/40 border border-amber-200/40 p-4 rounded-2xl flex flex-col gap-3">
                <p className="text-xs font-semibold text-amber-700">
                  Notice: Order is PENDING verification. Please check card transactions matches transaction ID above before accepting.
                </p>
                <div className="flex gap-2 justify-end select-none">
                  <GlassButton
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      setDetailModalOpen(false);
                      openRejectModal(selectedOrder.id, e);
                    }}
                  >
                    Reject Order
                  </GlassButton>
                  <GlassButton
                    type="button"
                    size="sm"
                    onClick={(e) => {
                      setDetailModalOpen(false);
                      handleAccept(selectedOrder.id, e);
                    }}
                  >
                    Accept Order
                  </GlassButton>
                </div>
              </div>
            )}

            {/* Calculations summaries */}
            <div className="flex flex-col items-end gap-1.5 pt-2 text-xs">
              <div className="flex justify-between w-48">
                <span>Subtotal</span>
                <span>{symbol}{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between w-48 text-mint-500 font-semibold">
                  <span>Promo Code</span>
                  <span>-{symbol}{selectedOrder.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between w-48">
                <span>Shipping Fee</span>
                <span>{selectedOrder.shippingCost === 0 ? 'FREE' : `${symbol}${selectedOrder.shippingCost.toLocaleString('en-IN')}`}</span>
              </div>
              <div className="flex justify-between w-48 border-t border-white/10 pt-1.5 mt-1 text-sm font-bold text-gray-800">
                <span>Total Paid</span>
                <span className="text-lavender-600">{symbol}{selectedOrder.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </GlassModal>

      {/* Reject Order Reason Modal form */}
      <GlassModal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Transaction Order">
        <form onSubmit={handleRejectSubmit} className="flex flex-col gap-4 text-left">
          <p className="text-xs font-medium text-gray-500 leading-relaxed mb-1">
            Rejecting this order will restore the inventory stock counts back to product catalogs. Please enter the reason for rejection (this will be visible to the customer).
          </p>
          <GlassInput
            label="Reason for Rejection"
            placeholder="e.g. Card fraud detected / Inventory damage"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
            autoFocus
          />
          <div className="flex gap-2 justify-end select-none mt-2">
            <GlassButton type="button" variant="secondary" size="sm" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="danger" size="sm" loading={actionLoading}>
              Confirm Rejection
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
