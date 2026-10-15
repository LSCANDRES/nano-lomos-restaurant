import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Frontend POS, WhatsApp & Cash Logic Tests', () => {
  it('Construcción correcta de URL de notificación de WhatsApp', () => {
    const formatWhatsAppUrl = (phone: string | undefined, name: string, tag: string, total: number, isReady: boolean) => {
      const cleanPhone = phone?.replace(/[^0-9]/g, '');
      let text = `¡Hola ${name}! 👋 Te escribimos de *Nano Lomos*.\n\n`;
      if (isReady) {
        text += `Tu pedido *${tag}* ya está listo para retirar / en camino 🍔🍟.\n`;
      } else {
        text += `Hemos recibido tu pedido *${tag}* y ya está en preparación en cocina 👨‍🍳🔥.\n`;
      }
      text += `Total: *$${total.toFixed(2)}*\n\n¡Muchas gracias por elegirnos!`;

      const encoded = encodeURIComponent(text);
      return cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`;
    };

    const url = formatWhatsAppUrl('+54 9 351 123-4567', 'Martín', 'RETIRO (Martín)', 8500, true);

    assert.ok(url.startsWith('https://api.whatsapp.com/send?phone=5493511234567&text='));
    assert.ok(decodeURIComponent(url).includes('Nano Lomos'));
    assert.ok(decodeURIComponent(url).includes('8500.00'));
    assert.ok(decodeURIComponent(url).includes('listo para retirar'));
  });

  it('Cálculo correcto de Arqueo de Caja y Efectivo Esperado en Cajón', () => {
    const calculateExpectedDrawerCash = (initialCash: number, cashSales: number) => {
      return Number(initialCash) + Number(cashSales);
    };

    const fondoInicial = 10000;
    const ventasEfectivo = 45500;
    const ventasTarjeta = 22000;
    const ventasTransferencia = 15000;

    const esperadoCajon = calculateExpectedDrawerCash(fondoInicial, ventasEfectivo);
    const totalFacturado = ventasEfectivo + ventasTarjeta + ventasTransferencia;

    assert.strictEqual(esperadoCajon, 55500);
    assert.strictEqual(totalFacturado, 82500);
  });

  it('Identificación de Modalidad de Pedido (Mostrador, Retiro, Delivery, Salón)', () => {
    const formatTicketTag = (orderType: 'mostrador' | 'takeaway' | 'delivery' | 'salon', customerName?: string, tableNumber?: string) => {
      if (orderType === 'salon' && tableNumber) {
        return `Mesa ${tableNumber}`;
      }
      const prefix = orderType === 'delivery'
        ? 'DELIVERY'
        : orderType === 'takeaway'
        ? 'RETIRO'
        : 'MOSTRADOR';
      const clientTag = customerName ? ` (${customerName.trim()})` : '';
      return `${prefix}${clientTag}`;
    };

    assert.strictEqual(formatTicketTag('mostrador', 'Juan'), 'MOSTRADOR (Juan)');
    assert.strictEqual(formatTicketTag('takeaway', 'Sofia'), 'RETIRO (Sofia)');
    assert.strictEqual(formatTicketTag('delivery', 'Carlos'), 'DELIVERY (Carlos)');
    assert.strictEqual(formatTicketTag('salon', undefined, '4'), 'Mesa 4');
  });
});
