'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import SectionTitle from '@/components/atoms/SectionTitle';
import FormField from '@/components/molecules/FormField';
import { useClientData } from '@/contexts/ClientDataContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { TranslationKey } from '@/lib/i18n';

const orderSchema = z.object({
  stockSymbol: z.string().min(1, 'form.error.required'),
  side: z.enum(['buy', 'sell']),
  quantity: z.coerce.number().int().gt(0, 'form.error.required'),
  limitPrice: z.coerce.number().gt(0, 'form.error.required'),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function InvestmentsPanel() {
  const { state, placeOrder } = useClientData();
  const { t, language } = useI18n();

  const orderForm = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { stockSymbol: '', side: 'buy', quantity: 10, limitPrice: 20 },
  });

  const submitOrder = orderForm.handleSubmit((values: OrderFormValues) => {
    placeOrder(values);
    orderForm.reset({ ...values, quantity: 10 });
  });

  return (
    <div className="flex flex-col gap-10">
      <SectionTitle title={t('investments.title')} subtitle={t('investments.subtitle')} />
      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">{t('investments.available')}</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {state.stocks.map((stock) => (
              <div key={stock.symbol} className="rounded-2xl bg-emerald-50/60 p-4 dark:bg-emerald-900/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{stock.symbol}</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{stock.name}</p>
                <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                  {formatCurrency(stock.lastPrice, language)}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">{t('investments.placeOrder')}</h3>
          <form onSubmit={submitOrder} className="flex flex-col gap-4">
            <FormField label={t('investments.stock')} htmlFor="investment-stock">
              <Select
                id="investment-stock"
                {...orderForm.register('stockSymbol')}
                hasError={Boolean(orderForm.formState.errors.stockSymbol)}
              >
                <option value="" disabled>
                  --
                </option>
                {state.stocks.map((stock) => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.name}
                  </option>
                ))}
              </Select>
              {orderForm.formState.errors.stockSymbol ? (
                <p className="text-xs text-red-500">
                  {t(
                    (orderForm.formState.errors.stockSymbol.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>
            <FormField label={t('investments.side')} htmlFor="investment-side">
              <Select id="investment-side" {...orderForm.register('side')}>
                <option value="buy">{t('investments.side.buy')}</option>
                <option value="sell">{t('investments.side.sell')}</option>
              </Select>
            </FormField>
            <FormField label={t('investments.quantity')} htmlFor="investment-quantity">
              <Input
                id="investment-quantity"
                type="number"
                min={1}
                {...orderForm.register('quantity', { valueAsNumber: true })}
                hasError={Boolean(orderForm.formState.errors.quantity)}
              />
              {orderForm.formState.errors.quantity ? (
                <p className="text-xs text-red-500">
                  {t(
                    (orderForm.formState.errors.quantity.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>
            <FormField label={t('investments.limit')} htmlFor="investment-limit">
              <Input
                id="investment-limit"
                type="number"
                step="0.01"
                {...orderForm.register('limitPrice', { valueAsNumber: true })}
                hasError={Boolean(orderForm.formState.errors.limitPrice)}
              />
              {orderForm.formState.errors.limitPrice ? (
                <p className="text-xs text-red-500">
                  {t(
                    (orderForm.formState.errors.limitPrice.message as TranslationKey | undefined) ??
                      'form.error.required',
                  )}
                </p>
              ) : null}
            </FormField>
            <p className="text-xs text-zinc-500">{t('investments.feeNotice')}</p>
            <Button type="submit">{t('investments.submit')}</Button>
          </form>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">{t('investments.orders')}</h3>
        {state.investmentOrders.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('investments.noOrders')}</p>
        ) : (
          <div className="space-y-3">
            {state.investmentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-2 rounded-2xl border border-zinc-100 p-4 dark:border-zinc-700 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {order.side === 'buy' ? t('investments.side.buy') : t('investments.side.sell')} • {order.stockSymbol}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDateTime(order.createdAt, language)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <span>
                    {t('investments.quantity')}: <strong>{order.quantity}</strong>
                  </span>
                  <span>
                    {t('investments.limit')}: <strong>{formatCurrency(order.limitPrice, language)}</strong>
                  </span>
                  <span>
                    {t('investments.fees')}: <strong>{formatCurrency(order.fees, language)}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
