// Copyright 2026 Custom Browser contributors. MIT license.
#ifndef CHROME_COMMON_CUSTOM_BROWSER_SEED_POLICY_H_
#define CHROME_COMMON_CUSTOM_BROWSER_SEED_POLICY_H_
#include <charconv>
#include <cstdint>
#include <optional>
#include <string_view>
namespace custom_browser {
inline std::optional<uint64_t> ParseSeed(std::string_view value) {
  if (value.empty()) return std::nullopt;
  for (char c : value) if (c < '0' || c > '9') return std::nullopt;
  uint64_t seed = 0;
  auto result = std::from_chars(value.data(), value.data()+value.size(), seed);
  if (result.ec != std::errc{} || result.ptr != value.data()+value.size())
    return std::nullopt;
  return seed;
}
}  // namespace custom_browser
#endif  // CHROME_COMMON_CUSTOM_BROWSER_SEED_POLICY_H_
