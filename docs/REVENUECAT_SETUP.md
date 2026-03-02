# RevenueCat Setup for Verbalist

Phase 11 integrates RevenueCat for in-app subscriptions. This guide covers dashboard configuration and deployment.

## 1. RevenueCat Dashboard

### API Key
The app uses the **test** API key: `test_nTgRQDygsLKvSuAGTBMZXWDOEbK`

For production, create a production key in [RevenueCat Dashboard](https://app.revenuecat.com) → Project Settings → API Keys, and update `frontend/src/services/purchases.ts`:

```ts
export const REVENUECAT_API_KEY = "your_production_key";
```

### Entitlement
1. Go to **Project** → **Entitlements**
2. Create entitlement: **Identifier** = `verbalist_pro` (must match `ENTITLEMENT_ID` in code)
3. Attach products to this entitlement

### Products (App Store Connect / Google Play)
Create products with identifiers:
- **Monthly**: `monthly` (or use RevenueCat default `$rc_monthly`)
- **Yearly**: `yearly` (or use RevenueCat default `$rc_annual`)

### Offering
1. Go to **Offerings**
2. Create an offering (e.g. "default")
3. Add packages:
   - **Annual**: map to your yearly product, set package identifier `yearly` or `$rc_annual`
   - **Monthly**: map to your monthly product, set package identifier `monthly` or `$rc_monthly`

## 2. Webhook (Firestore tier sync)

The backend Cloud Function `revenueCatWebhook` syncs subscription status to Firestore `users/{userId}.tier`.

### Deploy the webhook
```bash
cd backend
firebase deploy --only functions
```

### Configure in RevenueCat
1. Go to **Project** → **Integrations** → **Webhooks**
2. Add new webhook:
   - **URL**: `https://us-central1-verbalist-19.cloudfunctions.net/revenueCatWebhook`
     - Replace `verbalist-19` with your Firebase project ID
   - **Events**: INITIAL_PURCHASE, RENEWAL, UNCANCELLATION, EXPIRATION
   - (Optional) **Authorization header**: set a secret for verification

### Events that update tier
- **premium**: INITIAL_PURCHASE, RENEWAL, UNCANCELLATION (when entitlement `verbalist_pro` is in the event)
- **free**: EXPIRATION (when entitlement expires)

## 3. Customer Center

The Customer Center allows subscribers to manage their subscription (cancel, change plan, restore).

1. Go to **Project** → **Customer Center**
2. Configure the layout and actions (Manage subscription, Restore, Support, etc.)
3. The app calls `RevenueCatUI.presentCustomerCenter()` from Settings → Manage Subscription (premium users only)

## 4. Development Builds

**Expo Go** runs RevenueCat in **Preview API Mode** (mocked). Real purchases require a development build:

```bash
cd frontend
npx expo install expo-dev-client
npx eas build --profile development --platform ios
# or
npx eas build --profile development --platform android
```

Run the dev build on a device/simulator to test real purchases (use sandbox test accounts).

## 5. File Reference

| File | Purpose |
|------|---------|
| `frontend/src/services/purchases.ts` | Configure, offerings, purchase, restore, entitlement check |
| `frontend/src/hooks/usePurchases.tsx` | Context provider, syncs tier to Firestore |
| `frontend/src/components/UpgradePrompt.tsx` | Paywall drawer (paywall.dart style) |
| `backend/functions/src/webhooks/revenueCat.ts` | Webhook handler for Firestore tier sync |

## 6. Entitlement Check

Use `usePurchases().isPro` for UI gating. The backend uses Firestore `user.tier` for chat limits; `PurchasesProvider` syncs RevenueCat entitlements to Firestore when `customerInfo` changes.
