import {
  IPaymentModuleService,
  CreateAccountHolderDTO,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const createPaymentAccountHolderStepId = "create-payment-account-holder"
/**
 * This step creates the account holder in the payment provider.
 */
export const createPaymentAccountHolderStep = createStep(
  createPaymentAccountHolderStepId,
  async (data: CreateAccountHolderDTO, { container }) => {
    const service = container.resolve<IPaymentModuleService>(Modules.PAYMENT)

    const accountHolder = await service.createAccountHolder(data)

    return new StepResponse(accountHolder, accountHolder)
  },
  async (createdAccountHolder, { container }) => {
    if (!createdAccountHolder) {
      return
    }

    const service = container.resolve<IPaymentModuleService>(Modules.PAYMENT)
    await service.deleteAccountHolder(createdAccountHolder.id)
  }
)
