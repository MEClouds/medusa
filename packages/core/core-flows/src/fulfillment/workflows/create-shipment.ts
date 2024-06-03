import { FulfillmentWorkflow } from "@medusajs/types"
import {
  WorkflowData,
  createWorkflow,
  transform,
} from "@medusajs/workflows-sdk"
import { validateShipmentStep } from "../steps"
import { updateFulfillmentWorkflow } from "./update-fulfillment"

export const createShipmentWorkflowId = "create-shipment-workflow"
export const createShipmentWorkflow = createWorkflow(
  createShipmentWorkflowId,
  (
    input: WorkflowData<FulfillmentWorkflow.CreateShipmentWorkflowInput>
  ): WorkflowData<void> => {
    validateShipmentStep(input.id)

    const update = transform({ input }, (data) => ({
      ...data.input,
      shipped_at: new Date(),
    }))

    updateFulfillmentWorkflow.runAsStep({
      input: update,
    })
  }
)
