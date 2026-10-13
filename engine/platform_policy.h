// Copyright 2026 Custom Browser contributors. MIT license.
#ifndef THIRD_PARTY_BLINK_PUBLIC_COMMON_USER_AGENT_CUSTOM_BROWSER_PLATFORM_H_
#define THIRD_PARTY_BLINK_PUBLIC_COMMON_USER_AGENT_CUSTOM_BROWSER_PLATFORM_H_
#include <optional>
#include <string_view>
namespace custom_browser {
struct PlatformIdentity {
  std::string_view name;
  std::string_view reduced_ua_os;
  std::string_view navigator_platform;
  std::string_view hint_platform;
  std::string_view hint_platform_version;
};
inline std::optional<PlatformIdentity> LookupPlatform(std::string_view name) {
  if (name == "windows")
    return PlatformIdentity{"windows", "Windows NT 10.0; Win64; x64", "Win32", "Windows", "13.0.0"};
  if (name == "linux")
    return PlatformIdentity{"linux", "X11; Linux x86_64", "Linux x86_64", "Linux", ""};
  if (name == "macos")
    return PlatformIdentity{"macos", "Macintosh; Intel Mac OS X 10_15_7", "MacIntel", "macOS", "15.0.0"};
  return std::nullopt;
}
inline bool IsSupportedPlatform(std::string_view name) {
  return name.empty() || name == "native" || LookupPlatform(name).has_value();
}
inline bool IsPlatformVersion(std::string_view version) {
  if (version.empty() || version.size() > 32) return false;
  unsigned int dots = 0;
  bool digit = false;
  for (char c : version) {
    if (c >= '0' && c <= '9') { digit = true; continue; }
    if (c != '.' || !digit || ++dots > 2) return false;
    digit = false;
  }
  return digit && dots == 2;
}
}  // namespace custom_browser
#endif
