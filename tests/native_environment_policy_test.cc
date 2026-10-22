// Copyright 2026 Custom Browser contributors. MIT license.
#include "../engine/native_locale_policy.h"
#include <cassert>
#include <fstream>
#include <iostream>
#include <iterator>
#include <vector>
#include "third_party/icu/source/common/unicode/udata.h"

int main(int argc, char** argv) {
  assert(argc == 2);
  std::ifstream input(argv[1], std::ios::binary);
  const std::vector<char> data((std::istreambuf_iterator<char>(input)), {});
  assert(!data.empty());
  UErrorCode status = U_ZERO_ERROR;
  udata_setCommonData(data.data(), &status);
  assert(U_SUCCESS(status));
  using custom_browser::CanonicalLocale;
  using custom_browser::CanonicalTimezone;
  assert(CanonicalLocale("fr-fr") == "fr-FR");
  assert(CanonicalLocale("zh-Hant-TW") == "zh-Hant-TW");
  for (const auto* value : {"", "en_US", "en-US-", "en US", "123", "en-US/../../"})
    assert(!CanonicalLocale(value));
  assert(!CanonicalLocale(std::string_view("en\0US", 5)));
  assert(!CanonicalLocale(std::string(129, 'a')));
  assert(CanonicalTimezone("Europe/Paris") == "Europe/Paris");
  assert(CanonicalTimezone("UTC") == "Etc/UTC");
  for (const auto* value : {"", "Invalid/Zone", " Europe/Paris", "GMT+05:00"})
    assert(!CanonicalTimezone(value));
  assert(!CanonicalTimezone(std::string_view("UTC\0junk", 8)));
  for (const auto [millis, offset] : {std::pair{1768478400000.0, 3600000},
                                    std::pair{1784116800000.0, 7200000}}) {
    const UChar zone[] = u"Europe/Paris";
    status = U_ZERO_ERROR;
    UCalendar* calendar = ucal_open(zone, -1, "fr_FR", UCAL_GREGORIAN, &status);
    assert(U_SUCCESS(status));
    ucal_setMillis(calendar, millis, &status);
    const auto actual = ucal_get(calendar, UCAL_ZONE_OFFSET, &status) +
                        ucal_get(calendar, UCAL_DST_OFFSET, &status);
    assert(U_SUCCESS(status) && actual == offset);
    ucal_close(calendar);
  }
  std::cout << "Native ICU locale, timezone, malformed-input and DST checks passed\n";
}
