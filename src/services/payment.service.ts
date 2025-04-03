import { PaymentMethod } from "../models/payment.model";
import { Order } from '../models/order.model';

export class PaymentService {
  private readonly PAYMMENT_METHODS = [
    PaymentMethod.CREDIT,
    PaymentMethod.PAYPAY,
    PaymentMethod.AUPAY,
  ];

  buildPaymentMethod(totalPrice: number) {
    const filteredMethods = this.PAYMMENT_METHODS.filter(method => {
      if (method === PaymentMethod.PAYPAY) {
        // if totalPrice > 500,000 remove PAYPAY
        return totalPrice <= 500000;
      }

      if (method === PaymentMethod.AUPAY) {
        // if totalPrice > 300,000 remove AUPAY
        return totalPrice <= 300000;
      }

      return !!method;
    });

    return filteredMethods.join(',');
  }

  async payViaLink(order: Order) {
    window.open(`https://payment.example.com/pay?orderId=${order.id}`, '_blank');
  }
}
