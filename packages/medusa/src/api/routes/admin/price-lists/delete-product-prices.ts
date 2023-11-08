import { EntityManager } from "typeorm"
import PriceListService from "../../../../services/price-list"
import { FlagRouter } from "@medusajs/utils"
import { Workflows } from "@medusajs/workflows"
import { removePriceListProductPrices } from "@medusajs/workflows/dist/definition/price-list/remove-product-prices"

/**
 * @oas [delete] /admin/price-lists/{id}/products/{product_id}/prices
 * operationId: "DeletePriceListsPriceListProductsProductPrices"
 * summary: "Delete a Product's Prices"
 * description: "Delete all the prices related to a specific product in a price list."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Price List.
 *   - (path) product_id=* {string} The ID of the product from which the prices will be deleted.
 * x-codegen:
 *   method: deleteProductPrices
 * x-codeSamples:
 *   - lang: JavaScript
 *     label: JS Client
 *     source: |
 *       import Medusa from "@medusajs/medusa-js"
 *       const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 })
 *       // must be previously logged in or use api token
 *       medusa.admin.priceLists.deleteProductPrices(priceListId, productId)
 *       .then(({ ids, object, deleted }) => {
 *         console.log(ids.length);
 *       });
 *   - lang: Shell
 *     label: cURL
 *     source: |
 *       curl -X DELETE '{backend_url}/admin/price-lists/{id}/products/{product_id}/prices' \
 *       -H 'x-medusa-access-token: {api_token}'
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
 * tags:
 *   - Price Lists
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminPriceListDeleteProductPricesRes"
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */
export default async (req, res) => {
  const { id, product_id } = req.params

  const priceListService: PriceListService =
    req.scope.resolve("priceListService")

  const featureFlagRouter: FlagRouter = req.scope.resolve("featureFlagRouter")
  const manager: EntityManager = req.scope.resolve("manager")

  const isWorkflowEnabled = featureFlagRouter.isFeatureEnabled({
    workflows: Workflows.RemovePriceListProducts,
  })

  let deletedPriceIds: string[] = []

  if (isWorkflowEnabled) {
    const deletePriceListProductsWorkflow = removePriceListProductPrices(
      req.scope
    )

    const input = {
      productIds: [product_id],
      priceListId: id,
    }

    const { result } = await deletePriceListProductsWorkflow.run({
      input,
      context: {
        manager,
      },
    })
    deletedPriceIds = result
  } else {
    const [deletedIds] = await manager.transaction(
      async (transactionManager) => {
        return await priceListService
          .withTransaction(transactionManager)
          .deleteProductPrices(id, [product_id])
      }
    )
    deletedPriceIds = deletedIds
  }

  return res.json({
    ids: deletedPriceIds,
    object: "money-amount",
    deleted: true,
  })
}
