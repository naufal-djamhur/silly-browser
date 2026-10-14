// Copyright 2026 Custom Browser contributors. MIT license.
#ifndef CHROME_COMMON_CUSTOM_BROWSER_WEBRTC_POLICY_H_
#define CHROME_COMMON_CUSTOM_BROWSER_WEBRTC_POLICY_H_

#include <optional>
#include <string_view>

namespace custom_browser {

enum class WebRtcPolicy {
  kNative,
  kDefault,
  kPublicInterfaceOnly,
  kPublicAndPrivateInterfaces,
  kDisableNonProxiedUdp,
};

inline std::optional<WebRtcPolicy> ParseWebRtcPolicy(std::string_view name) {
  if (name == "native") return WebRtcPolicy::kNative;
  if (name == "default") return WebRtcPolicy::kDefault;
  if (name == "default_public_interface_only")
    return WebRtcPolicy::kPublicInterfaceOnly;
  if (name == "default_public_and_private_interfaces")
    return WebRtcPolicy::kPublicAndPrivateInterfaces;
  if (name == "disable_non_proxied_udp")
    return WebRtcPolicy::kDisableNonProxiedUdp;
  return std::nullopt;
}

inline std::string_view ChromiumWebRtcPolicy(WebRtcPolicy policy) {
  switch (policy) {
    case WebRtcPolicy::kNative: return {};
    case WebRtcPolicy::kDefault: return "default";
    case WebRtcPolicy::kPublicInterfaceOnly:
      return "default_public_interface_only";
    case WebRtcPolicy::kPublicAndPrivateInterfaces:
      return "default_public_and_private_interfaces";
    case WebRtcPolicy::kDisableNonProxiedUdp:
      return "disable_non_proxied_udp";
  }
  return {};
}

}  // namespace custom_browser
#endif  // CHROME_COMMON_CUSTOM_BROWSER_WEBRTC_POLICY_H_
