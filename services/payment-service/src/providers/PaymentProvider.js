class PaymentProvider {
  /**
   * Initialize a payment intent with the provider
   * @param {Object} params - { amount, currency, referenceId, tenantConfig }
   * @returns {Promise<Object>} { providerIntentId, clientSecret }
   */
  async createIntent(params) {
    throw new Error('Not implemented');
  }

  /**
   * Process a refund
   * @param {Object} params - { transactionId, amount, tenantConfig }
   */
  async refund(params) {
    throw new Error('Not implemented');
  }

  /**
   * Verify webhook signature
   * @param {Object} payload 
   * @param {string} signature 
   * @param {string} webhookSecret 
   */
  verifyWebhookSignature(payload, signature, webhookSecret) {
    throw new Error('Not implemented');
  }
}

module.exports = PaymentProvider;
