import { ApiError, CheckoutPaymentIntent, OrdersController } from "@paypal/paypal-server-sdk";
import { Router } from "express";
import { logger } from "../index.js";
import { paypalClient } from "../config/paypal.js";
import Order from "../models/order.model.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = Router();

// /orders/....
const orderController = new OrdersController(paypalClient)
router.post('/create-order', isAuth, async (req, res) => {
  try {
    const userId = req.user._id
    const { cart, total } = req.body;

    console.log({ cart, total })

    if (!cart || (Array.isArray(cart) && cart.length === 0)) {
      return res.status(400).json({ message: "cart must not be empty" })
    }

    const order = await orderController.createOrder({
      body: {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [{
          amount: { currencyCode: "USD", value: String(total) }
        }],
        applicationContext: {
          returnUrl: `${process.env.FRONTEND_SITE}/orders/success`,
          cancelUrl: `${process.env.FRONTEND_SITE}/orders/cancel`
        }
      },
      prefer: 'return=minimal'
    })

    console.log(order)

    const approveLink = JSON.parse(order?.body)?.links?.find(link => link.rel === "approve")

    console.log(approveLink)

    const editedCart = cart.map(item => ({
      productId: item._id,
      title: item.title,
      price: item.price,
      color: item.selectedColor._id,
      size: item.selectedSize._id,
      quantity: item.quantity,
    }))

    console.log(editedCart)

    await Order.create({
      userId,
      items: editedCart,
      totalAmount: total,
      paymentStatus: "PENDING",
      paypalOrderId: order.result.id
    })
    console.log()
    return res.json({ approveLink: approveLink })
  } catch (error) {
    logger.error(error.message)
    console.log(error.stack)
    return res.status(500).json({ error: error })
  }

})

router.post('/capture-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params

    const response = await orderController.captureOrder({ id: orderId })

    if (response.result.status === 'COMPLETED') {
      const transactionId = response.result.purchaseUnits[0].payments.captures[0].id;
      const payerEmail = response.result.payer.emailAddress;
      console.log(response.result)
      const updatedOrder = await Order.findOneAndUpdate(
        { paypalOrderId: orderId },
        {
          payerEmail,
          transactionId,
          paymentStatus: 'COMPLETED'
        }
      )

      return res.json({ data: updatedOrder, status: response.result.status })
    } else {
      return res.status(response.statusCode).json({ message: "there is an error in payment" })
    }

  } catch (error) {
    logger.error(error.message)
    return res.status(500).json({ error: error })
  }
})

router.post('/', isAuth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (userId) {
      const orders = await Order.find({ userId }).sort({ createdAt: "desc" })
      return res.json({ orders })
    }
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ message: "there is an error" })
  }
})

router.post('/webhook', async (req, res) => {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID; // must be from your PayPal dashboard
    const authAlgo = req.headers['paypal-auth-algo'];
    const certUrl = req.headers['paypal-cert-url'];
    const transmissionId = req.headers['paypal-transmission-id'];
    const transmissionSig = req.headers['paypal-transmission-sig'];
    const transmissionTime = req.headers['paypal-transmission-time'];
    const body = req.body;

    const verifyResponse = await fetch('https://api-m.paypal.com/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAYPAL_ACCESS_TOKEN}`, // or generate with client ID + secret
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: body,
      }),
    });

    const data = await verifyResponse.json();
    if (data.verification_status === 'SUCCESS') {
      const event = body;

      if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
        const orderId = event.resource.id;
        await Order.findOneAndUpdate(
          { paypalOrderId: orderId },
          { paymentStatus: 'COMPLETED' }
        );
      }

      res.sendStatus(200);
    } else {
      res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
})

export default router