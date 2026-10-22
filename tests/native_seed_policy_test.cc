// Copyright 2026 Custom Browser contributors. MIT license.
#include "chrome/common/custom_browser_seed_policy.h"
#include <cassert>
#include <cstdint>
#include <iostream>
int main() {
  using custom_browser::ParseSeed;
  assert(ParseSeed("0") == 0);
  assert(ParseSeed("00042") == 42);
  assert(ParseSeed("18446744073709551615") == UINT64_MAX);
  for (const auto* value : {"", "-1", "+1", "42x", " 42", "18446744073709551616"})
    assert(!ParseSeed(value));
  std::cout << "Native bounded seed parser checks passed\n";
}
