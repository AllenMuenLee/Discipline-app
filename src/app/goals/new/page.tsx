'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaPlusCircle, FaTag, FaAlignLeft, FaCalendarAlt, FaDollarSign, FaSave } from 'react-icons/fa';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID!);

const CheckoutForm = ({ stakeAmount, onCreateGoal, setLoading, setError, loading }: {
  stakeAmount: string;
  onCreateGoal: (stripeToken: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  loading: boolean;
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card details not entered.');
      setLoading(false);
      return;
    }

    const { error, token } = await stripe.createToken(cardElement);

    if (error) {
      setError(error.message || 'An unknown error occurred.');
      setLoading(false);
    } else if (token) {
      await onCreateGoal(token.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 animate__animated animate__fadeInUp">
      <div className="mb-3">
        <label htmlFor="card-element" className="form-label">Credit or debit card</label>
        <CardElement
          id="card-element"
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
          className="form-control"
        />
      </div>
      <button type="submit" className="btn btn-primary animate__animated animate__pulse animate__infinite" disabled={!stripe || loading}>
        <FaSave className="me-2" /> {loading ? 'Creating Goal...' : 'Create Goal'}
      </button>
    </form>
  );
};


export default function NewGoalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('7');
  const [stakeAmount, setStakeAmount] = useState('5');
  const [apiError, setApiError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleCreateGoal = async (stripeToken: string) => {
    setApiError('');
    setValidationError('');
    setLoading(true);

    if (!title || !description || !durationDays || !stakeAmount) {
      setValidationError('All fields are required.');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        durationDays: parseInt(durationDays, 10),
        stakeAmount: parseFloat(stakeAmount),
        stripeToken,
      }),
    });

    setLoading(false);

    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setApiError(data.message || 'Failed to create goal.');
    }
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setValidationError('');
    setApiError('');
  };

  return (
    <div className="container my-5 animate__animated animate__fadeIn">
      <h1 className="mb-4"><FaPlusCircle className="me-3" />Create a New Goal</h1>
      <p className="lead">You will be asked to connect your payment method to create the goal. The stake will only be charged if you fail.</p>
      <div className="card p-4 shadow-sm animate__animated animate__fadeInUp">
        {(apiError || validationError) && <div className="alert alert-danger animate__animated animate__shakeX">{apiError || validationError}</div>}
        <div className="mb-3">
          <label htmlFor="title" className="form-label"><FaTag className="me-2" />Goal Title</label>
          <input
            type="text"
            className="form-control"
            id="title"
            value={title}
            onChange={(e) => handleInputChange(setTitle, e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="form-label"><FaAlignLeft className="me-2" />Description</label>
          <textarea
            className="form-control"
            id="description"
            rows={3}
            value={description}
            onChange={(e) => handleInputChange(setDescription, e.target.value)}
            required
          ></textarea>
        </div>
        <div className="mb-3">
          <label htmlFor="durationDays" className="form-label"><FaCalendarAlt className="me-2" />Duration (in days)</label>
          <input
            type="number"
            className="form-control"
            id="durationDays"
            value={durationDays}
            onChange={(e) => handleInputChange(setDurationDays, e.target.value)}
            min="1"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="stakeAmount" className="form-label"><FaDollarSign className="me-2" />Stake Amount ($)</label>
          <input
            type="number"
            className="form-control"
            id="stakeAmount"
            value={stakeAmount}
            onChange={(e) => handleInputChange(setStakeAmount, e.target.value)}
            min="1"
            required
          />
        </div>
        {title && description && durationDays && stakeAmount && !validationError && (
          <Elements stripe={stripePromise} options={{
            mode: 'payment',
            amount: parseFloat(stakeAmount) * 100,
            currency: 'usd',
          } as StripeElementsOptions}>
            <CheckoutForm
              stakeAmount={stakeAmount}
              onCreateGoal={handleCreateGoal}
              setLoading={setLoading}
              setError={setApiError}
              loading={loading}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
