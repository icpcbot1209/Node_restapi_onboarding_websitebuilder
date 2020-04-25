module.exports = {
    publickKey: process.env.STRIPE_PUB_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    subscriptionPlanId: process.env.STRIPE_SUBSCRIPTION_PLAN_ID || '',
    couponId: process.env.STRIPE_COUPON_ID || '',
};
