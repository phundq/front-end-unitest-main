import { PaymentMethod } from "./payment.model";

export interface OrderItem {
  id: string;
  productId: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  totalPrice: number;
  items: OrderItem[];
  couponId?: string;
  paymentMethod: PaymentMethod;
}
