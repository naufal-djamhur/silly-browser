// Copyright 2026 Custom Browser contributors. MIT license.
#include "../engine/native_http_proxy_policy.h"

#include <cassert>
#include <iostream>

int main() {
  using custom_browser::DecodeHttpProxyCredential;
  assert(DecodeHttpProxyCredential("fixture-user", true) == "fixture-user");
  assert(DecodeHttpProxyCredential("p%40ss%3A%2B%2F%25%3Dvalue", false) ==
         "p@ss:+/%=value");
  assert(DecodeHttpProxyCredential("%2540", false) == "%40");
  assert(DecodeHttpProxyCredential("+", false) == "+");
  assert(DecodeHttpProxyCredential("", false) == "");
  assert(!DecodeHttpProxyCredential("", true));
  assert(!DecodeHttpProxyCredential("a%3Ab", true));
  for (const auto* value : {"%", "%0", "%GG", "%00", "%0d", "%0A", "%7f",
                            "%ff", "bad\nvalue"}) {
    assert(!DecodeHttpProxyCredential(value, false));
  }
  assert(!DecodeHttpProxyCredential(std::string_view("x\0y", 3), false));
  assert(!DecodeHttpProxyCredential(std::string(4097, 'x'), false));
  const custom_browser::HttpProxyCredentials credentials{
      "http://proxy.test:8080", "fixture-user", "test-password"};
  assert(credentials.CanSupply(true, "http://proxy.test:8080", "basic", true,
                               false));
  assert(!credentials.CanSupply(false, credentials.endpoint, "basic", true,
                                false));
  assert(!credentials.CanSupply(true, "http://other.test:8080", "basic", true,
                                false));
  assert(!credentials.CanSupply(true, "https://proxy.test:8080", "basic", true,
                                false));
  assert(!credentials.CanSupply(true, "http://proxy.test:8081", "basic", true,
                                false));
  assert(!credentials.CanSupply(true, credentials.endpoint, "digest", true,
                                false));
  assert(!credentials.CanSupply(true, credentials.endpoint, "basic", false,
                                false));
  assert(!credentials.CanSupply(true, credentials.endpoint, "basic", true, true));
  std::cout << "Native proxy decoding and authentication scope checks passed\n";
}
