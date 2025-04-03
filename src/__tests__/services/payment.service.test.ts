/**
 * @jest-environment jsdom
 */
import { PaymentService } from "../../services/payment.service";
import { PaymentMethod } from "../../models/payment.model";
import { Order } from "../../models/order.model";

describe("PaymentService", () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
  });

  describe("buildPaymentMethod", () => {
    it("should alway include CREDIT", () => {
      const result1 = paymentService.buildPaymentMethod(0);
      expect(result1).toContain(PaymentMethod.CREDIT);

      const result2 = paymentService.buildPaymentMethod(100000);
      expect(result2).toContain(PaymentMethod.CREDIT);

      const result3 = paymentService.buildPaymentMethod(300000);
      expect(result3).toContain(PaymentMethod.CREDIT);

      const result4 = paymentService.buildPaymentMethod(300001);
      expect(result4).toContain(PaymentMethod.CREDIT);

      const result5 = paymentService.buildPaymentMethod(500000);
      expect(result5).toContain(PaymentMethod.CREDIT);

      const result6 = paymentService.buildPaymentMethod(500001);
      expect(result6).toContain(PaymentMethod.CREDIT);
    });

    it("should include all payment methods if totalPrice is below all thresholds", () => {
      const result = paymentService.buildPaymentMethod(100000);
      expect(result).toBe(
        `${PaymentMethod.CREDIT},${PaymentMethod.PAYPAY},${PaymentMethod.AUPAY}`
      );
    });

    it("should exclude PAYPAY if totalPrice exceeds 500,000", () => {
      const result = paymentService.buildPaymentMethod(500001);
      const actualMethods = result.split(",");
      expect(actualMethods).not.toContain(PaymentMethod.PAYPAY);
    });

    it("should exclude AUPAY if totalPrice exceeds 300,000", () => {
      const result = paymentService.buildPaymentMethod(300001);
      expect(result).toBe(`${PaymentMethod.CREDIT},${PaymentMethod.PAYPAY}`);
    });

    it("should exclude both PAYPAY and AUPAY if totalPrice exceeds both thresholds", () => {
      const result = paymentService.buildPaymentMethod(500001);
      expect(result).toBe(`${PaymentMethod.CREDIT}`);
    });
  });

  describe("payViaLink", () => {
    it("should open a new window with the correct payment URL", () => {
      const order: Order = {
        id: "123",
        items: [],
        totalPrice: 1000,
        paymentMethod: PaymentMethod.CREDIT,
      };
      const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

      paymentService.payViaLink(order);

      expect(openSpy).toHaveBeenCalledWith(
        `https://payment.example.com/pay?orderId=123`,
        "_blank"
      );

      openSpy.mockRestore();
    });
  });
});
