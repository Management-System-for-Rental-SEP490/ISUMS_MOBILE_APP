/**
 * Ref navigation container để sử dụng trong các hooks.
 */

import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "../shared/types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
