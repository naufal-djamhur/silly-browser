// Copyright 2026 Custom Browser contributors. MIT license.
#ifndef CHROME_COMMON_CUSTOM_BROWSER_LOCALE_POLICY_H_
#define CHROME_COMMON_CUSTOM_BROWSER_LOCALE_POLICY_H_
#include <array>
#include <optional>
#include <string>
#include <string_view>
#include "third_party/icu/source/common/unicode/uloc.h"
#include "third_party/icu/source/i18n/unicode/ucal.h"

namespace custom_browser {
inline bool IsEnvironmentIdentifier(std::string_view value) {
  if (value.empty() || value.size() > 128) return false;
  for (const unsigned char c : value)
    if (c <= 32 || c >= 127) return false;
  return true;
}

inline std::optional<std::string> CanonicalLocale(std::string_view value) {
  if (!IsEnvironmentIdentifier(value)) return std::nullopt;
  const std::string input(value);
  std::array<char, ULOC_FULLNAME_CAPACITY> id{};
  std::array<char, ULOC_FULLNAME_CAPACITY> tag{};
  UErrorCode status = U_ZERO_ERROR;
  int32_t parsed = 0;
  const int32_t id_length = uloc_forLanguageTag(input.c_str(), id.data(), static_cast<int32_t>(id.size()),
                     &parsed, &status);
  if (U_FAILURE(status) || id_length <= 0 ||
      id_length >= static_cast<int32_t>(id.size()) ||
      parsed != static_cast<int32_t>(value.size())) return std::nullopt;
  const int32_t tag_length = uloc_toLanguageTag(id.data(), tag.data(), static_cast<int32_t>(tag.size()),
                    true, &status);
  if (U_FAILURE(status) || tag_length <= 0 ||
      tag_length >= static_cast<int32_t>(tag.size())) return std::nullopt;
  return std::string(tag.data(), static_cast<size_t>(tag_length));
}

inline std::optional<std::string> CanonicalTimezone(std::string_view value) {
  if (!IsEnvironmentIdentifier(value)) return std::nullopt;
  std::array<UChar, 129> input{};
  std::array<UChar, 256> canonical{};
  for (size_t i = 0; i < value.size(); ++i) input[i] = value[i];
  UErrorCode status = U_ZERO_ERROR;
  UBool system = false;
  const int32_t length = ucal_getCanonicalTimeZoneID(
      input.data(), static_cast<int32_t>(value.size()), canonical.data(),
      static_cast<int32_t>(canonical.size()), &system, &status);
  if (U_FAILURE(status) || !system || length <= 0) return std::nullopt;
  std::string result;
  result.reserve(length);
  for (int32_t i = 0; i < length; ++i) {
    if (canonical[i] > 127) return std::nullopt;
    result.push_back(static_cast<char>(canonical[i]));
  }
  return result;
}
}  // namespace custom_browser
#endif
