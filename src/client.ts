import {
  ASAAS_BASE_URLS,
  ASAAS_DEFAULT_ENVIRONMENT,
  ASAAS_DEFAULT_TIMEOUT,
} from './core/constants.js'
import {
  type BinaryResponse,
  request,
  requestBinary,
  type RequestConfig,
} from './core/http.js'
import type { AsaasClientOptions, NormalizedOptions } from './core/types.js'
import {
  AnticipationConfigService,
  AnticipationsService,
} from './services/anticipations/index.js'
import { BillService } from './services/bill/index.js'
import { CardsService } from './services/cards/index.js'
import { ChargebacksService } from './services/chargebacks/index.js'
import {
  CheckoutConfigService,
  CheckoutsService,
} from './services/checkouts/index.js'
import { CustomersService } from './services/customers/index.js'
import { EscrowService } from './services/escrow/index.js'
import { InstallmentsService } from './services/installments/index.js'
import {
  FiscalInfoService,
  InvoicesService,
} from './services/invoices/index.js'
import { NotificationsService } from './services/notifications/index.js'
import { PaymentDocumentsService } from './services/payment-documents/index.js'
import { PaymentLinksService } from './services/payment-links/index.js'
import { PaymentsService } from './services/payments/index.js'
import { PixService } from './services/pix/index.js'
import { SplitsService } from './services/splits/index.js'
import {
  MyAccountService,
  SubaccountsService,
} from './services/subaccounts/index.js'
import { SubscriptionsService } from './services/subscriptions/index.js'
import { TransfersService } from './services/transfers/index.js'

function normalizeOptions(options: AsaasClientOptions): NormalizedOptions {
  const environment = options.environment ?? ASAAS_DEFAULT_ENVIRONMENT
  return {
    accessToken: options.accessToken,
    baseUrl: options.baseUrl ?? ASAAS_BASE_URLS[environment],
    timeout: options.timeout ?? ASAAS_DEFAULT_TIMEOUT,
    fetch: options.fetch ?? globalThis.fetch,
    userAgent: options.userAgent ?? '',
  }
}

export class AsaasClient {
  private readonly _options: NormalizedOptions

  constructor(options: AsaasClientOptions) {
    this._options = normalizeOptions(options)
  }

  private _customers?: CustomersService
  get customers(): CustomersService {
    return (this._customers ??= new CustomersService(this._options))
  }

  private _payments?: PaymentsService
  get payments(): PaymentsService {
    return (this._payments ??= new PaymentsService(this._options))
  }

  private _cards?: CardsService
  get cards(): CardsService {
    return (this._cards ??= new CardsService(this._options))
  }

  private _installments?: InstallmentsService
  get installments(): InstallmentsService {
    return (this._installments ??= new InstallmentsService(this._options))
  }

  private _chargebacks?: ChargebacksService
  get chargebacks(): ChargebacksService {
    return (this._chargebacks ??= new ChargebacksService(this._options))
  }

  private _paymentDocuments?: PaymentDocumentsService
  get paymentDocuments(): PaymentDocumentsService {
    return (this._paymentDocuments ??= new PaymentDocumentsService(
      this._options,
    ))
  }

  private _pix?: PixService
  get pix(): PixService {
    return (this._pix ??= new PixService(this._options))
  }

  private _subscriptions?: SubscriptionsService
  get subscriptions(): SubscriptionsService {
    return (this._subscriptions ??= new SubscriptionsService(this._options))
  }

  private _transfers?: TransfersService
  get transfers(): TransfersService {
    return (this._transfers ??= new TransfersService(this._options))
  }

  private _subaccounts?: SubaccountsService
  get subaccounts(): SubaccountsService {
    return (this._subaccounts ??= new SubaccountsService(this._options))
  }

  private _myAccount?: MyAccountService
  get myAccount(): MyAccountService {
    return (this._myAccount ??= new MyAccountService(this._options))
  }

  private _notifications?: NotificationsService
  get notifications(): NotificationsService {
    return (this._notifications ??= new NotificationsService(this._options))
  }

  private _paymentLinks?: PaymentLinksService
  get paymentLinks(): PaymentLinksService {
    return (this._paymentLinks ??= new PaymentLinksService(this._options))
  }

  private _checkouts?: CheckoutsService
  get checkouts(): CheckoutsService {
    return (this._checkouts ??= new CheckoutsService(this._options))
  }

  private _checkoutConfig?: CheckoutConfigService
  get checkoutConfig(): CheckoutConfigService {
    return (this._checkoutConfig ??= new CheckoutConfigService(this._options))
  }

  private _splits?: SplitsService
  get splits(): SplitsService {
    return (this._splits ??= new SplitsService(this._options))
  }

  private _anticipations?: AnticipationsService
  get anticipations(): AnticipationsService {
    return (this._anticipations ??= new AnticipationsService(this._options))
  }

  private _anticipationConfig?: AnticipationConfigService
  get anticipationConfig(): AnticipationConfigService {
    return (this._anticipationConfig ??= new AnticipationConfigService(
      this._options,
    ))
  }

  private _bill?: BillService
  get bill(): BillService {
    return (this._bill ??= new BillService(this._options))
  }

  private _escrow?: EscrowService
  get escrow(): EscrowService {
    return (this._escrow ??= new EscrowService(this._options))
  }

  private _fiscalInfo?: FiscalInfoService
  get fiscalInfo(): FiscalInfoService {
    return (this._fiscalInfo ??= new FiscalInfoService(this._options))
  }

  private _invoices?: InvoicesService
  get invoices(): InvoicesService {
    return (this._invoices ??= new InvoicesService(this._options))
  }

  request<T>(config: RequestConfig): Promise<T> {
    return request<T>(this._options, config)
  }

  requestBinary(config: RequestConfig): Promise<BinaryResponse> {
    return requestBinary(this._options, config)
  }
}
