import { BaseService } from '../../core/base-service.js'
import type { PaginatedList } from '../../core/pagination.js'
import type {
  PaymentDocument,
  PaymentDocumentRemoveResult,
  PaymentDocumentUpdateParams,
  PaymentDocumentUploadParams,
} from './types.js'

export class PaymentDocumentsService extends BaseService {
  upload(
    paymentId: string,
    params: PaymentDocumentUploadParams,
  ): Promise<PaymentDocument> {
    const formData = new FormData()
    formData.append(
      'availableAfterPayment',
      String(params.availableAfterPayment),
    )
    formData.append('type', params.type)
    formData.append('file', params.file)
    return this._requestMultipart({
      method: 'POST',
      path: `/payments/${paymentId}/documents`,
      formData,
    })
  }

  list(paymentId: string): Promise<PaginatedList<PaymentDocument>> {
    return this._list(`/payments/${paymentId}/documents`)
  }

  get(paymentId: string, documentId: string): Promise<PaymentDocument> {
    return this._request({
      method: 'GET',
      path: `/payments/${paymentId}/documents/${documentId}`,
    })
  }

  update(
    paymentId: string,
    documentId: string,
    params: PaymentDocumentUpdateParams,
  ): Promise<PaymentDocument> {
    return this._request({
      method: 'PUT',
      path: `/payments/${paymentId}/documents/${documentId}`,
      body: params,
    })
  }

  remove(
    paymentId: string,
    documentId: string,
  ): Promise<PaymentDocumentRemoveResult> {
    return this._request({
      method: 'DELETE',
      path: `/payments/${paymentId}/documents/${documentId}`,
    })
  }
}
