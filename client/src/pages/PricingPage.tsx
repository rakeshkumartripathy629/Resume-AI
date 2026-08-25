import { useEffect, useState } from 'react'
import { CheckCircle2, Coins, CreditCard, Loader2, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Button } from '../components/ui/Button'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  createOrder,
  fetchPlans,
  loadRazorpayScript,
  verifyPayment,
} from '../features/billing/billingSlice'
import { fetchCoinBalance } from '../features/coins/coinsSlice'

export function PricingPage() {
  const dispatch = useAppDispatch()
  const { packs, configured, status, error } = useAppSelector((state) => state.billing)
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    void dispatch(fetchPlans())
  }, [dispatch])

  async function handleBuy(planId: string): Promise<void> {
    setNotice(null)
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      setNotice('Could not load Razorpay checkout. Check your internet connection.')
      return
    }

    let order
    try {
      order = await dispatch(createOrder(planId)).unwrap()
    } catch (message) {
      setNotice(String(message))
      return
    }

    const razorpay = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'ResumeAI',
      description: `${order.coinAmount} coins`,
      order_id: order.orderId,
      theme: { color: '#4f46e5' },
      handler: (response: {
        razorpay_order_id: string
        razorpay_payment_id: string
        razorpay_signature: string
      }) => {
        void dispatch(
          verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
        )
          .unwrap()
          .then((result) => {
            setNotice(`Payment successful — ${result.coinAmount} coins added to your account!`)
            void dispatch(fetchCoinBalance())
          })
          .catch((message) => setNotice(String(message)))
      },
      modal: {
        ondismiss: () => setBuyingPlanId(null),
      },
    })
    razorpay.open()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar authed />

      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-600">
            <CreditCard className="size-4" />
            Coin packs
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Top up your <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">AI credits</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
            Coins power every AI action — resume scoring (5), mock interviews (10), and career
            roadmaps (8). One-time purchase, no subscription.
          </p>
        </div>

        {!configured && (
          <div className="mx-auto mt-8 flex max-w-xl items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" />
            <span>
              Payments aren't configured yet. Add your <strong>RAZORPAY_KEY_ID</strong> and{' '}
              <strong>RAZORPAY_KEY_SECRET</strong> to the billing service .env to enable checkout.
            </span>
          </div>
        )}

        {(error || notice) && (
          <div className={`mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-2xl border p-4 text-sm font-medium ${
            notice?.includes('successful')
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            <Zap className="mt-0.5 size-5 shrink-0" />
            {notice ?? error}
          </div>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {status === 'loading' && packs.length === 0 ? (
            <div className="col-span-full flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            packs.map((pack) => (
              <div
                key={pack.id}
                className={`relative overflow-hidden rounded-3xl border bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${
                  pack.popular ? 'border-indigo-300 ring-2 ring-indigo-500/20' : 'border-slate-200'
                }`}
              >
                {pack.popular && (
                  <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    <Sparkles className="size-3" /> Popular
                  </span>
                )}
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/25">
                  <Coins className="size-6" />
                </span>
                <h2 className="mt-5 text-xl font-extrabold text-slate-900">{pack.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{pack.description}</p>

                <p className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                    ₹{(pack.amountInPaise / 100).toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">one-time</span>
                </p>

                <ul className="mt-5 space-y-2">
                  <li className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CheckCircle2 className="size-4 text-emerald-500" /> {pack.coinAmount} coins
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="size-4 text-slate-400" /> ~{Math.floor(pack.coinAmount / 10)} interviews or{' '}
                    {Math.floor(pack.coinAmount / 5)} resume scores
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="size-4 text-slate-400" /> Never expires
                  </li>
                </ul>

                <Button
                  size="lg"
                  variant={pack.popular ? 'primary' : 'outline'}
                  className="mt-7 w-full"
                  disabled={!configured}
                  loading={buyingPlanId === pack.id}
                  onClick={() => {
                    setBuyingPlanId(pack.id)
                    void handleBuy(pack.id).finally(() => setBuyingPlanId(null))
                  }}
                >
                  Buy with UPI / Card
                </Button>
              </div>
            ))
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Test mode: use Razorpay's test cards/UPI IDs. No real money is charged until you switch to live keys.
        </p>
      </main>
    </div>
  )
}
