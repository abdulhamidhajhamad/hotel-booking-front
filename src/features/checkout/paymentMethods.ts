export interface TestPaymentMethod {
  id: string;
  label: string;
  outcome: string;
}

export const testPaymentMethods: TestPaymentMethod[] = [
  { id: 'pm_card_visa', label: 'Visa •••• 4242', outcome: 'Payment succeeds' },
  { id: 'pm_card_mastercard', label: 'Mastercard •••• 4444', outcome: 'Payment succeeds' },
  { id: 'pm_card_chargeDeclined', label: 'Visa •••• 0002', outcome: 'Card declined' },
  {
    id: 'pm_card_chargeDeclinedInsufficientFunds',
    label: 'Visa •••• 9995',
    outcome: 'Insufficient funds',
  },
];
