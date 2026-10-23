// Copyright 2026 Custom Browser contributors. MIT license.
#ifndef CHROME_COMMON_CUSTOM_BROWSER_HTTP_PROXY_POLICY_H_
#define CHROME_COMMON_CUSTOM_BROWSER_HTTP_PROXY_POLICY_H_

#include <optional>
#include <string>
#include <string_view>

namespace custom_browser {

// URI userinfo is decoded exactly once. Basic authentication cannot represent a
// colon in the username. This first version intentionally accepts ASCII only.
inline std::optional<std::string> DecodeHttpProxyCredential(
    std::string_view encoded, bool username) {
  if (encoded.size() > 4096) {
    return std::nullopt;
  }
  const auto hex = [](char c) -> int {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return c - 'a' + 10;
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    return -1;
  };
  std::string decoded;
  for (size_t i = 0; i < encoded.size(); ++i) {
    unsigned char c = static_cast<unsigned char>(encoded[i]);
    if (c == '%') {
      if (i + 2 >= encoded.size()) return std::nullopt;
      const int high = hex(encoded[i + 1]);
      const int low = hex(encoded[i + 2]);
      if (high < 0 || low < 0) return std::nullopt;
      c = static_cast<unsigned char>((high << 4) | low);
      i += 2;
    }
    if (c < 0x20 || c > 0x7e || (username && c == ':')) {
      return std::nullopt;
    }
    decoded.push_back(static_cast<char>(c));
  }
  if (username && decoded.empty()) return std::nullopt;
  return decoded;
}

struct HttpProxyCredentials {
  // Canonical url::SchemeHostPort serialization, including the proxy transport.
  std::string endpoint;
  std::string username;
  std::string password;

  bool MatchesChallenge(bool is_proxy, std::string_view challenger,
                        bool managed_proxy) const {
    return is_proxy && !managed_proxy && challenger == endpoint;
  }

  bool CanSupply(bool is_proxy, std::string_view challenger,
                 std::string_view auth_scheme, bool first_attempt,
                 bool managed_proxy) const {
    return MatchesChallenge(is_proxy, challenger, managed_proxy) &&
           first_attempt && auth_scheme == "basic";
  }
};

}  // namespace custom_browser
#endif  // CHROME_COMMON_CUSTOM_BROWSER_HTTP_PROXY_POLICY_H_
