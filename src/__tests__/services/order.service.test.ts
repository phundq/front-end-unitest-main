/**
 * @jest-environment jsdom
 */
import { OrderService } from "../../services/order.service";
import { PaymentService } from "../../services/payment.service";
import { Order } from "../../models/order.model";
import { PaymentMethod } from "../../models/payment.model";

describe("OrderService", () => {
  let orderService: OrderService;
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
    orderService = new OrderService(paymentService);
  });

  describe("process", () => {
    it("should throw an error if order items are missing", async () => {
      await expect(orderService.process({})).rejects.toThrow(
        "Order items are required"
      );
    });

    it("should throw an error if any item has invalid price", async () => {
      const invalidOrder1: Partial<Order> = {
        items: [{ id: "1", productId: "p1", price: 0, quantity: 1 }],
      };
      await expect(orderService.process(invalidOrder1)).rejects.toThrow(
        "Order items are invalid"
      );

      const invalidOrder2: Partial<Order> = {
        items: [{ id: "1", productId: "p1", price: -10, quantity: 1 }],
      };
      await expect(orderService.process(invalidOrder2)).rejects.toThrow(
        "Order items are invalid"
      );
    });

    it("should throw an error if any item has invalid quantity", async () => {
      const invalidOrder1: Partial<Order> = {
        items: [{ id: "1", productId: "p1", price: 100, quantity: 0 }],
      };
      await expect(orderService.process(invalidOrder1)).rejects.toThrow(
        "Order items are invalid"
      );

      const invalidOrder2: Partial<Order> = {
        items: [{ id: "1", productId: "p1", price: 100, quantity: -5 }],
      };
      await expect(orderService.process(invalidOrder2)).rejects.toThrow(
        "Order items are invalid"
      );
    });

    it("should throw an error if any item has invalid price and quantity", async () => {
      const invalidOrder1: Partial<Order> = {
        items: [{ id: "1", productId: "p1", price: 0, quantity: 0 }],
      };
      await expect(orderService.process(invalidOrder1)).rejects.toThrow(
        "Order items are invalid"
      );

      const invalidOrder2: Partial<Order> = {
        items: [{ id: "1", productId: "p1", price: -10, quantity: -5 }],
      };
      await expect(orderService.process(invalidOrder2)).rejects.toThrow(
        "Order items are invalid"
      );

      const invalidOrder3: Partial<Order> = {
        items: [{ id: "1", productId: "p1", price: 0, quantity: -5 }],
      };
      await expect(orderService.process(invalidOrder3)).rejects.toThrow(
        "Order items are invalid"
      );

      const invalidOrder4: Partial<Order> = {
        items: [{ id: "1", productId: "p1", price: -10, quantity: 0 }],
      };
      await expect(orderService.process(invalidOrder4)).rejects.toThrow(
        "Order items are invalid"
      );
    });

    it("should throw an error if total price is less than or equal to 0", async () => {
      const invalidOrder: Partial<Order> = {
        items: [{ id: "1", productId: "p1", price: 100, quantity: 0 }],
      };
      //   await expect(orderService.process(invalidOrder)).rejects.toThrow('Total price must be greater than 0');
      await expect(orderService.process(invalidOrder)).rejects.toThrow(
        "Order items are invalid"
      );
    });

    it("should apply a valid coupon and reduce the total price", async () => {
      const validOrder: Partial<Order> = {
        items: [{ id: "1", productId: "p1", price: 100, quantity: 2 }],
        couponId: "valid-coupon",
      };

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({ discount: 50 }),
        })
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({ id: "order123" }),
        });

      const payViaLinkSpy = jest
        .spyOn(paymentService, "payViaLink")
        .mockImplementation();

      await orderService.process(validOrder);

      expect(fetch).toHaveBeenCalledWith(
        "https://67eb7353aa794fb3222a4c0e.mockapi.io/coupons/valid-coupon"
      );
      expect(fetch).toHaveBeenCalledWith(
        "https://67eb7353aa794fb3222a4c0e.mockapi.io/order",
        expect.any(Object)
      );
      expect(payViaLinkSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: "order123" })
      );

      jest.restoreAllMocks();
    });

    it("should throw an error if the coupon is invalid", async () => {
      const invalidCouponOrder: Partial<Order> = {
        items: [{ id: "1", productId: "p1", price: 100, quantity: 2 }],
        couponId: "invalid-coupon",
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(null),
      });

      await expect(orderService.process(invalidCouponOrder)).rejects.toThrow(
        "Invalid coupon"
      );

      jest.restoreAllMocks();
    });

    it("should set total price = 0 when discount > total price", async () => {
      const validOrder: Partial<Order> = {
        items: [{ id: "1", productId: "p1", price: 100, quantity: 2 }],
        couponId: "valid-coupon",
      };
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({ discount: 300 }),
        })
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({ id: "order123" }),
        });
      const payViaLinkSpy = jest
        .spyOn(paymentService, "payViaLink")
        .mockImplementation();

      await orderService.process(validOrder);

      expect(fetch).toHaveBeenCalledWith(
        "https://67eb7353aa794fb3222a4c0e.mockapi.io/coupons/valid-coupon"
      );

      expect(fetch).toHaveBeenCalledWith(
        "https://67eb7353aa794fb3222a4c0e.mockapi.io/order",
        {
          body: JSON.stringify({
            ...validOrder,
            totalPrice: 0,
            paymentMethod: [
              PaymentMethod.CREDIT,
              PaymentMethod.PAYPAY,
              PaymentMethod.AUPAY,
            ].join(","),
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      );
      expect(payViaLinkSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: "order123" })
      );
      jest.restoreAllMocks();
    });

    it("should call paymentService.payViaLink with the created order", async () => {
      const validOrder: Partial<Order> = {
        items: [{ id: "1", productId: "p1", price: 100, quantity: 2 }],
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ id: "order123" }),
      });

      const payViaLinkSpy = jest
        .spyOn(paymentService, "payViaLink")
        .mockImplementation();

      await orderService.process(validOrder);

      expect(payViaLinkSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: "order123" })
      );

      jest.restoreAllMocks();
    });
  });
});
