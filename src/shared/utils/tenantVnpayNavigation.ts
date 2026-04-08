import { CommonActions } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { TenantTicketFromApi } from "../types/api";
import type { RootStackParamList } from "../types";

export type VnpayCheckoutAfterSuccess = "home" | "invoiceList" | "ticketDetail";

export function dispatchAfterVnpaySuccess(
  navigation: NavigationProp<RootStackParamList>,
  afterSuccess: VnpayCheckoutAfterSuccess | undefined,
  ticket?: TenantTicketFromApi
): void {
  const mode = afterSuccess ?? "invoiceList";
  if (mode === "home") {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Main" }] }));
    return;
  }
  if (mode === "ticketDetail" && ticket) {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: "Main" }, { name: "TenantTicketDetail", params: { ticket } }],
      })
    );
    return;
  }
  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [{ name: "Main" }, { name: "TenantInvoiceList" }],
    })
  );
}
