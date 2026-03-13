import { BaseService } from '../../core/base-service.js'
import type {
  AccountRegistrationStatusResult,
  CommercialInfoUpdateParams,
  DocumentFile,
  DocumentGroupList,
  SubaccountCommercialInfo,
  SubaccountRemoveResult,
} from './types.js'

interface DocumentSendParams {
  documentFile: string
  type: string
}

export class MyAccountService extends BaseService {
  getRegistrationStatus(): Promise<AccountRegistrationStatusResult> {
    return this._request({
      method: 'GET',
      path: '/myAccount/status/',
    })
  }

  listPendingDocuments(): Promise<DocumentGroupList> {
    return this._request({
      method: 'GET',
      path: '/myAccount/documents',
    })
  }

  sendDocument(
    groupId: string,
    params: DocumentSendParams,
  ): Promise<DocumentGroupList> {
    return this._request({
      method: 'POST',
      path: `/myAccount/documents/${groupId}`,
      body: params,
    })
  }

  getDocumentFile(fileId: string): Promise<DocumentFile> {
    return this._request({
      method: 'GET',
      path: `/myAccount/documents/files/${fileId}`,
    })
  }

  updateDocumentFile(
    fileId: string,
    params: DocumentSendParams,
  ): Promise<DocumentFile> {
    return this._request({
      method: 'POST',
      path: `/myAccount/documents/files/${fileId}`,
      body: params,
    })
  }

  removeDocumentFile(fileId: string): Promise<void> {
    return this._request({
      method: 'DELETE',
      path: `/myAccount/documents/files/${fileId}`,
    })
  }

  getCommercialInfo(): Promise<SubaccountCommercialInfo> {
    return this._request({
      method: 'GET',
      path: '/myAccount/commercialInfo/',
    })
  }

  updateCommercialInfo(
    params: CommercialInfoUpdateParams,
  ): Promise<SubaccountCommercialInfo> {
    return this._request({
      method: 'POST',
      path: '/myAccount/commercialInfo/',
      body: params,
    })
  }

  deleteWhiteLabelSubaccount(
    removeReason?: string,
  ): Promise<SubaccountRemoveResult> {
    return this._request({
      method: 'DELETE',
      path: '/myAccount/',
      query: removeReason ? { removeReason } : undefined,
    })
  }
}
