'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useUiStore } from '../../../store/uiStore';
import { FiTruck, FiPrinter, FiDollarSign, FiMapPin, FiCalendar, FiBox, FiCheckCircle } from 'react-icons/fi';
import GlassCard from '../../../components/ui/GlassCard';
import GlassBadge from '../../../components/ui/GlassBadge';
import GlassButton from '../../../components/ui/GlassButton';
import GlassModal from '../../../components/ui/GlassModal';
import GlassInput from '../../../components/ui/GlassInput';
import GlassSelect from '../../../components/ui/GlassSelect';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function AdminDeliveryPortal() {
  const { token } = useAuthStore();
  const { siteSettings } = useUiStore();
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ship Modal States
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [carrier, setCarrier] = useState('Delhivery');
  const [serviceType, setServiceType] = useState('Express');
  const [weight, setWeight] = useState('1.5');
  const [actionLoading, setActionLoading] = useState(false);

  // Label print modal
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelOrder, setLabelOrder] = useState(null);

  const symbol = siteSettings.currency_symbol || '₹';

  useEffect(() => {
    fetchOrdersList();
  }, []);

  const fetchOrdersList = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/orders/admin/all?limit=100');
      if (data.success) {
        // filter orders that are ACCEPTED, SHIPPED, or DELIVERED
        const filtered = data.orders.filter(
          (o) => o.status === 'ACCEPTED' || o.status === 'SHIPPED' || o.status === 'DELIVERED'
        );
        setOrders(filtered);
      }
    } catch (err) {
      console.error('Failed to load orders for delivery:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openShipModal = (order) => {
    setSelectedOrder(order);
    setCarrier('Delhivery');
    setServiceType('Express');
    setWeight('1.5');
    setShipModalOpen(true);
  };

  const handleRegisterShipment = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setActionLoading(true);
    try {
      const { data } = await api.put(`/orders/${selectedOrder.id}/ship`, {
        carrier,
        serviceType,
        weight: parseFloat(weight) || 1.0,
      });

      if (data.success) {
        toast.success(`Shipment registered successfully! Carrier: ${carrier}`);
        setShipModalOpen(false);
        fetchOrdersList();
      }
    } catch (err) {
      toast.error('Failed to register shipment with courier service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliveryStatusUpdate = async (id, status) => {
    let checkpointNote = '';
    switch (status) {
      case 'IN_TRANSIT':
        checkpointNote = 'Package is in transit. Arrived at courier hub.';
        break;
      case 'OUT_FOR_DELIVERY':
        checkpointNote = 'Package is out for delivery. Courier executive is en route.';
        break;
      case 'DELIVERED':
        checkpointNote = 'Package delivered successfully. Sign off recorded.';
        break;
      default:
        checkpointNote = `Delivery tracking checkpoint: ${status}`;
    }

    try {
      const { data } = await api.put(`/orders/${id}/delivery-status`, {
        deliveryStatus: status,
        checkpointNote,
      });
      if (data.success) {
        toast.success(`Delivery status updated to ${status}`);
        fetchOrdersList();
      }
    } catch (err) {
      toast.error('Failed to update tracking checkpoint');
    }
  };

  const togglePaymentPaid = async (id, currentPaid) => {
    try {
      const { data } = await api.put(`/orders/${id}/toggle-paid`, {
        isPaid: !currentPaid,
      });
      if (data.success) {
        toast.success(data.order.isPaid ? 'Payment marked as PAID' : 'Payment marked as UNPAID');
        fetchOrdersList();
      }
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const openPrintLabel = (order) => {
    setLabelOrder(order);
    setLabelModalOpen(true);
  };

  const printLabelAction = () => {
    const printContent = document.getElementById('shipping-label-printable').innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore React hooks/events bindings
  };

  const getDeliveryStatusColor = (status) => {
    switch (status) {
      case 'DISPATCHED':
        return 'info';
      case 'IN_TRANSIT':
        return 'warning';
      case 'OUT_FOR_DELIVERY':
        return 'warning';
      case 'DELIVERED':
        return 'success';
      default:
        return 'default';
    }
  };

  const carrierOptions = [
    { label: 'Delhivery Integration', value: 'Delhivery' },
    { label: 'Shiprocket Multi-Carrier', value: 'Shiprocket' },
    { label: 'Blue Dart Premium', value: 'Blue Dart' },
  ];

  const serviceOptions = [
    { label: 'Express Delivery (1-2 days)', value: 'Express' },
    { label: 'Air Cargo Priority', value: 'Air Cargo' },
    { label: 'Standard Surface', value: 'Surface' },
  ];

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      <div className="border-b border-white/20 pb-3 mb-1 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Logistics & Delivery Desk</h2>
          <p className="text-xs text-gray-400 mt-0.5">Integrate Delhivery/Shiprocket API, issue tracking labels, and track COD payments</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="h-32 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
        </div>
      ) : orders.length === 0 ? (
        <GlassCard className="text-center py-16" hover={false}>
          <div className="w-12 h-12 rounded-full bg-white/40 flex items-center justify-center mx-auto text-gray-400 mb-4">
            <FiTruck size={20} />
          </div>
          <h3 className="text-base font-bold text-gray-700">No Orders in Pipeline</h3>
          <p className="text-sm text-gray-400 mt-1">Accepted orders will appear here for shipping assignment.</p>
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-x-auto" hover={false}>
          <table className="w-full text-sm text-left text-gray-600 border-collapse min-w-[900px]">
            <thead className="bg-white/10 border-b border-white/20 text-xs font-bold text-gray-400 uppercase tracking-wider select-none">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4 text-center">Payment Info</th>
                <th className="px-6 py-4 text-center">Logistics / Carrier</th>
                <th className="px-6 py-4">Waybill tracking</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.map((order) => {
                return (
                  <tr key={order.id} className="hover:bg-white/10 transition-colors">
                    <td className="px-6 py-3 font-bold text-gray-800">
                      {order.orderNumber}
                      <p className="text-[9px] text-gray-400 font-normal">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                    </td>
                    <td className="px-6 py-3 text-xs">
                      <p className="font-semibold text-gray-800">{order.shippingName}</p>
                      <p className="text-gray-400">{order.shippingCity}, {order.shippingState} - {order.shippingZip}</p>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="font-bold text-xs">{symbol}{order.total.toLocaleString('en-IN')}</span>
                        <button
                          onClick={() => togglePaymentPaid(order.id, order.isPaid)}
                          className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors ${
                            order.isPaid
                              ? 'bg-mint-100/50 text-mint-600 border-mint-200'
                              : 'bg-red-100/50 text-red-600 border-red-200'
                          }`}
                        >
                          <FiDollarSign size={10} /> {order.isPaid ? 'PAID' : 'PENDING'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {order.shippingCarrier ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-bold text-xs text-gray-700">{order.shippingCarrier}</span>
                          <span className="text-[9px] text-gray-400">API Assigned</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Not Dispatched</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {order.trackingNumber ? (
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="font-mono font-bold text-gray-800">{order.trackingNumber}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400">Status:</span>
                            <GlassBadge variant={getDeliveryStatusColor(order.deliveryStatus)} className="text-[9px] py-0 px-1.5">
                              {order.deliveryStatus}
                            </GlassBadge>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Pending assignment</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex gap-2 justify-center items-center">
                        {order.status === 'ACCEPTED' ? (
                          <GlassButton size="xs" onClick={() => openShipModal(order)} className="py-1 px-3 text-xs font-bold">
                            Ship Package
                          </GlassButton>
                        ) : (
                          <div className="flex items-center gap-1.5 select-none">
                            <button
                              onClick={() => openPrintLabel(order)}
                              className="text-gray-400 hover:text-lavender-500 p-1.5 rounded-full hover:bg-white/40 transition-colors"
                              title="Print Shipping Label"
                            >
                              <FiPrinter size={15} />
                            </button>
                            
                            {order.deliveryStatus !== 'DELIVERED' && (
                              <select
                                value={order.deliveryStatus}
                                onChange={(e) => handleDeliveryStatusUpdate(order.id, e.target.value)}
                                className="glass bg-white/20 border-white/20 rounded-xl px-2 py-0.5 text-xs text-gray-700 font-semibold focus:outline-none focus:bg-white/40 cursor-pointer"
                              >
                                <option value="DISPATCHED" className="bg-white text-gray-700">Dispatched</option>
                                <option value="IN_TRANSIT" className="bg-white text-gray-700">In Transit</option>
                                <option value="OUT_FOR_DELIVERY" className="bg-white text-gray-700">Out for Delivery</option>
                                <option value="DELIVERED" className="bg-white text-gray-700">Delivered</option>
                              </select>
                            )}
                            
                            {order.deliveryStatus === 'DELIVERED' && (
                              <span className="text-mint-500 flex items-center gap-1 text-xs font-bold bg-mint-50/50 border border-mint-100 rounded-full px-2.5 py-0.5">
                                <FiCheckCircle size={12} /> Complete
                              </span>
                            )}
                          </div>
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

      {/* Courier Integration assign modal */}
      <GlassModal isOpen={shipModalOpen} onClose={() => setShipModalOpen(false)} title="Ship package via API Integration" maxWidth="max-w-md">
        {selectedOrder && (
          <form onSubmit={handleRegisterShipment} className="flex flex-col gap-4 text-left">
            <div className="bg-white/30 border border-white/30 p-3 rounded-2xl text-xs flex flex-col gap-1.5">
              <p><strong>Customer:</strong> {selectedOrder.shippingName}</p>
              <p><strong>Delivery Address:</strong> {selectedOrder.shippingStreet}, {selectedOrder.shippingCity}, {selectedOrder.shippingState} - {selectedOrder.shippingZip}</p>
              <p><strong>Phone:</strong> {selectedOrder.phone || 'N/A'}</p>
            </div>

            <GlassSelect
              label="Select Logistics Partner API"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              options={carrierOptions}
              required
            />

            <GlassSelect
              label="Shipping Tier"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              options={serviceOptions}
              required
            />

            <GlassInput
              label="Estimated Package Weight (Kg)"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />

            <div className="flex gap-2 justify-end select-none mt-3">
              <GlassButton type="button" variant="secondary" size="sm" onClick={() => setShipModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton type="submit" size="sm" loading={actionLoading}>
                Generate Waybill / Dispatch
              </GlassButton>
            </div>
          </form>
        )}
      </GlassModal>

      {/* Shipping Label Preview print overlay */}
      <GlassModal isOpen={labelModalOpen} onClose={() => setLabelModalOpen(false)} title="Print Shipping Label Preview" maxWidth="max-w-lg">
        {labelOrder && (
          <div className="flex flex-col gap-4">
            <div className="border border-gray-300 p-4 rounded-xl bg-white text-gray-800 overflow-hidden shadow-inner text-left max-w-sm mx-auto" id="shipping-label-printable">
              {/* Outer label frame styles inside printable scope */}
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  #shipping-label-printable, #shipping-label-printable * { visibility: visible; }
                  #shipping-label-printable { position: absolute; left: 0; top: 0; width: 100%; max-width: 100%; border: none; }
                }
              `}</style>
              <div className="border-2 border-black p-3 font-mono text-[11px] leading-relaxed">
                {/* Header branding */}
                <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
                  <h2 className="text-sm font-black uppercase tracking-widest text-black">ELITE STYLE</h2>
                  <div className="text-right">
                    <p className="font-bold text-[10px]">{labelOrder.shippingCarrier?.toUpperCase()}</p>
                    <p className="text-[8px] text-gray-500">AIR WAYBILL</p>
                  </div>
                </div>

                {/* Tracking Code and Barcode simulation */}
                <div className="flex flex-col items-center border-b-2 border-black py-2 mb-2">
                  <div className="w-full bg-black h-10 mb-1 flex items-center justify-between px-1">
                    {[...Array(24)].map((_, idx) => (
                      <div key={idx} style={{ width: `${Math.floor(2 + Math.random() * 4)}px` }} className="bg-white h-full" />
                    ))}
                  </div>
                  <span className="font-bold text-xs text-black tracking-widest">{labelOrder.trackingNumber}</span>
                </div>

                {/* Shipping Details */}
                <div className="grid grid-cols-2 gap-2 border-b-2 border-black pb-2 mb-2">
                  <div className="border-r border-black pr-2">
                    <p className="font-bold text-[9px] uppercase text-gray-500">SHIP TO:</p>
                    <p className="font-black text-black">{labelOrder.shippingName}</p>
                    <p className="text-[10px]">{labelOrder.shippingStreet}</p>
                    <p className="text-[10px]">{labelOrder.shippingCity}, {labelOrder.shippingState}</p>
                    <p className="font-black text-[10px]">{labelOrder.shippingZip}</p>
                  </div>
                  <div className="pl-2">
                    <p className="font-bold text-[9px] uppercase text-gray-500">SHIP FROM:</p>
                    <p className="font-black text-black">ELITE STYLE HQ</p>
                    <p className="text-[10px]">100 Luxury Avenue</p>
                    <p className="text-[10px]">Indiranagar, Bangalore</p>
                    <p className="text-[10px]">Karnataka - 560038</p>
                  </div>
                </div>

                {/* Logistics metadata */}
                <div className="grid grid-cols-3 gap-1 border-b-2 border-black pb-2 mb-2 text-center text-[9px]">
                  <div>
                    <p className="text-gray-500">AWB Reference</p>
                    <p className="font-bold text-black">{labelOrder.deliveryPartnerOrderId || 'N/A'}</p>
                  </div>
                  <div className="border-l border-r border-black">
                    <p className="text-gray-500">Weight</p>
                    <p className="font-bold text-black">1.50 Kg</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bill Type</p>
                    <p className="font-bold text-black">{labelOrder.isPaid ? 'PREPAID' : 'C.O.D'}</p>
                  </div>
                </div>

                {/* Footer instructions */}
                <div className="flex justify-between items-center text-[9px]">
                  <span>Routing: BLR/HUB</span>
                  <span className="font-black text-[10px] border border-black px-1.5 py-0.5">EXPRESS</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end select-none mt-3">
              <GlassButton variant="secondary" size="sm" onClick={() => setLabelModalOpen(false)}>
                Close Preview
              </GlassButton>
              <GlassButton size="sm" onClick={printLabelAction} className="flex items-center gap-1.5">
                <FiPrinter size={14} /> Send to Printer
              </GlassButton>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
