#include "../engine/webrtc_policy.h"

#include <array>
#include <cassert>
#include <iostream>

int main() {
  const std::array<std::string_view, 4> policies{
      "default", "default_public_interface_only",
      "default_public_and_private_interfaces", "disable_non_proxied_udp"};
  for (const auto name : policies) {
    const auto policy = custom_browser::ParseWebRtcPolicy(name);
    assert(policy.has_value());
    assert(custom_browser::ChromiumWebRtcPolicy(*policy) == name);
  }
  const auto native = custom_browser::ParseWebRtcPolicy("native");
  assert(native.has_value());
  assert(custom_browser::ChromiumWebRtcPolicy(*native).empty());
  for (const auto name : {"", "disable_all", "proxy_ip=127.0.0.1",
                          "default ", "Default", "native/../../"}) {
    assert(!custom_browser::ParseWebRtcPolicy(name));
  }
  std::cout << "WebRTC native, routing policy and malformed-input checks passed\n";
}
