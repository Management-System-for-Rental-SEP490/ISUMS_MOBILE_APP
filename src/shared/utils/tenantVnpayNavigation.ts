import { CommonActions } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types";

export type VnpayCheckoutAfterSuccess = "home" | "invoiceList";

export function dispatchAfterVnpaySuccess(
  navigation: NavigationProp<RootStackParamList>,
  afterSuccess: VnpayCheckoutAfterSuccess | undefined
): void {
  const mode = afterSuccess ?? "invoiceList";
  if (mode === "home") {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Main" }] }));
    return;
  }
  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [{ name: "Main" }, { name: "TenantInvoiceList" }],
    })
  );
}
